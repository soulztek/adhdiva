// @ts-nocheck
// Shared ADHDiva UI pieces (ported from the Golf Speed Plan ADHD layer).
import React, { Fragment, useEffect, useRef, useState } from "react";
import { CARD, I, IconDot, NAV_BOTTOM, NAV_H, Tick } from "./Shell";
import { chime, buzz } from "./adhd";

export function pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
export function mmss(s: number): string { const v = Math.max(0, Math.round(s)); return `${Math.floor(v / 60)}:${pad(v % 60)}`; }
export function fmtIn(mins: number): string { const m = Math.max(0, Math.round(mins)); if (m < 60) return `${m} min`; const h = Math.floor(m / 60); const r = m % 60; return r ? `${h} h ${r} min` : `${h} h`; }
export function hm(t: string): number { const p = (t || "0:0").split(":"); return Number(p[0]) + Number(p[1] || 0) / 60; }
export function fmtHour(h: number): string { const total = Math.round(h * 60); const hh = Math.floor(total / 60) % 24; const mm = total % 60; return `${hh % 12 === 0 ? 12 : hh % 12}:${pad(mm)} ${hh < 12 ? "AM" : "PM"}`; }

/** Countdown ring (SVG). */
export function Ring(props: { frac: number; size?: number; stroke?: number; color?: string; track?: string; children?: any; smooth?: boolean }) {
  const s = props.size || 120; const w = props.stroke || 8; const r = (s - w) / 2; const c = 2 * Math.PI * r; const f = Math.max(0, Math.min(1, props.frac || 0));
  return (
    <div style={{ position: "relative", width: s, height: s, flex: "0 0 auto" }}>
      <svg width={s} height={s} aria-hidden style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={props.track || "var(--fill2)"} strokeWidth={w} />
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={props.color || "var(--accent)"} strokeWidth={w} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - f)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>{props.children}</div>
    </div>
  );
}

/** Compact Full / Minimum switch (black pill = active). */
export function ModeSwitch(props: { mode: "full" | "min"; onMode: (m: "full" | "min") => void; small?: boolean }) {
  const h = props.small ? 26 : 34;
  const b = (on: boolean) => ({ height: h, padding: props.small ? "0 10px" : "0 14px", borderRadius: 999, border: "none", cursor: "pointer", background: on ? "var(--ink)" : "transparent", color: on ? "var(--on-ink)" : "var(--text2)", fontSize: props.small ? 11.5 : 13, fontWeight: on ? 600 : 500, whiteSpace: "nowrap" as any });
  return (
    <span role="group" aria-label="Full or minimum version" style={{ display: "inline-flex", gap: 2, padding: 3, borderRadius: 999, background: "var(--fill2)", flex: "0 0 auto" }}>
      <button aria-pressed={props.mode === "full"} onClick={(e) => { e.stopPropagation(); props.onMode("full"); }} style={b(props.mode === "full")}>Full</button>
      <button aria-pressed={props.mode === "min"} onClick={(e) => { e.stopPropagation(); props.onMode("min"); }} style={b(props.mode === "min")}>Minimum</button>
    </span>
  );
}

