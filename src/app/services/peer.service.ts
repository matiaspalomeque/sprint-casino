import { Injectable, OnDestroy } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { Subject } from 'rxjs';
import { PeerMessage, PEER_MESSAGE_TYPES } from '../models/session.types';

export interface IncomingData {
  connectionId: string;
  data: PeerMessage;
}

@Injectable({ providedIn: 'root' })
export class PeerService implements OnDestroy {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private connectionIdToUserId = new Map<string, string>();
  private _mode: 'host' | 'participant' | null = null;
  private _hostSessionId: string | null = null;
  private _reconnecting = false;

  readonly onConnection$ = new Subject<DataConnection>();
  readonly onData$ = new Subject<IncomingData>();
  readonly onDisconnect$ = new Subject<string>(); // connectionId
  readonly onReconnecting$ = new Subject<void>();
  readonly onReconnected$ = new Subject<void>();
  readonly onError$ = new Subject<{ type: string; message: string }>();

  createHost(sessionId: string): Promise<void> {
    this._mode = 'host';
    return new Promise((resolve, reject) => {
      this.peer = new Peer(sessionId);

      this.peer.on('open', () => resolve());

      this.peer.on('error', (err) => {
        this.onError$.next({ type: err.type, message: err.message });
        reject(err);
      });

      this.peer.on('connection', (conn) => {
        this._setupConnection(conn);
        this.onConnection$.next(conn);
      });
    });
  }

  connectToHost(sessionId: string): Promise<void> {
    this._mode = 'participant';
    this._hostSessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.peer = new Peer();

      this.peer.on('open', () => {
        const conn = this.peer!.connect(sessionId, { reliable: true });

        conn.on('open', () => {
          this._setupConnection(conn);
          resolve();
        });

        conn.on('error', (err) => {
          this.onError$.next({ type: 'connection', message: err.message });
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        this.onError$.next({ type: err.type, message: err.message });
        reject(err);
      });
    });
  }

  send(connectionId: string, message: PeerMessage): void {
    const conn = this.connections.get(connectionId);
    if (conn?.open) {
      conn.send(message);
    }
  }

  broadcast(message: PeerMessage): void {
    for (const conn of this.connections.values()) {
      if (conn.open) {
        conn.send(message);
      }
    }
  }

  mapConnectionToUser(connectionId: string, userId: string): void {
    this.connectionIdToUserId.set(connectionId, userId);
  }

  getUserIdForConnection(connectionId: string): string | undefined {
    return this.connectionIdToUserId.get(connectionId);
  }

  getConnectionForUser(userId: string): DataConnection | undefined {
    for (const [connId, uid] of this.connectionIdToUserId.entries()) {
      if (uid === userId) {
        return this.connections.get(connId);
      }
    }
    return undefined;
  }

  sendToHost(message: PeerMessage): void {
    // Participant has only one connection (to host)
    const [conn] = this.connections.values();
    if (conn?.open) {
      conn.send(message);
    }
  }

  destroy(): void {
    this._reconnecting = false;
    this._mode = null;
    this._hostSessionId = null;
    this.peer?.destroy();
    this.peer = null;
    this.connections.clear();
    this.connectionIdToUserId.clear();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private _isValidPeerMessage(data: unknown): data is PeerMessage {
    if (typeof data !== 'object' || data === null) return false;
    const msg = data as Record<string, unknown>;
    return (
      typeof msg['type'] === 'string' &&
      (PEER_MESSAGE_TYPES as readonly string[]).includes(msg['type']) &&
      typeof msg['payload'] === 'object' &&
      msg['payload'] !== null
    );
  }

  private _setupConnection(conn: DataConnection): void {
    this.connections.set(conn.connectionId, conn);

    conn.on('data', (data) => {
      if (this._isValidPeerMessage(data)) {
        this.onData$.next({ connectionId: conn.connectionId, data });
      }
    });

    conn.on('close', () => {
      this.connections.delete(conn.connectionId);
      if (this._mode === 'participant' && this._hostSessionId) {
        this._attemptReconnect(conn.connectionId);
      } else {
        this.onDisconnect$.next(conn.connectionId);
      }
    });

    conn.on('error', (err) => {
      this.onError$.next({ type: 'connection', message: err.message });
      this.connections.delete(conn.connectionId);
      if (this._mode === 'participant' && this._hostSessionId) {
        this._attemptReconnect(conn.connectionId);
      } else {
        this.onDisconnect$.next(conn.connectionId);
      }
    });
  }

  private _attemptReconnect(connectionId: string): void {
    if (this._reconnecting || !this.peer || !this._hostSessionId) {
      this.onDisconnect$.next(connectionId);
      return;
    }

    this._reconnecting = true;
    this.onReconnecting$.next();

    const maxRetries = 3;
    const baseDelay = 1000;
    let attempt = 0;

    const tryReconnect = (): void => {
      if (!this.peer || !this._hostSessionId) {
        this._reconnecting = false;
        this.onDisconnect$.next(connectionId);
        return;
      }

      const conn = this.peer.connect(this._hostSessionId, { reliable: true });

      conn.on('open', () => {
        this._reconnecting = false;
        this._setupConnection(conn);
        this.onReconnected$.next();
      });

      conn.on('error', () => {
        conn.close();
        attempt++;
        if (attempt >= maxRetries) {
          this._reconnecting = false;
          this.onDisconnect$.next(connectionId);
        } else {
          setTimeout(tryReconnect, baseDelay * Math.pow(2, attempt));
        }
      });
    };

    setTimeout(tryReconnect, baseDelay);
  }
}
