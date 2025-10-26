const staticTimelapseJs = "static-timelapseJs"
const assets = [
  "/tl/",
  "/tl/index.html",
  "/tl/tljs.css",
  "/tl/tljs.js"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticTimelapseJs).then(cache => {
      cache.addAll(assets)
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