export function PillButton(props: { label: any; onClick: () => void; soft?: boolean; small?: boolean; icon?: string; full?: boolean; disabled?: boolean; ariaLabel?: string }) {
  return (
    <button onClick={props.onClick} disabled={props.disabled} aria-label={props.ariaLabel} style={{ minHeight: props.small ? 36 : 48, padding: props.small ? "0 14px" : "0 20px", width: props.full ? "100%" : undefined, borderRadius: 999, border: "none", background: props.soft ? "var(--fill2)" : "var(--ink)", color: props.soft ? "var(--text)" : "var(--on-ink)", fontSize: props.small ? 13.5 : 15, fontWeight: 600, cursor: props.disabled ? "default" : "pointer", opacity: props.disabled ? 0.45 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap", flex: "0 0 auto" }}>
      {props.icon && I(props.icon, props.small ? 14 : 16, 2)}{props.label}
    </button>
  );
}

/** One checklist row: tick, label, optional Full/Minimum switch, optional action button. */
export function TapItem(props: { label: string; sub?: string; done: boolean; onTap: () => void; first?: boolean; minText?: string; mode?: "full" | "min"; onMode?: (m: "full" | "min") => void; minDone?: boolean; action?: { label: string; icon?: string; onClick: () => void }; right?: any }) {
  const isMin = props.mode === "min";
  return (
    <div style={{ display: "flex", alignItems: props.minText || props.sub ? "flex-start" : "center", gap: 12, minHeight: 54, padding: "8px 0", borderTop: props.first ? "none" : "1px solid var(--border)" }}>
      <span style={{ paddingTop: props.minText || props.sub ? 5 : 0 }}><Tick done={props.done} onClick={props.onTap} label={props.done ? `Untick ${props.label}` : `Tick ${props.label}`} size={28} /></span>
      <div style={{ flex: 1, display: "grid", gap: 6 }}>
        <button onClick={props.onTap} style={{ minHeight: 38, border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", fontSize: 15, lineHeight: "20px", color: props.done ? "var(--text3)" : "var(--text)", textDecoration: props.done ? "line-through" : "none", textDecorationColor: "var(--text3)" }}>{props.label}</button>
        {props.sub && <div style={{ fontSize: 12.5, lineHeight: "17px", color: "var(--text3)", marginTop: -8 }}>{props.sub}</div>}
        {props.minText && props.onMode && (
          <div style={{ display: "grid", gap: 6, marginTop: -4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <ModeSwitch small mode={props.mode || "full"} onMode={props.onMode} />
              {props.done && props.minDone && <span style={{ fontSize: 12, color: "var(--link)", fontWeight: 600 }}>Minimum done</span>}
            </div>
            {isMin && <div style={{ fontSize: 12.5, lineHeight: "17px", color: "var(--text2)" }}>{`Minimum: ${props.minText}`}</div>}
          </div>
        )}
        {props.right}
      </div>
      {props.action && (
        <button onClick={props.action.onClick} style={{ flex: "0 0 auto", height: 34, padding: "0 14px 0 11px", borderRadius: 999, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>{I(props.action.icon || "play", 12, 2)}{props.action.label}</button>
      )}
    </div>
  );
}

/** Neutral "stop here" cap message. */
export function CapNote(props: { title?: string; text?: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 18, background: "var(--accent-subtle)" }}>
      <span style={{ color: "var(--accent)", paddingTop: 1 }}>{I("check", 20, 2.25)}</span>
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{props.title || "Done. Stop here."}</div>
        <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>{props.text || "That's the plan for today. More won't help; rest will."}</div>
      </div>
    </div>
  );
}

/** "Next: X in Y min" chip. */
export function NextChip(props: { label: string; mins: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: "100%", minHeight: 30, padding: "5px 12px", borderRadius: 15, background: "var(--fill2)", color: "var(--text2)", fontSize: 12.5, lineHeight: "17px", fontWeight: 500 }}>
      {I("clock", 13)}<span>{`Next: ${props.label} in `}<b style={{ fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{fmtIn(props.mins)}</b></span>
    </span>
  );
}

/** Session timer: countdown ring, soft chime at each change, it ends the session at the planned time. */
export function SessionTimer(props: { items: { name: string; min: number }[]; totalMin: number; startedAt: number | null; onStart: () => void; onStop: () => void }) {
  const [tick, setTick] = useState<number>(Date.now());
  const running = props.startedAt !== null;
  useEffect(() => { if (!running) return; const id = window.setInterval(() => setTick(Date.now()), 1000); return () => window.clearInterval(id); }, [running]);
  const total = props.totalMin * 60;
  const el = running ? Math.max(0, (tick - (props.startedAt as number)) / 1000) : 0;
  const left = Math.max(0, total - el);
  const over = running && el >= total;
  let acc = 0; let idx = props.items.length - 1;
  for (let i = 0; i < props.items.length; i++) { acc += props.items[i].min * 60; if (el < acc) { idx = i; break; } }
  const lastRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!running) { lastRef.current = undefined; return; }
    const key = over ? -1 : idx;
    if (lastRef.current !== undefined && lastRef.current !== key) { chime(); buzz(); }
    lastRef.current = key;
  }, [idx, over, running]);
  const nextName = !over && running && idx + 1 < props.items.length ? props.items[idx + 1].name : "";
  return (
    <div style={{ ...CARD, padding: 16, display: "flex", gap: 16, alignItems: "center" }}>
      <Ring frac={running ? left / total : 1} size={96} stroke={7}>
        <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: -0.5, fontVariantNumeric: "tabular-nums" }}>{mmss(running ? left : total)}</div>
        <div style={{ fontSize: 10.5, color: "var(--text3)" }}>{running ? (over ? "time's up" : "left") : "planned"}</div>
      </Ring>
      <div style={{ flex: 1, display: "grid", gap: 6 }}>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{over ? "Planned end reached" : running ? `Now · ${idx + 1} of ${props.items.length}` : "Session timer"}</div>
        <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: "19px" }}>{over ? "Stop here. That's the session." : running ? props.items[idx].name : `${Math.round(props.totalMin)} min · chime at each change`}</div>
        {nextName && <div style={{ fontSize: 12, color: "var(--text3)" }}>{`Then: ${nextName}`}</div>}
        <button onClick={running ? props.onStop : props.onStart} style={{ justifySelf: "start", height: 36, padding: "0 16px", borderRadius: 999, border: "none", background: running ? "var(--fill2)" : "var(--ink)", color: running ? "var(--text)" : "var(--on-ink)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>{running ? "Stop timer" : <Fragment>{I("play", 11)}Start timer</Fragment>}</button>
      </div>
    </div>
  );
}

/** Bottom-sheet countdown (20-sec hug, 5-min floor play, special time). */
export function TimerSheet(props: { title: string; sub?: string; secs: number; onClose: () => void; onDone: () => void; doneLabel?: string }) {
  const [start, setStart] = useState<number | null>(null);
  const [tick, setTick] = useState<number>(Date.now());
  const [finished, setFinished] = useState<boolean>(false);
  useEffect(() => { if (start === null || finished) return; const id = window.setInterval(() => setTick(Date.now()), 250); return () => window.clearInterval(id); }, [start, finished]);
  const el = start === null ? 0 : (tick - start) / 1000;
  const left = Math.max(0, props.secs - el);
  useEffect(() => { if (start !== null && !finished && left <= 0) { setFinished(true); chime(); buzz(); } }, [left, start, finished]);
  return (
    <div role="dialog" aria-modal="true" aria-label={props.title} onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} className="fadein" style={{ width: "100%", maxWidth: 520, background: "var(--card)", color: "var(--text)", borderRadius: "28px 28px 0 0", padding: "12px 20px calc(env(safe-area-inset-bottom) + 20px)", display: "grid", gap: 16, justifyItems: "center", boxShadow: "0 -8px 30px rgba(0,0,0,0.2)" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border-strong)" }} />
        <div style={{ textAlign: "center" }}><div style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.3 }}>{props.title}</div>{props.sub && <div style={{ fontSize: 13, color: "var(--text3)", marginTop: 2 }}>{props.sub}</div>}</div>
        <Ring frac={start === null ? 1 : left / props.secs} size={170} stroke={10}>
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{props.secs < 60 ? Math.ceil(left) : mmss(left)}</div>
          <div style={{ fontSize: 12, color: "var(--text3)" }}>{finished ? "done" : start === null ? "ready" : "left"}</div>
        </Ring>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
          <button onClick={props.onClose} style={{ minHeight: 50, borderRadius: 25, border: "none", background: "var(--fill2)", color: "var(--text)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Close</button>
          {finished ? (
            <button onClick={() => { props.onDone(); props.onClose(); }} style={{ minHeight: 50, borderRadius: 25, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{props.doneLabel || "Log it"}</button>
          ) : (
            <button onClick={() => { if (start === null) { setStart(Date.now()); setTick(Date.now()); } else { setStart(null); } }} style={{ minHeight: 50, borderRadius: 25, border: "none", background: "var(--ink)", color: "var(--on-ink)", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>{start === null ? "Start" : "Reset"}</button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Reward toast. */
export function Toast(props: { t: { title: string; body: string; icon: string; meta?: string }; onClose: () => void }) {
  return (
    <div role="status" aria-live="polite" style={{ position: "fixed", left: 12, right: 12, bottom: `calc(${NAV_BOTTOM} + ${NAV_H + 12}px)`, zIndex: 90, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div className="fadein" style={{ ...CARD, pointerEvents: "auto", width: "100%", maxWidth: 440, padding: 14, display: "flex", gap: 12, alignItems: "flex-start", boxShadow: "0 12px 34px rgba(17,19,18,0.18), 0 2px 6px rgba(17,19,18,0.08)" }}>
        <IconDot name={props.t.icon} tone="ink" size={40} />
        <div style={{ flex: 1, display: "grid", gap: 2 }}>
          {props.t.meta && <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--link)", letterSpacing: 0.2 }}>{props.t.meta}</div>}
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: "20px" }}>{props.t.title}</div>
          <div style={{ fontSize: 13.5, lineHeight: "19px", color: "var(--text2)" }}>{props.t.body}</div>
        </div>
        <button onClick={props.onClose} aria-label="Close" style={{ width: 30, height: 30, borderRadius: 15, border: "none", background: "var(--fill2)", color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto", padding: 0 }}>{I("x", 14, 2)}</button>
      </div>
    </div>
  );
}

/** 1-5 tap rating. */
export function Rating(props: { label: string; low: string; high: string; value?: number; onPick: (n: number) => void }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600 }}>{props.label}</span>
        <span style={{ fontSize: 11.5, color: "var(--text3)", whiteSpace: "nowrap" }}>{`1 ${props.low} · 5 ${props.high}`}</span>
      </div>
      <div role="group" aria-label={props.label} style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, padding: 4, borderRadius: 16, background: "var(--fill2)" }}>
        {[1, 2, 3, 4, 5].map((n) => { const on = props.value === n; return (
          <button key={n} onClick={() => props.onPick(n)} aria-pressed={on} aria-label={`${props.label} ${n}`} style={{ height: 40, borderRadius: 12, cursor: "pointer", border: "none", background: on ? "var(--ink)" : "transparent", color: on ? "var(--on-ink)" : "var(--text2)", fontSize: 16, fontWeight: on ? 600 : 500, fontVariantNumeric: "tabular-nums" }}>{n}</button>
        ); })}
      </div>
    </div>
  );
}

/** Small trend chart that tolerates missing days (null). */
export function TrendChart(props: { values: (number | null)[]; labels: string[]; lo: number; hi: number; target?: number; height?: number; unit?: string; name: string }) {
  const W = 340, H = props.height || 110, P = { l: 26, r: 8, t: 10, b: 20 };
  const n = props.values.length;
  const x = (i: number) => P.l + (n <= 1 ? 0 : (i * (W - P.l - P.r)) / (n - 1));
  const y = (v: number) => P.t + (1 - (v - props.lo) / (props.hi - props.lo || 1)) * (H - P.t - P.b);
  const segs: string[] = []; let cur = "";
  props.values.forEach((v, i) => { if (v === null || v === undefined) { if (cur) segs.push(cur); cur = ""; } else cur += `${cur ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `; });
  if (cur) segs.push(cur);
  const step = n > 16 ? 7 : n > 8 ? 3 : 1;
  const have = props.values.filter((v) => v !== null && v !== undefined).length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${props.name} trend, ${have} of ${n} days logged`} style={{ display: "block" }}>
      {[props.lo, (props.lo + props.hi) / 2, props.hi].map((tv, i) => (
        <g key={i}>
          <line x1={P.l} x2={W - P.r} y1={y(tv)} y2={y(tv)} stroke="var(--border)" />
          <text x={P.l - 5} y={y(tv) + 3.5} fontSize="9.5" fill="var(--text3)" textAnchor="end">{Math.round(tv)}</text>
        </g>
      ))}
      {props.target !== undefined && <g><line x1={P.l} x2={W - P.r} y1={y(props.target)} y2={y(props.target)} stroke="var(--ink)" strokeDasharray="4 4" strokeWidth={1.2} /><text x={W - P.r} y={y(props.target) - 4} fontSize="9.5" fill="var(--text2)" textAnchor="end">{`target ${props.target}${props.unit || ""}`}</text></g>}
      {segs.map((d, i) => <path key={i} d={d} stroke="var(--accent)" strokeWidth={2.2} fill="none" strokeLinejoin="round" strokeLinecap="round" />)}
      {props.values.map((v, i) => v === null || v === undefined ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.8} fill={props.target !== undefined && v > props.target ? "var(--ink)" : "var(--accent)"} />)}
      {props.labels.map((l, i) => (i % step === (n - 1) % step ? <text key={i} x={x(i)} y={H - 5} fontSize="9.5" fill="var(--text3)" textAnchor={i === n - 1 ? "end" : i === 0 ? "start" : "middle"}>{l}</text> : null))}
    </svg>
  );
}

/** Animated breathing timer: box (4-4-4-4) or 4-7-8. */
export function Breather(props: { kind: "sigh" | "box" | "478"; onKind: (k: "sigh" | "box" | "478") => void; onDone: () => void }) {
  const [mins, setMins] = useState<number>(1);
  const [start, setStart] = useState<number | null>(null);
  const [tick, setTick] = useState<number>(Date.now());
  const [done, setDone] = useState<boolean>(false);
  useEffect(() => { if (start === null) return; const id = window.setInterval(() => setTick(Date.now()), 200); return () => window.clearInterval(id); }, [start]);
  const phases = props.kind === "sigh" ? [["Breathe in (nose)", 2, 1], ["Sip in a bit more", 1, 1], ["Long sigh out (mouth)", 6, 0]] : props.kind === "box" ? [["Breathe in", 4, 1], ["Hold", 4, 1], ["Breathe out", 4, 0], ["Hold", 4, 0]] : [["Breathe in", 4, 1], ["Hold", 7, 1], ["Breathe out", 8, 0]];
  const cycle = phases.reduce((a, p) => a + (p[1] as number), 0);
  const total = mins * 60;
  const el = start === null ? 0 : (tick - start) / 1000;
  const left = Math.max(0, total - el);
  let t = el % cycle; let ph = 0; while (ph < phases.length - 1 && t >= (phases[ph][1] as number)) { t -= phases[ph][1] as number; ph++; }
  const phase = phases[ph]; const phLeft = Math.ceil((phase[1] as number) - t);
  const big = start === null ? 0.55 : phase[2] ? 1 : 0.55;
  const lastPh = useRef<number>(-1);
  useEffect(() => { if (start !== null && left > 0 && ph !== lastPh.current) { lastPh.current = ph; } }, [ph, start, left]);
  useEffect(() => { if (start !== null && left <= 0 && !done) { setDone(true); setStart(null); chime(); props.onDone(); } }, [left, start, done]);
  const running = start !== null;
  return (
    <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <ModeChip on={props.kind === "sigh"} label="Sigh" onClick={() => { setStart(null); props.onKind("sigh"); }} />
        <ModeChip on={props.kind === "box"} label="Box" onClick={() => { setStart(null); props.onKind("box"); }} />
        <ModeChip on={props.kind === "478"} label="4-7-8" onClick={() => { setStart(null); props.onKind("478"); }} />
        <ModeChip on={mins === 1} label="1 min" onClick={() => { setStart(null); setMins(1); }} />
        <ModeChip on={mins === 2} label="2 min" onClick={() => { setStart(null); setMins(2); }} />
      </div>
      <div style={{ position: "relative", width: 190, height: 190, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div aria-hidden style={{ position: "absolute", width: 190, height: 190, borderRadius: 95, background: "var(--accent-subtle)" }} />
        <div aria-hidden style={{ position: "absolute", width: 190, height: 190, borderRadius: 95, background: "var(--accent)", opacity: 0.85, transform: `scale(${big})`, transition: running ? `transform ${phase[1]}s ease-in-out` : "transform .6s ease" }} />
        <div style={{ position: "relative", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{running ? phase[0] : done ? "Nice." : "Ready"}</div>
          <div style={{ fontSize: 28, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{running ? phLeft : ""}</div>
        </div>
      </div>
      <div style={{ fontSize: 13, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>{running ? `${mmss(left)} left` : `${mins} min · ${props.kind === "sigh" ? "double inhale, long slow exhale" : props.kind === "box" ? "in 4, hold 4, out 4, hold 4" : "in 4, hold 7, out 8"}`}</div>
      <PillButton label={running ? "Stop" : done ? "Again" : "Start breathing"} soft={running} icon={running ? undefined : "play"} onClick={() => { if (running) setStart(null); else { setDone(false); setStart(Date.now()); setTick(Date.now()); lastPh.current = -1; } }} />
    </div>
  );
}
export function ModeChip(props: { on: boolean; label: string; onClick: () => void }) {
  return <button onClick={props.onClick} aria-pressed={props.on} style={{ height: 34, padding: "0 14px", borderRadius: 999, border: "none", background: props.on ? "var(--ink)" : "var(--fill2)", color: props.on ? "var(--on-ink)" : "var(--text2)", fontSize: 13, fontWeight: props.on ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap" }}>{props.label}</button>;
}
/** Weekday chip picker (Mon..Sun). */
export function DayPicker(props: { value: number[]; onChange: (v: number[]) => void }) {
  const order = [1, 2, 3, 4, 5, 6, 0]; const L = ["S", "M", "T", "W", "T", "F", "S"]; const N = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
      {order.map((d) => { const on = props.value.indexOf(d) >= 0; return (
        <button key={d} aria-pressed={on} aria-label={N[d]} onClick={() => props.onChange(on ? props.value.filter((x) => x !== d) : [...props.value, d].sort())} style={{ height: 36, borderRadius: 12, border: "none", background: on ? "var(--ink)" : "var(--fill2)", color: on ? "var(--on-ink)" : "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{L[d]}</button>
      ); })}
    </div>
  );
}
export const fieldStyle: any = { width: "100%", minHeight: 46, padding: "10px 14px", borderRadius: 14, border: "none", background: "var(--fill2)", color: "var(--text)", fontSize: 16 };
