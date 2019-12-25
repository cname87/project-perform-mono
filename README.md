# Proof of Concept project-perform web application

The functionality in this POC is limited but the application is fully production-ready and very extensible.

The application is hosted on Google Cloud Platform at <https://project-perform.appspot.com/>.  It runs a Single Page Application on the user’s web browser and accesses a database hosted by MongoDB Atlas via a REST API described using OpenAPI specification at <https://app.swaggerhub.com/apis/cname87/Teams/1.0.0>.  The source code is hosted on GitHub at <https://github.com/cname87/project-perform>. Full CI/CD is in place with every check-in to the master branch triggering a build on GCP that runs full backend and front-end unit tests and application e2e tests before deploying to the GCP App Engine Standard server.

The web application is built on a MEAN stack – ‘MongoDB, Express.js, Angular, Node.js’ with full-featured logging, error handling reporting & monitoring via <https://rollbar.com/>, high unit test coverage using Mocha and Karma/Jasmine, & full e2e test coverage using Protractor.  It includes Auth0 authentication using <https://auth0.com/>. It is hosted on Google Cloud Platform App Engine which offers performance, reliability & monitoring.

## Technologies

### Core World Wide Web technologies

* **Javascript**:  Javascript is the programming language underlying Typescript used to write the backend server and client-side application.
* **HTML**: The standard web markup language.
* **CSS**: the language used to describe the style or presentation of a web document.

### Programming Language

* **Typescript**: The backend and frontend were written in Typescript which is a superset of Javascript offering static typing and the latest ECMAScript features.

### Backend Server technologies

* **Node.js**: Node is a runtime built on Chrome’s V8 Javascript engine that provides a framework upon which you can develop server-side applications.
* **NPM**:  npm provides a means for sourcing and managing external packages, and also scripting for building and testing the application.
* **Express.js**: A Node.js web application for developing a HTTP server – provides the ability to easily define routes and request handlers.
* **OpenAPI**: A tool to describe a backend API and then generate server stubs.
* Mocha: Mocha provides a unit-test framework.

### Database technology

* **MongoDB**: MongoDB is a NoSQL database suitable for web applications.  The data is hosted by MongoDB Atlas who provide a fully-managed cloud database with security and redundancy.
* **Mongoose**: Mongoose is a Node.js package that provides MongoDB application data modelling, validation and business logic hooks.

### Frontend technology

* **Angular**:  Angular is a framework for developing client-side web applications and provides a means to develop robust extensible applications.
* **Angular Material**: Offers component infrastructure and Material Design components for Angular.
* **Angular/Flex-Layout**: Provides HTML UI layout for Angular applications.
* **Karma/Jasmine**: The font-end unit test framework uses Karma to run the client-side application and Jasmine to provide the test scripting, assertions, and reporting.
* **Protractor**: Protractor is an end-to-end test framework for Angular applications – it runs tests against a real browser and can test staged and deployed builds.

### Development Environment

* **Git**: Git is a distributed version control system – the source code is hosted on GitHub.
* **VSCode**: Visual Studio Code is a streamlined code editor with support for development operations like debugging, task running, and version control.

### Build & Deployment

* **Google Cloud Build**: Cloud Build is a service that executes builds on GCP’s infrastructure producing a Docker image for deployment.
* **Docker**: Docker is the underlying container technology used by Cloud Build.
* **Google Cloud Storage**: Cloud Storage is used to host environment variables, certs, keys and other sensitive data not hosted on GitHub.
* **Google Cloud Platform**: The application is hosted on GCP App Engine – Standard.
