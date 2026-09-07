# Dedicated events route and navigation

Status: done
Owner: coordinator
Implementation target: Luna
Depends on: [Upcoming AI events](RJ_UPCOMING_EVENTS.md) done

## 1. Outcome

Promote Events to a first-class site section by adding a top-level `/events` route and an `Events` main-navigation item. Move the full Winter 2027 agenda off `/ai` and onto `/events`, while retaining the concise `/ai` callout as a cross-route link to `/events#upcoming`.

The route name and navigation label must remain broad enough to support a future past-events portfolio with photos, recaps, testimonials, and related program links. This phase establishes that information architecture but does not publish an empty past-events section or invent portfolio content.

## 2. Evidence and existing behavior

- `App` defines all routes inline, and `/events` is not currently registered in `apps/web/src/App.jsx:135-160`.
- Route titles/descriptions are selected from `routeMetadata`, which has no `/events` entry in `apps/web/src/App.jsx:163-184`.
- `RouteEffects` currently watches only `pathname` and always scrolls to the top, so it has no explicit cross-route hash behavior in `apps/web/src/App.jsx:186-200`.
- The main navigation currently contains Home, AI Speaking & Education, About, and Projects in `apps/web/src/App.jsx:202-215`.
- The `/ai` callout currently points to the same-page `#upcoming-events` anchor, and the full agenda is rendered inside `AiPage` in `apps/web/src/App.jsx:284-341`.
- `UpcomingEvents` owns the section anchor `upcoming-events`, heading, semantic list, and event rendering in `apps/web/src/components/UpcomingEvents.jsx:4-54`.
- The desktop navigation uses a single flex row; at 680px it wraps inside a single-column header in `apps/web/src/App.css:70-89` and `apps/web/src/App.css:1107-1128`.
- Event regression tests currently render `/ai` and expect both the agenda and same-page anchor there in `apps/web/src/App.test.jsx:22-26` and `apps/web/src/App.test.jsx:93-143`.
- The event data is already independent of route placement in `apps/web/src/data/upcomingEvents.js`; no data migration or dependency change is required.

## 3. Fixed information architecture and copy

### Route and navigation

- Register `<Route path="/events" element={<EventsPage />} />` immediately after `/ai` and before `/about`.
- Add `<NavLink to="/events">Events</NavLink>` immediately after AI Speaking & Education and before About.
- Use the label `Events`, not `Upcoming Events`, so the route remains correct when past-event portfolio content is added.
- Keep Contact as the separate right-side header action; do not add Contact to the centered navigation.
- Do not rename or reorder the other navigation items.

### Route metadata

Add this exact `/events` entry to `routeMetadata`:

```js
'/events': {
  title: 'Events | Ryan Jones',
  description: 'Upcoming community AI talks, workshops, and courses from Ryan Jones of RJChicago, LLC.',
},
```

### Events page

Add `EventsPage` in `apps/web/src/App.jsx` immediately after `AiPage` and before `TopicCard` with this structure:

1. A compact `PageHero`:
   - eyebrow: `Events`
   - title: `AI education in the community`
   - copy: `Upcoming talks, workshops, and courses designed to make artificial intelligence practical, approachable, and useful.`
2. `<UpcomingEvents />` as the only event collection.
3. `<ContactCta title="Planning an AI event or community program?" copy="Let’s shape an approachable session for your audience." />`.

Extend `PageHero` with optional boolean prop `compact = false`. When true, append class `page-hero-compact`; existing callers receive unchanged markup and layout. `EventsPage` passes `compact`.

Add `.page-hero-compact` with a desktop minimum height of `42vh` and a reduced bottom padding that keeps the upcoming agenda visible sooner. Preserve the existing mobile hero padding; do not create a second hero component.

### Upcoming anchor and `/ai` teaser

- Change the `UpcomingEvents` section id from `upcoming-events` to `upcoming`; retain class `upcoming-events` and `aria-labelledby="upcoming-events-heading"`.
- Remove `<UpcomingEvents />` from `AiPage` entirely.
- Keep the calendar icon and approved sentence under Speaking Topics, but render the sentence with React Router `<Link to="/events#upcoming">`.
- The `/ai` page must contain no duplicated event cards, dates, locations, or registration states.

