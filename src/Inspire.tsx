// @ts-nocheck
import React, { useEffect, useRef, useState } from "react";
import { I } from "./Shell";

/** Daily inspiration cards (also the Settings backgrounds). Order matters: the first card is the opening page. */
export const INSPIRE = [
  { id: "mary", name: "Holy Mary", src: "./inspire/1-holy-mary.webp", w: 736, h: 1308, bg: "#abdff7", alt: "Line drawing of Mary on light blue: Holy Mary, Mother of God, pray for us", quote: "Holy Mary, Mother of God, pray for us.", by: "" },
  { id: "psalm", name: "Psalm 111:1", src: "./inspire/2-psalm-111-1.webp", w: 638, h: 1140, bg: "#b9ccea", alt: "Saint Joseph holding the child Jesus on blue: I will praise the Lord with all my heart, Psalm 111:1", quote: "I will praise the Lord with all my heart.", by: "Psalm 111:1" },
  { id: "lady", name: "Our Lady", src: "./inspire/3-our-lady.webp", w: 736, h: 1309, bg: "#e6d39b", alt: "Marian apparitions side by side, including Our Lady of Guadalupe, on a tan background", quote: "Our Lady, pray for us.", by: "" },
];
export type BgId = "none" | "mary" | "psalm" | "lady";
export const BG_DEFAULT: BgId = "mary";
export function bgOf(id?: string) { const k = id || BG_DEFAULT; return INSPIRE.find((c) => c.id === k) || null; }

