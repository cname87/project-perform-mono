import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

@Component({
  selector: 'app-member-input',
  templateUrl: './member-input.component.html',
  styleUrls: ['./member-input.component.scss'],
})
export class MemberInputComponent implements OnInit {
  @Input() mode = '';
  @Input() inputText = '';
  @Output() readonly inputEnter = new EventEmitter<string>();

  placeholder: string | undefined = '';
  label = '';
  ariaLabel = 'Save';
  icon = 'save';
  hint1 = '';

  ngOnInit(): void {
    if (this.mode === 'add') {
      this.placeholder = '';
      this.label = 'Add Member';
      this.ariaLabel = 'Save';
      this.icon = 'save';
      this.hint1 = 'Enter the new member name and click save or press Enter';
    }
    if (this.mode === 'edit') {
      this.placeholder = 'You must enter a name';
      this.label = 'Edit Member Name';
      this.ariaLabel = 'Save';
      this.icon = 'save';
      this.hint1 = 'Edit the member name and click save or press Enter';
    }
  }

  enter = (value: string) => {
    /* clear input box */
    this.inputText = '';
    /* if entry is not '' then emit it for saving */
    if (value) {
      this.inputEnter.emit(value);
    }
    // tslint:disable-next-line: semicolon
  };
}
