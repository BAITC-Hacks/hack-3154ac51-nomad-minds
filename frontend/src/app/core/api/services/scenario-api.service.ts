import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { API_BASE_URL } from '../../config/api.config';
import { Decision } from '../../models/city.models';
import {
  AnalysisResponse,
  AnalyzeScenarioRequest,
  CalculationResponse,
  DatasetResponse,
  HealthResponse,
  SavedScenario,
  SaveScenarioRequest,
  ScenarioRequest,
  ValidCalculationResult,
  ValidationResponse,
} from '../models/scenario-api.models';

const REQUEST_TIMEOUT_MS = 15_000;
const ANALYSIS_TIMEOUT_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class ScenarioApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL).replace(/\/+$/, '');

  getHealth(): Observable<HealthResponse> {
    return this.http.get<HealthResponse>(`${this.baseUrl}/health`, { timeout: REQUEST_TIMEOUT_MS });
  }

  getDataset(): Observable<DatasetResponse> {
    return this.http.get<DatasetResponse>(`${this.baseUrl}/dataset`, { timeout: REQUEST_TIMEOUT_MS });
  }

  validateScenario(decisions: Decision[]): Observable<ValidationResponse> {
    const body: ScenarioRequest = { decisions: this.serializeDecisions(decisions) };
    return this.http.post<ValidationResponse>(`${this.baseUrl}/scenarios/validate`, body, { timeout: REQUEST_TIMEOUT_MS });
  }

  calculateScenario(decisions: Decision[]): Observable<CalculationResponse> {
    const body: ScenarioRequest = { decisions: this.serializeDecisions(decisions) };
    return this.http.post<CalculationResponse>(`${this.baseUrl}/scenarios/calculate`, body, { timeout: REQUEST_TIMEOUT_MS });
  }

  analyzeScenario(result: ValidCalculationResult): Observable<AnalysisResponse> {
    const body: AnalyzeScenarioRequest = { result };
    return this.http.post<AnalysisResponse>(`${this.baseUrl}/scenarios/analyze`, body, { timeout: ANALYSIS_TIMEOUT_MS });
  }

  saveScenario(name: string, decisions: Decision[]): Observable<SavedScenario> {
    const body: SaveScenarioRequest = { name: name.trim(), decisions: this.serializeDecisions(decisions) };
    return this.http.post<SavedScenario>(`${this.baseUrl}/scenarios`, body, { timeout: REQUEST_TIMEOUT_MS }).pipe(
      map(normalizeSavedScenario),
    );
  }

  getScenarios(): Observable<SavedScenario[]> {
    return this.http.get<SavedScenario[]>(`${this.baseUrl}/scenarios`, { timeout: REQUEST_TIMEOUT_MS }).pipe(
      map((scenarios) => scenarios.map(normalizeSavedScenario)),
    );
  }

  private serializeDecisions(decisions: Decision[]): Decision[] {
    return decisions.map(({ measureId, districtId }) =>
      districtId === undefined ? { measureId } : { measureId, districtId },
    );
  }
}

function normalizeSavedScenario(scenario: SavedScenario): SavedScenario {
  // SQLite CURRENT_TIMESTAMP is UTC but omits the timezone and ISO separator.
  const createdAt = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(scenario.createdAt)
    ? `${scenario.createdAt.replace(' ', 'T')}Z`
    : scenario.createdAt;
  return { ...scenario, createdAt };
}
