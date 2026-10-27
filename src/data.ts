// Content and defaults for ADHDiva (no React).
import { CheckIn } from "./adhd";

export type Mode = "full" | "min";
/** who: "me" | "partner" | "kid0".. | "shared". mental = invisible/mental-load card (noticing, planning, remembering). */
export interface Chore { id: string; name: string; freq: "daily" | "weekly" | "days"; days: number[]; who: string; mins?: number; mental?: boolean; }
export interface Reminder { id: string; name: string; time: string; days: number[]; perKid?: boolean; }
export interface OverTap { t: string; v: number; }
export interface DayRec {
  c: Record<string, boolean>;
  mode: Record<string, Mode>;
  min: Record<string, boolean>;
  hugs?: number;
  check?: CheckIn;
  overLog?: OverTap[];
  period?: boolean;
  ex?: Record<string, boolean>;
  agenda?: Record<string, boolean>;
  land?: Record<string, boolean>;
}
export interface BrainItem { id: string; text: string; done?: boolean; }
export interface Store {
  v: 1;
  days: Record<string, DayRec>;
  chores: Chore[];
  reminders: Reminder[];
  ifThen: string[];
  agreements: string[];
  brain: BrainItem[];
  badges: { id: string; date: string }[];
  rewards: { date: string; kind: string; id: string; title: string; body: string }[];
  scripts?: { id: string; text: string; date: string }[];
  startDate?: string;
}
export interface Ui {
  name?: string; partner?: string; kids: string[]; dark?: boolean; workoutDays: number[]; workoutTime: string; homeTime: string; dinnerTime: string;
  landMins: number; kindSeen?: string; kidHelper?: boolean; breath?: "sigh" | "box" | "478"; affOff?: number;
  cycle?: boolean; cycleStart?: string; cycleLen: number;
  /** Daily Readings card on Home + optional row on Today. undefined = on. */
  readings?: boolean;
}

export const STORE_KEY = "adhdiva-v1";
export const UI_KEY = "adhdiva-ui";
export const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const DEFAULT_UI: Ui = { kids: ["Kid 1", "Kid 2"], partner: "", workoutDays: [1, 3, 5], workoutTime: "06:30", homeTime: "17:30", dinnerTime: "18:15", landMins: 15, breath: "sigh", cycleLen: 28 };

// Fair Play-style cards: whoever owns a card owns noticing, planning AND doing it.
export const DEFAULT_CHORES: Chore[] = [
  { id: "dinner", name: "Dinner (plan, cook)", freq: "days", days: [1, 2, 3, 4, 5], who: "me", mins: 45 },
  { id: "dishes", name: "Dishes + kitchen reset", freq: "daily", days: [], who: "partner", mins: 20 },
  { id: "laundry", name: "Laundry (one load, start to put away)", freq: "days", days: [1, 4], who: "me", mins: 40 },
  { id: "groceries", name: "Groceries (list + shop)", freq: "weekly", days: [6], who: "partner", mins: 75 },
  { id: "trash", name: "Trash + recycling to the curb", freq: "days", days: [2], who: "partner", mins: 10 },
  { id: "bath", name: "Kids' bath + bedtime", freq: "days", days: [0, 2, 4], who: "partner", mins: 40 },
  { id: "lunches", name: "School lunches + backpacks", freq: "days", days: [0, 1, 2, 3, 4], who: "me", mins: 15 },
  { id: "tidy", name: "10-min tidy (timer, everyone)", freq: "daily", days: [], who: "shared", mins: 10 },
  { id: "toys", name: "Pick up toys", freq: "daily", days: [], who: "kid0", mins: 10 },
  { id: "school", name: "School forms, emails, permission slips", freq: "weekly", days: [0], who: "me", mins: 30, mental: true },
  { id: "appts", name: "Doctor + dentist appointments", freq: "weekly", days: [3], who: "me", mins: 20, mental: true },
  { id: "gifts", name: "Birthdays, gifts, party RSVPs", freq: "weekly", days: [5], who: "me", mins: 20, mental: true },
  { id: "meals", name: "Meal plan for the week", freq: "weekly", days: [0], who: "me", mins: 30, mental: true },
  { id: "bills", name: "Bills + budget check", freq: "weekly", days: [0], who: "partner", mins: 20, mental: true },
];

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: "school", name: "Check the school folder / app", time: "18:00", days: [1, 2, 3, 4, 5] },
  { id: "ask", name: "Ask about their day with a specific question", time: "18:30", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "special", name: "10 min 1-on-1 'special time'", time: "19:00", days: [0, 1, 2, 3, 4, 5, 6], perKid: true },
  { id: "good", name: "Catch them being good and say it", time: "19:15", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "story", name: "Bedtime story + snuggle", time: "19:45", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "partnercheck", name: "15-min partner check-in (Talk tab)", time: "20:30", days: [0] },
  { id: "date", name: "Date night or a real conversation", time: "20:00", days: [5] },
];
export const REM_MIN: Record<string, number> = { special: 25, story: 20, date: 120, partnercheck: 20, ask: 15, school: 10, good: 10 };

