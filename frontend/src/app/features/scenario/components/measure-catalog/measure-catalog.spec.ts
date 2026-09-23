import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchOutline } from '@ant-design/icons-angular/icons';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { DATASET_FIXTURE } from '../../../../core/api/testing/scenario-api.fixtures';
import { AppAlertService } from '../../../../core/services/app-alert.service';
import { ScenarioStoreService } from '../../services/scenario-store.service';
import { MeasureCatalog } from './measure-catalog';

describe('MeasureCatalog selection', () => {
  let fixture: ComponentFixture<MeasureCatalog>;
  let http: HttpTestingController;
  let store: ScenarioStoreService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeasureCatalog],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNzIcons([SearchOutline])],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(ScenarioStoreService);
    fixture = TestBed.createComponent(MeasureCatalog);
    http.expectOne('/api/v1/dataset').flush(DATASET_FIXTURE);
    http.expectOne('/api/v1/health').flush({ status: 'ok', aiProvider: 'fallback' });
    flushValidation();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  function flushValidation(): void {
    const spent = store.decisions().reduce((sum, decision) => sum + store.measureById(decision.measureId)!.cost, 0);
    http.expectOne('/api/v1/scenarios/validate').flush({
      valid: true, complete: false, validationErrors: [],
      budget: { total: 100, spent, remaining: 100 - spent },
    });
  }

  function checkbox(id: string): HTMLInputElement {
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
      .find((input) => input.getAttribute('aria-label') === `Выбрать мероприятие: ${store.measureById(id)!.name}`)!;
  }

  it('starts unchecked and adds or removes a measure using the same checkbox', async () => {
    expect(Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
      .every((input) => !input.checked)).toBe(true);

    checkbox('M1').click();
    expect(store.decisions()).toEqual([{ measureId: 'M1', districtId: 'nura' }]);
    flushValidation();
    await fixture.whenStable();
    expect(checkbox('M1').checked).toBe(true);
    expect(checkbox('M1').disabled).toBe(false);

    checkbox('M1').click();
    expect(store.decisions()).toEqual([]);
    flushValidation();
    await fixture.whenStable();
    expect(checkbox('M1').checked).toBe(false);
  });

  it('keeps a rejected incompatible measure unchecked without losing an accepted choice', async () => {
    checkbox('M1').click();
    flushValidation();
    await fixture.whenStable();

    checkbox('M3').click();
    await fixture.whenStable();
    expect(checkbox('M3').checked).toBe(false);
    expect(checkbox('M1').checked).toBe(true);
    expect(store.decisions()).toEqual([{ measureId: 'M1', districtId: 'nura' }]);
    expect(TestBed.inject(AppAlertService).alerts().find((alert) => alert.key === 'scenario.addition')?.message)
      .toContain('несовместимы');
    http.expectNone('/api/v1/scenarios/validate');
  });

  it.each(['isSaving', 'isCalculating', 'isAnalyzing'] as const)('prevents selection changes while %s', async (operation) => {
    checkbox('M1').click();
    flushValidation();
    store[operation].set(true);
    await fixture.whenStable();

    expect(checkbox('M1').disabled).toBe(true);
    expect(checkbox('M4').disabled).toBe(true);
    checkbox('M1').click();
    checkbox('M4').click();
    expect(store.decisions()).toEqual([{ measureId: 'M1', districtId: 'nura' }]);
    http.expectNone('/api/v1/scenarios/validate');
  });
});
