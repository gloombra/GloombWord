import { useState } from 'react';
import { Type, PlusCircle, LogIn, Keyboard } from 'lucide-react';
import { generatePlayerName } from '@/hooks/useGameUtils';

interface LandingScreenProps {
  onCreateRoom: (playerName: string, maxPlayers: number) => void;
  onJoinRoom: (playerName: string, roomCode: string) => void;
  error: string | null;
}

export function LandingScreen({ onCreateRoom, onJoinRoom, error }: LandingScreenProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState(generatePlayerName());
  const [roomCode, setRoomCode] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);

  const codeLengthError = roomCode.length > 0 && roomCode.length < 6;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-500/8 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 shadow-lg">
              <Type size={32} className="text-red-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-50">
            <span className="text-red-500">Gloomb</span><span className="text-white">Word</span>
          </h1>
          <p className="text-zinc-400 mt-2 text-sm">
            Multiplayer P2P word battles. Create a room and challenge your friends.
          </p>
        </div>

        {mode === 'menu' && (
          <div className="flex flex-col gap-3 pop-in">
            <button
              onClick={() => setMode('create')}
              className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle size={24} />
              Create Room
            </button>
            <button
              onClick={() => setMode('join')}
              className="group flex items-center gap-3 px-6 py-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold text-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn size={24} className="text-yellow-500" />
              Join Room
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="flex flex-col gap-4 pop-in">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-red-600 focus:outline-none transition-colors"
                placeholder="Player name"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Max Players: <span className="text-red-500">{maxPlayers}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full accent-red-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-zinc-600 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>
            <button
              onClick={() => onCreateRoom(playerName, maxPlayers)}
              disabled={!playerName.trim()}
              className="px-6 py-3.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Room
            </button>
            <button
              onClick={() => setMode('menu')}
              className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="flex flex-col gap-4 pop-in">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-red-600 focus:outline-none transition-colors"
                placeholder="Player name"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5 block">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 focus:border-yellow-500 focus:outline-none transition-colors text-center text-2xl font-mono tracking-[0.3em] uppercase"
                placeholder="ABC123"
              />
              {codeLengthError && (
                <p className="text-xs text-yellow-500 mt-1">
                  Code must be 6 characters
                </p>
              )}
            </div>
            <button
              onClick={() => onJoinRoom(playerName, roomCode)}
              disabled={!playerName.trim() || roomCode.length !== 6}
              className="px-6 py-3.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Room
            </button>
            <button
              onClick={() => setMode('menu')}
              className="text-zinc-400 hover:text-zinc-200 text-sm transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-sm text-center pop-in">
            {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-zinc-600 text-xs">
          <Keyboard size={14} />
          <span>P2P WebRTC - No server required</span>
        </div>
      </div>
    </div>
  );
}
