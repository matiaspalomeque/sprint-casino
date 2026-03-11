import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NamePromptComponent } from './name-prompt.component';
import { UserService } from '../../../services/user.service';

describe('NamePromptComponent', () => {
  let fixture: ComponentFixture<NamePromptComponent>;
  let component: NamePromptComponent;
  let userService: UserService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [NamePromptComponent] });
    userService = TestBed.inject(UserService);
    fixture = TestBed.createComponent(NamePromptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('submit()', () => {
    it('sets error when name is empty', () => {
      component.name = '';
      component.submit();
      expect(component.error).toBe('namePrompt.error');
      expect(userService.identity()).toBeNull();
    });

    it('sets error when name is a single character', () => {
      component.name = 'A';
      component.submit();
      expect(component.error).toBe('namePrompt.error');
    });

    it('sets error when name is whitespace only', () => {
      component.name = '   ';
      component.submit();
      expect(component.error).toBe('namePrompt.error');
    });

    it('calls userService.setUserName with trimmed name on valid submit', () => {
      component.name = 'Alice';
      component.submit();
      expect(userService.userName()).toBe('Alice');
    });

    it('trims whitespace from name before setting', () => {
      component.name = '  Bob  ';
      component.submit();
      expect(userService.userName()).toBe('Bob');
    });

    it('emits named event on valid submit', () => {
      let emitted = false;
      component.named.subscribe(() => (emitted = true));
      component.name = 'Carol';
      component.submit();
      expect(emitted).toBe(true);
    });

    it('does not emit named event when name is invalid', () => {
      let emitted = false;
      component.named.subscribe(() => (emitted = true));
      component.name = 'X';
      component.submit();
      expect(emitted).toBe(false);
    });
  });
});
