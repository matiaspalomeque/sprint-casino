import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-copy-link',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      (click)="copy()"
      class="flex items-center gap-2 px-3 py-2 rounded-xl glass-panel-sm hover:border-gold/25 text-sm transition-all duration-200 group"
      [attr.aria-label]="'copyLink.sessionCode' | translate: { code: sessionId() }"
      [title]="'copyLink.sessionCode' | translate: { code: sessionId() }"
    >
      <span class="font-mono font-bold tracking-[0.2em] text-gold text-xs">{{
        sessionId()
      }}</span>
      @if (copied()) {
        <span class="text-green-400 text-[10px] font-medium animate-fade-in">{{
          'copyLink.copied' | translate
        }}</span>
      } @else {
        <svg
          class="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      }
    </button>
  `,
})
export class CopyLinkComponent {
  readonly sessionId = input.required<string>();
  readonly copied = signal(false);

  copy(): void {
    const url = `${window.location.origin}${window.location.pathname}#/session/${this.sessionId()}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      })
      .catch(() => {
        // Clipboard API unavailable (HTTP context, iframe restriction, etc.)
      });
  }
}
