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
            barbeiro_id: string
        }) => {
            const payload = {
                p_user_id: user?.id || null,
                p_nome_cliente: data.nome_cliente || user?.user_metadata?.full_name || null,
                p_whatsapp: data.whatsapp,
                p_servico: data.servico,
                p_data_hora: data.data_hora,
                p_duracao_minutos: data.duracao_minutos || 30,
                p_barbeiro_id: data.barbeiro_id,
            }

            let { data: result, error } = await supabase.rpc('agendar_horario_com_barbeiro', payload)

            // Mantém o agendamento de Felipe funcionando até a migração de múltiplos barbeiros ser aplicada.
            if (error && (error.code === 'PGRST202' || error.code === '42883')) {
                const legacyPayload = {
                    p_user_id: payload.p_user_id,
                    p_nome_cliente: payload.p_nome_cliente,
                    p_whatsapp: payload.p_whatsapp,
                    p_servico: payload.p_servico,
                    p_data_hora: payload.p_data_hora,
                    p_duracao_minutos: payload.p_duracao_minutos,
                }
                const legacy = await supabase.rpc('agendar_horario_seguro', legacyPayload)
                result = legacy.data
                error = legacy.error
            }

            if (error) throw error

            if (result && !result.success) {
                throw new Error(result.message || 'Horário indisponível.')
            }

            return result.data as Agendamento
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
