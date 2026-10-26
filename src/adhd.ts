// ADHD-friendly helpers for ADHDiva: never-miss-twice streaks, XP levels, variable rewards, rotations, gentle patterns.
// Pure functions only (no React) so they can be unit-tested with plain Node.

function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
export function isoDay(d: Date): string { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function plusDays(d: Date, n: number): Date { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
/** ISO date of the Monday that starts d's week. */
export function weekKey(d: Date): string { return isoDay(plusDays(d, -((d.getDay() + 6) % 7))); }
/** Whole days since 2026-01-01 (local), used for daily rotations. */
export function dayIndex(d: Date): number { return Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(2026, 0, 1).getTime()) / 86400000 + 0.5); }
export function rotate<T>(arr: T[], d: Date, offset = 0): T { const n = arr.length; const i = ((dayIndex(d) + offset) % n + n) % n; return arr[i]; }

export interface StreakInfo {
  /** Days done inside the current chain (today counts once it is done). */
  streak: number;
  /** Misses in a row right now (0 or 1 while the chain is alive). */
  missRun: number;
  /** True when this week's freeze is still unused. */
  freezeLeft: boolean;
  /** Dates a freeze covered. */
  frozen: string[];
  /** Days done out of the last 14 (today included). */
  last14: number;
}

/**
 * Never-miss-twice streak.
 * - A single missed day never ends the chain.
 * - Two misses in a row end it, unless the week's freeze (1 per Mon-Sun week) covers the second miss.
 * - Today is "pending" until it is done, so an unfinished today never counts as a miss.
 */
export function streakInfo(test: (d: Date) => boolean, today: Date, lookback = 400): StreakInfo {
  let chain = 0; let missRun = 0;
  const used = new Set<string>(); const frozen: string[] = [];
  for (let i = lookback; i >= 1; i--) {
    const d = plusDays(today, -i);
    if (test(d)) { chain += 1; missRun = 0; continue; }
    if (chain === 0) continue;
    const wk = weekKey(d);
    if (missRun >= 1 && !used.has(wk)) { used.add(wk); frozen.push(isoDay(d)); continue; }
    missRun += 1;
    if (missRun >= 2) { chain = 0; missRun = 0; }
  }
  if (test(today)) { chain += 1; missRun = 0; }
  let last14 = 0;
  for (let i = 0; i < 14; i++) if (test(plusDays(today, -i))) last14 += 1;
  return { streak: chain, missRun, freezeLeft: !used.has(weekKey(today)), frozen, last14 };
}

// ---------- Levels (advanced by XP) ----------
export const LEVELS: { name: string; xp: number; blurb: string }[] = [
  { name: "Spark", xp: 0, blurb: "Showing up is the whole game." },
  { name: "Juggler", xp: 500, blurb: "Small reps, most days. Minimums count." },
  { name: "Steady Diva", xp: 1500, blurb: "You ask for help before you hit empty." },
  { name: "Boss of Boundaries", xp: 3500, blurb: "Clear asks, kind no's, fair cards." },
  { name: "Legendary ADHDiva", xp: 7000, blurb: "You built a life that fits your brain." },
];
export function levelOf(xp: number) {
  let i = 0;
  LEVELS.forEach((l, j) => { if (xp >= l.xp) i = j; });
  const cur = LEVELS[i]; const next = LEVELS[i + 1];
  const frac = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { idx: i, cur, next, frac, toNext: next ? next.xp - xp : 0 };
}
export const XP = { item: 10, full: 20, min: 10, chore: 10, reminder: 10, hug: 5, connect: 10, checkin: 10, over: 5, block: 5, workout: 40, workoutMin: 20, snack: 10, boss: 50, reset: 5, land: 20, ask: 15, talk: 15, partner: 40, kind: 10 };
/** Daily caps so tapping +1 forever doesn't farm XP. */
export const CAP = { hug: 10 };

