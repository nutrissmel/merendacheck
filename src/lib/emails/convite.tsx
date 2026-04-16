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

interface ConviteEmailProps {
  nomeConvidadoPor: string
  nomeMunicipio: string
  papel: Papel
  linkConvite: string
  expiresAt: string
  mensagemPersonalizada?: string
}

export const ConviteEmail = ({
  nomeConvidadoPor = 'Administrador',
  nomeMunicipio = 'Município',
  papel = 'NUTRICIONISTA',
  linkConvite = '#',
  expiresAt = '',
  mensagemPersonalizada,
}: ConviteEmailProps) => {
  const papelLabel = PAPEL_LABEL[papel]

  return (
    <Html>
      <Head />
      <Preview>
        {nomeConvidadoPor} convidou você para o MerendaCheck — {nomeMunicipio}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MerendaCheck</Heading>
            <Text style={tagline}>Gestão de Merenda Escolar</Text>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Você foi convidado! 🎉</Heading>

            <Text style={text}>
              <strong>{nomeConvidadoPor}</strong> convidou você para usar o{' '}
              <strong>MerendaCheck</strong>, o sistema de gestão de inspeções de merenda
              escolar do município de <strong>{nomeMunicipio}</strong>.
            </Text>

            <Section style={roleBox}>
              <Text style={roleLabel}>Seu acesso será como:</Text>
              <Text style={roleValue}>{papelLabel}</Text>
            </Section>

            {mensagemPersonalizada && (
              <Section style={msgBox}>
                <Text style={msgLabel}>Mensagem de {nomeConvidadoPor}:</Text>
                <Text style={msgText}>&ldquo;{mensagemPersonalizada}&rdquo;</Text>
              </Section>
            )}

            <Text style={text}>
              Clique no botão abaixo para criar sua senha e acessar o sistema:
            </Text>

            <Button style={button} href={linkConvite}>
              Aceitar convite e criar senha
            </Button>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⏳ Este link expira em <strong>{expiresAt}</strong>. Após este prazo,
                solicite um novo convite ao administrador.
              </Text>
            </Section>

            <Text style={ignoreText}>
              Se você não esperava este convite, pode ignorar este e-mail com segurança.
            </Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              MerendaCheck — Gestão Inteligente de Merenda Escolar para Municípios
              Brasileiros.
            </Text>
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
  margin: '0 0 4px',
}

const tagline = {
  color: '#9bbfe0',
  fontSize: '12px',
  margin: '0',
  textAlign: 'center' as const,
}

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #d5e3f0',
}

const h1 = {
  color: '#0E2E60',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
}

const text = {
  color: '#5A7089',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const roleBox = {
  backgroundColor: '#EEF4FD',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
  borderLeft: '4px solid #0E2E60',
}

const roleLabel = {
  color: '#5A7089',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 4px',
}

const roleValue = {
  color: '#0E2E60',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const msgBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '0 0 24px',
  border: '1px solid #e9ecef',
}

const msgLabel = {
  color: '#5A7089',
  fontSize: '12px',
  fontWeight: '600',
  margin: '0 0 8px',
}

const msgText = {
  color: '#0F1B2D',
  fontSize: '15px',
  fontStyle: 'italic',
  margin: '0',
  lineHeight: '22px',
}

const button = {
  backgroundColor: '#00963A',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '14px 20px',
  margin: '0 0 24px',
}

const warningBox = {
  backgroundColor: '#FEF3C7',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 20px',
}

const warningText = {
  color: '#92400e',
  fontSize: '13px',
  margin: '0',
  lineHeight: '20px',
}

const ignoreText = {
  color: '#9ca3af',
  fontSize: '13px',
  margin: '0',
  lineHeight: '20px',
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
  margin: '0 0 4px',
}
