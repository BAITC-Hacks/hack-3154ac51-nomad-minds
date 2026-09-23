import { HttpErrorResponse } from '@angular/common/http';
import { CALCULATION_FIXTURE, DATASET_FIXTURE } from '../testing/scenario-api.fixtures';
import { mapAnalysis, mapBaselineResult, mapDataset, mapScenarioResult, toUserMessage, translateValidationError } from './scenario-api.mapper';

describe('scenario API mapping', () => {
  it('converts population percentages once and takes numerical inputs from the server', () => {
    const dataset = structuredClone(DATASET_FIXTURE);
    dataset.districts[0].indicators.T1 = 99;
    dataset.measures[0].cost = 32;
    const mapped = mapDataset(dataset);

    expect(mapped.districts[0].populationShare).toBe(0.27);
    expect(mapped.districts[0].name).toBe('Есиль');
    expect(mapped.districts[0].indicators.T1).toBe(99);
    expect(mapped.measures[0].cost).toBe(32);
    expect(dataset.districts[0].populationShare).toBe(27);
  });

  it('shows the authoritative baseline score and a correctly weighted breakdown', () => {
    const result = mapBaselineResult(DATASET_FIXTURE);

    expect(result.score).toBe(DATASET_FIXTURE.baselineScore);
    expect(result.score).toBeCloseTo(52.55768, 5);
    expect(result.cityAverage).toBeCloseTo(56.8624, 4);
    expect(result.weakestDistrictId).toBe('nura');
    expect(result.criticalCount).toBe(2);
    expect(result.directions.find((item) => item.direction === 'transport')?.before).toBeCloseTo(55.645, 3);
  });

  it('preserves updated API labels instead of overwriting them with bundled translations', () => {
    const dataset = structuredClone(DATASET_FIXTURE);
    dataset.districts[0].name = 'Новое название района';
    dataset.districts[0].profile = 'Обновлённый профиль района';
    dataset.measures[0].name = 'Новая транспортная программа';

    const mapped = mapDataset(dataset);
    expect(mapped.districts[0].name).toBe('Новое название района');
    expect(mapped.districts[0].profile).toBe('Обновлённый профиль района');
    expect(mapped.measures[0].name).toBe('Новая транспортная программа');
    expect(mapped.measures[0].shortName).toBe('Новая транспортная программа');
  });

  it('uses server score, district changes and direction deltas for calculated results', () => {
    const result = mapScenarioResult(CALCULATION_FIXTURE);

    expect(result.score).toBeCloseTo(56.54307, 5);
    expect(result.scoreDelta).toBeCloseTo(3.98539, 5);
    expect(result.criticalCount).toBe(0);
    for (const direction of result.directions) {
      expect(direction.after - direction.before).toBeCloseTo(CALCULATION_FIXTURE.directionDeltas[direction.direction], 8);
    }
    const nura = CALCULATION_FIXTURE.districts.find((district) => district.id === 'nura')!;
    expect(result.districts.find((district) => district.districtId === 'nura')).toEqual({
      districtId: 'nura', before: nura.baselineScore, after: nura.score, delta: nura.scoreDelta,
    });
  });

  it('translates backend validation details without exposing technical errors', () => {
    expect(translateValidationError('Exactly 5 decisions are required.')).toBe('Для расчёта выберите ровно 5 решений.');
    expect(translateValidationError('Measures M4 and M7 are incompatible in the same district: nura.')).toContain('Нура');
    expect(toUserMessage(new HttpErrorResponse({
      status: 400, error: { detail: ['Budget exceeded: 105 of 100.'] },
    }), 'Ошибка')).toBe('Превышен бюджет: 105 из 100.');
    expect(toUserMessage(new HttpErrorResponse({ status: 500, error: { detail: 'internal stack trace' } }), 'Ошибка сохранения')).toBe('Ошибка сохранения');
  });

  it('translates the backend fallback explanation while retaining its reported numbers', () => {
    const result = mapAnalysis({
      summary: 'Score changes from 52.56 to 56.54 (+3.99).',
      strengths: ['social: change +1.50.'],
      risks: ['The weakest district after the scenario is Nura.', 'Critical indicators remaining: 2.'],
      tradeoffs: ['Budget spent: 95 of 100.'],
      recommendations: [], source: 'fallback', model: null,
    });

    expect(result.summary).toBe('Оценка города меняется с 52.56 до 56.54 (+3.99).');
    expect(result.strengths).toEqual(['Соцсфера: изменение +1.50.']);
    expect(result.risks[0]).toContain('Нура');
    expect(result.tradeoffs).toEqual(['Использовано 95 из 100 единиц бюджета.']);
  });

  it('keeps server explanations that have no bundled translation', () => {
    const message = 'Сценарий с таким названием уже существует.';
    expect(toUserMessage(new HttpErrorResponse({ status: 409, error: { detail: message } }), 'Ошибка')).toBe(message);
    expect(toUserMessage(new HttpErrorResponse({ status: 400, error: { message } }), 'Ошибка')).toBe(message);
    expect(translateValidationError(message)).toBe(message);
    expect(toUserMessage(new HttpErrorResponse({ status: 422, error: { detail: [{ msg: 'Field required' }] } }), 'Ошибка'))
      .toBe('Сервер не принял данные. Проверьте название сценария и выбранные мероприятия.');
  });
});
