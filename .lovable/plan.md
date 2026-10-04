# Rich-text article editor for Loumilab Resources

Replace the plain "Body (markdown)" text box in the admin article editor with a Docs-style rich-text editor. Nothing changes in how Resources pages look, except shared heading/paragraph spacing gets slightly tidier so the editor and the published page match.

## What authors get
- **Toolbar** (icons + tooltips): Undo, Redo | Paragraph / H2 / H3 / H4 picker | Bold, Italic, Underline, Strikethrough | Bulleted list, Numbered list, Blockquote, Divider | Add/edit link (simple URL field), Remove link | Clear formatting. Sticks to the top while scrolling long articles.
- **Paste that keeps structure** from ChatGPT, Google Docs, Word, Notes and webpages: paragraphs, headings, lists, bold, italic, links, quotes stay intact. Fonts, colours, backgrounds and inline styles are stripped.
- **Plain-text paste**: Markdown (`##`, `###`, `**bold**`, `*italic*`, `1.`, `-`) is converted; plain line breaks become separate paragraphs, never one run-on block.
- **No extra H1s**: pasted H1 becomes H2; the article title stays the only H1.
- **Live look**: the editor uses the same typography as published articles, so what you see is what publishes. Existing "Preview" and "Save draft" stay as they are.
- Comfortable on desktop and tablet.

## Existing articles
Articles are stored as Markdown today. The editor loads Markdown, and saves back to Markdown, so all existing articles, the table of contents, read-time estimate and public pages keep working with no data migration.

## Technical details
- New `src/components/kc/RichArticleEditor.tsx` built on the already-installed Tiptap (StarterKit, Underline, Link, Placeholder); headings limited to levels 2–4.
- Markdown in/out: add `marked` (Markdown -> HTML on load and on plain-text paste) and `turndown` + GFM plugin (HTML -> Markdown on change). Underline saved as `<u>`; `ArticleBody` gets `rehype-raw` restricted via `rehype-sanitize` allowlist so only `u` passes through, plus an `h4` renderer.
- Paste handling: `transformPastedHTML` strips `style`, `class`, `font`, `span` wrappers, Word/Docs junk (`o:p`, `mso-*`, Google's `<b id="docs-internal-guid">`) and demotes `h1`; `handlePaste` for text-only clipboard runs Markdown detection then falls back to splitting on line breaks.
- Shared article typography moved into a `.kc-prose` class in `src/index.css`, used by both `ArticleBody` and the editor so spacing is identical.
- `ArticleEditor.tsx`: swap the body Textarea for the new component; everything else (save, status, preview) untouched.
