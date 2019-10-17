import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { InformationComponent } from '../components/information/information.component';
import { DashboardComponent } from '../components/dashboard/dashboard.component';
import { MembersListComponent } from '../components/members-list/members-list.component';
import { CallbackComponent } from '../components/callback/callback.component';
import { ProfileComponent } from '../components/user-profile/user-profile.component';
import { MemberDetailResolverService } from '../shared/resolvers/member-detail-resolver.service';
import { MembersListResolverService } from '../shared/resolvers/members-list-resolver.service ';

const appRoutes: Routes = [
  {
    /* default path if no route supplied */
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    /* callback from auth0 authentication - it redirects */
    path: 'callback',
    component: CallbackComponent,
  },
  {
    /* shows the dashboard */
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    resolve: {
      members: MembersListResolverService,
    },
  },
  {
    /* shows the list of members */
    path: 'memberslist',
    component: MembersListComponent,
    canActivate: [AuthGuard],
    resolve: {
      members: MembersListResolverService,
    },
  },
  {
    /* shows a member's detail */
    path: 'detail/:id',
    component: MemberDetailComponent,
    canActivate: [AuthGuard],
    resolve: {
      member: MemberDetailResolverService,
    },
  },
  {
    /* shows the authenticated user profile */
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    /* shows not found, error, and login information */
    path: 'information/:mode',
    component: InformationComponent,
  },
  {
    /* otherwise shows the information page, defaulting to page not found */
    path: '**',
    component: InformationComponent,
  },
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
