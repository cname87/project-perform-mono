# use an image with node that also supports puppeteer */
FROM 'gcr.io/project-perform/node12.13.0-with-puppeteer'

# leave the image workdir as the base directory
WORKDIR /

# copy the files from the source context to the image (relative to workdir).
COPY . .

# expose 8080 port to allow access to a running backend server
EXPOSE 8080

# To run an npm script:
# do not chnage workdir to run a top-level package.json script
# set the workdir to '/frontend' to run a frontend package.json script
# pass in 'npm', 'run' '<script>' as a RUN parameter or a docker-compose command parameter to run the npm script
# if no parameter is passed in then the default is that the'start' script will run
CMD ["npm", "run", "start"]
