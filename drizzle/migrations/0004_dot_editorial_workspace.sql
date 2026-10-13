ALTER TABLE public.dot_issues ADD COLUMN content_format text NOT NULL DEFAULT 'plain' CHECK (content_format IN ('plain', 'html'));
CREATE TABLE public.dot_issue_templates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120), content jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dot_issue_templates TO authenticated;
GRANT ALL ON public.dot_issue_templates TO service_role;
ALTER TABLE public.dot_issue_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Editorial admins manage templates" ON public.dot_issue_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));