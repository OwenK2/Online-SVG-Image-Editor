

window.addEventListener('load', function() {
    if('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service_worker.js', {scope: '.'})
        .then(function (registration) {}, function (err) {
            console.error('PWA: ServiceWorker registration failed: ', err);
        });
    }
});