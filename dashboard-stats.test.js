#!/usr/bin/env node
"use strict";

const {
  parseRiddleData,
  formatTime,
  formatPlayTime,
  summarizeRiddle,
  collectEvents,
  getStreak,
  getWeeklyActivity,
  dayKey,
} = require("./dashboard-stats.js");

const tests = [];

function assert(name, condition) {
  tests.push({ name, ok: Boolean(condition) });
  if (!condition) console.error("FAIL:", name);
}

assert("empty parse yields arrays", parseRiddleData(null).slide.length === 0);
assert("bad json yields empty", parseRiddleData("{nope").match.length === 0);
assert("formatTime pads seconds", formatTime(75) === "1:15");
assert("formatTime handles zero", formatTime(0) === "0:00");
assert("formatPlayTime splits hours", formatPlayTime(90 * 60) === "1h 30m");

function localTs(year, monthIndex, day, hour = 12) {
  return new Date(year, monthIndex, day, hour).getTime();
}

const data = {
  slide: [
    { timestamp: localTs(2026, 7, 18), size: 3, moves: 40, time: 90 },
    { timestamp: localTs(2026, 7, 19), size: 4, moves: 120, time: 200 },
    { timestamp: localTs(2026, 7, 19, 15), size: 3, moves: 28, time: 70 },
  ],
  match: [
    { timestamp: localTs(2026, 7, 19, 16), tries: 8, time: 40 },
    { timestamp: localTs(2026, 7, 17, 10), tries: 14, time: 80 },
  ],
  echo: [{ timestamp: localTs(2026, 7, 19, 18), level: 6, duration: 3 }],
};

const summary = summarizeRiddle(data, "4");
assert("total completed counts all types", summary.totalCompleted === 6);
assert("best 3x3 uses minimum moves", summary.slide.best3x3 === 28);
assert("best 4x4 uses minimum moves", summary.slide.best4x4 === 120);
assert("best slide time is lowest", summary.slide.bestTime === 70);
assert("perfect match counted", summary.match.perfect === 1);
assert("best tries is 8", summary.match.bestTries === 8);
assert("echo best prefers stored override when higher", summarizeRiddle(data, "9").echo.bestLevel === 9);
assert("echo best uses played max", summary.echo.bestLevel === 6);

const events = collectEvents(data);
assert("collects every puzzle event", events.length === 6);
assert("events are newest first", events[0].type === "echo");

const now = localTs(2026, 7, 19, 20);
assert("streak counts consecutive days", getStreak(events, now) === 3);

const week = getWeeklyActivity(events, now);
assert("week has seven days", week.length === 7);
assert("today is last bucket", week[6].key === dayKey(now));
assert("today count includes four puzzles", week[6].count === 4);

const failed = tests.filter((t) => !t.ok);
console.log(`${tests.length - failed.length}/${tests.length} checks passed`);
if (failed.length) process.exit(1);
