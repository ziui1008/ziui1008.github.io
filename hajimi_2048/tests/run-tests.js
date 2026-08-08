"use strict";

const assert = require("node:assert/strict");
const Engine = require("../src/engine.js");
const Random = require("../src/random.js");
const AudioPack = require("../src/audio.js");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

let passed = 0;

function test(name, callback) {
  try {
    callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function row(values) {
  return [values, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
}

test("四个相同数字只合并为两组", () => {
  const result = Engine.move(row([2, 2, 2, 2]), "left");
  assert.deepEqual(result.grid[0], [4, 4, 0, 0]);
  assert.equal(result.scoreDelta, 8);
});

test("合并后的数字不会在同一步再次合并", () => {
  assert.deepEqual(Engine.move(row([2, 2, 4, 0]), "left").grid[0], [4, 4, 0, 0]);
  assert.deepEqual(Engine.move(row([4, 4, 4, 0]), "left").grid[0], [8, 4, 0, 0]);
});

test("向右移动保持正确顺序", () => {
  assert.deepEqual(Engine.move(row([2, 2, 4, 4]), "right").grid[0], [0, 0, 4, 8]);
});

test("向上移动按列合并", () => {
  const grid = [[2, 0, 0, 0], [2, 0, 0, 0], [4, 0, 0, 0], [4, 0, 0, 0]];
  assert.deepEqual(Engine.move(grid, "up").grid.map((line) => line[0]), [4, 8, 0, 0]);
});

test("无效移动不改变棋盘", () => {
  const grid = row([2, 4, 8, 16]);
  const result = Engine.move(grid, "left");
  assert.equal(result.moved, false);
  assert.deepEqual(result.grid, grid);
});

test("满棋盘仍有相邻同值时可以继续", () => {
  const grid = [[2, 4, 8, 16], [32, 64, 128, 256], [512, 1024, 2, 4], [8, 16, 32, 32]];
  assert.equal(Engine.canMove(grid), true);
});

test("满棋盘且无相邻同值时结束", () => {
  const grid = [[2, 4, 2, 4], [4, 2, 4, 2], [2, 4, 2, 4], [4, 2, 4, 2]];
  assert.equal(Engine.canMove(grid), false);
});

test("相同种子生成相同序列", () => {
  const first = Random.create("same-seed");
  const second = Random.create("same-seed");
  assert.deepEqual(
    Array.from({ length: 20 }, () => first.next()),
    Array.from({ length: 20 }, () => second.next())
  );
});

test("恢复随机状态后生成位置和值一致", () => {
  const first = Random.create(42);
  const grid = Engine.createInitialGrid(first);
  const savedState = first.getState();
  const one = Engine.addRandomTile(grid, first);
  const second = Random.create(0);
  second.setState(savedState);
  const two = Engine.addRandomTile(grid, second);
  assert.deepEqual(one, two);
});

test("同一天的每日种子一致", () => {
  assert.equal(Random.dailySeed(new Date(2026, 7, 8)), Random.dailySeed(new Date(2026, 7, 8)));
  assert.notEqual(Random.dailySeed(new Date(2026, 7, 8)), Random.dailySeed(new Date(2026, 7, 9)));
});

test("两个音效包包含预期数量的 WAV 文件", () => {
  assert.equal(AudioPack.PACKS.hajimi.length, 6);
  assert.equal(AudioPack.PACKS.dagou.length, 3);
  Object.values(AudioPack.PACKS).flat().forEach((source) => {
    assert.equal(source.endsWith(".wav"), true);
    const header = readFileSync(join(__dirname, "..", source)).subarray(0, 12);
    assert.equal(header.toString("ascii", 0, 4), "RIFF");
    assert.equal(header.toString("ascii", 8, 12), "WAVE");
  });
});

test("随机音效不会连续选择同一条", () => {
  const first = AudioPack.chooseIndex("test-pack", 3, 0);
  const second = AudioPack.chooseIndex("test-pack", 3, 0);
  assert.equal(first, 0);
  assert.equal(second, 1);
});

global.localStorage = {
  value: null,
  getItem() { return this.value; },
  setItem(_key, value) { this.value = value; },
  removeItem() { this.value = null; },
};
const Storage = require("../src/storage.js");

test("版本化存储可往返读取", () => {
  Storage.write({ score: 128 });
  assert.equal(Storage.read().score, 128);
  assert.equal(Storage.read().version, 1);
});

test("损坏的存储不会让读取抛错", () => {
  global.localStorage.value = "not-json";
  assert.doesNotThrow(() => Storage.read());
});

console.log(`\n${passed} tests passed.`);
