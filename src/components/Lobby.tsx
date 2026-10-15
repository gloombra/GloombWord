import { useState } from 'react';
import { Copy, Check, Users, Play, LogOut, Crown } from 'lucide-react';
import type { PlayerStats } from '@/types';

interface LobbyProps {
  roomCode: string;
  players: PlayerStats[];
  localPeerId: string | null;
  isHost: boolean;
  maxPlayers: number;
  onStartMatch: () => void;
  onLeave: () => void;
}

export function Lobby({
  roomCode,
  players,
  localPeerId,
  isHost,
  maxPlayers,
  onStartMatch,
  onLeave,
}: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black tracking-tight text-zinc-50">
            <span className="text-red-500">Gloomb</span><span className="text-white">Word</span>
          </h1>
        </div>

        {/* Room code card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 text-center">
            Room Code — Share with friends
          </p>
          <div className="flex items-center justify-center gap-3">
            <code className="text-4xl font-black tracking-[0.3em] text-red-500 font-mono">
              {roomCode}
            </code>
            <button
              onClick={copyCode}
              className="p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition-colors group"
            >
              {copied ? (
                <Check size={20} className="text-green-500" />
              ) : (
                <Copy size={20} className="text-zinc-400 group-hover:text-zinc-200" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-center text-xs text-green-500 mt-2 pop-in">Copied!</p>
          )}
        </div>

        {/* Players card */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 backdrop-blur-sm shadow-xl mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-zinc-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
              Players
            </h2>
            <span className="ml-auto text-xs text-zinc-500">
              {players.length} / {maxPlayers}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {players.map((player) => (
              <div
                key={player.peerId}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${
                  player.peerId === localPeerId
                    ? 'bg-green-950/40 border-green-700/50'
                    : 'bg-zinc-800/50 border-zinc-700/50'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    player.peerId === localPeerId ? 'bg-green-500 pulse-ring' : 'bg-zinc-600'
                  }`}
                />
                <span className="text-sm font-bold text-zinc-100">
                  {player.name}
                  {player.peerId === localPeerId && (
                    <span className="text-green-400 text-xs ml-2">(You)</span>
                  )}
                </span>
                {player.isHost && (
                  <Crown size={14} className="text-yellow-500 ml-auto" />
                )}
              </div>
            ))}
            {players.length === 0 && (
              <p className="text-zinc-600 text-sm py-4 text-center">
                Waiting for players...
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost ? (
            <button
              onClick={onStartMatch}
              disabled={players.length < 1}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <Play size={22} />
              Start Match
            </button>
          ) : (
            <div className="px-6 py-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-center text-zinc-400 text-sm">
              Waiting for host to start the match...
            </div>
          )}
          <button
            onClick={onLeave}
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 text-sm transition-colors"
          >
            <LogOut size={18} />
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
}
