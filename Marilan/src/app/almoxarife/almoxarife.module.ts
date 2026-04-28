import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { AlmoxarifePageRoutingModule } from './almoxarife-routing.module';
import { AlmoxarifePage } from './almoxarife.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AlmoxarifePageRoutingModule,
    AlmoxarifePage // ✅ CORRETO porque é standalone
  ]
})
export class AlmoxarifePageModule {}