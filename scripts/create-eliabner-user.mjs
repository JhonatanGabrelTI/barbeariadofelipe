import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from 'node:process'

try {
    loadEnvFile('.env.eliabner.local')
} catch {
    // O arquivo privado é opcional quando as variáveis já estão no ambiente.
}

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ELIABNER_EMAIL || 'eliabnerbarbeiro@gmail.com'
const password = process.env.ELIABNER_PASSWORD

if (!url || !serviceRoleKey || !password) {
    console.error('Defina SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e ELIABNER_PASSWORD antes de executar.')
    process.exit(1)
}

const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

let userId
const created = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Eliabner' },
})

if (created.error) {
    if (!created.error.message.toLowerCase().includes('already')) throw created.error
    const listed = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (listed.error) throw listed.error
    userId = listed.data.users.find(user => user.email?.toLowerCase() === email.toLowerCase())?.id
    if (!userId) throw new Error('A conta existe, mas não foi possível localizá-la.')
} else {
    userId = created.data.user.id
}

const { error: linkError } = await supabase
    .from('barbeiros')
    .update({ email, user_id: userId, ativo: true })
    .eq('id', '00000000-0000-4000-8000-000000000002')

if (linkError) throw linkError
console.log(`Conta de Eliabner pronta: ${email}`)
