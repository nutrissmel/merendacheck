import { describe, it, expect } from 'vitest'
import { calcularScore, formatarScore, truncar, diasAtePrazo } from '../utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type ItemMock = { id: string; peso?: number | null; isCritico?: boolean }
type RespostaMock = { itemId: string; conforme: boolean | null }

function item(id: string, opts: { peso?: number; isCritico?: boolean } = {}): ItemMock {
  return { id, peso: opts.peso ?? 1, isCritico: opts.isCritico ?? false }
}

function resp(itemId: string, conforme: boolean | null): RespostaMock {
  return { itemId, conforme }
}

// ─── calcularScore ────────────────────────────────────────────────────────────

describe('calcularScore', () => {
  it('retorna score 0 quando não há respostas', () => {
    const itens = [item('i1'), item('i2')]
    const respostas: RespostaMock[] = []
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(0)
    expect(resultado.scoreStatus).toBe('NAO_CONFORME')
    expect(resultado.temCriticoReprovado).toBe(false)
  })

  it('retorna CONFORME quando todos os itens estão conformes (score ≥ 90)', () => {
    const itens = [item('i1'), item('i2'), item('i3'), item('i4'), item('i5')]
    const respostas = itens.map((i) => resp(i.id, true))
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(100)
    expect(resultado.scoreStatus).toBe('CONFORME')
    expect(resultado.temCriticoReprovado).toBe(false)
  })

  it('retorna ATENCAO quando score está entre 75 e 89', () => {
    // 4 de 5 conformes = 80%
    const itens = [item('i1'), item('i2'), item('i3'), item('i4'), item('i5')]
    const respostas = [
      resp('i1', true), resp('i2', true), resp('i3', true), resp('i4', true), resp('i5', false),
    ]
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(80)
    expect(resultado.scoreStatus).toBe('ATENCAO')
  })

  it('retorna NAO_CONFORME quando score está entre 50 e 74', () => {
    // 3 de 5 conformes = 60%
    const itens = [item('i1'), item('i2'), item('i3'), item('i4'), item('i5')]
    const respostas = [
      resp('i1', true), resp('i2', true), resp('i3', true), resp('i4', false), resp('i5', false),
    ]
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(60)
    expect(resultado.scoreStatus).toBe('NAO_CONFORME')
  })

  it('retorna REPROVADO quando score < 50', () => {
    // 1 de 5 conformes = 20%
    const itens = [item('i1'), item('i2'), item('i3'), item('i4'), item('i5')]
    const respostas = [
      resp('i1', true), resp('i2', false), resp('i3', false), resp('i4', false), resp('i5', false),
    ]
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(20)
    expect(resultado.scoreStatus).toBe('REPROVADO')
  })

  it('retorna REPROVADO quando item crítico é reprovado independente do score', () => {
    // 9 de 10 conformes = 90% — mas item crítico reprovado → REPROVADO
    const itens = [
      item('i1'), item('i2'), item('i3'), item('i4'), item('i5'),
      item('i6'), item('i7'), item('i8'), item('i9'),
      item('i_crit', { isCritico: true }),
    ]
    const respostas = itens.map((i) => resp(i.id, i.id === 'i_crit' ? false : true))
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.temCriticoReprovado).toBe(true)
    expect(resultado.scoreStatus).toBe('REPROVADO')
    expect(resultado.score).toBe(90)
  })

  it('respeita peso dos itens no cálculo', () => {
    // item A: peso 3, conforme → contribui 3
    // item B: peso 1, não conforme → contribui 0
    // total peso: 4, total conforme: 3 → 75%
    const itens = [item('a', { peso: 3 }), item('b', { peso: 1 })]
    const respostas = [resp('a', true), resp('b', false)]
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(75)
    expect(resultado.scoreStatus).toBe('ATENCAO')
  })

  it('ignora itens sem resposta no cálculo', () => {
    // só 'i1' tem resposta conforme → score 100%
    const itens = [item('i1'), item('i2'), item('i3')]
    const respostas = [resp('i1', true)]
    const resultado = calcularScore(itens as any, respostas)
    expect(resultado.score).toBe(100)
    expect(resultado.scoreStatus).toBe('CONFORME')
  })

  it('usa peso 1 quando item.peso é null ou undefined', () => {
    const itens = [{ id: 'a', peso: null, isCritico: false }, { id: 'b', peso: undefined, isCritico: false }]
    const respostas = [resp('a', true), resp('b', false)]
    const resultado = calcularScore(itens as any, respostas)
    // 1 conforme de 2 = 50% → NAO_CONFORME (score < 75 mas >= 50)
    expect(resultado.score).toBe(50)
    expect(resultado.scoreStatus).toBe('NAO_CONFORME')
  })
})

// ─── formatarScore ────────────────────────────────────────────────────────────

describe('formatarScore', () => {
  it('formata score CONFORME com cor verde', () => {
    const resultado = formatarScore(95.5, 'CONFORME' as any)
    expect(resultado.label).toBe('Conforme')
    expect(resultado.cor).toContain('green')
    expect(resultado.valor).toBe('95.5%')
  })

  it('formata score REPROVADO com cor vermelha escura', () => {
    const resultado = formatarScore(30, 'REPROVADO' as any)
    expect(resultado.label).toBe('Reprovado')
    expect(resultado.cor).toContain('red')
    expect(resultado.valor).toBe('30.0%')
  })

  it('formata score ATENCAO com cor âmbar', () => {
    const resultado = formatarScore(80, 'ATENCAO' as any)
    expect(resultado.label).toBe('Atenção')
    expect(resultado.cor).toContain('amber')
  })

  it('formata score NAO_CONFORME', () => {
    const resultado = formatarScore(60, 'NAO_CONFORME' as any)
    expect(resultado.label).toBe('Não Conforme')
  })
})

// ─── truncar ─────────────────────────────────────────────────────────────────

describe('truncar', () => {
  it('retorna texto original quando menor que o limite', () => {
    expect(truncar('Olá', 10)).toBe('Olá')
  })

  it('retorna texto original quando igual ao limite', () => {
    expect(truncar('12345', 5)).toBe('12345')
  })

  it('trunca texto e adiciona reticências', () => {
    expect(truncar('Texto muito longo', 10)).toBe('Texto muit...')
  })
})

// ─── diasAtePrazo ─────────────────────────────────────────────────────────────

describe('diasAtePrazo', () => {
  it('identifica prazo vencido', () => {
    const ontem = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const resultado = diasAtePrazo(ontem)
    expect(resultado.vencido).toBe(true)
    expect(resultado.urgente).toBe(false)
  })

  it('identifica prazo urgente (≤ 3 dias)', () => {
    const amanha = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const resultado = diasAtePrazo(amanha)
    expect(resultado.vencido).toBe(false)
    expect(resultado.urgente).toBe(true)
  })

  it('identifica prazo confortável', () => {
    const daqui10 = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    const resultado = diasAtePrazo(daqui10)
    expect(resultado.vencido).toBe(false)
    expect(resultado.urgente).toBe(false)
    expect(resultado.dias).toBeGreaterThan(3)
  })
})
