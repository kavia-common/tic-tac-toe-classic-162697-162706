import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Game constants and helpers
 */
const EMPTY_BOARD = Array(9).fill(null);
const PLAYERS = { X: 'X', O: 'O' };
const MODES = { PVP: 'pvp', AI: 'ai' };

// Colors from request details theme
const THEME = {
  primary: '#1976d2',
  secondary: '#fbc02d',
  accent: '#d32f2f',
};

// PUBLIC_INTERFACE
function App() {
  /**
   * UI and game state
   */
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState(MODES.PVP);
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null); // 'X' | 'O' | 'draw' | null
  const [aiEnabled, setAiEnabled] = useState(true);

  // Initialize theme based on localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    let initial = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  // Keep DOM updated when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme]);

  // Derived values
  const currentPlayer = xIsNext ? PLAYERS.X : PLAYERS.O;
  const gameOver = Boolean(winner);

  // Check winner or draw whenever board changes
  useEffect(() => {
    const w = calculateWinner(board);
    if (w) {
      setWinner(w);
      return;
    }
    if (board.every((s) => s !== null)) {
      setWinner('draw');
    }
  }, [board]);

  // AI move when it's AI mode and it's O's turn and game not over
  useEffect(() => {
    if (mode !== MODES.AI || gameOver) return;
    const aiPlaysAs = PLAYERS.O; // human is X, AI is O
    if (currentPlayer !== aiPlaysAs) return;

    const timeout = setTimeout(() => {
      const move = findBestMove(board, aiPlaysAs);
      if (move != null) handleMove(move);
    }, 350); // small delay for UX

    return () => clearTimeout(timeout);
  }, [mode, currentPlayer, board, gameOver]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // PUBLIC_INTERFACE
  const handleModeChange = (newMode) => {
    setMode(newMode);
    resetGame();
  };

  // PUBLIC_INTERFACE
  const handleMove = (index) => {
    if (gameOver || board[index] !== null) return;
    setBoard((prev) => {
      const next = prev.slice();
      next[index] = currentPlayer;
      return next;
    });
    setXIsNext((prev) => !prev);
  };

  // PUBLIC_INTERFACE
  const resetGame = () => {
    setBoard(EMPTY_BOARD);
    setXIsNext(true);
    setWinner(null);
  };

  const statusMessage = useMemo(() => {
    if (winner === 'draw') return "It's a draw!";
    if (winner === PLAYERS.X) return 'Player X wins!';
    if (winner === PLAYERS.O) return mode === MODES.AI ? 'AI (O) wins!' : 'Player O wins!';
    return mode === MODES.AI
      ? `Your turn: ${currentPlayer === 'X' ? 'You (X)' : 'AI (O)'}`
      : `Next player: ${currentPlayer}`;
  }, [winner, currentPlayer, mode]);

  return (
    <div className="app-root">
      <MinimalNavbar />
      <main className="container">
        <section className="game-card">
          <header className="header">
            <h1 className="title">Tic Tac Toe</h1>
            <p className="subtitle">Modern, minimalistic classic</p>
          </header>

          <div className="controls">
            <div className="mode-switch">
              <button
                className={`btn ${mode === MODES.PVP ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange(MODES.PVP)}
                aria-pressed={mode === MODES.PVP}
              >
                Player vs Player
              </button>
              <button
                className={`btn ${mode === MODES.AI ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange(MODES.AI)}
                aria-pressed={mode === MODES.AI}
              >
                Player vs AI
              </button>
            </div>

            <div className="status-bar" role="status" aria-live="polite">
              {statusMessage}
            </div>
          </div>

          <Board
            squares={board}
            onClick={handleMove}
            disabled={gameOver || (mode === MODES.AI && currentPlayer === PLAYERS.O)}
          />

          <footer className="actions">
            <button className="btn btn-accent" onClick={resetGame} aria-label="Restart game">
              Restart
            </button>
            <button className="btn btn-secondary" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? 'Dark Theme' : 'Light Theme'}
            </button>
          </footer>
        </section>
      </main>
      <SmallNote />
    </div>
  );
}

