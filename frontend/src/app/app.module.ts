import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';

import { AppComponent } from './components/app/app.component';
import { AppRoutingModule } from './router/app-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { MessagesComponent } from './components/messages/messages.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { MemberCardComponent } from './components/member-card/member-card.component';
import { RouterLinkDirectiveStub } from './shared/test-helpers/router-link-directive-stub';
import { MaterialModule } from './modules/material/material.module';
import { MemberInputComponent } from './components/member-input/member-input.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    /* local modules */
    MaterialModule,
  ],
  declarations: [
    AppComponent,
    DashboardComponent,
    MembersListComponent,
    MemberSearchComponent,
    MemberDetailComponent,
    MessagesComponent,
    PageNotFoundComponent,
    MemberCardComponent,
    MemberInputComponent,
    /* imported to avoid ng build --prod error */
    RouterLinkDirectiveStub,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
