import { Coffee, ShoppingBag, Check, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProdutos } from '@/hooks/useProdutos'

const categoryLabels: Record<string, string> = {
    bebida: 'Bebidas & Cafés',
    cabelo: 'Produtos para Cabelo',
    barba: 'Produtos para Barba',
    geral: 'Outros Produtos',
}

const categoryIcons: Record<string, typeof Coffee> = {
    bebida: Coffee,
    cabelo: ShoppingBag,
    barba: ShoppingBag,
    geral: Package,
}

export function Produtos() {
    const { produtos, isLoading } = useProdutos()

    // Only show active products with stock
    const activeProducts = produtos.filter(p => p.ativo)

    const grouped = Object.entries(
        activeProducts.reduce((acc, p) => {
            if (!acc[p.categoria]) acc[p.categoria] = []
            acc[p.categoria].push(p)
            return acc
        }, {} as Record<string, typeof activeProducts>)
    )

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">Produtos & Bebidas</h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Aproveite nossa seleção exclusiva de produtos para cuidar do seu visual em casa e nossas bebidas premium enquanto aguarda.
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-40 rounded-2xl" />
                        ))}
                    </div>
                ) : activeProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <Package className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-500 mb-2">Em breve!</h3>
                        <p className="text-gray-400">Estamos preparando nossa vitrine de produtos. Volte em breve!</p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {grouped.map(([categoria, items]) => {
                            const Icon = categoryIcons[categoria] || Package
                            return (
                                <section key={categoria}>
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                                            <Icon className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {categoryLabels[categoria] || categoria}
                                        </h2>
                                    </div>

                                    {categoria === 'bebida' ? (
                                        /* Compact card layout for drinks */
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {items.map(item => (
                                                <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-bold text-gray-800">{item.nome}</h3>
                                                        <span className="text-emerald-500 font-bold">
                                                            R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                    {item.descricao && (
                                                        <p className="text-xs text-gray-400 mb-2">{item.descricao}</p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className={[
                                                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                            item.estoque > 0
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-red-50 text-red-500',
                                                        ].join(' ')}>
                                                            {item.estoque > 0 ? 'Disponível' : 'Indisponível'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Larger card layout for care products */
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {items.map(item => (
                                                <div key={item.id} className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500">
                                                    <div className="bg-gradient-to-br from-gray-900 to-gray-700 p-8 flex items-center justify-center aspect-[16/9]">
                                                        <ShoppingBag className="w-16 h-16 text-white/30" />
                                                    </div>
                                                    <div className="p-8">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.nome}</h3>
                                                            <span className="text-xl font-black text-emerald-500">
                                                                R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                                            </span>
                                                        </div>
                                                        {item.descricao && (
                                                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">{item.descricao}</p>
                                                        )}
                                                        <ul className="space-y-2 mb-6">
                                                            <li className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                                                <Check className="w-3 h-3" /> Uso Profissional
                                                            </li>
                                                            {item.estoque > 0 && (
                                                                <li className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 w-fit px-3 py-1 rounded-full">
                                                                    <Check className="w-3 h-3" /> {item.estoque} em estoque
                                                                </li>
                                                            )}
                                                        </ul>
                                                        <Button className="w-full h-12 bg-gray-900 border-2 border-gray-900 text-white rounded-xl font-bold group-hover:bg-transparent group-hover:text-gray-900 transition-all duration-300">
                                                            Adquirir na Barbearia
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )
                        })}
                    </div>
                )}

                {/* Footer CTA */}
                <div className="mt-20 bg-emerald-500 rounded-[2.5rem] p-10 text-white text-center relative overflow-hidden shadow-2xl shadow-emerald-500/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4 text-emerald-50">Gostou de algum produto?</h3>
                        <p className="text-emerald-50 mb-8 max-w-xl mx-auto">
                            Consulte a disponibilidade em estoque no dia do seu atendimento ou peça diretamente para o seu barbeiro.
                        </p>
                        <Button className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 h-14 rounded-2xl font-black text-lg shadow-xl shadow-black/10">
                            Falar no WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
