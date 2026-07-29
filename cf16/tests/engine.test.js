"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const DATA = require("../data.js");
const Engine = require("../engine.js");

test("creates a valid 2-6 player game", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], maxRounds: 8, seed: 42 });
  assert.equal(game.players.length, 2);
  assert.equal(game.round, 1);
  assert.equal(game.maxRounds, 8);
  assert.equal(game.players[0].tickets, 8);
  assert.throws(() => Engine.createGame({ players: ["甲"] }));
});

test("new roster is complete and every classmate belongs to one city stop", () => {
  const hostIds = DATA.board.flatMap((space) => space.hostIds || []);
  assert.equal(DATA.classmates.length, 60);
  assert.equal(new Set(DATA.classmates.map((student) => student.id)).size, 60);
  assert.equal(new Set(DATA.classmates.map((student) => student.name)).size, 60);
  assert.equal(new Set(DATA.classmates.map((student) => student.school)).size, 41);
  assert.equal(new Set(DATA.classmates.map((student) => student.province)).size, 15);
  assert.equal(new Set(DATA.classmates.map((student) => student.note)).size, 60);
  assert.equal(new Set(DATA.classmates.map((student) => student.moment)).size, 41);
  assert.equal(new Set(DATA.classmates.map((student) => student.tag)).size, 22);
  assert.ok(DATA.classmates.every((student) => student.note.length >= 45));
  assert.equal(DATA.board.length, 30);
  assert.equal(DATA.board.filter((space) => space.type === "school").length, 22);
  assert.deepEqual([...hostIds].sort(), DATA.classmates.map((student) => student.id).sort());
});

test("boost consumes a transport card and adds two steps", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], seed: 1 });
  assert.equal(Engine.toggleBoost(game), true);
  const result = Engine.roll(game, 3);
  assert.deepEqual({ die: result.die, boost: result.boost, steps: result.steps }, { die: 3, boost: 2, steps: 5 });
  assert.equal(game.players[0].transport, 0);
  assert.equal(game.players[0].position, 5);
});

test("school visit records friendship, province and meal cost", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], seed: 1 });
  Engine.roll(game, 2);
  const card = Engine.resolveLanding(game);
  assert.equal(DATA.board[2].type, "school");
  assert.equal(card.kind, "school");
  assert.equal(game.players[0].visits.length, 1);
  assert.equal(game.players[0].universities.length, 1);
  assert.equal(game.players[0].provinces.length, 1);
  assert.equal(game.players[0].friendship, 3);
  assert.equal(game.players[0].tickets, 7);
});

test("passing start grants two meal tickets", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], seed: 1 });
  game.players[0].position = DATA.board.length - 1;
  Engine.roll(game, 2);
  assert.equal(game.players[0].position, 1);
  assert.equal(game.players[0].tickets, 10);
});

test("round advances after every player and finishes after max rounds", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], maxRounds: 3, seed: 1 });
  for (let turn = 0; turn < 6; turn += 1) {
    Engine.roll(game, 1);
    Engine.resolveLanding(game);
    Engine.nextTurn(game);
  }
  assert.equal(game.status, "finished");
  assert.equal(game.round, 4);
});

test("completed objective contributes bonus to ranking", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], seed: 1 });
  game.players[0].objectiveId = "provinces";
  game.players[0].provinces = ["北京", "上海", "江苏", "浙江"];
  game.players[0].friendship = 5;
  game.players[1].friendship = 8;
  const results = Engine.results(game);
  assert.equal(results[0].name, "甲");
  assert.equal(results[0].score, 9);
  assert.equal(results[0].bonus, 4);
});

test("save validation rejects malformed data", () => {
  const game = Engine.createGame({ players: ["甲", "乙"], seed: 1 });
  assert.equal(Engine.validateSave(game), true);
  assert.equal(Engine.validateSave({ ...game, currentPlayer: 99 }), false);
  assert.equal(Engine.validateSave({ ...game, version: 999 }), false);
});
