# Modalidad a distancia: simulador ORBE

Rama `modalidad-distancia`. Agrega un simulador 3D dentro de GrIDIE Blocks para probar los
programas sin placa, usando [ORBE](https://github.com/orbefab/orbe) (MIT o Apache-2.0).

## Cómo probarlo

**App de escritorio (Windows), igual que siempre:**

```sh
npm install
npm run dev
```

**En el navegador** (lo que usaría un alumno a distancia por web). Para compilar, el propio
Vite atiende `/api/compilar`; en Windows usa solo el arduino-cli que ya viene en `electron/`
(con su core AVR y la librería Servo), así que alcanza con:

```sh
npm run dev:web
```

En otro sistema, o para usar otro arduino-cli, se indican `ARDUINO_CLI`, `ARDUINO_CLI_CONFIG`
y `ARDUINO_LIBRERIAS`.

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
- `servidor-compilacion/`: servidor de compilación que además sirve la versión web
  (caché por hash, cola, iframe para Moodle). Cómo correrlo en una PC con Windows +
  Cloudflare Tunnel o en Render gratis: ver `servidor-compilacion/LEEME.md`
  (`Dockerfile` y `render.yaml` en la raíz).
- `electron/main.js`: nuevo IPC `arduino:compile` para el simulador, y la interfaz se sirve
  por `app://` en producción (el simulador necesita fetch y Web Workers, que con file:// no andan).
