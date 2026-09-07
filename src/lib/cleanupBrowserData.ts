/**
 * Automatically cleans legacy cached data, old service workers,
 * obsolete IndexedDB instances, and stale storage keys from rifff.eu.cc
 */
export async function cleanOldBrowserData(): Promise<void> {
  if (typeof window === "undefined") return;

  const CLEANUP_FLAG_KEY = "riff_browser_clean_v2026_09";

  // Check if cleanup has already run on this browser version
  try {
    if (localStorage.getItem(CLEANUP_FLAG_KEY) === "done") {
      return;
    }
  } catch (_) {}

  console.log("[Riff] Performing automatic browser data & cache reset for rifff.eu.cc...");

  try {
    // 1. Unregister all obsolete Service Workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log("[Riff] Unregistered stale service worker:", reg.scope);
      }
    }

    // 2. Wipe all CacheStorage entries
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
        console.log("[Riff] Cleared CacheStorage:", name);
      }
    }

    // 3. Delete obsolete IndexedDB databases
    if ("indexedDB" in window && typeof indexedDB.databases === "function") {
      try {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name && (db.name.includes("riff") || db.name.includes("Dexie") || db.name.includes("music"))) {
            indexedDB.deleteDatabase(db.name);
            console.log("[Riff] Deleted legacy IndexedDB:", db.name);
          }
        }
      } catch (e) {
        console.warn("[Riff] IndexedDB cleanup warning:", e);
      }
    }

    // 4. Wipe stale localStorage keys (preserving the cleanup flag)
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key !== CLEANUP_FLAG_KEY) {
        localStorage.removeItem(key);
      }
    }

    // 5. Clear sessionStorage
    sessionStorage.clear();

    // 6. Set completion flag
    localStorage.setItem(CLEANUP_FLAG_KEY, "done");
    console.log("[Riff] Browser cache and storage cleanup successfully completed.");
  } catch (err) {
    console.warn("[Riff] Browser cleanup error:", err);
  }
}
