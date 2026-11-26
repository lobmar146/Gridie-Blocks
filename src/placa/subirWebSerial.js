// Sube un .hex a un Arduino Uno desde el navegador, con Web Serial (Chrome y Edge de escritorio).
//
// El Uno trae el bootloader Optiboot, que habla STK500 versión 1 a 115200 baudios:
// se reinicia la placa con DTR, se sincroniza, y se escribe la memoria de a páginas de 128 bytes.
// Cada comando termina en CRC_EOP (0x20) y la placa responde INSYNC (0x14) ... OK (0x10).

const STK = {
  OK: 0x10,
  INSYNC: 0x14,
  CRC_EOP: 0x20,
  GET_SYNC: 0x30,
  ENTER_PROGMODE: 0x50,
  LEAVE_PROGMODE: 0x51,
  LOAD_ADDRESS: 0x55,
  PROG_PAGE: 0x64,
  READ_PAGE: 0x74
}

const UNO = {
  baudios: 115200,
  tamanioPagina: 128,
  memoriaMaxima: 32256, // 32 KB menos los 512 bytes de Optiboot
  // Chips USB-serie de los Uno originales (16U2) y de los clones (CH340, CP2102, FTDI).
  filtros: [
    { usbVendorId: 0x2341 },
    { usbVendorId: 0x2a03 },
    { usbVendorId: 0x1a86 },
    { usbVendorId: 0x10c4 },
    { usbVendorId: 0x0403 }
  ]
}

export class ErrorDeSubida extends Error {}

export const hayWebSerial = () =>
  typeof navigator !== 'undefined' && 'serial' in navigator

const esperar = ms => new Promise(resolve => setTimeout(resolve, ms))

/** Convierte el texto Intel HEX en los bytes del programa (desde la dirección 0). */
export function leerHex(texto) {
  const bytes = new Uint8Array(UNO.memoriaMaxima).fill(0xff)
  let base = 0
  let fin = 0
  for (const cruda of texto.split(/\r?\n/)) {
    const linea = cruda.trim()
    if (!linea) continue
    if (linea[0] !== ':') throw new ErrorDeSubida('El archivo .hex no es válido.')
    const datos = []
    for (let i = 1; i < linea.length; i += 2)
      datos.push(parseInt(linea.slice(i, i + 2), 16))
    const largo = datos[0]
    const direccion = (datos[1] << 8) | datos[2]
    const tipo = datos[3]
    const suma = datos.reduce((a, b) => a + b, 0) & 0xff
    if (datos.length !== largo + 5 || suma !== 0)
      throw new ErrorDeSubida('El archivo .hex está dañado.')
    if (tipo === 0x00) {
      const inicio = base + direccion
      if (inicio + largo > UNO.memoriaMaxima)
        throw new ErrorDeSubida(
          'El programa es demasiado grande para el Arduino Uno.'
        )
      bytes.set(datos.slice(4, 4 + largo), inicio)
      fin = Math.max(fin, inicio + largo)
    } else if (tipo === 0x01) break
    else if (tipo === 0x02) base = ((datos[4] << 8) | datos[5]) << 4
    else if (tipo === 0x04) base = ((datos[4] << 8) | datos[5]) << 16
  }
  if (fin === 0) throw new ErrorDeSubida('El archivo .hex está vacío.')
  return bytes.slice(0, fin)
}

// Lee bytes del puerto con tiempo límite, guardando lo que sobra para la próxima lectura.
class Lector {
  constructor(puerto) {
    this.lector = puerto.readable.getReader()
    this.pendientes = []
    this.leyendo = null
  }

  async leer(cantidad, tiempo = 1000) {
    const limite = Date.now() + tiempo
    while (this.pendientes.length < cantidad) {
      const resta = limite - Date.now()
      if (resta <= 0) return null
      if (!this.leyendo) this.leyendo = this.lector.read()
      const resultado = await Promise.race([
        this.leyendo,
        esperar(resta).then(() => null)
      ])
      if (resultado === null) return null
      this.leyendo = null
      if (resultado.done) return null
      this.pendientes.push(...resultado.value)
    }
    return Uint8Array.from(this.pendientes.splice(0, cantidad))
  }

  descartar() {
    this.pendientes = []
  }

  async soltar() {
    try {
      await this.lector.cancel()
    } catch {
      // ya estaba cerrado
    }
    this.lector.releaseLock()
  }
}

async function comando(escritor, lector, bytes, respuesta = 0, tiempo = 1000) {
  await escritor.write(Uint8Array.from([...bytes, STK.CRC_EOP]))
  const leido = await lector.leer(respuesta + 2, tiempo)
  if (
    !leido ||
    leido[0] !== STK.INSYNC ||
    leido[leido.length - 1] !== STK.OK
  )
    throw new ErrorDeSubida(
      'La placa dejó de responder mientras se subía el programa. Probá de nuevo.'
    )
  return leido.slice(1, -1)
}

