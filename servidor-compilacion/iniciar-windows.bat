@echo off
rem Arranca el servidor de compilacion + la version web de GrIDIE en esta PC.
rem Doble clic para iniciarlo. Cerrar la ventana lo apaga.
chcp 65001 >nul
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
  echo Falta Node.js. Instalalo desde https://nodejs.org ^(version LTS^) y volve a abrir esto.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias ^(solo la primera vez^)...
  set ELECTRON_SKIP_BINARY_DOWNLOAD=1
  call npm ci --no-audit --no-fund || goto error
)

echo Compilando la version web...
call npm run build:web || goto error

if "%PUERTO%"=="" set PUERTO=8787
if "%CARPETA_CACHE%"=="" set CARPETA_CACHE=%LOCALAPPDATA%\gridie-cache-hex
if "%CONCURRENCIA%"=="" set CONCURRENCIA=2

echo.
echo GrIDIE queda en http://localhost:%PUERTO%/
echo Para publicarlo en internet, en otra ventana:  cloudflared tunnel --url http://localhost:%PUERTO%
echo.
node servidor-compilacion\servidor.mjs
pause
exit /b 0

:error
echo Algo fallo. Revisa los mensajes de arriba.
pause
exit /b 1
