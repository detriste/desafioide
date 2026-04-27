import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AlmoxarifePage } from './almoxarife.page';

const routes: Routes = [
  {
    path: '',
    component: AlmoxarifePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AlmoxarifePageRoutingModule {}
