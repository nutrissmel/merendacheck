import * as React from 'react';
import { Html, Head, Body, Container, Section, Img, Heading, Text, Button, Hr, Link, Preview } from '@react-email/components';

interface BoasVindasEmailProps {
  nomeAdmin: string;
  nomeMunicipio: string;
  trialExpiresAt: string;
  loginUrl: string;
}

export const BoasVindasEmail = ({
  nomeAdmin = 'Administrador',
  nomeMunicipio = 'Município',
  trialExpiresAt = '14 dias',
  loginUrl = 'https://merendacheck.com.br/login',
}: BoasVindasEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bem-vindo ao MerendaCheck, {nomeAdmin}! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>MerendaCheck</Heading>
          </Section>
          
          <Section style={content}>
            <Heading style={h1}>Olá, {nomeAdmin}! 👋</Heading>
            <Text style={text}>
              Seja bem-vindo ao <strong>MerendaCheck</strong>. É um prazer ter o município de 
              <strong> {nomeMunicipio}</strong> conosco.
            </Text>
            
            <Section style={trialBox}>
              <Text style={trialText}>
                Seu trial gratuito de 14 dias está ativo e vai até <strong>{trialExpiresAt}</strong>.
              </Text>
            </Section>

            <Text style={text}>
              O MerendaCheck foi desenvolvido para transformar a gestão da alimentação escolar, 
              trazendo conformidade, transparência e agilidade para o seu município.
            </Text>

            <Heading style={h2}>Próximos passos sugeridos:</Heading>
            <Section style={steps}>
              <Text style={step}>1️⃣ <strong>Cadastre suas escolas:</strong> Adicione as unidades que serão inspecionadas.</Text>
              <Text style={step}>2️⃣ <strong>Configure os checklists:</strong> Personalize os critérios de avaliação conforme o PNAE.</Text>
              <Text style={step}>3️⃣ <strong>Convide sua equipe:</strong> Adicione nutricionistas e diretores ao sistema.</Text>
            </Section>

            <Button style={button} href={loginUrl}>
              Acessar o sistema
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Section style={footer}>
            <Text style={footerText}>
              Dúvidas? Responda a este e-mail ou entre em contato pelo nosso suporte.
            </Text>
            <Text style={footerText}>
              © 2026 MerendaCheck — Gestão Inteligente de Merenda Escolar.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: '#f5f9fd',
  fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '580px',
};

const header = {
  backgroundColor: '#0E2E60',
  padding: '32px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
};

const logo = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #d5e3f0',
};

const h1 = {
  color: '#0E2E60',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px',
};

const h2 = {
  color: '#0E2E60',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '32px 0 16px',
};

const text = {
  color: '#5A7089',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 20px',
};

const trialBox = {
  backgroundColor: '#EEF4FD',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #D9E8FA',
};

const trialText = {
  color: '#0E2E60',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const steps = {
  margin: '0 0 32px',
};

const step = {
  color: '#5A7089',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 12px',
};

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
  padding: '12px 20px',
};

const hr = {
  borderColor: '#d5e3f0',
  margin: '40px 0',
};

const footer = {
  textAlign: 'center' as const,
};

const footerText = {
  color: '#5A7089',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0 0 8px',
};
