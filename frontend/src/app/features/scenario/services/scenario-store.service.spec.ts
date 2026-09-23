import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalysisResponse, SavedScenario, ValidationResponse } from '../../../core/api/models/scenario-api.models';
import { CALCULATION_FIXTURE, DATASET_FIXTURE, REFERENCE_DECISIONS } from '../../../core/api/testing/scenario-api.fixtures';
import { AppAlertService } from '../../../core/services/app-alert.service';
import { ScenarioStoreService } from './scenario-store.service';

const COMPLETE: ValidationResponse = {
  valid: true, complete: true, validationErrors: [], budget: { total: 100, spent: 95, remaining: 5 },
};
const EMPTY: ValidationResponse = {
  valid: true, complete: false, validationErrors: [], budget: { total: 100, spent: 0, remaining: 100 },
};
const SAVED: SavedScenario = {
  id: 'server-id', name: 'Мой сценарий', datasetVersion: DATASET_FIXTURE.datasetVersion,
  decisions: REFERENCE_DECISIONS, result: CALCULATION_FIXTURE, createdAt: '2026-09-23 12:00:00',
};
const ANALYSIS: AnalysisResponse = {
  source: 'openai', model: 'test-model', summary: 'Анализ сценария',
  strengths: [], risks: [], tradeoffs: [], recommendations: [],
};

