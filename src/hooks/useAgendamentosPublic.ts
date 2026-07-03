import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Agendamento } from '@/lib/supabase'

export function useAgendamentosPublic(date?: string) {
    const queryClient = useQueryClient()

    // Subscribe to Realtime changes on the agendamentos table
    useEffect(() => {
        if (!date) return

        const channel = supabase
            .channel(`agendamentos-realtime-${date}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'agendamentos',
                },
                () => {
                    // Instantly refetch when ANY change happens
                    queryClient.invalidateQueries({ queryKey: ['agendamentos-public', date] })
                    queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [date, queryClient])

    return useQuery({
        queryKey: ['agendamentos-public', date],
        queryFn: async () => {
            if (!date) return []

            // Query a wider window (3 days) to guarantee that timezone differences 
            // between UTC and local time never clip valid appointments at the edges of the day.
            const d = new Date(date)
            const prev = new Date(d)
            prev.setDate(prev.getDate() - 1)
            const next = new Date(d)
            next.setDate(next.getDate() + 1)

            const startStr = `${prev.toISOString().split('T')[0]}T00:00:00.000Z`
            const endStr = `${next.toISOString().split('T')[0]}T23:59:59.999Z`

            const { data, error } = await supabase
                .from('agendamentos')
                .select('data_hora, servico, status, duracao_minutos')
                .gte('data_hora', startStr)
                .lte('data_hora', endStr)
                .neq('status', 'cancelado')

            if (error) throw error
            return data as Partial<Agendamento>[]
        },
        enabled: !!date,
        staleTime: 0,                   // Always consider data stale — never serve from cache
        refetchInterval: 1000 * 5,      // Poll every 5 seconds as fallback (was 10s)
        refetchOnWindowFocus: true,     // Refetch when user returns to tab
        refetchOnMount: 'always',       // Always refetch when component mounts
    })
}
