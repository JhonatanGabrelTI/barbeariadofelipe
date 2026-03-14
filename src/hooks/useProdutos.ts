import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Produto {
    id: string
    nome: string
    descricao: string | null
    preco: number
    estoque: number
    categoria: string
    ativo: boolean
    created_at: string
    updated_at: string
}

export function useProdutos() {
    const queryClient = useQueryClient()

    const { data: produtos = [], isLoading } = useQuery({
        queryKey: ['produtos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('categoria', { ascending: true })
                .order('nome', { ascending: true })
            if (error) throw error
            return data as Produto[]
        },
    })

    const createProduto = useMutation({
        mutationFn: async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('produtos')
                .insert(produto)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
    })

    const updateProduto = useMutation({
        mutationFn: async ({ id, ...updates }: Partial<Produto> & { id: string }) => {
            const { data, error } = await supabase
                .from('produtos')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
    })

    const deleteProduto = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('produtos')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['produtos'] }),
    })

    return { produtos, isLoading, createProduto, updateProduto, deleteProduto }
}
