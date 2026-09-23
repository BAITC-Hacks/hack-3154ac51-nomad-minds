import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Decision } from '../models/city.models';

const STORAGE_KEY = 'akim-simulator:scenario:v1';

export interface PersistedScenario {
  version: 1;
  selectedDistrictId: string;
  decisions: Decision[];
  savedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ScenarioStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  load(): PersistedScenario | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<PersistedScenario>;
      if (
        value.version !== 1 ||
        typeof value.selectedDistrictId !== 'string' ||
        !Array.isArray(value.decisions) ||
        typeof value.savedAt !== 'string'
      ) return null;
      return value as PersistedScenario;
    } catch {
      return null;
    }
  }

  save(state: Omit<PersistedScenario, 'version' | 'savedAt'>): PersistedScenario | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    const persisted: PersistedScenario = {
      ...state,
      version: 1,
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
      return persisted;
    } catch {
      return null;
    }
  }
}

