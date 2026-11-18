# Senti: research platform expansion

The current Senti site, the gold-brain hero and the navigation stay as they are. Everything below is added on top.

## 1. Website updates (public)
- **Overview, Research and Lab pages:** use the official long and short descriptions everywhere.
- **Overview page:** add the six research areas, the potential uses, and the seven-step method (Observe, Represent, Connect, Retrieve, Infer, Evaluate, Revise).
- **Status panel** on the overview and Research pages. It shows:
  - the objective and current engine version
  - what's built and what's being worked on
  - evaluation status, known limitations and planned milestones
  - the date of the last check
- **Real figures only:** the status panel reads its figures from the Studio. Anything that hasn't run says "Not yet evaluated". Nothing claims general intelligence, consciousness or sentience.

## 2. Research Studio at /senti/studio (private)
- **Access:** only signed-in staff with a new "Senti researcher" permission, or full admins. It isn't in the public menu; there's a link in Admin.
- **Dashboard:** active experiments, engine version, recent runs, milestones, datasets, evaluation results, service health, model registry and activity history. Empty areas say "Not configured" or "Not yet available".

## 3. Studio areas
- **Experiments:**
  - Each experiment records a name, hypothesis, description, category, dataset, engine version, settings, success criteria and notes.
  - Statuses: Draft, Queued, Running, Completed, Failed and Archived.
  - Runs execute on the real engine. Anything the engine can't do yet stays "Not available" and never shows a fake result.
- **Observations:**
  - Create test sessions and enter structured events: time, who or what was involved, action, outcome.
  - Review the relationships the engine produces, correct them, and compare earlier and later interpretations.
  - Typed sentences go through the current rule-based reader, clearly labelled as rules, not AI.
- **Memory explorer:**
  - A relationship graph with evidence you can expand.
  - Each relationship is labelled as a recorded fact, an inferred relationship or an unverified hypothesis.
  - Contradictions and correction history are shown.
- **Learning:**
  - Engine versions, training setups, checkpoints and notes.
  - It will show "No trained model" until a model is actually built and evaluated.
- **Evaluations:**
  - Seven test categories, each comparing rules only, structured memory, trained models and optional AI baselines.
  - Every result records its engine version, dataset version, settings and timestamp, so it can be repeated.
  - Rules-only and structured-memory tests run for real on synthetic test sets. The other comparisons stay "Not configured".
- **Datasets:**
  - Register datasets with their origin, permission to use, versions, fields and training/validation/test splits.
  - Upload approved structured files and link them to experiments.
  - I'll include starter synthetic datasets. Public visitor input is never used unless the visitor consented.
- **Journal:**
  - Entries record questions, hypotheses, experiments, observations, failures, findings, decisions and future areas, with author, time, linked experiments and edit history.
  - "Publish" sends a chosen entry to /senti/updates. Everything else stays private.

## 4. Senti Core v0.1
This is a relationship-memory and event engine, not a trained model, and it's labelled that way. It:
- takes in events (session, time, source, type, attributes)
- keeps stable entities, each with attributes
- links entities and events, recording the relationship type, evidence, time and status
- stores everything permanently
- finds relationships by entity, event or time range
- lets new evidence support, contradict or replace older evidence, keeping every earlier version
- explains every relationship by showing its evidence
- comes with automated tests for storing, finding and revising relationships

As you chose, it runs on Loumilab's current backend for now.

## 5. Python version for later
- **Separate project:** a ready-to-host Python service mirroring the same versioned API (sessions, events, entities, relationships, evidence, corrections, experiments, evaluations, health). It includes checks, sign-in, tests, a container setup and a README.
- **Delivery:** it goes to your Files, separate from the website code.
- **Moving over:** a written API contract lets the Studio switch to the Python service by changing one setting.

## 6. Public Lab
- **Same engine:** the Lab moves onto Core v0.1 but stays walled off from private sessions, datasets and experiments.
- **Visitors can:**
  - run the guided demos
  - start their own private sessions
  - add test observations
  - see the resulting relationships and the evidence behind them
  - see published metrics
- **Protection:** limits on use per visitor, and labels that separate demos from live research.

## Limitations to expect
- No model is trained in this build.
- Python hosting is not set up.
- AI and trained-model comparisons will show "Not configured".

## Technical details
- New tables for engine versions, experiments and runs, datasets with versions and splits, evaluations and results, model registry, journal entries with revision history, milestones, and the researcher permission. Only Senti researchers and admins can read or write them, enforced by the database itself.
- Existing Senti tables get versioned relationship and evidence links plus a "kind" label (fact, inferred or hypothesis).
- A new private `senti-studio` backend function checks the researcher permission. The existing public function keeps its limits and only touches public sessions. Both share one engine module so they behave the same.
- Studio pages load only when opened and use the existing gold-on-black styling. Public routes, the sitemap and search previews are left alone apart from the page updates in section 1.
- Python package: FastAPI, Postgres, pytest, Dockerfile and an OpenAPI contract, with PyTorch listed for later and not used yet.
