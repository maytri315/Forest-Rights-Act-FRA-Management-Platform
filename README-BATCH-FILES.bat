@echo off
cls
echo ===============================================
echo    SIH FRA Atlas System - Batch Files Guide
echo ===============================================
echo.
echo Essential Files (Use These):
echo.
echo   launcher.bat          - Main menu launcher (START HERE)
echo   install-all.bat       - Install all dependencies
echo   start-all-local.bat   - Start all services locally
echo   stop-all.bat          - Stop all running services
echo.
echo ===============================================
echo Utility Files:
echo.
echo   cleanup.bat           - Clean temporary files
echo   health-check.bat      - Check service health
echo   deploy-production.bat - Production deployment
echo   create_public_tunnels.bat - Public tunnel creation
echo   upload-to-github.bat  - Git operations
echo.
echo ===============================================
echo Quick Start:
echo.
echo   1. Run: launcher.bat
echo   2. Choose [1] to install dependencies (first time only)
echo   3. Choose [2] to start all services
echo   4. Access FRA Atlas at: http://localhost:5173
echo.
echo ===============================================
pause