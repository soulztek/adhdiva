// @ts-nocheck
import React, { ReactNode } from "react";
const BASE = (import.meta as any).env.BASE_URL || "./";

// ---------- Design tokens (shared by every screen) ----------
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 }; // spacing scale
export const R = { card: 22, inner: 14, pill: 999 };                   // radius scale
export const F = { cap: 12, meta: 13, body: 15, title: 17, h2: 22, h1: 28, big: 40 }; // type scale
export const CARD: any = { background: "var(--card)", borderRadius: R.card, boxShadow: "var(--shadow)", border: "none" };

// ---------- Inline line icons (Lucide-style, 24 grid, stroke 1.75) ----------
const PATHS: Record<string, ReactNode> = {
  home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  daily: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  workout: <><rect x="5" y="6" width="3.5" height="12" rx="1.25" /><rect x="15.5" y="6" width="3.5" height="12" rx="1.25" /><path d="M2.5 9.5v5" /><path d="M21.5 9.5v5" /><path d="M8.5 12h7" /></>,
  golf: <><path d="M8 18V2.5l9 4.25L8 11" /><path d="M3.5 19.5c0 1.1 3.8 2 8.5 2s8.5-.9 8.5-2-3.8-2-8.5-2" /></>,
  more: <><rect width="7" height="7" x="3" y="3" rx="1.5" /><rect width="7" height="7" x="14" y="3" rx="1.5" /><rect width="7" height="7" x="14" y="14" rx="1.5" /><rect width="7" height="7" x="3" y="14" rx="1.5" /></>,
  back: <path d="m15 18-6-6 6-6" />,
  chev: <path d="m9 18 6-6-6-6" />,
  down: <path d="m6 9 6 6 6-6" />,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  list: <><path d="M3 12h.01" /><path d="M3 18h.01" /><path d="M3 6h.01" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M8 6h13" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  play: <path d="M6 3.5v17l14-8.5z" />,
  flame: <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  timer: <><path d="M10 2h4" /><path d="M12 14l3-3" /><circle cx="12" cy="14" r="8" /></>,
  gauge: <><path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></>,
  target: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  calendar: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>,
  trend: <><path d="M22 7 13.5 15.5 8.5 10.5 2 17" /><path d="M16 7h6v6" /></>,
  note: <><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></>,
  ruler: <><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" /><path d="m14.5 12.5 2-2" /><path d="m11.5 9.5 2-2" /><path d="m8.5 6.5 2-2" /><path d="m17.5 15.5 2-2" /></>,
  food: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  book: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></>,
  layers: <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" /><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" /><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" /></>,
  award: <><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></>,
  bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></>,
  spark: <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5C9.5 3 11 5 12 8c1-3 2.5-5 4.5-5a2.5 2.5 0 0 1 0 5" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  trophy: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></>,
  shield: <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />,
  edit: <><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /></>,
  zap: <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />,
  split: <><path d="M16 3h5v5" /><path d="M8 3H3v5" /><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3" /><path d="m15 9 6-6" /></>,
  today: <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>,
  family: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  move: <><rect x="5" y="6" width="3.5" height="12" rx="1.25" /><rect x="15.5" y="6" width="3.5" height="12" rx="1.25" /><path d="M2.5 9.5v5" /><path d="M21.5 9.5v5" /><path d="M8.5 12h7" /></>,
  mind: <><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" /><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" /><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" /></>,
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  hug: <><circle cx="8" cy="5" r="2.5" /><circle cx="16" cy="6.5" r="2" /><path d="M3.5 21v-5a4.5 4.5 0 0 1 9 0v5" /><path d="M12.5 21v-3.5a3.5 3.5 0 0 1 7 0V21" /><path d="M6 14.5c2.5 1.5 6.5 1.5 10 .5" /></>,
  phone: <><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></>,
  wind: <><path d="M12.8 19.6A2 2 0 1 0 14 16H2" /><path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" /><path d="M9.8 4.4A2 2 0 1 1 11 8H2" /></>,
  plus: <><path d="M5 12h14" /><path d="M12 5v14" /></>,
  trash: <><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  smile: <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><path d="M9 9h.01" /><path d="M15 9h.01" /></>,
  broom: <><path d="m13 11 9-9" /><path d="M14.6 12.6c.8.8.9 2.1.2 3L10 22l-8-8 6.4-4.8c.9-.7 2.2-.6 3 .2Z" /><path d="m6.8 10.4 6.8 6.8" /><path d="m5 17 1.5-1.5" /></>,
  bell: <><path d="M10.268 21a2 2 0 0 0 3.464 0" /><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" /></>,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  mapPin: <><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  talk: <><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" /><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" /></>,
  body: <><circle cx="12" cy="4.5" r="2" /><path d="M5 9.5c2.3.9 4.6 1.3 7 1.3s4.7-.4 7-1.3" /><path d="M12 10.8V15" /><path d="m8.5 21 3.5-6 3.5 6" /></>,
  homelife: <><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 17.2s-3.2-1.9-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 2.1-3.2 4-3.2 4z" /></>,
  door: <><path d="M13 4h3a2 2 0 0 1 2 2v14" /><path d="M2 20h3" /><path d="M13 20h9" /><path d="M10 12v.01" /><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z" /></>,
  copy: <><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  share: <><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><path d="m16 6-4-4-4 4" /><path d="M12 2v13" /></>,
  drop: <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />,
  ear: <><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0" /><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4" /></>,
  scale: <><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" /><path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" /></>,
  hand: <><path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" /><path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" /><path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" /><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" /></>,
  walk: <><circle cx="13" cy="4" r="2" /><path d="m9 20 3-6 3 3v4" /><path d="m6 12 2-3 4-1 3 3 3 1" /><path d="m12 8-1 6" /></>,
  crown: <><path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5 21h14" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></>,
};
export function I(name: string, size = 20, stroke = 1.75) {
  const fill = name === "play" ? "currentColor" : "none";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth={name === "play" ? 0 : stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: "block", flex: "0 0 auto" }}>{PATHS[name]}</svg>;
}
export const Icon: any = {
  home: I("home", 22), more: I("more", 22),
  back: I("back", 22, 2), chev: I("chev", 18, 2), clock: I("clock", 15), list: I("list", 15), play: I("play", 16), check: I("check", 15, 2.5),
};

