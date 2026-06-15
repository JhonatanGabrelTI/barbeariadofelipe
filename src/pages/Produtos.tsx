import { useEffect, useRef } from 'react'
import { Coffee, ShoppingBag, Check, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useProdutos } from '@/hooks/useProdutos'
import { IS_SAO_JOAO } from '../config'

const categoryLabels: Record<string, string> = {
    bebida: 'Bebidas & Cafés',
    cabelo: 'Produtos para Cabelo',
    barba: 'Produtos para Barba',
    geral: 'Outros Produtos',
}

const WHATSAPP_NUMBER = '5543998648935'

const categoryIcons: Record<string, typeof Coffee> = {
    bebida: Coffee,
    cabelo: ShoppingBag,
    barba: ShoppingBag,
    geral: Package,
}

export function Produtos() {
    const { produtos, isLoading } = useProdutos()
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleWhatsAppClick = (productName?: string) => {
        const message = productName
            ? `Olá! Vi o produto *${productName}* no site da *Felipe Barbearia* e gostaria de consultar a disponibilidade.`
            : 'Olá! Vi os produtos no site da *Felipe Barbearia* e gostaria de mais informações.'

        const encodedMessage = encodeURIComponent(message)
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank')
    }

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('revealed')
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )
        const el = scrollRef.current
        if (el) {
            el.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
                .forEach((child) => observer.observe(child))
        }
        return () => observer.disconnect()
    }, [isLoading])

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
        <div
            className="min-h-screen pt-24 pb-16 px-4 relative overflow-hidden"
            ref={scrollRef}
            style={IS_SAO_JOAO ? {
                backgroundImage: "url('/sao-joao-bg.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundAttachment: 'fixed',
            } : { background: 'rgb(249,250,251,0.5)' }}
        >
            {/* São João overlays */}
            {IS_SAO_JOAO ? (
                <>
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/50" />
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-[4%] left-[8%] w-10 h-10 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" />
                        <div className="absolute top-[7%] left-[40%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '0.6s' }} />
                        <div className="absolute top-[3%] right-[15%] w-10 h-10 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '1.1s' }} />
                        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-orange-900/40 to-transparent" />
                    </div>
                </>
            ) : null}
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className={`text-4xl sm:text-5xl font-black mb-4 tracking-tight ${
                        IS_SAO_JOAO ? 'text-white filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]' : 'text-gray-900'
                    }`}>Produtos & Bebidas</h1>
                    <p className={`text-lg max-w-2xl mx-auto animate-fade-in-delay-1 ${
                        IS_SAO_JOAO ? 'text-orange-100/90 font-medium filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]' : 'text-gray-500'
                    }`}>
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
                                    <div className="flex items-center gap-3 mb-8 scroll-reveal-left">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
                                            IS_SAO_JOAO ? 'bg-amber-800/70 backdrop-blur-sm border border-amber-500/30' : 'bg-emerald-100'
                                        }`}>
                                            <Icon className={`w-6 h-6 ${IS_SAO_JOAO ? 'text-amber-300' : 'text-emerald-600'}`} />
                                        </div>
                                        <h2 className={`text-2xl font-bold ${
                                            IS_SAO_JOAO ? 'text-white filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]' : 'text-gray-800'
                                        }`}>
                                            {categoryLabels[categoria] || categoria}
                                        </h2>
                                    </div>

                                    {categoria === 'bebida' ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {items.map(item => (
                                                <div key={item.id} className={`scroll-reveal p-6 rounded-3xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2 hover-glow ${
                                                    IS_SAO_JOAO
                                                        ? 'bg-amber-950/70 backdrop-blur-md border-amber-500/20 text-white'
                                                        : 'bg-white border-gray-100'
                                                }`}>
                                                    {item.imagem_url && (
                                                        <div className="w-full aspect-square mb-4 rounded-2xl overflow-hidden bg-gray-50 flex items-center justify-center">
                                                            <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover mix-blend-multiply" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className={`font-bold ${IS_SAO_JOAO ? 'text-white' : 'text-gray-800'}`}>{item.nome}</h3>
                                                        <span className={`font-bold ${IS_SAO_JOAO ? 'text-amber-300' : 'text-emerald-500'}`}>
                                                            R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                    {item.descricao && (
                                                        <p className={`text-xs mb-2 ${IS_SAO_JOAO ? 'text-amber-200/70' : 'text-gray-400'}`}>{item.descricao}</p>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        <span className={[
                                                            'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                            item.estoque > 0
                                                                ? (IS_SAO_JOAO ? 'bg-amber-700/50 text-amber-200' : 'bg-emerald-50 text-emerald-600')
                                                                : (IS_SAO_JOAO ? 'bg-red-900/50 text-red-300' : 'bg-red-50 text-red-500'),
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
                                                <div key={item.id} className={`scroll-reveal group rounded-[2rem] overflow-hidden border shadow-lg hover:shadow-2xl transition-all duration-500 hover-glow ${
                                                    IS_SAO_JOAO
                                                        ? 'bg-amber-950/70 backdrop-blur-md border-amber-500/20'
                                                        : 'bg-white border-gray-100'
                                                }`}>
                                                    <div className="bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center aspect-[4/3] relative overflow-hidden border-b border-gray-100">
                                                        {item.imagem_url ? (
                                                            <img src={item.imagem_url} alt={item.nome} className="absolute inset-0 w-full h-full object-cover mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                                                        ) : (
                                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                                                                <ShoppingBag className="w-16 h-16 text-white/30 relative z-10" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-8">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h3 className={`text-xl font-bold leading-tight ${IS_SAO_JOAO ? 'text-white' : 'text-gray-900'}`}>{item.nome}</h3>
                                                            <span className={`text-xl font-black ${IS_SAO_JOAO ? 'text-amber-300' : 'text-emerald-500'}`}>
                                                                R$ {Number(item.preco).toFixed(2).replace('.', ',')}
                                                            </span>
                                                        </div>
                                                        {item.descricao && (
                                                            <p className={`text-sm mb-6 leading-relaxed ${IS_SAO_JOAO ? 'text-amber-200/70' : 'text-gray-500'}`}>{item.descricao}</p>
                                                        )}
                                                        <ul className="space-y-2 mb-6">
                                                            <li className={`flex items-center gap-2 text-xs font-medium w-fit px-3 py-1 rounded-full ${
                                                                IS_SAO_JOAO ? 'text-amber-200 bg-amber-800/50' : 'text-emerald-600 bg-emerald-50'
                                                            }`}>
                                                                <Check className="w-3 h-3" /> Uso Profissional
                                                            </li>
                                                            {item.estoque > 0 && (
                                                                <li className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 w-fit px-3 py-1 rounded-full">
                                                                    <Check className="w-3 h-3" /> {item.estoque} em estoque
                                                                </li>
                                                            )}
                                                        </ul>
                                                        <Button 
                                                            onClick={() => handleWhatsAppClick(item.nome)}
                                                            className={`w-full h-12 rounded-xl font-bold transition-all duration-300 ${
                                                                IS_SAO_JOAO
                                                                    ? 'bg-amber-500 hover:bg-amber-400 text-white border-2 border-amber-400/50'
                                                                    : 'bg-gray-900 border-2 border-gray-900 text-white group-hover:bg-transparent group-hover:text-gray-900'
                                                            }`}
                                                        >
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
                <div className={`mt-20 rounded-[2.5rem] p-10 text-white text-center relative overflow-hidden shadow-2xl scroll-reveal-scale ${
                    IS_SAO_JOAO
                        ? 'bg-gradient-to-br from-amber-900/90 via-orange-800/90 to-amber-900/90 backdrop-blur-md border border-amber-500/30 shadow-orange-900/40'
                        : 'bg-emerald-500 animate-gradient bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-500 shadow-emerald-500/20'
                }`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-blob" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl animate-blob" style={{ animationDelay: '3s' }} />
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-4">Gostou de algum produto?</h3>
                        <p className="mb-8 max-w-xl mx-auto opacity-90">
                            Consulte a disponibilidade em estoque no dia do seu atendimento ou peça diretamente para o seu barbeiro.
                        </p>
                        <Button 
                            onClick={() => handleWhatsAppClick()}
                            className={`px-10 h-14 rounded-2xl font-black text-lg shadow-xl shadow-black/10 ${
                                IS_SAO_JOAO
                                    ? 'bg-amber-400 hover:bg-amber-300 text-amber-950'
                                    : 'bg-white text-emerald-600 hover:bg-emerald-50'
                            }`}
                        >
                            Falar no WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
