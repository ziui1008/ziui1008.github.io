(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Merge2048 = root.Merge2048 || {};
  root.Merge2048.Random = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function hashSeed(input) {
    const text = String(input);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function create(seed) {
    let state = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
    return {
      next() {
        state = (state + 0x6d2b79f5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
      },
      getState() {
        return state >>> 0;
      },
      setState(nextState) {
        state = nextState >>> 0;
      },
    };
  }

  function dailySeed(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return hashSeed(`merge-daily-${year}-${month}-${day}`);
  }

  return { create, hashSeed, dailySeed };
});
