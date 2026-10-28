// Tests for the cloud-sync merge logic (src/sync/merge.ts). Same file in ADHDad and ADHDiva.
import { mergeGolfStores, mergeLww, mergeStores, syncShared, toShared, fromShared, localChanges, whoToShared, whoFromShared, splitRows, hash, stableJson, LwwMap } from "../src/sync/merge";
let fail = 0;
const eq = (name: string, got: any, want: any) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"} ${name}${ok ? "" : `: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`); };
const today = new Date(2026, 9, 28); const B = today.getTime(); const T = "2026-10-28"; const Y = "2026-10-27";
const day = (c: any = {}, extra: any = {}) => ({ c, mode: {}, min: {}, ...extra });

// --- LWW map ---
eq("lww newest wins", mergeLww({ a: { v: 1, t: 1 } }, { a: { v: 2, t: 2 } }).a.v, 2);
eq("lww older loses", mergeLww({ a: { v: 1, t: 5 } }, { a: { v: 2, t: 2 } }).a.v, 1);
eq("lww tie is order-independent", mergeLww({ a: { v: "x", t: 3 } }, { a: { v: "y", t: 3 } }).a.v, mergeLww({ a: { v: "y", t: 3 } }, { a: { v: "x", t: 3 } }).a.v);
eq("lww tombstone newer deletes", mergeLww({ a: { v: true, t: 1 } }, { a: { v: null, t: 2 } }).a.v, null);
eq("lww union of keys", Object.keys(mergeLww({ a: { v: 1, t: 1 } }, { b: { v: 1, t: 1 } })).sort(), ["a", "b"]);

// --- owner mapping ---
eq("diva me -> mom", whoToShared("adhdiva", "me"), "mom");
eq("diva partner -> dad", whoToShared("adhdiva", "partner"), "dad");
eq("dad all -> shared", whoToShared("adhdad", "all"), "shared");
eq("round trip diva", ["me", "partner", "shared", "kid0"].map((w) => whoFromShared("adhdiva", whoToShared("adhdiva", w))), ["me", "partner", "shared", "kid0"]);
eq("round trip dad", ["dad", "all", "kid1"].map((w) => whoFromShared("adhdad", whoToShared("adhdad", w))), ["dad", "all", "kid1"]);
eq("dad sees mom card", whoFromShared("adhdad", whoToShared("adhdiva", "me")), "mom");

// --- projection: private stuff never leaves ---
const divaStore = { chores: [{ id: "dishes", name: "Dishes", freq: "daily", days: [], who: "partner", mins: 20 }], agreements: ["Phones away"], brain: [{ id: "b", text: "secret" }],
  days: { [T]: day({ "chore:dishes": true, checkin: true }, { check: { over: 4 }, overLog: [{ t: "9:00", v: 4 }], period: true, agenda: { appr: true } }), "2026-01-01": day({ "chore:dishes": true }) } };
const divaUi = { kids: ["Ava", "Ben"], cycle: true, cycleStart: "2026-10-10", name: "Mom" };
const proj = toShared("adhdiva", divaStore, divaUi, today);
eq("projection keys", Object.keys(proj).sort(), ["agenda:2026-10-28:appr", "agreements", "chore:dishes", "kids", `tick:${T}:dishes`]);
const pj = JSON.stringify(proj);
eq("no mood/overwhelm/cycle/brain/period in shared", ["over", "overLog", "period", "cycle", "secret", "checkin"].filter((w) => pj.indexOf(w) >= 0), []);
eq("old ticks outside window not shared", pj.indexOf("2026-01-01") < 0, true);
eq("dad projection has no agenda/agreements", Object.keys(toShared("adhdad", { chores: [], days: { [T]: day({}, { agenda: { a: true } }) }, agreements: ["x"] }, { kids: ["A"] }, today)), ["kids"]);

