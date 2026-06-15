import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useServicos } from '@/hooks/useServicos'
import { Phone, MapPin, Scissors, Star, Clock, Users, ChevronRight, Sparkles, ChevronDown, Shield, Zap, Award } from 'lucide-react'
import { IS_SAO_JOAO } from '../config'

const defaultServices = [
    { name: 'Corte de Cabelo', price: 'R$ 35', duration: '30 min', icon: Scissors, accent: 'from-blue-500 to-blue-600' },
    { name: 'Barba Completa', price: 'R$ 35', duration: '30 min', icon: Scissors, accent: 'from-orange-500 to-orange-600' },
    { name: 'Cabelo e Barba', price: 'R$ 65', duration: '50 min', icon: Scissors, popular: true, accent: 'from-emerald-500 to-emerald-600' },
    { name: 'Sobrancelhas', price: 'R$ 15', duration: '15 min', icon: Scissors, accent: 'from-purple-500 to-purple-600' },
    { name: 'Cabelo e Sobrancelhas', price: 'R$ 45', duration: '40 min', icon: Scissors, accent: 'from-indigo-500 to-indigo-600' },
    { name: 'Cabelo, Barba e Sobrancelhas', price: 'R$ 75', duration: '60 min', icon: Scissors, accent: 'from-rose-500 to-rose-600' },
]

const stats = [
    { label: 'Clientes Satisfeitos', value: '2.000+', numericValue: 2000, icon: Users, color: 'text-blue-500', bg: 'from-blue-100 to-blue-200/60', hoverBg: 'group-hover:from-blue-500 group-hover:to-blue-600' },
    { label: 'Anos de Experiência', value: '6+', numericValue: 6, icon: Clock, color: 'text-emerald-600', bg: 'from-emerald-100 to-emerald-200/60', hoverBg: 'group-hover:from-emerald-500 group-hover:to-emerald-600' },
    { label: 'Avaliação Média', value: '4.9', numericValue: 4.9, icon: Star, color: 'text-amber-500', bg: 'from-amber-100 to-amber-200/60', hoverBg: 'group-hover:from-amber-500 group-hover:to-amber-600' },
]