// ---------- Floating bottom nav ----------
export type NavKey = "home" | "today" | "homelife" | "body" | "mind" | "talk";
export const NAV_H = 64;
/** CSS bottom offset of the floating nav: just above the home indicator. */
export const NAV_BOTTOM = "max(12px, env(safe-area-inset-bottom))";
export function BottomNav(props: { value: NavKey; onChange: (v: NavKey) => void; badges?: Partial<Record<NavKey, string>> }) {
  const items: { k: NavKey; label: string }[] = [{ k: "home", label: "Home" }, { k: "today", label: "Today" }, { k: "homelife", label: "Home Life" }, { k: "body", label: "Body" }, { k: "mind", label: "Mind" }, { k: "talk", label: "Talk" }];
  const idx = Math.max(0, items.findIndex((x) => x.k === props.value));
  return (
    <nav aria-label="Main" style={{ position: "fixed", left: 12, right: 12, bottom: NAV_BOTTOM, zIndex: 50, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto", position: "relative", width: "100%", maxWidth: 460, height: NAV_H, padding: 6, borderRadius: 24, background: "var(--nav)", boxShadow: "0 10px 30px rgba(0,0,0,0.22), 0 2px 6px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(255,255,255,0.07)", display: "grid", gridTemplateColumns: "repeat(6,1fr)" }}>
        <span aria-hidden style={{ position: "absolute", top: 6, bottom: 6, left: 6, width: "calc((100% - 12px) / 6)", borderRadius: 18, background: "rgba(255,255,255,0.10)", transform: `translateX(${idx * 100}%)`, transition: "transform .32s cubic-bezier(.3,.7,.2,1)" }} />
        {items.map((it) => { const on = it.k === props.value; const b = props.badges && props.badges[it.k]; return (
          <button key={it.k} onClick={() => props.onChange(it.k)} aria-current={on ? "page" : undefined} aria-label={it.label}
            style={{ position: "relative", zIndex: 1, border: "none", background: "transparent", borderRadius: 18, color: on ? "#ffffff" : "#958c91", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", fontSize: 10, fontWeight: on ? 600 : 500, letterSpacing: 0, padding: 0, whiteSpace: "nowrap" }}>
            <span style={{ display: "flex", transition: "transform .25s ease", transform: on ? "translateY(-1px)" : "none" }}>{I(it.k, 20)}</span>
            <span>{it.label}</span>
            {b && <span style={{ position: "absolute", top: 4, right: "50%", marginRight: -18, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: "var(--accent)", color: "#fff", fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>{b}</span>}
          </button>
        ); })}
      </div>
    </nav>
  );
}

/** Photo hero, full-bleed with rounded bottom corners. */
export function Hero(props: { photo: string; height?: number | string; position?: string; children?: ReactNode; onBack?: () => void; fade?: boolean; contain?: boolean }) {
  return (
    <div style={{ position: "relative", margin: "0 -16px", minHeight: props.height || 260, backgroundColor: props.contain ? "#fff" : "#1a1c1b", backgroundImage: `url(${props.photo})`, backgroundSize: props.contain ? "contain" : "cover", backgroundRepeat: "no-repeat", backgroundPosition: props.position || "center", borderRadius: "0 0 28px 28px", overflow: "hidden" }}>
      {!props.contain && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)" }} />}
      {props.onBack && <button onClick={props.onBack} aria-label="Back" style={{ position: "absolute", zIndex: 2, top: "calc(env(safe-area-inset-top) + 12px)", left: 16, width: 40, height: 40, borderRadius: 20, border: "none", background: "rgba(255,255,255,0.92)", color: "#111312", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 10px rgba(0,0,0,0.12)" }}>{Icon.back}</button>}
      <div style={{ position: "relative", zIndex: 1, minHeight: props.height || 260, padding: "calc(env(safe-area-inset-top) + 16px) 20px 22px", display: "flex", flexDirection: "column", color: "#fff" }}>{props.children}</div>
    </div>
  );
}

export function HeroTitle(props: { title: string; sub?: string }) {
  return (
    <div style={{ marginTop: "auto" }}>
      <div style={{ fontSize: F.h1, fontWeight: 700, letterSpacing: -0.5, lineHeight: "34px" }}>{props.title}</div>
      {props.sub && <div style={{ fontSize: F.meta, opacity: 0.85, marginTop: 2 }}>{props.sub}</div>}
    </div>
  );
}

export function ScreenTitle(props: { title: string; sub?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div style={{ padding: "calc(env(safe-area-inset-top) + 16px) 0 4px", display: "flex", alignItems: "center", gap: 12 }}>
      {props.onBack && <button onClick={props.onBack} aria-label="Back" style={{ width: 40, height: 40, borderRadius: 20, border: "none", background: "var(--card)", boxShadow: "var(--shadow)", color: "var(--text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "0 0 auto" }}>{Icon.back}</button>}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: F.h1, fontWeight: 700, letterSpacing: -0.5, lineHeight: "34px" }}>{props.title}</div>
        {props.sub && <div style={{ fontSize: F.meta, color: "var(--text3)", marginTop: 2 }}>{props.sub}</div>}
      </div>
      {props.right}
    </div>
  );
}

/** Small round icon badge. */
export function IconDot(props: { name: string; tone?: "accent" | "ink" | "soft"; size?: number }) {
  const s = props.size || 36;
  const bg = props.tone === "ink" ? "var(--ink)" : props.tone === "accent" ? "var(--accent-subtle)" : "var(--fill2)";
  const fg = props.tone === "ink" ? "var(--on-ink)" : props.tone === "accent" ? "var(--accent)" : "var(--text)";
  return <span aria-hidden style={{ width: s, height: s, borderRadius: s / 2, background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>{I(props.name, Math.round(s * 0.5))}</span>;
}

export function StatCard(props: { icon?: string; emoji?: string; label: string; value: string; unit?: string; detail?: string; big?: boolean; onClick?: () => void; children?: ReactNode }) {
  return (
    <button onClick={props.onClick} style={{ ...CARD, textAlign: "left", cursor: props.onClick ? "pointer" : "default", padding: 16, color: "var(--text)", display: "grid", gap: 10, alignContent: "start" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: F.meta, color: "var(--text2)", fontWeight: 500 }}>{props.icon && <IconDot name={props.icon} size={28} />}{props.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexWrap: "wrap" }}>
        <span style={{ fontSize: F.h2 + 4, fontWeight: 600, letterSpacing: -0.6, lineHeight: "30px", fontVariantNumeric: "tabular-nums" }}>{props.value}</span>
        {props.unit && <span style={{ fontSize: F.meta, color: "var(--text3)" }}>{props.unit}</span>}
      </div>
      {props.detail && <div style={{ fontSize: F.cap, color: "var(--text3)", marginTop: -6 }}>{props.detail}</div>}
      {props.children}
    </button>
  );
}

export function Bar(props: { value: number; color?: string; height?: number; track?: string }) {
  const v = Math.max(0, Math.min(1, props.value || 0));
  return <div style={{ height: props.height || 4, borderRadius: 99, background: props.track || "var(--fill2)", overflow: "hidden" }}><div style={{ width: `${v * 100}%`, height: "100%", borderRadius: 99, background: props.color || "var(--accent)", transition: "width .4s ease" }} /></div>;
}

export function Chip(props: { icon?: ReactNode; label: string; tone?: "accent" | "soft" | "ink" | string }) {
  const tone = props.tone || "soft";
  const bg = tone === "accent" ? "var(--accent-subtle)" : tone === "ink" ? "var(--ink)" : "var(--fill2)";
  const fg = tone === "accent" ? "var(--link)" : tone === "ink" ? "var(--on-ink)" : "var(--text2)";
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 28, padding: "0 11px", borderRadius: 999, background: bg, color: fg, fontSize: F.cap, fontWeight: 500, whiteSpace: "nowrap" }}>{props.icon}{props.label}</span>;
}

export function CategoryCard(props: { title: string; color?: string; lines: string[]; value: number; photo?: string; photoPos?: string; photoBg?: string; meta?: string; ink?: string; emoji?: string; onClick: () => void }) {
  return (
    <button onClick={props.onClick} style={{ ...CARD, flex: "0 0 68%", maxWidth: 260, padding: 10, cursor: "pointer", textAlign: "left", color: "var(--text)", display: "grid", gap: 10 }}>
      <div style={{ height: 104, borderRadius: 16, backgroundColor: props.photoBg || "#1a1c1b", backgroundImage: props.photo ? `url(${props.photo})` : undefined, backgroundSize: "cover", backgroundPosition: props.photoPos || "center" }} />
      <div style={{ padding: "0 6px 6px", display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: F.title, fontWeight: 600 }}>{props.title}</span>
          {props.meta && <span style={{ fontSize: F.cap, color: "var(--text3)", whiteSpace: "nowrap" }}>{props.meta}</span>}
        </div>
        {props.lines.map((l, i) => <div key={i} style={{ fontSize: F.meta, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l}</div>)}
        <div style={{ marginTop: 4 }}><Bar value={props.value} color={props.ink} /></div>
      </div>
    </button>
  );
}

export function Thumb(props: { src?: string | null; size?: number; fallback?: string; radius?: number }) {
  const s = props.size || 64;
  return props.src
    ? <img src={props.src} alt="" loading="lazy" decoding="async" width={s} height={s} style={{ width: s, height: s, objectFit: "cover", borderRadius: props.radius || 14, background: "#fff", flex: "0 0 auto", display: "block" }} />
    : <div style={{ width: s, height: s, borderRadius: props.radius || 14, flex: "0 0 auto", background: "var(--fill2)", color: "var(--text3)", display: "flex", alignItems: "center", justifyContent: "center" }}>{I(props.fallback || "workout", Math.round(s * 0.36))}</div>;
}

export function WorkoutCard(props: { title: string; lines: string[]; chips?: string[]; value: number; progressLabel: string; thumb?: string | null; fallback?: string; badge?: string; onClick: () => void }) {
  return (
    <button onClick={props.onClick} style={{ ...CARD, width: "100%", display: "flex", gap: 14, alignItems: "center", padding: 14, cursor: "pointer", textAlign: "left", color: "var(--text)" }}>
      <div style={{ flex: 1, display: "grid", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: F.title, fontWeight: 600, lineHeight: "22px" }}>{props.title}</span>
          {props.badge && <Chip label={props.badge} tone={props.badge === "Optional" ? "soft" : "accent"} />}
        </div>
        {props.chips && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{props.chips.map((c, i) => <Chip key={i} icon={i === 0 ? I("clock", 13) : I("list", 13)} label={c} />)}</div>}
        {props.lines.map((l, i) => <div key={i} style={{ fontSize: F.meta, color: "var(--text3)" }}>{l}</div>)}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, maxWidth: 150 }}><Bar value={props.value} /></div>
          <span style={{ fontSize: F.cap, color: "var(--text3)", fontVariantNumeric: "tabular-nums" }}>{props.progressLabel}</span>
        </div>
      </div>
      <Thumb src={props.thumb} size={84} fallback={props.fallback} radius={16} />
    </button>
  );
}

/** Round tick button. */
export function Tick(props: { done: boolean; onClick: () => void; label: string; size?: number }) {
  const s = props.size || 30;
  return <button onClick={props.onClick} aria-label={props.label} aria-pressed={props.done} style={{ width: s, height: s, flex: "0 0 auto", borderRadius: s / 2, border: props.done ? "none" : "1.75px solid var(--border-strong)", background: props.done ? "var(--accent)" : "transparent", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>{props.done ? I("check", Math.round(s * 0.52), 2.5) : null}</button>;
}

export function ExerciseRow(props: { title: string; sub: string; done: boolean; thumb?: string | null; fallback?: string; onTap: () => void; onOpen?: () => void; active?: boolean }) {
  return (
    <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 12, padding: 10, paddingRight: 14, borderRadius: 18, boxShadow: props.active ? "0 0 0 1.5px var(--accent), var(--shadow)" : "var(--shadow)" }}>
      <button onClick={props.onOpen || props.onTap} aria-label={`Show ${props.title}`} style={{ border: "none", padding: 0, background: "transparent", cursor: "pointer" }}><Thumb src={props.thumb} size={56} fallback={props.fallback} /></button>
      <button onClick={props.onOpen || props.onTap} style={{ flex: 1, border: "none", background: "transparent", textAlign: "left", padding: 0, cursor: "pointer", color: "var(--text)", display: "grid", gap: 3 }}>
        <span style={{ fontSize: F.body, fontWeight: 600, lineHeight: "20px", color: props.done ? "var(--text3)" : "var(--text)" }}>{props.title}</span>
        <span style={{ fontSize: F.meta - 0.5, color: "var(--text3)" }}>{props.sub}</span>
      </button>
      <Tick done={props.done} onClick={props.onTap} label={props.done ? `Untick ${props.title}` : `Tick ${props.title}`} />
    </div>
  );
}

export function MenuRow(props: { icon?: string; emoji?: string; title: string; sub?: string; onClick: () => void }) {
  return (
    <button onClick={props.onClick} style={{ ...CARD, borderRadius: 18, width: "100%", minHeight: 64, display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", cursor: "pointer", textAlign: "left", color: "var(--text)" }}>
      <IconDot name={props.icon || "info"} size={38} />
      <span style={{ flex: 1 }}><span style={{ display: "block", fontSize: F.body, fontWeight: 600 }}>{props.title}</span>{props.sub && <span style={{ display: "block", fontSize: F.meta - 0.5, color: "var(--text3)", marginTop: 1 }}>{props.sub}</span>}</span>
      <span style={{ color: "var(--text3)" }}>{Icon.chev}</span>
    </button>
  );
}

export function SectionTitle(props: { children: ReactNode; action?: ReactNode }) {
  return <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "10px 2px 0" }}><div style={{ fontSize: F.title + 1, fontWeight: 600, letterSpacing: -0.2 }}>{props.children}</div>{props.action}</div>;
}
