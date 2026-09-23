import { computed, inject, Injectable, signal } from '@angular/core';
import {
  DIRECTION_META,
  DISTRICTS,
  MAX_DECISIONS,
  MEASURES,
  TOTAL_BUDGET,
} from '../../../core/data/mock-city.data';
import { Decision, Direction } from '../../../core/models/city.models';
import { ScenarioCalculatorService } from './scenario-calculator.service';

const INITIAL_DECISIONS: Decision[] = [
  { measureId: 'M7', districtId: 'nura' },
  { measureId: 'M8', districtId: 'nura' },
  { measureId: 'M10', districtId: 'nura' },
  { measureId: 'M12' },
  { measureId: 'M5', districtId: 'saryarka' },
];

@Injectable({ providedIn: 'root' })
export class ScenarioStoreService {
  private readonly calculator = inject(ScenarioCalculatorService);

  readonly totalBudget = TOTAL_BUDGET;
  readonly maxDecisions = MAX_DECISIONS;
  readonly districts = DISTRICTS;
  readonly measures = MEASURES;
  readonly directionMeta = DIRECTION_META;

  readonly selectedDistrictId = signal('nura');
  readonly activeDirection = signal<Direction | 'all'>('all');
  readonly search = signal('');
  readonly decisions = signal<Decision[]>(INITIAL_DECISIONS);
  readonly message = signal<string | null>(null);

  readonly selectedDistrict = computed(() =>
    this.districts.find((item) => item.id === this.selectedDistrictId()) ?? this.districts[0],
  );

  readonly spentBudget = computed(() =>
    this.decisions().reduce(
      (total, decision) =>
        total + (this.measures.find((item) => item.id === decision.measureId)?.cost ?? 0),
      0,
    ),
  );

  readonly remainingBudget = computed(() => this.totalBudget - this.spentBudget());
  readonly result = computed(() => this.calculator.calculate(this.decisions()));
  readonly isComplete = computed(() => this.decisions().length === this.maxDecisions);
  readonly coverageCount = computed(() =>
    new Set(
      this.decisions()
        .map((decision) => this.measureById(decision.measureId)?.direction)
        .filter((direction): direction is Direction => direction !== undefined),
    ).size,
  );

  readonly filteredMeasures = computed(() => {
    const direction = this.activeDirection();
    const query = this.search().trim().toLocaleLowerCase('ru');
    return this.measures.filter((measure) => {
      const matchesDirection = direction === 'all' || measure.direction === direction;
      const matchesQuery = !query ||
        measure.name.toLocaleLowerCase('ru').includes(query) ||
        measure.id.toLocaleLowerCase('ru').includes(query);
      return matchesDirection && matchesQuery;
    });
  });

  selectDistrict(id: string): void {
    this.selectedDistrictId.set(id);
    this.message.set(null);
  }

  setDirection(direction: Direction | 'all'): void {
    this.activeDirection.set(direction);
  }

  setSearch(value: string): void {
    this.search.set(value);
  }

  addMeasure(measureId: string): void {
    const measure = this.measureById(measureId);
    if (!measure) return;
    const districtId = measure.scope === 'district' ? this.selectedDistrictId() : undefined;
    const candidate: Decision = { measureId, districtId };
    const error = this.validateAddition(candidate);
    if (error) {
      this.message.set(error);
      return;
    }
    this.decisions.update((items) => [...items, candidate]);
    this.message.set(
      measure.scope === 'city'
        ? `${measure.shortName}: добавлено для всего города`
        : `${measure.shortName}: добавлено для района ${this.selectedDistrict().name}`,
    );
  }

  removeDecision(measureId: string): void {
    this.decisions.update((items) => items.filter((item) => item.measureId !== measureId));
    this.message.set('Решение удалено. Можно выбрать другую инициативу.');
  }

  reset(): void {
    this.decisions.set([]);
    this.message.set('Сценарий очищен. Выберите пять решений.');
  }

  restoreDemo(): void {
    this.decisions.set(INITIAL_DECISIONS);
    this.selectedDistrictId.set('nura');
    this.message.set('Демонстрационный сценарий восстановлен.');
  }

  measureById(id: string) {
    return this.measures.find((item) => item.id === id);
  }

  districtById(id?: string) {
    return this.districts.find((item) => item.id === id);
  }

  directionById(id: Direction) {
    return this.directionMeta.find((item) => item.id === id)!;
  }

  isSelected(measureId: string): boolean {
    return this.decisions().some((item) => item.measureId === measureId);
  }

  private validateAddition(candidate: Decision): string | null {
    const measure = this.measureById(candidate.measureId);
    if (!measure) return 'Мероприятие не найдено.';
    if (this.isSelected(measure.id)) return 'Это мероприятие уже выбрано.';
    if (this.decisions().length >= this.maxDecisions) {
      return 'Уже выбрано пять решений. Сначала удалите одно из них.';
    }
    if (this.spentBudget() + measure.cost > this.totalBudget) {
      return `Не хватает ${this.spentBudget() + measure.cost - this.totalBudget} единиц бюджета.`;
    }
    const sameDirection = this.decisions().filter(
      (decision) => this.measureById(decision.measureId)?.direction === measure.direction,
    ).length;
    if (sameDirection >= 2) return 'Можно выбрать не более двух мер одного направления.';
    if (
      (measure.id === 'M1' && this.isSelected('M3')) ||
      (measure.id === 'M3' && this.isSelected('M1'))
    ) return 'M1 и M3 несовместимы в одном сценарии.';
    const sameDistrictConflict = (otherId: string) =>
      this.decisions().some(
        (decision) => decision.measureId === otherId && decision.districtId === candidate.districtId,
      );
    if (
      (measure.id === 'M4' && sameDistrictConflict('M7')) ||
      (measure.id === 'M7' && sameDistrictConflict('M4'))
    ) return 'Парк и школа не могут занимать один участок в выбранном районе.';
    if (
      (measure.id === 'M5' && sameDistrictConflict('M13')) ||
      (measure.id === 'M13' && sameDistrictConflict('M5'))
    ) return 'Программы M5 и M13 дублируются в выбранном районе.';
    return null;
  }
}