// --- two partners, concurrent edits ---
const dadStore = { chores: [{ id: "trash", name: "Trash", freq: "days", days: [2], who: "dad" }], days: { [T]: day({ "chore:trash": true, move: true }, { check: { mood: 2 } }) } };
const dadUi = { kids: ["Kid 1", "Kid 2"], name: "Dad" };
// Mom creates the household and syncs first.
const m1 = syncShared("adhdiva", { store: divaStore, ui: divaUi, shadow: {}, remote: {}, today, now: B + 1000, by: "mom", firstSync: true });
const remote1 = m1.merged;
eq("mom first push includes card", remote1["chore:dishes"].v.who, "dad");
// Dad joins: adopts the household board + kid names, but his own tick comes along.
const d1 = syncShared("adhdad", { store: dadStore, ui: dadUi, shadow: {}, remote: remote1, today, now: B + 2000, by: "dad", firstSync: true });
eq("dad adopts household cards", d1.store.chores.map((c: any) => c.id), ["dishes"]);
eq("dad's dishes card owner is dad", d1.store.chores[0].who, "dad");
eq("dad keeps mins field from ADHDiva", d1.store.chores[0].mins, 20);
eq("dad adopts kid names", d1.ui.kids, ["Ava", "Ben"]);
eq("dad sees mom's dishes tick", !!d1.store.days[T].c["chore:dishes"], true);
eq("dad's own tick kept in shared map", d1.merged[`tick:${T}:trash`].v, true);
eq("dad's private items untouched", [d1.store.days[T].c.move, d1.store.days[T].check.mood], [true, 2]);
eq("dad push doesn't drop mom agenda", d1.merged[`agenda:${T}:appr`].v, true);
// Concurrent: mom unticks dishes (t=3000) while dad adds a new card (t=3100) from stale state.
const momLocal = { ...divaStore, days: { ...divaStore.days, [T]: day({ checkin: true }, { check: { over: 4 }, period: true, agenda: { appr: true } }) } };
const m2 = syncShared("adhdiva", { store: momLocal, ui: divaUi, shadow: remote1, remote: d1.merged, today, now: B + 3000, by: "mom", firstSync: false });
eq("mom untick -> tombstone", m2.merged[`tick:${T}:dishes`].v, null);
eq("mom receives dad's trash tick key", m2.merged[`tick:${T}:trash`].v, true);
const dadLocal2 = { ...d1.store, chores: [...d1.store.chores, { id: "yard", name: "Yard", freq: "weekly", days: [6], who: "dad" }] };
const d2 = syncShared("adhdad", { store: dadLocal2, ui: d1.ui, shadow: d1.merged, remote: m2.merged, today, now: B + 3100, by: "dad", firstSync: false });
eq("both edits survive (untick + new card)", [d2.merged[`tick:${T}:dishes`].v, d2.merged["chore:yard"].v.name], [null, "Yard"]);
eq("dad's local untick applied", !!d2.store.days[T].c["chore:dishes"], false);
const m3 = syncShared("adhdiva", { store: m2.store, ui: m2.ui, shadow: m2.merged, remote: d2.merged, today, now: B + 4000, by: "mom", firstSync: false });
eq("mom gets dad's yard card", m3.store.chores.map((c: any) => c.id), ["dishes", "yard"]);
eq("mom sees yard owner as partner", m3.store.chores[1].who, "partner");
eq("mom's private data untouched", [m3.store.days[T].check.over, m3.store.days[T].period, m3.store.brain.length], [4, true, 1]);
eq("converged: no new changes", Object.keys(m3.changes).length, 0);
// Lost-update recovery: remote lost dad's yard card (overwritten); dad's shadow restores it.
const lost: LwwMap = { ...d2.merged }; delete lost["chore:yard"];
const d3 = syncShared("adhdad", { store: d2.store, ui: d2.ui, shadow: d2.merged, remote: lost, today, now: B + 5000, by: "dad", firstSync: false });
eq("shadow restores overwritten entry", !!d3.merged["chore:yard"], true);
// Deleting a card spreads.
const d4 = syncShared("adhdad", { store: { ...d3.store, chores: d3.store.chores.filter((c: any) => c.id !== "yard") }, ui: d3.ui, shadow: d3.merged, remote: d3.merged, today, now: B + 6000, by: "dad", firstSync: false });
eq("delete -> tombstone", d4.merged["chore:yard"].v, null);
eq("rows split", Object.keys(splitRows(d4.merged).board).length > 0 && Object.keys(splitRows(d4.merged).family)[0] === "kids", true);

