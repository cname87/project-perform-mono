import { Injectable } from '@angular/core';
import { BehaviorSubject, from } from 'rxjs';
import { IUserProfile } from '../../config';

@Injectable({
  providedIn: 'root',
})
export class MockAuthService {
  constructor() {
    /* do nothing */
  }

  public isLoggedIn = true;

  public isAuthenticated$ = from(Promise.resolve(true));

  public userProfile$ = new BehaviorSubject<IUserProfile>({
    email: 'testProfile.email',
    name: 'testProfile.name',
  }).asObservable();

  public getTokenSilently$() {
    return from(Promise.resolve('testToken'));
  }
}
