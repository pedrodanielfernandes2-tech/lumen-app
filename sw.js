/* Lumen · Minha escala: abre rápido (guarda a "casca" do app) e mostra os avisos da escala. Os dados vêm sempre da conta. */
const V = "minha-escala-v2";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return; /* conta e dados: direto na internet */
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html"))));
});
/* aviso chegando */
self.addEventListener("push", e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "Minha escala", {
    body: d.body || "", tag: d.tag || "escala", renotify: true,
    icon: "icon-192.png", badge: "icon-192.png", data: { url: d.url || "./#minhas" }
  }));
});
/* tocou no aviso: abre (ou traz para frente) o app nas vagas */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const alvo = new URL((e.notification.data && e.notification.data.url) || "./#minhas", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if (w.url.startsWith(self.registration.scope)) { w.focus(); return w.navigate ? w.navigate(alvo) : null; } }
    return self.clients.openWindow(alvo);
  }));
});
