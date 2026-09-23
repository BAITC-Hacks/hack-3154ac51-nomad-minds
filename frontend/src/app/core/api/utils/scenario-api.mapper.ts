import { HttpErrorResponse } from '@angular/common/http';
import {
  Direction,
  District,
  IndicatorCode,
  Measure,
  ScenarioResult,
} from '../../models/city.models';
import {
  DIRECTION_INDICATORS,
  DIRECTION_META,
  DISTRICT_PRESENTATION,
  MEASURE_PRESENTATION,
} from '../models/city-presentation';
import {
  AnalysisResponse,
  DatasetResponse,
  DistrictDto,
  MeasureDto,
  ScenarioDataset,
  ValidCalculationResult,
} from '../models/scenario-api.models';

export function mapDistrict(district: DistrictDto): District {
  const presentation = DISTRICT_PRESENTATION[district.id];
  return {
    ...district,
    name: district.name === presentation?.sourceName ? presentation.name : district.name,
    profile: district.profile === presentation?.sourceProfile ? presentation.profile : district.profile,
    color: presentation?.color ?? '#64748b',
    softColor: presentation?.softColor ?? '#f1f5f9',
    populationShare: district.populationShare / 100,
    indicators: { ...district.indicators },
  };
}

export function mapMeasure(measure: MeasureDto): Measure {
  const presentation = MEASURE_PRESENTATION[measure.id];
  const isKnownName = measure.name === presentation?.sourceName;
  return {
    ...measure,
    name: isKnownName ? presentation.name : measure.name,
    shortName: isKnownName ? presentation.shortName : measure.name,
    effects: { ...measure.effects },
  };
}

export function mapDataset(dataset: DatasetResponse): ScenarioDataset {
  return {
    ...dataset,
    districts: dataset.districts.map(mapDistrict),
    measures: dataset.measures.map(mapMeasure),
  };
}

export function mapScenarioResult(result: ValidCalculationResult): ScenarioResult {
  return {
    baselineScore: result.baselineScore,
    score: result.score,
    scoreDelta: result.scoreDelta,
    cityAverage: result.cityAverage,
    weakestDistrictId: result.weakestDistrictId,
    criticalCount: result.criticalCount,
    districts: result.districts.map((district) => ({
      districtId: district.id,
      before: district.baselineScore,
      after: district.score,
      delta: district.scoreDelta,
    })),
    directions: DIRECTION_META.map(({ id }) => {
      const before = directionAverage(
        result.districts.map((district) => ({ ...district, indicators: district.baselineIndicators })),
        id,
      );
      return { direction: id, before, after: before + result.directionDeltas[id] };
    }),
  };
}

// The dataset supplies the baseline city score; derive its display breakdown only.
// This accepts the unmodified API dataset, whose population shares are percentages.
export function mapBaselineResult(dataset: DatasetResponse): ScenarioResult {
  const districts = dataset.districts.map((district) => {
    const score = (Object.keys(dataset.rules.indicatorWeights) as IndicatorCode[]).reduce(
      (sum, indicator) => sum + district.indicators[indicator] * dataset.rules.indicatorWeights[indicator],
      0,
    );
    return { districtId: district.id, before: score, after: score, delta: 0 };
  });
  const weakestDistrict = [...districts].sort((first, second) =>
    first.before - second.before || first.districtId.localeCompare(second.districtId),
  )[0];

  return {
    baselineScore: dataset.baselineScore,
    score: dataset.baselineScore,
    scoreDelta: 0,
    cityAverage: districts.reduce((sum, district, index) =>
      sum + district.before * dataset.districts[index].populationShare / 100, 0),
    weakestDistrictId: weakestDistrict?.districtId ?? '',
    criticalCount: dataset.districts.reduce((sum, district) =>
      sum + Object.values(district.indicators).filter((value) =>
        value < dataset.rules.scoreWeights.criticalThreshold,
      ).length, 0),
    districts,
    directions: DIRECTION_META.map(({ id }) => {
      const value = directionAverage(dataset.districts, id);
      return { direction: id, before: value, after: value };
    }),
  };
}

function directionAverage(districts: DistrictDto[], direction: Direction): number {
  const indicators = DIRECTION_INDICATORS[direction];
  return districts.reduce((sum, district) => {
    const average = indicators.reduce((total, key) => total + district.indicators[key], 0) / indicators.length;
    return sum + average * district.populationShare / 100;
  }, 0);
}

