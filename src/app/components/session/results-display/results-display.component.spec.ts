import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ResultsDisplayComponent } from './results-display.component';
import { VoteDTO } from '../../../models/session.types';

describe('ResultsDisplayComponent', () => {
  let fixture: ComponentFixture<ResultsDisplayComponent>;
  let component: ResultsDisplayComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ResultsDisplayComponent] });
    fixture = TestBed.createComponent(ResultsDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('results computed', () => {
    it('returns empty results for empty votes', () => {
      const r = component.results();
      expect(r.totalVotes).toBe(0);
      expect(r.average).toBeNull();
      expect(r.mode).toBeNull();
    });

    it('computes results for fibonacci votes', () => {
      const votes: VoteDTO[] = [
        { userId: 'a', userName: 'Alice', value: '5' },
        { userId: 'b', userName: 'Bob', value: '8' },
      ];
      fixture.componentRef.setInput('votes', votes);
      fixture.componentRef.setInput('votingSystem', 'fibonacci');
      fixture.detectChanges();
      const r = component.results();
      expect(r.totalVotes).toBe(2);
      expect(r.average).toBe(6.5);
    });
  });

  describe('distributionEntries computed', () => {
    it('returns empty array for no votes', () => {
      expect(component.distributionEntries()).toEqual([]);
    });

    it('sorts entries by count descending', () => {
      const votes: VoteDTO[] = [
        { userId: 'a', userName: 'Alice', value: '5' },
        { userId: 'b', userName: 'Bob', value: '5' },
        { userId: 'c', userName: 'Carol', value: '8' },
      ];
      fixture.componentRef.setInput('votes', votes);
      fixture.componentRef.setInput('votingSystem', 'fibonacci');
      fixture.detectChanges();
      const entries = component.distributionEntries();
      expect(entries[0].value).toBe('5');
      expect(entries[0].count).toBe(2);
      expect(entries[1].value).toBe('8');
      expect(entries[1].count).toBe(1);
    });
  });
});
