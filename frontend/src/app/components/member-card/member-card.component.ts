import { Component, Input } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This component creates a simple card showing key member detail.
 */
@Component({
  selector: 'app-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.scss'],
})
export class MemberCardComponent {
  @Input() name = '';

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${MemberCardComponent.name}: Starting MemberCardComponent`,
    );
  }
}
