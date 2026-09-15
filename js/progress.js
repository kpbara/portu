/* ---------------- where progress is saved ----------------
   The prototype kept progress in the Claude artifact's storage, which was tied
   to that exact copy of the app: reissuing the file meant a fresh, empty store
   and the learner lost everything. Here it lives in the browser's own storage
   instead, keyed to the site rather than to a build, so publishing an update
   leaves progress untouched. That is the whole point of the rehousing.

   IndexedDB first, localStorage as a fallback — Safari in private mode and a
   few locked-down Android browsers refuse IndexedDB, and silently losing every
   round on those phones would be worse than the bug we just left behind.

   PortuStore.get(key)        -> Promise<string|null>
   PortuStore.set(key, value) -> Promise
   PortuStore.clear()         -> Promise                                       */

window.PortuStore = (function(){
"use strict";

var DB = "portu", STORE = "kv", VERSION = 1;
var dbp = null;          /* the open request, made once and reused */

/* localStorage stand-in, used when IndexedDB is unavailable */
var LS = {
  get: function(k){
    try { return Promise.resolve(window.localStorage.getItem(DB + ":" + k)); }
    catch(e){ return Promise.resolve(null); }
  },
  set: function(k, v){
    try { window.localStorage.setItem(DB + ":" + k, v); } catch(e){}
    return Promise.resolve();
  },
  clear: function(){
    try {
      var kill = [], i;
      for(i = 0; i < window.localStorage.length; i++){
        var key = window.localStorage.key(i);
        if(key && key.indexOf(DB + ":") === 0) kill.push(key);
      }
      kill.forEach(function(k){ window.localStorage.removeItem(k); });
    } catch(e){}
    return Promise.resolve();
  }
};

function open(){
  if(dbp) return dbp;
  dbp = new Promise(function(resolve, reject){
    if(!window.indexedDB) return reject(new Error("no indexedDB"));
    var req;
    try { req = window.indexedDB.open(DB, VERSION); }
    catch(e){ return reject(e); }
    req.onupgradeneeded = function(){
      var db = req.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = function(){ resolve(req.result); };
    req.onerror   = function(){ reject(req.error); };
    req.onblocked = function(){ reject(new Error("blocked")); };
    /* Firefox in private mode neither resolves nor errors. Do not hang. */
    setTimeout(function(){ reject(new Error("timeout")); }, 3000);
  });
  return dbp;
}

function tx(mode, run){
  return open().then(function(db){
    return new Promise(function(resolve, reject){
      var t = db.transaction(STORE, mode);
      var out = run(t.objectStore(STORE));
      t.oncomplete = function(){ resolve(out && out.result); };
      t.onerror    = function(){ reject(t.error); };
      t.onabort    = function(){ reject(t.error); };
    });
  });
}

function get(key){
  return tx("readonly", function(s){ return s.get(key); })
    .then(function(v){ return v === undefined ? null : v; })
    .catch(function(){ return LS.get(key); });
}

function set(key, value){
  return tx("readwrite", function(s){ return s.put(value, key); })
    .catch(function(){ return LS.set(key, value); });
}

function clear(){
  return tx("readwrite", function(s){ return s.clear(); })
    .catch(function(){})
    .then(function(){ return LS.clear(); });   /* clear both, whichever was used */
}

return { get: get, set: set, clear: clear };
})();
