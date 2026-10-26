import { streakInfo, isoDay, plusDays, rollReward, levelOf, bossOf, patternNotes, parseMinutes, burnoutRisk, cycleDay, cyclePhase, lutealPattern, softStartup, fairShare } from "../src/adhd";
let fail = 0;
const eq = (name: string, got: any, want: any) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(`${ok ? "PASS" : "FAIL"} ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };
// Today = Thu 2026-10-29. Week Mon 10/26 - Sun 11/1.
const today = new Date(2026, 9, 29);
const mk = (done: string[]) => (d: Date) => done.indexOf(isoDay(d)) >= 0;
const days = (offs: number[]) => offs.map((o) => isoDay(plusDays(today, o)));
// 1. One miss keeps the chain: done -5..-2, miss -1, today pending
eq("one miss keeps chain (today pending)", streakInfo(mk(days([-5, -4, -3, -2])), today).streak, 4);
eq("one miss keeps chain + today done", streakInfo(mk(days([-5, -4, -3, -2, 0])), today).streak, 5);
eq("missRun after one miss", streakInfo(mk(days([-5, -4, -3, -2])), today).missRun, 1);
// 2. Two misses end it. Misses on -2 (Tue) and -1 (Wed) are the same week -> freeze covers the 2nd one.
eq("two misses, freeze available -> covered", streakInfo(mk(days([-6, -5, -4, -3, 0])), today).streak, 5);
eq("freeze used this week", streakInfo(mk(days([-6, -5, -4, -3, 0])), today).freezeLeft, false);
// freeze already used earlier this week (Mon -3 & ... ) : Week Mon 10/26 (-3). Use 10/19 week for setup.
// Misses Mon -3 and Tue -2 (freeze covers Tue), done Wed -1? Then misses... build: done -10..-4, miss -3, miss -2 (frozen), done -1, today done
eq("freeze covers miss pair", streakInfo(mk(days([-10, -9, -8, -7, -6, -5, -4, -1, 0])), today).streak, 9);
// Now a second pair of misses in the same week: done -10..-5 (Mon 10/19..Sat 10/24), miss Sun -4? Use same week 10/26: miss Mon -3, Tue -2 (freeze), Wed -1 done, then today... need another pair in same week -> use earlier week instead.
// Week 10/19-10/25: offsets -10 (10/19 Mon) .. -4 (10/25 Sun). Done -14..-11, miss -10,-9 (freeze), done -8, miss -7,-6 (no freeze) -> chain ends; done -5..0 -> 6
eq("second miss pair in same week ends chain", streakInfo(mk(days([-14, -13, -12, -11, -8, -5, -4, -3, -2, -1, 0])), today).streak, 6);
// Two misses across a week boundary where the new week's freeze covers: done ..., miss Sun -4, miss Mon -3 (new week freeze) -> alive
eq("cross-week misses, freeze covers", streakInfo(mk(days([-8, -7, -6, -5, -2, -1, 0])), today).streak, 7);
// Three misses in a row: miss, frozen, miss -> ends
eq("three misses in a row end chain", streakInfo(mk(days([-8, -7, -6, -5, 0])), today).streak, 1);
// last14
eq("last14 count", streakInfo(mk(days([-20, -13, -5, -1, 0])), today).last14, 4);
// empty
eq("no data", streakInfo(mk([]), today).streak, 0);
// rewards ~40%
let n = 0; const N = 20000; for (let i = 0; i < N; i++) if (rollReward([])) n++;
eq("reward rate ~40%", Math.abs(n / N - 0.4) < 0.02, true);
eq("level at 0", levelOf(0).cur.name, "Spark");
eq("level at 450", levelOf(450).cur.name, "Spark");
eq("level at 600", levelOf(600).cur.name, "Juggler");
eq("level at 7500", levelOf(7500).cur.name, "Legendary ADHDiva");
eq("boss same all week", bossOf(new Date(2026, 9, 26)).name === bossOf(new Date(2026, 10, 1)).name, true);
eq("boss changes weekly", bossOf(new Date(2026, 10, 1)).name !== bossOf(new Date(2026, 10, 2)).name, true);
eq("pattern: rough sleep + snappy", patternNotes([{ sleep: 2, irrit: 4 }, { sleep: 3, irrit: 2 }, { sleep: 1, irrit: 5 }]).length > 0, true);
eq("pattern: none on good days", patternNotes([{ sleep: 4, irrit: 2 }, { sleep: 5, irrit: 1 }]).length, 0);
eq("parse 1:35", parseMinutes("1:35"), 95);
eq("parse 2h 10m", parseMinutes("2h 10m"), 130);
eq("parse 45", parseMinutes("45"), 45);
eq("parse junk", parseMinutes("abc"), undefined);
// burnout early warning
eq("burnout ok on calm days", burnoutRisk([2, 3, 2, null, 3]).level, "ok");
eq("burnout watch: 2 of last 3 high", burnoutRisk([2, 2, 4, 3, 5]).level, "watch");
eq("burnout high: 3 of last 5 high", burnoutRisk([4, 2, 5, 3, 4]).level, "high");
eq("burnout high: 7-day avg >= 4", burnoutRisk([null, 4, 4, null, 4, 4, null]).level, "high");
eq("burnout highDays count", burnoutRisk([5, 5, 1, 4, 1]).highDays, 3);
eq("burnout empty", burnoutRisk([]).level, "ok");
// cycle
eq("cycle day 1 on start", cycleDay("2026-10-01", 28, new Date(2026, 9, 1)), 1);
eq("cycle day 14", cycleDay("2026-10-01", 28, new Date(2026, 9, 14)), 14);
eq("cycle wraps", cycleDay("2026-10-01", 28, new Date(2026, 9, 29)), 1);
eq("cycle future start null", cycleDay("2026-11-05", 28, new Date(2026, 9, 29)), null);
eq("cycle bad date null", cycleDay("nope", 28, new Date(2026, 9, 29)), null);
eq("cycle length clamped", cycleDay("2026-10-01", 5, new Date(2026, 9, 21)), 1);
eq("phase menstrual", cyclePhase(3, 28), "menstrual");
eq("phase follicular", cyclePhase(9, 28), "follicular");
eq("phase ovulation", cyclePhase(14, 28), "ovulation");
eq("phase luteal", cyclePhase(19, 28), "luteal");
eq("phase premenstrual", cyclePhase(26, 28), "premenstrual");
eq("phase ovulation 32-day", cyclePhase(18, 32), "ovulation");
eq("luteal pattern flagged", lutealPattern([2, 2, 2, 4, 4, 5], ["follicular", "follicular", "menstrual", "luteal", "premenstrual", "luteal"]) !== null, true);
eq("luteal pattern needs 3 each", lutealPattern([2, 4, 4, 5], ["follicular", "luteal", "luteal", "luteal"]), null);
eq("luteal pattern none if flat", lutealPattern([3, 3, 3, 3, 3, 3], ["follicular", "follicular", "follicular", "luteal", "luteal", "luteal"]), null);
// soft start-up
eq("soft startup full", softStartup({ partner: "Sam", appreciate: "you did bath time", feel: ["overwhelmed", "Exhausted"], about: "Evenings after work", need: "help with this", ask: "Could you take bedtime Tuesdays." }), "Hey Sam, I really appreciate you did bath time. I'm feeling overwhelmed and exhausted about evenings after work. I need help with this. Would you be willing to take bedtime Tuesdays?");
eq("soft startup 3 feelings", softStartup({ feel: ["a", "b", "c"] }), "I'm feeling a, b and c.");
eq("soft startup about only", softStartup({ about: "the laundry" }), "I want to talk about the laundry.");
eq("soft startup empty", softStartup({}), "");
// fair share
const fs = fairShare([{ who: "me", freq: "daily", days: [], mins: 20 }, { who: "partner", freq: "weekly", days: [], mins: 60 }, { who: "me", freq: "days", days: [1, 3], mins: 30 }, { who: "shared", freq: "daily", days: [] }]);
eq("fair share me", fs.me, 200);
eq("fair share partner", fs.partner, 60);
eq("fair share default 15 min", fs.shared, 105);
if (fail) { console.log(`${fail} FAILED`); process.exit(1); } else console.log("ALL PASS");
