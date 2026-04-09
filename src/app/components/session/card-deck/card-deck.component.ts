import { Component, input, output } from '@angular/core';
import { VotingCardComponent } from '../voting-card/voting-card.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-card-deck',
  standalone: true,
  imports: [VotingCardComponent, TranslatePipe],
  template: `
    <div class="flex flex-col items-center gap-3 animate-fade-in-up">
      @if (!disabled()) {
        <p class="text-gray-500 text-xs font-medium tracking-wide">
          {{ 'deck.pickYourCard' | translate }}
        </p>
      } @else {
        <p class="text-gray-700 text-xs">
          {{ (noActiveStory() ? 'deck.selectStoryToVote' : 'deck.votingClosed') | translate }}
        </p>
      }

      <div class="flex gap-2 pb-2 pt-3 px-2 max-w-full justify-center flex-wrap">
        @for (option of options(); track option) {
          <div
            class="transition-all duration-200 ease-out"
            [class.opacity-30]="disabled()"
            [class.-translate-y-3]="selectedValue() === option && !disabled()"
            [class.scale-105]="selectedValue() === option && !disabled()"
          >
            <app-voting-card
              [value]="option"
              [faceUp]="true"
              [selected]="selectedValue() === option"
              [width]="52"
              [height]="78"
              (cardClicked)="onCardClicked($event)"
            />
          </div>
        }
      </div>
    </div>
  `,
})
export class CardDeckComponent {
  readonly options = input<string[]>([]);
  readonly selectedValue = input<string | null>(null);
  readonly disabled = input(false);
  readonly noActiveStory = input(false);

  readonly voteSelected = output<string>();

  onCardClicked(value: string): void {
    if (this.disabled()) return;
    this.voteSelected.emit(value);
  }
}
