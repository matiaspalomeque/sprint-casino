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
    <header
      class="flex items-center gap-6 px-6 py-3.5 bg-casino-card/80 backdrop-blur-xl border-b border-white/[0.04]"
    >
      <div class="flex-1 flex flex-col md:flex-row items-center gap-4 w-full justify-between">
        <div class="text-center md:text-left min-w-0">
          <div class="flex items-center justify-center md:justify-start gap-2.5 mb-0.5">
            <h1 class="text-white font-bold text-xl truncate tracking-tight">
              {{ sessionName() }}
            </h1>
            @if (isHost()) {
              <span
                class="text-gold text-[10px] font-bold bg-gold/8 border border-gold/20 px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider"
              >
                {{ 'header.host' | translate }}
              </span>
            }
          </div>
          <p class="text-gray-600 text-xs">
            {{ 'voting.systems.' + votingSystem() + '.label' | translate }}
          </p>
        </div>

        <div class="flex flex-wrap justify-center items-center gap-2.5">
          <app-copy-link [sessionId]="sessionId()" />

          <button
            (click)="leave.emit()"
            class="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-400 border border-white/[0.06] hover:border-red-400/25 transition-all duration-200"
          >
            {{ 'header.leave' | translate }}
          </button>

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
