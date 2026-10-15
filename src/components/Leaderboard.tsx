import { useMemo } from 'react';
import { Trophy, Hash, CircleDot, Lightbulb, CheckCircle, Clock } from 'lucide-react';
import type { PlayerStats } from '@/types';

interface LeaderboardProps {
  players: PlayerStats[];
  localPeerId: string | null;
}

export function Leaderboard({ players, localPeerId }: LeaderboardProps) {
  const sorted = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          b.wordsSolved - a.wordsSolved ||
          b.totalGreen - a.totalGreen ||
          b.totalYellow - a.totalYellow ||
          a.joinedAt - b.joinedAt,
      ),
    [players],
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <Trophy size={18} className="text-yellow-500" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Leaderboard
        </h2>
        <span className="ml-auto text-xs text-zinc-500">
          {players.length} player{players.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-zinc-600 text-sm py-4 text-center">No players yet</p>
        ) : (
          sorted.map((player, idx) => {
            const isYou = player.peerId === localPeerId;
            const rank = idx + 1;
            const rankColor =
              rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-zinc-300' : rank === 3 ? 'text-amber-600' : 'text-zinc-500';

            return (
              <div
                key={player.peerId}
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg border
                  transition-colors duration-200
                  ${
                    isYou
                      ? 'bg-green-950/40 border-green-700/50'
                      : 'bg-zinc-900/60 border-zinc-800'
                  }
                `}
              >
                <span className={`text-lg font-black w-6 text-center ${rankColor}`}>
                  {rank}
                </span>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-100 truncate">
                      {player.name}
                      {isYou && <span className="text-green-400 text-xs ml-1.5">(You)</span>}
                    </span>
                    {player.done && (
                      <span className="shrink-0">
                        {player.wordsSolved > 0 ? (
                          <CheckCircle size={13} className="text-green-500" />
                        ) : (
                          <Clock size={13} className="text-zinc-500" />
                        )}
                      </span>
                    )}
                    {player.isHost && (
                      <span className="text-xs text-zinc-500 shrink-0">Host</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                      <Trophy size={11} className="text-green-500" />
                      {player.wordsSolved}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                      <CircleDot size={11} className="text-green-500" />
                      {player.totalGreen}
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-zinc-400">
                      <Hash size={11} className="text-yellow-500" />
                      {player.totalYellow}
                    </span>
                    <span className={`flex items-center gap-0.5 text-xs ${player.hintsUsed > 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                      <Lightbulb size={11} />
                      {player.hintsUsed}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
