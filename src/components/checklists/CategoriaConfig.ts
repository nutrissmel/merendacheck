import {
  Thermometer,
  PackageCheck,
  ShieldCheck,
  Building2,
  ChefHat,
  Bug,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CategoriaChecklist } from '@prisma/client'

export type CategoriaInfo = {
  label: string
  cor: string
  corFundo: string
  icone: LucideIcon
  descricao: string
}

export const CATEGORIA_CONFIG: Record<CategoriaChecklist, CategoriaInfo> = {
  TEMPERATURA: {
    label: 'Temperatura',
    cor: '#2260C4',
    corFundo: '#EEF4FD',
    icone: Thermometer,
    descricao: 'Controle de temperatura de câmaras, transporte e cocção',
  },
  RECEBIMENTO_GENEROS: {
    label: 'Recebimento',
    cor: '#D97706',
    corFundo: '#FEF3C7',
    icone: PackageCheck,
    descricao: 'Inspeção de gêneros alimentícios no recebimento',
  },
  HIGIENE_PESSOAL: {
    label: 'Higiene Pessoal',
    cor: '#00963A',
    corFundo: '#D1F7E2',
    icone: ShieldCheck,
    descricao: 'EPI, uniformes, higiene das manipuladoras',
  },
  INSTALACOES: {
    label: 'Instalações',
    cor: '#7C3AED',
    corFundo: '#EDE9FE',
    icone: Building2,
    descricao: 'Cozinha, refeitório, almoxarifado, piso e paredes',
  },
  PREPARACAO_DISTRIBUICAO: {
    label: 'Preparação',
    cor: '#DC2626',
    corFundo: '#FEE2E2',
    icone: ChefHat,
    descricao: 'Temperatura de cocção, tempo de espera, porcionamento',
  },
  CONTROLE_PRAGAS: {
    label: 'Controle de Pragas',
    cor: '#0369A1',
    corFundo: '#E0F2FE',
    icone: Bug,
    descricao: 'Evidências de pragas, dedetização, ratoeiras',
  },
  HIGIENIZACAO_UTENSILIOS: {
    label: 'Higienização',
    cor: '#059669',
    corFundo: '#D1FAE5',
    icone: Sparkles,
    descricao: 'Limpeza de panelas, equipamentos e utensílios',
  },
  OUTRO: {
    label: 'Outro',
    cor: '#5A7089',
    corFundo: '#F5F9FD',
    icone: MoreHorizontal,
    descricao: 'Outros tipos de inspeção personalizados',
  },
}

export const FREQUENCIA_LABEL: Record<string, string> = {
  DIARIO: 'Diário',
  SEMANAL: 'Semanal',
  QUINZENAL: 'Quinzenal',
  MENSAL: 'Mensal',
  SOB_DEMANDA: 'Sob demanda',
}

export const TIPO_RESPOSTA_LABEL: Record<string, string> = {
  SIM_NAO: 'Sim/Não',
  NUMERICO: 'Numérico',
  TEXTO_LIVRE: 'Texto livre',
  MULTIPLA_ESCOLHA: 'Múltipla escolha',
  FOTO: 'Foto',
  ESCALA: 'Escala 1–5',
}
