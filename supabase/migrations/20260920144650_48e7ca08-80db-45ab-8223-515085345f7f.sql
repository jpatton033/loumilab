-- Admin mail desk -------------------------------------------------------------

CREATE TABLE public.admin_email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_email_templates TO authenticated;
GRANT ALL ON public.admin_email_templates TO service_role;
ALTER TABLE public.admin_email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage email templates" ON public.admin_email_templates
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.admin_email_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  body_html TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_email_signatures TO authenticated;
GRANT ALL ON public.admin_email_signatures TO service_role;
ALTER TABLE public.admin_email_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage own signature" ON public.admin_email_signatures
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) AND user_id = auth.uid())
  WITH CHECK (public.is_staff(auth.uid()) AND user_id = auth.uid());

CREATE TABLE public.admin_email_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  thread_id UUID NOT NULL DEFAULT gen_random_uuid(),
  to_addresses TEXT[] NOT NULL DEFAULT '{}',
  cc_addresses TEXT[] NOT NULL DEFAULT '{}',
  bcc_addresses TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL DEFAULT '',
  body_html TEXT NOT NULL DEFAULT '',
  body_text TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT 'Loumilab',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'queued', 'sent', 'failed', 'bounced', 'suppressed', 'complained')),
  error_text TEXT,
  provider_message_id TEXT,
  template_id UUID REFERENCES public.admin_email_templates ON DELETE SET NULL,
  sent_by UUID REFERENCES auth.users,
  sent_by_email TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_email_messages_created_idx ON public.admin_email_messages (created_at DESC);
CREATE INDEX admin_email_messages_status_idx ON public.admin_email_messages (status);
CREATE INDEX admin_email_messages_thread_idx ON public.admin_email_messages (thread_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_email_messages TO authenticated;
GRANT ALL ON public.admin_email_messages TO service_role;
ALTER TABLE public.admin_email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage email messages" ON public.admin_email_messages
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.admin_email_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.admin_email_messages ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  content_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX admin_email_attachments_message_idx ON public.admin_email_attachments (message_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_email_attachments TO authenticated;
GRANT ALL ON public.admin_email_attachments TO service_role;
ALTER TABLE public.admin_email_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage email attachments" ON public.admin_email_attachments
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER admin_email_templates_updated_at BEFORE UPDATE ON public.admin_email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER admin_email_signatures_updated_at BEFORE UPDATE ON public.admin_email_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER admin_email_messages_updated_at BEFORE UPDATE ON public.admin_email_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER admin_email_attachments_updated_at BEFORE UPDATE ON public.admin_email_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();