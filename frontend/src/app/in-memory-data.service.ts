import { InMemoryDbService } from 'angular-in-memory-web-api';
import { Member } from './membersApi/membersApi';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class InMemoryDataService implements InMemoryDbService {
  createDb() {
    const members = [
      { id: 11, name: 'Mr. Nice' },
      { id: 12, name: 'Narco' },
      { id: 13, name: 'Bombasto' },
      { id: 14, name: 'Celeritas' },
      { id: 15, name: 'Magneta' },
      { id: 16, name: 'RubberMan' },
      { id: 17, name: 'Dynama' },
      { id: 18, name: 'Dr IQ' },
      { id: 19, name: 'Magma' },
      { id: 20, name: 'Tornado' },
    ];
    return { members };
  }

  // Overrides the genId method to ensure that a member always has an id.
  // If the members array is empty,
  // the method below returns the initial number (11).
  // if the members array is not empty, the method below returns the highest
  // member id + 1.
  genId(members: Member[]): number {
    return members.length > 0
      ? Math.max(...members.map((member) => member.id)) + 1
      : 11;
  }
}
