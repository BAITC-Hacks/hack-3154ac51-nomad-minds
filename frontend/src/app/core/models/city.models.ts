export type Direction =
  | 'transport'
  | 'ecology'
  | 'social'
  | 'safety'
  | 'services';

export type IndicatorCode =
  | 'T1'
  | 'T2'
  | 'E1'
  | 'E2'
  | 'S1'
  | 'S2'
  | 'B1'
  | 'B2'
  | 'C1'
  | 'C2';

export interface District {
  id: string;
  name: string;
  populationShare: number;
  profile: string;
  color: string;
  softColor: string;
  indicators: Record<IndicatorCode, number>;
}

export interface Measure {
  id: string;
  name: string;
  shortName: string;
  direction: Direction;
  scope: 'district' | 'city';
  cost: number;
  lagQuarters: number;
  effects: Partial<Record<IndicatorCode, number>>;
}

export interface Decision {
  measureId: string;
  districtId?: string;
}

export interface DirectionMeta {
  id: Direction;
  label: string;
  color: string;
  softColor: string;
}

export interface DistrictResult {
  districtId: string;
  before: number;
  after: number;
  delta: number;
}

export interface DirectionResult {
  direction: Direction;
  before: number;
  after: number;
}

export interface ScenarioResult {
  baselineScore: number;
  score: number;
  scoreDelta: number;
  cityAverage: number;
  weakestDistrictId: string;
  criticalCount: number;
  districts: DistrictResult[];
  directions: DirectionResult[];
}

