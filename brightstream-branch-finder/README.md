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

## Design System Notes
Design tokens were extracted from Brightstream mockups:
- Deep navy/teal gradient hero
- Gold CTA color
- Serif hero headings + sans body
- Rounded pill filters, large radii, soft shadows

## Known Limitations
- Exact Branch fields depend on schema; the app uses introspection to auto-detect best fields.
- If the schema lacks coordinates, map pins may not display.