describe('ScenarioStoreService API workflow', () => {
  let http: HttpTestingController;
  let store: ScenarioStoreService;
  let alerts: AppAlertService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(ScenarioStoreService);
    alerts = TestBed.inject(AppAlertService);
  });

  afterEach(() => http.verify());

  function load(): void {
    http.expectOne('/api/v1/dataset').flush(DATASET_FIXTURE);
    http.expectOne('/api/v1/health').flush({ status: 'ok', aiProvider: 'fallback' });
    const validation = http.expectOne('/api/v1/scenarios/validate');
    expect(validation.request.body).toEqual({ decisions: [] });
    validation.flush(EMPTY);
  }

  function restoreDemo(): void {
    store.restoreDemo();
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
  }

  function loadDemo(): void {
    load();
    restoreDemo();
  }

  function calculate(): void {
    store.calculateScenario();
    const request = http.expectOne('/api/v1/scenarios/calculate');
    expect(request.request.body).toEqual({ decisions: REFERENCE_DECISIONS });
    request.flush(CALCULATION_FIXTURE);
  }

  it('starts with no selected measures and loads a demo only when requested', () => {
    expect(store.isLoading()).toBe(true);
    expect(store.districts()).toEqual([]);
    load();
    expect(store.isLoading()).toBe(false);
    expect(store.districts()[0].populationShare).toBe(0.27);
    expect(store.measures().length).toBe(DATASET_FIXTURE.measures.length);
    expect(store.totalBudget()).toBe(100);
    expect(store.decisions()).toEqual([]);
    expect(store.spentBudget()).toBe(0);
    expect(store.remainingBudget()).toBe(100);
    expect(store.canCalculate()).toBe(false);
    expect(store.canSave()).toBe(false);
    expect(store.result()).toBeNull();
    expect(alerts.alerts()).toEqual([]);
    restoreDemo();
    expect(store.canCalculate()).toBe(true);
    expect(store.decisions()).toEqual(REFERENCE_DECISIONS);
    expect(store.result()).toBeNull();
    expect(alerts.alerts()).toEqual([]);
    calculate();
    expect(store.result()?.score).toBe(CALCULATION_FIXTURE.score);
    expect(alerts.alerts()).toEqual([]);
  });

  it('recovers from dataset connection failure and keeps all scenario actions disabled meanwhile', () => {
    const health = http.expectOne('/api/v1/health');
    http.expectOne('/api/v1/dataset').error(new ProgressEvent('error'));
    expect(health.cancelled).toBe(true);
    expect(store.hasDataset()).toBe(false);
    expect(store.canCalculate()).toBe(false);
    expect(store.canSave()).toBe(false);
    expect(store.loadError()).toContain('Нет соединения');
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.dataset')).toMatchObject({
      type: 'error', message: store.loadError(),
    });
    store.loadDataset();
    load();
    expect(store.loadError()).toBeNull();
    expect(store.hasDataset()).toBe(true);
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.dataset')).toBeUndefined();
  });

  it('cancels stale validation and calculation when the selection changes', () => {
    loadDemo();
    store.calculateScenario();
    const calculation = http.expectOne('/api/v1/scenarios/calculate');
    store.removeDecision('M5');
    expect(calculation.cancelled).toBe(true);
    expect(store.isCalculating()).toBe(false);
    const validation = http.expectOne('/api/v1/scenarios/validate');
    store.removeDecision('M12');
    expect(validation.cancelled).toBe(true);
    http.expectOne('/api/v1/scenarios/validate').flush({ ...COMPLETE, complete: false });
    expect(store.result()).toBeNull();
    expect(store.canCalculate()).toBe(false);
    expect(alerts.alerts()).toEqual([]);
  });

  it('recovers from validation failure without changing the selected decisions', () => {
    loadDemo();
    store.validateScenario();
    http.expectOne('/api/v1/scenarios/validate').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(store.canCalculate()).toBe(false);
    expect(store.validationErrors().length).toBe(1);
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.validation')?.type).toBe('error');
    store.validateScenario();
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(store.validationErrors()).toEqual([]);
    expect(store.canCalculate()).toBe(true);
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.validation')).toBeUndefined();
  });

  it('sends the exact complete server result to analysis and discards stale analysis', () => {
    loadDemo();
    calculate();
    store.analyzeScenario();
    const analysis = http.expectOne('/api/v1/scenarios/analyze');
    expect(analysis.request.body).toEqual({ result: CALCULATION_FIXTURE });
    store.reset();
    expect(analysis.cancelled).toBe(true);
    expect(store.isAnalyzing()).toBe(false);
    expect(store.analysis()).toBeNull();
    expect(alerts.alerts()).toEqual([]);
    http.expectOne('/api/v1/scenarios/validate').flush({ ...COMPLETE, complete: false });
  });

  it('does not save incomplete scenarios, prevents duplicate submissions and uses the server snapshot', () => {
    load();
    store.saveScenario();
    http.expectNone('/api/v1/scenarios');
    store.restoreDemo();
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    store.saveScenario();
    store.saveScenario();
    const save = http.expectOne('/api/v1/scenarios');
    expect(save.request.method).toBe('POST');
    expect(save.request.body).toEqual({ name: 'Мой сценарий', decisions: REFERENCE_DECISIONS });
    expect(store.isSaved()).toBe(false);
    save.flush(SAVED);
    expect(store.isSaved()).toBe(true);
    expect(store.savedAt()).toBe('2026-09-23T12:00:00Z');
    expect(store.result()?.score).toBe(CALCULATION_FIXTURE.score);
    store.selectDistrict('esil');
    expect(store.isSaved()).toBe(true);
    store.setScenarioName('Другое название');
    expect(store.isSaved()).toBe(false);
    expect(alerts.alerts()).toEqual([]);
  });

  it('keeps a failed save retryable and never shows it as saved', () => {
    loadDemo();
    store.saveScenario();
    http.expectOne('/api/v1/scenarios').flush({}, { status: 500, statusText: 'Error' });
    expect(store.isSaving()).toBe(false);
    expect(store.isSaved()).toBe(false);
    expect(store.canSave()).toBe(true);
    expect(store.message()).toContain('Не удалось сохранить');
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.save')?.type).toBe('error');
    store.openScenario(SAVED);
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(alerts.alerts().some((alert) => alert.key === 'scenario.save')).toBe(false);
  });

  it('does not overwrite the opened snapshot metadata with an older pending save', () => {
    loadDemo();
    store.saveScenario();
    const save = http.expectOne('/api/v1/scenarios');
    const opened = { ...SAVED, id: 'other-id', name: 'Сохранённый сценарий', createdAt: '2026-09-22T10:00:00Z' };
    store.openScenario(opened);
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    save.flush(SAVED);
    expect(store.scenarioName()).toBe(opened.name);
    expect(store.savedAt()).toBe(opened.createdAt);
    expect(store.isSaved()).toBe(true);
  });

  it('retains a newly saved scenario when an earlier history request returns', () => {
    loadDemo();
    store.loadHistory();
    const history = http.expectOne('/api/v1/scenarios');
    store.saveScenario();
    http.expectOne('/api/v1/scenarios').flush(SAVED);
    history.flush([]);
    expect(store.savedScenarios().map((item) => item.id)).toEqual([SAVED.id]);
  });

  it('loads saved history and restores a server snapshot while rejecting an incompatible dataset version', () => {
    load();
    store.loadHistory();
    const history = http.expectOne('/api/v1/scenarios');
    expect(history.request.method).toBe('GET');
    history.flush([SAVED]);
    expect(store.savedScenarios().length).toBe(1);
    expect(store.openScenario({ ...SAVED, datasetVersion: 'different' })).toBe(false);
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.open')?.type).toBe('warning');
    expect(store.openScenario(store.savedScenarios()[0])).toBe(true);
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(store.result()?.score).toBe(CALCULATION_FIXTURE.score);
    expect(store.decisions()).toEqual(REFERENCE_DECISIONS);
    expect(store.isSaved()).toBe(true);
    expect(store.historyError()).toBeNull();
    expect(alerts.alerts()).toEqual([]);
  });

  it('rejects a business-invalid calculation even when it arrives with HTTP 200', () => {
    loadDemo();
    store.calculateScenario();
    http.expectOne('/api/v1/scenarios/calculate').flush({
      valid: false, datasetVersion: '1.0.0', budget: COMPLETE.budget,
      validationErrors: ['Measures M1 and M3 are incompatible in one scenario.'],
    });
    expect(store.result()).toBeNull();
    expect(store.canCalculate()).toBe(false);
    expect(store.validationErrors()[0]).toContain('несовместимы');
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.calculation')).toMatchObject({
      type: 'warning', message: store.validationErrors()[0],
    });
  });

  it('keeps district changes and scenario edits silent while warning about duplicate selections', () => {
    loadDemo();
    store.selectDistrict(store.selectedDistrictId());
    expect(alerts.alerts()).toEqual([]);
    store.selectDistrict('esil');
    expect(store.selectedDistrictId()).toBe('esil');
    expect(alerts.alerts()).toEqual([]);
    store.selectDistrict('esil');
    expect(alerts.alerts()).toEqual([]);

    store.addMeasure('M5');
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.addition')).toMatchObject({
      type: 'warning', message: 'Это мероприятие уже выбрано.',
    });
    http.expectNone('/api/v1/scenarios/validate');
    store.removeDecision('M5');
    const spent = COMPLETE.budget.spent - store.measureById('M5')!.cost;
    http.expectOne('/api/v1/scenarios/validate').flush({
      ...COMPLETE, complete: false, budget: { total: 100, spent, remaining: 100 - spent },
    });
    expect(alerts.alerts()).toEqual([]);
    store.addMeasure('M5');
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(alerts.alerts()).toEqual([]);

    store.reset();
    http.expectOne('/api/v1/scenarios/validate').flush({ ...COMPLETE, complete: false });
    expect(alerts.alerts()).toEqual([]);
    store.restoreDemo();
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(alerts.alerts()).toEqual([]);
  });

  it('presents backend validation warnings and clears them after a successful recheck', () => {
    load();
    store.validateScenario();
    http.expectOne('/api/v1/scenarios/validate').flush({
      ...COMPLETE, valid: false, complete: false,
      validationErrors: ['Measures M1 and M3 are incompatible in one scenario.'],
    });
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.validation')).toMatchObject({
      type: 'warning', message: expect.stringContaining('несовместимы'),
    });
    store.validateScenario();
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.validation')).toBeUndefined();
  });

  it('preserves server error messages and clears them silently after a successful retry', () => {
    loadDemo();
    store.calculateScenario();
    http.expectOne('/api/v1/scenarios/calculate').flush({ detail: 'Расчёт временно недоступен.' }, { status: 409, statusText: 'Conflict' });
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.calculation')).toMatchObject({
      type: 'error', message: 'Расчёт временно недоступен.',
    });
    calculate();
    expect(alerts.alerts()).toEqual([]);

    store.analyzeScenario();
    http.expectOne('/api/v1/scenarios/analyze').flush({ detail: 'Сервис анализа занят.' }, { status: 409, statusText: 'Conflict' });
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.analysis')).toMatchObject({
      type: 'error', message: 'Сервис анализа занят.',
    });
    store.analyzeScenario();
    http.expectOne('/api/v1/scenarios/analyze').flush(ANALYSIS);
    expect(alerts.alerts()).toEqual([]);

    store.saveScenario();
    http.expectOne('/api/v1/scenarios').flush({ detail: 'Хранилище недоступно.' }, { status: 409, statusText: 'Conflict' });
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.save')).toMatchObject({
      type: 'error', message: 'Хранилище недоступно.',
    });
    store.saveScenario();
    http.expectOne('/api/v1/scenarios').flush(SAVED);
    expect(alerts.alerts()).toEqual([]);
  });

  it('retains fallback analysis without displaying an alert', () => {
    loadDemo();
    calculate();
    store.analyzeScenario();
    http.expectOne('/api/v1/scenarios/analyze').flush({ ...ANALYSIS, source: 'fallback', model: null });
    expect(store.analysis()?.source).toBe('fallback');
    expect(store.analysis()?.summary).toBe(ANALYSIS.summary);
    expect(alerts.alerts()).toEqual([]);
  });

  it('reports history errors and clears the alert when a retry succeeds without a success notification', () => {
    load();
    store.loadHistory();
    http.expectOne('/api/v1/scenarios').flush({ detail: 'История временно недоступна.' }, { status: 409, statusText: 'Conflict' });
    expect(alerts.alerts().find((alert) => alert.key === 'scenario.history')).toMatchObject({
      type: 'error', message: 'История временно недоступна.',
    });
    store.loadHistory();
    http.expectOne('/api/v1/scenarios').flush([SAVED]);
    expect(store.historyError()).toBeNull();
    expect(alerts.alerts()).toEqual([]);
  });
});
