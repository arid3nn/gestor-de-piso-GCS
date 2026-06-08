import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ExpensesPage } from './expenses.page';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: ExpensesPage }]),
  ],
})
export class ExpensesPageModule {}