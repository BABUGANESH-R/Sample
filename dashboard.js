// Dashboard Manager
class DashboardManager {
  constructor() {
    this.currentView = 'overview';
    this.currentPuzzle = 'slide';
    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupPuzzleTabs();
    this.setupClearData();
    this.loadAllData();
  }

  // Navigation
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        this.switchView(view);
      });
    });
  }

  switchView(viewName) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    document.querySelectorAll('.view').forEach(view => {
      if (view.id === `${viewName}-view`) {
        view.classList.add('active');
        view.hidden = false;
      } else {
        view.classList.remove('active');
        view.hidden = true;
      }
    });

    this.currentView = viewName;
    this.loadViewData(viewName);
  }

  // Puzzle Tabs
  setupPuzzleTabs() {
    const tabs = document.querySelectorAll('.puzzle-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const puzzle = tab.dataset.puzzle;
        this.switchPuzzle(puzzle);
      });
    });
  }

  switchPuzzle(puzzleName) {
    document.querySelectorAll('.puzzle-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.puzzle === puzzleName);
    });

    document.querySelectorAll('.puzzle-stats').forEach(stats => {
      stats.hidden = stats.id !== `${puzzleName}-stats`;
    });

    this.currentPuzzle = puzzleName;
    this.loadRiddleData();
  }

  // Clear Data
  setupClearData() {
    const clearBtn = document.getElementById('clear-data');
    const modal = document.getElementById('confirm-modal');
    const confirmBtn = document.getElementById('confirm-clear');
    const cancelBtn = document.getElementById('cancel-clear');

    clearBtn.addEventListener('click', () => {
      modal.hidden = false;
    });

    confirmBtn.addEventListener('click', () => {
      this.clearAllData();
      modal.hidden = true;
    });

    cancelBtn.addEventListener('click', () => {
      modal.hidden = true;
    });

    modal.querySelector('.modal-overlay').addEventListener('click', () => {
      modal.hidden = true;
    });
  }

  clearAllData() {
    const keys = ['chess-stats', 'riddle-stats', 'snake-stats', 'snake-best'];
    keys.forEach(key => localStorage.removeItem(key));
    this.loadAllData();
  }

  // Load Data
  loadAllData() {
    this.loadOverviewData();
    if (this.currentView !== 'overview') {
      this.loadViewData(this.currentView);
    }
  }

  loadViewData(view) {
    switch (view) {
      case 'chess':
        this.loadChessData();
        break;
      case 'riddle':
        this.loadRiddleData();
        break;
      case 'snake':
        this.loadSnakeData();
        break;
      case 'overview':
        this.loadOverviewData();
        break;
    }
  }

  // Overview Data
  loadOverviewData() {
    const chessStats = this.getChessStats();
    const riddleStats = this.getRiddleStats();
    const snakeStats = this.getSnakeStats();

    document.getElementById('chess-games-total').textContent = chessStats.totalGames;
    document.getElementById('riddle-puzzles-total').textContent = riddleStats.totalCompleted;
    document.getElementById('snake-high-score').textContent = snakeStats.best;

    const totalMinutes = chessStats.totalTime + riddleStats.totalTime + snakeStats.totalTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    document.getElementById('total-play-time').textContent = `${hours}h ${minutes}m`;
  }

  // Chess Data
  getChessStats() {
    const data = JSON.parse(localStorage.getItem('chess-stats') || '{"games": []}');
    return {
      totalGames: data.games.length,
      whiteWins: data.games.filter(g => g.winner === 'white').length,
      blackWins: data.games.filter(g => g.winner === 'black').length,
      draws: data.games.filter(g => g.winner === 'draw').length,
      avgMoves: data.games.length > 0 
        ? Math.round(data.games.reduce((sum, g) => sum + (g.moves || 0), 0) / data.games.length)
        : 0,
      totalTime: data.games.reduce((sum, g) => sum + (g.duration || 5), 0),
      games: data.games
    };
  }

  loadChessData() {
    const stats = this.getChessStats();

    document.getElementById('chess-total-games').textContent = stats.totalGames;
    document.getElementById('chess-white-wins').textContent = stats.whiteWins;
    document.getElementById('chess-black-wins').textContent = stats.blackWins;
    document.getElementById('chess-draws').textContent = stats.draws;
    document.getElementById('chess-avg-moves').textContent = stats.avgMoves;

    const historyEl = document.getElementById('chess-history');
    if (stats.games.length === 0) {
      historyEl.innerHTML = '<p class="empty-state">No games played yet. Start your first game!</p>';
      return;
    }

    historyEl.innerHTML = stats.games.slice(-10).reverse().map((game, idx) => {
      const icon = game.winner === 'white' ? '⚪' : game.winner === 'black' ? '⚫' : '🤝';
      const winnerText = game.winner === 'draw' ? 'Draw' : `${game.winner.charAt(0).toUpperCase() + game.winner.slice(1)} wins`;
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
    }).join('');
  }

  // RIDDLE Data
  getRiddleStats() {
    const data = JSON.parse(localStorage.getItem('riddle-stats') || '{"slide": [], "match": [], "echo": []}');
    
    const slideCompleted = data.slide.length;
    const matchCompleted = data.match.length;
    const echoCompleted = data.echo.length;

    return {
      totalCompleted: slideCompleted + matchCompleted + echoCompleted,
      totalTime: [
        ...data.slide.map(g => g.time || 60),
        ...data.match.map(g => g.time || 30),
        ...data.echo.map(g => g.duration || 2)
      ].reduce((a, b) => a + Math.floor(b / 60), 0),
      slide: {
        completed: slideCompleted,
        best3x3: this.getBestMoves(data.slide.filter(g => g.size === 3)),
        best4x4: this.getBestMoves(data.slide.filter(g => g.size === 4)),
        bestTime: this.getBestTime(data.slide),
        games: data.slide
      },
      match: {
        completed: matchCompleted,
        bestTries: this.getBestTries(data.match),
        avgTries: this.getAvgTries(data.match),
        perfect: data.match.filter(g => g.tries === 8).length,
        games: data.match
      },
      echo: {
        games: echoCompleted,
        bestLevel: data.echo.length > 0 ? Math.max(...data.echo.map(g => g.level || 1)) : 1,
        avgLevel: this.getAvgLevel(data.echo),
        totalPatterns: data.echo.reduce((sum, g) => sum + (g.level || 1), 0),
        history: data.echo
      }
    };
  }

  getBestMoves(games) {
    if (games.length === 0) return '-';
    return Math.min(...games.map(g => g.moves || 999));
  }

  getBestTime(games) {
    if (games.length === 0) return '-';
    const bestSecs = Math.min(...games.map(g => g.time || 999));
    const mins = Math.floor(bestSecs / 60);
    const secs = bestSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getBestTries(games) {
    if (games.length === 0) return '-';
    return Math.min(...games.map(g => g.tries || 999));
  }

  getAvgTries(games) {
    if (games.length === 0) return '-';
    return Math.round(games.reduce((sum, g) => sum + (g.tries || 0), 0) / games.length);
  }

  getAvgLevel(games) {
    if (games.length === 0) return '-';
    return Math.round(games.reduce((sum, g) => sum + (g.level || 1), 0) / games.length);
  }

  loadRiddleData() {
    const stats = this.getRiddleStats();

    // Slide Stats
    document.getElementById('slide-completed').textContent = stats.slide.completed;
    document.getElementById('slide-best-3x3').textContent = stats.slide.best3x3;
    document.getElementById('slide-best-4x4').textContent = stats.slide.best4x4;
    document.getElementById('slide-best-time').textContent = stats.slide.bestTime;

    const slideHistory = document.getElementById('slide-history');
    if (stats.slide.games.length === 0) {
      slideHistory.innerHTML = '<p class="empty-state">No Slide puzzles completed yet.</p>';
    } else {
      slideHistory.innerHTML = stats.slide.games.slice(-10).reverse().map((game, idx) => {
        const date = new Date(game.timestamp).toLocaleDateString();
        const mins = Math.floor(game.time / 60);
        const secs = game.time % 60;
        return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">🎯</div>
              <div class="history-item-details">
                <p class="history-item-title">${game.size}×${game.size} completed</p>
                <p class="history-item-meta">${game.moves} moves · ${mins}:${secs.toString().padStart(2, '0')} · ${date}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Match Stats
    document.getElementById('match-completed').textContent = stats.match.completed;
    document.getElementById('match-best-tries').textContent = stats.match.bestTries;
    document.getElementById('match-avg-tries').textContent = stats.match.avgTries;
    document.getElementById('match-perfect').textContent = stats.match.perfect;

    const matchHistory = document.getElementById('match-history');
    if (stats.match.games.length === 0) {
      matchHistory.innerHTML = '<p class="empty-state">No Match puzzles completed yet.</p>';
    } else {
      matchHistory.innerHTML = stats.match.games.slice(-10).reverse().map((game, idx) => {
        const date = new Date(game.timestamp).toLocaleDateString();
        const isPerfect = game.tries === 8;
        return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">${isPerfect ? '⭐' : '🎴'}</div>
              <div class="history-item-details">
                <p class="history-item-title">${isPerfect ? 'Perfect match!' : 'Completed'}</p>
                <p class="history-item-meta">${game.tries} tries · ${date}</p>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Echo Stats
    document.getElementById('echo-games').textContent = stats.echo.games;
    document.getElementById('echo-best-level').textContent = stats.echo.bestLevel;
    document.getElementById('echo-avg-level').textContent = stats.echo.avgLevel;
    document.getElementById('echo-patterns').textContent = stats.echo.totalPatterns;

    const echoHistory = document.getElementById('echo-history');
    if (stats.echo.history.length === 0) {
      echoHistory.innerHTML = '<p class="empty-state">No Echo games played yet.</p>';
    } else {
      echoHistory.innerHTML = stats.echo.history.slice(-10).reverse().map((game, idx) => {
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
      }).join('');
    }
  }

  // Snake Data
  getSnakeStats() {
    const data = JSON.parse(localStorage.getItem('snake-stats') || '{"games": []}');
    const best = parseInt(localStorage.getItem('snake-best') || '0');

    return {
      best,
      gamesPlayed: data.games.length,
      avgScore: data.games.length > 0
        ? Math.round(data.games.reduce((sum, g) => sum + g.score, 0) / data.games.length)
        : 0,
      totalFood: data.games.reduce((sum, g) => sum + g.score, 0),
      totalTime: data.games.reduce((sum, g) => sum + (g.duration || 2), 0),
      games: data.games
    };
  }

  loadSnakeData() {
    const stats = this.getSnakeStats();

    document.getElementById('snake-best-score').textContent = stats.best;
    document.getElementById('snake-games-played').textContent = stats.gamesPlayed;
    document.getElementById('snake-avg-score').textContent = stats.avgScore;
    document.getElementById('snake-total-food').textContent = stats.totalFood;

    // Leaderboard
    const leaderboard = document.getElementById('snake-leaderboard');
    const topScores = [...stats.games]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    if (topScores.length === 0) {
      leaderboard.innerHTML = '<p class="empty-state">No games played yet. Set your first record!</p>';
    } else {
      leaderboard.innerHTML = topScores.map((game, idx) => {
        const date = new Date(game.timestamp).toLocaleDateString();
        return `
          <div class="leaderboard-item">
            <div class="leaderboard-rank">#${idx + 1}</div>
            <div class="leaderboard-date">${date}</div>
            <div class="leaderboard-score">${game.score}</div>
          </div>
        `;
      }).join('');
    }

    // Recent History
    const historyEl = document.getElementById('snake-history');
    if (stats.games.length === 0) {
      historyEl.innerHTML = '<p class="empty-state">No games played yet.</p>';
    } else {
      historyEl.innerHTML = stats.games.slice(-10).reverse().map((game, idx) => {
        const date = new Date(game.timestamp).toLocaleDateString();
        const isRecord = game.score === stats.best;
        return `
          <div class="history-item">
            <div class="history-item-main">
              <div class="history-item-badge">${isRecord ? '🏆' : '🐍'}</div>
              <div class="history-item-details">
                <p class="history-item-title">${isRecord ? 'New Record!' : 'Game Over'}</p>
                <p class="history-item-meta">${date}</p>
              </div>
            </div>
            <div class="history-item-value">${game.score}</div>
          </div>
        `;
      }).join('');
    }
  }
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
  new DashboardManager();
});
