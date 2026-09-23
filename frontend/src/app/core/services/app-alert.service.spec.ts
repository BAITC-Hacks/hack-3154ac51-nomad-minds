import { TestBed } from '@angular/core/testing';
import { AppAlertService } from './app-alert.service';

describe('AppAlertService', () => {
  let alerts: AppAlertService;

  beforeEach(() => {
    vi.useFakeTimers();
    alerts = TestBed.inject(AppAlertService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('dismisses confirmations but keeps warnings and errors available to read', () => {
    alerts.notify('success', 'Сценарий сохранён.');
    alerts.notify('info', 'Выбран район Нура.');
    alerts.notify('warning', 'Бюджет превышен.');
    alerts.notify('error', 'Сервер недоступен.');
    vi.advanceTimersByTime(6000);
    expect(alerts.alerts().map((alert) => alert.type)).toEqual(['error', 'warning']);
    alerts.dismiss(alerts.alerts()[0].id);
    expect(alerts.alerts().map((alert) => alert.type)).toEqual(['warning']);
  });

  it('lets the user pause a confirmation while reading or focusing its close control', () => {
    const id = alerts.notify('info', 'Выбран район Нура.');
    vi.advanceTimersByTime(3000);
    alerts.pause(id);
    vi.advanceTimersByTime(12000);
    expect(alerts.alerts()).toHaveLength(1);
    alerts.resume(id);
    vi.advanceTimersByTime(6000);
    expect(alerts.alerts()).toEqual([]);
  });

  it('replaces an operation alert without its old timer dismissing the replacement', () => {
    alerts.notify('info', 'Проверка.', { key: 'validation' });
    vi.advanceTimersByTime(3000);
    alerts.notify('warning', 'Не хватает бюджета.', { key: 'validation' });
    vi.advanceTimersByTime(6000);
    expect(alerts.alerts()).toHaveLength(1);
    expect(alerts.alerts()[0].message).toBe('Не хватает бюджета.');
    alerts.clear('validation');
    expect(alerts.alerts()).toEqual([]);
  });
});
