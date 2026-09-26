import type { Status, Venue } from '@/data/types';

export const STATUS_LABEL: Record<Status, string> = {
  published: 'Published',
  accepted: 'Accepted',
  'under-review': 'Under review',
  submitted: 'Submitted',
  'in-preparation': 'Manuscript in preparation',
  'in-progress': 'Research in progress',
  dissertation: 'MSc dissertation',
};

/** Visual tone for the status dot. Kept to four quiet tones. */
export type StatusTone = 'progress' | 'review' | 'done' | 'neutral';

export const STATUS_TONE: Record<Status, StatusTone> = {
  published: 'done',
  accepted: 'done',
  'under-review': 'review',
  submitted: 'review',
  'in-preparation': 'neutral',
  'in-progress': 'progress',
  dissertation: 'neutral',
};

/**
 * Human-readable venue line. The relation is always spelled out so a target
 * venue can never be read as publication metadata.
 */
export function venueLabel(venue: Venue): string {
  const name = venue.year ? `${venue.name} ${venue.year}` : venue.name;
  switch (venue.relation) {
    case 'target':
      return `Target: ${name}`;
    case 'submitted':
      return `Submitted to ${name}`;
    case 'accepted':
      return `Accepted at ${name}`;
    case 'published':
      return `Published at ${name}`;
  }
}

/**
 * Consistency rules between status and venue. Used by tests and at build time
 * so an inconsistent entry fails loudly instead of rendering a false claim.
 */
export function statusProblems(status: Status, venue: Venue | undefined): string[] {
  const problems: string[] = [];
  const verified = status === 'accepted' || status === 'published';
  if (verified) {
    if (!venue) problems.push(`status "${status}" requires a venue`);
    else {
      if (venue.relation !== status) problems.push(`status "${status}" but venue relation "${venue.relation}"`);
      if (!venue.evidence) problems.push(`status "${status}" requires venue.evidence (a public URL)`);
    }
  }
  if (venue && !verified && (venue.relation === 'accepted' || venue.relation === 'published')) {
    problems.push(`venue relation "${venue.relation}" is not allowed with status "${status}"`);
  }
  if (venue?.relation === 'submitted' && !(status === 'submitted' || status === 'under-review')) {
    problems.push(`venue relation "submitted" requires status "submitted" or "under-review"`);
  }
  return problems;
}
