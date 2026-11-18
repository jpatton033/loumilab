import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Calls the researcher-only Studio API; throws with the server's message. */
export async function studio<T = any>(op: string, body: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("senti-studio", { body: { op, ...body } });
  if (error) {
    let msg = error.message;
    try { const j = await (error as any).context?.json?.(); if (j?.error) msg = j.error; } catch { /* keep default */ }
    throw new Error(msg);
  }
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export type Access = "loading" | "signed_out" | "denied" | "ok";
export function useResearcher() {
  const [state, setState] = useState<{ access: Access; uid: string | null }>({ access: "loading", uid: null });
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setState({ access: "signed_out", uid: null });
      const { data } = await supabase.rpc("senti_is_researcher", { _uid: user.id });
      setState({ access: data ? "ok" : "denied", uid: user.id });
    })();
  }, []);
  return state;
}

export const CATEGORY_LABELS: Record<string, string> = {
  language: "Language relationship interpretation", temporal: "Temporal reasoning", retrieval: "Relationship retrieval",
  contradiction: "Contradiction handling", behavior: "Behavioral pattern prediction", generalization: "Generalization to unseen examples", efficiency: "Computational efficiency",
};
export const BASELINE_LABELS: Record<string, string> = { rules: "Rules only", memory: "Structured memory", model: "Trained Senti model", llm: "External LLM baseline" };
export const fmtDate = (s?: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
