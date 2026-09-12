export function timeToMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.slice(0, 5).split(':').map(Number)
    return hours * 60 + minutes
}

export const BARBERSHOP_TIME_ZONE = 'America/Sao_Paulo'

type DateParts = {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
}

const datePartsFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BARBERSHOP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
})

function getDateParts(date: Date): DateParts {
    const parts = Object.fromEntries(
        datePartsFormatter.formatToParts(date)
            .filter(part => part.type !== 'literal')
            .map(part => [part.type, Number(part.value)]),
    )

    return parts as DateParts
}

export function barbershopDateTimeToDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.slice(0, 5).split(':').map(Number)
    const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0)
    let instant = desiredUtc

    // Converte uma data/hora da barbearia em um instante UTC sem depender do
    // fuso configurado no celular ou computador do cliente.
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const current = getDateParts(new Date(instant))
        const representedUtc = Date.UTC(
            current.year,
            current.month - 1,
            current.day,
            current.hour,
            current.minute,
            current.second,
        )
        instant += desiredUtc - representedUtc
    }

    return new Date(instant)
}

export function getBarbershopDateKey(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    const { year, month, day } = getDateParts(date)
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function addDaysToDateKey(date: string, amount: number): string {
    const [year, month, day] = date.split('-').map(Number)
    const result = new Date(Date.UTC(year, month - 1, day + amount))
    return result.toISOString().slice(0, 10)
}

export function formatBarbershopTime(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BARBERSHOP_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date)
}

export function formatBarbershopShortDate(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BARBERSHOP_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
    }).format(date)
}

export function formatBarbershopDateTime(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BARBERSHOP_TIME_ZONE,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date)
}

export function formatBarbershopLongDateTime(value: Date | string): string {
    const date = typeof value === 'string' ? new Date(value) : value
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: BARBERSHOP_TIME_ZONE,
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(date)
}

export function isTimeInRange(time: string, start: string, end: string): boolean {
    const value = timeToMinutes(time)
    return value >= timeToMinutes(start) && value < timeToMinutes(end)
}

export function timeRangesOverlap(
    startA: string,
    endA: string,
    startB: string,
    endB: string,
): boolean {
    return timeToMinutes(startA) < timeToMinutes(endB)
        && timeToMinutes(startB) < timeToMinutes(endA)
}
