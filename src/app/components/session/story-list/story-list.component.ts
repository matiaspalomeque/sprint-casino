import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StoryDTO } from '../../../models/session.types';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-story-list',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div
      class="flex flex-col h-full w-full min-w-0 bg-casino-card/60 backdrop-blur-md border-r border-white/[0.04]"
    >
      <!-- Logo -->
      <div class="flex justify-center py-3 border-b border-white/[0.04]">
        <img
          src="sprint-casino.png"
          alt="Sprint Casino"
          class="w-full max-w-[220px] h-auto object-contain drop-shadow-xl"
        />
      </div>

      <!-- Header -->
      <div class="p-4 border-b border-white/[0.04]">
        <h3
          class="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em]"
        >
          {{ 'stories.header' | translate }}
        </h3>
      </div>

      <!-- Add story (host only) -->
      @if (isHost()) {
        <div class="p-3 border-b border-white/[0.04]">
          <form (ngSubmit)="addStory()" class="flex gap-2">
            <input
              type="text"
              [ngModel]="newStoryName()"
              (ngModelChange)="newStoryName.set($event)"
              name="storyName"
              [placeholder]="'stories.addPlaceholder' | translate"
              maxlength="100"
              class="flex-1 min-w-0 input-casino text-sm !py-2 !px-3"
            />
            <button
              type="submit"
              class="bg-gold/90 hover:bg-gold text-casino-dark font-bold px-3 py-2 rounded-lg text-sm transition-colors flex-shrink-0"
            >
              +
            </button>
          </form>
        </div>
      }

      <!-- Story list -->
      <div class="flex-1 overflow-y-auto">
        @if (stories().length === 0) {
          <div class="p-4 text-center text-gray-700 text-xs">
            @if (isHost()) {
              <p>{{ 'stories.addFirstStory' | translate }}</p>
            } @else {
              <p>{{ 'stories.waitingForStories' | translate }}</p>
            }
          </div>
        }

        @for (story of stories(); track story.storyId) {
          <div
            class="flex items-center gap-2.5 px-3 py-3 cursor-pointer border-b border-white/[0.03] transition-all duration-150 hover:bg-white/[0.03]"
            [class.bg-white/[0.05]]="activeStoryId() === story.storyId"
            [class.border-l-2]="activeStoryId() === story.storyId"
            [class.border-l-gold]="activeStoryId() === story.storyId"
            (click)="isHost() && storySelected.emit(story.storyId)"
          >
            <!-- Status indicator -->
            <div class="flex-shrink-0">
              @if (story.status === 'revealed') {
                <span class="text-green-400 text-xs" aria-hidden="true">✓</span>
              } @else if (story.status === 'voting') {
                <span
                  class="w-2 h-2 rounded-full bg-gold block"
                  style="animation: pulse-gold 2s ease-in-out infinite"
                ></span>
              } @else {
                <span class="w-1.5 h-1.5 rounded-full bg-gray-700 block"></span>
              }
            </div>

            <!-- Story name -->
            <span
              class="flex-1 text-sm truncate"
              [class.text-white]="activeStoryId() === story.storyId"
              [class.font-medium]="activeStoryId() === story.storyId"
              [class.text-gray-500]="activeStoryId() !== story.storyId"
              >{{ story.name }}</span
            >

            <!-- Vote count -->
            @if (story.status === 'voting' || story.status === 'revealed') {
              <span class="text-[10px] text-gray-600 flex-shrink-0 font-medium"
                >{{ story.votedUserIds.length }}v</span
              >
            }

            <!-- Delete button (host only) -->
            @if (isHost()) {
              <button
                (click)="$event.stopPropagation(); storyDeleted.emit(story.storyId)"
                class="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 text-xs px-1"
                aria-label="Delete story"
              >
                <span aria-hidden="true">✕</span>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class StoryListComponent {
  readonly stories = input<StoryDTO[]>([]);
  readonly activeStoryId = input<string | null>(null);
  readonly isHost = input(false);

  readonly storySelected = output<string>();
  readonly storyDeleted = output<string>();
  readonly storyAdded = output<string>();

  readonly newStoryName = signal('');

  addStory(): void {
    const name = this.newStoryName().trim();
    if (!name) return;
    this.storyAdded.emit(name);
    this.newStoryName.set('');
  }
}
