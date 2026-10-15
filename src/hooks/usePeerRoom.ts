import { useCallback, useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import type { NetMessage, PlayerStats, RoomConfig } from '@/types';

type ConnectionHandler = (conn: DataConnection) => void;
type MessageHandler = (msg: NetMessage) => void;
type ErrorHandler = (err: string) => void;

interface UsePeerOptions {
  onMessage?: MessageHandler;
  onPeerConnected?: ConnectionHandler;
  onPeerDisconnected?: (peerId: string) => void;
  onError?: ErrorHandler;
}

export function usePeerRoom(opts: UsePeerOptions = {}) {
  const { onMessage, onPeerConnected, onPeerDisconnected, onError } = opts;

  const peerRef = useRef<Peer | null>(null);
  const connsRef = useRef<Map<string, DataConnection>>(new Map());
  const handlersRef = useRef({ onMessage, onPeerConnected, onPeerDisconnected, onError });
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({ maxPlayers: 4 });
  const roomCodeRef = useRef<string>('');
  const isHostRef = useRef<boolean>(false);

  useEffect(() => {
    handlersRef.current = { onMessage, onPeerConnected, onPeerDisconnected, onError };
  });

  const handleError = useCallback((msg: string) => {
    handlersRef.current.onError?.(msg);
  }, []);

  const broadcast = useCallback((msg: NetMessage, excludeId?: string) => {
    connsRef.current.forEach((conn, id) => {
      if (id !== excludeId && conn.open) {
        conn.send(msg);
      }
    });
  }, []);

  const sendTo = useCallback((peerId: string, msg: NetMessage) => {
    const conn = connsRef.current.get(peerId);
    if (conn?.open) conn.send(msg);
  }, []);

  const attachConnHandlers = useCallback(
    (conn: DataConnection) => {
      const remoteId = conn.peer;

      conn.on('open', () => {
        connsRef.current.set(remoteId, conn);
        handlersRef.current.onPeerConnected?.(conn);
      });

      conn.on('data', (data) => {
        handlersRef.current.onMessage?.(data as NetMessage);
      });

      conn.on('close', () => {
        connsRef.current.delete(remoteId);
        handlersRef.current.onPeerDisconnected?.(remoteId);
      });

      conn.on('error', (err) => {
        connsRef.current.delete(remoteId);
        handleError(err?.message || 'Connection error');
      });
    },
    [handleError],
  );

  const createRoom = useCallback(
    (roomCode: string, config: RoomConfig) => {
      roomCodeRef.current = roomCode;
      isHostRef.current = true;
      setRoomConfig(config);

      const peer = new Peer(roomCode, { debug: 0 });
      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
        setConnected(true);
      });

      peer.on('connection', (conn) => {
        if (connsRef.current.size >= config.maxPlayers) {
          conn.on('open', () => {
            conn.send({ type: 'room-full' } as NetMessage);
            conn.close();
          });
          return;
        }
        attachConnHandlers(conn);
      });

      peer.on('error', (err: Error & { type?: string }) => {
        if (err.type === 'unavailable-id') {
          handleError('Room code already in use. Try another.');
        } else {
          handleError(err.message || 'Peer error');
        }
      });
    },
    [attachConnHandlers, handleError],
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      roomCodeRef.current = roomCode;
      isHostRef.current = false;

      const peer = new Peer({ debug: 0 });
      peerRef.current = peer;

      peer.on('open', () => {
        setPeerId(peer.id);
        setConnected(true);

        const conn = peer.connect(roomCode, { reliable: true });
        attachConnHandlers(conn);

        conn.on('open', () => {
          conn.send({ type: 'hello', peerId: peer.id, name: playerName });
        });
      });

      peer.on('error', (err: Error & { type?: string }) => {
        if (err.type === 'peer-unavailable') {
          handleError('Room not found. Check the code and try again.');
        } else {
          handleError(err.message || 'Connection error');
        }
      });
    },
    [attachConnHandlers, handleError],
  );

  const updateConfig = useCallback((config: RoomConfig) => {
    setRoomConfig(config);
  }, []);

  const updatePlayers = useCallback((updater: (prev: PlayerStats[]) => PlayerStats[]) => {
    setPlayers(updater);
  }, []);

  const setPlayersDirect = useCallback((p: PlayerStats[]) => {
    setPlayers(p);
  }, []);

  // Called when the host disconnects — promotes this peer to host.
  // We register a new Peer with the room code so future joiners can connect.
  const migrateToHost = useCallback(() => {
    const code = roomCodeRef.current;
    isHostRef.current = true;

    // Destroy old peer first
    peerRef.current?.destroy();
    peerRef.current = null;
    connsRef.current.clear();

    const peer = new Peer(code, { debug: 0 });
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      setConnected(true);
    });

    peer.on('connection', (conn) => {
      if (connsRef.current.size >= roomConfig.maxPlayers) {
        conn.on('open', () => {
          conn.send({ type: 'room-full' } as NetMessage);
          conn.close();
        });
        return;
      }
      attachConnHandlers(conn);
    });

    peer.on('error', (err: Error & { type?: string }) => {
      // If the old host's peer ID hasn't fully unregistered yet, retry shortly
      if (err.type === 'unavailable-id') {
        handleError('Host migration in progress, please wait...');
      } else {
        handleError(err.message || 'Peer error');
      }
    });
  }, [attachConnHandlers, handleError, roomConfig.maxPlayers]);

  const destroy = useCallback(() => {
    connsRef.current.forEach((conn) => conn.close());
    connsRef.current.clear();
    peerRef.current?.destroy();
    peerRef.current = null;
    isHostRef.current = false;
    setConnected(false);
    setPeerId(null);
    setPlayers([]);
  }, []);

  useEffect(() => {
    return () => {
      connsRef.current.forEach((conn) => conn.close());
      connsRef.current.clear();
      peerRef.current?.destroy();
    };
  }, []);

  return {
    peerId,
    connected,
    isHost: isHostRef.current,
    isHostState: peerId === roomCodeRef.current,
    players,
    roomConfig,
    roomCode: roomCodeRef.current,
    broadcast,
    sendTo,
    createRoom,
    joinRoom,
    updateConfig,
    updatePlayers,
    setPlayersDirect,
    migrateToHost,
    destroy,
  };
}
