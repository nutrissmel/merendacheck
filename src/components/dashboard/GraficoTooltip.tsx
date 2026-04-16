'use client'

interface PayloadItem {
  color: string
  name: string
  value: number | string
  dataKey: string
}

interface GraficoTooltipProps {
  active?: boolean
  payload?: PayloadItem[]
  label?: string
  formatarValor?: (value: number | string, dataKey: string) => string
  unidade?: string
}

const formatacaoPadrao = (value: number | string, _dataKey: string): string => {
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(1)
  }
  return String(value)
}

export function GraficoTooltip({
  active,
  payload,
  label,
  formatarValor = formatacaoPadrao,
  unidade,
}: GraficoTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #D5E3F0',
        borderRadius: 8,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(14,46,96,0.12)',
        fontSize: 12,
        minWidth: 140,
      }}
    >
      {label && (
        <p
          style={{
            fontWeight: 700,
            color: '#0F1B2D',
            marginBottom: 8,
            paddingBottom: 6,
            borderBottom: '1px solid #D5E3F0',
          }}
        >
          {label}
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {payload.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: item.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: '#5A7089', flex: 1 }}>{item.name}</span>
            <span style={{ fontWeight: 700, color: '#0F1B2D' }}>
              {formatarValor(item.value, item.dataKey)}
              {unidade ? ` ${unidade}` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
