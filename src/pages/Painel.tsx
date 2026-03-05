import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ControleHorarios } from '@/components/ControleHorarios'
import { WhatsAppConfig } from '@/components/WhatsAppConfig'
import { GerenciarProdutos } from '@/components/GerenciarProdutos'
import { Financeiro } from '@/components/Financeiro'
import { toast } from 'sonner'
import { format, isToday, isTomorrow, isPast, startOfDay, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    CalendarOff,
    Clock,
    LogIn,
    CheckCircle,
    XCircle,
    Scissors,
    Phone,
    Filter,
    Calendar,
    Users,
    TrendingUp,
    LayoutList,
    TimerOff,
    MessageCircle,
    DollarSign,
    Eye,
    EyeOff,
    Package,
} from 'lucide-react'

const servicePrices: Record<string, number> = {
    'Corte de Cabelo': 35,
    'Barba Completa': 35,
    'Cabelo e Barba': 65,
    'Sobrancelhas': 15,
    'Cabelo e Sobrancelhas': 45,
    'Cabelo, Barba e Sobrancelhas': 75,
}

type FilterStatus = 'todos' | 'confirmado' | 'cancelado' | 'realizado'
type FilterPeriod = 'hoje' | 'amanha' | 'semana' | 'todos'
type Tab = 'agendamentos' | 'horarios' | 'config' | 'produtos' | 'financeiro'

