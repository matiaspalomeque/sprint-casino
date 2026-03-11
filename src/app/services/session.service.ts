import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  SessionState,
  SessionStateDTO,
  StoryDTO,
  VoteDTO,
  Participant,
  Story,
  CreateSessionConfig,
  PeerMessage,
} from '../models/session.types';
import { PeerService } from './peer.service';
import { UserService } from './user.service';
import { getVotingOptions, generateSessionCode } from './voting.utils';
import { v4 as uuidv4 } from 'uuid';

@Injectable({ providedIn: 'root' })
export class SessionService implements OnDestroy {
  private readonly _isHost = signal(false);
  private _hostState: SessionState | null = null;
  private _subs: Subscription[] = [];
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  // Public reactive state (DTO view — votes hidden until revealed)
  private readonly _sessionDTO = signal<SessionStateDTO | null>(null);
  private readonly _myVote = signal<string | null>(null);
  private readonly _connectionStatus = signal<
    'idle' | 'connecting' | 'connected' | 'error' | 'ended'
  >('idle');
  private readonly _errorMessage = signal<string | null>(null);
  private readonly _toastMessage = signal<string | null>(null);

  readonly session = this._sessionDTO.asReadonly();
  readonly myVote = this._myVote.asReadonly();
  readonly connectionStatus = this._connectionStatus.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly toastMessage = this._toastMessage.asReadonly();
  readonly isHost = this._isHost.asReadonly();

  readonly activeStory = computed(() => {
    const s = this._sessionDTO();
    if (!s?.activeStoryId) return null;
    return s.stories.find((st) => st.storyId === s.activeStoryId) ?? null;
  });

  readonly participants = computed(() => this._sessionDTO()?.participants ?? []);

  constructor(
    private readonly peer: PeerService,
    private readonly user: UserService,
  ) {}

  // ─── HOST MODE ───────────────────────────────────────────────────────────────

  async createSession(config: CreateSessionConfig): Promise<string> {
    const identity = this.user.identity();
    if (!identity) throw new Error('No user identity');

    const sessionId = generateSessionCode();
    const votingOptions = getVotingOptions(config.votingSystem, config.customOptions);

    this._hostState = {
      sessionId,
      sessionName: config.sessionName,
      votingSystem: config.votingSystem,
      votingOptions,
      revealPolicy: config.revealPolicy,
      hostId: identity.userId,
      hostName: identity.userName,
      participants: [{ userId: identity.userId, userName: identity.userName, isHost: true }],
      stories: [],
      activeStoryId: null,
    };

    this._isHost.set(true);
    this._connectionStatus.set('connecting');

    try {
      await this.peer.createHost(sessionId);
    } catch {
      this._connectionStatus.set('error');
      this._errorMessage.set('session.errors.createFailed');
      throw new Error('Peer creation failed');
    }

    this._connectionStatus.set('connected');
    this._sessionDTO.set(this._toDTO(this._hostState));
    this._listenAsHost();
    return sessionId;
  }

  addStory(name: string): void {
    if (!this._hostState) return;
    const story: Story = {
      storyId: uuidv4(),
      name: name.trim(),
      status: 'pending',
      votes: {},
    };
    this._hostState = {
      ...this._hostState,
      stories: [...this._hostState.stories, story],
    };
    this._broadcastState();
  }

  deleteStory(storyId: string): void {
    if (!this._hostState) return;
    const updatedStories = this._hostState.stories.filter((s) => s.storyId !== storyId);
    const activeStoryId =
      this._hostState.activeStoryId === storyId ? null : this._hostState.activeStoryId;
    this._hostState = { ...this._hostState, stories: updatedStories, activeStoryId };
    this._broadcastState();
  }

  selectStory(storyId: string): void {
    if (!this._hostState) return;
    const stories = this._hostState.stories.map((s) => {
      if (s.storyId === storyId) return { ...s, status: 'voting' as const, votes: {} };
      return s;
    });
    this._hostState = { ...this._hostState, stories, activeStoryId: storyId };
    this._myVote.set(null);
    this._broadcastState();
  }

