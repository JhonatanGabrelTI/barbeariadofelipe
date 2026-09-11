export function timeToMinutes(time: string): number {
    const [hours = 0, minutes = 0] = time.slice(0, 5).split(':').map(Number)
    return hours * 60 + minutes
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
