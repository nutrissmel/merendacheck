import type { Papel } from '@prisma/client'
import type { InspecaoResumo } from './escola'

export type UsuarioComMetricas = {
  id: string
  nome: string
  email: string
  papel: Papel
  ativo: boolean
  primeiroAcesso: boolean
  createdAt: Date
  escolas: { id: string; nome: string }[]
  totalInspecoes: number
  inspecoesMes: number
  ultimaInspecao: Date | null
}

export type UsuarioDetalhado = UsuarioComMetricas & {
  inspecoesRecentes: InspecaoResumo[]
  ncsGeradas: number
  mediascore: number | null
}
