import { VotingSystem, VoteDTO } from '../models/session.types';

const VOTING_OPTIONS: Record<VotingSystem, string[]> = {
  fibonacci: ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?'],
  high_level: ['S', 'M', 'C', '2xC', '3xC', '4xC', '?'],
  custom: [],
};

export function getVotingOptions(system: VotingSystem, customOptions?: string): string[] {
  if (system === 'custom') {
    const parsed = (customOptions ?? '')
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .slice(0, 20);
    return parsed.includes('?') ? parsed : [...parsed, '?'];
  }
  return VOTING_OPTIONS[system];
}

export function isNumericSystem(system: VotingSystem): boolean {
  return system === 'fibonacci';
}

export interface VoteResults {
  average: number | null;
  mode: string | null;
  distribution: Record<string, number>;
  totalVotes: number;
}

export function calculateResults(votes: VoteDTO[], system: VotingSystem): VoteResults {
  if (votes.length === 0) {
    return { average: null, mode: null, distribution: {}, totalVotes: 0 };
  }

  const distribution: Record<string, number> = {};
  for (const vote of votes) {
    distribution[vote.value] = (distribution[vote.value] ?? 0) + 1;
  }

  // Mode: most common value
  let mode: string | null = null;
  let maxCount = 0;
  for (const [value, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      mode = value;
    }
  }

  // Average: only for numeric values, excluding '?'
  let average: number | null = null;
  if (isNumericSystem(system)) {
    const numericVotes = votes
      .filter((v) => v.value !== '?')
      .map((v) => parseFloat(v.value))
      .filter((n) => !isNaN(n));

    if (numericVotes.length > 0) {
      average = numericVotes.reduce((sum, n) => sum + n, 0) / numericVotes.length;
    }
  }

  return { average, mode, distribution, totalVotes: votes.length };
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomValues = new Uint32Array(6);
  crypto.getRandomValues(randomValues);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[randomValues[i] % chars.length];
  }
  return code;
}
