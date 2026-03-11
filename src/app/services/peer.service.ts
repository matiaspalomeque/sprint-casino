import { Injectable, OnDestroy } from '@angular/core';
import Peer, { DataConnection } from 'peerjs';
import { Subject } from 'rxjs';
import { PeerMessage } from '../models/session.types';

export interface IncomingData {
  connectionId: string;
  data: PeerMessage;
}

@Injectable({ providedIn: 'root' })
export class PeerService implements OnDestroy {
  private peer: Peer | null = null;
  private connections = new Map<string, DataConnection>();
  private connectionIdToUserId = new Map<string, string>();

  readonly onConnection$ = new Subject<DataConnection>();
  readonly onData$ = new Subject<IncomingData>();
  readonly onDisconnect$ = new Subject<string>(); // connectionId
  readonly onError$ = new Subject<{ type: string; message: string }>();

  createHost(sessionId: string): Promise<void> {
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
    this.peer?.destroy();
    this.peer = null;
    this.connections.clear();
    this.connectionIdToUserId.clear();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private _setupConnection(conn: DataConnection): void {
    this.connections.set(conn.connectionId, conn);

    conn.on('data', (data) => {
      this.onData$.next({ connectionId: conn.connectionId, data: data as PeerMessage });
    });

    conn.on('close', () => {
      this.connections.delete(conn.connectionId);
      this.onDisconnect$.next(conn.connectionId);
    });

    conn.on('error', (err) => {
      this.onError$.next({ type: 'connection', message: err.message });
      this.connections.delete(conn.connectionId);
      this.onDisconnect$.next(conn.connectionId);
    });
  }
}
