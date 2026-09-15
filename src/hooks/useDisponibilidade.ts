import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type HorarioDisponivel = {
    horario: string
    disponivel: boolean
    motivo: 'passado' | 'sem_tempo' | 'bloqueado' | 'ocupado' | 'fechado' | 'servico_indisponivel' | 'profissional_indisponivel' | null
}

export function useDisponibilidade(date?: string, servico?: string, barbeiroId?: string | null) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!date || !barbeiroId) return

        const invalidate = () => queryClient.invalidateQueries({
            queryKey: ['disponibilidade', date, servico, barbeiroId],
        })
        const appointments = supabase
            .channel(`availability-appointments-${date}-${barbeiroId}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'agendamentos',
                filter: `barbeiro_id=eq.${barbeiroId}`,
            }, invalidate)
            .subscribe()
        const blocks = supabase
            .channel(`availability-blocks-${date}-${barbeiroId}`)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'blocked_slots',
                filter: `barbeiro_id=eq.${barbeiroId}`,
            }, invalidate)
            .subscribe()

        return () => {
            supabase.removeChannel(appointments)
            supabase.removeChannel(blocks)
        }
    }, [barbeiroId, date, queryClient, servico])

    return useQuery({
        queryKey: ['disponibilidade', date, servico, barbeiroId],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('listar_disponibilidade_publica', {
                p_data: date,
                p_servico: servico,
                p_barbeiro_id: barbeiroId,
            })
            if (error) {
                if (error.code === 'PGRST202' || error.code === '42883') return null
                throw error
            }
            return (data || []) as HorarioDisponivel[]
        },
        enabled: !!date && !!servico && !!barbeiroId,
        staleTime: 0,
        refetchInterval: 1000 * 5,
        refetchIntervalInBackground: true,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
    })
}
