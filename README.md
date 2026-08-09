# Media & Industry Intelligence Dashboard (Prototype)

Interactive, editable prototype of the **Media & Industry Intelligence Platform** PRD — *Industry, ESG & Corporate Reputation Intelligence*. Built to validate information structure, dashboard flow, and UX, not as a production system.

All data is **DEMO / SAMPLE DATA** (60 illustrative news items centered on a fictionalized PT Agincourt Resources / Batang Toru scenario) — not real-time or actual company data.

## Run locally

```bash
npm install
npm run dev
```

Open the printed local URL, then click **"Masuk ke Dashboard Demo"** on the login screen (no password needed).

## Stack

React 19 + TypeScript + Vite + Tailwind v4 + React Router + Recharts. State lives in a single `AppData` object (news, companies, media, influencers, issues, taxonomy) persisted to `localStorage` via `DataProvider` (`src/lib/store.tsx`) — every CRUD action across the app reads/writes this one store, per the PRD's "One Data, Multiple Intelligence" principle.

## Structure

- `src/data/` — seed data (news, companies, media, influencers, issues, taxonomy)
- `src/lib/aggregations.ts` — all KPI/ranking/matrix computations, derived live from `AppData`
- `src/lib/store.tsx` — persisted app state + CRUD
- `src/components/` — shared UI (Table, Modal, Drawer, Badges) and feature components (News/Influencer/Media detail drawers, Taxonomy editor)
- `src/pages/` — one file per route, matching the sidebar nav (Dashboard, Intelligence, Monitoring, Analysis, Reports, Data Management)

## Demo flow

Login → Executive Overview → Industry Intelligence → ESG & Environmental → Corporate Reputation (PTAR) → click an issue → Issue Detail → click a related news row → News Detail → Edit → toggle **Edit Mode** to rename dashboard titles inline → Reports → Generate → edit narrative → Export (.md).

Use **Reset Demo** (top-right) at any time to discard local edits and restore the original seed data.
