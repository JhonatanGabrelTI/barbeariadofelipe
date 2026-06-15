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
        <div className="min-h-screen" ref={scrollRef}>
            {/* ═══════════════ HERO SECTION ═══════════════ */}
            <section className={`relative min-h-[95vh] flex items-center justify-center overflow-hidden ${IS_SAO_JOAO ? 'bg-[#FAF6F0]' : ''}`}>
                {/* Multi-layer gradient background */}
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
                        {/* Stucco warm textured wall */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#F5EAD4] via-[#FAF6F0] to-[#EAE0C8]" />
                        <div className="absolute inset-0 opacity-[0.06]" style={{
                            backgroundImage: 'radial-gradient(circle, #78350F 1px, transparent 1px)',
                            backgroundSize: '32px 32px'
                        }} />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(245,158,11,0.08)_0%,_transparent_60%)]" />

                        {/* Floating stars/drawings on wall */}
                        <div className="absolute top-24 left-[10%] opacity-20 text-2xl select-none">✨</div>
                        <div className="absolute top-1/3 right-[12%] opacity-15 text-3xl select-none">⭐</div>
                        <div className="absolute bottom-40 left-[25%] opacity-20 text-2xl select-none">✨</div>
                        <div className="absolute top-1/2 left-[5%] opacity-15 text-xl select-none">⭐</div>
                        <div className="absolute top-24 right-[25%] opacity-20 text-2xl select-none">✨</div>

                        {/* --- RUSTIC WOOD SCENARIO BASE --- */}
                        <div className="absolute bottom-0 left-0 right-0 h-36 z-10 flex items-end">
                            {/* Burlap/Juta fabric background layer on the very bottom */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-[#B48A53] opacity-35" style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, #78350F 0px, #78350F 2px, transparent 2px, transparent 10px), repeating-linear-gradient(-45deg, #78350F 0px, #78350F 2px, transparent 2px, transparent 10px)',
                            }} />
                            {/* Checkered pattern tablecloth (Toalha xadrez) */}
                            <div className="absolute inset-x-0 bottom-0 h-14 bg-[#D97706] shadow-[inset_0_4px_6px_rgba(0,0,0,0.15)]" style={{
                                backgroundImage: 'linear-gradient(90deg, rgba(239,68,68,0.85) 50%, transparent 50%), linear-gradient(rgba(239,68,68,0.85) 50%, transparent 50%)',
                                backgroundSize: '36px 36px'
                            }} />
                            {/* Wooden Table surface edge */}
                            <div className="absolute inset-x-0 bottom-14 h-6 bg-[#78350F] border-t border-[#5F270B] shadow-lg" style={{
                                backgroundImage: 'linear-gradient(rgba(0,0,0,0.15) 50%, transparent 50%)',
                                backgroundSize: '100% 3px'
                            }} />
                        </div>
                    </>
                )}

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-20">
                    {/* Badge */}
                    <div className={`animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm border ${
                        IS_SAO_JOAO 
                            ? 'bg-amber-100/85 text-amber-900 border-amber-300/50' 
                            : 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200/50'
                    }`}>
                        <Sparkles className="w-4 h-4 animate-wiggle" />
                        <span>{IS_SAO_JOAO ? '🔥 Viva o São João! Venha Arretar seu Estilo!' : 'Barbearia Premium em Sua Cidade'}</span>
                    </div>

                    {/* Title */}
                    <h1 className="animate-fade-in-delay-1 text-5xl sm:text-6xl lg:text-8xl font-black text-gray-900 leading-[1.1] tracking-tight mb-6">
                        Seu Estilo Impecável{' '}
                        <span className="relative inline-block">
                            <span className={IS_SAO_JOAO ? 'bg-gradient-to-r from-amber-600 via-orange-500 to-red-600 bg-clip-text text-transparent' : 'animate-text-shimmer'}>
                                Começa Aqui
                            </span>
                            <svg className="absolute -bottom-2 left-0 w-full animate-underline-draw" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke={IS_SAO_JOAO ? '#EA580C' : '#10B981'} strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="animate-fade-in-delay-2 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                        Agende seu horário de forma rápida e prática. Oferecemos cortes de qualidade
                        com o conforto que você merece. <strong className={IS_SAO_JOAO ? 'text-[#78350F]' : 'text-gray-600'}>Sem filas, sem espera.</strong>
                    </p>

                    {/* CTA Buttons */}
                    <div className="animate-fade-in-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/agendar">
                            <Button
                                className={`text-white px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-all duration-300 shadow-2xl h-auto group ${
                                    IS_SAO_JOAO 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/30 animate-pulse' 
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
                                        ? 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 bg-white/80' 
                                        : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                                }`}
                            >
                                <Phone className="w-5 h-5 mr-2" />
                                WhatsApp
                            </Button>
                        </a>
                    </div>
                    <p className="mt-5 text-sm text-gray-500">✨ Agende em menos de 1 minuto</p>
                </div>

                {/* --- SIDE DECORATIONS FOR SÃO JOÃO --- */}
                {IS_SAO_JOAO && (
                    <div className="absolute inset-x-0 bottom-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-36 z-20 pointer-events-none flex justify-between items-end">
                        {/* Left Side: Placa de madeira + Chapéu de palha */}
                        <div className="flex flex-col items-center select-none relative -mb-4 lg:-ml-6 transform origin-bottom scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
                            {/* Wooden Board */}
                            <div className="relative bg-[#8B5A2B] border-4 border-[#5C3A21] text-[#FAF6F0] rounded-xl p-3 text-center w-40 shadow-2xl flex flex-col items-center select-none">
                                <div className="absolute inset-x-0 top-1/3 h-0.5 bg-[#5C3A21] opacity-50" />
                                <div className="absolute inset-x-0 top-2/3 h-0.5 bg-[#5C3A21] opacity-50" />
                                <span className="text-[11px] font-black tracking-widest text-yellow-300 uppercase filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">CUIDADO</span>
                                <span className="text-[9px] font-bold text-orange-100">QUE O</span>
                                <span className="text-base font-black text-yellow-400 tracking-wide filter drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">ESTILO</span>
                                <span className="text-[10px] font-black text-orange-200 tracking-wider leading-none mt-1">É ARRETADO!</span>
                                <span className="text-lg mt-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">👨</span>
                            </div>
                            {/* Stick */}
                            <div className="w-4 h-12 bg-[#5C3A21] shadow-md -mt-1" />
                            {/* Straw Hat SVG */}
                            <div className="relative w-36 h-12 -mt-4 filter drop-shadow-[0_6px_6px_rgba(0,0,0,0.3)]">
                                <svg viewBox="0 0 100 40" fill="none" className="w-full h-full">
                                    <ellipse cx="50" cy="30" rx="42" ry="7" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
                                    <path d="M28 30 C 28 12, 72 12, 72 30 Z" fill="#FACC15" stroke="#A16207" strokeWidth="2" />
                                    <path d="M28 28 C 38 25, 62 25, 72 28 L 72 30 C 62 27, 38 27, 28 30 Z" fill="#EF4444" />
                                    <path d="M15 31 L 9 32 M85 31 L 91 32 M32 18 L 35 15 M68 18 L 65 15" stroke="#A16207" strokeWidth="1" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Side: Lousa de giz + Fogueira */}
                        <div className="flex items-end gap-3 lg:gap-5 select-none relative -mb-4 lg:-mr-6 transform origin-bottom scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100 transition-all duration-300">
                            {/* Chalkboard */}
                            <div className="relative bg-[#2D3748] border-[6px] border-[#8B5A2B] rounded-xl p-3 text-center w-36 h-24 shadow-2xl flex flex-col justify-center items-center select-none">
                                <div className="absolute inset-1 border border-dashed border-white/20 rounded-md" />
                                <p className="font-mono text-[10px] text-white/95 uppercase tracking-widest leading-relaxed">BOM CORTE,</p>
                                <p className="font-mono text-sm text-yellow-300 font-extrabold tracking-wide rotate-1 uppercase leading-none mt-1">BOA FESTA!</p>
                            </div>

                            {/* Campfire */}
                            <div className="relative w-20 h-24 flex flex-col items-center justify-end -mb-1">
                                <svg viewBox="0 0 60 80" className="w-16 h-20 animate-flame filter drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                                    <path d="M30 0 C 45 20, 55 45, 40 65 C 30 75, 10 70, 15 50 C 5 35, 15 15, 30 0 Z" fill="#EF4444" />
                                    <path d="M30 15 C 40 30, 48 48, 38 65 C 32 72, 18 70, 22 55 C 15 45, 20 30, 30 15 Z" fill="#F97316" />
                                    <path d="M30 30 C 35 40, 40 52, 35 65 C 30 70, 22 70, 25 58 C 20 50, 25 40, 30 30 Z" fill="#FACC15" />
                                </svg>
                                <div className="relative w-16 h-3 bg-[#5C3A21] rounded-full transform -rotate-12 shadow-md" />
                                <div className="absolute bottom-0 w-16 h-3 bg-[#5C3A21] rounded-full transform rotate-12 shadow-md -translate-x-1" />
                            </div>
                        </div>
                    </div>
                )}

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
            <section className="py-20 bg-gradient-to-b from-white via-emerald-50/30 to-white relative">
                <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-emerald-50/50 to-transparent" />
                <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-emerald-50/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {stats.map((stat, i) => (
                            <StatCard key={stat.label} stat={stat} delay={i * 150} />
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
            <section className="py-10 px-4 bg-gradient-to-b from-white to-gray-50/40">
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
                    <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-[2rem] p-12 text-white text-center overflow-hidden shadow-2xl shadow-emerald-600/20 animate-gradient">
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