export function Painel() {
    const { user, loading: authLoading, signInWithEmail, signInWithPassword, signOut } = useAuth()
    const { isAdmin, isCheckingAdmin, allAgendamentos, isLoading, updateStatus } = useAdmin()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('hoje')
    const [activeTab, setActiveTab] = useState<Tab>('agendamentos')

    const filteredAgendamentos = useMemo(() => {
        let filtered = [...allAgendamentos]

        if (filterStatus !== 'todos') {
            filtered = filtered.filter(a => a.status === filterStatus)
        }

        const today = startOfDay(new Date())
        const tomorrow = startOfDay(addDays(today, 1))
        const weekEnd = startOfDay(addDays(today, 7))

        if (filterPeriod === 'hoje') {
            filtered = filtered.filter(a => {
                const d = startOfDay(new Date(a.data_hora))
                return d.getTime() === today.getTime()
            })
        } else if (filterPeriod === 'amanha') {
            filtered = filtered.filter(a => {
                const d = startOfDay(new Date(a.data_hora))
                return d.getTime() === tomorrow.getTime()
            })
        } else if (filterPeriod === 'semana') {
            filtered = filtered.filter(a => {
                const d = new Date(a.data_hora)
                return d >= today && d < weekEnd
            })
        }

        return filtered
    }, [allAgendamentos, filterStatus, filterPeriod])

    const stats = useMemo(() => {
        const today = startOfDay(new Date())
        const todayAppointments = allAgendamentos.filter(a => {
            const d = startOfDay(new Date(a.data_hora))
            return d.getTime() === today.getTime() && a.status === 'confirmado'
        })
        const confirmed = allAgendamentos.filter(a => a.status === 'confirmado').length
        const completed = allAgendamentos.filter(a => a.status === 'realizado').length

        const todayRevenue = todayAppointments.reduce((acc, a) => {
            const price = servicePrices[a.servico] || 0
            return acc + price
        }, 0)

        const totalConfirmedRevenue = allAgendamentos
            .filter(a => a.status === 'confirmado' || a.status === 'realizado')
            .reduce((acc, a) => {
                const price = servicePrices[a.servico] || 0
                return acc + price
            }, 0)

        return { todayCount: todayAppointments.length, confirmed, completed, total: allAgendamentos.length, todayRevenue, totalConfirmedRevenue }
    }, [allAgendamentos])

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await updateStatus.mutateAsync({ id, status })
            const label = status === 'realizado' ? 'concluído' : status === 'cancelado' ? 'cancelado' : 'confirmado'
            toast.success(`✅ Agendamento ${label}!`)
        } catch {
            toast.error('❌ Erro ao atualizar status.')
        }
    }

    const handleWhatsAppReminder = (agendamento: any) => {
        const dateTime = new Date(agendamento.data_hora)
        const timeStr = format(dateTime, 'HH:mm')
        const dateStr = format(dateTime, 'dd/MM')

        const message = `Olá! 💈 Sou da Felipe Barbearia. Passando para confirmar seu horário de *${agendamento.servico}* no dia *${dateStr}* às *${timeStr}*. Estamos te esperando!`
        const phone = agendamento.whatsapp.replace(/\D/g, '')
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`

        window.open(whatsappUrl, '_blank')
    }

    // Loading
    if (authLoading || isCheckingAdmin) {
        return (
            <div className="min-h-screen pt-24 px-4">
                <div className="max-w-6xl mx-auto space-y-6">
                    <Skeleton className="h-10 w-64" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-2xl" />
                        ))}
                    </div>
                    <Skeleton className="h-96 rounded-2xl" />
                </div>
            </div>
        )
    }

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center px-4 bg-gray-50/50">
                <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50 text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <LogIn className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">Acesso Restrito</h1>
                        <p className="text-gray-500 mt-2">Você precisa estar logado para acessar o painel do barbeiro.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-100 p-4 rounded-xl mb-2 text-left">
                            <strong>⚠️ Login pelo Google indisponível:</strong><br />
                            O acesso por Google exige uma configuração que ainda não está pronta.
                            <br /><br />
                            <strong>✅ Use seu e-mail abaixo:</strong><br />
                            Você receberá um link de acesso direto na sua caixa de entrada.
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            if (showPassword && password) {
                                try {
                                    const trimmedEmail = email.trim();
                                    const trimmedPassword = password.trim();
                                    const { error } = await signInWithPassword(trimmedEmail, trimmedPassword);
                                    if (error) throw error;
                                    toast.success('✨ Bem-vindo de volta!');
                                } catch (err: any) {
                                    toast.error(`❌ Erro: ${err.message || 'Senha incorreta'}`);
                                }
                            } else {
                                try {
                                    const { error } = await signInWithEmail(email);
                                    if (error) throw error;
                                    toast.success('✨ Link enviado! Verifique seu e-mail.');
                                } catch (err: any) {
                                    if (err.status === 429) {
                                        toast.error('⚠️ Limite excedido. Tente usar uma senha!');
                                        if (email === 'barbeariadofelipe2020@gmail.com') setShowPassword(true);
                                    } else {
                                        toast.error(`❌ Erro: ${err.message || 'Falha ao enviar link'}`);
                                    }
                                }
                            }
                        }} className="space-y-3">
                            <input
                                name="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (e.target.value === 'barbeariadofelipe2020@gmail.com') {
                                        setShowPassword(true);
                                    } else {
                                        setShowPassword(false);
                                    }
                                }}
                                required
                                className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />

                            {showPassword && (
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={isPasswordVisible ? "text" : "password"}
                                        placeholder="Sua senha de admin"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all animate-in fade-in slide-in-from-top-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                                    >
                                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold transition-all"
                            >
                                {showPassword ? 'Entrar com Senha' : 'Receber Link de Acesso'}
                            </Button>

                            {showPassword && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { error } = await signInWithEmail(email);
                                            if (error) throw error;
                                            toast.success('✨ Link enviado! Verifique seu e-mail.');
                                        } catch (err: any) {
                                            toast.error(`❌ Erro: ${err.message || 'Falha ao enviar link'}`);
                                        }
                                    }}
                                    className="w-full text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium py-2"
                                >
                                    Ou prefiro entrar com Link Mágico
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        )
    }

    // Not admin
    if (!isAdmin) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center px-4 bg-gray-50/50">
                <div className="max-w-md w-full bg-white rounded-3xl border border-gray-100 p-8 shadow-xl shadow-gray-200/50 text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-2">
                        <XCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">Acesso Negado</h1>
                        <p className="text-gray-500 mt-2">O e-mail <strong>{user.email}</strong> não possui permissões de barbeiro.</p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={signOut}
                        className="w-full h-12 rounded-xl text-gray-500 font-medium hover:bg-gray-50"
                    >
                        Sair e entrar com outra conta
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen pt-24 pb-16 px-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Barbeiro</h1>
                    <p className="text-gray-500">Gerencie seus agendamentos e controle seus horários.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-sm text-gray-500">Hoje</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats.todayCount}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="text-sm text-gray-500">Confirmados</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats.confirmed}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <span className="text-sm text-gray-500">Realizados</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats.completed}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                <Users className="w-5 h-5 text-orange-500" />
                            </div>
                            <span className="text-sm text-gray-500">Total</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <DollarSign className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm text-emerald-50 font-medium">Ganhos de Hoje</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-medium text-emerald-100">R$</span>
                            <p className="text-3xl font-black">{stats.todayRevenue}</p>
                        </div>
                        <p className="text-[10px] text-emerald-100 mt-2 opacity-80 uppercase tracking-wider font-bold">
                            Total Previsto: R$ {stats.totalConfirmedRevenue}
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
                    <button
                        onClick={() => setActiveTab('agendamentos')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'agendamentos'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <LayoutList className="w-4 h-4" />
                        Agendamentos
                    </button>
                    <button
                        onClick={() => setActiveTab('horarios')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'horarios'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <TimerOff className="w-4 h-4" />
                        Controle de Horários
                    </button>
                    <button
                        onClick={() => setActiveTab('config')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'config'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Configurações
                    </button>
                    <button
                        onClick={() => setActiveTab('produtos')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'produtos'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <Package className="w-4 h-4" />
                        Produtos
                    </button>
                    <button
                        onClick={() => setActiveTab('financeiro')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'financeiro'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <DollarSign className="w-4 h-4" />
                        Financeiro
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'horarios' ? (
                    <ControleHorarios />
                ) : activeTab === 'config' ? (
                    <WhatsAppConfig />
                ) : activeTab === 'produtos' ? (
                    <GerenciarProdutos />
                ) : activeTab === 'financeiro' ? (
                    <Financeiro allAgendamentos={allAgendamentos} />
                ) : (
                    <>
                        {/* Filters */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Filter className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-500">Período:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {([
                                            ['hoje', 'Hoje'],
                                            ['amanha', 'Amanhã'],
                                            ['semana', 'Semana'],
                                            ['todos', 'Todos'],
                                        ] as const).map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() => setFilterPeriod(value)}
                                                className={[
                                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                    filterPeriod === value
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                ].join(' ')}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-500">Status:</span>
                                    <div className="flex gap-1 flex-wrap">
                                        {([
                                            ['todos', 'Todos'],
                                            ['confirmado', 'Confirmados'],
                                            ['realizado', 'Realizados'],
                                            ['cancelado', 'Cancelados'],
                                        ] as const).map(([value, label]) => (
                                            <button
                                                key={value}
                                                onClick={() => setFilterStatus(value)}
                                                className={[
                                                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                                    filterStatus === value
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                                ].join(' ')}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Appointments List */}
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 rounded-2xl" />
                                ))}
                            </div>
                        ) : filteredAgendamentos.length === 0 ? (
                            <div className="text-center py-16">
                                <CalendarOff className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-500 mb-1">Nenhum agendamento encontrado</h3>
                                <p className="text-gray-400 text-sm">Ajuste os filtros ou aguarde novos agendamentos.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredAgendamentos.map((agendamento) => {
                                    const dateTime = new Date(agendamento.data_hora)
                                    const isPassedTime = isPast(dateTime)
                                    const dayLabel = isToday(dateTime) ? 'Hoje' : isTomorrow(dateTime) ? 'Amanhã' : format(dateTime, "dd/MM", { locale: ptBR })

                                    return (
                                        <div
                                            key={agendamento.id}
                                            className={[
                                                'bg-white rounded-2xl border p-4 sm:p-5 shadow-sm transition-all',
                                                agendamento.status === 'cancelado' ? 'border-red-100 opacity-60' :
                                                    agendamento.status === 'realizado' ? 'border-green-100' :
                                                        isPassedTime ? 'border-amber-100' : 'border-gray-100'
                                            ].join(' ')}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    {/* Time badge */}
                                                    <div className={[
                                                        'w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0',
                                                        agendamento.status === 'cancelado' ? 'bg-red-50' :
                                                            agendamento.status === 'realizado' ? 'bg-green-50' :
                                                                'bg-emerald-50'
                                                    ].join(' ')}>
                                                        <span className="text-xs text-gray-400 font-medium">{dayLabel}</span>
                                                        <span className={[
                                                            'text-lg font-bold',
                                                            agendamento.status === 'cancelado' ? 'text-red-400' :
                                                                agendamento.status === 'realizado' ? 'text-green-500' :
                                                                    'text-emerald-500'
                                                        ].join(' ')}>
                                                            {format(dateTime, 'HH:mm')}
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Scissors className="w-4 h-4 text-gray-400" />
                                                            <h3 className="font-semibold text-gray-800">{agendamento.servico}</h3>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1">
                                                            <div className="flex items-center gap-1 text-sm text-gray-400">
                                                                <Phone className="w-3.5 h-3.5" />
                                                                <span>{agendamento.whatsapp}</span>
                                                            </div>
                                                            {agendamento.nome_cliente && (
                                                                <span className="text-sm text-gray-500">• {agendamento.nome_cliente}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-300 mt-1">
                                                            {format(dateTime, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                    <span className={[
                                                        'px-3 py-1 rounded-full text-xs font-medium capitalize',
                                                        agendamento.status === 'confirmado' ? 'bg-blue-100 text-blue-600' :
                                                            agendamento.status === 'realizado' ? 'bg-green-100 text-green-600' :
                                                                'bg-red-100 text-red-600'
                                                    ].join(' ')}>
                                                        {agendamento.status}
                                                    </span>

                                                    {agendamento.status === 'confirmado' && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleUpdateStatus(agendamento.id, 'realizado')}
                                                                className="bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs h-8"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                                                Concluir
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleWhatsAppReminder(agendamento)}
                                                                className="rounded-lg text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                            >
                                                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                                                Lembrete
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleUpdateStatus(agendamento.id, 'cancelado')}
                                                                className="rounded-lg text-xs h-8 text-red-500 border-red-200 hover:bg-red-50"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                                                Cancelar
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
