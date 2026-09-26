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
    'Saif Ur Rehman works on the reliability of learned systems: evidence and uncertainty in 3D/4D geometry models, reward misalignment between language-model agents, and geometry-aware curation of protein structure data. He also builds retrieval, data and evaluation systems.',
  url: 'https://saifrhman.github.io',
  locale: 'en_GB',
  ogImage: '/og.png',
  ogImageAlt: 'Saif Ur Rehman: machine learning engineer and AI researcher.',
  email: 'saif10urrehman@gmail.com',
  github: 'https://github.com/saifrhman',
  linkedin: 'https://www.linkedin.com/in/saifurrhmn/',
  /**
   * CV. `page` is the printable HTML CV built from the data files. `pdf` is
   * optional: set it to a file under public/ (e.g. '/cv/saif-ur-rehman-cv.pdf')
   * or to null to hide the download link. `npm run cv:pdf` regenerates the PDF
   * from the /cv/ page.
   */
  cv: {
    page: '/cv/',
    pdf: '/cv/saif-ur-rehman-cv.pdf' as string | null,
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
  { kind: 'cv', label: 'CV', href: site.cv.page, display: 'Printable CV and PDF' },
];
