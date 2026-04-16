import * as React from 'react'
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Button,
  Hr,
  Preview,
} from '@react-email/components'
import type { Papel } from '@prisma/client'

const PAPEL_LABEL: Record<Papel, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN_MUNICIPAL: 'Administrador Municipal',
  NUTRICIONISTA: 'Nutricionista',
  DIRETOR_ESCOLA: 'Diretor de Escola',
  MERENDEIRA: 'Merendeira',
}

interface ConviteAceitoEmailProps {
  nomeConvidado: string
  papel: Papel
  nomeMunicipio: string
  urlUsuarios: string
}

export const ConviteAceitoEmail = ({
  nomeConvidado = 'Usuário',
  papel = 'NUTRICIONISTA',
  nomeMunicipio = 'Município',
  urlUsuarios = '#',
}: ConviteAceitoEmailProps) => {
  const papelLabel = PAPEL_LABEL[papel]

  return (
    <Html>
      <Head />
      <Preview>{nomeConvidado} aceitou seu convite e já está no MerendaCheck!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MerendaCheck</Heading>
          </Section>

          <Section style={content}>
            <Section style={successIcon}>
              <Text style={checkmark}>✅</Text>
            </Section>

            <Heading style={h1}>Convite aceito!</Heading>

            <Text style={text}>
              <strong>{nomeConvidado}</strong> aceitou seu convite e já está ativo no
              MerendaCheck do município de <strong>{nomeMunicipio}</strong>.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}>
                <span style={infoLabelStyle}>Nome:</span>{' '}
                <strong style={infoValue}>{nomeConvidado}</strong>
              </Text>
              <Text style={infoRow}>
                <span style={infoLabelStyle}>Papel:</span>{' '}
                <strong style={infoValue}>{papelLabel}</strong>
              </Text>
              <Text style={infoRow}>
                <span style={infoLabelStyle}>Município:</span>{' '}
                <strong style={infoValue}>{nomeMunicipio}</strong>
              </Text>
            </Section>

            <Text style={text}>
              O novo usuário já pode acessar o sistema com as permissões do seu papel.
            </Text>

            <Button style={button} href={urlUsuarios}>
              Ver lista de usuários
            </Button>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>© 2026 MerendaCheck — Todos os direitos reservados.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f5f9fd',
  fontFamily:
    'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
}

const header = {
  backgroundColor: '#0E2E60',
  padding: '32px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #d5e3f0',
}

const successIcon = {
  textAlign: 'center' as const,
  marginBottom: '8px',
}

const checkmark = {
  fontSize: '48px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const h1 = {
  color: '#0E2E60',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const text = {
  color: '#5A7089',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 24px',
}

const infoBox = {
  backgroundColor: '#D1F7E2',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px',
  border: '1px solid #00963A',
}

const infoRow = {
  margin: '0 0 8px',
  fontSize: '15px',
  color: '#0F1B2D',
}

const infoLabelStyle: React.CSSProperties = {
  color: '#5A7089',
  fontWeight: 'normal',
}

const infoValue: React.CSSProperties = {
  color: '#0E2E60',
}

const button = {
  backgroundColor: '#0E2E60',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 20px',
}

const hr = {
  borderColor: '#d5e3f0',
  margin: '40px 0',
}

const footer = {
  textAlign: 'center' as const,
}

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
}
