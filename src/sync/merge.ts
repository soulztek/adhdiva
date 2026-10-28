// Pure sync logic (no network, no React) so it can be unit-tested.
//
// Two kinds of data:
//  1. PRIVATE: the whole local Store + Ui is saved as one JSON row per user (user_data).
//     Normally the newest copy wins; if two devices both changed, mergeStores() combines them
//     so ticks and streak days are never lost.
//  2. SHARED (household): chore cards, chore ticks, kid names and (ADHDiva) the couple check-in
//     agenda + agreements. These are stored as a "last-write-wins map": every entry carries the
//     time it was last changed, so two people can edit different things at once safely.

export type AppId = "adhdad" | "adhdiva" | "golf";
export interface Entry { v: any; t: number; by?: string }
export type LwwMap = Record<string, Entry>;

/** How many days of chore/agenda ticks are shared (older ticks stay local only). */
export const WINDOW_DAYS = 60;

// ---------- small helpers ----------
export function isoDay(d: Date): string { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(d: Date, n: number): Date { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
export function windowStart(today: Date): string { return isoDay(addDays(today, -WINDOW_DAYS)); }
export function stableJson(x: any): string {
  if (x === null || typeof x !== "object") return JSON.stringify(x === undefined ? null : x);
  if (Array.isArray(x)) return "[" + x.map(stableJson).join(",") + "]";
  return "{" + Object.keys(x).filter((k) => x[k] !== undefined).sort().map((k) => JSON.stringify(k) + ":" + stableJson(x[k])).join(",") + "}";
}
export const same = (a: any, b: any) => stableJson(a) === stableJson(b);
/** Tiny string hash (djb2) used to notice "has my private data changed since the last sync?". */
export function hash(s: string): string { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36) + "." + s.length; }

// ---------- who owns a card ----------
// Shared cards use neutral owners: "mom" | "dad" | "shared" | "kid0".. so both apps understand them.
// ADHDiva's "me" is mom and "partner" is dad; ADHDad's "dad" is dad and "all" is shared.
export function whoToShared(app: AppId, who: string): string {
  if (app === "adhdiva") return who === "me" ? "mom" : who === "partner" ? "dad" : who === "all" ? "shared" : who;
  return who === "all" ? "shared" : who;
}
export function whoFromShared(app: AppId, who: string): string {
  if (app === "adhdiva") return who === "mom" ? "me" : who === "dad" ? "partner" : who;
  return who === "shared" ? "all" : who;
}

// ---------- shared projection ----------
const DATED = ["tick:", "agenda:"];
export function domainOf(app: AppId): string[] { return app === "adhdiva" ? ["chore:", "tick:", "kids", "agenda:", "agreements"] : ["chore:", "tick:", "kids"]; }
function inDomain(app: AppId, k: string): boolean { return domainOf(app).some((p) => k === p || k.startsWith(p)); }
function dateOfKey(k: string): string | null { const p = DATED.find((x) => k.startsWith(x)); return p ? k.slice(p.length, p.length + 10) : null; }

/** Turn the local app state into the flat key -> value map that is shared with the household. */
export function toShared(app: AppId, store: any, ui: any, today: Date): Record<string, any> {
  const out: Record<string, any> = {};
  (store.chores || []).forEach((c: any, i: number) => {
    const { id, ...rest } = c;
    out[`chore:${id}`] = { ...rest, who: whoToShared(app, c.who), order: i };
  });
  const from = windowStart(today);
  Object.keys(store.days || {}).forEach((date) => {
    if (date < from) return;
    const r = store.days[date] || {};
    Object.keys(r.c || {}).forEach((k) => { if (k.startsWith("chore:") && r.c[k]) out[`tick:${date}:${k.slice(6)}`] = true; });
    if (app === "adhdiva") Object.keys(r.agenda || {}).forEach((k) => { if (r.agenda[k]) out[`agenda:${date}:${k}`] = true; });
  });
  if (Array.isArray(ui.kids)) out.kids = ui.kids;
  if (app === "adhdiva" && Array.isArray(store.agreements)) out.agreements = store.agreements;
  return out;
}

/**
 * Work out what this device changed since the last sync (the "shadow" = last agreed shared state)
 * and stamp those changes with `now`. Missing keys become tombstones (v: null) so deletes spread too.
 * firstSync: when this device has never synced with the household, adopt the household's cards
 * and kid names instead of overwriting them (ticks are still added).
 */
export function localChanges(app: AppId, local: Record<string, any>, shadow: LwwMap, remote: LwwMap, today: Date, now: number, by: string, firstSync: boolean): LwwMap {
  const out: LwwMap = {};
  const from = windowStart(today);
  const remoteHas = (prefix: string) => Object.keys(remote).some((k) => (k === prefix || k.startsWith(prefix)) && remote[k].v !== null);
  for (const k of Object.keys(local)) {
    if (firstSync) {
      const prefix = k.startsWith("chore:") ? "chore:" : k;
      if ((prefix === "chore:" || k === "kids" || k === "agreements") && remoteHas(prefix)) continue;
    }
    const s = shadow[k];
    if (!s || !same(s.v, local[k])) out[k] = { v: local[k], t: now, by };
  }
  if (!firstSync) {
    for (const k of Object.keys(shadow)) {
      if (k in local || shadow[k].v === null || !inDomain(app, k)) continue;
      const d = dateOfKey(k); if (d && d < from) continue;
      out[k] = { v: null, t: now, by };
    }
  }
  return out;
}

/** Last-write-wins merge: for each key keep the entry with the newest time (ties: stable pick). */
export function mergeLww(...maps: LwwMap[]): LwwMap {
  const out: LwwMap = {};
  for (const m of maps) for (const k of Object.keys(m || {})) {
    const a = out[k], b = m[k];
    if (!b || typeof b.t !== "number") continue;
    if (!a || b.t > a.t || (b.t === a.t && stableJson(b.v) > stableJson(a.v))) out[k] = b;
  }
  return out;
}

/** Drop old dated ticks (and old tombstones) so the shared rows stay small. */
export function prune(m: LwwMap, today: Date, now = Date.now(), tombstoneDays = 30): LwwMap {
  const from = windowStart(today); const out: LwwMap = {}; const old = now - tombstoneDays * 864e5;
  for (const k of Object.keys(m)) {
    const d = dateOfKey(k); if (d && d < from) continue;
    if (m[k].v === null && m[k].t < old) continue;
    out[k] = m[k];
  }
  return out;
}

/** Write the shared map back into the local app state (only the parts this app shares). */
export function fromShared(app: AppId, store: any, ui: any, m: LwwMap, today: Date): { store: any; ui: any } {
  const live = (k: string) => m[k] && m[k].v !== null ? m[k].v : undefined;
  let s = store, u = ui;
  const anyChore = Object.keys(m).some((k) => k.startsWith("chore:"));
  const choreKeys = Object.keys(m).filter((k) => k.startsWith("chore:") && m[k].v !== null);
  if (anyChore) {
    const prev: Record<string, any> = {}; (store.chores || []).forEach((c: any) => (prev[c.id] = c));
    const chores = choreKeys.map((k) => { const { order, ...rest } = m[k].v; return { _o: typeof order === "number" ? order : 999, c: { ...(prev[k.slice(6)] || {}), ...rest, id: k.slice(6), who: whoFromShared(app, rest.who) } }; })
      .sort((a, b) => a._o - b._o || (a.c.id < b.c.id ? -1 : 1)).map((x) => x.c);
    if (!same(chores, store.chores)) s = { ...s, chores };
  }
  // Ticks inside the window: shared map is the source of truth.
  const from = windowStart(today);
  const ticks: Record<string, Record<string, boolean>> = {}; const agenda: Record<string, Record<string, boolean>> = {};
  for (const k of Object.keys(m)) {
    if (m[k].v === null) continue;
    if (k.startsWith("tick:")) { const d = k.slice(5, 15); (ticks[d] = ticks[d] || {})[k.slice(16)] = true; }
    if (k.startsWith("agenda:")) { const d = k.slice(7, 17); (agenda[d] = agenda[d] || {})[k.slice(18)] = true; }
  }
  const dates = new Set<string>([...Object.keys(s.days || {}).filter((d) => d >= from), ...Object.keys(ticks), ...(app === "adhdiva" ? Object.keys(agenda) : [])]);
  let days = s.days || {}; let changed = false;
  dates.forEach((d) => {
    if (d < from) return;
    const r = days[d] || { c: {}, mode: {}, min: {} };
    const c: Record<string, boolean> = {};
    Object.keys(r.c || {}).forEach((k) => { if (!k.startsWith("chore:")) c[k] = r.c[k]; });
    Object.keys(ticks[d] || {}).forEach((id) => (c[`chore:${id}`] = true));
    let nr = { ...r, c };
    if (app === "adhdiva") { const a = agenda[d] || {}; if (Object.keys(a).length || r.agenda) nr = { ...nr, agenda: a }; }
    const norm = (x: any) => { const y = { ...x, c: { ...(x.c || {}) } }; Object.keys(y.c).forEach((k) => { if (!y.c[k]) delete y.c[k]; }); if (y.agenda) { y.agenda = { ...y.agenda }; Object.keys(y.agenda).forEach((k) => { if (!y.agenda[k]) delete y.agenda[k]; }); if (!Object.keys(y.agenda).length) delete y.agenda; } return y; };
    if (!same(norm(nr), norm(r))) { if (!changed) { days = { ...days }; changed = true; } days[d] = nr; }
  });
  if (changed) s = { ...s, days };
  const kids = live("kids");
  if (Array.isArray(kids) && kids.length && !same(kids, ui.kids)) u = { ...u, kids };
  if (app === "adhdiva") { const ag = live("agreements"); if (Array.isArray(ag) && !same(ag, store.agreements)) s = { ...s, agreements: ag }; }
  return { store: s, ui: u };
}

/** One full shared-sync step. Returns the merged map to save as the new shadow + push. */
export function syncShared(app: AppId, args: { store: any; ui: any; shadow: LwwMap; remote: LwwMap; today: Date; now: number; by: string; firstSync: boolean }) {
  const local = toShared(app, args.store, args.ui, args.today);
  const changes = localChanges(app, local, args.shadow, args.remote, args.today, args.now, args.by, args.firstSync);
  const merged = prune(mergeLww(args.remote, args.shadow, changes), args.today, args.now);
  const applied = fromShared(app, args.store, args.ui, merged, args.today);
  return { merged, changes, ...applied };
}

// Shared map is stored in a few household_data rows so it's easy to read in the dashboard.
export function rowOf(k: string): "board" | "family" | "couple" {
  if (k.startsWith("chore:") || k.startsWith("tick:")) return "board";
  if (k === "kids") return "family";
  return "couple";
}
export function splitRows(m: LwwMap): Record<string, LwwMap> {
  const out: Record<string, LwwMap> = { board: {}, family: {}, couple: {} };
  for (const k of Object.keys(m)) out[rowOf(k)][k] = m[k];
  return out;
}

// ---------- private merge ----------
function mergeDay(l: any, r: any): any {
  if (!l) return r; if (!r) return l;
  const orBool = (a: any = {}, b: any = {}) => { const o: any = { ...b }; Object.keys(a).forEach((k) => (o[k] = !!a[k] || !!b[k])); return o; };
  const out: any = { ...r, ...l, c: orBool(l.c, r.c), min: orBool(l.min, r.min), mode: { ...(r.mode || {}), ...(l.mode || {}) } };
  ["vitA", "hugs"].forEach((k) => { if (typeof l[k] === "number" || typeof r[k] === "number") out[k] = Math.max(l[k] || 0, r[k] || 0); });
  ["ex", "agenda", "land", "drills"].forEach((k) => { if (l[k] || r[k]) out[k] = orBool(l[k], r[k]); });
  if (l.overLog || r.overLog) { const seen = new Set<string>(); out.overLog = [...(r.overLog || []), ...(l.overLog || [])].filter((x: any) => { const key = x.t + ":" + x.v; if (seen.has(key)) return false; seen.add(key); return true; }).sort((a: any, b: any) => (a.t < b.t ? -1 : 1)); }
  if (l.check || r.check) out.check = { ...(r.check || {}), ...(l.check || {}) };
  if (l.screen || r.screen) out.screen = { ...(r.screen || {}), ...(l.screen || {}) };
  if (l.period || r.period) out.period = true;
  return out;
}
/**
 * Combine two copies of the private Store when BOTH changed (e.g. first sign-in on a second phone).
 * Days are unioned and ticks OR-ed, so no streak day is ever lost. Lists the user edits (chores,
 * reminders, plans) follow `local`; collections that only grow (brain dump, badges, rewards) are unioned.
 */
export function mergeStores(local: any, remote: any): any {
  if (!remote) return local; if (!local) return remote;
  const days: any = { ...(remote.days || {}) };
  Object.keys(local.days || {}).forEach((d) => (days[d] = mergeDay(local.days[d], days[d])));
  const unionBy = (a: any[] = [], b: any[] = [], key: (x: any) => string) => { const seen = new Set(a.map(key)); return [...a, ...b.filter((x) => !seen.has(key(x)))]; };
  const out: any = { ...remote, ...local, days };
  out.brain = unionBy(local.brain, remote.brain, (x) => x.id);
  out.badges = unionBy(local.badges, remote.badges, (x) => x.id);
  out.rewards = unionBy(local.rewards, remote.rewards, (x) => x.date + "|" + x.id);
  if (local.scripts || remote.scripts) out.scripts = unionBy(local.scripts, remote.scripts, (x) => x.id);
  const sd = [local.startDate, remote.startDate].filter(Boolean).sort();
  if (sd.length) out.startDate = sd[0];
  return out;
}
/** Ui: keep this device's choices, fill in anything only the other copy has. */
export function mergeUi(local: any, remote: any): any { return { ...(remote || {}), ...(local || {}) }; }

/**
 * Golf Speed Plan private merge (used only when two phones both changed).
 * Days are unioned with ticks OR-ed (no streak/XP lost); logs/tests/games/wedge/assess are unioned,
 * this phone's entry winning when both have the same one.
 */
export function mergeGolfStores(local: any, remote: any): any {
  if (!remote) return local; if (!local) return remote;
  const base = mergeStores({ ...local, brain: [], scripts: undefined }, { ...remote, brain: [], scripts: undefined });
  delete base.brain; delete base.scripts;
  const unionBy = (a: any[] = [], b: any[] = [], key: (x: any) => string) => { const seen = new Set(a.map(key)); return [...a, ...b.filter((x) => !seen.has(key(x)))]; };
  const byDate = (a: any, b: any) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
  base.logs = unionBy(local.logs, remote.logs, (x) => `${x.date}|${x.kind}|${x.value}`).sort(byDate);
  base.tests = unionBy(local.tests, remote.tests, (x) => x.date).sort(byDate);
  base.assess = unionBy(local.assess, remote.assess, (x) => x.date).sort(byDate);
  base.games = unionBy(local.games, remote.games, (x) => `${x.date}|${x.id}`).sort(byDate);
  base.wedge = unionBy(local.wedge, remote.wedge, (x) => x.date).sort(byDate);
  return base;
}
