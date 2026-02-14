# Specification

## Summary
**Goal:** Add a new public monetization page titled “LOVE THE LIQUID” featuring an embedded Ko‑fi view and a clear button link to the Ko‑fi page.

**Planned changes:**
- Create a new public React page “LOVE THE LIQUID” with an H1 title and an embedded view (iframe/embed) of https://ko-fi.com/painparadise.
- Add a call-to-action button on the page that links to https://ko-fi.com/painparadise (opens in a new tab with safe link attributes).
- Add a new lazy-loaded TanStack Router route (e.g., `/love-the-liquid`) in `frontend/src/App.tsx` to render the page.
- Add navigation links to the new page in both desktop header navigation (`frontend/src/components/layout/AppLayout.tsx`) and the mobile menu (`frontend/src/components/layout/MobileNav.tsx`).

**User-visible outcome:** Users can navigate to “LOVE THE LIQUID” from the site navigation (or via a direct URL), see the Ko‑fi page embedded, and click a button to open the Ko‑fi donation page.
