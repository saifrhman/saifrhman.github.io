/**
 * Content model for the site. All research, project and publication content
 * lives in the data files next to this one and is rendered by components.
 * Optional fields are rendered only when present, so never add placeholder
 * links or empty strings.
 */

/**
 * Research/publication status. Labels are rendered verbatim by StatusBadge
 * (see src/lib/status.ts). Never promote a status without evidence:
 * "targeting a venue" is `in-progress` or `in-preparation` with a
 * `target` venue, not `accepted`.
 */
export type Status =
  | 'published'
  | 'accepted'
  | 'under-review'
  | 'submitted'
  | 'in-preparation'
  | 'in-progress'
  | 'dissertation';

/**
 * A venue always carries its relationship to the work.
 * - `target`: the venue the work is being prepared for. Rendered as "Target: …".
 * - `submitted`: submitted and awaiting a decision. Rendered as "Submitted to …".
 * - `accepted` / `published`: only with verifiable evidence (set `evidence`).
 */
export interface Venue {
  relation: 'target' | 'submitted' | 'accepted' | 'published';
  name: string;
  /** Optional longer form shown in a tooltip/abbr, e.g. the full workshop name. */
  fullName?: string;
  year?: number;
  /** Public URL proving acceptance/publication. Required for accepted/published. */
  evidence?: string;
}

export interface Link {
  label: string;
  href: string;
  /** Short context for screen readers when the label alone is ambiguous. */
  description?: string;
}

export type FigureKind =
  | 'geometry'
  | 'wireheading'
  | 'backbone'
  | 'mangrove'
  | 'retrieval'
  | 'tactical'
  | 'lakehouse'
  | 'receipt'
  | 'bayesopt';

export interface ImageRef {
  /** Path relative to src/assets, e.g. "projects/f1-eval.png". */
  src: string;
  alt: string;
  caption?: string;
}

export interface ResearchEntry {
  slug: string;
  title: string;
  /** The formal dissertation or manuscript title, when it differs from `title`. */
  formalTitle?: string;
  shortTitle: string;
  area: string;
  status: Status;
  /** Free-text qualifier shown after the status, e.g. "Workshop submission". */
  statusNote?: string;
  venue?: Venue;
  /** Year or range, e.g. "2026" or "2025–present". */
  year: string;
  /** The research question in one or two sentences. */
  question: string;
  /** Short abstract-like description (2–4 sentences). */
  summary: string;
  /** Longer paragraphs for the research page. */
  body: string[];
  methods: string[];
  concepts: string[];
  /** Specific things the author did (for multi-author work). */
  role?: string;
  collaborators?: string;
  links: Link[];
  figure: FigureKind;
  images?: ImageRef[];
}

export interface ArchitectureStage {
  label: string;
  nodes: { title: string; detail?: string }[];
}

export interface ProjectDetail {
  problem: string[];
  system: string[];
  architecture: ArchitectureStage[];
  decisions: { title: string; body: string }[];
  evaluation: string[];
  limitations: string[];
}

export interface ProjectEntry {
  slug: string;
  title: string;
  /** One-line problem statement. */
  problem: string;
  /** Concise description of what was built. */
  description: string;
  /** One line for the CV, including any caveat a reader needs. */
  cv: string;
  /** Meta description for the detail page, ideally under 160 characters. */
  seoDescription?: string;
  /** The single most interesting methodological detail. */
  highlight: string;
  tags: string[];
  domain: string;
  year: string;
  repo: string;
  demo?: string;
  figure: FigureKind;
  /** Prominent card on the home page. */
  featured: boolean;
  /** Present only for projects with a dedicated detail page. */
  detail?: ProjectDetail;
  images?: ImageRef[];
  /** Short disclosure rendered on the card and detail page (e.g. IP notes). */
  note?: string;
}

export interface PublicationEntry {
  title: string;
  authors: string;
  status: Status;
  venue?: Venue;
  year: number;
  /** Research entry this output belongs to. */
  research?: string;
  note?: string;
  links: Link[];
}

export interface ExperienceEntry {
  role: string;
  organisation: string;
  location?: string;
  start: string;
  end: string;
  summary: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  start: string;
  end: string;
  detail?: string;
}

export interface SkillGroup {
  title: string;
  items: string[];
}
