# Brightstream Branch Finder

## Overview
A responsive, brand-matched branch finder for Brightstream Bank. Branch data is fetched from Optimizely Graph via GraphQL and presented with search, filters, and (optional) map + geolocation.

## Tech Stack
- Next.js (App Router) + TypeScript
- Optimizely Graph (GraphQL)
- Leaflet + React-Leaflet (map)

## Setup
1. Install dependencies:
	npm install
2. Create `.env.local`:
	NEXT_PUBLIC_OPTIMIZELY_GRAPH_ENDPOINT=<provided endpoint>
3. Run:
	npm run dev

## Features
### Must Have (Implemented)
- Fetch & display branches from Optimizely Graph
- Search by name/city/address
- Filter by country
- Responsive design
- Brightstream-style hero, CTAs, pill filters, typography

### Nice to Have (Implemented)
- Interactive map view (Leaflet)
- Geolocation ("Near me")
- Distance calculation (Haversine)
- Directions link (Google Maps)
- Branch detail modal

## Technical Decisions & Approach

- **Dynamic Schema Discovery:** Used GraphQL introspection to adapt to backend changes automatically. Prevents breakage if fields are renamed or added.
- **Normalization Layer:** All API data is normalized to a consistent schema before reaching UI. Simplifies component logic and ensures robust filtering/search.
- **Client-Side Filtering:** Fetches all branches once, then filters/searches instantly in the browser. Chosen for speed and offline capability with small datasets.
- **SSR-Safe Map Loading:** Map is split into wrapper (BranchMap) and implementation (BranchMapInner) to avoid server-side rendering errors with Leaflet.
- **Mobile-First Responsive CSS:** Global styles and media queries ensure accessibility and usability across devices. Touch targets and font sizes follow best practices.
- **Error Handling:** Comprehensive error states for network, API, geolocation, and empty results. UI always provides feedback and fallback.
- **Performance:** Parallel API fetching, useMemo for filtering, and code splitting for map view optimize speed and user experience.
- **Accessibility:** Modal focus trap, scroll lock, keyboard navigation, and ARIA labels are implemented for inclusive design.

## Design System Notes
Design tokens were extracted from Brightstream mockups:
- Deep navy/teal gradient hero
- Gold CTA color
- Serif hero headings + sans body
- Rounded pill filters, large radii, soft shadows

## Known Limitations
- Exact Branch fields depend on schema; the app uses introspection to auto-detect best fields.
- If the schema lacks coordinates, map pins may not display.
