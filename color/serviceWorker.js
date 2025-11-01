const staticTimelapseJs = "static-timelapseJs"
const assets = [
  "/color/",
  "/color/index.html",
  "/color/style.css",
  "/color/main.js"
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