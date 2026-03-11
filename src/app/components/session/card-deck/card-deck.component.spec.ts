import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CardDeckComponent } from './card-deck.component';

describe('CardDeckComponent', () => {
  let fixture: ComponentFixture<CardDeckComponent>;
  let component: CardDeckComponent;

  function create(opts: { options?: string[]; selectedValue?: string | null; disabled?: boolean; noActiveStory?: boolean } = {}) {
    fixture = TestBed.createComponent(CardDeckComponent);
    if (opts.options !== undefined) fixture.componentRef.setInput('options', opts.options);
    if (opts.selectedValue !== undefined) fixture.componentRef.setInput('selectedValue', opts.selectedValue);
    if (opts.disabled !== undefined) fixture.componentRef.setInput('disabled', opts.disabled);
    if (opts.noActiveStory !== undefined) fixture.componentRef.setInput('noActiveStory', opts.noActiveStory);
    component = fixture.componentInstance;
    fixture.detectChanges();
    return component;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CardDeckComponent] });
  });

  describe('onCardClicked()', () => {
    it('emits voteSelected when not disabled', () => {
      create({ options: ['1', '3', '5'], disabled: false });
      let emitted: string | undefined;
      component.voteSelected.subscribe((v: string) => (emitted = v));
      component.onCardClicked('3');
      expect(emitted).toBe('3');
    });

    it('does not emit voteSelected when disabled', () => {
      create({ options: ['1', '3'], disabled: true });
      let emitted: string | undefined;
      component.voteSelected.subscribe((v: string) => (emitted = v));
      component.onCardClicked('3');
      expect(emitted).toBeUndefined();
    });
  });

  describe('inputs', () => {
    it('defaults disabled to false', () => {
      create();
      expect(component.disabled()).toBe(false);
    });

    it('defaults noActiveStory to false', () => {
      create();
      expect(component.noActiveStory()).toBe(false);
    });

    it('defaults selectedValue to null', () => {
      create();
      expect(component.selectedValue()).toBeNull();
    });

    it('defaults options to empty array', () => {
      create();
      expect(component.options()).toEqual([]);
    });
  });
});
