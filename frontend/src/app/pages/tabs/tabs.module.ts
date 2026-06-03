import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { TabsPage } from './tabs.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: TabsPage,
        children: [
          {
            path: 'home',
            loadChildren: () => import('../dashboard/dashboard.module').then((m) => m.DashboardPageModule),
          },
          {
            path: 'expenses',
            loadChildren: () => import('../expenses/expenses.module').then((m) => m.ExpensesPageModule),
          },
          {
            path: 'tasks',
            loadChildren: () => import('../tasks/tasks.module').then((m) => m.TasksPageModule),
          },
          {
            path: 'polls',
            loadChildren: () => import('../polls/polls.module').then((m) => m.PollsPageModule),
          },
          {
            path: 'setup',
            loadChildren: () => import('../flat-setup/flat-setup.module').then((m) => m.FlatSetupPageModule),
          },
          {
            path: '',
            redirectTo: 'home',
            pathMatch: 'full',
          },
        ],
      },
    ]),
    TabsPage,
  ],
})
export class TabsPageModule {}
