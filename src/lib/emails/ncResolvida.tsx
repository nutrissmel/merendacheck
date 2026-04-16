import * as React from 'react'
import {
  Html, Head, Body, Container, Section, Heading, Text, Button, Hr, Preview,
} from '@react-email/components'

export interface NCResolvidaEmailProps {
  nomeNutricionista: string
  tituloNC: string
  nomeEscola: string
  resolvidaEm: string
  diasParaResolucao: number
  urlDetalhe: string
}

export const NCResolvidaEmail = ({
  nomeNutricionista = 'Nutricionista',
  tituloNC = 'Alimentos fora da faixa de temperatura',
  nomeEscola = 'EMEF Escola',
  resolvidaEm = '09/04/2026',
  diasParaResolucao = 1,
  urlDetalhe = 'https://merendacheck.com.br',
}: NCResolvidaEmailProps) => (
  <Html>
    <Head />
    <Preview>✅ NC resolvida: {tituloNC}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={logo}>MerendaCheck</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>✅ Não conformidade resolvida</Heading>
          <Text style={text}>Olá, <strong>{nomeNutricionista}</strong>.</Text>
          <Text style={text}>
            A não conformidade abaixo foi marcada como <strong>resolvida</strong>.
          </Text>

          <Section style={successBox}>
            <Text style={infoRow}><strong>NC:</strong> {tituloNC}</Text>
            <Text style={infoRow}><strong>Escola:</strong> {nomeEscola}</Text>
            <Text style={{ ...infoRow, marginBottom: 0 }}>
              <strong>Resolvida em:</strong> {resolvidaEm}{' '}
              ({diasParaResolucao} dia{diasParaResolucao !== 1 ? 's' : ''} após abertura)
            </Text>
          </Section>

          <Button style={button} href={urlDetalhe}>
            Ver detalhes →
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
const header = { backgroundColor: '#0E2E60', padding: '32px', borderRadius: '12px 12px 0 0', textAlign: 'center' as const }
const logo = { color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0' }
const content = { backgroundColor: '#ffffff', padding: '40px', borderRadius: '0 0 12px 12px', border: '1px solid #d5e3f0' }
const h1 = { color: '#00963A', fontSize: '22px', fontWeight: 'bold', margin: '0 0 20px' }
const text = { color: '#5A7089', fontSize: '15px', lineHeight: '24px', margin: '0 0 16px' }
const successBox = { backgroundColor: '#D1F7E2', border: '1px solid #00963A', borderRadius: '8px', padding: '16px 20px', margin: '20px 0' }
const infoRow = { color: '#0F1B2D', fontSize: '14px', lineHeight: '22px', margin: '0 0 8px' }
const button = { backgroundColor: '#00963A', borderRadius: '8px', color: '#fff', fontSize: '15px', fontWeight: 'bold', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '100%', padding: '12px 20px', marginTop: '24px' }
const hr = { borderColor: '#d5e3f0', margin: '40px 0' }
const footerSection = { textAlign: 'center' as const }
const footerText = { color: '#5A7089', fontSize: '12px', lineHeight: '18px', margin: 0 }
