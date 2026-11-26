// Hace sonar el parlante del simulador en la compu del alumno.
//
// El simulador manda el estado del pin del parlante unas 60 veces por segundo. Mientras el
// Arduino hace tone() el pin oscila cientos de veces por segundo, así que entre dos muestras
// el valor cambia; con noTone() queda quieto. Si el pin cambió hace poco, suena.
// La frecuencia sale del código que generó GrIDIE (ver frecuenciaDelParlante).

const SILENCIO_DESPUES_MS = 90
const VOLUMEN = 0.08

export class Parlante {
  constructor(frecuencia) {
    this.frecuencia = frecuencia
    this.ultimoValor = undefined
    this.ultimoCambio = -Infinity
    this.contexto = null
    this.oscilador = null
    this.ganancia = null
    this.timer = setInterval(() => this.actualizar(), 30)
  }

  /** Una muestra del pin (0 o 1) que llegó en un frame del simulador. */
  muestra(valor, corriendo) {
    if (!corriendo) {
      this.ultimoCambio = -Infinity
      return
    }
    if (
      valor !== undefined &&
      this.ultimoValor !== undefined &&
      valor !== this.ultimoValor
    ) {
      this.ultimoCambio = performance.now()
    }
    this.ultimoValor = valor
  }

  actualizar() {
    const sonando = performance.now() - this.ultimoCambio < SILENCIO_DESPUES_MS
    if (sonando && !this.contexto) this.iniciarAudio()
    if (!this.ganancia) return
    const ahora = this.contexto.currentTime
    this.ganancia.gain.setTargetAtTime(sonando ? VOLUMEN : 0, ahora, 0.01)
  }

  iniciarAudio() {
    const Contexto = window.AudioContext || window.webkitAudioContext
    if (!Contexto) return
    this.contexto = new Contexto()
    this.oscilador = this.contexto.createOscillator()
    this.oscilador.type = 'square'
    this.oscilador.frequency.value = this.frecuencia
    this.ganancia = this.contexto.createGain()
    this.ganancia.gain.value = 0
    this.oscilador.connect(this.ganancia).connect(this.contexto.destination)
    this.oscilador.start()
  }

  detener() {
    clearInterval(this.timer)
    try {
      this.oscilador?.stop()
      this.contexto?.close()
    } catch {
      // ya estaba cerrado
    }
    this.contexto = null
    this.ganancia = null
  }
}
