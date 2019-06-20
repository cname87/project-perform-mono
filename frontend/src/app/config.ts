import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { HttpErrorResponse } from '@angular/common/http';

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

/* interface for bug report thrown from members.service */
export interface IErrReport {
  error: HttpErrorResponse; // the passed-in error
  type: 'Http client-side' | 'Http server-side' | 'TBC';
  message: string;
  status?: number; // the status code of a server-side response e.g. 404
  body?: object; // the body of a server-side error response
  isUserInformed?: boolean; // set true if user is informed
}
