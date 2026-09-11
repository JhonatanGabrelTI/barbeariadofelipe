import { createClient } from '@supabase/supabase-js'
import { addDays, format } from 'date-fns'
import { loadEnvFile } from 'node:process'

try {
    loadEnvFile('.env.eliabner.local')
} catch {
    // Variáveis também podem ser fornecidas pelo ambiente.
}

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY
const email = process.env.ELIABNER_EMAIL
const password = process.env.ELIABNER_PASSWORD
const barbeiroId = '00000000-0000-4000-8000-000000000002'

if (!url || !anonKey || !email || !password) {
    throw new Error('As credenciais de teste não estão configuradas.')
}

const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
if (signInError) throw signInError

let testDate
for (let daysAhead = 85; daysAhead <= 89; daysAhead += 1) {
    const candidate = addDays(new Date(), daysAhead)
    if (candidate.getDay() === 0) continue
    const day = format(candidate, 'yyyy-MM-dd')
    const { data, error } = await supabase.rpc('listar_agendamentos_publicos', {
        p_inicio: `${day}T00:00:00-03:00`,
        p_fim: `${day}T23:59:59-03:00`,
        p_barbeiro_id: barbeiroId,
    })
    if (error) throw error
    if (data.length === 0) {
        testDate = day
        break
    }
}

if (!testDate) throw new Error('Não foi encontrado um dia futuro vazio para o teste.')

const createdIds = []
const book = async (name, phone, time) => {
    const { data, error } = await supabase.rpc('agendar_horario_com_barbeiro', {
        p_user_id: null,
        p_nome_cliente: name,
        p_whatsapp: phone,
        p_servico: 'Corte de Cabelo',
        p_data_hora: `${testDate}T${time}:00-03:00`,
        p_duracao_minutos: 999,
        p_barbeiro_id: barbeiroId,
    })
    if (error) throw error
    if (data?.success && data.data?.id) createdIds.push(data.data.id)
    return data
}

try {
    const sameSlot = await Promise.all([
        book('TESTE ANTI-CONFLITO A', '43990000001', '09:00'),
        book('TESTE ANTI-CONFLITO B', '43990000002', '09:00'),
    ])
    const successfulSameSlot = sameSlot.filter(result => result?.success)
    const refusedSameSlot = sameSlot.filter(result => !result?.success)

    if (successfulSameSlot.length !== 1 || refusedSameSlot.length !== 1) {
        throw new Error(`Falha no teste simultâneo: ${successfulSameSlot.length} inserções aceitas.`)
    }

    const adjacent = await book('TESTE HORÁRIO SEGUINTE', '43990000003', '09:30')
    if (!adjacent?.success) {
        throw new Error(`O horário seguinte deveria estar livre: ${adjacent?.message || 'erro desconhecido'}`)
    }

    if (successfulSameSlot[0].data.duracao_minutos !== 30 || adjacent.data.duracao_minutos !== 30) {
        throw new Error('A duração enviada pelo aparelho foi aceita em vez da duração oficial.')
    }

    console.log(JSON.stringify({
        success: true,
        testedDate: testDate,
        simultaneousAttempts: 2,
        acceptedAtSameTime: 1,
        refusedAtSameTime: 1,
        adjacentSlotAccepted: true,
        serverDurationUsed: 30,
    }, null, 2))
} finally {
    if (createdIds.length > 0) {
        const { error: cleanupError } = await supabase
            .from('agendamentos')
            .update({ status: 'cancelado' })
            .in('id', createdIds)
        if (cleanupError) throw cleanupError
    }
}
