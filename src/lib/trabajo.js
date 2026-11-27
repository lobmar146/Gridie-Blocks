// El trabajo del alumno en cada desafío: los bloques y los cables que conectó.
//
// 1. Se guarda solo en el navegador (localStorage), por desafío, mientras el alumno trabaja:
//    si recarga la página o cierra la app, lo encuentra como lo dejó.
// 2. Se puede descargar a un archivo .gridie y volver a abrir. Así el alumno lo entrega
//    (por ejemplo, en una tarea de Moodle) y el profe lo abre en GrIDIE y ve los bloques y
//    cómo conectó el circuito. No hace falta ningún servidor.

import { progresoDe } from './progreso'

const FORMATO = 'gridie-blocks'
const VERSION = 1
export const EXTENSION = '.gridie'

const claveBloques = toolBox => `gridie-bloques-${toolBox}`
// La misma clave que usa el simulador (PanelSimulador) para los cables.
export const claveConexiones = toolBox => `gridie-conexiones-${toolBox}`
const CLAVE_NOMBRE = 'gridie-nombre'

const leerJSON = clave => {
  try {
    const texto = localStorage.getItem(clave)
    return texto ? JSON.parse(texto) : null
  } catch {
    return null
  }
}
const escribirJSON = (clave, valor) => {
  try {
    if (valor == null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch {
    // Sin almacenamiento (modo privado, disco lleno): no se recuerda, pero no se rompe nada.
    return false
  }
}

// ==== Autoguardado en el navegador ====

/** Los bloques guardados del desafío, como los serializa Blockly (o null). */
export const leerBloques = toolBox => leerJSON(claveBloques(toolBox))
export const guardarBloques = (toolBox, bloques) =>
  escribirJSON(claveBloques(toolBox), bloques)
export const borrarBloques = toolBox =>
  escribirJSON(claveBloques(toolBox), null)

/** Lo que conectó el alumno en el simulador: { conexiones, verificado } (o null). */
export const leerConexiones = toolBox => leerJSON(claveConexiones(toolBox))
export const guardarConexiones = (toolBox, datos) =>
  escribirJSON(claveConexiones(toolBox), datos)

export const leerNombre = () => {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) || ''
  } catch {
    return ''
  }
}
export const guardarNombre = nombre => {
  try {
    localStorage.setItem(CLAVE_NOMBRE, nombre)
  } catch {
    // no pasa nada
  }
}

// ==== Archivo .gridie ====

/** Arma el contenido del archivo a partir del trabajo del desafío. */
export function armarArchivo({
  ruta,
  titulo,
  toolBox,
  nombre,
  bloques,
  codigo
}) {
  return {
    formato: FORMATO,
    version: VERSION,
    desafio: { ruta, titulo, toolBox: String(toolBox) },
    alumno: nombre || '',
    guardado: new Date().toISOString(),
    bloques,
    conexiones: leerConexiones(toolBox),
    // Si el alumno ya lo había terminado en su navegador: { puntos, total, fecha } (o null).
    terminado: progresoDe(toolBox),
    // El código Arduino que generan los bloques, por si alguien lo quiere leer sin GrIDIE.
    codigo: codigo || ''
  }
}

// Saca lo que no puede ir en un nombre de archivo (en Windows, Android o iPhone).
const limpiarParaArchivo = texto =>
  String(texto || '')
    .normalize('NFC')
    .replace(/[\\/:*?"<>|#%]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)

export const nombreDelArchivo = ({ titulo, nombre }) =>
  [limpiarParaArchivo(titulo) || 'Desafío', limpiarParaArchivo(nombre)]
    .filter(Boolean)
    .join(' - ') + EXTENSION

/** Descarga el archivo (navegador, celular y app de escritorio). */
export function descargarArchivo(datos, nombreArchivo) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  setTimeout(() => enlace.remove(), 0)
  // Algunos navegadores leen el blob un rato después del clic.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

export class ArchivoInvalido extends Error {}

// Termina en .gridie. También acepta "x.gridie.json" o "x.gridie.txt", porque algunos
// celulares le agregan esa extensión al descargarlo.
const terminaEnGridie = nombre =>
  /\.gridie(\.(json|txt))?$/i.test(String(nombre || '').trim())

/** Para el aviso cuando se elige (o se suelta) un archivo que no es .gridie. */
export const avisoNoEsGridie = nombre =>
  `"${nombre}" no es un trabajo de GrIDIE. Solo se pueden abrir archivos ${EXTENSION} (los que se guardan desde "Mi trabajo" > "Guardar en un archivo").`

/** Lee y valida un archivo .gridie elegido por el usuario. Lanza ArchivoInvalido. */
export async function leerArchivo(archivo) {
  if (!archivo) throw new ArchivoInvalido('No se eligió ningún archivo.')
  if (!terminaEnGridie(archivo.name))
    throw new ArchivoInvalido(avisoNoEsGridie(archivo.name))
  if (archivo.size > 5 * 1024 * 1024)
    throw new ArchivoInvalido(
      'El archivo es demasiado grande para ser de GrIDIE.'
    )
  let datos
  try {
    datos = JSON.parse(await archivo.text())
  } catch {
    throw new ArchivoInvalido(avisoNoEsGridie(archivo.name))
  }
  if (datos?.formato !== FORMATO || !datos.desafio?.toolBox || !datos.bloques)
    throw new ArchivoInvalido(avisoNoEsGridie(archivo.name))
  if (Number(datos.version) > VERSION)
    throw new ArchivoInvalido(
      'Este trabajo se guardó con una versión más nueva de GrIDIE. Actualizá la app para abrirlo.'
    )
  return datos
}

/**
 * Deja el trabajo del archivo como el guardado del desafío: los bloques y los cables. La
 * pantalla del desafío los lee de acá al abrirse (o al recargar el área de trabajo).
 */
export function guardarTrabajoDelArchivo(datos) {
  const { toolBox } = datos.desafio
  guardarBloques(toolBox, datos.bloques)
  guardarConexiones(toolBox, datos.conexiones || null)
}

/** "26/11/2026 a las 18:30", en la hora de quien lo mira. */
export function fechaLegible(iso) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ''
  const dia = fecha.toLocaleDateString('es-AR')
  const hora = fecha.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  })
  return `${dia} a las ${hora}`
}

/** Si unos bloques guardados tienen algo más que el bloque principal vacío. */
export function bloquesConTrabajo(bloques) {
  const raices = ['ejecutar_una_vez', 'ejecutar_por_siempre']
  const hayOtro = nodo => {
    if (!nodo || typeof nodo !== 'object') return false
    if (typeof nodo.type === 'string' && !raices.includes(nodo.type))
      return true
    return Object.values(nodo).some(hayOtro)
  }
  return hayOtro(bloques?.blocks)
}
