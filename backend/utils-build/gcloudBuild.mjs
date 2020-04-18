import { exec, spawn } from "child_process";

/* set up a unique version tag that will be substituted below for SHORT_SHA */
/* must start have only lower-case letters, digits or hyphens and must end with a letter or digit */
let tag = '';
tag += new Date(Date.now()).toISOString();
const regex = /(-|:|\.)/g
tag = tag.replace(regex, '');
tag = tag.toLowerCase();

'* build the shell command */'
const gcloudExePath = '/home/cname87/google-cloud-sdk/bin/gcloud';
const cloudbuildPath = '/home/cname87/Dropbox/software/projects/main/project-perform-k8es/';
const gcloudParams = ' builds submit --quiet --config=' + cloudbuildPath + 'cloudbuild.yaml . --substitutions=SHORT_SHA='
const command = gcloudExePath + gcloudParams + tag;

console.log('Running ' + command);

/* note that a user account referencing the correct project and with appropriate permissions must be set up on the host machine */

/* will run the command in a shell visible on the terminal */
const child = spawn(command, {
  stdio: 'inherit',
  shell: true,
});
