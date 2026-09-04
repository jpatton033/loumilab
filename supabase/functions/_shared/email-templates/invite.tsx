/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Button, Text } from 'npm:@react-email/components@0.0.22'

import { Layout, button, text } from './brand.tsx'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Layout
    preview={`You've been invited to join ${siteName}`}
    heading="You've been invited"
    confirmationUrl={confirmationUrl}
    expiryNote="This invitation link expires in 24 hours. If you weren't expecting it, you can ignore this email."
  >
    <Text style={text}>
      You've been invited to join {siteName} at{' '}
      {siteUrl.replace(/^https?:\/\//, '')}. Accept the invitation to create
      your account.
    </Text>
    <Text style={{ ...text, margin: '0 0 26px' }}>
      <Button className="dm-btn" style={button} href={confirmationUrl}>
        Accept invitation
      </Button>
    </Text>
  </Layout>
)

export default InviteEmail
