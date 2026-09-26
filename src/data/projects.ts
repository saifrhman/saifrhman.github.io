import type { ProjectEntry } from './types';

/**
 * Selected projects, in display order. Projects with a `detail` object get a
 * page at /projects/<slug>/. Keep claims to what the linked repository shows.
 */
export const projects: ProjectEntry[] = [
  {
    slug: 'f1-ai-copilot',
    title: 'F1 AI Copilot',
    problem:
      'A language model answering from memory can state Formula 1 article numbers, limits and penalties that are not in the regulations, with the same fluency as ones that are.',
    description:
      'Question answering over the six 2026 FIA F1 regulation documents (592 pages, 1,938 indexed passages). Retrieval, generation and indexing are kept apart so that chunking, retrieval depth and citation failures can each be inspected on their own: a retrieval-only endpoint shows what a question gets back, passages below the similarity threshold never reach the model, and the index records a fingerprint of everything that built it.',
    highlight:
      'Grounding is checked after generation rather than only requested in the prompt. Citations must resolve to supplied excerpts, and the rule identifiers and numbers in an answer’s factual sentences must appear in the passages it cites, with numbers compared by value (“80 km/h” matches “80km/h”, “one hundred” matches 100). In two early evaluation runs a forged-excerpt injection led the model to cite “Article Z1.1 [S9]”; the answer was declined because S9 was never a supplied passage.',
    tags: ['RAG', 'Qdrant', 'LangChain', 'FastAPI', 'Streamlit', 'pytest'],
    domain: 'Retrieval-augmented generation',
    year: '2026',
    repo: 'https://github.com/saifrhman/f1-ai-copilot',
    figure: 'retrieval',
    featured: true,
    detail: {
      problem: [
        'A general-purpose model asked about the Formula 1 rules answers from memory, and nothing in a fluent answer distinguishes a real article number or limit from an invented one. The 2026 regulations raise the stakes, because they change a great deal (DRS is gone) and much of their meaning sits in defined terms held in appendices far from the rules that use them.',
        'The aim was not a fluent assistant but one whose failures are visible. Every claim should point to a passage, and when the evidence is not there the system should say so.',
      ],
      system: [
        'Ingestion downloads the current issue of each regulation section from the FIA, validates the files and records their hashes. Running headers and contents pages are removed, and the text is split into 1,000-character chunks with 200 characters of overlap. Each chunk keeps its printed page label and nearest rule heading; the embedded text carries a one-line context header while the stored text stays verbatim.',
        'At query time the question is embedded and matched against a Qdrant index (top 8, cosine threshold 0.30). Passages below the threshold are reported but never shown to the model. Definitions of abbreviations used in the accepted passages are added from a glossary extracted at index time, and the model answers from labelled excerpts S1…Sn at temperature 0, or returns an explicit insufficient-evidence decline.',
        'A deterministic validator then checks the answer, and an optional second model call can flag individual sentences the cited text does not support. The API returns either the answer with its citations and passages, or a decline with a machine-readable reason. Around the regulation QA sit smaller modules for pit strategy, setup search and lap comparison, each labelled in code and UI as a heuristic.',
      ],
      architecture: [
        {
          label: 'Ingest',
          nodes: [
            { title: 'Official PDFs', detail: 'hash manifest, validation' },
            { title: 'Page cleaning', detail: 'headers, contents pages, ligatures' },
            { title: 'Chunking', detail: '1,000 / 200 characters, rule metadata' },
          ],
        },
        {
          label: 'Index',
          nodes: [
            { title: 'Embeddings', detail: 'OpenAI-compatible API, cached' },
            { title: 'Qdrant collection', detail: 'build fingerprint, atomic alias swap' },
            { title: 'Definitions glossary', detail: '541 verbatim definitions' },
          ],
        },
        {
          label: 'Retrieve',
          nodes: [
            { title: 'Dense top-k', detail: 'k = 8' },
            { title: 'Score threshold', detail: '0.30; below it, never sent' },
            { title: 'Definitions', detail: 'for terms in accepted passages' },
          ],
        },
        {
          label: 'Generate',
          nodes: [
            { title: 'Labelled excerpts', detail: 'S1…Sn, escaped' },
            { title: 'Evidence-only prompt', detail: 'temperature 0, explicit decline' },
          ],
        },
        {
          label: 'Validate',
          nodes: [
            { title: 'Citations', detail: 'resolve to retrieved excerpts' },
            { title: 'Rule IDs and numbers', detail: 'must occur in the cited text' },
            { title: 'Answer or decline', detail: 'with a reason code' },
          ],
        },
      ],
      decisions: [
        {
          title: 'Separate the index from everything that changes often',
          body: 'The index stores a fingerprint of its build inputs: document hashes, chunking settings and the embedding model. Changing any of them marks the index stale, and the API refuses queries until it is rebuilt; changing top-k, the threshold, the prompt or the chat model never touches it. Rebuilds write a new collection and swap an alias atomically, so readers never see a half-built index. Tests pin both properties.',
        },
        {
          title: 'Validate after generation',
          body: 'Prompt instructions reduce unsupported citations but do not prevent them. The validator first rejects citations to excerpts that were never supplied, then checks rule identifiers (accepting a parent of a cited rule, B2.3 for B2.3.5, but not invented sub-rules), requires factual statements to carry a citation, and compares numbers as values, including spelled-out numbers and currency amounts. Page and issue references are checked against the passage’s own metadata.',
        },
        {
          title: 'Add definitions rather than more context',
          body: 'One evaluation question failed because the rule said “during a TTCS”, and only Appendix B1 says that a TTCS includes the race. Instead of retrieving more passages, indexing extracts verbatim definitions and adds the relevant ones as citable excerpts, skipping abbreviations so common that they add nothing (“FIA” appears in 41% of chunks).',
        },
        {
          title: 'Keep the threshold conservative',
          body: 'A calibration mode sweeps the similarity threshold using cached embeddings, without calling the chat model. A higher threshold would have declined one more unanswerable question before generation, but on an eight-question sample it sat 0.004 from the weakest answerable one, so the default stayed at 0.30.',
        },
      ],
      evaluation: [
        'A 15-question set covers answerable, paraphrased, cross-document, unanswerable and adversarial questions, plus one question about DRS left for human review. A question passes only if the cited sections match and the expected facts appear both in the answer and in the cited text. With free-tier Nemotron embedding and chat models through OpenRouter, the fourth evaluation run passed all 14 scored questions; a later run exposed a validator gap, which was fixed before the saved outputs were re-scored. For each answerable question, the top-ranked passage came from the page containing the answer.',
        'These are development-set numbers, not a benchmark. The same 15 questions guided the retrieval depth, the prompt, the glossary, the threshold and the validator, so they are not an unbiased estimate; there is no baseline system, and the run results are reported in the repository documentation rather than committed as artefacts. Separately, 1,442 tests pass in CI on Python 3.11 and 3.12. The 239 RAG tests use generated PDFs, real parsing, the real text splitter and an embedded Qdrant, with only the embedding and chat services stubbed.',
      ],
      limitations: [
        'Single-query dense retrieval can miss one side of a comparative question; there is no hybrid search or re-ranking.',
        'The deterministic checks show that citations, rule numbers and figures are traceable, not that each sentence is entailed by its passage. The optional verifier that targets this is off by default and has been tested on one planted sentence.',
        'Sentences that open with an inference marker (“so”, “therefore”, “in summary”) are exempt from the number and citation checks, which leaves a gap an unsupported claim can pass through.',
        'PDF extraction flattens tables and leaves occasional split words.',
        'The similarity threshold is specific to the embedding model it was calibrated on.',
        'The strategy, setup and telemetry modules are heuristics and have not been validated on real race data.',
      ],
    },
    images: [
      {
        src: 'projects/f1-retrieval-scores.png',
        alt: 'Retrieval-only view in the Streamlit client. For the question about the minimum mass of the car in qualifying, all eight retrieved passages are above the 0.30 similarity threshold; the best scores 0.617 and the others between 0.41 and 0.45, shown as horizontal bars with a dashed threshold line.',
        caption:
          'Retrieval-only view over the 2026 index. The top passage (0.617) comes from the page with the answer; the other seven score 0.41 to 0.45. The dashed line is the 0.30 threshold, which removes nothing for this question. No answer model is called on this path.',
      },
    ],
  },
  {
    slug: 'receipt-extraction',
    title: 'Hybrid receipt extraction',
    problem:
      'Receipt datasets label a handful of fields, a useful schema needs many more, and a model trained on rule output inherits the rules’ mistakes.',
    description:
      'EasyOCR, a rule parser and a LayoutLMv3 token-classification pipeline behind one entrypoint, in three modes: rules only, model only and hybrid. SROIE annotates only company, address, date and total, so the other 13 entity types are pseudo-labelled by the rule parser and weighted by source before fine-tuning, and the two extractors are merged field by field at inference.',
    highlight:
      'Labels are weighted by where they came from. Tokens aligned to SROIE’s four annotated fields carry weight 1.0; tokens labelled by the rule parser carry 0.76 to 0.86, depending on entity type. The weights scale each token’s loss, so rule-derived labels pull on the model less than annotated ones without being discarded.',
    tags: ['LayoutLMv3', 'EasyOCR', 'weak supervision', 'PyTorch', 'Transformers'],
    domain: 'Document AI',
    year: '2026',
    repo: 'https://github.com/saifrhman/noise-robust-ocr-pipeline',
    figure: 'receipt',
    featured: true,
    note: 'Methods and tooling; no evaluation results are committed yet.',
    detail: {
      problem: [
        'Extracting structured fields from receipt photos is hard for two separate reasons. OCR is noisy and layouts vary by merchant, and the labels are thin: SROIE (626 training and 347 test receipts) annotates four fields per receipt, while a useful schema covers vendor, invoice metadata, line items, tax, totals and payment.',
        'Rules can fill in the missing fields but are brittle, and a model trained on rule output learns the rules’ errors along with their coverage. The project treats that as a weak-supervision problem.',
      ],
      system: [
        'At inference, EasyOCR produces lines and word tokens. A rule parser extracts fields from the lines; LayoutLMv3 tags the tokens using their text, position and the image, and a decoder turns the tags into fields with per-field confidences. The two results are then fused field by field.',
        'For training, SROIE values are aligned to OCR tokens for four fields, tolerating single-character OCR confusions (0/O, 1/I, 5/S), and the rule parser supplies pseudo-labels for 13 more entity types. BIO sequences are repaired, noisy receipts are excluded, and a custom trainer applies the per-token source weights, with optional focal loss, inverse-frequency class weights and a sampler that favours label-rich receipts.',
      ],
      architecture: [
        {
          label: 'OCR',
          nodes: [
            { title: 'EasyOCR', detail: 'lines and word tokens' },
            { title: 'Reading order', detail: 'sorted by line band, then x' },
          ],
        },
        {
          label: 'Weak labels',
          nodes: [
            { title: 'SROIE alignment', detail: '4 fields, weight 1.0' },
            { title: 'Rule pseudo-labels', detail: '13 entity types, weight 0.76–0.86' },
            { title: 'Receipt filters', detail: 'over-labelled or unlabelled receipts' },
          ],
        },
        {
          label: 'Model',
          nodes: [
            { title: 'LayoutLMv3', detail: 'token classification' },
            { title: 'Weighted loss', detail: 'per-token source weight' },
          ],
        },
        {
          label: 'Fusion',
          nodes: [
            { title: 'Per-field preference', detail: 'model for vendor and date fields' },
            { title: 'Takeover margin', detail: 'for the remaining text fields' },
            { title: 'Consistency check', detail: 'total against item sum' },
          ],
        },
        {
          label: 'Evaluate',
          nodes: [
            { title: 'Three-mode comparison', detail: '4 fields scored against SROIE' },
            { title: 'Promotion check', detail: 'scripted, not yet run' },
          ],
        },
      ],
      decisions: [
        {
          title: 'Weight labels by source instead of trusting them equally',
          body: 'Gold-aligned tokens carry weight 1.0 and rule-derived tokens 0.76 to 0.86, set per entity type (item names lowest). Whole receipts are excluded when more than 45% of their tokens are labelled, when no token could be labelled, or when three or more items were detected but none could be labelled, and each exclusion is logged with its reason.',
        },
        {
          title: 'Decide fusion per field',
          body: 'For fields where layout context matters most (vendor name, address and registration number, invoice type, date and time), the model’s value replaces the rule’s whenever its field confidence reaches 0.75. For the other text fields the model must beat the rule side by a margin, 0.12 by default. Numeric fields stay with the rules unless they are empty, except that the total switches to the model’s value when the rule total disagrees with the sum of the items and the model’s total agrees.',
        },
        {
          title: 'Script the promotion decision',
          body: 'A promotion script compares a candidate checkpoint with the baseline and keeps it experimental when fewer than 25 evaluation samples are shared. It has not been run yet, and its F1 criterion is token-level against weak labels, so it needs an independent metric before its decisions mean much.',
        },
      ],
      evaluation: [
        'The tooling runs all three modes over 18 normalised fields, ranks disagreements and buckets errors. Only company, address, date and total can be scored against the SROIE annotations; the other fields give cross-mode agreement and coverage. No evaluation results are committed yet: the experiment cycle has only been run at smoke-test scale, and the committed default remains the rules-only mode.',
      ],
      limitations: [
        'Token-level scores for 13 of the 17 entity types are measured against the same weak labels used in training, so only the four SROIE fields give an independent check.',
        'Training uses SROIE’s own OCR boxes while inference uses EasyOCR, and the gap between the two has not been measured.',
        'Word tokens inherit their line’s bounding box in both training and inference, so the layout signal is at line granularity.',
        'An older training script selects its checkpoint on the SROIE test split, so a clean test-set comparison needs a baseline retrained with a validation split taken from the training data.',
        'The adaptive image preprocessing behind the repository’s name belongs to an earlier version and is not used by the current pipeline.',
      ],
    },
  },
  {
    slug: 'football-data-platform',
    title: 'Football intelligence platform',
    problem:
      'StatsBomb’s open event data is deeply nested, match-scoped JSON; analysis needs typed, tested tables that can be traced back to the source.',
    description:
      'A bronze, silver and gold pipeline from StatsBomb Open Data to BigQuery. Python ingestion writes raw JSON records to partitioned bronze paths, a normaliser produces nine typed silver tables, and dbt builds five dimensions and four facts covered by 23 schema tests, served through FastAPI and a Streamlit dashboard. It has been run end to end on a bounded five-match sample.',
    highlight:
      'User filters reach BigQuery only as named query parameters. Dataset and table names cannot be parameterised, so the API and the dashboard both check them against a strict identifier pattern before use, and unit tests cover both behaviours.',
    tags: ['BigQuery', 'dbt', 'Python', 'FastAPI', 'Streamlit', 'GitHub Actions'],
    domain: 'Data engineering',
    year: '2026',
    repo: 'https://github.com/saifrhman/football-analytics-platform',
    figure: 'lakehouse',
    featured: true,
    detail: {
      problem: [
        'StatsBomb Open Data publishes competitions, matches, events, lineups and 360 freeze frames as nested JSON, one file per match. It is rich but awkward to query, and notebook analyses quickly lose track of which source file a number came from.',
        'The project is about the engineering around analysis rather than the analysis itself: layered storage, typed loads, tested models and a small serving layer, with a clear record of what is and is not wired up.',
      ],
      system: [
        'Ingestion reads the open-data repository or a local mirror, applies competition, season and match filters before a match limit so local runs stay bounded, and retries transient failures. Events and lineups are required; 360 data is optional and its absence is logged rather than fatal. Everything lands in hive-style bronze paths keyed by match.',
        'A normaliser flattens the bronze JSON into nine silver tables (competitions, matches, teams, players, events, shots, passes, pressures and an optional 360 table, empty for the sampled season), upserting team and player dimensions from matches, lineups and events. The loader writes them to BigQuery with explicit schemas rather than autodetection, so type drift fails at load time. dbt staging views and gold marts sit on top, with sources and datasets taken from environment variables.',
      ],
      architecture: [
        {
          label: 'Bronze',
          nodes: [
            { title: 'StatsBomb client', detail: 'filters, match limit, retries' },
            { title: 'Raw JSON', detail: 'partitioned by match_id' },
          ],
        },
        {
          label: 'Silver',
          nodes: [
            { title: 'Normaliser', detail: '9 typed tables' },
            { title: 'BigQuery load', detail: 'explicit schemas' },
          ],
        },
        {
          label: 'Gold',
          nodes: [
            { title: 'dbt marts', detail: '5 dimensions, 4 facts' },
            { title: 'Schema tests', detail: '14 not-null, 8 unique, 1 relationship' },
          ],
        },
        {
          label: 'Serve',
          nodes: [
            { title: 'FastAPI', detail: '8 read endpoints' },
            { title: 'Streamlit', detail: 'xG, passes, shots, pressures' },
          ],
        },
      ],
      decisions: [
        {
          title: 'Filter, then limit',
          body: 'The match limit applies after the competition, season and match filters, so a development run touches a known, small set of matches instead of whatever happens to be listed first.',
        },
        {
          title: 'Explicit schemas at the warehouse boundary',
          body: 'Silver tables load with declared types and required keys. A malformed field fails the load instead of silently becoming a string column that breaks a model three steps later.',
        },
        {
          title: 'Parameterised queries only',
          body: 'Filters are passed to BigQuery as named parameters. Identifiers cannot be, so dataset and table names are validated against a strict pattern before they are interpolated, in both the API and the dashboard, and both execute queries through the same repository class.',
        },
        {
          title: 'Disable rather than half-build',
          body: 'Transfermarkt parsers exist and are tested against saved fixtures, but the dbt models that would depend on that data are explicitly disabled rather than left to fail.',
        },
      ],
      evaluation: [
        '39 unit tests, ruff and dbt parse run in GitHub Actions, and recent runs pass. The 23 dbt tests passed against BigQuery on the five-match sample (Premier League 2003/04, about 17,000 events).',
      ],
      limitations: [
        'Only a five-match sample has been processed so far.',
        'Most gold models are thin pass-throughs; the modelling work happens in the Python normaliser.',
        'xG values are StatsBomb’s own; no xG model was trained.',
        'Airflow, Terraform and Docker Compose are included as scaffolding only, and CI parses the dbt project rather than running its tests against a warehouse.',
      ],
    },
  },
  {
    slug: 'tacticlens',
    title: 'TacticLens',
    problem:
      'Analysts looking for how an opponent behaves in situations like a given one search video by hand, using event tags that describe what happened rather than where the players were.',
    description:
      'A research programme on structural retrieval over football tracking data. The aim is to find passages of play whose multi-player movement over a short window resembles a chosen one, and to let an analyst’s relevance judgements re-rank the results. The public repository holds the research design (questions, hypotheses, baselines and rejection criteria written down in advance) and the data foundations built so far. The retrieval model, vector index and feedback loop are specified but not yet built.',
    highlight:
      'Absence is typed rather than null. Each player observation carries one of seven statuses (observed, estimated, interpolated, off-camera, provider-missing, unobserved, not applicable), and each status either requires or forbids coordinates, so that later robustness work can tell an off-camera player from a provider gap. Changing ends is a 180-degree rotation rather than a mirror, and coordinates are never clipped, because positional noise is itself something to study.',
    tags: ['tracking data', 'research design', 'Pydantic', 'FastAPI', 'object storage'],
    domain: 'Spatiotemporal retrieval',
    year: '2026',
    repo: 'https://github.com/saifrhman/tacticlens',
    figure: 'tactical',
    featured: false,
    note: 'Foundation stage. An original commercial implementation associated with this work was developed under contractual confidentiality obligations; the public repository is a separate, deliberately limited reference implementation and does not contain that code.',
  },
  {
    slug: 'closed-loop-bayesian-optimisation',
    title: 'Closed-loop Bayesian optimisation',
    problem: 'With a fixed budget of expensive evaluations, which configuration should be tried next?',
    description:
      'A propose, evaluate and update loop that tunes four random-forest hyperparameters with a Gaussian-process surrogate and Expected Improvement in BoTorch, compared with random search at the same budget of 33 evaluations, each scored by 5-fold cross-validation.',
    highlight:
      'Both methods start from the same eight random configurations, so the curves separate only after BO’s first proposal. In the committed run, BO’s first proposal already matched random search’s final best, it moved ahead after 11 evaluations and then plateaued. With one seed and a margin of about 0.005 in accuracy, that is illustrative rather than conclusive.',
    tags: ['BoTorch', 'GPyTorch', 'Gaussian processes', 'scikit-learn'],
    domain: 'Probabilistic ML',
    year: '2026',
    repo: 'https://github.com/saifrhman/closed-loop-hpo-botorch',
    figure: 'bayesopt',
    featured: false,
  },
];
