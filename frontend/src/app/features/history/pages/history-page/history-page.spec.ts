import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { SavedScenario } from '../../../../core/api/models/scenario-api.models';
import {
  CALCULATION_FIXTURE,
  REFERENCE_DECISIONS,
} from '../../../../core/api/testing/scenario-api.fixtures';
import { ScenarioStoreService } from '../../../scenario/services/scenario-store.service';
import { HistoryPage } from './history-page';

const SAVED_SCENARIO: SavedScenario = {
  id: 'saved-scenario',
  name: 'Школы и безопасность',
  datasetVersion: CALCULATION_FIXTURE.datasetVersion,
  decisions: REFERENCE_DECISIONS,
  result: CALCULATION_FIXTURE,
  createdAt: '2026-09-23T08:00:00Z',
};

describe('HistoryPage', () => {
  const store = {
    savedScenarios: signal<SavedScenario[]>([]),
    isLoadingHistory: signal(false),
    historyError: signal<string | null>(null),
    hasDataset: signal(true),
    message: signal<string | null>(null),
    loadHistory: vi.fn(),
    openScenario: vi.fn<(scenario: SavedScenario) => boolean>(),
  };

  beforeEach(async () => {
    store.savedScenarios.set([]);
    store.isLoadingHistory.set(false);
    store.historyError.set(null);
    store.hasDataset.set(true);
    store.message.set(null);
    store.loadHistory.mockReset();
    store.openScenario.mockReset().mockReturnValue(true);
    await TestBed.configureTestingModule({
      imports: [HistoryPage],
      providers: [
        provideRouter([]),
        { provide: ScenarioStoreService, useValue: store },
      ],
    }).compileComponents();
  });

  it('loads saved scenarios and shows the server result and date', async () => {
    store.savedScenarios.set([SAVED_SCENARIO]);
    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent;

    expect(store.loadHistory).toHaveBeenCalledOnce();
    expect(text).toContain(SAVED_SCENARIO.name);
    expect(text).toContain('56.5');
    expect(text).toContain('23.09.2026');
    expect(text).toContain('95 / 100 млн');
  });

  it('shows load errors and lets the user retry', async () => {
    store.historyError.set('Не удалось загрузить историю сценариев.');
    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain(store.historyError());
    const refresh = Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Обновить'));
    refresh?.click();
    expect(store.loadHistory).toHaveBeenCalledTimes(2);
  });

  it('opens a saved scenario only when the store accepts its dataset', () => {
    const fixture = TestBed.createComponent(HistoryPage);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    store.openScenario.mockReturnValue(false);
    fixture.componentInstance.openScenario(SAVED_SCENARIO);
    expect(navigate).not.toHaveBeenCalled();

    store.openScenario.mockReturnValue(true);
    fixture.componentInstance.openScenario(SAVED_SCENARIO);
    expect(store.openScenario).toHaveBeenCalledWith(SAVED_SCENARIO);
    expect(navigate).toHaveBeenCalledWith(['/scenario']);
  });

  it('disables opening while city data is unavailable', async () => {
    store.savedScenarios.set([SAVED_SCENARIO]);
    store.hasDataset.set(false);
    const fixture = TestBed.createComponent(HistoryPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const open = Array.from(element.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('Открыть'));

    expect(open?.disabled).toBe(true);
    expect(element.textContent).toContain('необходимо загрузить данные города');
  });
});
