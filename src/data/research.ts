import type { ResearchEntry } from './types';

/**
 * Research lines, in display order. Status and venue rules live in
 * src/lib/status.ts and are enforced by tests: a target venue is shown as
 * "Target: …", and `accepted`/`published` need a public evidence URL.
 */
export const research: ResearchEntry[] = [
  {
    slug: 'geometry-evidence',
    title: 'Evidence and uncertainty in geometry foundation models',
    shortTitle: 'Geometry foundation models',
    area: 'Computer vision · 3D/4D geometry',
    status: 'in-progress',
    statusNote: 'First-author manuscript in development',
    venue: {
      relation: 'target',
      name: 'CVPR',
      year: 2027,
      fullName: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition',
    },
    year: '2026–present',
    question:
      'When a feed-forward 3D/4D reconstruction model gives a confident answer, is that answer supported by the geometry in its input or by a learned prior that merely looks plausible? And could the model’s uncertainty tell the two apart?',
    summary:
      'Models in the DUSt3R and VGGT line, and newer 4D reconstructors such as Any4D, 4RC and D4RT, recover depth, camera motion and scene dynamics in a single forward pass. They always return an answer, including where the images do not determine it, as in the classical scale, depth and velocity ambiguity of a moving object filmed from a moving camera. Accuracy benchmarks average over well-posed and ill-posed inputs, so they cannot show which of the two a model is doing.',
    body: [
      'The project builds a controlled synthetic setting in which the geometric information available about a specific physical quantity can be varied continuously, from none to well-conditioned, with a classical maximum-likelihood estimator as the reference for what that information allows. Model error is then read as a response curve over conditioning rather than as a single average. An arm that supplies ground-truth camera poses separates failures of camera estimation from failures to use evidence that is present, and a null control changes the images without adding information.',
      'The second strand concerns uncertainty: whether amortised posteriors or calibrated intervals over geometry can flag the predictions an input does not support, judged by calibration and coverage, including under distribution shift.',
    ],
    methods: [
      'Synthetic benchmark with an exact ambiguity endpoint and continuously restored conditioning',
      'Information-based conditioning measure, checked against Monte Carlo maximum likelihood',
      'Classical trajectory-geometry estimator as an external reference',
      'Ground-truth camera-pose intervention and null-control perturbations',
      'Held-out scenes locked before model development and evaluated once',
      'Calibration and coverage analysis of predicted uncertainty',
    ],
    concepts: [
      'multi-view geometry',
      'identifiability and conditioning',
      'Fisher information',
      'uncertainty estimation',
      'amortised posteriors',
      'calibration and coverage',
      'out-of-distribution reliability',
    ],
    links: [],
    figure: 'geometry',
  },
  {
    slug: 'peer-reward-misalignment',
    title: 'Peer-reward misalignment in multi-agent LLMs',
    shortTitle: 'Multi-agent wireheading',
    area: 'AI safety · multi-agent RL',
    status: 'under-review',
    venue: { relation: 'submitted', name: 'a NeurIPS 2026 workshop' },
    year: '2026',
    question:
      'If two language-model agents grade each other and each is trained on the grade its peer assigns, is giving the solving and grading roles to different models enough to keep the training signal honest?',
    summary:
      'A model rewarded by its own evaluation can learn to inflate that evaluation instead of doing the task, a form of wireheading (Africa and Ting, 2025). This study moves the evaluator to a second agent. Two LoRA policies share a frozen 7–9B base model; each solves a different task instance and grades the other’s answer. Training runs in two matched conditions: the reward is the peer’s grade, or the reward is the external task metric while peer grading still takes place.',
    body: [
      'The grid covers three base models (Llama-3.1-8B, Gemma-2-9B, Mistral-7B), six tasks and two optimisers (REINFORCE and PPO), with one seed per configuration. In most matched pairs, external task performance was lower when the reward was the peer’s grade, and the coupled–decoupled difference was driven more by degraded task performance than by more generous grading. The gap between peer score and metric was concentrated in summarisation, where much of it existed before training. Part of the difference is expected by construction, since the decoupled arm optimises the metric being reported, and performance is measured on the training pool rather than on held-out data. The paper claims neither collusion nor reciprocity as the mechanism.',
      'A short game-theoretic section treats the setting as a two-agent partially observable stochastic game and gives sufficient conditions for the reward channel to be fully decoupled from peer evaluation.',
    ],
    role:
      'I wrote the single-agent RL training loop (REINFORCE with a moving-average baseline) that the two-agent trainer builds on, and produced the single-agent replication figure. In follow-up work I audited how policy-gradient credit reaches the grading tokens and designed the missing controls as a reward-topology comparison (objective reward, a frozen judge, a four-agent cycle, reciprocal pairs); it has not been run yet.',
    collaborators: 'Four-person team; author list withheld during anonymous review',
    methods: [
      'Two LoRA adapters on a shared frozen, 4-bit quantised base model',
      'Matched reward-coupled and reward-decoupled arms in which grading still happens',
      'REINFORCE with a moving-average baseline, and episode-level PPO',
      'Peer–objective gap and coupling effect, split into grading and task terms',
      'Exact sign tests over the fixed configuration grid',
      'Two-agent partially observable stochastic game formulation',
    ],
    concepts: [
      'wireheading',
      'reward hacking',
      'LLM-as-judge rewards',
      'scalable oversight',
      'multi-agent RL',
      'policy-gradient credit assignment',
      'evaluator–metric divergence',
    ],
    links: [],
    figure: 'wireheading',
  },
  {
    slug: 'pdbclean',
    title: 'Beyond AlphaFold: Filling the Blind Spots in Protein Structure Prediction',
    shortTitle: 'Beyond AlphaFold / PDBClean',
    area: 'Scientific ML · structural biology',
    status: 'dissertation',
    statusNote: 'OpenFold retraining in progress',
    year: '2026',
    question:
      'Structure predictors such as AlphaFold2 and OpenFold are trained on the Protein Data Bank, where redundancy is usually controlled by sequence identity. What changes when redundancy is measured on backbone geometry instead, exactly and across the whole archive?',
    summary:
      'PDBClean takes a fixed PDB snapshot (1 January 2026) through six recorded cleaning rules and a geometric validation gate, then computes the complete Backbone Rigid Invariant (BRI; Anosova et al., 2025) for each of 578,524 eligible chains. BRI describes an ordered N–Cα–C backbone in local residue frames, and two backbones have equal invariants exactly when a rigid motion maps one onto the other, so a distance between invariants is a distance between shapes rather than between sequences.',
    body: [
      'Near-duplicates are chains within 0.010 Å of each other in L∞ distance between invariants. The search partitions chains by length, prunes with a nine-dimensional averaged invariant that provably never exceeds the full distance, so the prefilter cannot lose a pair, and resolves the candidates with an exact compressed cover tree whose output matched an exhaustive comparison of the same candidates pair for pair (1,072,751 qualifying pairs). Because closeness under a threshold is not transitive, each of the 78,754 removals rests on a direct edge to a deterministically ranked representative, and the manifests record every decision with its distance. 499,770 chains are retained, and a full re-run from the same snapshot reproduced the release exactly.',
      'Compared with MMseqs2 clustering on the same population, the two criteria turn out to be nested rather than complementary: 99.5% of geometric removals are sequence-identical to their representative, while keeping one chain per sequence removes a further 357,714 chains that differ measurably in shape. The resulting 142,056-chain population has been converted into OpenFold inputs with freshly generated MSAs, and from-scratch retraining on it is in progress. No claim about prediction accuracy is made until it finishes.',
    ],
    role:
      'Sole author of the dissertation, supervised by Dr Olga Anosova (University of Liverpool). The invariant, the cleaning protocol and the multi-stage search strategy come from earlier BRI work on the PDB, and the OpenFold scripts started from a predecessor project. I re-implemented and scaled that protocol, implemented the compressed cover tree, and added the direct-edge removal policy, the provenance and validation layers, the sequence-redundancy comparison and the OpenFold data projection.',
    methods: [
      'Fixed PDB snapshot with a re-verified provenance manifest',
      'Six numbered cleaning rules, with every rejection recorded',
      'Complete BRI per chain, canonicalised once',
      'Length partition, lower-bound prefilter and exact compressed cover tree for L∞ radius search',
      'Cover-tree output checked pair for pair against an exhaustive comparison; full re-run reproduced exactly',
      'Direct-edge representative selection on a non-transitive neighbourhood graph',
      'MMseqs2 sequence clustering on the same population for comparison',
      'OpenFold 2.2 data preparation and from-scratch training under Slurm',
    ],
    concepts: [
      'Protein Data Bank',
      'AlphaFold / OpenFold',
      'dataset curation',
      'structural redundancy',
      'complete invariants',
      'metric search',
      'reproducibility',
      'HPC / Slurm',
    ],
    links: [
      {
        label: 'Code',
        href: 'https://github.com/saifrhman/702_BeyondAF',
        description: 'PDBClean repository on GitHub',
      },
    ],
    figure: 'backbone',
  },
  {
    slug: 'mangrove-review',
    title:
      'Geographical Data and Computational Tools for Determining Restoration Priorities in Mangrove Ecosystems: A Scoping Review',
    shortTitle: 'AI for mangrove conservation',
    area: 'Remote sensing · environmental ML',
    status: 'in-preparation',
    statusNote: 'Scoping review; began as MSc group coursework',
    year: '2025–2026',
    question:
      'Which remote-sensing data and machine-learning methods are used to decide where mangrove restoration is needed, how are they evaluated, and do they hold up outside the region they were developed in?',
    summary:
      'A five-author scoping review following PRISMA-ScR guidance. Of 128 records retrieved from five sources, 99 were screened after duplicated publisher entries were removed, 85 full texts were assessed and 24 studies were included. The review organises the evidence by sensing modality (optical, SAR, LiDAR, hyperspectral, thermal, UAV), model family, evaluation practice and application.',
    body: [
      'Most of the included work is single-region and single-modality. Models are usually validated on hold-out data from the same site, and explicit cross-region transfer is rare. The review sets out five gaps: regional bias, the lack of a fused multimodal representation, CNN weakness on small or fragmented patches, poor observation of intertidal and submerged zones, and little field validation, and it points toward multimodal models evaluated under explicit domain shift.',
      'This is a literature review rather than a software project; no model is proposed or trained.',
    ],
    role:
      'One of five co-authors, listed alphabetically by surname. I restructured the manuscript and drafted large parts of the sections on data sources, sensing modalities, computational methods and future work.',
    collaborators: 'Yan-Yu Lin, Pablo Ramos-Henao, Laura Valentina Sierra, Ainur Smailova',
    methods: [
      'Scoping review following PRISMA-ScR guidance',
      'Search across SpringerLink, IEEE Xplore, EBSCO and Scopus (Nature results removed as duplicates)',
      'Title and abstract screening divided among reviewers, then full-text assessment',
      'Synthesis by sensing modality, model family, evaluation practice and application',
      'Research-gap analysis',
    ],
    concepts: [
      'remote sensing',
      'mangrove mapping',
      'above-ground biomass',
      'SAR and LiDAR',
      'domain shift',
      'cross-region transfer',
      'multimodal fusion',
    ],
    links: [],
    figure: 'mangrove',
  },
];
