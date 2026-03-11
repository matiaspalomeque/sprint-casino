import { TestBed, ComponentFixture } from '@angular/core/testing';
import { VotingBoardComponent } from './voting-board.component';
import { StoryDTO, VoteDTO } from '../../../models/session.types';

const VOTING_STORY: StoryDTO = {
  storyId: 's1',
  name: 'Story 1',
  status: 'voting',
  votedUserIds: ['user-a'],
  votes: null,
};

const REVEALED_STORY: StoryDTO = {
  storyId: 's1',
  name: 'Story 1',
  status: 'revealed',
  votedUserIds: ['user-a', 'user-b'],
  votes: [
    { userId: 'user-a', userName: 'Alice', value: '5' },
    { userId: 'user-b', userName: 'Bob', value: '8' },
  ] as VoteDTO[],
};

describe('VotingBoardComponent', () => {
  let fixture: ComponentFixture<VotingBoardComponent>;
  let component: VotingBoardComponent;

  function create(opts: {
    activeStory?: StoryDTO | null;
    isHost?: boolean;
    revealPolicy?: 'host_only' | 'anyone';
    currentUserId?: string | null;
  } = {}) {
    fixture = TestBed.createComponent(VotingBoardComponent);
    if (opts.activeStory !== undefined) fixture.componentRef.setInput('activeStory', opts.activeStory);
    if (opts.isHost !== undefined) fixture.componentRef.setInput('isHost', opts.isHost);
    if (opts.revealPolicy !== undefined) fixture.componentRef.setInput('revealPolicy', opts.revealPolicy);
    if (opts.currentUserId !== undefined) fixture.componentRef.setInput('currentUserId', opts.currentUserId);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [VotingBoardComponent] });
  });

  describe('voteCount computed', () => {
    it('returns 0 when no active story', () => {
      create({ activeStory: null });
      expect(component.voteCount()).toBe(0);
    });

    it('returns voted count from the active story', () => {
      create({ activeStory: VOTING_STORY });
      expect(component.voteCount()).toBe(1);
    });
  });

  describe('canReveal computed', () => {
    it('returns true when policy is anyone', () => {
      create({ revealPolicy: 'anyone', isHost: false });
      expect(component.canReveal()).toBe(true);
    });

    it('returns true when policy is host_only and user is host', () => {
      create({ revealPolicy: 'host_only', isHost: true });
      expect(component.canReveal()).toBe(true);
    });

    it('returns false when policy is host_only and user is not host', () => {
      create({ revealPolicy: 'host_only', isHost: false });
      expect(component.canReveal()).toBe(false);
    });
  });

  describe('hasVoted()', () => {
    it('returns false when no active story', () => {
      create({ activeStory: null });
      expect(component.hasVoted('user-a')).toBe(false);
    });

    it('returns true when user is in votedUserIds', () => {
      create({ activeStory: VOTING_STORY });
      expect(component.hasVoted('user-a')).toBe(true);
    });

    it('returns false when user is not in votedUserIds', () => {
      create({ activeStory: VOTING_STORY });
      expect(component.hasVoted('user-x')).toBe(false);
    });
  });

  describe('getVote()', () => {
    it('returns ? when no active story', () => {
      create({ activeStory: null });
      expect(component.getVote('user-a')).toBe('?');
    });

    it('returns ? when votes is null (voting state)', () => {
      create({ activeStory: VOTING_STORY });
      expect(component.getVote('user-a')).toBe('?');
    });

    it('returns the vote value when revealed', () => {
      create({ activeStory: REVEALED_STORY });
      expect(component.getVote('user-a')).toBe('5');
    });

    it('returns ? for a user who did not vote', () => {
      create({ activeStory: REVEALED_STORY });
      expect(component.getVote('unknown-user')).toBe('?');
    });
  });
});
