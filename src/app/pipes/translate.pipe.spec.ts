import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../services/i18n.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let i18n: I18nService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    i18n = TestBed.inject(I18nService);
    pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
  });

  it('delegates to I18nService.t() without params', () => {
    const result = pipe.transform('landing.tagline');
    expect(result).toBe(i18n.t('landing.tagline'));
  });

  it('delegates to I18nService.t() with params', () => {
    const params = { current: 2, total: 5 };
    const result = pipe.transform('voting.board.voted', params);
    expect(result).toBe(i18n.t('voting.board.voted', params));
  });

  it('returns the key for unknown translation keys', () => {
    expect(pipe.transform('unknown.key')).toBe('unknown.key');
  });
});
