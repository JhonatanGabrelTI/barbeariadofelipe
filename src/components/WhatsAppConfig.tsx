import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { MessageSquare, Save, ExternalLink, ShieldCheck } from 'lucide-react'

export function WhatsAppConfig() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState({
        instance_id: '',
        instance_token: '',
        client_token: '',
        z_api_url: 'https://api.z-api.io/instances/'
    })

    useEffect(() => {
        fetchConfig()
    }, [])

    async function fetchConfig() {
        try {
            const { data, error } = await supabase
                .from('whatsapp_config')
                .select('*')
                .maybeSingle()

            if (error) throw error
            if (data) setConfig(data)
        } catch (error) {
            console.error('Error fetching config:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const { data: existing } = await supabase
                .from('whatsapp_config')
                .select('id')
                .maybeSingle()

            let error;
            if (existing) {
                const { error: err } = await supabase
                    .from('whatsapp_config')
                    .update(config)
                    .eq('id', existing.id)
                error = err
            } else {
                const { error: err } = await supabase
                    .from('whatsapp_config')
                    .insert(config)
                error = err
            }

            if (error) throw error
            toast.success('✅ Configurações de WhatsApp salvas!')
        } catch (error) {
            toast.error('❌ Erro ao salvar configurações.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando configurações...</div>

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-emerald-500 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <MessageSquare size={80} />
                    </div>
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                        <MessageSquare className="w-7 h-7" />
                        Automação de WhatsApp
                    </h2>
                    <p className="text-emerald-50/80 text-sm max-w-md">
                        Conecte o sistema à Z-API para enviar mensagens automáticas de confirmação e lembretes aos seus clientes.
                    </p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Instructions Link */}
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-amber-900">Como obter essas chaves?</p>
                            <p className="text-xs text-amber-800">
                                Acesse o site da <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="underline font-bold">Z-API</a>, crie uma instância e conecte seu WhatsApp. Depois, copie os IDs abaixo.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1 italic text-emerald-600">Instância ID</label>
                            <Input
                                placeholder="Ex: 3B123..."
                                value={config.instance_id}
                                onChange={(e) => setConfig({ ...config, instance_id: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1 italic text-emerald-600">Instance Token</label>
                            <Input
                                placeholder="Ex: 123456..."
                                value={config.instance_token}
                                onChange={(e) => setConfig({ ...config, instance_token: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1 italic text-emerald-600">Client Token</label>
                            <Input
                                placeholder="Ex: F1234..."
                                value={config.client_token}
                                onChange={(e) => setConfig({ ...config, client_token: e.target.value })}
                                className="h-12 rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 ml-1">Z-API Base URL</label>
                            <Input
                                value={config.z_api_url}
                                onChange={(e) => setConfig({ ...config, z_api_url: e.target.value })}
                                className="h-12 rounded-xl text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        <a
                            href="https://app.z-api.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:underline"
                        >
                            Ir para Z-API <ExternalLink className="w-3 h-3" />
                        </a>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 h-12 flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Safing...' : 'Salvar Configurações'}
                        </Button>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-center text-xs text-gray-400">
                ⚠️ As mensagens automáticas só serão disparadas após você preencher estas chaves e solicitar a ativação da automação total.
            </p>
        </div>
    )
}
