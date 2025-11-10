const staticApp = "static-app"
const assetsApp = [
  "/hexv/",
  "/hexv/icons/",
  "/hexv/index.html",
  "/hexv/meta.html",
  "/hexv/hexv.css",
  "/hexv/hexv.js",
  "/hexv/datareader.js",
  "/hexv/commom.js"
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