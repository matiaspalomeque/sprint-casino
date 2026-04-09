import { Component, input, computed } from '@angular/core';
import { VoteDTO, VotingSystem } from '../../../models/session.types';
import { calculateResults } from '../../../services/voting.utils';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="animate-slide-up">
      <!-- Stats row -->
      <div class="flex gap-3 mb-4 flex-wrap">
        @if (results().average !== null) {
          <div
            class="glass-panel p-4 flex-1 min-w-[100px] text-center"
          >
            <div class="text-2xl font-bold text-gold">
              {{ results().average!.toFixed(1) }}
            </div>
            <div class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              {{ 'results.average' | translate }}
            </div>
          </div>
        }
        @if (results().mode !== null) {
          <div
            class="glass-panel p-4 flex-1 min-w-[100px] text-center"
          >
            <div class="text-2xl font-bold text-gold">{{ results().mode }}</div>
            <div class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
              {{ 'results.mostCommon' | translate }}
            </div>
          </div>
        }
        <div
          class="glass-panel p-4 flex-1 min-w-[100px] text-center"
        >
          <div class="text-2xl font-bold text-white">{{ votes().length }}</div>
          <div class="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
            {{ 'results.votes' | translate }}
          </div>
        </div>
      </div>

      <!-- Distribution -->
      @if (distributionEntries().length > 0) {
        <div class="glass-panel p-5 mb-4">
          <h4
            class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3"
          >
            {{ 'results.distribution' | translate }}
          </h4>
          <div class="space-y-2.5">
            @for (entry of distributionEntries(); track entry.value) {
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-gold w-10 text-right">{{
                  entry.value
                }}</span>
                <div class="flex-1 bg-white/[0.06] rounded-full h-1.5">
                  <div
                    class="bg-gradient-to-r from-gold-dark to-gold h-1.5 rounded-full transition-all duration-700"
                    [style.width.%]="(entry.count / results().totalVotes) * 100"
                  ></div>
                </div>
                <span class="text-xs text-gray-500 w-6 tabular-nums">{{ entry.count }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Individual votes -->
      <div class="glass-panel p-5">
        <h4
          class="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] mb-3"
        >
          {{ 'results.allVotes' | translate }}
        </h4>
        <div class="space-y-2">
          @for (vote of votes(); track vote.userId) {
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-400">{{ vote.userName }}</span>
              <span
                class="text-xs font-bold text-gold bg-gold/8 border border-gold/15 px-2.5 py-0.5 rounded-lg"
                >{{ vote.value }}</span
              >
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ResultsDisplayComponent {
  readonly votes = input<VoteDTO[]>([]);
  readonly votingSystem = input<VotingSystem>('fibonacci');

  readonly results = computed(() => calculateResults(this.votes(), this.votingSystem()));

  readonly distributionEntries = computed(() =>
    Object.entries(this.results().distribution)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
  );
}
