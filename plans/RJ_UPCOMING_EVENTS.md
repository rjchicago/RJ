# Upcoming AI events on the public site

Status: done
Owner: coordinator
Implementation target: Luna
Depends on: existing `/ai` route; independent of the in-progress Phase 4 deployment work

## 1. Outcome

Add a polished, accessible "Upcoming AI programs" section to `/ai` that advertises the four Winter 2027 offerings already scheduled with the Park Ridge Park District and Park Ridge Public Library. The first release is a lightweight, responsive agenda made from native React and semantic HTML. It shows the program dates, times, partner, audience/format, venue information that is safe to publish, a short description, and a non-interactive "Registration details coming soon" state until official postings exist.

The implementation must make later registration links a data-only change, must not add a calendar dependency, and must not imply that registration is open.

## 2. Evidence and source-of-truth order

Repository evidence:

- The public site is a React 19/Vite single-page app, and `/ai` is rendered by `AiPage` in `apps/web/src/App.jsx:269-341`.
- The existing AI page already contains the same three course families and has an availability note claiming that sessions are still being developed in `apps/web/src/App.jsx:283-323`. The event work must replace that stale note with concrete upcoming-program language.
- The current course cards and modal data live inline in `apps/web/src/App.jsx:26-93`, while visual primitives and responsive breakpoints live in `apps/web/src/App.css:319-476` and `apps/web/src/App.css:872-977`.
- Existing route tests use React Testing Library with a `MemoryRouter` in `apps/web/src/App.test.jsx:1-64`.
- The web app has no date/calendar dependency; its declared runtime dependencies are React, React Router, Lucide, and React Icons in `apps/web/package.json:12-18`.

Program evidence:

- The Park District schedule is explicitly labeled finalized and records the approval date in `/Users/rjchicago/Documents/github/rjchicago-llc/ai-courses/engagements/park-ridge-park-district/winter-2027/schedule.md:1-3`.
- It specifies AI for Adults 55+ on January 12, February 9, and March 9, 2027, from 10:00 a.m. to noon in `schedule.md:5-11`.
- It specifies AI for Everyday Life on January 7, 14, 21, and 28, 2027, from 6:30 to 8:30 p.m. in `schedule.md:13-20`.
- It specifies AI for Parents on February 4, 11, 18, and 25, 2027, from 6:30 to 8:30 p.m. in `schedule.md:22-29`.
- The reusable pitches describe the audiences and program content in `/Users/rjchicago/Documents/github/rjchicago-llc/ai-courses/courses/active-adults-55-plus/pitch.md:1-26`, `/Users/rjchicago/Documents/github/rjchicago-llc/ai-courses/courses/everyday-life/pitch.md:1-22`, and `/Users/rjchicago/Documents/github/rjchicago-llc/ai-courses/courses/parents/pitch.md:1-22`.
- The library notes describe a general-adult lecture, public-facing title, overview, and 90-minute format in `/Users/rjchicago/Documents/github/rjchicago-llc/ai-courses/engagements/park-ridge-library/2027/notes/Park-Ridge-Library.md:4-25`.
- The attached `/Users/rjchicago/Downloads/Contract - Ryan Jones (Feb. 2027).pdf`, page 1, instead records "Understanding AI," Tuesday, February 2, 2027, 7:00-8:00 p.m., a hybrid program with the presenter at the Library, First Floor Meeting Room, maximum attendance 90. Page 2 is administrative terms and is not website copy.
- The Park Ridge Park District's official facility listing names the venue "Centennial Activity Center" at 100 S. Western Ave., Park Ridge, Illinois: [official facility page](https://www.prparks.org/Facilities/Rentals/Facility-Rentals).

Source precedence:

1. User-approved public title, duration, modality, status wording, and publishable venue details.
2. Signed/current partner agreement for logistics.
3. Finalized Park District schedule for dates and times.
4. Reusable course pitch and library notes for concise descriptions.
5. Existing public-site copy only where it does not conflict with the sources above.

Do not publish private referral contact details from the library notes, presenter contact/payment information, attendee maximum, contract fee, contract administration, or partner-internal logistics.

## 3. Research decision: use an agenda, not a calendar library

Decision as of 2026-09-07: do not add FullCalendar, Schedule-X, React Big Calendar, a date utility, or an add-to-calendar package in this phase.

