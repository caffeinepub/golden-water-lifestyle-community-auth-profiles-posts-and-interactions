# Specification

## Summary
**Goal:** Add a new “Gold Water Tracker” page that embeds the full Quench Joy Flow water tracker site and can be accessed via routing and navigation.

**Planned changes:**
- Create a new frontend page titled “Gold Water Tracker” that embeds https://quench-joy-flow.lovable.app/ in a responsive iframe with an accessible title.
- Add a new lazy-loaded TanStack Router route at a stable path (e.g., `/gold-water-tracker`) for direct URL navigation.
- Add navigation links labeled “Gold Water Tracker” to both the desktop header nav and the mobile menu (mobile link closes the menu after navigation).

**User-visible outcome:** Users can navigate (or deep-link) to “Gold Water Tracker” and use the embedded Quench Joy Flow site within the app on mobile and desktop without breaking the app layout.
