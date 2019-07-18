import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

/**
 * This component supplies an input box that can operate in different modes:
 * - add: The displayed text and prompts are suited to a user adding a new member by entering a name in the input box.
 * - edit: The displayed text and prompts are suited to a user editing a member name and updating the server with that name.
 */
@Component({
  selector: 'app-member-input',
  templateUrl: './member-input.component.html',
  styleUrls: ['./member-input.component.scss'],
})
export class MemberInputComponent implements OnInit {
  @Input() mode = '';
  @Input() inputText = '';
  @Output() readonly inputEnter = new EventEmitter<string>();

  /* default is add mode */
  placeholder: string | undefined = '';
  label: 'Add Member' | 'Edit Member Name' = 'Add Member';
  ariaLabel: 'Save' = 'Save';
  icon: 'save' = 'save';
  hint:
    | 'Enter the new member name and click save or press Enter'
    | 'Edit the member name and click save or press Enter' =
    'Enter the new member name and click save or press Enter';

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      MemberInputComponent.name + ': Starting MemberInputComponent',
    );
  }

  ngOnInit(): void {
    /* set up edit mode if required */
    if (this.mode === 'edit') {
      this.placeholder = 'You must enter a name';
      this.label = 'Edit Member Name';
      this.ariaLabel = 'Save';
      this.icon = 'save';
      this.hint = 'Edit the member name and click save or press Enter';
    }
  }

  /**
   * The action button function.
   * It resets the input box value to ''.
   * It passes on the value parameter via an event.
   * If the value parameter is '' then no event is emitted, i.e. it is not possible to pass '' via the event.
   * @param value: The input box calls enter(inputBox.value) i.e. the value parameter passed in is the text in the input box when enter(inputBox.value) is called.
   */
  enter(value: string): void {
    this.logger.trace(MemberInputComponent.name + ': Calling enter(value)');
    /* clear the input box */
    this.inputText = '';
    /* if entry is not '' then emit it */
    if (value) {
      this.inputEnter.emit(value);
    }
  }
}
