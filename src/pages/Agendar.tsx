import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAgendamentos } from '@/hooks/useAgendamentos'
import { useAgendamentosPublic } from '@/hooks/useAgendamentosPublic'
import { useBlockedSlots } from '@/hooks/useBlockedSlots'
import { useServicos } from '@/hooks/useServicos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { format, addDays, addMinutes, isBefore, isToday, startOfDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scissors, Clock, CheckCircle, CalendarOff, Ban, Mail, AlertTriangle, Info, Phone, RefreshCw, Sparkles, ChevronRight, Shield } from 'lucide-react'
import { IS_SAO_JOAO } from '../config'

const defaultServices = [
    { id: 'corte-cabelo', name: 'Corte de Cabelo', price: 'R$ 35', duration: 30 },
    { id: 'barba-completa', name: 'Barba Completa', price: 'R$ 35', duration: 30 },
    { id: 'cabelo-barba', name: 'Cabelo e Barba', price: 'R$ 65', duration: 50 },
    { id: 'sobrancelhas', name: 'Sobrancelhas', price: 'R$ 15', duration: 10 },
    { id: 'cabelo-sobrancelhas', name: 'Cabelo e Sobrancelhas', price: 'R$ 45', duration: 35 },
    { id: 'cabelo-barba-sobrancelhas', name: 'Cabelo, Barba e Sobrancelhas', price: 'R$ 75', duration: 70 },
]

const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30',
]

const WHATSAPP_NUMBER = '5543998648935'

// Floating particle component for visual effect
function Particle({ style }: { style: React.CSSProperties }) {
    return (
        <div
            className="absolute rounded-full bg-emerald-400/20 pointer-events-none"
            style={style}
        />
    )
}

