# ADHDiva (PWA)

An installable, offline-capable app for ADHD moms and wives who work and then come home to the household: one-tap overwhelm check-ins with a burnout early warning, a come-home landing ritual, a Fair Play-style fair-share board (with mental-load cards), scripts for communicating feelings, expectations and asking for help, a weekly couple check-in, boundary scripts, optional cycle-aware notes, gentle and easy home workouts, resets (cyclic sighing, sensory grounding, self-compassion) and a daily affirmation card. Sister app to ADHDad.

Live: https://soulztek.github.io/adhdiva/

- `npm install && npm run build` → `dist/` (Vite + React; `scripts/gen-sw.mjs` writes the service worker, cache prefix `adhdiva-`).
- `npm test` runs the streak / rewards / level / burnout / cycle / soft start-up / fair-share tests.
- Deploys to GitHub Pages via `.github/workflows/pages.yml` on push to `main`.
- Data stays on the device in localStorage (`adhdiva-v1` and `adhdiva-ui`). No backend, no tracking. Use More → Backup to export/import.
- Not medical advice. In the US, call or text 988 if you're struggling; the National Maternal Mental Health Hotline is 1-833-852-6262.
- Exercise demos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense). Icons: `scripts/gen-icons.py`.

## Daily Readings (USCCB)

Home shows a Daily Readings card (More › Daily Readings has prev/next day). The app shows only the date, the
liturgical day and the reading citations, and links to `https://bible.usccb.org/bible/readings/MMDDYY.cfm` to read
(plus USCCB's audio and reflection-video pages). No reading text is stored or shown: the NABRE is copyrighted by the CCD.

USCCB's RSS feed (`bible.usccb.org/readings.rss`) sends no CORS headers, so the browser can't read it. Instead
`scripts/fetch-readings.mjs` runs during `npm run build` and writes `dist/readings.json` (titles + citations only,
from the RSS feed and the dated pages for about -7..+14 days). The Pages workflow also runs daily on a cron so the
file stays current. The service worker serves `readings.json` network-first with an offline copy. If it's missing,
the card still shows the dated USCCB link. A "Read" tick is optional (`x:read`, +10 XP) and never hurts the streak.
