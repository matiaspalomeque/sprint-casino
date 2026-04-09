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
      class="fixed inset-0 z-50 flex items-center justify-center bg-casino-deep/90 backdrop-blur-2xl px-4"
    >
      <div class="ambient-bg"></div>

      <div class="flex items-center gap-10 relative z-10">
        <img
          src="sprint-casino.png"
          alt="Sprint Casino"
          class="w-[420px] hidden md:block drop-shadow-2xl"
        />

        <div
          class="glass-panel border-gold/15 p-8 w-full max-w-sm shadow-2xl animate-fade-in-up"
        >
          <div class="flex justify-end mb-5">
            <app-language-switcher />
          </div>

          <div class="text-center mb-7">
            <h2 class="text-2xl font-bold text-white mb-1.5 tracking-tight">
              {{ 'namePrompt.title' | translate }}
            </h2>
            <p class="text-gray-500 text-sm">
              {{ 'namePrompt.subtitle' | translate }}
            </p>
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
              class="input-casino text-center"
            />

            @if (error) {
              <p class="text-red-400 text-sm text-center animate-fade-in">
                {{ error | translate }}
              </p>
            }

            <button
              type="submit"
              class="btn-gold w-full py-3 px-6 rounded-xl text-sm"
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
