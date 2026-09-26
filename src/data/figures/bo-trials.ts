/**
 * Per-trial 5-fold CV accuracy from the committed results of
 * github.com/saifrhman/closed-loop-hpo-botorch (results/trials_botorch_bo.csv
 * and results/trials_random.csv). Single seed; the first 8 trials are the
 * shared initial design. Regenerate from those CSVs rather than editing by hand.
 */
export const BO_INITIAL_DESIGN = 8;

export const BO_SCORES: readonly number[] = [0.947306, 0.943798, 0.952569, 0.954324, 0.949061, 0.954324, 0.950815, 0.950815, 0.956078, 0.952569, 0.957833, 0.957833, 0.952569, 0.961341, 0.952569, 0.952569, 0.954324, 0.956078, 0.949061, 0.954324, 0.956078, 0.945552, 0.952569, 0.956094, 0.959587, 0.957833, 0.956078, 0.957833, 0.952569, 0.959587, 0.961357, 0.954324, 0.957848];
export const RANDOM_SCORES: readonly number[] = [0.947306, 0.943798, 0.952569, 0.954324, 0.949061, 0.954324, 0.950815, 0.950815, 0.947306, 0.949061, 0.949061, 0.950815, 0.949061, 0.952569, 0.952569, 0.954324, 0.949061, 0.947306, 0.949045, 0.954324, 0.950815, 0.954324, 0.942043, 0.952569, 0.954324, 0.945552, 0.949061, 0.954324, 0.950815, 0.945552, 0.950815, 0.956078, 0.940289];
