# Build a required Docker image to be used in the staging process to build the application image

This is required to provide a Docker image containing node & puppeteer that can be used as a cloudbuilder in a GCP Build cloudbuild.yaml build step.  Puppeteer is required to run the client-side backend unit tests which use Chrome and it requires specific libraries that are not in the standard Node cloudbuilder images.

## Instructions

1. Open the GCP GDK console.
2. Change to this directory which hosts the cloudbuild.yaml and Dockerfiles.
3. Type: gcloud builds submit --config=cloudbuild.yaml .

This should push a Docker image to the project-perform Docker registry named 'gcr.io/project-perform/node12.13.0-with-puppeteer'.

This image is now available to be used as a custom cloudbuilder in a build step in a cloudbuild.yaml file.

You only need to rebuild this image if the version of Node to be used changes. In that case you will need to rebuild the image and change the reference in the cloudbuild.yaml files that use it.
