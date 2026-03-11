import { TestBed } from '@angular/core/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserService);
  });

  describe('initial state', () => {
    it('has no identity when localStorage is empty', () => {
      expect(service.identity()).toBeNull();
      expect(service.hasIdentity()).toBe(false);
      expect(service.userName()).toBeNull();
      expect(service.userId()).toBeNull();
    });

    it('restores identity from localStorage', () => {
      const stored = { userId: 'abc-123', userName: 'Alice' };
      localStorage.setItem('sprint_casino_user', JSON.stringify(stored));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(UserService);
      expect(freshService.hasIdentity()).toBe(true);
      expect(freshService.userName()).toBe('Alice');
      expect(freshService.userId()).toBe('abc-123');
    });

    it('returns null for invalid JSON in localStorage', () => {
      localStorage.setItem('sprint_casino_user', 'not-json');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(UserService);
      expect(freshService.identity()).toBeNull();
    });

    it('returns null for stored object missing required fields', () => {
      localStorage.setItem('sprint_casino_user', JSON.stringify({ userId: 'x' }));
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(UserService);
      expect(freshService.identity()).toBeNull();
    });
  });

  describe('setUserName()', () => {
    it('sets user name and generates a new userId', () => {
      service.setUserName('Bob');
      expect(service.userName()).toBe('Bob');
      expect(service.userId()).toBeTruthy();
      expect(service.hasIdentity()).toBe(true);
    });

    it('trims whitespace from name', () => {
      service.setUserName('  Carol  ');
      expect(service.userName()).toBe('Carol');
    });

    it('ignores whitespace-only names', () => {
      service.setUserName('   ');
      expect(service.identity()).toBeNull();
    });

    it('ignores empty string', () => {
      service.setUserName('');
      expect(service.identity()).toBeNull();
    });

    it('preserves existing userId on name update', () => {
      service.setUserName('Dave');
      const originalId = service.userId();
      service.setUserName('David');
      expect(service.userId()).toBe(originalId);
      expect(service.userName()).toBe('David');
    });

    it('persists identity to localStorage', () => {
      service.setUserName('Eve');
      const raw = localStorage.getItem('sprint_casino_user');
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.userName).toBe('Eve');
      expect(parsed.userId).toBeTruthy();
    });
  });
});
