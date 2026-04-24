'use server'

import prisma from '@/lib/prisma'
import { getServerUser } from '@/lib/auth'
import { isBefore, startOfDay, endOfDay } from 'date-fns'
import type { Frequencia } from '@prisma/client'
import { calcularProximaExecucao } from '@/lib/utils'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AgendamentoCompleto {
  id: string
  escola: { id: string; nome: string }
  checklist: { id: string; nome: string; categoria: string }
  frequencia: Frequencia
  diaSemana: number | null
  diaMes: number | null
  horario: string | null
  ativo: boolean
  proximaExecucao: Date | null
  atrasado: boolean
  createdAt: Date
}

// ─── Ações ────────────────────────────────────────────────────────────────────

export async function listarAgendamentos(): Promise<AgendamentoCompleto[]> {
  const user = await getServerUser()

  const agendamentos = await prisma.agendamento.findMany({
    where: { tenantId: user.tenantId },
    include: {
      escola: { select: { id: true, nome: true } },
      checklist: { select: { id: true, nome: true, categoria: true } },
    },
    orderBy: [{ ativo: 'desc' }, { proximaExecucao: 'asc' }],
  })

  const agora = new Date()

  return agendamentos.map((a) => ({
    id: a.id,
    escola: a.escola,
    checklist: { id: a.checklist.id, nome: a.checklist.nome, categoria: a.checklist.categoria },
    frequencia: a.frequencia,
    diaSemana: a.diaSemana,
    diaMes: a.diaMes,
    horario: a.horario,
    ativo: a.ativo,
    proximaExecucao: a.proximaExecucao,
    atrasado: a.ativo && a.proximaExecucao != null && isBefore(a.proximaExecucao, agora),
    createdAt: a.createdAt,
  }))
}

export async function criarAgendamento(dados: {
  escolaId: string
  checklistId: string
  frequencia: Frequencia
  diaSemana?: number
  diaMes?: number
  horario?: string
}): Promise<{ sucesso: true; id: string } | { sucesso: false; erro: string }> {
  try {
    const user = await getServerUser()

    const proximaExecucao = calcularProximaExecucao(
      dados.frequencia,
      dados.diaSemana ?? null,
      dados.diaMes ?? null,
      dados.horario ?? null,
    )

    const ag = await prisma.agendamento.create({
      data: {
        tenantId: user.tenantId,
        escolaId: dados.escolaId,
        checklistId: dados.checklistId,
        frequencia: dados.frequencia,
        diaSemana: dados.diaSemana ?? null,
        diaMes: dados.diaMes ?? null,
        horario: dados.horario ?? '08:00',
        ativo: true,
        proximaExecucao,
      },
    })

    return { sucesso: true, id: ag.id }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro ao criar agendamento' }
  }
}

export async function toggleAgendamento(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const user = await getServerUser()

    const ag = await prisma.agendamento.findFirst({
      where: { id, tenantId: user.tenantId },
    })
    if (!ag) return { sucesso: false, erro: 'Agendamento não encontrado' }

    const novoAtivo = !ag.ativo
    const proximaExecucao = novoAtivo
      ? calcularProximaExecucao(ag.frequencia, ag.diaSemana, ag.diaMes, ag.horario)
      : ag.proximaExecucao

    await prisma.agendamento.update({
      where: { id },
      data: { ativo: novoAtivo, proximaExecucao },
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro' }
  }
}

export async function excluirAgendamento(
  id: string,
): Promise<{ sucesso: boolean; erro?: string }> {
  try {
    const user = await getServerUser()

    await prisma.agendamento.deleteMany({
      where: { id, tenantId: user.tenantId },
    })

    return { sucesso: true }
  } catch (err: any) {
    return { sucesso: false, erro: err?.message ?? 'Erro' }
  }
}

export async function buscarEscolasEChecklists() {
  const user = await getServerUser()

  const [escolas, checklists] = await Promise.all([
    prisma.escola.findMany({
      where: { tenantId: user.tenantId, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.checklistModelo.findMany({
      where: { tenantId: user.tenantId, ativo: true },
      select: { id: true, nome: true, categoria: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  return { escolas, checklists }
}

export async function buscarAgendamentosHoje() {
  const user = await getServerUser()
  const hoje = new Date()

  return prisma.agendamento.findMany({
    where: {
      tenantId: user.tenantId,
      ativo: true,
      proximaExecucao: { gte: startOfDay(hoje), lte: endOfDay(hoje) },
    },
    include: {
      escola: { select: { id: true, nome: true } },
      checklist: { select: { id: true, nome: true, categoria: true } },
    },
    orderBy: { proximaExecucao: 'asc' },
  })
}

export async function buscarProximasInspecoes(limite = 5) {
  const user = await getServerUser()

  return prisma.agendamento.findMany({
    where: {
      tenantId: user.tenantId,
      ativo: true,
      frequencia: { not: 'SOB_DEMANDA' },
    },
    include: {
      escola: { select: { id: true, nome: true } },
      checklist: { select: { id: true, nome: true, categoria: true } },
    },
    orderBy: { proximaExecucao: 'asc' },
    take: limite,
  })
}
