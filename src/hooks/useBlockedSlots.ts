import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { isTimeInRange, timeRangesOverlap } from '@/lib/time'

export type BlockedSlot = {
    id: string
    data: string
    hora_inicio: string
    hora_fim: string
    motivo: string
    barbeiro_id: string
    created_at: string
}

export function useBlockedSlots(date?: string, barbeiroId?: string | null, multiBarberEnabled = true) {
    const queryClient = useQueryClient()

    const { data: blockedSlots = [], isLoading } = useQuery({
        queryKey: ['blocked-slots', date, barbeiroId, multiBarberEnabled],
        queryFn: async () => {
            const selectedFields: string = multiBarberEnabled
                ? 'id,data,hora_inicio,hora_fim,motivo,barbeiro_id,created_at'
                : 'id,data,hora_inicio,hora_fim,motivo,created_at'
            let query = supabase
                .from('blocked_slots')
                .select(selectedFields)
                .order('data', { ascending: true })

            if (date) {
                query = query.eq('data', date)
            }
            if (multiBarberEnabled && barbeiroId) {
                query = query.eq('barbeiro_id', barbeiroId)
            }

            const { data, error } = await query
            if (error) throw error
            return (data || []) as unknown as BlockedSlot[]
        },
        enabled: !!barbeiroId,
    })

    const createBlock = useMutation({
        mutationFn: async (block: {
            data: string
            hora_inicio: string
            hora_fim: string
            motivo?: string
            barbeiro_id?: string
        }) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const { data: result, error } = await supabase.rpc('criar_bloqueio_horario', {
                p_data: block.data,
                p_hora_inicio: block.hora_inicio,
                p_hora_fim: block.hora_fim,
                p_motivo: block.motivo || 'Pausa',
                p_barbeiro_id: block.barbeiro_id,
            })

            if (error) throw error
            if (result && !result.success) {
                throw new Error(result.message || 'Não foi possível bloquear esse horário.')
            }
            return result.data as BlockedSlot
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
        return blockedSlots.some(slot => isTimeInRange(time, slot.hora_inicio, slot.hora_fim))
    }

    const isIntervalBlocked = (start: string, end: string): boolean =>
        blockedSlots.some(slot => timeRangesOverlap(start, end, slot.hora_inicio, slot.hora_fim))

    return { blockedSlots, isLoading, createBlock, deleteBlock, isTimeBlocked, isIntervalBlocked }
}
