import { Coffee, Beer, ShoppingBag, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const drinks = [
    { name: 'Café Nespresso', price: 'R$ 4,00', icon: Coffee },
    { name: 'Coca-Cola Lata', price: 'R$ 4,00', icon: Beer },
    { name: 'Coca Zero', price: 'R$ 4,00', icon: Beer },
    { name: 'Água com Gás', price: 'R$ 3,00', icon: Beer },
]

const careProducts = [
    {
        name: 'Pasta Modeladora Premium',
        price: 'R$ 45,00',
        description: 'Efeito matte e alta fixação para o dia todo.',
        image: '/products.png'
    },
    {
        name: 'Cera Modeladora',
        price: 'R$ 40,00',
        description: 'Brilho natural e fixação flexível.',
        image: '/products.png'
    },
    {
        name: 'Óleo para Barba',
        price: 'R$ 35,00',
        description: 'Hidratação e perfume exclusivo.',
        image: '/products.png'
    },
]

export function Produtos() {
    return (
        <div className="min-h-screen pt-24 pb-16 px-4 bg-gray-50/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4 tracking-tight">Produtos & Bebidas</h1>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        Aproveite nossa seleção exclusiva de produtos para cuidar do seu visual em casa e nossas bebidas premium enquanto aguarda.
                    </p>
                </div>

                {/* Drinks Section */}
                <section className="mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <Coffee className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Bebidas & Cafés</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {drinks.map((drink) => (
                            <div key={drink.name} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-gray-800">{drink.name}</h3>
                                    <span className="text-emerald-500 font-bold">{drink.price}</span>
                                </div>
                                <div className="text-xs text-gray-400">Disponível no balcão</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Care Products Section */}
                <section>
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800">Cabelo & Barba</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {careProducts.map((product) => (
                            <div key={product.name} className="group bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-500">
                                <div className="aspect-[4/5] overflow-hidden relative">
                                    {/* Using a placeholder if image fails, but I'll try to use the ones I generated */}
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{product.name}</h3>
                                        <span className="text-xl font-black text-emerald-500">{product.price}</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                        {product.description}
                                    </p>
                                    <ul className="space-y-2 mb-8">
                                        <li className="flex items-center gap-2 text-xs text-emerald-600 font-medium bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                            <Check className="w-3 h-3" /> Uso Profissional
                                        </li>
                                    </ul>
                                    <Button className="w-full h-12 bg-gray-900 border-2 border-gray-900 text-white rounded-xl font-bold group-hover:bg-transparent group-hover:text-gray-900 transition-all duration-300">
                                        Adquirir na Barbearia
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer Info */}
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