export function Agendar() {
    const { user, loading: authLoading, signInWithEmail, signInWithGoogle } = useAuth()
    const { agendamentos, isLoading, createAgendamento } = useAgendamentos()
    const { servicos } = useServicos()

    // Use dynamic services from Supabase, fallback to defaults while loading
    const services = useMemo(() => {
        if (servicos.length === 0) return defaultServices
        return servicos.map(s => ({
            id: s.id,
            name: s.nome,
            price: `R$ ${s.preco}`,
            duration: s.duracao_minutos,
        }))
    }, [servicos])

    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
    const { isTimeBlocked } = useBlockedSlots(dateStr)
    const {
        data: publicAgendamentos = [],
        isLoading: isLoadingPublic,
        isFetching: isFetchingPublic,
        refetch: refetchPublic,
    } = useAgendamentosPublic(dateStr)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [selectedService, setSelectedService] = useState<string | null>(null)
    const [whatsapp, setWhatsapp] = useState('')
    const [nomeCliente, setNomeCliente] = useState('')
    const [email, setEmail] = useState('')
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [showLoginDialog, setShowLoginDialog] = useState(false)
    const [isBooking, setIsBooking] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [showSuccessDialog, setShowSuccessDialog] = useState(false)
    const [lastBookingDetails, setLastBookingDetails] = useState<{
        service?: string,
        date?: string,
        time?: string
    } | null>(null)
    const [step, setStep] = useState<'service' | 'datetime' | 'review'>('service')

    // Pre-fill name from metadata if logged in
    useEffect(() => {
        if (user?.user_metadata?.full_name && !nomeCliente) {
            setNomeCliente(user.user_metadata.full_name)
        }
    }, [user, nomeCliente])

    // Force refetch whenever user enters the datetime step
    // This is critical to show the most up-to-date slot availability
    const prevStep = useRef(step)
    useEffect(() => {
        if (step === 'datetime' && prevStep.current !== 'datetime' && dateStr) {
            refetchPublic()
        }
        prevStep.current = step
    }, [step, dateStr, refetchPublic])

    // Also refetch when date changes while on datetime step
    useEffect(() => {
        if (step === 'datetime' && dateStr) {
            refetchPublic()
        }
    }, [dateStr]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleEmailLogin = useCallback(async () => {
        if (!email) return
        setIsLoggingIn(true)
        try {
            const { error } = await signInWithEmail(email)
            if (error) {
                toast.error('❌ Erro ao enviar link de login.', {
                    description: error.message,
                })
            } else {
                setMagicLinkSent(true)
                toast.success('✅ Link de login enviado!', {
                    description: 'Verifique seu email e clique no link para entrar.',
                })
            }
        } catch {
            toast.error('❌ Erro ao enviar link de login.')
        } finally {
            setIsLoggingIn(false)
        }
    }, [email, signInWithEmail])

    const handleTimeSelect = useCallback((time: string) => {
        setSelectedTime(time)
        setStep('review')
    }, [])

    const handleServiceSelect = useCallback((serviceId: string) => {
        setSelectedService(serviceId)
        setStep('datetime')
    }, [])

    const handleConfirmBooking = useCallback(async () => {
        if (!selectedDate || !selectedTime || !selectedService || !whatsapp) return
        if (!nomeCliente) {
            toast.error('❌ Por favor, informe seu nome.')
            return
        }

        setIsBooking(true)
        const service = services.find(s => s.id === selectedService)
        const [hours, minutes] = selectedTime.split(':').map(Number)
        const dateTime = setMinutes(setHours(selectedDate, hours), minutes)

        try {
            if (!isSupabaseConfigured) {
                toast.error('❌ Erro de Configuração', {
                    description: 'O Supabase não foi configurado corretamente. Por favor, adicione as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env ou nas configurações da Vercel.',
                })
                return
            }

            await createAgendamento.mutateAsync({
                whatsapp,
                nome_cliente: nomeCliente || undefined,
                servico: service?.name || '',
                data_hora: dateTime.toISOString(),
                duracao_minutos: service?.duration || 30,
            })
            toast.success('✅ Agendamento realizado!', {
                description: 'Confirme seu horário no WhatsApp abaixo.',
            })

            setLastBookingDetails({
                service: service?.name,
                date: format(dateTime, "dd/MM/yyyy"),
                time: selectedTime
            })

            setShowConfirmDialog(false)
            setShowSuccessDialog(true)

            // Note: We don't clear the fields yet so they can be used for the WhatsApp message
            // They will be cleared when the success dialog is closed
        } catch (error: any) {
            toast.error(error.message || '❌ Erro ao agendar. Por favor, tente novamente.')
            // Immediately refetch to show the updated availability after a failed booking
            refetchPublic()
        } finally {
            setIsBooking(false)
        }
    }, [selectedDate, selectedTime, selectedService, whatsapp, nomeCliente, createAgendamento, refetchPublic])

    const selectedServiceData = services.find(s => s.id === selectedService)

    // Returns the reason a slot is blocked, or null if it's free
    type BlockReason = 'blocked' | 'past' | 'occupied' | 'next-occupied' | 'exceeds-hours'

    // Helper: check if a specific 30-min slot is directly occupied by an existing booking
    const isSlotDirectlyOccupied = useCallback((slotStart: Date) => {
        const slotEnd = addMinutes(slotStart, 30)
        for (const a of publicAgendamentos) {
            const bookingStart = new Date(a.data_hora!)
            const bookingDuration = (a as any).duracao_minutos || 30
            const bookingEnd = addMinutes(bookingStart, bookingDuration)
            if (slotStart < bookingEnd && slotEnd > bookingStart) {
                return true
            }
        }
        return false
    }, [publicAgendamentos])

    const getSlotBlockReason = useCallback((time: string): BlockReason | null => {
        // 1. Check if manually blocked by admin
        if (isTimeBlocked(time)) return 'blocked'

        // 2. If date is today, check if time has already passed
        const now = new Date()
        if (selectedDate && isToday(selectedDate)) {
            const [hours, minutes] = time.split(':').map(Number)
            const slotDateTime = setMinutes(setHours(startOfDay(selectedDate), hours), minutes)
            if (isBefore(slotDateTime, now)) return 'past'
        }

        if (!selectedDate) return null

        // Parse the candidate slot start time
        const [slotH, slotM] = time.split(':').map(Number)
        const slotStart = setMinutes(setHours(startOfDay(selectedDate), slotH), slotM)

        // Duration of the service the user selected (in minutes)
        const selectedDuration = selectedServiceData?.duration || 30
        const slotEnd = addMinutes(slotStart, selectedDuration)

        // 3. Check if THIS slot itself is directly occupied (30-min base check)
        if (isSlotDirectlyOccupied(slotStart)) return 'occupied'

        // 4. Check if the selected service would go past the last slot (20:00)
        const lastSlotEnd = setMinutes(setHours(startOfDay(selectedDate), 20), 0)
        if (slotEnd > lastSlotEnd) return 'exceeds-hours'

        // 5. For services > 30min, check if the extended time overlaps with occupied slots
        if (selectedDuration > 30) {
            for (const a of publicAgendamentos) {
                const bookingStart = new Date(a.data_hora!)
                const bookingDuration = (a as any).duracao_minutos || 30
                const bookingEnd = addMinutes(bookingStart, bookingDuration)

                if (slotStart < bookingEnd && slotEnd > bookingStart) {
                    return 'next-occupied'
                }
            }

            // Also check if any of the intermediate slots are blocked by admin
            let checkTime = addMinutes(slotStart, 30)
            while (checkTime < slotEnd) {
                const checkTimeStr = `${String(checkTime.getHours()).padStart(2, '0')}:${String(checkTime.getMinutes()).padStart(2, '0')}`
                if (isTimeBlocked(checkTimeStr)) return 'next-occupied'
                checkTime = addMinutes(checkTime, 30)
            }
        }

        return null
    }, [isTimeBlocked, publicAgendamentos, selectedDate, selectedServiceData, isSlotDirectlyOccupied])

    const today = startOfDay(new Date())
    const maxDate = addDays(today, 90)

    const isDateDisabled = (date: Date) => {
        return isBefore(date, today) || date > maxDate || date.getDay() === 0
    }

    // Count available slots for display
    const availableSlotCount = useMemo(() => {
        if (!selectedDate) return 0
        return timeSlots.filter(t => getSlotBlockReason(t) === null).length
    }, [selectedDate, getSlotBlockReason])

    // Auth Loading
    if (authLoading) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <div className="max-w-2xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64 mx-auto" />
                    <Skeleton className="h-6 w-96 mx-auto" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            </div>
        )
    }

    // Simplified steps for older clients
    const stepsArray = ['service', 'datetime', 'review'] as const
    const stepsLabels = ['Serviço', 'Data & Hora', 'Confirmação']
    const currentStepIndex = stepsArray.indexOf(step)

    return (
        <div
            className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden"
            style={IS_SAO_JOAO ? {
                backgroundImage: "url('/sao-joao-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
            } : undefined}
        >
            {/* São João overlays */}
            {IS_SAO_JOAO ? (
                <>
                    {/* Dark overlay for readability */}
                    <div className="absolute inset-0 -z-0 bg-black/30" />
                    <div className="absolute inset-0 -z-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
                    {/* Animated overlay effects */}
                    <div className="absolute inset-0 pointer-events-none z-0">
                        {/* Lantern glow top */}
                        <div className="absolute top-[5%] left-[10%] w-10 h-10 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" />
                        <div className="absolute top-[8%] left-[35%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
                        <div className="absolute top-[4%] right-[20%] w-10 h-10 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-[10%] right-[5%] w-7 h-7 rounded-full bg-yellow-200/30 blur-md animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
                        {/* Floating embers */}
                        <div className="absolute bottom-32 right-[25%] w-2 h-2 bg-orange-400 rounded-full animate-float opacity-70" style={{ animationDuration: '2.5s' }} />
                        <div className="absolute bottom-40 right-[22%] w-1.5 h-1.5 bg-yellow-400 rounded-full animate-float opacity-60" style={{ animationDuration: '3s', animationDelay: '0.7s' }} />
                        <div className="absolute bottom-36 right-[28%] w-1 h-1 bg-red-400 rounded-full animate-float opacity-50" style={{ animationDuration: '2s', animationDelay: '1.2s' }} />
                        {/* Warm glow at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-orange-900/40 to-transparent" />
                    </div>
                </>
            ) : (
                <>
                    {/* Original theme backgrounds */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.06)_0%,_transparent_55%)]" />
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(5,150,105,0.04)_0%,_transparent_55%)]" />
                    {/* Dot grid */}
                    <div className="absolute inset-0 -z-10 opacity-[0.025]" style={{
                        backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
                        backgroundSize: '28px 28px'
                    }} />
                    {/* Floating blobs */}
                    <Particle style={{ width: 300, height: 300, top: '5%', right: '3%', filter: 'blur(60px)', animationName: 'blob', animationDuration: '9s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }} />
                    <Particle style={{ width: 200, height: 200, bottom: '10%', left: '2%', filter: 'blur(50px)', animationName: 'blob', animationDuration: '12s', animationDelay: '3s', animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }} />
                </>
            )}

            <div className="max-w-4xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border shadow-sm ${
                        IS_SAO_JOAO
                            ? 'bg-amber-950/80 text-amber-200 border-amber-500/30 backdrop-blur-md'
                            : 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/50'
                    }`}>
                        <Scissors className="w-3.5 h-3.5" />
                        {IS_SAO_JOAO ? '🌟 Agendamento Online' : 'Agendamento Online'}
                    </div>
                    <h1 className={`text-4xl sm:text-5xl font-extrabold mb-3 tracking-tight ${
                        IS_SAO_JOAO ? 'text-white filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]' : 'text-gray-900'
                    }`}>
                        Agendar{' '}
                        <span className={IS_SAO_JOAO ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent' : 'animate-text-shimmer'}>Horário</span>
                    </h1>
                    {user ? (
                        <p className={IS_SAO_JOAO ? 'text-orange-100/90 text-lg font-medium filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-gray-500 text-lg'}>
                            Olá, <span className={IS_SAO_JOAO ? 'text-yellow-300 font-semibold' : 'text-emerald-600 font-semibold'}>{user.user_metadata?.full_name || user.email}</span>! 👋
                        </p>
                    ) : (
                        <div className="space-y-1">
                            <p className={IS_SAO_JOAO ? 'text-orange-100/90 text-lg font-medium filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-gray-500 text-lg'}>Agende seu corte rápido e fácil!</p>
                            <button
                                onClick={() => setShowLoginDialog(true)}
                                className={IS_SAO_JOAO ? 'text-yellow-300 text-sm font-semibold hover:underline' : 'text-emerald-600 text-sm font-semibold hover:underline'}
                            >
                                Já tem conta? Clique aqui para entrar
                            </button>
                        </div>
                    )}
                </div>

                {/* Steps Progress — redesigned */}
                <div className="flex items-center justify-center gap-0 mb-12 animate-fade-in">
                    {stepsArray.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={[
                                        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-500 shadow-md',
                                        step === s
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white scale-110 shadow-emerald-500/40 shadow-lg ring-4 ring-emerald-500/20'
                                            : i < currentStepIndex
                                                ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-300/40'
                                                : 'bg-gray-100 text-gray-400'
                                    ].join(' ')}
                                >
                                    {i < currentStepIndex ? <CheckCircle className="w-5 h-5" /> : i + 1}
                                </div>
                                <span className={[
                                    'text-[10px] font-bold uppercase tracking-wider hidden sm:block',
                                    step === s ? 'text-emerald-600' : i < currentStepIndex ? 'text-emerald-400' : 'text-gray-300'
                                ].join(' ')}>
                                    {stepsLabels[i]}
                                </span>
                            </div>
                            {i < 2 && (
                                <div className="w-16 sm:w-28 mx-1 h-1 rounded-full overflow-hidden bg-gray-100 mb-4">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700 ease-out"
                                        style={{ width: i < currentStepIndex ? '100%' : '0%' }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ─────────────────────────────────────────────
                    STEP 1: Service Selection
                ───────────────────────────────────────────── */}
                {step === 'service' && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">Escolha o Serviço</h2>
                        <p className="text-sm text-gray-400 text-center mb-8">Selecione o serviço que você deseja realizar</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service, idx) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service.id)}
                                    className={[
                                        'p-6 rounded-3xl border-2 text-left transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group relative overflow-hidden',
                                        'animate-fade-in-up',
                                        selectedService === service.id
                                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-lg shadow-emerald-500/15 ring-4 ring-emerald-500/10'
                                            : 'border-gray-100 bg-white hover:border-emerald-200 hover:shadow-emerald-500/10'
                                    ].join(' ')}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                >
                                    {/* Glow effect on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/3 group-hover:to-emerald-500/0 transition-all duration-500 rounded-3xl" />
                                    <div className="relative">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200/60 rounded-2xl flex items-center justify-center group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                                                <Scissors className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <span className="text-2xl font-black text-emerald-600 group-hover:scale-110 transition-transform duration-300">{service.price}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{service.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                <span>{service.duration} min</span>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs font-semibold text-emerald-500 flex items-center gap-1">
                                                Selecionar <ChevronRight className="w-3 h-3" />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────
                    STEP 2: Date & Time Selection
                ───────────────────────────────────────────── */}
                {step === 'datetime' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Escolha Data e Horário</h2>
                                <p className="text-sm text-gray-400 mt-0.5">Selecione um dia e um horário disponível</p>
                            </div>
                            <Button variant="ghost" onClick={() => setStep('service')} className="text-gray-500 gap-1.5 text-sm">
                                ← Voltar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Calendar */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    disabled={isDateDisabled}
                                    locale={ptBR}
                                    className="mx-auto"
                                />
                            </div>

                            {/* Time Slots */}
                            <div>
                                {!selectedDate ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                        <CalendarOff className="w-16 h-16 text-gray-200 mb-4" />
                                        <p className="text-gray-400 text-lg font-medium">Selecione uma data</p>
                                        <p className="text-gray-300 text-sm">Escolha um dia no calendário para ver os horários disponíveis</p>
                                    </div>
                                ) : (isLoading || isLoadingPublic) ? (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <Skeleton key={i} className="h-16 rounded-2xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        {/* Header with sync indicator */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-600">
                                                    Horários para {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                                </h3>
                                                {selectedDate && availableSlotCount > 0 && (
                                                    <p className="text-xs text-emerald-600 font-medium mt-0.5">
                                                        {availableSlotCount} horário{availableSlotCount !== 1 ? 's' : ''} disponível{availableSlotCount !== 1 ? 'is' : ''}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Syncing indicator */}
                                            {isFetchingPublic && (
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
                                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                                    <span className="font-medium">Sincronizando...</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bloqueio visual completo durante fetch para evitar cliques em slots desatualizados */}
                                        <div className={[
                                            'relative transition-opacity duration-200',
                                            isFetchingPublic ? 'pointer-events-none opacity-60' : 'opacity-100'
                                        ].join(' ')}>
                                            {timeSlots.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <CalendarOff className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                                    <p className="text-gray-500 font-medium">Nenhum horário disponível no momento.</p>
                                                    <p className="text-gray-400 text-sm mt-1">
                                                        Por favor, retorne mais tarde ou entre em contato pelo WhatsApp para verificar disponibilidade.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                        {timeSlots.map((time) => {
                                                            const blockReason = getSlotBlockReason(time)
                                                            const isBlocked = blockReason !== null
                                                            const isNextOccupied = blockReason === 'next-occupied'
                                                            const isExceedsHours = blockReason === 'exceeds-hours'
                                                            const isSelected = selectedTime === time

                                                            return (
                                                                <button
                                                                    key={time}
                                                                    onClick={() => !isBlocked && handleTimeSelect(time)}
                                                                    disabled={isBlocked || isFetchingPublic}
                                                                    title={
                                                                        isNextOccupied
                                                                            ? `Seu serviço dura ${selectedServiceData?.duration}min e o próximo horário já está ocupado`
                                                                            : isExceedsHours
                                                                                ? `O serviço passaria do horário de fechamento`
                                                                                : undefined
                                                                    }
                                                                    className={[
                                                                        'h-16 rounded-2xl border-2 text-sm font-bold transition-all duration-200 relative overflow-hidden',
                                                                        isSelected
                                                                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30 scale-105'
                                                                            : isNextOccupied
                                                                                ? 'border-amber-200 bg-amber-50 text-amber-500 cursor-not-allowed'
                                                                                : isExceedsHours
                                                                                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                                                                    : isBlocked
                                                                                        ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed'
                                                                                        : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-white hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-105 hover:text-emerald-700 active:scale-95'
                                                                    ].join(' ')}
                                                                >
                                                                    {/* Available slot shimmer glow */}
                                                                    {!isBlocked && !isSelected && (
                                                                        <span className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent animate-shimmer" />
                                                                    )}
                                                                    {/* Selected pulse ring */}
                                                                    {isSelected && (
                                                                        <span className="absolute inset-0 rounded-2xl ring-4 ring-emerald-400/30 animate-pulse" />
                                                                    )}
                                                                    {isNextOccupied ? (
                                                                        <span className="flex flex-col items-center justify-center text-[9px] uppercase tracking-tighter leading-tight px-1">
                                                                            <AlertTriangle className="w-4 h-4 mb-0.5" />
                                                                            <span>Próx. ocupado</span>
                                                                        </span>
                                                                    ) : isExceedsHours ? (
                                                                        <span className="flex flex-col items-center justify-center text-[10px] uppercase tracking-tighter">
                                                                            <Clock className="w-4 h-4 mb-0.5" />
                                                                            Sem tempo
                                                                        </span>
                                                                    ) : isBlocked ? (
                                                                        <span className="flex flex-col items-center justify-center text-[10px] uppercase tracking-tighter">
                                                                            <Ban className="w-4 h-4 mb-0.5" />
                                                                            Ocupado
                                                                        </span>
                                                                    ) : (
                                                                        <span className="relative z-10">{time}</span>
                                                                    )}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>

                                                    {/* Info note for services > 30min */}
                                                    {selectedServiceData && selectedServiceData.duration > 30 && (
                                                        <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
                                                            <Info className="w-5 h-5 mt-0.5 shrink-0" />
                                                            <p>
                                                                <strong>{selectedServiceData.name}</strong> dura <strong>{selectedServiceData.duration} minutos</strong> e pode ocupar mais de 1 horário.
                                                                Horários em <span className="font-bold text-amber-600">amarelo</span> não podem ser selecionados pois o próximo já está ocupado.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Real-time guarantee badge */}
                                                    <div className="flex items-center gap-2 mt-4 p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-700 text-xs">
                                                        <Shield className="w-4 h-4 shrink-0 text-emerald-500" />
                                                        <span>Horários atualizados em tempo real · Anti-conflito automático</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─────────────────────────────────────────────
                    STEP 3: Review
                ───────────────────────────────────────────── */}
                {step === 'review' && selectedDate && selectedTime && selectedServiceData && (
                    <div className="animate-fade-in max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Confirme seu Agendamento</h2>
                                <p className="text-sm text-gray-400 mt-0.5">Verifique os dados antes de confirmar</p>
                            </div>
                            <Button variant="ghost" onClick={() => setStep('datetime')} className="text-gray-500 text-sm">
                                ← Voltar
                            </Button>
                        </div>

                        {/* Glass-style review card */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-lg shadow-gray-100/80 space-y-5 relative overflow-hidden">
                            {/* Subtle gradient overlay */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-full opacity-60" />

                            <div className="relative flex items-center gap-4 pb-4 border-b border-gray-100">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                    <Scissors className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">{selectedServiceData.name}</h3>
                                    <p className="text-emerald-600 font-black text-xl">{selectedServiceData.price}</p>
                                </div>
                            </div>

                            <div className="relative space-y-3">
                                <div className="flex items-center justify-between bg-gray-50/70 rounded-xl px-4 py-2.5">
                                    <span className="text-sm text-gray-500 font-medium">📅 Data</span>
                                    <span className="font-semibold text-gray-800 text-sm">
                                        {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 py-2.5">
                                    <span className="text-sm text-emerald-700 font-medium">⏰ Horário</span>
                                    <span className="font-black text-emerald-600 text-xl">{selectedTime}</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50/70 rounded-xl px-4 py-2.5">
                                    <span className="text-sm text-gray-500 font-medium">⏱ Duração</span>
                                    <span className="font-semibold text-gray-800 text-sm">{selectedServiceData.duration} min</span>
                                </div>
                            </div>

                            <div className="relative space-y-4 pt-1">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Seu Nome Completo</label>
                                    <Input
                                        type="text"
                                        placeholder="Ex: João Silva"
                                        value={nomeCliente}
                                        onChange={(e) => setNomeCliente(e.target.value)}
                                        className="h-12 rounded-xl text-base border-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Seu WhatsApp</label>
                                    <Input
                                        type="tel"
                                        placeholder="Ex: 11999999999"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="h-12 rounded-xl text-lg font-bold tracking-widest text-center border-2 focus:ring-emerald-500 focus:border-emerald-400 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="relative flex gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('datetime')}
                                    className="flex-1 h-11 rounded-xl text-gray-500"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => setShowConfirmDialog(true)}
                                    disabled={!whatsapp || !nomeCliente}
                                    className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-base font-bold transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                                >
                                    <Sparkles className="w-4 h-4 mr-1.5" />
                                    Confirmar Agora
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Appointments */}
                {agendamentos.length > 0 && (
                    <div className="mt-16 animate-fade-in-up">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                            Meus Agendamentos
                        </h2>
                        <div className="space-y-3">
                            {agendamentos.filter(a => a.status === 'confirmado').map((agendamento) => (
                                <div
                                    key={agendamento.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200/60 rounded-xl flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-800">{agendamento.servico}</h3>
                                            <p className="text-sm text-gray-400">
                                                {format(new Date(agendamento.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold capitalize">
                                        {agendamento.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Login Dialog ─── */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Entrar na Conta</DialogTitle>
                        <DialogDescription className="text-center text-base">
                            Veja seu histórico e gerencie seus cortes.
                        </DialogDescription>
                    </DialogHeader>

                    {magicLinkSent ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                <Mail className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-bold">Link enviado!</h3>
                            <p className="text-gray-500">Verifique seu email e clique no link para entrar.</p>
                            <Button variant="ghost" onClick={() => setMagicLinkSent(false)}>Usar outro email</Button>
                        </div>
                    ) : (
                        <div className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 ml-1">Seu Email</label>
                                <Input
                                    type="email"
                                    placeholder="email@exemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 rounded-2xl text-base"
                                />
                            </div>
                            <Button
                                onClick={handleEmailLogin}
                                disabled={!email || isLoggingIn}
                                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-base font-bold shadow-lg"
                            >
                                {isLoggingIn ? 'Enviando...' : 'Receber Link por Email'}
                            </Button>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-gray-400 text-sm">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <Button
                                onClick={signInWithGoogle}
                                variant="outline"
                                className="w-full h-12 rounded-2xl text-base font-medium border-2"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Entrar com Google
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ─── Confirmation Dialog ─── */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Quase lá! 🎉</DialogTitle>
                        <DialogDescription className="text-base">
                            Confira se as informações estão certas:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-5">
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <span className="text-gray-500 text-sm">Serviço</span>
                            <span className="font-bold text-gray-800">{selectedServiceData?.name}</span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <span className="text-gray-500 text-sm">Dia</span>
                            <span className="font-bold text-gray-800">
                                {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                            <span className="text-emerald-700 text-sm font-medium">Horário</span>
                            <span className="font-black text-emerald-600 text-2xl">{selectedTime}</span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                            <span className="text-gray-500 text-sm">Nome</span>
                            <span className="font-bold text-gray-800">{nomeCliente}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
                            <span className="text-gray-500 text-sm">Total</span>
                            <span className="font-black text-emerald-500 text-2xl">{selectedServiceData?.price}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={handleConfirmBooking}
                            disabled={isBooking}
                            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-lg font-black transition-all duration-300 hover:scale-[1.01] shadow-xl shadow-emerald-500/20"
                        >
                            {isBooking ? (
                                <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Agendando...</>
                            ) : (
                                <><Sparkles className="w-5 h-5 mr-2" /> AGENDAR AGORA</>
                            )}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="w-full h-11 rounded-xl text-gray-500 font-medium">
                            Voltar e alterar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ─── Success Dialog ─── */}
            <Dialog open={showSuccessDialog} onOpenChange={(open) => {
                setShowSuccessDialog(open)
                if (!open) {
                    // Reset everything when closing
                    setSelectedDate(undefined)
                    setSelectedTime(null)
                    setSelectedService(null)
                    setNomeCliente('')
                    setStep('service')
                    setLastBookingDetails(null)
                }
            }}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8 text-center overflow-hidden relative">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white to-white pointer-events-none" />

                    <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30 animate-bounce-in">
                            <CheckCircle className="w-12 h-12 text-white" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black text-gray-900">Agendado! 🎉</DialogTitle>
                            <DialogDescription className="text-base text-gray-500 pt-2">
                                Seu horário foi reservado com sucesso no sistema.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 my-6 text-left space-y-2 shadow-sm">
                            <p className="text-xs text-emerald-600 uppercase font-bold tracking-wider">Resumo do Agendamento</p>
                            <p className="text-gray-800 font-semibold">✂️ {lastBookingDetails?.service}</p>
                            <p className="text-gray-800 font-semibold">📅 {lastBookingDetails?.date} às {lastBookingDetails?.time}</p>
                        </div>

                        <div className="space-y-3">
                            <Button
                                onClick={() => {
                                    const message = `Olá! Acabei de agendar um(a) *${lastBookingDetails?.service}* para o dia *${lastBookingDetails?.date}* às *${lastBookingDetails?.time}*. Gostaria de confirmar!`
                                    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank')
                                }}
                                className="w-full h-14 bg-gradient-to-r from-[#25D366] to-[#20ba59] hover:from-[#20ba59] hover:to-[#1da851] text-white rounded-2xl text-base font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all duration-300"
                            >
                                <Phone className="w-5 h-5" />
                                CONFIRMAR NO WHATSAPP
                            </Button>
                            <Button
                                onClick={() => setShowSuccessDialog(false)}
                                variant="ghost"
                                className="w-full h-11 text-gray-500 font-medium"
                            >
                                OK, ENTENDI
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
