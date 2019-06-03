import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';

/* module routing elements */
const dashboard = {
  path: 'dashboard',
  component: DashboardComponent,
  displayName: 'MEMBERS DASHBOARD',
};
const membersList = {
  path: 'memberslist',
  component: MembersListComponent,
  displayName: 'MEMBERS LIST',
};
const detail = {
  path: 'detail',
  component: MemberDetailComponent,
  displayName: 'MEMBER DETAIL',
};
export const config: any = {
  routes: {
    dashboard,
    membersList,
    detail,
  },
};
