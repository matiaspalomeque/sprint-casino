import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, Locale } from '../services/i18n.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  private _lastKey = '';
  private _lastParamsJson = '';
  private _lastLocale: Locale | null = null;
  private _lastResult = '';

  transform(key: string, params?: Record<string, string | number>): string {
    const locale = this.i18n.locale();
    const paramsJson = params ? JSON.stringify(params) : '';
    if (
      key === this._lastKey &&
      paramsJson === this._lastParamsJson &&
      locale === this._lastLocale
    ) {
      return this._lastResult;
    }
    this._lastKey = key;
    this._lastParamsJson = paramsJson;
    this._lastLocale = locale;
    this._lastResult = this.i18n.t(key, params);
    return this._lastResult;
  }
}
