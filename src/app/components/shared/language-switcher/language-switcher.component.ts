import { Component, inject } from '@angular/core';
import { I18nService, Locale } from '../../../services/i18n.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <div
      class="flex items-center gap-0.5 glass-panel-sm p-0.5 text-[11px] font-bold tracking-wide"
    >
      <button
        (click)="setLocale('en')"
        class="px-2.5 py-1 rounded-md transition-all duration-200"
        [class.bg-gold]="i18n.locale() === 'en'"
        [class.text-casino-dark]="i18n.locale() === 'en'"
        [class.shadow-sm]="i18n.locale() === 'en'"
        [class.text-gray-500]="i18n.locale() !== 'en'"
        [class.hover:text-gray-300]="i18n.locale() !== 'en'"
      >
        EN
      </button>
      <button
        (click)="setLocale('es-AR')"
        class="px-2.5 py-1 rounded-md transition-all duration-200"
        [class.bg-gold]="i18n.locale() === 'es-AR'"
        [class.text-casino-dark]="i18n.locale() === 'es-AR'"
        [class.shadow-sm]="i18n.locale() === 'es-AR'"
        [class.text-gray-500]="i18n.locale() !== 'es-AR'"
        [class.hover:text-gray-300]="i18n.locale() !== 'es-AR'"
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
