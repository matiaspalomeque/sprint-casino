import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-voting-card',
  standalone: true,
  template: `
    <div
      class="card-container cursor-pointer select-none transition-transform duration-200 hover:scale-[1.04]"
      [style.width.px]="width()"
      [style.height.px]="height()"
      (click)="onClick()"
    >
      <div class="card-inner" [class.flipped]="faceUp()">
        <!-- Back face -->
        <div class="card-face card-back flex items-center justify-center">
          <div class="w-7 h-7 opacity-30">
            <svg viewBox="0 0 24 24" fill="currentColor" class="text-gold">
              <path
                d="M12 2L9.5 8.5L2 9.27L7 14L5.5 21L12 17.5L18.5 21L17 14L22 9.27L14.5 8.5L12 2Z"
              />
            </svg>
          </div>
        </div>

        <!-- Front face -->
        <div
          class="card-face card-front flex items-center justify-center transition-shadow duration-200"
          [class.ring-2]="selected()"
          [class.ring-gold]="selected()"
          [class.shadow-[0_0_24px_rgba(212,175,55,0.4)]]="selected()"
        >
          <span
            class="font-bold text-card-ink leading-none"
            [style.font-size]="valueFontSize()"
            >{{ value() }}</span
          >
        </div>
      </div>
    </div>
  `,
})
export class VotingCardComponent {
  readonly value = input.required<string>();
  readonly faceUp = input(false);
  readonly selected = input(false);
  readonly width = input(72);
  readonly height = input(108);

  readonly cardClicked = output<string>();

  onClick(): void {
    if (this.faceUp()) {
      this.cardClicked.emit(this.value());
    }
  }

  valueFontSize(): string {
    const v = this.value();
    if (v.length >= 3) return '14px';
    if (v.length === 2) return '22px';
    return '28px';
  }
}
