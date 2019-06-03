import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.scss'],
})
export class MemberCardComponent {
  @Input() name = '';
}
