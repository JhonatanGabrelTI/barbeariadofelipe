import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Scissors, Menu, X, LayoutDashboard, ShoppingBag } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useAdmin } from '@/hooks/useAdmin'
import { Button } from '@/components/ui/button'

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false)
    const location = useLocation()
    const { user, signOut } = useAuth()
    const { isAdmin } = useAdmin()

    const isActive = (path: string) => location.pathname === path

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-300 shadow-lg shadow-emerald-500/30">
                            <Scissors className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-800">
                            Felipe <span className="text-emerald-500">Barbearia</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={[
                                'text-sm font-medium transition-colors duration-200',
                                isActive('/') ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-500'
                            ].join(' ')}
                        >
                            Início
                        </Link>
                        <Link
                            to="/agendar"
                            className={[
                                'text-sm font-medium transition-colors duration-200',
                                isActive('/agendar') ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-500'
                            ].join(' ')}
                        >
                            Agendar
                        </Link>
                        <Link
                            to="/produtos"
                            className={[
                                'text-sm font-medium transition-colors duration-200 flex items-center gap-1',
                                isActive('/produtos') ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-500'
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
                                            'text-sm font-medium transition-colors duration-200 flex items-center gap-1',
                                            isActive('/painel') ? 'text-emerald-600' : 'text-gray-600 hover:text-emerald-500'
                                        ].join(' ')}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Painel
                                    </Link>
                                )}
                                <Button
                                    variant="ghost"
                                    onClick={signOut}
                                    className="text-sm text-gray-600 hover:text-emerald-500"
                                >
                                    Sair
                                </Button>
                            </>
                        )}
                        <Link to="/agendar">
                            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 transition-all duration-300 hover:scale-105 shadow-md shadow-emerald-500/25">
                                Agendar Agora
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
                    <div className="px-4 py-4 space-y-3">
                        <Link
                            to="/"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive('/') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
                            ].join(' ')}
                        >
                            Início
                        </Link>
                        <Link
                            to="/agendar"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                isActive('/agendar') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
                            ].join(' ')}
                        >
                            Agendar
                        </Link>
                        <Link
                            to="/produtos"
                            onClick={() => setIsOpen(false)}
                            className={[
                                'block px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                                isActive('/produtos') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
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
                                            'block px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                                            isActive('/painel') ? 'bg-emerald-50 text-emerald-600' : 'text-gray-600 hover:bg-gray-50'
                                        ].join(' ')}
                                    >
                                        <LayoutDashboard className="w-4 h-4" />
                                        Painel do Barbeiro
                                    </Link>
                                )}
                                <button
                                    onClick={() => { signOut(); setIsOpen(false); }}
                                    className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Sair
                                </button>
                            </>
                        )}
                        <Link to="/agendar" onClick={() => setIsOpen(false)}>
                            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-all duration-300">
                                Agendar Agora
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    )
}
