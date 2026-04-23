import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DadosFNDE } from '@/actions/relatorios.actions'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 50,
    paddingBottom: 60,
    paddingHorizontal: 50,
    backgroundColor: '#FFFFFF',
    color: '#0F1B2D',
  },
  header: {
    borderBottom: '2pt solid #0E2E60',
    paddingBottom: 12,
    marginBottom: 20,
  },
  orgao: {
    fontSize: 8,
    color: '#5A7089',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  titulo: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 10,
    color: '#5A7089',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1pt solid #D5E3F0',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 9,
    color: '#5A7089',
    width: 140,
  },
  value: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F1B2D',
    flex: 1,
  },
  // Tabela
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EEF4FD',
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: '1pt solid #EEF4FD',
  },
  tableRowAlt: { backgroundColor: '#F5F9FD' },
  tableCell: { fontSize: 8, color: '#0F1B2D' },
  tableCellGray: { fontSize: 8, color: '#5A7089' },
  // Resumo conformidade
  resumoBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  resumoCard: {
    flex: 1,
    border: '1pt solid #D5E3F0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#F5F9FD',
  },
  resumoLabel: {
    fontSize: 7,
    color: '#5A7089',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  resumoValor: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0E2E60',
  },
  // Assinatura
  assinaturaSection: {
    marginTop: 40,
    flexDirection: 'row',
    gap: 30,
  },
  assinaturaBox: {
    flex: 1,
    alignItems: 'center',
  },
  assinaturaLinha: {
    width: '80%',
    borderBottom: '1pt solid #0F1B2D',
    marginBottom: 4,
  },
  assinaturaLabel: {
    fontSize: 8,
    color: '#5A7089',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #EEF4FD',
    paddingTop: 5,
  },
  footerText: { fontSize: 7, color: '#A8BDD4' },
  sealBox: {
    marginTop: 40,
    border: '1pt dashed #D5E3F0',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
  },
  sealText: {
    fontSize: 8,
    color: '#A8BDD4',
    textAlign: 'center',
  },
})

function fmt(iso: string) {
  try { return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR }) } catch { return iso }
}

function fmtMes(iso: string) {
  try { return format(new Date(iso), 'MMMM/yyyy', { locale: ptBR }) } catch { return iso }
}

export function RelatorioFNDEPDF({ dados }: { dados: DadosFNDE }) {
  const nowBRT = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const geradoEm = format(nowBRT, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const periodoStr = `${fmtMes(dados.periodo.inicio)}`
  const taxaCertificacao = dados.totalEscolas > 0
    ? Math.round((dados.escolasCertificadas / dados.totalEscolas) * 100)
    : 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho formal */}
        <View style={styles.header}>
          <Text style={styles.orgao}>
            {dados.tenant.estado} — IBGE {dados.tenant.codigoIbge}
          </Text>
          <Text style={styles.titulo}>{dados.tenant.nomeSecretaria ?? dados.tenant.nome}</Text>
          <Text style={styles.subtitulo}>
            Relatório de Conformidade — Programa Nacional de Alimentação Escolar (PNAE)
          </Text>
        </View>

        {/* Identificação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Município:</Text>
            <Text style={styles.value}>{dados.tenant.nome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Código IBGE:</Text>
            <Text style={styles.value}>{dados.tenant.codigoIbge}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Período de referência:</Text>
            <Text style={styles.value}>{fmt(dados.periodo.inicio)} a {fmt(dados.periodo.fim)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Responsável técnico:</Text>
            <Text style={styles.value}>{dados.responsavel.nome}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>E-mail do responsável:</Text>
            <Text style={styles.value}>{dados.responsavel.email}</Text>
          </View>
        </View>

        {/* Resumo conformidade */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo de Conformidade</Text>
          <View style={styles.resumoBox}>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Total de Escolas</Text>
              <Text style={styles.resumoValor}>{dados.totalEscolas}</Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Certificadas (≥70%)</Text>
              <Text style={{ ...styles.resumoValor, color: '#00963A' }}>{dados.escolasCertificadas}</Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Não Certificadas</Text>
              <Text style={{ ...styles.resumoValor, color: dados.totalEscolas - dados.escolasCertificadas > 0 ? '#DC2626' : '#00963A' }}>
                {dados.totalEscolas - dados.escolasCertificadas}
              </Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Taxa Certificação</Text>
              <Text style={{ ...styles.resumoValor, color: taxaCertificacao >= 80 ? '#00963A' : taxaCertificacao >= 50 ? '#F59E0B' : '#DC2626' }}>
                {taxaCertificacao}%
              </Text>
            </View>
          </View>
        </View>

        {/* Tabela de escolas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Situação por Unidade Escolar</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.tableHeaderCell, flex: 4 }}>Escola</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>INEP</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Insp.</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 1 }}>Score</Text>
              <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Situação</Text>
            </View>
            {dados.escolas.map((escola, idx) => (
              <View key={escola.id} style={idx % 2 !== 0 ? { ...styles.tableRow, ...styles.tableRowAlt } : styles.tableRow} wrap={false}>
                <Text style={{ ...styles.tableCell, flex: 4 }}>{escola.nome}</Text>
                <Text style={{ ...styles.tableCellGray, flex: 2 }}>{escola.codigoInep ?? '—'}</Text>
                <Text style={{ ...styles.tableCellGray, flex: 1 }}>{escola.totalInspecoes}</Text>
                <Text style={{ ...styles.tableCell, flex: 1, color: escola.scoreMedio >= 90 ? '#00963A' : escola.scoreMedio >= 70 ? '#F59E0B' : escola.scoreMedio > 0 ? '#DC2626' : '#A8BDD4' }}>
                  {escola.scoreMedio > 0 ? `${escola.scoreMedio}%` : '—'}
                </Text>
                <Text style={{ ...styles.tableCell, flex: 2, color: escola.certificada ? '#00963A' : escola.totalInspecoes === 0 ? '#A8BDD4' : '#DC2626', fontFamily: escola.certificada ? 'Helvetica-Bold' : 'Helvetica' }}>
                  {escola.totalInspecoes === 0 ? 'Sem dados' : escola.certificada ? 'CERTIFICADA' : 'NÃO CERTIFICADA'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Assinatura */}
        <View style={styles.assinaturaSection}>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>{dados.responsavel.nome}</Text>
            <Text style={styles.assinaturaLabel}>Nutricionista Responsável</Text>
          </View>
          <View style={styles.assinaturaBox}>
            <View style={styles.assinaturaLinha} />
            <Text style={styles.assinaturaLabel}>Autoridade Municipal</Text>
            <Text style={styles.assinaturaLabel}>{dados.tenant.nome}</Text>
          </View>
        </View>

        {/* Carimbos */}
        <View style={styles.sealBox}>
          <Text style={styles.sealText}>LOCAL PARA CARIMBO / PROTOCOLO DA ENTIDADE EXECUTORA</Text>
        </View>

        <Text style={{ fontSize: 7, color: '#A8BDD4', textAlign: 'center', marginTop: 8 }}>
          Documento gerado pelo sistema MerendaCheck em {geradoEm}
        </Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>PNAE — {dados.tenant.nome} — {periodoStr}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
