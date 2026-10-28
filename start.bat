
@echo off
title Student Task Management System

echo Starting Client and Server...

start "Client" cmd /k "cd /d "%~dp0client" && npm run dev"
start "Server" cmd /k "cd /d "%~dp0server" && npm run dev"

echo Both processes have been launched.
exit
