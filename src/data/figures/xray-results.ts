/**
 * Results of the COMP534 chest X-ray group assignment, copied from the executed
 * outputs of the submitted notebook (model-selection summary and final test
 * evaluation). One run per configuration; CV is stratified 5-fold on 2,780
 * images, the test split has 695.
 */
export type Strategy = 'scratch' | 'frozen' | 'finetune';

export interface CvResult {
  model: string;
  strategy: Strategy;
  mean: number;
  sd: number;
}

export const XRAY_CV: readonly CvResult[] = [
  { model: 'Custom CNN', strategy: 'scratch', mean: 0.8694, sd: 0.0089 },
  { model: 'EfficientNet-B3', strategy: 'scratch', mean: 0.9026, sd: 0.0092 },
  { model: 'EfficientNet-B3', strategy: 'frozen', mean: 0.8856, sd: 0.0044 },
  { model: 'EfficientNet-B3', strategy: 'finetune', mean: 0.9379, sd: 0.0064 },
  { model: 'Swin V2-S', strategy: 'scratch', mean: 0.2924, sd: 0.0979 },
  { model: 'Swin V2-S', strategy: 'frozen', mean: 0.8895, sd: 0.0084 },
  { model: 'Swin V2-S', strategy: 'finetune', mean: 0.9534, sd: 0.0106 },
  { model: 'MaxViT-T', strategy: 'scratch', mean: 0.6056, sd: 0.2328 },
  { model: 'MaxViT-T', strategy: 'frozen', mean: 0.8865, sd: 0.0048 },
  { model: 'MaxViT-T', strategy: 'finetune', mean: 0.9431, sd: 0.0095 },
];

export const XRAY_CLASSES = ['Normal', 'Opacity', 'Pneumonia'] as const;

/** Test-set confusion matrix of the fine-tuned Swin V2-S; rows are true classes. */
export const XRAY_CONFUSION: readonly (readonly number[])[] = [
  [233, 15, 2],
  [17, 208, 0],
  [3, 0, 217],
];

export const XRAY_TEST = { macroF1: 0.9479, kappa: 0.92, n: 695 } as const;
