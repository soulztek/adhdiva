# ADHDiva (PWA)

An installable, offline-capable app for ADHD moms and wives who work and then come home to the household: one-tap overwhelm check-ins with a burnout early warning, a come-home landing ritual, a Fair Play-style fair-share board (with mental-load cards), scripts for communicating feelings, expectations and asking for help, a weekly couple check-in, boundary scripts, optional cycle-aware notes, gentle and easy home workouts, resets (cyclic sighing, sensory grounding, self-compassion) and a daily affirmation card. Sister app to ADHDad.

Live: https://soulztek.github.io/adhdiva/

- `npm install && npm run build` → `dist/` (Vite + React; `scripts/gen-sw.mjs` writes the service worker, cache prefix `adhdiva-`).
- `npm test` runs the streak / rewards / level / burnout / cycle / soft start-up / fair-share tests.
- Deploys to GitHub Pages via `.github/workflows/pages.yml` on push to `main`.
- Data stays on the device in localStorage (`adhdiva-v1` and `adhdiva-ui`). No backend, no tracking. Use More → Backup to export/import.
- Not medical advice. In the US, call or text 988 if you're struggling; the National Maternal Mental Health Hotline is 1-833-852-6262.
- Exercise demos: [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense). Icons: `scripts/gen-icons.py`.
