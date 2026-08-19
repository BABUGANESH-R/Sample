#!/usr/bin/env node
"use strict";

function inversionCount(arr) {
  let inv = 0;
  const flat = arr.filter((n) => n !== 0);
  for (let i = 0; i < flat.length; i++) {
    for (let j = i + 1; j < flat.length; j++) {
      if (flat[i] > flat[j]) inv++;
    }
  }
  return inv;
}

function isSolvable(arr, size) {
  const inv = inversionCount(arr);
  if (size % 2 === 1) return inv % 2 === 0;
  const blankRowFromBottom = size - Math.floor(arr.indexOf(0) / size);
  if (blankRowFromBottom % 2 === 0) return inv % 2 === 1;
  return inv % 2 === 0;
}

function shuffled(size) {
  const arr = Array.from({ length: size * size }, (_, i) =>
    i === size * size - 1 ? 0 : i + 1
  );
  do {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  } while (
    !isSolvable(arr, size) ||
    arr.every((v, i) => (i === arr.length - 1 ? v === 0 : v === i + 1))
  );
  return arr;
}

function isSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

const tests = [];

function assert(name, condition) {
  tests.push({ name, ok: Boolean(condition) });
  if (!condition) console.error("FAIL:", name);
}

assert("3x3 even inversions are solvable", isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 0], 3));
assert("3x3 odd inversions are not solvable", !isSolvable([1, 2, 3, 4, 5, 6, 8, 7, 0], 3));
assert("solved 4x4 is solved", isSolved([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]));
assert("unsolved 4x4 is not solved", !isSolved([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 14, 0]));

for (const size of [3, 4]) {
  for (let i = 0; i < 40; i++) {
    const board = shuffled(size);
    assert(`${size}x${size} shuffle ${i} is solvable`, isSolvable(board, size));
    assert(`${size}x${size} shuffle ${i} is not already solved`, !isSolved(board));
  }
}

const failed = tests.filter((t) => !t.ok);
console.log(`${tests.length - failed.length}/${tests.length} checks passed`);
if (failed.length) {
  process.exit(1);
}
