import { TestBed, ComponentFixture } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';

import { AppModule } from '../../app.module';
import { MemberInputComponent } from './member-input.component';
import { findCssOrNot, sendInput } from '../../shared/test-helpers';

describe('memberInputComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([]),
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
      ],
    }).compileComponents();
  }

  class Page {
    /* get DOM elements */
    get input() {
      return findCssOrNot<HTMLInputElement>(this.fixture, '#inputBox');
    }
    get label() {
      return findCssOrNot<HTMLElement>(this.fixture, 'mat-label');
    }
    get actionBtn() {
      return findCssOrNot<HTMLButtonElement>(this.fixture, '#actionBtn');
    }
    get icon() {
      return findCssOrNot<HTMLElement>(this.fixture, 'mat-icon');
    }
    get hint() {
      return findCssOrNot<HTMLElement>(this.fixture, 'mat-hint');
    }

    constructor(readonly fixture: ComponentFixture<MemberInputComponent>) {}
  }

  function createSpies() {
    /* soy on the event handler called for the inputEnter eventemitter */
    const eventHandlerSpy = jasmine.createSpy();
    return { eventHandlerSpy };
  }

  function createExpected() {
    return {
      addPlaceholder: '',
      addLabel: 'Add Member',
      addHint: 'Enter the new member name and click save or press Enter',
      addAriaLabel: 'Save',
      addIcon: 'save',
      editPlaceholder: 'You must enter a name',
      editLabel: 'Edit Member Name',
      editHint: 'Edit the member name and click save or press Enter',
      editAriaLabel: 'Save',
      editIcon: 'save',
    };
  }

  /**
   * Create the MemberInputComponent, initialize it, set test variables.
   */
  async function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(MemberInputComponent);

    /* get the injected instances */

    /* create spies */
    const { eventHandlerSpy } = createSpies();

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* do not run fixture.detectChanges (i.e. ngOnIt here) as included below */

    /* create a page to access the DOM elements */
    const page = new Page(fixture);

    return {
      fixture,
      component,
      expected,
      page,
      eventHandlerSpy,
    };
  }

  describe('component', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return createComponent();
    }

    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('should match mode "add" ', async () => {
      const { component, fixture, page, expected } = await setup();
      /* set up 'add' mode */
      component.mode = 'add';
      component.inputText = '';
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* test all elements, including button not displaying */
      expect(page.input.value).toBe('', 'initial input value');
      expect(page.input.getAttribute('placeholder')).toBe(
        expected.addPlaceholder,
        'placeholder value',
      );
      expect(page.label.innerText).toBe(expected.addLabel, 'label value');
      expect(page.actionBtn).toBeNull('no button displayed');
      expect(page.icon).toBeNull('no button icon displayed');
      expect(page.hint.innerText).toBe(expected.addHint, 'hint value');
    });

    it('should match mode "edit" ', async () => {
      const { component, fixture, page, expected } = await setup();
      /* set up 'edit' mode */
      component.mode = 'edit';
      component.inputText = 'testName';
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* test all elements, including button not displaying */
      expect(page.input.value).toBe('testName', 'initial input value');
      expect(page.input.getAttribute('placeholder')).toBe(
        expected.editPlaceholder,
        'placeholder value',
      );
      expect(page.label.innerText).toBe(expected.editLabel, 'label value');
      expect(page.actionBtn.attributes['aria-label'].value).toBe(
        expected.editAriaLabel,
        'button displayed',
      );
      expect(page.icon.innerText).toBe(
        expected.editIcon,
        'button icon displayed',
      );
      expect(page.hint.innerText).toBe(expected.editHint, 'hint value');
    });

    it('should call enter() but not emit', async () => {
      const { component, fixture, eventHandlerSpy } = await setup();
      /* set up 'add' mode */
      component.mode = 'add';
      component.inputText = 'initial input text';
      /* listen for enter() event emit */
      component.inputEnter.subscribe(eventHandlerSpy);
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* manually call enter() with no text */
      component.enter('');
      /* test that inputText cleared and no event emitted */
      expect(component.inputText).toBe('', 'inputText cleared');
      expect(eventHandlerSpy).not.toHaveBeenCalledWith('no event emitted');
    });

    it('should call enter("test") manually', async () => {
      const { component, fixture, eventHandlerSpy } = await setup();
      /* set up 'add' mode */
      component.mode = 'add';
      component.inputText = 'initial input text';
      /* listen for enter() event emit */
      component.inputEnter.subscribe(eventHandlerSpy);
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* manually call enter() with test text */
      component.enter('test input text');
      /* test that inputText cleared and event emitted */
      expect(component.inputText).toBe('', 'inputText cleared');
      expect(eventHandlerSpy).toHaveBeenCalledWith('test input text');
    });

    it('should call enter() via action button', async () => {
      const { component, fixture, page, eventHandlerSpy } = await setup();
      /* set up 'add' mode */
      component.mode = 'add';
      component.inputText = 'initial input text';
      /* listen for enter() event emit */
      component.inputEnter.subscribe(eventHandlerSpy);
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* call enter() with the button */
      page.actionBtn.click();
      await fixture.detectChanges();
      /* test that inputText cleared and event emitted */
      expect(component.inputText).toBe('', 'inputText cleared');
      expect(eventHandlerSpy).toHaveBeenCalledWith('initial input text');
    });

    it('should bind input and call enter() when enter key detected', async () => {
      const { component, fixture, page, eventHandlerSpy } = await setup();
      /* set up 'add' mode */
      component.mode = 'add';
      component.inputText = 'initial';
      /* listen for enter() event emit */
      component.inputEnter.subscribe(eventHandlerSpy);
      /* initiate ngOnInit */
      await fixture.detectChanges();
      /* await button appearance */
      await fixture.detectChanges();
      /* add text to input */
      sendInput(fixture, page.input, 'added', true);
      await fixture.detectChanges();
      expect(page.input.value).toBe('initialadded', 'confirm input text');
      /* text added to inputText variable via ngModel binding */
      expect(component.inputText).toBe('initialadded', 'confirm binding');
      /* no enter() without click or press enter */
      expect(eventHandlerSpy).not.toHaveBeenCalled();
      /* simulate keyup on enter key and enter() is called */
      const keyupEnterEvent = new KeyboardEvent('keyup', {
        key: 'enter',
      });
      page.input.dispatchEvent(keyupEnterEvent);
      await fixture.detectChanges();
      /* input has been cleared and event handler called */
      expect(component.inputText).toBe('', 'inputText cleared');
      expect(eventHandlerSpy).toHaveBeenCalledWith('initialadded');
    });
  });
});
