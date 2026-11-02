# Hide public view counts until 300 views

## What changes
- Knowledge Center article cards and article pages show the view count only once an article reaches 300 views. Below that, nothing is shown.
- The Dot. currently shows no public view counts; if any are added later, they follow the same 300 rule.
- Admin screens keep showing exact counts.

## Technical details
- Add `src/lib/kc/viewCount.ts` with `PUBLIC_VIEW_THRESHOLD = 300` and `showPublicViews(n)` (true when n >= 300).
- Use it in `src/components/kc/ArticleCard.tsx` and `src/pages/resources/Article.tsx` instead of `view_count > 0`.
- Leave "Popular" ordering on Resources as is (it shows no numbers).
- Add a small test: 299 hidden, 300 shown.
