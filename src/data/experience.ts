import type { EducationEntry, ExperienceEntry, SkillGroup } from './types';

export const education: EducationEntry[] = [
  {
    degree: 'MSc Data Science and Artificial Intelligence',
    institution: 'University of Liverpool',
    start: '2025',
    end: '2026',
    detail:
      'Dissertation: Beyond AlphaFold: Filling the Blind Spots in Protein Structure Prediction, supervised by Dr Olga Anosova.',
  },
  {
    degree: 'BE Electrical (Telecommunication) Engineering',
    institution: 'National University of Sciences and Technology (NUST), Pakistan',
    start: '2016',
    end: '2021',
  },
];

export const experience: ExperienceEntry[] = [
  {
    role: 'Applied AI Intern',
    organisation: 'Rofsix',
    location: 'UK',
    start: '2026',
    end: 'present',
    summary:
      'Developing a real-time system that detects and redacts confidential information during screen sharing, combining OCR, transformer-based NER and image processing. Built and evaluated inference components with ONNX, OpenVINO and PaddleOCR, and profiled the pipeline for low-latency CPU execution.',
  },
  {
    role: 'Senior Systems Engineer',
    organisation: 'RoshTech',
    start: 'Nov 2022',
    end: 'Sep 2025',
    summary:
      'Built threat-detection and anomaly-analysis workflows over MongoDB, Graylog and the Elastic Stack to support incident investigation for enterprise clients.',
  },
  {
    role: 'Data Science Intern (part-time)',
    organisation: 'Creative Tech Solutions',
    location: 'Islamabad',
    start: 'Jan 2024',
    end: 'Apr 2024',
    summary: 'Wrote Python scripts for data analysis and data cleaning for the analytics team.',
  },
  {
    role: 'Senior Cloud Engineer',
    organisation: 'Tier3tech',
    start: 'Feb 2022',
    end: 'Nov 2022',
    summary: 'Worked on cloud security and Azure Virtual Desktop infrastructure; mentored team members.',
  },
  {
    role: 'Level 2 Support Team Lead',
    organisation: 'MiGo Innovations',
    start: 'Nov 2020',
    end: 'Feb 2022',
    summary: 'Led a team running offshore network operations for US clients.',
  },
];

export const competitions: { title: string; detail: string; href?: string }[] = [
  {
    title: 'ICPC Northwestern Europe Regional Contest (NWERC) 2025',
    detail: '107th, as the University of Liverpool team “Baby Harp Seal”.',
    href: 'https://scoreboard.2025.nwerc.eu/',
  },
  {
    title: 'ICPC UK & Ireland Programming Contest 2025',
    detail: '50th overall and 1st at the University of Liverpool site (team event).',
  },
  {
    title: 'Liverpool Computer Society Hackathon',
    detail: '1st place (team).',
  },
  {
    title: 'Ultamation Hackathon',
    detail: '2nd place, constraint-satisfaction scheduling.',
  },
];

export const certifications: string[] = [
  'Fundamentals of Accelerated Computing with Modern CUDA C++, NVIDIA (2026)',
  'Machine Learning Specialization, DeepLearning.AI on Coursera (2025)',
  'IBM Data Science Professional Certificate, Coursera (2025)',
];

/**
 * Grouped skills. Only list things that appear in the work on this site or
 * in the experience above.
 */
export const skills: SkillGroup[] = [
  {
    title: 'Research and ML',
    items: [
      'PyTorch',
      'RL fine-tuning of LLMs (LoRA, REINFORCE)',
      'Retrieval-augmented generation',
      'Weak supervision',
      'Bayesian optimisation (BoTorch, GPyTorch)',
      'Experimental design and error analysis',
    ],
  },
  {
    title: 'Geometry, vision and science',
    items: [
      '3D/4D reconstruction models',
      'Protein structure data (OpenFold, MMseqs2, gemmi, Mol*)',
      'Exact metric search (cover trees, k-d trees)',
      'Document AI (LayoutLMv3, EasyOCR)',
      'OpenCV',
    ],
  },
  {
    title: 'Systems and data',
    items: [
      'Python, C++, SQL',
      'FastAPI, Streamlit',
      'Qdrant, LangChain',
      'BigQuery, dbt',
      'Slurm and HPC clusters',
      'Docker, GitHub Actions, Linux',
      'ONNX, OpenVINO',
    ],
  },
];
