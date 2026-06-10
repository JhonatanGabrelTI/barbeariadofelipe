import { Scissors, MapPin, Phone, Clock, Heart } from 'lucide-react'

export function Footer() {
    return (
        <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
            <div className="absolute top-0 left-1/4 w-1/2 h-40 bg-emerald-500/5 blur-3xl rounded-full" />

            {/* Pattern overlay */}
            <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: 'radial-gradient(circle, #10B981 1px, transparent 1px)',
                backgroundSize: '32px 32px'
            }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Scissors className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-black">
                                Felipe <span className="text-emerald-400">Barbearia</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                            Estilo e qualidade em cada corte. Agende seu horário e transforme seu visual com profissionalismo.
                        </p>
                        {/* Social proof mini */}
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-gray-900 flex items-center justify-center">
                                        <span className="text-[8px] font-bold text-white">★</span>
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400">4.9 • 2.000+ clientes</span>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-emerald-400 rounded-full" />
                            Contato
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300 text-sm group">
                                <div className="w-9 h-9 bg-gray-800 group-hover:bg-emerald-500/20 rounded-xl flex items-center justify-center transition-colors duration-300">
                                    <MapPin className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span>Rua Paraná, 98 - Centro, Ibaiti - PR</span>
                            </div>
                            <a
                                href="https://wa.me/5543998648935"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-gray-300 hover:text-white text-sm transition-colors group"
                            >
                                <div className="w-9 h-9 bg-gray-800 group-hover:bg-green-500/20 rounded-xl flex items-center justify-center transition-colors duration-300">
                                    <Phone className="w-4 h-4 text-emerald-400 group-hover:text-green-400 transition-colors" />
                                </div>
                                <span>(43) 99864-8935</span>
                            </a>
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="space-y-5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="w-1.5 h-5 bg-emerald-400 rounded-full" />
                            Horário de Funcionamento
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Seg - Sáb</div>
                                    <div className="text-gray-400">09:00 às 20:00</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                                    <Clock className="w-4 h-4 text-red-400/60" />
                                </div>
                                <div>
                                    <div className="font-medium text-gray-400">Domingo</div>
                                    <div className="text-gray-500">Fechado</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-gray-800/50 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-sm flex items-center gap-1.5">
                        © {new Date().getFullYear()} Felipe Barbearia. Feito com <Heart className="w-3.5 h-3.5 text-emerald-500/60 fill-emerald-500/60" /> em Ibaiti-PR
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs">
                        <p className="text-gray-600">
                            Todos os direitos reservados
                        </p>
                        <span className="text-gray-800 hidden sm:inline">|</span>
                        <div className="flex items-center gap-1.5 text-gray-500">
                            <span>Desenvolvido por</span>
                            <a
                                href="https://github.com/JhonatanGabrelTI"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold tracking-wide bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] bg-clip-text text-transparent hover:scale-105 transition-all duration-300 flex items-center gap-1 group cursor-pointer"
                            >
                                <span className="relative">
                                    Jhonatan Proença
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-300 group-hover:w-full"></span>
                                </span>
                                <span className="inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5 text-[11px] filter drop-shadow-[0_0_2px_rgba(20,184,166,0.4)]">🚀</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
