import {
  Decision,
  Direction,
  District,
  IndicatorCode,
  Measure,
} from '../../models/city.models';

export interface HealthResponse {
  status: string;
  aiProvider: 'openai' | 'fallback';
}

export interface DistrictDto {
  id: string;
  name: string;
  populationShare: number;
  profile: string;
  indicators: Record<IndicatorCode, number>;
}

export interface MeasureDto {
  id: string;
  name: string;
  direction: Direction;
  scope: 'district' | 'city';
  cost: number;
  lagQuarters: number;
  effects: Partial<Record<IndicatorCode, number>>;
}

export interface ScenarioRules {
  datasetVersion: string;
  budget: number;
  requiredDecisionCount: number;
  maxMeasuresPerDirection: number;
  simulationHorizonQuarters: number;
  indicatorMinimum: number;
  indicatorMaximum: number;
  indicatorWeights: Record<IndicatorCode, number>;
  incompatibleMeasures: [string, string][];
  incompatibleMeasureDistrictPairs: [string, string][];
  synergies: SynergyRule[];
  scoreWeights: {
    weightedAverage: number;
    weakestDistrict: number;
    criticalPenalty: number;
    criticalThreshold: number;
  };
}

export interface SynergyRule {
  measures: [string, string];
  indicator: IndicatorCode;
  bonus: number;
  scope: 'district_of_first_measure';
}

export interface DatasetResponse {
  datasetVersion: string;
  budget: number;
  baselineScore: number;
  districts: DistrictDto[];
  measures: MeasureDto[];
  rules: ScenarioRules;
}

export interface ScenarioDataset extends Omit<DatasetResponse, 'districts' | 'measures'> {
  districts: District[];
  measures: Measure[];
}

export interface Budget {
  total: number;
  spent: number;
  remaining: number;
}

export interface ScenarioRequest {
  decisions: Decision[];
}

export interface SaveScenarioRequest extends ScenarioRequest {
  name: string;
}

export interface AnalyzeScenarioRequest {
  result: ValidCalculationResult;
}

export interface ValidationResponse {
  valid: boolean;
  complete: boolean;
  validationErrors: string[];
  budget: Budget;
}

export interface InvalidCalculationResult {
  valid: false;
  datasetVersion: string;
  validationErrors: string[];
  budget: Budget;
}

export interface CalculatedDistrict extends DistrictDto {
  score: number;
  criticalCount: number;
  baselineScore: number;
  scoreDelta: number;
  baselineIndicators: Record<IndicatorCode, number>;
  indicatorDeltas: Record<IndicatorCode, number>;
  baselineCriticalCount: number;
}

export interface MeasureContribution extends Decision {
  scoreContribution: number;
}

export interface AppliedEffect {
  measureId: string;
  realizationFactor: number;
  districtIds: string[];
  effects: Partial<Record<IndicatorCode, number>>;
}

export interface AppliedSynergy {
  measures: [string, string];
  districtId: string;
  indicator: IndicatorCode;
  bonus: number;
}

export interface ValidCalculationResult {
  valid: true;
  datasetVersion: string;
  validationErrors: string[];
  budget: Budget;
  score: number;
  baselineScore: number;
  scoreDelta: number;
  cityAverage: number;
  weakestDistrict: string;
  weakestDistrictId: string;
  criticalCount: number;
  districts: CalculatedDistrict[];
  directionDeltas: Record<Direction, number>;
  directionDeltaMethod: 'population_weighted_mean_indicator_change';
  contributions: MeasureContribution[];
  contributionMethod: 'shapley';
  appliedSynergies: AppliedSynergy[];
  appliedEffects: AppliedEffect[];
}

export type CalculationResponse = ValidCalculationResult | InvalidCalculationResult;

export interface AnalysisResponse {
  summary: string;
  strengths: string[];
  risks: string[];
  tradeoffs: string[];
  recommendations: string[];
  source: 'openai' | 'fallback';
  model: string | null;
}

export interface SavedScenario {
  id: string;
  name: string;
  datasetVersion: string;
  decisions: Decision[];
  result: ValidCalculationResult;
  createdAt: string;
}
