import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';

import { MembersService } from './members.service';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardResolverService implements Resolve<any> {
  constructor(private membersService: MembersService) {}

  resolve(): any {
    return this.membersService.getMembers().pipe((members) => {
      return of(members);
    });
  }
}
