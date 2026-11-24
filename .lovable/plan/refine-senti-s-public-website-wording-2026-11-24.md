# Refine Senti's public website wording

Wording and small reading-flow changes only. The cinematic hero, black-and-gold look, fonts, transitions, menu and page layouts all stay as they are.

## Homepage (/senti): one story, with no section repeating another
1. **Hero** stays. The supporting line now says what Senti is: a Loumilab research initiative studying how software can connect meaning, sentiment, history and experience.
2. **Introducing Senti ("Not another chatbot.")** names the research problem. Most systems treat each request on its own. Senti studies building connected understanding that improves as evidence arrives.
3. **What Senti studies** covers meaning beyond the literal words, sentiment beyond positive/negative, context (who, when, where, why), relationships across sources, and memory over time.
4. **Observe. Connect. Revise.** gets the plain-language visitor flow: add material, explore its meaning, see connections, then add more (poem → letter → history of the period). Facts are labeled separately from interpretations, and gaps are stated.
5. **Six layers** keeps the same cards, each marked "Working today" or "Research goal".
6. **What could understanding make possible?** explains that poetry and documents are starting points. The longer vision covers observations, behavior, events and experiences.
7. **Lab teaser** says what visitors can actually try today.
8. Add a short note near the Talk with us section: Senti does not feel emotions and is not conscious. It is not a summarizer or a standard sentiment tool, and it makes no claims of human-level understanding.

## Research page (/senti/research)
- Add short plain sections on relational memory, contextual interpretation, sentiment, learning, evidence revision and computational efficiency.
- Rewrite "Works today" and "Not built yet" against what actually exists:
  - **Working today:** structured observation processing, relational memory, evidence tracking, revision history and experiment tooling.
  - **Still in research:** deeper interpretation, finding patterns on its own, trained learning and broader context.
- Keep the evaluation, privacy and technical-document sections, with lightly edited wording.

## Lab page (/senti/lab)
- Add a short "How exploring works" strip in three to four steps.
- Clearly state what the public Lab does today: short pasted text, plain rules and evidence for every link. Also state what it does not do yet (uploads and AI reading live only in the private Studio, or are not available).

## Updates page (/senti/updates)
- The intro says these updates report real progress, experiments, findings and open challenges.
- Review the existing update entries for overstated claims and soften any I find. Saved research records are not deleted.

## Consistency
- Use the same terms everywhere: meaning, sentiment, contextual relationships, relational memory, adaptive computational learning.
- Update page titles and descriptions for search results and the Senti snippets in site search to match.

## Technical details
- Edit only the copy and arrays in `src/pages/senti/Home.tsx`, `Research.tsx`, `Lab.tsx` and `Updates.tsx`, plus small text blocks that reuse existing classes. No new components and no backend changes, except editing update text stored in the database if any of it overstates progress.
- Check the four pages at phone (390px), your current width (778px) and desktop widths for layout and readability.
