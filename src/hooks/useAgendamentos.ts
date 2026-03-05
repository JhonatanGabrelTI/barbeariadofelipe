import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Agendamento } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useAgendamentos() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const agendamentosQuery = useQuery({
        queryKey: ['agendamentos', user?.id],
        queryFn: async () => {
            if (!user) return []
            const { data, error } = await supabase
                .from('agendamentos')
                .select('*')
                .eq('user_id', user.id)
                .order('data_hora', { ascending: true })
            if (error) throw error
            return data as Agendamento[]
        },
        enabled: !!user,
        staleTime: 1000 * 30, // 30 seconds (was 5 min)
    })

    const createAgendamento = useMutation({
        mutationFn: async (data: {
            whatsapp: string
            servico: string
            data_hora: string
            nome_cliente?: string
            duracao_minutos?: number
        }) => {
            const { data: result, error } = await supabase
                .from('agendamentos')
                .insert({
                    user_id: user?.id || null,
                    nome_cliente: data.nome_cliente || user?.user_metadata?.full_name || null,
                    whatsapp: data.whatsapp,
                    servico: data.servico,
                    data_hora: data.data_hora,
                    duracao_minutos: data.duracao_minutos || 30,
                    status: 'confirmado',
                })
                .select()
                .single()
            if (error) throw error
            return result as Agendamento
        },
        onSuccess: () => {
            // Invalidate ALL related queries immediately
            queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
            queryClient.invalidateQueries({ queryKey: ['agendamentos-public'] })
        },
    })

    const cancelAgendamento = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('agendamentos')
                .update({ status: 'cancelado' })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agendamentos'] })
            queryClient.invalidateQueries({ queryKey: ['agendamentos-public'] })
        },
    })

    return {
        agendamentos: agendamentosQuery.data ?? [],
        isLoading: agendamentosQuery.isLoading,
        error: agendamentosQuery.error,
        createAgendamento,
        cancelAgendamento,
    }
}
