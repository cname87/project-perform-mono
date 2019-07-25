import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth.service/auth.service';

/**
 * This guard prevents certain paths being routed when isAuthenticated is false.  If not allowed, the Auth0 service is called.  Once the user authenticates it routes to the requested path.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private logger: NGXLogger,
    private authService: AuthService,
    private router: Router,
  ) {
    this.logger.trace(`${AuthGuard.name}: Starting ${AuthGuard.name}`);
  }

  async canActivate(
    /* The ActivatedRouteSnapshot contains the future route that will be activated and the RouterStateSnapshot contains the future RouterState of the application, should you pass through the guard check. */
    _next: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Promise<boolean | UrlTree> {
    this.logger.trace(`${AuthGuard.name}: Calling canActivate()`);

    this.logger.trace(`${AuthGuard.name}: Calling getAuth0Client()`);
    const client = await this.authService.getAuth0Client();
    /* need to call client as this may be the first call */
    const isAuthenticated = await client.isAuthenticated();

    if (isAuthenticated) {
      return true;
    } else {
      this.router.navigate(['/information/login']);
      return false;
    }
  }
}
