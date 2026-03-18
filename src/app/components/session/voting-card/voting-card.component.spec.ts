import { TestBed, ComponentFixture } from '@angular/core/testing';
import { VotingCardComponent } from './voting-card.component';

describe('VotingCardComponent', () => {
  let fixture: ComponentFixture<VotingCardComponent>;
  let component: VotingCardComponent;

  function createComponent(value: string) {
    fixture = TestBed.createComponent(VotingCardComponent);
    fixture.componentRef.setInput('value', value);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [VotingCardComponent] });
  });

  describe('valueFontSize()', () => {
    it('returns 28px for single-character value', () => {
      createComponent('5');
      expect(component.valueFontSize()).toBe('28px');
    });

    it('returns 22px for two-character value', () => {
      createComponent('13');
      expect(component.valueFontSize()).toBe('22px');
    });

    it('returns 14px for three-or-more-character value', () => {
      createComponent('XXL');
      expect(component.valueFontSize()).toBe('14px');
    });

    it('returns 14px for four-character value', () => {
      createComponent('4xC');
      expect(component.valueFontSize()).toBe('14px');
    });

    it('returns 28px for "?" (single char)', () => {
      createComponent('?');
      expect(component.valueFontSize()).toBe('28px');
    });
  });

  describe('inputs', () => {
    it('defaults faceUp to false', () => {
      createComponent('5');
      expect(component.faceUp()).toBe(false);
    });

    it('defaults selected to false', () => {
      createComponent('5');
      expect(component.selected()).toBe(false);
    });

    it('defaults width to 72', () => {
      createComponent('5');
      expect(component.width()).toBe(72);
    });

    it('defaults height to 108', () => {
      createComponent('5');
      expect(component.height()).toBe(108);
    });
  });

  describe('cardClicked output', () => {
    it('emits the card value on click when face up', () => {
      fixture = TestBed.createComponent(VotingCardComponent);
      fixture.componentRef.setInput('value', '8');
      fixture.componentRef.setInput('faceUp', true);
      component = fixture.componentInstance;
      fixture.detectChanges();
      let emitted: string | undefined;
      component.cardClicked.subscribe((v: string) => (emitted = v));
      fixture.nativeElement.querySelector('.card-container').click();
      expect(emitted).toBe('8');
    });

    it('does not emit on click when face down', () => {
      createComponent('8');
      let emitted: string | undefined;
      component.cardClicked.subscribe((v: string) => (emitted = v));
      fixture.nativeElement.querySelector('.card-container').click();
      expect(emitted).toBeUndefined();
    });
  });
});