async function reiniciarPlaca(puerto) {
  // Bajar y subir DTR/RTS reinicia el Uno y deja corriendo el bootloader un instante.
  await puerto.setSignals({ dataTerminalReady: false, requestToSend: false })
  await esperar(250)
  await puerto.setSignals({ dataTerminalReady: true, requestToSend: true })
  await esperar(50)
}

async function sincronizar(puerto, escritor, lector) {
  for (let intento = 0; intento < 3; intento++) {
    await reiniciarPlaca(puerto)
    for (let i = 0; i < 8; i++) {
      lector.descartar()
      await escritor.write(Uint8Array.from([STK.GET_SYNC, STK.CRC_EOP]))
      const leido = await lector.leer(2, 200)
      if (leido && leido[0] === STK.INSYNC && leido[1] === STK.OK) {
        // Optiboot a veces repite la respuesta: vaciar lo que haya quedado.
        await lector.leer(64, 50)
        lector.descartar()
        return
      }
    }
  }
  throw new ErrorDeSubida(
    'La placa no responde. Revisá que sea un Arduino Uno, que esté bien conectada y que no haya otro programa usando el puerto (por ejemplo, el monitor serie).'
  )
}

/** Pide al alumno que elija el puerto de la placa. Tiene que llamarse desde un clic. */
export async function elegirPuerto() {
  if (!hayWebSerial())
    throw new ErrorDeSubida(
      'Este navegador no puede subir programas a la placa. Usá Chrome o Edge en una computadora, o la app de escritorio de GrIDIE.'
    )
  try {
    return await navigator.serial.requestPort({ filters: UNO.filtros })
  } catch (error) {
    if (error?.name === 'NotFoundError') return null // cerró la ventana sin elegir
    if (error?.name === 'SecurityError')
      throw new ErrorDeSubida(
        'El navegador no deja usar el puerto desde acá. Si GrIDIE está dentro de otra página (por ejemplo, Moodle), abrilo en una pestaña aparte.'
      )
    throw error
  }
}

/**
 * Escribe el .hex en la placa y lo verifica.
 * @param {SerialPort} puerto
 * @param {string} hex  Texto Intel HEX.
 * @param {(progreso: number, mensaje: string) => void} [alAvanzar]
 */
export async function subirHex(puerto, hex, alAvanzar = () => {}) {
  const programa = leerHex(hex)
  try {
    await puerto.open({ baudRate: UNO.baudios })
  } catch {
    throw new ErrorDeSubida(
      'No se pudo abrir el puerto de la placa. Cerrá otros programas que la estén usando (el IDE de Arduino, otra pestaña) y probá de nuevo.'
    )
  }
  const escritor = puerto.writable.getWriter()
  const lector = new Lector(puerto)
  try {
    alAvanzar(0, 'Conectando con la placa…')
    await sincronizar(puerto, escritor, lector)
    await comando(escritor, lector, [STK.ENTER_PROGMODE])

    const paginas = Math.ceil(programa.length / UNO.tamanioPagina)
    const pagina = i =>
      programa.slice(i * UNO.tamanioPagina, (i + 1) * UNO.tamanioPagina)
    const cargarDireccion = i => {
      const palabra = (i * UNO.tamanioPagina) >> 1 // el Uno direcciona de a 2 bytes
      return comando(escritor, lector, [
        STK.LOAD_ADDRESS,
        palabra & 0xff,
        palabra >> 8
      ])
    }

    for (let i = 0; i < paginas; i++) {
      const datos = pagina(i)
      await cargarDireccion(i)
      await comando(escritor, lector, [
        STK.PROG_PAGE,
        datos.length >> 8,
        datos.length & 0xff,
        0x46, // 'F' = memoria flash
        ...datos
      ])
      alAvanzar(Math.round(((i + 1) / paginas) * 70), 'Subiendo el programa…')
    }

    for (let i = 0; i < paginas; i++) {
      const datos = pagina(i)
      await cargarDireccion(i)
      const leido = await comando(
        escritor,
        lector,
        [STK.READ_PAGE, datos.length >> 8, datos.length & 0xff, 0x46],
        datos.length
      )
      if (leido.some((b, j) => b !== datos[j]))
        throw new ErrorDeSubida(
          'El programa se subió con errores. Probá de nuevo; si sigue fallando, cambiá el cable USB.'
        )
      alAvanzar(70 + Math.round(((i + 1) / paginas) * 30), 'Verificando…')
    }

    await comando(escritor, lector, [STK.LEAVE_PROGMODE])
    alAvanzar(100, 'Listo')
  } finally {
    escritor.releaseLock()
    await lector.soltar()
    await puerto.close().catch(() => {})
  }
}