/** Core daily checklist on Today. `min` = the Minimum version. */
export const TODAY_ITEMS: { key: string; label: string; min?: string; sub?: string }[] = [
  { key: "checkin", label: "30-second overwhelm check-in", sub: "Mind tab, a few taps" },
  { key: "land", label: "Come-home landing ritual", min: "3 slow sighs in the car + shoes off" },
  { key: "move", label: "Move", min: "1 round / about 5 min" },
  { key: "x:eat", label: "Real food + water before 2 PM", min: "A protein snack + a full glass of water" },
  { key: "rem:special", label: "10 min 1-on-1 with each kid", min: "2 min each: their choice, phone away" },
  { key: "x:ask", label: "Ask for help with one thing", min: "Hand off one tiny thing" },
  { key: "x:me", label: "20 minutes just for me", min: "5 minutes, door closed" },
  { key: "t:bed", label: "Screens down 30 min before bed" },
];
export const MINABLE = ["land", "move", "x:eat", "rem:special", "x:ask", "x:me"];

export const CONNECT_MOMENTS: { key: string; label: string; sub: string; timer?: number }[] = [
  { key: "x:floor", label: "5-minute floor play", sub: "Get on the floor, play their game, no phone", timer: 300 },
  { key: "rem:ask", label: "Ask the question of the day", sub: "" },
  { key: "x:gratitude", label: "Gratitude round at dinner", sub: "" },
  { key: "rem:good", label: "Catch them being good and say it", sub: "Name the exact thing they did" },
  { key: "rem:story", label: "Bedtime story + snuggle", sub: "Phone in another room" },
];

// ---------- Come-home transition ----------
export const LANDING_STEPS: { id: string; label: string; sub: string; min?: boolean }[] = [
  { id: "car", label: "3 slow sighs before you walk in", sub: "In the car, on the bus, at the door. Double inhale, long exhale.", min: true },
  { id: "park", label: "Park work", sub: "Type tomorrow's first work task in the brain dump. Work stays parked." },
  { id: "body", label: "Shoes off, wash hands, comfy clothes", sub: "A sensory 'I'm home' signal for your nervous system.", min: true },
  { id: "decomp", label: "Decompress (timer)", sub: "Quiet room, headphones, snack, shower or lie down. Not chores. Not scrolling the to-do list." },
  { id: "hello", label: "Re-enter: one real hello to each person", sub: "Eyes, hug, one question. Then you're on." },
];
export const LANDING_SCRIPT = (partner: string, mins: number) => `Hey${partner ? ` ${partner}` : ""}, I'm almost home. Could you keep the kids busy for my first ${mins} minutes so I can land? Then I'm all in.`;

// ---------- Talk ----------
export const FEELINGS: string[] = ["overwhelmed", "exhausted", "stretched thin", "touched out", "anxious", "frustrated", "lonely", "invisible", "hurt", "behind", "on edge", "sad", "hopeful", "grateful"];
export const NEEDS: { label: string; text: string }[] = [
  { label: "A break", text: "a short break to reset" },
  { label: "Help", text: "help with this" },
  { label: "To be heard", text: "to be heard, not fixed" },
  { label: "A plan", text: "us to make a plan together" },
  { label: "Quiet", text: "some quiet" },
  { label: "Rest", text: "rest" },
  { label: "Teamwork", text: "to feel like we're a team" },
  { label: "Appreciation", text: "to know what I do is seen" },
  { label: "Connection", text: "some time together" },
  { label: "Clarity", text: "to know who's handling what" },
];

