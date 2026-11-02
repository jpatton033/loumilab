# Hide public view counts until 125 views

## What changes
- Knowledge Center article cards and article pages show the view count only once an article reaches 125 views. Below that, nothing is shown.
- The Dot. currently shows no public view counts; if any are added later, they follow the same 125 rule.
- Admin screens keep showing exact counts.

## Technical details
- Add `src/lib/kc/viewCount.ts` with `PUBLIC_VIEW_THRESHOLD = 125` and `showPublicViews(n)` (true when n >= 125).
- Use it in `src/components/kc/ArticleCard.tsx` and `src/pages/resources/Article.tsx` instead of `view_count > 0`.
- Leave "Popular" ordering on Resources as is (it shows no numbers).
- Add a small test: 124 hidden, 125 shown.
