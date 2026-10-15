import { useMemo } from 'react';
import type { TileState } from '@/types';

interface GameBoardProps {
  rows: TileState[][];
  currentGuess: string;
  maxGuesses: number;
  wordLength: number;
  shakeRow: boolean;
  bounceRow: boolean;
  hintIndices?: Set<number>;
}

const STATE_COLORS: Record<string, string> = {
  empty: 'bg-transparent border-zinc-700 text-transparent',
  tbd: 'bg-transparent border-zinc-600 text-zinc-100',
  correct: 'bg-green-600 border-green-600 text-white',
  present: 'bg-yellow-500 border-yellow-500 text-zinc-900',
  absent: 'bg-zinc-800 border-zinc-800 text-zinc-400',
};

const FLIP_DELAY = 250; // ms between tiles

export function GameBoard({
  rows,
  currentGuess,
  maxGuesses,
  wordLength,
  shakeRow,
  bounceRow,
  hintIndices,
}: GameBoardProps) {
  const allRows = useMemo(() => {
    const result: (TileState | null)[][] = [];
    for (let r = 0; r < maxGuesses; r++) {
      if (r < rows.length) {
        result.push(rows[r]);
      } else if (r === rows.length) {
        const guessTiles: (TileState | null)[] = [];
        for (let c = 0; c < wordLength; c++) {
          if (c < currentGuess.length) {
            guessTiles.push({ letter: currentGuess[c], state: 'tbd' });
          } else {
            guessTiles.push(null);
          }
        }
        result.push(guessTiles);
      } else {
        result.push(new Array(wordLength).fill(null));
      }
    }
    return result;
  }, [rows, currentGuess, maxGuesses, wordLength]);

  return (
    <div
      className="grid gap-1.5 mx-auto w-full"
      style={{ gridTemplateRows: `repeat(${maxGuesses}, 1fr)` }}
    >
      {allRows.map((row, rowIdx) => {
        const isShaking = shakeRow && rowIdx === rows.length;
        const isBouncing = bounceRow && rowIdx === rows.length - 1;
        const isSubmitted = rowIdx < rows.length;

        return (
          <div
            key={rowIdx}
            className={`grid gap-1.5 ${isShaking ? 'tile-shake' : ''}`}
            style={{ gridTemplateColumns: `repeat(${wordLength}, 1fr)` }}
          >
            {row.map((tile, colIdx) => {
              const letter = tile?.letter ?? '';
              const state = tile?.state ?? 'empty';
              const shouldFlip = isSubmitted;
              const flipDelay = shouldFlip ? colIdx * FLIP_DELAY : 0;
              const shouldBounce = isBouncing;
              const isHinted = hintIndices?.has(colIdx) && state === 'empty';

              return (
                <div
                  key={colIdx}
                  className={`
                    relative flex items-center justify-center
                    rounded-md border-2 select-none
                    font-bold text-2xl
                    aspect-square w-full
                    ${STATE_COLORS[state] ?? STATE_COLORS.empty}
                    ${shouldFlip ? 'tile-flip' : ''}
                    ${shouldBounce ? 'tile-bounce' : ''}
                    ${isHinted ? 'border-yellow-500/60 border-dashed' : ''}
                  `}
                  style={{
                    animationDelay: `${flipDelay}ms`,
                  }}
                >
                  {isHinted && (
                    <span className="text-yellow-500/40 text-sm font-bold">?</span>
                  )}
                  {letter}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
