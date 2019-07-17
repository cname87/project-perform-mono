import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { ErrorInformationComponent } from '../components/error-information/error-information.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { MembersListComponent } from '../components/members-list/members-list.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'memberslist', component: MembersListComponent },
  { path: 'detail/:id', component: MemberDetailComponent },
  { path: 'errorinformation/:mode', component: ErrorInformationComponent },
  { path: '**', component: ErrorInformationComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: false }, // true for debugging purposes only
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
