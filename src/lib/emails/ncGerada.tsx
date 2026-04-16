import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

export interface NCGeradaEmailProps {
  nomeNutricionista: string
  nomeEscola: string
  nomeChecklist: string
  dataInspecao: string
  itemPergunta: string
  severidade: string
  urlDetalhe: string
}

const SEVERIDADE_LABEL: Record<string, { label: string; cor: string; fundo: string }> = {
  BAIXA:   { label: 'BAIXA',   cor: '#5A7089', fundo: '#F5F9FD' },
  MEDIA:   { label: 'MÉDIA',   cor: '#D97706', fundo: '#FEF3C7' },
  ALTA:    { label: 'ALTA',    cor: '#DC2626', fundo: '#FEE2E2' },
  CRITICA: { label: 'CRÍTICA', cor: '#ffffff', fundo: '#DC2626' },
}

export const NCGeradaEmail = ({
  nomeNutricionista = 'Nutricionista',
  nomeEscola = 'EMEF Escola',
  nomeChecklist = 'Controle de Temperatura',
  dataInspecao = '08/04/2026 às 08:32',
  itemPergunta = 'Há alimentos fora da faixa de temperatura?',
  severidade = 'MEDIA',
  urlDetalhe = 'https://merendacheck.com.br',
}: NCGeradaEmailProps) => {
  const sev = SEVERIDADE_LABEL[severidade] ?? SEVERIDADE_LABEL.MEDIA

  return (
    <Html>
      <Head />
      <Preview>⚠️ Nova não conformidade detectada em {nomeEscola}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MerendaCheck</Heading>
          </Section>
          <Section style={content}>
            <Heading style={h1}>⚠️ Nova não conformidade detectada</Heading>
            <Text style={text}>Olá, <strong>{nomeNutricionista}</strong>.</Text>
            <Text style={text}>
              Uma nova não conformidade foi gerada automaticamente após a finalização de inspeção reprovada.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}><strong>Escola:</strong> {nomeEscola}</Text>
              <Text style={infoRow}><strong>Inspeção:</strong> {nomeChecklist} — {dataInspecao}</Text>
              <Text style={infoRow}><strong>Item reprovado:</strong> "{itemPergunta}"</Text>
              <Text style={{ ...infoRow, marginBottom: 0 }}>
                <strong>Severidade:</strong>{' '}
                <span style={{
                  backgroundColor: sev.fundo,
                  color: sev.cor,
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}>
                  {sev.label}
                </span>
              </Text>
            </Section>

            <Button style={button} href={urlDetalhe}>
              Criar plano de ação →
            </Button>

            <Text style={footNote}>
              Resolva esta NC o quanto antes para manter a conformidade da alimentação escolar.
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
const h1 = { color: '#DC2626', fontSize: '22px', fontWeight: 'bold', margin: '0 0 20px' }
const text = { color: '#5A7089', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const infoBox = { backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const infoRow = { color: '#0F1B2D', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const button = { backgroundColor: '#DC2626', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '100%', padding: '12px 20px', marginTop: '24px' }
const footNote = { color: '#5A7089', fontSize: '13px', lineHeight: '20px', margin: '20px 0 0', fontStyle: 'italic' as const }
const hr = { borderColor: '#d5e3f0', margin: '40px 0' }
const footerSection = { textAlign: 'center' as const }
const footerText = { color: '#5A7089', fontSize: '12px', lineHeight: '18px', margin: 0 }
