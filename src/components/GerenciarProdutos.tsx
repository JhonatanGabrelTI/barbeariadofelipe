import { useState } from 'react'
import { useProdutos, type Produto } from '@/hooks/useProdutos'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    Coffee,
    ShoppingBag,
    AlertTriangle,
    Check,
    X,
} from 'lucide-react'

const categorias = [
    { value: 'bebida', label: 'Bebidas', icon: Coffee },
    { value: 'cabelo', label: 'Cabelo', icon: ShoppingBag },
    { value: 'barba', label: 'Barba', icon: ShoppingBag },
    { value: 'geral', label: 'Geral', icon: Package },
]

const emptyForm = {
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    categoria: 'geral',
    ativo: true,
}

export function GerenciarProdutos() {
    const { produtos, isLoading, createProduto, updateProduto, deleteProduto } = useProdutos()
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    const openNewForm = () => {
        setForm(emptyForm)
        setEditingId(null)
        setShowForm(true)
    }

    const openEditForm = (produto: Produto) => {
        setForm({
            nome: produto.nome,
            descricao: produto.descricao || '',
            preco: String(produto.preco),
            estoque: String(produto.estoque),
            categoria: produto.categoria,
            ativo: produto.ativo,
        })
        setEditingId(produto.id)
        setShowForm(true)
    }

    const handleSubmit = async () => {
        if (!form.nome || !form.preco) {
            toast.error('❌ Preencha o nome e o preço do produto.')
            return
        }

        try {
            const payload = {
                nome: form.nome.trim(),
                descricao: form.descricao.trim() || null,
                preco: parseFloat(form.preco.replace(',', '.')),
                estoque: parseInt(form.estoque) || 0,
                categoria: form.categoria,
                ativo: form.ativo,
            }

            if (editingId) {
                await updateProduto.mutateAsync({ id: editingId, ...payload })
                toast.success('✅ Produto atualizado!')
            } else {
                await createProduto.mutateAsync(payload)
                toast.success('✅ Produto adicionado!')
            }

            setShowForm(false)
            setForm(emptyForm)
            setEditingId(null)
        } catch {
            toast.error('❌ Erro ao salvar produto.')
        }
    }

    const handleDelete = async (id: string) => {
        try {
            await deleteProduto.mutateAsync(id)
            toast.success('🗑️ Produto removido!')
            setDeleteConfirmId(null)
        } catch {
            toast.error('❌ Erro ao remover produto.')
        }
    }

    const handleToggleAtivo = async (produto: Produto) => {
        try {
            await updateProduto.mutateAsync({ id: produto.id, ativo: !produto.ativo })
            toast.success(produto.ativo ? '⏸️ Produto desativado' : '✅ Produto ativado')
        } catch {
            toast.error('❌ Erro ao atualizar produto.')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
            </div>
        )
    }

    const grouped = categorias.map(cat => ({
        ...cat,
        items: produtos.filter(p => p.categoria === cat.value),
    })).filter(g => g.items.length > 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Seus Produtos</h2>
                    <p className="text-sm text-gray-400">{produtos.length} produto(s) cadastrado(s)</p>
                </div>
                <Button
                    onClick={openNewForm}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2 shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </Button>
            </div>

            {/* Products List */}
            {produtos.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-600 mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-gray-400 text-sm mb-6">Adicione seus produtos para exibir na loja.</p>
                    <Button onClick={openNewForm} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2">
                        <Plus className="w-4 h-4" />
                        Adicionar Primeiro Produto
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {grouped.map(group => {
                        const GroupIcon = group.icon
                        return (
                            <div key={group.value}>
                                <div className="flex items-center gap-2 mb-3">
                                    <GroupIcon className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                                </div>
                                <div className="space-y-3">
                                    {group.items.map(produto => (
                                        <div
                                            key={produto.id}
                                            className={[
                                                'bg-white rounded-2xl border p-5 shadow-sm transition-all',
                                                produto.ativo ? 'border-gray-100' : 'border-red-100 opacity-60',
                                            ].join(' ')}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="font-bold text-gray-800 truncate">{produto.nome}</h4>
                                                        {!produto.ativo && (
                                                            <span className="text-[10px] uppercase tracking-wider font-bold bg-red-100 text-red-500 px-2 py-0.5 rounded-full">Inativo</span>
                                                        )}
                                                    </div>
                                                    {produto.descricao && (
                                                        <p className="text-sm text-gray-400 truncate">{produto.descricao}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-emerald-600 font-black text-lg">
                                                            R$ {Number(produto.preco).toFixed(2).replace('.', ',')}
                                                        </span>
                                                        <span className={[
                                                            'text-xs font-bold px-2.5 py-1 rounded-full',
                                                            produto.estoque > 5
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : produto.estoque > 0
                                                                    ? 'bg-amber-50 text-amber-600'
                                                                    : 'bg-red-50 text-red-500',
                                                        ].join(' ')}>
                                                            {produto.estoque > 0 ? `${produto.estoque} em estoque` : 'Sem estoque'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 ml-4">
                                                    <button
                                                        onClick={() => handleToggleAtivo(produto)}
                                                        title={produto.ativo ? 'Desativar' : 'Ativar'}
                                                        className={[
                                                            'p-2.5 rounded-xl transition-colors',
                                                            produto.ativo
                                                                ? 'hover:bg-amber-50 text-gray-400 hover:text-amber-500'
                                                                : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500',
                                                        ].join(' ')}
                                                    >
                                                        {produto.ativo ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => openEditForm(produto)}
                                                        className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteConfirmId(produto.id)}
                                                        className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-md rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">
                            {editingId ? 'Editar Produto' : 'Novo Produto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId ? 'Atualize as informações do produto.' : 'Preencha as informações do novo produto.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Nome do Produto *</label>
                            <Input
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                                placeholder="Ex: Pasta Modeladora"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Descrição</label>
                            <Input
                                value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                                placeholder="Ex: Fixação forte, efeito matte"
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Preço (R$) *</label>
                                <Input
                                    value={form.preco}
                                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                                    placeholder="45,00"
                                    className="h-12 rounded-xl"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-gray-700">Estoque</label>
                                <Input
                                    type="number"
                                    value={form.estoque}
                                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                                    placeholder="10"
                                    className="h-12 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700">Categoria</label>
                            <div className="grid grid-cols-2 gap-2">
                                {categorias.map(cat => {
                                    const CatIcon = cat.icon
                                    return (
                                        <button
                                            key={cat.value}
                                            onClick={() => setForm({ ...form, categoria: cat.value })}
                                            className={[
                                                'flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all',
                                                form.categoria === cat.value
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-100 text-gray-500 hover:border-gray-200',
                                            ].join(' ')}
                                        >
                                            <CatIcon className="w-4 h-4" />
                                            {cat.label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="ghost"
                                onClick={() => setShowForm(false)}
                                className="flex-1 h-12 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={createProduto.isPending || updateProduto.isPending}
                                className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                            >
                                {(createProduto.isPending || updateProduto.isPending) ? 'Salvando...' : editingId ? 'Atualizar' : 'Adicionar'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
                <DialogContent className="sm:max-w-sm rounded-3xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Remover Produto?</DialogTitle>
                        <DialogDescription>
                            Essa ação não pode ser desfeita. O produto será removido permanentemente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex gap-3 pt-6">
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 h-12 rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
                            disabled={deleteProduto.isPending}
                            className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                        >
                            {deleteProduto.isPending ? 'Removendo...' : 'Sim, Remover'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
