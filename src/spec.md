# Specification

## Summary
**Goal:** Add a new public Facts page that presents human urine facts in a readable, styled list and make it accessible via routing and navigation.

**Planned changes:**
- Create a new `Facts` page component that displays provided human urine facts as a styled bulleted or numbered list, matching the Tailwind + shadcn Card look used on the Tips page.
- Add a new lazy-loaded TanStack Router route for `/facts`, integrated into the existing router tree and wrapped by the current `AppLayout`.
- Add a “Facts” link to both the desktop header navigation and the mobile navigation menu (closing the mobile sheet on click).

**User-visible outcome:** Users can navigate to `/facts` (and via the app’s nav menus) to view a styled list of human urine facts.
