// Copyright 2016 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

let cache = null;
let dataCacheName = 'appData-v1';
let cacheName = 'app';
let filesToCache = [
    '/',
    '/javascripts/index.js',
    '/stylesheets/style.css',
    '/javascripts/database.js',
    '/javascripts/idb/index.js',
    '/socket.io/socket.io.js',
    '/javascripts/canvas.js',
    '/javascripts/jquery.min.js',
    '/stylesheets/bootstrap.css',
    '/javascripts/bootstrap.js',
    // 'https://www.gstatic.com/knowledge/kgsearch/widget/1.0/widget.min.js',
    // 'https://www.gstatic.com/knowledge/kgsearch/widget/1.0/widget.min.css'
];


/**
 * installation event: it adds all the files to be cached
 */
self.addEventListener('install', function(e) {
    console.log('[ServiceWorker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function(cacheX) {
            console.log('[ServiceWorker] Caching app shell');
            cache = cacheX;
            return cache.addAll(filesToCache);
        })
    );
});


/**
 * activation of service worker: it removes all cashed files if necessary
 */
self.addEventListener('activate', function(e) {
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(keyList.map(function(key) {
                if (key !== cacheName && key !== dataCacheName) {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    /*
     * Fixes a corner case in which the app wasn't returning the latest data.
     * You can reproduce the corner case by commenting out the line below and
     * then doing the following steps: 1) load app for first time so that the
     * initial New York City data is shown 2) press the refresh button on the
     * app 3) go offline 4) reload the app. You expect to see the newer NYC
     * data, but you actually see the initial data. This happens because the
     * service worker is not yet activated. The code below essentially lets
     * you activate the service worker faster.
     */
    return self.clients.claim();
});


/**
 * this is called every time a file is fetched. This is a middleware, i.e. this method is
 * called every time a page is fetched by the browser
 * there are two main branches:
 * /weather_data posts cities names to get data about the weather from the server. if offline, the fetch will fail and the
 *      control will be sent back to Ajax with an error - you will have to recover the situation
 *      from there (e.g. showing the cached data)
 * all the other pages are searched for in the cache. If not found, they are returned
 */
self.addEventListener('fetch', function(e) {
    console.log('[Service Worker] Fetch', e.request.url);
    let dataUrl = '/api';
    //if the request is '/weather_data', post to the server - do nit try to cache it
    if (e.request.url.indexOf(dataUrl) > -1
        || e.request.url.indexOf("socket.io/?EIO=") > -1
        || e.request.url.indexOf("https://www.gstatic.com/") > -1) {

        if (e.request.url.indexOf("socket.io/?EIO=")
            || e.request.url.indexOf("https://www.gstatic.com/")) {
            return;
        }
        return fetch(e.request)
            .then((response) => {
                // note: it the network is down, response will contain the error
                // that will be passed to Ajax
                return response;
            })
            .catch((error) => {
                return error;
            })
    } else {
        /*
         * The app is asking for app shell files. In this scenario the app uses the
         * "Cache, falling back to the network" offline strategy:
         * https://jakearchibald.com/2014/offline-cookbook/#cache-falling-back-to-network
         */
        // if (e.request.destination === 'image') {
        // Open the cache
        e.respondWith(caches.open(cacheName).then((cache) => {
            // Respond with the image from the cache or from the network
            return cache.match(e.request).then((cachedResponse) => {
                return cachedResponse || fetch(e.request.url).then((fetchedResponse) => {
                    // Add the network response to the cache for future visits.
                    // Note: we need to make a copy of the response to save it in
                    // the cache and use the original as the request response.
                    cache.put(e.request, fetchedResponse.clone());

                    // Return the network response
                    return fetchedResponse;
                });
            }).catch(function(err) {
                console.log("error: " + err);
                return err
            });
        }));
    }
});
