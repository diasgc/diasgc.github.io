const staticApp = "static-app"
const assets = [
  "/glsl/",
  "/glsl/editor.html",
  "/glsl/editor.css",
  "/glsl/editor.js",
  "/glsl/shaders/",
  "/glsl/shaders/def.frag",
  "/glsl/shaders/toy-gyro.frag",
  "/glsl/shaders/toy-MddGWN.frag",
  "/glsl/shaders/toy-mtyGWy.frag",
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticApp).then(cache => {
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