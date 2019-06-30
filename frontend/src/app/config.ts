import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { HttpErrorResponse } from '@angular/common/http';

/* app component routing elements */
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
  /* the passed-in error is always stored here */
  error: HttpErrorResponse;
  /* every handled error will have allocatedType set */
  allocatedType: 'Http client-side' | 'Http server-side' | 'TBC';
  /* the key error message */
  message?: string;
  /*  set true if user is informed etc => errorHandlerService will not send error message etc */
  isHandled?: boolean;
  /* the status code of a server-side response (only) e.g. 404 */
  status?: number;
  /* Body of the http response for a server-side error (= HttpErrorResponse error propert) */
  body?: string;
}

/* handled error types */
export const errorTypes = {
  httpClientSide: 'Http client-side',
  httpServerSide: 'Http server-side',
};

/* test urls for E2eTestInterceptor */
export const testUrls = {
  httpErrorResponse: 'GET:api-v1/members/3',
  httpErrorEvent: 'GET:api-v1/members/4',
  unexpectedError: 'GET:api-v1/members/10',
};
