import { Component, input } from '@angular/core';
import { Participant, StoryDTO } from '../../../models/session.types';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { hasVoted, getVoteValue } from '../../../services/story.utils';

@Component({
  selector: 'app-participants-panel',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="h-full bg-casino-card/60 backdrop-blur-md border-l border-white/[0.04] p-4">
      <h3
        class="text-[10px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-4"
      >
        {{ 'participants.players' | translate: { count: participants().length } }}
      </h3>

      <div class="space-y-1">
        @for (participant of participants(); track participant.userId) {
          <div
            class="flex items-center gap-3 p-2.5 rounded-xl transition-colors duration-150"
            [class.bg-white/[0.03]]="participant.userId === currentUserId()"
          >
            <!-- Avatar -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              [style.background]="getAvatarColor(participant.userName)"
              style="color: rgba(255,255,255,0.9)"
            >
              {{ (participant.userName.charAt(0) || '?').toUpperCase() }}
            </div>

            <!-- Name + badges -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1.5">
                <span
                  class="text-sm font-medium truncate"
                  [class.text-white]="participant.userId === currentUserId()"
                  [class.text-gray-400]="participant.userId !== currentUserId()"
                  >{{ participant.userName }}</span
                >
                @if (participant.userId === currentUserId()) {
                  <span class="text-[9px] text-gray-600 font-medium uppercase">{{
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
                    class="text-[11px] font-bold bg-gold/10 border border-gold/25 rounded-lg px-2 py-0.5 text-gold"
                  >
                    {{ vote }}
                  </span>
                }
              } @else if (activeStory()!.status === 'voting') {
                @if (hasVoted(participant.userId)) {
                  <span class="text-green-400 text-xs">✓</span>
                } @else {
                  <span class="text-gray-700 text-xs">—</span>
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
    return hasVoted(this.activeStory(), userId);
  }

  getVote(userId: string): string | null {
    return getVoteValue(this.activeStory(), userId);
  }

  getAvatarColor(name: string): string {
    const colors = [
      'linear-gradient(135deg, #7c3aed, #5b21b6)',
      'linear-gradient(135deg, #dc2626, #991b1b)',
      'linear-gradient(135deg, #2563eb, #1d4ed8)',
      'linear-gradient(135deg, #059669, #047857)',
      'linear-gradient(135deg, #d97706, #b45309)',
      'linear-gradient(135deg, #db2777, #be185d)',
      'linear-gradient(135deg, #0891b2, #0e7490)',
      'linear-gradient(135deg, #65a30d, #4d7c0f)',
      'linear-gradient(135deg, #9333ea, #7e22ce)',
      'linear-gradient(135deg, #ea580c, #c2410c)',
    ];
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % colors.length;
    return colors[Math.abs(hash)];
  }
}
