DROP POLICY IF EXISTS app_select ON public.spaces_apps;
CREATE POLICY app_select ON public.spaces_apps FOR SELECT TO authenticated USING (
  public.spaces_role_rank(workspace_id, auth.uid()) >= 3
  OR (created_by = auth.uid() AND public.spaces_role_rank(workspace_id, auth.uid()) >= 1)
  OR (visibility IN ('workspace','link') AND public.spaces_role_rank(workspace_id, auth.uid()) >= 1)
);