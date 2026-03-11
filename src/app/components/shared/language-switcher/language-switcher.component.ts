import { Component, inject } from '@angular/core';
import { I18nService, Locale } from '../../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div
      class="flex items-center gap-0.5 bg-casino-card border border-casino-surface rounded-lg p-1 text-xs font-semibold"
    >
      <button
        (click)="setLocale('en')"
        class="px-2 py-1 rounded transition-colors"
        [class.bg-gold]="i18n.locale() === 'en'"
        [class.text-black]="i18n.locale() === 'en'"
        [class.text-gray-400]="i18n.locale() !== 'en'"
        [class.hover:text-white]="i18n.locale() !== 'en'"
      >
        EN
      </button>
      <button
        (click)="setLocale('es-AR')"
        class="px-2 py-1 rounded transition-colors"
        [class.bg-gold]="i18n.locale() === 'es-AR'"
        [class.text-black]="i18n.locale() === 'es-AR'"
        [class.text-gray-400]="i18n.locale() !== 'es-AR'"
        [class.hover:text-white]="i18n.locale() !== 'es-AR'"
      >
        ES
      </button>
    </div>
  `,
})
export class LanguageSwitcherComponent {
  readonly i18n = inject(I18nService);

  setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
  }
}
