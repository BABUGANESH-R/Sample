class SlidingPuzzle {
    constructor(size = 3) {
        this.size = size;
        this.tiles = [];
        this.emptyPos = { row: size - 1, col: size - 1 };
        this.moves = 0;
        this.timeElapsed = 0;
        this.timerInterval = null;
        this.gameStarted = false;
        
        this.initElements();
        this.loadBestScore();
        this.initGame();
        this.attachEventListeners();
    }

    initElements() {
        this.boardElement = document.getElementById('puzzle-board');
        this.movesElement = document.getElementById('moves');
        this.timerElement = document.getElementById('timer');
        this.bestScoreElement = document.getElementById('best-score');
        this.winModal = document.getElementById('win-modal');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.solveBtn = document.getElementById('solve-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');
    }

    attachEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.initGame());
        this.solveBtn.addEventListener('click', () => this.showSolution());
        this.playAgainBtn.addEventListener('click', () => {
            this.hideWinModal();
            this.initGame();
        });

        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.size = parseInt(e.target.dataset.size);
                this.initGame();
            });
        });
    }

    initGame() {
        this.moves = 0;
        this.timeElapsed = 0;
        this.gameStarted = false;
        this.updateMoves();
        this.updateTimer();
        this.stopTimer();
        
        this.createTiles();
        this.shuffleTiles();
        this.renderBoard();
    }

    createTiles() {
        this.tiles = [];
        for (let row = 0; row < this.size; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.size; col++) {
                this.tiles[row][col] = row * this.size + col + 1;
            }
        }
        this.tiles[this.size - 1][this.size - 1] = 0;
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
    }

    shuffleTiles() {
        const moves = this.size * this.size * 50;
        for (let i = 0; i < moves; i++) {
            const validMoves = this.getValidMoves();
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.moveTileInternal(randomMove.row, randomMove.col);
        }
    }

    getValidMoves() {
        const validMoves = [];
        const { row, col } = this.emptyPos;

        if (row > 0) validMoves.push({ row: row - 1, col });
        if (row < this.size - 1) validMoves.push({ row: row + 1, col });
        if (col > 0) validMoves.push({ row, col: col - 1 });
        if (col < this.size - 1) validMoves.push({ row, col: col + 1 });

        return validMoves;
    }

    moveTileInternal(row, col) {
        this.tiles[this.emptyPos.row][this.emptyPos.col] = this.tiles[row][col];
        this.tiles[row][col] = 0;
        this.emptyPos = { row, col };
    }

    moveTile(row, col) {
        if (!this.canMove(row, col)) return;

        if (!this.gameStarted) {
            this.gameStarted = true;
            this.startTimer();
        }

        this.moveTileInternal(row, col);
        this.moves++;
        this.updateMoves();
        this.renderBoard();

        if (this.isSolved()) {
            this.onWin();
        }
    }

    canMove(row, col) {
        const rowDiff = Math.abs(row - this.emptyPos.row);
        const colDiff = Math.abs(col - this.emptyPos.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    isSolved() {
        let expected = 1;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    return this.tiles[row][col] === 0;
                }
                if (this.tiles[row][col] !== expected) {
                    return false;
                }
                expected++;
            }
        }
        return true;
    }

    renderBoard() {
        this.boardElement.className = `puzzle-board size-${this.size}`;
        this.boardElement.innerHTML = '';

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.tiles[row][col];
                const tile = document.createElement('button');
                tile.className = 'tile';
                
                if (value === 0) {
                    tile.classList.add('empty');
                } else {
                    tile.textContent = value;
                    tile.addEventListener('click', () => this.moveTile(row, col));
                }

                this.boardElement.appendChild(tile);
            }
        }
    }

    showSolution() {
        this.stopTimer();
        let expected = 1;
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (row === this.size - 1 && col === this.size - 1) {
                    this.tiles[row][col] = 0;
                } else {
                    this.tiles[row][col] = expected++;
                }
            }
        }
        this.emptyPos = { row: this.size - 1, col: this.size - 1 };
        this.renderBoard();
        this.markAsSolved();
    }

    markAsSolved() {
        const tiles = this.boardElement.querySelectorAll('.tile:not(.empty)');
        tiles.forEach(tile => tile.classList.add('solved'));
    }

    updateMoves() {
        this.movesElement.textContent = this.moves;
    }

    updateTimer() {
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerElement.textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            this.timeElapsed++;
            this.updateTimer();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    onWin() {
        this.stopTimer();
        this.markAsSolved();
        this.updateBestScore();
        this.showWinModal();
    }

    showWinModal() {
        document.getElementById('final-moves').textContent = this.moves;
        document.getElementById('final-time').textContent = this.timerElement.textContent;
        this.winModal.classList.add('show');
    }

    hideWinModal() {
        this.winModal.classList.remove('show');
    }

    loadBestScore() {
        const bestScore = localStorage.getItem(`puzzle-best-${this.size}x${this.size}`);
        if (bestScore) {
            this.bestScoreElement.textContent = bestScore;
        } else {
            this.bestScoreElement.textContent = '-';
        }
    }

    updateBestScore() {
        const currentBest = localStorage.getItem(`puzzle-best-${this.size}x${this.size}`);
        if (!currentBest || this.moves < parseInt(currentBest)) {
            localStorage.setItem(`puzzle-best-${this.size}x${this.size}`, this.moves.toString());
            this.bestScoreElement.textContent = this.moves;
        }
    }
}

let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new SlidingPuzzle(3);
});
