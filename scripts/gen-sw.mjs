import fs from "fs"; import path from "path";
const dist = path.resolve("dist");
const files = [];
(function walk(d){ for (const f of fs.readdirSync(d)) { const p = path.join(d,f); if (fs.statSync(p).isDirectory()) walk(p); else files.push("./" + path.relative(dist,p).split(path.sep).join("/")); } })(dist);
const list = files.filter(f => f !== "./sw.js");
const APP_VERSION = "v1";
const version = "adhdiva-" + APP_VERSION + "-" + Date.now();
const sw = `// ADHDiva service worker. Only ever touches caches named adhdiva-* so it never clears another app on the same origin.
const CACHE = ${JSON.stringify(version)};
const ASSETS = ${JSON.stringify(["./", ...list], null, 0)};
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith("adhdiva-") && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put("./", cp)); return r; }).catch(() => caches.match("./").then((r) => r || caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); } return r; })));
});
`;
fs.writeFileSync(path.join(dist, "sw.js"), sw);
console.log("sw.js with", ASSETS_COUNT(list), "assets");
function ASSETS_COUNT(l){return l.length+1;}
