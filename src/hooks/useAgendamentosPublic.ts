import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Agendamento } from '@/lib/supabase'
import { addDaysToDateKey, barbershopDateTimeToDate } from '@/lib/time'

export function useAgendamentosPublic(date?: string, barbeiroId?: string | null, multiBarberEnabled = true) {
    const queryClient = useQueryClient()

    // Subscribe to Realtime changes on the agendamentos table
    useEffect(() => {
        if (!date) return

        const channel = supabase
            .channel(`agendamentos-realtime-${date}-${barbeiroId || 'todos'}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'agendamentos',
                },
                () => {
                    // Instantly refetch when ANY change happens
                    queryClient.invalidateQueries({ queryKey: ['agendamentos-public', date, barbeiroId] })
                    queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [date, barbeiroId, queryClient])

    return useQuery({
        queryKey: ['agendamentos-public', date, barbeiroId, multiBarberEnabled],
        queryFn: async () => {
            if (!date) return []

            // Consulta exatamente o dia da barbearia, independentemente do fuso
            // configurado no aparelho de quem esta agendando.
            const startStr = barbershopDateTimeToDate(date, '00:00').toISOString()
            const nextDay = barbershopDateTimeToDate(addDaysToDateKey(date, 1), '00:00')
            const endStr = new Date(nextDay.getTime() - 1).toISOString()

            if (multiBarberEnabled && barbeiroId) {
                const result = await supabase.rpc('listar_agendamentos_publicos', {
                    p_inicio: startStr,
                    p_fim: endStr,
                    p_barbeiro_id: barbeiroId,
                })
                if (!result.error) {
                    return Array.isArray(result.data) ? result.data as Partial<Agendamento>[] : []
                }
                if (result.error.code !== 'PGRST202' && result.error.code !== '42883') throw result.error
            }

            // Compatibilidade com o banco antigo até a migração completa ser aplicada.
            const { data, error } = await supabase
                .from('agendamentos')
                .select('data_hora, servico, status, duracao_minutos')
                .gte('data_hora', startStr)
                .lte('data_hora', endStr)
                .neq('status', 'cancelado')

            if (error) throw error
            return data as Partial<Agendamento>[]
        },
        enabled: !!date && !!barbeiroId,
        staleTime: 0,                   // Always consider data stale — never serve from cache
        refetchInterval: 1000 * 5,
        refetchIntervalInBackground: true,
        refetchOnReconnect: 'always',
        refetchOnWindowFocus: true,     // Refetch when user returns to tab
        refetchOnMount: 'always',       // Always refetch when component mounts
    })
}
