import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PollsPage } from './polls.page';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PollsPage }]),
  ],
})
export class PollsPageModule {}