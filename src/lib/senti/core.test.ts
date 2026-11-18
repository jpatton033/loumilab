import { describe, expect, it } from "vitest";
import { MemoryStore, evaluate, assignSplits, SYNTHETIC } from "../../../supabase/functions/_shared/sentiCore";

describe("Senti Core v0.1", () => {
  it("stores and retrieves relationships across observations", () => {
    const s = new MemoryStore();
    s.ingestText("Ana feeds the cat."); s.ingestText("Ana walks the dog.");
    expect(s.retrieve({ entity: "Ana" }).map((r) => r.target).sort()).toEqual(["cat", "dog"]);
  });
  it("structured observations are recorded facts; text links are inferred", () => {
    const s = new MemoryStore();
    s.ingestStructured({ actor: "Rosa", action: "bakes", target: "bread" });
    s.ingestText("Leo watches the dog.");
    const kinds = Object.fromEntries([...s.relations.values()].map((r) => [r.source, r.kind]));
    expect(kinds).toEqual({ rosa: "fact", leo: "inferred" });
  });
  it("contradicting evidence lowers weight and keeps history", () => {
    const s = new MemoryStore();
    s.ingestText("Ana feeds the cat."); s.ingestText("Ana did not feed the cat.");
    const r = s.retrieve({ entity: "cat" })[0];
    expect([r.support, r.contradict, r.weight, r.history.length]).toEqual([1, 1, 0.5, 2]);
    expect(s.explain(r.id)!.contradicted).toBe(true);
  });
  it("supersede keeps the old version instead of overwriting", () => {
    const s = new MemoryStore();
    const old = s.retrieve({}).length; s.ingestText("Leo watches the dog.");
    const r = s.retrieve({ entity: "leo" })[0];
    const nr = s.supersede(r.id, "walks")!;
    expect(old).toBe(0);
    expect(r.status).toBe("superseded");
    expect(nr.predicate).toBe("walk");
    expect(s.retrieve({ entity: "leo" }).map((x) => x.id)).toEqual([nr.id]);
  });
  it("retrieves by time range", () => {
    const s = new MemoryStore();
    s.ingestText("Ana feeds the cat.", 1); s.ingestText("Leo walks the dog.", 5);
    expect(s.retrieve({ from: 4 }).map((r) => r.source)).toEqual(["leo"]);
  });
  it("evaluations never invent model or LLM results", () => {
    const rows = evaluate("language", SYNTHETIC[0].records);
    expect(rows.find((r) => r.baseline === "model")!.status).toBe("not_configured");
    expect(rows.find((r) => r.baseline === "llm")!.value).toBeNull();
    expect(evaluate("behavior", []).every((r) => r.status !== "measured")).toBe(true);
  });
  it("memory finds contradictions a rules-only reader cannot", () => {
    const rows = evaluate("contradiction", SYNTHETIC[1].records);
    const v = Object.fromEntries(rows.filter((r) => r.status === "measured").map((r) => [r.baseline, r.value]));
    expect(v.rules).toBe(0);
    expect(v.memory).toBe(1);
  });
  it("splits 10 records into 6 train / 2 val / 2 test", () => {
    expect(assignSplits(SYNTHETIC[0].records).splits).toEqual({ train: 6, val: 2, test: 2 });
  });
});
