import type {AiDetection, GenerateResult} from '@/types';
import {getQualityMeta} from '@/utils/postPolicy';

export const getResultDetections = (result: GenerateResult): AiDetection[] => {
  const detections = result.detections ?? result.aiAnalysis?.detections ?? [];
  return Array.isArray(detections) ? detections : [];
};

export const hasMultipleDetections = (result: GenerateResult): boolean =>
  getResultDetections(result).length > 1;

export const getDetectionName = (detection: AiDetection): string =>
  detection.labelKo ||
  detection.detectedFruitKo ||
  detection.label ||
  detection.detectedFruit ||
  '감지 항목';

export const getDetectionSummary = (detection: AiDetection): string => {
  return getQualityMeta(detection.freshnessLabel).label;
};
