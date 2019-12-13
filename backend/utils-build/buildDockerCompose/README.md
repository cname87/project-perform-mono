# Build a Docker-Compose image

This is required to provide a Docker image containing Docker-Compose that can be used as a cloudbuilder in a GCP Build cloudbuild.yaml build step.

## Instructions

Edit the version number in three places in cloudbuild.yaml and in DockerFile to the latest version of Docker-Compose - see <https://github.com/docker/compose/releases>

1. Open the GCP GDK console.
2. Change to this directory.
3. Type: gcloud builds submit --config cloudbuild.puppeteer.yaml .

This should push a Docker image to the project-perform Docker registry named 'gcr.io/project-perform/docker-compose:latest', (and also .../docker-compose:vx.xx).

This image is now available to be used as a custom cloudbuilder in a build step in a cloudbuild.yaml file.

You only need to rebuild this image if you wish to update the version of Docker-Compose to be used. In that case you will need to rebuild the image.  (Use '...:latest' so no need to update the cloudbuild.yaml files that use the image)
