(function () {
  "use strict";

  const DATA = window.GAME_DATA;
  const Engine = window.GameEngine;
  const SAVE_KEY = "graduation-monopoly-326-save-v1";
  const SETTINGS_KEY = "graduation-monopoly-326-settings-v1";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  let game = null;
  let playerDrafts = ["玩家一", "玩家二"];
  let busy = false;
  let settings = loadSettings();
  let audioContext = null;

  const screens = {
    setup: $("#setup-screen"),
    game: $("#game-screen"),
    results: $("#results-screen")
  };

  function loadSettings() {
    try {
      return { sound: true, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch (_) {
      return { sound: true };
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  function saveGame() {
    if (!game) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    } catch (_) {
      showToast("当前浏览器无法保存进度");
    }
    updateResumeButton();
  }

  function readSave() {
    try {
      const value = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      return Engine.validateSave(value) && value.status !== "finished" ? value : null;
    } catch (_) {
      return null;
    }
  }

  function clearSave() {
    localStorage.removeItem(SAVE_KEY);
    updateResumeButton();
  }

  function switchScreen(name) {
    Object.entries(screens).forEach(([key, screen]) => screen.classList.toggle("is-active", key === name));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderPlayerEditor() {
    const editor = $("#player-editor");
    editor.innerHTML = playerDrafts.map((name, index) => `
      <div class="player-row" data-player-index="${index}">
        <span class="color-swatch" style="--player-color:${DATA.playerColors[index]}">${index + 1}</span>
        <label><span>玩家 ${index + 1}</span><input maxlength="10" value="${escapeHtml(name)}" aria-label="玩家 ${index + 1} 名称" /></label>
        <button class="remove-player" type="button" aria-label="移除玩家 ${index + 1}" title="移除玩家" ${playerDrafts.length <= 2 ? "disabled" : ""}>×</button>
      </div>
    `).join("");
    $("#player-count-label").textContent = `${playerDrafts.length} / 6 人`;
    $("#add-player-button").disabled = playerDrafts.length >= 6;

    $$("input", editor).forEach((input, index) => input.addEventListener("input", () => {
      playerDrafts[index] = input.value;
    }));
    $$(".remove-player", editor).forEach((button, index) => button.addEventListener("click", () => {
      if (playerDrafts.length <= 2) return;
      playerDrafts.splice(index, 1);
      renderPlayerEditor();
    }));
  }

  function addPlayer() {
    if (playerDrafts.length >= 6) return;
    playerDrafts.push(`玩家${chineseNumber(playerDrafts.length + 1)}`);
    renderPlayerEditor();
    const inputs = $$("#player-editor input");
    inputs[inputs.length - 1].focus();
    inputs[inputs.length - 1].select();
  }

  function startGame(event) {
    event.preventDefault();
    const names = $$("#player-editor input").map((input, index) => input.value.trim() || `玩家${chineseNumber(index + 1)}`);
    const duplicate = names.find((name, index) => names.indexOf(name) !== index);
    if (duplicate) {
      showToast("玩家名称不能重复");
      return;
    }
    game = Engine.createGame({
      players: names,
      maxRounds: Number($("#round-select").value),
      privacy: $("#privacy-toggle").checked
    });
    saveGame();
    enterGame();
    window.setTimeout(() => showRules(true), 180);
  }

  function resumeGame() {
    const saved = readSave();
    if (!saved) return;
    game = saved;
    if (game.status === "awaitingNext") {
      Engine.nextTurn(game);
      saveGame();
    }
    enterGame();
    if (game.status === "resolving") {
      const card = Engine.resolveLanding(game);
      saveGame();
      renderGame();
      showEventCard(card);
    }
  }

  function enterGame() {
    buildBoard();
    renderGame();
    switchScreen("game");
    playSound("start");
  }

  function buildBoard() {
    const board = $("#board");
    $$(".board-space", board).forEach((space) => space.remove());
    DATA.board.forEach((space, index) => {
      const hosts = (space.hostIds || []).map((id) => DATA.classmates.find((item) => item.id === id)).filter(Boolean);
      const school = space.schoolId ? DATA.classmates.find((item) => item.id === space.schoolId) : null;
      const node = document.createElement("div");
      node.className = `board-space type-${space.type}`;
      node.dataset.position = index;
      const [row, column] = gridPosition(index);
      node.style.gridRow = row;
      node.style.gridColumn = column;
      const label = hosts.length ? space.short : school ? school.short : space.short;
      const city = hosts.length ? `${hosts.length} 位同学` : school ? school.city : space.label;
      const symbol = spaceSymbol(space.type);
      node.innerHTML = `
        <span class="space-symbol" aria-hidden="true">${symbol}</span>
        <strong>${escapeHtml(label)}</strong>
        ${hosts.length > 1 ? `<em class="host-count" aria-label="${hosts.length} 位同学">${hosts.length}</em>` : ""}
        <small>${escapeHtml(city || "")}</small>
        <div class="token-stack"></div>
      `;
      node.title = hosts.length
        ? `${space.label} · ${hosts.length} 位同学 · ${[...new Set(hosts.map((host) => host.school))].join("、")}`
        : school ? `${school.school} · ${school.name}` : space.label;
      board.appendChild(node);
    });
  }

  function gridPosition(index) {
    if (index < 9) return [1, index + 1];
    if (index < 15) return [index - 7, 9];
    if (index < 24) return [8, 24 - index];
    return [31 - index, 1];
  }

  function spaceSymbol(type) {
    return { start: "始", school: "校", event: "?", transport: "车", memory: "忆", rest: "+" }[type] || "·";
  }

  function renderGame() {
    if (!game) return;
    const activePlayer = Engine.currentPlayer(game);
    $("#round-label").textContent = `第 ${Math.min(game.round, game.maxRounds)} / ${game.maxRounds} 轮`;
    $("#round-progress").style.width = `${Math.min(100, ((game.round - 1 + game.currentPlayer / game.players.length) / game.maxRounds) * 100)}%`;
    $("#turn-player").textContent = activePlayer.name;
    $("#turn-player").style.color = activePlayer.color;
    $("#turn-hint").textContent = game.status === "ready" ? "掷骰子，决定下一站" : game.status === "resolving" ? "正在前往下一站…" : "记录这次相遇";

    renderPlayerTabs();
    renderTokens();
    renderObjective(activePlayer);
    renderLogs();
    renderAtlas();

    const boostButton = $("#boost-button");
    boostButton.disabled = game.status !== "ready" || activePlayer.transport < 1 || busy;
    boostButton.classList.toggle("is-active", game.useBoost);
    boostButton.setAttribute("aria-pressed", String(game.useBoost));
    boostButton.textContent = game.useBoost ? `已使用车票 · 剩 ${activePlayer.transport}` : `使用车票 +2 · ${activePlayer.transport} 张`;
    $("#roll-button").disabled = game.status !== "ready" || busy;
  }

  function renderPlayerTabs() {
    $("#player-tabs").innerHTML = game.players.map((player, index) => `
      <div class="player-tab ${index === game.currentPlayer ? "is-current" : ""}" style="--player-color:${player.color}">
        <span class="player-token">${index + 1}</span>
        <div><strong>${escapeHtml(player.name)}</strong><small><b>${player.friendship}</b> 友谊 · ${player.tickets} 饭票</small></div>
        <span class="province-count">${player.provinces.length} 省</span>
      </div>
    `).join("");
  }

  function renderTokens() {
    $$(".token-stack").forEach((stack) => { stack.innerHTML = ""; });
    game.players.forEach((player, index) => {
      const stack = $(`.board-space[data-position="${player.position}"] .token-stack`);
      if (!stack) return;
      const token = document.createElement("span");
      token.className = `map-token ${index === game.currentPlayer ? "is-current" : ""}`;
      token.style.setProperty("--player-color", player.color);
      token.textContent = index + 1;
      token.title = player.name;
      stack.appendChild(token);
    });
  }

  function renderObjective(player) {
    const progress = Engine.objectiveProgress(player);
    $("#objective-title").textContent = progress.objective.title;
    $("#objective-description").textContent = progress.objective.description;
    $("#objective-progress").style.width = `${(progress.value / progress.target) * 100}%`;
    $("#objective-detail").textContent = `${progress.value} / ${progress.target} · 完成奖励 ${progress.objective.reward} 友谊值`;
  }

  function renderLogs() {
    $("#travel-log").innerHTML = game.logs.slice(0, 5).map((log) => {
      const player = game.players.find((item) => item.id === log.playerId);
      return `<li><i class="log-icon type-${log.type}" style="--player-color:${player?.color || "#968d80"}">${spaceSymbol(log.type)}</i><span>${escapeHtml(log.text)}</span></li>`;
    }).join("");
  }

  function renderAtlas() {
    if (!game) return;
    const visited = new Set(game.players.flatMap((player) => player.visits));
    $("#atlas-count").textContent = `${visited.size} / ${DATA.classmates.length}`;
    const orderedClassmates = [...DATA.classmates].sort((left, right) => Number(visited.has(right.id)) - Number(visited.has(left.id)));
    $("#atlas-grid").innerHTML = orderedClassmates.map((school) => {
      const unlocked = visited.has(school.id);
      return `
        <article class="atlas-item ${unlocked ? "is-unlocked" : ""}">
          <span>${unlocked ? escapeHtml(school.short.slice(0, 1)) : "?"}</span>
          <div><strong>${unlocked ? escapeHtml(school.short) : "尚未抵达"}</strong><small>${unlocked ? `${escapeHtml(school.city)} · ${game.privacy ? "班级同学" : escapeHtml(school.name)}` : escapeHtml(school.province)}</small></div>
        </article>
      `;
    }).join("");
  }

  async function handleRoll() {
    if (busy || !game || game.status !== "ready") return;
    busy = true;
    const result = Engine.roll(game);
    saveGame();
    $("#roll-button").disabled = true;
    $("#boost-button").disabled = true;
    $("#turn-hint").textContent = "骰子滚动中…";
    $("#dice").classList.add("is-rolling");

    for (let tick = 0; tick < 7; tick += 1) {
      setDice(Math.floor(Math.random() * 6) + 1);
      playSound("tick");
      await wait(75 + tick * 10);
    }
    setDice(result.die);
    $("#dice").classList.remove("is-rolling");
    renderGame();
    playSound("move");
    await wait(420);

    const card = Engine.resolveLanding(game);
    saveGame();
    busy = false;
    renderGame();
    showEventCard(card);
  }

  function setDice(value) {
    const dice = $("#dice");
    dice.dataset.value = value;
    dice.setAttribute("aria-label", `骰子点数 ${value}`);
  }

  function showEventCard(card) {
    const panel = $("#event-card-panel");
    panel.className = `modal-card event-card ${card.kind === "school" && card.school ? `theme-${card.school.region}` : `theme-${card.kind}`}`;
    $("#event-kicker").textContent = card.kicker;
    $("#event-title").textContent = card.title;
    $("#event-body").textContent = card.body;
    $("#event-effects").innerHTML = card.effectText.split(" · ").map((effect) => `<span>${escapeHtml(effect)}</span>`).join("");
    $("#event-illustration").className = `event-illustration kind-${card.kind}`;
    $("#event-illustration span").textContent = card.icon;
    const host = $("#event-host");
    const showHostName = card.kind === "school" && card.school;
    host.classList.toggle("is-hidden", !showHostName);
    if (showHostName) {
      const hostName = game.privacy ? "班级同学" : card.school.name;
      $("#event-host-avatar").textContent = game.privacy ? "同" : hostName.slice(0, 1);
      $("#event-host-name").textContent = hostName;
      $("#event-host-status").textContent = `已在${card.school.short}等你`;
      $("#event-action").textContent = game.privacy ? "和同学碰头" : `和${hostName}碰头`;
    } else {
      $("#event-action").textContent = "继续旅行";
    }
    openModal("event-modal");
    playSound(card.kind === "event" ? "event" : "success");
  }

  function completeTurn() {
    if (!game || game.status !== "awaitingNext") return;
    closeModal("event-modal");
    const continues = Engine.nextTurn(game);
    if (!continues) {
      finishGame();
      return;
    }
    saveGame();
    renderGame();
  }

  function finishGame() {
    if (!game) return;
    game.status = "finished";
    clearSave();
    renderResults();
    switchScreen("results");
    playSound("finish");
  }

  function renderResults() {
    const results = Engine.results(game);
    const winner = results[0];
    $("#results-title").textContent = `${winner.name}，请收下冠军车票`;
    $("#podium").innerHTML = results.slice(0, 3).map((player, index) => `
      <article class="podium-item rank-${index + 1}" style="--player-color:${player.color}">
        <span class="rank-medal">${index + 1}</span>
        <div class="result-avatar">${player.name.slice(0, 1)}</div>
        <strong>${escapeHtml(player.name)}</strong>
        <b>${player.score} 友谊值</b>
        <small>${player.universities.length} 所大学 · ${player.provinces.length} 个省份</small>
      </article>
    `).join("");
    $("#results-list").innerHTML = results.map((player, index) => `
      <div class="result-row">
        <span class="result-rank">${index + 1}</span>
        <i style="--player-color:${player.color}">${player.name.slice(0, 1)}</i>
        <div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.objective.title)} · ${player.objectiveComplete ? `完成，奖励 ${player.bonus} 分` : "未完成"}</small></div>
        <b>${player.score}</b>
      </div>
    `).join("");
  }

  async function shareResults() {
    if (!game) return;
    const results = Engine.results(game);
    const text = `《蹭饭大富翁 · 毕业旅行》\n${results.map((player, index) => `${index + 1}. ${player.name} ${player.score} 友谊值，拜访 ${player.universities.length} 所大学`).join("\n")}`;
    try {
      if (navigator.share) await navigator.share({ title: "蹭饭大富翁战报", text });
      else await navigator.clipboard.writeText(text);
      showToast(navigator.share ? "分享面板已打开" : "战报已复制");
    } catch (error) {
      if (error?.name !== "AbortError") showToast("暂时无法分享战报");
    }
  }

  function newGame() {
    game = null;
    closeAllModals();
    switchScreen("setup");
    updateResumeButton();
  }

  function leaveGame() {
    if (!game) return;
    if (window.confirm("现在结束旅行并按当前成绩结算吗？")) finishGame();
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const focusTarget = $("button:not([disabled])", modal);
    window.setTimeout(() => focusTarget?.focus(), 50);
  }

  function showRules(isIntro) {
    const modal = $("#help-modal");
    modal.classList.toggle("is-intro", Boolean(isIntro));
    $("#help-title").textContent = isIntro ? "出发前，先看规则" : "旅行规则";
    $("#help-subtitle").textContent = isIntro ? "一局只需要记住三件事" : "随时回来确认玩法";
    $("#help-confirm-button").textContent = isIntro ? "开始第一回合" : "返回游戏";
    openModal("help-modal");
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  }

  function closeAllModals() {
    $$(".modal-backdrop").forEach((modal) => closeModal(modal.id));
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function toggleSound() {
    settings.sound = !settings.sound;
    saveSettings();
    renderSoundButton();
    if (settings.sound) playSound("tick");
  }

  function renderSoundButton() {
    const button = $("#sound-button");
    button.classList.toggle("is-muted", !settings.sound);
    button.querySelector("span").textContent = settings.sound ? "♪" : "×";
    button.title = settings.sound ? "关闭音效" : "开启音效";
  }

  function playSound(type) {
    if (!settings.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const presets = {
        tick: [360, 0.025, 0.025], move: [520, 0.05, 0.05], event: [220, 0.12, 0.06],
        success: [660, 0.18, 0.08], start: [440, 0.2, 0.07], finish: [784, 0.35, 0.09]
      };
      const [frequency, duration, volume] = presets[type] || presets.tick;
      oscillator.frequency.value = frequency;
      oscillator.type = type === "event" ? "triangle" : "sine";
      gain.gain.setValueAtTime(volume, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {
      settings.sound = false;
      renderSoundButton();
    }
  }

  function updateResumeButton() {
    $("#resume-button").classList.toggle("is-hidden", !readSave());
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function chineseNumber(number) {
    return ["一", "二", "三", "四", "五", "六"][number - 1] || number;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character]));
  }

  function bindEvents() {
    $("#setup-form").addEventListener("submit", startGame);
    $("#add-player-button").addEventListener("click", addPlayer);
    $("#resume-button").addEventListener("click", resumeGame);
    $("#roll-button").addEventListener("click", handleRoll);
    $("#boost-button").addEventListener("click", () => { Engine.toggleBoost(game); saveGame(); renderGame(); playSound("tick"); });
    $("#event-action").addEventListener("click", completeTurn);
    $("#event-close").addEventListener("click", completeTurn);
    $("#leave-game-button").addEventListener("click", leaveGame);
    $("#new-game-button").addEventListener("click", newGame);
    $("#share-button").addEventListener("click", shareResults);
    $("#sound-button").addEventListener("click", toggleSound);
    $("#help-button").addEventListener("click", () => showRules(false));
    $("#open-atlas-button").addEventListener("click", () => openModal("atlas-modal"));
    $("#brand-button").addEventListener("click", () => {
      if (screens.game.classList.contains("is-active") && game && !window.confirm("返回首页？当前旅行会保留在本机。")) return;
      switchScreen("setup");
    });
    $$('[data-close-modal]').forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.closeModal)));
    $$(".modal-backdrop").forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal && modal.id !== "event-modal") closeModal(modal.id);
    }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") $$(".modal-backdrop.is-open:not(#event-modal)").forEach((modal) => closeModal(modal.id));
      if ((event.key === " " || event.key === "Enter") && screens.game.classList.contains("is-active") && game?.status === "ready" && !$(".modal-backdrop.is-open")) {
        if (!["INPUT", "BUTTON", "SELECT"].includes(document.activeElement?.tagName)) handleRoll();
      }
    });
  }

  function init() {
    renderPlayerEditor();
    renderSoundButton();
    updateResumeButton();
    bindEvents();
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("service-worker.js").catch(() => {});
    }
  }

  init();
})();