export interface Script { id: string; to: string; title: string; text: (p: string, kid: string) => string; }
export const HELP_SCRIPTS: Script[] = [
  { id: "land", to: "Partner", title: "Landing time after work", text: (p) => `Hey${p ? ` ${p}` : ""}, I'm almost home. Could you take the kids for my first 15 minutes so I can land? Then I'm all in.` },
  { id: "rating", to: "Partner", title: "I'm at a 4 out of 5", text: () => `I'm at a 4 out of 5 on overwhelm tonight. Could you take dinner cleanup? I'll do bedtime.` },
  { id: "own", to: "Partner", title: "Own a whole card", text: () => `Would you take over school forms completely, noticing, planning and doing? It would really lighten my mental load to stop tracking it.` },
  { id: "listen", to: "Partner", title: "Listen, don't fix", text: () => `I need to vent for 5 minutes. I don't need solutions right now, just a hug and "that sounds hard."` },
  { id: "remind", to: "Partner", title: "External reminder", text: () => `Could you text me at 3 PM to remember pickup? My brain drops it when work gets busy, and a text really helps.` },
  { id: "trade", to: "Partner", title: "Trade a task", text: () => `Can we swap this week? I'll do groceries if you do laundry. I'm running low on the energy laundry takes.` },
  { id: "sleep", to: "Partner", title: "Protect my sleep", text: () => `I'm running on empty. Could you take the early wake-up on Saturday so I can sleep in? I'll take Sunday for you.` },
  { id: "friend", to: "Friend / family", title: "Childcare swap", text: () => `Could you take the kids Saturday 10 to 12? I'd love to return the favor next weekend.` },
  { id: "meal", to: "Friend / family", title: "Bring a meal", text: () => `This week is a lot. If you're cooking anyway, could you make a double batch for us? I'd be so grateful.` },
  { id: "kids", to: "Kids", title: "Ask the kids", text: (_p, k) => `${k}, I need your help: can you set the table while I finish dinner? You're a great helper.` },
  { id: "work", to: "Work", title: "Prioritize, don't add", text: () => `I can do X by Friday or Y by Wednesday, but not both well. Which matters more?` },
  { id: "doctor", to: "Clinician", title: "Bring it to a clinician", text: () => `My ADHD symptoms and mood seem worse in the week before my period, and my medication feels weaker then. Can we talk about options?` },
];
export const BOUNDARY_SCRIPTS: { title: string; text: string }[] = [
  { title: "The pause (stops the impulsive yes)", text: "Let me check my calendar and get back to you tomorrow." },
  { title: "Kind, clear no", text: "Thanks for thinking of me. I can't take that on right now." },
  { title: "Partial yes", text: "I can do the snacks, but not the whole party setup." },
  { title: "At capacity", text: "I'm at capacity this month. Ask me again in a few weeks?" },
  { title: "No reason needed", text: "That doesn't work for me, but I hope it goes great." },
  { title: "Pause a hard talk", text: "I'm getting flooded. Can we take 20 minutes and come back to this at 8:30?" },
  { title: "Protect me-time", text: "I'm taking my 20 minutes now. I'll be back at 7:40." },
  { title: "Touched out", text: "I love you. My body needs a no-touch break for 10 minutes, then cuddles." },
];
export const DEFAULT_AGREEMENTS: string[] = [
  "Whoever owns a card owns all of it: noticing, planning and doing. No 'just tell me what to do'.",
  "Whoever gets home from work gets 15 minutes to land before they're on.",
  "\"I'm at a 4\" means take one thing off my plate tonight, no debate.",
  "We put it in the shared calendar instead of 'remember to...'.",
  "No big talks after 9 PM or when either of us is hungry or flooded.",
  "Sunday night: 15-minute check-in, appreciations first.",
];
export const AGENDA: { id: string; label: string; sub: string; mins: number }[] = [
  { id: "appr", label: "Appreciations", sub: "Each of you names 3 specific things you appreciated this week.", mins: 3 },
  { id: "good", label: "What went well", sub: "One win each, home or work.", mins: 2 },
  { id: "cal", label: "Next week's calendar", sub: "Pickups, late meetings, appointments, who's on dinner. Put it in the shared calendar now.", mins: 4 },
  { id: "cards", label: "Fair-share cards", sub: "Any card to hand off or trade? Open Home Life › Fair share together.", mins: 2 },
  { id: "issue", label: "One issue, max", sub: "Soft start-up only: I feel / I need. Listener sums it up before replying.", mins: 3 },
  { id: "love", label: "What would help you feel loved this week?", sub: "Each answers. Keep it small and doable.", mins: 1 },
];

