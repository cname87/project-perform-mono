import { NgModule } from '@angular/core';
import { RouterLinkDirectiveStub } from './router-link-directive-stub';

/**
 * This module avoids an "aot" throwing an error that RouterLinkDirective is not included in any module as it is only used in spec.ts test files.  This module is not actually used anywhere.
 */
@NgModule({
  imports: [],
  declarations: [RouterLinkDirectiveStub],
})
export class TestHelperModule {}
