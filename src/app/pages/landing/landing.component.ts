import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { NamePromptComponent } from '../../components/shared/name-prompt/name-prompt.component';
import { VotingSystem, RevealPolicy } from '../../models/session.types';
import { getVotingOptions } from '../../services/voting.utils';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../../components/shared/language-switcher/language-switcher.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule, NamePromptComponent, TranslatePipe, LanguageSwitcherComponent],
  template: `
    @if (!userService.hasIdentity()) {
      <app-name-prompt (named)="onNamed()" />
    }

    <div class="ambient-bg"></div>

    <div class="min-h-screen flex flex-col relative z-10">
      <!-- Top bar -->
      <div class="flex justify-end px-6 pt-4">
        <app-language-switcher />
      </div>

      <!-- Hero -->
      <div
        class="flex flex-col md:flex-row items-center justify-center gap-8 pt-4 pb-6 px-6 max-w-5xl mx-auto animate-fade-in-up"
      >
        <img
          src="sprint-casino.png"
          alt="Sprint Casino"
          class="w-full max-w-[280px] h-auto object-contain drop-shadow-2xl"
        />
        <div class="text-center md:text-left">
          <h1 class="text-5xl md:text-6xl font-extrabold text-white mb-3 tracking-tight">
            Sprint <span class="text-gold">Casino</span>
          </h1>
          <p class="text-gray-500 text-lg max-w-sm mx-auto md:mx-0 leading-relaxed">
            {{ 'landing.tagline' | translate }}
          </p>
        </div>
      </div>

      <!-- Cards -->
      <div class="flex-1 flex items-start justify-center px-4 md:px-6 pb-16">
        <div class="w-full max-w-4xl grid md:grid-cols-2 gap-5">
          <!-- Create session card -->
          <div
            class="glass-panel p-6 animate-fade-in-up"
            style="animation-delay: 0.05s"
          >
            <h2
              class="text-white font-bold text-lg mb-5 flex items-center gap-2.5"
            >
              <span class="chip-dot"></span>
              {{ 'landing.newSession' | translate }}
            </h2>

            <form (ngSubmit)="createSession()" class="space-y-4">
              <!-- Session name -->
              <div>
                <label
                  class="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-widest"
                  >{{ 'landing.sessionName' | translate }}</label
                >
                <input
                  type="text"
                  [ngModel]="sessionName()"
                  (ngModelChange)="sessionName.set($event)"
                  name="sessionName"
                  [placeholder]="'landing.sessionNamePlaceholder' | translate"
                  maxlength="50"
                  required
                  class="input-casino"
                />
              </div>

              <!-- Voting system -->
              <div>
                <label
                  class="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-widest"
                  >{{ 'landing.votingSystem' | translate }}</label
                >
                <div class="grid grid-cols-2 gap-2">
                  @for (system of votingSystems; track system) {
                    <button
                      type="button"
                      (click)="votingSystem.set(system)"
                      class="p-2.5 rounded-xl border text-sm transition-all text-left group"
                      [class.border-gold/40]="votingSystem() === system"
                      [class.bg-gold/8]="votingSystem() === system"
                      [class.text-gold]="votingSystem() === system"
                      [class.border-casino-border]="votingSystem() !== system"
                      [class.text-gray-400]="votingSystem() !== system"
                      [class.hover:border-gold/25]="votingSystem() !== system"
                      [class.hover:text-gray-300]="votingSystem() !== system"
                    >
                      <div class="font-medium text-[13px]">
                        {{ 'voting.systems.' + system + '.label' | translate }}
                      </div>
                      <div class="text-xs opacity-50 truncate mt-0.5">
                        {{ 'voting.systems.' + system + '.preview' | translate }}
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- Custom values -->
              @if (votingSystem() === 'custom') {
                <div class="animate-fade-in">
                  <label
                    class="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-widest"
                    >{{ 'landing.customValues' | translate }}</label
                  >
                  <input
                    type="text"
                    [ngModel]="customOptions()"
                    (ngModelChange)="customOptions.set($event)"
                    name="customOptions"
                    [placeholder]="'landing.customValuesPlaceholder' | translate"
                    class="input-casino"
                  />
                  <p class="text-gray-600 text-xs mt-1.5">
                    {{ 'landing.customValuesHint' | translate }}
                  </p>
                </div>
              }

              <!-- Reveal policy -->
              <div>
                <label
                  class="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-widest"
                  >{{ 'landing.revealPolicy' | translate }}</label
                >
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="revealPolicy.set('host_only')"
                    class="flex-1 py-2.5 px-3 rounded-xl border text-sm transition-all font-medium"
                    [class.border-gold/40]="revealPolicy() === 'host_only'"
                    [class.bg-gold/8]="revealPolicy() === 'host_only'"
                    [class.text-gold]="revealPolicy() === 'host_only'"
                    [class.border-casino-border]="revealPolicy() !== 'host_only'"
                    [class.text-gray-400]="revealPolicy() !== 'host_only'"
                    [class.hover:border-gold/25]="revealPolicy() !== 'host_only'"
                  >
                    {{ 'landing.hostOnly' | translate }}
                  </button>
                  <button
                    type="button"
                    (click)="revealPolicy.set('anyone')"
                    class="flex-1 py-2.5 px-3 rounded-xl border text-sm transition-all font-medium"
                    [class.border-gold/40]="revealPolicy() === 'anyone'"
                    [class.bg-gold/8]="revealPolicy() === 'anyone'"
                    [class.text-gold]="revealPolicy() === 'anyone'"
                    [class.border-casino-border]="revealPolicy() !== 'anyone'"
                    [class.text-gray-400]="revealPolicy() !== 'anyone'"
                    [class.hover:border-gold/25]="revealPolicy() !== 'anyone'"
                  >
                    {{ 'landing.anyone' | translate }}
                  </button>
                </div>
              </div>

              @if (createError()) {
                <p class="text-red-400 text-sm animate-fade-in">{{ createError()! | translate }}</p>
              }

              <button
                type="submit"
                [disabled]="creating()"
                class="btn-gold w-full py-3 rounded-xl text-sm"
              >
                {{ (creating() ? 'landing.creating' : 'landing.dealTheCards') | translate }}
              </button>
            </form>
          </div>

          <!-- Join session card -->
          <div
            class="glass-panel p-6 animate-fade-in-up"
            style="animation-delay: 0.12s"
          >
            <h2
              class="text-white font-bold text-lg mb-5 flex items-center gap-2.5"
            >
              <span class="chip-dot"></span>
              {{ 'landing.joinSession' | translate }}
            </h2>

            <form (ngSubmit)="joinSession()" class="space-y-4">
              <div>
                <label
                  class="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-widest"
                  >{{ 'landing.sessionCode' | translate }}</label
                >
                <input
                  type="text"
                  [ngModel]="joinCode()"
                  (ngModelChange)="joinCode.set($event.toUpperCase())"
                  name="joinCode"
                  placeholder="ABC123"
                  maxlength="6"
                  autocomplete="off"
                  class="input-casino font-mono tracking-[0.3em] text-center text-lg"
                />
              </div>

              @if (joinError()) {
                <p class="text-red-400 text-sm animate-fade-in">{{ joinError()! | translate }}</p>
              }

              <button
                type="submit"
                [disabled]="joinCode().length < 6"
                class="btn-gold w-full py-3 rounded-xl text-sm"
              >
                {{ 'landing.joinTable' | translate }}
              </button>
            </form>

            <!-- How it works -->
            <div class="mt-8 space-y-3">
              <h3
                class="text-[11px] font-semibold text-gray-600 uppercase tracking-widest"
              >
                {{ 'landing.howItWorks' | translate }}
              </h3>
              @for (step of howItWorks; track step) {
                <div class="flex items-start gap-3">
                  <span
                    class="text-gold/70 font-bold text-xs w-5 h-5 flex items-center justify-center rounded-full border border-gold/20 flex-shrink-0 mt-0.5"
                    >{{ step }}</span
                  >
                  <p class="text-gray-500 text-sm leading-relaxed">
                    {{ 'landing.step' + step | translate }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LandingComponent {
  readonly userService = inject(UserService);
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);

  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly joinError = signal<string | null>(null);

  readonly joinCode = signal('');

  readonly sessionName = signal('');
  readonly votingSystem = signal<VotingSystem>('fibonacci');
  readonly customOptions = signal('');
  readonly revealPolicy = signal<RevealPolicy>('host_only');

  readonly votingSystems: VotingSystem[] = ['fibonacci', 'tshirt', 'high_level', 'custom'];

  readonly howItWorks = ['1', '2', '3'];

  onNamed(): void {
    // Name was just set, nothing else needed
  }

  async createSession(): Promise<void> {
    if (!this.userService.hasIdentity()) return;

    const name = this.sessionName().trim();
    if (!name) {
      this.createError.set('landing.errors.sessionNameRequired');
      return;
    }

    if (this.votingSystem() === 'custom') {
      const opts = getVotingOptions('custom', this.customOptions());
      if (opts.length < 3) {
        this.createError.set('landing.errors.customVoting');
        return;
      }
    }

    this.creating.set(true);
    this.createError.set(null);

    const config = {
      sessionName: name,
      votingSystem: this.votingSystem(),
      revealPolicy: this.revealPolicy(),
      customOptions: this.customOptions(),
    };

    try {
      const sessionId = await this.session.createSession(config);
      this.creating.set(false);
      this.router.navigate(['/session', sessionId]);
    } catch {
      this.createError.set('landing.errors.createFailed');
      this.creating.set(false);
    }
  }

  joinSession(): void {
    const code = this.joinCode().trim().toUpperCase();
    if (code.length !== 6) {
      this.joinError.set('landing.errors.invalidCode');
      return;
    }
    this.router.navigate(['/session', code]);
  }
}
