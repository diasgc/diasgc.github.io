const staticAudioRecorder = "static-audiorecorder2"
const assets = [
  "/",
  "/index.html",
  "/arec.css",
  "/arec.js"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticAudioRecorder).then(cache => {
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