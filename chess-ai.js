/**
 * Small material-based chess AI used for optional computer play.
 */
(function (root) {
  const VALUES = {
    pawn: 100,
    knight: 320,
    bishop: 330,
    rook: 500,
    queen: 900,
    king: 20000,
  };

  function evaluate(state, forColor) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = state.board[r][c];
        if (!piece) continue;
        const value = VALUES[piece.type];
        const center = 3.5;
        const centerBonus = piece.type === "king" ? 0 : (3 - Math.abs(r - center) - Math.abs(c - center));
        const signed = piece.color === forColor ? 1 : -1;
        score += signed * (value + centerBonus);
      }
    }
    if (state.gameOver) {
      if (state.winner === forColor) return 100000;
      if (state.winner === "draw") return 0;
      return -100000;
    }
    if (state.inCheck) {
      score += state.turn === forColor ? -40 : 40;
    }
    return score;
  }

  function expandMoves(state) {
    const moves = root.ChessEngine.getLegalMoves(state);
    const expanded = [];
    for (const move of moves) {
      if (move.needsPromotion) {
        for (const piece of ["queen", "rook", "bishop", "knight"]) {
          expanded.push({ move, promotion: piece, capture: !!move.captured });
        }
      } else {
        expanded.push({ move, promotion: undefined, capture: !!move.captured });
      }
    }
    expanded.sort((a, b) => Number(b.capture) - Number(a.capture));
    return expanded;
  }

  function minimax(state, depth, maximizing, forColor, alpha, beta) {
    if (depth === 0 || state.gameOver) {
      return { score: evaluate(state, forColor) };
    }

    const options = expandMoves(state);
    let best = null;

    if (maximizing) {
      let bestScore = -Infinity;
      for (const option of options) {
        const result = root.ChessEngine.makeMove(state, option.move.from, option.move.to, option.promotion);
        if (!result.ok) continue;
        const child = minimax(result.state, depth - 1, false, forColor, alpha, beta);
        if (child.score > bestScore) {
          bestScore = child.score;
          best = option;
        }
        alpha = Math.max(alpha, bestScore);
        if (beta <= alpha) break;
      }
      return { score: bestScore, option: best };
    }

    let bestScore = Infinity;
    for (const option of options) {
      const result = root.ChessEngine.makeMove(state, option.move.from, option.move.to, option.promotion);
      if (!result.ok) continue;
      const child = minimax(result.state, depth - 1, true, forColor, alpha, beta);
      if (child.score < bestScore) {
        bestScore = child.score;
        best = option;
      }
      beta = Math.min(beta, bestScore);
      if (beta <= alpha) break;
    }
    return { score: bestScore, option: best };
  }

  function chooseMove(state, depth) {
    const color = state.turn;
    const search = minimax(state, depth, true, color, -Infinity, Infinity);
    if (!search.option) return null;
    return {
      from: search.option.move.from,
      to: search.option.move.to,
      promotion: search.option.promotion,
    };
  }

  root.ChessAI = { chooseMove, evaluate };
})(typeof window !== "undefined" ? window : globalThis);
