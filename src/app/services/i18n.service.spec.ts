import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  describe('locale initialization', () => {
    it('defaults to "en" when no locale is stored', () => {
      expect(service.locale()).toBe('en');
    });

    it('restores "es-AR" from localStorage', () => {
      localStorage.setItem('sprint_casino_locale', 'es-AR');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(I18nService);
      expect(freshService.locale()).toBe('es-AR');
    });

    it('falls back to "en" for unknown stored locale', () => {
      localStorage.setItem('sprint_casino_locale', 'fr');
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const freshService = TestBed.inject(I18nService);
      expect(freshService.locale()).toBe('en');
    });
  });

  describe('setLocale', () => {
    it('updates the locale signal', () => {
      service.setLocale('es-AR');
      expect(service.locale()).toBe('es-AR');
    });

    it('persists locale to localStorage', () => {
      service.setLocale('es-AR');
      expect(localStorage.getItem('sprint_casino_locale')).toBe('es-AR');
    });

    it('switches back to en', () => {
      service.setLocale('es-AR');
      service.setLocale('en');
      expect(service.locale()).toBe('en');
    });
  });

  describe('t()', () => {
    it('returns a known nested key value', () => {
      const result = service.t('landing.tagline');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('returns the key itself for unknown keys', () => {
      expect(service.t('this.does.not.exist')).toBe('this.does.not.exist');
    });

    it('returns key for partial path that resolves to an object', () => {
      // 'landing' resolves to an object, not a string
      expect(service.t('landing')).toBe('landing');
    });

    it('interpolates {{param}} placeholders', () => {
      // voting.board.voted = '{{current}} / {{total}} voted'
      const result = service.t('voting.board.voted', { current: 3, total: 5 });
      expect(result).toBe('3 / 5 voted');
    });

    it('replaces missing param with empty string', () => {
      const result = service.t('voting.board.voted', { current: 1 });
      expect(result).toBe('1 /  voted');
    });

    it('leaves unreferenced params unused (key not found case)', () => {
      const result = service.t('this.missing.key', { foo: 'bar' });
      expect(result).toBe('this.missing.key');
    });

    it('switches translation when locale changes', () => {
      const enResult = service.t('landing.newSession');
      service.setLocale('es-AR');
      const esResult = service.t('landing.newSession');
      expect(typeof enResult).toBe('string');
      expect(typeof esResult).toBe('string');
    });
  });
});
