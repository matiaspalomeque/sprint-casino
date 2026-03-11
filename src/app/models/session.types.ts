export type VotingSystem = 'fibonacci' | 'tshirt' | 'high_level' | 'custom';
export type RevealPolicy = 'host_only' | 'anyone';
export type StoryStatus = 'pending' | 'voting' | 'revealed';

export interface Participant {
  userId: string;
  userName: string;
  isHost: boolean;
}

export interface Story {
  storyId: string;
  name: string;
  status: StoryStatus;
  votes: Record<string, string>; // userId -> value (host only, never sent until revealed)
}

export interface SessionState {
  sessionId: string;
  sessionName: string;
  votingSystem: VotingSystem;
  votingOptions: string[];
  revealPolicy: RevealPolicy;
  hostId: string;
  hostName: string;
  participants: Participant[];
  stories: Story[];
  activeStoryId: string | null;
}

export interface VoteDTO {
  userId: string;
  userName: string;
  value: string;
}

export interface StoryDTO {
  storyId: string;
  name: string;
  status: StoryStatus;
  votedUserIds: string[];
  votes: VoteDTO[] | null; // null until revealed
}

export interface SessionStateDTO {
  sessionId: string;
  sessionName: string;
  votingSystem: VotingSystem;
  votingOptions: string[];
  revealPolicy: RevealPolicy;
  hostId: string;
  participants: Participant[];
  stories: StoryDTO[];
  activeStoryId: string | null;
}

// PeerJS message protocol
export interface JoinMessage {
  type: 'join';
  payload: { userId: string; userName: string };
}

export interface CastVoteMessage {
  type: 'cast_vote';
  payload: { storyId: string; value: string };
}

export interface RevealMessage {
  type: 'reveal_votes';
  payload: { storyId: string };
}

export interface LeaveMessage {
  type: 'leave';
  payload: Record<string, never>;
}

export interface SessionStateMessage {
  type: 'session_state';
  payload: SessionStateDTO;
}

export interface ErrorMessage {
  type: 'error';
  payload: { message: string };
}

export type ParticipantMessage = JoinMessage | CastVoteMessage | RevealMessage | LeaveMessage;
export type HostMessage = SessionStateMessage | ErrorMessage;
export type PeerMessage = ParticipantMessage | HostMessage;

export interface CreateSessionConfig {
  sessionName: string;
  votingSystem: VotingSystem;
  customOptions?: string;
  revealPolicy: RevealPolicy;
}
