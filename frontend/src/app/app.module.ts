/* angular */
import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* 3rd party */
import { FlexLayoutModule } from '@angular/flex-layout';
import { LoggerModule } from 'ngx-logger';
import { ToastrModule } from 'ngx-toastr';

/* local */
import { environment } from '../environments/environment';
import { AppComponent } from './components/app/app.component';
import { AppRoutingModule } from './router/app.routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MemberCardComponent } from './components/member-card/member-card.component';
import { RouterLinkDirectiveStub } from './shared/test-helpers/router-link-directive-stub';
import { MaterialModule } from './modules/material/material.module';
import { MemberInputComponent } from './components/member-input/member-input.component';
import { InformationComponent } from './components/information/information.component';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './shared/error-handler-service/error-handler.service';
import { RequestCacheService } from './shared/caching.service/request-cache.service';
import { httpInterceptorProviders } from './shared/http-interceptors/';
import { E2E_TESTING } from './config';
import { CallbackComponent } from './components/callback/callback.component';
import { ProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { NavComponent } from './components/nav/nav.component';

@NgModule({
  imports: [
    /* angular modules */
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    /* 3rd party modules */
    FlexLayoutModule,
    LoggerModule.forRoot({
      // serverLoggingUrl: `${environment.apiUrl}api-v1/logs`,
      level: environment.logLevel,
      serverLogLevel: environment.serverLogLevel,
      disableConsoleLogging: false,
    }),
    ToastrModule.forRoot({
      timeOut: 5000,
      preventDuplicates: true,
    }),
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
    MemberCardComponent,
    MemberInputComponent,
    InformationComponent,
    CallbackComponent,
    ProfileComponent,
    LoginComponent,
    NavComponent,
    /* imported to avoid ng build --prod error */
    RouterLinkDirectiveStub,
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    { provide: RollbarService, useFactory: rollbarFactory },
    RequestCacheService,
    httpInterceptorProviders,
    { provide: E2E_TESTING, useValue: environment.e2eTesting },
  ],
})
export class AppModule {}
