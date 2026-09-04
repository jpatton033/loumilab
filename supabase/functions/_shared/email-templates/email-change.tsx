/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Text } from 'npm:@react-email/components@0.0.22'

import { Layout, button, text } from './brand.tsx'

interface EmailChangeEmailProps {
  siteName: string
  // NEW-recipient half of a secure email_change fanout: `email` equals the
  // current address and `newEmail` the requested one.
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Layout
    preview={`Confirm your email change for ${siteName}`}
    heading="Confirm your email change"
    confirmationUrl={confirmationUrl}
    expiryNote="This link expires in 24 hours. If you didn't request this change, ignore this email and your address stays the same."
  >
    <Text style={text}>
      You asked to change the email on your {siteName} account from {email} to{' '}
      {newEmail}. Confirm below to make the change.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Confirm new email
      </Button>
    </Text>
  </Layout>
)

export default EmailChangeEmail
