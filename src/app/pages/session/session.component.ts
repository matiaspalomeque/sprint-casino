import { Component, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { NamePromptComponent } from '../../components/shared/name-prompt/name-prompt.component';
import { SessionHeaderComponent } from '../../components/session/session-header/session-header.component';
import { StoryListComponent } from '../../components/session/story-list/story-list.component';
import { ParticipantsPanelComponent } from '../../components/session/participants-panel/participants-panel.component';
import { VotingBoardComponent } from '../../components/session/voting-board/voting-board.component';
import { CardDeckComponent } from '../../components/session/card-deck/card-deck.component';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [
    NamePromptComponent,
    SessionHeaderComponent,
    StoryListComponent,
    ParticipantsPanelComponent,
    VotingBoardComponent,
    CardDeckComponent,
    TranslatePipe,
  ],
  template: `
    <!-- Name prompt if needed -->
    @if (!userService.hasIdentity()) {
      <app-name-prompt (named)="onNamed()" />
    }

    <!-- Connection states -->
    @if (sessionService.connectionStatus() === 'connecting') {
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <div
            class="w-12 h-12 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4"
          ></div>
          <p class="text-gray-400">
            {{ (sessionService.isHost() ? 'session.settingUp' : 'session.joining') | translate }}
          </p>
        </div>
      </div>
    }

    @if (sessionService.connectionStatus() === 'error') {
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center max-w-sm mx-auto px-4">
          <h2 class="text-white font-bold text-xl mb-2">
            {{ 'session.connectionFailed' | translate }}
          </h2>
          <p class="text-gray-400 text-sm mb-6">
            {{ sessionService.errorMessage() ?? 'session.couldNotConnect' | translate }}
          </p>
          <button (click)="goHome()" class="btn-gold px-6 py-2.5 rounded-xl text-sm">
            {{ 'session.backToLobby' | translate }}
          </button>
        </div>
      </div>
    }

    @if (sessionService.connectionStatus() === 'ended') {
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center max-w-sm mx-auto px-4">
          <h2 class="text-white font-bold text-xl mb-2">
            {{ 'session.sessionEnded' | translate }}
          </h2>
          <p class="text-gray-400 text-sm mb-6">{{ 'session.hostLeft' | translate }}</p>
          <button (click)="goHome()" class="btn-gold px-6 py-2.5 rounded-xl text-sm">
            {{ 'session.backToLobby' | translate }}
          </button>
        </div>
      </div>
    }

    <!-- Main session UI -->
    @if (sessionService.connectionStatus() === 'connected' && sessionService.session()) {
      @let session = sessionService.session()!;

      <div class="flex flex-col h-screen overflow-hidden">
        <!-- Header -->
        <app-session-header
          [sessionId]="session.sessionId"
          [sessionName]="session.sessionName"
          [votingSystem]="session.votingSystem"
          [isHost]="sessionService.isHost()"
          (leave)="onLeave()"
        />

        <!-- Main content -->
        <div class="flex flex-1 min-h-0">
          <!-- Stories sidebar -->
          <div
            class="hidden md:flex w-56 lg:w-64 max-w-56 lg:max-w-64 flex-shrink-0 overflow-hidden min-w-0"
          >
            <app-story-list
              class="flex-1 min-w-0"
              [stories]="session.stories"
              [activeStoryId]="session.activeStoryId"
              [isHost]="sessionService.isHost()"
              (storySelected)="sessionService.selectStory($event)"
              (storyDeleted)="sessionService.deleteStory($event)"
              (storyAdded)="sessionService.addStory($event)"
            />
          </div>

          <!-- Center: voting board -->
          <div class="flex-1 flex flex-col min-w-0 p-4 gap-4 overflow-y-auto">
            <!-- Mobile story selector -->
            <div class="md:hidden">
              <select
                class="w-full bg-casino-surface border border-casino-border rounded-lg px-3 py-2 text-sm text-white"
                [value]="session.activeStoryId ?? ''"
                (change)="onMobileStoryChange($event)"
              >
                <option value="">{{ 'session.selectStory' | translate }}</option>
                @for (story of session.stories; track story.storyId) {
                  <option [value]="story.storyId">{{ story.name }}</option>
                }
              </select>
            </div>

            <app-voting-board
              [activeStory]="sessionService.activeStory()"
              [participants]="session.participants"
              [currentUserId]="userService.userId()"
              [isHost]="sessionService.isHost()"
              [votingSystem]="session.votingSystem"
              [revealPolicy]="session.revealPolicy"
              (revealVotes)="sessionService.requestReveal()"
              (resetVotes)="onResetVotes()"
            />

            <!-- Card deck -->
            @if (sessionService.activeStory()?.status === 'voting') {
              <div class="flex-shrink-0 py-4">
                <app-card-deck
                  [options]="session.votingOptions"
                  [selectedValue]="sessionService.myVote()"
                  (voteSelected)="sessionService.castVote($event)"
                />
              </div>
            }
          </div>

          <!-- Participants sidebar -->
          <div class="hidden lg:flex w-52 xl:w-60 flex-shrink-0 overflow-hidden">
            <app-participants-panel
              class="flex-1"
              [participants]="session.participants"
              [activeStory]="sessionService.activeStory()"
              [currentUserId]="userService.userId()"
            />
          </div>
        </div>

        <!-- Toast -->
        @if (sessionService.toastMessage()) {
          <div
            class="fixed bottom-4 right-4 bg-casino-surface border border-casino-border rounded-xl px-4 py-3 text-sm text-white shadow-xl animate-[fade-in_0.3s_ease-out]"
          >
            {{ sessionService.toastMessage() }}
          </div>
        }
      </div>
    }
  `,
})
export class SessionComponent implements OnInit, OnDestroy {
  readonly sessionService = inject(SessionService);
  readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (!sessionId) {
      this.router.navigate(['/']);
      return;
    }

    // If already host of this session, do nothing
    if (this.sessionService.isHost() && this.sessionService.session()?.sessionId === sessionId) {
      return;
    }

    // Wait for name if not set
    if (!this.userService.hasIdentity()) {
      // Name prompt will show; join is triggered after naming via onNamed()
      return;
    }

    this._joinSession(sessionId);
  }

  ngOnDestroy(): void {
    this.sessionService.leaveSession();
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.sessionService.leaveSession();
  }

  onNamed(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) this._joinSession(sessionId);
  }

  onLeave(): void {
    this.sessionService.leaveSession();
    this.router.navigate(['/']);
  }

  onResetVotes(): void {
    const active = this.sessionService.activeStory();
    if (active) this.sessionService.resetVotes(active.storyId);
  }

  onMobileStoryChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    if (select.value) this.sessionService.selectStory(select.value);
  }

  goHome(): void {
    this.sessionService.clearSession();
    this.router.navigate(['/']);
  }

  private _joinSession(sessionId: string): void {
    this.sessionService.joinSession(sessionId).catch(() => {
      // Error is handled reactively via connectionStatus signal
    });
  }
}
