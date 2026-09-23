import {
  DirectionMeta,
  District,
  IndicatorCode,
  Measure,
} from '../models/city.models';

export const TOTAL_BUDGET = 100;
export const MAX_DECISIONS = 5;

export const INDICATOR_WEIGHTS: Record<IndicatorCode, number> = {
  T1: 0.1,
  T2: 0.1,
  E1: 0.09,
  E2: 0.11,
  S1: 0.11,
  S2: 0.11,
  B1: 0.09,
  B2: 0.09,
  C1: 0.1,
  C2: 0.1,
};

export const DIRECTION_META: DirectionMeta[] = [
  {
    id: 'transport',
    label: 'Транспорт',
    color: '#1677ff',
    softColor: '#e9f3ff',
  },
  {
    id: 'ecology',
    label: 'Озеленение',
    color: '#16a34a',
    softColor: '#e8f8ee',
  },
  {
    id: 'social',
    label: 'Соцсфера',
    color: '#6d28d9',
    softColor: '#f0e9ff',
  },
  {
    id: 'safety',
    label: 'Безопасность',
    color: '#0f8bd8',
    softColor: '#e5f5ff',
  },
  {
    id: 'services',
    label: 'Сервисы',
    color: '#07869a',
    softColor: '#e2f7fa',
  },
];

export const DISTRICTS: District[] = [
  {
    id: 'esil',
    name: 'Есиль',
    populationShare: 0.27,
    profile: 'Развитый район с высокой нагрузкой на мосты и школы.',
    color: '#3b82f6',
    softColor: '#e8f2ff',
    indicators: {
      T1: 45, T2: 62, E1: 68, E2: 72, S1: 48,
      S2: 55, B1: 78, B2: 60, C1: 75, C2: 70,
    },
  },
  {
    id: 'almaty',
    name: 'Алматы',
    populationShare: 0.24,
    profile: 'Плотный район со старым ЖКХ и транспортной нагрузкой.',
    color: '#22c55e',
    softColor: '#e8f8ee',
    indicators: {
      T1: 40, T2: 75, E1: 50, E2: 55, S1: 60,
      S2: 65, B1: 62, B2: 52, C1: 50, C2: 60,
    },
  },
  {
    id: 'saryarka',
    name: 'Сарыарка',
    populationShare: 0.2,
    profile: 'Район с дефицитом озеленения и проблемами качества воздуха.',
    color: '#f59e0b',
    softColor: '#fff2dc',
    indicators: {
      T1: 50, T2: 70, E1: 42, E2: 40, S1: 62,
      S2: 68, B1: 58, B2: 55, C1: 45, C2: 55,
    },
  },
  {
    id: 'baikonur',
    name: 'Байконур',
    populationShare: 0.13,
    profile: 'Сбалансированный район без выраженного преимущества.',
    color: '#8b5cf6',
    softColor: '#f0eaff',
    indicators: {
      T1: 52, T2: 68, E1: 55, E2: 50, S1: 58,
      S2: 60, B1: 52, B2: 58, C1: 55, C2: 58,
    },
  },
  {
    id: 'nura',
    name: 'Нура',
    populationShare: 0.16,
    profile: 'Главный резерв роста по транспорту и социальной инфраструктуре.',
    color: '#06b6d4',
    softColor: '#e1f8fc',
    indicators: {
      T1: 55, T2: 40, E1: 45, E2: 65, S1: 38,
      S2: 35, B1: 55, B2: 50, C1: 60, C2: 50,
    },
  },
];

export const MEASURES: Measure[] = [
  {
    id: 'M1', name: 'Выделенные полосы для автобусов', shortName: 'Развитие BRT',
    direction: 'transport', scope: 'district', cost: 18, lagQuarters: 2,
    effects: { T1: 6, T2: 9 },
  },
  {
    id: 'M2', name: 'Умные светофоры', shortName: 'Умные светофоры',
    direction: 'transport', scope: 'city', cost: 22, lagQuarters: 2,
    effects: { T1: 4, B2: 3 },
  },
  {
    id: 'M3', name: 'Линия ЛРТ / расширение', shortName: 'Линия ЛРТ',
    direction: 'transport', scope: 'district', cost: 30, lagQuarters: 4,
    effects: { T1: 16, T2: 20, E2: 4 },
  },
  {
    id: 'M4', name: 'Парк / сквер', shortName: 'Новые зелёные зоны',
    direction: 'ecology', scope: 'district', cost: 15, lagQuarters: 2,
    effects: { E1: 12, E2: 3, B1: 2 },
  },
  {
    id: 'M5', name: 'Перевод частного сектора на чистое топливо', shortName: 'Чистое топливо',
    direction: 'ecology', scope: 'district', cost: 25, lagQuarters: 3,
    effects: { E2: 14, C1: 4 },
  },
  {
    id: 'M6', name: 'Городская программа озеленения', shortName: 'Городское озеленение',
    direction: 'ecology', scope: 'city', cost: 20, lagQuarters: 4,
    effects: { E1: 5, E2: 3 },
  },
  {
    id: 'M7', name: 'Школа + детсад', shortName: 'Школа + детсад',
    direction: 'social', scope: 'district', cost: 24, lagQuarters: 3,
    effects: { S1: 16 },
  },
  {
    id: 'M8', name: 'Центр семейного здоровья / поликлиника', shortName: 'Поликлиника',
    direction: 'social', scope: 'district', cost: 20, lagQuarters: 3,
    effects: { S2: 14 },
  },
  {
    id: 'M9', name: 'Дворовые спорт-хабы', shortName: 'Дворовые спорт-хабы',
    direction: 'social', scope: 'district', cost: 10, lagQuarters: 1,
    effects: { S1: 3, S2: 3, B1: 3 },
  },
  {
    id: 'M10', name: 'Освещение и камеры', shortName: 'Освещение и камеры',
    direction: 'safety', scope: 'district', cost: 12, lagQuarters: 1,
    effects: { B1: 12, B2: 2 },
  },
  {
    id: 'M11', name: 'Безопасные переходы и школьные зоны', shortName: 'Безопасные переходы',
    direction: 'safety', scope: 'district', cost: 10, lagQuarters: 1,
    effects: { B2: 12, T1: -2 },
  },
  {
    id: 'M12', name: 'Единая цифровая платформа обращений', shortName: 'Цифровая платформа',
    direction: 'services', scope: 'city', cost: 14, lagQuarters: 1,
    effects: { C2: 5 },
  },
  {
    id: 'M13', name: 'Модернизация тепло- и водосетей', shortName: 'Модернизация сетей',
    direction: 'services', scope: 'district', cost: 28, lagQuarters: 4,
    effects: { C1: 18, E2: 2 },
  },
  {
    id: 'M14', name: 'Аварийные бригады ЖКХ и раннее оповещение', shortName: 'Аварийные бригады',
    direction: 'services', scope: 'city', cost: 16, lagQuarters: 1,
    effects: { C1: 5, C2: 2 },
  },
];

