import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const backupPath = process.argv[2]
const outputDirectory = process.argv[3]
const felipeId = '00000000-0000-4000-8000-000000000001'

if (!backupPath || !outputDirectory) {
    console.error('Uso: node scripts/prepare-csv-import.mjs <backup.json> <pasta-de-saida>')
    process.exit(1)
}

const backup = JSON.parse(await readFile(resolve(backupPath), 'utf8'))
const target = resolve(outputDirectory)
await mkdir(target, { recursive: true })

const columns = {
    servicos: ['id', 'nome', 'preco', 'duracao_minutos', 'popular', 'ativo', 'ordem', 'created_at', 'updated_at'],
    produtos: ['id', 'nome', 'descricao', 'preco', 'estoque', 'categoria', 'ativo', 'created_at', 'updated_at', 'imagem_url'],
    agendamentos: ['id', 'user_id', 'nome_cliente', 'whatsapp', 'servico', 'data_hora', 'status', 'created_at', 'lembrete_enviado', 'whatsapp_notificado', 'duracao_minutos', 'barbeiro_id'],
    blocked_slots: ['id', 'data', 'hora_inicio', 'hora_fim', 'motivo', 'created_by', 'created_at', 'barbeiro_id'],
    blocked_clients: ['id', 'whatsapp', 'nome', 'motivo', 'created_at'],
}

function escapeCsv(value) {
    if (value === null || value === undefined) return ''
    const text = String(value)
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function escapeHtml(value) {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

for (const [table, tableColumns] of Object.entries(columns)) {
    const sourceRows = Array.isArray(backup[table]) ? backup[table] : []
    const rows = sourceRows.map(row => {
        if (table === 'agendamentos' || table === 'blocked_slots') {
            return { ...row, barbeiro_id: row.barbeiro_id || felipeId }
        }
        return row
    })
    const csv = [
        tableColumns.join(','),
        ...rows.map(row => tableColumns.map(column => escapeCsv(row[column])).join(',')),
    ].join('\n')
    await writeFile(resolve(target, `${table}.csv`), csv, 'utf8')
    await writeFile(
        resolve(target, `${table}.html`),
        `<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="csv">${escapeHtml(csv)}</pre></body></html>`,
        'utf8',
    )
    console.log(`${table}: ${rows.length} registros preparados`)
}

console.log(`Arquivos preparados em: ${target}`)
