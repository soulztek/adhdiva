// Daily Mass readings from the USCCB (bible.usccb.org). No React.
// We never store or show the reading text (NABRE is copyrighted by the CCD). We only show the date,
// the liturgical day and the citations from ./readings.json (built daily by scripts/fetch-readings.mjs)
// and link out to USCCB to read, listen or watch.
export interface ReadingRef { label: string; cite: string; }
export interface ReadingDay { title: string; readings: ReadingRef[]; masses?: { label: string; url: string }[]; audio?: string; video?: string; }
export interface ReadingsData { generated?: string; days: Record<string, ReadingDay>; }

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const p2 = (n: number) => String(n).padStart(2, "0");
/** USCCB dated page, e.g. 2026-10-27 -> https://bible.usccb.org/bible/readings/102726.cfm */
export function usccbUrl(d: Date): string { return `https://bible.usccb.org/bible/readings/${p2(d.getMonth() + 1)}${p2(d.getDate())}${String(d.getFullYear()).slice(2)}.cfm`; }
/** USCCB daily audio page, e.g. .../podcasts/audio/daily-mass-reading-podcast-october-27-2026 */
export function audioUrl(d: Date): string { return `https://bible.usccb.org/podcasts/audio/daily-mass-reading-podcast-${MONTHS[d.getMonth()]}-${d.getDate()}-${d.getFullYear()}`; }
export const VIDEO_INDEX = "https://bible.usccb.org/podcasts/video";
export const READ_KEY = "x:read";
/** Short label for the card: "Reading 1" -> "1st", "Responsorial Psalm" -> "Psalm" */
export function shortLabel(l: string): string {
  const s = l.trim();
  if (/^reading\s*1/i.test(s)) return "1st reading";
  if (/^reading\s*2/i.test(s)) return "2nd reading";
  if (/psalm/i.test(s)) return "Psalm";
  if (/gospel/i.test(s)) return "Gospel";
  return s;
}
/** The main citations (drops the Alleluia verse and duplicate options) for compact display. */
export function mainRefs(day?: ReadingDay | null): ReadingRef[] {
  if (!day) return [];
  const seen = new Set<string>(); const out: ReadingRef[] = [];
  for (const r of day.readings || []) { const k = shortLabel(r.label); if (/alleluia|verse before/i.test(r.label) || seen.has(k)) continue; seen.add(k); out.push(r); }
  return out;
}
export function isReadingsData(x: any): x is ReadingsData { return !!x && typeof x === "object" && !!x.days && typeof x.days === "object"; }
let memo: Promise<ReadingsData | null> | null = null;
/** Same-origin JSON (the service worker serves it network-first, cached for offline). Never throws. */
export function loadReadings(base = "./"): Promise<ReadingsData | null> {
  if (!memo) memo = fetch(`${base}readings.json`, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)).then((j) => (isReadingsData(j) ? j : null)).catch(() => null);
  return memo;
}