// ---------- Move ----------
export interface Exercise { id: string; name: string; demo: string; dose: string; cue: string; kid: string; equip: string; }
export const EXERCISES: Record<string, Exercise> = {
  goblet: { id: "goblet", name: "Goblet squat", demo: "goblet", dose: "8-10 reps", cue: "Bell at the chest, sit between the hips, chest tall. Pain-free depth only.", kid: "Kid does air squats facing you and counts out loud.", equip: "Kettlebell or dumbbell" },
  kbdl: { id: "kbdl", name: "Kettlebell deadlift", demo: "kbdl", dose: "8-10 reps", cue: "Bell between the feet, push the hips back, flat back, stand tall.", kid: "Kid checks your back is 'flat like a table'.", equip: "Kettlebell" },
  swing: { id: "swing", name: "Kettlebell swing (light)", demo: "swing", dose: "10-12 reps", cue: "Light bell, two hands. It's a hip snap, not a squat or an arm lift.", kid: "Kid stays well clear: they're the 'swing referee' from the couch.", equip: "Light kettlebell" },
  press: { id: "press", name: "Dumbbell floor press", demo: "press", dose: "8-10 reps", cue: "Lie on the floor, elbows about 45 degrees. The floor keeps shoulders safe.", kid: "Kid does push-ups off the couch next to you.", equip: "Two dumbbells" },
  row: { id: "row", name: "One-arm dumbbell row", demo: "row", dose: "8-10 / side", cue: "Hand on the couch, flat back, pull the bell to your hip pocket.", kid: "Kid 'rows' a backpack or water bottle beside you.", equip: "Dumbbell + couch or bench" },
  ohp: { id: "ohp", name: "Dumbbell overhead press", demo: "ohp", dose: "8 reps", cue: "Ribs down, press up without arching. Seated is fine.", kid: "Kid presses two stuffed animals overhead.", equip: "Two dumbbells, chair if seated" },
  lunge: { id: "lunge", name: "Reverse lunge", demo: "lunge", dose: "6-8 / side", cue: "Step back, lower the back knee gently. Hold a wall for balance.", kid: "Lunge-race down the hallway together.", equip: "Bodyweight or light dumbbells" },
  farmer: { id: "farmer", name: "Farmer carry", demo: "farmer", dose: "30-40 s", cue: "Bells at your sides, tall posture, short steps. (Basically carrying groceries, but on purpose.)", kid: "Kid carries two water bottles behind you.", equip: "Two dumbbells or kettlebells" },
  bridge: { id: "bridge", name: "Glute bridge", demo: "bridge", dose: "12-15 reps", cue: "Push through the heels, squeeze at the top, ribs down, lower slowly.", kid: "Make a 'bridge' and let them crawl under it (carefully).", equip: "Floor" },
  deadbug: { id: "deadbug", name: "Dead bug", demo: "deadbug", dose: "6-8 / side", cue: "Low back gently down, reach opposite arm and leg slowly, exhale. Postpartum-friendly core.", kid: "Kid does it next to you; whoever giggles first loses.", equip: "Floor" },
  plank: { id: "plank", name: "Plank", demo: "plank", dose: "20-30 s", cue: "Elbows under shoulders, body in one line. Knees down is a great version.", kid: "Kid times you with a slow countdown.", equip: "Floor" },
  birddog: { id: "birddog", name: "Bird dog", demo: "birddog", dose: "6 / side", cue: "All fours, reach opposite arm and leg, slow, no wobble.", kid: "Balance a small toy on your back; kid checks it stays put.", equip: "Floor" },
  suitcase: { id: "suitcase", name: "Suitcase carry", demo: "suitcase", dose: "20-30 s / side", cue: "One bell in one hand, stay perfectly upright, switch halfway.", kid: "Kid carries a backpack in one hand and copies you.", equip: "One dumbbell or kettlebell" },
};
export const SNACK_MOVES: Exercise[] = [
  { id: "squat", name: "Bodyweight squats", demo: "squat", dose: "1 min, easy pace", cue: "Sit back like into a chair, chest tall.", kid: "", equip: "" },
  { id: "arms", name: "Arm circles", demo: "arms", dose: "1 min", cue: "Small to big, forward then back. Great after a laptop day.", kid: "", equip: "" },
  { id: "catcow", name: "Cat-cow", demo: "catcow", dose: "1 min", cue: "Round up, then let the belly drop, with your breath.", kid: "", equip: "" },
  { id: "incpush", name: "Incline push-ups", demo: "incpush", dose: "1 min, easy reps", cue: "Hands on a counter, body in one line.", kid: "", equip: "" },
  { id: "wgs", name: "World's greatest stretch", demo: "wgs", dose: "1 min, alternate sides", cue: "Big lunge, elbow down, rotate and reach up.", kid: "", equip: "" },
];
export const GENTLE_MOVES: Exercise[] = [
  { id: "catcow", name: "Cat-cow", demo: "catcow", dose: "1 min", cue: "Slow, with your breath. Let the back soften.", kid: "", equip: "" },
  { id: "child", name: "Child's pose", demo: "child", dose: "1 min", cue: "Knees wide, sit back, breathe into the low back. Lovely on period days.", kid: "", equip: "" },
  { id: "hipflex", name: "Kneeling hip flexor", demo: "hipflex", dose: "45 s / side", cue: "Tuck the pelvis under, squeeze the back-leg glute. Undoes the desk chair.", kid: "", equip: "" },
  { id: "bridge", name: "Glute bridge", demo: "bridge", dose: "10 slow reps", cue: "Push through the heels, ribs down, lower slowly.", kid: "", equip: "" },
  { id: "deadbug", name: "Dead bug (slow)", demo: "deadbug", dose: "5 / side", cue: "Exhale as you reach. Gentle core, kind to the pelvic floor.", kid: "", equip: "" },
];
export const WORKOUTS: { id: string; name: string; focus: string; ex: string[] }[] = [
  { id: "A", name: "Workout A", focus: "Squat + push", ex: ["goblet", "press", "bridge", "deadbug", "farmer"] },
  { id: "B", name: "Workout B", focus: "Hinge + pull", ex: ["kbdl", "row", "lunge", "plank", "suitcase"] },
  { id: "C", name: "Workout C", focus: "Swing + press", ex: ["swing", "ohp", "goblet", "birddog", "suitcase"] },
];
export const FULL = { warm: 3, rounds: 3, perEx: 1.2, cool: 2 };
export const MINV = { warm: 1, rounds: 1, perEx: 1, cool: 0 };

