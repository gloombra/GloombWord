// Shared types for the GloombWord app

export type LetterState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export interface TileState {
  letter: string;
  state: LetterState;
}

export interface PlayerStats {
  peerId: string;
  name: string;
  wordsSolved: number;
  totalGreen: number;
  totalYellow: number;
  hintsUsed: number;
  done: boolean;
  joinedAt: number;
  isHost: boolean;
  lastUpdate: number;
}

export type Screen = 'landing' | 'lobby' | 'game';

export type RoomRole = 'host' | 'guest';

export interface RoomConfig {
  maxPlayers: number;
}

export type GamePhase = 'lobby' | 'countdown' | 'playing' | 'ended';

export type RoundEndReason = 'all-done' | 'timer';

// ---- Network message types ----
export type NetMessage =
  | { type: 'hello'; peerId: string; name: string }
  | { type: 'room-full' }
  | { type: 'room-config'; maxPlayers: number }
  | { type: 'player-list'; players: PlayerStats[] }
  | { type: 'start-match'; targetWord: string; roundStartTime: number; duration: number }
  | { type: 'countdown-tick'; value: number }
  | { type: 'stats-update'; peerId: string; wordsSolved: number; totalGreen: number; totalYellow: number; hintsUsed: number; done: boolean }
  | { type: 'round-end'; reason: RoundEndReason }
  | { type: 'new-round'; targetWord: string; roundStartTime: number; duration: number }
  | { type: 'peer-left'; peerId: string }
  | { type: 'host-migrate'; newHostId: string };

export const LETTER_STATES = {
  CORRECT: 'correct' as LetterState,
  PRESENT: 'present' as LetterState,
  ABSENT: 'absent' as LetterState,
  EMPTY: 'empty' as LetterState,
  TBD: 'tbd' as LetterState,
};
