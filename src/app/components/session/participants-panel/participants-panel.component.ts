import { Component, input } from '@angular/core';
import { Participant, StoryDTO } from '../../../models/session.types';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-participants-panel',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="h-full bg-casino-card border-l border-casino-surface p-4">
      <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
        {{ 'participants.players' | translate: { count: participants().length } }}
      </h3>

      <div class="space-y-2">
        @for (participant of participants(); track participant.userId) {
          <div
            class="flex items-center gap-3 p-2 rounded-lg"
            [class.bg-casino-surface/50]="participant.userId === currentUserId()"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              [style.background]="getAvatarColor(participant.userName)"
            >
              {{ (participant.userName.charAt(0) || '?').toUpperCase() }}
            </div>

            <!-- Name + badges -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span
                  class="text-sm font-medium truncate"
                  [class.text-white]="participant.userId === currentUserId()"
                  [class.text-gray-300]="participant.userId !== currentUserId()"
                  >{{ participant.userName }}</span
                >
                @if (participant.userId === currentUserId()) {
                  <span class="text-[10px] text-gray-500">{{
                    'participants.you' | translate
                  }}</span>
                }
                @if (participant.isHost) {
                  <span class="text-gold text-xs" aria-hidden="true" title="Host">♛</span>
                  <span class="sr-only">{{ 'participants.host' | translate }}</span>
                }
              </div>
            </div>

            <!-- Vote status -->
            @if (activeStory()) {
              @if (activeStory()!.status === 'revealed') {
                @let vote = getVote(participant.userId);
                @if (vote) {
                  <span
                    class="text-xs font-bold bg-casino-surface border border-gold/40 rounded px-2 py-0.5 text-gold"
                  >
                    {{ vote }}
                  </span>
                }
              } @else if (activeStory()!.status === 'voting') {
                @if (hasVoted(participant.userId)) {
                  <span class="text-green-400 text-sm">✓</span>
                } @else {
                  <span class="text-gray-600 text-xs">—</span>
                }
              }
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class ParticipantsPanelComponent {
  readonly participants = input<Participant[]>([]);
  readonly activeStory = input<StoryDTO | null>(null);
  readonly currentUserId = input<string | null>(null);

  hasVoted(userId: string): boolean {
    return this.activeStory()?.votedUserIds.includes(userId) ?? false;
  }

  getVote(userId: string): string | null {
    const votes = this.activeStory()?.votes;
    if (!votes) return null;
    return votes.find((v) => v.userId === userId)?.value ?? null;
  }

  getAvatarColor(name: string): string {
    const colors = [
      '#7c3aed',
      '#dc2626',
      '#2563eb',
      '#059669',
      '#d97706',
      '#db2777',
      '#0891b2',
      '#65a30d',
      '#9333ea',
      '#ea580c',
    ];
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % colors.length;
    return colors[Math.abs(hash)];
  }
}
