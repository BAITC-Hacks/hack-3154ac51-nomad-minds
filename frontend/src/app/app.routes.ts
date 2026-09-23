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
  { path: '**', redirectTo: 'scenario' },
];
