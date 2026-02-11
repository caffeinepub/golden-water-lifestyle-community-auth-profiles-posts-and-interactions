# Specification

## Summary
**Goal:** Show each Community Feed post’s author username (when available) instead of a truncated principal, without requiring admin permissions.

**Planned changes:**
- Add a new backend query on `backend/main.mo` that takes an author `Principal` and returns the user’s public username (or null/empty if no profile exists), callable by any authenticated user with `#user` permission.
- Update the Community Feed post header (`frontend/src/pages/FeedPage.tsx` / `frontend/src/components/posts/PostCard.tsx`) to display the resolved username, while keeping “You” for the current user.
- Add a dedicated React Query hook in `frontend/src/hooks/useQueries.ts` to resolve usernames by principal and cache results to avoid repeated lookups while scrolling.
- Implement fallback display text when username cannot be resolved (no profile or request failure): `User {first 8 chars of principal}...`.

**User-visible outcome:** In the Community Feed, posts show the author’s username when available (or “You” for your own posts), with a safe fallback to the current truncated principal format when a username can’t be fetched.
