import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginAlmoxarifePage } from './login-almoxarife.page';

const routes: Routes = [
  {
    path: '',
    component: LoginAlmoxarifePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginAlmoxarifePageRoutingModule {}
