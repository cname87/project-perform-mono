import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { config } from '../config';
import { MemberDetailComponent } from '../components/member-detail/member-detail.component';
import { PageNotFoundComponent } from '../components/page-not-found/page-not-found.component';

const appRoutes: Routes = [
  {
    path: '',
    redirectTo: `/${config.routes.dashboard.path}`,
    pathMatch: 'full',
  },
  config.routes.dashboard,
  config.routes.membersList,
  { path: 'detail/:id', component: MemberDetailComponent },
  { path: '**', component: PageNotFoundComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true }, // <-- debugging purposes only
    ),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
