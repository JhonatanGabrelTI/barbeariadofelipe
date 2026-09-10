export type BarbeiroId = '00000000-0000-4000-8000-000000000001' | '00000000-0000-4000-8000-000000000002'

export type Barbeiro = {
    id: BarbeiroId
    nome: string
    foto: string
}

export const BARBEIROS: Barbeiro[] = [
    {
        id: '00000000-0000-4000-8000-000000000001',
        nome: 'Felipe',
        foto: '/barbeiros/felipe.png',
    },
    {
        id: '00000000-0000-4000-8000-000000000002',
        nome: 'Eliabner',
        foto: '/barbeiros/eliabner.png',
    },
]

export function getBarbeiro(id?: string | null) {
    return BARBEIROS.find(barbeiro => barbeiro.id === id)
}
