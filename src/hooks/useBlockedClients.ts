import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type BlockedClient = {
    id: string
    whatsapp: string
    nome: string | null
    motivo: string | null
    created_at: string
}

export function useBlockedClients() {
    const queryClient = useQueryClient()

    const { data: blockedClients = [], isLoading, error } = useQuery({
        queryKey: ['blocked-clients'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('blocked_clients')
                .select('*')
                .order('created_at', { ascending: false })
            
            if (error) throw error
            return (data || []) as BlockedClient[]
        },
        staleTime: 1000 * 30, // 30 seconds
    })

    const blockClient = useMutation({
        mutationFn: async (client: {
            whatsapp: string
            nome?: string
            motivo?: string
        }) => {
            // Clean up WhatsApp number (remove non-digits, e.g. +55 (43) 99864-8935 -> 43998648935 or similar)
            const cleanWhatsapp = client.whatsapp.replace(/\D/g, '')
            
            const { data, error } = await supabase
                .from('blocked_clients')
                .insert({
                    whatsapp: cleanWhatsapp,
                    nome: client.nome || null,
                    motivo: client.motivo || null,
                })
                .select()
                .single()

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Este número de WhatsApp já está bloqueado.')
                }
                throw error
            }
            return data as BlockedClient
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-clients'] })
        },
    })

    const unblockClient = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('blocked_clients')
                .delete()
                .eq('id', id)

            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-clients'] })
        },
    })

    return {
        blockedClients,
        isLoading,
        error,
        blockClient,
        unblockClient,
    }
}
