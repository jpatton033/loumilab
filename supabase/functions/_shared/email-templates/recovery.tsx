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
    preview={`Securely reset your ${siteName} password`}
    heading="Password reset requested"
    confirmationUrl={confirmationUrl}
    expiryNote="This secure link expires in 60 minutes. If you didn't request a password reset, you can safely ignore this email."
  >
    <Text style={text}>
      A password reset was requested for your {siteName} account. Continue to
      verify the request and choose a new password.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Continue securely
      </Button>
    </Text>
  </Layout>
)

export default RecoveryEmail
