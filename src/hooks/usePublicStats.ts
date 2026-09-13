import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type PublicStats = {
    total_agendamentos: number
}

export function usePublicStats() {
    return useQuery({
        queryKey: ['public-stats'],
        queryFn: async (): Promise<PublicStats> => {
            const { data, error } = await supabase.rpc('obter_estatisticas_publicas')
            if (error) throw error

            const row = Array.isArray(data) ? data[0] : data
            return {
                total_agendamentos: Number(row?.total_agendamentos || 0),
            }
        },
        staleTime: 1000 * 25,
        refetchInterval: 1000 * 30,
        refetchIntervalInBackground: true,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
    })
}
