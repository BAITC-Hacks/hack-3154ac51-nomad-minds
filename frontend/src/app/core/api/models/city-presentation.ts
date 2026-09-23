import { Direction, DirectionMeta, IndicatorCode } from '../../models/city.models';

export const DIRECTION_META: DirectionMeta[] = [
  { id: 'transport', label: 'Транспорт', color: '#1677ff', softColor: '#e9f3ff' },
  { id: 'ecology', label: 'Озеленение', color: '#16a34a', softColor: '#e8f8ee' },
  { id: 'social', label: 'Соцсфера', color: '#6d28d9', softColor: '#f0e9ff' },
  { id: 'safety', label: 'Безопасность', color: '#0f8bd8', softColor: '#e5f5ff' },
  { id: 'services', label: 'Сервисы', color: '#07869a', softColor: '#e2f7fa' },
];

export const DIRECTION_INDICATORS: Record<Direction, IndicatorCode[]> = {
  transport: ['T1', 'T2'],
  ecology: ['E1', 'E2'],
  social: ['S1', 'S2'],
  safety: ['B1', 'B2'],
  services: ['C1', 'C2'],
};

interface DistrictPresentation {
  sourceName: string;
  sourceProfile: string;
  name: string;
  profile: string;
  color: string;
  softColor: string;
}

export const DISTRICT_PRESENTATION: Record<string, DistrictPresentation> = {
  esil: {
    sourceName: 'Esil',
    sourceProfile: 'Wealthy district, but suffers from bridge traffic and overcrowded schools.',
    name: 'Есиль',
    profile: 'Развитый район с высокой нагрузкой на мосты и школы.',
    color: '#3b82f6', softColor: '#e8f2ff',
  },
  almaty: {
    sourceName: 'Almaty',
    sourceProfile: 'Old housing stock, with worn utilities and heavy traffic as the main problems.',
    name: 'Алматы',
    profile: 'Плотный район со старым ЖКХ и транспортной нагрузкой.',
    color: '#22c55e', softColor: '#e8f8ee',
  },
  saryarka: {
    sourceName: 'Saryarka',
    sourceProfile: 'Suffers from smog caused by private housing and weak landscaping.',
    name: 'Сарыарка',
    profile: 'Район с дефицитом озеленения и проблемами качества воздуха.',
    color: '#f59e0b', softColor: '#fff2dc',
  },
  baikonur: {
    sourceName: 'Baikonur',
    sourceProfile: 'A stable middle-performing district without major imbalances.',
    name: 'Байконур',
    profile: 'Сбалансированный район без выраженного преимущества.',
    color: '#8b5cf6', softColor: '#f0eaff',
  },
  nura: {
    sourceName: 'Nura',
    sourceProfile: 'The main outsider in social infrastructure and public transport.',
    name: 'Нура',
    profile: 'Главный резерв роста по транспорту и социальной инфраструктуре.',
    color: '#06b6d4', softColor: '#e1f8fc',
  },
};

export const MEASURE_PRESENTATION: Record<string, { sourceName: string; name: string; shortName: string }> = {
  M1: { sourceName: 'Dedicated bus lanes', name: 'Выделенные полосы для автобусов', shortName: 'Развитие BRT' },
  M2: { sourceName: 'Smart traffic lights and adaptive control', name: 'Умные светофоры', shortName: 'Умные светофоры' },
  M3: { sourceName: 'LRT line or extension', name: 'Линия ЛРТ / расширение', shortName: 'Линия ЛРТ' },
  M4: { sourceName: 'Park or public square', name: 'Парк / сквер', shortName: 'Новые зелёные зоны' },
  M5: { sourceName: 'Clean fuel conversion for private housing', name: 'Перевод частного сектора на чистое топливо', shortName: 'Чистое топливо' },
  M6: { sourceName: 'City greening and windbreak program', name: 'Городская программа озеленения', shortName: 'Городское озеленение' },
  M7: { sourceName: 'School and kindergarten modular construction', name: 'Школа + детсад', shortName: 'Школа + детсад' },
  M8: { sourceName: 'Family health center or clinic', name: 'Центр семейного здоровья / поликлиника', shortName: 'Поликлиника' },
  M9: { sourceName: 'Courtyard sports hubs', name: 'Дворовые спорт-хабы', shortName: 'Дворовые спорт-хабы' },
  M10: { sourceName: 'Street lighting and Safe City cameras', name: 'Освещение и камеры', shortName: 'Освещение и камеры' },
  M11: { sourceName: 'Safe crossings and school zones', name: 'Безопасные переходы и школьные зоны', shortName: 'Безопасные переходы' },
  M12: { sourceName: 'Unified digital requests platform', name: 'Единая цифровая платформа обращений', shortName: 'Цифровая платформа' },
  M13: { sourceName: 'Heating and water network modernization', name: 'Модернизация тепло- и водосетей', shortName: 'Модернизация сетей' },
  M14: { sourceName: 'Emergency utilities teams and early warning', name: 'Аварийные бригады ЖКХ и раннее оповещение', shortName: 'Аварийные бригады' },
};
