import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root',
})
export class MockAuth0ClientService {
  constructor(private logger: NGXLogger, private router: Router) {
    this.logger.trace(
      `${MockAuth0ClientService.name}: Starting ${MockAuth0ClientService.name}`,
    );
  }

  getMockAuth0Client = (authObs: any) => {
    return {
      handleRedirectCallback: () => {
        return {
          appState: {
            target: '/dashboard',
          },
        };
      },
      isAuthenticated: () => {
        return true;
      },
      loginWithRedirect: () => {
        authObs.next(true);
        return this.router.navigate(['/dashboard']);
      },
      getUser: () => {
        return {
          id: '111',
        };
      },
      getTokenSilently: () => {
        return 'token';
      },
    };
  };
}
