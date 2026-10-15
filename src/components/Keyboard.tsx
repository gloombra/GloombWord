import { Delete, CornerDownLeft } from 'lucide-react';
import type { LetterState } from '@/types';

interface KeyboardProps {
  letterStatuses: Record<string, LetterState>;
  onPress: (key: string) => void;
  activeKey: string | null;
  disabled?: boolean;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

const KEY_STYLES: Record<string, string> = {
  correct: 'bg-green-600 hover:bg-green-500 text-white border-green-600',
  present: 'bg-yellow-500 hover:bg-yellow-400 text-zinc-900 border-yellow-500',
  absent: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500 border-zinc-800',
  default: 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border-zinc-700',
};

function getStyle(state: LetterState | undefined): string {
  if (!state) return KEY_STYLES.default;
  return KEY_STYLES[state] ?? KEY_STYLES.default;
}

export function Keyboard({ letterStatuses, onPress, activeKey, disabled }: KeyboardProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full max-w-lg mx-auto select-none">
      {ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 sm:gap-1.5 justify-center">
          {row.map((key) => {
            const isAction = key === 'ENTER' || key === 'BACKSPACE';
            const state = letterStatuses[key];
            const isActive = activeKey === key;

            return (
              <button
                key={key}
                disabled={disabled}
                onClick={() => onPress(key)}
                className={`
                  ${isAction ? 'flex-[1.5]' : 'flex-1'}
                  h-12 sm:h-14
                  rounded-md border font-bold text-sm
                  flex items-center justify-center
                  transition-colors duration-100
                  ${getStyle(state)}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${isActive ? 'key-press' : ''}
                `}
              >
                {key === 'BACKSPACE' ? <Delete size={20} /> : key === 'ENTER' ? <CornerDownLeft size={20} /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