// ---------- Variable rewards ----------
export const BADGES: { id: string; name: string; desc: string; icon: string }[] = [
  { id: "asked", name: "Asked for it", desc: "Said the need out loud", icon: "hand" },
  { id: "landed", name: "Soft landing", desc: "Decompressed before diving in", icon: "door" },
  { id: "showedup", name: "Showed up", desc: "Did the minimum on a meh day", icon: "check" },
  { id: "fairshare", name: "Fair share", desc: "Handed off a whole card", icon: "scale" },
  { id: "softstart", name: "Soft start", desc: "Feelings + needs, no blame", icon: "talk" },
  { id: "kindvoice", name: "Kind inner voice", desc: "Talked to yourself like a friend", icon: "heart" },
  { id: "nevertwice", name: "Never twice", desc: "Bounced back after a miss", icon: "trend" },
  { id: "breather", name: "Breather", desc: "Sighed it out before snapping", icon: "wind" },
  { id: "boundary", name: "Boundary boss", desc: "A kind, clear no", icon: "shield" },
  { id: "strong", name: "Strong mama", desc: "Kettlebell reps stacking up", icon: "move" },
  { id: "present", name: "Present", desc: "Phone down, eyes on the kids", icon: "smile" },
  { id: "metime", name: "Me-time defender", desc: "Protected your 20 minutes", icon: "crown" },
];
export const MICRO_JOYS: string[] = [
  "Truth: you've had 37 tabs open in your head since breakfast. Close one. That's it.",
  "Good enough is a complete sentence.",
  "Plot twist: the laundry can stay unfolded in a clean basket. Still counts.",
  "Fed is best. Cereal for dinner is a valid menu.",
  "Your worth isn't measured in a clean kitchen.",
  "You are allowed to rest before you're exhausted.",
  "Asking for help is a skill, not a weakness. You just used it.",
  "Someone in this house thinks you hung the moon. Probably the dog, too.",
  "Hot take: the mental load is a real job. You deserve a raise.",
  "You don't have to earn a break.",
  "Done is better than perfect. And you're done.",
  "Your brain isn't broken. It's running more apps than the phone.",
];
export const ADVENTURES: string[] = [
  "Pajama walk around the block after dinner.",
  "Living-room blanket fort + one movie, phones in another room.",
  "Kitchen dance party: each kid picks one song.",
  "Pancake art breakfast: everyone designs their own shape.",
  "Library trip: everyone picks one book for someone else.",
  "Sidewalk-chalk mural, Mom gets her own square.",
  "Picnic dinner on the floor, no table allowed.",
  "Nature scavenger hunt: 10 things, first to find them all picks dessert.",
  "Bath-bomb science: drop, fizz, guess the color.",
  "Stargazing on a blanket for 15 minutes.",
  "Kids plan the Saturday morning (you say yes to 3 things).",
  "Make-your-own pizza night, everyone gets a topping job.",
];
export const TREATS: string[] = [
  "Treat yourself: 20 guilt-free minutes of anything you like tonight.",
  "Treat yourself: your favorite coffee tomorrow, someone else brings it.",
  "Treat yourself: a long hot shower, door locked, zero guilt.",
  "Treat yourself: you pick the takeout this week.",
  "Treat yourself: one evening with zero 'shoulds'.",
];
export interface Reward { kind: "badge" | "joy" | "adventure" | "treat"; id: string; title: string; body: string; icon: string; }
/** ~40% chance of a reward. `rnd` is injectable for tests. */
export function rollReward(owned: string[], rnd: () => number = Math.random): Reward | null {
  if (rnd() >= 0.4) return null;
  const left = BADGES.filter((b) => owned.indexOf(b.id) < 0);
  const kinds: Reward["kind"][] = left.length ? ["badge", "joy", "adventure", "treat"] : ["joy", "adventure", "treat"];
  const kind = kinds[Math.floor(rnd() * kinds.length) % kinds.length];
  if (kind === "badge") { const b = left[Math.floor(rnd() * left.length) % left.length]; return { kind, id: b.id, title: `Badge unlocked: ${b.name}`, body: `${b.desc}. It's on your badge shelf in More.`, icon: "award" }; }
  if (kind === "joy") { const i = Math.floor(rnd() * MICRO_JOYS.length) % MICRO_JOYS.length; return { kind, id: `joy${i}`, title: "A little truth for you", body: MICRO_JOYS[i], icon: "spark" }; }
  if (kind === "adventure") { const i = Math.floor(rnd() * ADVENTURES.length) % ADVENTURES.length; return { kind, id: `adv${i}`, title: "Mini family adventure unlocked", body: ADVENTURES[i], icon: "mapPin" }; }
  const i = Math.floor(rnd() * TREATS.length) % TREATS.length;
  return { kind, id: `treat${i}`, title: "Nice work", body: TREATS[i], icon: "gift" };
}

