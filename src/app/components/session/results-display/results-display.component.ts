import { Component, input, computed } from '@angular/core';
import { VoteDTO, VotingSystem } from '../../../models/session.types';
import { calculateResults } from '../../../services/voting.utils';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-results-display',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="animate-[slide-up_0.3s_ease-out]">
      <!-- Stats row -->
      <div class="flex gap-4 mb-4 flex-wrap">
        @if (results().average !== null) {
          <div class="bg-casino-surface rounded-xl p-3 flex-1 min-w-[100px] text-center">
            <div class="text-2xl font-bold text-gold">{{ results().average!.toFixed(1) }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ 'results.average' | translate }}</div>
          </div>
        }
        @if (results().mode !== null) {
          <div class="bg-casino-surface rounded-xl p-3 flex-1 min-w-[100px] text-center">
            <div class="text-2xl font-bold text-gold">{{ results().mode }}</div>
            <div class="text-xs text-gray-400 mt-0.5">{{ 'results.mostCommon' | translate }}</div>
          </div>
        }
        <div class="bg-casino-surface rounded-xl p-3 flex-1 min-w-[100px] text-center">
          <div class="text-2xl font-bold text-white">{{ votes().length }}</div>
          <div class="text-xs text-gray-400 mt-0.5">{{ 'results.votes' | translate }}</div>
        </div>
      </div>

      <!-- Distribution -->
      @if (distributionEntries().length > 0) {
        <div class="bg-casino-surface rounded-xl p-4 mb-4">
          <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {{ 'results.distribution' | translate }}
          </h4>
          <div class="space-y-2">
            @for (entry of distributionEntries(); track entry.value) {
              <div class="flex items-center gap-3">
                <span class="text-sm font-bold text-gold w-10 text-right">{{ entry.value }}</span>
                <div class="flex-1 bg-casino-border rounded-full h-2">
                  <div
                    class="bg-gold h-2 rounded-full transition-all duration-500"
                    [style.width.%]="(entry.count / results().totalVotes) * 100"
                  ></div>
                </div>
                <span class="text-xs text-gray-400 w-6">{{ entry.count }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Individual votes -->
      <div class="bg-casino-surface rounded-xl p-4">
        <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          {{ 'results.allVotes' | translate }}
        </h4>
        <div class="space-y-2">
          @for (vote of votes(); track vote.userId) {
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-300">{{ vote.userName }}</span>
              <span class="text-sm font-bold text-gold bg-casino-border px-2 py-0.5 rounded">{{
                vote.value
              }}</span>
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
