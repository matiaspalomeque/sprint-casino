import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ParticipantsPanelComponent } from './participants-panel.component';
import { StoryDTO, VoteDTO } from '../../../models/session.types';

const ALICE = { userId: 'user-a', userName: 'Alice', isHost: true };
const BOB = { userId: 'user-b', userName: 'Bob', isHost: false };

const REVEALED_STORY: StoryDTO = {
  storyId: 's1',
  name: 'Story 1',
  status: 'revealed',
  votedUserIds: ['user-a'],
  votes: [{ userId: 'user-a', userName: 'Alice', value: '5' }] as VoteDTO[],
};

const VOTING_STORY: StoryDTO = {
  storyId: 's1',
  name: 'Story 1',
  status: 'voting',
  votedUserIds: ['user-a'],
  votes: null,
};

describe('ParticipantsPanelComponent', () => {
  let fixture: ComponentFixture<ParticipantsPanelComponent>;
  let component: ParticipantsPanelComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [ParticipantsPanelComponent] });
    fixture = TestBed.createComponent(ParticipantsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('hasVoted()', () => {
    it('returns false when no active story', () => {
      expect(component.hasVoted('user-a')).toBe(false);
    });

    it('returns true when user is in votedUserIds', () => {
      fixture.componentRef.setInput('activeStory', VOTING_STORY);
      fixture.detectChanges();
      expect(component.hasVoted('user-a')).toBe(true);
    });

    it('returns false when user is not in votedUserIds', () => {
      fixture.componentRef.setInput('activeStory', VOTING_STORY);
      fixture.detectChanges();
      expect(component.hasVoted('user-x')).toBe(false);
    });
  });

  describe('getVote()', () => {
    it('returns null when no active story', () => {
      expect(component.getVote('user-a')).toBeNull();
    });

    it('returns null when votes is null (voting state)', () => {
      fixture.componentRef.setInput('activeStory', VOTING_STORY);
      fixture.detectChanges();
      expect(component.getVote('user-a')).toBeNull();
    });

    it('returns the vote value when revealed', () => {
      fixture.componentRef.setInput('activeStory', REVEALED_STORY);
      fixture.detectChanges();
      expect(component.getVote('user-a')).toBe('5');
    });

    it('returns null for user with no vote in revealed state', () => {
      fixture.componentRef.setInput('activeStory', REVEALED_STORY);
      fixture.detectChanges();
      expect(component.getVote('unknown')).toBeNull();
    });
  });

  describe('getAvatarColor()', () => {
    it('returns a hex color string', () => {
      const color = component.getAvatarColor('Alice');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('returns consistent color for the same name', () => {
      expect(component.getAvatarColor('Bob')).toBe(component.getAvatarColor('Bob'));
    });

    it('handles empty string', () => {
      expect(() => component.getAvatarColor('')).not.toThrow();
    });

    it('returns different colors for different names (most of the time)', () => {
      const colors = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'].map((n) =>
        component.getAvatarColor(n),
      );
      const unique = new Set(colors);
      // At least 2 distinct colors among 5 names
      expect(unique.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('template rendering', () => {
    it('renders participant names', () => {
      fixture.componentRef.setInput('participants', [ALICE, BOB]);
      fixture.detectChanges();
      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Alice');
      expect(text).toContain('Bob');
    });

    it('renders current user indicator', () => {
      fixture.componentRef.setInput('participants', [ALICE]);
      fixture.componentRef.setInput('currentUserId', 'user-a');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Alice');
    });

    it('renders voting state (voted vs not voted)', () => {
      fixture.componentRef.setInput('participants', [ALICE, BOB]);
      fixture.componentRef.setInput('activeStory', VOTING_STORY);
      fixture.detectChanges();
      const el = fixture.nativeElement;
      // user-a has voted (✓), user-b has not (—)
      expect(el.textContent).toContain('✓');
      expect(el.textContent).toContain('—');
    });

    it('renders revealed votes', () => {
      fixture.componentRef.setInput('participants', [ALICE]);
      fixture.componentRef.setInput('activeStory', REVEALED_STORY);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('5');
    });

    it('renders host badge', () => {
      fixture.componentRef.setInput('participants', [ALICE]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('♛');
    });
  });
});
