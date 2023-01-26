import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        loadChildren: () =>
          import('../pages/dashboard-tab/dashboard-tab.module').then(
            (m) => m.DashboardPageModule
          ),
      },
      {
        path: 'tab2',
        loadChildren: () =>
          import('../pages/weight-log-tab/weight-log-tab.module').then(
            (m) => m.WeightLogPageModule
          ),
      },
      {
        path: 'achievements-tab',
        loadChildren: () =>
          import('../pages/achievements-tab/achievements-tab.module').then(
            (m) => m.AchievementsPageModule
          ),
      },
      {
        path: 'settings-tab',
        loadChildren: () =>
          import('../pages/settings-tab/settings-page.module').then(
            (m) => m.SettingsPageModule
          ),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
