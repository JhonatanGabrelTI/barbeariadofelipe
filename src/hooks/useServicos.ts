import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Servico = {
    id: string
    nome: string
    preco: number
    duracao_minutos: number
    popular: boolean
    ativo: boolean
    ordem: number
}

export function useServicos() {
    const queryClient = useQueryClient()

    const { data: servicos = [], isLoading } = useQuery({
        queryKey: ['servicos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('servicos')
                .select('*')
                .eq('ativo', true)
                .order('ordem', { ascending: true })
            if (error) throw error
            return (data || []) as Servico[]
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const { data: allServicos = [], isLoading: isLoadingAll } = useQuery({
        queryKey: ['servicos-all'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('servicos')
                .select('*')
                .order('ordem', { ascending: true })
            if (error) throw error
            return (data || []) as Servico[]
        },
        staleTime: 1000 * 60 * 5,
    })

    const updateServico = useMutation({
        mutationFn: async (servico: Partial<Servico> & { id: string }) => {
            const { id, ...updates } = servico
            const { error } = await supabase
                .from('servicos')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicos'] })
            queryClient.invalidateQueries({ queryKey: ['servicos-all'] })
        },
    })

    const createServico = useMutation({
        mutationFn: async (servico: Omit<Servico, 'id'>) => {
            const { error } = await supabase
                .from('servicos')
                .insert(servico)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicos'] })
            queryClient.invalidateQueries({ queryKey: ['servicos-all'] })
        },
    })

    const deleteServico = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('servicos')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['servicos'] })
            queryClient.invalidateQueries({ queryKey: ['servicos-all'] })
        },
    })

    // Helper: build servicePrices map from dynamic data
    const servicePrices: Record<string, number> = {}
    const serviceDurations: Record<string, number> = {}
    servicos.forEach(s => {
        servicePrices[s.nome] = s.preco
        serviceDurations[s.nome] = s.duracao_minutos
    })

    return {
        servicos,
        allServicos,
        isLoading,
        isLoadingAll,
        updateServico,
        createServico,
        deleteServico,
        servicePrices,
        serviceDurations,
    }
}
