import { useState, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { useServicos } from '@/hooks/useServicos'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ControleHorarios } from '@/components/ControleHorarios'
import { WhatsAppConfig } from '@/components/WhatsAppConfig'
import { GerenciarProdutos } from '@/components/GerenciarProdutos'
import { ConfigurarServicos } from '@/components/ConfigurarServicos'
import { Financeiro } from '@/components/Financeiro'
import { useBlockedClients } from '@/hooks/useBlockedClients'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
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
    Settings2,
    Ban,
    Trash2,
    Search,
    UserX,
} from 'lucide-react'

type FilterStatus = 'todos' | 'confirmado' | 'cancelado' | 'realizado'
type FilterPeriod = 'hoje' | 'amanha' | 'semana' | 'todos'
type Tab = 'agendamentos' | 'clientes' | 'bloqueados' | 'horarios' | 'servicos' | 'config' | 'produtos' | 'financeiro'

export function Painel() {
    const { user, loading: authLoading, signInWithEmail, signInWithPassword, signOut } = useAuth()
    const { isAdmin, isCheckingAdmin, allAgendamentos, isLoading, updateStatus } = useAdmin()
    const { servicePrices } = useServicos()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('hoje')
    const [activeTab, setActiveTab] = useState<Tab>('agendamentos')

    // Blocked clients hook and states
    const { blockedClients, isLoading: isLoadingBlocked, blockClient, unblockClient } = useBlockedClients()
    const [blockingClient, setBlockingClient] = useState<{ whatsapp: string; nome: string } | null>(null)
    const [blockReason, setBlockReason] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [manualWhatsapp, setManualWhatsapp] = useState('')
    const [manualNome, setManualNome] = useState('')
    const [showManualBlockModal, setShowManualBlockModal] = useState(false)

    // Memoized unique clients list compiled from all appointments
    const uniqueClients = useMemo(() => {
        const clientMap = new Map<string, {
            whatsapp: string;
            nome: string;
            totalAgendamentos: number;
            ultimoAgendamento: string;
            status: 'ativo' | 'bloqueado';
            bloqueioId?: string;
            motivoBloqueio?: string;
        }>();

        allAgendamentos.forEach(a => {
            const cleanPhone = a.whatsapp.replace(/\D/g, '');
            if (!cleanPhone) return;

            const existing = clientMap.get(cleanPhone);
            const appointmentDate = new Date(a.data_hora);

            const isBlocked = blockedClients.some(bc => bc.whatsapp === cleanPhone);
            const bloqueio = blockedClients.find(bc => bc.whatsapp === cleanPhone);

            if (!existing) {
                clientMap.set(cleanPhone, {
                    whatsapp: a.whatsapp,
                    nome: a.nome_cliente || 'Sem nome',
                    totalAgendamentos: 1,
                    ultimoAgendamento: a.data_hora,
                    status: isBlocked ? 'bloqueado' : 'ativo',
                    bloqueioId: bloqueio?.id,
                    motivoBloqueio: bloqueio?.motivo || undefined
                });
            } else {
                existing.totalAgendamentos += 1;
                if (a.nome_cliente && (!existing.nome || existing.nome === 'Sem nome')) {
                    existing.nome = a.nome_cliente;
                }
                if (new Date(existing.ultimoAgendamento) < appointmentDate) {
                    existing.ultimoAgendamento = a.data_hora;
                    if (a.nome_cliente) {
                        existing.nome = a.nome_cliente;
                    }
                }
            }
        });

        return Array.from(clientMap.values()).sort((a, b) => b.totalAgendamentos - a.totalAgendamentos);
    }, [allAgendamentos, blockedClients]);

    // Search and filter clients
    const filteredClients = useMemo(() => {
        return uniqueClients.filter(c => {
            const query = searchTerm.toLowerCase();
            return (
                c.nome.toLowerCase().includes(query) ||
                c.whatsapp.includes(query)
            );
        });
    }, [uniqueClients, searchTerm]);

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
        const timeStr = dateTime.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        })
        const dateStr = dateTime.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            timeZone: 'America/Sao_Paulo'
        })

        const message = `Olá! 💈 Sou da Felipe Barbearia. Passando para confirmar seu horário de *${agendamento.servico}* no dia *${dateStr}* às *${timeStr}*. Estamos te esperando!`
        const phone = agendamento.whatsapp.replace(/\D/g, '')
        const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`

        window.open(whatsappUrl, '_blank')
    }

    const handleBlockClient = async (whatsapp: string, nome: string, motivo: string) => {
        try {
            await blockClient.mutateAsync({ whatsapp, nome, motivo })
            toast.success('🔒 Cliente bloqueado com sucesso!')
            setBlockingClient(null)
            setBlockReason('')
        } catch (error: any) {
            toast.error(error.message || '❌ Erro ao bloquear cliente.')
        }
    }

    const handleUnblockClient = async (id: string) => {
        try {
            await unblockClient.mutateAsync(id)
            toast.success('🔓 Cliente desbloqueado com sucesso!')
        } catch {
            toast.error('❌ Erro ao desbloquear cliente.')
        }
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
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel do Barbeiro</h1>
                        <p className="text-gray-500">Gerencie seus agendamentos e controle seus horários.</p>
                    </div>
                    <Button 
                        onClick={() => setActiveTab('servicos')}
                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 gap-2 h-12 px-6 transition-all hover:scale-105 active:scale-95"
                    >
                        <Scissors className="w-5 h-5" />
                        Ajustar Preços e Tempos
                    </Button>
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
                <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('agendamentos')}
                        className={[
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'agendamentos'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <LayoutList className="w-4 h-4" />
                        Agendamentos
                    </button>
                    <button
                        onClick={() => setActiveTab('clientes')}
                        className={[
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'clientes'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <Users className="w-4 h-4" />
                        Clientes
                    </button>
                    <button
                        onClick={() => setActiveTab('bloqueados')}
                        className={[
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'bloqueados'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <UserX className="w-4 h-4" />
                        Bloqueados
                    </button>
                    <button
                        onClick={() => setActiveTab('horarios')}
                        className={[
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
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
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'config'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Configurações
                    </button>
                    <button
                        onClick={() => setActiveTab('servicos')}
                        className={[
                            'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                            activeTab === 'servicos'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        ].join(' ')}
                    >
                        <Settings2 className="w-4 h-4" />
                        Serviços
                    </button>
                    <button
                        onClick={() => setActiveTab('produtos')}
                        className={[
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
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
                            'flex-1 min-w-max whitespace-nowrap flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300',
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
                ) : activeTab === 'servicos' ? (
                    <ConfigurarServicos />
                ) : activeTab === 'config' ? (
                    <WhatsAppConfig />
                ) : activeTab === 'produtos' ? (
                    <GerenciarProdutos />
                ) : activeTab === 'financeiro' ? (
                    <Financeiro allAgendamentos={allAgendamentos} servicePrices={servicePrices} />
                ) : activeTab === 'clientes' ? (
                    <div className="space-y-6">
                        {/* Search and Title */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Histórico de Clientes</h2>
                                <p className="text-sm text-gray-500">Lista de todos os clientes que já realizaram agendamento no sistema.</p>
                            </div>
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder="Buscar por nome ou WhatsApp..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-11 border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl"
                                />
                            </div>
                        </div>

                        {/* List */}
                        {isLoading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 rounded-2xl" />
                                ))}
                            </div>
                        ) : filteredClients.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-500 mb-1">Nenhum cliente encontrado</h3>
                                <p className="text-gray-400 text-sm">Tente buscar por outro nome ou número de telefone.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredClients.map((client) => {
                                    const rawPhone = client.whatsapp.replace(/\D/g, '')
                                    const chatUrl = `https://wa.me/55${rawPhone}`
                                    const formattedDate = format(new Date(client.ultimoAgendamento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

                                    return (
                                        <div
                                            key={client.whatsapp}
                                            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-gray-200 transition-all flex flex-col justify-between gap-4"
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Avatar */}
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                    client.status === 'bloqueado' ? 'bg-red-50 text-red-500' : 'bg-violet-50 text-violet-600'
                                                }`}>
                                                    <Users className="w-5 h-5" />
                                                </div>

                                                {/* Details */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="font-bold text-gray-800">{client.nome}</h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                            client.status === 'bloqueado'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {client.status === 'bloqueado' ? 'Bloqueado' : 'Ativo'}
                                                        </span>
                                                    </div>
                                                    <a
                                                        href={chatUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium"
                                                    >
                                                        <Phone className="w-3.5 h-3.5" />
                                                        <span>{client.whatsapp}</span>
                                                    </a>
                                                    <div className="text-xs text-gray-400 space-y-0.5 mt-2">
                                                        <p>Total de Agendamentos: <strong className="text-gray-700">{client.totalAgendamentos}</strong></p>
                                                        <p>Último em: {formattedDate}</p>
                                                        {client.motivoBloqueio && (
                                                            <p className="text-red-500 font-medium">Motivo: {client.motivoBloqueio}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                                                {client.status === 'bloqueado' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUnblockClient(client.bloqueioId!)}
                                                        className="text-xs rounded-xl h-9 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                                                    >
                                                        Desbloquear Cliente
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setBlockingClient({
                                                            whatsapp: client.whatsapp,
                                                            nome: client.nome
                                                        })}
                                                        className="text-xs rounded-xl h-9 text-red-600 border-red-100 hover:bg-red-50 hover:border-red-200"
                                                    >
                                                        <Ban className="w-3.5 h-3.5 mr-1" />
                                                        Bloquear Cliente
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'bloqueados' ? (
                    <div className="space-y-6">
                        {/* Title and Add Button */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Clientes Bloqueados</h2>
                                <p className="text-sm text-gray-500">Gerencie a lista de números impedidos de agendar no site.</p>
                            </div>
                            <Button
                                onClick={() => {
                                    setManualWhatsapp('')
                                    setManualNome('')
                                    setBlockReason('')
                                    setShowManualBlockModal(true)
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 gap-2 h-11 px-5 transition-all hover:scale-105 active:scale-95 text-sm shrink-0"
                            >
                                <Ban className="w-4 h-4" />
                                Bloquear Novo Número
                            </Button>
                        </div>

                        {/* List */}
                        {isLoadingBlocked ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <Skeleton key={i} className="h-20 rounded-2xl" />
                                ))}
                            </div>
                        ) : blockedClients.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <UserX className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-500 mb-1">Nenhum número bloqueado</h3>
                                <p className="text-gray-400 text-sm">Todos os seus clientes estão ativos e autorizados a agendar.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse font-sans">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Motivo do Bloqueio</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bloqueado em</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {blockedClients.map((client) => {
                                                const formattedDate = format(new Date(client.created_at), "dd/MM/yyyy", { locale: ptBR })
                                                const chatUrl = `https://wa.me/55${client.whatsapp.replace(/\D/g, '')}`

                                                return (
                                                    <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="p-4">
                                                            <div className="font-semibold text-gray-800">{client.nome || 'Sem Nome'}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <a
                                                                href={chatUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition-colors font-medium"
                                                            >
                                                                <Phone className="w-3.5 h-3.5" />
                                                                <span>{client.whatsapp}</span>
                                                            </a>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className="text-sm text-gray-600 italic">
                                                                {client.motivo || 'Nenhum motivo especificado'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-sm text-gray-400">
                                                            {formattedDate}
                                                        </td>
                                                        <td className="p-4 text-right text-xs">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleUnblockClient(client.id)}
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl px-3 h-9"
                                                            >
                                                                <Trash2 className="w-4 h-4 mr-1" />
                                                                Desbloquear
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
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
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setBlockingClient({
                                                                    whatsapp: agendamento.whatsapp,
                                                                    nome: agendamento.nome_cliente || ''
                                                                })}
                                                                className="rounded-lg text-xs h-8 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                                            >
                                                                <Ban className="w-3.5 h-3.5 mr-1" />
                                                                Bloquear
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

            {/* Modal de Bloqueio Rápido / Confirmação */}
            <Dialog open={blockingClient !== null} onOpenChange={(open) => !open && setBlockingClient(null)}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Ban className="w-5 h-5" />
                            Bloquear Cliente?
                        </DialogTitle>
                        <DialogDescription>
                            Isso impedirá que o cliente realize novos agendamentos no site pelo número de WhatsApp informado.
                        </DialogDescription>
                    </DialogHeader>

                    {blockingClient && (
                        <div className="space-y-4 py-3 font-sans">
                            <div className="bg-gray-50 p-4 rounded-xl space-y-1.5 text-sm text-gray-600 border border-gray-100">
                                <p><strong>Nome:</strong> {blockingClient.nome || 'Sem Nome'}</p>
                                <p><strong>WhatsApp:</strong> {blockingClient.whatsapp}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Motivo do Bloqueio (Opcional)
                                </label>
                                <Input
                                    placeholder="Ex: Faltou sem avisar, grosseria..."
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 justify-end mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setBlockingClient(null)
                                setBlockReason('')
                            }}
                            className="rounded-xl h-11 text-gray-500 font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                if (blockingClient) {
                                    handleBlockClient(blockingClient.whatsapp, blockingClient.nome, blockReason)
                                }
                            }}
                            disabled={blockClient.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-red-200"
                        >
                            {blockClient.isPending ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Bloqueio Manual */}
            <Dialog open={showManualBlockModal} onOpenChange={setShowManualBlockModal}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <Ban className="w-5 h-5" />
                            Bloquear Novo Número
                        </DialogTitle>
                        <DialogDescription>
                            Cadastre manualmente um número de WhatsApp que você deseja impedir de agendar no site.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-3 font-sans">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                WhatsApp (apenas números com DDD)
                            </label>
                            <Input
                                placeholder="Ex: 43999999999"
                                value={manualWhatsapp}
                                onChange={(e) => setManualWhatsapp(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Nome do Cliente (Opcional)
                            </label>
                            <Input
                                placeholder="Ex: João da Silva"
                                value={manualNome}
                                onChange={(e) => setManualNome(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Motivo do Bloqueio (Opcional)
                            </label>
                            <Input
                                placeholder="Ex: Cliente problemático, caloteiro..."
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setShowManualBlockModal(false)
                                setManualWhatsapp('')
                                setManualNome('')
                                setBlockReason('')
                            }}
                            className="rounded-xl h-11 text-gray-500 font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!manualWhatsapp.trim()) {
                                    toast.error('❌ Por favor, digite o número do WhatsApp.')
                                    return
                                }
                                try {
                                    await blockClient.mutateAsync({
                                        whatsapp: manualWhatsapp,
                                        nome: manualNome,
                                        motivo: blockReason
                                    })
                                    toast.success('🔒 Número bloqueado com sucesso!')
                                    setShowManualBlockModal(false)
                                    setManualWhatsapp('')
                                    setManualNome('')
                                    setBlockReason('')
                                } catch (error: any) {
                                    toast.error(error.message || '❌ Erro ao bloquear número.')
                                }
                            }}
                            disabled={blockClient.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-red-200"
                        >
                            {blockClient.isPending ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
