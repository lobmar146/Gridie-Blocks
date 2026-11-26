# Servidor de compilación de GrIDIE Blocks

La versión web de GrIDIE no puede compilar Arduino dentro del navegador: le manda el programa
del alumno a este servidor, que lo compila con `arduino-cli` y devuelve el `.hex` que corre el
simulador. El mismo servidor también sirve la página de GrIDIE, así que con **una sola
dirección** los alumnos tienen todo.

Qué hace:

- **Caché:** guarda cada `.hex` por el hash del código. Si 30 alumnos arman el mismo programa,
  se compila una sola vez y los demás reciben la respuesta al instante.
- **Cola:** compila de a `CONCURRENCIA` programas por vez; si hay más de `COLA_MAXIMA`
  esperando, responde "ocupado" y la página reintenta sola un par de veces.
- **Límite por alumno:** `LIMITE_POR_MINUTO` compilaciones por minuto por IP (por defecto 120; un aula entera puede salir por la misma IP).
- **Moodle:** permite mostrarse dentro de un iframe (ver más abajo).
- `GET /salud` muestra si está vivo y cuántos pedidos atendió.

Hay dos formas de ponerlo en internet gratis. Para probar con una o dos máquinas, cualquiera
de las dos alcanza.

---

## Opción A: en tu PC con Windows + Cloudflare Tunnel

Usa el `arduino-cli.exe` que ya viene en `electron/`, así que no hay que instalar nada de
Arduino.

### 1. Una sola vez

