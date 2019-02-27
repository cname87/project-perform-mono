@ECHO OFF
SETLOCAL ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

TASKKILL /IM node.exe /F
REM - could also use TSKILL

REM Taskkill
REM The command syntax is
REM TASKKILL [/S system [/U username [/P[password]]]]{ [/FI filter]
REM [/PID processid | /IM imagename] } [/F] [/T]
REM The various parameters are:

REM Parameter	Description
REM /S system	Specifies the remote system to connect to. Not needed for most home PCs
REM /U username	User context under which the command should execute. Often not needed on home PCs
REM /P password	Password for username
REM /FI filter	Displays a set of tasks that match criteria specified by the filter
REM /PID process id	Specifies the PID of the process that has to be terminated. Not used when image name is given in the command
REM /IM imagename	Specifies the image name of the process that has to be terminated. Wildcard '*' can be used to specify all image names. Not used if PID is given in the command
REM /F	Forces the termination of all processes
REM /T	Tree kill: terminates the specified process and any child processes which were started by it


REM @ suppresses output during the operation
REM To pause before exit awaiting user input
REM @PAUSE
REM To hold window open afterwards (and return 0)
REM @EXIT /B 0
REM To close window (and return 0)
REM @EXIT 0

:END
ENDLOCAL
REM ECHO ON
@EXIT 0
REM @PAUSE
REM @EXIT /B 0