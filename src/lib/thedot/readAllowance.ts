/** The Dot. free-read allowance: pure rules + browser storage (no identity, no fingerprinting). */
export const FREE_READS = 3;
const READS_KEY = "thedot:reads";
const SUB_KEY = "thedot:subscribed";
const DISMISS_KEY = "thedot:gate-dismissed";

export interface ReadState {
  reads: string[];
  subscribed: boolean;
  dismissed: boolean;
}

/** Add a slug once; repeat visits never count again. */
export const recordRead = (reads: string[], slug: string): string[] =>
  reads.includes(slug) ? reads : [...reads, slug];

/** Gate only issues beyond the free allowance, never for subscribers or after dismissal this session. */
export const shouldGate = (s: ReadState, slug: string): boolean => {
  if (s.subscribed || s.dismissed) return false;
  const idx = s.reads.indexOf(slug);
  const position = idx === -1 ? s.reads.length + 1 : idx + 1;
  return position > FREE_READS;
};

const safe = <T,>(fn: () => T, fallback: T): T => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export const loadReadState = (): ReadState => ({
  reads: safe(() => {
    const v = JSON.parse(localStorage.getItem(READS_KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(-200) : [];
  }, [] as string[]),
  subscribed: safe(() => localStorage.getItem(SUB_KEY) === "1", false),
  dismissed: safe(() => sessionStorage.getItem(DISMISS_KEY) === "1", false),
});

export const saveReads = (reads: string[]) => safe(() => localStorage.setItem(READS_KEY, JSON.stringify(reads)), undefined);
export const markSubscribed = () => safe(() => localStorage.setItem(SUB_KEY, "1"), undefined);
export const markDismissed = () => safe(() => sessionStorage.setItem(DISMISS_KEY, "1"), undefined);
