import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StoryListComponent } from './story-list.component';

describe('StoryListComponent', () => {
  let fixture: ComponentFixture<StoryListComponent>;
  let component: StoryListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StoryListComponent] });
    fixture = TestBed.createComponent(StoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('addStory()', () => {
    it('emits storyAdded with the trimmed name', () => {
      let emitted: string | undefined;
      component.storyAdded.subscribe((v: string) => (emitted = v));
      component.newStoryName = '  My Story  ';
      component.addStory();
      expect(emitted).toBe('My Story');
    });

    it('clears newStoryName after adding', () => {
      component.newStoryName = 'Story';
      component.addStory();
      expect(component.newStoryName).toBe('');
    });

    it('does not emit for empty name', () => {
      let emitted: string | undefined;
      component.storyAdded.subscribe((v: string) => (emitted = v));
      component.newStoryName = '';
      component.addStory();
      expect(emitted).toBeUndefined();
    });

    it('does not emit for whitespace-only name', () => {
      let emitted: string | undefined;
      component.storyAdded.subscribe((v: string) => (emitted = v));
      component.newStoryName = '   ';
      component.addStory();
      expect(emitted).toBeUndefined();
    });
  });

  describe('inputs', () => {
    it('defaults isHost to false', () => {
      expect(component.isHost()).toBe(false);
    });

    it('defaults stories to empty array', () => {
      expect(component.stories()).toEqual([]);
    });

    it('defaults activeStoryId to null', () => {
      expect(component.activeStoryId()).toBeNull();
    });
  });
});
