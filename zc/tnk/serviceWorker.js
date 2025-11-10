const staticApp = "static-app"
const assetsApp = [
  "/zc/tnk/",
  "/zc/tnk/index.html",
  "/zc/tnk/style.css",
  "/zc/tnk/main.js",
  "/zc/tnk/fonts/stmvelish.woff",
  "/zc/tnk/kblh.js"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticApp).then(cache => {
      cache.addAll(assetsApp)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})