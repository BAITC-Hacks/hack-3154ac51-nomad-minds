import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'scenario' },
  {
    path: 'scenario/results',
    loadComponent: () =>
      import('./features/scenario/pages/scenario-results-page/scenario-results-page').then(
        (component) => component.ScenarioResultsPage,
      ),
  },
  {
    path: 'scenario',
    loadComponent: () =>
      import('./features/scenario/pages/scenario-page/scenario-page').then(
        (component) => component.ScenarioPage,
      ),
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./features/history/pages/history-page/history-page').then(
        (component) => component.HistoryPage,
      ),
  },
  {
    path: 'comparison',
    loadComponent: () =>
      import('./shared/pages/placeholder-page/placeholder-page').then(
        (component) => component.PlaceholderPage,
      ),
    data: {
      title: 'Сравнение команд',
      description: 'Каркас маршрута готов для рейтинга команд и синхронизации результатов в реальном времени.',
      icon: 'team',
    },
  },
  {
    path: 'project-info',
    loadComponent: () =>
      import('./shared/pages/placeholder-page/placeholder-page').then(
        (component) => component.PlaceholderPage,
      ),
    data: {
      title: 'О проекте',
      description: 'Здесь будут правила симулятора, описание формулы Score и инструкция для участников.',
      icon: 'read',
    },
  },
  { path: '**', redirectTo: 'scenario' },
];
