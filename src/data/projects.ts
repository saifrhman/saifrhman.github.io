import type { ProjectEntry } from './types';

/**
 * Selected projects, in display order. Projects with a `detail` object get a
 * page at /projects/<slug>/. Keep claims to what the linked repository shows.
 */
export const projects: ProjectEntry[] = [
  {
    slug: 'f1-ai-copilot',
    seoDescription: 'Retrieval-augmented QA over the 2026 FIA F1 regulations (592 pages) with Qdrant; citations, rule numbers and figures are checked after generation.',
    title: 'F1 AI Copilot',
    problem:
      'A language model answering from memory can state Formula 1 article numbers, limits and penalties that are not in the regulations, with the same fluency as ones that are.',
    description:
      'Question answering over the six 2026 FIA F1 regulation documents (592 pages, 1,938 indexed passages). Indexing, retrieval and generation are kept apart so that each kind of failure (chunking, retrieval depth, citation) can be inspected on its own. A retrieval-only endpoint shows what a question gets back, passages below the similarity threshold never reach the model, and the index records a fingerprint of everything that built it.',
    cv: 'Question answering over the 2026 FIA F1 regulations (592 pages) that checks each answer’s citations, rule identifiers and numbers against the cited passages (inference-marked sentences are exempt from the number check) and declines when they do not match.',
    highlight:
      'Grounding is checked after generation rather than only requested in the prompt. Citations must resolve to supplied excerpts, and the rule identifiers and numbers in an answer must appear in the passages it cites, with numbers compared by value (“80 km/h” matches “80km/h”, “one hundred” matches 100); sentences that open with an inference marker such as “so” or “therefore” are exempt from the number check. In two early evaluation runs, an adversarial test that injected a forged excerpt led the model to cite “Article Z1.1 [S9]”; the answer was declined because S9 was never a supplied passage.',
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
          body: 'Prompt instructions reduce unsupported citations but do not prevent them. The validator first rejects citations to excerpts that were never supplied, then checks rule identifiers (accepting a parent of a cited rule, B2.3 for B2.3.5, but not invented sub-rules), requires factual statements to carry a citation (sentences that open with an inference marker are exempt from this and from the number check), and compares numbers as values, including spelled-out numbers and currency amounts. Page and issue references are checked against the passage’s own metadata.',
        },
        {
          title: 'Add definitions rather than more context',
          body: 'One evaluation question failed because the rule said “during a TTCS”, and only Appendix B1 says that a TTCS includes the race. Instead of retrieving more passages, indexing extracts verbatim definitions and adds the relevant ones as citable excerpts, skipping abbreviations so common that they add nothing (“FIA” appears in 41% of chunks).',
        },
        {
          title: 'Leave the threshold at 0.30',
          body: 'A calibration mode sweeps the similarity threshold using cached embeddings, without calling the chat model. A higher threshold would have declined one more unanswerable question before generation, but on an eight-question sample it was within 0.004 of the score of the weakest answerable question, so the default stayed at 0.30.',
        },
      ],
      evaluation: [
        'A 15-question set covers answerable, paraphrased, cross-document, unanswerable and adversarial questions, plus one question about DRS left for human review. A question passes only if the cited sections match and the expected facts appear both in the answer and in the cited text. With free-tier Nemotron embedding and chat models through OpenRouter, five evaluation runs passed 12, 13, 13, 14 and 13 of the 14 scored questions; run 4’s 14 came after two scoring fixes that were not answer errors (the fact matcher missed a non-breaking hyphen, and the validator did not yet accept a trailing sources block). The fifth run’s failure was a validator gap rather than a wrong answer: an inference marker inside parentheses was not recognised. After that fix the saved outputs of all five runs were re-validated; the fifth run then passed all 14 and no earlier verdict changed. For each answerable question, the top-ranked passage came from the page containing the answer.',
        'These are development-set numbers, not a benchmark. The same 15 questions guided the retrieval depth, the prompt, the glossary, the threshold and the validator, so they are not an unbiased estimate; there is no baseline system, and the run results are reported in the repository documentation rather than committed as artefacts. Separately, 1,442 tests pass in CI on Python 3.11 and 3.12. The 239 RAG tests use generated PDFs, real parsing, the real text splitter and an embedded Qdrant, with only the embedding and chat services stubbed.',
      ],
      limitations: [
        'Single-query dense retrieval can miss one side of a comparative question; there is no hybrid search or re-ranking.',
        'The deterministic checks show that citations, rule numbers and figures are traceable, not that each sentence is entailed by its passage. The optional verifier that targets this is off by default and has been tested on one planted sentence.',
        'Sentences that open with an inference marker (“so”, “therefore”, “in summary”) are exempt from the number check and from the requirement to carry a citation, which leaves a gap an unsupported claim can pass through.',
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
    slug: 'chest-xray-classification',
    seoDescription: 'Group coursework: chest X-ray classification comparing a small CNN, EfficientNet-B3, Swin V2-S and MaxViT-T under 5-fold CV. Not clinically validated.',
    title: 'Chest X-ray classification',
    problem:
      'With about 3,500 labelled chest X-rays, is it better to train a small network from scratch or to adapt a large ImageNet model, and how far can the headline score be trusted?',
    description:
      'A four-person group assignment for COMP534 Applied AI at the University of Liverpool. On a course-provided set of 3,475 chest X-rays labelled Normal, Opacity or viral Pneumonia, the team compared a custom 116,931-parameter CNN with EfficientNet-B3, Swin V2-S and MaxViT-T, each trained from scratch, as a frozen feature extractor and fine-tuned, under stratified 5-fold cross-validation. The selected model, a fine-tuned Swin V2-S, reached a macro-F1 of 0.948 and Cohen’s κ of 0.92 on a 695-image held-out split.',
    cv: 'Group coursework (team of four): three-class chest X-ray classification comparing a 117K-parameter CNN with EfficientNet-B3, Swin V2-S and MaxViT-T under three training strategies; test macro-F1 0.948 from a single run, not clinically validated.',
    highlight:
      'Pretraining mattered more than architecture. Trained from scratch on the same 20-epoch budget, Swin V2-S failed to train (cross-validation macro-F1 0.29; two of the five folds predicted a single class) and MaxViT-T ranged from 0.32 to 0.86 across folds, while the 116,931-parameter custom CNN reached 0.87. Starting from ImageNet weights and fine-tuned, all three pretrained models scored between 0.94 and 0.95.',
    tags: ['PyTorch', 'medical imaging', 'transfer learning', 'Swin V2', 'cross-validation'],
    domain: 'Medical imaging',
    year: '2026',
    figure: 'xray',
    featured: true,
    note: 'Group coursework for COMP534 Applied AI (MSc, University of Liverpool) with Ainur Smailova, Nattanan Sottivorakun and Laura Valentina Sierra Peña. Results come from a single run and are not clinically validated. The code sits in a course repository alongside assessment materials, so it is not linked.',
    detail: {
      problem: [
        'The task was to sort chest X-rays into three classes (Normal, lung Opacity and viral Pneumonia) using 3,475 images supplied by the course. That is small for modern vision models, so the choice between a compact network trained from scratch and a large pretrained one is a real question rather than a formality.',
        'This was a four-person group assignment for COMP534 Applied AI (MSc Data Science and Artificial Intelligence, University of Liverpool), with Ainur Smailova, Nattanan Sottivorakun and Laura Valentina Sierra Peña. What follows describes the team’s work; individual contributions are not separated.',
      ],
      system: [
        'Images are resized to each model’s input resolution (300 pixels for EfficientNet-B3 and the custom CNN, 256 for Swin V2-S, 224 for MaxViT-T), contrast-equalised with CLAHE and normalised with ImageNet statistics. Training adds horizontal flips, small rotations, brightness and contrast changes, elastic deformation and Gaussian noise; with probability 0.5 a batch is mixed with MixUp or CutMix, and unmixed batches use label smoothing of 0.1.',
        'A stratified 80/20 split sets aside 695 test images. On the remaining 2,780, ten configurations are scored by stratified 5-fold cross-validation: the custom CNN from scratch, and EfficientNet-B3, Swin V2-S and MaxViT-T each trained from scratch, as a frozen feature extractor with a new head, and fine-tuned with the early stages frozen and the later ones trained at a tenth of the head’s learning rate. Every run uses AdamW, cosine annealing over at most 20 epochs and early stopping on validation loss.',
        'The configuration with the best mean validation macro-F1, fine-tuned Swin V2-S, is retrained on 2,502 images with a 278-image holdout for early stopping, then evaluated on the test split with five-pass test-time augmentation (the image as is, flipped, rotated by ±5° and with a mild brightness and contrast change).',
      ],
      architecture: [
        {
          label: 'Data',
          nodes: [
            { title: '3,475 chest X-rays', detail: 'Normal 1,250 · Opacity 1,125 · Pneumonia 1,100' },
            { title: 'Stratified split', detail: '2,780 for model selection, 695 held out' },
          ],
        },
        {
          label: 'Preprocess',
          nodes: [
            { title: 'Resize and CLAHE', detail: '224–300 px per model; clip 2.0, 8×8 tiles' },
            { title: 'Augmentation', detail: 'flips, rotation, elastic, noise, MixUp/CutMix' },
            { title: 'Balanced sampler', detail: 'rebuilt from each fold’s training labels' },
          ],
        },
        {
          label: 'Models',
          nodes: [
            { title: 'Custom CNN', detail: 'depthwise-separable, 116,931 parameters' },
            { title: 'EfficientNet-B3', detail: '10.7M parameters' },
            { title: 'Swin V2-S', detail: '49.0M parameters' },
            { title: 'MaxViT-T', detail: '30.4M parameters' },
          ],
        },
        {
          label: 'Select',
          nodes: [
            { title: 'Stratified 5-fold CV', detail: '10 configurations, mean macro-F1' },
            { title: 'Fine-tuned Swin V2-S', detail: '0.953 ± 0.011' },
          ],
        },
        {
          label: 'Test',
          nodes: [
            { title: 'Retrain', detail: '2,502 train, 278 early-stopping holdout' },
            { title: 'Five-pass TTA', detail: '695 held-out images' },
            { title: 'Macro-F1 0.948', detail: 'Cohen’s κ 0.920' },
          ],
        },
      ],
      decisions: [
        {
          title: 'Compare training strategies, not only architectures',
          body: 'Each pretrained architecture was run three ways, so the effect of ImageNet initialisation could be separated from the architecture itself. That is where the clearest result came from: from scratch, both transformers were unreliable at this data size, while fine-tuned they were the two strongest models in cross-validation.',
        },
        {
          title: 'Keep a small network as a reference point',
          body: 'The custom network uses depthwise-separable convolutions and has 116,931 parameters, about 1% of EfficientNet-B3’s 10.7 million. Trained from scratch it reached a cross-validation macro-F1 of 0.869, against 0.903 for EfficientNet-B3 trained from scratch, which puts the gains from size and from pretraining in proportion.',
        },
        {
          title: 'Balance batches with a sampler, not loss weights',
          body: 'A weighted random sampler, rebuilt from each fold’s own training labels so that the validation fold never informs it, gives batches roughly equal class counts. Class weights in the loss were left out, since using both would correct for the imbalance twice.',
        },
        {
          title: 'Select on macro-F1 rather than accuracy',
          body: 'The classes are only mildly imbalanced (1.14 : 1), but accuracy still lets the largest class dominate, so configurations were ranked by mean validation macro-F1, which weights the three classes equally. The test evaluation also reports Cohen’s κ, MCC, log loss and balanced accuracy.',
        },
      ],
      evaluation: [
        'On the 695 test images the fine-tuned Swin V2-S reached a macro-F1 of 0.948, Cohen’s κ and MCC of 0.920, and balanced accuracy of 0.948, with per-class recall of 0.932 for Normal, 0.924 for Opacity and 0.986 for Pneumonia. Of its 37 errors, 32 were confusions between Normal and Opacity (15 one way, 17 the other); three Pneumonia images were predicted Normal and two Normal images Pneumonia.',
        'Three qualifications apply. The test split was not untouched: an earlier version of the notebook had already evaluated an EfficientNet-B3 model on it (macro-F1 0.9478), and Swin V2-S’s lead in cross-validation did not show up there (0.9479). The cross-validation scores are optimistic, because each fold is scored at its best validation epoch on the same fold that drives early stopping. And every configuration was run once, with fixed seeds and no repeats.',
      ],
      limitations: [
        'The Pneumonia class very likely differs from the other two in patient age and image source. The dataset’s origin is not documented, but its classes and 299 × 299 images match a public COVID-19 chest X-ray collection whose viral pneumonia images are paediatric, and sampled Pneumonia images here are visibly of children while most Normal and Opacity images are of adults. The near-perfect Pneumonia score may partly reflect that difference, and it was not controlled for.',
        'Nothing here is clinically validated. There is no external test set, and no clinician reviewed the predictions or the Grad-CAM and HiResCAM heatmaps the notebook produces.',
        'All from-scratch runs used one learning rate (10⁻³) and at most 20 epochs, so the transformers’ failure from scratch may reflect those settings as much as the size of the dataset.',
        'One run per configuration: the spread across folds is the only estimate of variance.',
      ],
    },
  },
  {
    slug: 'receipt-extraction',
    seoDescription: 'Receipt field extraction combining EasyOCR, a rule parser and LayoutLMv3, with SROIE and rule-derived pseudo-labels weighted by source.',
    title: 'Hybrid receipt extraction',
    problem:
      'Receipt datasets label only a handful of fields, and a useful schema needs many more. Rules can fill the gap, but a model trained on rule output inherits the rules’ mistakes.',
    description:
      'A single entry point combines EasyOCR, a rule parser and a LayoutLMv3 token classifier, and runs in three modes: rules only, model only or hybrid. SROIE annotates only company, address, date and total, so the rule parser pseudo-labels the other 13 entity types, weighted by source, before fine-tuning; at inference the two extractors are merged field by field.',
    cv: 'Receipt field extraction combining EasyOCR, a rule parser and LayoutLMv3 trained on source-weighted weak labels; no evaluation results committed yet.',
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
        'Extracting structured fields from receipt photos is hard for two separate reasons. The input is messy: OCR is noisy and layouts vary by merchant. And the labels are thin: SROIE (626 training and 347 test receipts) annotates four fields per receipt, while a useful schema covers vendor, invoice metadata, line items, tax, totals and payment.',
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
    seoDescription: 'StatsBomb open data to BigQuery: a bronze/silver/gold pipeline with dbt models and 23 schema tests, served via FastAPI and a Streamlit dashboard.',
    title: 'Football intelligence platform',
    problem:
      'StatsBomb’s open event data is deeply nested, match-scoped JSON; analysis needs typed, tested tables that can be traced back to the source.',
    description:
      'A layered (bronze, silver, gold) pipeline from StatsBomb Open Data to BigQuery. Python ingestion writes raw JSON to partitioned bronze paths, a normaliser produces nine typed silver tables, and dbt builds five dimensions and four facts covered by 23 schema tests. FastAPI and a Streamlit dashboard serve the results. It has been run end to end on a bounded five-match sample.',
    cv: 'Bronze/silver/gold pipeline from StatsBomb Open Data to BigQuery with dbt models, 23 schema tests and a FastAPI/Streamlit serving layer; run end to end on a five-match sample.',
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
          body: 'Silver tables load with declared types and required keys, so a type mismatch fails the load instead of silently becoming a string column that breaks a model three steps later. A missing optional field still loads as null.',
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
        'GitHub Actions runs 39 unit tests, ruff and dbt parse, and recent runs pass. The 23 dbt tests passed against BigQuery on the five-match sample (Premier League 2003/04, about 17,000 events).',
      ],
      limitations: [
        'Only a five-match sample has been processed so far.',
        'In the sample run, dim_matches.competition_id and season_id are null for all five matches: the normaliser reads them from the top level of each match record, where StatsBomb nests them, and no schema test covers those columns.',
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
      'To see how an opponent behaves in situations like a given one, analysts search video by hand, using event tags that record what happened rather than where the players were.',
    description:
      'A research project on structural retrieval over football tracking data. The aim is to find passages of play whose multi-player movement over a short window resembles a chosen one, and to let an analyst’s relevance judgements re-rank the results. The public repository holds the research design (questions, hypotheses, baselines and rejection criteria written down in advance) and the data foundations built so far. The retrieval model, vector index and feedback loop are specified but not yet built.',
    cv: 'Research design and data foundations for structural retrieval over football tracking data; retrieval model not yet built.',
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
    cv: 'Gaussian-process Bayesian optimisation in BoTorch compared with random search for random-forest tuning (33 evaluations, single seed).',
    highlight:
      'Both methods start from the same eight random configurations, so the curves separate only after BO’s first proposal. In the committed run, that first proposal already matched random search’s final best; BO moved ahead at evaluation 11, improved again at evaluation 14 and then plateaued. With one seed and a margin of about 0.005 in accuracy, that is illustrative rather than conclusive.',
    tags: ['BoTorch', 'GPyTorch', 'Gaussian processes', 'scikit-learn'],
    domain: 'Probabilistic ML',
    year: '2026',
    repo: 'https://github.com/saifrhman/closed-loop-hpo-botorch',
    figure: 'bayesopt',
    featured: false,
  },
];
