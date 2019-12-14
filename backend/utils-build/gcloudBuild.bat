@ECHO OFF
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION
CLS

REM set up unique version tag with allowed characters
SET tag=d%DATE%t%TIME%
SET tag=%tag:J=j%
SET tag=%tag:F=f%
SET tag=%tag:M=m%
SET tag=%tag:A=j%
SET tag=%tag:M=f%
SET tag=%tag:S=s%
SET tag=%tag:O=o%
SET tag=%tag:N=n%
SET tag=%tag:D=d%
SET tag=%tag:/=%
SET tag=%tag::=%
SET tag=%tag:.=%
SET _TAG=%tag%

SET PATH=C:\Users\cname\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin;%PATH%;
CD C:\Users\cname\dropbox\software\projects\projects\project-perform

ECHO "Running gcloud --quiet builds submit --config=cloudbuild.yaml . --substitutions=_SHORT_SHA=%_TAG%"

REM _SHORT_SHA is used to set the GCP App Engine version
REM _SHORT_SHA will be set by github when triggered from github

REM Run the gcloud command
gcloud --quiet builds submit --config=cloudbuild.yaml --substitutions=_SHORT_SHA=%_TAG%

ENDLOCAL
@EXIT 0
