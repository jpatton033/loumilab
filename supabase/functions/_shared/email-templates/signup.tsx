/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Text } from 'npm:@react-email/components@0.0.22'

import { Layout, button, text } from './brand.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Layout
    preview={`Confirm your email for ${siteName}`}
    heading="Confirm your email"
    confirmationUrl={confirmationUrl}
    expiryNote="This link expires in 24 hours. If you didn't create a Loumilab account, you can ignore this email."
  >
    <Text style={text}>
      Welcome to {siteName}. Confirm {recipient} to finish setting up your
      account at {siteUrl.replace(/^https?:\/\//, '')}.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Confirm email
      </Button>
    </Text>
  </Layout>
)

export default SignupEmail
