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

    <div class="min-h-screen flex flex-col">
      <!-- Top bar -->
      <div class="flex justify-end px-4 pt-3">
        <app-language-switcher />
      </div>
      <!-- Hero -->
      <div
        class="flex flex-col md:flex-row items-center justify-center gap-6 pt-6 pb-6 px-4 max-w-6xl mx-auto"
      >
        <img
          src="sprint-casino.png"
          alt="Sprint Casino"
          class="w-full max-w-[340px] h-auto object-contain drop-shadow-2xl"
        />
        <div class="text-center md:text-left">
          <h1 class="text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-md">
            Sprint <span class="text-gold">Casino</span>
          </h1>
          <p class="text-gray-400 text-xl max-w-md mx-auto md:mx-0">
            {{ 'landing.tagline' | translate }}
          </p>
        </div>
      </div>

      <!-- Cards -->
      <div class="flex-1 flex items-start justify-center px-4 pb-12">
        <div class="w-full max-w-4xl grid md:grid-cols-2 gap-6">
          <!-- Create session card -->
          <div class="bg-casino-card border border-casino-surface rounded-2xl p-6">
            <h2 class="text-white font-bold text-xl mb-5 flex items-center gap-2">
              <span>✦</span> {{ 'landing.newSession' | translate }}
            </h2>

            <form (ngSubmit)="createSession()" class="space-y-4">
              <!-- Session name -->
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
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
                  class="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors text-sm"
                />
              </div>

              <!-- Voting system -->
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
                  >{{ 'landing.votingSystem' | translate }}</label
                >
                <div class="grid grid-cols-2 gap-2">
                  @for (system of votingSystems; track system) {
                    <button
                      type="button"
                      (click)="votingSystem.set(system)"
                      class="p-2.5 rounded-lg border text-sm transition-all text-left"
                      [class.border-gold]="votingSystem() === system"
                      [class.bg-gold/10]="votingSystem() === system"
                      [class.text-gold]="votingSystem() === system"
                      [class.border-casino-border]="votingSystem() !== system"
                      [class.text-gray-400]="votingSystem() !== system"
                      [class.hover:border-gold/40]="votingSystem() !== system"
                    >
                      <div class="font-medium">
                        {{ 'voting.systems.' + system + '.label' | translate }}
                      </div>
                      <div class="text-xs opacity-60 truncate">
                        {{ 'voting.systems.' + system + '.preview' | translate }}
                      </div>
                    </button>
                  }
                </div>
              </div>

              <!-- Custom values -->
              @if (votingSystem() === 'custom') {
                <div>
                  <label
                    class="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
                    >{{ 'landing.customValues' | translate }}</label
                  >
                  <input
                    type="text"
                    [ngModel]="customOptions()"
                    (ngModelChange)="customOptions.set($event)"
                    name="customOptions"
                    [placeholder]="'landing.customValuesPlaceholder' | translate"
                    class="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 transition-colors text-sm"
                  />
                  <p class="text-gray-600 text-xs mt-1">
                    {{ 'landing.customValuesHint' | translate }}
                  </p>
                </div>
              }

              <!-- Reveal policy -->
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
                  >{{ 'landing.revealPolicy' | translate }}</label
                >
                <div class="flex gap-2">
                  <button
                    type="button"
                    (click)="revealPolicy.set('host_only')"
                    class="flex-1 py-2 px-3 rounded-lg border text-sm transition-all"
                    [class.border-gold]="revealPolicy() === 'host_only'"
                    [class.bg-gold/10]="revealPolicy() === 'host_only'"
                    [class.text-gold]="revealPolicy() === 'host_only'"
                    [class.border-casino-border]="revealPolicy() !== 'host_only'"
                    [class.text-gray-400]="revealPolicy() !== 'host_only'"
                  >
                    {{ 'landing.hostOnly' | translate }}
                  </button>
                  <button
                    type="button"
                    (click)="revealPolicy.set('anyone')"
                    class="flex-1 py-2 px-3 rounded-lg border text-sm transition-all"
                    [class.border-gold]="revealPolicy() === 'anyone'"
                    [class.bg-gold/10]="revealPolicy() === 'anyone'"
                    [class.text-gold]="revealPolicy() === 'anyone'"
                    [class.border-casino-border]="revealPolicy() !== 'anyone'"
                    [class.text-gray-400]="revealPolicy() !== 'anyone'"
                  >
                    {{ 'landing.anyone' | translate }}
                  </button>
                </div>
              </div>

              @if (createError()) {
                <p class="text-red-400 text-sm">{{ createError()! | translate }}</p>
              }

              <button
                type="submit"
                [disabled]="creating()"
                class="btn-gold w-full py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ (creating() ? 'landing.creating' : 'landing.dealTheCards') | translate }}
              </button>
            </form>
          </div>

          <!-- Join session card -->
          <div class="bg-casino-card border border-casino-surface rounded-2xl p-6">
            <h2 class="text-white font-bold text-xl mb-5 flex items-center gap-2">
              <span>→</span> {{ 'landing.joinSession' | translate }}
            </h2>

            <form (ngSubmit)="joinSession()" class="space-y-4">
              <div>
                <label
                  class="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider"
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
                  class="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30 transition-colors text-sm font-mono tracking-widest text-center text-lg"
                />
              </div>

              @if (joinError()) {
                <p class="text-red-400 text-sm">{{ joinError()! | translate }}</p>
              }

              <button
                type="submit"
                [disabled]="joinCode().length < 6"
                class="btn-gold w-full py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ 'landing.joinTable' | translate }}
              </button>
            </form>

            <!-- How it works -->
            <div class="mt-8 space-y-3">
              <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {{ 'landing.howItWorks' | translate }}
              </h3>
              @for (step of howItWorks; track step) {
                <div class="flex items-start gap-3">
                  <span class="text-gold font-bold text-sm flex-shrink-0">{{ step }}.</span>
                  <p class="text-gray-500 text-sm">{{ 'landing.step' + step | translate }}</p>
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
