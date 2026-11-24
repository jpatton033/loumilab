# Senti — Unified Explore, Library and Research

Turn the separate Senti Studio tools into one simple path: **Add something → Explore its meaning → Discover connections → Build understanding.** Nothing is deleted. Existing experiments, datasets, observations, relationships and results stay as they are.

## Decisions taken (no answer received)
- **No AI for now.** The brief says not to use paid AI services without authorization. Themes, tone, symbolism and alternative interpretations show an honest "Not available yet" state. Everything shown comes from Senti's own rules engine and is linked to the exact sentence it came from.
- **Source links are shown but marked "Coming soon."** Senti will not claim to have read a webpage it can't fetch. Turning links on later can reuse the safe page reader the Local importer already uses.
- The public Senti landing page hero and the public Loumilab menu stay as they are. Senti still comes right after Spaces.

## 1. New workspace menu (Studio)
Three destinations replace the eight technical tabs:
- **Explore**: start and continue explorations.
- **Library**: saved explorations, sources, collections, recent activity and research datasets.
- **Research**: available only to approved researchers. Holds Experiments, Models (the current Learning page), Evaluations, Diagnostics (the current Observations and Memory pages) and Journal.

Old addresses send people to their new homes, for example /senti/studio/memory goes to Research → Diagnostics → Memory.

## 2. Explore start screen
- Headline "What would you like to explore?" with the supporting text from the brief.
- One large input with three tabs: **Write or paste**, **Upload** (PDF, Word, plain text and Markdown files, drag and drop), and **Link** (Coming soon).
- Before analysis, people can review and correct the extracted text.
- Progress shows in plain steps: "Reading source", "Finding people, places and events", "Finding relationships", "Saving".

## 3. One analysis workspace, four areas
The source text stays beside the analysis. Selecting any result highlights the sentences that support it. Every item carries one of four labels: **In the text**, **Pattern found**, **Possible interpretation** or **Not supported**.
- **Meaning:** what the engine really finds today: key passages, people, places, things and ideas, how often each is mentioned, time words and positive or negative wording. Richer reading shows as "Not available yet."
- **Context:** Who, What, When, Where, Why and How, filled only from what the text says or what the user supplied (author, date, place). It says plainly when outside context is missing.
- **Connections:** the existing relationship map, plus a simple list view. Each link shows its evidence sentences and a status: documented, inferred, disputed or unverified. Support counts appear in words ("supported by 3 passages, challenged by 1"), never as percentages.
- **Evolution:** a readable timeline of each source added, relationships that are new or more strongly supported, interpretations that were challenged or revised, and corrections. Earlier versions are kept. A short note explains that this is saved knowledge being updated, not a model learning.
- An **Add another source** button is always visible. New sources are kept separately. Links between sources are highlighted, and contradictions stay visible as disputed instead of being merged.

## 4. Library
- Saved explorations, all sources, and collections the user creates. Collections start empty, with no sample collections.
- Rename, move between collections, search, reopen, add a source to an existing exploration, delete your own items, and export the analysis as a JSON or Markdown file.
- Changes save automatically with a short confirmation. Each person sees only their own items. Research datasets appear in a section visible only to researchers.

## 5. Public Senti Lab
- Uses the same Explore look, with limits: pasted text only, a short length cap, sample scenarios, rate limits and the existing temporary sessions with deletion.
- No uploads or saving to the Library. Never touches private Studio data.

## 6. Look and feel
Senti's black and gold identity: deep black and charcoal backgrounds, gold used sparingly, spacious layouts that feel like a document editor rather than a dashboard. Advanced options stay hidden until opened. Works on phones.

## 7. Checks
Automated tests cover splitting text into passages, the evidence labels, the old-address redirects, owners-only access and the upload type and size limits. A browser run signs in as a test researcher, pastes a poem, adds a letter as a second source, checks Connections and Evolution, saves the result to a collection and reopens it, at desktop and 778px.

## Technical details
- **Data model:** this adds to the existing tables and removes nothing.
  - `senti_explorations`: owner, title and collection. It wraps an existing `senti_sessions` row with scope 'studio'.
  - `senti_sources`: exploration, kind, original text, corrected text, metadata, file path, sha256 fingerprint and engine version.
  - `senti_collections`: owner and name.
  - `senti_events` gains a nullable `source_id` and a sentence offset, so evidence points back to the exact passage.
  - All tables have owner RLS and grants. Researchers keep their existing access through senti_is_researcher.
- **Files:** a private `senti-sources` storage bucket under owner/ paths, 10 MB limit. Text is extracted in the browser (pdfjs-dist for PDF, mammoth for Word, read directly for TXT and Markdown) and checked again on the server.
- **Ingesting long text:** the existing `ingest` step accepts up to 400 characters. A new `ingest_source` step in `senti-studio` splits a source into sentences, runs each through parseObservation, and tags each event with its source. Core rules stay in sentiCore.ts and sentiEngine.ts, and every result records the engine version.
- **Future engine:** an analyzer setting in `_shared/sentiAnalyzers.ts` lists each capability as operational or not_configured. The current Python API contract plugs in there, so new capabilities appear without redesigning the screens.
- **Routes:** /senti/studio (Explore), /senti/studio/x/:id (workspace), /senti/studio/library, /senti/studio/research/*. Old routes use `<Navigate replace>`. AGENTS.md gets the new structure rule.
- **Not built in this round:** reading web links, AI interpretation (themes, tone, symbolism) and model training.
