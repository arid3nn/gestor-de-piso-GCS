import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { FlatSetupPage } from './flat-setup.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: FlatSetupPage }]),
    FlatSetupPage,
  ],
})
export class FlatSetupPageModule {}
