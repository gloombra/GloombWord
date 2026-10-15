import type { LetterState, TileState } from '@/types';

export const FALLBACK_WORDS = [
  'DUNCE', 'NUDGE', 'GUIDE', 'HEART', 'ELBOW',
  'CRANE', 'SLATE', 'AUDIO', 'HOUSE', 'PLANT',
  'ROBOT', 'LASER', 'WORLD', 'PEACE', 'BRAVE',
  'STORM', 'GHOST', 'FLAME', 'BREAD', 'CLOCK',
  'MUSIC', 'PIANO', 'RIVER', 'SMILE', 'TIGER',
  'OCEAN', 'CLOUD', 'DREAM', 'EARTH', 'FAITH',
  'GRAPE', 'HONEY', 'IVORY', 'JEWEL', 'KNIFE',
  'LEMON', 'MANGO', 'NOBLE', 'OPERA', 'PRIDE',
  'QUEEN', 'RAVEN', 'SHARK', 'TRUTH', 'UNITY',
  'VOICE', 'WHEAT', 'YOUTH', 'ZEBRA', 'ANGEL',
];

let dictionary: string[] = FALLBACK_WORDS;
let loaded = false;

export async function loadDictionary(): Promise<void> {
  try {
    const res = await fetch('/words.txt');
    if (res.ok) {
      const text = await res.text();
      const words = text
        .split('\n')
        .map((w) => w.trim().toUpperCase())
        .filter((w) => w.length === 5 && /^[A-Z]+$/.test(w));
      if (words.length > 0) {
        dictionary = words;
      }
    }
  } catch {
    // keep fallback
  }
  loaded = true;
}

export function getDictionary(): string[] {
  return dictionary;
}

export function isLoaded(): boolean {
  return loaded;
}

export function isValidGuess(word: string): boolean {
  return dictionary.includes(word.toUpperCase());
}

export function pickRandomWord(): string {
  return dictionary[Math.floor(Math.random() * dictionary.length)];
}

export function evaluateGuess(guess: string, target: string): TileState[] {
  const result: TileState[] = [];
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const states: LetterState[] = new Array(5).fill('absent');
  const used = new Array(5).fill(false);

  // First pass: correct (green)
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      states[i] = 'correct';
      used[i] = true;
    }
  }

  // Second pass: present (yellow)
  for (let i = 0; i < 5; i++) {
    if (states[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        states[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }

  for (let i = 0; i < 5; i++) {
    result.push({ letter: guessArr[i], state: states[i] });
  }

  return result;
}

export function countCorrect(tiles: TileState[]): number {
  return tiles.filter((t) => t.state === 'correct').length;
}

export function countPresent(tiles: TileState[]): number {
  return tiles.filter((t) => t.state === 'present').length;
}

// Generate a hint: reveal a random unrevealed letter from the target word
export function generateHint(target: string, revealedLetters: Set<number>): { index: number; letter: string } | null {
  const unrevealed: number[] = [];
  for (let i = 0; i < target.length; i++) {
    if (!revealedLetters.has(i)) unrevealed.push(i);
  }
  if (unrevealed.length === 0) return null;
  const index = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  return { index, letter: target[index] };
}