export function translateValidationError(message: string): string {
  let match: RegExpMatchArray | null;
  if ((match = message.match(/^At most (\d+) decisions are allowed\.$/))) {
    return `Можно выбрать не более ${match[1]} решений.`;
  }
  if ((match = message.match(/^Exactly (\d+) decisions are required\.$/))) {
    return `Для расчёта выберите ровно ${match[1]} решений.`;
  }
  if ((match = message.match(/^Measure (\S+) cannot be selected more than once\.$/))) {
    return `Мероприятие ${match[1]} уже выбрано.`;
  }
  if ((match = message.match(/^Measure (\S+) requires a valid district\.$/))) {
    return `Для мероприятия ${match[1]} выберите район.`;
  }
  if ((match = message.match(/^City measure (\S+) must not specify a district\.$/))) {
    return `Мероприятие ${match[1]} действует на весь город; район указывать не нужно.`;
  }
  if ((match = message.match(/^Budget exceeded: (.+) of (.+)\.$/))) {
    return `Превышен бюджет: ${match[1]} млн из ${match[2]} млн.`;
  }
  if ((match = message.match(/^At most (\d+) measures are allowed in (\w+)\.$/))) {
    const direction = DIRECTION_META.find((item) => item.id === match![2]);
    return `В направлении «${direction?.label ?? match[2]}» допускается не более ${match[1]} мер.`;
  }
  if ((match = message.match(/^Measures (\S+) and (\S+) are incompatible in one scenario\.$/))) {
    return `Мероприятия ${match[1]} и ${match[2]} несовместимы в одном сценарии.`;
  }
  if ((match = message.match(/^Measures (\S+) and (\S+) are incompatible in the same district: (\S+)\.$/))) {
    return `Мероприятия ${match[1]} и ${match[2]} несовместимы в районе ${districtName(match[3])}.`;
  }
  if (message.startsWith('Unknown or invalid measureId')) {
    return 'Одно из выбранных мероприятий больше не доступно. Обновите данные и выберите его заново.';
  }
  if (message === 'Only a valid calculated scenario can be analyzed.') {
    return 'Сначала рассчитайте корректный сценарий, затем запустите анализ.';
  }
  return message;
}

export function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (error.status === 0) return 'Нет соединения с сервером. Проверьте, что бэкенд запущен, и повторите попытку.';
  if (error.status >= 500) return fallback;
  const body: unknown = error.error;
  if (typeof body !== 'object' || body === null) return fallback;
  const detail = 'detail' in body ? body.detail : 'message' in body ? body.message : null;
  if (typeof detail === 'string') return detail.trim() ? translateValidationError(detail) : fallback;
  if (Array.isArray(detail) && detail.every((item): item is string => typeof item === 'string')) {
    return detail.length ? detail.map(translateValidationError).join(' ') : fallback;
  }
  if (error.status === 422) return 'Сервер не принял данные. Проверьте название сценария и выбранные мероприятия.';
  return fallback;
}

export function mapAnalysis(response: AnalysisResponse): AnalysisResponse {
  if (response.source !== 'fallback') return response;
  return {
    ...response,
    summary: translateFallback(response.summary),
    strengths: response.strengths.map(translateFallback),
    risks: response.risks.map(translateFallback),
    tradeoffs: response.tradeoffs.map(translateFallback),
    recommendations: response.recommendations.map(translateFallback),
  };
}

function districtName(value: string): string {
  return DISTRICT_PRESENTATION[value.toLowerCase()]?.name ?? value;
}

function translateFallback(message: string): string {
  let match: RegExpMatchArray | null;
  if ((match = message.match(/^Score changes from (.+) to (.+) \((.+)\)\.$/))) {
    return `Оценка города меняется с ${match[1]} до ${match[2]} (${match[3]}).`;
  }
  if ((match = message.match(/^(\w+): change (.+)\.$/))) {
    const direction = DIRECTION_META.find((item) => item.id === match![1]);
    return `${direction?.label ?? match[1]}: изменение ${match[2]}.`;
  }
  if ((match = message.match(/^The weakest district after the scenario is (.+)\.$/))) {
    return `После реализации сценария самый уязвимый район — ${districtName(match[1])}.`;
  }
  if ((match = message.match(/^Critical indicators remaining: (.+)\.$/))) {
    return `Показателей ниже критического порога: ${match[1]}.`;
  }
  if ((match = message.match(/^Budget spent: (.+) of (.+)\.$/))) {
    return `Использовано ${match[1]} млн из ${match[2]} млн бюджета.`;
  }
  if (message === 'No positive direction changes were recorded.') {
    return 'Положительных изменений по направлениям не зафиксировано.';
  }
  return message;
}
