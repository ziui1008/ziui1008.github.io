(function (root) {
  "use strict";

  const DATA = root.GAME_DATA || (typeof require === "function" ? require("./data.js") : null);
  const SAVE_VERSION = 2;

  function hashSeed(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function nextRandom(state) {
    state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
    return state.seed / 4294967296;
  }

  function randomItem(state, list) {
    return list[Math.floor(nextRandom(state) * list.length)];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createGame(config) {
    if (!config || !Array.isArray(config.players) || config.players.length < 2 || config.players.length > 6) {
      throw new Error("游戏需要 2 到 6 位玩家");
    }

    const now = Date.now();
    const seed = Number.isInteger(config.seed) ? config.seed >>> 0 : hashSeed(`${now}-${config.players.join("-")}`);
    const players = config.players.map((name, index) => ({
      id: `player-${index + 1}`,
      name: String(name || `玩家${index + 1}`).trim().slice(0, 10),
      color: DATA.playerColors[index],
      position: 0,
      tickets: 8,
      transport: 1,
      friendship: 0,
      visits: [],
      universities: [],
      provinces: [],
      regions: [],
      objectiveId: DATA.objectives[index % DATA.objectives.length].id
    }));

    return {
      version: SAVE_VERSION,
      createdAt: now,
      seed,
      players,
      currentPlayer: 0,
      round: 1,
      maxRounds: Math.max(3, Number(config.maxRounds) || 10),
      privacy: Boolean(config.privacy),
      status: "ready",
      useBoost: false,
      lastRoll: null,
      logs: [{ text: "毕业旅行正式出发", type: "start", playerId: null }]
    };
  }

  function currentPlayer(state) {
    return state.players[state.currentPlayer];
  }

  function toggleBoost(state) {
    const player = currentPlayer(state);
    if (state.status !== "ready" || player.transport < 1) return false;
    state.useBoost = !state.useBoost;
    return state.useBoost;
  }

  function roll(state, forcedRoll) {
    if (state.status !== "ready") throw new Error("当前不能掷骰子");
    const player = currentPlayer(state);
    const die = Number.isInteger(forcedRoll) ? Math.min(6, Math.max(1, forcedRoll)) : Math.floor(nextRandom(state) * 6) + 1;
    const boost = state.useBoost && player.transport > 0 ? 2 : 0;
    if (boost) player.transport -= 1;

    const steps = die + boost;
    const rawPosition = player.position + steps;
    const passedStart = rawPosition >= DATA.board.length;
    player.position = rawPosition % DATA.board.length;
    if (passedStart) {
      player.tickets += 2;
      addLog(state, `${player.name} 环游一圈，获得 2 张返校饭票`, "start", player.id);
    }

    state.lastRoll = { die, boost, steps, playerId: player.id, position: player.position };
    state.useBoost = false;
    state.status = "resolving";
    return clone(state.lastRoll);
  }

  function applyEffects(player, effects) {
    if (!effects) return;
    if (effects.tickets) player.tickets = Math.max(0, player.tickets + effects.tickets);
    if (effects.transport) player.transport = Math.max(0, player.transport + effects.transport);
    if (effects.friendship) player.friendship = Math.max(0, player.friendship + effects.friendship);
  }

  function resolveLanding(state) {
    if (state.status !== "resolving") throw new Error("没有需要结算的落点");
    const player = currentPlayer(state);
    const space = DATA.board[player.position];
    let card;

    if (space.type === "school") {
      const candidates = (space.hostIds || [space.schoolId])
        .map((id) => DATA.classmates.find((item) => item.id === id))
        .filter(Boolean);
      const unvisited = candidates.filter((item) => !player.visits.includes(item.id));
      const school = randomItem(state, unvisited.length ? unvisited : candidates);
      if (!school) throw new Error(`城市落点“${space.label}”没有可用同学`);
      const firstVisit = !player.visits.includes(school.id);
      const firstUniversity = !player.universities.includes(school.school);
      const firstProvince = !player.provinces.includes(school.province);
      const paid = player.tickets > 0;

      if (paid) player.tickets -= 1;
      player.friendship += firstVisit ? 2 : 1;
      if (firstProvince) player.friendship += 1;
      if (firstVisit) player.visits.push(school.id);
      if (firstUniversity) player.universities.push(school.school);
      if (firstProvince) player.provinces.push(school.province);
      if (!player.regions.includes(school.region)) player.regions.push(school.region);

      const gains = [`+${firstVisit ? 2 : 1} 友谊`];
      if (firstProvince) gains.push("+1 新省份");
      gains.push(paid ? "-1 饭票" : "同学请客");
      card = {
        kind: "school",
        kicker: firstVisit ? `${school.tag} · 抵达 ${school.city}` : `${school.tag} · 再次来到 ${school.city}`,
        title: school.school,
        body: school.note,
        icon: school.short.slice(0, 1),
        effectText: gains.join(" · "),
        school: clone(school),
        firstVisit
      };
      addLog(state, `${player.name} 拜访了${state.privacy ? school.short : school.name}`, "school", player.id);
    } else if (space.type === "event") {
      const event = randomItem(state, DATA.events);
      applyEffects(player, event.effects);
      card = { kind: "event", kicker: "旅途事件", ...clone(event) };
      addLog(state, `${player.name} 遇到「${event.title}」`, "event", player.id);
    } else if (space.type === "memory") {
      const memory = randomItem(state, DATA.memories);
      applyEffects(player, memory.effects);
      card = { kind: "memory", kicker: "高中回忆", ...clone(memory) };
      addLog(state, `${player.name} 翻开一页毕业相册`, "memory", player.id);
    } else if (space.type === "transport") {
      player.transport += 1;
      card = {
        kind: "transport",
        kicker: "抵达交通枢纽",
        title: space.label,
        body: "换乘顺利，还抢到了一张可以加速赶路的车票。下次掷骰前可以使用。",
        icon: "车",
        effectText: "+1 车票"
      };
      addLog(state, `${player.name} 在${space.label}补充了车票`, "transport", player.id);
    } else if (space.type === "rest") {
      player.tickets += 2;
      card = {
        kind: "rest",
        kicker: "旅途补给",
        title: space.label,
        body: "回到熟悉的补给点，整理照片，也给接下来的饭局留足预算。",
        icon: "补",
        effectText: "+2 饭票"
      };
      addLog(state, `${player.name} 完成了一次旅途补给`, "rest", player.id);
    } else {
      player.tickets += 1;
      card = {
        kind: "start",
        kicker: "回到起点",
        title: "高中校门",
        body: "兜兜转转又回到最熟悉的地方。门卫似乎还记得你。",
        icon: "校",
        effectText: "+1 饭票"
      };
      addLog(state, `${player.name} 回到了高中`, "start", player.id);
    }

    state.status = "awaitingNext";
    return card;
  }

  function nextTurn(state) {
    if (state.status !== "awaitingNext") throw new Error("当前回合尚未结算");
    state.currentPlayer += 1;
    if (state.currentPlayer >= state.players.length) {
      state.currentPlayer = 0;
      state.round += 1;
    }
    state.lastRoll = null;

    if (state.round > state.maxRounds) {
      state.status = "finished";
      return false;
    }
    state.status = "ready";
    return true;
  }

  function objectiveFor(player) {
    return DATA.objectives.find((objective) => objective.id === player.objectiveId) || DATA.objectives[0];
  }

  function objectiveProgress(player) {
    const objective = objectiveFor(player);
    let value = 0;
    if (objective.metric === "visits") value = player.universities.length;
    if (objective.metric === "provinces") value = player.provinces.length;
    if (objective.metric === "friendship") value = player.friendship;
    if (objective.metric === "region") {
      value = new Set(player.visits
        .map((id) => DATA.classmates.find((school) => school.id === id))
        .filter((school) => school?.region === objective.region)
        .map((school) => school.school)).size;
    }
    if (objective.metric === "oppositeRegions") {
      value = Number(player.regions.includes("north")) + Number(player.regions.includes("south"));
    }
    return { value: Math.min(value, objective.target), target: objective.target, complete: value >= objective.target, objective };
  }

  function results(state) {
    return state.players
      .map((player) => {
        const progress = objectiveProgress(player);
        const bonus = progress.complete ? progress.objective.reward : 0;
        return { ...clone(player), bonus, score: player.friendship + bonus, objective: progress.objective, objectiveComplete: progress.complete };
      })
      .sort((a, b) => b.score - a.score || b.visits.length - a.visits.length || a.name.localeCompare(b.name, "zh-CN"));
  }

  function addLog(state, text, type, playerId) {
    state.logs.unshift({ text, type, playerId, at: Date.now() });
    state.logs = state.logs.slice(0, 12);
  }

  function validateSave(value) {
    return Boolean(
      value &&
      value.version === SAVE_VERSION &&
      Array.isArray(value.players) &&
      value.players.length >= 2 &&
      Number.isInteger(value.currentPlayer) &&
      value.currentPlayer >= 0 &&
      value.currentPlayer < value.players.length &&
      ["ready", "resolving", "awaitingNext", "finished"].includes(value.status)
    );
  }

  const api = { createGame, currentPlayer, toggleBoost, roll, resolveLanding, nextTurn, objectiveProgress, results, validateSave, SAVE_VERSION };
  root.GameEngine = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
