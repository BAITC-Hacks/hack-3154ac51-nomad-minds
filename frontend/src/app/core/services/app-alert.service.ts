import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type AppAlertType = 'success' | 'info' | 'warning' | 'error';

export interface AppAlert {
  id: number;
  type: AppAlertType;
  title: string;
  message: string;
  key?: string;
}

const TITLES: Record<AppAlertType, string> = {
  success: 'Готово',
  info: 'Информация',
  warning: 'Обратите внимание',
  error: 'Не удалось выполнить действие',
};
const DISPLAY_MS = 6000;

@Injectable({ providedIn: 'root' })
export class AppAlertService {
  private readonly items = signal<AppAlert[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;
  readonly alerts = this.items.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      for (const timer of this.timers.values()) clearTimeout(timer);
    });
  }

  notify(type: AppAlertType, message: string, options: { title?: string; key?: string } = {}): number {
    // Replace repeated messages instead of piling up identical alerts after retries.
    const previous = this.items().find((item) => options.key
      ? item.key === options.key : item.type === type && item.message === message);
    if (previous) this.dismiss(previous.id);
    const id = ++this.nextId;
    this.items.update((items) => [{ id, type, message, title: options.title ?? TITLES[type], key: options.key }, ...items]);
    this.resume(id);
    return id;
  }

  clear(key: string): void {
    for (const item of this.items().filter((alert) => alert.key === key)) this.dismiss(item.id);
  }

  dismiss(id: number): void {
    this.pause(id);
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  pause(id: number): void {
    const timer = this.timers.get(id);
    if (timer !== undefined) clearTimeout(timer);
    this.timers.delete(id);
  }

  resume(id: number): void {
    this.pause(id);
    const alert = this.items().find((item) => item.id === id);
    if (alert?.type === 'success' || alert?.type === 'info') {
      this.timers.set(id, setTimeout(() => this.dismiss(id), DISPLAY_MS));
    }
  }
}
