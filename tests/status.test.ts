import { describe, expect, it } from 'vitest';
import { STATUS_LABEL, statusProblems, venueLabel } from '@/lib/status';

describe('venueLabel', () => {
  it('never renders a target venue as publication metadata', () => {
    expect(venueLabel({ relation: 'target', name: 'CVPR', year: 2027 })).toBe('Target: CVPR 2027');
    expect(venueLabel({ relation: 'submitted', name: 'a NeurIPS 2026 workshop' })).toBe('Submitted to a NeurIPS 2026 workshop');
    expect(venueLabel({ relation: 'accepted', name: 'X', year: 2026 })).toBe('Accepted at X 2026');
    expect(venueLabel({ relation: 'published', name: 'Y' })).toBe('Published at Y');
  });
});

describe('statusProblems', () => {
  it('accepts consistent combinations', () => {
    expect(statusProblems('in-progress', { relation: 'target', name: 'CVPR', year: 2027 })).toEqual([]);
    expect(statusProblems('under-review', { relation: 'submitted', name: 'W' })).toEqual([]);
    expect(statusProblems('dissertation', undefined)).toEqual([]);
    expect(
      statusProblems('published', { relation: 'published', name: 'J', evidence: 'https://doi.org/10.1/x' }),
    ).toEqual([]);
  });

  it('rejects promotion without evidence', () => {
    expect(statusProblems('accepted', { relation: 'accepted', name: 'W' })).not.toEqual([]);
    expect(statusProblems('published', undefined)).not.toEqual([]);
  });

  it('rejects a verified venue relation on unverified work', () => {
    expect(statusProblems('in-progress', { relation: 'accepted', name: 'CVPR' })).not.toEqual([]);
    expect(statusProblems('in-preparation', { relation: 'submitted', name: 'W' })).not.toEqual([]);
  });

  it('has a label for every status', () => {
    for (const label of Object.values(STATUS_LABEL)) expect(label.length).toBeGreaterThan(0);
  });
});