// ---------- Weekly family boss challenge (Sunday) ----------
export const BOSSES: { name: string; how: string }[] = [
  { name: "Phone-free family hour", how: "Every phone in a basket for 60 minutes. Board game, walk, or just hang out." },
  { name: "Reset-the-house power hour", how: "Music on, 3 x 15-min timers, everyone owns one room. Takeout after." },
  { name: "Cook dinner together", how: "Kids pick the meal, everyone gets one job, you supervise from a chair." },
  { name: "Screen-free game night", how: "Cards, board game or charades. Loser does the dishes." },
  { name: "Family walk + one question each", how: "30-minute walk. Everyone asks one question nobody has asked before." },
  { name: "Gratitude round + dessert", how: "Everyone says three things they liked about the week, then dessert." },
];
export function bossOf(d: Date): { name: string; how: string } { const wk = Math.floor(dayIndex(plusDays(d, -((d.getDay() + 6) % 7))) / 7); return BOSSES[((wk % BOSSES.length) + BOSSES.length) % BOSSES.length]; }

// ---------- Connection + self content ----------
export const AFFIRMATIONS_ME: string[] = [
  "I am a good mom on the days it looks messy, too.",
  "My needs matter as much as everyone else's.",
  "I can do the minimum today and still be enough.",
  "Asking for help is how strong families work.",
  "My brain is different, not deficient.",
  "I don't have to carry the whole house in my head.",
  "Rest is part of the plan, not a reward for finishing it.",
  "I can feel big feelings and still choose my next step.",
  "I'm allowed to change my mind, say no, and take up space.",
  "Missed days are data, not character.",
  "I am learning to be as kind to myself as I am to my kids.",
  "Progress, not perfect. Connection, not control.",
  "I can be a work person, a mom and a partner without being all three at once.",
  "Today I'll notice one thing I did right.",
];
export const AFFIRMATIONS_KIDS: string[] = [
  "I love being your mom.", "I noticed how hard you tried on that.", "You make me laugh every day.", "I'm proud of how kind you were.",
  "You can do hard things.", "I love spending time with you.", "Nothing you do could make me stop loving you.", "I like the way your brain works.",
  "Thank you for helping, that made my day easier.", "You were brave today.", "Mistakes are how we learn. I make them too.", "I'm glad you're you.",
];
export const QUESTIONS: string[] = [
  "What made you laugh today?", "Who did you sit with at lunch?", "What was the hardest part of your day?", "What's something you learned that surprised you?",
  "What was the best 5 minutes of your day?", "What's one thing you'd change about today?", "Did anything make you feel proud?",
  "If you could have any superpower tomorrow, which one and why?", "What's something you're looking forward to this week?",
  "Rose, bud, thorn: one good thing, one you're excited for, one hard thing?", "If today was a color, what color was it?",
  "What do you want to do together this weekend?", "What did you do today that helped someone?", "Teach me one new word you heard today.",
];
export const GRATITUDE_PROMPTS: string[] = [
  "One thing that made you smile today.", "Someone who helped you today.", "Something about our home you love.",
  "Something you're looking forward to.", "Something that was hard but went OK.", "A person in our family and why.",
];

// ---------- If-then plans ----------
export const IF_THEN_DEFAULT: string[] = [
  "If I pull into the driveway, then 3 slow sighs in the car before I go in.",
  "If I walk in the door, then shoes off, hands washed, 15 minutes to land before I'm 'on'.",
  "If my overwhelm hits 4, then I pick ONE thing and ask for help with one more.",
  "If I'm about to say yes to something new, then I say \"Let me check and get back to you.\"",
  "If I snap at the kids, then I repair within the hour (\"I'm sorry I yelled, I love you\").",
  "If I miss a day, then tomorrow is the minimum, no catch-up.",
];

// ---------- Overwhelm, burnout, cycle (pure, tested) ----------
export const TRIGGERS: { id: string; label: string }[] = [
  { id: "noise", label: "Noise" }, { id: "clutter", label: "Clutter" }, { id: "todo", label: "To-do pile" }, { id: "sleep", label: "Low sleep" },
  { id: "hormones", label: "Hormones" }, { id: "touched", label: "Touched out" }, { id: "kids", label: "Kids' needs" }, { id: "work", label: "Work spillover" },
  { id: "partner", label: "Partner stuff" }, { id: "hungry", label: "Hungry" }, { id: "alone", label: "Doing it alone" }, { id: "screens", label: "Screens" },
];
export interface CheckIn { mood?: number; energy?: number; focus?: number; irrit?: number; sleep?: number; over?: number; triggers?: string[]; meds?: "yes" | "no" | "na"; note?: string; }

/**
 * Burnout early warning from daily overwhelm (1-5, oldest -> newest, null = not logged).
 * "watch": 2 of the last 3 logged days at 4+. "high": 3+ of the last 5 logged days at 4+, or a 7-day average of 4+.
 */