/** Soft, fixed, faded backdrop behind the whole app. Cards stay opaque so text is always readable. */
export function Backdrop(props: { id?: string; dark?: boolean }) {
  const c = bgOf(props.id); if (!c) return null;
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${c.src})`, backgroundSize: "cover", backgroundPosition: "center 30%", backgroundRepeat: "no-repeat", opacity: props.dark ? 0.2 : 0.55 }} />
      <div style={{ position: "absolute", inset: 0, background: props.dark
        ? "linear-gradient(180deg, color-mix(in srgb, var(--bg) 55%, transparent) 0%, color-mix(in srgb, var(--bg) 70%, transparent) 55%, color-mix(in srgb, var(--bg) 88%, transparent) 100%)"
        : "linear-gradient(180deg, color-mix(in srgb, var(--bg) 35%, transparent) 0%, color-mix(in srgb, var(--bg) 55%, transparent) 50%, color-mix(in srgb, var(--bg) 80%, transparent) 100%)" }} />
    </div>
  );
}

const roundBtn = (disabled: boolean) => ({ width: 44, height: 44, borderRadius: 22, border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.35 : 1, flex: "0 0 auto", boxShadow: "var(--shadow)" });

export function InspirePage(props: { dateLabel: string; opening: boolean; onDone: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const n = INSPIRE.length;
  const go = (i: number) => { const el = track.current; if (!el) return; const j = Math.max(0, Math.min(n - 1, i)); el.scrollTo({ left: j * el.clientWidth, behavior: "smooth" }); setIdx(j); };
  useEffect(() => {
    const el = track.current; if (!el) return;
    const on = () => { const j = Math.round(el.scrollLeft / Math.max(1, el.clientWidth)); setIdx((p) => (p === j ? p : j)); };
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowRight") go(idx + 1); else if (e.key === "ArrowLeft") go(idx - 1); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [idx]);
  const cur = INSPIRE[idx];
  return (
    <div role="dialog" aria-modal="true" aria-label="Daily inspiration" className="fadein" style={{ position: "fixed", inset: 0, zIndex: 90, background: "var(--bg)", color: "var(--text)", display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top) + 14px) 0 calc(env(safe-area-inset-bottom) + 16px)" }}>
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", gap: 12, boxSizing: "border-box" }}>
        <span style={{ width: 40, height: 40, borderRadius: 20, background: "var(--accent-subtle)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{I("spark", 20)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.3, lineHeight: "23px" }}>Daily inspiration</div>
          <div style={{ fontSize: 12.5, color: "var(--text3)" }}>{props.dateLabel}</div>
        </div>
        <button onClick={props.onDone} aria-label={props.opening ? "Skip to Home" : "Close"} style={{ ...roundBtn(false), boxShadow: "none", border: "none", background: "var(--fill2)" }}>{I("x", 18)}</button>
      </div>
      <div ref={track} className="noscrollbar" style={{ flex: 1, minHeight: 0, display: "flex", overflowX: "auto", overflowY: "hidden", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch", marginTop: 14 }}>
        {INSPIRE.map((c, i) => (
          <div key={c.src} aria-hidden={i !== idx} style={{ flex: "0 0 100%", scrollSnapAlign: "center", scrollSnapStop: "always", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 20px", boxSizing: "border-box", minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, width: "100%", maxWidth: 520, borderRadius: 24, background: c.bg, boxShadow: "var(--shadow)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <img src={c.src} alt={c.alt} width={c.w} height={c.h} draggable={false} loading={i < 2 ? "eager" : "lazy"} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", userSelect: "none" }} />
            </div>
            <div style={{ width: "100%", maxWidth: 520, padding: "14px 4px 0", textAlign: "center", minHeight: 62, boxSizing: "border-box" }}>
              <div style={{ fontSize: 15.5, fontWeight: 600, lineHeight: "21px", letterSpacing: -0.1 }}>{c.quote}</div>
              {c.by && <div style={{ fontSize: 12.5, color: "var(--text3)", marginTop: 3 }}>{`\u2014 ${c.by}`}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ maxWidth: 560, width: "100%", margin: "0 auto", padding: "14px 20px 0", display: "grid", gap: 14, boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous" style={roundBtn(idx === 0)}>{I("back", 20, 2)}</button>
          <div role="tablist" aria-label="Cards" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {INSPIRE.map((c, i) => <button key={i} role="tab" aria-selected={i === idx} aria-label={`Card ${i + 1} of ${n}`} onClick={() => go(i)} style={{ width: i === idx ? 22 : 8, height: 8, borderRadius: 4, border: "none", padding: 0, background: i === idx ? "var(--accent)" : "var(--border-strong)", transition: "width .2s ease, background .2s ease", cursor: "pointer" }} />)}
          </div>
          <button onClick={() => go(idx + 1)} disabled={idx === n - 1} aria-label="Next" style={roundBtn(idx === n - 1)}>{I("chev", 20, 2)}</button>
        </div>
        <button onClick={props.onDone} style={{ minHeight: 54, borderRadius: 27, border: "none", background: "var(--accent)", color: "var(--on-accent)", fontSize: 16, fontWeight: 600, letterSpacing: -0.1, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 6px 18px rgba(155,61,110,0.28)" }}>
          {props.opening ? "Start my day" : "Back to my day"}{I("chev", 18, 2)}
        </button>
      </div>
      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }} aria-live="polite">{`Card ${idx + 1} of ${n}: ${cur.quote}`}</span>
    </div>
  );
}

/** Small Home card that reopens the carousel. */
export function InspireCard(props: { onOpen: () => void }) {
  const c = INSPIRE[0];
  return (
    <button onClick={props.onOpen} aria-label="Open daily inspiration" style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 20, border: "none", background: "var(--card)", boxShadow: "var(--shadow)", color: "var(--text)", textAlign: "left", cursor: "pointer", width: "100%" }}>
      <span style={{ width: 46, height: 46, borderRadius: 14, background: c.bg, overflow: "hidden", flex: "0 0 auto", display: "flex" }}><img src={c.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%" }} /></span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 12, color: "var(--text3)" }}>Daily inspiration</span>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600, lineHeight: "19px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Holy Mary, Mother of God, pray for us</span>
      </span>
      <span style={{ color: "var(--text3)", flex: "0 0 auto", paddingRight: 4 }}>{I("chev", 18, 2)}</span>
    </button>
  );
}
