import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Agendamento } from '@/lib/supabase'

export function useAgendamentosPublic(date?: string) {
    return useQuery({
        queryKey: ['agendamentos-public', date],
        queryFn: async () => {
            if (!date) return []

            // Get all appointments for the specific day to check availability
            // We start by getting the beginning and end of that day in ISO format
            const startOfDay = `${date}T00:00:00.000Z`
            const endOfDay = `${date}T23:59:59.999Z`

            const { data, error } = await supabase
                .from('agendamentos')
                .select('data_hora, servico, status')
                .gte('data_hora', startOfDay)
                .lte('data_hora', endOfDay)
                .neq('status', 'cancelado') // Don't block slots from cancelled bookings

            if (error) throw error
            return data as Partial<Agendamento>[]
        },
        enabled: !!date,
        staleTime: 1000 * 60, // 1 minute
    })
}
