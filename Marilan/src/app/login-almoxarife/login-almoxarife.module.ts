import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoginAlmoxarifePageRoutingModule } from './login-almoxarife-routing.module';

import { LoginAlmoxarifePage } from './login-almoxarife.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginAlmoxarifePageRoutingModule
  ],
  declarations: [LoginAlmoxarifePage]
})
export class LoginAlmoxarifePageModule {}
