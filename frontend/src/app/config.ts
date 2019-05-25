import { DashboardComponent } from './dashboard/dashboard.component';
import { MembersListComponent } from './members-list/members-list.component';
import { MemberDetailComponent } from './member-detail/member-detail.component';

/* module routing elements */
const dashboard = {
  path: 'dashboard',
  component: DashboardComponent,
  displayName: 'Dashboard',
};
const members = {
  path: 'memberslist',
  component: MembersListComponent,
  displayName: 'Members',
};
const detail = {
  path: 'detail',
  component: MemberDetailComponent,
  displayName: 'Detail',
};
export const config: any = {
  routes: {
    dashboard,
    members,
    detail,
  },
};
