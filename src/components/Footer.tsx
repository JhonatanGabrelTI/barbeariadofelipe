import { Scissors, MapPin, Phone, Clock } from 'lucide-react'

export function Footer() {
    return (
        <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                                <Scissors className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold">
                                Felipe <span className="text-emerald-400">Barbearia</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Estilo e qualidade em cada corte. Agende seu horário e transforme seu visual.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-400">Contato</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Rua Paraná, 98 - Centro, Ibaiti - PR, 84900-000</span>
                            </div>
                            <a
                                href="https://wa.me/5543998648935"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-gray-300 hover:text-emerald-400 text-sm transition-colors"
                            >
                                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>(43) 99864-8935</span>
                            </a>
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-emerald-400">Horário de Funcionamento</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Seg - Sáb: 09:00 às 20:00</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-300 text-sm">
                                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Dom: Fechado</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} Felipe Barbearia. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </footer>
    )
}
