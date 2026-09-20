import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

/**
 * Delivery outcomes for Loumilab email. Bounces, complaints and unsubscribes
 * update the matching row in the admin Mail sent log so the portal shows the
 * real state instead of a permanent "sent".
 */
const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

const markLatest = async (recipient: string | undefined, status: string, note: string) => {
  const email = (recipient ?? '').trim().toLowerCase()
  if (!email) return

  const { data, error } = await admin
    .from('admin_email_messages')
    .select('id')
    .contains('to_addresses', [email])
    .eq('direction', 'outbound')
    .order('created_at', { ascending: false })
    .limit(1)
  if (error) throw error
  const row = data?.[0]
  if (!row) return

  const { error: updateError } = await admin
    .from('admin_email_messages')
    .update({ status, error_text: note })
    .eq('id', row.id)
  if (updateError) throw updateError
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      console.log('Email bounced', { event_id: event.event_id })
      await markLatest(event.data.recipient, 'bounced', 'The address rejected this message.')
    },
    'email.complaint': async (event) => {
      console.log('Email complaint', { event_id: event.event_id })
      await markLatest(event.data.recipient, 'complained', 'Reported as spam by the recipient.')
    },
    'email.unsubscribed': async (event) => {
      console.log('Email unsubscribed', { event_id: event.event_id })
      await markLatest(event.data.recipient, 'suppressed', 'This recipient unsubscribed.')
    },
  },
})

Deno.serve((req) => handler(req))
