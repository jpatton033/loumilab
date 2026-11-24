CREATE OR REPLACE FUNCTION public.senti_exploration_cleanup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.senti_sessions WHERE id = OLD.session_id AND scope = 'studio';
  RETURN OLD;
END $$;
REVOKE EXECUTE ON FUNCTION public.senti_exploration_cleanup() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER senti_exploration_cleanup AFTER DELETE ON public.senti_explorations
  FOR EACH ROW EXECUTE FUNCTION public.senti_exploration_cleanup();