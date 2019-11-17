import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable } from 'rxjs';
// import { tap } from 'rxjs/operators';

import { AuthService } from '../../shared/auth.service/auth.service';
import { tap } from 'rxjs/operators';

/**
 * This guard prevents certain paths being routed when isAuthenticated is false.  If not allowed, the Auth0 service is called.  Once the user authenticates it routes to the requested path.
 */
@Injectable({
  providedIn: 'root',
})
export class LoginGuard implements CanActivate {
  constructor(private logger: NGXLogger, private auth: AuthService) {
    this.logger.trace(`${LoginGuard.name}: Starting ${LoginGuard.name}`);
  }

  /**
   * Checks if the user is authenticated by calling the relevant property of the AuthService and allows (returns Observable(true) if authenticated or routes to the login page and returns Observable(false) otherwise.
   * @param _next ActivatedRouteSnapshot contains the future route that will be activated  should you pass through the guard check
   * @param _state RouterStateSnapshot contains the future RouterState of the application should you pass through the guard check
   */
  canActivate(
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<boolean> {
    this.logger.trace(`${LoginGuard.name}: Running canActivate()`);
    return this.auth.isAuthenticated$.pipe(
      tap((isLoggedIn: boolean) => {
        if (isLoggedIn) {
          /* logout */
          this.auth.logout();
          return true;
        } else {
          return true;
        }
      }),
    );
  }
}
