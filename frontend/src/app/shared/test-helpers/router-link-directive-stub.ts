import { Directive, Input, HostListener } from '@angular/core';

// export for convenience.
export { RouterLink } from '@angular/router';

@Directive({
  /*  specifies the selector that identifies the attribute */
  selector: '[routerLink]',
})
export class RouterLinkDirectiveStub {
  /* the string assigned to the [routerLink] attribute in the component template (which is generally a url or array of url segments) is bound to the local variable linkParams */
  @Input('routerLink') linkParams: string | string[] = '';

  /* when the user clicks the host element the local property navigatedTo is set to linkParams allowing a test as to what is being passed to the routerlink directive */
  navigatedTo: string | string[] | null = null;

  @HostListener('click') onClick() {
    this.navigatedTo = this.linkParams;
  }
}
