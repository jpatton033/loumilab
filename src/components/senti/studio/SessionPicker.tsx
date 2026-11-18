import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { studio } from "@/lib/senti/studio";
import { btn, inp } from "./StudioShell";

/** Lists Studio research sessions (never public Lab sessions) and creates new ones. */
export function useStudioSessions(enabled: boolean) {
  const [sessions, setSessions] = useState<{ id: string; title: string | null; created_at: string }[]>([]);
  const [sid, setSid] = useState<string>(() => sessionStorage.getItem("senti-studio-sid") ?? "");
  const load = useCallback(async () => {
    const { data } = await supabase.from("senti_sessions").select("id,title,created_at").eq("scope", "studio").order("created_at", { ascending: false });
    setSessions(data ?? []);
    if (data?.length && !data.some((s) => s.id === sid)) setSid(data[0].id);
  }, [sid]);
  useEffect(() => { if (enabled) load(); }, [enabled, load]);
  useEffect(() => { if (sid) sessionStorage.setItem("senti-studio-sid", sid); }, [sid]);
  return { sessions, sid, setSid, reload: load };
}

export default function SessionPicker({ s }: { s: ReturnType<typeof useStudioSessions> }) {
  const [title, setTitle] = useState("");
  const create = async () => {
    if (!title.trim()) return toast.error("Name the session");
    try { const r = await studio("create_session", { title: title.trim() }); setTitle(""); await s.reload(); s.setSid(r.id); } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="mb-6 flex flex-wrap items-end gap-3">
      <label className="text-sm"><span className="mb-1 block text-atmo-ivory/60">Research session</span>
        <select className={`${inp} min-w-56`} value={s.sid} onChange={(e) => s.setSid(e.target.value)}>
          {!s.sessions.length && <option value="">No sessions yet</option>}
          {s.sessions.map((x) => <option key={x.id} value={x.id}>{x.title ?? "Untitled"}</option>)}
        </select></label>
      <input className={`${inp} max-w-xs`} placeholder="New session name" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button className={btn} onClick={create}>Create session</button>
    </div>
  );
}