  revealVotes(storyId: string): void {
    if (!this._hostState) return;
    const stories = this._hostState.stories.map((s) => {
      if (s.storyId === storyId) return { ...s, status: 'revealed' as const };
      return s;
    });
    this._hostState = { ...this._hostState, stories };
    this._broadcastState();
  }

  resetVotes(storyId: string): void {
    if (!this._hostState) return;
    const stories = this._hostState.stories.map((s) => {
      if (s.storyId === storyId) return { ...s, status: 'voting' as const, votes: {} };
      return s;
    });
    this._hostState = { ...this._hostState, stories };
    this._myVote.set(null);
    this._broadcastState();
  }

  // ─── PARTICIPANT MODE ─────────────────────────────────────────────────────────

  async joinSession(sessionId: string): Promise<void> {
    const identity = this.user.identity();
    if (!identity) throw new Error('No user identity');

    this._isHost.set(false);
    this._connectionStatus.set('connecting');

    try {
      await this.peer.connectToHost(sessionId);
    } catch (err: unknown) {
      this._connectionStatus.set('error');
      const peerErr = err as { type?: string };
      if (peerErr?.type === 'peer-unavailable') {
        this._errorMessage.set('session.errors.sessionNotFound');
      } else {
        this._errorMessage.set('session.errors.couldNotConnect');
      }
      throw err;
    }

    this._connectionStatus.set('connected');
    this._listenAsParticipant();

    // Send join message
    this.peer.sendToHost({
      type: 'join',
      payload: { userId: identity.userId, userName: identity.userName },
    });
  }

  castVote(value: string): void {
    const activeStory = this.activeStory();
    if (!activeStory || activeStory.status !== 'voting') return;

    this._myVote.set(value);

    if (this._isHost()) {
      // Host votes directly into state
      if (!this._hostState) return;
      const identity = this.user.identity()!;
      const stories = this._hostState.stories.map((s) => {
        if (s.storyId === activeStory.storyId) {
          return { ...s, votes: { ...s.votes, [identity.userId]: value } };
        }
        return s;
      });
      this._hostState = { ...this._hostState, stories };
      this._broadcastState();
    } else {
      const identity = this.user.identity()!;
      this.peer.sendToHost({
        type: 'cast_vote',
        payload: { storyId: activeStory.storyId, value },
      });
    }
  }

  requestReveal(): void {
    const activeStory = this.activeStory();
    if (!activeStory) return;

    if (this._isHost()) {
      this.revealVotes(activeStory.storyId);
    } else {
      this.peer.sendToHost({
        type: 'reveal_votes',
        payload: { storyId: activeStory.storyId },
      });
    }
  }

  leaveSession(): void {
    if (!this._isHost()) {
      this.peer.sendToHost({ type: 'leave', payload: {} });
    }
    this._cleanup();
  }

  clearSession(): void {
    this._cleanup();
  }

  showToast(message: string): void {
    if (this._toastTimer !== null) clearTimeout(this._toastTimer);
    this._toastMessage.set(message);
    this._toastTimer = setTimeout(() => {
      this._toastMessage.set(null);
      this._toastTimer = null;
    }, 3000);
  }

  // ─── PRIVATE ─────────────────────────────────────────────────────────────────

  private _listenAsHost(): void {
    this._subs.push(
      this.peer.onData$.subscribe(({ connectionId, data }) => {
        this._handleHostMessage(connectionId, data);
      }),
      this.peer.onDisconnect$.subscribe((connectionId) => {
        const userId = this.peer.getUserIdForConnection(connectionId);
        if (userId) this._handleParticipantLeave(userId);
      }),
    );
  }

