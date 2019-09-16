import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AppModule } from '../../app.module';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './error-handler.service';
import { MessageService } from '../message-service/message.service';
import { errorTypes } from '../../config';

interface INgxLoggerSpy {
  trace: jasmine.Spy;
  error: jasmine.Spy;
}

interface IMessageServiceSpy {
  add: jasmine.Spy;
}
interface IRollbarServiceSpy {
  error: jasmine.Spy;
}

interface IToastrSpy {
  error: jasmine.Spy;
}

interface IRouterSpy {
  navigateByUrl: jasmine.Spy;
}

describe('ErrorHandlerService', () => {
  /* setup function run by each sub test suite */
  async function mainSetup() {
    /* create spies to be injected */
    const ngxLoggerSpy = jasmine.createSpyObj('ngxLogger', ['trace', 'error']);
    const messageServiceSpy = jasmine.createSpyObj('messageService', ['add']);
    const rollbarServiceSpy = jasmine.createSpyObj('rollbarService', ['error']);
    const toastrServiceSpy = jasmine.createSpyObj('toastrService', ['error']);
    const routerSpy = jasmine.createSpyObj('routerSpy', ['navigateByUrl']);

    /* set up Testbed */
    await TestBed.configureTestingModule({
      imports: [
        AppModule, // import AppModule to pull in all dependencies in one go.
      ],
      declarations: [],
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' }, // avoids an error message
        ErrorHandlerService,
        { provide: NGXLogger, useValue: ngxLoggerSpy },
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: RollbarService, useValue: rollbarServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  }

  /**
   * List all expected 'magic' values here to be used in tests.
   */
  function expected() {
    return {
      testHttpError: {
        allocatedType: errorTypes.httpServerSide,
        message: 'test message',
        status: 'test status',
        body: 'test body',
        error: 'test error',
        /* set true by the members.service call */
        isHandled: true,
      },
      testHttpErrorReport: {
        allocatedType: errorTypes.httpServerSide,
        message: 'test message',
        status: 'test status',
        body: 'test body',
        error: 'test error',
        isHandled: true,
      },
      testNonHttpError: {
        /* no type property */
        message: 'test message',
        stack: 'test stack',
        /* unexpected error */
        isHandled: false,
      },
      testNonHttpErrorReport: {
        message: 'test message',
        stack: 'test stack',
        isHandled: false,
      },
      testError: 'test error',
      testErrorReport: 'test error',
    };
  }

  function createSpies(
    ngxLoggerSpy: INgxLoggerSpy,
    messageServiceSpy: IMessageServiceSpy,
    rollbarServiceSpy: IRollbarServiceSpy,
    toastrServiceSpy: IToastrSpy,
    routerSpy: IRouterSpy,
  ) {
    const traceLoggerSpy = ngxLoggerSpy.trace.and.stub();
    const errorLoggerSpy = ngxLoggerSpy.error.and.stub();
    const addMessageSpy = messageServiceSpy.add.and.stub();
    const errorRollbarSpy = rollbarServiceSpy.error.and.stub();
    const errorToastrSpy = toastrServiceSpy.error.and.stub();
    const ngToastrSpy = jasmine.createSpy('ngToastr').and.callFake((fn) => {
      fn();
    });
    const navigateByUrlSpy = routerSpy.navigateByUrl.and.callFake(() => ({
      then: ngToastrSpy,
    }));

    return {
      traceLoggerSpy,
      errorLoggerSpy,
      addMessageSpy,
      errorRollbarSpy,
      errorToastrSpy,
      navigateByUrlSpy,
    };
  }

  /**
   * Get the service, initialize it, set test variables.
   */
  async function getService() {
    /* create the fixture */
    const errorHandlerService = TestBed.get(ErrorHandlerService);

    /* get the injected instances */
    /* angular.io guide suggests you need to get these from injector.get.  It seemed to work when I just used the 'useValues' in configureTestingModule but now implementing as per guide */
    const ngxLoggerSpy = TestBed.get(NGXLogger);
    const messageServiceSpy = TestBed.get(MessageService);
    const rollbarServiceSpy = TestBed.get(RollbarService);
    const toastrServiceSpy = TestBed.get(ToastrService);
    const routerSpy = TestBed.get(Router);

    const {
      traceLoggerSpy,
      errorLoggerSpy,
      addMessageSpy,
      errorRollbarSpy,
      errorToastrSpy,
      navigateByUrlSpy,
    } = createSpies(
      ngxLoggerSpy,
      messageServiceSpy,
      rollbarServiceSpy,
      toastrServiceSpy,
      routerSpy,
    );

    /* give access to expected magic vales */
    const expectedValues = expected();

    return {
      errorHandlerService,
      traceLoggerSpy,
      errorLoggerSpy,
      addMessageSpy,
      errorRollbarSpy,
      errorToastrSpy,
      navigateByUrlSpy,
      ...expectedValues,
    };
  }

  describe('service', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('should be created', async () => {
      const { errorHandlerService } = await setup();
      expect(errorHandlerService).toBeTruthy();
    });

    it('should have a log function', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        addMessageSpy,
      } = await setup();
      errorHandlerService['log']('test string');
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Reporting: test string',
      );
      expect(addMessageSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: test string',
      );
    });

    it('should have a rollbar factory', async () => {
      await setup();

      expect(rollbarFactory()).toBeDefined();
    });
  });

  describe('has a handleError function that', async () => {
    /* setup function run by each sub test function */
    async function setup() {
      await mainSetup();
      return getService();
    }

    it('traces that it has been called', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        testHttpError,
      } = await setup();
      errorHandlerService.handleError(testHttpError);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: handleError called',
      );
    });

    it('logs a http error', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        errorLoggerSpy,
        errorRollbarSpy,
        testHttpError,
        testHttpErrorReport,
      } = await setup();
      errorHandlerService.handleError(testHttpError);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Http error reported',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Logging the error',
      );
      expect(errorLoggerSpy).toHaveBeenCalledWith(testHttpErrorReport);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Sending error to Rollbar',
      );
      expect(errorRollbarSpy).toHaveBeenCalledWith(testHttpError);
      /* isHandled is set true on testHttpError */
      expect(traceLoggerSpy).not.toHaveBeenCalledWith(
        'ErrorHandlerService: Reporting: ERROR: An unknown error occurred',
      );
    });

    it('logs a non-http error', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        errorLoggerSpy,
        errorRollbarSpy,
        errorToastrSpy,
        navigateByUrlSpy,
        testNonHttpError,
        testNonHttpErrorReport,
      } = await setup();
      errorHandlerService.handleError(testNonHttpError);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Unexpected error reported',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Logging the error',
      );
      expect(errorLoggerSpy).toHaveBeenCalledWith(testNonHttpErrorReport);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Sending error to Rollbar',
      );
      expect(errorRollbarSpy).toHaveBeenCalledWith(testNonHttpError);
      /* isHandled is set false on testNonHttpError */
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Reporting: ERROR: An unknown error occurred',
      );
      expect(navigateByUrlSpy).toHaveBeenCalledWith('/information/error');
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Showing toastr message',
      );
      expect(errorToastrSpy).toHaveBeenCalledWith(
        'ERROR!',
        'An unknown error has occurred',
      );
    });

    it('logs a test error with no error.message', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        errorLoggerSpy,
        errorRollbarSpy,
        errorToastrSpy,
        navigateByUrlSpy,
        testError,
        testErrorReport,
      } = await setup();
      errorHandlerService.handleError(testError);
      expect(errorLoggerSpy).toHaveBeenCalledWith(testErrorReport);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Unexpected error reported',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Sending error to Rollbar',
      );
      expect(errorRollbarSpy).toHaveBeenCalledWith(testError);
      /* isHandled is set false on testNonHttpError */
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Reporting: ERROR: An unknown error occurred',
      );
      expect(navigateByUrlSpy).toHaveBeenCalledWith('/information/error');
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Showing toastr message',
      );
      expect(errorToastrSpy).toHaveBeenCalledWith(
        'ERROR!',
        'An unknown error has occurred',
      );
    });
  });
});
