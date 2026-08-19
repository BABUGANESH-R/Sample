// Dashboard Manager
class DashboardManager {
  constructor() {
    this.currentView = "overview";
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupClearData();
    this.setupDemoData();
    this.loadAllData();
  }

  setupNavigation() {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.addEventListener("click", () => this.switchView(item.dataset.view));
    });
  }

  switchView(viewName) {
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });

    document.querySelectorAll(".view").forEach((view) => {
      const active = view.id === `${viewName}-view`;
      view.classList.toggle("active", active);
      view.hidden = !active;
    });

    this.currentView = viewName;
    this.loadViewData(viewName);
  }

  setupClearData() {
    const clearBtn = document.getElementById("clear-data");
    const modal = document.getElementById("confirm-modal");
    const confirmBtn = document.getElementById("confirm-clear");
    const cancelBtn = document.getElementById("cancel-clear");

    clearBtn.addEventListener("click", () => {
      modal.hidden = false;
    });

    confirmBtn.addEventListener("click", () => {
      this.clearAllData();
      modal.hidden = true;
    });

    cancelBtn.addEventListener("click", () => {
      modal.hidden = true;
    });

    modal.querySelector(".modal-overlay").addEventListener("click", () => {
      modal.hidden = true;
    });
  }

  setupDemoData() {
    const demoBtn = document.getElementById("load-demo");
    if (!demoBtn) return;
    demoBtn.addEventListener("click", () => {
      if (typeof generateSampleData === "function") {
        generateSampleData();
        this.loadAllData();
      }
    });
  }

  clearAllData() {
    ["chess-stats", "riddle-stats", "snake-stats", "snake-best", "echo-best"].forEach((key) => {
      localStorage.removeItem(key);
    });
    this.loadAllData();
  }

  loadAllData() {
    this.loadOverviewData();
    if (this.currentView !== "overview") {
      this.loadViewData(this.currentView);
    }
  }

  loadViewData(view) {
    switch (view) {
      case "chess":
        this.loadChessData();
        break;
      case "slide":
      case "match":
      case "echo":
        this.loadRiddleData();
        break;
      case "snake":
        this.loadSnakeData();
        break;
      case "overview":
        this.loadOverviewData();
        break;
    }
  }

  getRiddleRaw() {
    return DashboardStats.parseRiddleData(localStorage.getItem("riddle-stats"));
  }

  getRiddleStats() {
    return DashboardStats.summarizeRiddle(
      this.getRiddleRaw(),
      localStorage.getItem("echo-best")
    );
  }

  loadOverviewData() {
    const chessStats = this.getChessStats();
    const riddleStats = this.getRiddleStats();
    const snakeStats = this.getSnakeStats();
    const events = DashboardStats.collectEvents(this.getRiddleRaw());
    const streak = DashboardStats.getStreak(events);
    const week = DashboardStats.getWeeklyActivity(events);

    document.getElementById("riddle-puzzles-total").textContent = riddleStats.totalCompleted;
    document.getElementById("puzzle-streak").textContent = streak;
    document.getElementById("overview-echo-best").textContent = riddleStats.echo.bestLevel;
    document.getElementById("total-play-time").textContent = DashboardStats.formatPlayTime(
      riddleStats.totalTimeSeconds
    );

    document.getElementById("record-slide-3").textContent =
      riddleStats.slide.best3x3 == null ? "—" : `${riddleStats.slide.best3x3} moves`;
    document.getElementById("record-slide-4").textContent =
      riddleStats.slide.best4x4 == null ? "—" : `${riddleStats.slide.best4x4} moves`;
    document.getElementById("record-match").textContent =
      riddleStats.match.bestTries == null ? "—" : `${riddleStats.match.bestTries} tries`;
    document.getElementById("record-echo").textContent =
      riddleStats.echo.bestLevel ? `L${riddleStats.echo.bestLevel}` : "—";

    this.renderWeeklyActivity(week);
    this.renderOverviewHistory(events);

    document.getElementById("chess-games-total").textContent = chessStats.totalGames;
    document.getElementById("snake-high-score").textContent = snakeStats.best;

    if (this.currentView === "slide" || this.currentView === "match" || this.currentView === "echo") {
      this.loadRiddleData();
    }
  }

  renderWeeklyActivity(week) {
    const el = document.getElementById("weekly-activity");
    const max = Math.max(1, ...week.map((d) => d.count));
    el.innerHTML = week
      .map((day) => {
        const height = Math.max(8, Math.round((day.count / max) * 100));
        return `
          <div class="activity-bar" title="${day.count} puzzles">
            <div class="activity-bar__fill" style="height:${height}%"></div>
            <span class="activity-bar__count">${day.count}</span>
            <span class="activity-bar__label">${day.label}</span>
          </div>
        `;
      })
      .join("");
  }

  renderOverviewHistory(events) {
    const historyEl = document.getElementById("overview-history");
    if (!events.length) {
      historyEl.innerHTML =
        '<p class="empty-state">No puzzles solved yet. Play Slide, Match, or Echo to fill this board.</p>';
      return;
    }

    const icons = { slide: "🧩", match: "🎴", echo: "🎵" };
    historyEl.innerHTML = events
      .slice(0, 10)
      .map((event) => {
        const date = event.timestamp ? new Date(event.timestamp).toLocaleDateString() : "";
        return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">${icons[event.type] || "🎮"}</div>
              <div class="history-item-details">
                <p class="history-item-title">${event.title}</p>
                <p class="history-item-meta">${[event.meta, date].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  getChessStats() {
    const data = JSON.parse(localStorage.getItem("chess-stats") || '{"games": []}');
    return {
      totalGames: data.games.length,
      whiteWins: data.games.filter((g) => g.winner === "white").length,
      blackWins: data.games.filter((g) => g.winner === "black").length,
      draws: data.games.filter((g) => g.winner === "draw").length,
      avgMoves:
        data.games.length > 0
          ? Math.round(data.games.reduce((sum, g) => sum + (g.moves || 0), 0) / data.games.length)
          : 0,
      totalTime: data.games.reduce((sum, g) => sum + (g.duration || 5), 0),
      games: data.games,
    };
  }

  loadChessData() {
    const stats = this.getChessStats();

    document.getElementById("chess-total-games").textContent = stats.totalGames;
    document.getElementById("chess-white-wins").textContent = stats.whiteWins;
    document.getElementById("chess-black-wins").textContent = stats.blackWins;
    document.getElementById("chess-draws").textContent = stats.draws;
    document.getElementById("chess-avg-moves").textContent = stats.avgMoves;

    const historyEl = document.getElementById("chess-history");
    if (stats.games.length === 0) {
      historyEl.innerHTML = '<p class="empty-state">No games played yet. Start your first game!</p>';
      return;
    }

    historyEl.innerHTML = stats.games
      .slice(-10)
      .reverse()
      .map((game, idx) => {
        const icon = game.winner === "white" ? "⚪" : game.winner === "black" ? "⚫" : "🤝";
        const winnerText =
          game.winner === "draw" ? "Draw" : `${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins`;
        const date = new Date(game.timestamp).toLocaleDateString();

        return `
        <div class="history-item">
          <div class="history-item-main">
            <div class="history-item-badge">${icon}</div>
            <div class="history-item-details">
              <p class="history-item-title">${winnerText}</p>
              <p class="history-item-meta">${game.moves || 0} moves · ${date}</p>
            </div>
          </div>
          <div class="history-item-value">#${stats.games.length - idx}</div>
        </div>
      `;
      })
      .join("");
  }

  loadRiddleData() {
    const stats = this.getRiddleStats();

    document.getElementById("slide-completed").textContent = stats.slide.completed;
    document.getElementById("slide-best-3x3").textContent = stats.slide.best3x3 ?? "-";
    document.getElementById("slide-best-4x4").textContent = stats.slide.best4x4 ?? "-";
    document.getElementById("slide-best-time").textContent =
      stats.slide.bestTime == null ? "-" : DashboardStats.formatTime(stats.slide.bestTime);

    const slideHistory = document.getElementById("slide-history");
    if (stats.slide.games.length === 0) {
      slideHistory.innerHTML = '<p class="empty-state">No Slide puzzles completed yet.</p>';
    } else {
      slideHistory.innerHTML = stats.slide.games
        .slice(-10)
        .reverse()
        .map((game) => {
          const date = new Date(game.timestamp).toLocaleDateString();
          return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">🎯</div>
              <div class="history-item-details">
                <p class="history-item-title">${game.size}×${game.size} completed</p>
                <p class="history-item-meta">${game.moves} moves · ${DashboardStats.formatTime(game.time)} · ${date}</p>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    }

    document.getElementById("match-completed").textContent = stats.match.completed;
    document.getElementById("match-best-tries").textContent = stats.match.bestTries ?? "-";
    document.getElementById("match-avg-tries").textContent = stats.match.avgTries ?? "-";
    document.getElementById("match-perfect").textContent = stats.match.perfect;

    const matchHistory = document.getElementById("match-history");
    if (stats.match.games.length === 0) {
      matchHistory.innerHTML = '<p class="empty-state">No Match puzzles completed yet.</p>';
    } else {
      matchHistory.innerHTML = stats.match.games
        .slice(-10)
        .reverse()
        .map((game) => {
          const date = new Date(game.timestamp).toLocaleDateString();
          const isPerfect = game.tries === 8;
          return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">${isPerfect ? "⭐" : "🎴"}</div>
              <div class="history-item-details">
                <p class="history-item-title">${isPerfect ? "Perfect match!" : "Completed"}</p>
                <p class="history-item-meta">${game.tries} tries · ${date}</p>
              </div>
            </div>
          </div>
        `;
        })
        .join("");
    }

    document.getElementById("echo-games").textContent = stats.echo.games;
    document.getElementById("echo-best-level").textContent = stats.echo.bestLevel || 1;
    document.getElementById("echo-avg-level").textContent = stats.echo.avgLevel ?? "-";
    document.getElementById("echo-patterns").textContent = stats.echo.totalPatterns;

    const echoHistory = document.getElementById("echo-history");
    if (stats.echo.history.length === 0) {
      echoHistory.innerHTML = '<p class="empty-state">No Echo games played yet.</p>';
    } else {
      echoHistory.innerHTML = stats.echo.history
        .slice(-10)
        .reverse()
        .map((game) => {
          const date = new Date(game.timestamp).toLocaleDateString();
          return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">🎵</div>
              <div class="history-item-details">
                <p class="history-item-title">Reached Level ${game.level}</p>
                <p class="history-item-meta">${date}</p>
              </div>
            </div>
            <div class="history-item-value">L${game.level}</div>
          </div>
        `;
        })
        .join("");
    }
  }

  getSnakeStats() {
    const data = JSON.parse(localStorage.getItem("snake-stats") || '{"games": []}');
    const best = parseInt(localStorage.getItem("snake-best") || "0", 10);

    return {
      best,
      gamesPlayed: data.games.length,
      avgScore:
        data.games.length > 0
          ? Math.round(data.games.reduce((sum, g) => sum + g.score, 0) / data.games.length)
          : 0,
      totalFood: data.games.reduce((sum, g) => sum + g.score, 0),
      totalTime: data.games.reduce((sum, g) => sum + (g.duration || 2), 0),
      games: data.games,
    };
  }

  loadSnakeData() {
    const stats = this.getSnakeStats();

    document.getElementById("snake-best-score").textContent = stats.best;
    document.getElementById("snake-games-played").textContent = stats.gamesPlayed;
    document.getElementById("snake-avg-score").textContent = stats.avgScore;
    document.getElementById("snake-total-food").textContent = stats.totalFood;

    const leaderboard = document.getElementById("snake-leaderboard");
    const topScores = [...stats.games].sort((a, b) => b.score - a.score).slice(0, 10);

    if (topScores.length === 0) {
      leaderboard.innerHTML = '<p class="empty-state">No games played yet. Set your first record!</p>';
    } else {
      leaderboard.innerHTML = topScores
        .map((game, idx) => {
          const date = new Date(game.timestamp).toLocaleDateString();
          return `
          <div class="leaderboard-item">
            <div class="leaderboard-rank">#${idx + 1}</div>
            <div class="leaderboard-date">${date}</div>
            <div class="leaderboard-score">${game.score}</div>
          </div>
        `;
        })
        .join("");
    }

    const historyEl = document.getElementById("snake-history");
    if (stats.games.length === 0) {
      historyEl.innerHTML = '<p class="empty-state">No games played yet.</p>';
    } else {
      historyEl.innerHTML = stats.games
        .slice(-10)
        .reverse()
        .map((game) => {
          const date = new Date(game.timestamp).toLocaleDateString();
          const isRecord = game.score === stats.best;
          return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">${isRecord ? "🏆" : "🐍"}</div>
              <div class="history-item-details">
                <p class="history-item-title">${isRecord ? "New Record!" : "Game Over"}</p>
                <p class="history-item-meta">${date}</p>
              </div>
            </div>
            <div class="history-item-value">${game.score}</div>
          </div>
        `;
        })
        .join("");
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new DashboardManager();
});
