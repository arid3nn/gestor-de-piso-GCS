import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { TabsPage } from './pages/tabs/tabs.page';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then((m) => m.RegisterPageModule),
  },
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AuthGuard],
    children: [
      { path: 'home', loadChildren: () => import('./pages/dashboard/dashboard.module').then((m) => m.DashboardPageModule) },
      { path: 'expenses', loadChildren: () => import('./pages/expenses/expenses.module').then((m) => m.ExpensesPageModule) },
      { path: 'tasks', loadChildren: () => import('./pages/tasks/tasks.module').then((m) => m.TasksPageModule) },
      { path: 'polls', loadChildren: () => import('./pages/polls/polls.module').then((m) => m.PollsPageModule) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  {
    path: 'setup',
    loadChildren: () => import('./pages/flat-setup/flat-setup.module').then((m) => m.FlatSetupPageModule),
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
