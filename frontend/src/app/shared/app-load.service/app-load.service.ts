import { Injectable } from '@angular/core';

import { NGXLogger } from 'ngx-logger';

@Injectable({
  providedIn: 'root',
})
export class AppLoadService {
  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${AppLoadService.name}: Starting ${AppLoadService.name}`,
    );
  }

  /* Runs before the app loads */
  initApp() {
    this.logger.trace(
      `${AppLoadService.name}: Running initApp pre-load function`,
    );
    return Promise.resolve();
  }
}
