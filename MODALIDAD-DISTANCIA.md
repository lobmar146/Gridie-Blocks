# Modalidad a distancia: simulador ORBE

Rama `modalidad-distancia`. Agrega un simulador 3D dentro de GrIDIE Blocks para probar los
programas sin placa, usando [ORBE](https://github.com/orbefab/orbe) (MIT o Apache-2.0).

## Cómo probarlo

**App de escritorio (Windows), igual que siempre:**

```sh
npm install
npm run dev
```

**En el navegador** (lo que usaría un alumno a distancia por web). Necesita un arduino-cli
para compilar, que en desarrollo atiende el propio Vite en `/api/compilar`:

```sh
# PowerShell, usando el arduino-cli que ya viene en electron/
$env:ARDUINO_CLI="$PWD\electron\arduino-cli.exe"
$env:ARDUINO_LIBRERIAS="$PWD\electron\arduino-data\libraries"
npm run dev:web
```

En cada desafío aparece el botón **Probar en simulador**, que abre el panel en dos etapas:

1. **Conectar:** el alumno elige a qué pin del Arduino va cada cable (los rieles de la
   protoboard y la señal de cada componente) y lo ve en 3D. Con «Verificar conexiones» se
   marca cada cable bien o mal; cuando están todos bien pasa a la etapa 2. Lo que conectó se
   recuerda en el navegador, por desafío.
2. **Probar:** compila el programa y lo corre en ese circuito, con controles para los sensores.

## Qué hay

- `simulador/`: el puente con ORBE. Trae copiados el visor 3D de ORBE (`vendor/orbe-viewer`),
  el motor compilado a WebAssembly (`vendor/orbe-wasm`, ORBE v0.3.1) y las piezas
  (`vendor/orbe-parts`). `npm run build:simulador` lo compila a `public/simulador/`, que ya
  está en el repo, así que no hace falta Rust ni compilarlo para usar la app.
- `src/simulador/escenas.js`: el circuito de cada desafío, con los mismos pines que usa el
  generador de código. Los sensores que ORBE todavía no tiene se simulan con una pieza que da
  la misma señal: PIR, obstáculos y fuego con un pulsador; humedad, gas y ultrasónico con un
  potenciómetro. El panel muestra controles con el nombre de cada sensor.
- `src/simulador/codigoSimulador.js`: solo para el simulador, `lecturaUltrasonica()` lee la
  distancia del control en A1 en vez de medir el eco. El código que ve el alumno no cambia.
- `src/simulador/parlante.js`: hace sonar el parlante en la compu mientras el pin oscila.
- `servidor-compilacion/`: servidor de compilación para publicar la versión web
  (`npm run servidor-compilacion`, con `ARDUINO_CLI` apuntando a un arduino-cli con el core AVR).
  La web lo encuentra en `VITE_COMPILADOR_URL`.
- `electron/main.js`: nuevo IPC `arduino:compile` para el simulador, y la interfaz se sirve
  por `app://` en producción (el simulador necesita fetch y Web Workers, que con file:// no andan).
