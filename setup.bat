@echo off
setlocal enabledelayedexpansion

rem Get the current directory of the batch file
set "PROJECT_DIR=%~dp0"

rem Define the alias using doskey
doskey instaRS=!PROJECT_DIR!test.bat