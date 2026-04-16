import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, isBefore, addDays, addWeeks, addMonths, nextDay, setDate } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScoreStatus, ChecklistItem, Frequencia } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calcular score de conformidade de uma inspeção
 */
export function calcularScore(itens: ChecklistItem[], respostas: any[]) {
  const itensComPeso = itens.filter(item => {
    const resp = respostas.find(r => r.itemId === item.id);
    return resp && resp.conforme !== null;
  });

  const totalPeso = itensComPeso.reduce((acc, item) => acc + (item.peso || 1), 0);
  if (totalPeso === 0) return { score: 0, scoreStatus: "NAO_CONFORME" as ScoreStatus, temCriticoReprovado: false };

  const totalConforme = itensComPeso.reduce((acc, item) => {
    const resp = respostas.find(r => r.itemId === item.id);
    if (resp?.conforme) return acc + (item.peso || 1);
    return acc;
  }, 0);

  const score = (totalConforme / totalPeso) * 100;
  
  const temCriticoReprovado = itensComPeso.some(item => {
    const resp = respostas.find(r => r.itemId === item.id);
    return item.isCritico && resp?.conforme === false;
  });

  let scoreStatus: ScoreStatus = "CONFORME";
  if (temCriticoReprovado || score < 50) {
    scoreStatus = "REPROVADO";
  } else if (score < 75) {
    scoreStatus = "NAO_CONFORME";
  } else if (score < 90) {
    scoreStatus = "ATENCAO";
  }

  return { score, scoreStatus, temCriticoReprovado };
}

/**
 * Formatar data em PT-BR
 */
export function formatarData(date: Date | string | number, formato: string = "dd/MM/yyyy") {
  try {
    return format(new Date(date), formato, { locale: ptBR });
  } catch (e) {
    return "Data inválida";
  }
}

/**
 * Formatar score com cor e label
 */
export function formatarScore(score: number, scoreStatus: ScoreStatus) {
  const config = {
    CONFORME: { label: "Conforme", cor: "text-green-600", bgCor: "bg-green-100", borderCor: "border-green-600" },
    ATENCAO: { label: "Atenção", cor: "text-amber-500", bgCor: "bg-amber-100", borderCor: "border-amber-500" },
    NAO_CONFORME: { label: "Não Conforme", cor: "text-red-600", bgCor: "bg-red-100", borderCor: "border-red-600" },
    REPROVADO: { label: "Reprovado", cor: "text-red-800", bgCor: "bg-red-200", borderCor: "border-red-800" },
  };

  return {
    ...config[scoreStatus],
    valor: `${score.toFixed(1)}%`
  };
}

/**
 * Formatar número de alunos
 */
export function formatarNumero(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

/**
 * Gerar ID único para sync offline
 */
export function gerarClienteId() {
  return `client_${crypto.randomUUID()}`;
}

/**
 * Truncar texto
 */
export function truncar(texto: string, maxChars: number) {
  if (texto.length <= maxChars) return texto;
  return texto.slice(0, maxChars) + "...";
}

/**
 * Calcular próxima execução de um agendamento
 */
export function calcularProximaExecucao(
  frequencia: Frequencia,
  diaSemana: number | null,
  diaMes: number | null,
  horario: string | null,
): Date {
  const agora = new Date()
  const [h = 8, m = 0] = (horario ?? '08:00').split(':').map(Number)

  if (frequencia === 'DIARIO') {
    const d = new Date(agora)
    d.setHours(h, m, 0, 0)
    if (isBefore(d, agora)) d.setDate(d.getDate() + 1)
    return d
  }

  if (frequencia === 'SEMANAL' || frequencia === 'QUINZENAL') {
    const alvo = diaSemana ?? 1
    let d = nextDay(agora, alvo as 0|1|2|3|4|5|6)
    d.setHours(h, m, 0, 0)
    if (frequencia === 'QUINZENAL') {
      const hoje = agora.getDay()
      if (hoje === alvo && isBefore(d, agora)) d = addWeeks(d, 2)
    }
    return d
  }

  if (frequencia === 'MENSAL') {
    const dia = diaMes ?? 1
    let d = setDate(agora, dia)
    d.setHours(h, m, 0, 0)
    if (isBefore(d, agora)) d = addMonths(d, 1)
    return d
  }

  return addDays(agora, 999)
}

/**
 * Descrição legível de frequência de agendamento
 */
export function descricaoFrequencia(
  frequencia: string,
  diaSemana: number | null,
  diaMes: number | null,
  horario: string | null,
): string {
  const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']
  const hor = horario ?? '08:00'

  if (frequencia === 'DIARIO') return `Todos os dias às ${hor}`
  if (frequencia === 'SEMANAL') return `Toda ${DIAS[diaSemana ?? 1]} às ${hor}`
  if (frequencia === 'QUINZENAL') return `A cada duas semanas na ${DIAS[diaSemana ?? 1]} às ${hor}`
  if (frequencia === 'MENSAL') return `Todo dia ${diaMes ?? 1} do mês às ${hor}`
  return 'Sob demanda'
}

/**
 * Calcular dias até prazo
 */
export function diasAtePrazo(prazo: Date | string) {
  const dataPrazo = new Date(prazo);
  const hoje = new Date();
  const dias = differenceInDays(dataPrazo, hoje);
  const vencido = isBefore(dataPrazo, hoje);
  const urgente = !vencido && dias <= 3;

  return { dias, vencido, urgente };
}
