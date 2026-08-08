(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Merge2048 = root.Merge2048 || {};
  root.Merge2048.Audio = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const PACKS = Object.freeze({
    hajimi: Object.freeze([
      "audio/哈基米/ha.wav",
      "audio/哈基米/ha_new.wav",
      "audio/哈基米/ji.wav",
      "audio/哈基米/ji_new.wav",
      "audio/哈基米/mi.wav",
      "audio/哈基米/mi_new.wav",
    ]),
    dagou: Object.freeze([
      "audio/大狗/da.wav",
      "audio/大狗/gou.wav",
      "audio/大狗/jiao.wav",
    ]),
  });

  const basePlayers = new Map();
  const lastPlayed = new Map();
  const activeVoices = [];
  const MAX_VOICES = 8;

  function canPlayAudio() {
    return typeof root.Audio === "function";
  }

  function getPlayers(pack) {
    if (!PACKS[pack] || !canPlayAudio()) return [];
    if (!basePlayers.has(pack)) {
      const players = PACKS[pack].map((source) => {
        const audio = new root.Audio();
        audio.preload = "auto";
        audio.src = encodeURI(source);
        audio.load();
        return audio;
      });
      basePlayers.set(pack, players);
    }
    return basePlayers.get(pack);
  }

  function preload(pack) {
    getPlayers(pack);
  }

  function chooseIndex(pack, length, randomValue) {
    if (length <= 1) return 0;
    let index = Math.floor(randomValue * length);
    if (index === lastPlayed.get(pack)) index = (index + 1) % length;
    lastPlayed.set(pack, index);
    return index;
  }

  function removeVoice(voice) {
    const index = activeVoices.indexOf(voice);
    if (index >= 0) activeVoices.splice(index, 1);
  }

  function stopAll() {
    activeVoices.splice(0).forEach((voice) => voice.pause());
  }

  function playRandom(pack, randomValue) {
    if (pack === "off") return Promise.resolve(false);
    const players = getPlayers(pack);
    if (!players.length) return Promise.resolve(false);

    const value = Number.isFinite(randomValue) ? randomValue : Math.random();
    const index = chooseIndex(pack, players.length, Math.max(0, Math.min(0.999999, value)));
    const voice = players[index].cloneNode(true);
    voice.volume = pack === "dagou" ? 0.72 : 0.78;
    activeVoices.push(voice);

    while (activeVoices.length > MAX_VOICES) {
      const oldest = activeVoices.shift();
      oldest.pause();
    }

    voice.addEventListener("ended", () => removeVoice(voice), { once: true });
    voice.addEventListener("error", () => removeVoice(voice), { once: true });
    const result = voice.play();
    return result && typeof result.catch === "function"
      ? result.then(() => true).catch(() => {
        removeVoice(voice);
        return false;
      })
      : Promise.resolve(true);
  }

  return { PACKS, preload, playRandom, chooseIndex, stopAll };
});
