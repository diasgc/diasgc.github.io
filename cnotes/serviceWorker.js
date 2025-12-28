const staticApp = "static-app"
const n = "cnotes";
const assetsApp = [
  `${n}/`,
  `${n}/index.html`,
  `${n}/style.css`,
  `${n}/main.js`
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