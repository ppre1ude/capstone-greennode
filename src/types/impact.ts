export type ImpactSummaryPeriod = 'month' | 'all';

export interface ImpactSummary {
  totalShared?: number;
  totalReceived?: number;
  completedShares: number;
  estimatedFoodSavedGrams: number;
  estimatedCarbonSavedGrams: number;
  calculationVersion: string;
  computedAt: string;
}