### Hash navigation

Update `RouteEffects` to destructure `{ pathname, hash }` from `useLocation()` and depend on both values.

- Continue setting title and meta description for every route change.
- When `hash` is empty, call `window.scrollTo(0, 0)` as today.
- When `hash` is present, schedule one `requestAnimationFrame`, find `document.getElementById(hash.slice(1))`, and call `scrollIntoView({ block: 'start' })` if found.
- Cancel the scheduled animation frame in effect cleanup.
- Do not throw or redirect when a hash target is absent.
- Keep `.upcoming-events { scroll-margin-top: 7rem; }` so the sticky header does not cover the target. Preserve the existing mobile reset when the header becomes non-sticky.

This behavior is intentionally generic so future links such as `/events#past` can use the same mechanism.

### Responsive navigation

- Add `white-space: nowrap` to main-navigation links.
- Preserve the single-row desktop navigation while it fits.
- At the existing `max-width: 900px` breakpoint, reduce navigation gap and horizontal link padding if needed so five items fit without colliding with the RJ brand.
- At `max-width: 680px`, retain centered wrapping; ensure links wrap as whole labels, remain readable, and do not create horizontal page overflow.
- Do not add a hamburger menu, JavaScript menu state, or new breakpoint in this phase.

### Future past-events portfolio boundary

Do not render a `Past events` heading, empty-state card, placeholder photos, or empty `#past` anchor in this release. A later plan may add `pastEvents` data, an `#past` section below Upcoming Events, and stable `/events/:slug` detail pages. The present route and `Events` navigation label must not require renaming when that work begins.

## 4. Implementation todos for Luna

The coordinator owns plan status and integration review. Luna must modify only the files named by the active todo, preserve all existing uncommitted event work, and leave `.env*`, `.aws/`, `.codex/`, deployment files, and package manifests untouched.

### EVT-R1 - Add route, page, metadata, navigation, and hash behavior

Status: done

Ownership:

- modify `apps/web/src/App.jsx`
- modify `apps/web/src/components/UpcomingEvents.jsx`

Work:

1. Register `/events`, add its metadata, and add the `Events` navigation item in the exact locations from section 3.
2. Add `EventsPage`, extend `PageHero` with the backward-compatible `compact` prop, and move the sole `<UpcomingEvents />` instance to the new page.
3. Change the section id to `upcoming` and change the `/ai` teaser to `/events#upcoming` using `Link`.
4. Implement generic hash-aware scrolling in `RouteEffects` with animation-frame cleanup.

Checks:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Pass criterion: `/events` builds with one agenda, `/ai` has only the teaser, metadata is exact, the active Events nav state works through `NavLink`, and both hashed and non-hashed route transitions have deterministic scroll behavior.

### EVT-R2 - Refine compact hero and five-item navigation layout

Status: done
Depends on: EVT-R1

Ownership:

- modify `apps/web/src/App.css`

Work:

1. Add the compact events-hero rule without changing existing page heroes.
2. Add the navigation wrapping/spacing protections from section 3.
3. Retain the existing event card styles and anchor scroll margin.

Checks:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Manual visual check: inspect the header and `/events` at approximately 1440px, 901px, 900px, 681px, 680px, and 375px widths. Confirm no horizontal overflow, clipped labels, brand collision, accidental Contact disappearance above its existing breakpoint, or excessive hero-to-agenda distance.

Pass criterion: the five-item navigation is intentional at every existing breakpoint, the compact hero preserves hierarchy, and event cards remain unchanged and readable.

### EVT-R3 - Migrate and extend route regression coverage

Status: done
Depends on: EVT-R2

Ownership:

- modify `apps/web/src/App.test.jsx`

Tests:

