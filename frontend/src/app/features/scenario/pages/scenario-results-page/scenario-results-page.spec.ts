import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import {
  AimOutline, ArrowDownOutline, ArrowUpOutline, BarChartOutline, CheckCircleFill,
  CheckOutline, CloseOutline, InboxOutline, InfoCircleFill, PlayCircleOutline,
  RobotOutline, SaveOutline, ThunderboltOutline,
} from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { routes } from '../../../../app.routes';
import { ValidationResponse } from '../../../../core/api/models/scenario-api.models';
import { CALCULATION_FIXTURE, DATASET_FIXTURE } from '../../../../core/api/testing/scenario-api.fixtures';
import { SelectedDecisions } from '../../components/selected-decisions/selected-decisions';
import { ScenarioStoreService } from '../../services/scenario-store.service';
import { ScenarioPage } from '../scenario-page/scenario-page';
import { ScenarioResultsPage } from './scenario-results-page';

const COMPLETE: ValidationResponse = {
  valid: true, complete: true, validationErrors: [], budget: { total: 100, spent: 95, remaining: 5 },
};

describe('Scenario results navigation', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNzIcons([
          AimOutline, ArrowDownOutline, ArrowUpOutline, BarChartOutline, CheckCircleFill,
          CheckOutline, CloseOutline, InboxOutline, InfoCircleFill, PlayCircleOutline,
          RobotOutline, SaveOutline, ThunderboltOutline,
        ]),
      ],
    }).overrideComponent(ScenarioPage, {
      // Exercise the real action controls without mounting Leaflet in the test DOM.
      set: { imports: [SelectedDecisions], template: '<app-selected-decisions />' },
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function loadDataset(): void {
    http.expectOne('/api/v1/dataset').flush(DATASET_FIXTURE);
    http.expectOne('/api/v1/health').flush({ status: 'ok', aiProvider: 'fallback' });
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
  }

  it.each(['success', 'failure'])('keeps the edited scenario when returning after calculation %s', async (outcome) => {
    const harness = await RouterTestingHarness.create('/scenario');
    const store = TestBed.inject(ScenarioStoreService);
    loadDataset();
    store.setScenarioName('Мой изменённый сценарий');
    store.selectDistrict('esil');
    store.setDirection('transport');
    store.setSearch('транспорт');
    const spentAfterRemoval = COMPLETE.budget.spent - store.measureById('M5')!.cost;
    store.removeDecision('M5');
    http.expectOne('/api/v1/scenarios/validate').flush({
      ...COMPLETE, complete: false,
      budget: { total: 100, spent: spentAfterRemoval, remaining: 100 - spentAfterRemoval },
    });
    store.addMeasure('M5');
    http.expectOne('/api/v1/scenarios/validate').flush(COMPLETE);
    const decisions = structuredClone(store.decisions());
    harness.detectChanges();
    await harness.fixture.whenStable();

    harness.routeNativeElement!.querySelector<HTMLButtonElement>('[aria-label="Рассчитать сценарий"]')!.click();
    const calculation = http.expectOne('/api/v1/scenarios/calculate');
    expect(calculation.request.body).toEqual({ decisions });
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/scenario/results');
    expect(harness.routeDebugElement!.componentInstance).toBeInstanceOf(ScenarioResultsPage);
    expect(calculation.cancelled).toBe(false);
    expect(harness.routeNativeElement!.textContent).toContain('Рассчитываем сценарий…');
    expect(harness.routeNativeElement!.textContent).toContain('AI-анализ сценария');
    if (outcome === 'success') {
      calculation.flush(CALCULATION_FIXTURE);
    } else {
      calculation.flush({ detail: 'Расчёт временно недоступен.' }, { status: 503, statusText: 'Unavailable' });
    }
    await harness.fixture.whenStable();

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a[href="/scenario"]')!.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/scenario');
    expect(TestBed.inject(ScenarioStoreService)).toBe(store);
    expect(store.decisions()).toEqual(decisions);
    expect(store.scenarioName()).toBe('Мой изменённый сценарий');
    expect(store.selectedDistrictId()).toBe('esil');
    expect(store.activeDirection()).toBe('transport');
    expect(store.search()).toBe('транспорт');
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#scenario-name')!.value)
      .toBe('Мой изменённый сценарий');
    expect(store.canCalculate()).toBe(true);
    http.expectNone('/api/v1/dataset');
    http.expectNone('/api/v1/health');
    http.expectNone('/api/v1/scenarios/validate');
  });

  it('provides a return link when opened before a calculation', async () => {
    const harness = await RouterTestingHarness.create('/scenario/results');
    loadDataset();
    await harness.fixture.whenStable();

    expect(harness.routeNativeElement!.textContent).toContain('Результаты появятся после расчёта');
    expect(harness.routeNativeElement!.querySelector('a[href="/scenario"]')?.textContent)
      .toContain('Вернуться к сценарию');
    http.expectNone('/api/v1/scenarios/calculate');
  });
});
