// Builds dist/readings.json: for each day from -7 to +14 (America/New_York) it stores ONLY the date,
// the liturgical day title and the reading citations (e.g. "Luke 13:18-21").
// Sources: USCCB's official RSS feed (bible.usccb.org/readings.rss: today + the past ~10 days), then
// USCCB's dated pages for the days ahead (fetched slowly; stops at the first refusal).
// No reading text is ever stored (NABRE text is copyrighted). The app links out to bible.usccb.org to read.
// Never fails the build: on any network/parse error that day is simply left out and the app shows the dated link.
import fs from "fs"; import path from "path"; import { execFile } from "child_process";
const BACK = 7, AHEAD = 14, BASE = "https://bible.usccb.org";
const out = path.resolve(process.argv[2] || "dist", "readings.json");
const nyToday = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const [Y, M, D] = nyToday.split("-").map(Number);
const iso = (d) => d.toISOString().slice(0, 10);
const code = (d) => `${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}${String(d.getUTCFullYear()).slice(2)}`;
const clean = (s) => s.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
const short = (s, n) => (s.length > n ? s.slice(0, n) : s);
export function parseDay(html) {
  const lect = html.indexOf("b-lectionary");
  if (lect < 0) return null;
  const tm = html.slice(lect).match(/<h2>([\s\S]*?)<\/h2>/);
  const title = tm ? short(clean(tm[1]), 160) : "";
  if (!title) return null;
  const readings = [];
  const re = /<h3 class="name">([\s\S]*?)<\/h3>\s*<div class="address">([\s\S]*?)<\/div>/g; let m;
  while ((m = re.exec(html)) && readings.length < 12) { const label = short(clean(m[1]), 40); const cite = short(clean(m[2]).replace(/^["'>\s]+/, ""), 80); if (label && /[A-Za-z].*\d/.test(cite)) readings.push({ label, cite }); }
  const masses = [];
  const nested = html.match(/<ul class="nested">([\s\S]*?)<\/ul>/);
  if (nested) { const r2 = /href="(https:\/\/bible\.usccb\.org\/bible\/readings\/[0-9A-Za-z-]+\.cfm)"[^>]*>([^<]+)</g; let n; while ((n = r2.exec(nested[1])) && masses.length < 6) masses.push({ label: short(clean(n[2]).replace(/\s*\[.*$/, ""), 60), url: n[1] }); }
  const v = html.match(/href="(\/podcasts\/video\/[a-z0-9-]+)"/);
  const a = html.match(/href="(\/podcasts\/audio\/[a-z0-9-]+)"/);
  const day = { title, readings };
  if (masses.length) day.masses = masses;
  if (a) day.audio = BASE + a[1];
  if (v) day.video = BASE + v[1];
  return day;
}
// curl (not Node fetch): USCCB's bot check challenges Node's TLS client but serves curl normally.
const UA = "Mozilla/5.0 (compatible; ADHDiva/1.0; +https://soulztek.github.io/adhdiva/)";
function get(url) {
  return new Promise((res) => execFile("curl", ["-sS", "-L", "--max-time", "20", "-A", UA, "-w", "\\n%{http_code}", url], { maxBuffer: 8 << 20 }, (err, out) => {
    if (err || !out) return res(null); const i = out.lastIndexOf("\n"); const status = out.slice(i + 1).trim();
    res(status === "200" ? out.slice(0, i) : null);
  }));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, "&");
export function parseRss(xml) {
  const days = {};
  for (const it of xml.split("<item>").slice(1)) {
    const link = (it.match(/<link>[^<]*\/readings\/(\d{2})(\d{2})(\d{2})\.cfm<\/link>/) || []);
    const title = short(clean(unesc((it.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "")), 160);
    if (!link[1] || !title) continue;
    const date = `20${link[3]}-${link[1]}-${link[2]}`;
    const desc = unesc((it.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "");
    const readings = []; const re = /<h4>([\s\S]*?)<\/h4>/g; let m;
    while ((m = re.exec(desc)) && readings.length < 12) {
      const a = m[1].match(/^([\s\S]*?)<a[^>]*>([\s\S]*?)<\/a>/);
      if (!a) continue; const label = short(clean(a[1]), 40); const cite = short(clean(a[2]).replace(/^["'>\s]+/, ""), 80);
      if (label && /[A-Za-z].*\d/.test(cite)) readings.push({ label, cite });
    }
    days[date] = { title, readings };
  }
  return days;
}
async function main() {
  const want = []; for (let i = -BACK; i <= AHEAD; i++) want.push(new Date(Date.UTC(Y, M - 1, D + i)));
  const keep = new Set(want.map(iso));
  const days = {};
  const rss = await get(`${BASE}/readings.rss`);
  if (rss) for (const [k, v] of Object.entries(parseRss(rss))) if (keep.has(k)) days[k] = v;
  let fails = 0;
  for (const d of want) {
    const k = iso(d); if (k < nyToday) continue; // past days come from the feed
    if (fails >= 3) break;
    await sleep(3000);
    const url = `${BASE}/bible/readings/${code(d)}.cfm`;
    let html = await get(url); let day = html && parseDay(html);
    if (!day) { await sleep(20000); html = await get(url); day = html && parseDay(html); } // bot check: back off once
    if (!day) { fails++; continue; }
    days[k] = { ...(days[k] || {}), ...day, readings: day.readings.length ? day.readings : (days[k] || {}).readings || [] };
  }
  const sorted = {}; Object.keys(days).sort().forEach((k) => (sorted[k] = days[k]));
  const data = { source: "USCCB · bible.usccb.org", note: "Dates, liturgical day titles and citations only. Read the readings at bible.usccb.org.", generated: new Date().toISOString(), today: nyToday, days: sorted };
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(data));
  console.log(`readings.json: ${Object.keys(sorted).length} days (${Object.keys(sorted)[0] || "-"} .. ${Object.keys(sorted).pop() || "-"})`);
}
if (process.argv[1] && process.argv[1].endsWith("fetch-readings.mjs")) main().catch((e) => { console.log("readings fetch skipped:", e && e.message); });
