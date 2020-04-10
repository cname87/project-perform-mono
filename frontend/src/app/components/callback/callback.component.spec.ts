import { APP_BASE_HREF } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NGXLogger } from 'ngx-logger';

import { AppModule } from '../../app.module';
import { CallbackComponent } from './callback.component';
import { AuthService } from '../../shared/auth.service/auth.service';

/* spy interfaces */
interface IAuthServiceSpy {
  handleAuthCallback: jasmine.Spy;
}

describe('CallbackComponent', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* stub logger to avoid console logs */
    const loggerSpy = jasmine.createSpyObj('NGXLogger', ['trace', 'error']);

    /* stub authService getAuth0Client method - define spy strategy below */
    const authServiceSpy = jasmine.createSpyObj('authService', [
      'handleAuthCallback',
    ]);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [AppModule],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NGXLogger, useValue: loggerSpy },
      ],
    }).compileComponents();
  }

  function createSpies(authServiceSpy: IAuthServiceSpy) {
    /* stub getAuth0Client() returning methods used */
    const handleAuthCallbackSpy = authServiceSpy.handleAuthCallback.and.stub();

    return {
      handleAuthCallbackSpy,
    };
  }

  function createExpected() {
    return {};
  }

  /* create the component, and get test variables */
  function createComponent() {
    /* create the fixture */
    const fixture = TestBed.createComponent(CallbackComponent);

    /* get the injected instances */
    const { injector } = fixture.debugElement;
    const authServiceSpy = injector.get<IAuthServiceSpy>(AuthService as any);

    const expected = createExpected();

    /* create the component instance */
    const component = fixture.componentInstance;

    /* get the spies */
    const { handleAuthCallbackSpy } = createSpies(authServiceSpy);

    return {
      fixture,
      component,
      handleAuthCallbackSpy,
      expected,
    };
  }

  /* setup function run by each it test function that needs to test before ngOnInit is run - none in this file */
  async function preSetup() {
    await mainSetup();
    const testVars = createComponent();
    return testVars;
  }

  /* setup function run by each it test function that runs tests after the component and view are fully established */
  async function setup() {
    const testVars = await preSetup();
    /* initiate ngOnInit and view changes etc */
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    testVars.fixture.detectChanges();
    await testVars.fixture.whenStable();
    return testVars;
  }

  describe('after ngOnInit', () => {
    it('should be created', async () => {
      const { component } = await setup();
      expect(component).toBeTruthy('component created');
    });

    it('should call auth.handleAuthCallback()', async () => {
      const { handleAuthCallbackSpy } = await setup();
      expect(handleAuthCallbackSpy).toHaveBeenCalled();
    });
  });
});
