import { useMemo, useState } from 'react'
import {
    DollarSign,
    TrendingUp,
    Calendar,
    Scissors,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
    CheckCircle2,
    Clock3,
    ReceiptText,
} from 'lucide-react'
import { format, startOfDay, startOfWeek, startOfMonth, endOfMonth, isWithinInterval, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface FinanceiroProps {
    allAgendamentos: any[]
    servicePrices: Record<string, number>
    title?: string
    compact?: boolean
    revenueShare?: number
}

type Period = 'hoje' | 'semana' | 'mes'

export function Financeiro({
    allAgendamentos,
    servicePrices,
    title = 'Financeiro',
    compact = false,
    revenueShare = 1,
}: FinanceiroProps) {
    const [period, setPeriod] = useState<Period>('hoje')
    const effectiveShare = Math.min(1, Math.max(0, revenueShare))
    const isCommissionView = effectiveShare < 1
    const formatMoney = (value: number) => value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

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
            items.reduce((acc: number, a: any) => acc + (servicePrices[a.servico] || 0) * effectiveShare, 0)

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
        const avgTicket = currentCount > 0 ? currentRevenue / currentCount : 0

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
                acc[name].revenue += (servicePrices[name] || 0) * effectiveShare
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
    }, [allAgendamentos, effectiveShare, period, servicePrices])

    const periodLabels: Record<Period, string> = {
        hoje: 'Hoje',
        semana: 'Esta Semana',
        mes: 'Este Mês',
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-4 rounded-3xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                        <ReceiptText className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Resumo financeiro</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight">{title}</h2>
                        <p className="mt-1 text-xs text-slate-300">Valores de atendimentos confirmados ou realizados.</p>
                    </div>
                </div>
                <div className="flex rounded-2xl border border-white/10 bg-white/10 p-1 backdrop-blur-sm">
                    {(['hoje', 'semana', 'mes'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={[
                                'flex-1 rounded-xl px-3 py-2.5 text-xs font-bold transition-all sm:px-5',
                                period === p
                                    ? 'bg-white text-slate-900 shadow-sm'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white',
                            ].join(' ')}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
            </div>

            <div className={`grid grid-cols-2 ${compact ? '' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
                <div className="col-span-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/15 sm:col-span-1 lg:col-span-1">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-50">{isCommissionView ? 'Seu líquido' : 'Faturamento'}</span>
                        <DollarSign className="h-5 w-5 text-emerald-100" />
                    </div>
                    <p className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">R$ {formatMoney(finance.currentRevenue)}</p>
                    <p className="mt-1 text-xs text-emerald-100">{periodLabels[period]}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atendimentos</span>
                        <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{finance.currentCount}</p>
                    <p className="mt-1 text-xs text-slate-400">no período</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Ticket médio</span>
                        <BarChart3 className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">R$ {formatMoney(finance.avgTicket)}</p>
                    <p className="mt-1 text-xs text-slate-400">por atendimento</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Este mês</span>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <p className="mt-5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">R$ {formatMoney(finance.monthRevenue)}</p>
                    {finance.monthGrowth !== 0 ? (
                        <div className={['mt-1 flex items-center gap-1 text-xs font-bold', finance.monthGrowth > 0 ? 'text-emerald-600' : 'text-red-500'].join(' ')}>
                            {finance.monthGrowth > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                            {Math.abs(finance.monthGrowth)}% vs. mês anterior
                        </div>
                    ) : <p className="mt-1 text-xs text-slate-400">comparativo mensal</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                {finance.revenueByService.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-start justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600">Desempenho</p>
                                <h3 className="mt-1 text-base font-black text-slate-900">{isCommissionView ? 'Lucro por serviço' : 'Faturamento por serviço'}</h3>
                            </div>
                            <Scissors className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="space-y-4">
                            {finance.revenueByService.map(([name, data]) => {
                                const maxRevenue = finance.revenueByService[0][1].revenue
                                const percentage = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0
                                return (
                                    <div key={name}>
                                        <div className="mb-1.5 flex items-center justify-between gap-3">
                                            <span className="truncate text-sm font-semibold text-slate-700">{name}</span>
                                            <span className="shrink-0 text-sm font-black text-emerald-600">R$ {formatMoney(data.revenue)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700" style={{ width: `${percentage}%` }} />
                                            </div>
                                            <span className="w-8 text-right text-[11px] font-bold text-slate-400">{data.count}x</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-500">Visão rápida</p>
                            <h3 className="mt-1 text-base font-black text-slate-900">Evolução do caixa</h3>
                        </div>
                        <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: 'Hoje', value: finance.todayRevenue, color: 'text-emerald-700', bg: 'bg-emerald-100' },
                            { label: 'Esta semana', value: finance.weekRevenue, color: 'text-blue-700', bg: 'bg-blue-100' },
                            { label: 'Este mês', value: finance.monthRevenue, color: 'text-slate-900', bg: 'bg-slate-200' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <span className={`h-2.5 w-2.5 rounded-full ${item.bg}`} />
                                    <span className="text-sm font-semibold text-slate-600">{item.label}</span>
                                </div>
                                <span className={`text-sm font-black ${item.color}`}>R$ {formatMoney(item.value)}</span>
                            </div>
                        ))}
                    </div>
                    {finance.topService && (
                        <div className="mt-4 flex items-center gap-3 border-t border-slate-200 pt-4">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Scissors className="h-4 w-4" /></div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mais pedido</p>
                                <p className="truncate text-sm font-bold text-slate-800">{finance.topService[0]}</p>
                            </div>
                            <span className="ml-auto shrink-0 text-xs font-bold text-slate-400">{finance.topService[1]}x</span>
                        </div>
                    )}
                </div>
            </div>

            {finance.recentCompleted.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Movimentações</p>
                            <h3 className="mt-1 text-base font-black text-slate-900">Últimos atendimentos</h3>
                        </div>
                        <Clock3 className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="divide-y divide-slate-100">
                        {finance.recentCompleted.map((a: any, i: number) => {
                            const price = (servicePrices[a.servico] || 0) * effectiveShare
                            const dt = new Date(a.data_hora)
                            return (
                                <div key={a.id || i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Scissors className="h-4 w-4" /></div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-slate-800">{a.servico}</p>
                                            <p className="flex items-center gap-1.5 truncate text-[11px] text-slate-400"><Calendar className="h-3 w-3 shrink-0" />{format(dt, "dd/MM 'às' HH:mm", { locale: ptBR })}{a.nome_cliente ? ` · ${a.nome_cliente}` : ''}</p>
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-black text-emerald-600">+R$ {formatMoney(price)}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {finance.currentCount === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm"><DollarSign className="h-7 w-7" /></div>
                    <h3 className="mt-4 text-base font-black text-slate-600">Nenhum atendimento nesse período</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">Os valores aparecerão aqui quando houver agendamentos confirmados ou realizados.</p>
                </div>
            )}
        </div>
    )
}
