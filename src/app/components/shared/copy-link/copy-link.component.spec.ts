import { TestBed, ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { CopyLinkComponent } from './copy-link.component';

describe('CopyLinkComponent', () => {
  let fixture: ComponentFixture<CopyLinkComponent>;
  let component: CopyLinkComponent;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [CopyLinkComponent] });
    fixture = TestBed.createComponent(CopyLinkComponent);
    fixture.componentRef.setInput('sessionId', 'ABC123');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('defaults copied to false', () => {
    expect(component.copied()).toBe(false);
  });

  describe('copy()', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls navigator.clipboard.writeText with the session URL', async () => {
      await component.copy();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('ABC123'),
      );
    });

    it('sets copied to true after clipboard write', async () => {
      await component.copy();
      expect(component.copied()).toBe(true);
    });

    it('resets copied to false after 2 seconds', async () => {
      await component.copy();
      expect(component.copied()).toBe(true);
      vi.advanceTimersByTime(2000);
      expect(component.copied()).toBe(false);
    });
  });
});
