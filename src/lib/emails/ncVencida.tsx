import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

export interface NCVencidaEmailProps {
  nomeDestinatario: string
  tituloNC: string
  nomeEscola: string
  prazoEra: string
  diasVencida: number
  severidade: string
  urlDetalhe: string
}

const SEVERIDADE_LABEL: Record<string, string> = {
  BAIXA: 'BAIXA', MEDIA: 'MÉDIA', ALTA: 'ALTA', CRITICA: 'CRÍTICA',
}

export const NCVencidaEmail = ({
  nomeDestinatario = 'Responsável',
  tituloNC = 'Alimentos fora da faixa de temperatura',
  nomeEscola = 'EMEF Escola',
  prazoEra = '10/04/2026',
  diasVencida = 2,
  severidade = 'CRITICA',
  urlDetalhe = 'https://merendacheck.com.br',
}: NCVencidaEmailProps) => (
  <Html>
    <Head />
    <Preview>🚨 NC VENCIDA: {tituloNC} — {nomeEscola}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={urgentHeader}>
          <Heading style={logo}>🚨 MerendaCheck — ALERTA</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Não conformidade VENCIDA</Heading>
          <Text style={text}>Olá, <strong>{nomeDestinatario}</strong>.</Text>
          <Text style={text}>
            A não conformidade abaixo <strong>ultrapassou o prazo</strong> sem ser resolvida e requer atenção imediata.
          </Text>

          <Section style={alertBox}>
            <Text style={alertTitle}>⚠️ VENCIDA HÁ {diasVencida} DIA{diasVencida !== 1 ? 'S' : ''}</Text>
            <Text style={infoRow}><strong>NC:</strong> {tituloNC}</Text>
            <Text style={infoRow}><strong>Escola:</strong> {nomeEscola}</Text>
            <Text style={infoRow}><strong>Prazo era:</strong> {prazoEra}</Text>
            <Text style={{ ...infoRow, marginBottom: 0 }}>
              <strong>Severidade:</strong>{' '}
              <span style={{
                backgroundColor: '#DC2626',
                color: '#fff',
                padding: '2px 10px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '12px',
              }}>
                {SEVERIDADE_LABEL[severidade] ?? severidade}
              </span>
            </Text>
          </Section>

          <Button style={button} href={urlDetalhe}>
            Resolver urgentemente →
          </Button>
        </Section>
        <Hr style={hr} />
        <Section style={footerSection}>
          <Text style={footerText}>© 2026 MerendaCheck — Gestão de Merenda Escolar</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f5f9fd', fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif' }
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' }
const urgentHeader = { backgroundColor: '#B91C1C', padding: '32px', borderRadius: '12px 12px 0 0', textAlign: 'center' as const }
const logo = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold', margin: '0' }
const content = { backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 12px 12px', border: '1px solid #d5e3f0' }
const h1 = { color: '#B91C1C', fontSize: '22px', fontWeight: 'bold', margin: '0 0 20px' }
const text = { color: '#5A7089', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const alertBox = { backgroundColor: '#FEE2E2', border: '2px solid #DC2626', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const alertTitle = { color: '#B91C1C', fontSize: '14px', fontWeight: 900, margin: '0 0 12px', textTransform: 'uppercase' as const }
const infoRow = { color: '#0F1B2D', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const button = { backgroundColor: '#B91C1C', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '100%', padding: '12px 20px', marginTop: '24px' }
const hr = { borderColor: '#d5e3f0', margin: '40px 0' }
const footerSection = { textAlign: 'center' as const }
const footerText = { color: '#5A7089', fontSize: '12px', lineHeight: '18px', margin: 0 }
