# Servidor de compilación + versión web de GrIDIE Blocks en un solo contenedor.
# Pensado para Render (plan gratis, 512 MB) o cualquier lugar que corra Docker.
#
#   docker build -t gridie .
#   docker run -p 8787:8787 gridie        ->  http://localhost:8787

# ---------- 1) Compilar la versión web ----------
FROM node:22-slim AS web
WORKDIR /app
# Electron no hace falta para la web: no descargar su binario.
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Opcional: dirección de otro servidor de compilación (si no, usa el mismo sitio).
ARG VITE_COMPILADOR_URL=
ENV VITE_COMPILADOR_URL=$VITE_COMPILADOR_URL
RUN npm run build:web

# ---------- 2) Servidor con arduino-cli y el core AVR ----------
FROM node:22-slim
ARG ARDUINO_CLI_VERSION=1.3.1
ARG ARDUINO_AVR_VERSION=1.8.6

RUN apt-get update \
 && apt-get install -y --no-install-recommends ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://github.com/arduino/arduino-cli/releases/download/v${ARDUINO_CLI_VERSION}/arduino-cli_${ARDUINO_CLI_VERSION}_Linux_64bit.tar.gz" \
    | tar -xz -C /usr/local/bin arduino-cli

# Mismo core que trae la app de escritorio (arduino:avr 1.8.6).
ENV ARDUINO_DIRECTORIES_DATA=/opt/arduino \
    ARDUINO_DIRECTORIES_USER=/opt/arduino-user \
    ARDUINO_DIRECTORIES_DOWNLOADS=/tmp/arduino-descargas
RUN arduino-cli core update-index \
 && arduino-cli core install "arduino:avr@${ARDUINO_AVR_VERSION}" \
 && rm -rf /tmp/arduino-descargas \
 && mkdir -p /opt/arduino-user

WORKDIR /app
# La librería Servo es la misma que usa la app de escritorio.
COPY electron/arduino-data/libraries/Servo ./librerias/Servo
COPY servidor-compilacion ./servidor-compilacion
COPY --from=web /app/dist ./dist

# Prueba al construir la imagen: si el compilador no anda, la imagen no se crea.
RUN mkdir -p /tmp/prueba/prueba \
 && printf '#include <Servo.h>\nServo s;\nvoid setup(){ s.attach(9); }\nvoid loop(){ s.write(90); }\n' > /tmp/prueba/prueba/prueba.ino \
 && arduino-cli compile --fqbn arduino:avr:uno --libraries /app/librerias /tmp/prueba/prueba \
 && rm -rf /tmp/prueba /tmp/arduino \
 && chown -R node:node /opt/arduino /opt/arduino-user

ENV NODE_ENV=production \
    ARDUINO_CLI=arduino-cli \
    ARDUINO_LIBRERIAS=/app/librerias \
    CARPETA_CACHE=/tmp/gridie-cache \
    PORT=8787
EXPOSE 8787
USER node
CMD ["node", "servidor-compilacion/servidor.mjs"]
