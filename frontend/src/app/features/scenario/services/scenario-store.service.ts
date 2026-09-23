import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, Subject, Subscription, switchMap } from 'rxjs';
import {
  AnalysisResponse, DatasetResponse, HealthResponse, SavedScenario,
  ValidCalculationResult, ValidationResponse,
} from '../../../core/api/models/scenario-api.models';
import { ScenarioApiService } from '../../../core/api/services/scenario-api.service';
import {
  mapAnalysis, mapBaselineResult, mapDataset, mapScenarioResult,
  toUserMessage, translateValidationError,
} from '../../../core/api/utils/scenario-api.mapper';
import { DIRECTION_META } from '../../../core/api/models/city-presentation';
import { Decision, Direction } from '../../../core/models/city.models';
import { AppAlertService } from '../../../core/services/app-alert.service';

const INITIAL_DECISIONS: Decision[] = [
  { measureId: 'M7', districtId: 'nura' },
  { measureId: 'M8', districtId: 'nura' },
  { measureId: 'M10', districtId: 'nura' },
  { measureId: 'M12' },
  { measureId: 'M5', districtId: 'saryarka' },
];

@Injectable({ providedIn: 'root' })
export class ScenarioStoreService {
  private readonly api = inject(ScenarioApiService);
  private readonly alerts = inject(AppAlertService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dataset = signal<DatasetResponse | null>(null);
  private readonly validation = signal<ValidationResponse | null>(null);
  private readonly validationRequests = new Subject<Decision[]>();
  private calculationRequest?: Subscription;
  private analysisRequest?: Subscription;
  private historyRevision = 0;
  private readonly savedSignature = signal<string | null>(null);

  readonly directionMeta = DIRECTION_META;
  private readonly mappedDataset = computed(() => {
    const dataset = this.dataset();
    return dataset ? mapDataset(dataset) : null;
  });
  readonly districts = computed(() => this.mappedDataset()?.districts ?? []);
  readonly measures = computed(() => this.mappedDataset()?.measures ?? []);
  readonly totalBudget = computed(() => this.dataset()?.budget ?? 0);
  readonly maxDecisions = computed(() => this.dataset()?.rules.requiredDecisionCount ?? 0);
  readonly hasDataset = computed(() => this.dataset() !== null);
  readonly baselineResult = computed(() => {
    const dataset = this.dataset();
    return dataset ? mapBaselineResult(dataset) : null;
  });
  readonly health = signal<HealthResponse | null>(null);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly isValidating = signal(false);
  readonly isCalculating = signal(false);
  readonly isAnalyzing = signal(false);
  readonly isSaving = signal(false);
  readonly validationErrors = signal<string[]>([]);
  readonly serverResult = signal<ValidCalculationResult | null>(null);
  readonly analysis = signal<AnalysisResponse | null>(null);
  readonly result = computed(() => {
    const result = this.serverResult();
    return result ? mapScenarioResult(result) : null;
  });
  readonly selectedDistrictId = signal('nura');
  readonly activeDirection = signal<Direction | 'all'>('all');
  readonly search = signal('');
  readonly decisions = signal<Decision[]>([]);
  readonly scenarioName = signal('Мой сценарий');
  readonly message = signal<string | null>(null);
  readonly savedAt = signal<string | null>(null);
  readonly savedScenarios = signal<SavedScenario[]>([]);
  readonly isLoadingHistory = signal(false);
  readonly historyError = signal<string | null>(null);

  readonly selectedDistrict = computed(() =>
    this.districts().find((item) => item.id === this.selectedDistrictId()) ?? this.districts()[0],
  );
  readonly spentBudget = computed(() =>
    this.validation()?.budget.spent ?? this.decisions().reduce(
      (total, decision) => total + (this.measureById(decision.measureId)?.cost ?? 0), 0,
    ),
  );
  readonly remainingBudget = computed(() => this.totalBudget() - this.spentBudget());
  readonly budgetUsagePercent = computed(() => this.totalBudget()
    ? Math.min(100, Math.round(this.spentBudget() / this.totalBudget() * 100)) : 0,
  );
  readonly isComplete = computed(() =>
    this.hasDataset() && this.decisions().length === this.maxDecisions(),
  );
  readonly canCalculate = computed(() =>
    this.isComplete() && this.validation()?.complete === true &&
    !this.isValidating() && !this.isCalculating() && !this.isLoading(),
  );
  readonly canSave = computed(() => this.canCalculate() && !this.isSaving() &&
    this.scenarioName().trim().length > 0 && this.scenarioName().trim().length <= 100,
  );
  readonly isSaved = computed(() =>
    this.savedSignature() === this.stateSignature(this.scenarioName(), this.decisions()),
  );
  readonly coverageCount = computed(() => new Set(
    this.decisions().map((decision) => this.measureById(decision.measureId)?.direction)
      .filter((direction): direction is Direction => direction !== undefined),
  ).size);
  readonly filteredMeasures = computed(() => {
    const direction = this.activeDirection();
    const query = this.search().trim().toLocaleLowerCase('ru');
    return this.measures().filter((measure) =>
      (direction === 'all' || measure.direction === direction) &&
      (!query || measure.name.toLocaleLowerCase('ru').includes(query) ||
        measure.id.toLocaleLowerCase('ru').includes(query)),
    );
  });

  constructor() {
    this.validationRequests.pipe(
      switchMap((decisions) => this.api.validateScenario(decisions).pipe(
        catchError((error: unknown) => {
          const message = toUserMessage(error, 'Не удалось проверить сценарий. Повторите проверку.');
          this.validationErrors.set([message]);
          this.notify('error', message, 'scenario.validation');
          return of(null);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((validation) => {
      this.validation.set(validation);
      this.isValidating.set(false);
      if (validation) {
        const errors = validation.validationErrors.map(translateValidationError);
        this.validationErrors.set(errors);
        this.alerts.clear('scenario.validation');
        if (errors.length || !validation.valid) {
          this.notify('warning', errors.join(' ') || 'Проверьте выбранные мероприятия перед расчётом.', 'scenario.validation');
        }
      }
    });
    this.loadDataset();
  }

  loadDataset(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.loadError.set(null);
    forkJoin({
      dataset: this.api.getDataset(),
      health: this.api.getHealth().pipe(catchError(() => of(null))),
    }).pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ dataset, health }) => {
        this.alerts.clear('scenario.dataset');
        const firstLoad = !this.hasDataset();
        this.dataset.set(dataset);
        this.health.set(health);
        if (!this.districtById(this.selectedDistrictId())) {
          this.selectedDistrictId.set(this.districts()[0]?.id ?? '');
        }
        if (firstLoad) {
          const demo = INITIAL_DECISIONS.map((decision) => ({ ...decision }));
          this.decisions.set(this.isRestorable(demo) ? demo : []);
        }
        this.validateScenario();
      },
      error: (error: unknown) => {
        this.health.set(null);
        const message = toUserMessage(error, 'Не удалось загрузить данные города. Проверьте подключение к серверу.');
        this.loadError.set(message);
        this.notify('error', message, 'scenario.dataset');
      },
    });
  }

  validateScenario(): void {
    if (!this.hasDataset()) return;
    this.validation.set(null);
    this.validationErrors.set([]);
    this.isValidating.set(true);
    this.validationRequests.next(this.decisions().map((decision) => ({ ...decision })));
  }

  calculateScenario(): void {
    if (!this.canCalculate()) return;
    this.calculationRequest?.unsubscribe();
    this.analysisRequest?.unsubscribe();
    this.serverResult.set(null);
    this.analysis.set(null);
    this.alerts.clear('scenario.analysis');
    this.message.set(null);
    this.isCalculating.set(true);
    this.calculationRequest = this.api.calculateScenario(this.decisions()).pipe(
      finalize(() => this.isCalculating.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        if (!result.valid) {
          const errors = result.validationErrors.map(translateValidationError);
          this.validationErrors.set(errors);
          this.validation.set(null);
          this.notify('warning', errors.join(' ') || 'Сценарий не прошёл проверку. Измените выбранные мероприятия.', 'scenario.calculation');
          return;
        }
        this.serverResult.set(result);
        this.notify('success', 'Сценарий рассчитан. Можно запросить AI-анализ или сохранить результат.', 'scenario.calculation');
      },
      error: (error: unknown) => this.notify('error', toUserMessage(error, 'Не удалось рассчитать сценарий. Попробуйте ещё раз.'), 'scenario.calculation'),
    });
  }

  analyzeScenario(): void {
    const result = this.serverResult();
    if (!result || this.isAnalyzing() || this.isCalculating()) return;
    this.message.set(null);
    this.isAnalyzing.set(true);
    this.analysisRequest = this.api.analyzeScenario(result).pipe(
      finalize(() => this.isAnalyzing.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (analysis) => {
        this.analysis.set(mapAnalysis(analysis));
        if (analysis.source === 'fallback') {
          this.notify('warning', 'AI-анализ недоступен. Подготовлен базовый анализ по рассчитанным показателям.', 'scenario.analysis');
        } else {
          this.notify('success', 'AI-анализ готов. Ознакомьтесь с выводами и рекомендациями.', 'scenario.analysis');
        }
      },
      error: (error: unknown) => this.notify('error', toUserMessage(error, 'Не удалось получить AI-анализ. Попробуйте ещё раз.'), 'scenario.analysis'),
    });
  }

  saveScenario(): void {
    if (!this.canSave() || this.isSaved()) return;
    const name = this.scenarioName().trim();
    const decisions = this.decisions().map((decision) => ({ ...decision }));
    const signature = this.stateSignature(name, decisions);
    this.message.set(null);
    this.isSaving.set(true);
    this.api.saveScenario(name, decisions).pipe(
      finalize(() => this.isSaving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (saved) => {
        this.historyRevision += 1;
        this.savedScenarios.update((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
        if (signature === this.stateSignature(this.scenarioName(), this.decisions())) {
          this.savedSignature.set(signature);
          this.savedAt.set(saved.createdAt);
          this.serverResult.set(saved.result);
        }
        this.notify('success', `Сценарий «${saved.name}» сохранён на сервере и доступен в истории результатов.`, 'scenario.save');
      },
      error: (error: unknown) => this.notify('error', toUserMessage(error, 'Не удалось сохранить сценарий. Попробуйте ещё раз.'), 'scenario.save'),
    });
  }

  loadHistory(): void {
    if (this.isLoadingHistory()) return;
    this.isLoadingHistory.set(true);
    this.historyError.set(null);
    const revision = this.historyRevision;
    this.api.getScenarios().pipe(
      finalize(() => this.isLoadingHistory.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (items) => {
        this.alerts.clear('scenario.history');
        if (revision === this.historyRevision) {
          this.savedScenarios.set(items);
        } else {
          const current = this.savedScenarios();
          const ids = new Set(current.map((item) => item.id));
          this.savedScenarios.set([...current, ...items.filter((item) => !ids.has(item.id))]);
        }
      },
      error: (error: unknown) => {
        const message = toUserMessage(error, 'Не удалось загрузить историю сценариев. Попробуйте ещё раз.');
        this.historyError.set(message);
        this.notify('error', message, 'scenario.history');
      },
    });
  }

  openScenario(saved: SavedScenario): boolean {
    if (!this.hasDataset() || saved.datasetVersion !== this.dataset()?.datasetVersion || !this.isRestorable(saved.decisions)) {
      const message = 'Сценарий создан для другой версии данных или данные города ещё не загружены.';
      this.historyError.set(message);
      this.notify('warning', message, 'scenario.open');
      return false;
    }
    this.historyError.set(null);
    this.replaceDecisions(saved.decisions.map((decision) => ({ ...decision })));
    this.scenarioName.set(saved.name);
    this.serverResult.set(saved.result);
    this.savedAt.set(saved.createdAt);
    this.savedSignature.set(this.stateSignature(saved.name, saved.decisions));
    const district = saved.decisions.find((decision) => decision.districtId)?.districtId;
    if (district) this.selectedDistrictId.set(district);
    this.notify('success', `Открыт сохранённый сценарий «${saved.name}».`, 'scenario.open');
    return true;
  }

  selectDistrict(id: string): void {
    const district = this.districtById(id);
    if (!district || this.selectedDistrictId() === id) return;
    this.selectedDistrictId.set(id);
    this.notify('info', `Выбран район ${district.name}. Мероприятия будут добавляться для этого района.`, 'scenario.district');
  }

  setDirection(direction: Direction | 'all'): void { this.activeDirection.set(direction); }
  setSearch(value: string): void { this.search.set(value); }
  setScenarioName(value: string): void { this.scenarioName.set(value); }

  addMeasure(measureId: string): void {
    const measure = this.measureById(measureId);
    if (!measure || !this.hasDataset()) return;
    const candidate: Decision = measure.scope === 'district'
      ? { measureId, districtId: this.selectedDistrictId() } : { measureId };
    const error = this.validateAddition(candidate);
    if (error) { this.notify('warning', error, 'scenario.addition'); return; }
    this.replaceDecisions([...this.decisions(), candidate]);
    this.notify('success', `${measure.shortName}: добавлено ${measure.scope === 'city'
      ? 'для всего города' : `для района ${this.selectedDistrict()?.name}`}`, 'scenario.addition');
  }

  removeDecision(measureId: string): void {
    if (!this.isSelected(measureId)) return;
    this.replaceDecisions(this.decisions().filter((item) => item.measureId !== measureId));
    this.notify('info', 'Решение удалено. Можно выбрать другую инициативу.', 'scenario.selection');
  }

  reset(): void {
    this.replaceDecisions([]);
    this.notify('info', `Сценарий очищен. Выберите ${this.maxDecisions()} решений.`, 'scenario.selection');
  }

  restoreDemo(): void {
    const demo = INITIAL_DECISIONS.map((decision) => ({ ...decision }));
    if (!this.hasDataset() || !this.isRestorable(demo)) return;
    this.replaceDecisions(demo);
    this.selectedDistrictId.set('nura');
    this.notify('success', 'Демонстрационный набор восстановлен. Рассчитайте его на сервере.', 'scenario.selection');
  }

  measureById(id: string) { return this.measures().find((item) => item.id === id); }
  districtById(id?: string) { return this.districts().find((item) => item.id === id); }
  directionById(id: Direction) { return this.directionMeta.find((item) => item.id === id)!; }
  isSelected(measureId: string): boolean { return this.decisions().some((item) => item.measureId === measureId); }

  private replaceDecisions(decisions: Decision[]): void {
    // Cancel responses for the old selection before exposing the new one.
    this.calculationRequest?.unsubscribe();
    this.analysisRequest?.unsubscribe();
    this.decisions.set(decisions);
    this.serverResult.set(null);
    this.analysis.set(null);
    this.alerts.clear('scenario.addition');
    this.alerts.clear('scenario.calculation');
    this.alerts.clear('scenario.analysis');
    this.alerts.clear('scenario.save');
    this.validateScenario();
  }

  private notify(type: 'success' | 'info' | 'warning' | 'error', message: string, key: string): void {
    this.message.set(message);
    this.alerts.notify(type, message, { key });
  }

  private validateAddition(candidate: Decision): string | null {
    const measure = this.measureById(candidate.measureId);
    const rules = this.dataset()?.rules;
    if (!measure || !rules) return 'Мероприятие не найдено.';
    if (this.isSelected(measure.id)) return 'Это мероприятие уже выбрано.';
    if (this.decisions().length >= rules.requiredDecisionCount) return `Уже выбрано ${rules.requiredDecisionCount} решений. Сначала удалите одно из них.`;
    if (this.spentBudget() + measure.cost > rules.budget) return `Не хватает ${this.spentBudget() + measure.cost - rules.budget} единиц бюджета.`;
    const count = this.decisions().filter((decision) => this.measureById(decision.measureId)?.direction === measure.direction).length;
    if (count >= rules.maxMeasuresPerDirection) return `Можно выбрать не более ${rules.maxMeasuresPerDirection} мер одного направления.`;
    for (const [first, second] of rules.incompatibleMeasures) {
      if ((measure.id === first && this.isSelected(second)) || (measure.id === second && this.isSelected(first))) return `${first} и ${second} несовместимы в одном сценарии.`;
    }
    for (const [first, second] of rules.incompatibleMeasureDistrictPairs) {
      const other = measure.id === first ? second : measure.id === second ? first : null;
      if (other && this.decisions().some((decision) => decision.measureId === other && decision.districtId === candidate.districtId)) return `${first} и ${second} несовместимы в одном районе.`;
    }
    return null;
  }

  private isRestorable(decisions: Decision[]): boolean {
    const ids = new Set<string>();
    return decisions.length <= this.maxDecisions() && decisions.every((decision) => {
      const measure = this.measureById(decision.measureId);
      if (!measure || ids.has(measure.id)) return false;
      ids.add(measure.id);
      return measure.scope === 'city' ? !decision.districtId : !!this.districtById(decision.districtId);
    });
  }

  private stateSignature(name: string, decisions: Decision[]): string {
    return JSON.stringify({ name: name.trim(), decisions: [...decisions].sort((a, b) => a.measureId.localeCompare(b.measureId)) });
  }
}
