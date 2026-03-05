import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAgendamentos } from '@/hooks/useAgendamentos'
import { useAgendamentosPublic } from '@/hooks/useAgendamentosPublic'
import { useBlockedSlots } from '@/hooks/useBlockedSlots'
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
import { format, addDays, isBefore, isToday, startOfDay, setHours, setMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Scissors, Clock, CheckCircle, CalendarOff, Ban, Mail } from 'lucide-react'

const services = [
    { id: 'corte-cabelo', name: 'Corte de Cabelo', price: 'R$ 35', duration: 30 },
    { id: 'barba-completa', name: 'Barba Completa', price: 'R$ 35', duration: 30 },
    { id: 'cabelo-barba', name: 'Cabelo e Barba', price: 'R$ 65', duration: 50 },
    { id: 'sobrancelhas', name: 'Sobrancelhas', price: 'R$ 15', duration: 15 },
    { id: 'cabelo-sobrancelhas', name: 'Cabelo e Sobrancelhas', price: 'R$ 45', duration: 40 },
    { id: 'cabelo-barba-sobrancelhas', name: 'Cabelo, Barba e Sobrancelhas', price: 'R$ 75', duration: 60 },
]

const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
    '19:00', '19:30',
]

export function Agendar() {
    const { user, loading: authLoading, signInWithEmail, signInWithGoogle } = useAuth()
    const { agendamentos, isLoading, createAgendamento } = useAgendamentos()
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined
    const { isTimeBlocked } = useBlockedSlots(dateStr)
    const { data: publicAgendamentos = [], isLoading: isLoadingPublic } = useAgendamentosPublic(dateStr)
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
        if (!user && !nomeCliente) {
            toast.error('❌ Por favor, informe seu nome.')
            return
        }

        setIsBooking(true)
        const service = services.find(s => s.id === selectedService)
        const [hours, minutes] = selectedTime.split(':').map(Number)
        const dateTime = setMinutes(setHours(selectedDate, hours), minutes)

        try {
            await createAgendamento.mutateAsync({
                whatsapp,
                nome_cliente: nomeCliente || undefined,
                servico: service?.name || '',
                data_hora: dateTime.toISOString(),
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
        } catch {
            toast.error('❌ Erro ao agendar. Por favor, tente novamente.')
        } finally {
            setIsBooking(false)
        }
    }, [selectedDate, selectedTime, selectedService, whatsapp, nomeCliente, user, createAgendamento])

    const isSlotOccupied = useCallback((time: string) => {
        // 1. Check if manually blocked by admin
        if (isTimeBlocked(time)) return true

        // 2. Check if already booked by someone
        const isBooked = publicAgendamentos.some(a => {
            const agendamentoTime = format(new Date(a.data_hora!), 'HH:mm')
            return agendamentoTime === time
        })
        if (isBooked) return true

        // 3. If date is today, check if time has already passed
        const today = new Date()
        if (selectedDate && isToday(selectedDate)) {
            const [hours, minutes] = time.split(':').map(Number)
            const slotDateTime = setMinutes(setHours(startOfDay(selectedDate), hours), minutes)
            if (isBefore(slotDateTime, today)) return true
        }

        return false
    }, [isTimeBlocked, publicAgendamentos, selectedDate])

    const selectedServiceData = services.find(s => s.id === selectedService)
    const today = startOfDay(new Date())
    const maxDate = addDays(today, 90)

    const isDateDisabled = (date: Date) => {
        return isBefore(date, today) || date > maxDate || date.getDay() === 0
    }

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
    const currentStepIndex = stepsArray.indexOf(step)

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Agendar Horário</h1>
                    {user ? (
                        <p className="text-gray-500 text-xl">
                            Olá, <span className="text-emerald-500 font-semibold">{user.user_metadata?.full_name || user.email}</span>!
                        </p>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-gray-600 text-xl font-medium">Agende seu corte rápido e fácil!</p>
                            <button
                                onClick={() => setShowLoginDialog(true)}
                                className="text-emerald-500 text-sm font-semibold hover:underline"
                            >
                                Já tem conta? Clique aqui para entrar
                            </button>
                        </div>
                    )}
                </div>

                {/* Steps Progress */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {stepsArray.map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div
                                className={[
                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                                    step === s ? 'bg-emerald-500 text-white scale-110' :
                                        i < currentStepIndex ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-gray-100 text-gray-400'
                                ].join(' ')}
                            >
                                {i + 1}
                            </div>
                            {i < 2 && (
                                <div
                                    className={[
                                        'w-12 sm:w-24 h-0.5 transition-colors',
                                        i < currentStepIndex ? 'bg-emerald-300' : 'bg-gray-200'
                                    ].join(' ')}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Service Selection */}
                {step === 'service' && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Escolha o Serviço</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {services.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleServiceSelect(service.id)}
                                    className={[
                                        'p-6 sm:p-8 rounded-3xl border-2 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                                        selectedService === service.id
                                            ? 'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-500/10'
                                            : 'border-gray-100 bg-white hover:border-emerald-200'
                                    ].join(' ')}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                            <Scissors className="w-7 h-7 text-emerald-500" />
                                        </div>
                                        <span className="text-2xl font-black text-emerald-600">{service.price}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{service.name}</h3>
                                    <div className="flex items-center gap-2 text-base text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{service.duration} min</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {step === 'datetime' && (
                    <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Escolha Data e Horário</h2>
                            <Button variant="ghost" onClick={() => setStep('service')} className="text-gray-500">
                                ← Voltar
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Calendar */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
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
                                            <Skeleton key={i} className="h-12 rounded-xl" />
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 mb-3">
                                            Horários para {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                                        </h3>
                                        {timeSlots.length === 0 ? (
                                            <div className="text-center py-12">
                                                <CalendarOff className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                                <p className="text-gray-500 font-medium">Nenhum horário disponível no momento.</p>
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Por favor, retorne mais tarde ou entre em contato pelo WhatsApp para verificar disponibilidade.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                {timeSlots.map((time) => {
                                                    const occupied = isSlotOccupied(time)
                                                    return (
                                                        <button
                                                            key={time}
                                                            onClick={() => !occupied && handleTimeSelect(time)}
                                                            disabled={occupied}
                                                            className={[
                                                                'h-16 rounded-2xl border-2 text-lg font-bold transition-all duration-200',
                                                                occupied
                                                                    ? 'border-red-100 bg-red-50 text-red-300 cursor-not-allowed'
                                                                    : selectedTime === time
                                                                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-xl scale-105'
                                                                        : 'border-gray-100 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 hover:scale-110 active:scale-95'
                                                            ].join(' ')}
                                                        >
                                                            {occupied ? (
                                                                <span className="flex flex-col items-center justify-center text-[10px] uppercase tracking-tighter">
                                                                    <Ban className="w-4 h-4 mb-0.5" />
                                                                    Ocupado
                                                                </span>
                                                            ) : time}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Review */}
                {step === 'review' && selectedDate && selectedTime && selectedServiceData && (
                    <div className="animate-fade-in max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Confirme seu Agendamento</h2>
                            <Button variant="ghost" onClick={() => setStep('datetime')} className="text-gray-500">
                                ← Voltar
                            </Button>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
                                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                    <Scissors className="w-7 h-7 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 text-lg">{selectedServiceData.name}</h3>
                                    <p className="text-emerald-500 font-bold text-xl">{selectedServiceData.price}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Data</span>
                                    <span className="font-medium text-gray-800">
                                        {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Horário</span>
                                    <span className="font-medium text-gray-800">{selectedTime}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Duração</span>
                                    <span className="font-medium text-gray-800">{selectedServiceData.duration} min</span>
                                </div>
                                {whatsapp && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">WhatsApp</span>
                                        <span className="font-medium text-gray-800">{whatsapp}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-2">
                                {!user && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700 ml-1">Seu Nome Completo</label>
                                        <Input
                                            type="text"
                                            placeholder="Ex: João Silva"
                                            value={nomeCliente}
                                            onChange={(e) => setNomeCliente(e.target.value)}
                                            className="h-14 rounded-2xl text-lg border-2 focus:ring-emerald-500"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 ml-1">Seu WhatsApp</label>
                                    <Input
                                        type="tel"
                                        placeholder="Ex: 11999999999"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="h-14 rounded-2xl text-xl font-bold tracking-widest text-center border-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => setStep('datetime')}
                                    className="flex-1 h-12 rounded-xl"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => setShowConfirmDialog(true)}
                                    disabled={!whatsapp || (!user && !nomeCliente)}
                                    className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-lg font-bold transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-emerald-500/25 disabled:opacity-50"
                                >
                                    Confirmar Agora
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* My Appointments */}
                {agendamentos.length > 0 && (
                    <div className="mt-16">
                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Meus Agendamentos</h2>
                        <div className="space-y-3">
                            {agendamentos.filter(a => a.status === 'confirmado').map((agendamento) => (
                                <div
                                    key={agendamento.id}
                                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between shadow-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-800">{agendamento.servico}</h3>
                                            <p className="text-sm text-gray-400">
                                                {format(new Date(agendamento.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-xs font-medium capitalize">
                                        {agendamento.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Login Dialog */}
            <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Entrar na Conta</DialogTitle>
                        <DialogDescription className="text-center text-lg">
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
                                    className="h-14 rounded-2xl text-lg"
                                />
                            </div>
                            <Button
                                onClick={handleEmailLogin}
                                disabled={!email || isLoggingIn}
                                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-lg font-bold shadow-lg"
                            >
                                {isLoggingIn ? 'Enviando...' : 'Receber Link por Email'}
                            </Button>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-200" />
                                <span className="text-gray-400">ou</span>
                                <div className="flex-1 h-px bg-gray-200" />
                            </div>

                            <Button
                                onClick={signInWithGoogle}
                                variant="outline"
                                className="w-full h-14 rounded-2xl text-lg font-medium border-2"
                            >
                                <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
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

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Quase lá!</DialogTitle>
                        <DialogDescription className="text-lg">
                            Confira se as informações estão certas:
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-6">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Serviço</span>
                            <span className="font-bold text-gray-800">{selectedServiceData?.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Dia</span>
                            <span className="font-bold text-gray-800">
                                {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Horário</span>
                            <span className="font-bold text-emerald-600 text-2xl">{selectedTime}</span>
                        </div>
                        {!user && (
                            <div className="flex items-center justify-between">
                                <span className="text-gray-500">Nome</span>
                                <span className="font-bold text-gray-800">{nomeCliente}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <span className="text-gray-500">Total</span>
                            <span className="font-black text-emerald-500 text-2xl">{selectedServiceData?.price}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <Button
                            onClick={handleConfirmBooking}
                            disabled={isBooking}
                            className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xl font-black transition-all duration-300 shadow-xl shadow-emerald-500/20"
                        >
                            {isBooking ? 'Agendando...' : 'AGENDAR AGORA'}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="w-full h-12 rounded-xl text-gray-500 font-medium">
                            Voltar e alterar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Success Dialog with WhatsApp Redirect */}
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
                <DialogContent className="sm:max-w-md rounded-3xl p-8 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-gray-900">Agendado!</DialogTitle>
                        <DialogDescription className="text-lg text-gray-500 pt-2">
                            Seu horário foi reservado com sucesso no sistema.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-gray-50 rounded-2xl p-6 my-6 text-left space-y-2">
                        <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Resumo</p>
                        <p className="text-gray-800 font-medium">✨ {lastBookingDetails?.service}</p>
                        <p className="text-gray-800 font-medium">📅 {lastBookingDetails?.date} às {lastBookingDetails?.time}</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <Button
                            onClick={() => setShowSuccessDialog(false)}
                            className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20"
                        >
                            OK, ENTENDI
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
