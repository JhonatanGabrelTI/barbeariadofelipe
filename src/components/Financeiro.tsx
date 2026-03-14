import { useMemo, useState } from 'react'
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Scissors,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
} from 'lucide-react'
import { format, startOfDay, startOfWeek, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const servicePrices: Record<string, number> = {
    'Corte de Cabelo': 35,
    'Barba Completa': 35,
    'Cabelo e Barba': 65,
    'Sobrancelhas': 15,
    'Cabelo e Sobrancelhas': 45,
    'Cabelo, Barba e Sobrancelhas': 75,
}

type Period = 'hoje' | 'semana' | 'mes'

interface FinanceiroProps {
    allAgendamentos: any[]
}

export function Financeiro({ allAgendamentos }: FinanceiroProps) {
    const [period, setPeriod] = useState<Period>('hoje')

    const finance = useMemo(() => {
        const now = new Date()
        const today = startOfDay(now)
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        const lastMonthStart = startOfMonth(subMonths(now, 1))
        const lastMonthEnd = endOfMonth(subMonths(now, 1))

        // Only count completed or confirmed
        const valid = allAgendamentos.filter(a => a.status === 'confirmado' || a.status === 'realizado')

        const getRevenue = (items: any[]) =>
            items.reduce((acc: number, a: any) => acc + (servicePrices[a.servico] || 0), 0)

        // Today's data
        const todayItems = valid.filter(a => {
            const d = startOfDay(new Date(a.data_hora))
            return d.getTime() === today.getTime()
        })

        // This week
        const weekItems = valid.filter(a => {
            const d = new Date(a.data_hora)
            return d >= weekStart && d <= now
        })

        // This month
        const monthItems = valid.filter(a => {
            const d = new Date(a.data_hora)
            return isWithinInterval(d, { start: monthStart, end: monthEnd })
        })

        // Last month (for comparison)
        const lastMonthItems = valid.filter(a => {
            const d = new Date(a.data_hora)
            return isWithinInterval(d, { start: lastMonthStart, end: lastMonthEnd })
        })

        const todayRevenue = getRevenue(todayItems)
        const weekRevenue = getRevenue(weekItems)
        const monthRevenue = getRevenue(monthItems)
        const lastMonthRevenue = getRevenue(lastMonthItems)

        // Growth percentage for the month
        const monthGrowth = lastMonthRevenue > 0
            ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 0

        // Current period items based on selector
        const currentItems = period === 'hoje' ? todayItems : period === 'semana' ? weekItems : monthItems
        const currentRevenue = period === 'hoje' ? todayRevenue : period === 'semana' ? weekRevenue : monthRevenue
        const currentCount = currentItems.length

        // Average ticket
        const avgTicket = currentCount > 0 ? Math.round(currentRevenue / currentCount) : 0

        // Most popular service
        const serviceCount: Record<string, number> = {}
        currentItems.forEach((a: any) => {
            serviceCount[a.servico] = (serviceCount[a.servico] || 0) + 1
        })
        const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]

        // Revenue by service (for the chart-like display)
        const revenueByService = Object.entries(
            currentItems.reduce((acc: Record<string, { count: number; revenue: number }>, a: any) => {
                const name = a.servico
                if (!acc[name]) acc[name] = { count: 0, revenue: 0 }
                acc[name].count++
                acc[name].revenue += servicePrices[name] || 0
                return acc
            }, {})
        ).sort((a, b) => b[1].revenue - a[1].revenue)

        // Recent completed appointments (max 8)
        const recentCompleted = [...currentItems]
            .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())
            .slice(0, 8)

        return {
            todayRevenue,
            weekRevenue,
            monthRevenue,
            monthGrowth,
            currentRevenue,
            currentCount,
            avgTicket,
            topService,
            revenueByService,
            recentCompleted,
        }
    }, [allAgendamentos, period])

    const periodLabels: Record<Period, string> = {
        hoje: 'Hoje',
        semana: 'Esta Semana',
        mes: 'Este Mês',
    }

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">💰 Financeiro</h2>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                    {(['hoje', 'semana', 'mes'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={[
                                'px-4 py-2 rounded-lg text-xs font-bold transition-all',
                                period === p
                                    ? 'bg-white text-gray-800 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700',
                            ].join(' ')}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-5 shadow-lg shadow-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <DollarSign className="w-5 h-5 text-emerald-100" />
                        <span className="text-xs text-emerald-100 font-bold uppercase tracking-wider">Faturamento</span>
                    </div>
                    <p className="text-3xl font-black">R$ {finance.currentRevenue}</p>
                    <p className="text-[10px] text-emerald-200 mt-1">{periodLabels[period]}</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <Scissors className="w-5 h-5 text-blue-500" />
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Atendimentos</span>
                    </div>
                    <p className="text-3xl font-black text-gray-800">{finance.currentCount}</p>
                    <p className="text-[10px] text-gray-400 mt-1">serviços realizados</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-purple-500" />
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ticket Médio</span>
                    </div>
                    <p className="text-3xl font-black text-gray-800">R$ {finance.avgTicket}</p>
                    <p className="text-[10px] text-gray-400 mt-1">por atendimento</p>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mês</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-gray-800">R$ {finance.monthRevenue}</p>
                    </div>
                    {finance.monthGrowth !== 0 && (
                        <div className={[
                            'flex items-center gap-1 mt-1 text-[10px] font-bold',
                            finance.monthGrowth > 0 ? 'text-emerald-500' : 'text-red-500',
                        ].join(' ')}>
                            {finance.monthGrowth > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {Math.abs(finance.monthGrowth)}% vs mês anterior
                        </div>
                    )}
                </div>
            </div>

            {/* Revenue by Service */}
            {finance.revenueByService.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">📊 Faturamento por Serviço</h3>
                    <div className="space-y-3">
                        {finance.revenueByService.map(([name, data]) => {
                            const maxRevenue = finance.revenueByService[0][1].revenue
                            const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                            return (
                                <div key={name}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700">{name}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">{data.count}x</span>
                                            <span className="text-sm font-bold text-emerald-600">R$ {data.revenue}</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-700"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">Hoje</p>
                    <p className="text-2xl font-black text-emerald-700">R$ {finance.todayRevenue}</p>
                </div>
                <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Esta Semana</p>
                    <p className="text-2xl font-black text-blue-700">R$ {finance.weekRevenue}</p>
                </div>
                <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100">
                    <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-1">Este Mês</p>
                    <p className="text-2xl font-black text-purple-700">R$ {finance.monthRevenue}</p>
                </div>
            </div>

            {/* Most Popular Service */}
            {finance.topService && (
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Serviço Mais Pedido</p>
                            <p className="text-lg font-bold text-amber-800">{finance.topService[0]}</p>
                            <p className="text-xs text-amber-500">{finance.topService[1]} atendimento(s) no período</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Transactions */}
            {finance.recentCompleted.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-700 mb-4">🕐 Últimos Atendimentos</h3>
                    <div className="space-y-3">
                        {finance.recentCompleted.map((a: any, i: number) => {
                            const price = servicePrices[a.servico] || 0
                            const dt = new Date(a.data_hora)
                            return (
                                <div
                                    key={a.id || i}
                                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                            <Scissors className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{a.servico}</p>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                                <Calendar className="w-3 h-3" />
                                                {format(dt, "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                {a.nome_cliente && (
                                                    <span className="text-gray-300">• {a.nome_cliente}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600">+R$ {price}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {finance.currentCount === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <DollarSign className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-500 mb-2">Nenhum atendimento nesse período</h3>
                    <p className="text-sm text-gray-400">Os dados financeiros aparecerão quando houver agendamentos confirmados ou realizados.</p>
                </div>
            )}
        </div>
    )
}
