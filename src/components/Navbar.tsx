import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Scissors, Menu, X, LayoutDashboard, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'
import { IS_SAO_JOAO } from '../config'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()
    const { user, signOut } = useAuth()
    const { isAdmin } = useAdmin()

    const isActive = (path: string) => location.pathname === path

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b transition-colors duration-500 ${
            IS_SAO_JOAO ? 'border-orange-200/50 shadow-lg shadow-orange-500/[0.015]' : 'border-emerald-100/50 shadow-lg shadow-emerald-500/[0.02]'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg ${
                            IS_SAO_JOAO 
                                ? 'bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-500/25' 
                                : 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/30'
                        }`}>
                            <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-black text-gray-900">
                            Felipe <span className={IS_SAO_JOAO ? 'text-orange-500' : 'text-emerald-500'}>Barbearia</span>
                        </span>
                    </Link>
 
                     {/* Desktop Navigation */}
                     <div className="hidden md:flex items-center gap-1">
                         <Link
                             to="/"
                             className={[
                                 'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                                 isActive('/') 
                                     ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                     : (IS_SAO_JOAO ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50')
                             ].join(' ')}
                         >
                             Início
                         </Link>
                         <Link
                             to="/agendar"
                             className={[
                                 'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
                                 isActive('/agendar') 
                                     ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                     : (IS_SAO_JOAO ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50')
                             ].join(' ')}
                         >
                             Agendar
                         </Link>
                         <Link
                             to="/produtos"
                             className={[
                                 'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5',
                                 isActive('/produtos') 
                                     ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                     : (IS_SAO_JOAO ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50')
                             ].join(' ')}
                         >
                             <ShoppingBag className="w-4 h-4" />
                             Produtos
                         </Link>
                         {user && (
                             <>
                                 {isAdmin && (
                                     <Link
                                         to="/painel"
                                         className={[
                                             'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5',
                                             isActive('/painel') 
                                                 ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                                 : (IS_SAO_JOAO ? 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50' : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/50')
                                         ].join(' ')}
                                     >
                                         <LayoutDashboard className="w-4 h-4" />
                                         Painel
                                     </Link>
                                 )}
                                 <Button
                                     variant="ghost"
                                     onClick={signOut}
                                     className="text-sm text-gray-500 hover:text-red-500 hover:bg-red-50/50 rounded-xl font-semibold"
                                 >
                                     Sair
                                 </Button>
                             </>
                         )}
                         <div className="w-px h-6 bg-gray-200 mx-2" />
                         <Link to="/agendar">
                             <Button className={`text-white rounded-full px-6 transition-all duration-300 hover:scale-105 font-bold shadow-lg ${
                                 IS_SAO_JOAO 
                                     ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/25' 
                                     : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/25'
                             }`}>
                                 Agendar Agora
                             </Button>
                         </Link>
                     </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-emerald-50 transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className={`md:hidden bg-white/95 backdrop-blur-xl border-t animate-fade-in ${
                    IS_SAO_JOAO ? 'border-orange-100/50' : 'border-emerald-100/50'
                }`}>
                    <div className="px-4 py-4 space-y-2">
                        <Link
                            to="/"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                                isActive('/') 
                                    ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                    : (IS_SAO_JOAO ? 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-600' : 'text-gray-600 hover:bg-emerald-50/50')
                            ].join(' ')}
                        >
                            Início
                        </Link>
                        <Link
                            to="/agendar"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                                isActive('/agendar') 
                                    ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                    : (IS_SAO_JOAO ? 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-600' : 'text-gray-600 hover:bg-emerald-50/50')
                            ].join(' ')}
                        >
                            Agendar
                        </Link>
                        <Link
                            to="/produtos"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
                                isActive('/produtos') 
                                    ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                    : (IS_SAO_JOAO ? 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-600' : 'text-gray-600 hover:bg-emerald-50/50')
                            ].join(' ')}
                        >
                            <ShoppingBag className="w-4 h-4" />
                            Produtos
                        </Link>
                        {user && (
                            <>
                                {isAdmin && (
                                    <Link
                                        to="/painel"
                                        onClick={() => setIsOpen(false)}
                                        className={[
                                            'block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2',
                                            isActive('/painel') 
                                                ? (IS_SAO_JOAO ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600') 
                                                : (IS_SAO_JOAO ? 'text-gray-600 hover:bg-orange-50/50 hover:text-orange-600' : 'text-gray-600 hover:bg-emerald-50/50')
                                        ].join(' ')}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Painel do Barbeiro
                                    </Link>
                                )}
                                <button
                                    onClick={() => { signOut(); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50/50 hover:text-red-500"
                                >
                                    Sair
                                </button>
                            </>
                        )}
                        <div className="pt-2">
                            <Link to="/agendar" onClick={() => setIsOpen(false)}>
                                <Button className={`w-full text-white rounded-full transition-all duration-300 font-bold shadow-lg ${
                                    IS_SAO_JOAO 
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-orange-500/20' 
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20'
                                }`}>
                                    Agendar Agora
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