1. Replace `renderAi` with a small `renderRoute(initialEntry)` helper, or add `renderEvents`, without disturbing contact-form tests.
2. Render `/events`; assert the `Events` navigation link exists and is active, document title is `Events | Ryan Jones`, and the meta description matches section 3.
3. Move the four-offering/twelve-occurrence assertions from `/ai` to the `/events` render.
4. Render `/ai`; assert the full Winter 2027 region is absent and the approved teaser points to `/events#upcoming`.
5. Test `/events#upcoming` by spying on `Element.prototype.scrollIntoView`; wait for one call with `{ block: 'start' }`. Restore the spy after the test.
6. Preserve the coming-soon and future data-only registration-link tests.
7. Assert no `Past events` placeholder is rendered.

Checks:

```bash
npm --prefix apps/web run test
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Pass criterion: tests prove route ownership, navigation/metadata, content de-duplication, hash behavior, and the existing event-link contract without brittle snapshots.

### EVT-R4 - Integration review and canonical validation

Status: done
Depends on: EVT-R3
Owner: coordinator

Review:

1. Confirm `UpcomingEvents` is instantiated exactly once in production JSX and only on `/events`.
2. Confirm `/events`, `/events#upcoming`, `/ai`, and the main navigation behave in direct-load and client-navigation flows.
3. Confirm `apps/web/src/data/upcomingEvents.js`, package manifests, API code, and deployment files are unchanged.
4. Run and record:

```bash
npm --prefix apps/api run lint
npm --prefix apps/web run test
npm --prefix apps/web run lint
npm --prefix apps/web run build
docker compose build
```

Pass criterion: all checks pass, responsive review passes, the diff is confined to named files and plan records, and the site has one canonical display location for the agenda.

## 5. Acceptance criteria

- `Events` appears between AI Speaking & Education and About in the main navigation and is active on `/events`.
- `/events` has the approved compact hero, all four offerings, all twelve occurrences, and the event-focused contact CTA.
- `/ai` retains the approved teaser but contains no full agenda or duplicated event details.
- `/events#upcoming` reliably scrolls to the agenda below the sticky header on direct load and client navigation.
- `/events` title and description metadata match section 3.
- Navigation remains readable and overflow-free at desktop, tablet, and 375px mobile widths.
- No empty Past Events section, calendar dependency, package change, API change, or deployment change is introduced.
- Tests, lint, build, and canonical validation pass and are recorded before the plan is marked done.

## 6. Out of scope

- Past-event records, photos, galleries, testimonials, attendance numbers, case studies, or portfolio cards.
- Individual event-detail routes, slugs, social-sharing images, or Event JSON-LD.
- Registration/ticketing integrations, feeds, reminders, add-to-calendar controls, filters, search, or calendar grids.
- Content changes to the four approved Winter 2027 event records.
- A hamburger/drawer navigation or broader header redesign.
- Production deployment and changes to the active Phase 4 deployment plan.

## 7. Resumption and amendments

Resume by reading `ORPTA.md`, this plan, `RJ_UPCOMING_EVENTS.md`, the active Phase 4 plan, and `git status --short`. Begin with the first dependency-satisfied pending todo after setting this plan and that todo to `in-progress`. Any change to route names, navigation label/order, hero copy, anchor id, hash behavior, or the future portfolio boundary requires an append-only amendment with evidence and downstream impact.

## 8. Amendments

None.

## 9. Implementation record

- 2026-09-07: Implemented the `/events` route, Events navigation item, exact route metadata, compact hero, event-focused contact CTA, `/events#upcoming` hash scrolling, and single-source agenda placement. The `/ai` page retains only the cross-route teaser.
- 2026-09-07: Added route regression coverage for navigation state, metadata, all four offerings and twelve occurrences, de-duplication, unpublished registration states, hash scrolling, and the no-placeholder past-events boundary.
- 2026-09-07: Validation passed: `npm --prefix apps/api run lint`; `npm --prefix apps/web run test` (11 passed); `npm --prefix apps/web run lint`; `npm --prefix apps/web run build`; `docker compose build` (both images built). The Docker build required the approved escalated builder permission after the sandbox could not update Docker Buildx activity state.
- 2026-09-07: Confirmed the agenda component is instantiated once in production JSX and that event data, package manifests, API code, and deployment files remain unchanged. No past-events placeholder or calendar dependency was added.
