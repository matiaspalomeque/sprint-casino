import { Component, input, output, computed } from '@angular/core';
import { StoryDTO, Participant, VotingSystem } from '../../../models/session.types';
import { VotingCardComponent } from '../voting-card/voting-card.component';
import { ResultsDisplayComponent } from '../results-display/results-display.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { hasVoted, getVoteValue } from '../../../services/story.utils';

@Component({
  selector: 'app-voting-board',
  standalone: true,
  imports: [VotingCardComponent, ResultsDisplayComponent, TranslatePipe],
  template: `
    <div class="flex flex-col h-full">
      <!-- Poker table -->
      <div
        class="felt-table rounded-2xl flex-1 flex flex-col items-center justify-center p-6 relative min-h-[280px]"
      >
        @if (!activeStory()) {
          <div class="text-center animate-fade-in">
            <p class="text-white/30 text-sm font-medium">
              {{
                (isHost() ? 'voting.board.selectStoryHost' : 'voting.board.waitingForHost')
                  | translate
              }}
            </p>
          </div>
        } @else {
          <!-- Story name -->
          <div class="text-center mb-6 animate-fade-in">
            <p class="text-white/40 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
              {{ 'voting.board.nowVotingOn' | translate }}
            </p>
            <h2
              class="text-white font-bold text-xl w-full max-w-xs mx-auto line-clamp-2 tracking-tight"
            >
              {{ activeStory()!.name }}
            </h2>
          </div>

          @if (activeStory()!.status === 'voting') {
            <!-- Voting state: face-down cards for each voter -->
            <div class="flex flex-wrap gap-3 justify-center mb-4">
              @for (participant of participants(); track participant.userId) {
                <div class="flex flex-col items-center gap-1.5">
                  <app-voting-card [value]="''" [faceUp]="false" [width]="52" [height]="78" />
                  <span class="text-[11px] text-white/50 max-w-[60px] truncate text-center">
                    {{ participant.userName }}
                  </span>
                  @if (hasVoted(participant.userId)) {
                    <span class="text-green-400 text-xs" aria-hidden="true">✓</span>
                  } @else {
                    <span class="text-transparent text-xs">—</span>
                  }
                </div>
              }
            </div>

            <!-- Vote count progress -->
            <div class="text-white/30 text-xs font-medium mb-4">
              {{
                'voting.board.voted'
                  | translate: { current: voteCount(), total: participants().length }
              }}
            </div>

            <!-- Reveal button -->
            @if (canReveal()) {
              <button
                (click)="revealVotes.emit()"
                [disabled]="voteCount() === 0"
                class="btn-gold px-8 py-2.5 rounded-xl text-sm"
              >
                {{ 'voting.board.revealCards' | translate }}
              </button>
            }
          }

          @if (activeStory()!.status === 'revealed') {
            <!-- Revealed state: face-up cards -->
            <div class="flex flex-wrap gap-3 justify-center mb-4">
              @for (participant of participants(); track participant.userId; let i = $index) {
                <div class="flex flex-col items-center gap-1.5 animate-fade-in-up"
                  [style.animation-delay]="(i * 60) + 'ms'"
                >
                  <app-voting-card
                    [value]="getVote(participant.userId)"
                    [faceUp]="true"
                    [width]="52"
                    [height]="78"
                  />
                  <span class="text-[11px] text-white/50 max-w-[60px] truncate text-center">
                    {{ participant.userName }}
                  </span>
                </div>
              }
            </div>

            <!-- Reset button (host only) -->
            @if (isHost()) {
              <button
                (click)="resetVotes.emit()"
                class="mt-2 px-6 py-2 rounded-xl text-xs font-medium border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all duration-200"
              >
                {{ 'voting.board.newRound' | translate }}
              </button>
            }
          }
        }
      </div>

      <!-- Results (shown after reveal) -->
      @if (activeStory()?.status === 'revealed' && activeStory()!.votes) {
        <div class="mt-4">
          <app-results-display [votes]="activeStory()!.votes!" [votingSystem]="votingSystem()" />
        </div>
      }
    </div>
  `,
})
export class VotingBoardComponent {
  readonly activeStory = input<StoryDTO | null>(null);
  readonly participants = input<Participant[]>([]);
  readonly currentUserId = input<string | null>(null);
  readonly isHost = input(false);
  readonly votingSystem = input<VotingSystem>('fibonacci');
  readonly revealPolicy = input<'host_only' | 'anyone'>('host_only');

  readonly revealVotes = output<void>();
  readonly resetVotes = output<void>();

  readonly voteCount = computed(() => this.activeStory()?.votedUserIds.length ?? 0);

  readonly canReveal = computed(() => {
    const policy = this.revealPolicy();
    if (policy === 'host_only') return this.isHost();
    return true;
  });

  hasVoted(userId: string): boolean {
    return hasVoted(this.activeStory(), userId);
  }

  getVote(userId: string): string {
    return getVoteValue(this.activeStory(), userId) ?? '?';
  }
}
