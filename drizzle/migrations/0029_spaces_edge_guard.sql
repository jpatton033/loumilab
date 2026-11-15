CREATE OR REPLACE FUNCTION public.spaces_guard_edge_cols() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' AND current_user NOT IN ('service_role','postgres','supabase_admin') THEN
    NEW.edge_status := OLD.edge_status; NEW.edge_version_id := OLD.edge_version_id;
    NEW.edge_error := OLD.edge_error; NEW.edge_checked_at := OLD.edge_checked_at;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER spaces_guard_edge_cols BEFORE UPDATE ON public.spaces_apps FOR EACH ROW EXECUTE FUNCTION public.spaces_guard_edge_cols();