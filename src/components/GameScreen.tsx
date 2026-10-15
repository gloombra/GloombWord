import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LogOut, Timer, Eye, EyeOff, Lightbulb, Play, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import { GameBoard } from '@/components/GameBoard';
import { Keyboard } from '@/components/Keyboard';
import { Leaderboard } from '@/components/Leaderboard';
import type { TileState, PlayerStats, LetterState, GamePhase, RoundEndReason } from '@/types';
import { evaluateGuess, countCorrect, countPresent, generateHint } from '@/utils/wordle';

interface GameScreenProps {
  roomCode: string;
  localPeerId: string | null;
  isHost: boolean;
  players: PlayerStats[];
  targetWord: string;
  roundStartTime: number;
  roundDuration: number;
  gamePhase: GamePhase;
  roundEndReason: RoundEndReason | null;
  onGuessSubmitted: (green: number, yellow: number, solved: boolean, outOfGuesses: boolean) => void;
  onHintUsed: () => void;
  onRoundEnd: (reason: RoundEndReason) => void;
  onLeave: () => void;
  onNextRound: () => void;
  myStats: { wordsSolved: number; totalGreen: number; totalYellow: number; hintsUsed: number; done: boolean };
}

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

export function GameScreen({
  roomCode,
  localPeerId,
  isHost,
  players,
  targetWord,
  roundStartTime,
  roundDuration,
  gamePhase,
  roundEndReason,
  onGuessSubmitted,
  onHintUsed,
  onRoundEnd,
  onLeave,
  onNextRound,
  myStats,
}: GameScreenProps) {
  const [guesses, setGuesses] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [solved, setSolved] = useState(false);
  const [showWord, setShowWord] = useState(false);
  const [hintLetters, setHintLetters] = useState<Set<number>>(new Set());
  const [hintUsed, setHintUsed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(roundDuration);

  // Whether this player is done (solved or out of guesses)
  const iAmDone = solved || guesses.length >= MAX_GUESSES;

  // Reset state when a new round starts
  useEffect(() => {
    if (gamePhase === 'playing') {
      setGuesses([]);
      setCurrentGuess('');
      setSolved(false);
      setShowWord(false);
      setHintLetters(new Set());
      setHintUsed(false);
      setBounce(false);
      setShake(false);
    }
  }, [gamePhase, roundStartTime]);

  // Timer — runs for the full round duration regardless of individual player status
  useEffect(() => {
    if (gamePhase !== 'playing') return;
    setTimeLeft(Math.max(0, Math.ceil((roundStartTime + roundDuration * 1000 - Date.now()) / 1000)));
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((roundStartTime + roundDuration * 1000 - Date.now()) / 1000));
      setTimeLeft(rem);
      if (rem <= 0) {
        clearInterval(interval);
        if (gamePhase === 'playing') {
          onRoundEnd('timer');
        }
      }
    }, 250);
    return () => clearInterval(interval);
  }, [roundStartTime, roundDuration, gamePhase, onRoundEnd]);

  // Detect all players done — auto-end the round
  const allPlayersDone = useMemo(() => {
    if (players.length === 0) return false;
    return players.every((p) => p.done);
  }, [players]);

  useEffect(() => {
    if (allPlayersDone && gamePhase === 'playing') {
      onRoundEnd('all-done');
    }
  }, [allPlayersDone, gamePhase, onRoundEnd]);

  // Keyboard letter statuses
  const letterStatuses = useMemo(() => {
    const map: Record<string, LetterState> = {};
    guesses.forEach((row) => {
      row.forEach((tile) => {
        const existing = map[tile.letter];
        if (tile.state === 'correct') {
          map[tile.letter] = 'correct';
        } else if (tile.state === 'present' && existing !== 'correct') {
          map[tile.letter] = 'present';
        } else if (tile.state === 'absent' && !existing) {
          map[tile.letter] = 'absent';
        }
      });
    });
    return map;
  }, [guesses]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || solved || iAmDone) return;

    const tiles = evaluateGuess(currentGuess, targetWord);
    const newGuesses = [...guesses, tiles];
    setGuesses(newGuesses);
    setCurrentGuess('');

    const green = countCorrect(tiles);
    const yellow = countPresent(tiles);
    const wasSolved = green === WORD_LENGTH;
    const outOfGuesses = newGuesses.length >= MAX_GUESSES && !wasSolved;

    if (wasSolved) {
      setSolved(true);
      setBounce(true);
      window.setTimeout(() => setBounce(false), 700);
    }

    onGuessSubmitted(green, yellow, wasSolved, outOfGuesses);
  }, [currentGuess, guesses, solved, iAmDone, targetWord, onGuessSubmitted]);

  const handleHint = useCallback(() => {
    if (hintUsed || solved || iAmDone) return;
    const hint = generateHint(targetWord, hintLetters);
    if (!hint) return;
    setHintLetters((prev) => new Set([...prev, hint.index]));
    setHintUsed(true);
    onHintUsed();
  }, [hintUsed, solved, iAmDone, targetWord, hintLetters, onHintUsed]);

  const handleKey = useCallback(
    (key: string) => {
      if (solved || iAmDone) return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, solved, iAmDone, submitGuess],
  );

  // Physical keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKey('ENTER');
      } else if (e.key === 'Backspace') {
        handleKey('BACKSPACE');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  const inputDisabled = iAmDone || gamePhase === 'ended';
  const timerColor = timeLeft <= 10 ? 'text-red-400' : timeLeft <= 30 ? 'text-yellow-400' : 'text-green-400';
  const roundTrulyEnded = gamePhase === 'ended';
  const timerExpired = roundTrulyEnded && roundEndReason === 'timer';

  // Players who are done vs still playing
  const donePlayers = players.filter((p) => p.done);
  const stillPlaying = players.filter((p) => !p.done);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black tracking-tight">
            <span className="text-red-500">Gloomb</span><span className="text-white">Word</span>
          </h1>
          <span className="text-xs text-zinc-500 hidden sm:inline">Room: {roomCode}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 ${timerColor}`}>
            <Timer size={16} />
            <span className="font-mono font-bold text-sm tabular-nums">{timeLeft}s</span>
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 text-sm">
            <span className="text-zinc-400 hidden sm:inline">Solved:</span>
            <span className="font-bold text-green-500">{myStats.wordsSolved}</span>
          </div>
          {isHost && !roundTrulyEnded && (
            <button
              onClick={onNextRound}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
              title="Start a new game with a new word"
            >
              <RotateCcw size={16} />
              <span className="hidden sm:inline">New Game</span>
            </button>
          )}
          <button
            onClick={onLeave}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors"
            title="Leave Room"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Leaderboard */}
        <aside className="w-64 shrink-0 border-r border-zinc-800 bg-zinc-900/30 p-3 hidden md:flex flex-col overflow-y-auto">
          <Leaderboard players={players} localPeerId={localPeerId} />
        </aside>

        {/* Main game area */}
        <main className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto">
          {/* Mobile leaderboard toggle */}
          <details className="md:hidden w-full max-w-md mb-2">
            <summary className="cursor-pointer text-sm text-zinc-400 py-2">
              View Leaderboard ({players.length})
            </summary>
            <div className="mt-2 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <Leaderboard players={players} localPeerId={localPeerId} />
            </div>
          </details>

          {/* Hint display banner */}
          {hintLetters.size > 0 && !roundTrulyEnded && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-950/40 border border-yellow-800/40 text-xs text-yellow-400 mb-2 pop-in">
              <Lightbulb size={14} />
              <span>Hint revealed: </span>
              {Array.from(hintLetters).map((idx, i) => {
                const elements: ReactNode[] = [];
                if (i > 0) elements.push(<span key={`sep-${i}`} className="text-yellow-600">|</span>);
                elements.push(
                  <span key={idx} className="font-bold font-mono">
                    Position {idx + 1}: {targetWord[idx]}
                  </span>,
                );
                return elements;
              })}
            </div>
          )}

          {/* "You're done — waiting" banner */}
          {iAmDone && !roundTrulyEnded && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-zinc-700 text-sm text-zinc-300 mb-2 pop-in">
              {solved ? (
                <>
                  <CheckCircle size={16} className="text-green-500" />
                  <span>You solved it! Waiting for other players...</span>
                </>
              ) : (
                <>
                  <Clock size={16} className="text-zinc-400" />
                  <span>You're out of guesses. Waiting for other players...</span>
                </>
              )}
            </div>
          )}

          <div className="flex-1 flex items-center w-full max-w-sm relative">
            <GameBoard
              rows={guesses}
              currentGuess={currentGuess}
              maxGuesses={MAX_GUESSES}
              wordLength={WORD_LENGTH}
              shakeRow={shake}
              bounceRow={bounce}
              hintIndices={hintLetters}
            />

            {/* Round truly ended overlay — word reveal + New Game */}
            {roundTrulyEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 backdrop-blur-sm rounded-xl z-10 pop-in">
                <p className="text-2xl font-black text-zinc-200 mb-2">
                  {timerExpired ? "Time's Up!" : 'Round Over'}
                </p>
                <p className="text-sm text-zinc-400 mb-4">
                  The word was <span className="font-mono font-bold text-yellow-500">{targetWord}</span>
                </p>
                {/* Show who solved it */}
                <div className="flex flex-col gap-1 mb-4 max-w-xs w-full">
                  {donePlayers.length > 0 ? (
                    donePlayers.map((p) => (
                      <div key={p.peerId} className="flex items-center gap-2 text-sm text-green-400 justify-center">
                        <CheckCircle size={14} />
                        {p.name} solved it!
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 text-center">Nobody solved it!</p>
                  )}
                </div>
                {isHost ? (
                  <button
                    onClick={onNextRound}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Play size={22} />
                    New Game
                  </button>
                ) : (
                  <p className="text-xs text-zinc-500">Waiting for host to start a new game...</p>
                )}
              </div>
            )}
          </div>

          {/* Bottom controls: hint button + keyboard */}
          <div className="w-full pt-3 pb-1">
            {!roundTrulyEnded && !iAmDone && (
              <div className="flex justify-center mb-2">
                <button
                  onClick={handleHint}
                  disabled={hintUsed || solved || iAmDone}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    hintUsed
                      ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      : 'bg-yellow-950/60 border border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/60 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Lightbulb size={14} />
                  {hintUsed ? 'Hint Used' : 'Use Hint (1 per game)'}
                </button>
              </div>
            )}
            <Keyboard
              letterStatuses={letterStatuses}
              onPress={handleKey}
              activeKey={null}
              disabled={inputDisabled}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
