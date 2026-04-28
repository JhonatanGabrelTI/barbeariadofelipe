import { useState } from 'react'
import { useServicos, type Servico } from '@/hooks/useServicos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
    Scissors,
    Plus,
    Trash2,
    DollarSign,
    Clock,
    Star,
    StarOff,
    Pencil,
    X,
    Check,
    Eye,
    EyeOff,
    Settings2,
} from 'lucide-react'

export function ConfigurarServicos() {
    const { allServicos, isLoadingAll, updateServico, createServico, deleteServico } = useServicos()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Servico>>({})
    const [showNewForm, setShowNewForm] = useState(false)
    const [newService, setNewService] = useState({
        nome: '',
        preco: 0,
        duracao_minutos: 30,
        popular: false,
        ativo: true,
        ordem: 0,
    })
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const startEditing = (servico: Servico) => {
        setEditingId(servico.id)
        setEditForm({
            nome: servico.nome,
            preco: servico.preco,
            duracao_minutos: servico.duracao_minutos,
            popular: servico.popular,
            ativo: servico.ativo,
        })
    }

    const cancelEditing = () => {
        setEditingId(null)
        setEditForm({})
    }

    const handleSaveEdit = async (id: string) => {
        try {
            await updateServico.mutateAsync({
                id,
                ...editForm,
            })
            toast.success('✅ Serviço atualizado!')
            setEditingId(null)
            setEditForm({})
        } catch {
            toast.error('❌ Erro ao atualizar serviço.')
        }
    }

    const handleToggleActive = async (servico: Servico) => {
        try {
            await updateServico.mutateAsync({
                id: servico.id,
                ativo: !servico.ativo,
            })
            toast.success(servico.ativo ? '⏸️ Serviço desativado' : '✅ Serviço ativado')
        } catch {
            toast.error('❌ Erro ao alterar status.')
        }
    }

    const handleTogglePopular = async (servico: Servico) => {
        try {
            await updateServico.mutateAsync({
                id: servico.id,
                popular: !servico.popular,
            })
            toast.success(servico.popular ? '⭐ Destaque removido' : '⭐ Serviço em destaque!')
        } catch {
            toast.error('❌ Erro ao alterar destaque.')
        }
    }

    const handleCreate = async () => {
        if (!newService.nome.trim()) {
            toast.error('❌ Informe o nome do serviço.')
            return
        }
        if (newService.preco <= 0) {
            toast.error('❌ Informe um preço válido.')
            return
        }
        try {
            const maxOrdem = allServicos.reduce((max, s) => Math.max(max, s.ordem), 0)
            await createServico.mutateAsync({
                ...newService,
                ordem: maxOrdem + 1,
            })
            toast.success('✅ Novo serviço criado!')
            setNewService({ nome: '', preco: 0, duracao_minutos: 30, popular: false, ativo: true, ordem: 0 })
            setShowNewForm(false)
        } catch {
            toast.error('❌ Erro ao criar serviço.')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteServico.mutateAsync(id)
            toast.success('🗑️ Serviço removido!')
            setDeletingId(null)
        } catch {
            toast.error('❌ Erro ao remover serviço.')
        }
    }

    if (isLoadingAll) {
        return (
            <div className="p-8 text-center text-gray-400">
                Carregando serviços...
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Settings2 size={80} />
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Scissors className="w-5 h-5" />
                        </div>
                        Configurar Serviços
                    </h2>
                    <p className="text-violet-100/80 text-sm max-w-md relative z-10">
                        Configure os preços, duração e disponibilidade de cada serviço. As alterações são aplicadas imediatamente para novos agendamentos.
                    </p>
                </div>

                <div className="p-6 space-y-4">
                    {/* Services List */}
                    {allServicos.map((servico) => (
                        <div
                            key={servico.id}
                            className={[
                                'rounded-2xl border-2 p-5 transition-all duration-300',
                                !servico.ativo
                                    ? 'border-gray-100 bg-gray-50 opacity-60'
                                    : editingId === servico.id
                                        ? 'border-violet-200 bg-violet-50/30 shadow-lg shadow-violet-100/50'
                                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md',
                            ].join(' ')}
                        >
                            {editingId === servico.id ? (
                                /* Editing Mode */
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Pencil className="w-4 h-4 text-violet-500" />
                                        <span className="text-sm font-bold text-violet-600 uppercase tracking-wider">Editando</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="sm:col-span-3 space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome do Serviço</label>
                                            <Input
                                                value={editForm.nome || ''}
                                                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                                                className="h-12 rounded-xl text-lg font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                <DollarSign className="w-3 h-3" />
                                                Preço (R$)
                                            </label>
                                            <Input
                                                type="number"
                                                min={0}
                                                step={1}
                                                value={editForm.preco || 0}
                                                onChange={(e) => setEditForm({ ...editForm, preco: Number(e.target.value) })}
                                                className="h-12 rounded-xl text-lg font-bold text-emerald-600"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                Duração (min)
                                            </label>
                                            <Input
                                                type="number"
                                                min={5}
                                                step={5}
                                                value={editForm.duracao_minutos || 30}
                                                onChange={(e) => setEditForm({ ...editForm, duracao_minutos: Number(e.target.value) })}
                                                className="h-12 rounded-xl text-lg font-bold text-blue-600"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <Button
                                                onClick={() => handleSaveEdit(servico.id)}
                                                disabled={updateServico.isPending}
                                                className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200"
                                            >
                                                <Check className="w-4 h-4 mr-2" />
                                                {updateServico.isPending ? 'Salvando...' : 'Salvar'}
                                            </Button>
                                            <Button
                                                onClick={cancelEditing}
                                                variant="outline"
                                                className="h-12 rounded-xl border-2 px-4"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Scissors className="w-5 h-5 text-violet-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-800 truncate">{servico.nome}</h3>
                                                {servico.popular && (
                                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                                                        ⭐ Destaque
                                                    </span>
                                                )}
                                                {!servico.ativo && (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    R$ {servico.preco}
                                                </span>
                                                <span className="flex items-center gap-1 text-sm text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {servico.duracao_minutos} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => handleTogglePopular(servico)}
                                            title={servico.popular ? 'Remover destaque' : 'Marcar como destaque'}
                                            className={[
                                                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                                                servico.popular
                                                    ? 'bg-amber-100 text-amber-500 hover:bg-amber-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500',
                                            ].join(' ')}
                                        >
                                            {servico.popular ? <Star className="w-4 h-4 fill-amber-500" /> : <StarOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(servico)}
                                            title={servico.ativo ? 'Desativar' : 'Ativar'}
                                            className={[
                                                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                                                servico.ativo
                                                    ? 'bg-emerald-100 text-emerald-500 hover:bg-emerald-200'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500',
                                            ].join(' ')}
                                        >
                                            {servico.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => startEditing(servico)}
                                            className="w-9 h-9 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-all"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {deletingId === servico.id ? (
                                            <div className="flex items-center gap-1 bg-red-50 rounded-xl px-2 py-1">
                                                <button
                                                    onClick={() => handleDelete(servico.id)}
                                                    className="text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1"
                                                >
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={() => setDeletingId(null)}
                                                    className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeletingId(servico.id)}
                                                className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 flex items-center justify-center transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* New Service Form */}
                    {showNewForm ? (
                        <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/30 p-5 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Plus className="w-4 h-4 text-violet-500" />
                                <span className="text-sm font-bold text-violet-600 uppercase tracking-wider">Novo Serviço</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="sm:col-span-3 space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Nome</label>
                                    <Input
                                        placeholder="Ex: Corte Degradê"
                                        value={newService.nome}
                                        onChange={(e) => setNewService({ ...newService, nome: e.target.value })}
                                        className="h-12 rounded-xl text-lg font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                        <DollarSign className="w-3 h-3" />
                                        Preço (R$)
                                    </label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={newService.preco || ''}
                                        onChange={(e) => setNewService({ ...newService, preco: Number(e.target.value) })}
                                        className="h-12 rounded-xl text-lg font-bold text-emerald-600"
                                        placeholder="35"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Duração (min)
                                    </label>
                                    <Input
                                        type="number"
                                        min={5}
                                        step={5}
                                        value={newService.duracao_minutos || ''}
                                        onChange={(e) => setNewService({ ...newService, duracao_minutos: Number(e.target.value) })}
                                        className="h-12 rounded-xl text-lg font-bold text-blue-600"
                                        placeholder="30"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button
                                        onClick={handleCreate}
                                        disabled={createServico.isPending}
                                        className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-lg shadow-violet-200"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        {createServico.isPending ? 'Criando...' : 'Criar'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowNewForm(false)
                                            setNewService({ nome: '', preco: 0, duracao_minutos: 30, popular: false, ativo: true, ordem: 0 })
                                        }}
                                        className="h-12 rounded-xl border-2 px-4"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowNewForm(true)}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-violet-300 hover:text-violet-500 hover:bg-violet-50/30 transition-all duration-300 flex items-center justify-center gap-2 font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            Adicionar Novo Serviço
                        </button>
                    )}
                </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
                💡 As alterações nos preços e duração são aplicadas imediatamente. Agendamentos já existentes mantêm o valor original.
            </p>
        </div>
    )
}
