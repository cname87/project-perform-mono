import { DashboardComponent } from './dashboard/dashboard.component';
import { MembersComponent } from './members/members.component';
import { MemberDetailComponent } from './member-detail/member-detail.component';

/* module routing elements */
const dashboard = {
  path: 'dashboard',
  component: DashboardComponent,
  displayName: 'Dashboard',
};
const members = {
  path: 'members',
  component: MembersComponent,
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
