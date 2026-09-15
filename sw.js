/* ---------------- the offline copy ----------------
   Keeps a copy of the app on the phone so it opens with no signal, which is
   also what lets it install to the home screen.

   Two strategies, because the page and its assets want different things:

   - The page itself is network-first with a short timeout. New material is
     added after every class, so an update has to land on the NEXT open, not
     the one after. If the network is slow or absent we fall back to the cached
     copy, so a bad classroom connection still costs at most a moment.

   - Everything else (script, icons, manifest) is cache-first and refreshed in
     the background. Those change rarely and should never delay a round.

   Both paths wrap their background work in waitUntil. Without it the browser
   is free to kill the worker the moment a response is returned, which aborts
   the refresh — the cache then never updates and published changes silently
   never arrive. That bug was live and is the reason this file has a v2.

   Progress is NOT touched here. It lives in IndexedDB (js/progress.js), which
   caches never clear — that separation is the whole point of the rehousing. */

var VERSION = "portu-v4";
var NET_TIMEOUT = 2500;

var SHELL = [
  "./",
  "./index.html",
  "./js/progress.js",
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(c){
      /* addAll is all-or-nothing; one 404 would leave the app with no offline
         copy at all, so each file is allowed to fail on its own. */
      return Promise.all(SHELL.map(function(url){
        return c.add(url).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        return k === VERSION ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* store only real, complete, same-origin responses */
function keep(c, req, res){
  if(res && res.status === 200 && res.type === "basic") c.put(req, res.clone());
  return res;
}

function offline(c, req){
  if(req.mode === "navigate") return c.match("./index.html");
  return new Response("", {status: 504, statusText: "offline"});
}

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(new URL(req.url).origin !== self.location.origin) return;

  var isPage = req.mode === "navigate";

  e.respondWith(caches.open(VERSION).then(function(c){
    var net = fetch(req).then(function(res){ return keep(c, req, res); });

    /* keep the worker alive until the network work finishes, whichever
       strategy won the race — otherwise the cache never updates */
    e.waitUntil(net.catch(function(){}));

    if(isPage){
      /* newest wins, but never wait long for it */
      return new Promise(function(resolve){
        var done = false;
        var settle = function(r){ if(!done){ done = true; resolve(r); } };
        var fallback = function(){
          c.match(req).then(function(hit){
            return hit || c.match("./index.html");
          }).then(function(hit){ settle(hit || offline(c, req)); });
        };

        var timer = setTimeout(fallback, NET_TIMEOUT);
        net.then(function(res){ clearTimeout(timer); settle(res); })
           .catch(function(){ clearTimeout(timer); fallback(); });
      });
    }

    /* assets: cached copy immediately, refreshed behind it */
    return c.match(req).then(function(hit){
      if(hit) return hit;
      return net.catch(function(){ return offline(c, req); });
    });
  }));
});
