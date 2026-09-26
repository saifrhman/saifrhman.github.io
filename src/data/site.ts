/**
 * Site-wide identity, links and navigation. Edit here to change the name,
 * description, contact links or the CV file.
 */

export const site = {
  name: 'Saif Ur Rehman',
  /** Exact string used to bold the author's name in publication lists. */
  authorName: 'Saif Ur Rehman',
  title: 'Saif Ur Rehman · AI Research & Machine Learning',
  role: 'Machine learning engineer and AI researcher',
  affiliation: 'MSc Data Science & AI, University of Liverpool',
  location: 'Liverpool, United Kingdom',
  description:
    'Saif Ur Rehman, ML engineer and AI researcher: evidence and uncertainty in 3D/4D geometry models, reward misalignment between LLM agents, protein data.',
  url: 'https://saifrhman.github.io',
  locale: 'en_GB',
  ogImage: '/og.png',
  ogImageAlt: 'Saif Ur Rehman: machine learning engineer and AI researcher.',
  email: 'saif10urrehman@gmail.com',
  github: 'https://github.com/saifrhman',
  linkedin: 'https://www.linkedin.com/in/saifurrhmn/',
  /**
   * CV. `page` is the printable HTML CV built from the data files, and `pdf`
   * is that page rendered to PDF by `npm run assets`. `resume` is the
   * separately maintained résumé PDF. Set either file to null to hide its link.
   */
  cv: {
    page: '/cv/',
    pdf: '/cv/saif-ur-rehman-cv.pdf' as string | null,
    /** The résumé document itself (replace the file to update it; null hides the links). */
    resume: '/cv/saif-ur-rehman-resume.pdf' as string | null,
  },
  contactNote:
    'Email is the most reliable way to reach me. I am glad to hear about research collaborations, PhD and research-engineering positions, and questions about any of the work here.',
} as const;

export interface NavItem {
  label: string;
  href: string;
  kind?: 'page' | 'file';
}

export const navigation: NavItem[] = [
  { label: 'Research', href: '/research/' },
  { label: 'Projects', href: '/projects/' },
  { label: 'About', href: '/about/' },
  { label: 'CV', href: site.cv.page },
  { label: 'Contact', href: '#contact' },
];

export interface ContactLink {
  kind: 'email' | 'github' | 'linkedin' | 'cv' | 'scholar';
  label: string;
  href: string;
  display?: string;
}

export const contactLinks: ContactLink[] = [
  { kind: 'email', label: 'Email', href: `mailto:${site.email}`, display: site.email },
  { kind: 'github', label: 'GitHub', href: site.github, display: 'github.com/saifrhman' },
  { kind: 'linkedin', label: 'LinkedIn', href: site.linkedin, display: 'linkedin.com/in/saifurrhmn' },
  { kind: 'cv', label: 'CV', href: site.cv.page, display: 'Printable CV page' },
  ...(site.cv.resume
    ? [{ kind: 'cv' as const, label: 'Résumé', href: site.cv.resume, display: 'PDF, 2 pages' }]
    : []),
];
