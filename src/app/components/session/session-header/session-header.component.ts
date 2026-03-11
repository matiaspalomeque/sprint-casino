import { Component, input, output } from '@angular/core';
import { CopyLinkComponent } from '../../shared/copy-link/copy-link.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';
import { VotingSystem } from '../../../models/session.types';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-session-header',
  standalone: true,
  imports: [CopyLinkComponent, LanguageSwitcherComponent, TranslatePipe],
  template: `
    <header class="flex items-center gap-6 px-6 py-4 bg-casino-card border-b border-casino-surface">
      <!-- Session name and controls -->
      <div class="flex-1 flex flex-col md:flex-row items-center gap-4 w-full justify-between">
        <div class="text-center md:text-left min-w-0">
          <div class="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 class="text-white font-bold text-2xl truncate">{{ sessionName() }}</h1>
            @if (isHost()) {
              <span
                class="text-gold text-xs bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full flex-shrink-0"
              >
                {{ 'header.host' | translate }}
              </span>
            }
          </div>
          <p class="text-gray-500 text-sm">
            {{ 'voting.systems.' + votingSystem() + '.label' | translate }}
          </p>
        </div>

        <div class="flex flex-wrap justify-center items-center gap-3">
          <!-- Session code + copy -->
          <app-copy-link [sessionId]="sessionId()" />

          <!-- Leave button -->
          <button
            (click)="leave.emit()"
            class="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 border border-casino-surface hover:border-red-400/30 transition-all"
          >
            {{ 'header.leave' | translate }}
          </button>

          <!-- Language switcher -->
          <app-language-switcher />
        </div>
      </div>
    </header>
  `,
})
export class SessionHeaderComponent {
  readonly sessionId = input.required<string>();
  readonly sessionName = input.required<string>();
  readonly votingSystem = input.required<VotingSystem>();
  readonly isHost = input(false);

  readonly leave = output<void>();
}
