import { useState, useMemo, useCallback } from 'react'
import { useBlockedSlots } from '@/hooks/useBlockedSlots'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format, startOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Lock, Unlock, Clock, CalendarOff, Ban } from 'lucide-react'

const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30',
]

export function ControleHorarios() {
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [showBlockDialog, setShowBlockDialog] = useState(false)
    const [horaInicio, setHoraInicio] = useState('')
    const [horaFim, setHoraFim] = useState('')
    const [motivo, setMotivo] = useState('Pausa')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
    const { blockedSlots, isLoading, createBlock, deleteBlock } = useBlockedSlots(dateStr)

    // Get all blocked slots (no date filter) for calendar indicators
    const { blockedSlots: allBlocked } = useBlockedSlots()

    const today = startOfDay(new Date())
    const maxDate = addDays(today, 60)

    const blockedDates = useMemo(() => {
        const dates = new Set<string>()
        allBlocked.forEach(s => dates.add(s.data))
        return dates
    }, [allBlocked])

    const handleBlockSingle = useCallback(async (time: string) => {
        if (!dateStr) return
        setIsSubmitting(true)
        try {
            // Calculate end time (30 min later)
            const [h, m] = time.split(':').map(Number)
            const endMinutes = h * 60 + m + 30
            const endH = String(Math.floor(endMinutes / 60)).padStart(2, '0')
            const endM = String(endMinutes % 60).padStart(2, '0')

            await createBlock.mutateAsync({
                data: dateStr,
                hora_inicio: time,
                hora_fim: `${endH}:${endM}`,
                motivo: 'Pausa',
            })
            toast.success(`✅ Horário ${time} bloqueado!`)
        } catch {
            toast.error('❌ Erro ao bloquear horário.')
        } finally {
            setIsSubmitting(false)
        }
    }, [dateStr, createBlock])

    const handleBlockRange = useCallback(async () => {
        if (!dateStr || !horaInicio || !horaFim) return
        if (horaInicio >= horaFim) {
            toast.error('O horário de início deve ser antes do fim.')
            return
        }
        setIsSubmitting(true)
        try {
            await createBlock.mutateAsync({
                data: dateStr,
                hora_inicio: horaInicio,
                hora_fim: horaFim,
                motivo: motivo || 'Pausa',
            })
            toast.success(`✅ Horários de ${horaInicio} às ${horaFim} bloqueados!`)
            setShowBlockDialog(false)
            setHoraInicio('')
            setHoraFim('')
            setMotivo('Pausa')
        } catch {
            toast.error('❌ Erro ao bloquear horários.')
        } finally {
            setIsSubmitting(false)
        }
    }, [dateStr, horaInicio, horaFim, motivo, createBlock])

    const handleUnblock = useCallback(async (id: string) => {
        try {
            await deleteBlock.mutateAsync(id)
            toast.success('✅ Horário desbloqueado!')
        } catch {
            toast.error('❌ Erro ao desbloquear.')
        }
    }, [deleteBlock])

    const isSlotBlocked = (time: string) => {
        return blockedSlots.some(slot => time >= slot.hora_inicio && time < slot.hora_fim)
    }

    const getBlockForSlot = (time: string) => {
        return blockedSlots.find(slot => time >= slot.hora_inicio && time < slot.hora_fim)
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Controle de Horários</h2>
                    <p className="text-sm text-gray-500">Bloqueie horários para pausas, almoço ou folgas.</p>
                </div>
                {selectedDate && (
                    <Button
                        onClick={() => setShowBlockDialog(true)}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-10 px-5 transition-all duration-300 hover:scale-[1.02] shadow-md"
                    >
                        <Lock className="w-4 h-4 mr-2" />
                        Bloquear Intervalo
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < today || date > maxDate || date.getDay() === 0}
                        locale={ptBR}
                        className="mx-auto"
                        modifiers={{
                            blocked: (date) => blockedDates.has(format(date, 'yyyy-MM-dd')),
                        }}
                        modifiersClassNames={{
                            blocked: 'bg-red-50 text-red-500 font-bold',
                        }}
                    />
                    <div className="flex items-center gap-4 justify-center mt-4 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
                            <span>Dia com bloqueios</span>
                        </div>
                    </div>
                </div>

                {/* Time Slots */}
                <div>
                    {!selectedDate ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-16">
                            <CalendarOff className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-gray-400 text-lg font-medium">Selecione uma data</p>
                            <p className="text-gray-300 text-sm">Escolha um dia para gerenciar os horários</p>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 rounded-xl" />
                            ))}
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 mb-3">
                                Horários de {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {allTimeSlots.map((time) => {
                                    const blocked = isSlotBlocked(time)
                                    const block = getBlockForSlot(time)

                                    return (
                                        <div key={time} className="relative">
                                            {blocked ? (
                                                <button
                                                    onClick={() => block && handleUnblock(block.id)}
                                                    disabled={deleteBlock.isPending}
                                                    className="w-full h-14 rounded-xl border-2 border-red-200 bg-red-50 flex flex-col items-center justify-center transition-all duration-200 hover:bg-red-100 hover:scale-[1.02] group"
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <Ban className="w-3.5 h-3.5 text-red-400" />
                                                        <span className="text-sm font-bold text-red-400">{time}</span>
                                                    </div>
                                                    <span className="text-[10px] text-red-300 group-hover:hidden">{block?.motivo || 'Bloqueado'}</span>
                                                    <span className="text-[10px] text-red-500 hidden group-hover:block font-medium">
                                                        <Unlock className="w-3 h-3 inline mr-0.5" />
                                                        Desbloquear
                                                    </span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleBlockSingle(time)}
                                                    disabled={isSubmitting}
                                                    className="w-full h-14 rounded-xl border-2 border-gray-100 bg-white flex flex-col items-center justify-center transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:scale-[1.02] group"
                                                >
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400" />
                                                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-400">{time}</span>
                                                    </div>
                                                    <span className="text-[10px] text-gray-300 group-hover:hidden">Disponível</span>
                                                    <span className="text-[10px] text-red-400 hidden group-hover:block font-medium">
                                                        <Lock className="w-3 h-3 inline mr-0.5" />
                                                        Bloquear
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Active blocks for the day */}
                            {blockedSlots.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                                        Bloqueios ativos ({blockedSlots.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {blockedSlots.map((slot) => (
                                            <div
                                                key={slot.id}
                                                className="flex items-center justify-between bg-red-50 rounded-xl p-3 border border-red-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                        <Lock className="w-4 h-4 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {slot.hora_inicio} — {slot.hora_fim}
                                                        </p>
                                                        <p className="text-xs text-red-400">{slot.motivo}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleUnblock(slot.id)}
                                                    disabled={deleteBlock.isPending}
                                                    className="rounded-lg text-xs h-8 text-red-500 border-red-200 hover:bg-red-100"
                                                >
                                                    <Unlock className="w-3.5 h-3.5 mr-1" />
                                                    Desbloquear
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Block Range Dialog */}
            <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Lock className="w-5 h-5 text-red-500" />
                            Bloquear Intervalo
                        </DialogTitle>
                        <DialogDescription>
                            Bloqueie um intervalo de horário em {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Início</label>
                                <select
                                    value={horaInicio}
                                    onChange={(e) => setHoraInicio(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Selecione</option>
                                    {allTimeSlots.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Fim</label>
                                <select
                                    value={horaFim}
                                    onChange={(e) => setHoraFim(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="">Selecione</option>
                                    {allTimeSlots.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                    <option value="20:00">20:00</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Motivo (opcional)</label>
                            <Input
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                                placeholder="Ex: Almoço, Consulta médica..."
                                className="h-11 rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3">
                        <Button variant="ghost" onClick={() => setShowBlockDialog(false)} className="flex-1 rounded-xl">
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleBlockRange}
                            disabled={!horaInicio || !horaFim || isSubmitting}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-300"
                        >
                            {isSubmitting ? 'Bloqueando...' : 'Bloquear'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
