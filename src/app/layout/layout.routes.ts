import { Routes } from '@angular/router';
import { HomeComponent } from '@pages/home/home.component';
import { ScenarioCreateComponent } from '@pages/scenario-create/scenario-create.component';
import { ScenarioEditComponent } from '@pages/scenario-edit/scenario-edit.component';
import { RoutePaths } from 'app/app.router-path';

export const LayoutRoutes: Routes = [
  {
    path: RoutePaths.Empty,
    title: 'Главная',
    loadComponent: () => import('./layout.component').then((c) => c.LayoutComponent),

    children: [
      {
        path: RoutePaths.Empty,
        pathMatch: 'full',
        component: HomeComponent
      },
      {
        path: RoutePaths.NewScenario,
        pathMatch: 'full',
        component: ScenarioCreateComponent
      },
      {
        path: RoutePaths.EditScenario,
        pathMatch: 'full',
        component: ScenarioEditComponent
      },
      {
        path: RoutePaths.AnyOther,
        redirectTo: '404',
      },
    ],
  },
];
