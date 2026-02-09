# Specification

## Summary
**Goal:** Improve frontend performance, responsiveness, and overall UX polish without changing existing features or backend behavior.

**Planned changes:**
- Lazy-load (code-split) page routes so only the current route’s JavaScript loads on first paint, with a visible route-loading state during chunk fetch.
- Optimize Feed rendering for long post lists by reducing unnecessary re-renders and expensive work during render while preserving current Feed behavior and UI.
- Improve post attachment image loading in Feed and Post Detail (e.g., lazy-loading/async decode) and ensure any object/blob URLs are cleaned up to prevent leaks.
- Standardize and smooth loading/empty/error states across Landing, Feed, Post Detail, and Comments; avoid flicker/jumps during background refresh and preserve scroll position on Feed.
- Improve mobile responsiveness of header navigation and primary layouts so key actions remain accessible on small screens (without changing gating behavior).

**User-visible outcome:** Pages load faster and feel smoother; navigation shows clear loading feedback, Feed stays responsive with many posts, images load efficiently, loading/error states are consistent, and the site is easier to use on mobile.
