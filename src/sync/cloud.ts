// Cloud sync engine: Supabase auth + pushing/pulling the private and household rows.
// The app keeps working fully offline; this only runs when the user has signed in.
import { useEffect, useRef, useState } from "react";
import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";
import { AppId, LwwMap, hash, mergeLww, mergeStores, mergeUi, same, splitRows, stableJson, syncShared } from "./merge";

// Public by design: the publishable key only allows what the Row Level Security rules allow.
export const SUPABASE_URL = "https://fitzfjjqoaidkawolove.supabase.co";
export const SUPABASE_KEY = "sb_publishable_mqChAURmww5oZWZVYKDspQ_0q_0b1wu";

let client: SupabaseClient | null = null;
export function sb(app: AppId): SupabaseClient {
  // Each app keeps its own login (separate storage key), even though both live on soulztek.github.io.
  if (!client) client = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { storageKey: `${app}-auth`, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" } });
  return client;
}

interface Meta { uid?: string; prevUid?: string; privSeen?: string; privHash?: string; hid?: string | null; shadow?: LwwMap; at?: number }
const metaKey = (app: AppId) => `${app}-sync`;
function loadMeta(app: AppId): Meta { try { return JSON.parse(localStorage.getItem(metaKey(app)) || "{}") || {}; } catch (_e) { return {}; } }
function saveMeta(app: AppId, m: Meta) { try { localStorage.setItem(metaKey(app), JSON.stringify(m)); } catch (_e) {} }

export interface Household { id: string; name: string; invite_code: string; created_by: string }
export interface Member { user_id: string; role: string; display_name: string; app: string; me: boolean }
export type Status = "off" | "syncing" | "synced" | "offline" | "error";

export function friendlyError(e: any): string {
  const m = String((e && (e.message || e.error_description || e.msg)) || e || "Something went wrong");
  const code = String((e && e.code) || "");
  if (/not authorized/i.test(m) || code === "email_address_not_authorized") return "Supabase can't send email to that address yet (its built-in test mailer only emails project team members). Ask the account owner to turn off \"Confirm email\" or set up SMTP.";
  if (/rate limit/i.test(m)) return "Too many emails sent this hour. Try again later, or sign in with your password.";
  if (/email not confirmed/i.test(m)) return "Confirm your email first: tap the link we sent, then sign in.";
  if (/invalid login/i.test(m)) return "Email or password doesn't match.";
  if (/failed to fetch|network/i.test(m)) return "No connection. Your data is safe on this phone; it will sync later.";
  if (/invite code/i.test(m)) return m.replace(/^.*?(invite code)/i, "Invite code");
  return m;
}

export interface CloudApi {
  ready: boolean; session: Session | null; email: string | null; status: Status; lastSync: number | null; error: string;
  household: Household | null; members: Member[]; pending: string;
  signIn: (email: string, pw: string) => Promise<void>; signUp: (email: string, pw: string) => Promise<void>; magicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>; syncNow: () => Promise<void>; createHousehold: (name: string) => Promise<void>; joinHousehold: (code: string) => Promise<void>; leaveHousehold: () => Promise<void>;
  clearPending: () => void;
}

/**
 * useCloud: wire an app's local state to Supabase.
 * apply(store, ui) is called when the cloud has newer data.
 */
export function useCloud(app: AppId, store: any, ui: any, apply: (s: any, u: any) => void, normalize: (x: any) => any, normUi: (x: any) => any, opts: { mergeStore?: (local: any, remote: any) => any; household?: boolean } = {}): CloudApi {
  const mergeStore = opts.mergeStore || mergeStores; const useHousehold = opts.household !== false;
  const api = sb(app);
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>("off");
  const [lastSync, setLastSync] = useState<number | null>(() => loadMeta(app).at || null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState("");
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const cur = useRef({ store, ui }); cur.current = { store, ui };
  const sessRef = useRef<Session | null>(null); sessRef.current = session;
  const running = useRef<Promise<void> | null>(null); const again = useRef(false);
  const timer = useRef<any>(null);

  const run = async () => {
    const s = sessRef.current; if (!s) return;
    if (typeof navigator !== "undefined" && navigator.onLine === false) { setStatus("offline"); return; }
    setStatus("syncing");
    const uid = s.user.id; let meta = loadMeta(app);
    if (meta.uid !== uid) meta = { uid, prevUid: meta.uid, hid: undefined, shadow: {} };
    let st = cur.current.store, u = cur.current.ui;
    const startHash = hash(stableJson({ store: st, ui: u }));
    const dirty = startHash !== meta.privHash;

    // 1. PRIVATE: pull my own rows.
    const { data: rows, error: e1 } = await api.from("user_data").select("key,data,updated_at").eq("user_id", uid).eq("app", app);
    if (e1) throw e1;
    const rStore = rows?.find((r: any) => r.key === "store"), rUi = rows?.find((r: any) => r.key === "ui");
    const seen = [rStore?.updated_at, rUi?.updated_at].filter(Boolean).sort().pop();
    let remoteHash: string | null = null;
    if (rStore) {
      const remS = normalize(rStore.data), remU = normUi(rUi ? rUi.data : {});
      remoteHash = hash(stableJson({ store: remS, ui: remU }));
      if (seen !== meta.privSeen) {
        if (meta.prevUid && meta.prevUid !== uid && !meta.privSeen) { st = remS; u = remU; } // a different account used this phone before: take this account's data
        else if (dirty) { st = mergeStore(st, remS); u = mergeUi(u, remU); }
        else { st = remS; u = remU; }
      }
    }

    // 2. HOUSEHOLD: my membership, the household, members and the shared rows.
    let hid: string | null = null;
    if (useHousehold) {
      const { data: mem, error: e2 } = await api.from("household_members").select("household_id").eq("user_id", uid).maybeSingle();
      if (e2) throw e2;
      hid = mem ? mem.household_id : null;
    }
    if (hid) {
      const [h, ms, hd] = await Promise.all([
        api.from("households").select("id,name,invite_code,created_by").eq("id", hid).single(),
        api.from("household_members").select("user_id,role,profiles(display_name,app)").eq("household_id", hid),
        api.from("household_data").select("key,data").eq("household_id", hid),
      ]);
      if (h.error) throw h.error; if (ms.error) throw ms.error; if (hd.error) throw hd.error;
      setHousehold(h.data as any);
      setMembers((ms.data || []).map((m: any) => ({ user_id: m.user_id, role: m.role, display_name: (m.profiles && m.profiles.display_name) || "Member", app: (m.profiles && m.profiles.app) || "", me: m.user_id === uid })));
      const remoteRows: Record<string, LwwMap> = {}; (hd.data || []).forEach((r: any) => (remoteRows[r.key] = r.data || {}));
      const remote = mergeLww(...Object.values(remoteRows));
      const firstSync = meta.hid !== hid;
      const res = syncShared(app, { store: st, ui: u, shadow: firstSync ? {} : meta.shadow || {}, remote, today: new Date(), now: Date.now(), by: uid, firstSync });
      st = res.store; u = res.ui;
      const split = splitRows(res.merged);
      const ups = Object.keys(split).filter((k) => Object.keys(split[k]).length && !same(split[k], remoteRows[k] || {})).map((k) => ({ household_id: hid, key: k, data: split[k], updated_by: uid }));
      if (ups.length) { const { error: e3 } = await api.from("household_data").upsert(ups); if (e3) throw e3; }
      meta.shadow = res.merged; meta.hid = hid;
    } else { setHousehold(null); setMembers([]); meta.hid = null; meta.shadow = {}; }

    // 3. PRIVATE: push if this phone has anything the cloud doesn't.
    const finalHash = hash(stableJson({ store: st, ui: u }));
    let newSeen = seen;
    if (!rStore || finalHash !== remoteHash) {
      const { data: up, error: e4 } = await api.from("user_data").upsert([{ user_id: uid, app, key: "store", data: st }, { user_id: uid, app, key: "ui", data: u }]).select("updated_at");
      if (e4) throw e4;
      newSeen = (up || []).map((r: any) => r.updated_at).sort().pop();
    }
    // Keep my name/app on my profile so my partner sees who's in the household.
    const name = (u.name || "").trim() || (s.user.email || "").split("@")[0];
    if (name !== (meta as any).pname) { await api.from("profiles").upsert({ id: uid, display_name: name, app }); (meta as any).pname = name; }

    meta.privSeen = newSeen; meta.privHash = finalHash; meta.at = Date.now(); meta.prevUid = undefined;
    saveMeta(app, meta);
    if (!same(st, cur.current.store) || !same(u, cur.current.ui)) apply(st, u);
    setLastSync(meta.at); setStatus("synced"); setError("");
  };

  const syncNow = async () => {
    if (running.current) { again.current = true; return running.current; }
    running.current = (async () => {
      try { do { again.current = false; await run(); } while (again.current); }
      catch (e: any) { const m = friendlyError(e); setError(m); setStatus(/connection/i.test(m) ? "offline" : "error"); }
      finally { running.current = null; }
    })();
    return running.current;
  };

  // Auth state
  useEffect(() => {
    let alive = true;
    api.auth.getSession().then(({ data }) => { if (!alive) return; setSession(data.session); setReady(true); });
    const { data: sub } = api.auth.onAuthStateChange((_ev, sess) => { setSession(sess); if (!sess) { setStatus("off"); setHousehold(null); setMembers([]); } });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);
  // Pull on sign-in / open / focus / back online, and every minute while open.
  useEffect(() => {
    if (!session) return;
    sessRef.current = session; syncNow();
    const onVis = () => { if (document.visibilityState === "visible") syncNow(); };
    const onOnline = () => syncNow();
    document.addEventListener("visibilitychange", onVis); window.addEventListener("focus", onVis); window.addEventListener("online", onOnline);
    const iv = window.setInterval(() => { if (document.visibilityState === "visible") syncNow(); }, 60000);
    return () => { document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onVis); window.removeEventListener("online", onOnline); window.clearInterval(iv); };
  }, [session && session.user.id]);
  // Debounced push after local changes.
  useEffect(() => {
    if (!sessRef.current) return;
    const m = loadMeta(app);
    if (m.uid === sessRef.current.user.id && hash(stableJson({ store, ui })) === m.privHash) return;
    clearTimeout(timer.current); timer.current = setTimeout(() => syncNow(), 2500);
    return () => clearTimeout(timer.current);
  }, [store, ui]);

  const redirect = () => window.location.origin + window.location.pathname;
  const wrap = async (fn: () => Promise<any>) => { setError(""); try { await fn(); } catch (e: any) { setError(friendlyError(e)); throw e; } };
  return {
    ready, session, email: session ? session.user.email || null : null, status, lastSync, error, household, members, pending,
    clearPending: () => setPending(""),
    signIn: (email, pw) => wrap(async () => { const { error } = await api.auth.signInWithPassword({ email: email.trim(), password: pw }); if (error) throw error; }),
    signUp: (email, pw) => wrap(async () => {
      const { data, error } = await api.auth.signUp({ email: email.trim(), password: pw, options: { emailRedirectTo: redirect() } });
      if (error) throw error;
      if (!data.session) setPending(email.trim()); // email confirmation is on: wait for the link
    }),
    magicLink: (email) => wrap(async () => { const { error } = await api.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: redirect() } }); if (error) throw error; setPending(email.trim()); }),
    signOut: () => wrap(async () => { await api.auth.signOut(); setSession(null); setStatus("off"); }),
    syncNow,
    createHousehold: (name) => wrap(async () => { const { error } = await api.rpc("create_household", { p_name: name.trim() || "Our family" }); if (error) throw error; await syncNow(); }),
    joinHousehold: (code) => wrap(async () => { const { error } = await api.rpc("join_household", { p_code: code.trim().toUpperCase() }); if (error) throw error; await syncNow(); }),
    leaveHousehold: () => wrap(async () => { const { error } = await api.rpc("leave_household"); if (error) throw error; await syncNow(); }),
  };
}
