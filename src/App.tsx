import { useCallback, useEffect, useRef, useState } from 'react';
import type { DataConnection } from 'peerjs';
import { LandingScreen } from '@/components/LandingScreen';
import { Lobby } from '@/components/Lobby';
import { GameScreen } from '@/components/GameScreen';
import { ToastContainer } from '@/components/ToastContainer';
import { useToasts } from '@/hooks/useToasts';
import { usePeerRoom } from '@/hooks/usePeerRoom';
import { generateRoomCode } from '@/hooks/useGameUtils';
import { loadDictionary, pickRandomWord } from '@/utils/wordle';
import type { NetMessage, PlayerStats, Screen, GamePhase, RoundEndReason } from '@/types';

const ROUND_DURATION = 120; // seconds

export default function App() {
  const { toasts, show, dismiss } = useToasts();
  const [screen, setScreen] = useState<Screen>('landing');
  const [error, setError] = useState<string | null>(null);
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [targetWord, setTargetWord] = useState('');
  const [roundStartTime, setRoundStartTime] = useState(0);
  const [myStats, setMyStats] = useState({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
  const [roundEndReason, setRoundEndReason] = useState<RoundEndReason | null>(null);

  const hostPlayersRef = useRef<Map<string, PlayerStats>>(new Map());
  const playerNameRef = useRef<string>('Player');
  const isHostRef = useRef<boolean>(false);
  const myStatsRef = useRef(myStats);
  const screenRef = useRef<Screen>('landing');
  const gamePhaseRef = useRef<GamePhase>('lobby');
  const targetWordRef = useRef('');
  const roundStartTimeRef = useRef(0);

  useEffect(() => { myStatsRef.current = myStats; }, [myStats]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { gamePhaseRef.current = gamePhase; }, [gamePhase]);
  useEffect(() => { targetWordRef.current = targetWord; }, [targetWord]);
  useEffect(() => { roundStartTimeRef.current = roundStartTime; }, [roundStartTime]);

  const handleMessage = useCallback(
    (msg: NetMessage) => {
      if ((msg as { type: string }).type === 'room-full') {
        show('Room is full', 'error', 3000);
        peer.destroy();
        setScreen('landing');
        return;
      }

      switch (msg.type) {
        case 'hello': {
          if (isHostRef.current) {
            const newPlayer: PlayerStats = {
              peerId: msg.peerId,
              name: msg.name,
              wordsSolved: 0,
              totalGreen: 0,
              totalYellow: 0,
              hintsUsed: 0,
              done: false,
              joinedAt: Date.now(),
              isHost: false,
              lastUpdate: Date.now(),
            };
            hostPlayersRef.current.set(msg.peerId, newPlayer);
            peer.updatePlayers((prev) => [...prev, newPlayer]);

            const allPlayers = [
              ...(peer.peerId
                ? [{
                    peerId: peer.peerId,
                    name: playerNameRef.current,
                    wordsSolved: myStatsRef.current.wordsSolved,
                    totalGreen: myStatsRef.current.totalGreen,
                    totalYellow: myStatsRef.current.totalYellow,
                    hintsUsed: myStatsRef.current.hintsUsed,
                    done: myStatsRef.current.done,
                    joinedAt: 0,
                    isHost: true,
                    lastUpdate: Date.now(),
                  } as PlayerStats]
                : []),
              ...Array.from(hostPlayersRef.current.values()),
            ];
            peer.sendTo(msg.peerId, { type: 'player-list', players: allPlayers });
            peer.sendTo(msg.peerId, { type: 'room-config', maxPlayers: peer.roomConfig.maxPlayers });

            // If a round is in progress, send the late joiner straight into the game
            if (gamePhaseRef.current === 'playing' && targetWordRef.current) {
              peer.sendTo(msg.peerId, {
                type: 'start-match',
                targetWord: targetWordRef.current,
                roundStartTime: roundStartTimeRef.current,
                duration: ROUND_DURATION,
              });
            }
          }
          break;
        }

        case 'player-list': {
          peer.setPlayersDirect(msg.players);
          break;
        }

        case 'room-config': {
          peer.updateConfig({ maxPlayers: msg.maxPlayers });
          break;
        }

        case 'stats-update': {
          peer.updatePlayers((prev) =>
            prev.map((p) =>
              p.peerId === msg.peerId
                ? {
                    ...p,
                    wordsSolved: msg.wordsSolved,
                    totalGreen: msg.totalGreen,
                    totalYellow: msg.totalYellow,
                    hintsUsed: msg.hintsUsed,
                    done: msg.done,
                    lastUpdate: Date.now(),
                  }
                : p,
            ),
          );
          if (isHostRef.current) {
            peer.broadcast(msg, msg.peerId);
          }
          break;
        }

        case 'start-match': {
          setTargetWord(msg.targetWord);
          setRoundStartTime(msg.roundStartTime);
          setGamePhase('playing');
          setScreen('game');
          setMyStats({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
          setRoundEndReason(null);
          break;
        }

        case 'new-round': {
          setTargetWord(msg.targetWord);
          setRoundStartTime(msg.roundStartTime);
          setGamePhase('playing');
          setScreen('game');
          setMyStats({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
          setRoundEndReason(null);
          break;
        }

        case 'round-end': {
          setRoundEndReason(msg.reason);
          setGamePhase('ended');
          break;
        }

        case 'peer-left': {
          peer.updatePlayers((prev) => prev.filter((p) => p.peerId !== msg.peerId));
          hostPlayersRef.current.delete(msg.peerId);
          break;
        }

        case 'host-migrate': {
          // The new host is me
          if (msg.newHostId === peer.peerId) {
            isHostRef.current = true;
            show('You are now the host!', 'info', 3000);
            peer.migrateToHost();
            // Mark myself as host in the player list
            peer.updatePlayers((prev) =>
              prev.map((p) => (p.peerId === peer.peerId ? { ...p, isHost: true } : p)),
            );
          }
          break;
        }

        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePeerConnected = useCallback(
    (_conn: DataConnection) => {
      if (isHostRef.current) {
        show('A player joined the room', 'success', 2000);
      }
    },
    [show],
  );

  const handlePeerDisconnected = useCallback(
    (disconnectedPeerId: string) => {
      // Remove the player from lists
      peer.updatePlayers((prev) => prev.filter((p) => p.peerId !== disconnectedPeerId));
      hostPlayersRef.current.delete(disconnectedPeerId);

      // If the host disconnected, migrate leadership
      const remainingPlayers = peer.players.filter((p) => p.peerId !== disconnectedPeerId);
      const wasHost = remainingPlayers.length === peer.players.length - 1
        ? peer.players.find((p) => p.peerId === disconnectedPeerId)?.isHost
        : undefined;

      if (wasHost) {
        // Pick the first remaining player as new host
        const newHost = remainingPlayers[0];
        if (newHost) {
          // Broadcast migration to all remaining peers
          peer.broadcast({ type: 'host-migrate', newHostId: newHost.peerId });

          // If I'm the new host, take over
          if (newHost.peerId === peer.peerId) {
            isHostRef.current = true;
            show('You are now the host!', 'info', 3000);
            peer.migrateToHost();
            peer.updatePlayers((prev) =>
              prev.map((p) => (p.peerId === peer.peerId ? { ...p, isHost: true } : p)),
            );
          }
        }
      } else {
        // Non-host left: host broadcasts peer-left
        if (isHostRef.current) {
          peer.broadcast({ type: 'peer-left', peerId: disconnectedPeerId });
        }
      }

      show('A player disconnected', 'info', 2000);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [show],
  );

  const handlePeerError = useCallback(
    (err: string) => {
      if (err.includes('unavailable-id')) {
        setError('Room code already in use. Try another.');
      } else if (err.includes('peer-unavailable')) {
        setError('Room not found. Check the code and try again.');
      } else if (err.includes('Host migration in progress')) {
        show('Becoming host, please wait...', 'info', 3000);
      } else if (err.includes('Browser unsupported') || err.includes('network')) {
        show('Network issue detected. Check your connection.', 'error', 4000);
      } else {
        show(err, 'error', 3000);
      }
    },
    [show],
  );

  const peer = usePeerRoom({
    onMessage: handleMessage,
    onPeerConnected: handlePeerConnected,
    onPeerDisconnected: handlePeerDisconnected,
    onError: handlePeerError,
  });

  useEffect(() => {
    isHostRef.current = peer.isHost;
  }, [peer.isHost]);

  useEffect(() => {
    loadDictionary();
  }, []);

  const broadcastStats = useCallback(
    (stats: { wordsSolved: number; totalGreen: number; totalYellow: number; hintsUsed: number; done: boolean }) => {
      if (peer.peerId) {
        const msg: NetMessage = {
          type: 'stats-update',
          peerId: peer.peerId,
          wordsSolved: stats.wordsSolved,
          totalGreen: stats.totalGreen,
          totalYellow: stats.totalYellow,
          hintsUsed: stats.hintsUsed,
          done: stats.done,
        };
        peer.broadcast(msg);
      }
    },
    [peer],
  );

  const handleCreateRoom = useCallback(
    (playerName: string, maxPlayers: number) => {
      setError(null);
      playerNameRef.current = playerName;
      isHostRef.current = true;

      const code = generateRoomCode();
      peer.createRoom(code, { maxPlayers });

      const selfPlayer: PlayerStats = {
        peerId: code,
        name: playerName,
        wordsSolved: 0,
        totalGreen: 0,
        totalYellow: 0,
        hintsUsed: 0,
        done: false,
        joinedAt: Date.now(),
        isHost: true,
        lastUpdate: Date.now(),
      };
      peer.setPlayersDirect([selfPlayer]);
      hostPlayersRef.current.set(code, selfPlayer);

      setScreen('lobby');
    },
    [peer],
  );

  const handleJoinRoom = useCallback(
    (playerName: string, roomCode: string) => {
      setError(null);
      playerNameRef.current = playerName;
      isHostRef.current = false;

      peer.joinRoom(roomCode, playerName);
      setScreen('lobby');
    },
    [peer],
  );

  const startNewRound = useCallback(() => {
    if (!isHostRef.current) return;
    const word = pickRandomWord();
    const startTime = Date.now();
    setTargetWord(word);
    setRoundStartTime(startTime);
    setGamePhase('playing');
    setMyStats({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
    setRoundEndReason(null);

    const msg: NetMessage = {
      type: 'new-round',
      targetWord: word,
      roundStartTime: startTime,
      duration: ROUND_DURATION,
    };
    peer.broadcast(msg);
  }, [peer]);

  const handleStartMatch = useCallback(() => {
    if (!isHostRef.current) return;
    const word = pickRandomWord();
    const startTime = Date.now();
    setTargetWord(word);
    setRoundStartTime(startTime);
    setGamePhase('playing');
    setScreen('game');
    setMyStats({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
    setRoundEndReason(null);

    const msg: NetMessage = {
      type: 'start-match',
      targetWord: word,
      roundStartTime: startTime,
      duration: ROUND_DURATION,
    };
    peer.broadcast(msg);
  }, [peer]);

  const handleGuessSubmitted = useCallback(
    (green: number, yellow: number, solved: boolean, outOfGuesses: boolean) => {
      setMyStats((prev) => {
        const isDone = solved || outOfGuesses;
        const next = {
          wordsSolved: prev.wordsSolved + (solved ? 1 : 0),
          totalGreen: prev.totalGreen + green,
          totalYellow: prev.totalYellow + yellow,
          hintsUsed: prev.hintsUsed,
          done: isDone,
        };
        broadcastStats(next);
        return next;
      });
    },
    [broadcastStats],
  );

  const handleHintUsed = useCallback(() => {
    setMyStats((prev) => {
      const next = { ...prev, hintsUsed: prev.hintsUsed + 1 };
      broadcastStats(next);
      return next;
    });
  }, [broadcastStats]);

  const handleRoundEnd = useCallback(
    (reason: RoundEndReason) => {
      setRoundEndReason(reason);
      setGamePhase('ended');
      if (isHostRef.current) {
        peer.broadcast({ type: 'round-end', reason });
      }
    },
    [peer],
  );

  const handleLeave = useCallback(() => {
    if (peer.peerId) {
      peer.broadcast({ type: 'peer-left', peerId: peer.peerId });
    }
    peer.destroy();
    hostPlayersRef.current.clear();
    setScreen('landing');
    setGamePhase('lobby');
    setMyStats({ wordsSolved: 0, totalGreen: 0, totalYellow: 0, hintsUsed: 0, done: false });
    setRoundEndReason(null);
  }, [peer]);

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      {screen === 'landing' && (
        <LandingScreen
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          error={error}
        />
      )}

      {screen === 'lobby' && (
        <Lobby
          roomCode={peer.roomCode}
          players={peer.players}
          localPeerId={peer.peerId}
          isHost={isHostRef.current}
          maxPlayers={peer.roomConfig.maxPlayers}
          onStartMatch={handleStartMatch}
          onLeave={handleLeave}
        />
      )}

      {screen === 'game' && (
        <GameScreen
          roomCode={peer.roomCode}
          localPeerId={peer.peerId}
          isHost={isHostRef.current}
          players={peer.players}
          targetWord={targetWord}
          roundStartTime={roundStartTime}
          roundDuration={ROUND_DURATION}
          gamePhase={gamePhase}
          roundEndReason={roundEndReason}
          onGuessSubmitted={handleGuessSubmitted}
          onHintUsed={handleHintUsed}
          onRoundEnd={handleRoundEnd}
          onLeave={handleLeave}
          onNextRound={startNewRound}
          myStats={myStats}
        />
      )}
    </>
  );
}
