import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from 'node:process'

try {
    loadEnvFile('.env.migration.local')
} catch {
    // Também aceita as variáveis definidas diretamente no terminal.
}

const backupArgument = process.argv[2]
const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const felipeId = '00000000-0000-4000-8000-000000000001'

if (!backupArgument || !url || !serviceRoleKey) {
    console.error('Uso: npm run import:backup -- "C:\\caminho\\barbearia-backup.json"')
    console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.migration.local.')
    process.exit(1)
}

const backupPath = resolve(backupArgument)
const backup = JSON.parse(await readFile(backupPath, 'utf8'))
const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

const tableOrder = [
    'servicos',
    'produtos',
    'admin_emails',
    'blocked_clients',
    'whatsapp_config',
    'agendamentos',
    'blocked_slots',
]

function prepareRows(table, rows) {
    if (table === 'agendamentos' || table === 'blocked_slots') {
        return rows.map(row => ({ ...row, barbeiro_id: row.barbeiro_id || felipeId }))
    }
    if (table === 'blocked_clients') {
        return rows.map(row => ({
            ...row,
            motivo: String(row.motivo || '').trim() || 'Motivo não informado (registro anterior)',
        }))
    }
    return rows
}

async function importTable(table) {
    const rows = prepareRows(table, Array.isArray(backup[table]) ? backup[table] : [])
    if (!rows.length) {
        console.log(`${table}: 0 registros (sem alterações)`)
        return
    }

    const conflictColumn = table === 'admin_emails' ? 'email' : 'id'
    for (let offset = 0; offset < rows.length; offset += 200) {
        const batch = rows.slice(offset, offset + 200)
        const { error } = await supabase.from(table).upsert(batch, {
            onConflict: conflictColumn,
            ignoreDuplicates: false,
        })
        if (error) throw new Error(`${table}: ${error.message}`)
    }

    console.log(`${table}: ${rows.length} registros importados`)
}

for (const table of tableOrder) await importTable(table)

const expected = Object.fromEntries(tableOrder.map(table => [table, backup[table]?.length || 0]))
for (const table of tableOrder) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) throw new Error(`Validação de ${table}: ${error.message}`)
    if ((count || 0) < expected[table]) {
        throw new Error(`Validação de ${table}: esperado pelo menos ${expected[table]}, encontrado ${count || 0}`)
    }
}

console.log('Backup importado e validado com sucesso, sem excluir registros existentes.')
