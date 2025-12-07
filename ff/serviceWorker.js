const staticApp = "static-app"
const name="ff"
const assetsApp = [
  `${name}/`,
  `${name}/index.html`,
  `${name}/style.css`,
  `${name}/main.js`
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(staticApp).then(cache => {
      cache.addAll(assetsApp)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  if (fetchEvent.request.cache === "only-if-cached" && fetchEvent.request.mode !== "same-origin") {
    return;
  }

  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      if (res) {
        return res;
      }
      return fetch(fetchEvent.request).then(response => {
        const newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      });
    })
  )
})