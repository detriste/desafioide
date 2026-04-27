import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'manutentores',
    loadChildren: () => import('./manutentores/manutentores.module').then( m => m.ManutentoresPageModule)
  },
  {
    path: 'almoxarife',
    loadChildren: () => import('./almoxarife/almoxarife.module').then( m => m.AlmoxarifePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
