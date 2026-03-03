import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

export const isSupabaseConfigured =
    !!import.meta.env.VITE_SUPABASE_URL &&
    !!import.meta.env.VITE_SUPABASE_ANON_KEY

export type Agendamento = {
    id: string
    user_id: string
    nome_cliente: string | null
    whatsapp: string
    servico: string
    data_hora: string
    status: 'confirmado' | 'cancelado' | 'realizado'
    created_at: string
}
