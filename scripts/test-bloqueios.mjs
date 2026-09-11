import { createClient } from '@supabase/supabase-js'
import { addDays, format } from 'date-fns'
import { loadEnvFile } from 'node:process'

try { loadEnvFile('.env.eliabner.local') } catch { /* ambiente já configurado */ }

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const email = process.env.ELIABNER_EMAIL
const password = process.env.ELIABNER_PASSWORD
const barbeiroId = '00000000-0000-4000-8000-000000000002'

if (!url || !anonKey || !email || !password) throw new Error('Credenciais de teste ausentes.')

const supabase = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
if (signInError) throw signInError

let testDate
for (let daysAhead = 80; daysAhead <= 84; daysAhead += 1) {
    const candidate = addDays(new Date(), daysAhead)
    if (candidate.getDay() === 0) continue
    const day = format(candidate, 'yyyy-MM-dd')
    const [{ data: appointments, error: appointmentsError }, { data: blocks, error: blocksError }] = await Promise.all([
        supabase.rpc('listar_agendamentos_publicos', {
            p_inicio: `${day}T00:00:00-03:00`, p_fim: `${day}T23:59:59-03:00`, p_barbeiro_id: barbeiroId,
        }),
        supabase.from('blocked_slots').select('id').eq('data', day).eq('barbeiro_id', barbeiroId),
    ])
    if (appointmentsError) throw appointmentsError
    if (blocksError) throw blocksError
    if (appointments.length === 0 && blocks.length === 0) { testDate = day; break }
}

if (!testDate) throw new Error('Nenhum dia vazio foi encontrado para o teste.')

let blockId
let appointmentId
try {
    const { data: created, error: createError } = await supabase.rpc('criar_bloqueio_horario', {
        p_data: testDate,
        p_hora_inicio: '10:00',
        p_hora_fim: '11:00',
        p_motivo: 'TESTE AUTOMÁTICO',
        p_barbeiro_id: barbeiroId,
    })
    if (createError) throw createError
    if (!created?.success) throw new Error(created?.message || 'Falha ao criar bloqueio.')
    blockId = created.data.id

    const { data: overlap, error: overlapError } = await supabase.rpc('criar_bloqueio_horario', {
        p_data: testDate,
        p_hora_inicio: '10:30',
        p_hora_fim: '11:30',
        p_motivo: 'TESTE SOBREPOSTO',
        p_barbeiro_id: barbeiroId,
    })
    if (overlapError) throw overlapError
    if (overlap?.success) throw new Error('Um bloqueio sobreposto foi aceito.')

    const book = async (time, phone) => {
        const { data, error } = await supabase.rpc('agendar_horario_com_barbeiro', {
            p_user_id: null,
            p_nome_cliente: 'TESTE DE BLOQUEIO',
            p_whatsapp: phone,
            p_servico: 'Corte de Cabelo',
            p_data_hora: `${testDate}T${time}:00-03:00`,
            p_duracao_minutos: 30,
            p_barbeiro_id: barbeiroId,
        })
        if (error) throw error
        return data
    }

    const inside = await book('10:00', '43990000011')
    if (inside?.success) throw new Error('Um agendamento entrou dentro do bloqueio.')

    const adjacent = await book('11:00', '43990000012')
    if (!adjacent?.success) throw new Error(adjacent?.message || 'O horário após o bloqueio foi recusado.')
    appointmentId = adjacent.data.id

    console.log(JSON.stringify({
        success: true,
        exactStartRecognized: true,
        overlappingBlockRefused: true,
        appointmentInsideRefused: true,
        adjacentAppointmentAccepted: true,
    }, null, 2))
} finally {
    if (appointmentId) {
        const { error } = await supabase.from('agendamentos').update({ status: 'cancelado' }).eq('id', appointmentId)
        if (error) throw error
    }
    if (blockId) {
        const { error } = await supabase.from('blocked_slots').delete().eq('id', blockId)
        if (error) throw error
    }
}
