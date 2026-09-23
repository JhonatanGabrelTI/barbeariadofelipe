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
import { BARBEIROS, getBarbeiro } from '@/data/barbeiros'
import { supabase } from '@/lib/supabase'
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
import { format, isPast } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { addDaysToDateKey, formatBarbershopLongDateTime, formatBarbershopShortDate, formatBarbershopTime, getBarbershopDateKey } from '@/lib/time'
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
    Download,
    ArrowLeft,
} from 'lucide-react'

type FilterStatus = 'todos' | 'confirmado' | 'cancelado' | 'realizado'
type FilterPeriod = 'hoje' | 'amanha' | 'semana' | 'todos'
type Tab = 'agendamentos' | 'clientes' | 'bloqueados' | 'horarios' | 'servicos' | 'config' | 'produtos' | 'financeiro'

const BACKUP_PAGE_SIZE = 500

async function fetchAllBackupRows(table: 'agendamentos' | 'servicos' | 'produtos' | 'blocked_slots' | 'blocked_clients' | 'whatsapp_config' | 'admin_emails') {
    const rows: unknown[] = []

    for (let from = 0; ; from += BACKUP_PAGE_SIZE) {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order(table === 'admin_emails' ? 'email' : 'id', { ascending: true })
            .range(from, from + BACKUP_PAGE_SIZE - 1)

        if (error) throw new Error(`${table}: ${error.message}`)
        const page = data || []
        rows.push(...page)
        if (page.length < BACKUP_PAGE_SIZE) break
    }

    return rows
}

function previewAppointments() {
    const at = (dayOffset: number, hour: number, minute = 0) => {
        const date = new Date()
        date.setDate(date.getDate() + dayOffset)
        date.setHours(hour, minute, 0, 0)
        return date.toISOString()
    }

    return [
        { id: 'preview-1', barbeiro_id: BARBEIROS[0].id, nome_cliente: 'Lucas', whatsapp: '43999990001', servico: 'Corte de Cabelo', data_hora: at(0, 14), status: 'confirmado' },
        { id: 'preview-2', barbeiro_id: BARBEIROS[0].id, nome_cliente: 'Rafael', whatsapp: '43999990002', servico: 'Cabelo e Barba', data_hora: at(-1, 16), status: 'realizado' },
        { id: 'preview-3', barbeiro_id: BARBEIROS[1].id, nome_cliente: 'Mateus', whatsapp: '43999990003', servico: 'Barba Completa', data_hora: at(0, 15, 30), status: 'confirmado' },
        { id: 'preview-4', barbeiro_id: BARBEIROS[1].id, nome_cliente: 'João', whatsapp: '43999990004', servico: 'Cabelo e Sobrancelhas', data_hora: at(-2, 11), status: 'realizado' },
    ]
}