export const FALLBACK_TINY: string[] = [
  "Drink a full glass of water.", "Put 5 things back where they belong.", "Eat something with protein.",
  "Clear one surface (just one).", "Step outside for 2 minutes of daylight.", "Text your partner one thing you need tonight.",
  "Put headphones on for 5 minutes of quiet.", "Write the one thing that's buzzing in the brain dump.", "Lie on the floor and do 3 slow sighs.",
];
export const GROUNDING: string[] = ["5 things you can see", "4 things you can feel (feet, chair, fabric, air)", "3 things you can hear", "2 things you can smell", "1 slow breath you can taste"];
export const SENSORY_RESETS: string[] = ["Noise-cancelling headphones or earplugs for 10 min", "Dim the lights or step into a quiet room", "Cold water on wrists and face", "Weighted blanket or a firm hug (if you want touch)", "Step outside: daylight + fresh air", "Ask everyone for 10 minutes of 'library voices'"];
export const SELF_COMPASSION: { step: string; say: string }[] = [
  { step: "Mindfulness", say: "This is a moment of struggle. This is hard right now." },
  { step: "Common humanity", say: "I'm not the only one. So many moms with ADHD feel exactly this." },
  { step: "Self-kindness", say: "May I be kind to myself. What would I say to a friend? Say that, to you." },
];
export const KIND_PROMPTS: string[] = [
  "What's one thing you did right today, even a small one?",
  "If your best friend had your exact day, what would you tell her?",
  "What did your ADHD brain do well today (ideas, humor, crisis mode, creativity)?",
  "What can you drop from today's list without anything bad happening?",
  "What's one need you have right now, and who could help with it?",
];

