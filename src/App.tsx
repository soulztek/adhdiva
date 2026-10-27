// @ts-nocheck
import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BottomNav, CARD, I, IconDot, MenuRow, NAV_BOTTOM, NAV_H, ScreenTitle, SectionTitle, StatCard, Bar, Chip, Thumb, Tick, WorkoutCard } from "./Shell";
import { Section, Segmented, Callout, BulletList, LinkCards } from "./kit";
import { DemoBlock, demoThumb } from "./Demo";
import { FEDB_USED } from "./demos.generated";
import { streakInfo, isoDay, plusDays, weekKey, levelOf, LEVELS, XP, CAP, rollReward, BADGES, MICRO_JOYS, IF_THEN_DEFAULT, AFFIRMATIONS_ME, AFFIRMATIONS_KIDS, QUESTIONS, GRATITUDE_PROMPTS, TRIGGERS, bossOf, rotate, dayIndex, patternNotes, burnoutRisk, cycleDay, cyclePhase, PHASE_LABEL, PHASE_NOTE, lutealPattern, softStartup, fairShare } from "./adhd";
import { Store, Ui, DayRec, Chore, Reminder, STORE_KEY, UI_KEY, DEFAULT_UI, DEFAULT_CHORES, DEFAULT_REMINDERS, DEFAULT_AGREEMENTS, REM_MIN, TODAY_ITEMS, MINABLE, CONNECT_MOMENTS, LANDING_STEPS, LANDING_SCRIPT, FEELINGS, NEEDS, HELP_SCRIPTS, BOUNDARY_SCRIPTS, AGENDA, EXERCISES, SNACK_MOVES, GENTLE_MOVES, WORKOUTS, FULL, MINV, DAY_SHORT, DAY_LONG, WEEK_ORDER, FALLBACK_TINY, GROUNDING, SENSORY_RESETS, SELF_COMPASSION, KIND_PROMPTS, WHY_SOURCES } from "./data";
import { loadReadings, usccbUrl, audioUrl, mainRefs, shortLabel, VIDEO_INDEX, READ_KEY } from "./readings";
import { Ring, ModeSwitch, PillButton, TapItem, CapNote, NextChip, SessionTimer, TimerSheet, Toast, Rating, TrendChart, Breather, ModeChip, DayPicker, fieldStyle, hm, fmtHour } from "./ui";