export function Painel() {
    const { user, loading: authLoading, signInWithEmail, signInWithPassword, signOut } = useAuth()
    const admin = useAdmin()
    const previewKey = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('preview') : null
    const isPreview = previewKey === 'felipe' || previewKey === 'eliabner'
    const previewMembers = BARBEIROS.map((barbeiro, index) => ({
        ...barbeiro,
        email: index === 0 ? 'barbeariadofelipe2020@gmail.com' : 'eliabnerbarbeiro@gmail.com',
        foto_url: barbeiro.foto,
        user_id: null,
        role: index === 0 ? 'dono' as const : 'barbeiro' as const,
        ativo: true,
    }))
    const previewStaff = previewKey === 'felipe' ? previewMembers[0] : previewKey === 'eliabner' ? previewMembers[1] : null
    const currentStaff = previewStaff || admin.currentStaff
    const isAdmin = isPreview || admin.isAdmin
    const isOwner = isPreview ? previewStaff?.role === 'dono' : admin.isOwner
    const isCheckingAdmin = isPreview ? false : admin.isCheckingAdmin
    const staffMembers = isPreview ? (isOwner ? previewMembers : [previewStaff!]) : admin.staffMembers
    const previewAll = previewAppointments()
    const allAgendamentos = isPreview
        ? (isOwner ? previewAll : previewAll.filter(a => a.barbeiro_id === previewStaff?.id))
        : admin.allAgendamentos
    const isLoading = isPreview ? false : admin.isLoading
    const updateStatus = admin.updateStatus
    const { servicePrices: savedServicePrices } = useServicos()
    const servicePrices = isPreview ? {
        'Corte de Cabelo': 35,
        'Barba Completa': 35,
        'Cabelo e Barba': 65,
        'Sobrancelhas': 15,
        'Cabelo e Sobrancelhas': 45,
        'Cabelo, Barba e Sobrancelhas': 75,
    } : savedServicePrices
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(true)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('hoje')
    const [activeTab, setActiveTab] = useState<Tab>('agendamentos')
    const [showHistoryModal, setShowHistoryModal] = useState(false)
    const [selectedHistoryMonth, setSelectedHistoryMonth] = useState('')
    const [isExportingBackup, setIsExportingBackup] = useState(false)
    const [selectedStaffId, setSelectedStaffId] = useState('')
    const managedStaffId = isOwner ? (selectedStaffId || currentStaff?.id || '') : (currentStaff?.id || '')
    const managedStaff = staffMembers.find(member => member.id === managedStaffId) || currentStaff

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

        const todayKey = getBarbershopDateKey(new Date())
        const tomorrowKey = addDaysToDateKey(todayKey, 1)
        const weekEndKey = addDaysToDateKey(todayKey, 7)

        if (filterPeriod === 'hoje') {
            filtered = filtered.filter(a => {
                return getBarbershopDateKey(a.data_hora) === todayKey
            })
        } else if (filterPeriod === 'amanha') {
            filtered = filtered.filter(a => {
                return getBarbershopDateKey(a.data_hora) === tomorrowKey
            })
        } else if (filterPeriod === 'semana') {
            filtered = filtered.filter(a => {
                const key = getBarbershopDateKey(a.data_hora)
                return key >= todayKey && key < weekEndKey
            })
        }

        return filtered
    }, [allAgendamentos, filterStatus, filterPeriod])

    const availableMonths = useMemo(() => {
        const months = new Set<string>()
        allAgendamentos.forEach(a => {
            months.add(getBarbershopDateKey(a.data_hora).slice(0, 7))
        })
        const currentMonth = getBarbershopDateKey(new Date()).slice(0, 7)
        months.add(currentMonth)
        return Array.from(months).sort().reverse()
    }, [allAgendamentos])

    const stats = useMemo(() => {
        const todayKey = getBarbershopDateKey(new Date())
        const todayAppointments = allAgendamentos.filter(a => {
            return getBarbershopDateKey(a.data_hora) === todayKey && a.status === 'confirmado'
        })
        const confirmed = allAgendamentos.filter(a => a.status === 'confirmado').length
        const completed = allAgendamentos.filter(a => a.status === 'realizado').length

        const todayRevenue = todayAppointments.reduce((acc, a) => {
            const price = servicePrices[a.servico] || 0
            return acc + price
        }, 0)

        const now = new Date()
        const startOfSelectedMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfSelectedMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

        const totalConfirmedRevenue = allAgendamentos
            .filter(a => a.status === 'confirmado' || a.status === 'realizado')
            .filter(a => {
                const d = new Date(a.data_hora)
                return d >= startOfSelectedMonth && d <= endOfSelectedMonth
            })
            .reduce((acc, a) => {
                const price = servicePrices[a.servico] || 0
                return acc + price
            }, 0)

        return { todayCount: todayAppointments.length, confirmed, completed, total: allAgendamentos.length, todayRevenue, totalConfirmedRevenue }
    }, [allAgendamentos, servicePrices])

    // Historico mensal
    const historyByMonth = useMemo(() => {
        return availableMonths.map(m => {
            const revenue = allAgendamentos
                .filter(a => (a.status === 'confirmado' || a.status === 'realizado') && getBarbershopDateKey(a.data_hora).startsWith(m))
                .reduce((acc, a) => acc + (servicePrices[a.servico] || 0), 0)
                
            const count = allAgendamentos.filter(a =>
                (a.status === 'confirmado' || a.status === 'realizado') && getBarbershopDateKey(a.data_hora).startsWith(m),
            ).length

            return { month: m, revenue, count }
        })
    }, [availableMonths, allAgendamentos, servicePrices])

    const activeHistoryMonth = selectedHistoryMonth || availableMonths[0] || ''
    const historyByDay = useMemo(() => {
        if (!activeHistoryMonth) return []

        const days = new Map<string, { revenue: number; count: number; byStaff: Map<string, { name: string; revenue: number; count: number }> }>()
        allAgendamentos
            .filter(a => (a.status === 'confirmado' || a.status === 'realizado') && getBarbershopDateKey(a.data_hora).startsWith(activeHistoryMonth))
            .forEach(a => {
                const day = getBarbershopDateKey(a.data_hora)
                const price = servicePrices[a.servico] || 0
                const staff = staffMembers.find(member => member.id === a.barbeiro_id)
                const staffName = staff?.nome || getBarbeiro(a.barbeiro_id)?.nome || 'Barbeiro'
                const currentDay = days.get(day) || { revenue: 0, count: 0, byStaff: new Map() }
                const currentStaff = currentDay.byStaff.get(a.barbeiro_id) || { name: staffName, revenue: 0, count: 0 }

                currentDay.revenue += price
                currentDay.count += 1
                currentStaff.revenue += price
                currentStaff.count += 1
                currentDay.byStaff.set(a.barbeiro_id, currentStaff)
                days.set(day, currentDay)
            })

        return Array.from(days.entries())
            .sort(([dayA], [dayB]) => dayB.localeCompare(dayA))
            .map(([day, data]) => ({ day, ...data, byStaff: Array.from(data.byStaff.values()).sort((a, b) => b.revenue - a.revenue) }))
    }, [activeHistoryMonth, allAgendamentos, servicePrices, staffMembers])

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    const handleUpdateStatus = async (id: string, status: string) => {
        if (isPreview) {
            toast.info('Prévia local: nenhuma informação real foi alterada.')
            return
        }
        try {
            await updateStatus.mutateAsync({ id, status })
            const label = status === 'realizado' ? 'concluído' : status === 'cancelado' ? 'cancelado' : 'confirmado'
            toast.success(`✅ Agendamento ${label}!`)
        } catch {
            toast.error('❌ Erro ao atualizar status.')
        }
    }

    const handleExportBackup = async () => {
        if (!isOwner || isPreview) return
        setIsExportingBackup(true)
        try {
            const tableNames = [
                'agendamentos',
                'servicos',
                'produtos',
                'blocked_slots',
                'blocked_clients',
                'whatsapp_config',
                'admin_emails',
            ] as const
            const backup: Record<string, unknown> = {
                exported_at: new Date().toISOString(),
                source: 'felipe-barbearia-owner-panel',
            }

            for (const table of tableNames) {
                backup[table] = await fetchAllBackupRows(table)
            }

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const anchor = document.createElement('a')
            anchor.href = url
            anchor.download = `barbearia-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
            document.body.appendChild(anchor)
            anchor.click()
            anchor.remove()
            URL.revokeObjectURL(url)
            toast.success('✅ Backup completo baixado com sucesso!')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Falha desconhecida'
            toast.error('❌ Não foi possível exportar o backup.', { description: message })
        } finally {
            setIsExportingBackup(false)
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
        const motivoNormalizado = motivo.trim()
        if (!motivoNormalizado) {
            toast.error('❌ Informe obrigatoriamente o motivo do bloqueio.')
            return
        }
        try {
            await blockClient.mutateAsync({ whatsapp, nome, motivo: motivoNormalizado })
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
    if ((!isPreview && authLoading) || isCheckingAdmin) {
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
    if (!user && !isPreview) {
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
                            <strong>🔐 Acesso dos barbeiros</strong><br />
                            Entre com o e-mail e a senha cadastrados para o seu painel.
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
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full h-12 rounded-xl border border-gray-100 bg-gray-50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                            />

                            {showPassword && (
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={isPasswordVisible ? "text" : "password"}
                                        placeholder="Sua senha"
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
                        <p className="text-gray-500 mt-2">O e-mail <strong>{user?.email}</strong> não possui permissões de barbeiro.</p>
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
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel de {currentStaff?.nome || 'Barbeiro'}</h1>
                        <p className="text-gray-500">
                            {isOwner ? 'Visão completa da barbearia e dos dois profissionais.' : 'Seus agendamentos, horários e financeiro.'}
                        </p>
                    </div>
                    {isOwner && (
                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={handleExportBackup}
                                disabled={isExportingBackup || isPreview}
                                className="border-violet-200 text-violet-700 hover:bg-violet-50 font-bold rounded-xl gap-2 h-12 px-6"
                            >
                                <Download className="w-5 h-5" />
                                {isExportingBackup ? 'Gerando backup...' : 'Exportar backup'}
                            </Button>
                            <Button
                                onClick={() => setActiveTab('servicos')}
                                className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 gap-2 h-12 px-6 transition-all hover:scale-105 active:scale-95"
                            >
                                <Scissors className="w-5 h-5" />
                                Ajustar Preços e Tempos
                            </Button>
                        </div>
                    )}
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
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 text-white flex flex-col justify-between">
                        <div>
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
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-emerald-400/30">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-100 opacity-90 uppercase tracking-wider font-bold">Total Previsto</span>
                                <span className="text-sm font-bold text-white">R$ {stats.totalConfirmedRevenue}</span>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="bg-white/10 hover:bg-white/20 text-emerald-50 text-[10px] font-bold border border-white/20 rounded-lg px-3 py-1.5 outline-none transition-all active:scale-95 uppercase tracking-wider"
                            >
                                Ver Histórico
                            </button>
                        </div>
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
                    {isOwner && <button
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
                    </button>}
                    {isOwner && <button
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
                    </button>}
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
                    {isOwner && <button
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
                    </button>}
                    {isOwner && <button
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
                    </button>}
                    {isOwner && <button
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
                    </button>}
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
                    <div className="space-y-4">
                        {isOwner && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-wrap items-center gap-3">
                                <span className="text-sm font-bold text-gray-700">Agenda de:</span>
                                {staffMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedStaffId(member.id)}
                                        className={[
                                            'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                                            managedStaffId === member.id
                                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        ].join(' ')}
                                    >
                                        {member.nome}
                                    </button>
                                ))}
                            </div>
                        )}
                        {managedStaffId && (
                            <ControleHorarios
                                barbeiroId={managedStaffId}
                                barbeiroNome={managedStaff?.nome}
                                agendamentos={allAgendamentos}
                            />
                        )}
                    </div>
                ) : activeTab === 'servicos' ? (
                    <ConfigurarServicos />
                ) : activeTab === 'config' ? (
                    <WhatsAppConfig />
                ) : activeTab === 'produtos' ? (
                    <GerenciarProdutos />
                ) : activeTab === 'financeiro' ? (
                    isOwner ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {staffMembers.map(member => (
                                <div key={member.id} className="bg-gray-50/60 rounded-3xl border border-gray-100 p-4">
                                    <Financeiro
                                        title={`Financeiro de ${member.nome}`}
                                        compact
                                        allAgendamentos={allAgendamentos.filter(a => a.barbeiro_id === member.id)}
                                        servicePrices={servicePrices}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Financeiro
                            title={`Financeiro de ${currentStaff?.nome || 'Barbeiro'}`}
                            allAgendamentos={allAgendamentos}
                            servicePrices={servicePrices}
                            revenueShare={currentStaff?.id === BARBEIROS[1].id ? 0.5 : 1}
                        />
                    )
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

                                            {/* Action Buttons */}
                                            <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 flex-wrap">
                                                {/* WhatsApp re-engagement button */}
                                                <a
                                                    href={(() => {
                                                        const firstName = client.nome.split(' ')[0]
                                                        const msg = `Olá, ${firstName}! 😊 Faz um tempinho que você não aparece aqui na *Felipe Barbearia*. Tá precisando dar um trato no visual? 💈\n\nQuando quiser, é só marcar seu horário pelo nosso site e garantir sua vaga:\n👉 https://barbeariadofelipe.vercel.app/agendar\n\nTe esperamos por aqui! 🫡`
                                                        return `https://wa.me/55${rawPhone}?text=${encodeURIComponent(msg)}`
                                                    })()}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs rounded-xl h-9 px-3 font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-sm shadow-emerald-200"
                                                >
                                                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.532 5.855L.057 23.617a.75.75 0 0 0 .92.919l5.934-1.453A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.706 9.706 0 0 1-4.997-1.385l-.36-.214-3.717.91.944-3.626-.234-.374A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                                                    </svg>
                                                    Chamar Cliente
                                                </a>

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
                                    const appointmentDateKey = getBarbershopDateKey(dateTime)
                                    const todayKey = getBarbershopDateKey(new Date())
                                    const dayLabel = appointmentDateKey === todayKey
                                        ? 'Hoje'
                                        : appointmentDateKey === addDaysToDateKey(todayKey, 1)
                                            ? 'Amanhã'
                                            : formatBarbershopShortDate(dateTime)

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
                                                            {formatBarbershopTime(dateTime)}
                                                        </span>
                                                    </div>

                                                    {/* Info */}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Scissors className="w-4 h-4 text-gray-400" />
                                                            <h3 className="font-semibold text-gray-800">{agendamento.servico}</h3>
                                                            {isOwner && (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                                                    {staffMembers.find(member => member.id === agendamento.barbeiro_id)?.nome || getBarbeiro(agendamento.barbeiro_id)?.nome || 'Barbeiro'}
                                                                </span>
                                                            )}
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
                                                            {formatBarbershopLongDateTime(dateTime)}
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
                                    Motivo do Bloqueio *
                                </label>
                                <Input
                                    placeholder="Ex: Faltou sem avisar, grosseria..."
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    required
                                    maxLength={200}
                                    aria-required="true"
                                    className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                                />
                                <p className="text-xs text-gray-400">Obrigatório · {blockReason.trim().length}/200 caracteres</p>
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
                            disabled={blockClient.isPending || !blockReason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl h-11 px-5 shadow-lg shadow-red-200"
                        >
                            {blockClient.isPending ? 'Bloqueando...' : 'Confirmar Bloqueio'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Histórico de Ganhos Previstos */}
            <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
                <DialogContent className="sm:max-w-2xl rounded-2xl bg-white border border-gray-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            {selectedHistoryMonth && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedHistoryMonth('')}
                                    className="p-1 rounded-lg hover:bg-emerald-50"
                                    aria-label="Voltar para os meses"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <DollarSign className="w-5 h-5" />
                            {selectedHistoryMonth ? 'Histórico diário' : 'Histórico de Ganhos Previstos'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedHistoryMonth
                                ? 'Veja o valor de cada dia e a divisão por barbeiro.'
                                : 'Escolha um mês para ver os valores de cada dia.'}
                        </DialogDescription>
                    </DialogHeader>
                    {!selectedHistoryMonth ? (
                        <div className="max-h-72 overflow-y-auto pr-2 space-y-2 mt-2">
                            {historyByMonth.map(item => {
                                const [y, mo] = item.month.split('-')
                                const date = new Date(Number(y), Number(mo) - 1)
                                const monthName = format(date, 'MMMM yyyy', { locale: ptBR })
                                return (
                                    <button
                                        type="button"
                                        key={item.month}
                                        onClick={() => setSelectedHistoryMonth(item.month)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <span>
                                            <span className="block text-sm font-semibold text-gray-700 capitalize">{monthName}</span>
                                            <span className="block text-xs text-gray-400">{item.count} atendimento(s)</span>
                                        </span>
                                        <span className="text-sm font-bold text-emerald-600">R$ {formatCurrency(item.revenue)}</span>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="max-h-[28rem] overflow-y-auto pr-2 space-y-3 mt-2">
                            {historyByDay.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-8">Nenhum atendimento previsto neste mês.</p>
                            ) : historyByDay.map(item => (
                                <div key={item.day} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800">{format(new Date(`${item.day}T12:00:00`), "dd 'de' MMMM", { locale: ptBR })}</p>
                                            <p className="text-xs text-gray-400">{item.count} atendimento(s)</p>
                                        </div>
                                        <span className="text-base font-black text-emerald-600">R$ {formatCurrency(item.revenue)}</span>
                                    </div>
                                    <div className="space-y-2 border-t border-gray-200/70 pt-3">
                                        {item.byStaff.map(staff => (
                                            <div key={staff.name} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">{staff.name} <span className="text-xs text-gray-400">({staff.count}x)</span></span>
                                                <span className="font-bold text-gray-700">R$ {formatCurrency(staff.revenue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex justify-end mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowHistoryModal(false)}
                            className="rounded-xl font-medium hover:bg-gray-50"
                        >
                            Fechar
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
                                Motivo do Bloqueio *
                            </label>
                            <Input
                                placeholder="Ex: Cliente problemático, caloteiro..."
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                required
                                maxLength={200}
                                aria-required="true"
                                className="h-11 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500"
                            />
                            <p className="text-xs text-gray-400">Obrigatório · {blockReason.trim().length}/200 caracteres</p>
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
                                if (!blockReason.trim()) {
                                    toast.error('❌ Informe obrigatoriamente o motivo do bloqueio.')
                                    return
                                }
                                try {
                                    await blockClient.mutateAsync({
                                        whatsapp: manualWhatsapp,
                                        nome: manualNome,
                                        motivo: blockReason.trim()
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
                            disabled={blockClient.isPending || !manualWhatsapp.trim() || !blockReason.trim()}
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
