import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

export interface AcaoAtribuidaEmailProps {
  nomeResponsavel: string
  tituloNC: string
  nomeEscola: string
  descricaoAcao: string
  prazo: string | null
  prioridade: string
  urlAcao: string
}

const PRIORIDADE_LABEL: Record<string, { label: string; cor: string; fundo: string }> = {
  BAIXA:   { label: 'BAIXA',   cor: '#5A7089', fundo: '#F5F9FD' },
  MEDIA:   { label: 'MÉDIA',   cor: '#D97706', fundo: '#FEF3C7' },
  ALTA:    { label: 'ALTA',    cor: '#DC2626', fundo: '#FEE2E2' },
  URGENTE: { label: 'URGENTE', cor: '#ffffff', fundo: '#DC2626' },
}

export const AcaoAtribuidaEmail = ({
  nomeResponsavel = 'Responsável',
  tituloNC = 'Não conformidade detectada',
  nomeEscola = 'EMEF Escola',
  descricaoAcao = 'Verificar vedação da câmara fria',
  prazo = '10/04/2026',
  prioridade = 'ALTA',
  urlAcao = 'https://merendacheck.com.br',
}: AcaoAtribuidaEmailProps) => {
  const prio = PRIORIDADE_LABEL[prioridade] ?? PRIORIDADE_LABEL.MEDIA

  return (
    <Html>
      <Head />
      <Preview>📋 Você tem uma ação para resolver em {nomeEscola}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MerendaCheck</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h1}>📋 Você tem uma ação para resolver</Heading>
            <Text style={text}>Olá, <strong>{nomeResponsavel}</strong>.</Text>
            <Text style={text}>
              Você foi designado como responsável por uma ação corretiva no MerendaCheck.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}><strong>Não conformidade:</strong> {tituloNC}</Text>
              <Text style={infoRow}><strong>Escola:</strong> {nomeEscola}</Text>
              <Text style={infoRow}><strong>O que fazer:</strong> {descricaoAcao}</Text>
              {prazo && <Text style={infoRow}><strong>Prazo:</strong> {prazo}</Text>}
              <Text style={{ ...infoRow, marginBottom: 0 }}>
                <strong>Prioridade:</strong>{' '}
                <span style={{
                  backgroundColor: prio.fundo,
                  color: prio.cor,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}>
                  {prio.label}
                </span>
              </Text>
            </Section>

            <Button style={button} href={urlAcao}>
              Ver e concluir ação →
            </Button>

            <Text style={footNote}>
              Conclua a ação dentro do prazo para que a não conformidade possa ser resolvida.
            </Text>
          </Section>
          <Hr style={hr} />
          <Section style={footerSection}>
            <Text style={footerText}>© 2026 MerendaCheck — Gestão de Merenda Escolar</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f5f9fd', fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif' }
const container = { margin: '0 auto', padding: '20px 0 48px', width: '580px' }
const header = { backgroundColor: '#0E2E60', padding: '32px', borderRadius: '12px 12px 0 0', textAlign: 'center' as const }
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0' }
const content = { backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 12px 12px', border: '1px solid #d5e3f0' }
const h1 = { color: '#0E2E60', fontSize: '22px', fontWeight: 'bold', margin: '0 0 20px' }
const text = { color: '#5A7089', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#EEF4FD', border: '1px solid #D9E8FA', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const infoRow = { color: '#0F1B2D', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const button = { backgroundColor: '#0E2E60', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '100%', padding: '12px 20px', marginTop: '24px' }
const footNote = { color: '#5A7089', fontSize: '13px', lineHeight: '20px', margin: '20px 0 0', fontStyle: 'italic' as const }
const hr = { borderColor: '#d5e3f0', margin: '40px 0' }
const footerSection = { textAlign: 'center' as const }
const footerText = { color: '#5A7089', fontSize: '12px', lineHeight: '18px', margin: 0 }
