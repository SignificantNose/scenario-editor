import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ScenarioEditComponent } from '@pages/scenario-edit/scenario-edit.component';

export const routes = [
  { path: '', component: HomeComponent },
  { path: 'editor/new', component: ScenarioEditComponent },
  { path: 'editor/:id', component: ScenarioEditComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