// ---------- storage ----------
function emptyStore(): Store { return { v: 1, days: {}, chores: DEFAULT_CHORES, reminders: DEFAULT_REMINDERS, ifThen: IF_THEN_DEFAULT, agreements: DEFAULT_AGREEMENTS, brain: [], badges: [], rewards: [], scripts: [] }; }
function normalize(p: any): Store {
  const e = emptyStore();
  const arr = (x: any, d: any) => (Array.isArray(x) ? x : d);
  return {
    v: 1, days: p && typeof p.days === "object" && p.days ? p.days : {},
    chores: arr(p?.chores, e.chores), reminders: arr(p?.reminders, e.reminders), ifThen: arr(p?.ifThen, e.ifThen), agreements: arr(p?.agreements, e.agreements),
    brain: arr(p?.brain, []), badges: arr(p?.badges, []), rewards: arr(p?.rewards, []), scripts: arr(p?.scripts, []), startDate: p?.startDate,
  };
}
function loadStore(): { store: Store; ok: boolean } {
  try { const raw = window.localStorage.getItem(STORE_KEY); return { store: raw ? normalize(JSON.parse(raw)) : emptyStore(), ok: true }; } catch (_e) { return { store: emptyStore(), ok: false }; }
}
function normUi(u: any): Ui { const d = DEFAULT_UI; return { ...d, ...(u || {}), kids: Array.isArray(u?.kids) && u.kids.length ? u.kids : d.kids, workoutDays: Array.isArray(u?.workoutDays) ? u.workoutDays : d.workoutDays }; }
function loadUi(): Ui { try { return normUi(JSON.parse(window.localStorage.getItem(UI_KEY) || "{}")); } catch (_e) { return normUi({}); } }
const EMPTY_DAY: DayRec = { c: {}, mode: {}, min: {} };
function uid(): string { return Math.random().toString(36).slice(2, 9); }
function shortDate(d: Date): string { return `${d.getMonth() + 1}/${d.getDate()}`; }
function hhmm(d: Date): string { return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`; }
async function copyText(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch (_e) {
    try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (_e2) { return false; }
  }
}

// ---------- scoring ----------
function isWorkoutDay(ui: Ui, d: Date): boolean { return ui.workoutDays.indexOf(d.getDay()) >= 0; }
function workoutFor(ui: Ui, d: Date) {
  const order = WEEK_ORDER.filter((x) => ui.workoutDays.indexOf(x) >= 0);
  const i = order.indexOf(d.getDay());
  const wk = Math.floor(dayIndex(plusDays(d, -((d.getDay() + 6) % 7))) / 7);
  return WORKOUTS[((Math.max(0, i) + wk * order.length) % WORKOUTS.length + WORKOUTS.length) % WORKOUTS.length];
}
function choreDue(ch: Chore, d: Date): boolean { return ch.freq === "daily" || ch.freq === "weekly" || (ch.freq === "days" && ch.days.indexOf(d.getDay()) >= 0); }
function weeklyDoneOn(store: Store, ch: Chore, d: Date): string | null {
  const start = new Date(weekKey(d) + "T00:00:00");
  for (let i = 0; i < 7; i++) { const x = plusDays(start, i); const r = store.days[isoDay(x)]; if (r && r.c[`chore:${ch.id}`]) return isoDay(x); }
  return null;
}
function dayOver(r?: DayRec): number | null { if (!r) return null; const l = (r.overLog || []).map((x) => x.v); if (l.length) return Math.max(...l); return r.check && typeof r.check.over === "number" ? r.check.over : null; }
function isCheckDone(c: any): boolean { return !!c && typeof c.over === "number"; }
function doneCount(rec?: DayRec): number { if (!rec) return 0; return Object.keys(rec.c || {}).filter((k) => rec.c[k]).length + (isCheckDone(rec.check) ? 1 : 0) + ((rec.hugs || 0) > 0 ? 1 : 0); }
/** A day counts for the streak when any Minimum is done, or 3+ things are ticked. */
function dayCounts(store: Store, d: Date): boolean { const r = store.days[isoDay(d)]; if (!r) return false; if (r.min && Object.values(r.min).some((v) => !!v)) return true; return doneCount(r) >= 3; }
function computeXp(store: Store): number {
  let xp = 0;
  Object.keys(store.days).forEach((date) => {
    const r = store.days[date]; if (!r) return;
    Object.keys(r.c || {}).forEach((k) => {
      if (!r.c[k]) return; const isMin = r.min && r.min[k];
      if (k === "move") xp += isMin ? XP.workoutMin : XP.workout;
      else if (k === "snack" || k === "gentle" || k === "walk") xp += isMin ? XP.min / 2 : XP.snack;
      else if (k === "boss") xp += XP.boss;
      else if (k === "land") xp += isMin ? XP.min : XP.land;
      else if (k === "partner") xp += XP.partner;
      else if (k === "kind") xp += XP.kind;
      else if (k.startsWith("talk:")) xp += XP.talk;
      else if (k.startsWith("chore:")) xp += XP.chore;
      else if (k.startsWith("rem:")) xp += XP.reminder;
      else if (k.startsWith("reset:")) xp += XP.reset;
      else if (MINABLE.indexOf(k) >= 0) xp += isMin ? XP.min : XP.full;
      else xp += XP.item;
    });
    xp += Math.min(CAP.hug, r.hugs || 0) * XP.hug;
    if (isCheckDone(r.check)) xp += XP.checkin;
  });
  return xp;
}

// ---------- small views ----------
function Card(props: { children: any; pad?: number; style?: any }) { return <div style={{ ...CARD, padding: props.pad ?? 16, display: "grid", gap: 12, ...(props.style || {}) }}>{props.children}</div>; }
function Label(props: { children: any }) { return <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{props.children}</div>; }
function CardHead(props: { icon: string; title: string; sub?: string; tone?: string; right?: any }) {
  return <div style={{ display: "flex", alignItems: "center", gap: 12 }}><IconDot name={props.icon} tone={props.tone || "accent"} size={40} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600, lineHeight: "21px" }}>{props.title}</div>{props.sub && <Label>{props.sub}</Label>}</div>{props.right}</div>;
}
const OVER_WORDS = ["", "Calm", "A little full", "Busy brain", "Overwhelmed", "Flooded"];
/** One-tap overwhelm meter (1-5). */
function OverMeter(props: { value?: number; onPick: (n: number) => void; big?: boolean }) {
  const shade = (n: number) => ["", "#e9dfe4", "#dcc3d0", "#c793ae", "#ad5f88", "#8f2f62"][n];
  return (
    <div role="group" aria-label="Overwhelm right now" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => { const on = props.value === n; return (
        <button key={n} onClick={() => props.onPick(n)} aria-pressed={on} aria-label={`Overwhelm ${n}: ${OVER_WORDS[n]}`} style={{ height: props.big ? 64 : 52, borderRadius: 16, border: "none", cursor: "pointer", background: on ? "var(--ink)" : "var(--fill2)", color: on ? "var(--on-ink)" : "var(--text)", display: "grid", alignContent: "center", justifyItems: "center", gap: 4, padding: 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: 5, background: shade(n), boxShadow: on ? "0 0 0 2px rgba(255,255,255,0.5)" : "none" }} />
          <span style={{ fontSize: 17, fontWeight: 600, fontVariantNumeric: "tabular-nums", lineHeight: "18px" }}>{n}</span>
          {props.big && <span style={{ fontSize: 9.5, lineHeight: "11px", opacity: 0.75, padding: "0 2px", textAlign: "center" }}>{OVER_WORDS[n].replace("Overwhelmed", "Over\u00ADwhelmed")}</span>}
        </button>
      ); })}
    </div>
  );
}
function MiniBars(props: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...props.values);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 64 }}>
      {props.values.map((v, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 10, color: "var(--text3)" }}>{v || ""}</div>
          <div style={{ width: "100%", height: `${(v / max) * 60}%`, minHeight: 3, borderRadius: 5, background: i === props.values.length - 1 ? "var(--ink)" : v ? "var(--accent)" : "var(--fill2)" }} />
          <div style={{ fontSize: 10.5, color: "var(--text3)" }}>{props.labels[i]}</div>
        </div>
      ))}
    </div>
  );
}
function ScriptCard(props: { title?: string; to?: string; text: string; onUse: (how: string) => void; editable?: boolean; onEdit?: (t: string) => void }) {
  const [msg, setMsg] = useState<string>("");
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 1800); };
  const share = async () => {
    try { if (navigator.share) { await navigator.share({ text: props.text }); props.onUse("share"); return; } } catch (_e) { return; }
    if (await copyText(props.text)) { flash("Copied"); props.onUse("copy"); }
  };
  return (
    <div style={{ ...CARD, borderRadius: 18, padding: 14, display: "grid", gap: 10 }}>
      {(props.title || props.to) && <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}><span style={{ fontSize: 14.5, fontWeight: 600 }}>{props.title}</span>{props.to && <span style={{ fontSize: 11.5, color: "var(--text3)", whiteSpace: "nowrap" }}>{props.to}</span>}</div>}
      {props.editable ? <textarea value={props.text} rows={6} aria-label="Your script" onChange={(e) => props.onEdit && props.onEdit(e.target.value)} style={{ ...fieldStyle, fontSize: 15, lineHeight: "21px", resize: "vertical", fontFamily: "inherit" }} />
        : <div style={{ padding: "10px 12px", borderRadius: 14, background: "var(--accent-subtle)", fontSize: 14.5, lineHeight: "21px", whiteSpace: "pre-line" }}>{`"${props.text}"`}</div>}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <PillButton small icon="copy" label="Copy" onClick={async () => { if (await copyText(props.text)) { flash("Copied"); props.onUse("copy"); } else flash("Couldn't copy"); }} />
        <PillButton small soft icon="share" label="Share" onClick={share} />
        <a href={`sms:?body=${encodeURIComponent(props.text)}`} onClick={() => props.onUse("sms")} style={{ minHeight: 36, padding: "0 14px", borderRadius: 999, background: "var(--fill2)", color: "var(--text)", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}>{I("chat", 14, 2)}Text it</a>
        {msg && <span style={{ fontSize: 12.5, color: "var(--link)", fontWeight: 600 }}>{msg}</span>}
      </div>
    </div>
  );
}

function BackupBox(props: { store: Store; ui: Ui; onImport: (s: Store, u?: Ui) => void }) {
  const [msg, setMsg] = useState<string>("");
  const doExport = () => {
    const blob = new Blob([JSON.stringify({ app: "adhdiva", version: 1, exportedAt: new Date().toISOString(), data: props.store, ui: props.ui }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `adhdiva-backup-${isoDay(new Date())}.json`; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMsg("Backup file saved. Keep it in Files or Google Drive.");
  };
  const doImport = (f?: File) => {
    if (!f) return; const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(String(r.result)); const data = parsed && parsed.data ? parsed.data : parsed;
        if (!data || typeof data !== "object" || !("days" in data) || !("chores" in data) || (parsed.app && parsed.app !== "adhdiva")) throw new Error("bad");
        if (!window.confirm("Replace everything in ADHDiva with this backup?")) return;
        props.onImport(normalize(data), parsed.ui ? normUi(parsed.ui) : undefined); setMsg("Backup restored.");
      } catch (_e) { setMsg("That file isn't an ADHDiva backup."); }
    };
    r.readAsText(f);
  };
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <PillButton full label="Export backup (JSON)" icon="download" onClick={doExport} />
      <label style={{ minHeight: 48, borderRadius: 999, background: "var(--fill2)", color: "var(--text)", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        Import backup
        <input type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { doImport(e.target.files ? e.target.files[0] : undefined); e.target.value = ""; }} />
      </label>
      {msg && <div style={{ fontSize: 13.5, color: "var(--link)" }}>{msg}</div>}
    </div>
  );
}

const CHECK_FIELDS: { k: string; label: string; low: string; high: string }[] = [
  { k: "mood", label: "Mood", low: "low", high: "great" },
  { k: "energy", label: "Energy", low: "drained", high: "charged" },
  { k: "focus", label: "Focus", low: "scattered", high: "locked in" },
  { k: "irrit", label: "Irritability", low: "calm", high: "snappy" },
  { k: "sleep", label: "Sleep last night", low: "rough", high: "great" },
];

export default function App() {
  const initial = useMemo(() => loadStore(), []);
  const [store, setStore] = useState<Store>(initial.store);
  const [saved, setSaved] = useState<boolean>(initial.ok);
  const [ui, setUi] = useState<Ui>(loadUi());
  const [now, setNow] = useState<Date>(new Date());
  const [nav, setNav] = useState<string>("home");
  const [page, setPage] = useState<string | null>(null);
  const [hlTab, setHlTab] = useState<string>("board");
  const [mindTab, setMindTab] = useState<string>("checkin");
  const [talkTab, setTalkTab] = useState<string>("say");
  const [moveDetail, setMoveDetail] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<{ id: string; at: number } | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [sheet, setSheet] = useState<any>(null);
  const [nameSheet, setNameSheet] = useState<boolean>(false);
  const [nameDraft, setNameDraft] = useState<string>("");
  const [editChores, setEditChores] = useState<boolean>(false);
  const [editRems, setEditRems] = useState<boolean>(false);
  const [ifEdit, setIfEdit] = useState<boolean>(false);
  const [agEdit, setAgEdit] = useState<boolean>(false);
  const [qOff, setQOff] = useState<number>(0);
  const [kOff, setKOff] = useState<number>(0);
  const [span, setSpan] = useState<number>(14);
  const [brainDraft, setBrainDraft] = useState<string>("");
  const [oneTask, setOneTask] = useState<string | null>(null);
  const [openEx, setOpenEx] = useState<string | null>(null);
  const [deeper, setDeeper] = useState<boolean>(false);
  const [askTo, setAskTo] = useState<string>("Partner");
  const [b, setB] = useState<{ feel: string[]; about: string; need: string; ask: string; appreciate: string }>({ feel: ["overwhelmed"], about: "", need: "", ask: "", appreciate: "" });
  const [draft, setDraft] = useState<string | null>(null);
  const [rdData, setRdData] = useState<any>(null);
  const [rdOff, setRdOff] = useState<number>(0);
  const [rdFrom, setRdFrom] = useState<string>("more");
  const todayIso = isoDay(now);
  const rec: DayRec = store.days[todayIso] || EMPTY_DAY;

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30000);
    const onVis = () => { if (document.visibilityState === "visible") setNow(new Date()); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []);
  useEffect(() => { try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); setSaved(true); } catch (_e) { setSaved(false); } }, [store]);
  useEffect(() => { try { window.localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch (_e) {} document.documentElement.setAttribute("data-theme", ui.dark ? "dark" : "light"); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute("content", ui.dark ? "#110e10" : "#f7f5f6"); }, [ui]);
  useEffect(() => { window.scrollTo(0, 0); }, [nav, page, moveDetail, hlTab, mindTab, talkTab]);
  useEffect(() => { let live = true; loadReadings().then((d) => { if (live) setRdData(d); }); return () => { live = false; }; }, []);
  useEffect(() => { if (!store.startDate) setStore((s) => ({ ...s, startDate: todayIso })); }, []);

  const xp = computeXp(store);
  const lvl = levelOf(xp);
  const lvlRef = useRef<number>(lvl.idx);
  const pushToast = (t: any) => setToasts((q) => [...q, t].slice(-3));
  useEffect(() => { if (lvl.idx > lvlRef.current) pushToast({ title: `Level up: ${lvl.cur.name}`, body: lvl.cur.blurb, icon: "crown", meta: `LEVEL ${lvl.idx + 1}` }); lvlRef.current = lvl.idx; }, [lvl.idx]);
  const me = (ui.name || "").trim() || "Mom";
  const partner = (ui.partner || "").trim();
  const partnerLabel = partner || "Partner";
  const kidName = (i: number) => (ui.kids[i] || "").trim() || `Kid ${i + 1}`;
  const whoLabel = (w: string) => (w === "me" ? "Me" : w === "partner" ? partnerLabel : w === "shared" || w === "all" ? "Shared" : w.startsWith("kid") ? kidName(Number(w.slice(3))) : w);

  // ---------- day mutations ----------
  const patchDay = (fn: (r: DayRec) => DayRec, date = todayIso) => setStore((s) => { const cur = s.days[date] || EMPTY_DAY; return { ...s, days: { ...s.days, [date]: fn({ ...cur, c: { ...cur.c }, mode: { ...(cur.mode || {}) }, min: { ...(cur.min || {}) } }) } }; });
  const modeOf = (k: string) => (rec.mode && rec.mode[k]) || "full";
  const setMode = (k: string, m: "full" | "min") => patchDay((r) => ({ ...r, mode: { ...r.mode, [k]: m } }));
  const reward = (xpGain: number) => {
    const owned = (store.badges || []).map((x) => x.id);
    const r = rollReward(owned);
    if (!r) return;
    setStore((s) => ({ ...s, rewards: [...s.rewards, { date: todayIso, kind: r.kind, id: r.id, title: r.title, body: r.body }], badges: r.kind === "badge" ? [...s.badges, { id: r.id, date: todayIso }] : s.badges }));
    pushToast({ title: r.title, body: r.body, icon: r.icon, meta: `+${xpGain} XP · BONUS` });
  };
  const toggle = (k: string, xpGain = 10, forceMin?: boolean) => {
    const on = !rec.c[k];
    const isMin = forceMin !== undefined ? forceMin : modeOf(k) === "min";
    patchDay((r) => ({ ...r, c: { ...r.c, [k]: on }, min: { ...r.min, [k]: on && isMin && (MINABLE.indexOf(k) >= 0 || ["move", "snack", "gentle", "walk"].indexOf(k) >= 0) } }));
    if (on) reward(xpGain);
  };
  const markOnce = (k: string, xpGain: number) => { if (!rec.c[k]) toggle(k, xpGain); };
  const addHugs = (d: number) => { const before = rec.hugs || 0; patchDay((r) => ({ ...r, hugs: Math.max(0, (r.hugs || 0) + d) })); if (d > 0 && before === 0) reward(5); };
  const remKidKey = (id: string, i: number) => `rem:${id}:${i}`;
  const specialDone = ui.kids.length > 0 && ui.kids.every((_, i) => rec.c[remKidKey("special", i)]);
  const specialAny = ui.kids.some((_, i) => rec.c[remKidKey("special", i)]);
  const toggleSpecialAll = () => {
    const on = !specialDone; const isMin = modeOf("rem:special") === "min";
    patchDay((r) => { const c = { ...r.c }; ui.kids.forEach((_, i) => { c[remKidKey("special", i)] = on; }); return { ...r, c, min: { ...r.min, "rem:special": on && isMin } }; });
    if (on) reward(10);
  };
  const check = rec.check || {};
  const setOver = (v: number) => {
    const was = isCheckDone(rec.check);
    patchDay((r) => ({ ...r, check: { ...(r.check || {}), over: v }, overLog: [...(r.overLog || []), { t: hhmm(new Date()), v }].slice(-12) }));
    if (!was) reward(XP.checkin);
  };
  const setCheck = (k: string, v: any) => patchDay((r) => ({ ...r, check: { ...(r.check || {}), [k]: v } }));
  const toggleTrigger = (id: string) => { const cur = check.triggers || []; setCheck("triggers", cur.indexOf(id) >= 0 ? cur.filter((x) => x !== id) : [...cur, id]); };

  // ---------- derived ----------
  const dow = now.getDay();
  const hourNow = now.getHours() + now.getMinutes() / 60;
  const wDay = isWorkoutDay(ui, now);
  const workout = workoutFor(ui, now);
  const moveKey = wDay ? "move" : "snack";
  const moveMode = modeOf(moveKey);
  const myChore = (c: Chore) => c.who === "me" || c.who === "shared" || c.who === "all";
  const dueChores = store.chores.filter((ch) => choreDue(ch, now) && !(ch.freq === "weekly" && weeklyDoneOn(store, ch, now) && weeklyDoneOn(store, ch, now) !== todayIso));
  const otherChores = store.chores.filter((ch) => dueChores.indexOf(ch) < 0);
  const remsToday = store.reminders.filter((r) => r.days.indexOf(dow) >= 0).sort((a, z) => hm(a.time) - hm(z.time));
  const remDone = (r: Reminder) => (r.perKid ? ui.kids.every((_, i) => rec.c[remKidKey(r.id, i)]) : !!rec.c[`rem:${r.id}`]);
  const dayInfo = streakInfo((d) => dayCounts(store, d), now);
  const todayCounts = dayCounts(store, now);
  const hadHistory = Object.keys(store.days).some((k) => k < isoDay(plusDays(now, -1)) && dayCounts(store, new Date(k + "T00:00:00")));
  const missedYesterday = !dayCounts(store, plusDays(now, -1));
  const showKind = hadHistory && missedYesterday && !todayCounts && ui.kindSeen !== todayIso;
  const question = rotate(QUESTIONS, now, qOff);
  const boss = bossOf(now);
  const isSunday = dow === 0;
  const homeT = hm(ui.homeTime);
  const landMins = ui.landMins || 15;
  const landWindow = hourNow >= homeT - 0.75 && hourNow <= homeT + 2.5;

  // overwhelm + burnout + cycle
  const series14 = Array.from({ length: 14 }, (_, i) => dayOver(store.days[isoDay(plusDays(now, i - 13))]));
  const risk = burnoutRisk(series14);
  const periodStarts = useMemo(() => {
    const ks = Object.keys(store.days).filter((k) => store.days[k] && store.days[k].period && !(store.days[isoDay(plusDays(new Date(k + "T00:00:00"), -1))] || {}).period);
    if (ui.cycleStart) ks.push(ui.cycleStart);
    return Array.from(new Set(ks)).sort();
  }, [store.days, ui.cycleStart]);
  const cycleFor = (d: Date): { day: number; phase: any } | null => {
    if (!ui.cycle) return null; const iso = isoDay(d);
    const st = periodStarts.filter((s) => s <= iso).pop(); if (!st) return null;
    const day = cycleDay(st, ui.cycleLen || 28, d); if (!day) return null;
    return { day, phase: cyclePhase(day, ui.cycleLen || 28) };
  };
  const cyc = cycleFor(now);

  const wPlan = (mode: string) => { const P = mode === "min" ? MINV : FULL; const exs = workout.ex.map((id) => EXERCISES[id]); const items: { name: string; min: number }[] = [{ name: mode === "min" ? "Warm-up: 30 s squats + 30 s arm circles" : "Warm-up: squats, arm circles, cat-cow", min: P.warm }]; for (let r = 1; r <= P.rounds; r++) exs.forEach((e) => items.push({ name: `${P.rounds > 1 ? `Round ${r} · ` : ""}${e.name} (${e.dose})`, min: P.perEx })); if (P.cool) items.push({ name: "Cool-down: child's pose + hip flexor stretch", min: P.cool }); return { items, total: items.reduce((a, z) => a + z.min, 0) }; };
  const snackPlan = (mode: string) => { const items = mode === "min" ? [{ name: "Bodyweight squats", min: 0.5 }, { name: "Incline push-ups", min: 0.5 }] : SNACK_MOVES.map((m) => ({ name: m.name, min: 1 })); return { items, total: items.reduce((a, z) => a + z.min, 0) }; };
  const gentlePlan = (mode: string) => { const list = mode === "min" ? GENTLE_MOVES.slice(0, 2) : GENTLE_MOVES; const items = list.map((m) => ({ name: m.name, min: m.id === "hipflex" ? 1.5 : 1 })); return { items, total: items.reduce((a, z) => a + z.min, 0) }; };

  // schedule for Now / Next
  const sched: { t: number; dur: number; label: string }[] = [];
  sched.push(wDay ? { t: hm(ui.workoutTime), dur: Math.round(wPlan(moveMode).total), label: `${workout.name} · ${workout.focus}` } : { t: hm(ui.workoutTime), dur: 5, label: "5-min movement snack" });
  sched.push({ t: homeT, dur: landMins, label: `Land: ${landMins}-min decompression` });
  remsToday.forEach((r) => sched.push({ t: hm(r.time), dur: REM_MIN[r.id] || 15, label: r.name.replace(/'/g, "") }));
  sched.push({ t: hm(ui.dinnerTime), dur: 45, label: "Dinner: phones away + gratitude" });
  sched.push({ t: 21.5, dur: 30, label: "Wind down: screens off" });
  sched.sort((a, z) => a.t - z.t);
  const nowBlock = [...sched].reverse().find((x) => x.t <= hourNow && hourNow < x.t + x.dur / 60) || null;
  const nextBlock = sched.find((x) => x.t > hourNow) || null;

  // today checklist
  const todayRows = TODAY_ITEMS.map((it) => {
    if (it.key === "move") return { ...it, key: moveKey, label: wDay ? `${workout.name}: ${workout.focus} (${Math.round(wPlan("full").total)} min)` : "5-min movement snack", min: wDay ? "1 round, about 6 min" : "1 min: squats + incline push-ups" };
    if (it.key === "land") return { ...it, label: `Come-home landing ritual (${landMins} min)` };
    return it;
  });
  const rowDone = (k: string) => k === "checkin" ? isCheckDone(rec.check) : k === "rem:special" ? (modeOf(k) === "min" ? specialAny : specialDone) : !!rec.c[k];
  const todayDone = todayRows.filter((r) => rowDone(r.key)).length;
  const goMove = () => { setNav("body"); setMoveDetail(wDay ? "workout" : "snack"); };
  const goLand = () => { setNav("homelife"); setHlTab("land"); setPage(null); };
  const goAsk = () => { setNav("talk"); setTalkTab("ask"); setPage(null); };
  const goReset = () => { setNav("mind"); setMindTab("reset"); setPage(null); };
  const tapRow = (k: string) => {
    if (k === "checkin") { setNav("mind"); setMindTab("checkin"); setPage(null); return; }
    if (k === "rem:special") { toggleSpecialAll(); return; }
    if (k === "land") { toggle("land", modeOf("land") === "min" ? XP.min : XP.land); return; }
    toggle(k, k === "move" ? (moveMode === "min" ? XP.workoutMin : XP.workout) : 10);
  };
  const startMinimum = () => { patchDay((r) => { const m = { ...r.mode }; [...MINABLE, "move", "snack", "gentle"].forEach((k) => (m[k] = "min")); return { ...r, mode: m }; }); setUi({ ...ui, kindSeen: todayIso }); setPage(null); setNav("today"); };

  // top 3
  const whoRank = (w: string) => (w === "me" ? 0 : 1);
  const topChore = dueChores.filter((c) => myChore(c) && !rec.c[`chore:${c.id}`] && !c.mental).sort((a, z) => whoRank(a.who) - whoRank(z.who))[0] || dueChores.filter(myChore)[0];
  const moment = rotate(CONNECT_MOMENTS, now);
  const momentLabel = moment.key === "rem:ask" ? `Ask: "${question}"` : moment.key === "x:gratitude" ? `Gratitude round: ${rotate(GRATITUDE_PROMPTS, now).toLowerCase()}` : moment.label;

  // ---------- reusable blocks ----------
  const editList = (lines: string[], setLines: (l: string[]) => void, editing: boolean, setEditing: (v: boolean) => void, defaults: string[], icon: string, addText: string, labelBase: string) => editing ? (
    <div style={{ display: "grid", gap: 10 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <textarea value={l} rows={2} aria-label={`${labelBase} ${i + 1}`} onChange={(e) => { const c = [...lines]; c[i] = e.target.value; setLines(c); }} style={{ ...fieldStyle, fontSize: 15, lineHeight: "20px", resize: "vertical", fontFamily: "inherit" }} />
          <button onClick={() => setLines(lines.filter((_, j) => j !== i))} aria-label={`Delete ${labelBase} ${i + 1}`} style={{ width: 38, height: 38, flex: "0 0 auto", borderRadius: 19, border: "none", background: "var(--fill2)", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", marginTop: 4 }}>{I("trash", 16)}</button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PillButton small soft icon="plus" label="Add" onClick={() => setLines([...lines, addText])} />
        <PillButton small soft label="Reset defaults" onClick={() => setLines(defaults)} />
        <PillButton small label="Done" onClick={() => setEditing(false)} />
      </div>
    </div>
  ) : (
    <div style={{ display: "grid", gap: 8 }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 14, background: "var(--bg)", fontSize: 14, lineHeight: "20px" }}>
          <span style={{ color: "var(--accent)", flex: "0 0 auto", paddingTop: 1 }}>{I(icon, 16)}</span><span>{l}</span>
        </div>
      ))}
      <div><PillButton small soft icon="edit" label="Edit" onClick={() => setEditing(true)} /></div>
    </div>
  );
  const ifThenCard = (
    <Section heading="If-then plans" caption="Decide once, then let the plan decide.">
      {editList(store.ifThen, (l) => setStore((s) => ({ ...s, ifThen: l })), ifEdit, setIfEdit, IF_THEN_DEFAULT, "zap", "If ..., then ...", "If-then plan")}
    </Section>
  );

  const crisisCard = (
    <div style={{ padding: "14px 16px", borderRadius: 18, background: "var(--fill2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ color: "var(--text2)", paddingTop: 1 }}>{I("heart", 18)}</span>
      <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>If you're struggling, call or text <a href="tel:988" style={{ color: "var(--text)", fontWeight: 600 }}>988</a> (US Suicide & Crisis Lifeline). You don't have to be in crisis to reach out. Pregnant or a new mom? The National Maternal Mental Health Hotline is <a href="tel:18338526262" style={{ color: "var(--text)", fontWeight: 600 }}>1-833-852-6262</a> (call or text, 24/7).</div>
    </div>
  );

  const kindCard = showKind ? (
    <Card pad={18}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <IconDot name="sun" tone="accent" size={40} />
        <div style={{ flex: 1, display: "grid", gap: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: "21px" }}>Missed days are data, not character.</div>
          <div style={{ fontSize: 14.5, lineHeight: "20px" }}>Today: just the minimum.</div>
          <div style={{ fontSize: 12.5, lineHeight: "17px", color: "var(--text3)" }}>{dayInfo.streak > 0 ? `Your chain is still alive (${dayInfo.streak} ${dayInfo.streak === 1 ? "day" : "days"}). A minimum today keeps it.` : "One minimum today starts a fresh chain. No catch-up needed."}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={startMinimum} style={{ flex: 1, minHeight: 46, borderRadius: 999, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{I("play", 12)}Start minimum</button>
        <button onClick={() => setUi({ ...ui, kindSeen: todayIso })} style={{ minHeight: 46, padding: "0 18px", borderRadius: 999, border: "none", background: "var(--fill2)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Not now</button>
      </div>
    </Card>
  ) : null;

  const burnoutCard = risk.level !== "ok" ? (
    <div style={{ ...CARD, padding: 18, display: "grid", gap: 12, background: risk.level === "high" ? "var(--accent-subtle)" : "var(--card)", boxShadow: risk.level === "high" ? "none" : "var(--shadow)" }}>
      <CardHead icon="alert" tone={risk.level === "high" ? "ink" : "accent"} title={risk.level === "high" ? "Burnout early warning" : "Overwhelm is running high"} sub={risk.level === "high" ? `Overwhelm 4+ on ${risk.highDays} of your last 5 check-ins` : "2 of your last 3 check-ins were 4+"} />
      <div style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{risk.level === "high" ? "This is an early-warning light, not a failure. Burnout grows when demands outweigh support for weeks. This week, shrink the demands and add support:" : "Catch it early. Two small moves today:"}</div>
      <BulletList items={risk.level === "high" ? ["Switch today to Minimum mode (everything still counts).", `Tell ${partnerLabel}: "I'm at a 4. I need one thing taken off my plate tonight."`, "Hand off one whole card in Home Life › Fair share.", "Protect sleep and eat real food. Those are treatment, not luxuries.", "If it lasts 2+ weeks or you feel hopeless, talk to your doctor or therapist."] : ["Ask for help with one thing (Talk › Ask).", "Do a 1-minute sigh reset (Mind › Reset)."]} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <PillButton small icon="zap" label="Minimum mode" onClick={startMinimum} />
        <PillButton small soft icon="hand" label="Ask for help" onClick={goAsk} />
        <PillButton small soft icon="wind" label="Reset" onClick={goReset} />
      </div>
    </div>
  ) : null;

  const overReply = (v?: number) => {
    if (!v) return null;
    if (v >= 4) return (
      <div className="fadein" style={{ display: "grid", gap: 10, padding: "12px 14px", borderRadius: 16, background: "var(--accent-subtle)" }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: "20px" }}>{v === 5 ? "That's a lot. Body first, then one thing." : "Noted. Let's make it smaller."}</div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>Pick one: breathe for a minute, hand something off, or let the app pick ONE task. Everything else can wait.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <PillButton small icon="wind" label="1-min sigh" onClick={goReset} />
          <PillButton small soft icon="hand" label="Ask for help" onClick={goAsk} />
          <PillButton small soft icon="target" label="Pick ONE" onClick={() => { goReset(); setTimeout(() => pickOne(), 50); }} />
        </div>
      </div>
    );
    if (v === 3) return <div className="fadein" style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>Busy brain. A 1-minute sigh or a brain dump now can keep it from climbing.</div>;
    return <div className="fadein" style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>Nice. Notice what's helping today so you can repeat it.</div>;
  };

  const bossCard = (
    <Card>
      <CardHead icon="trophy" tone="ink" title={boss.name} sub={isSunday ? "Family boss challenge · today" : "Family boss challenge · this Sunday"} />
      <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>{boss.how}</div>
      {isSunday && (rec.c.boss ? <CapNote title={`Boss beaten: +${XP.boss} XP`} text="That's the memory they'll keep." /> : <PillButton full label={`Boss beaten (+${XP.boss} XP)`} icon="trophy" onClick={() => toggle("boss", XP.boss)} />)}
    </Card>
  );

  function reminderRow(r: Reminder, first: boolean) {
    const kids = r.perKid ? (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ui.kids.map((_, i) => { const on = !!rec.c[remKidKey(r.id, i)]; return <button key={i} aria-pressed={on} onClick={() => toggle(remKidKey(r.id, i), XP.reminder)} style={{ height: 32, padding: "0 12px", borderRadius: 999, border: "none", background: on ? "var(--accent)" : "var(--fill2)", color: on ? "#fff" : "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>{on ? I("check", 13, 2.5) : null}{kidName(i)}</button>; })}
      </div>
    ) : null;
    const sub = `${fmtHour(hm(r.time))}${r.id === "ask" ? ` · "${question}"` : ""}`;
    return <TapItem key={r.id} first={first} label={r.name} sub={sub} done={remDone(r)} onTap={() => toggleRemAll(r)} right={kids} action={r.id === "special" ? { label: "10 min", onClick: () => setSheet({ kind: "special" }) } : r.id === "partnercheck" ? { label: "Open", onClick: () => { setNav("talk"); setTalkTab("checkin"); } } : undefined} />;
  }
  function toggleRemAll(r: Reminder) {
    if (r.id === "special") { toggleSpecialAll(); return; }
    if (!r.perKid) { toggle(`rem:${r.id}`, XP.reminder); return; }
    const on = !remDone(r);
    patchDay((x) => { const c = { ...x.c }; ui.kids.forEach((_, i) => { c[remKidKey(r.id, i)] = on; }); return { ...x, c }; });
    if (on) reward(10);
  }

  // ---------- Daily Readings (USCCB: day + citations only, text opens on bible.usccb.org) ----------
  const readingsOn = ui.readings !== false;
  const todayDate = new Date(todayIso + "T00:00:00");
  const rdDay = (d: Date) => (rdData && rdData.days ? rdData.days[isoDay(d)] : null) || null;
  const todayRd = rdDay(todayDate);
  const readDone = !!rec.c[READ_KEY];
  const markRead = () => toggle(READ_KEY, XP.item);
  const openReadings = (from: string) => { setRdOff(0); setRdFrom(from); setPage("readings"); };
  const extLink = (href: string, label: string, icon: string, primary?: boolean, aria?: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={aria} style={{ minHeight: primary ? 48 : 38, padding: primary ? "0 20px" : "0 14px", borderRadius: 999, background: primary ? "var(--ink)" : "var(--fill2)", color: primary ? "var(--on-ink)" : "var(--text)", fontSize: primary ? 15 : 13.5, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none", whiteSpace: "nowrap", flex: primary ? "1 1 100%" : "1 1 0" }}>{I(icon, primary ? 16 : 14, 2)}{label}</a>
  );
  const readTick = (
    <button onClick={markRead} aria-pressed={readDone} style={{ height: 38, padding: "0 14px", borderRadius: 999, border: "none", background: readDone ? "var(--accent)" : "var(--accent-subtle)", color: readDone ? "#fff" : "var(--link)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, whiteSpace: "nowrap", flex: "1 1 0" }}>{I("check", 14, 2.5)}{readDone ? "Read" : `Read · +${XP.item} XP`}</button>
  );
  const rdAttrib = <div style={{ fontSize: 11.5, color: "var(--text3)", textAlign: "center" }}>Readings from the USCCB · <a href="https://bible.usccb.org/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--text3)" }}>bible.usccb.org</a></div>;
  const refLines = (refs: any[], compact?: boolean) => (
    <div style={{ display: "grid", gap: compact ? 4 : 0 }}>
      {refs.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "baseline", fontSize: compact ? 13.5 : 15, lineHeight: compact ? "19px" : "21px", padding: compact ? 0 : "10px 0", borderTop: compact || i === 0 ? "none" : "1px solid var(--border)" }}>
          <span style={{ width: compact ? 78 : 112, flex: "0 0 auto", color: "var(--text3)", fontSize: compact ? 12.5 : 13 }}>{compact ? shortLabel(r.label) : r.label}</span>
          <span style={{ fontWeight: 600, minWidth: 0 }}>{r.cite}</span>
        </div>
      ))}
    </div>
  );
  const readingsCard = (
    <div style={{ ...CARD, padding: 16, display: "grid", gap: 12 }}>
      <button onClick={() => openReadings("home")} aria-label="Open Daily Readings" style={{ display: "flex", alignItems: "center", gap: 12, border: "none", background: "transparent", padding: 0, textAlign: "left", color: "var(--text)", cursor: "pointer" }}>
        <IconDot name="book" tone="accent" size={40} />
        <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 2 }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--link)", letterSpacing: 0.5 }}>{`DAILY READINGS · ${DAY_SHORT[todayDate.getDay()].toUpperCase()} ${shortDate(todayDate)}`}</div>
          <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: "20px" }}>{todayRd ? todayRd.title : "Today's Mass readings"}</div>
        </div>
        <span style={{ color: "var(--text3)" }}>{I("chev", 18, 2)}</span>
      </button>
      {todayRd && mainRefs(todayRd).length > 0 && refLines(mainRefs(todayRd), true)}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {extLink(usccbUrl(todayDate), "Read today's readings", "external", true)}
        {readTick}
        {extLink((todayRd && todayRd.audio) || audioUrl(todayDate), "Listen", "headphones", false, "Listen to today's readings on USCCB")}
      </div>
      {rdAttrib}
    </div>
  );
  const rdDate = plusDays(todayDate, rdOff);
  const rdCur = rdDay(rdDate);
  const rdIsToday = rdOff === 0;
  const arrowBtn = (dir: number) => <button onClick={() => setRdOff(rdOff + dir)} aria-label={dir < 0 ? "Previous day" : "Next day"} style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: "var(--fill2)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }}>{I(dir < 0 ? "back" : "chev", 20, 2)}</button>;
  const readingsView = (
    <Fragment>
      <div style={{ ...CARD, padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
        {arrowBtn(-1)}
        <div style={{ flex: 1, textAlign: "center", display: "grid", gap: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{`${DAY_LONG[rdDate.getDay()]}, ${rdDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{rdIsToday ? "Today" : <button onClick={() => setRdOff(0)} style={{ border: "none", background: "transparent", padding: 0, color: "var(--link)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Back to today</button>}</div>
        </div>
        {arrowBtn(1)}
      </div>
      <div style={{ ...CARD, padding: 18, display: "grid", gap: 14, background: "linear-gradient(135deg, var(--accent-subtle), var(--card) 70%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "var(--link)", letterSpacing: 0.5 }}>{I("book", 14)}{rdDate.getFullYear() === todayDate.getFullYear() ? "LITURGY OF THE WORD" : `LITURGY OF THE WORD · ${rdDate.getFullYear()}`}</div>
        <div style={{ fontSize: 21, fontWeight: 700, lineHeight: "27px", letterSpacing: -0.3 }}>{rdCur ? rdCur.title : "Mass readings for this day"}</div>
        {rdCur && rdCur.readings && rdCur.readings.length > 0 ? refLines(rdCur.readings) : <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>{rdData ? "The day's title and citations aren't in the app for this date yet. The button below opens the readings on USCCB." : "Offline or couldn't load the day's citations. The button below still opens the readings on USCCB."}</div>}
        {rdCur && rdCur.masses && rdCur.masses.length > 0 && (
          <div style={{ display: "grid", gap: 6 }}>
            <Label>More than one set of readings today</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{rdCur.masses.map((m: any) => <a key={m.url} href={m.url} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 12px", borderRadius: 999, background: "var(--fill2)", color: "var(--text)", fontSize: 12.5, fontWeight: 600, textDecoration: "none" }}>{m.label}</a>)}</div>
          </div>
        )}
        {extLink(usccbUrl(rdDate), rdIsToday ? "Read today's readings" : "Read this day's readings", "external", true)}
        <div style={{ display: "flex", gap: 8 }}>
          {extLink((rdCur && rdCur.audio) || audioUrl(rdDate), "Listen", "headphones", false, "Listen to the readings on USCCB")}
          {extLink((rdCur && rdCur.video) || VIDEO_INDEX, rdCur && rdCur.video ? "Reflection video" : "Reflection videos", "video", false, "Watch the USCCB reflection video")}
        </div>
      </div>
      {rdIsToday && (readDone ? <CapNote title={`Read · +${XP.item} XP`} text="A few quiet minutes with the Word. That counts." /> : <PillButton full soft icon="check" label={`I read them (+${XP.item} XP)`} onClick={markRead} />)}
      <div style={{ fontSize: 12.5, lineHeight: "18px", color: "var(--text3)", padding: "0 4px" }}>ADHDiva shows the day and the citations only. The readings, audio and reflections open on the USCCB's site. Ticking "read" is optional and never hurts your streak.</div>
      {rdAttrib}
    </Fragment>
  );

  // ---------- Home ----------
  const greet = hourNow < 12 ? "Good morning" : hourNow < 17 ? "Good afternoon" : "Good evening";
  const affN = AFFIRMATIONS_ME.length;
  const affirmation = AFFIRMATIONS_ME[(((dayIndex(now) + (ui.affOff || 0)) % affN) + affN) % affN];
  const landCard = !rec.c.land && landWindow ? (
    <button onClick={goLand} style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 14, border: "none", cursor: "pointer", textAlign: "left", color: "var(--text)", width: "100%" }}>
      <IconDot name="door" tone="ink" size={46} />
      <div style={{ flex: 1, display: "grid", gap: 2 }}>
        <Label>{hourNow < homeT ? `Heading home soon · ${fmtHour(homeT)}` : "You're home"}</Label>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: "20px" }}>{`Land first: ${landMins}-minute decompression`}</div>
        <div style={{ fontSize: 12.5, color: "var(--text3)" }}>Sighs in the car · park work · shoes off · then hello</div>
      </div>
      <span style={{ color: "var(--text3)" }}>{I("chev", 18, 2)}</span>
    </button>
  ) : null;
  const homeScreen = (
    <Fragment>
      <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 0 2px", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => { setNameDraft(ui.name || ""); setNameSheet(true); }} aria-label="Edit your name" style={{ flex: 1, minWidth: 0, border: "none", background: "transparent", padding: 0, textAlign: "left", color: "var(--text)", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5, lineHeight: "34px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`Hi, ${me}`}</span><span style={{ color: "var(--text3)", flex: "0 0 auto" }}>{I("edit", 15)}</span></div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 1 }}>{`${greet} · ${DAY_LONG[dow]} ${shortDate(now)}${cyc ? ` · cycle day ${cyc.day}` : ""}`}</div>
        </button>
        <button onClick={() => setPage("more")} aria-label="More" style={{ width: 44, height: 44, borderRadius: 22, border: "none", background: "var(--card)", boxShadow: "var(--shadow)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }}>{I("more", 20)}</button>
      </div>
      <div style={{ ...CARD, padding: "18px 18px 14px", display: "grid", gap: 10, background: "linear-gradient(135deg, var(--accent-subtle), var(--card) 78%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 600, color: "var(--link)", letterSpacing: 0.5 }}>{I("spark", 14)}FOR YOU TODAY</div>
        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: "26px", letterSpacing: -0.2 }}>{affirmation}</div>
        <div><PillButton small soft label="Another one" onClick={() => setUi({ ...ui, affOff: (ui.affOff || 0) + 1 })} /></div>
      </div>
      {readingsOn && readingsCard}
      <div style={{ ...CARD, padding: 16, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15.5, fontWeight: 600 }}>Overwhelm right now?</span>
          <span style={{ fontSize: 11.5, color: "var(--text3)", whiteSpace: "nowrap" }}>{check.over ? `${OVER_WORDS[check.over]} · ${(rec.overLog || []).length}x today` : "1 calm · 5 flooded"}</span>
        </div>
        <OverMeter value={check.over} onPick={setOver} />
        {overReply(check.over)}
      </div>
      {burnoutCard}
      {kindCard}
      {landCard}
      <div style={{ borderRadius: 24, background: "var(--nav)", color: "#fff", padding: 18, display: "grid", gap: 12, boxShadow: "var(--shadow)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 44, height: 44, borderRadius: 22, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{I("crown", 22)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, opacity: 0.65, letterSpacing: 0.4 }}>{`LEVEL ${lvl.idx + 1} OF ${LEVELS.length}`}</div>
            <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.3 }}>{lvl.cur.name}</div>
          </div>
          <div style={{ textAlign: "right" }}><div style={{ fontSize: 22, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{xp}</div><div style={{ fontSize: 11, opacity: 0.65 }}>XP</div></div>
        </div>
        <Bar value={lvl.frac} height={6} track="rgba(255,255,255,0.16)" color="#e9a3c4" />
        <div style={{ fontSize: 12.5, opacity: 0.75 }}>{lvl.next ? `${lvl.toNext} XP to ${lvl.next.name} · ${lvl.cur.blurb}` : "Top level. You built a life that fits your brain."}</div>
      </div>
      <div style={{ ...CARD, padding: 14, display: "flex", alignItems: "center", gap: 14 }}>
        {nowBlock ? (
          <Ring frac={(nowBlock.t + nowBlock.dur / 60 - hourNow) / Math.max(0.01, nowBlock.dur / 60)} size={60} stroke={6}>
            <div style={{ fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", lineHeight: "17px" }}>{Math.max(0, Math.round((nowBlock.t + nowBlock.dur / 60 - hourNow) * 60))}</div>
            <div style={{ fontSize: 9.5, color: "var(--text3)" }}>min</div>
          </Ring>
        ) : <IconDot name="clock" tone="soft" size={46} />}
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <Label>{nowBlock ? `Now · until ${fmtHour(nowBlock.t + nowBlock.dur / 60)}` : "Now · open time"}</Label>
          <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: "19px" }}>{nowBlock ? nowBlock.label : hourNow >= 22 ? "Rest. Tomorrow's list can wait." : "Nothing scheduled. Pick one small thing, or rest."}</div>
          {nextBlock ? <div><NextChip label={nextBlock.label} mins={(nextBlock.t - hourNow) * 60} /></div> : null}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <StatCard icon="flame" label="Streak" value={`${dayInfo.streak}`} unit={dayInfo.streak === 1 ? "day" : "days"} detail={`${dayInfo.last14} of 14 · ${dayInfo.freezeLeft ? "freeze ready" : "freeze used"}`} />
        <StatCard icon="check" label="Today" value={`${todayDone}`} unit={`/ ${todayRows.length}`} detail={todayCounts ? "Counts for the streak" : "3 ticks or 1 minimum"} onClick={() => setNav("today")} />
      </div>
      <SectionTitle>Today's top 3</SectionTitle>
      <div style={{ ...CARD, padding: "6px 16px" }}>
        {topChore && <TapItem first label={topChore.name} sub={`Home · ${whoLabel(topChore.who)}`} done={!!rec.c[`chore:${topChore.id}`]} onTap={() => toggle(`chore:${topChore.id}`, XP.chore)} />}
        <TapItem first={!topChore} label={momentLabel} sub={`Kids${moment.sub ? ` · ${moment.sub}` : ""}`} done={!!rec.c[moment.key]} onTap={() => toggle(moment.key, 10)} action={moment.timer ? { label: "Timer", onClick: () => setSheet({ kind: "floor" }) } : undefined} />
        <TapItem label="20 minutes just for me" sub={modeOf("x:me") === "min" ? "Minimum: 5 minutes, door closed" : "Rest is part of the plan"} done={!!rec.c["x:me"]} onTap={() => toggle("x:me", XP.full)} action={{ label: "Timer", onClick: () => setSheet({ kind: "me" }) }} />
      </div>
      {isSunday && bossCard}
      {!saved && <Callout tone="warning">This browser isn't saving data (private mode?). Export a backup from More.</Callout>}
    </Fragment>
  );

  // ---------- Today ----------
  const myDue = dueChores.filter(myChore);
  const todayScreen = (
    <Fragment>
      <ScreenTitle title="Today" sub={`${DAY_LONG[dow]} ${shortDate(now)} · ${todayDone} of ${todayRows.length} done`} />
      <div style={{ ...CARD, padding: 16, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, color: "var(--text3)" }}><span>{todayCounts ? "This day counts. Anything else is bonus." : "3 ticks (or any Minimum) and today counts."}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{`${Math.round((todayDone / todayRows.length) * 100)}%`}</span></div>
        <Bar value={todayDone / todayRows.length} height={6} />
      </div>
      {cyc && (cyc.phase === "premenstrual" || cyc.phase === "menstrual") && <Callout>{`Cycle day ${cyc.day} · ${PHASE_LABEL[cyc.phase]}. ${PHASE_NOTE[cyc.phase]}`}</Callout>}
      <div style={{ ...CARD, padding: "6px 16px" }}>
        {todayRows.map((it, i) => (
          <TapItem key={it.key} first={i === 0} label={it.label} sub={it.sub}
            done={rowDone(it.key)} onTap={() => tapRow(it.key)}
            minText={it.min} mode={it.min ? modeOf(it.key) : undefined} onMode={it.min ? (m) => setMode(it.key, m) : undefined} minDone={!!rec.min[it.key]}
            action={it.key === moveKey ? { label: "Open", onClick: goMove } : it.key === "land" ? { label: "Ritual", onClick: goLand } : it.key === "x:ask" ? { label: "Scripts", onClick: goAsk } : it.key === "x:me" ? { label: "Timer", onClick: () => setSheet({ kind: "me" }) } : undefined} />
        ))}
      </div>
      {readingsOn && (
        <div style={{ ...CARD, padding: "6px 16px" }}>
          <TapItem first label="Daily readings" sub={`Optional · ${todayRd ? todayRd.title : "USCCB"} · never hurts your streak`} done={readDone} onTap={markRead} action={{ label: "Open", icon: "book", onClick: () => openReadings("today") }} />
        </div>
      )}
      {todayDone === todayRows.length && <CapNote title="All done. Stop here." text="That's the whole list. The rest of today is yours." />}
      <Section heading="My home cards today" caption={`${myDue.filter((c) => rec.c[`chore:${c.id}`]).length} of ${myDue.length} done · yours + shared · edit in Home Life`}>
        <div style={{ display: "grid", marginTop: -6, marginBottom: -6 }}>
          {myDue.map((ch, i) => <TapItem key={ch.id} first={i === 0} label={ch.name} sub={`${whoLabel(ch.who)}${ch.mental ? " · mental load" : ""}${ch.freq === "weekly" ? " · once this week" : ""}`} done={!!rec.c[`chore:${ch.id}`]} onTap={() => toggle(`chore:${ch.id}`, XP.chore)} />)}
          {myDue.length === 0 && <div style={{ padding: "8px 0 14px", color: "var(--text3)", fontSize: 14 }}>Nothing of yours due. Enjoy it.</div>}
        </div>
      </Section>
      <Section heading="Parenting reminders">
        <div style={{ display: "grid", marginTop: -6, marginBottom: -6 }}>{remsToday.map((r, i) => reminderRow(r, i === 0))}</div>
      </Section>
      {ifThenCard}
    </Fragment>
  );

  // ---------- Home Life ----------
  const updChore = (id: string, p: Partial<Chore>) => setStore((s) => ({ ...s, chores: s.chores.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const updRem = (id: string, p: Partial<Reminder>) => setStore((s) => ({ ...s, reminders: s.reminders.map((c) => (c.id === id ? { ...c, ...p } : c)) }));
  const whoOpts = ["me", "partner", ...ui.kids.map((_, i) => `kid${i}`), "shared"];
  const dayList = (ds: number[]) => WEEK_ORDER.filter((d) => ds.indexOf(d) >= 0).map((d) => DAY_SHORT[d]).join(", ");
  const freqText = (c: Chore) => (c.freq === "daily" ? "Daily" : c.freq === "weekly" ? "Weekly" : c.days.length === 7 ? "Daily" : dayList(c.days) || "No days set");
  const trashBtn = (label: string, onClick: () => void) => <button onClick={onClick} aria-label={label} style={{ width: 46, height: 46, flex: "0 0 auto", borderRadius: 23, border: "none", background: "var(--fill2)", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>{I("trash", 17)}</button>;
  const listHead = (title: string, right: string) => <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 4px" }}><span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span><span style={{ fontSize: 12.5, color: "var(--text3)" }}>{right}</span></div>;
  const ownerChip = (w: string) => <span style={{ display: "inline-flex", alignItems: "center", height: 22, padding: "0 9px", borderRadius: 11, fontSize: 11.5, fontWeight: 600, background: w === "me" ? "var(--accent-subtle)" : "var(--fill2)", color: w === "me" ? "var(--link)" : "var(--text2)" }}>{whoLabel(w)}</span>;
  const boardView = !editChores ? (
    <Fragment>
      <Callout>Fair Play-style cards: whoever owns a card owns all of it, noticing, planning <b>and</b> doing. No "just tell me what to do."</Callout>
      <div style={{ ...CARD, padding: "6px 16px" }}>
        {listHead("Due today", `${dueChores.filter((c) => rec.c[`chore:${c.id}`]).length} of ${dueChores.length} · +${XP.chore} XP`)}
        {dueChores.map((ch, i) => <TapItem key={ch.id} first={i === 0} label={ch.name} sub={`${freqText(ch)}${ch.mins ? ` · ~${ch.mins} min` : ""}${ch.mental ? " · mental load" : ""}`} done={!!rec.c[`chore:${ch.id}`]} onTap={() => toggle(`chore:${ch.id}`, XP.chore)} right={<div>{ownerChip(ch.who)}</div>} />)}
        {dueChores.length === 0 && <div style={{ padding: "8px 0 14px", color: "var(--text3)", fontSize: 14 }}>Nothing due. Enjoy it.</div>}
      </div>
      {otherChores.length > 0 && (
        <Section heading="Not today" caption={`${otherChores.length} on other days or done this week`} collapsible defaultOpen={false}>
          <div style={{ display: "grid", gap: 6 }}>{otherChores.map((ch) => <div key={ch.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 14, padding: "6px 0", borderTop: "1px solid var(--border)" }}><span>{ch.name}</span><span style={{ color: "var(--text3)", whiteSpace: "nowrap" }}>{`${whoLabel(ch.who)} · ${ch.freq === "weekly" && weeklyDoneOn(store, ch, now) ? "done" : freqText(ch)}`}</span></div>)}</div>
        </Section>
      )}
      <PillButton full soft icon="edit" label="Edit cards + owners" onClick={() => setEditChores(true)} />
    </Fragment>
  ) : (
    <Fragment>
      {store.chores.map((ch) => (
        <div key={ch.id} style={{ ...CARD, padding: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={ch.name} aria-label="Card name" onChange={(e) => updChore(ch.id, { name: e.target.value })} style={fieldStyle} />
            {trashBtn(`Delete ${ch.name}`, () => setStore((s) => ({ ...s, chores: s.chores.filter((c) => c.id !== ch.id) })))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[["daily", "Daily"], ["weekly", "Weekly"], ["days", "Specific days"]].map(([v, l]) => <ModeChip key={v} on={ch.freq === v} label={l} onClick={() => updChore(ch.id, { freq: v as any, days: v === "days" && ch.days.length === 0 ? [dow] : ch.days })} />)}</div>
          {ch.freq === "days" && <DayPicker value={ch.days} onChange={(v) => updChore(ch.id, { days: v })} />}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}><span style={{ fontSize: 12.5, color: "var(--text3)", marginRight: 2 }}>Owner</span>{whoOpts.map((w) => <ModeChip key={w} on={ch.who === w || (w === "shared" && ch.who === "all")} label={whoLabel(w)} onClick={() => updChore(ch.id, { who: w })} />)}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text3)" }}>Minutes<input value={String(ch.mins || "")} inputMode="numeric" aria-label="Minutes each time" onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); updChore(ch.id, { mins: isNaN(n) ? undefined : Math.min(600, n) }); }} style={{ ...fieldStyle, width: 80 }} /></label>
            <ModeChip on={!!ch.mental} label="Mental load" onClick={() => updChore(ch.id, { mental: !ch.mental })} />
          </div>
        </div>
      ))}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PillButton soft icon="plus" label="Add card" onClick={() => setStore((s) => ({ ...s, chores: [...s.chores, { id: uid(), name: "New card", freq: "daily", days: [], who: "me", mins: 15 }] }))} />
        <PillButton label="Done" onClick={() => setEditChores(false)} />
      </div>
    </Fragment>
  );

  const share = fairShare(store.chores.map((c) => ({ ...c, who: c.who === "all" ? "shared" : c.who })));
  const kidsMin = Object.keys(share).filter((k) => k.startsWith("kid")).reduce((a, k) => a + share[k], 0);
  const meMin = share.me || 0; const pMin = share.partner || 0; const shMin = share.shared || 0;
  const myPct = Math.round((meMin / Math.max(1, meMin + pMin)) * 100);
  const mentalCards = store.chores.filter((c) => c.mental);
  const myMental = mentalCards.filter((c) => c.who === "me").length;
  const handoff = store.chores.filter((c) => c.who === "me").sort((a, z) => (z.mental ? 1 : 0) - (a.mental ? 1 : 0) || (z.mins || 0) - (a.mins || 0))[0];
  const shareRows: [string, number, string][] = [["Me", meMin, "var(--accent)"], [partnerLabel, pMin, "var(--ink)"], ["Shared", shMin, "#c793ae"], ["Kids", kidsMin, "#e6d3dd"]];
  const shareTot = Math.max(1, meMin + pMin + shMin + kidsMin);
  const fairView = (
    <Fragment>
      <Card>
        <CardHead icon="scale" title="Fair-share view" sub="Estimated hours per week, from your cards" />
        <div style={{ display: "flex", height: 16, borderRadius: 8, overflow: "hidden", background: "var(--fill2)" }}>{shareRows.map(([l, v, c]) => <div key={l} style={{ width: `${(v / shareTot) * 100}%`, background: c }} />)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {shareRows.map(([l, v, c]) => (
            <div key={l} style={{ padding: "10px 12px", borderRadius: 14, background: "var(--bg)", display: "grid", gap: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text3)" }}><span style={{ width: 8, height: 8, borderRadius: 4, background: c }} />{l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{`${Math.round((v / 60) * 10) / 10} h`}<span style={{ fontSize: 12, color: "var(--text3)", fontWeight: 500 }}> /week</span></div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{`You hold ${myPct}% of the adult card time and ${myMental} of ${mentalCards.length} mental-load cards (school forms, appointments, gifts, meal plans, bills).`}</div>
        {(myPct > 60 || (mentalCards.length >= 3 && myMental / mentalCards.length > 0.6)) && handoff ? <Callout>{`${myPct > 60 ? "" : "Time looks close, but the invisible planning is mostly yours. "}Research on the mental load finds the noticing and planning falls mostly on women, and that imbalance is linked with stress and burnout. Consider handing ${partnerLabel} one whole card: "${handoff.name}".`}</Callout> : <CapNote title="Looks fairly balanced" text="Keep reviewing cards in your Sunday check-in. Fair isn't always 50/50; it's what you both agree feels fair." />}
      </Card>
      {handoff && <ScriptCard title="Hand off a whole card" to={partnerLabel} text={`Hey${partner ? ` ${partner}` : ""}, would you take over "${handoff.name}" completely, noticing, planning and doing it? I'd stop tracking it so my brain gets a break. Happy to take one of yours if you want to trade.`} onUse={() => markOnce("talk:handoff", XP.talk)} />}
      <Section heading="The 3 parts of every card" caption="From the Fair Play method">
        <BulletList items={["Conceive: notice it needs doing (we're out of milk, the form is due).", "Plan: figure out how and when (list, calendar, who drives).", "Execute: do it. Owning only this part still leaves the mental load with you."]} />
      </Section>
    </Fragment>
  );

  const landSteps = modeOf("land") === "min" ? LANDING_STEPS.filter((s) => s.min) : LANDING_STEPS;
  const landTicked = landSteps.filter((s) => rec.land && rec.land[s.id]).length;
  const tickLand = (id: string) => patchDay((r) => ({ ...r, land: { ...(r.land || {}), [id]: !(r.land && r.land[id]) } }));
  const landXp = modeOf("land") === "min" ? XP.min : XP.land;
  const landView = (
    <Fragment>
      <Card pad={18}>
        <CardHead icon="door" tone="ink" title="Come-home landing ritual" sub={`Home around ${fmtHour(homeT)} · ${landMins} min to decompress before you're on`} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Today's version</span>
          <ModeSwitch mode={modeOf("land")} onMode={(m) => setMode("land", m)} />
        </div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>{modeOf("land") === "min" ? "Minimum: 3 sighs + shoes off. Still counts." : "Mentally switching off from work helps you recover from the workday. A short buffer stops the second shift from starting at the front door."}</div>
      </Card>
      <div style={{ ...CARD, padding: "6px 16px" }}>
        {landSteps.map((s, i) => <TapItem key={s.id} first={i === 0} label={s.label} sub={s.sub} done={!!(rec.land && rec.land[s.id])} onTap={() => tickLand(s.id)} action={s.id === "decomp" ? { label: `${landMins} min`, onClick: () => setSheet({ kind: "land" }) } : s.id === "car" ? { label: "Breathe", onClick: goReset } : s.id === "park" ? { label: "Dump", onClick: goReset } : undefined} />)}
      </div>
      {rec.c.land ? <CapNote title={`Landed. +${landXp} XP`} text="You're home. Now you get to be here." /> : <PillButton full icon="check" label={`I landed (${landTicked}/${landSteps.length} steps)`} onClick={() => toggle("land", landXp)} />}
      <ScriptCard title="Text before you walk in" to={partnerLabel} text={LANDING_SCRIPT(partner, landMins)} onUse={() => markOnce("talk:land", XP.talk)} />
      <Section heading="Make it stick" caption="Small setup, big payoff">
        <BulletList items={["Agree on it once (it's in Talk › Boundaries). Then it's a plan, not a favor.", "Pick a landing spot: the car, the porch, the bedroom with the door shut.", "Keep a landing kit: headphones, snack, water, comfy clothes.", "Tell the kids: \"Mom lands for 15 minutes, then I'm all yours.\" Show them the timer.", "Partner gets home first? Offer them the same 15 minutes."]} />
      </Section>
      <Callout>Walked into a meltdown? Do the minimum: one sigh, shoes off, and take your 15 minutes after bedtime instead.</Callout>
    </Fragment>
  );

  const last7 = [6, 5, 4, 3, 2, 1, 0].map((i) => plusDays(now, -i));
  const affK = [0, 1].map((o) => rotate(AFFIRMATIONS_KIDS, now, o * 5 + kOff));
  const kidsView = (
    <Fragment>
      <div style={{ ...CARD, padding: 18, display: "grid", gap: 10, background: "var(--accent-subtle)", boxShadow: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: "var(--link)", letterSpacing: 0.4 }}>{I("chat", 15)}QUESTION OF THE DAY</div>
        <div style={{ fontSize: 19, fontWeight: 600, lineHeight: "25px", letterSpacing: -0.2 }}>{question}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <PillButton small label={rec.c["rem:ask"] ? "Asked" : "I asked it"} icon="check" onClick={() => toggle("rem:ask", XP.reminder)} />
          <PillButton small soft label="Another one" onClick={() => setQOff(qOff + 1)} />
        </div>
      </div>
      {!editRems ? (
        <Fragment>
          <div style={{ ...CARD, padding: "6px 16px" }}>
            {listHead("Parenting reminders", `${remsToday.filter(remDone).length} of ${remsToday.length}`)}
            {remsToday.map((r, i) => reminderRow(r, i === 0))}
          </div>
          <PillButton full soft icon="edit" label="Edit reminders" onClick={() => setEditRems(true)} />
        </Fragment>
      ) : (
        <Fragment>
          {store.reminders.map((r) => (
            <div key={r.id} style={{ ...CARD, padding: 14, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={r.name} aria-label="Reminder" onChange={(e) => updRem(r.id, { name: e.target.value })} style={fieldStyle} />
                {trashBtn(`Delete ${r.name}`, () => setStore((s) => ({ ...s, reminders: s.reminders.filter((c) => c.id !== r.id) })))}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="time" value={r.time} aria-label="Time" onChange={(e) => updRem(r.id, { time: e.target.value || r.time })} style={{ ...fieldStyle, width: 140 }} />
                <ModeChip on={!!r.perKid} label="Each kid" onClick={() => updRem(r.id, { perKid: !r.perKid })} />
              </div>
              <DayPicker value={r.days} onChange={(v) => updRem(r.id, { days: v })} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <PillButton soft icon="plus" label="Add reminder" onClick={() => setStore((s) => ({ ...s, reminders: [...s.reminders, { id: uid(), name: "New reminder", time: "18:00", days: [0, 1, 2, 3, 4, 5, 6] }] }))} />
            <PillButton label="Done" onClick={() => setEditRems(false)} />
          </div>
        </Fragment>
      )}
      <Card>
        <CardHead icon="heart" title="Say one out loud" sub="Specific praise lands best" />
        <div style={{ display: "grid", gap: 6 }}>{affK.map((a, i) => <div key={i} style={{ padding: "10px 12px", borderRadius: 14, background: "var(--bg)", fontSize: 14.5, lineHeight: "20px" }}>{`"${a}"`}<span style={{ color: "var(--text3)", fontSize: 12 }}>{`  · to ${kidName(i % ui.kids.length)}`}</span></div>)}</div>
        <div style={{ display: "flex", gap: 8 }}><PillButton small icon="check" label={rec.c["x:praise"] ? "Said it" : "I said one"} onClick={() => toggle("x:praise", 10)} /><PillButton small soft label="Others" onClick={() => setKOff(kOff + 1)} /></div>
      </Card>
      <Card>
        <CardHead icon="hug" title="20-second hug" sub="Long enough for both of you to settle" right={<div style={{ textAlign: "right" }}><div style={{ fontSize: 26, fontWeight: 600, fontVariantNumeric: "tabular-nums", lineHeight: "28px" }}>{rec.hugs || 0}</div><div style={{ fontSize: 11, color: "var(--text3)" }}>today</div></div>} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><PillButton icon="play" label="Hug timer" onClick={() => setSheet({ kind: "hug" })} /><PillButton soft icon="plus" label="Log one" onClick={() => addHugs(1)} /></div>
        <div style={{ fontSize: 12.5, color: "var(--text3)" }}>Touched out? Skip it with zero guilt. A smile and a "love you" count too.</div>
      </Card>
      <div style={{ ...CARD, padding: "6px 16px" }}>
        <TapItem first label="5-minute floor play" sub="Their game, their rules" done={!!rec.c["x:floor"]} onTap={() => toggle("x:floor", 10)} action={{ label: "5 min", onClick: () => setSheet({ kind: "floor" }) }} />
        <TapItem label="Gratitude at dinner" sub={`Tonight: ${rotate(GRATITUDE_PROMPTS, now)}`} done={!!rec.c["x:gratitude"]} onTap={() => toggle("x:gratitude", 10)} />
        <TapItem label="Repair after a snap" sub={'"I\'m sorry I yelled. I was overwhelmed, and it wasn\'t your fault. I love you."'} done={!!rec.c["x:repair"]} onTap={() => toggle("x:repair", 10)} />
      </div>
      <Section heading="Last 7 days" caption="Hugs logged"><MiniBars values={last7.map((d) => store.days[isoDay(d)]?.hugs || 0)} labels={last7.map((d) => DAY_SHORT[d.getDay()].slice(0, 1))} /></Section>
      {bossCard}
    </Fragment>
  );
  const homeLifeScreen = (
    <Fragment>
      <ScreenTitle title="Home Life" sub={`${partnerLabel} · ${ui.kids.map((_, i) => kidName(i)).join(" & ")} · names in More › Settings`} />
      <Segmented options={[{ value: "board", label: "Cards" }, { value: "fair", label: "Fair share" }, { value: "land", label: "Come home" }, { value: "kids", label: "Kids" }]} value={hlTab} onChange={(v) => { setHlTab(v); setEditChores(false); setEditRems(false); }} />
      {hlTab === "board" && boardView}
      {hlTab === "fair" && fairView}
      {hlTab === "land" && landView}
      {hlTab === "kids" && kidsView}
    </Fragment>
  );

  // ---------- Body ----------
  const kidHelperNote = ui.kidHelper ? <Callout>Kid helper mode: kids join with bodyweight or a toy version, count reps, or referee. Keep them well clear of swinging bells.</Callout> : null;
  const exRow = (id: string, e: any, done: boolean, onTick?: () => void) => {
    const open = openEx === id;
    return (
      <div key={id} style={{ ...CARD, borderRadius: 18, padding: 10, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setOpenEx(open ? null : id)} aria-label={`Show ${e.name} demo`} style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer", alignSelf: "flex-start" }}><Thumb src={demoThumb(e.demo)} size={60} /></button>
          <button onClick={() => setOpenEx(open ? null : id)} style={{ flex: 1, border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", color: "var(--text)", display: "grid", gap: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 600, lineHeight: "20px", color: done ? "var(--text3)" : "var(--text)" }}>{e.name}</span>
            <span style={{ fontSize: 12.5, color: "var(--text3)" }}>{e.dose}{e.equip ? ` · ${e.equip}` : ""}</span>
            <span style={{ fontSize: 13, lineHeight: "18px", color: "var(--text2)" }}>{e.cue}</span>
            {ui.kidHelper && e.kid && <span style={{ fontSize: 12.5, lineHeight: "17px", color: "var(--link)" }}>{`Kid helper: ${e.kid}`}</span>}
          </button>
          {onTick && <Tick done={done} onClick={onTick} label={done ? `Untick ${e.name}` : `Tick ${e.name}`} />}
        </div>
        {open && <DemoBlock id={e.demo} defaultOpen onClose={() => setOpenEx(null)} />}
      </div>
    );
  };
  const exDone = (id: string) => !!(rec.ex && rec.ex[id]);
  const tickEx = (id: string) => patchDay((r) => ({ ...r, ex: { ...(r.ex || {}), [id]: !(r.ex && r.ex[id]) } }));
  const cycleBodyNote = cyc ? <Callout>{`Cycle day ${cyc.day} · ${PHASE_LABEL[cyc.phase]}. ${cyc.phase === "menstrual" || cyc.phase === "premenstrual" ? "Gentle flow or a walk is a full win today." : cyc.phase === "follicular" ? "Often a good-energy window for the full workout." : "Go by feel; Minimum still counts."}`}</Callout> : null;
  const safety = "Joint-safe: light weights, pain-free range, 2-3 reps left in the tank. Sharp pain means stop. Pregnant or postpartum? Get your clinician's OK first and skip planks and swings until cleared. If you take ADHD medication, ask your doctor about timing and exercise.";
  const detailView = () => {
    const key = moveDetail === "workout" ? "move" : moveDetail;
    const mode = modeOf(key);
    const plan = key === "snack" ? snackPlan(mode) : key === "gentle" ? gentlePlan(mode) : wPlan(mode);
    const list = key === "snack" ? (mode === "min" ? SNACK_MOVES.filter((m) => m.id === "squat" || m.id === "incpush") : SNACK_MOVES) : key === "gentle" ? (mode === "min" ? GENTLE_MOVES.slice(0, 2) : GENTLE_MOVES) : workout.ex.map((id) => EXERCISES[id]);
    const done = !!rec.c[key];
    const allTicked = list.every((e) => exDone(`${key}:${e.id}`));
    const timerId = `${key}:${mode}`;
    const xpG = key === "move" ? (mode === "min" ? XP.workoutMin : XP.workout) : mode === "min" ? 5 : XP.snack;
    const title = key === "snack" ? "Movement snack" : key === "gentle" ? "Gentle flow" : workout.name;
    const sub = key === "snack" ? "5 minutes, bodyweight, anywhere" : key === "gentle" ? "Mobility for low-energy, period or postpartum days" : `${workout.focus} · kettlebell, dumbbells, bodyweight`;
    const desc = key === "snack" ? (mode === "min" ? "1 minute: 30 s squats + 30 s incline push-ups." : "5 moves x 1 minute, easy pace. No sweat needed.") : key === "gentle" ? (mode === "min" ? "2 minutes: cat-cow + child's pose." : `5 gentle moves, about ${Math.round(plan.total)} min. Slow, with your breath.`) : mode === "min" ? `1 round of 5 moves, about ${Math.round(plan.total)} min.` : `3 rounds of 5 moves, about ${Math.round(plan.total)} min with warm-up and cool-down. Rest as needed.`;
    return (
      <Fragment>
        <ScreenTitle title={title} sub={sub} onBack={() => { setMoveDetail(null); setOpenEx(null); }} />
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Today's version</div>
            <ModeSwitch mode={mode} onMode={(m) => { setMode(key, m); setTimerStart(null); }} />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <IconDot name={mode === "min" ? "zap" : "target"} tone={mode === "min" ? "accent" : "soft"} size={30} />
            <div style={{ flex: 1, display: "grid", gap: 2 }}>
              <Label>{mode === "min" ? "Minimum · counts as done for today and your streak" : "Full · switch to Minimum if today is hard"}</Label>
              <div style={{ fontSize: 14, lineHeight: "20px" }}>{desc}</div>
            </div>
          </div>
        </Card>
        {cycleBodyNote}
        <SessionTimer items={plan.items} totalMin={plan.total} startedAt={timerStart && timerStart.id === timerId ? timerStart.at : null} onStart={() => setTimerStart({ id: timerId, at: Date.now() })} onStop={() => setTimerStart(null)} />
        {key === "move" && <div style={{ ...CARD, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><span style={{ fontSize: 14, fontWeight: 500 }}>Do it with the kids</span><ModeChip on={!!ui.kidHelper} label={ui.kidHelper ? "Kid helper on" : "Kid helper off"} onClick={() => setUi({ ...ui, kidHelper: !ui.kidHelper })} /></div>}
        {key === "move" && kidHelperNote}
        <SectionTitle>{key === "move" ? `Circuit${mode === "min" ? " · 1 round" : " · 3 rounds"}` : "Moves"}</SectionTitle>
        <div style={{ display: "grid", gap: 10 }}>{list.map((e) => exRow(`${key}:${e.id}`, e, exDone(`${key}:${e.id}`), () => tickEx(`${key}:${e.id}`)))}</div>
        {done ? <CapNote title={mode === "min" ? "Minimum done. That counts." : "Done. Stop here."} text={key === "move" ? "More today won't make you stronger; sleep and tomorrow's snack will." : "Logged. Back to your day."} /> : (
          <PillButton full label={`Done: ${mode === "min" ? "minimum" : "full"} (+${xpG} XP)`} icon="check" onClick={() => { toggle(key, xpG, mode === "min"); setTimerStart(null); }} />
        )}
        {done && <PillButton full soft label="Undo done" onClick={() => toggle(key)} />}
        {!done && allTicked && <div style={{ fontSize: 13, color: "var(--text3)", textAlign: "center" }}>All moves ticked. Tap Done to log it.</div>}
        <Callout>{safety}</Callout>
      </Fragment>
    );
  };
  const nextWorkoutDay = (() => { for (let i = 1; i <= 7; i++) { const d = plusDays(now, i); if (isWorkoutDay(ui, d)) return d; } return null; })();
  const weekStart = new Date(weekKey(now) + "T00:00:00");
  const exDoneN = workout.ex.filter((id) => exDone(`move:${id}`)).length;
  const bodyScreen = moveDetail ? detailView() : (
    <Fragment>
      <ScreenTitle title="Body" sub="Easy home strength · gentle mobility · walks" />
      <Card pad={14}>
        <Label>This week</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => { const date = plusDays(weekStart, i); const d = date.getDay(); const w = isWorkoutDay(ui, date) ? workoutFor(ui, date) : null; const r = store.days[isoDay(date)]; const ok = r && (r.c.move || r.c.snack || r.c.gentle || r.c.walk); const isT = isoDay(date) === todayIso; return (
            <div key={i} style={{ display: "grid", justifyItems: "center", gap: 4, padding: "8px 0", borderRadius: 14, background: isT ? "var(--ink)" : "transparent", color: isT ? "var(--on-ink)" : "var(--text)" }}>
              <span style={{ fontSize: 11, opacity: 0.7 }}>{DAY_SHORT[d].slice(0, 2)}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{w ? w.id : "·"}</span>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: ok ? "var(--accent)" : "transparent" }} />
            </div>
          ); })}
        </div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>Letters = strength days (change in Settings). Any move, flow or walk earns the dot.</div>
      </Card>
      {cycleBodyNote}
      {wDay ? (
        <WorkoutCard title={`Today: ${workout.name}`} badge={rec.c.move ? "Done" : moveMode === "min" ? "Minimum" : undefined} chips={[`${Math.round(wPlan(moveMode).total)} min`, `${workout.ex.length} moves`]} lines={[workout.focus, workout.ex.map((id) => EXERCISES[id].name).join(" · ")]} value={rec.c.move ? 1 : exDoneN / workout.ex.length} progressLabel={rec.c.move ? "Done" : `${exDoneN}/${workout.ex.length}`} thumb={demoThumb(EXERCISES[workout.ex[0]].demo)} onClick={() => setMoveDetail("workout")} />
      ) : (
        <div style={{ ...CARD, padding: 14, display: "flex", gap: 12, alignItems: "center" }}><IconDot name="calendar" size={40} /><div style={{ flex: 1 }}><div style={{ fontSize: 15, fontWeight: 600 }}>No strength today</div><Label>{nextWorkoutDay ? `Next: ${workoutFor(ui, nextWorkoutDay).name} on ${DAY_LONG[nextWorkoutDay.getDay()]}` : "Pick workout days in Settings"}</Label></div></div>
      )}
      <WorkoutCard title="Gentle flow" badge={rec.c.gentle ? "Done" : "Low-energy day"} chips={["6 min", "5 moves"]} lines={["Mobility, kind to period + postpartum days", "Cat-cow · child's pose · hip flexor · bridge · dead bug"]} value={rec.c.gentle ? 1 : 0} progressLabel={rec.c.gentle ? "Done" : "0/1"} thumb={demoThumb("child")} onClick={() => setMoveDetail("gentle")} />
      <WorkoutCard title="Movement snack" badge={rec.c.snack ? "Done" : "Daily"} chips={["5 min", "5 moves"]} lines={["Bodyweight, anywhere, no sweat", "Squats · arm circles · cat-cow · push-ups · stretch"]} value={rec.c.snack ? 1 : 0} progressLabel={rec.c.snack ? "Done" : "0/1"} thumb={demoThumb("wgs")} onClick={() => setMoveDetail("snack")} />
      <div style={{ ...CARD, padding: "6px 16px" }}>
        <TapItem first label="10-minute walk" sub="Outside if you can. Daylight + movement = mood" done={!!rec.c.walk} onTap={() => toggle("walk", XP.snack)} minText="Around the block, 3 minutes" mode={modeOf("walk")} onMode={(m) => setMode("walk", m)} minDone={!!rec.min.walk} action={{ label: "10 min", onClick: () => setSheet({ kind: "walk" }) }} />
      </div>
      <div style={{ ...CARD, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}><span style={{ fontSize: 14, fontWeight: 500 }}>Kid helper mode</span><ModeChip on={!!ui.kidHelper} label={ui.kidHelper ? "On" : "Off"} onClick={() => setUi({ ...ui, kidHelper: !ui.kidHelper })} /></div>
      {kidHelperNote}
      <SectionTitle>All exercises</SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>{Object.keys(EXERCISES).map((id) => exRow(`lib:${id}`, EXERCISES[id], false))}</div>
      <Callout>{safety}</Callout>
    </Fragment>
  );

  // ---------- Mind ----------
  const days = Array.from({ length: span }, (_, i) => plusDays(now, i - span + 1));
  const dayLabels = days.map((d) => `${d.getMonth() + 1}/${d.getDate()}`);
  const series = (k: string) => days.map((d) => { const c = store.days[isoDay(d)]?.check; return c && typeof c[k] === "number" ? c[k] : null; });
  const overSeries = days.map((d) => dayOver(store.days[isoDay(d)]));
  const phaseSeries = days.map((d) => { const c = cycleFor(d); return c ? c.phase : null; });
  const luteal = ui.cycle ? lutealPattern(overSeries, phaseSeries) : null;
  const notes = [...(luteal ? [luteal] : []), ...patternNotes(days.map((d) => { const r = store.days[isoDay(d)]; return r && r.check ? { ...r.check, over: dayOver(r) ?? r.check.over } : undefined; }), days.map((d) => { const r = store.days[isoDay(d)]; return !!(r && (r.c.move || r.c.snack || r.c.gentle || r.c.walk)); }))];
  const noteCard = (title: string, tint: boolean) => notes.length > 0 ? <div style={{ ...CARD, padding: 16, display: "grid", gap: 8, ...(tint ? { background: "var(--accent-subtle)", boxShadow: "none" } : {}) }}><div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14.5, fontWeight: 600 }}>{I("bulb", 18)}{title}</div>{notes.map((n, i) => <div key={i} style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{n}</div>)}</div> : null;
  const togglePeriod = () => {
    const on = !rec.period;
    patchDay((r) => ({ ...r, period: on }));
    if (on && !(store.days[isoDay(plusDays(now, -1))] || {}).period) setUi({ ...ui, cycle: true, cycleStart: todayIso });
  };
  const checkinView = (
    <Fragment>
      <div style={{ ...CARD, padding: 18, display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <IconDot name="mind" tone="accent" size={40} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>How full is your cup of overwhelm?</div><Label>{isCheckDone(rec.check) ? `Saved · tap again any time today` : `One tap · +${XP.checkin} XP`}</Label></div>
          {isCheckDone(rec.check) && <span style={{ color: "var(--accent)" }}>{I("check", 22, 2.5)}</span>}
        </div>
        <OverMeter big value={check.over} onPick={setOver} />
        {overReply(check.over)}
        {(rec.overLog || []).length > 0 && <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{`Today: ${(rec.overLog || []).map((o) => `${o.t} · ${o.v}`).join("   ")}`}</div>}
      </div>
      <Card>
        <CardHead icon="alert" title="What's adding to it?" sub="Tap any. Patterns show up in Trends." />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{TRIGGERS.map((t) => <ModeChip key={t.id} on={(check.triggers || []).indexOf(t.id) >= 0} label={t.label} onClick={() => toggleTrigger(t.id)} />)}</div>
      </Card>
      <Card>
        <CardHead icon="drop" title="Cycle" sub={ui.cycle ? (cyc ? `Day ${cyc.day} · ${PHASE_LABEL[cyc.phase]}` : "Tap Period today when it starts") : "Optional: track how your cycle affects ADHD"} right={<ModeChip on={!!ui.cycle} label={ui.cycle ? "On" : "Off"} onClick={() => setUi({ ...ui, cycle: !ui.cycle })} />} />
        {ui.cycle && <Fragment>
          {cyc && <div style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{PHASE_NOTE[cyc.phase]}</div>}
          <div><ModeChip on={!!rec.period} label={rec.period ? "Period today ✓" : "Period today"} onClick={togglePeriod} /></div>
        </Fragment>}
      </Card>
      <Section heading="Go deeper" caption="Mood, energy, focus, sleep, meds, a note" collapsible defaultOpen={deeper}>
        {CHECK_FIELDS.map((f) => <Rating key={f.k} label={f.label} low={f.low} high={f.high} value={check[f.k]} onPick={(n) => setCheck(f.k, n)} />)}
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 14.5, fontWeight: 600 }}>Meds taken</span><span style={{ fontSize: 11.5, color: "var(--text3)" }}>optional</span></div>
          <div style={{ display: "flex", gap: 6 }}>{[["yes", "Yes"], ["no", "No"], ["na", "N/A"]].map(([v, l]) => <ModeChip key={v} on={check.meds === v} label={l} onClick={() => setCheck("meds", check.meds === v ? undefined : v)} />)}</div>
        </div>
        <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 14.5, fontWeight: 600 }}>One line <span style={{ fontWeight: 400, fontSize: 11.5, color: "var(--text3)" }}>optional</span></span><input value={check.note || ""} maxLength={140} placeholder="e.g. short night, big deadline, kids sick" onChange={(e) => setCheck("note", e.target.value)} style={fieldStyle} /></label>
      </Section>
      {burnoutCard}
      {noteCard("Gentle pattern", false)}
    </Fragment>
  );
  const trigCounts = TRIGGERS.map((t) => ({ t, n: days.filter((d) => ((store.days[isoDay(d)]?.check?.triggers) || []).indexOf(t.id) >= 0).length })).filter((x) => x.n > 0).sort((a, z) => z.n - a.n).slice(0, 5);
  const trendsView = (
    <Fragment>
      <Segmented options={[{ value: 14, label: "14 days" }, { value: 30, label: "30 days" }]} value={span} onChange={setSpan} />
      {notes.length > 0 ? noteCard("Patterns, not diagnoses", true) : <Callout>Patterns show up after a week or so of check-ins. These are notes, not diagnoses.</Callout>}
      <div style={{ ...CARD, padding: "14px 14px 8px", display: "grid", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><span style={{ fontSize: 15, fontWeight: 600 }}>Overwhelm (highest each day)</span><span style={{ fontSize: 12.5, color: "var(--text3)" }}>line = 4</span></div>
        <TrendChart name="Overwhelm" values={overSeries} labels={dayLabels} lo={1} hi={5} target={4} height={130} />
      </div>
      {trigCounts.length > 0 && <Card><CardHead icon="alert" title="Top triggers" sub={`Last ${span} days`} />{trigCounts.map((x) => <div key={x.t.id} style={{ display: "grid", gap: 4 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}><span>{x.t.label}</span><span style={{ color: "var(--text3)" }}>{`${x.n} days`}</span></div><Bar value={x.n / Math.max(1, trigCounts[0].n)} /></div>)}</Card>}
      {CHECK_FIELDS.map((f) => { const s = series(f.k); const vals = s.filter((v) => v !== null); if (!vals.length) return null; const avg = (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1); return (
        <div key={f.k} style={{ ...CARD, padding: "14px 14px 8px", display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}><span style={{ fontSize: 15, fontWeight: 600 }}>{f.label}</span><span style={{ fontSize: 12.5, color: "var(--text3)", whiteSpace: "nowrap" }}>{`avg ${avg} · ${vals.length}/${span} days`}</span></div>
          <TrendChart name={f.label} values={s} labels={dayLabels} lo={1} hi={5} />
        </div>
      ); })}
    </Fragment>
  );
  function pickOne() {
    const c: string[] = [];
    todayRows.forEach((r) => { if (!rowDone(r.key) && r.key !== "checkin" && r.key !== "t:bed") c.push(r.min ? `Minimum: ${r.min}` : r.label); });
    dueChores.forEach((ch) => { if (myChore(ch) && !rec.c[`chore:${ch.id}`]) c.push(`Just 2 minutes of: ${ch.name.toLowerCase()}`); });
    store.brain.forEach((x) => { if (!x.done) c.push(x.text); });
    const pool = c.length ? c : FALLBACK_TINY;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && pick === oneTask) pick = pool[(pool.indexOf(pick) + 1) % pool.length];
    setOneTask(pick);
  }
  const addBrain = () => { const t = brainDraft.trim(); if (!t) return; setStore((s) => ({ ...s, brain: [{ id: uid(), text: t }, ...s.brain] })); setBrainDraft(""); };
  const resetView = (
    <Fragment>
      <Card pad={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><IconDot name="target" tone="ink" size={40} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>Overwhelmed? Pick ONE.</div><Label>One tiny next step. Ignore the rest for now.</Label></div></div>
        {oneTask && <div className="fadein" style={{ padding: "14px 16px", borderRadius: 16, background: "var(--accent-subtle)", fontSize: 16, fontWeight: 600, lineHeight: "22px" }}>{oneTask}</div>}
        <PillButton full label={oneTask ? "Pick a different one" : "Pick ONE for me"} icon="spark" onClick={pickOne} />
      </Card>
      <Card pad={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><IconDot name="wind" tone="accent" size={40} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>Breathing reset</div><Label>{`1-2 minutes · +${XP.reset} XP`}</Label></div></div>
        <Breather kind={ui.breath || "sigh"} onKind={(k) => setUi({ ...ui, breath: k })} onDone={() => { if (!rec.c["reset:breath"]) toggle("reset:breath", XP.reset); }} />
      </Card>
      <Card pad={18}>
        <CardHead icon="ear" title="Sensory overload?" sub="Noise, touch and clutter hit ADHD brains harder" />
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", letterSpacing: 0.3 }}>GROUND: 5-4-3-2-1</div>
        <BulletList items={GROUNDING} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text3)", letterSpacing: 0.3 }}>QUICK RESETS</div>
        <BulletList items={SENSORY_RESETS} />
        <PillButton small soft icon="check" label={rec.c["reset:sense"] ? "Done" : "I did one"} onClick={() => toggle("reset:sense", XP.reset)} />
      </Card>
      <Card pad={18}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}><IconDot name="note" tone="accent" size={40} /><div style={{ flex: 1 }}><div style={{ fontSize: 16, fontWeight: 600 }}>Brain dump</div><Label>Get it out of your head. Saved on this phone.</Label></div></div>
        <form onSubmit={(e) => { e.preventDefault(); addBrain(); }} style={{ display: "flex", gap: 8 }}>
          <input value={brainDraft} onChange={(e) => setBrainDraft(e.target.value)} placeholder="Whatever's buzzing..." aria-label="Brain dump item" style={fieldStyle} />
          <button type="submit" style={{ minHeight: 46, padding: "0 18px", borderRadius: 999, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer", flex: "0 0 auto" }}>Add</button>
        </form>
        {store.brain.length > 0 && <div style={{ display: "grid" }}>{store.brain.map((x, i) => (
          <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <Tick size={26} done={!!x.done} label={x.done ? `Untick ${x.text}` : `Tick ${x.text}`} onClick={() => setStore((s) => ({ ...s, brain: s.brain.map((y) => (y.id === x.id ? { ...y, done: !y.done } : y)) }))} />
            <span style={{ flex: 1, fontSize: 14.5, color: x.done ? "var(--text3)" : "var(--text)", textDecoration: x.done ? "line-through" : "none" }}>{x.text}</span>
            <button onClick={() => setStore((s) => ({ ...s, brain: s.brain.filter((y) => y.id !== x.id) }))} aria-label={`Delete ${x.text}`} style={{ width: 32, height: 32, borderRadius: 16, border: "none", background: "transparent", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{I("x", 15, 2)}</button>
          </div>
        ))}</div>}
        {store.brain.some((x) => x.done) && <div><PillButton small soft label="Clear done" onClick={() => setStore((s) => ({ ...s, brain: s.brain.filter((y) => !y.done) }))} /></div>}
      </Card>
      {ifThenCard}
    </Fragment>
  );
  const kindView = (
    <Fragment>
      <Card pad={18}>
        <CardHead icon="heart" tone="ink" title="Self-compassion break" sub="3 lines, about a minute. Hand on your heart." />
        {SELF_COMPASSION.map((s, i) => <div key={i} style={{ padding: "10px 12px", borderRadius: 14, background: "var(--bg)", display: "grid", gap: 2 }}><span style={{ fontSize: 12, fontWeight: 600, color: "var(--link)" }}>{`${i + 1}. ${s.step}`}</span><span style={{ fontSize: 15, lineHeight: "21px" }}>{s.say}</span></div>)}
        {rec.c.kind ? <CapNote title={`Done · +${XP.kind} XP`} text="That counts as taking care of you." /> : <PillButton full icon="check" label={`I did it (+${XP.kind} XP)`} onClick={() => toggle("kind", XP.kind)} />}
      </Card>
      <Card>
        <CardHead icon="sun" title="Tonight's question" />
        <div style={{ fontSize: 16, lineHeight: "22px", fontWeight: 500 }}>{rotate(KIND_PROMPTS, now)}</div>
      </Card>
      <Section heading="Rejection hurts more with ADHD" caption="Rejection sensitivity (RSD)">
        <BulletList items={["Name it: \"This is the rejection-sensitive part of my brain. It feels huge; it may not be.\"", "Check the story: what are 2 other reasons they might have said that?", "Wait before replying. Sleep on hard texts.", "Ask instead of guessing: \"When you said X, did you mean Y?\""]} />
      </Section>
      <Section heading="Good enough is the goal" caption="Perfectionism and the mom-guilt spiral">
        <BulletList items={["Pick the B-minus version on purpose: store-bought snacks, paper plates, dry shampoo.", "Compare to your own last week, not to someone else's highlight reel.", "Rest is part of the job, not a reward for finishing it.", "Your kids need a regulated mom more than a perfect house."]} />
      </Section>
    </Fragment>
  );
  const mindScreen = (
    <Fragment>
      <ScreenTitle title="Mind" sub="Overwhelm check-ins · patterns, not diagnoses" />
      <Segmented options={[{ value: "checkin", label: "Check-in" }, { value: "trends", label: "Trends" }, { value: "reset", label: "Reset" }, { value: "kind", label: "Kindness" }]} value={mindTab} onChange={setMindTab} />
      {mindTab === "checkin" && checkinView}
      {mindTab === "trends" && trendsView}
      {mindTab === "reset" && resetView}
      {mindTab === "kind" && kindView}
      {crisisCard}
    </Fragment>
  );

  // ---------- Talk ----------
  const built = softStartup({ ...b, partner });
  const tglFeel = (f: string) => setB({ ...b, feel: b.feel.indexOf(f) >= 0 ? b.feel.filter((x) => x !== f) : [...b.feel, f].slice(-3) });
  const bInput = (k: string, label: string, ph: string) => <label style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 13, color: "var(--text3)" }}>{label}</span><input value={b[k]} placeholder={ph} onChange={(e) => { setB({ ...b, [k]: e.target.value }); setDraft(null); }} style={fieldStyle} /></label>;
  const sayView = (
    <Fragment>
      <Callout>Soft start-up: start gently, talk about your feelings and a need, ask for one specific thing. Conversations tend to end the way they begin.</Callout>
      <Card>
        <CardHead icon="talk" title="Build what you want to say" sub="Feelings + need + one clear ask" />
        {bInput("appreciate", "Start with an appreciation (optional)", "e.g. you handled bath time last night")}
        <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 13, color: "var(--text3)" }}>I'm feeling (pick up to 3)</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{FEELINGS.map((f) => <ModeChip key={f} on={b.feel.indexOf(f) >= 0} label={f} onClick={() => { tglFeel(f); setDraft(null); }} />)}</div></div>
        {bInput("about", "About (the situation, not their character)", "e.g. evenings after work")}
        <div style={{ display: "grid", gap: 6 }}><span style={{ fontSize: 13, color: "var(--text3)" }}>I need</span><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{NEEDS.map((n) => <ModeChip key={n.label} on={b.need === n.text} label={n.label} onClick={() => { setB({ ...b, need: b.need === n.text ? "" : n.text }); setDraft(null); }} />)}</div></div>
        {bInput("ask", "One specific, doable ask", "e.g. take bedtime on Tuesdays and Thursdays")}
      </Card>
      <ScriptCard title="Your words" to={partnerLabel} text={draft ?? built} editable onEdit={(t) => setDraft(t)} onUse={() => markOnce("talk:say", XP.talk)} />
      <Section heading="Delivery tips" collapsible defaultOpen={false}>
        <BulletList items={["Pick the moment: not mid-chaos, not hungry, not after 9 PM.", "\"I\" not \"you\": \"I feel stretched thin\" lands softer than \"you never help\".", "One issue at a time. Save the list for the Sunday check-in.", "Flooded (heart racing)? Pause for 20 minutes and come back. Say when.", "Ask them to sum up what they heard before they answer."]} />
      </Section>
    </Fragment>
  );
  const askTargets = ["Partner", "Friend / family", "Kids", "Work", "Clinician"];
  const askView = (
    <Fragment>
      <Callout>Asking for help is a skill, not a weakness. Specific and small beats vague and big: "Could you take Tuesday pickup?" gets a yes more often than "I need more help."</Callout>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{askTargets.map((t) => <ModeChip key={t} on={askTo === t} label={t === "Partner" ? partnerLabel : t} onClick={() => setAskTo(t)} />)}</div>
      {HELP_SCRIPTS.filter((s) => s.to === askTo).map((s) => <ScriptCard key={s.id} title={s.title} to={s.to === "Partner" ? partnerLabel : s.to} text={s.text(partner, kidName(0))} onUse={() => { markOnce("talk:ask", XP.ask); if (!rec.c["x:ask"]) toggle("x:ask", 10); }} />)}
      <Section heading="Help you can hire or borrow" caption="Outsourcing is a valid ADHD strategy" collapsible defaultOpen={false}>
        <BulletList items={["Grocery pickup or delivery on a standing weekly order.", "A sitter for 2 hours a week, just for you.", "Meal kits or a rotating 7-dinner plan.", "A cleaner every other week, even just bathrooms.", "Body doubling: a friend on a video call while you both do paperwork."]} />
      </Section>
    </Fragment>
  );
  const agendaDone = AGENDA.filter((a) => rec.agenda && rec.agenda[a.id]).length;
  const tickAgenda = (id: string) => patchDay((r) => ({ ...r, agenda: { ...(r.agenda || {}), [id]: !(r.agenda && r.agenda[id]) } }));
  const checkTalkView = (
    <Fragment>
      <Card pad={18}>
        <CardHead icon="calendar" tone="ink" title="Weekly couple check-in" sub={`15 minutes · ${isSunday ? "today" : "Sunday night"} · appreciations first`} />
        <div style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>A short, regular meeting means the week's logistics and small hurts get a time and place, instead of leaking out at 9 PM.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><PillButton icon="play" label="15-min timer" onClick={() => setSheet({ kind: "partner" })} /></div>
      </Card>
      <div style={{ ...CARD, padding: "6px 16px" }}>
        {listHead("Agenda", `${agendaDone} of ${AGENDA.length}`)}
        {AGENDA.map((a, i) => <TapItem key={a.id} first={i === 0} label={`${a.label} · ${a.mins} min`} sub={a.sub} done={!!(rec.agenda && rec.agenda[a.id])} onTap={() => tickAgenda(a.id)} />)}
      </div>
      {rec.c.partner ? <CapNote title={`Check-in done · +${XP.partner} XP`} text="Teamwork, on the calendar. Nice." /> : <PillButton full icon="check" label={`We did our check-in (+${XP.partner} XP)`} onClick={() => toggle("partner", XP.partner)} />}
      <ScriptCard title="Invite them" to={partnerLabel} text={`Hey${partner ? ` ${partner}` : ""}, could we do a 15-minute check-in Sunday after the kids are down? Appreciations first, then next week's calendar and one thing each. I think it'll make the week easier for both of us.`} onUse={() => markOnce("talk:invite", XP.talk)} />
    </Fragment>
  );
  const agreementsText = `Our house agreements:\n${store.agreements.map((a) => `• ${a}`).join("\n")}`;
  const boundView = (
    <Fragment>
      <Section heading="Our agreements" caption="Decide once, together. Then it's a plan, not a favor.">
        {editList(store.agreements, (l) => setStore((s) => ({ ...s, agreements: l })), agEdit, setAgEdit, DEFAULT_AGREEMENTS, "hand", "We agree that...", "Agreement")}
      </Section>
      <ScriptCard title="Share the agreements" to={partnerLabel} text={agreementsText} onUse={() => markOnce("talk:agree", XP.talk)} />
      <SectionTitle>Boundary scripts</SectionTitle>
      <Callout>ADHD often comes with an impulsive yes. A pause buys you time to check your capacity first.</Callout>
      {BOUNDARY_SCRIPTS.map((s, i) => <ScriptCard key={i} title={s.title} text={s.text} onUse={() => markOnce("talk:bound", XP.talk)} />)}
    </Fragment>
  );
  const talkScreen = (
    <Fragment>
      <ScreenTitle title="Talk" sub={`Feelings, expectations, asking for help${partner ? ` · ${partner}` : ""}`} />
      <Segmented options={[{ value: "say", label: "Say it" }, { value: "ask", label: "Ask" }, { value: "check", label: "Check-in" }, { value: "bound", label: "Boundaries" }]} value={talkTab} onChange={setTalkTab} />
      {talkTab === "say" && sayView}
      {talkTab === "ask" && askView}
      {talkTab === "check" && checkTalkView}
      {talkTab === "bound" && boundView}
    </Fragment>
  );

  // ---------- More (opened from Home) ----------
  const owned = new Set(store.badges.map((x) => x.id));
  const advs = Array.from(new Set(store.rewards.filter((r) => r.kind === "adventure").map((r) => r.body)));
  const joys = Array.from(new Set(store.rewards.filter((r) => r.kind === "joy" || r.kind === "treat").map((r) => r.body)));
  const moreTitles: Record<string, string> = { readings: "Daily Readings", more: "More", settings: "Settings", badges: "Badge shelf", backup: "Backup", why: "Why it works", credits: "Credits" };
  const fieldLabel = (t: string) => <span style={{ fontSize: 13, color: "var(--text3)" }}>{t}</span>;
  const para = (children: any) => <div style={{ fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{children}</div>;
  const timeField = (label: string, k: string) => <label style={{ display: "grid", gap: 6 }}>{fieldLabel(label)}<input type="time" value={ui[k]} onChange={(e) => setUi({ ...ui, [k]: e.target.value || ui[k] })} style={fieldStyle} /></label>;
  const moreMenu = (
    <div style={{ display: "grid", gap: 10 }}>
      <MenuRow icon="settings" title="Settings" sub="Names, partner, kids, home time, cycle, dark mode" onClick={() => setPage("settings")} />
      <MenuRow icon="book" title="Daily Readings" sub="Today's Mass readings from the USCCB" onClick={() => openReadings("more")} />
      <MenuRow icon="award" title="Badge shelf" sub={`${owned.size} of ${BADGES.length} badges · ${advs.length} adventures`} onClick={() => setPage("badges")} />
      <MenuRow icon="download" title="Backup" sub="Export or import your data" onClick={() => setPage("backup")} />
      <MenuRow icon="bulb" title="Why it works" sub="The research, in plain language" onClick={() => setPage("why")} />
      <MenuRow icon="info" title="Credits" sub="Exercise images and icons" onClick={() => setPage("credits")} />
      {crisisCard}
      <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center", padding: 8 }}>ADHDiva · everything stays on this phone · no accounts, no tracking</div>
    </div>
  );
  const settingsView = (
    <Fragment>
      <Section heading="You">
        <label style={{ display: "grid", gap: 6 }}>{fieldLabel('Shown on Home as "Hi, ..."')}<input value={ui.name || ""} placeholder="Mom" onChange={(e) => setUi({ ...ui, name: e.target.value })} style={fieldStyle} /></label>
        <label style={{ display: "grid", gap: 6 }}>{fieldLabel("Partner's name (used in scripts)")}<input value={ui.partner || ""} placeholder="Partner" onChange={(e) => setUi({ ...ui, partner: e.target.value })} style={fieldStyle} /></label>
      </Section>
      <Section heading="Kids" caption="Used in cards, reminders and affirmations">
        {ui.kids.map((k, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <input value={k} aria-label={`Kid ${i + 1} name`} placeholder={`Kid ${i + 1}`} onChange={(e) => { const kids = [...ui.kids]; kids[i] = e.target.value; setUi({ ...ui, kids }); }} style={fieldStyle} />
            {ui.kids.length > 1 && trashBtn(`Remove ${kidName(i)}`, () => setUi({ ...ui, kids: ui.kids.filter((_, j) => j !== i) }))}
          </div>
        ))}
        <div><PillButton small soft icon="plus" label="Add a kid" onClick={() => setUi({ ...ui, kids: [...ui.kids, ""] })} /></div>
      </Section>
      <Section heading="Coming home" caption="Drives the landing ritual and Now / Next">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>{timeField("Home from work", "homeTime")}{timeField("Dinner", "dinnerTime")}</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span style={{ fontSize: 13, color: "var(--text3)", marginRight: 4 }}>Landing time</span>{[10, 15, 20].map((m) => <ModeChip key={m} on={landMins === m} label={`${m} min`} onClick={() => setUi({ ...ui, landMins: m })} />)}</div>
      </Section>
      <Section heading="Workouts" caption="Strength on these days; gentle flow, snack or walk any day">
        <DayPicker value={ui.workoutDays} onChange={(v) => setUi({ ...ui, workoutDays: v })} />
        {timeField("Workout time", "workoutTime")}
      </Section>
      <Section heading="Cycle (optional)" caption="Stays on this phone. Used for gentle notes, never predictions.">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 15 }}>Track cycle</span><ModeChip on={!!ui.cycle} label={ui.cycle ? "On" : "Off"} onClick={() => setUi({ ...ui, cycle: !ui.cycle })} /></div>
        {ui.cycle && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>{fieldLabel("Last period started")}<input type="date" value={ui.cycleStart || ""} max={todayIso} onChange={(e) => setUi({ ...ui, cycleStart: e.target.value || undefined })} style={fieldStyle} /></label>
          <label style={{ display: "grid", gap: 6 }}>{fieldLabel("Typical length (days)")}<input value={String(ui.cycleLen || 28)} inputMode="numeric" onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); setUi({ ...ui, cycleLen: isNaN(n) ? 28 : Math.max(20, Math.min(45, n)) }); }} style={fieldStyle} /></label>
        </div>}
      </Section>
      <Section heading="Daily Readings" caption="Mass readings from the USCCB on Home, plus an optional tick on Today">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 15 }}>Show daily readings</span><ModeChip on={readingsOn} label={readingsOn ? "On" : "Off"} onClick={() => setUi({ ...ui, readings: !readingsOn })} /></div>
      </Section>
      <Section heading="Look">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 15 }}>Dark mode</span><ModeChip on={!!ui.dark} label={ui.dark ? "On" : "Off"} onClick={() => setUi({ ...ui, dark: !ui.dark })} /></div>
      </Section>
    </Fragment>
  );
  const badgesView = (
    <Fragment>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10 }}>
        {BADGES.map((x) => { const on = owned.has(x.id); return (
          <div key={x.id} style={{ ...CARD, padding: "14px 8px", display: "grid", justifyItems: "center", gap: 6, textAlign: "center", opacity: on ? 1 : 0.5 }}>
            <IconDot name={on ? x.icon : "shield"} tone={on ? "ink" : "soft"} size={44} />
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: "17px" }}>{on ? x.name : "Locked"}</div>
            <div style={{ fontSize: 11.5, lineHeight: "15px", color: "var(--text3)" }}>{on ? x.desc : "Keep showing up"}</div>
          </div>
        ); })}
      </div>
      <Section heading="Mini adventures" caption="Unlocked by rewards. Pick one for the weekend.">{advs.length ? <BulletList items={advs} /> : para("None yet. About 4 in 10 completions unlock a bonus.")}</Section>
      <Section heading="Micro-joys and treats collected" collapsible defaultOpen={joys.length > 0}>{joys.length ? <BulletList items={joys} /> : para("None yet.")}</Section>
      <Section heading="Levels">
        {LEVELS.map((l, i) => <div key={l.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "6px 0", borderTop: i ? "1px solid var(--border)" : "none", fontWeight: i === lvl.idx ? 600 : 400 }}><span>{`${i + 1}. ${l.name}`}</span><span style={{ color: "var(--text3)" }}>{`${l.xp} XP`}</span></div>)}
      </Section>
    </Fragment>
  );
  const whyView = (
    <Fragment>
      <Section heading="What the research says">
        <BulletList items={[
          "ADHD in women is often inattentive and internal (overwhelm, anxiety, a busy mind) and masked for years, so many moms are diagnosed late or after a child is.",
          "Hormones matter. In studies, ADHD symptoms tend to rise when estrogen is low, especially the week before a period, and many women report worse symptoms postpartum and in perimenopause.",
          "The mental load (noticing, planning and remembering) falls mostly on women, and it is invisible work. Naming it and handing over whole tasks helps.",
          "Parental burnout happens when demands outweigh resources for a long time. The fix is both: fewer demands and more support.",
          "Mentally detaching from work after hours helps you recover. A short landing ritual makes that switch on purpose.",
          "Gentle starts work better. Soft start-ups and \"I feel / I need\" requests make partners less defensive and more likely to help.",
          "Self-compassion is linked with less stress and better well-being in adults with ADHD.",
          "Cyclic sighing (a double inhale, long exhale) for 5 minutes a day improved mood and lowered breathing rate more than mindfulness in a trial.",
          "If-then plans and tiny daily habits help ADHD brains follow through. Missing one day doesn't break a habit.",
        ]} />
      </Section>
      <Section heading="How ADHDiva uses it">
        <BulletList items={[
          "One-tap overwhelm meter with a burnout early-warning light when you've been at 4+ for several check-ins.",
          "Come-home landing ritual: a text to your partner, a brain dump in the car, then 15 minutes to land.",
          "Fair-share cards with owners and a mental-load flag, plus a script to hand off a whole card.",
          "Talk tools: a soft start-up builder, help scripts, a Sunday check-in agenda and boundary scripts.",
          "Optional cycle notes so a hard week makes sense instead of feeling like failure.",
          "Never miss twice, a Minimum mode, a weekly freeze and surprise rewards keep it doable.",
        ]} />
      </Section>
      <Callout>ADHDiva is a habit and self-care helper, not medical advice, and it doesn't diagnose anything. Talk to your clinician about medication, mood, PMDD, postpartum or perimenopause changes.</Callout>
      {crisisCard}
      <Section heading="Sources"><LinkCards links={WHY_SOURCES} /></Section>
    </Fragment>
  );
  const creditsView = (
    <Fragment>
      <Section heading="Exercise images">
        {para(<Fragment>Demo images come from <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener noreferrer" style={{ color: "var(--link)" }}>free-exercise-db</a> by yuhonas, public domain under the Unlicense, turned into 2-frame animations. Used:</Fragment>)}
        <div style={{ fontSize: 13, lineHeight: "19px", color: "var(--text3)" }}>{FEDB_USED.join(" · ")}</div>
      </Section>
      <Section heading="Icons and design">{para("Line icons are inline SVGs adapted from Lucide (ISC license). Sister app to ADHDad.")}</Section>
      <Section heading="Privacy">{para("No backend, no analytics, no tracking. Your data, including any cycle notes, is stored in this browser's localStorage on this phone only.")}</Section>
    </Fragment>
  );
  const moreScreen = page ? (
    <Fragment>
      <ScreenTitle title={moreTitles[page]} sub={page === "more" ? `${lvl.cur.name} · ${xp} XP` : page === "readings" ? "Catholic Mass readings · USCCB" : undefined} onBack={() => { if (page === "readings" && rdFrom !== "more") { setPage(null); if (rdFrom === "today") setNav("today"); } else setPage(page === "more" ? null : "more"); }} />
      {page === "more" && moreMenu}
      {page === "readings" && readingsView}
      {page === "settings" && settingsView}
      {page === "badges" && badgesView}
      {page === "backup" && <Section heading="Backup" caption="Everything lives on this phone only (no account, no server). Export now and then; import to restore or move to a new phone."><BackupBox store={store} ui={ui} onImport={(s, u) => { setStore(s); if (u) setUi(normUi(u)); }} /></Section>}
      {page === "why" && whyView}
      {page === "credits" && creditsView}
    </Fragment>
  ) : null;

  const sheetCfg = !sheet ? null
    : sheet.kind === "hug" ? { title: "20-second hug", sub: "Hold on until the chime. Breathe out together.", secs: 20, doneLabel: "+1 hug", onDone: () => addHugs(1) }
    : sheet.kind === "floor" ? { title: "5-minute floor play", sub: "Their game, their rules. Phone in another room.", secs: 300, doneLabel: "Log floor play", onDone: () => { if (!rec.c["x:floor"]) toggle("x:floor", 10); } }
    : sheet.kind === "land" ? { title: `${landMins}-minute landing`, sub: "Comfy clothes, water, quiet. Nobody needs you right now.", secs: landMins * 60, doneLabel: "I landed", onDone: () => { tickLand("decomp"); if (!rec.c.land) toggle("land", landXp); } }
    : sheet.kind === "me" ? { title: sheet.min ? "5 minutes for you" : "20 minutes for you", sub: "Not chores. Something that refills you.", secs: sheet.min ? 300 : 1200, doneLabel: "Done", onDone: () => { if (!rec.c["x:me"]) toggle("x:me", 10, !!sheet.min); } }
    : sheet.kind === "walk" ? { title: "10-minute walk", sub: "Outside if you can. Look at things far away.", secs: 600, doneLabel: "Log walk", onDone: () => { if (!rec.c.walk) toggle("walk", XP.snack); } }
    : sheet.kind === "partner" ? { title: "15-minute check-in", sub: "Appreciations first. One issue, max.", secs: 900, doneLabel: "We did it", onDone: () => { if (!rec.c.partner) toggle("partner", XP.partner); } }
    : { title: "Special time", sub: "One kid, their choice, no phone, no teaching.", secs: 600, doneLabel: "Done", onDone: () => {} };

  const screens: Record<string, any> = { home: homeScreen, today: todayScreen, homelife: homeLifeScreen, body: bodyScreen, mind: mindScreen, talk: talkScreen };
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <main key={nav + (page || "") + (moveDetail || "")} className="fadein" style={{ maxWidth: 760, margin: "0 auto", padding: `0 16px calc(${NAV_BOTTOM} + ${NAV_H + 28}px)`, display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 12 }}>
        {page ? moreScreen : screens[nav]}
      </main>
      {toasts.length > 0 && <Toast key={toasts.length + toasts[0].title} t={toasts[0]} onClose={() => setToasts((q) => q.slice(1))} />}
      {sheetCfg && <TimerSheet {...sheetCfg} onClose={() => setSheet(null)} />}
      {nameSheet && (
        <div role="dialog" aria-modal="true" aria-label="Your name" onClick={() => setNameSheet(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); setUi({ ...ui, name: nameDraft.trim() }); setNameSheet(false); }} style={{ width: "100%", maxWidth: 520, background: "var(--card)", color: "var(--text)", borderRadius: "28px 28px 0 0", padding: "12px 20px calc(env(safe-area-inset-bottom) + 20px)", display: "grid", gap: 16, boxShadow: "0 -8px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)", margin: "0 auto" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <IconDot name="smile" tone="accent" size={52} />
              <div><div style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.3 }}>What should we call you?</div><div style={{ fontSize: 13, color: "var(--text3)" }}>{`Shown on Home as "Hi, ${nameDraft.trim() || "Mom"}"`}</div></div>
            </div>
            <input autoFocus value={nameDraft} maxLength={30} placeholder="Mom" aria-label="Your name" onChange={(e) => setNameDraft(e.target.value)} style={{ minHeight: 50, fontSize: 17, padding: "0 16px", borderRadius: 14, border: "none", background: "var(--fill2)", color: "var(--text)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button type="button" onClick={() => setNameSheet(false)} style={{ minHeight: 50, borderRadius: 25, border: "none", background: "var(--fill2)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ minHeight: 50, borderRadius: 25, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Save</button>
            </div>
          </form>
        </div>
      )}
      <BottomNav value={nav} onChange={(v) => { setPage(null); setMoveDetail(null); setOpenEx(null); setNav(v); }} />
    </div>
  );
}
