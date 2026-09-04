/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

export const BLUE = '#0b72f3'
export const CHARCOAL = '#18181b'
export const MUTED = '#6b6f76'

export const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    "'Space Grotesk', -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  color: CHARCOAL,
  margin: '0',
  padding: '32px 16px',
}

export const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '0',
}

export const card = {
  border: '1px solid #e6e7ea',
  borderRadius: '20px',
  padding: '32px 28px',
  backgroundColor: '#ffffff',
}

export const wordmark = {
  fontSize: '15px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.18em',
  color: CHARCOAL,
  margin: '0 0 24px',
  textTransform: 'uppercase' as const,
}

export const h1 = {
  fontSize: '24px',
  lineHeight: '1.25',
  fontWeight: 'bold' as const,
  color: CHARCOAL,
  margin: '0 0 14px',
  letterSpacing: '-0.02em',
}

export const text = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#3f4247',
  margin: '0 0 20px',
}

export const small = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: MUTED,
  margin: '0 0 8px',
}

export const link = { color: BLUE, textDecoration: 'none' }

export const button = {
  backgroundColor: BLUE,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  border: `1px solid ${BLUE}`,
  borderRadius: '999px',
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
}

export const code = {
  fontSize: '30px',
  fontWeight: 'bold' as const,
  letterSpacing: '0.22em',
  color: CHARCOAL,
  margin: '0 0 20px',
}

export const hr = {
  borderColor: '#e6e7ea',
  borderStyle: 'solid' as const,
  borderWidth: '1px 0 0',
  margin: '28px 0 18px',
}

export const fallback = {
  fontSize: '12px',
  lineHeight: '1.6',
  color: MUTED,
  wordBreak: 'break-all' as const,
  margin: '0 0 8px',
}

// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
export const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #0b72f3 !important; color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: #0b72f3 !important; color: #ffffff !important; }
  [data-ogsb] .dm-btn { background-color: #0b72f3 !important; color: #ffffff !important; }
`

interface LayoutProps {
  preview: string
  heading: string
  children: React.ReactNode
  confirmationUrl?: string
  expiryNote?: string
}

export const Layout = ({
  preview,
  heading,
  children,
  confirmationUrl,
  expiryNote,
}: LayoutProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={card}>
          <Text style={wordmark}>
            Loumilab<span style={{ color: BLUE }}>.</span>
          </Text>
          <Heading style={h1}>{heading}</Heading>
          {children}
          {expiryNote ? <Text style={small}>{expiryNote}</Text> : null}
          {confirmationUrl ? (
            <>
              <Text style={small}>
                If the button doesn't work, copy and paste this link into your
                browser:
              </Text>
              <Text style={fallback}>{confirmationUrl}</Text>
            </>
          ) : null}
          <Hr style={hr} />
          <Text style={small}>
            This message was sent automatically by Loumilab and this address
            isn't monitored. Need a person? Email{' '}
            <a href="mailto:hello@loumilab.com" style={link}>
              hello@loumilab.com
            </a>
            .
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default Layout
