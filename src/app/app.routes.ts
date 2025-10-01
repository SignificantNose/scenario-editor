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
    path: RoutePaths.SignUp,
    title: 'Регистрация',
    loadComponent: () => import('@pages/sign-up/sign-up.component').then((m) => m.SignUpComponent),
  },
  {
    path: RoutePaths.Empty,
    title: 'Главная',
    canActivate: [authGuard],
    loadChildren: () => import('./layout/layout.routes').then((mod) => mod.LayoutRoutes),
  },
];