Rationale:

- The content is four offerings with twelve known occurrences, not a scheduling application. A month grid would repeat series titles, consume substantial mobile space, and hide the descriptions that do the advertising work.
- FullCalendar's React setup requires the React connector plus at least one view plugin and theme styles; its advanced scheduler is separately licensed. See [FullCalendar React documentation](https://fullcalendar.io/docs/react) and [plugin index](https://fullcalendar.io/docs/plugin-index).
- Schedule-X is modern and extensible, but its calendar, theme, React integration, and optional plugins still introduce an external visual system for behavior this page does not need. See [Schedule-X plugins](https://schedule-x.dev/docs/calendar/plugins).
- React Big Calendar supports React 19, but requires a localizer and compiled CSS/custom styling, which is disproportionate for a read-only agenda. See [React Big Calendar setup](https://github.com/bigcalendar/react-big-calendar/blob/master/README.md).
- Native `Intl.DateTimeFormat` is widely available and sufficient if display formatting is needed. See [MDN `Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
- An add-to-calendar control can be reconsidered after public details stabilize; the maintained [Add to Calendar Button](https://add-to-calendar-button.com/use-with-react) supports React and major calendar providers, but adding it now would let visitors save events whose registration/location details may still change.
- Do not add Event JSON-LD in this phase. Google's event experience expects accurate event data and a unique leaf URL focused on each event, whereas this release is one multi-event agenda without official event pages. See [Google Event structured-data technical guidelines](https://developers.google.com/search/docs/appearance/structured-data/event#technical-guidelines).

Revisit a full calendar library only if the product later needs at least one of: month/week navigation, user-selectable calendars, remote event feeds, recurrence editing, drag/drop, or dozens of simultaneously displayed events. Revisit structured data when each offering has a stable public leaf page and complete venue/registration facts.

## 4. Fixed first-release content and behavior

### Placement and information architecture

- Insert `<UpcomingEvents />` in `AiPage` after the existing `#programs` course-card section and before the "Designed for your audience" section.
- Replace the stale `availability-note` under Speaking Topics with: "Winter 2027 community programs are now scheduled in Park Ridge." Link this sentence to `#upcoming-events` with native anchor behavior.
- Render one card per offering, ordered by first occurrence:
  1. AI for Everyday Life — Park Ridge Park District — four-session course.
  2. AI for Adults 55+ — Park Ridge Park District — three standalone monthly workshops unless the user answers otherwise in section 5.
  3. Library program — Park Ridge Public Library — one lecture.
  4. AI for Parents — Park Ridge Park District — four-session course.
- Do not render twelve repetitive cards. Each offering card contains an ordered date list so a series remains understandable as one registration decision.

### Exact data contract

Create and export `upcomingEvents` from `apps/web/src/data/upcomingEvents.js`. Each object has exactly:

```js
{
  id: 'stable-kebab-case-id',
  title: 'public title',
  partner: 'Park Ridge Park District' | 'Park Ridge Public Library',
  format: 'Four-session course' | 'Monthly workshop' | 'Community lecture',
  audience: 'General adults' | 'Adults 55+' | 'Parents and caregivers',
  description: 'one concise public paragraph',
  occurrences: [
    {
      start: 'ISO-8601 local date-time with -06:00 offset',
      end: 'ISO-8601 local date-time with -06:00 offset',
      dateLabel: 'short display label',
      timeLabel: 'human-readable local time range'
    }
  ],
  location: {
    name: 'publishable venue name',
    address: null | 'publishable one-line address/detail'
  },
  registrationUrl: null,
  status: 'coming-soon'
}
```

All January-March 2027 dates are Central Standard Time (`-06:00`). Store the public display labels beside the ISO values; do not parse date-only strings through `new Date('YYYY-MM-DD')`, which can shift dates across time zones. Sort the authored array by its first `occurrences[0].start`; do not add runtime sorting for a static list.

Fixed Park District occurrence values:

- `ai-everyday-life-winter-2027`: January 7, 14, 21, and 28, each `2027-01-DDT18:30:00-06:00` to `2027-01-DDT20:30:00-06:00`; labels `Thu, Jan 7`, `Thu, Jan 14`, `Thu, Jan 21`, and `Thu, Jan 28`; time label `6:30-8:30 p.m.`.
- `ai-adults-55-winter-2027`: `2027-01-12`, `2027-02-09`, and `2027-03-09`, each `T10:00:00-06:00` to `T12:00:00-06:00`; labels `Tue, Jan 12`, `Tue, Feb 9`, and `Tue, Mar 9`; time label `10:00 a.m.-12:00 p.m.`.
- `ai-for-parents-winter-2027`: February 4, 11, 18, and 25, each `2027-02-DDT18:30:00-06:00` to `2027-02-DDT20:30:00-06:00`; labels `Thu, Feb 4`, `Thu, Feb 11`, `Thu, Feb 18`, and `Thu, Feb 25`; time label `6:30-8:30 p.m.`.

Fixed Park District descriptions and location state:

- AI for Everyday Life: "A beginner-friendly course for using AI to plan, organize, write, research, learn, and solve everyday problems safely and effectively."
- AI for Adults 55+: "A friendly, hands-on workshop for using AI with writing, planning, travel, hobbies, and everyday tasks while recognizing scams, misinformation, and privacy risks."
- AI for Parents: "Practical guidance for parents and caregivers navigating AI in homework, learning, creativity, online content, privacy, and family communication."
- All three use location name `Centennial Activity Center` and address `100 S. Western Ave., Park Ridge, IL 60068`.

Fixed library values:

- `understanding-ai-library-2027`: title `Understanding AI`; format `Community lecture`; audience `General adults`; one occurrence from `2027-02-02T19:00:00-06:00` to `2027-02-02T20:00:00-06:00`; date label `Tue, Feb 2`; time label `7:00-8:00 p.m.`.
- Description: "An approachable introduction to what modern AI is, where people already encounter it, what it does well, and where it can fail."
- Location name `Park Ridge Public Library - First Floor Meeting Room`; address `20 S. Prospect Ave., Park Ridge, IL 60068`.
- Do not advertise a virtual attendance option. The attached agreement's hybrid classification is partner logistics, not sufficient public access information.

### Rendering contract

Create `apps/web/src/components/UpcomingEvents.jsx` exporting a named `UpcomingEvents` component with signature `UpcomingEvents({ events = upcomingEvents })`. The default prop renders production data, and the injectable array permits a focused future-link test without mutating the canonical fixture.

- Root element: `<section className="section upcoming-events" id="upcoming-events" aria-labelledby="upcoming-events-heading">`.
- Heading block: eyebrow "Upcoming events," `h2` text "Winter 2027 in Park Ridge," and one sentence explaining that dates are scheduled and registration links will be added when partners publish them.
- Offerings container: semantic list (`<div className="event-list">` is acceptable only if each child remains an `<article>` and the section heading labels the region; prefer `<ul>`/`<li>` if default list styling is fully reset).
- Each card includes a Lucide `CalendarDays` icon, partner name, status chip, `h3`, format/audience metadata, description, location, and an occurrence list.
- Each occurrence uses `<time dateTime={occurrence.start}>` for the date and includes its time range in visible text. Do not hide a date or time behind hover/tooltips.
- When `registrationUrl === null`, render a non-clickable status row with a clock/info icon and "Registration details coming soon." Do not render an anchor with an empty URL, `#`, disabled styling, or a contact-form substitute.
- When a future `registrationUrl` is non-null, render one external "View details & register" anchor with `target="_blank"`, `rel="noreferrer"`, an `ExternalLink` icon, and an accessible name that includes the event title. This future branch must be implemented and tested now so enabling a link is a data-only change.
- Keep all copy factual. Do not use "tentative" on individual finalized Park District dates unless the user selects that wording in section 5; the section-level coming-soon message sufficiently communicates that official listings are pending.

### Visual contract

Add scoped styles to `apps/web/src/App.css` using the existing variables and glass-panel vocabulary.

- Desktop: two-column event-card grid; the first two multi-date offerings may occupy equal columns. Cards use a compact date rail/list rather than a month grid.
- Date rows: fixed-width month/day block or equivalent high-contrast date treatment, with the time and session count aligned beside it.
- Use the existing cyan/magenta palette and `status-chip` conventions, but distinguish coming-soon status from the existing "Available for proposals" chips with a muted purple border/background.
- At `max-width: 900px`, collapse event cards to one column.
- At `max-width: 680px`, remove fixed date-row widths, preserve at least 44px interactive target height for the future registration link, and prevent partner/status metadata from overflowing.
- Add `:focus-visible` styling for the anchor from Speaking Topics and the future registration link. Respect the site's existing typography and spacing; do not add new global variables or fonts.
- Set `scroll-margin-top: 7rem` on `.upcoming-events` so the in-page anchor clears the sticky desktop header; reduce it appropriately when the header becomes non-sticky at the existing mobile breakpoint.

## 5. Approved content decisions

Approved by the user on 2026-09-07:

1. Use the agreement's library title and time: "Understanding AI," 7:00-8:00 p.m.
2. Use "Registration details coming soon" without a tentative label.
3. Publish the Park District venue as Centennial Activity Center, using the official facility name and address recorded in sections 2 and 4.
4. Treat the three AI for Adults 55+ dates as independently registerable monthly workshops, not a three-part series.
5. Advertise only the Park Ridge Public Library physical location until an official listing supplies public virtual-access details.

## 6. Implementation todos for Luna

The coordinator updates plan and todo statuses. Luna owns only the files named by the active todo and must not modify `.env*`, `.aws/`, `.codex/`, deployment files, or unrelated user changes.

### EVT-T1 — Add canonical event data and presentation component

Status: done

Ownership:

- create `apps/web/src/data/upcomingEvents.js`
- create `apps/web/src/components/UpcomingEvents.jsx`

Work:

1. Encode the four approved offerings and every fixed occurrence from section 4.
2. Implement semantic event cards, occurrence `<time>` elements, the null-link state, and the future external-link branch.
3. Import only icons already available through `lucide-react`; add no dependencies.

Checks:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Pass criterion: both files compile and lint; all twelve occurrences are represented; null registration URLs create no anchors; no private/internal fields appear in the data.

### EVT-T2 — Integrate and style the agenda

Status: done
Depends on: EVT-T1

Ownership:

- modify `apps/web/src/App.jsx`
- modify `apps/web/src/App.css`

Work:

1. Import and place `UpcomingEvents` at the exact `/ai` location in section 4.
2. Replace the stale development availability note with the approved scheduled-program anchor copy.
3. Add scoped desktop/tablet/mobile styling from the visual contract.
4. Do not add a new route or main-navigation item; `/ai#upcoming-events` is the only new public location.

Checks:

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Manual visual check: inspect `/ai` at approximately 1440px, 900px, and 375px widths. Confirm no clipping/overflow, clear card hierarchy, readable recurring dates, visible keyboard focus, and that the course modal still layers above the page.

Pass criterion: the section is visually coherent with the existing site, all content remains readable without interaction, the anchor lands below the sticky header without hiding the heading, and no existing AI-page behavior regresses.

### EVT-T3 — Add event-specific regression coverage

Status: done
Depends on: EVT-T2

Ownership:

- modify `apps/web/src/App.test.jsx`

Tests:

1. Add a `renderAi()` helper using `/ai` without changing the contact tests.
2. Within the region named "Winter 2027 in Park Ridge," assert four offering headings and twelve `<time>` elements.
3. Assert the boundary occurrences January 7 and March 9 plus the confirmed library start time.
4. Assert "Registration details coming soon" appears for all four offerings and that the region contains no links while every `registrationUrl` is null.
5. Unit-test or fixture-test the future-link branch with one event carrying a URL; assert accessible name, URL, `_blank`, and `rel="noreferrer"`.
6. Assert the old "currently being developed" copy is absent and the new link targets `#upcoming-events`.

Checks:

```bash
npm --prefix apps/web run test
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

Pass criterion: tests exercise content, semantics, coming-soon behavior, and the data-only link upgrade path without brittle full-page snapshots.

### EVT-T4 — Integration review and canonical validation

Status: done
Depends on: EVT-T3
Owner: coordinator

Review:

1. Compare every rendered title/date/time/location/status against section 4 and the approved section 5 decisions.
2. Search the diff for prohibited contract/referral details and for unrelated changes.
3. Confirm `apps/web/package.json` and `apps/web/package-lock.json` are unchanged.
4. Run the repository's canonical checks and record exact results before marking this plan done:

```bash
npm --prefix apps/api run lint
npm --prefix apps/web run lint
npm --prefix apps/web run test
npm --prefix apps/web run build
docker compose build
```

5. If deployment is requested later, follow the active Phase 4 release contract; this plan does not authorize production deployment.

Pass criterion: all automated checks pass, visual review passes at all three widths, the diff is confined to this plan's named implementation files, and the live-page content matches the approved facts.

## 7. Acceptance criteria

- `/ai` advertises exactly four Winter 2027 offerings and all twelve scheduled occurrences.
- Each offering communicates title, partner, format/audience, description, date(s), time, location state, and registration-coming-soon state.
- No official registration link is invented and no empty/disabled link is rendered.
- A future registration URL can be enabled by editing only `upcomingEvents.js`.
- Dates are semantic, timezone-stable, chronologically authored, and readable on desktop and mobile.
- The resolved library contract values and approved publication choices are implemented exactly.
- No calendar/date/add-to-calendar dependency, separate event route, JSON-LD, API, CMS, admin UI, or deployment change is introduced.
- Tests, lint, web build, and canonical repository validation pass and are recorded.

## 8. Out of scope

- Editing, signing, redistributing, or otherwise acting on the attached contract.
- Publishing partner contact information, fees, payment terms, attendee limits, referral details, or internal logistics.
- Partner registration pages, ticketing, payments, waitlists, attendance tracking, reminders, feeds, or calendar synchronization.
- Month/week/day calendar views, filters, search, recurring-event engines, and user-created events.
- Individual event routes and Google Event structured data.
- Automatic ingestion from the separate `ai-courses` repository.
- Changing course-card proposal copy beyond the one stale availability note.
- Production deployment or modifications to the active Phase 4 deployment plan.

## 9. Resumption and amendment rules

Resume by reading `ORPTA.md`, this plan, the active Phase 4 plan, `git status --short`, and any append-only amendments below. Begin at the first dependency-satisfied pending todo. If a partner posting changes a title, time, location, modality, series model, or registration URL during implementation, append an amendment with the source and downstream impact before editing data or tests.

## 10. Amendments

### 2026-09-07 - Content approval and Park District venue

- Affected scope: section 4 data contract and all implementation todos.
- Evidence: the user approved all recommended content defaults and identified the Park District venue as the Centennial Center; the Park Ridge Park District official site confirms the public facility name `Centennial Activity Center` and address `100 S. Western Ave., Park Ridge, Illinois`.
- Corrected decision: replace the provisional Park District location with the official Centennial Activity Center name/address; fix the library agreement title/time, coming-soon status, standalone 55+ workshop model, and physical-only library presentation.
- Downstream impact: the plan is now `ready`; Luna can begin EVT-T1 without further content discovery.

### 2026-09-07 - Agenda placement superseded by dedicated Events route

- Affected scope: section 4 placement, section 7 `/ai` acceptance, and the implementation record's canonical display location.
- Evidence: after reviewing the completed `/ai` agenda, the user approved a top-level `Events` navigation item and dedicated `/events` route, with future past-event portfolio use.
- Corrected decision: [RJ_EVENTS_ROUTE.md](RJ_EVENTS_ROUTE.md) moves the sole agenda instance from `/ai` to `/events`, changes the teaser target to `/events#upcoming`, and reserves the route for future past-event content.
- Downstream impact: this completed plan remains the source of truth for event data and card behavior; the follow-on plan is authoritative for route placement, navigation, and hash behavior.

## 11. Implementation record

### 2026-09-07 - Initial agenda release

- EVT-T1, EVT-T2, and EVT-T3 completed in `apps/web/src/data/upcomingEvents.js`, `apps/web/src/components/UpcomingEvents.jsx`, `apps/web/src/App.jsx`, `apps/web/src/App.css`, and `apps/web/src/App.test.jsx`.
- Web tests: `npm --prefix apps/web run test` — passed, 1 file and 8 tests.
- Web lint/build: `npm --prefix apps/web run lint` and `npm --prefix apps/web run build` — passed.
- API lint: `npm --prefix apps/api run lint` — passed.
- Compose build: `docker compose build` — passed after retrying with Docker access; both development images built.
- Manual visual review: `/ai` inspected at desktop and mobile widths; event cards stack without clipping, dates and locations remain readable, and the in-page anchor target is visible below the header.
