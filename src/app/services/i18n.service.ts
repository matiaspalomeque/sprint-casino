import { Injectable, signal, computed } from '@angular/core';
import { en } from '../i18n/en';
import { esAr } from '../i18n/es-ar';
import { Translations } from '../i18n/translations';

export type Locale = 'en' | 'es-AR';

const LOCALES: Record<Locale, Translations> = { en, 'es-AR': esAr };
const STORAGE_KEY = 'sprint_casino_locale';

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly _locale = signal<Locale>(this._loadLocale());

  readonly locale = this._locale.asReadonly();

  private readonly _dict = computed(() => LOCALES[this._locale()]);

  setLocale(locale: Locale): void {
    this._locale.set(locale);
    localStorage.setItem(STORAGE_KEY, locale);
  }

  t(key: string, params?: Record<string, string | number>): string {
    const parts = key.split('.');
    let result: unknown = this._dict();
    for (const part of parts) {
      result = (result as Record<string, unknown>)?.[part];
    }
    if (typeof result !== 'string') return key;
    if (!params) return result;
    return result.replace(/\{\{(\w+)\}\}/g, (_, k) => String(params[k] ?? ''));
  }

  private _loadLocale(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'es-AR' ? 'es-AR' : 'en';
  }
}
