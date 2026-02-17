# Specification

## Summary
**Goal:** Improve overall website performance by reducing unnecessary frontend re-renders and network calls, adding backend-supported feed pagination, and streamlining read-heavy backend paths with lightweight instrumentation for verification.

**Planned changes:**
- Optimize React rendering in high-traffic views (especially the feed) by memoizing expensive computations and preventing post list re-renders during composer typing.
- Tune React Query caching/refetch/invalidation behavior to reduce unnecessary network requests and UI blocking (including tab-hidden behavior and long-lived data like guidelines).
- Add backend-supported pagination/windowed retrieval for posts and update the frontend feed to request posts in pages (with “Load more” or infinite scroll) while keeping new post behavior correct.
- Improve backend responsiveness for read-heavy operations by avoiding full scans and reducing repeated work/N+1 patterns in feed, post detail, and admin moderation views.
- Add lightweight, development-only performance instrumentation for key flows (initial load, feed/post detail load, creating a post) without exposing debug output in production.

**User-visible outcome:** The app feels faster and more responsive—typing in the feed composer doesn’t lag, the feed loads quickly and can fetch more posts incrementally, and pages refetch less often while remaining up to date.
