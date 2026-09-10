import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export type StaffRole = 'dono' | 'barbeiro'

export type StaffMember = {
    id: string
    nome: string
    email: string | null
    foto_url: string | null
    user_id: string | null
    role: StaffRole
    ativo: boolean
}

function isMissingBarbeirosTable(code?: string) {
    return code === 'PGRST205' || code === '42P01'
}

export function useAdmin() {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    const staffQuery = useQuery({
        queryKey: ['staff-check', user?.id, user?.email],
        queryFn: async () => {
            if (!user) return null

            const byUser = await supabase
                .from('barbeiros')
                .select('*')
                .eq('user_id', user.id)
                .eq('ativo', true)
                .maybeSingle()

            if (byUser.error) {
                if (!isMissingBarbeirosTable(byUser.error.code)) throw byUser.error
                if (!user.email) return null

                const legacyAdmin = await supabase
                    .from('admin_emails')
                    .select('email')
                    .eq('email', user.email)
                    .maybeSingle()

                if (legacyAdmin.error) throw legacyAdmin.error
                return legacyAdmin.data ? {
                    id: '00000000-0000-4000-8000-000000000001',
                    nome: 'Felipe',
                    email: user.email,
                    foto_url: '/barbeiros/felipe.png',
                    user_id: user.id,
                    role: 'dono' as const,
                    ativo: true,
                } : null
            }
            if (byUser.data) return byUser.data as StaffMember
            if (!user.email) return null

            const byEmail = await supabase
                .from('barbeiros')
                .select('*')
                .ilike('email', user.email)
                .eq('ativo', true)
                .maybeSingle()

            if (byEmail.error) throw byEmail.error
            return (byEmail.data as StaffMember | null) ?? null
        },
        enabled: !!user,
    })

    const currentStaff = staffQuery.data ?? null
    const isAdmin = !!currentStaff
    const isOwner = currentStaff?.role === 'dono'

    const { data: staffMembers = [] } = useQuery({
        queryKey: ['barbeiros-ativos'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('barbeiros')
                .select('*')
                .eq('ativo', true)
                .order('role', { ascending: false })
            if (error) {
                if (isMissingBarbeirosTable(error.code) && currentStaff) return [currentStaff]
                throw error
            }
            return (data || []) as StaffMember[]
        },
        enabled: isAdmin,
    })

    const { data: allAgendamentos = [], isLoading } = useQuery({
        queryKey: ['all-agendamentos', currentStaff?.id, isOwner],
        queryFn: async () => {
            let query = supabase
                .from('agendamentos')
                .select('*')
                .order('data_hora', { ascending: true })

            if (!isOwner && currentStaff) query = query.eq('barbeiro_id', currentStaff.id)

            const { data, error } = await query
            if (error) throw error
            return data || []
        },
        enabled: isAdmin,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 30,
    })

    useEffect(() => {
        if (!isAdmin) return

        const channel = supabase
            .channel(`staff-agendamentos-${currentStaff?.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agendamentos' },
                () => queryClient.invalidateQueries({ queryKey: ['all-agendamentos'] })
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [isAdmin, currentStaff?.id, queryClient])

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const { error } = await supabase.from('agendamentos').update({ status }).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all-agendamentos'] }),
    })

    return {
        isAdmin,
        isOwner,
        isCheckingAdmin: staffQuery.isLoading,
        currentStaff,
        staffMembers,
        allAgendamentos,
        isLoading,
        updateStatus,
    }
}
