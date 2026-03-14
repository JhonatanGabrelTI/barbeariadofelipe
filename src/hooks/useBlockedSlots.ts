import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type BlockedSlot = {
    id: string
    data: string
    hora_inicio: string
    hora_fim: string
    motivo: string
    created_at: string
}

export function useBlockedSlots(date?: string) {
    const queryClient = useQueryClient()

    const { data: blockedSlots = [], isLoading } = useQuery({
        queryKey: ['blocked-slots', date],
        queryFn: async () => {
            let query = supabase.from('blocked_slots').select('*').order('data', { ascending: true })

            if (date) {
                query = query.eq('data', date)
            }

            const { data, error } = await query
            if (error) throw error
            return (data || []) as BlockedSlot[]
        },
    })

    const createBlock = useMutation({
        mutationFn: async (block: {
            data: string
            hora_inicio: string
            hora_fim: string
            motivo?: string
        }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { error } = await supabase.from('blocked_slots').insert({
                ...block,
                created_by: user.id,
            })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-slots'] })
        },
    })

    const deleteBlock = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('blocked_slots').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['blocked-slots'] })
        },
    })

    // Helper: check if a specific time is blocked on a given date
    const isTimeBlocked = (time: string): boolean => {
        return blockedSlots.some(slot => {
            return time >= slot.hora_inicio && time < slot.hora_fim
        })
    }

    return { blockedSlots, isLoading, createBlock, deleteBlock, isTimeBlocked }
}
