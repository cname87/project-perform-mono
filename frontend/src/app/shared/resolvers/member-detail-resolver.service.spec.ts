import { TestBed } from '@angular/core/testing';

import { MemberDetailResolverService } from './member-detail-resolver.service';

describe('MemberDetailResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MemberDetailResolverService = TestBed.get(
      MemberDetailResolverService,
    );
    expect(service).toBeTruthy();
  });
});
