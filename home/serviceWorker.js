const staticApp = "static-app"
const assetsApp = [
  "/home/",
  "/home/icons/",
  "/home/index.html",
  "/home/style.css",
  "/home/main.js",
  "/home/data.js"
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