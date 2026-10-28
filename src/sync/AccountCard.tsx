// Settings cards: Account (sign in to sync) and Household (share chores with your partner).
import React, { Fragment, useEffect, useState } from "react";
import { Section, Callout } from "../kit";
import { IconDot } from "../Shell";
import { CloudApi } from "./cloud";

// Self-contained buttons/fields so this file works the same in ADHDad, ADHDiva and Golf Speed Plan.
const fieldStyle: any = { width: "100%", minHeight: 46, padding: "10px 14px", borderRadius: 14, border: "none", background: "var(--fill2)", color: "var(--text)", fontSize: 16, boxSizing: "border-box" };
function PillButton(props: { label: string; onClick: () => void; soft?: boolean; small?: boolean; full?: boolean; disabled?: boolean }) {
  return <button type="button" onClick={props.onClick} disabled={props.disabled} style={{ minHeight: props.small ? 36 : 46, padding: props.small ? "0 14px" : "0 18px", width: props.full ? "100%" : undefined, borderRadius: 999, border: "none", background: props.soft ? "var(--fill2)" : "var(--ink)", color: props.soft ? "var(--text)" : "var(--on-ink)", fontSize: props.small ? 13.5 : 15, fontWeight: 600, cursor: props.disabled ? "default" : "pointer", opacity: props.disabled ? 0.5 : 1, whiteSpace: "nowrap", flex: "0 0 auto" }}>{props.label}</button>;
}

