import { createClient } from '@supabase/supabase-js'
import { loadEnvFile } from 'node:process'

try {
    loadEnvFile('.env.eliabner.local')
} catch {
    // Variáveis também podem ser fornecidas pelo ambiente.
}

const url = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY
const email = process.env.ELIABNER_EMAIL
const password = process.env.ELIABNER_PASSWORD

if (!url || (!serviceRoleKey && (!anonKey || !email || !password))) {
    throw new Error('Informe a URL e uma credencial de acesso ao Supabase.')
}

const supabase = createClient(url, serviceRoleKey || anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

if (!serviceRoleKey) {
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) throw signInError
}

const barberIds = [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
]
const auditStart = process.env.AUDIT_START || '2026-09-01T00:00:00.000Z'
const auditEnd = process.env.AUDIT_END || '2027-01-01T00:00:00.000Z'

const [appointmentsResults, { data: servicos, error: servicesError }, { data: blockedSlots, error: blockedError }] = await Promise.all([
    Promise.all(barberIds.map(barbeiroId => supabase.rpc('listar_agendamentos_publicos', {
        p_inicio: auditStart,
        p_fim: auditEnd,
        p_barbeiro_id: barbeiroId,
    }))),
    supabase.from('servicos').select('nome,duracao_minutos,ativo').order('ordem'),
    supabase.from('blocked_slots').select('id,data,hora_inicio,hora_fim,motivo,barbeiro_id').order('data'),
])

const appointmentsError = appointmentsResults.find(result => result.error)?.error
if (appointmentsError) throw appointmentsError
if (servicesError) throw servicesError
if (blockedError) throw blockedError

const agendamentos = appointmentsResults
    .flatMap((result, index) => (result.data || []).map(appointment => ({
        ...appointment,
        barbeiro_id: appointment.barbeiro_id || barberIds[index],
    })))
    .sort((left, right) => new Date(left.data_hora) - new Date(right.data_hora))

const overlaps = []
for (let leftIndex = 0; leftIndex < agendamentos.length; leftIndex += 1) {
    const left = agendamentos[leftIndex]
    const leftStart = new Date(left.data_hora).getTime()
    const leftEnd = leftStart + (left.duracao_minutos || 30) * 60_000

    for (let rightIndex = leftIndex + 1; rightIndex < agendamentos.length; rightIndex += 1) {
        const right = agendamentos[rightIndex]
        if (right.barbeiro_id !== left.barbeiro_id) continue

        const rightStart = new Date(right.data_hora).getTime()
        if (rightStart >= leftEnd) break
        const rightEnd = rightStart + (right.duracao_minutos || 30) * 60_000
        if (leftStart < rightEnd && rightStart < leftEnd) {
            overlaps.push({ left, right })
        }
    }
}

const serviceDuration = new Map(servicos.map(service => [service.nome, service.duracao_minutos]))
const mismatchedDurations = agendamentos.filter(appointment => {
    const currentDuration = serviceDuration.get(appointment.servico)
    return currentDuration !== undefined && currentDuration !== appointment.duracao_minutos
})

const simultaneousDifferentBarbers = []
for (let leftIndex = 0; leftIndex < agendamentos.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < agendamentos.length; rightIndex += 1) {
        const left = agendamentos[leftIndex]
        const right = agendamentos[rightIndex]
        if (left.data_hora !== right.data_hora) continue
        if (left.barbeiro_id === right.barbeiro_id) continue
        simultaneousDifferentBarbers.push({ left, right })
    }
}

const overlappingBlocks = []
for (let leftIndex = 0; leftIndex < blockedSlots.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < blockedSlots.length; rightIndex += 1) {
        const left = blockedSlots[leftIndex]
        const right = blockedSlots[rightIndex]
        if (left.data !== right.data || left.barbeiro_id !== right.barbeiro_id) continue
        if (left.hora_inicio < right.hora_fim && right.hora_inicio < left.hora_fim) {
            overlappingBlocks.push({ left, right })
        }
    }
}

console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    range: { start: auditStart, end: auditEnd },
    appointmentCount: agendamentos.length,
    overlaps,
    simultaneousDifferentBarbers,
    blockedSlotCount: blockedSlots.length,
    overlappingBlocks,
    services: servicos,
    mismatchedDurations,
}, null, 2))
