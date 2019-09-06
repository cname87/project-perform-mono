import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';

import { AuthService } from '../../shared/auth.service/auth.service';
import { routes } from '../../config';
import { tap } from 'rxjs/operators';

/**
 * This guard prevents certain paths being routed when isAuthenticated is false.  If not allowed, the Auth0 service is called.  Once the user authenticates it routes to the requested path.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private logger: NGXLogger,
    private auth: AuthService,
    private router: Router,
  ) {
    this.logger.trace(`${AuthGuard.name}: Starting ${AuthGuard.name}`);
  }

  canActivate(
    /* The ActivatedRouteSnapshot contains the future route that will be activated and the RouterStateSnapshot contains the future RouterState of the application, should you pass through the guard check. */
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean | UrlTree> | boolean {
    this.logger.trace(`${AuthGuard.name}: Running canActivate()`);
    return this.auth.isAuthenticated$.pipe(
      tap((loggedIn: boolean) => {
        if (!loggedIn) {
          /* redirect to login page and then back to this page */
          return this.router.navigate([routes.loginPage.path]);
        } else {
          return true;
        }
      }),
    );
  }
}
