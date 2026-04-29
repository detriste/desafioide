import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ManutentoresPageRoutingModule } from './manutentores-routing.module';
import { ManutentoresPage } from './manutentores.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManutentoresPageRoutingModule,
    ManutentoresPage // ← standalone vai em imports, não declarations
  ]
})
export class ManutentoresPageModule {}