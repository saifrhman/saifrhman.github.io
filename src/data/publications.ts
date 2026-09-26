import type { PublicationEntry } from './types';

/**
 * Papers, manuscripts and theses. Use exact statuses (see src/lib/status.ts).
 * When a decision arrives, update `status` and `venue` together, and add
 * `venue.evidence` (a public URL) before using `accepted` or `published`.
 */
export const publications: PublicationEntry[] = [
  {
    title: 'Separating Solvers and Evaluators Is Not Enough: Peer-Reward Misalignment in Multi-Agent LLMs',
    authors: 'Saif Ur Rehman and co-authors (author list withheld during anonymous review)',
    status: 'under-review',
    venue: { relation: 'submitted', name: 'a NeurIPS 2026 workshop' },
    year: 2026,
    research: 'peer-reward-misalignment',
    links: [],
  },
  {
    title: 'Geometric Evidence Utilization in Feed-Forward 4D Reconstruction',
    authors: 'Saif Ur Rehman (first author)',
    status: 'in-progress',
    venue: { relation: 'target', name: 'CVPR', year: 2027 },
    year: 2026,
    research: 'geometry-evidence',
    note: 'Working title',
    links: [],
  },
  {
    title:
      'Geographical Data and Computational Tools for Determining Restoration Priorities in Mangrove Ecosystems: A Scoping Review',
    authors: 'Yan-Yu Lin, Pablo Ramos-Henao, Saif Ur Rehman, Laura Valentina Sierra, Ainur Smailova',
    status: 'in-preparation',
    year: 2026,
    research: 'mangrove-review',
    note: 'Began as MSc group coursework, University of Liverpool, 2025; authors listed alphabetically',
    links: [],
  },
  {
    title: 'Beyond AlphaFold: Filling the Blind Spots in Protein Structure Prediction',
    authors: 'Saif Ur Rehman',
    status: 'dissertation',
    year: 2026,
    research: 'pdbclean',
    note: 'University of Liverpool; supervised by Dr Olga Anosova',
    links: [{ label: 'Code', href: 'https://github.com/saifrhman/702_BeyondAF' }],
  },
];
