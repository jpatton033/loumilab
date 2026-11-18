# Senti by Loumilab — Phase 1 + working research engine

## Pages (all new, using the existing header, footer and dark/ivory site look)
- **Navigation:** "Senti" right after Spaces on desktop and mobile, linking to /senti. Nothing else in the menu changes.
- **/senti:** full-screen generated film hero ("Intelligence begins with understanding.", the designation line, "Explore Senti Lab" and "Read the Research"), then short sections: Introducing Senti, The Research Question, Four Foundations (Language, Observation, Behavior, Memory), How Senti Works (a simple layered diagram), an invitation to the Lab, links to research, and a Research & Investment inquiry form. No progress section.
- **/senti/lab:** two clearly labeled modes.
  - *Guided demonstration:* ready-made fictional scenarios, marked "illustrative".
  - *Live research mode:* visitors type short observations. The real engine pulls out who and what is mentioned, links them, orders events in time, flags contradictions, and keeps memory across the session. Visitors can correct a link and see what changed, and delete their session. Results are shown as an interactive graph. If the engine is down, an honest "service unavailable" message appears.
- **/senti/research:** methodology, the six-layer architecture, what works today vs. what is experimental, and how claims will be evaluated. Text is written plainly and does not claim learning, patents, partners or results.
- **/senti/updates:** a list of dated notes you publish from Admin. It starts with one entry: "Research platform launched".

## Hero film
- Two or three short generated clips: a dark scene where small points of light and fragments of text appear, drift together and form linked threads that rearrange. No robots, brains or glowing network clichés.
- A still image is shown for people who prefer reduced motion. The headline sits over the film like the Spaces hero.

## Admin (Admin → Senti, staff only)
- Write and publish Updates and research documents.
- Turn Live mode and demo scenarios on or off.
- See session counts and errors.

## What the engine is and is not
- It is ordinary code: text rules plus statistics stored in the database, with no AI tokens used. Pages label it this way and never call it a trained model.
- It is built so a separate research service can take over later without changing the pages. Building that Python service is not part of this step.
- Visitor inputs are kept per session, removable by the visitor, and not used for training without a consent checkbox (off by default). There is no link to Orders or any customer data.

## Checks
- Run a live session end to end (add observations, see links, correct one, delete the session).
- Check the inquiry form, admin publishing, the menu on phone and desktop, and that visitors can't see each other's sessions.

## Technical details
- Tables: senti_sessions (anonymous token hash, consent, expires after 30 days), senti_events, senti_entities, senti_relations (weight, evidence ids, revised_from), senti_corrections, senti_updates, senti_settings, senti_audit. RLS: public read only for published updates; sessions accessible only through the function using the session token; staff full read.
- One `senti-engine` function with typed operations: create_session, observe, events, relations, correct, infer (evidence lookup / relation query), history, delete_session, metrics. Zod validation and rate limits through check_and_increment_rate_limit.
- Pure engine rules (entity extraction, relation scoring, contradiction detection, revision) in `_shared/sentiEngine.ts` with tests.
- Inquiries reuse the existing contact submission flow tagged "Senti".
- Routes added to App.tsx, prerender-heads staticMeta and the sitemap; navigation.ts updated.
- Film clips stored as assets; poster image for reduced motion.
