import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useServicos } from '@/hooks/useServicos'
import { Phone, MapPin, Scissors, Star, Clock, Users, ChevronRight, Sparkles } from 'lucide-react'

const defaultServices = [
    { name: 'Corte de Cabelo', price: 'R$ 35', duration: '30 min', icon: Scissors },
    { name: 'Barba Completa', price: 'R$ 35', duration: '30 min', icon: Scissors },
    { name: 'Cabelo e Barba', price: 'R$ 65', duration: '50 min', icon: Scissors, popular: true },
    { name: 'Sobrancelhas', price: 'R$ 15', duration: '15 min', icon: Scissors },
    { name: 'Cabelo e Sobrancelhas', price: 'R$ 45', duration: '40 min', icon: Scissors },
    { name: 'Cabelo, Barba e Sobrancelhas', price: 'R$ 75', duration: '60 min', icon: Scissors },
]

const stats = [
    { label: 'Clientes Satisfeitos', value: '2.000+', icon: Users },
    { label: 'Anos de Experiência', value: '6+', icon: Clock },
    { label: 'Avaliação Média', value: '4.9', icon: Star },
]

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('revealed')
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )
        const el = ref.current
        if (el) {
            el.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale')
                .forEach((child) => observer.observe(child))
        }
        return () => observer.disconnect()
    }, [])
    return ref
}

