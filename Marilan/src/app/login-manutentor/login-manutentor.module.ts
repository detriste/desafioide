import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoginManutentorPageRoutingModule } from './login-manutentor-routing.module';

import { LoginManutentorPage } from './login-manutentor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginManutentorPageRoutingModule
  ],
  declarations: [LoginManutentorPage]
})
export class LoginManutentorPageModule {}
