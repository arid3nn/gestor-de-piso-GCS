import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FlatSetupPage } from './flat-setup.page';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: FlatSetupPage }]),
  ],
})
export class FlatSetupPageModule {}