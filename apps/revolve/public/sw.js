// Cache scoped to this editor, including when installed inside the suite.
const APP_ROOT = new URL('./', self.location.href);
const CACHE_PREFIX = 'revolve:' + APP_ROOT.pathname + ':';
const CACHE_NAME = CACHE_PREFIX + 'v23';
const PRECACHE = ['index.html', 'app.js', '../../../suite-ui.css', '../../../editor-runtime.js', 'manifest.json'].map(path => new URL(path, APP_ROOT).href);
const SHARED_THEME = new URL('../../../suite-ui.css', APP_ROOT).href;
const SHARED_RUNTIME = new URL('../../../editor-runtime.js', APP_ROOT).href;
const DEPENDENCIES = [
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/STLExporter.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(async cache => {
        await cache.addAll(PRECACHE);
        // A CDN outage must not prevent installation of the local editor.
        await Promise.allSettled(DEPENDENCIES.map(url => cache.add(url)));
    }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const localEditor = url.origin === APP_ROOT.origin && url.pathname.startsWith(APP_ROOT.pathname);
    if (event.request.method !== 'GET' || (!localEditor && url.href !== SHARED_THEME && url.href !== SHARED_RUNTIME && !DEPENDENCIES.includes(url.href))) return;
    // Network first so visual changes arrive on refresh; cached files support offline use.
    event.respondWith(fetch(event.request).then(response => {
        if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
        }
        return response;
    }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
            const fallback = await cache.match(new URL('index.html', APP_ROOT).href);
            if (fallback) return fallback;
        }
        return Response.error();
    }));
});
