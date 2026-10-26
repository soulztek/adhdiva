// Mobile-first implementation of the small UI kit the plan was written against.
import React, { Fragment, useState, useEffect, useMemo, useRef, ReactNode } from "react";
export { Fragment, useState, useEffect, useMemo };

const THEME = {
  radius: { sm: 8, md: 12, lg: 14, xl: 20, full: 999 },
  border: { default: "var(--border)", strong: "var(--border-strong)", focus: "var(--focus)" },
  fill: { primary: "var(--ink)", secondary: "var(--fill2)", accentSubtle: "var(--accent-subtle)", controlChecked: "var(--accent)" },
  bg: { base: "var(--bg)", elevated: "var(--elev)", sunken: "var(--card)" },
  text: { primary: "var(--text)", secondary: "var(--text2)", tertiary: "var(--text3)", onPrimary: "var(--on-ink)", onAccent: "var(--on-accent)", link: "var(--link)" },
  font: {
    family: "Inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    body1: { fontSize: 15, lineHeight: "21px" },
    body2: { fontSize: 15, lineHeight: "21px" },
    label: { fontSize: 13, lineHeight: "18px" },
    heading2: { fontSize: 22, lineHeight: "28px" },
    title: { fontSize: 17, lineHeight: "22px" },
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  dataviz: { categorical: ["#9b3d6e", "#a1979c", "#161214", "#c7779f"] },
};
export function useGrokTheme() { return THEME; }
const t = THEME;

export function Page(props: { title: string; summary?: string; width?: string; children?: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: t.bg.base, color: t.text.primary, fontFamily: t.font.family }}>
      <header style={{ padding: "calc(env(safe-area-inset-top) + 14px) 16px 10px", background: "var(--card)", borderBottom: `1px solid ${t.border.default}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <img src="./icons/icon-192.png" alt="" width={40} height={40} style={{ borderRadius: 10 }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{props.title}</div>
            {props.summary && <div style={{ fontSize: 12, color: t.text.secondary, lineHeight: "16px" }}>{props.summary}</div>}
          </div>
        </div>
      </header>
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "8px 14px calc(env(safe-area-inset-bottom) + 40px)", display: "grid", gridTemplateColumns: "minmax(0,1fr)", gap: 14 }}>{props.children}</main>
    </div>
  );
}

export function Section(props: { heading?: string; caption?: string; collapsible?: boolean; defaultOpen?: boolean; children?: ReactNode }) {
  const [open, setOpen] = useState<boolean>(props.collapsible ? !!props.defaultOpen : true);
  return (
    <section style={{ background: t.bg.sunken, borderRadius: 22, boxShadow: "var(--shadow)", padding: 18, display: "grid", gap: 14, minWidth: 0 }}>
      {props.heading && (
        <div onClick={props.collapsible ? () => setOpen(!open) : undefined} role={props.collapsible ? "button" : undefined} aria-expanded={props.collapsible ? open : undefined} tabIndex={props.collapsible ? 0 : undefined} onKeyDown={props.collapsible ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } } : undefined} style={{ cursor: props.collapsible ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600, lineHeight: "22px", letterSpacing: -0.2 }}>{props.heading}</div>
            {props.caption && <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.tertiary, marginTop: 3 }}>{props.caption}</div>}
          </div>
          {props.collapsible && <span aria-hidden style={{ width: 30, height: 30, borderRadius: 15, background: "var(--fill2)", color: t.text.secondary, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", transition: "transform .25s ease", transform: open ? "rotate(180deg)" : "none" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></span>}
        </div>
      )}
      {open && props.children}
    </section>
  );
}

export function Text(props: { children?: ReactNode }) {
  return <div style={{ fontSize: 14, lineHeight: "20px", color: t.text.secondary }}>{props.children}</div>;
}

export function Callout(props: { tone?: string; children?: ReactNode }) {
  const warn = props.tone === "warning" || props.tone === "danger";
  return <div style={{ display: "flex", gap: 10, background: warn ? "var(--warn-bg)" : "var(--info-bg)", borderRadius: 14, padding: "12px 14px", fontSize: 13.5, lineHeight: "19px", color: t.text.secondary }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={warn ? "#c98a00" : "currentColor"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto", marginTop: 1.5 }}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg><div>{props.children}</div></div>;
}

export function BulletList(props: { items: ReactNode[] }) {
  return <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, fontSize: 14, lineHeight: "20px", color: "var(--text2)" }}>{props.items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}

export function Steps(props: { steps: { title: string; detail?: string }[] }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
      {props.steps.map((s, i) => (
        <li key={i} style={{ display: "flex", gap: 10 }}>
          <span style={{ flex: "0 0 26px", height: 26, borderRadius: 13, background: t.fill.secondary, color: t.text.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>{i + 1}</span>
          <span><div style={{ fontWeight: 600, fontSize: 14.5 }}>{s.title}</div>{s.detail && <div style={{ fontSize: 13, lineHeight: "18px", color: t.text.secondary, marginTop: 1 }}>{s.detail}</div>}</span>
        </li>
      ))}
    </ol>
  );
}

export function Table(props: { columns: string[]; rows: ReactNode[][]; align?: string[]; emphasis?: number }) {
  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any, borderRadius: 14, background: "var(--bg)" }}>
      <table style={{ fontSize: 13, lineHeight: "18px", minWidth: props.columns.length > 2 ? 520 : undefined }}>
        <thead>
          <tr>{props.columns.map((c, i) => <th key={i} style={{ textAlign: (props.align?.[i] === "end" ? "right" : "left") as any, padding: "10px 12px", color: t.text.tertiary, fontWeight: 500, fontSize: 12, position: "sticky", top: 0 }}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {props.rows.map((r, ri) => (
            <tr key={ri} style={{ background: ri === props.emphasis ? t.fill.accentSubtle : ri % 2 ? "var(--zebra)" : "transparent" }}>
              {r.map((c, ci) => <td key={ci} style={{ padding: "9px 12px", verticalAlign: "top", borderTop: `1px solid ${t.border.default}`, color: ci === 0 ? t.text.primary : t.text.secondary, textAlign: (props.align?.[ci] === "end" ? "right" : "left") as any, fontWeight: ci === 0 ? 500 : 400 }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Rows(props: { rows: { lead?: string; title: string; detail?: string }[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {props.rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ flex: "0 0 60px", color: t.text.tertiary, fontWeight: 500, fontSize: 13, paddingTop: 1 }}>{r.lead}</span>
          <span><div style={{ fontWeight: 500, fontSize: 14.5 }}>{r.title}</div>{r.detail && <div style={{ fontSize: 13, color: t.text.tertiary }}>{r.detail}</div>}</span>
        </div>
      ))}
    </div>
  );
}

export function Properties(props: { items: { label: string; value: ReactNode }[] }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {props.items.map((it, i) => (
        <div key={i} style={{ display: "grid", gap: 2 }}>
          <div style={{ fontSize: 12, color: t.text.tertiary }}>{it.label}</div>
          <div style={{ fontSize: 14.5, lineHeight: "20px" }}>{it.value}</div>
        </div>
      ))}
    </div>
  );
}

type Opt<T> = T | { value: T; label: string };
function normOpts<T>(o: Opt<T>[]): { value: T; label: string }[] {
  return o.map((x: any) => (x !== null && typeof x === "object" && "value" in x ? x : { value: x, label: String(x) }));
}

export function Segmented<T>(props: { options: Opt<T>[]; value: T; onChange: (v: T) => void }) {
  const opts = normOpts(props.options);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = ref.current; if (!box) return;
    const el = box.querySelector('[data-on="1"]') as HTMLElement | null;
    if (el) box.scrollTo({ left: Math.max(0, el.offsetLeft - box.offsetLeft - 24), behavior: "smooth" });
  }, [props.value]);
  return (
    <div ref={ref} className="noscroll" style={{ display: "flex", gap: 4, overflowX: "auto", WebkitOverflowScrolling: "touch" as any, padding: 4, borderRadius: 999, background: "var(--fill2)" }}>
      {opts.map((o) => {
        const on = o.value === props.value;
        return (
          <button key={String(o.value)} data-on={on ? "1" : "0"} onClick={() => props.onChange(o.value)}
            style={{ flex: "1 0 auto", minHeight: 38, padding: "0 14px", borderRadius: t.radius.full, cursor: "pointer", border: "none", background: on ? t.fill.primary : "transparent", color: on ? t.text.onPrimary : t.text.secondary, fontSize: 13.5, fontWeight: on ? 600 : 500, whiteSpace: "nowrap" }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const fieldStyle: React.CSSProperties = { width: "100%", minHeight: 48, padding: "10px 14px", borderRadius: 14, border: "none", background: "var(--fill2)", color: t.text.primary, fontSize: 16 };
export function Select<T>(props: { label?: string; options: Opt<T>[]; value: T; onChange: (v: T) => void }) {
  const opts = normOpts(props.options);
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {props.label && <span style={{ fontSize: 13, color: t.text.tertiary }}>{props.label}</span>}
      <select style={fieldStyle} value={String(props.value)} onChange={(e) => { const o = opts.find((x) => String(x.value) === e.target.value); if (o) props.onChange(o.value); }}>
        {opts.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function Input(props: { label?: string; value: string; placeholder?: string; type?: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      {props.label && <span style={{ fontSize: 13, color: t.text.tertiary }}>{props.label}</span>}
      <input style={fieldStyle} value={props.value} placeholder={props.placeholder} type={props.type === "number" ? "text" : props.type || "text"} inputMode={props.type === "number" ? "decimal" : undefined} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}

export function Button(props: { label: string; variant?: string; onClick?: () => void }) {
  const p = props.variant === "primary";
  return (
    <button onClick={props.onClick} style={{ minHeight: 50, padding: "0 18px", borderRadius: 999, cursor: "pointer", border: "none", background: p ? t.fill.primary : "var(--fill2)", color: p ? t.text.onPrimary : t.text.primary, fontSize: 15, fontWeight: 600, width: "100%" }}>
      {props.label}
    </button>
  );
}

export function Metrics(props: { metrics: { value: string; label: string; detail?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10 }}>
      {props.metrics.map((m, i) => (
        <div key={i} style={{ background: "var(--bg)", borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, lineHeight: "30px", fontVariantNumeric: "tabular-nums" }}>{m.value}</div>
          <div style={{ fontWeight: 500, fontSize: 13.5, marginTop: 2 }}>{m.label}</div>
          {m.detail && <div style={{ fontSize: 12, lineHeight: "16px", color: t.text.tertiary, marginTop: 2 }}>{m.detail}</div>}
        </div>
      ))}
    </div>
  );
}

export function LinkCards(props: { links: { title: string; site?: string; href: string }[] }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {props.links.map((l, i) => (
        <a key={i} href={l.href} target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: "12px 14px", borderRadius: 14, background: "var(--fill2)", color: t.text.primary, textDecoration: "none" }}>
          <div style={{ fontWeight: 500, fontSize: 14, lineHeight: "19px" }}>{l.title}</div>
          {l.site && <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 2 }}>{l.site} ↗</div>}
        </a>
      ))}
    </div>
  );
}

export function LineChart(props: { points: { label: string; value: number }[]; floor?: number; ceiling?: number; unit?: string; labels?: string[]; secondary?: { label: string; values: number[] }; format?: (v: number) => string }) {
  const W = 340, H = 180, P = { l: 36, r: 10, t: 12, b: 28 };
  const vals = props.points.map((p) => p.value);
  const lo = props.floor ?? Math.min(...vals), hi = props.ceiling ?? Math.max(...vals);
  const n = props.points.length;
  const x = (i: number) => P.l + (n <= 1 ? 0 : (i * (W - P.l - P.r)) / (n - 1));
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo || 1)) * (H - P.t - P.b);
  const path = props.points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const fmt = props.format || ((v: number) => String(v));
  const ticks = [lo, (lo + hi) / 2, hi];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={props.labels?.[0] || "chart"}>
        {ticks.map((tv, i) => (
          <g key={i}>
            <line x1={P.l} x2={W - P.r} y1={y(tv)} y2={y(tv)} stroke={t.border.default} strokeDasharray="3 3" />
            <text x={P.l - 4} y={y(tv) + 4} fontSize="10" fill={t.text.tertiary} textAnchor="end">{Math.round(tv)}</text>
          </g>
        ))}
        {props.secondary && <path d={props.secondary.values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")} stroke={t.dataviz.categorical[1]} strokeDasharray="5 4" fill="none" strokeWidth={1.5} />}
        <path d={path} stroke={t.dataviz.categorical[0]} strokeWidth={2.5} fill="none" />
        {props.points.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r={3.5} fill={t.dataviz.categorical[0]}><title>{`${p.label}: ${fmt(p.value)}`}</title></circle>
            {p.label && <text x={x(i)} y={H - 8} fontSize="10" fill={t.text.tertiary} textAnchor="middle">{p.label}</text>}
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: t.text.secondary }}>
        <span><span style={{ color: t.dataviz.categorical[0] }}>●</span> {props.labels?.[0] || "Value"}</span>
        {props.secondary && <span><span style={{ color: t.dataviz.categorical[1] }}>- -</span> {props.secondary.label}</span>}
      </div>
    </div>
  );
}

export function Columns(props: { points: { label: string; value: number; display?: string }[]; emphasis?: number }) {
  const max = Math.max(100, ...props.points.map((p) => p.value));
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 140 }}>
      {props.points.map((p, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <div style={{ fontSize: 11, color: t.text.secondary }}>{p.display ?? p.value}</div>
          <div style={{ width: "100%", height: `${(p.value / max) * 90}%`, minHeight: 2, borderRadius: 6, background: i === props.emphasis ? "var(--ink)" : "var(--accent)" }} />
          <div style={{ fontSize: 12, color: i === props.emphasis ? t.text.primary : t.text.tertiary }}>{p.label}</div>
        </div>
      ))}
    </div>
  );
}

export function CalendarHeatmap(props: { days: { date: string; value: number }[]; max?: number; note?: string }) {
  const max = props.max || 100;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {props.days.map((d) => (
          <div key={d.date} title={`${d.date}: ${d.value}%`} style={{ aspectRatio: "1", borderRadius: 6, background: d.value > 0 ? `rgba(232,115,74,${0.2 + 0.8 * (d.value / max)})` : t.fill.secondary }} />
        ))}
      </div>
      {props.note && <div style={{ fontSize: 12, color: t.text.tertiary, marginTop: 6 }}>{props.note}</div>}
    </div>
  );
}

function hm(h: number): string {
  const total = Math.round(h * 60); const hh = Math.floor(total / 60) % 24; const mm = total % 60;
  return `${hh % 12 === 0 ? 12 : hh % 12}:${mm < 10 ? "0" : ""}${mm}`;
}
export function DayView(props: { start: number; end: number; events: { start: number; end: number; title: string; selected?: boolean; flag?: boolean }[]; mark?: { at: number; label?: string } }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {props.events.filter((e) => e.end > props.start && e.start < props.end).map((e, i) => {
        const past = props.mark ? e.end <= props.mark.at : false;
        return (
          <div key={i} style={{ display: "flex", gap: 10, padding: "9px 12px", borderRadius: 12, background: e.selected ? t.fill.accentSubtle : "var(--bg)", opacity: past && !e.selected ? 0.5 : 1 }}>
            <span style={{ flex: "0 0 92px", fontSize: 12.5, color: t.text.tertiary, fontVariantNumeric: "tabular-nums" }}>{`${hm(e.start)}-${hm(e.end)}`}</span>
            <span style={{ fontSize: 13.5 }}>{e.flag ? "✓ " : ""}{e.title}{e.selected && props.mark ? `  · ${props.mark.label || "Now"}` : ""}</span>
          </div>
        );
      })}
    </div>
  );
}
