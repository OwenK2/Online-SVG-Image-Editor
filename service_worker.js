var cache_name = "pwa-v" + new Date().getTime();
var files_to_cache = [
	'index.html',
	'style.css',
	'script.js',
];

// Cache on install
self.addEventListener("install", event => {
	this.skipWaiting();
	event.waitUntil(
		caches.open(cache_name).then(cache => {
			return cache.addAll(files_to_cache);
		})
	);
});

// Clear cache on activate
self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames
				.filter(cacheName => (cacheName.startsWith("pwa-")))
				.filter(cacheName => (cacheName !== cache_name))
				.map(cacheName => caches.delete(cacheName))
			);
		})
	);
});

// Serve from Cache
self.addEventListener("fetch", event => {
	event.respondWith(
		caches.match(event.request).then(response => {
			return response || fetch(event.request);
		}).catch(() => {
			return caches.match('index.html');
		})
	)
});