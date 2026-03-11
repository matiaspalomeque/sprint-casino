import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'session/:sessionId',
    loadComponent: () =>
      import('./pages/session/session.component').then(m => m.SessionComponent),
  },
  { path: '**', redirectTo: '' },
];
