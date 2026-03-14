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
        staleTime: 1000 * 60 * 2, // 2 minutes
    })

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
