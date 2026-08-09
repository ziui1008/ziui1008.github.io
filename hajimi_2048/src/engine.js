(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.Merge2048 = root.Merge2048 || {};
  root.Merge2048.Engine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SIZE = 4;
  const DIRECTIONS = ["left", "right", "up", "down"];

  function emptyGrid() {
    return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  }

  function cloneGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function gridsEqual(first, second) {
    return first.every((row, r) => row.every((value, c) => value === second[r][c]));
  }

  function collapse(values) {
    const compact = values.filter(Boolean);
    const output = [];
    const mergedAt = [];
    let scoreDelta = 0;

    for (let index = 0; index < compact.length; index += 1) {
      if (compact[index] === compact[index + 1]) {
        const merged = compact[index] * 2;
        output.push(merged);
        mergedAt.push(output.length - 1);
        scoreDelta += merged;
        index += 1;
      } else {
        output.push(compact[index]);
      }
    }

    while (output.length < SIZE) output.push(0);
    return { values: output, mergedAt, scoreDelta };
  }

  function lineCoordinates(direction, line) {
    if (direction === "left") return Array.from({ length: SIZE }, (_, i) => [line, i]);
    if (direction === "right") return Array.from({ length: SIZE }, (_, i) => [line, SIZE - 1 - i]);
    if (direction === "up") return Array.from({ length: SIZE }, (_, i) => [i, line]);
    return Array.from({ length: SIZE }, (_, i) => [SIZE - 1 - i, line]);
  }

  function move(grid, direction) {
    if (!DIRECTIONS.includes(direction)) throw new Error(`Unknown direction: ${direction}`);
    const nextGrid = emptyGrid();
    const mergedCells = [];
    let scoreDelta = 0;

    for (let line = 0; line < SIZE; line += 1) {
      const coordinates = lineCoordinates(direction, line);
      const values = coordinates.map(([row, column]) => grid[row][column]);
      const collapsed = collapse(values);
      scoreDelta += collapsed.scoreDelta;

      collapsed.values.forEach((value, index) => {
        const [row, column] = coordinates[index];
        nextGrid[row][column] = value;
        if (collapsed.mergedAt.includes(index)) mergedCells.push([row, column]);
      });
    }

    return {
      grid: nextGrid,
      moved: !gridsEqual(grid, nextGrid),
      scoreDelta,
      mergedCells,
    };
  }

  function addRandomTile(grid, random) {
    const emptyCells = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((value, columnIndex) => {
        if (!value) emptyCells.push([rowIndex, columnIndex]);
      });
    });
    if (!emptyCells.length) return { grid: cloneGrid(grid), spawned: null };

    const nextGrid = cloneGrid(grid);
    const cell = emptyCells[Math.floor(random.next() * emptyCells.length)];
    const value = random.next() < 0.9 ? 2 : 4;
    nextGrid[cell[0]][cell[1]] = value;
    return { grid: nextGrid, spawned: { row: cell[0], column: cell[1], value } };
  }

  function createInitialGrid(random) {
    let result = addRandomTile(emptyGrid(), random);
    result = addRandomTile(result.grid, random);
    return result.grid;
  }

  function canMove(grid) {
    for (let row = 0; row < SIZE; row += 1) {
      for (let column = 0; column < SIZE; column += 1) {
        if (!grid[row][column]) return true;
        if (column + 1 < SIZE && grid[row][column] === grid[row][column + 1]) return true;
        if (row + 1 < SIZE && grid[row][column] === grid[row + 1][column]) return true;
      }
    }
    return false;
  }

  function maxTile(grid) {
    return Math.max(...grid.flat());
  }

  return {
    SIZE,
    DIRECTIONS,
    emptyGrid,
    cloneGrid,
    collapse,
    move,
    addRandomTile,
    createInitialGrid,
    canMove,
    maxTile,
  };
});
