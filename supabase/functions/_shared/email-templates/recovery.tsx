/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Text } from 'npm:@react-email/components@0.0.22'

import { Layout, button, text } from './brand.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Layout
    preview={`Reset your ${siteName} password`}
    heading="Reset your password"
    confirmationUrl={confirmationUrl}
    expiryNote="This link expires in 60 minutes and can be used once. If you didn't ask to reset your password, you can ignore this email — nothing will change."
  >
    <Text style={text}>
      We received a request to reset the password for your {siteName} account.
      Choose a new one below.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Set a new password
      </Button>
    </Text>
  </Layout>
)

export default RecoveryEmail
