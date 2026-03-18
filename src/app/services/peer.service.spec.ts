import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PeerService } from './peer.service';

// We test PeerService methods that don't require a live PeerJS instance.
// createHost/connectToHost require WebRTC and are covered via SessionService integration.

describe('PeerService', () => {
  let service: PeerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeerService);
  });

  // ── destroy (no peer) ────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('does not throw when no peer was created', () => {
      expect(() => service.destroy()).not.toThrow();
    });
  });

  // ── ngOnDestroy ───────────────────────────────────────────────────────────

  describe('ngOnDestroy()', () => {
    it('does not throw when no peer was created', () => {
      expect(() => service.ngOnDestroy()).not.toThrow();
    });
  });

  // ── mapConnectionToUser / getUserIdForConnection / getConnectionForUser ───

  describe('connection-to-user mapping', () => {
    it('maps a connection ID to a user ID', () => {
      service.mapConnectionToUser('conn-1', 'user-a');
      expect(service.getUserIdForConnection('conn-1')).toBe('user-a');
    });

    it('returns undefined for an unmapped connection', () => {
      expect(service.getUserIdForConnection('unknown')).toBeUndefined();
    });

    it('getConnectionForUser returns undefined for an unknown user', () => {
      expect(service.getConnectionForUser('nobody')).toBeUndefined();
    });

    it('maps multiple connections independently', () => {
      service.mapConnectionToUser('conn-1', 'user-a');
      service.mapConnectionToUser('conn-2', 'user-b');
      expect(service.getUserIdForConnection('conn-1')).toBe('user-a');
      expect(service.getUserIdForConnection('conn-2')).toBe('user-b');
    });
  });

  // ── send / broadcast / sendToHost (no connections) ───────────────────────

  describe('send() with no connections', () => {
    it('does not throw for an unknown connection ID', () => {
      expect(() =>
        service.send('no-such-conn', { type: 'session_state', payload: {} as never }),
      ).not.toThrow();
    });
  });

  describe('broadcast() with no connections', () => {
    it('does not throw when there are no connections', () => {
      expect(() =>
        service.broadcast({ type: 'session_state', payload: {} as never }),
      ).not.toThrow();
    });
  });

  describe('sendToHost() with no connections', () => {
    it('does not throw when there are no connections', () => {
      expect(() =>
        service.sendToHost({ type: 'join', payload: { userId: 'u', userName: 'U' } }),
      ).not.toThrow();
    });
  });

  // ── inject connections via internal state (type bypass) ──────────────────

  describe('send() / broadcast() / sendToHost() with injected connections', () => {
    function injectConn(connId: string, open = true) {
      const conn = {
        connectionId: connId,
        open,
        send: vi.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).connections.set(connId, conn);
      return conn;
    }

    it('send() calls conn.send for an open connection', () => {
      const conn = injectConn('conn-1');
      service.send('conn-1', { type: 'session_state', payload: {} as never });
      expect(conn.send).toHaveBeenCalledTimes(1);
    });

    it('send() skips a closed connection', () => {
      const conn = injectConn('conn-closed', false);
      service.send('conn-closed', { type: 'session_state', payload: {} as never });
      expect(conn.send).not.toHaveBeenCalled();
    });

    it('broadcast() sends to all open connections', () => {
      const c1 = injectConn('conn-1');
      const c2 = injectConn('conn-2');
      service.broadcast({ type: 'session_state', payload: {} as never });
      expect(c1.send).toHaveBeenCalledTimes(1);
      expect(c2.send).toHaveBeenCalledTimes(1);
    });

    it('broadcast() skips closed connections', () => {
      const closed = injectConn('conn-closed', false);
      service.broadcast({ type: 'session_state', payload: {} as never });
      expect(closed.send).not.toHaveBeenCalled();
    });

    it('sendToHost() sends to the first connection', () => {
      const conn = injectConn('conn-host');
      service.sendToHost({ type: 'join', payload: { userId: 'u', userName: 'U' } });
      expect(conn.send).toHaveBeenCalledTimes(1);
    });

    it('destroy() clears injected connections and mappings', () => {
      injectConn('conn-1');
      service.mapConnectionToUser('conn-1', 'user-a');
      service.destroy();
      expect(service.getUserIdForConnection('conn-1')).toBeUndefined();
      // After destroy, send should be a no-op (connection cleared)
      expect(() =>
        service.send('conn-1', { type: 'session_state', payload: {} as never }),
      ).not.toThrow();
    });

    it('getConnectionForUser returns connection after mapping', () => {
      injectConn('conn-u');
      service.mapConnectionToUser('conn-u', 'user-xyz');
      const conn = service.getConnectionForUser('user-xyz');
      expect(conn).toBeDefined();
      expect(conn?.connectionId).toBe('conn-u');
    });
  });

  // ── Message validation ─────────────────────────────────────────────────

  describe('message validation (via _isValidPeerMessage)', () => {
    // Access private method for testing
    function isValid(data: unknown): boolean {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (service as any)._isValidPeerMessage(data);
    }

    it('accepts a valid join message', () => {
      expect(isValid({ type: 'join', payload: { userId: 'u', userName: 'U' } })).toBe(true);
    });

    it('accepts a valid cast_vote message', () => {
      expect(isValid({ type: 'cast_vote', payload: { storyId: 's', value: '5' } })).toBe(true);
    });

    it('accepts a valid session_state message', () => {
      expect(isValid({ type: 'session_state', payload: {} })).toBe(true);
    });

    it('rejects null', () => {
      expect(isValid(null)).toBe(false);
    });

    it('rejects a string', () => {
      expect(isValid('hello')).toBe(false);
    });

    it('rejects an object without type', () => {
      expect(isValid({ payload: {} })).toBe(false);
    });

    it('rejects an unknown type', () => {
      expect(isValid({ type: 'hack', payload: {} })).toBe(false);
    });

    it('rejects when payload is missing', () => {
      expect(isValid({ type: 'join' })).toBe(false);
    });

    it('rejects when payload is null', () => {
      expect(isValid({ type: 'join', payload: null })).toBe(false);
    });

    it('rejects when payload is a primitive', () => {
      expect(isValid({ type: 'join', payload: 'bad' })).toBe(false);
    });
  });
});
