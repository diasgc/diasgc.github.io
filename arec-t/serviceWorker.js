const staticApp = "static-app"
const assetsApp = [
  "/arec-t/",
  "/arec-t/index.html",
  "/arec-t/arec.css",
  "/arec-t/arec.js"
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