export const WHY_SOURCES: { title: string; site: string; href: string }[] = [
  { title: "Young et al. 2020: Females with ADHD, expert consensus (masking, internalizing, mothers' needs)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7422602/" },
  { title: "Quinn & Madhoo 2014: ADHD in women and girls, a hidden diagnosis", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4195638/" },
  { title: "Female adult ADHD: comprehensive review (inattention, emotional dysregulation)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11862714/" },
  { title: "Roberts et al.: Reproductive steroids and ADHD symptoms across the menstrual cycle", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5803442/" },
  { title: "ADHD in females: symptoms across hormonal life stages (luteal, postpartum, menopause survey, n=600)", site: "pubmed.ncbi.nlm.nih.gov", href: "https://pubmed.ncbi.nlm.nih.gov/41330200/" },
  { title: "Perimenopausal symptoms in women with and without ADHD (cohort)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12538516/" },
  { title: "Parent training tailored for parents with ADHD (IPSA RCT, 2025)", site: "link.springer.com", href: "https://link.springer.com/article/10.1186/s12888-025-07166-8" },
  { title: "Parent ADHD and evidence-based treatment for their children (review)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5357146/" },
  { title: "Mikolajczak & Roskam: Parental burnout, balance of risks and resources (BR2)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6006266/" },
  { title: "Daminger 2019: The cognitive dimension of household labor (mental load)", site: "doi.org", href: "https://doi.org/10.1177/0003122419859007" },
  { title: "USC Public Exchange: Fair Play study on mental load and women's health", site: "public-exchange.org", href: "https://public-exchange.org/usc/project/household-labor/" },
  { title: "Sonnentag & Bayer 2005: Switching off mentally after work (psychological detachment)", site: "doi.org", href: "https://doi.org/10.1037/1076-8998.10.4.393" },
  { title: "Gottman Institute: Soften your start-up", site: "gottman.com", href: "https://www.gottman.com/blog/softening-startup/" },
  { title: "Gottman Institute: How to have a State of the Union meeting", site: "gottman.com", href: "https://www.gottman.com/blog/how-to-have-a-state-of-the-union-meeting/" },
  { title: "Center for Nonviolent Communication: the 4-part process", site: "nonviolentcommunication.com", href: "https://www.nonviolentcommunication.com/pdf_files/4part_nvc_process.pdf" },
  { title: "CHADD: Rejection can be more painful with ADHD (RSD)", site: "chadd.org", href: "https://chadd.org/adhd-weekly/rejection-can-more-painful-with-adhd/" },
  { title: "CHADD: Adult ADHD and emotions", site: "chadd.org", href: "https://chadd.org/attention-article/adult-adhd-and-emotions/" },
  { title: "ADDitude: Overwhelmed Mom Syndrome is real with ADHD", site: "additudemag.com", href: "https://www.additudemag.com/overwhelmed-mom-with-adhd/" },
  { title: "Self-compassion and mental health in adults with ADHD", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9790285/" },
  { title: "Neff: Self-Compassion Break", site: "self-compassion.org", href: "https://self-compassion.org/exercises/exercise-2-self-compassion-break/" },
  { title: "Balban et al. 2023: Cyclic sighing improves mood and lowers arousal (RCT)", site: "pmc.ncbi.nlm.nih.gov", href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947/" },
  { title: "Atypical sensory profiles are core features of adult ADHD", site: "pubmed.ncbi.nlm.nih.gov", href: "https://pubmed.ncbi.nlm.nih.gov/28371743/" },
  { title: "Lally et al. 2010: How habits form (one missed day doesn't derail a habit)", site: "doi.org", href: "https://doi.org/10.1002/ejsp.674" },
  { title: "Gawrilow & Gollwitzer 2008: If-then plans improve inhibition in ADHD", site: "doi.org", href: "https://doi.org/10.1007/s10608-007-9150-1" },
];