1. Instalá **Node.js LTS** desde <https://nodejs.org> (siguiente, siguiente).
2. Instalá **cloudflared**. En una terminal (PowerShell):
   ```
   winget install --id Cloudflare.cloudflared
   ```
   (Si no tenés `winget`, bajá el `.msi` de
   <https://github.com/cloudflare/cloudflared/releases/latest>.)
3. Traé la última versión:
   ```
   cd "C:\Users\lobma\Desktop\Desktop\Martín\2025\Gridie-Blocks"
   git fetch origin
   git checkout main
   git pull
   ```

### 2. Cada vez que lo quieras prender

1. Doble clic en `servidor-compilacion\iniciar-windows.bat`.
   La primera vez instala dependencias; después compila la web y arranca. Cuando diga
   `Compilador listo`, abrí <http://localhost:8787> en esa PC para chequear.
2. En **otra** ventana de PowerShell:
   ```
   cloudflared tunnel --url http://localhost:8787
   ```
   Al rato muestra una dirección del estilo `https://palabras-al-azar.trycloudflare.com`.
   **Esa es la dirección para los alumnos.** Funciona desde cualquier lado, con HTTPS, sin
   abrir puertos del router y sin cuenta.

Para apagarlo, cerrá las dos ventanas.

Cosas a tener en cuenta:

- La dirección `trycloudflare.com` **cambia cada vez** que reiniciás `cloudflared`. Para
  probar alcanza. Para una dirección fija hace falta una cuenta gratis de Cloudflare y un
  dominio propio (un "named tunnel"); cuando llegue ese momento lo armamos.
- La PC tiene que quedar prendida y sin suspenderse mientras los alumnos la usen
  (Configuración > Sistema > Energía > "Suspender: Nunca").
- Si Windows pregunta por el firewall al arrancar Node, alcanza con "Redes privadas":
  el túnel sale desde la PC, no hace falta abrir nada.
- Con `CONCURRENCIA=2` (lo que pone el `.bat`) compila dos programas a la vez. Si la PC es
  potente podés subirlo: `set CONCURRENCIA=4` antes de ejecutar el `.bat` desde una terminal.

---

## Opción B: en Render (plan gratis)

Render construye la imagen con el `Dockerfile` de la raíz del repo (instala `arduino-cli`
1.3.1, el core `arduino:avr` 1.8.6, la librería Servo de `electron/` y la versión web).

1. Entrá a <https://render.com> con tu cuenta de GitHub.
2. **New > Blueprint**, elegí el repositorio `Gridie-Blocks`. Render lee `render.yaml`
   (rama `main`, plan *Free*) y crea el servicio `gridie-blocks`.
   (Alternativa manual: **New > Web Service**, el repo, rama `main`,
   *Language: Docker*, *Instance type: Free*, *Health check path: `/salud`*.)
3. La primera construcción tarda unos 5 a 10 minutos. Al terminar te da una dirección como
   `https://gridie-blocks.onrender.com`: esa es la de los alumnos.
4. Cada `git push` a `main` vuelve a publicar solo.

Límites del plan gratis:

- **Se duerme a los 15 minutos sin uso.** El primer alumno que entra después espera
  alrededor de un minuto mientras despierta. Para que no se duerma, algo tiene que pedirle
  `/salud` cada menos de 15 minutos (las 750 horas gratis alcanzan para tenerlo prendido
  todo el mes). Dos formas:
  - **UptimeRobot** (<https://uptimerobot.com>, gratis): *Add New Monitor* > *HTTP(s)*,
    URL `https://TU-SERVICIO.onrender.com/salud`, cada 5 minutos. Anda al instante.
  - **GitHub Actions**: el workflow `.github/workflows/mantener-despierto.yml` hace lo mismo
    cada 10 minutos. Creá la variable del repositorio `GRIDIE_URL` (Settings > Secrets and
    variables > Actions > Variables) con tu dirección de Render. A veces GitHub lo atrasa
    algunos minutos.
- 512 MB de memoria y poca CPU: compila de a uno (`CONCURRENCIA=1`). Cada programa nuevo
  tarda unos segundos; los repetidos salen de la caché al instante.
- La caché se borra cuando el servicio se reinicia o se duerme. No pasa nada, solo vuelve a
  compilar.
- 750 horas gratis por mes: alcanza para tenerlo siempre disponible.

Para 1 o 2 máquinas de prueba sobra. Para 600 alumnos al mismo tiempo no: ahí conviene la PC
(opción A) o varias PCs.

---

## Embeber un desafío en Moodle

Cada desafío tiene su propia dirección: la del servidor + `#/` + el nombre del desafío.

| Desafío | Dirección (reemplazá `SERVIDOR`) |
| --- | --- |
| Clase 1 · Ejercicio 1: Encender un Led | `https://SERVIDOR/#/Ejercicio1` |
| Clase 1 · Problema 1: Parpadear | `https://SERVIDOR/#/Problema1` |
| Clase 1 · Ejercicio 2: Encender el Semáforo | `https://SERVIDOR/#/Ejercicio2` |
| Clase 2 · Ejercicio 1: Parpadear 30 veces | `https://SERVIDOR/#/Ejercicio1Clase2` |
| Clase 2 · Ejercicio 2: Parpadeando con Repetitivas | `https://SERVIDOR/#/Ejercicio2Clase2` |
| Clase 2 · Problema 1: Señal de S.O.S | `https://SERVIDOR/#/Problema1Clase2` |
| Clase 2 · Problema 2: Parpadear el Semáforo | `https://SERVIDOR/#/Problema2Clase2` |
| Clase 2 · Problema 3: La Barrera | `https://SERVIDOR/#/Problema3Clase2` |
| Clase 3 · Ejercicio 1: Detección de movimientos | `https://SERVIDOR/#/Ejercicio1Clase3` |
| Clase 3 · Problema 1: Dejando de detectar movimiento | `https://SERVIDOR/#/Problema1Clase3` |
| Clase 3 · Ejercicio 2: Sensando Distancias | `https://SERVIDOR/#/Ejercicio2Clase3` |
| Clase 3 · Problema 2: Sensor de estacionamiento | `https://SERVIDOR/#/Problema2Clase3` |
| Clase 4 · Desafío: Concept Card | `https://SERVIDOR/#/DesafioClase4` |
| Clase 4 · Desafío: Sistema de riego inteligente | `https://SERVIDOR/#/DesafioHumedad` |

> Ojo: "Ejercicio 2: Servo Motor" (Clase 2) usa la misma ruta `/Ejercicio2Clase2` que
> "Parpadeando con Repetitivas", así que hoy no se puede abrir por dirección. Hay que darle
> una ruta propia en `src/App.jsx`.

En Moodle, en una **Página** o **Etiqueta**, pasá el editor a modo HTML (botón `</>`) y pegá:

```html
<iframe src="https://SERVIDOR/#/Ejercicio1"
        style="width:100%; height:85vh; border:0"
        allow="fullscreen; autoplay"></iframe>
```

El simulador se abre en una ventana aparte; si el navegador la bloquea, aparece al costado
de los bloques, dentro del mismo iframe.

Por defecto cualquier sitio puede embeber GrIDIE. Para que solo pueda tu Moodle, definí
`PERMITIR_IFRAME_EN` con su dirección (por ejemplo
`set PERMITIR_IFRAME_EN=https://campus.mi-universidad.edu.ar` antes del `.bat`, o en
*Environment* en Render).

---

## Si la web está en otro lado

Si la página de GrIDIE se publica en otro sitio (por ejemplo, Vercel) y este servidor solo
compila, hay tres formas de decirle a la página dónde está el compilador:

1. Editar `config.js` en el sitio publicado:
   `compiladorUrl: 'https://SERVIDOR/api/compilar'` (no hace falta recompilar la web).
2. Para probar rápido, abrir la página con `?compilador=https://SERVIDOR/api/compilar`
   antes del `#` (queda guardado en ese navegador; `?compilador=borrar` lo olvida).
3. Compilar la web con la variable `VITE_COMPILADOR_URL`.

En ese caso conviene limitar `ORIGEN_PERMITIDO` a la dirección de la web.

## Todas las variables

| Variable | Para qué | Por defecto |
| --- | --- | --- |
| `PUERTO` / `PORT` | Puerto donde escucha | 8787 |
| `ARDUINO_CLI` | Ruta a `arduino-cli` | el de `electron/` en Windows, si no el del PATH |
| `ARDUINO_CLI_CONFIG` | `--config-file` de arduino-cli | el core de `electron/` en Windows |
| `ARDUINO_LIBRERIAS` | Carpeta con librerías (Servo) | `electron/arduino-data/libraries` |
| `CONCURRENCIA` | Compilaciones a la vez | 1 |
| `COLA_MAXIMA` | Pedidos esperando antes de responder "ocupado" | 30 |
| `CARPETA_CACHE` | Carpeta donde guardar los `.hex` (sobrevive a reinicios) | ninguna (solo memoria) |
| `LIMITE_POR_MINUTO` | Compilaciones por minuto por IP (0 = sin límite) | 120 |
| `ORIGEN_PERMITIDO` | Orígenes que pueden llamar a la API, separados por coma | `*` |
| `PERMITIR_IFRAME_EN` | Sitios que pueden embeber GrIDIE, separados por espacio | `*` |
| `CARPETA_WEB` | Carpeta con la web compilada | `dist/` |
| `CALENTAR` | `0` para no compilar un programa de prueba al arrancar | activado |
