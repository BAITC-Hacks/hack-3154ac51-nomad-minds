import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../config/api.config';
import { SavedScenario } from '../models/scenario-api.models';
import { CALCULATION_FIXTURE, DATASET_FIXTURE, REFERENCE_DECISIONS } from '../testing/scenario-api.fixtures';
import { ScenarioApiService } from './scenario-api.service';

describe('ScenarioApiService', () => {
  let api: ScenarioApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://backend.example/api/v1/' },
      ],
    });
    api = TestBed.inject(ScenarioApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads server health and the complete dataset from the configured API', () => {
    api.getHealth().subscribe((response) => expect(response.aiProvider).toBe('fallback'));
    api.getDataset().subscribe((response) => {
      expect(response.districts[0].populationShare).toBe(27);
      expect(response.rules.requiredDecisionCount).toBe(5);
      expect(response.measures.length).toBe(14);
    });

    const health = http.expectOne('https://backend.example/api/v1/health');
    expect(health.request.method).toBe('GET');
    health.flush({ status: 'ok', aiProvider: 'fallback' });
    const dataset = http.expectOne('https://backend.example/api/v1/dataset');
    expect(dataset.request.method).toBe('GET');
    dataset.flush(DATASET_FIXTURE);
  });

  it('validates partial selections without sending presentation fields or undefined districts', () => {
    const partial = [{ measureId: 'M12', districtId: undefined, shortName: 'Цифровая платформа' }];
    api.validateScenario(partial).subscribe((response) => {
      expect(response.valid).toBe(true);
      expect(response.complete).toBe(false);
      expect(response.budget.remaining).toBe(86);
    });

    const request = http.expectOne('https://backend.example/api/v1/scenarios/validate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ decisions: [{ measureId: 'M12' }] });
    request.flush({ valid: true, complete: false, validationErrors: [], budget: { total: 100, spent: 14, remaining: 86 } });
  });

  it('preserves business validation failures returned with HTTP 200', () => {
    api.calculateScenario([]).subscribe((response) => {
      expect(response.valid).toBe(false);
      expect(response.validationErrors).toEqual(['Exactly 5 decisions are required.']);
      expect('score' in response).toBe(false);
    });

    const request = http.expectOne('https://backend.example/api/v1/scenarios/calculate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ decisions: [] });
    request.flush({
      valid: false,
      datasetVersion: '1.0.0',
      validationErrors: ['Exactly 5 decisions are required.'],
      budget: { total: 100, spent: 0, remaining: 100 },
    });
  });

  it('passes the full server calculation unchanged to the analysis endpoint', () => {
    api.calculateScenario(REFERENCE_DECISIONS).subscribe((result) => {
      if (!result.valid) throw new Error('Expected a valid fixture');
      expect(result.score).toBeCloseTo(56.54307, 5);
      api.analyzeScenario(result).subscribe((analysis) => {
        expect(analysis.source).toBe('fallback');
        expect(analysis.summary).toBe('Analysis from server');
      });
    });

    const calculation = http.expectOne('https://backend.example/api/v1/scenarios/calculate');
    expect(calculation.request.body).toEqual({ decisions: REFERENCE_DECISIONS });
    calculation.flush(CALCULATION_FIXTURE);
    const analysis = http.expectOne('https://backend.example/api/v1/scenarios/analyze');
    expect(analysis.request.method).toBe('POST');
    expect(analysis.request.body).toEqual({ result: CALCULATION_FIXTURE });
    expect(analysis.request.body.result.districts[0].populationShare).toBe(27);
    analysis.flush({
      summary: 'Analysis from server', strengths: [], risks: [], tradeoffs: [],
      recommendations: [], source: 'fallback', model: null,
    });
  });

  it('saves a named scenario and interprets SQLite timestamps as UTC', () => {
    api.saveScenario('  Первый сценарий  ', REFERENCE_DECISIONS).subscribe((scenario) => {
      expect(scenario.id).toBe('scenario-1');
      expect(scenario.createdAt).toBe('2026-09-23T12:34:56Z');
      expect(scenario.result.score).toBeCloseTo(56.54307, 5);
    });

    const request = http.expectOne('https://backend.example/api/v1/scenarios');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Первый сценарий', decisions: REFERENCE_DECISIONS });
    request.flush(savedScenario('2026-09-23 12:34:56'), { status: 201, statusText: 'Created' });
  });

  it('lists saved snapshots without changing existing timezone offsets', () => {
    api.getScenarios().subscribe((scenarios) => {
      expect(scenarios.map((scenario) => scenario.createdAt)).toEqual([
        '2026-09-23T12:34:56Z',
        '2026-09-23T17:34:56+05:00',
      ]);
    });

    const request = http.expectOne('https://backend.example/api/v1/scenarios');
    expect(request.request.method).toBe('GET');
    request.flush([
      savedScenario('2026-09-23 12:34:56'),
      savedScenario('2026-09-23T17:34:56+05:00'),
    ]);
  });

  it('propagates server failures so the store can display an error and retry', () => {
    let receivedError: HttpErrorResponse | undefined;
    api.getDataset().subscribe({
      next: () => { throw new Error('Expected a server error'); },
      error: (error: HttpErrorResponse) => { receivedError = error; },
    });

    http.expectOne('https://backend.example/api/v1/dataset').flush(
      { detail: 'Unavailable' }, { status: 503, statusText: 'Service Unavailable' },
    );
    expect(receivedError?.status).toBe(503);
  });
});

function savedScenario(createdAt: string): SavedScenario {
  return {
    id: 'scenario-1', name: 'Первый сценарий', datasetVersion: '1.0.0',
    decisions: REFERENCE_DECISIONS, result: CALCULATION_FIXTURE, createdAt,
  };
}
