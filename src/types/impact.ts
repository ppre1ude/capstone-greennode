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

export interface ServerImpactSummary {
  totalShared?: number | string | null;
  total_shared?: number | string | null;
  totalReceived?: number | string | null;
  total_received?: number | string | null;
  completedShares?: number | string | null;
  completed_shares?: number | string | null;
  estimatedFoodSavedGrams?: number | string | null;
  estimated_food_saved_grams?: number | string | null;
  estimatedCarbonSavedGrams?: number | string | null;
  estimated_carbon_saved_grams?: number | string | null;
  calculationVersion?: string | null;
  calculation_version?: string | null;
  computedAt?: string | null;
  computed_at?: string | null;
}
