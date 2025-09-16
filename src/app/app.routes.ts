import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Home } from './pages/home/home';
import { Editor } from './pages/editor/editor';

export const routes = [
  { path: '', component: Home },
  { path: 'editor/new', component: Editor },
  { path: 'editor/:id', component: Editor },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
