'use client'

import {
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  format,
  isYesterday,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TempoRelativoProps {
  data: Date | string | null
  nullLabel?: string
  className?: string
}

function calcular(data: Date): string {
  const agora = new Date()
  const mins = differenceInMinutes(agora, data)

  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `há ${mins} min`

  const horas = differenceInHours(agora, data)
  if (horas < 24) return `há ${horas}h`

  if (isYesterday(data)) return 'Ontem'

  const dias = differenceInDays(agora, data)
  if (dias < 7) return `há ${dias} dias`

  const semanas = differenceInWeeks(agora, data)
  if (semanas < 4) return `há ${semanas} sem.`

  const meses = differenceInMonths(agora, data)
  if (meses < 12) return format(data, "d 'de' MMMM", { locale: ptBR })

  return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function TempoRelativo({ data, nullLabel = 'Nunca', className }: TempoRelativoProps) {
  if (!data) {
    return <span className={cn('text-neutral-400', className)}>{nullLabel}</span>
  }

  const date = typeof data === 'string' ? new Date(data) : data
  const relativo = calcular(date)
  const completo = format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <span className={cn('cursor-default', className)} title={completo}>
      {relativo}
    </span>
  )
}
