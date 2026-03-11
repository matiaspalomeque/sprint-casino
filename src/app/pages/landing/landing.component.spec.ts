import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { LandingComponent } from './landing.component';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { PeerService } from '../../services/peer.service';
import { Subject } from 'rxjs';

class MockPeerService {
  onConnection$ = new Subject<unknown>();
  onData$ = new Subject<unknown>();
  onDisconnect$ = new Subject<string>();
  onError$ = new Subject<{ type: string; message: string }>();
  createHost = vi.fn().mockResolvedValue(undefined);
  connectToHost = vi.fn().mockResolvedValue(undefined);
  send = vi.fn();
  broadcast = vi.fn();
  sendToHost = vi.fn();
  destroy = vi.fn();
  mapConnectionToUser = vi.fn();
  getUserIdForConnection = vi.fn();
  getConnectionForUser = vi.fn();
  ngOnDestroy = vi.fn();
}

class MockRouter {
  navigate = vi.fn();
}

describe('LandingComponent', () => {
  let fixture: ComponentFixture<LandingComponent>;
  let component: LandingComponent;
  let userService: UserService;
  let router: MockRouter;

  beforeEach(async () => {
    localStorage.clear();
    router = new MockRouter();

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: PeerService, useClass: MockPeerService },
      ],
    }).compileComponents();

    userService = TestBed.inject(UserService);
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('onNamed()', () => {
    it('does not throw', () => {
      expect(() => component.onNamed()).not.toThrow();
    });
  });

  describe('joinSession()', () => {
    beforeEach(() => userService.setUserName('Alice'));

    it('sets joinError for code shorter than 6 chars', () => {
      component.joinCode = 'ABC';
      component.joinSession();
      expect(component.joinError()).toBe('landing.errors.invalidCode');
    });

    it('sets joinError for code longer than 6 chars', () => {
      component.joinCode = 'ABCDEFG';
      component.joinSession();
      expect(component.joinError()).toBe('landing.errors.invalidCode');
    });

    it('navigates to session for valid 6-char code', () => {
      component.joinCode = 'abc123';
      component.joinSession();
      expect(router.navigate).toHaveBeenCalledWith(['/session', 'ABC123']);
    });

    it('trims and uppercases the join code', () => {
      component.joinCode = '  abcdef  ';
      component.joinSession();
      expect(router.navigate).toHaveBeenCalledWith(['/session', 'ABCDEF']);
    });
  });

  describe('createSession()', () => {
    beforeEach(() => userService.setUserName('Alice'));

    it('does nothing when user has no identity', async () => {
      localStorage.clear();
      TestBed.resetTestingModule();
      // Fresh setup without identity
      await TestBed.configureTestingModule({
        imports: [LandingComponent],
        providers: [
          { provide: Router, useValue: router },
          { provide: PeerService, useClass: MockPeerService },
        ],
      }).compileComponents();
      const freshFixture = TestBed.createComponent(LandingComponent);
      const freshComp = freshFixture.componentInstance;
      freshComp.createForm.sessionName = 'Test';
      await freshComp.createSession();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('sets createError when session name is empty', async () => {
      component.createForm.sessionName = '   ';
      await component.createSession();
      expect(component.createError()).toBe('landing.errors.sessionNameRequired');
    });

    it('sets createError for custom voting with fewer than 2 values', async () => {
      component.createForm.sessionName = 'Sprint 1';
      component.createForm.votingSystem = 'custom';
      component.createForm.customOptions = 'A';
      await component.createSession();
      expect(component.createError()).toBe('landing.errors.customVoting');
    });

    it('navigates to session on successful creation', async () => {
      component.createForm.sessionName = 'Sprint 1';
      component.createForm.votingSystem = 'fibonacci';
      await component.createSession();
      expect(router.navigate).toHaveBeenCalledWith(['/session', expect.any(String)]);
      expect(component.creating()).toBe(false);
    });

    it('sets createError when session creation throws', async () => {
      const sessionService = TestBed.inject(SessionService);
      vi.spyOn(sessionService, 'createSession').mockRejectedValueOnce(new Error('fail'));
      component.createForm.sessionName = 'Sprint 1';
      await component.createSession();
      expect(component.createError()).toBe('landing.errors.createFailed');
      expect(component.creating()).toBe(false);
    });
  });
});
