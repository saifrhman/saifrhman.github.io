import { site } from '@/data/site';

/** schema.org Person for the home page. Only verifiable facts. */
export function personJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    image: `${site.url}/images/saif-ur-rehman.jpg`,
    email: `mailto:${site.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Liverpool', addressCountry: 'GB' },
    affiliation: { '@type': 'CollegeOrUniversity', name: 'University of Liverpool' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'National University of Sciences and Technology' },
    sameAs: [site.github, site.linkedin],
    knowsAbout: [
      'Machine learning',
      'Computer vision',
      '3D reconstruction',
      'AI safety',
      'Reinforcement learning',
      'Retrieval-augmented generation',
      'Protein structure prediction',
      'Data engineering',
    ],
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: 'en-GB',
  };
}