export function burnoutRisk(over: (number | null | undefined)[]): { level: "ok" | "watch" | "high"; highDays: number; avg7: number | null } {
  const logged = over.filter((v): v is number => typeof v === "number");
  const last5 = logged.slice(-5); const last3 = logged.slice(-3); const last7 = over.slice(-7).filter((v): v is number => typeof v === "number");
  const highDays = last5.filter((v) => v >= 4).length;
  const avg7 = last7.length ? last7.reduce((a, b) => a + b, 0) / last7.length : null;
  if (highDays >= 3 || (avg7 !== null && last7.length >= 4 && avg7 >= 4)) return { level: "high", highDays, avg7 };
  if (last3.filter((v) => v >= 4).length >= 2) return { level: "watch", highDays, avg7 };
  return { level: "ok", highDays, avg7 };
}

/** Cycle day (1-based) for `d` given the last period start; null if unknown or the start is in the future. Wraps by cycle length. */
export function cycleDay(startIso: string | undefined, len: number, d: Date): number | null {
  if (!startIso || !/^\d{4}-\d{2}-\d{2}$/.test(startIso)) return null;
  const p = startIso.split("-").map(Number); const s = new Date(p[0], p[1] - 1, p[2]);
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((t.getTime() - s.getTime()) / 86400000);
  if (diff < 0) return null;
  const L = Math.max(20, Math.min(45, Math.round(len || 28)));
  return (diff % L) + 1;
}
export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal" | "premenstrual";
/** Rough phase from cycle day. Ovulation is estimated ~14 days before the next period. */
export function cyclePhase(day: number, len: number): Phase {
  const L = Math.max(20, Math.min(45, Math.round(len || 28))); const ov = L - 14;
  if (day <= 5) return "menstrual";
  if (day < ov - 1) return "follicular";
  if (day <= ov + 1) return "ovulation";
  if (day > L - 5) return "premenstrual";
  return "luteal";
}
export const PHASE_LABEL: Record<Phase, string> = { menstrual: "Period", follicular: "Follicular", ovulation: "Ovulation (est.)", luteal: "Luteal", premenstrual: "Late luteal / premenstrual" };
export const PHASE_NOTE: Record<Phase, string> = {
  menstrual: "Energy can be lower. Gentle movement and the minimum list are full wins.",
  follicular: "Often a better-energy window. A good week for the harder tasks.",
  ovulation: "Estimated. Many women feel social and energetic around now.",
  luteal: "Some women with ADHD notice focus and mood dip after ovulation. Plan lighter if that's you.",
  premenstrual: "Many women with ADHD report symptoms feel worse in the days before a period, and some notice meds feel weaker. Lower the bar and ask for help early.",
};
/** Compares average overwhelm in luteal+premenstrual days vs other days. Needs 3+ of each. */
export function lutealPattern(over: (number | null | undefined)[], phases: (Phase | null)[]): string | null {
  const a: number[] = []; const b: number[] = [];
  over.forEach((v, i) => { const ph = phases[i]; if (typeof v !== "number" || !ph) return; (ph === "luteal" || ph === "premenstrual" ? a : b).push(v); });
  if (a.length < 3 || b.length < 3) return null;
  const avg = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
  if (avg(a) - avg(b) >= 0.7) return `Overwhelm averaged ${avg(a).toFixed(1)} in the second half of your cycle vs ${avg(b).toFixed(1)} otherwise. Worth planning lighter weeks, and worth mentioning to your clinician.`;
  return null;
}

/** Gentle, non-diagnostic pattern notes from check-ins (oldest -> newest), plus optional moved-day flags. */
export function patternNotes(checks: (CheckIn | undefined)[], moved?: boolean[]): string[] {
  const notes: string[] = [];
  const full = checks.filter((c): c is CheckIn => !!c);
  const roughOver = full.filter((c) => c.sleep !== undefined && c.sleep < 3 && ((c.over ?? c.irrit) ?? 0) >= 4).length;
  if (roughOver >= 2) notes.push("Rough-sleep days tend to be high-overwhelm days. Plan the minimum and protect bedtime.");
  const lowSleepFocus = full.filter((c) => c.sleep !== undefined && c.sleep < 3 && c.focus !== undefined && c.focus <= 2).length;
  if (lowSleepFocus >= 2) notes.push("Low-sleep days often line up with low focus. Put the one important task first on those days.");
  if (moved && moved.length === checks.length) {
    const a: number[] = []; const b: number[] = [];
    checks.forEach((c, i) => { if (c && c.mood !== undefined) (moved[i] ? a : b).push(c.mood); });
    if (a.length >= 3 && b.length >= 3) {
      const avg = (x: number[]) => x.reduce((s, v) => s + v, 0) / x.length;
      if (avg(a) - avg(b) >= 0.5) notes.push(`On days you moved, mood averaged ${avg(a).toFixed(1)} vs ${avg(b).toFixed(1)}. Even a 10-minute walk counts.`);
    }
  }
  const counts: Record<string, number> = {};
  full.forEach((c) => (c.triggers || []).forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
  const top = Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0];
  if (top && counts[top] >= 3) { const l = (TRIGGERS.find((t) => t.id === top) || { label: top }).label; notes.push(`"${l}" is your most common overwhelm trigger lately (${counts[top]} days). One small fix there may pay off most.`); }
  return notes;
}

