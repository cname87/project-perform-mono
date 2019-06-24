import { TestBed } from '@angular/core/testing';
import { APP_BASE_HREF } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { Router } from '@angular/router';

import { AppModule } from '../../app.module';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './error-handler.service';
import { MessageService } from '../services/message.service';
import { ToastrService } from 'ngx-toastr';

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
        type: 'testType',
        message: 'test message',
        status: 'test status',
        body: 'test body',
        error: 'test error',
      },
      testHttpErrorReport: {
        type: 'testType',
        message: 'test message',
        status: 'test status',
        body: 'test body',
      },
      testNonHttpError: {
        message: 'test message',
        stack: 'test stack',
        isUserInformed: true,
      },
      testNonHttpErrorReport: {
        type: 'Non-http error',
        message: 'test message',
        stack: 'test stack',
      },
      testError: 'test error',
      testErrorReport: {
        type: 'Non-http error',
        message: 'test error',
        stack: 'Not supplied',
      },
      initialErrorCount: 0,
      reloadCount: 3,
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
    const navigateByUrlSpy = routerSpy.navigateByUrl.and.stub();

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
   * Create the MemberDetailComponent, initialize it, set test variables.
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
    const {
      testHttpError,
      testHttpErrorReport,
      testNonHttpError,
      testNonHttpErrorReport,
      testError,
      testErrorReport,
      initialErrorCount,
      reloadCount,
    } = expected();

    return {
      errorHandlerService,
      traceLoggerSpy,
      errorLoggerSpy,
      addMessageSpy,
      errorRollbarSpy,
      errorToastrSpy,
      navigateByUrlSpy,
      testHttpError,
      testHttpErrorReport,
      testNonHttpError,
      testNonHttpErrorReport,
      testError,
      testErrorReport,
      initialErrorCount,
      reloadCount,
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

    it('should have counts at initial values', async () => {
      const {
        errorHandlerService,
        initialErrorCount,
        reloadCount,
      } = await setup();

      expect(errorHandlerService['unexpectedErrorCount']).toBe(
        initialErrorCount,
      );
      expect(errorHandlerService['reloadCount']).toBe(reloadCount);
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
      const { errorHandlerService, traceLoggerSpy } = await setup();
      errorHandlerService.handleError('test error');
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
        errorToastrSpy,
        navigateByUrlSpy,
        testHttpError,
        testHttpErrorReport,
        initialErrorCount,
      } = await setup();
      errorHandlerService.handleError(testHttpError);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Http error reported',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Logging error',
      );
      expect(errorLoggerSpy).toHaveBeenCalledWith(testHttpErrorReport);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Sending error to Rollbar',
      );
      expect(errorRollbarSpy).toHaveBeenCalledWith(testHttpError.error);
      /* isUserInformed not set on testHttpError */
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Informing user',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Reporting: ERROR: An unknown error occurred',
      );
      expect(navigateByUrlSpy).toHaveBeenCalledWith('/errorinformation/error');
      expect(errorToastrSpy).toHaveBeenCalledWith(
        'ERROR!',
        'An unknown error has occurred',
      );
      /* count is not incremented by a http error */
      expect(initialErrorCount).toBe(initialErrorCount);
    });

    it('logs a non http error', async () => {
      const {
        errorHandlerService,
        traceLoggerSpy,
        errorLoggerSpy,
        errorRollbarSpy,
        testNonHttpError,
        testNonHttpErrorReport,
        initialErrorCount,
      } = await setup();
      errorHandlerService.handleError(testNonHttpError);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Non-http error reported',
      );
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Logging error',
      );
      expect(errorLoggerSpy).toHaveBeenCalledWith(testNonHttpErrorReport);
      expect(traceLoggerSpy).toHaveBeenCalledWith(
        'ErrorHandlerService: Sending error to Rollbar',
      );
      expect(errorRollbarSpy).toHaveBeenCalledWith(testNonHttpError);
      /* isUserInformed is set on testNonHttpError */
      expect(traceLoggerSpy).not.toHaveBeenCalledWith(
        'ErrorHandlerService: Informing user',
      );
      /* count is incremented by a non-http error */
      expect(errorHandlerService['unexpectedErrorCount']).toBe(
        initialErrorCount + 1,
      );
    });

    it('logs a test error with no error.message', async () => {
      const {
        errorHandlerService,
        errorLoggerSpy,
        testError,
        testErrorReport,
      } = await setup();
      errorHandlerService.handleError(testError);
      expect(errorLoggerSpy).toHaveBeenCalledWith(testErrorReport);
    });

    it('logs a test error with no message or stack', async () => {
      const {
        errorHandlerService,
        errorLoggerSpy,
        testError,
        testErrorReport,
      } = await setup();
      errorHandlerService.handleError(testError);
      expect(errorLoggerSpy).toHaveBeenCalledWith(testErrorReport);
    });

    it('logs 3 non-http errors', async () => {
      const {
        errorHandlerService,
        testError,
        initialErrorCount,
        reloadCount,
      } = await setup();
      /* spy on method containing window.reload */
      const reloadSpy = spyOn(errorHandlerService, 'reload').and.stub();
      let errorCount = initialErrorCount;

      for (let i = 1; i < reloadCount; i++) {
        errorHandlerService.handleError(testError);
        /* count is incremented by a non-http error */
        expect(errorHandlerService['unexpectedErrorCount']).toBe(++errorCount);
      }
      errorHandlerService.handleError(testError);
      /* count is reset */
      expect(errorHandlerService['unexpectedErrorCount']).toBe(0);
      expect(reloadSpy).toHaveBeenCalled();
    });
  });
});
