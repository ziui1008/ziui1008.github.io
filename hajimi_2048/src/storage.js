(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Merge2048 = root.Merge2048 || {};
  root.Merge2048.Storage = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KEY = "merge-2048-state-v1";
  const VERSION = 1;
  let memoryValue = null;
  let available = true;

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return memoryValue;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== VERSION) return null;
      return parsed;
    } catch (_error) {
      available = false;
      return memoryValue;
    }
  }

  function write(payload) {
    const value = { ...payload, version: VERSION };
    memoryValue = value;
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
      available = true;
      return true;
    } catch (_error) {
      available = false;
      return false;
    }
  }

  function clear() {
    memoryValue = null;
    try {
      localStorage.removeItem(KEY);
      available = true;
    } catch (_error) {
      available = false;
    }
  }

  function isAvailable() {
    return available;
  }

  return { KEY, VERSION, read, write, clear, isAvailable };
});
