/** View counts stay private until an article reaches this many views. */
export const PUBLIC_VIEW_THRESHOLD = 125;
export const showPublicViews = (n: number | null | undefined) => (n ?? 0) >= PUBLIC_VIEW_THRESHOLD;
