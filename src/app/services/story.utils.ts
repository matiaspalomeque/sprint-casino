import { StoryDTO } from '../models/session.types';

export function hasVoted(story: StoryDTO | null, userId: string): boolean {
  return story?.votedUserIds.includes(userId) ?? false;
}

export function getVoteValue(story: StoryDTO | null, userId: string): string | null {
  if (!story?.votes) return null;
  return story.votes.find((v) => v.userId === userId)?.value ?? null;
}
