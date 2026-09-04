/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import { Text } from 'npm:@react-email/components@0.0.22'

import { Layout, code, text } from './brand.tsx'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({
  token,
}: ReauthenticationEmailProps) => (
  <Layout
    preview="Your Loumilab verification code"
    heading="Confirm it's you"
    expiryNote="This code expires in 10 minutes. If you didn't request it, you can ignore this email."
  >
    <Text style={text}>Enter this code to confirm your identity:</Text>
    <Text style={code}>{token}</Text>
  </Layout>
)

export default ReauthenticationEmail
