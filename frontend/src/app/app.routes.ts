import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'scenario' },
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
      import('./shared/pages/placeholder-page/placeholder-page').then(
        (component) => component.PlaceholderPage,
      ),
    data: {
      title: 'История результатов',
      description: 'Здесь появятся сохранённые расчёты, версии сценария и подробная история изменений показателей.',
      icon: 'line-chart',
    },
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