export function ago(ts: number | null, now = Date.now()): string {
  if (!ts) return "Not synced yet";
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return "Synced just now";
  const m = Math.round(s / 60); if (m < 60) return `Synced ${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `Synced ${h} h ago`;
  return `Synced ${Math.round(h / 24)} d ago`;
}
async function copy(t: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(t); return true; } catch (_e) {
    try { const ta = document.createElement("textarea"); ta.value = t; ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove(); return ok; } catch (_e2) { return false; }
  }
}
const small = (t: any, color = "var(--text3)") => <div style={{ fontSize: 13, lineHeight: "18px", color }}>{t}</div>;
const lbl = (t: string) => <span style={{ fontSize: 13, color: "var(--text3)" }}>{t}</span>;

export function AccountCard(props: { cloud: CloudApi; appName: string; partnerApp?: string; privateNote?: string }) {
  const c = props.cloud;
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false); const [, setTick] = useState(0);
  useEffect(() => { const id = window.setInterval(() => setTick((x) => x + 1), 30000); return () => window.clearInterval(id); }, []);
  const go = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } catch (_e) {} setBusy(false); };
  const statusText = c.status === "syncing" ? "Syncing…" : c.status === "offline" ? "Offline · will sync when you're back online" : c.status === "error" ? "Sync paused" : ago(c.lastSync);
  const dot = c.status === "error" ? "#c0392b" : c.status === "offline" ? "var(--text3)" : "var(--accent)";

  if (!c.session) return (
    <Section heading="Account" caption="Optional. Sign in to back up and sync across phones. The app works fine without it.">
      {c.pending ? (
        <Fragment>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}><IconDot name="settings" tone="accent" size={40} /><div><div style={{ fontSize: 15, fontWeight: 600 }}>Check your email</div>{small(`We sent a link to ${c.pending}. Tap it on this phone, then come back here.`)}</div></div>
          <PillButton soft full label="I've confirmed, sign in" onClick={() => { c.clearPending(); setMode("in"); }} />
        </Fragment>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (!email || !pw) return; go(() => (mode === "in" ? c.signIn(email, pw) : c.signUp(email, pw))); }} style={{ display: "grid", gap: 10 }}>
          <div role="tablist" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, padding: 4, borderRadius: 999, background: "var(--fill2)" }}>
            {(["in", "up"] as const).map((m) => <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)} style={{ minHeight: 36, borderRadius: 999, border: "none", background: mode === m ? "var(--card)" : "transparent", color: mode === m ? "var(--text)" : "var(--text2)", fontWeight: 600, fontSize: 14, cursor: "pointer", boxShadow: mode === m ? "var(--shadow)" : "none" }}>{m === "in" ? "Sign in" : "Create account"}</button>)}
          </div>
          <label style={{ display: "grid", gap: 6 }}>{lbl("Email")}<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={fieldStyle} /></label>
          <label style={{ display: "grid", gap: 6 }}>{lbl(mode === "up" ? "Password (8+ characters)" : "Password")}<input type="password" autoComplete={mode === "up" ? "new-password" : "current-password"} value={pw} onChange={(e) => setPw(e.target.value)} style={fieldStyle} /></label>
          <button type="submit" disabled={busy || !email || pw.length < (mode === "up" ? 8 : 1)} style={{ minHeight: 48, borderRadius: 999, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer", opacity: busy || !email || pw.length < (mode === "up" ? 8 : 1) ? 0.5 : 1 }}>{busy ? "One sec…" : mode === "in" ? "Sign in to sync" : "Create account"}</button>
          <button type="button" disabled={busy || !email} onClick={() => go(() => c.magicLink(email))} style={{ border: "none", background: "transparent", color: "var(--link)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", padding: 4, opacity: email ? 1 : 0.5 }}>Email me a sign-in link instead</button>
        </form>
      )}
      {c.error && small(c.error, "#c0392b")}
      {small(props.privateNote || "Your existing streaks and history are uploaded on first sign-in, nothing is lost.")}
    </Section>
  );

  return (
    <Section heading="Account">
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <IconDot name="settings" tone="accent" size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text3)" }}><span style={{ width: 8, height: 8, borderRadius: 4, background: dot, flex: "0 0 auto" }} />{statusText}</div>
        </div>
      </div>
      {c.error && small(c.error, "#c0392b")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PillButton soft label="Sync now" onClick={() => c.syncNow()} />
        <PillButton soft label="Sign out" onClick={() => { if (window.confirm("Sign out? Your data stays on this phone.")) c.signOut(); }} />
      </div>
    </Section>
  );
}

export function HouseholdCard(props: { cloud: CloudApi; partnerApp: string }) {
  const c = props.cloud;
  const [name, setName] = useState("Our family"); const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const go = async (fn: () => Promise<void>) => { setBusy(true); setMsg(""); try { await fn(); } catch (_e) {} setBusy(false); };
  const privacy = <Callout>Mood, overwhelm and check-ins stay private to you. Only chores, kids' names and the couple check-in are shared.</Callout>;
  if (!c.session) return (
    <Section heading="Household" caption="Share the chore board with your partner">
      {small(`Sign in above, then create a household and give your partner the code to enter in ${props.partnerApp}.`)}
      {privacy}
    </Section>
  );
  const h = c.household;
  if (!h) return (
    <Section heading="Household" caption="Share the chore board, kids and couple check-in with your partner">
      <div style={{ display: "grid", gap: 8 }}>
        {lbl("Start one")}
        <div style={{ display: "flex", gap: 8 }}><input value={name} onChange={(e) => setName(e.target.value)} aria-label="Household name" style={fieldStyle} /><PillButton label="Create" disabled={busy} onClick={() => go(() => c.createHousehold(name))} /></div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {lbl("Or join with your partner's code")}
        <div style={{ display: "flex", gap: 8 }}><input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} placeholder="ABC123" aria-label="Invite code" autoCapitalize="characters" style={{ ...fieldStyle, letterSpacing: 3, fontWeight: 600 }} /><PillButton soft label="Join" disabled={busy || code.length !== 6} onClick={() => go(() => c.joinHousehold(code))} /></div>
        {small("Joining uses the household's chore board; your ticks come along.")}
      </div>
      {c.error && small(c.error, "#c0392b")}
      {privacy}
    </Section>
  );
  const shareText = `Join our household "${h.name}" in ${props.partnerApp}: More › Settings › Household › code ${h.invite_code}`;
  return (
    <Section heading="Household" caption={h.name}>
      <div style={{ display: "grid", gap: 6, justifyItems: "center", padding: "14px 10px", borderRadius: 16, background: "var(--accent-subtle)" }}>
        <div style={{ fontSize: 12.5, color: "var(--text2)" }}>Invite code</div>
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 6, color: "var(--link)", fontVariantNumeric: "tabular-nums" }}>{h.invite_code}</div>
        <div style={{ fontSize: 12.5, color: "var(--text2)", textAlign: "center" }}>{`Your partner enters this in ${props.partnerApp} › Settings › Household`}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <PillButton soft label="Copy code" onClick={async () => setMsg((await copy(h.invite_code)) ? "Code copied." : "Couldn't copy, write it down.")} />
        <PillButton soft label="Share" onClick={async () => { try { if ((navigator as any).share) { await (navigator as any).share({ text: shareText }); return; } } catch (_e) { return; } setMsg((await copy(shareText)) ? "Invite copied." : "Couldn't copy."); }} />
      </div>
      {msg && small(msg, "var(--link)")}
      <div style={{ display: "grid" }}>
        {lbl("Members")}
        {c.members.map((m, i) => (
          <div key={m.user_id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <span aria-hidden style={{ width: 32, height: 32, borderRadius: 16, background: "var(--fill2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--text2)" }}>{(m.display_name || "?").slice(0, 1).toUpperCase()}</span>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>{m.display_name}{m.me ? " (you)" : ""}</div>
            <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{m.app === "adhdad" ? "ADHDad" : m.app === "adhdiva" ? "ADHDiva" : ""}{m.role === "owner" ? " · owner" : ""}</div>
          </div>
        ))}
        {c.members.length < 2 && small("Waiting for your partner to join.")}
      </div>
      {c.error && small(c.error, "#c0392b")}
      {privacy}
      <div><PillButton small soft label="Leave household" onClick={() => { if (window.confirm(`Leave "${h.name}"? Your copy of the chores stays on this phone.`)) go(() => c.leaveHousehold()); }} /></div>
    </Section>
  );
}
