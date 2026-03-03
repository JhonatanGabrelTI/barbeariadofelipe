import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Phone, MapPin, Scissors, Star, Clock, Users } from 'lucide-react'

const services = [
    { name: 'Corte Clássico', price: 'R$ 40', duration: '30 min', icon: Scissors },
    { name: 'Barba', price: 'R$ 30', duration: '20 min', icon: Scissors },
    { name: 'Corte + Barba', price: 'R$ 60', duration: '45 min', icon: Scissors },
    { name: 'Degradê', price: 'R$ 45', duration: '40 min', icon: Scissors },
    { name: 'Sobrancelha', price: 'R$ 15', duration: '10 min', icon: Scissors },
    { name: 'Hidratação', price: 'R$ 50', duration: '30 min', icon: Scissors },
]

const stats = [
    { label: 'Clientes Satisfeitos', value: '2.000+', icon: Users },
    { label: 'Anos de Experiência', value: '8+', icon: Clock },
    { label: 'Avaliação Média', value: '4.9', icon: Star },
]

export function Home() {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50" />
                <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    {/* Badge */}
                    <div className="animate-fade-in-up inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <Scissors className="w-4 h-4" />
                        <span>Barbearia Premium em Sua Cidade</span>
                    </div>

                    {/* Title */}
                    <h1 className="animate-fade-in-delay-1 text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-800 leading-tight tracking-tight mb-6">
                        Seu Estilo Impecável{' '}
                        <span className="relative">
                            <span className="text-emerald-500">Começa Aqui</span>
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                                <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="animate-fade-in-delay-2 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Agende seu horário de forma rápida e prática. Oferecemos cortes de qualidade
                        com o conforto que você merece. Sem filas, sem espera.
                    </p>

                    {/* CTA Button */}
                    <div className="animate-fade-in-delay-3">
                        <Link to="/agendar">
                            <Button
                                className="bg-emerald-500 text-white px-8 py-4 rounded-full text-lg font-semibold 
                           hover:bg-emerald-600 hover:scale-105 transition-all duration-300 
                           shadow-xl shadow-emerald-500/30 animate-pulse-glow h-auto"
                            >
                                Agendar Agora
                            </Button>
                        </Link>
                        <p className="mt-4 text-sm text-gray-400">Agende em menos de 1 minuto</p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {stats.map((stat) => (
                            <div key={stat.label} className="text-center group">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-100 rounded-2xl mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                                    <stat.icon className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                </div>
                                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                                <div className="text-sm text-gray-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                            Nossos Serviços
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto">
                            Escolha o serviço ideal para você e agende no horário que desejar
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map((service) => (
                            <div
                                key={service.name}
                                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 
                           transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-500 transition-colors duration-300">
                                        <service.icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <span className="text-2xl font-bold text-emerald-500">{service.price}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-1">{service.name}</h3>
                                <div className="flex items-center gap-1 text-sm text-gray-400">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{service.duration}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Card Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-xl mx-auto">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                            <div className="relative space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <Scissors className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Felipe Barbearia</h3>
                                        <p className="text-emerald-100 text-sm">Barbeiro Profissional</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-emerald-50">
                                        <MapPin className="w-5 h-5 shrink-0" />
                                        <span className="text-sm">Rua Exemplo, 123 - Centro, Sua Cidade - SP</span>
                                    </div>
                                    <a
                                        href="https://wa.me/5511999999999"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl px-4 py-3 transition-all duration-300 group"
                                    >
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                            <Phone className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">(11) 99999-9999</div>
                                            <div className="text-xs text-emerald-100">Fale conosco no WhatsApp</div>
                                        </div>
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
