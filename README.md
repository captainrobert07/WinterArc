# Winter Arc 2026

Mobile-first habit tracker for KRISTOM and HANNA for the 92-day Winter Arc challenge:

October 1, 2026 to December 31, 2026.

## Features

- No login required.
- KRISTOM and HANNA profile switcher.
- Twelve daily Winter Arc habits.
- Asia/Kolkata date logic for today's challenge day.
- Local persistence with `localStorage`.
- Past-day editing through the calendar.
- Future days visible but locked.
- Progress photo upload stored locally in the browser.
- Daily notes.
- Current streak, longest streak, perfect days, overall score, monthly stats, weekly bars, habit performance, and partner comparison.
- Mobile-first PWA metadata for home-screen installation.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

## Vercel

Import this repository into Vercel as a Vite app. The default settings work:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

This version is intentionally frontend-only. Data is stored in the browser on each device.