export function Home() {
    const scrollRef = useScrollReveal()
    const { servicos } = useServicos()

    // Use dynamic services from Supabase, fallback to defaults while loading
    const services = servicos.length > 0
        ? servicos.map(s => ({
            name: s.nome,
            price: `R$ ${s.preco}`,
            duration: `${s.duracao_minutos} min`,
            icon: Scissors,
            popular: s.popular,
        }))
        : defaultServices

    return (
        <div className="min-h-screen" ref={scrollRef}>
            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Multi-layer gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.08)_0%,_transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(5,150,105,0.06)_0%,_transparent_50%)]" />

                {/* Dot pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, #059669 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }} />

                {/* Animated floating blobs */}
                <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-emerald-300/20 rounded-full blur-3xl animate-blob" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-tr from-emerald-100/40 to-emerald-200/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-300/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

                {/* Floating decorative scissors */}
                <div className="absolute top-32 left-[15%] animate-float opacity-[0.07]">
                    <Scissors className="w-20 h-20 text-emerald-500 rotate-45" />
                </div>
                <div className="absolute bottom-40 right-[20%] animate-float-slow opacity-[0.07]">
                    <Scissors className="w-14 h-14 text-emerald-600 -rotate-12" />
                </div>
                <div className="absolute top-[60%] left-[8%] animate-float-slow opacity-[0.05]" style={{ animationDelay: '1s' }}>
                    <Star className="w-10 h-10 text-emerald-400" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    {/* Badge */}
                    <div className="animate-fade-in-up inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border border-emerald-200/50">
                        <Sparkles className="w-4 h-4 animate-wiggle" />
                        <span>Barbearia Premium em Sua Cidade</span>
                    </div>

                    {/* Title */}
                    <h1 className="animate-fade-in-delay-1 text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                        Seu Estilo Impecável{' '}
                        <span className="relative inline-block">
                            <span className="animate-text-shimmer">Começa Aqui</span>
                            <svg className="absolute -bottom-2 left-0 w-full animate-underline-draw" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="animate-fade-in-delay-2 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Agende seu horário de forma rápida e prática. Oferecemos cortes de qualidade
                        com o conforto que você merece. <strong className="text-gray-600">Sem filas, sem espera.</strong>
                    </p>

                    {/* CTA Buttons */}
                    <div className="animate-fade-in-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/agendar">
                            <Button
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-10 py-5 rounded-full text-lg font-bold 
                           hover:from-emerald-600 hover:to-emerald-700 hover:scale-105 transition-all duration-300 
                           shadow-2xl shadow-emerald-500/30 animate-pulse-glow h-auto group"
                            >
                                Agendar Agora
                                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <a href="https://wa.me/5543998648935" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" className="px-8 py-5 rounded-full text-lg font-semibold border-2 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 h-auto transition-all duration-300">
                                <Phone className="w-5 h-5 mr-2" />
                                WhatsApp
                            </Button>
                        </a>
                    </div>
                    <p className="mt-5 text-sm text-gray-400">✨ Agende em menos de 1 minuto</p>
                </div>

                {/* Bottom gradient fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
            </section>

            {/* ═══════════════ STATS SECTION ═══════════════ */}
            <section className="py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative">
                {/* Subtle side gradients */}
                <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-emerald-50/50 to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-emerald-50/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {stats.map((stat, i) => (
                            <div
                                key={stat.label}
                                className="scroll-reveal text-center group"
                                style={{ transitionDelay: `${i * 150}ms` }}
                            >
                                <div className="bg-white rounded-3xl p-8 shadow-lg shadow-emerald-500/5 border border-emerald-100/50 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200/60 rounded-2xl mb-4 group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <stat.icon className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="text-4xl font-black text-gray-900 mb-1">{stat.value}</div>
                                    <div className="text-sm font-medium text-gray-500">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ SERVICES SECTION ═══════════════ */}
            <section className="py-24 bg-gradient-to-b from-white via-gray-50/80 to-white relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-10 left-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center mb-16 scroll-reveal">
                        <div className="inline-flex items-center gap-2 bg-emerald-100/60 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <Scissors className="w-3.5 h-3.5" />
                            O que oferecemos
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
                            Nossos Serviços
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            Escolha o serviço ideal para você e agende no horário que desejar
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service, i) => (
                            <Link to="/agendar" key={service.name}>
                                <div
                                    className={`scroll-reveal relative bg-white rounded-3xl p-7 border shadow-sm hover:shadow-2xl
                               transition-all duration-300 hover:-translate-y-2 group cursor-pointer hover-glow
                               ${service.popular ? 'border-emerald-200 ring-2 ring-emerald-500/10' : 'border-gray-100'}`}
                                    style={{ transitionDelay: `${i * 100}ms` }}
                                >
                                    {/* Popular badge */}
                                    {service.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-lg shadow-emerald-500/30">
                                            ⭐ Mais pedido
                                        </div>
                                    )}
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200/60 rounded-2xl flex items-center justify-center group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:rotate-12 transition-all duration-300 shadow-sm">
                                            <service.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <span className="text-2xl font-black text-emerald-500 group-hover:scale-110 transition-transform duration-300">{service.price}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{service.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{service.duration}</span>
                                        </div>
                                        <div className="text-xs font-semibold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                                            Agendar <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ CTA BANNER ═══════════════ */}
            <section className="py-10 px-4">
                <div className="max-w-5xl mx-auto scroll-reveal-scale">
                    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-[2rem] p-12 text-white text-center overflow-hidden shadow-2xl shadow-emerald-600/20 animate-gradient">
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl animate-blob" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl animate-blob" style={{ animationDelay: '3s' }} />
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }} />

                        <div className="relative z-10">
                            <h3 className="text-3xl sm:text-4xl font-black mb-4">Pronto para mudar o visual?</h3>
                            <p className="text-emerald-100 text-lg mb-8 max-w-lg mx-auto">
                                Agende agora e garanta o melhor horário para você. Atendimento profissional e de qualidade.
                            </p>
                            <Link to="/agendar">
                                <Button className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 h-14 rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:scale-105 transition-all duration-300">
                                    Agendar Meu Horário
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ CONTACT CARD SECTION ═══════════════ */}
            <section className="py-20 bg-gradient-to-b from-white to-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto scroll-reveal-scale">
                        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/25 relative overflow-hidden hover-glow">
                            {/* Decorative animated circles */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 animate-blob" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 animate-blob" style={{ animationDelay: '3s' }} />
                            {/* Pattern overlay */}
                            <div className="absolute inset-0 opacity-[0.03]" style={{
                                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                                backgroundSize: '16px 16px'
                            }} />

                            <div className="relative space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-float shadow-lg shadow-emerald-900/20">
                                        <Scissors className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black">Felipe Barbearia</h3>
                                        <p className="text-emerald-200 text-sm font-medium">Barbeiro Profissional</p>
                                    </div>
                                </div>

                                <div className="h-px bg-white/15" />

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-emerald-50">
                                        <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm">Rua Paraná, 98 - Centro, Ibaiti - PR, 84900-000</span>
                                    </div>
                                    <a
                                        href="https://wa.me/5543998648935"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-2xl px-4 py-3.5 transition-all duration-300 group/wa hover:scale-[1.02] border border-white/10"
                                    >
                                        <div className="w-11 h-11 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Phone className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold">(43) 99864-8935</div>
                                            <div className="text-xs text-emerald-200">Fale conosco no WhatsApp</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 ml-auto text-emerald-300 group-hover/wa:translate-x-1 transition-transform" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
