import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SessionService } from './session.service';
import { PeerService, IncomingData } from './peer.service';
import { UserService } from './user.service';
import { PeerMessage, SessionStateDTO } from '../models/session.types';
import { vi } from 'vitest';

// ── Mock PeerService ──────────────────────────────────────────────────────────

class MockPeerService {
  onConnection$ = new Subject<unknown>();
  onData$ = new Subject<IncomingData>();
  onDisconnect$ = new Subject<string>();
  onReconnecting$ = new Subject<void>();
  onReconnected$ = new Subject<void>();
  onError$ = new Subject<{ type: string; message: string }>();

  createHost = vi.fn().mockResolvedValue(undefined);
  connectToHost = vi.fn().mockResolvedValue(undefined);
  send = vi.fn();
  broadcast = vi.fn();
  sendToHost = vi.fn();
  destroy = vi.fn();
  mapConnectionToUser = vi.fn();
  getUserIdForConnection = vi.fn();
  getConnectionForUser = vi.fn();
  ngOnDestroy = vi.fn();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  sessionName: 'Test Session',
  votingSystem: 'fibonacci' as const,
  customOptions: '',
  revealPolicy: 'host_only' as const,
};

function setupUser(userService: UserService, name = 'Alice') {
  userService.setUserName(name);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('SessionService', () => {
  let service: SessionService;
  let peer: MockPeerService;
  let userService: UserService;

  beforeEach(() => {
    localStorage.clear();
    peer = new MockPeerService();

    TestBed.configureTestingModule({
      providers: [{ provide: PeerService, useValue: peer }],
    });

    service = TestBed.inject(SessionService);
    userService = TestBed.inject(UserService);
  });

  // ── Initial state ───────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('has idle connection status', () => {
      expect(service.connectionStatus()).toBe('idle');
    });

    it('is not a host', () => {
      expect(service.isHost()).toBe(false);
    });

    it('has no session', () => {
      expect(service.session()).toBeNull();
    });

    it('has no active story', () => {
      expect(service.activeStory()).toBeNull();
    });

    it('has empty participants', () => {
      expect(service.participants()).toEqual([]);
    });
  });

  // ── createSession ───────────────────────────────────────────────────────────

  describe('createSession()', () => {
    it('throws when there is no user identity', async () => {
      await expect(service.createSession(DEFAULT_CONFIG)).rejects.toThrow('No user identity');
    });

    it('creates a session and returns a session ID', async () => {
      setupUser(userService);
      const sessionId = await service.createSession(DEFAULT_CONFIG);
      expect(typeof sessionId).toBe('string');
      expect(sessionId).toHaveLength(6);
    });

    it('sets isHost to true after creation', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      expect(service.isHost()).toBe(true);
    });

    it('sets connection status to connected', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      expect(service.connectionStatus()).toBe('connected');
    });

    it('publishes session DTO after creation', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      const session = service.session();
      expect(session).not.toBeNull();
      expect(session!.sessionName).toBe('Test Session');
    });

    it('adds host as first participant', async () => {
      setupUser(userService, 'Alice');
      await service.createSession(DEFAULT_CONFIG);
      const participants = service.participants();
      expect(participants).toHaveLength(1);
      expect(participants[0].userName).toBe('Alice');
      expect(participants[0].isHost).toBe(true);
    });

    it('sets error status when peer creation fails', async () => {
      setupUser(userService);
      peer.createHost.mockRejectedValueOnce(new Error('network fail'));
      await expect(service.createSession(DEFAULT_CONFIG)).rejects.toThrow();
      expect(service.connectionStatus()).toBe('error');
    });

    it('calls peer.createHost with the session ID', async () => {
      setupUser(userService);
      const sessionId = await service.createSession(DEFAULT_CONFIG);
      expect(peer.createHost).toHaveBeenCalledWith(sessionId);
    });
  });

  // ── addStory ────────────────────────────────────────────────────────────────

  describe('addStory()', () => {
    async function createSession() {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
    }

    it('does nothing when not host', () => {
      service.addStory('Story 1');
      expect(service.session()).toBeNull();
    });

    it('adds a story to the session', async () => {
      await createSession();
      service.addStory('Story 1');
      expect(service.session()!.stories).toHaveLength(1);
      expect(service.session()!.stories[0].name).toBe('Story 1');
    });

    it('broadcasts state after adding a story', async () => {
      await createSession();
      peer.broadcast.mockClear();
      service.addStory('Story 1');
      expect(peer.broadcast).toHaveBeenCalledTimes(1);
    });

    it('adds multiple stories', async () => {
      await createSession();
      service.addStory('Story A');
      service.addStory('Story B');
      expect(service.session()!.stories).toHaveLength(2);
    });
  });

  // ── deleteStory ─────────────────────────────────────────────────────────────

  describe('deleteStory()', () => {
    async function createSessionWithStory() {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      return service.session()!.stories[0].storyId;
    }

    it('removes the story from the session', async () => {
      const storyId = await createSessionWithStory();
      service.deleteStory(storyId);
      expect(service.session()!.stories).toHaveLength(0);
    });

    it('clears activeStoryId if the active story is deleted', async () => {
      const storyId = await createSessionWithStory();
      service.selectStory(storyId);
      service.deleteStory(storyId);
      expect(service.session()!.activeStoryId).toBeNull();
    });

    it('preserves activeStoryId when deleting a different story', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story A');
      service.addStory('Story B');
      const stories = service.session()!.stories;
      service.selectStory(stories[0].storyId);
      service.deleteStory(stories[1].storyId);
      expect(service.session()!.activeStoryId).toBe(stories[0].storyId);
    });
  });

  // ── selectStory ─────────────────────────────────────────────────────────────

  describe('selectStory()', () => {
    async function createSessionWithStory() {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      return service.session()!.stories[0].storyId;
    }

    it('sets activeStoryId on the session', async () => {
      const storyId = await createSessionWithStory();
      service.selectStory(storyId);
      expect(service.session()!.activeStoryId).toBe(storyId);
    });

    it('sets story status to voting', async () => {
      const storyId = await createSessionWithStory();
      service.selectStory(storyId);
      const story = service.activeStory();
      expect(story?.status).toBe('voting');
    });

    it('clears myVote when selecting a story', async () => {
      const storyId = await createSessionWithStory();
      service.selectStory(storyId);
      expect(service.myVote()).toBeNull();
    });

    it('clears votes when re-selecting a story', async () => {
      const storyId = await createSessionWithStory();
      service.selectStory(storyId);
      // Cast a vote as host
      service.castVote('5');
      // Re-select (simulate reset via selectStory)
      service.selectStory(storyId);
      // After re-select, votes should be cleared (status voting, votes {})
      const story = service.activeStory();
      expect(story?.votedUserIds).toEqual([]);
    });
  });

  // ── revealVotes ─────────────────────────────────────────────────────────────

  describe('revealVotes()', () => {
    async function createAndSelectStory() {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      return storyId;
    }

    it('sets story status to revealed', async () => {
      const storyId = await createAndSelectStory();
      service.revealVotes(storyId);
      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.status).toBe('revealed');
    });
  });

  // ── resetVotes ──────────────────────────────────────────────────────────────

  describe('resetVotes()', () => {
    async function createAndRevealStory() {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      service.revealVotes(storyId);
      return storyId;
    }

    it('sets story status back to voting', async () => {
      const storyId = await createAndRevealStory();
      service.resetVotes(storyId);
      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.status).toBe('voting');
    });

    it('clears myVote', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      service.castVote('5');
      service.resetVotes(storyId);
      expect(service.myVote()).toBeNull();
    });
  });

  // ── castVote ────────────────────────────────────────────────────────────────

  describe('castVote()', () => {
    async function createAndSelectStory() {
      setupUser(userService, 'Alice');
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      return storyId;
    }

    it('does nothing when there is no active story', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.castVote('5');
      expect(service.myVote()).toBeNull();
    });

    it('sets myVote when host casts a vote', async () => {
      await createAndSelectStory();
      service.castVote('5');
      expect(service.myVote()).toBe('5');
    });

    it('records vote in the story when host votes', async () => {
      const storyId = await createAndSelectStory();
      service.castVote('8');
      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.votedUserIds).toHaveLength(1);
    });

    it('does not cast vote when story is in revealed state', async () => {
      const storyId = await createAndSelectStory();
      service.revealVotes(storyId);
      service.castVote('5');
      expect(service.myVote()).toBeNull();
    });
  });

  // ── requestReveal ───────────────────────────────────────────────────────────

  describe('requestReveal()', () => {
    it('does nothing when there is no active story', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      peer.broadcast.mockClear();
      service.requestReveal();
      // Only the state-setting broadcast from createSession; no new broadcast
      expect(peer.broadcast).not.toHaveBeenCalled();
    });

    it('host reveals votes directly', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      service.requestReveal();
      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.status).toBe('revealed');
    });
  });

  // ── showToast ───────────────────────────────────────────────────────────────

  describe('showToast()', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('sets the toast message immediately', () => {
      service.showToast('Hello!');
      expect(service.toastMessage()).toBe('Hello!');
    });

    it('clears the toast after 3 seconds', () => {
      service.showToast('Hello!');
      vi.advanceTimersByTime(3000);
      expect(service.toastMessage()).toBeNull();
    });

    it('resets the timer when called twice', () => {
      service.showToast('First');
      vi.advanceTimersByTime(2000);
      service.showToast('Second');
      expect(service.toastMessage()).toBe('Second');
      vi.advanceTimersByTime(3000);
      expect(service.toastMessage()).toBeNull();
    });
  });

  // ── leaveSession / clearSession ─────────────────────────────────────────────

  describe('leaveSession() and clearSession()', () => {
    it('clearSession resets to idle state', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.clearSession();
      expect(service.connectionStatus()).toBe('idle');
      expect(service.session()).toBeNull();
      expect(service.isHost()).toBe(false);
    });

    it('clearSession calls peer.destroy', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      peer.destroy.mockClear();
      service.clearSession();
      expect(peer.destroy).toHaveBeenCalledTimes(1);
    });
  });

  // ── joinSession ─────────────────────────────────────────────────────────────

  describe('joinSession()', () => {
    it('throws when there is no user identity', async () => {
      await expect(service.joinSession('ABC123')).rejects.toThrow('No user identity');
    });

    it('sets isHost to false after joining', async () => {
      setupUser(userService);
      await service.joinSession('ABC123');
      expect(service.isHost()).toBe(false);
    });

    it('sets status to connected after joining', async () => {
      setupUser(userService);
      await service.joinSession('ABC123');
      expect(service.connectionStatus()).toBe('connected');
    });

    it('sends join message to host', async () => {
      setupUser(userService, 'Bob');
      await service.joinSession('ABC123');
      expect(peer.sendToHost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'join',
          payload: expect.objectContaining({ userName: 'Bob' }),
        }),
      );
    });

    it('sets error status on peer-unavailable error', async () => {
      setupUser(userService);
      const err = Object.assign(new Error('unavailable'), { type: 'peer-unavailable' });
      peer.connectToHost.mockRejectedValueOnce(err);
      await expect(service.joinSession('NOPE00')).rejects.toThrow();
      expect(service.connectionStatus()).toBe('error');
      expect(service.errorMessage()).toBe('session.errors.sessionNotFound');
    });

    it('sets generic error message for non-peer-unavailable errors', async () => {
      setupUser(userService);
      peer.connectToHost.mockRejectedValueOnce(new Error('network error'));
      await expect(service.joinSession('NOPE00')).rejects.toThrow();
      expect(service.errorMessage()).toBe('session.errors.couldNotConnect');
    });
  });

  // ── Host message handling ───────────────────────────────────────────────────

  describe('host message handling', () => {
    async function createSessionAsHost() {
      setupUser(userService, 'Alice');
      await service.createSession(DEFAULT_CONFIG);
    }

    it('handles join message by adding participant', async () => {
      await createSessionAsHost();
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'join', payload: { userId: 'bob-id', userName: 'Bob' } },
      });
      expect(service.participants()).toHaveLength(2);
      expect(service.participants()[1].userName).toBe('Bob');
    });

    it('does not add duplicate participant on repeated join', async () => {
      await createSessionAsHost();
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'join', payload: { userId: 'bob-id', userName: 'Bob' } },
      });
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'join', payload: { userId: 'bob-id', userName: 'Bob' } },
      });
      expect(service.participants()).toHaveLength(2);
    });

    it('handles cast_vote message', async () => {
      await createSessionAsHost();
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);

      // Add a participant
      peer.getUserIdForConnection.mockReturnValue('bob-id');
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'cast_vote', payload: { storyId, value: '5' } },
      });

      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.votedUserIds).toContain('bob-id');
    });

    it('ignores cast_vote for invalid value', async () => {
      await createSessionAsHost();
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);

      peer.getUserIdForConnection.mockReturnValue('bob-id');
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'cast_vote', payload: { storyId, value: 'INVALID' } },
      });

      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.votedUserIds).toHaveLength(0);
    });

    it('handles reveal_votes message from host', async () => {
      await createSessionAsHost();
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);

      const hostId = service.session()!.hostId;
      peer.getUserIdForConnection.mockReturnValue(hostId);
      peer.onData$.next({
        connectionId: 'conn-host',
        data: { type: 'reveal_votes', payload: { storyId } },
      });

      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.status).toBe('revealed');
    });

    it('ignores reveal_votes from non-host when policy is host_only', async () => {
      await createSessionAsHost();
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);

      peer.getUserIdForConnection.mockReturnValue('bob-id');
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'reveal_votes', payload: { storyId } },
      });

      const story = service.session()!.stories.find((s) => s.storyId === storyId);
      expect(story?.status).toBe('voting');
    });

    it('handles leave message by removing participant', async () => {
      await createSessionAsHost();
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'join', payload: { userId: 'bob-id', userName: 'Bob' } },
      });
      expect(service.participants()).toHaveLength(2);

      peer.getUserIdForConnection.mockReturnValue('bob-id');
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'leave', payload: {} },
      });
      expect(service.participants()).toHaveLength(1);
    });

    it('removes participant on disconnect', async () => {
      await createSessionAsHost();
      peer.onData$.next({
        connectionId: 'conn-1',
        data: { type: 'join', payload: { userId: 'bob-id', userName: 'Bob' } },
      });
      peer.getUserIdForConnection.mockReturnValue('bob-id');
      peer.onDisconnect$.next('conn-1');
      expect(service.participants()).toHaveLength(1);
    });
  });

  // ── Participant message handling ─────────────────────────────────────────────

  describe('participant message handling', () => {
    async function joinAsParticipant() {
      setupUser(userService, 'Bob');
      await service.joinSession('ABC123');
    }

    it('updates session state when receiving session_state message', async () => {
      await joinAsParticipant();
      const dto: SessionStateDTO = {
        sessionId: 'ABC123',
        sessionName: 'Test',
        votingSystem: 'fibonacci',
        votingOptions: ['1', '2', '3'],
        revealPolicy: 'host_only',
        hostId: 'host-id',
        participants: [],
        stories: [],
        activeStoryId: null,
      };
      peer.onData$.next({
        connectionId: 'conn-host',
        data: { type: 'session_state', payload: dto },
      });
      expect(service.session()?.sessionName).toBe('Test');
    });

    it('sets error message when receiving error message', async () => {
      await joinAsParticipant();
      peer.onData$.next({
        connectionId: 'conn-host',
        data: { type: 'error', payload: { message: 'Something went wrong' } },
      });
      expect(service.errorMessage()).toBe('Something went wrong');
    });

    it('sets status to ended when host disconnects', async () => {
      await joinAsParticipant();
      peer.onDisconnect$.next('conn-host');
      expect(service.connectionStatus()).toBe('ended');
    });

    it('sets error status on peer error', async () => {
      await joinAsParticipant();
      peer.onError$.next({ type: 'network', message: 'Network error' });
      expect(service.connectionStatus()).toBe('error');
      expect(service.errorMessage()).toBe('Network error');
    });
  });

  // ── Computed: activeStory ───────────────────────────────────────────────────

  describe('activeStory computed', () => {
    it('returns null when no session', () => {
      expect(service.activeStory()).toBeNull();
    });

    it('returns null when no active story is selected', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      expect(service.activeStory()).toBeNull();
    });

    it('returns the active story once selected', async () => {
      setupUser(userService);
      await service.createSession(DEFAULT_CONFIG);
      service.addStory('Story 1');
      const storyId = service.session()!.stories[0].storyId;
      service.selectStory(storyId);
      expect(service.activeStory()?.name).toBe('Story 1');
    });
  });
});