// ---------- Talk: soft startup builder ----------
/**
 * Builds a Gottman-style softened start-up / NVC request:
 * "I'm feeling X about Y. I need Z. Would you W?" Each part is optional except feeling or need.
 */
export function softStartup(p: { feel?: string[]; about?: string; need?: string; ask?: string; appreciate?: string; partner?: string }): string {
  const clean = (x?: string) => (x || "").trim().replace(/[.!?\s]+$/, "");
  const lower1 = (x: string) => (x && !/^I\b/.test(x) ? x.charAt(0).toLowerCase() + x.slice(1) : x);
  const feels = (p.feel || []).map((f) => f.trim().toLowerCase()).filter(Boolean);
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
  const out: string[] = [];
  const about = lower1(clean(p.about));
  if (clean(p.appreciate)) out.push(`I really appreciate ${lower1(clean(p.appreciate))}.`);
  if (feels.length) out.push(`I'm feeling ${join(feels)}${about ? ` about ${about}` : ""}.`);
  else if (about) out.push(`I want to talk about ${about}.`);
  if (clean(p.need)) out.push(`I need ${lower1(clean(p.need))}.`);
  if (clean(p.ask)) out.push(`Would you be willing to ${lower1(clean(p.ask)).replace(/^(would you|could you|can you|please)\s+/i, "")}?`);
  if (!out.length) return "";
  const name = clean(p.partner);
  return ((name ? `Hey ${name}, ` : "") + out.join(" ")).replace(/\s+/g, " ").trim();
}

// ---------- Home Life: fair share ----------
export interface ShareChore { who: string; freq: "daily" | "weekly" | "days"; days: number[]; mins?: number; mental?: boolean; }
/** Estimated minutes per week per owner. Mental-load cards count their minutes too (noticing + planning is work). */
export function fairShare(chores: ShareChore[]): Record<string, number> {
  const out: Record<string, number> = {};
  chores.forEach((c) => {
    const per = c.freq === "daily" ? 7 : c.freq === "weekly" ? 1 : c.days.length;
    const m = (c.mins || 15) * per;
    out[c.who] = (out[c.who] || 0) + m;
  });
  return out;
}

/** Parses "95", "1:35", "1h 35m", "1h", "35m" into minutes. */
export function parseMinutes(s: string): number | undefined {
  const t = (s || "").trim().toLowerCase();
  if (!t) return undefined;
  let m = t.match(/^(\d+):(\d{1,2})$/); if (m) return Number(m[1]) * 60 + Number(m[2]);
  m = t.match(/^(?:(\d+)\s*h(?:rs?|ours?)?)?\s*(?:(\d+)\s*m(?:in(?:s|utes)?)?)?$/);
  if (m && (m[1] || m[2])) return Number(m[1] || 0) * 60 + Number(m[2] || 0);
  if (/^\d+(\.\d+)?$/.test(t)) return Math.round(Number(t));
  return undefined;
}
export function fmtMin(n: number): string { const h = Math.floor(n / 60); const m = Math.round(n % 60); return h ? `${h}h ${m}m` : `${m}m`; }

// ---------- Soft chime (Web Audio) ----------
let ac: any = null;
export function chime() {
  try {
    const C: any = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
    if (!C) return;
    ac = ac || new C();
    if (ac.state === "suspended") ac.resume();
    const t0 = ac.currentTime;
    [880, 1318.5].forEach((f, i) => {
      const o = ac.createOscillator(); const g = ac.createGain();
      o.type = "sine"; o.frequency.value = f;
      const s = t0 + i * 0.16;
      g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.12, s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.9);
      o.connect(g); g.connect(ac.destination); o.start(s); o.stop(s + 0.95);
    });
  } catch (_e) {}
}
export function buzz() { try { if ((globalThis as any).navigator && navigator.vibrate) navigator.vibrate([200, 80, 200]); } catch (_e) {} }
