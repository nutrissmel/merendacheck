import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DadosRelatorioInspecoes } from '@/actions/relatorios.actions'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    backgroundColor: '#FFFFFF',
    color: '#0F1B2D',
  },
  // ── Capa ──────────────────────────────────────────────────────
  capaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  capaTitulo: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    textAlign: 'center',
    marginBottom: 8,
  },
  capaSubtitulo: {
    fontSize: 14,
    color: '#5A7089',
    textAlign: 'center',
    marginBottom: 32,
  },
  capaDivider: {
    width: 60,
    height: 3,
    backgroundColor: '#0E2E60',
    marginBottom: 32,
  },
  capaInfo: {
    fontSize: 11,
    color: '#5A7089',
    textAlign: 'center',
    marginBottom: 6,
  },
  capaDestaque: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0F1B2D',
    textAlign: 'center',
    marginBottom: 6,
  },
  // ── Seções ────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottom: '1pt solid #D5E3F0',
  },
  // ── KPIs ──────────────────────────────────────────────────────
  kpisRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F5F9FD',
    borderRadius: 6,
    padding: 10,
    border: '1pt solid #D5E3F0',
  },
  kpiLabel: {
    fontSize: 8,
    color: '#5A7089',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  kpiValor: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
  },
  // ── Tabelas ───────────────────────────────────────────────────
  table: {
    width: '100%',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEF4FD',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: '1pt solid #EEF4FD',
  },
  tableRowAlt: {
    backgroundColor: '#F5F9FD',
  },
  tableCell: {
    fontSize: 9,
    color: '#0F1B2D',
  },
  tableCellGray: {
    fontSize: 9,
    color: '#5A7089',
  },
  // ── Score cores ───────────────────────────────────────────────
  scoreVerde: { color: '#00963A', fontFamily: 'Helvetica-Bold' },
  scoreAmber: { color: '#F59E0B', fontFamily: 'Helvetica-Bold' },
  scoreRed: { color: '#DC2626', fontFamily: 'Helvetica-Bold' },
  // ── Rodapé ────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #EEF4FD',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 8,
    color: '#A8BDD4',
  },
})

function formatarData(iso: string) {
  try { return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR }) } catch { return iso }
}

function corScore(score: number | null) {
  if (!score) return styles.tableCellGray
  if (score >= 90) return styles.scoreVerde
  if (score >= 70) return styles.scoreAmber
  return styles.scoreRed
}

interface Props {
  dados: DadosRelatorioInspecoes
}

export function RelatorioInspecoesPDF({ dados }: Props) {
  const periodoStr = `${formatarData(dados.periodo.inicio)} a ${formatarData(dados.periodo.fim)}`
  const nowBRT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const geradoEm = format(nowBRT, 'dd/MM/yyyy HH:mm', { locale: ptBR })

  return (
    <Document>
      {/* ── CAPA ─────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.capaContainer}>
          <Text style={styles.capaTitulo}>Relatório de Inspeções</Text>
          <Text style={styles.capaSubtitulo}>Conformidade Alimentar Escolar</Text>
          <View style={styles.capaDivider} />
          <Text style={styles.capaDestaque}>{dados.tenant.nomeSecretaria ?? dados.tenant.nome}</Text>
          <Text style={styles.capaInfo}>{dados.tenant.nome}</Text>
          <Text style={styles.capaInfo}>IBGE: {dados.tenant.codigoIbge} — {dados.tenant.estado}</Text>
          <Text style={{ ...styles.capaInfo, marginTop: 16 }}>Período: {periodoStr}</Text>
          <Text style={styles.capaInfo}>Gerado em: {geradoEm}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>MerendaCheck — {dados.tenant.nome}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ── RESUMO + POR ESCOLA ───────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Resumo Executivo</Text>

        <View style={styles.kpisRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Inspeções</Text>
            <Text style={styles.kpiValor}>{dados.resumo.totalInspecoes}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Escolas</Text>
            <Text style={styles.kpiValor}>{dados.resumo.totalEscolas}</Text>
          </View>
          <View style={{ ...styles.kpiCard }}>
            <Text style={styles.kpiLabel}>Score Médio</Text>
            <Text style={{ ...styles.kpiValor, color: dados.resumo.scoreMedio >= 90 ? '#00963A' : dados.resumo.scoreMedio >= 70 ? '#F59E0B' : '#DC2626' }}>
              {dados.resumo.scoreMedio}%
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>NCs Abertas</Text>
            <Text style={{ ...styles.kpiValor, color: dados.resumo.totalNCs > 0 ? '#DC2626' : '#00963A' }}>
              {dados.resumo.totalNCs}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Desempenho por Escola</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Escola</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Inspeções</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Score</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>NCs</Text>
          </View>
          {dados.porEscola.map((escola, idx) => (
            <View key={escola.id} style={idx % 2 !== 0 ? { ...styles.tableRow, ...styles.tableRowAlt } : styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 3 }}>{escola.nome}</Text>
              <Text style={{ ...styles.tableCellGray, flex: 1 }}>{escola.totalInspecoes}</Text>
              <Text style={{ ...corScore(escola.scoreMedio), flex: 1 }}>{escola.scoreMedio}%</Text>
              <Text style={{ ...styles.tableCell, flex: 1, color: escola.ncsAbertas > 0 ? '#DC2626' : '#00963A' }}>
                {escola.ncsAbertas}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>MerendaCheck — {dados.tenant.nome}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>

      {/* ── LISTA DE INSPEÇÕES ────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Inspeções Realizadas ({periodoStr})</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 3 }}>Escola</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Checklist</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Inspetor</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Data</Text>
            <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Score</Text>
          </View>
          {dados.inspecoes.map((insp, idx) => (
            <View key={insp.id} style={idx % 2 !== 0 ? { ...styles.tableRow, ...styles.tableRowAlt } : styles.tableRow} wrap={false}>
              <Text style={{ ...styles.tableCell, flex: 3 }}>{insp.escola}</Text>
              <Text style={{ ...styles.tableCellGray, flex: 2 }}>{insp.checklist}</Text>
              <Text style={{ ...styles.tableCellGray, flex: 2 }}>{insp.inspetor}</Text>
              <Text style={{ ...styles.tableCellGray, flex: 1 }}>{insp.data ? formatarData(insp.data) : '—'}</Text>
              <Text style={{ ...corScore(insp.score), flex: 1 }}>{insp.score != null ? `${insp.score}%` : '—'}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>MerendaCheck — {dados.tenant.nome}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
