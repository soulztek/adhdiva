// @ts-nocheck
import React, { useState } from "react";
import { useGrokTheme } from "./kit";
import { DEMOS } from "./demos.generated";

const BASE = (import.meta as any).env.BASE_URL || "./";
export function hasDemo(id: string): boolean { return !!DEMOS[id]; }
export function demoKind(id: string): "anim" | "video" | "none" { const d = DEMOS[id]; return !d ? "none" : d.img ? "anim" : d.videos ? "video" : "none"; }

function ytUrl(id: string) { return `https://www.youtube.com/watch?v=${id}`; }

function WatchLinks(props: { videos: any[]; compact?: boolean }) {
  const t = useGrokTheme();
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {props.videos.map((v, i) => (
        <a key={v.id + i} href={ytUrl(v.id)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44, padding: "6px 12px 6px 6px", borderRadius: 14, border: "none", background: t.fill.secondary, color: t.text.primary, textDecoration: "none", fontSize: 14 }}>
          <span aria-hidden style={{ flex: "0 0 auto", width: 32, height: 32, borderRadius: 16, background: "var(--ink)", color: "var(--on-ink)", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5v17l14-8.5z" /></svg></span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: "block", fontWeight: 500 }}>{i === 0 ? "Watch how" : "Another demo"}</span>
            <span style={{ display: "block", color: t.text.tertiary, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{`${v.channel} · ${v.title}`}</span>
          </span>
        </a>
      ))}
    </div>
  );
}

/** Thumbnail (or "Watch how" chip) that expands into a full-width looping demo with cues. */
export function DemoBlock(props: { id: string; defaultOpen?: boolean; onClose?: () => void }) {
  const t = useGrokTheme();
  const d = DEMOS[props.id];
  const [open, setOpen] = useState<boolean>(!!props.defaultOpen);
  if (!d) return null;
  if (!d.img) {
    return d.videos ? <WatchLinks videos={d.videos.slice(0, open ? 2 : 1)} /> : null;
  }
  const src = BASE + d.img;
  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} aria-label="Show how-to demo"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: 6, paddingRight: 14, minHeight: 44, borderRadius: 14, border: "none", background: t.fill.secondary, color: t.text.primary, cursor: "pointer", textAlign: "left", fontSize: 14 }}>
        <img src={src} loading="lazy" decoding="async" alt="" width={72} height={Math.round((72 * d.h) / d.w)} style={{ width: 64, height: "auto", borderRadius: 10, display: "block", background: "#fff" }} />
        <span><span style={{ display: "block", fontWeight: 500 }}>How-to demo</span><span style={{ display: "block", fontSize: 12, color: t.text.tertiary }}>Tap to expand</span></span>
      </button>
    );
  }
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "grid", gap: 10, padding: 10, borderRadius: 16, border: "none", background: t.fill.secondary }}>
      <img src={src} loading="lazy" decoding="async" alt={`${d.src} demo`} width={d.w} height={d.h} onClick={() => (props.onClose ? props.onClose() : setOpen(false))} style={{ width: "100%", height: "auto", maxHeight: 340, objectFit: "contain", borderRadius: 10, display: "block", background: "#fff", cursor: "zoom-out" }} />
      {d.note && <div style={{ fontSize: 13, color: t.text.secondary, padding: "0 4px" }}>{d.note}</div>}
      <ul style={{ margin: 0, paddingLeft: 22, display: "grid", gap: 4, fontSize: 13.5, lineHeight: "19px", color: t.text.secondary }}>{d.cues.map((c, i) => <li key={i}>{c}</li>)}</ul>
      <div style={{ fontSize: 11, color: t.text.tertiary, padding: "0 4px" }}>{`Image: "${d.src}", free-exercise-db (public domain)`}</div>
      {d.videos && <WatchLinks videos={d.videos} />}
      <button onClick={() => (props.onClose ? props.onClose() : setOpen(false))} style={{ minHeight: 44, borderRadius: 999, border: "none", background: t.bg.elevated, color: t.text.primary, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Close demo</button>
    </div>
  );
}

export function demoThumb(id?: string): string | null { const d = id ? DEMOS[id] : null; return d && d.img ? BASE + d.img : null; }
export function demoVideo(id?: string): any | null { const d = id ? DEMOS[id] : null; return d && d.videos ? d.videos[0] : null; }
