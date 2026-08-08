(function () {
  "use strict";

  const { Engine, Random, Storage, Audio, Share } = window.Merge2048;
  const today = getDateKey(new Date());
  const elements = {};
  const ids = [
    "themeButton", "soundSelect", "modeEyebrow", "classicTab", "dailyTab", "scoreValue",
    "scoreDelta", "bestValue", "undoButton", "newGameButton", "boardFrame", "board",
    "tileLayer", "boardResult", "resultKicker", "resultTitle", "continueButton", "resultNewButton",
    "progressLabel", "progressPercent", "progressBar", "moveValue", "timeValue", "maxValue",
    "mergeValue", "statusValue", "replayCounter", "replayRange", "replayBack", "replayToggle",
    "replayForward", "recordValue", "shareButton", "clearDataButton", "toast", "confirmDialog",
    "dialogTitle", "dialogText", "dialogConfirm",
  ];
  ids.forEach((id) => { elements[id] = document.getElementById(id); });

  let state = loadState();
  let busy = false;
  let queuedDirection = null;
  let toastTimer = 0;
  let storageWarned = false;
  let pendingConfirmation = null;
  let replayActive = false;
  let replayPlaying = false;
  let replayIndex = 0;
  let replayTimer = 0;
  let touchStart = null;

  function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function secureSeed() {
    if (window.crypto && window.crypto.getRandomValues) {
      return window.crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Random.hashSeed(`${Date.now()}-${Math.random()}`);
  }

  function createGame(mode) {
    const seed = mode === "daily" ? Random.dailySeed(new Date()) : secureSeed();
    const random = Random.create(seed);
    const grid = Engine.createInitialGrid(random);
    return {
      mode,
      date: mode === "daily" ? today : null,
      seed,
      randomState: random.getState(),
      grid,
      score: 0,
      moveCount: 0,
      mergeCount: 0,
      elapsed: 0,
      status: "playing",
      wonShown: false,
      replayMoves: [],
      undo: null,
    };
  }

  function validGame(game, mode) {
    return Boolean(
      game && game.mode === mode && Number.isInteger(game.seed) && Number.isInteger(game.randomState)
      && Array.isArray(game.grid) && game.grid.length === 4
      && game.grid.every((row) => Array.isArray(row) && row.length === 4)
      && Array.isArray(game.replayMoves)
    );
  }

  function loadState() {
    const saved = Storage.read();
    const classic = validGame(saved && saved.games && saved.games.classic, "classic")
      ? saved.games.classic : createGame("classic");
    const savedDaily = saved && saved.games && saved.games.daily;
    const daily = validGame(savedDaily, "daily") && savedDaily.date === today
      ? savedDaily : createGame("daily");
    const settings = {
      theme: ["auto", "light", "dark"].includes(saved && saved.settings && saved.settings.theme)
        ? saved.settings.theme : "auto",
      soundPack: ["off", "hajimi", "dagou"].includes(saved && saved.settings && saved.settings.soundPack)
        ? saved.settings.soundPack
        : saved && saved.settings && saved.settings.sound === false ? "off" : "hajimi",
    };
    const dailyBest = saved && saved.best && saved.best.daily && saved.best.daily.date === today
      ? saved.best.daily : { date: today, value: 0 };
    return {
      mode: saved && ["classic", "daily"].includes(saved.mode) ? saved.mode : "classic",
      games: { classic, daily },
      best: {
        classic: Math.max(Number(saved && saved.best && saved.best.classic) || 0, classic.score),
        daily: { date: today, value: Math.max(Number(dailyBest.value) || 0, daily.score) },
      },
      settings,
    };
  }

  function activeGame() {
    return state.games[state.mode];
  }

  function bestForMode() {
    return state.mode === "classic" ? state.best.classic : state.best.daily.value;
  }

  function saveState() {
    if (!Storage.write(state) && !storageWarned) {
      storageWarned = true;
      showToast("浏览器未允许本地存储，本局仍可继续，但关闭页面后不会保留");
    }
  }

  function snapshot(game) {
    return {
      grid: Engine.cloneGrid(game.grid),
      score: game.score,
      moveCount: game.moveCount,
      mergeCount: game.mergeCount,
      elapsed: game.elapsed,
      status: game.status,
      wonShown: game.wonShown,
      randomState: game.randomState,
      replayMoves: game.replayMoves.slice(),
    };
  }

  function restoreSnapshot(game, saved) {
    Object.keys(saved).forEach((key) => {
      game[key] = key === "grid" ? Engine.cloneGrid(saved.grid)
        : key === "replayMoves" ? saved.replayMoves.slice() : saved[key];
    });
    game.undo = null;
  }

  function updateBest(game) {
    if (game.mode === "classic") state.best.classic = Math.max(state.best.classic, game.score);
    else state.best.daily.value = Math.max(state.best.daily.value, game.score);
  }

  function playActionSound() {
    Audio.playRandom(state.settings.soundPack);
  }

  function tileClass(value) {
    return value <= 2048 ? `tile-v${value}` : "tile-vsuper";
  }

  function lineCoordinates(direction, line) {
    if (direction === "left") return Array.from({ length: 4 }, (_, index) => [line, index]);
    if (direction === "right") return Array.from({ length: 4 }, (_, index) => [line, 3 - index]);
    if (direction === "up") return Array.from({ length: 4 }, (_, index) => [index, line]);
    return Array.from({ length: 4 }, (_, index) => [3 - index, line]);
  }

  function getMotionOrigins(grid, direction) {
    const origins = new Map();
    for (let line = 0; line < 4; line += 1) {
      const coordinates = lineCoordinates(direction, line);
      const entries = coordinates
        .map(([row, column]) => ({ row, column, value: grid[row][column] }))
        .filter((entry) => entry.value);
      let targetIndex = 0;
      for (let index = 0; index < entries.length; index += 1) {
        const entry = entries[index];
        const target = coordinates[targetIndex];
        const sourceKeys = [`${entry.row}-${entry.column}`];
        if (entry.value === entries[index + 1]?.value) {
          sourceKeys.push(`${entries[index + 1].row}-${entries[index + 1].column}`);
          targetIndex += 1;
          index += 1;
        }
        origins.set(`${target[0]}-${target[1]}`, sourceKeys);
        targetIndex += 1;
      }
    }
    return origins;
  }

  function renderTiles(grid, animation, motion) {
    const previousTiles = new Map(Array.from(elements.tileLayer.children).map((tile) => [
      `${tile.dataset.row}-${tile.dataset.column}`,
      { rect: tile.getBoundingClientRect(), value: Number(tile.textContent) },
    ]));
    const fragment = document.createDocumentFragment();
    const merged = new Set((animation && animation.mergedCells || []).map(([r, c]) => `${r}-${c}`));
    const spawned = animation && animation.spawned;
    const motionEnabled = Boolean(
      motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches && Element.prototype.animate
    );
    grid.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (!value) return;
        const tile = document.createElement("div");
        const key = `${rowIndex}-${columnIndex}`;
        tile.className = `tile pos-${key} ${tileClass(value)}`;
        if (merged.has(key) && !motionEnabled) tile.classList.add("is-merged");
        if (spawned && spawned.row === rowIndex && spawned.column === columnIndex) tile.classList.add("is-new");
        tile.dataset.digits = String(value).length;
        tile.dataset.row = rowIndex;
        tile.dataset.column = columnIndex;
        tile.textContent = value;
        fragment.appendChild(tile);
      });
    });
    elements.tileLayer.replaceChildren(fragment);
    elements.board.setAttribute("aria-label", `2048 棋盘：${grid.map((row) => row.map((v) => v || "空").join("、")).join("；")}`);

    if (!motionEnabled) return;
    const origins = getMotionOrigins(motion.oldGrid, motion.direction);
    window.requestAnimationFrame(() => {
      elements.tileLayer.querySelectorAll(".tile").forEach((tile) => {
        const targetKey = `${tile.dataset.row}-${tile.dataset.column}`;
        const originKeys = origins.get(targetKey) || [];
        const origin = previousTiles.get(originKeys[0]);
        if (!origin || tile.classList.contains("is-new")) return;
        const targetRect = tile.getBoundingClientRect();
        if (merged.has(targetKey) && originKeys.length > 1) {
          const layerRect = elements.tileLayer.getBoundingClientRect();
          tile.style.opacity = "0";
          originKeys.forEach((originKey, index) => {
            const source = previousTiles.get(originKey);
            if (!source) return;
            const ghost = document.createElement("div");
            ghost.className = `tile motion-ghost ${tileClass(source.value)}`;
            ghost.dataset.digits = String(source.value).length;
            ghost.textContent = source.value;
            ghost.style.left = `${source.rect.left - layerRect.left}px`;
            ghost.style.top = `${source.rect.top - layerRect.top}px`;
            ghost.style.width = `${source.rect.width}px`;
            ghost.style.height = `${source.rect.height}px`;
            ghost.style.transform = "translate(0, 0)";
            elements.tileLayer.appendChild(ghost);
            const ghostAnimation = ghost.animate([
              { transform: "translate(0, 0)" },
              { transform: `translate(${targetRect.left - source.rect.left}px, ${targetRect.top - source.rect.top}px)` },
            ], {
              duration: 210,
              easing: "cubic-bezier(0.22, 0.72, 0.23, 1)",
              fill: "forwards",
            });
            ghostAnimation.onfinish = () => {
              ghost.remove();
              if (index === originKeys.length - 1) {
                tile.style.opacity = "";
                tile.classList.add("is-merged");
              }
            };
          });
          return;
        }
        const dx = origin.rect.left - targetRect.left;
        const dy = origin.rect.top - targetRect.top;
        const finalTransform = getComputedStyle(tile).transform;
        const tileAnimation = tile.animate([
          { transform: `translate(${dx}px, ${dy}px)`, offset: 0 },
          { transform: finalTransform, offset: 1 },
        ], {
          duration: 210,
          easing: "cubic-bezier(0.22, 0.72, 0.23, 1)",
          fill: "both",
        });
        tileAnimation.onfinish = () => tileAnimation.cancel();
      });
    });
  }

  function replayFrame(game, count) {
    const random = Random.create(game.seed);
    let grid = Engine.createInitialGrid(random);
    let score = 0;
    let merges = 0;
    for (let index = 0; index < count; index += 1) {
      const result = Engine.move(grid, game.replayMoves[index]);
      if (!result.moved) continue;
      score += result.scoreDelta;
      merges += result.mergedCells.length;
      grid = Engine.addRandomTile(result.grid, random).grid;
    }
    return { grid, score, moveCount: count, mergeCount: merges, elapsed: game.elapsed };
  }

  function displayedFrame(game) {
    return replayActive ? replayFrame(game, replayIndex) : game;
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }

  function render(animation) {
    const game = activeGame();
    const frame = displayedFrame(game);
    renderTiles(frame.grid, animation, animation && animation.motion);

    elements.scoreValue.textContent = frame.score.toLocaleString("zh-CN");
    elements.bestValue.textContent = bestForMode().toLocaleString("zh-CN");
    elements.recordValue.textContent = bestForMode().toLocaleString("zh-CN");
    elements.moveValue.textContent = frame.moveCount;
    elements.timeValue.textContent = formatTime(frame.elapsed);
    elements.maxValue.textContent = Engine.maxTile(frame.grid);
    elements.mergeValue.textContent = frame.mergeCount;
    elements.statusValue.textContent = replayActive ? "回放中" : game.status === "lost" ? "已结束" : game.status === "won" ? "已达成" : "进行中";

    const max = Math.max(2, Engine.maxTile(frame.grid));
    const progress = Math.min(100, Math.round((Math.log2(max) - 1) / 10 * 100));
    elements.progressLabel.textContent = `${max} / 2048`;
    elements.progressPercent.textContent = `${progress}%`;
    elements.progressBar.style.width = `${progress}%`;

    const dailyDate = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date());
    elements.modeEyebrow.textContent = state.mode === "classic" ? "经典模式" : `${dailyDate} · 同日同局`;
    [elements.classicTab, elements.dailyTab].forEach((tab) => {
      const active = tab.dataset.mode === state.mode;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    elements.undoButton.disabled = !game.undo || replayActive;
    elements.newGameButton.disabled = replayActive;
    renderReplayControls(game);
    renderResult(game);
    updateSettingsLabels();
  }

  function renderResult(game) {
    if (replayActive || game.status === "playing") {
      elements.boardResult.hidden = true;
      return;
    }
    elements.boardResult.hidden = false;
    if (game.status === "won") {
      elements.resultKicker.textContent = "达成 2048";
      elements.resultTitle.textContent = "数字仍然可以继续生长";
      elements.continueButton.hidden = false;
    } else {
      elements.resultKicker.textContent = "本局结束";
      elements.resultTitle.textContent = "棋盘已经没有空隙";
      elements.continueButton.hidden = true;
    }
  }

  function renderReplayControls(game) {
    const length = game.replayMoves.length;
    const current = replayActive ? replayIndex : length;
    elements.replayRange.max = length;
    elements.replayRange.value = current;
    elements.replayRange.disabled = length === 0;
    elements.replayCounter.textContent = `${current} / ${length}`;
    elements.replayBack.disabled = !replayActive || current <= 0;
    elements.replayForward.disabled = !replayActive || current >= length;
    elements.replayToggle.disabled = length === 0;
    if (!replayActive) elements.replayToggle.textContent = "开始回放";
    else if (replayPlaying) elements.replayToggle.textContent = "暂停";
    else if (current >= length) elements.replayToggle.textContent = "退出回放";
    else elements.replayToggle.textContent = "继续回放";
  }

  function performMove(direction, skipSound) {
    const game = activeGame();
    if (replayActive || game.status !== "playing") return;
    if (!skipSound) playActionSound();
    if (busy) {
      queuedDirection = direction;
      return;
    }

    const oldGrid = Engine.cloneGrid(game.grid);
    const result = Engine.move(game.grid, direction);
    if (!result.moved) return;
    busy = true;
    game.undo = snapshot(game);
    game.grid = result.grid;
    game.score += result.scoreDelta;
    game.moveCount += 1;
    game.mergeCount += result.mergedCells.length;
    game.replayMoves.push(direction);

    const random = Random.create(0);
    random.setState(game.randomState);
    const spawnResult = Engine.addRandomTile(game.grid, random);
    game.grid = spawnResult.grid;
    game.randomState = random.getState();
    updateBest(game);

    if (Engine.maxTile(game.grid) >= 2048 && !game.wonShown) {
      game.status = "won";
      game.wonShown = true;
    } else if (!Engine.canMove(game.grid)) {
      game.status = "lost";
    }

    animateEcho(direction);
    if (result.scoreDelta) showScoreDelta(result.scoreDelta);
    saveState();
    render({
      mergedCells: result.mergedCells,
      spawned: spawnResult.spawned,
      motion: { oldGrid, direction },
    });

    window.setTimeout(() => {
      busy = false;
      if (queuedDirection) {
        const next = queuedDirection;
        queuedDirection = null;
        performMove(next, true);
      }
    }, 220);
  }

  function animateEcho(direction) {
    elements.boardFrame.classList.remove("echo-left", "echo-right", "echo-up", "echo-down");
    void elements.boardFrame.offsetWidth;
    elements.boardFrame.classList.add(`echo-${direction}`);
  }

  function showScoreDelta(value) {
    elements.scoreDelta.textContent = `+${value}`;
    elements.scoreDelta.classList.remove("is-visible");
    void elements.scoreDelta.offsetWidth;
    elements.scoreDelta.classList.add("is-visible");
  }

  function undo() {
    const game = activeGame();
    if (!game.undo || replayActive) return;
    playActionSound();
    restoreSnapshot(game, game.undo);
    saveState();
    render();
    showToast("已撤销上一步");
  }

  function resetCurrentMode() {
    playActionSound();
    stopReplay();
    state.games[state.mode] = createGame(state.mode);
    saveState();
    render();
    elements.board.focus();
  }

  function requestNewGame() {
    const game = activeGame();
    if (!game.moveCount) {
      resetCurrentMode();
      return;
    }
    askConfirmation("开始新游戏？", "当前棋盘会被替换，最佳分数仍会保留。", "开始新局", resetCurrentMode);
  }

  function switchMode(mode) {
    if (mode === state.mode) return;
    playActionSound();
    stopReplay();
    state.mode = mode;
    saveState();
    render();
    elements.board.focus();
    showToast(mode === "daily" ? "今日挑战使用固定棋局" : "已回到经典模式");
  }

  function startReplay() {
    const game = activeGame();
    if (!game.replayMoves.length) return;
    replayActive = true;
    replayPlaying = true;
    replayIndex = 0;
    scheduleReplayStep();
    render();
  }

  function scheduleReplayStep() {
    window.clearTimeout(replayTimer);
    if (!replayPlaying) return;
    replayTimer = window.setTimeout(() => {
      const length = activeGame().replayMoves.length;
      if (replayIndex < length) {
        replayIndex += 1;
        animateEcho(activeGame().replayMoves[replayIndex - 1]);
        if (replayIndex >= length) replayPlaying = false;
        render();
        if (replayPlaying) scheduleReplayStep();
      } else {
        replayPlaying = false;
        render();
      }
    }, 420);
  }

  function stopReplay() {
    window.clearTimeout(replayTimer);
    replayActive = false;
    replayPlaying = false;
    replayIndex = 0;
  }

  function toggleReplay() {
    playActionSound();
    if (!replayActive) {
      startReplay();
      return;
    }
    const length = activeGame().replayMoves.length;
    if (!replayPlaying && replayIndex >= length) {
      stopReplay();
      render();
      return;
    }
    replayPlaying = !replayPlaying;
    if (replayPlaying) scheduleReplayStep();
    else window.clearTimeout(replayTimer);
    render();
  }

  function setReplayIndex(value) {
    window.clearTimeout(replayTimer);
    replayActive = true;
    replayPlaying = false;
    replayIndex = Math.max(0, Math.min(activeGame().replayMoves.length, Number(value)));
    render();
  }

  function themeLabel(value) {
    return value === "auto" ? "自动" : value === "light" ? "浅色" : "深色";
  }

  function applyTheme() {
    const dark = state.settings.theme === "dark"
      || (state.settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#111715" : "#f4f7f6";
  }

  function updateSettingsLabels() {
    elements.themeButton.textContent = `主题：${themeLabel(state.settings.theme)}`;
    elements.soundSelect.value = state.settings.soundPack;
  }

  function cycleTheme() {
    const themes = ["auto", "light", "dark"];
    state.settings.theme = themes[(themes.indexOf(state.settings.theme) + 1) % themes.length];
    applyTheme();
    saveState();
    updateSettingsLabels();
  }

  function changeSoundPack(pack) {
    Audio.stopAll();
    state.settings.soundPack = ["off", "hajimi", "dagou"].includes(pack) ? pack : "off";
    Audio.preload(state.settings.soundPack);
    saveState();
    updateSettingsLabels();
    if (state.settings.soundPack !== "off") {
      playActionSound();
      showToast(`已切换到${state.settings.soundPack === "hajimi" ? "哈基米" : "大狗"}音效包`);
    } else {
      showToast("音效已关闭");
    }
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2600);
  }

  function askConfirmation(title, text, confirmLabel, callback) {
    elements.dialogTitle.textContent = title;
    elements.dialogText.textContent = text;
    elements.dialogConfirm.textContent = confirmLabel;
    pendingConfirmation = callback;
    elements.confirmDialog.showModal();
  }

  function clearAllData() {
    Storage.clear();
    state = {
      mode: "classic",
      games: { classic: createGame("classic"), daily: createGame("daily") },
      best: { classic: 0, daily: { date: today, value: 0 } },
      settings: { theme: "auto", soundPack: "hajimi" },
    };
    applyTheme();
    saveState();
    render();
    showToast("本机游戏数据已清除");
  }

  function directionFromKey(key) {
    return {
      ArrowLeft: "left", a: "left", A: "left",
      ArrowRight: "right", d: "right", D: "right",
      ArrowUp: "up", w: "up", W: "up",
      ArrowDown: "down", s: "down", S: "down",
    }[key];
  }

  function bindEvents() {
    document.addEventListener("keydown", (event) => {
      const direction = directionFromKey(event.key);
      if (!direction || elements.confirmDialog.open) return;
      const tag = event.target.tagName;
      if (["INPUT", "BUTTON"].includes(tag) && event.target !== elements.board) return;
      event.preventDefault();
      performMove(direction);
    });

    elements.board.addEventListener("pointerdown", (event) => {
      touchStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      elements.board.setPointerCapture(event.pointerId);
    });
    elements.board.addEventListener("pointerup", (event) => {
      if (!touchStart || touchStart.id !== event.pointerId) return;
      const deltaX = event.clientX - touchStart.x;
      const deltaY = event.clientY - touchStart.y;
      touchStart = null;
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
      performMove(Math.abs(deltaX) > Math.abs(deltaY)
        ? deltaX > 0 ? "right" : "left"
        : deltaY > 0 ? "down" : "up");
    });
    elements.board.addEventListener("pointercancel", () => { touchStart = null; });
    elements.board.addEventListener("click", () => elements.board.focus());

    elements.undoButton.addEventListener("click", undo);
    elements.newGameButton.addEventListener("click", requestNewGame);
    elements.resultNewButton.addEventListener("click", requestNewGame);
    elements.continueButton.addEventListener("click", () => {
      const game = activeGame();
      playActionSound();
      game.status = "playing";
      saveState();
      render();
      elements.board.focus();
    });
    elements.classicTab.addEventListener("click", () => switchMode("classic"));
    elements.dailyTab.addEventListener("click", () => switchMode("daily"));
    elements.themeButton.addEventListener("click", cycleTheme);
    elements.soundSelect.addEventListener("change", (event) => changeSoundPack(event.target.value));
    elements.replayToggle.addEventListener("click", toggleReplay);
    elements.replayBack.addEventListener("click", () => {
      playActionSound();
      setReplayIndex(replayIndex - 1);
    });
    elements.replayForward.addEventListener("click", () => {
      playActionSound();
      setReplayIndex(replayIndex + 1);
    });
    elements.replayRange.addEventListener("input", (event) => setReplayIndex(event.target.value));
    elements.replayRange.addEventListener("change", playActionSound);
    elements.shareButton.addEventListener("click", () => {
      playActionSound();
      Share.download(activeGame(), state.mode === "classic" ? "经典模式" : `${today} 今日挑战`);
      showToast("成绩卡已生成");
    });
    elements.clearDataButton.addEventListener("click", () => {
      askConfirmation("清除全部数据？", "当前进度、最佳成绩和设置都会从这台设备移除。", "确认清除", clearAllData);
    });
    elements.confirmDialog.addEventListener("close", () => {
      const callback = pendingConfirmation;
      pendingConfirmation = null;
      if (elements.confirmDialog.returnValue === "confirm" && callback) callback();
    });
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (state.settings.theme === "auto") applyTheme();
    });
    document.addEventListener("visibilitychange", () => saveState());
  }

  window.setInterval(() => {
    const game = activeGame();
    if (document.hidden || replayActive || game.status !== "playing" || game.moveCount === 0) return;
    game.elapsed += 1;
    elements.timeValue.textContent = formatTime(game.elapsed);
    if (game.elapsed % 5 === 0) saveState();
  }, 1000);

  applyTheme();
  Audio.preload(state.settings.soundPack);
  bindEvents();
  render();
})();