eq("old tombstones pruned", Object.keys(syncShared("adhdad", { store: d4.store, ui: d4.ui, shadow: d4.merged, remote: d4.merged, today, now: B + 40 * 864e5, by: "dad", firstSync: false }).merged).indexOf("chore:yard"), -1);

// --- private merge (first sign-in on a 2nd phone / both changed) ---
const a = { v: 1, chores: [{ id: "x" }], brain: [{ id: "1", text: "a" }], badges: [{ id: "b1", date: Y }], rewards: [], startDate: "2026-10-01",
  days: { [Y]: day({ move: true }), [T]: day({ "chore:x": true }, { hugs: 1, check: { mood: 3 } }) } };
const b = { v: 1, chores: [{ id: "y" }], brain: [{ id: "2", text: "b" }], badges: [{ id: "b2", date: T }], rewards: [], startDate: "2026-09-15",
  days: { "2026-10-20": day({ move: true }), [T]: day({ snack: true }, { hugs: 3 }) } };
const ms = mergeStores(a, b);
eq("no streak day lost", Object.keys(ms.days).sort(), ["2026-10-20", Y, T]);
eq("ticks OR-ed", [ms.days[T].c["chore:x"], ms.days[T].c.snack], [true, true]);
eq("counters keep max", ms.days[T].hugs, 3);
eq("check-in kept", ms.days[T].check.mood, 3);
eq("brain dump unioned", ms.brain.map((x: any) => x.id), ["1", "2"]);
eq("badges unioned", ms.badges.map((x: any) => x.id), ["b1", "b2"]);
eq("earliest start date", ms.startDate, "2026-09-15");
eq("edited lists follow this phone", ms.chores, [{ id: "x" }]);
eq("hash stable across key order", hash(stableJson({ a: 1, b: 2 })) === hash(stableJson({ b: 2, a: 1 })), true);

// --- golf private merge ---
const g1 = { days: { [T]: { c: { mobility: true }, drills: { a: true } } }, logs: [{ date: Y, kind: "speed", value: 98 }], tests: [], assess: [], games: [], wedge: [], rewards: [{ date: T, kind: "badge", id: "x" }], badges: [], startDate: "2026-10-21", seeded: true };
const g2 = { days: { [Y]: { c: { strength: true } }, [T]: { c: { protein: true }, drills: { b: true } } }, logs: [{ date: Y, kind: "speed", value: 98 }, { date: T, kind: "speed", value: 101 }], tests: [{ date: Y, v: { rspeed: "99" } }], assess: [], games: [{ date: T, id: "g", score: 7 }], wedge: [], rewards: [], badges: [], startDate: "2026-10-21", seeded: true };
const gm = mergeGolfStores(g1, g2);
eq("golf days unioned", Object.keys(gm.days).sort(), [Y, T]);
eq("golf ticks + drills OR-ed", [gm.days[T].c.mobility, gm.days[T].c.protein, gm.days[T].drills.a, gm.days[T].drills.b], [true, true, true, true]);
eq("golf speed logs unioned, no dupes", gm.logs.map((l: any) => l.value), [98, 101]);
eq("golf tests/games kept", [gm.tests.length, gm.games.length, gm.rewards.length], [1, 1, 1]);
eq("golf has no brain field added", "brain" in gm, false);

console.log(fail ? `\n${fail} FAILED` : "\nall sync tests passed");
if (fail) process.exit(1);
