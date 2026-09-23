import { Injectable } from '@angular/core';
import {
  DIRECTION_META,
  DISTRICTS,
  INDICATOR_WEIGHTS,
  MEASURES,
} from '../../../core/data/mock-city.data';
import {
  Decision,
  Direction,
  District,
  IndicatorCode,
  ScenarioResult,
} from '../../../core/models/city.models';

const INDICATORS: IndicatorCode[] = [
  'T1', 'T2', 'E1', 'E2', 'S1', 'S2', 'B1', 'B2', 'C1', 'C2',
];

const DIRECTION_INDICATORS: Record<Direction, IndicatorCode[]> = {
  transport: ['T1', 'T2'],
  ecology: ['E1', 'E2'],
  social: ['S1', 'S2'],
  safety: ['B1', 'B2'],
  services: ['C1', 'C2'],
};

@Injectable({ providedIn: 'root' })
export class ScenarioCalculatorService {
  calculate(decisions: Decision[]): ScenarioResult {
    const after = DISTRICTS.map((district) => ({
      ...district,
      indicators: { ...district.indicators },
    }));

    for (const decision of decisions) {
      const measure = MEASURES.find((item) => item.id === decision.measureId);
      if (!measure) continue;

      const targets = measure.scope === 'city'
        ? after
        : after.filter((district) => district.id === decision.districtId);
      const factor = (8 - measure.lagQuarters) / 8;

      for (const target of targets) {
        for (const [code, value] of Object.entries(measure.effects)) {
          const indicator = code as IndicatorCode;
          target.indicators[indicator] = this.clip(
            target.indicators[indicator] + (value ?? 0) * factor,
          );
        }
      }
    }

    this.applySynergies(after, decisions);

    const baselineDistrictScores = DISTRICTS.map((district) =>
      this.districtScore(district),
    );
    const districtScores = after.map((district) => this.districtScore(district));
    const baselineScore = this.cityScore(DISTRICTS, baselineDistrictScores);
    const score = this.cityScore(after, districtScores);
    const cityAverage = after.reduce(
      (total, district, index) =>
        total + district.populationShare * districtScores[index],
      0,
    );
    const weakestIndex = districtScores.indexOf(Math.min(...districtScores));

    return {
      baselineScore,
      score,
      scoreDelta: score - baselineScore,
      cityAverage,
      weakestDistrictId: after[weakestIndex].id,
      criticalCount: after.reduce(
        (count, district) =>
          count + INDICATORS.filter((code) => district.indicators[code] < 40).length,
        0,
      ),
      districts: after.map((district, index) => ({
        districtId: district.id,
        before: baselineDistrictScores[index],
        after: districtScores[index],
        delta: districtScores[index] - baselineDistrictScores[index],
      })),
      directions: DIRECTION_META.map((direction) => ({
        direction: direction.id,
        before: this.directionAverage(DISTRICTS, direction.id),
        after: this.directionAverage(after, direction.id),
      })),
    };
  }

  private applySynergies(districts: District[], decisions: Decision[]): void {
    const has = (id: string) => decisions.some((decision) => decision.measureId === id);
    const addToTarget = (measureId: string, code: IndicatorCode, value: number) => {
      const targetId = decisions.find(
        (decision) => decision.measureId === measureId,
      )?.districtId;
      const district = districts.find((item) => item.id === targetId);
      if (district) district.indicators[code] = this.clip(district.indicators[code] + value);
    };

    if (has('M1') && has('M2')) addToTarget('M1', 'T1', 2);
    if (has('M10') && has('M12')) addToTarget('M10', 'B1', 2);
    if (has('M5') && has('M6')) addToTarget('M5', 'E2', 2);
  }

  private districtScore(district: District): number {
    return INDICATORS.reduce(
      (total, code) => total + district.indicators[code] * INDICATOR_WEIGHTS[code],
      0,
    );
  }

  private cityScore(districts: District[], scores: number[]): number {
    const average = districts.reduce(
      (total, district, index) => total + district.populationShare * scores[index],
      0,
    );
    const critical = districts.reduce(
      (count, district) =>
        count + INDICATORS.filter((code) => district.indicators[code] < 40).length,
      0,
    );
    return 0.7 * average + 0.3 * Math.min(...scores) - critical;
  }

  private directionAverage(districts: District[], direction: Direction): number {
    const indicators = DIRECTION_INDICATORS[direction];
    return districts.reduce((cityTotal, district) => {
      const districtValue = indicators.reduce(
        (total, indicator) => total + district.indicators[indicator],
        0,
      ) / indicators.length;
      return cityTotal + districtValue * district.populationShare;
    }, 0);
  }

  private clip(value: number): number {
    return Math.min(100, Math.max(0, value));
  }
}

