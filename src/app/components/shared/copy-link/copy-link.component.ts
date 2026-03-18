import { Component, input, signal } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-copy-link',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <button
      (click)="copy()"
      class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-casino-surface border border-casino-border hover:border-gold/50 text-sm text-gray-300 hover:text-white transition-all"
      [attr.aria-label]="'copyLink.sessionCode' | translate: { code: sessionId() }"
      [title]="'copyLink.sessionCode' | translate: { code: sessionId() }"
    >
      <span class="font-mono font-bold tracking-widest text-gold">{{ sessionId() }}</span>
      @if (copied()) {
        <span class="text-green-400 text-xs">{{ 'copyLink.copied' | translate }}</span>
      } @else {
        <svg
          class="w-4 h-4"
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
