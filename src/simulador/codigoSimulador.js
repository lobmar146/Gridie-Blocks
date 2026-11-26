// Ajustes al código generado para que corra en el simulador.
//
// El alumno ve y sube a la placa el código tal cual lo genera GrIDIE. Solo la copia que se
// compila para el simulador pasa por acá, porque ORBE todavía no tiene el sensor
// ultrasónico HC-SR04: en la escena el sensor es un control de distancia conectado a A1,
// y lecturaUltrasonica() lee esa distancia en vez de medir el eco.

const DISTANCIA_MAXIMA_CM = 100

const LECTURA_ULTRASONICA_SIMULADA = `long lecturaUltrasonica(int trigPin, int echoPin) {
  // Simulador de GrIDIE: la distancia se elige con el control "Distancia al obstáculo" (A1).
  return map(analogRead(A1), 0, 1023, 0, ${DISTANCIA_MAXIMA_CM});
}`

/** El código que se compila para el simulador. */
export function prepararCodigoParaSimulador(codigo) {
  return codigo.replace(
    /long lecturaUltrasonica\(int trigPin, int echoPin\) \{[\s\S]*?\n\s*return distance;\n\s*\}/,
    LECTURA_ULTRASONICA_SIMULADA
  )
}

/** La frecuencia (Hz) con la que el programa hace sonar el parlante, o 440 si no la encuentra. */
export function frecuenciaDelParlante(codigo) {
  const intervalo = codigo.match(
    /actualizarParlanteIntervalo\(\s*\d+\s*,\s*(\d+)/
  )
  if (intervalo) return Number(intervalo[1])
  const tono =
    codigo.match(/sonarParlanteMillis\(\s*(\d+)/) ||
    codigo.match(/tone\(\s*\w+\s*,\s*(\d+)/)
  return tono ? Number(tono[1]) : 440
}

/** Si el programa usa el parlante. */
export function usaParlante(codigo) {
  return /\btone\(|actualizarParlanteIntervalo\(|sonarParlanteMillis\(/.test(
    codigo
  )
}
