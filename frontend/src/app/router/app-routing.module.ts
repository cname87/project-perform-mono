import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { config } from '../config';
import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { ErrorInformationComponent } from '../components/error-information/error-information.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: `/${config.routes.dashboard.path}`,
    pathMatch: 'full',
  },
  config.routes.dashboard,
  config.routes.membersList,
  { path: 'detail/:id', component: MemberDetailComponent },
  { path: 'pagenotfound/:mode', component: ErrorInformationComponent },
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
