"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

(async () => {
  const output = path.join(__dirname, "..", "test-results");
  fs.mkdirSync(output, { recursive: true });
  const browserPath = [
    process.env.BROWSER_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  ].find((candidate) => candidate && fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    ...(browserPath ? { executablePath: browserPath } : {})
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("http://127.0.0.1:4173/index.html", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#setup-screen").getAttribute("class").then((value) => value.includes("is-active")), true);
  await page.screenshot({ path: path.join(output, "setup-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: path.join(output, "setup-mobile.png"), fullPage: true });
  assert.ok(await page.locator("#setup-form .start-button").isVisible());
  await page.setViewportSize({ width: 1440, height: 960 });

  await page.locator("#add-player-button").click();
  const inputs = page.locator("#player-editor input");
  assert.equal(await inputs.count(), 3);
  await inputs.nth(0).fill("小明");
  await inputs.nth(1).fill("小红");
  await inputs.nth(2).fill("小蓝");
  await page.locator("#setup-form .start-button").click();
  await page.locator("#game-screen.is-active").waitFor();
  assert.equal(await page.locator(".board-space").count(), 30);
  assert.equal(await page.locator(".map-token").count(), 3);
  await page.locator("#help-modal.is-open.is-intro").waitFor();
  assert.equal((await page.locator("#help-title").textContent()).trim(), "出发前，先看规则");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(output, "rules-desktop.png") });
  await page.locator("#help-confirm-button").click();

  await page.evaluate(() => {
    const key = "graduation-monopoly-save-v2";
    const save = JSON.parse(localStorage.getItem(key));
    save.seed = 1;
    save.currentPlayer = 0;
    save.players[0].position = 18;
    save.status = "ready";
    save.useBoost = false;
    localStorage.setItem(key, JSON.stringify(save));
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#resume-button").click();
  await page.locator("#game-screen.is-active").waitFor();

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(250);
  const desktopLayout = await page.evaluate(() => ({
    viewportHeight: window.innerHeight,
    board: document.querySelector("#board").getBoundingClientRect().toJSON(),
    roll: document.querySelector("#roll-button").getBoundingClientRect().toJSON(),
    ratio: document.querySelector("#board").getBoundingClientRect().width / document.querySelector("#board").getBoundingClientRect().height
  }));
  assert.ok(desktopLayout.ratio > 1.65, `desktop board is not wide enough: ${desktopLayout.ratio}`);
  assert.ok(desktopLayout.board.bottom <= desktopLayout.viewportHeight, `desktop board requires zoom: ${desktopLayout.board.bottom} > ${desktopLayout.viewportHeight}`);
  assert.ok(desktopLayout.roll.bottom <= desktopLayout.viewportHeight);
  await page.screenshot({ path: path.join(output, "game-desktop-1366x768.png") });

  await page.locator("#boost-button").click();
  assert.equal(await page.locator("#boost-button").getAttribute("aria-pressed"), "true");
  await page.locator("#roll-button").click();
  await page.locator("#event-modal.is-open").waitFor({ timeout: 5000 });
  assert.ok((await page.locator("#event-title").textContent()).trim().length > 0);
  assert.equal((await page.locator("#event-host-name").textContent()).trim(), "吴晨");
  assert.equal((await page.locator("#event-action").textContent()).trim(), "和吴晨碰头");
  assert.ok((await page.locator("#event-kicker").textContent()).includes("城市新速度"));
  assert.ok((await page.locator("#event-body").textContent()).includes("吴晨"));
  assert.ok((await page.locator("#event-card-panel").getAttribute("class")).includes("theme-south"));
  await page.screenshot({ path: path.join(output, "event-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(250);
  const eventBox = await page.locator("#event-card-panel").boundingBox();
  assert.ok(eventBox.width <= 375 && eventBox.height <= 812);
  await page.screenshot({ path: path.join(output, "event-mobile.png") });
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.locator("#event-action").click();
  assert.equal((await page.locator("#turn-player").textContent()).trim(), "小红");

  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#resume-button:not(.is-hidden)").waitFor();
  await page.locator("#resume-button").click();
  await page.locator("#game-screen.is-active").waitFor();
  assert.equal((await page.locator("#turn-player").textContent()).trim(), "小红");

  await page.setViewportSize({ width: 375, height: 812 });
  await page.waitForTimeout(250);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    board: document.querySelector("#board").getBoundingClientRect().toJSON(),
    roll: document.querySelector("#roll-button").getBoundingClientRect().toJSON(),
    offenders: Array.from(document.querySelectorAll("body *")).map((element) => {
      const box = element.getBoundingClientRect();
      return { tag: element.tagName, id: element.id, className: String(element.className), left: box.left, right: box.right, width: box.width };
    }).filter((box) => box.right > window.innerWidth + 1 || box.left < -1).slice(0, 12)
  }));
  assert.ok(metrics.scrollWidth <= metrics.innerWidth + 1, `mobile horizontal overflow: ${metrics.scrollWidth} > ${metrics.innerWidth}; ${JSON.stringify(metrics.offenders)}`);
  assert.ok(metrics.board.width <= metrics.innerWidth);
  assert.ok(metrics.roll.width > 60 && metrics.roll.height >= 30);
  await page.screenshot({ path: path.join(output, "game-mobile.png"), fullPage: true });

  await page.locator("#help-button").click();
  await page.locator("#help-modal.is-open").waitFor();
  await page.waitForTimeout(250);
  const rulesBox = await page.locator("#help-modal .modal-card").boundingBox();
  assert.ok(rulesBox.width <= 375 && rulesBox.height <= 812);
  await page.screenshot({ path: path.join(output, "rules-mobile.png") });
  await page.locator("#help-confirm-button").click();

  await page.locator("#open-atlas-button").click();
  await page.locator("#atlas-modal.is-open").waitFor();
  await page.waitForTimeout(250);
  assert.equal((await page.locator("#atlas-count").textContent()).trim(), "1 / 60");
  assert.ok((await page.locator("#atlas-grid .atlas-item").first().textContent()).includes("吴晨"));
  const atlasBox = await page.locator("#atlas-modal .modal-card").boundingBox();
  assert.ok(atlasBox.width <= 375 && atlasBox.height <= 812);
  await page.screenshot({ path: path.join(output, "atlas-mobile.png") });

  await page.locator('[data-close-modal="atlas-modal"]').click();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.context().setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  assert.ok(await page.locator("#brand-button").isVisible());
  await page.context().setOffline(false);

  assert.deepEqual(errors, []);
  await browser.close();
  console.log("E2E passed: setup, gameplay, save recovery, mobile layout, atlas modal");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  process.exit();
});
