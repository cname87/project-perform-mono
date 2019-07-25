import { Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This application displays various views of the members of a team stored on a server.  It allows for member creation, reading, updating and deletion.
 */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(private logger: NGXLogger) {
    this.logger.trace(`${AppComponent.name}: Starting ${AppComponent.name}`);
  }
}
