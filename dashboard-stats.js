/**
 * Pure helpers for the RIDDLE puzzle dashboard.
 * Works in the browser and in Node tests.
 */
(function (root) {
  "use strict";

  function emptyRiddleData() {
    return { slide: [], match: [], echo: [] };
  }

  function parseRiddleData(raw) {
    if (!raw) return emptyRiddleData();
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      return {
        slide: Array.isArray(data.slide) ? data.slide : [],
        match: Array.isArray(data.match) ? data.match : [],
        echo: Array.isArray(data.echo) ? data.echo : [],
      };
    } catch (err) {
      return emptyRiddleData();
    }
  }

  function formatTime(seconds) {
    if (seconds == null || !Number.isFinite(seconds)) return "-";
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  }

  function dayKey(timestamp) {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function startOfDay(timestamp) {
    const d = new Date(timestamp);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  function collectEvents(data) {
    const events = [];
    (data.slide || []).forEach((game) => {
      events.push({
        type: "slide",
        timestamp: game.timestamp,
        title: `${game.size || 3}×${game.size || 3} slide`,
        meta: `${game.moves || 0} moves · ${formatTime(game.time)}`,
        value: game.moves,
      });
    });
    (data.match || []).forEach((game) => {
      const perfect = game.tries === 8;
      events.push({
        type: "match",
        timestamp: game.timestamp,
        title: perfect ? "Perfect match" : "Match cleared",
        meta: `${game.tries || 0} tries · ${formatTime(game.time)}`,
        value: game.tries,
      });
    });
    (data.echo || []).forEach((game) => {
      events.push({
        type: "echo",
        timestamp: game.timestamp,
        title: `Echo level ${game.level || 1}`,
        meta: game.duration ? `${game.duration} min` : "",
        value: game.level,
      });
    });
    return events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }

  function minOrNull(values) {
    if (!values.length) return null;
    return Math.min(...values);
  }

  function maxOrNull(values) {
    if (!values.length) return null;
    return Math.max(...values);
  }

  function avgOrNull(values) {
    if (!values.length) return null;
    return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
  }

  function summarizeRiddle(data, echoBestOverride) {
    const slide = data.slide || [];
    const match = data.match || [];
    const echo = data.echo || [];
    const slideTimes = slide.map((g) => g.time).filter((n) => Number.isFinite(n));
    const matchTries = match.map((g) => g.tries).filter((n) => Number.isFinite(n));
    const echoLevels = echo.map((g) => g.level || 1);
    const storedBest = Number(echoBestOverride || 0);

    const totalTimeSeconds = [
      ...slide.map((g) => g.time || 0),
      ...match.map((g) => g.time || 0),
      ...echo.map((g) => (g.duration || 0) * 60),
    ].reduce((a, b) => a + b, 0);

    return {
      totalCompleted: slide.length + match.length + echo.length,
      totalTimeSeconds,
      slide: {
        completed: slide.length,
        best3x3: minOrNull(slide.filter((g) => g.size === 3).map((g) => g.moves || 999)),
        best4x4: minOrNull(slide.filter((g) => g.size === 4).map((g) => g.moves || 999)),
        bestTime: minOrNull(slideTimes),
        games: slide,
      },
      match: {
        completed: match.length,
        bestTries: minOrNull(matchTries),
        avgTries: avgOrNull(matchTries),
        perfect: match.filter((g) => g.tries === 8).length,
        games: match,
      },
      echo: {
        games: echo.length,
        bestLevel: Math.max(storedBest, maxOrNull(echoLevels) || 0, 0) || (echo.length ? 1 : 0),
        avgLevel: avgOrNull(echoLevels),
        totalPatterns: echoLevels.reduce((sum, n) => sum + n, 0),
        history: echo,
      },
    };
  }

  function getStreak(events, now) {
    const nowMs = now == null ? Date.now() : now;
    const days = new Set(
      (events || [])
        .filter((e) => e && e.timestamp)
        .map((e) => dayKey(e.timestamp))
    );
    if (!days.size) return 0;

    let cursor = startOfDay(nowMs);
    if (!days.has(dayKey(cursor))) {
      cursor -= 24 * 60 * 60 * 1000;
    }

    let streak = 0;
    while (days.has(dayKey(cursor))) {
      streak += 1;
      cursor -= 24 * 60 * 60 * 1000;
    }
    return streak;
  }

  function getWeeklyActivity(events, now) {
    const nowMs = now == null ? Date.now() : now;
    const today = startOfDay(nowMs);
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const ts = today - i * 24 * 60 * 60 * 1000;
      const key = dayKey(ts);
      const count = (events || []).filter((e) => e.timestamp && dayKey(e.timestamp) === key).length;
      const label = new Date(ts).toLocaleDateString(undefined, { weekday: "short" });
      days.push({ key, label, count, timestamp: ts });
    }
    return days;
  }

  function formatPlayTime(totalSeconds) {
    const minutes = Math.floor((totalSeconds || 0) / 60);
    const hours = Math.floor(minutes / 60);
    const remain = minutes % 60;
    return `${hours}h ${remain}m`;
  }

  const api = {
    parseRiddleData,
    formatTime,
    formatPlayTime,
    dayKey,
    collectEvents,
    summarizeRiddle,
    getStreak,
    getWeeklyActivity,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.DashboardStats = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
