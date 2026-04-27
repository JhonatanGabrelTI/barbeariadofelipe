import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useAdmin() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const { data: isAdmin = false, isLoading: isCheckingAdmin } = useQuery({
        queryKey: ['admin-check', user?.email],
        queryFn: async () => {
            if (!user?.email) return false
            const { data } = await supabase
                .from('admin_emails')
                .select('email')
                .eq('email', user.email)
                .single()
            return !!data
        },
        enabled: !!user?.email,
    })

    const { data: allAgendamentos = [], isLoading } = useQuery({
        queryKey: ['all-agendamentos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('agendamentos')
                .select('*')
                .order('data_hora', { ascending: true })
            if (error) throw error
            return data || []
        },
        enabled: isAdmin,
        staleTime: 1000 * 30, // 30 seconds
        refetchInterval: 1000 * 30, // Auto-update every 30 seconds
    })

    // Realtime subscription
    useEffect(() => {
        if (!isAdmin) return

        const channel = supabase
            .channel('admin-agendamentos-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agendamentos'
                },
                () => {
                    // Invalidate and refetch immediately when any change occurs
                    queryClient.invalidateQueries({ queryKey: ['all-agendamentos'] })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isAdmin, queryClient])

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase
                .from('agendamentos')
                .update({ status })
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-agendamentos'] })
        },
    })

    return { isAdmin, isCheckingAdmin, allAgendamentos, isLoading, updateStatus }
}
