import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-name-prompt',
  standalone: true,
  imports: [FormsModule, TranslatePipe, LanguageSwitcherComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-3xl px-4"
    >
      <div class="flex items-center gap-8">
        <img src="sprint-casino.png" alt="Sprint Casino" class="w-[512px] hidden md:block" />

        <div
          class="bg-casino-card border border-gold/40 rounded-2xl p-8 w-full max-w-sm shadow-2xl"
        >
          <div class="flex justify-end mb-4">
            <app-language-switcher />
          </div>
          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white mb-1">{{ 'namePrompt.title' | translate }}</h2>
            <p class="text-gray-400 text-sm">{{ 'namePrompt.subtitle' | translate }}</p>
          </div>

          <form (ngSubmit)="submit()" class="space-y-4">
            <input
              type="text"
              [(ngModel)]="name"
              name="name"
              [placeholder]="'namePrompt.placeholder' | translate"
              maxlength="20"
              autocomplete="off"
              autofocus
              class="w-full bg-casino-surface border border-casino-border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors"
            />

            @if (error) {
              <p class="text-red-400 text-sm">{{ error | translate }}</p>
            }

            <button
              type="submit"
              class="btn-gold w-full py-3 px-6 rounded-lg text-sm font-semibold"
            >
              {{ 'namePrompt.submit' | translate }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class NamePromptComponent {
  readonly named = output<void>();

  name = '';
  error = '';

  private readonly userService = inject(UserService);

  submit(): void {
    const trimmed = this.name.trim();
    if (trimmed.length < 2) {
      this.error = 'namePrompt.error';
      return;
    }
    this.userService.setUserName(trimmed);
    this.named.emit();
  }
}
