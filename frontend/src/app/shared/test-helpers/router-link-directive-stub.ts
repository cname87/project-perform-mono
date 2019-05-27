import { Directive, Input, HostListener } from '@angular/core';

// export for convenience.
export { RouterLink } from '@angular/router';

/* tslint:disable:directive-class-suffix */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[routerLink]',
})
export class RouterLinkDirectiveStub {
  @Input('routerLink') linkParams: any;
  navigatedTo: any = null;

  @HostListener('click') onClick() {
    this.navigatedTo = this.linkParams;
  }
}
