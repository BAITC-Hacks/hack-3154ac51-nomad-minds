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

  it('dismisses every alert type exactly five seconds after it appears', () => {
    alerts.notify('warning', 'Бюджет превышен.');
    alerts.notify('error', 'Сервер недоступен.');
    vi.advanceTimersByTime(4999);
    expect(alerts.alerts().map((alert) => alert.type)).toEqual(['error', 'warning']);
    vi.advanceTimersByTime(1);
    expect(alerts.alerts()).toEqual([]);
  });

  it('allows an alert to be closed before its timeout and cancels its timer', () => {
    const id = alerts.notify('warning', 'Бюджет превышен.');
    vi.advanceTimersByTime(3000);
    alerts.dismiss(id);
    expect(alerts.alerts()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('replaces an operation alert without its old timer dismissing the replacement', () => {
    alerts.notify('error', 'Не удалось проверить сценарий.', { key: 'validation' });
    vi.advanceTimersByTime(3000);
    alerts.notify('warning', 'Не хватает бюджета.', { key: 'validation' });
    vi.advanceTimersByTime(2000);
    expect(alerts.alerts()).toHaveLength(1);
    expect(alerts.alerts()[0].message).toBe('Не хватает бюджета.');
    vi.advanceTimersByTime(2999);
    expect(alerts.alerts()).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(alerts.alerts()).toEqual([]);
  });

  it('clears an operation alert and cancels its timer', () => {
    alerts.notify('error', 'Сервер недоступен.', { key: 'validation' });
    alerts.clear('validation');
    expect(alerts.alerts()).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });
});
