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

            const startOfDay = `${date}T00:00:00.000Z`
            const endOfDay = `${date}T23:59:59.999Z`

            const { data, error } = await supabase
                .from('agendamentos')
                .select('data_hora, servico, status, duracao_minutos')
                .gte('data_hora', startOfDay)
                .lte('data_hora', endOfDay)
                .neq('status', 'cancelado')

            if (error) throw error
            return data as Partial<Agendamento>[]
        },
        enabled: !!date,
        staleTime: 1000 * 10, // 10 seconds (was 1 min) — Realtime handles instant updates
        refetchInterval: 1000 * 30, // Also poll every 30s as fallback
    })
}
