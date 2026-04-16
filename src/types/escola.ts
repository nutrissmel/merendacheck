import type { ScoreStatus, Turno } from '@prisma/client'

export type UsuarioSimples = {
  id: string
  nome: string
  email: string
  papel: string
}

export type InspecaoResumo = {
  id: string
  iniciadaEm: Date
  finalizadaEm: Date | null
  score: number | null
  scoreStatus: ScoreStatus | null
  checklist: { nome: string; categoria: string }
}

export type EscolaComMetricas = {
  id: string
  nome: string
  codigoInep: string | null
  cidade: string | null
  turnos: Turno[]
  numeroAlunos: number
  ativa: boolean
  ultimaInspecao: {
    data: Date
    score: number
    scoreStatus: ScoreStatus
  } | null
  scoreMedioMes: number | null
  ncsAbertas: number
  totalUsuarios: number
}

export type EscolaDetalhada = EscolaComMetricas & {
  endereco: string | null
  bairro: string | null
  cep: string | null
  usuarios: UsuarioSimples[]
  inspecoesRecentes: InspecaoResumo[]
  createdAt: Date
  updatedAt: Date
}

export type CriarEscolaInput = {
  nome: string
  codigoInep?: string
  endereco?: string
  bairro?: string
  cidade?: string
  cep?: string
  numeroAlunos: number
  turnos: Turno[]
}

export type AtualizarEscolaInput = Partial<CriarEscolaInput>
