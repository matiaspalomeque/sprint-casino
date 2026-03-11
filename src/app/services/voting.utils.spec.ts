import {
  generateSessionCode,
  getVotingOptions,
  calculateResults,
  isNumericSystem,
} from './voting.utils';
import { VoteDTO } from '../models/session.types';

describe('generateSessionCode', () => {
  it('returns a 6-character string', () => {
    expect(generateSessionCode()).toHaveLength(6);
  });

  it('uses only uppercase alphanumeric characters', () => {
    for (let i = 0; i < 20; i++) {
      expect(generateSessionCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  it('produces unique codes across repeated calls', () => {
    const codes = new Set(Array.from({ length: 100 }, generateSessionCode));
    // With 36^6 possibilities, 100 calls should always yield unique results
    expect(codes.size).toBe(100);
  });
});

describe('getVotingOptions', () => {
  it('returns fibonacci options', () => {
    const opts = getVotingOptions('fibonacci');
    expect(opts).toContain('1');
    expect(opts).toContain('13');
    expect(opts).toContain('?');
  });

  it('returns tshirt options', () => {
    const opts = getVotingOptions('tshirt');
    expect(opts).toContain('XS');
    expect(opts).toContain('XXL');
    expect(opts).toContain('?');
  });

  it('returns high_level options', () => {
    const opts = getVotingOptions('high_level');
    expect(opts).toContain('S');
    expect(opts).toContain('C');
    expect(opts).toContain('4xC');
    expect(opts).toContain('?');
  });

  it('parses custom comma-separated values', () => {
    const opts = getVotingOptions('custom', '1, 3, 5, 8');
    expect(opts).toEqual(['1', '3', '5', '8', '?']);
  });

  it('appends ? to custom values if missing', () => {
    const opts = getVotingOptions('custom', 'a,b,c');
    expect(opts[opts.length - 1]).toBe('?');
  });

  it('does not duplicate ? in custom values', () => {
    const opts = getVotingOptions('custom', 'a,b,?');
    expect(opts.filter((v) => v === '?')).toHaveLength(1);
  });

  it('limits custom options to 20 values plus ?', () => {
    const many = Array.from({ length: 30 }, (_, i) => String(i)).join(',');
    const opts = getVotingOptions('custom', many);
    expect(opts.length).toBeLessThanOrEqual(21);
  });

  it('returns empty custom options with just ? for empty input', () => {
    const opts = getVotingOptions('custom', '');
    expect(opts).toEqual(['?']);
  });
});

describe('isNumericSystem', () => {
  it('returns true for fibonacci', () => expect(isNumericSystem('fibonacci')).toBe(true));
  it('returns false for high_level', () => expect(isNumericSystem('high_level')).toBe(false));
  it('returns false for tshirt', () => expect(isNumericSystem('tshirt')).toBe(false));
  it('returns false for custom', () => expect(isNumericSystem('custom')).toBe(false));
});

describe('calculateResults', () => {
  it('returns nulls for empty votes', () => {
    const r = calculateResults([], 'fibonacci');
    expect(r.average).toBeNull();
    expect(r.mode).toBeNull();
    expect(r.totalVotes).toBe(0);
    expect(r.distribution).toEqual({});
  });

  it('calculates average for numeric system', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: '2' },
      { userId: 'b', userName: 'B', value: '4' },
    ];
    const r = calculateResults(votes, 'fibonacci');
    expect(r.average).toBe(3);
  });

  it('excludes ? from average calculation', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: '8' },
      { userId: 'b', userName: 'B', value: '?' },
    ];
    const r = calculateResults(votes, 'fibonacci');
    expect(r.average).toBe(8);
  });

  it('average is null for non-numeric system', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: 'S' },
      { userId: 'b', userName: 'B', value: 'M' },
    ];
    const r = calculateResults(votes, 'tshirt');
    expect(r.average).toBeNull();
  });

  it('computes the mode correctly', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: '3' },
      { userId: 'b', userName: 'B', value: '3' },
      { userId: 'c', userName: 'C', value: '5' },
    ];
    const r = calculateResults(votes, 'fibonacci');
    expect(r.mode).toBe('3');
  });

  it('builds distribution correctly', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: '5' },
      { userId: 'b', userName: 'B', value: '5' },
      { userId: 'c', userName: 'C', value: '8' },
    ];
    const r = calculateResults(votes, 'fibonacci');
    expect(r.distribution).toEqual({ '5': 2, '8': 1 });
    expect(r.totalVotes).toBe(3);
  });

  it('average is null when all votes are ?', () => {
    const votes: VoteDTO[] = [
      { userId: 'a', userName: 'A', value: '?' },
      { userId: 'b', userName: 'B', value: '?' },
    ];
    const r = calculateResults(votes, 'fibonacci');
    expect(r.average).toBeNull();
  });
});
