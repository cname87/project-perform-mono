# Set up of pages for e2e test

We define elements for every html component tag.

## Root page

The root app-page contains the following components:

- app-login
- app-nav
- router-outlet (see below)
- app-messages

## Routed pages

Each routed page loads a separate component in the router-outlet and might alter the display of the other three components.  The loaded component may contain other components.

The following are the routed pages and the components they load in place of router-outlet, and any components :

- 'information/login' page containing a login notice:
  - app-login
- 'information/notfound' page containing a not found notice:
  app-information
- 'information/error' page containing an error notice:
  - app-information
- 'profile' page containing user information:
  - app-profile
- 'dashboard' page containing top members:
  - app-dashboard
    - app-card
    - app-member-search
- 'memberslist' page containing a list of members:
  - app-members
    - app-member-input.
- 'detail/:id' member detail page containing single member detail:
  - app-member-detail
    - app-member-input.

## Page modules

A page module exists for each page.

A get page function is exported which returns the elements in the root and other components that appear on the page (see below), along with any necessary helper functions.


## Elements modules

An elements module exists for each component.

A get elements function is exported which returns all needed elements that appear on the component.