/**
 * Minimal top navbar
 */
function MinimalNavbar() {
  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <div className="navbar-brand">Tic Tac Toe</div>
      <div className="navbar-actions">
        <a
          href="https://reactjs.org"
          className="link"
          target="_blank"
          rel="noreferrer"
        >
          React Docs
        </a>
      </div>
    </nav>
  );
}

/**
 * Informational footer note
 */
function SmallNote() {
  return (
    <div className="note">
      Built with React. Colors: primary {THEME.primary}, secondary {THEME.secondary}, accent{' '}
      {THEME.accent}.
    </div>
  );
}

/**
 * Board component renders 3x3 grid
 */
// PUBLIC_INTERFACE
function Board({ squares, onClick, disabled }) {
  return (
    <div className={`board ${disabled ? 'board-disabled' : ''}`} role="grid" aria-label="Tic Tac Toe Board">
      {squares.map((value, idx) => (
        <Square
          key={idx}
          value={value}
          onClick={() => onClick(idx)}
          disabled={disabled || value !== null}
          aria-label={`Square ${idx + 1} ${value ? 'occupied by ' + value : 'empty'}`}
        />
      ))}
    </div>
  );
}

/**
 * Square button
 */
// PUBLIC_INTERFACE
function Square({ value, onClick, disabled }) {
  return (
    <button
      className={`square ${value === 'X' ? 'square-x' : value === 'O' ? 'square-o' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {value}
    </button>
  );
}

/**
 * Winner calculation and AI (minimax with simple heuristics)
 */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // columns
    [0, 4, 8],
    [2, 4, 6], // diagonals
  ];
  for (const [a, b, c] of lines) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

function getAvailableMoves(squares) {
  const moves = [];
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === null) moves.push(i);
  }
  return moves;
}

function opponentOf(player) {
  return player === PLAYERS.X ? PLAYERS.O : PLAYERS.X;
}

function evaluate(squares, aiPlayer) {
  const w = calculateWinner(squares);
  if (w === aiPlayer) return 10;
  if (w === opponentOf(aiPlayer)) return -10;
  return 0;
}

function minimax(squares, depth, isMax, aiPlayer) {
  const score = evaluate(squares, aiPlayer);
  if (score === 10 || score === -10) return score - depth * Math.sign(score);
  if (getAvailableMoves(squares).length === 0) return 0; // draw

  if (isMax) {
    let best = -Infinity;
    for (const move of getAvailableMoves(squares)) {
      squares[move] = aiPlayer;
      best = Math.max(best, minimax(squares, depth + 1, false, aiPlayer));
      squares[move] = null;
    }
    return best;
  } else {
    let best = Infinity;
    const human = opponentOf(aiPlayer);
    for (const move of getAvailableMoves(squares)) {
      squares[move] = human;
      best = Math.min(best, minimax(squares, depth + 1, true, aiPlayer));
      squares[move] = null;
    }
    return best;
  }
}

// PUBLIC_INTERFACE
function findBestMove(squares, aiPlayer) {
  // Prefer center, corners if available quickly without full minimax to speed UX
  const avail = getAvailableMoves(squares);
  if (avail.length === 0) return null;

  // Immediate win/block logic
  for (const move of avail) {
    // Win
    squares[move] = aiPlayer;
    if (calculateWinner(squares) === aiPlayer) {
      squares[move] = null;
      return move;
    }
    squares[move] = null;
  }
  for (const move of avail) {
    // Block
    const opp = opponentOf(aiPlayer);
    squares[move] = opp;
    if (calculateWinner(squares) === opp) {
      squares[move] = null;
      return move;
    }
    squares[move] = null;
  }

  // Full minimax if needed
  let bestVal = -Infinity;
  let bestMove = avail[0];
  for (const move of avail) {
    squares[move] = aiPlayer;
    const moveVal = minimax(squares, 0, false, aiPlayer);
    squares[move] = null;
    if (moveVal > bestVal) {
      bestVal = moveVal;
      bestMove = move;
    }
  }
  return bestMove;
}

export default App;