  private _handleHostMessage(connectionId: string, msg: PeerMessage): void {
    if (!this._hostState) return;

    switch (msg.type) {
      case 'join': {
        const { userId, userName } = msg.payload;
        this.peer.mapConnectionToUser(connectionId, userId);

        const alreadyJoined = this._hostState.participants.some((p) => p.userId === userId);
        if (!alreadyJoined) {
          const participant: Participant = { userId, userName, isHost: false };
          this._hostState = {
            ...this._hostState,
            participants: [...this._hostState.participants, participant],
          };
        }
        this._broadcastState();
        break;
      }

      case 'cast_vote': {
        const { storyId, value } = msg.payload;
        const userId = this.peer.getUserIdForConnection(connectionId);
        if (!userId) return;
        const story = this._hostState.stories.find((s) => s.storyId === storyId);
        if (!story || story.status !== 'voting') return;
        if (!this._hostState.votingOptions.includes(value)) return;

        const stories = this._hostState.stories.map((s) => {
          if (s.storyId === storyId) return { ...s, votes: { ...s.votes, [userId]: value } };
          return s;
        });
        this._hostState = { ...this._hostState, stories };
        this._broadcastState();
        break;
      }

      case 'reveal_votes': {
        const { storyId } = msg.payload;
        const userId = this.peer.getUserIdForConnection(connectionId);
        if (!userId) return;
        if (this._hostState.revealPolicy === 'host_only' && userId !== this._hostState.hostId)
          return;
        this.revealVotes(storyId);
        break;
      }

      case 'leave': {
        const userId = this.peer.getUserIdForConnection(connectionId);
        if (userId) this._handleParticipantLeave(userId);
        break;
      }
    }
  }

  private _handleParticipantLeave(userId: string): void {
    if (!this._hostState) return;
    this._hostState = {
      ...this._hostState,
      participants: this._hostState.participants.filter((p) => p.userId !== userId),
    };
    this._broadcastState();
  }

  private _listenAsParticipant(): void {
    this._subs.push(
      this.peer.onData$.subscribe(({ data }) => {
        if (data.type === 'session_state') {
          this._sessionDTO.set(data.payload);
        } else if (data.type === 'error') {
          this._errorMessage.set(data.payload.message);
        }
      }),
      this.peer.onDisconnect$.subscribe(() => {
        this._connectionStatus.set('ended');
      }),
      this.peer.onError$.subscribe((err) => {
        this._connectionStatus.set('error');
        this._errorMessage.set(err.message);
      }),
    );
  }

  private _broadcastState(): void {
    if (!this._hostState) return;
    const dto = this._toDTO(this._hostState);
    this._sessionDTO.set(dto);
    this.peer.broadcast({ type: 'session_state', payload: dto });
  }

  private _toDTO(state: SessionState): SessionStateDTO {
    return {
      sessionId: state.sessionId,
      sessionName: state.sessionName,
      votingSystem: state.votingSystem,
      votingOptions: state.votingOptions,
      revealPolicy: state.revealPolicy,
      hostId: state.hostId,
      participants: state.participants.map((p) => ({ ...p })),
      stories: state.stories.map((s) => this._storyToDTO(s, state)),
      activeStoryId: state.activeStoryId,
    };
  }

  private _storyToDTO(story: Story, state: SessionState): StoryDTO {
    const votes: VoteDTO[] | null =
      story.status === 'revealed'
        ? Object.entries(story.votes).map(([userId, value]) => {
            const participant = state.participants.find((p) => p.userId === userId);
            return { userId, userName: participant?.userName ?? 'Unknown', value };
          })
        : null;

    return {
      storyId: story.storyId,
      name: story.name,
      status: story.status,
      votedUserIds: Object.keys(story.votes),
      votes,
    };
  }

  private _cleanup(): void {
    this._subs.forEach((s) => s.unsubscribe());
    this._subs = [];
    if (this._toastTimer !== null) {
      clearTimeout(this._toastTimer);
      this._toastTimer = null;
    }
    this.peer.destroy();
    this._hostState = null;
    this._isHost.set(false);
    this._sessionDTO.set(null);
    this._myVote.set(null);
    this._connectionStatus.set('idle');
    this._errorMessage.set(null);
    this._toastMessage.set(null);
  }

  ngOnDestroy(): void {
    this._cleanup();
  }
}
