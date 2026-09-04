/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Text } from 'npm:@react-email/components@0.0.22'

import { Layout, button, text } from './brand.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Layout
    preview={`Your sign-in link for ${siteName}`}
    heading="Your sign-in link"
    confirmationUrl={confirmationUrl}
    expiryNote="This link expires in 60 minutes and can be used once. If you didn't request it, you can ignore this email."
  >
    <Text style={text}>
      Use the button below to sign in to your {siteName} account. No password
      needed.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Sign in to Loumilab
      </Button>
    </Text>
  </Layout>
)

export default MagicLinkEmail