// Animated number counter hook
function useCountUp(target: number, duration = 1500, shouldStart = false) {
    const [count, setCount] = useState(0)
    useEffect(() => {
        if (!shouldStart) return
        const start = performance.now()
        const isDecimal = target % 1 !== 0
        const animate = (now: number) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = eased * target
            setCount(isDecimal ? Math.round(current * 10) / 10 : Math.floor(current))
            if (progress < 1) requestAnimationFrame(animate)
            else setCount(target)
        }
        requestAnimationFrame(animate)
    }, [target, duration, shouldStart])
    return count
}

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
            accent: (s as any).accent || 'from-emerald-500 to-emerald-600'
        }))
        : defaultServices

    return (
        <div className="min-h-screen relative overflow-hidden" ref={scrollRef}>
            {/* São João fixed background — covers the entire home page */}
            {IS_SAO_JOAO && (
                <>
                    <img
                        src="/sao-joao-bg.jpg"
                        alt=""
                        className="fixed inset-0 w-full h-full object-cover -z-20"
                        style={{ objectPosition: 'center bottom' }}
                    />
                    <div className="fixed inset-0 -z-10 bg-black/35" />
                    <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/40 via-transparent to-black/55" />
                </>
            )}

            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section 
                className={`relative min-h-[92vh] flex items-center justify-center overflow-hidden transition-all duration-500`}
            >
                {/* Multi-layer gradient background for original theme */}
                {!IS_SAO_JOAO ? (
                    <>
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
                    </>
                ) : (
                    <>
                        {/* --- ANIMATIONS OVERLAY FOR STATIC BACKGROUND --- */}
                        <div className="absolute inset-0 pointer-events-none z-10">
                            {/* Glow effects positioned roughly where the lightbulbs are in the image */}
                            <div className="absolute top-[2%] left-[1.5%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" />
                            <div className="absolute top-[12%] left-[16.5%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '0.4s' }} />
                            <div className="absolute top-[10%] left-[35%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '0.8s' }} />
                            <div className="absolute top-[5%] left-[46.2%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '1.2s' }} />
                            <div className="absolute top-[13%] left-[83%] w-8 h-8 rounded-full bg-yellow-300/40 blur-md animate-pulse-glow" style={{ animationDelay: '1.6s' }} />

                            {/* Floating embers/sparks rising from the campfire on the bottom right */}
                            <div className="absolute bottom-16 right-[30%] sm:right-[32%] w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping opacity-60" style={{ animationDuration: '2s' }} />
                            <div className="absolute bottom-20 right-[28%] sm:right-[30%] w-2 h-2 bg-yellow-400 rounded-full animate-float opacity-75" style={{ animationDuration: '3s' }} />
                            <div className="absolute bottom-24 right-[31%] sm:right-[33%] w-1 h-1 bg-red-400 rounded-full animate-float opacity-50" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
                            <div className="absolute bottom-14 right-[33%] sm:right-[35%] w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse opacity-80" />

                            {/* Warm fire glow pulse over the campfire area */}
                            <div className="absolute bottom-8 right-[27%] sm:right-[30%] w-28 h-28 rounded-full bg-gradient-to-t from-orange-600/30 to-yellow-500/0 blur-xl animate-pulse" style={{ animationDuration: '1.8s' }} />
                        </div>
                    </>
                )}

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-20">
                    {/* Badge */}
                    <div className={`animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border ${
                        IS_SAO_JOAO 
                            ? 'bg-amber-950/80 text-amber-200 border-amber-500/30 backdrop-blur-md' 
                            : 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/50'
                    }`}>
                        <Sparkles className="w-4 h-4 animate-wiggle" />
                        <span>{IS_SAO_JOAO ? '🔥 Viva o São João! Venha Arretar seu Estilo!' : 'Barbearia Premium em Sua Cidade'}</span>
                    </div>

                    {/* Title */}
                    <h1 className={`animate-fade-in-delay-1 text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight mb-6 ${
                        IS_SAO_JOAO ? 'text-white filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]' : 'text-gray-900'
                    }`}>
                        Seu Estilo Impecável{' '}
                        <span className="relative inline-block">
                            <span className={IS_SAO_JOAO ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 bg-clip-text text-transparent' : 'animate-text-shimmer'}>
                                Começa Aqui
                            </span>
                            <svg className="absolute -bottom-2 left-0 w-full animate-underline-draw" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke={IS_SAO_JOAO ? '#FB923C' : '#10B981'} strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className={`animate-fade-in-delay-2 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed ${
                        IS_SAO_JOAO ? 'text-orange-100/90 font-medium filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-gray-600'
                    }`}>
                        Agende seu horário de forma rápida e prática. Oferecemos cortes de qualidade
                        com o conforto que você merece. <strong className={IS_SAO_JOAO ? 'text-yellow-300 font-extrabold' : 'text-gray-600'}>Sem filas, sem espera.</strong>
                    </p>

                    {/* CTA Buttons */}
                    <div className="animate-fade-in-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/agendar">
                            <Button
                                className={`text-white px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-all duration-300 shadow-2xl h-auto group ${
                                    IS_SAO_JOAO 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/40 animate-pulse' 
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30 animate-pulse-glow'
                                }`}
                            >
                                Agendar Agora
                                <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                        <a href="https://wa.me/5543998648935" target="_blank" rel="noopener noreferrer">
                            <Button 
                                variant="outline" 
                                className={`px-8 py-5 rounded-full text-lg font-semibold border-2 h-auto transition-all duration-300 ${
                                    IS_SAO_JOAO 
                                        ? 'border-orange-400 text-orange-200 hover:bg-orange-950/20 hover:border-orange-300 bg-black/40 hover:text-white backdrop-blur-sm shadow-xl' 
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                                }`}
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                WhatsApp
                            </Button>
                        </a>
                    </div>
                    <p className={`mt-5 text-sm ${IS_SAO_JOAO ? 'text-orange-200/70 font-medium' : 'text-gray-500'}`}>✨ Agende em menos de 1 minuto</p>
                </div>

                {/* Bottom gradient fade (Only if not Sao Joao to prevent overlaying the wood floor texture) */}
                {!IS_SAO_JOAO && (
                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
                )}

                {/* Scroll indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-40 z-20">
                    <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Scroll</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
            </section>

            {/* ═══════════════ STATS SECTION ═══════════════ */}
            <section className={`py-20 relative ${IS_SAO_JOAO ? 'bg-transparent' : 'bg-gradient-to-b from-white via-emerald-50/30 to-white'}`}>
                {!IS_SAO_JOAO && (
                    <>
                        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-emerald-50/50 to-transparent" />
                        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-emerald-50/50 to-transparent" />
                    </>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {stats.map((stat, i) => (
                            <StatCard key={stat.label} stat={stat} delay={i * 150} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ SERVICES SECTION ═══════════════ */}
            <section className={`py-24 relative overflow-hidden ${IS_SAO_JOAO ? 'bg-transparent' : 'bg-gradient-to-b from-white via-gray-50/80 to-white'}`}>
                {/* Decorative background elements */}
                {!IS_SAO_JOAO && (
                    <>
                        <div className="absolute top-10 left-0 w-64 h-64 bg-emerald-100/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-10 right-0 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl" />
                    </>
                )}

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
                               transition-all duration-300 hover:-translate-y-2 group cursor-pointer overflow-hidden
                               ${service.popular ? 'border-emerald-200 ring-2 ring-emerald-500/15' : 'border-gray-100 hover:border-gray-200'}`}
                                    style={{ transitionDelay: `${i * 80}ms` }}
                                >
                                    {/* Animated background glow on hover */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${service.accent || 'from-emerald-500 to-emerald-600'} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-3xl`} />

                                    {/* Popular badge */}
                                    {service.popular && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-1">
                                            <Star className="w-3 h-3" /> Mais pedido
                                        </div>
                                    )}

                                    <div className="relative flex items-start justify-between mb-5">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${service.popular ? 'from-emerald-100 to-emerald-200/60' : 'from-gray-100 to-gray-200/60'} rounded-2xl flex items-center justify-center group-hover:bg-gradient-to-br group-hover:${service.accent || 'from-emerald-500 to-emerald-600'} group-hover:rotate-6 transition-all duration-300 shadow-sm`}>
                                            <service.icon className="w-6 h-6 text-gray-500 group-hover:text-white transition-colors duration-300" />
                                        </div>
                                        <span className="text-2xl font-black text-emerald-500 group-hover:scale-110 transition-transform duration-300">{service.price}</span>
                                    </div>
                                    <h3 className="relative text-lg font-bold text-gray-900 mb-3">{service.name}</h3>
                                    <div className="relative flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{service.duration}</span>
                                        </div>
                                        <div className="text-xs font-bold text-emerald-500 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex items-center gap-1">
                                            Agendar <ChevronRight className="w-3 h-3" />
                                        </div>
                                    </div>
                                    {/* Bottom accent bar */}
                                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${service.accent || 'from-emerald-400 to-emerald-600'} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ TRUST BADGES ═══════════════ */}
            <section className={`py-10 px-4 ${IS_SAO_JOAO ? 'bg-transparent' : 'bg-gradient-to-b from-white to-gray-50/40'}`}>
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 scroll-reveal">
                        {[
                            { icon: Shield, label: 'Anti-conflito', desc: 'Sistema trava o horário em tempo real', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                            { icon: Zap, label: 'Confirmação Rápida', desc: 'Agendamento em menos de 1 minuto', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                            { icon: Award, label: 'Qualidade Garantida', desc: '6+ anos de experiência profissional', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                        ].map((badge) => (
                            <div key={badge.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${badge.bg} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm shrink-0`}>
                                    <badge.icon className={`w-5 h-5 ${badge.color}`} />
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${badge.color}`}>{badge.label}</p>
                                    <p className="text-xs text-gray-500">{badge.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════ CTA BANNER ═══════════════ */}
            <section className="py-10 px-4">
                <div className="max-w-5xl mx-auto scroll-reveal-scale">
                    <div className={`relative rounded-[2rem] p-12 text-white text-center overflow-hidden shadow-2xl transition-all duration-300 ${
                        IS_SAO_JOAO 
                            ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 shadow-orange-600/20' 
                            : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 shadow-emerald-600/20'
                    } animate-gradient`}>
                        {/* Decorative */}
                        <div className="absolute top-0 right-0 w-60 h-60 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl animate-blob" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl animate-blob" style={{ animationDelay: '3s' }} />
                        <div className="absolute inset-0 opacity-[0.04]" style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }} />
                        {/* Shine sweep */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ transform: 'skewX(-20deg)', animation: 'shimmer-sweep 4s ease-in-out infinite' }} />

                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/15 text-white/90 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/20">
                                <Sparkles className="w-3.5 h-3.5" />
                                Agende Agora
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black mb-4">Pronto para mudar o visual?</h3>
                            <p className="text-emerald-100 text-lg mb-8 max-w-lg mx-auto">
                                Agende agora e garanta o melhor horário para você. Atendimento profissional e de qualidade.
                            </p>
                            <Link to="/agendar">
                                <Button className="bg-white text-emerald-600 hover:bg-emerald-50 px-10 h-14 rounded-2xl font-black text-lg shadow-xl shadow-black/10 hover:scale-105 transition-all duration-300 group">
                                    Agendar Meu Horário
                                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ CONTACT CARD SECTION ═══════════════ */}
            <section className={`py-20 ${IS_SAO_JOAO ? 'bg-transparent' : 'bg-gradient-to-b from-white to-gray-50/50'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto scroll-reveal-scale">
                        <div className={`rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden hover-glow transition-all duration-300 ${
                            IS_SAO_JOAO
                                ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 shadow-orange-500/25'
                                : 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 shadow-emerald-500/25'
                        }`}>
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
                                    <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm animate-float shadow-lg ${
                                        IS_SAO_JOAO ? 'shadow-orange-950/20' : 'shadow-emerald-900/20'
                                    }`}>
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

// ─── StatCard with animated counter ───
function StatCard({ stat, delay }: {
    stat: { label: string; value: string; numericValue: number; icon: React.ElementType; color: string; bg: string; hoverBg: string };
    delay: number;
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [started, setStarted] = useState(false)
    const count = useCountUp(stat.numericValue, 1800, started)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true) },
            { threshold: 0.4 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [])

    // Format display: preserve original format (e.g. '2.000+', '6+', '4.9')
    const displayValue = stat.value.includes('.')
        ? `${count.toFixed(1)}${stat.value.replace(/[\d.]/g, '').trim()}`
        : `${Math.floor(count)}${stat.value.replace(/\d+/g, '').trim()}`

    return (
        <div
            ref={ref}
            className="scroll-reveal text-center group"
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="bg-white rounded-3xl p-8 shadow-lg shadow-gray-100 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-emerald-50/30 group-hover:to-transparent transition-all duration-500" />
                <div className={`relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${stat.bg} rounded-2xl mb-4 ${stat.hoverBg} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                    <stat.icon className={`w-7 h-7 ${stat.color} group-hover:text-white transition-colors duration-300`} />
                </div>
                <div className="relative text-4xl font-black text-gray-900 mb-1 tabular-nums">
                    {started ? displayValue : stat.value}
                </div>
                <div className="relative text-sm font-medium text-gray-500">{stat.label}</div>
            </div>
        </div>
    )
}
