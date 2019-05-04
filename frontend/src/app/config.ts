import { DashboardComponent } from './dashboard/dashboard.component';
import { MembersComponent } from './members/members.component';

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

export const config: any = {
  routes: {
    dashboard,
    members,
  },
};
