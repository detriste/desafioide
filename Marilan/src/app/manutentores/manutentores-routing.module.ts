import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManutentoresPage } from './manutentores.page';

const routes: Routes = [
  {
    path: '',
    component: ManutentoresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManutentoresPageRoutingModule {}
