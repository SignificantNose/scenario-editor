import { Routes } from '@angular/router';
import { RoutePaths } from './app.router-path';
import { authGuard } from 'core/guards/auth.guard';

export const routes: Routes = [
  {
    path: RoutePaths.Auth,
    title: 'Авторизация',
    loadComponent: () => import('@pages/auth/auth.component').then((m) => m.AuthComponent),
  },
  {
    path: RoutePaths.Register,
    title: 'Регистрация',
    loadComponent: () => import('@pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: RoutePaths.Empty,
    title: 'Главная',
    canActivate: [authGuard],
    loadChildren: () => import('./layout/layout.routes').then((mod) => mod.LayoutRoutes),
  },
];
