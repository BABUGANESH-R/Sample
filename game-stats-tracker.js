/**
 * Game Statistics Tracker
 * A unified module for tracking game statistics across all games.
 * Import this module into your game to automatically save statistics to the dashboard.
 */

class GameStatsTracker {
  /**
   * Chess Game Tracking
   */
  static saveChessGame(gameData) {
    const stats = JSON.parse(localStorage.getItem('chess-stats') || '{"games": []}');
    
    stats.games.push({
      timestamp: Date.now(),
      winner: gameData.winner, // 'white', 'black', or 'draw'
      moves: gameData.moves || 0,
      duration: gameData.duration || 5, // in minutes
      capturedByWhite: gameData.capturedByWhite || [],
      capturedByBlack: gameData.capturedByBlack || []
    });

    // Keep last 100 games
    if (stats.games.length > 100) {
      stats.games = stats.games.slice(-100);
    }

    localStorage.setItem('chess-stats', JSON.stringify(stats));
    this.showSaveNotification('Chess game saved!');
  }

  /**
   * RIDDLE Puzzles Tracking
   */
  static saveSlidePuzzle(gameData) {
    const stats = JSON.parse(localStorage.getItem('riddle-stats') || '{"slide": [], "match": [], "echo": []}');
    
    stats.slide.push({
      timestamp: Date.now(),
      size: gameData.size, // 3 or 4
      moves: gameData.moves,
      time: gameData.time, // in seconds
    });

    // Keep last 50 games per puzzle type
    if (stats.slide.length > 50) {
      stats.slide = stats.slide.slice(-50);
    }

    localStorage.setItem('riddle-stats', JSON.stringify(stats));
    this.showSaveNotification('Slide puzzle saved!');
  }

  static saveMatchPuzzle(gameData) {
    const stats = JSON.parse(localStorage.getItem('riddle-stats') || '{"slide": [], "match": [], "echo": []}');
    
    stats.match.push({
      timestamp: Date.now(),
      tries: gameData.tries,
      pairs: gameData.pairs,
      time: gameData.time, // in seconds
    });

    if (stats.match.length > 50) {
      stats.match = stats.match.slice(-50);
    }

    localStorage.setItem('riddle-stats', JSON.stringify(stats));
    this.showSaveNotification('Match puzzle saved!');
  }

  static saveEchoGame(gameData) {
    const stats = JSON.parse(localStorage.getItem('riddle-stats') || '{"slide": [], "match": [], "echo": []}');
    
    stats.echo.push({
      timestamp: Date.now(),
      level: gameData.level,
      duration: gameData.duration, // in minutes
    });

    if (stats.echo.length > 50) {
      stats.echo = stats.echo.slice(-50);
    }

    localStorage.setItem('riddle-stats', JSON.stringify(stats));
    
    // Update best level
    const currentBest = parseInt(localStorage.getItem('echo-best') || '1');
    if (gameData.level > currentBest) {
      localStorage.setItem('echo-best', gameData.level);
      this.showSaveNotification('New Echo record!');
    } else {
      this.showSaveNotification('Echo game saved!');
    }
  }

  /**
   * Snake Game Tracking
   */
  static saveSnakeGame(gameData) {
    const stats = JSON.parse(localStorage.getItem('snake-stats') || '{"games": []}');
    
    stats.games.push({
      timestamp: Date.now(),
      score: gameData.score,
      duration: gameData.duration || 2, // in minutes
    });

    // Keep last 100 games
    if (stats.games.length > 100) {
      stats.games = stats.games.slice(-100);
    }

    localStorage.setItem('snake-stats', JSON.stringify(stats));

    // Update high score
    const currentBest = parseInt(localStorage.getItem('snake-best') || '0');
    if (gameData.score > currentBest) {
      localStorage.setItem('snake-best', gameData.score);
      this.showSaveNotification('New high score!');
    } else {
      this.showSaveNotification('Snake game saved!');
    }
  }

  /**
   * Dashboard Link Helper
   */
  static addDashboardLink(containerId = 'body') {
    const container = typeof containerId === 'string' 
      ? document.querySelector(containerId) || document.body
      : containerId;

    // Check if link already exists
    if (document.querySelector('.dashboard-link-widget')) {
      return;
    }

    const linkHTML = `
      <div class="dashboard-link-widget" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
      ">
        <a href="dashboard.html" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          transition: all 0.2s ease;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.5)';" 
           onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.4)';">
          <span style="font-size: 18px;">📊</span>
          <span>View Dashboard</span>
        </a>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', linkHTML);
  }

  /**
   * Notification Helper
   */
  static showSaveNotification(message) {
    // Remove existing notification if present
    const existing = document.querySelector('.stats-notification');
    if (existing) {
      existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'stats-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: rgba(16, 185, 129, 0.95);
      color: white;
      border-radius: 8px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after animation
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 3000);
  }

  /**
   * Get Current Statistics (for displaying in-game)
   */
  static getChessStats() {
    const data = JSON.parse(localStorage.getItem('chess-stats') || '{"games": []}');
    return {
      totalGames: data.games.length,
      whiteWins: data.games.filter(g => g.winner === 'white').length,
      blackWins: data.games.filter(g => g.winner === 'black').length,
      draws: data.games.filter(g => g.winner === 'draw').length,
    };
  }

  static getRiddleStats() {
    const data = JSON.parse(localStorage.getItem('riddle-stats') || '{"slide": [], "match": [], "echo": []}');
    return {
      slideCompleted: data.slide.length,
      matchCompleted: data.match.length,
      echoGames: data.echo.length,
      echoBest: data.echo.length > 0 ? Math.max(...data.echo.map(g => g.level)) : 1,
    };
  }

  static getSnakeStats() {
    const data = JSON.parse(localStorage.getItem('snake-stats') || '{"games": []}');
    return {
      gamesPlayed: data.games.length,
      highScore: parseInt(localStorage.getItem('snake-best') || '0'),
      avgScore: data.games.length > 0
        ? Math.round(data.games.reduce((sum, g) => sum + g.score, 0) / data.games.length)
        : 0,
    };
  }
}

// Export for use in games
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameStatsTracker;
}
