import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  Cross2Icon,
  ExternalLinkIcon,
  ImageIcon,
  PlayIcon,
  ReloadIcon,
  ResetIcon
} from '@radix-ui/react-icons'
import AnimacionEnvio from '@/components/AnimacionEnvio'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { guardarConexiones, leerConexiones } from '@/lib/trabajo'
import {
  frecuenciaDelParlante,
  prepararCodigoParaSimulador,
  usaParlante
} from './codigoSimulador'
import { compilar } from './compilador'
import { cablesDelDesafio, escenaDelDesafio, nombreDelPin } from './escenas'
import { Parlante } from './parlante'
import {
  cargarHexVacio,
  cargarPuente,
  precargarSimuladorDesafio,
  urlSimulador
} from './precarga'
import TableroDeConexion from './TableroDeConexion'

// `animacion`: mientras se compila el programa del alumno, bloques que viajan al Arduino.
const CargaSimulador = ({ progreso, mensaje, animacion = false }) => (
  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]/85 p-6">
    <div className="flex w-full max-w-xs flex-col gap-2.5 text-center">
      {animacion && (
        <AnimacionEnvio className="mx-auto mb-1 w-full max-w-[240px]" />
      )}
      <div className="flex items-center justify-between text-xs text-gray-300">
        <span>{mensaje}</span>
        <span className="tabular-nums text-gray-400">
          {Math.round(progreso)}%
        </span>
      </div>
      <Progress value={progreso} />
    </div>
  </div>
)

const esMensajeDeBloqueo = codigo => codigo.trim().startsWith('Recuerda')

// Lo que conectó el alumno se guarda en el navegador, por desafío (y va en el archivo
// .gridie cuando lo descarga: ver src/lib/trabajo.js).
const leerGuardado = toolBox => leerConexiones(toolBox) || {}
const guardar = guardarConexiones

/** Monta el visor de ORBE en `contenedor` y devuelve el simulador (o lanza). */
async function montar(
  contenedor,
  { escena, hex, reproducir, alMensaje, alListo }
) {
  const puente = await cargarPuente()
  return puente.montarSimulador(contenedor, {
    escena,
    hex,
    base: urlSimulador(''),
    reproducir,
    alListo,
    alMensaje: mensaje => {
      // Para las pruebas automáticas en desarrollo.
      if (import.meta.env.DEV)
        window.__simuladorGridie = {
          ...window.__simuladorGridie,
          [mensaje.type]: mensaje
        }
      alMensaje?.(mensaje)
    }
  })
}

/** Si el alumno ya conectó bien todos los cables del desafío (lo que guardó el navegador). */
export function conexionCompletaGuardada(toolBox) {
  const { conexiones = {} } = leerGuardado(toolBox)
  const cables = cablesDelDesafio(toolBox)
  return cables.length > 0 && cables.every(c => conexiones[c.id] === c.esperado)
}

// Los cables del desafío que ya están bien conectados, en orden. El primero que falta es el
// paso actual de la conexión guiada.
const conectadosBien = (cables, conexiones) =>
  cables.filter(c => conexiones[c.id] === c.esperado)

/**
 * Panel del simulador, en dos etapas:
 * 1. Conectar: la conexión guiada, cable por cable, siguiendo el esquema del desafío.
 * 2. Probar: compila el programa, lo corre en el circuito y muestra los controles de los
 *    sensores.
 * `enVentana` es para la ventana emergente: el panel ocupa todo el ancho.
 * `embebido` es para la pantalla del desafío, donde las pestañas
 * Programá / Conectá / Probá están afuera: la etapa la manejan `etapa` y `onEtapa`, y
 * `onDesacoplar` pasa el simulador a una ventana aparte. `navegacion` (las pestañas) va
 * empotrada en la barra de arriba del panel, en lugar del título.
 */
const PanelSimulador = ({
  toolBox,
  codigo,
  titulo,
  esquema,
  enVentana = false,
  embebido = false,
  compacto = false,
  etapa: etapaControlada,
  etapaInicial,
  onEtapa,
  onConexion,
  onDesacoplar,
  onCerrar,
  navegacion,
  onSimulacionLista
}) => {
  const cables = cablesDelDesafio(toolBox)
  const guardado = leerGuardado(toolBox)
  const [conexiones, setConexiones] = useState(guardado.conexiones || {})
  const completo = cables.every(c => conexiones[c.id] === c.esperado)
  const [etapaPropia, setEtapaPropia] = useState(
    etapaInicial === 'probar' || etapaInicial === 'conectar'
      ? etapaInicial === 'probar' && !completo
        ? 'conectar'
        : etapaInicial
      : guardado.verificado && completo
        ? 'probar'
        : 'conectar'
  )
  const etapa = etapaControlada ?? etapaPropia
  const setEtapa = nueva => (onEtapa ? onEtapa(nueva) : setEtapaPropia(nueva))
  const [verEsquema, setVerEsquema] = useState(false)

  useEffect(() => {
    onConexion?.(completo)
  }, [completo])

  useEffect(() => {
    precargarSimuladorDesafio(toolBox)
  }, [toolBox])

  const cambiarConexiones = nuevas => {
    setConexiones(nuevas)
    guardar(toolBox, { conexiones: nuevas, verificado: false })
  }
  const aprobar = () => {
    guardar(toolBox, { conexiones, verificado: true })
    setEtapa('probar')
  }

  const encabezado = {
    titulo: enVentana ? titulo : null,
    esquema,
    embebido,
    compacto,
    onVerEsquema: () => setVerEsquema(true),
    onDesacoplar,
    onCerrar,
    navegacion
  }

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[10px] border border-gray-700 bg-[#1e1e1e] ${enVentana || embebido ? 'h-full w-full' : 'ml-2 mr-2 w-[45%] min-w-[380px]'}`}
    >
      {etapa === 'conectar' ? (
        <EtapaConectar
          toolBox={toolBox}
          cables={cables}
          conexiones={conexiones}
          enVentana={(enVentana || embebido) && !compacto}
          encabezado={encabezado}
          onCambiar={cambiarConexiones}
          onAprobar={aprobar}
        />
      ) : (
        <EtapaProbar
          toolBox={toolBox}
          codigo={codigo}
          conexiones={conexiones}
          encabezado={encabezado}
          onVolverAConectar={() => setEtapa('conectar')}
          onSimulacionLista={onSimulacionLista}
        />
      )}
      {verEsquema && esquema && (
        <div
          className="absolute inset-0 z-20 flex flex-col bg-black/85 p-4"
          onClick={() => setVerEsquema(false)}
        >
          <div className="mb-2 flex items-center justify-between text-sm text-gray-200">
            <span>Esquema de conexión del desafío</span>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-gray-200"
              onClick={() => setVerEsquema(false)}
            >
              <Cross2Icon className="mr-1 h-4 w-4" /> Cerrar
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center rounded bg-white p-2">
            <img
              src={esquema}
              alt="Esquema de conexión"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}

const Encabezado = ({ paso, encabezado, children }) => (
  <div
    className={`flex items-center justify-between gap-2 border-b border-gray-700 ${encabezado.navegacion ? 'h-11 shrink-0 px-1.5' : 'px-3 py-2'}`}
  >
    <div
      className={`flex min-w-0 items-center gap-3 text-sm ${encabezado.navegacion ? 'flex-1' : ''}`}
    >
      {encabezado.navegacion}
      {encabezado.titulo && (
        <span className="truncate font-semibold text-arduino-suave">
          {encabezado.titulo}
        </span>
      )}
      {encabezado.compacto ||
      encabezado.navegacion ? null : encabezado.embebido ? (
        <span className="font-semibold text-white">
          {paso === 1 ? 'Conectá el circuito' : 'Probá tu programa'}
        </span>
      ) : (
        <>
          <span
            className={
              paso === 1 ? 'font-semibold text-white' : 'text-gray-400'
            }
          >
            1. Conectar
          </span>
          <span className="text-gray-600">›</span>
          <span
            className={
              paso === 2 ? 'font-semibold text-white' : 'text-gray-400'
            }
          >
            2. Probar
          </span>
        </>
      )}
    </div>
    <div className="flex items-center gap-2">
      {children}
      {encabezado.esquema && !encabezado.compacto && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-gray-300"
          onClick={encabezado.onVerEsquema}
          title="Ver el esquema de conexión del desafío"
          aria-label="Ver el esquema de conexión del desafío"
        >
          <ImageIcon className="h-3.5 w-3.5 sm:mr-1" />
          <span className={encabezado.compacto ? 'sr-only' : ''}>Esquema</span>
        </Button>
      )}
      {encabezado.onDesacoplar && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-gray-300"
          onClick={encabezado.onDesacoplar}
          title="Abrir el simulador en una ventana aparte"
        >
          <ExternalLinkIcon className="mr-1 h-3.5 w-3.5" />
          Ventana aparte
        </Button>
      )}
      {encabezado.onCerrar && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-gray-300"
          onClick={encabezado.onCerrar}
          aria-label="Cerrar simulador"
        >
          <Cross2Icon className="h-4 w-4" />
        </Button>
      )}
    </div>
  </div>
)

// ---- Etapa 1: conexión guiada ------------------------------------------------------------

// Ancho de la guía de conexión (en la compu), como fracción del panel. Se recuerda.
const GUIA_MIN = 360
const VISTA_3D_MIN = 280
const CLAVE_ANCHO_GUIA = 'gridie-ancho-guia'
const leerFraccionGuia = () => {
  try {
    const n = Number(localStorage.getItem(CLAVE_ANCHO_GUIA))
    if (n > 0.1 && n < 0.9) return n
  } catch {
    /* sin localStorage */
  }
  return 0.42
}
const guardarFraccionGuia = fraccion => {
  try {
    localStorage.setItem(CLAVE_ANCHO_GUIA, String(fraccion))
  } catch {
    /* sin localStorage */
  }
}

/** El borde entre la guía y la vista 3D: se arrastra para cambiar el ancho de la guía. */
const DivisorArrastrable = ({ contenedorRef, onCambiar }) => {
  const [arrastrando, setArrastrando] = useState(false)
  const mover = evento => {
    const caja = contenedorRef.current?.getBoundingClientRect()
    if (!caja || caja.width <= 0) return
    const fraccion = (evento.clientX - caja.left) / caja.width
    onCambiar(Math.min(0.85, Math.max(0.15, fraccion)))
  }
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Arrastrá para cambiar el ancho de la guía"
      title="Arrastrá para agrandar o achicar"
      className={`group relative z-10 w-1.5 shrink-0 cursor-col-resize touch-none select-none border-x border-gray-700 transition-colors ${arrastrando ? 'bg-arduino-claro' : 'bg-[#262626] hover:bg-arduino'}`}
      onPointerDown={evento => {
        evento.preventDefault()
        evento.currentTarget.setPointerCapture(evento.pointerId)
        setArrastrando(true)
      }}
      onPointerMove={evento => arrastrando && mover(evento)}
      onPointerUp={() => setArrastrando(false)}
      onPointerCancel={() => setArrastrando(false)}
      onLostPointerCapture={() => setArrastrando(false)}
    >
      {/* Mientras se arrastra, una capa evita que el visor 3D se quede con el mouse. */}
      {arrastrando && <div className="fixed inset-0 cursor-col-resize" />}
    </div>
  )
}

/**
 * Agranda (o achica) el tablero de conexión para que llene el ancho de la guía. El tablero
 * sigue midiendo en su tamaño natural (ver `escala` en TableroDeConexion).
 */
const Escalado = ({ activo, children }) => {
  const afueraRef = useRef(null)
  const adentroRef = useRef(null)
  const [medidas, setMedidas] = useState({ escala: 1, alto: null })
  useLayoutEffect(() => {
    if (!activo) return undefined
    const afuera = afueraRef.current
    const adentro = adentroRef.current
    if (!afuera || !adentro || typeof ResizeObserver === 'undefined')
      return undefined
    const medir = () => {
      const ancho = adentro.offsetWidth
      const alto = adentro.offsetHeight
      if (!ancho || !alto) return
      // Que llene el ancho, pero sin pasarse del alto que queda: así el conector y el pin
      // se ven juntos sin tener que desplazarse.
      const guia = afuera.offsetParent
      const altoLibre = guia
        ? guia.clientHeight - afuera.offsetTop - 16
        : Infinity
      const escala = Math.min(
        1.8,
        Math.max(0.6, Math.min(afuera.clientWidth / ancho, altoLibre / alto))
      )
      setMedidas({ escala, alto: alto * escala })
    }
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(afuera)
    obs.observe(adentro)
    if (afuera.offsetParent) obs.observe(afuera.offsetParent)
    return () => obs.disconnect()
  }, [activo])
  if (!activo) return <div className="shrink-0 overflow-x-auto">{children}</div>
  return (
    <div
      ref={afueraRef}
      className="relative shrink-0 overflow-hidden"
      style={{ height: medidas.alto ?? undefined }}
    >
      <div
        ref={adentroRef}
        className="absolute left-1/2 top-0 w-max"
        style={{
          transform: `translateX(-50%) scale(${medidas.escala})`,
          transformOrigin: 'top center'
        }}
      >
        {React.cloneElement(children, { escala: medidas.escala })}
      </div>
    </div>
  )
}

// Los conectores del Arduino Uno como se ven en la placa, con el USB a la izquierda.
// `pin` es el que se elige; los que no tienen pin no se usan en GrIDIE.
/** Dónde está un pin en la placa, para ayudar a encontrarlo. */
const dondeEsta = pin => {
  if (/^D/.test(pin))
    return 'en el conector de arriba, el de los pines digitales'
  if (/^A/.test(pin)) return 'abajo a la derecha, en ANALOG IN'
  if (pin === 'GND')
    return 'abajo, en POWER (también hay uno arriba, al lado del 13)'
  return 'abajo, en el conector POWER'
}

/** Etapa 1: el alumno conecta los cables uno por uno, como indica el esquema. */
const EtapaConectar = ({
  toolBox,
  cables,
  conexiones,
  enVentana,
  encabezado,
  onCambiar,
  onAprobar
}) => {
  const contenedorRef = useRef(null)
  const simuladorRef = useRef(null)
  const hexRef = useRef(null)
  const epocaRef = useRef(0)
  const [errorVista, setErrorVista] = useState('')
  const [carga, setCarga] = useState({
    progreso: 20,
    mensaje: 'Cargando motor 3D…'
  })
  const [aviso, setAviso] = useState(null) // { ok, texto }
  // En la compu la guía va a la izquierda y se puede agrandar arrastrando el borde.
  const filaRef = useRef(null)
  const [fraccionGuia, setFraccionGuia] = useState(leerFraccionGuia)
  const anchoGuia = `clamp(${GUIA_MIN}px, ${(fraccionGuia * 100).toFixed(1)}%, calc(100% - ${VISTA_3D_MIN}px))`
  const cambiarAnchoGuia = fraccion => {
    setFraccionGuia(fraccion)
    guardarFraccionGuia(fraccion)
  }
  const listos = conectadosBien(cables, conexiones)
  const actual = cables.find(c => conexiones[c.id] !== c.esperado)
  const numero = actual ? cables.indexOf(actual) + 1 : cables.length

  // Cierra el visor al desmontar o cambiar de desafío.
  useEffect(() => {
    return () => {
      epocaRef.current += 1
      simuladorRef.current?.cerrar()
      simuladorRef.current = null
    }
  }, [toolBox])

  // La vista 3D muestra solo los cables que el alumno ya conectó.
  const claveConexionesHechas = JSON.stringify(
    Object.fromEntries(listos.map(c => [c.id, conexiones[c.id]]))
  )
  // En el celular Conectá muestra solo el tablero: la vista 3D queda para Probá.
  const sin3D = Boolean(encabezado.compacto)
  useEffect(() => {
    if (sin3D) return undefined
    const conexionesHechas = JSON.parse(claveConexionesHechas)
    const escena = escenaDelDesafio(toolBox, conexionesHechas, {
      soloElegidas: true
    }).escena
    const epoca = ++epocaRef.current
    let rafId = 0
    let timer = 0
    setErrorVista('')

    const alMensaje = m => {
      if (epocaRef.current !== epoca) return
      if (m.type === 'scene') {
        setCarga(prev =>
          prev ? { progreso: 100, mensaje: 'Mostrando circuito…' } : prev
        )
        rafId = window.requestAnimationFrame(() => {
          if (epocaRef.current === epoca) setCarga(null)
        })
      } else if (m.type === 'closed') {
        setCarga(null)
        setErrorVista(m.reason)
        simuladorRef.current?.cerrar()
        simuladorRef.current = null
      }
    }

    if (simuladorRef.current?.actualizar && hexRef.current) {
      setCarga({ progreso: 50, mensaje: 'Actualizando circuito 3D…' })
      simuladorRef.current.actualizar({
        escena,
        hex: hexRef.current,
        reproducir: false,
        alMensaje
      })
      return () => {
        epocaRef.current += 1
        if (rafId) window.cancelAnimationFrame(rafId)
      }
    }

    setCarga({ progreso: 20, mensaje: 'Cargando motor 3D…' })
    timer = window.setInterval(() => {
      setCarga(prev =>
        prev && prev.progreso < 90
          ? { ...prev, progreso: Math.min(90, prev.progreso + 3) }
          : prev
      )
    }, 350)
    ;(async () => {
      try {
        const [hex] = await Promise.all([cargarHexVacio(), cargarPuente()])
        if (epocaRef.current !== epoca || !contenedorRef.current) return
        hexRef.current = hex
        setCarga({ progreso: 60, mensaje: 'Cargando piezas y escena 3D…' })
        const sim = await montar(contenedorRef.current, {
          escena,
          hex,
          reproducir: false,
          alMensaje
        })
        if (epocaRef.current !== epoca) {
          sim.cerrar()
          return
        }
        simuladorRef.current = sim
      } catch (e) {
        if (epocaRef.current === epoca) {
          setCarga(null)
          setErrorVista(e.message || String(e))
        }
      }
    })()
    return () => {
      epocaRef.current += 1
      if (timer) window.clearInterval(timer)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [toolBox, claveConexionesHechas, sin3D])

  const elegir = pin => {
    if (!actual) return
    if (pin === actual.esperado) {
      setAviso({ ok: true, texto: '¡Bien! Ese es el lugar.' })
      onCambiar({ ...conexiones, [actual.id]: pin })
    } else {
      setAviso({
        ok: false,
        texto: `Ese es el ${nombreDelPin(pin)}. Este cable va al ${nombreDelPin(actual.esperado)}: está ${dondeEsta(actual.esperado)}. Te lo marcamos en amarillo.`
      })
    }
  }

  const empezarDeNuevo = () => {
    setAviso(null)
    onCambiar({})
  }

  const guia = (
    <div
      className={`flex flex-col gap-3 overflow-y-auto px-4 py-3 text-gray-200 ${enVentana ? 'relative shrink-0 text-base' : encabezado.compacto ? 'min-h-0 flex-1 border-b border-gray-700 text-sm' : 'max-h-[55%] border-b border-gray-700 text-sm'}`}
      style={enVentana ? { width: anchoGuia } : undefined}
    >
      <div
        className={`flex items-center justify-between text-gray-400 ${enVentana ? 'text-sm' : 'text-xs'}`}
      >
        <span>
          {actual
            ? `Cable ${numero} de ${cables.length}`
            : `Los ${cables.length} cables están conectados`}
        </span>
        {listos.length > 0 && (
          <button
            type="button"
            className="flex items-center gap-1 hover:text-gray-200"
            onClick={empezarDeNuevo}
          >
            <ResetIcon className="h-3 w-3" /> Empezar de nuevo
          </button>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded bg-gray-700">
        <div
          className="h-full bg-arduino-claro transition-all"
          style={{ width: `${(100 * listos.length) / cables.length}%` }}
        />
      </div>

      {actual ? (
        <>
          <div className="rounded-lg border border-gray-600 bg-gray-800/70 p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-400">
              {actual.nombreComponente}
            </div>
            <div
              className={`flex items-start gap-2 ${enVentana ? 'text-lg leading-snug' : 'text-base'}`}
            >
              <span
                className="mt-1.5 h-2.5 w-6 shrink-0 rounded-full"
                style={{ background: actual.color }}
              />
              <span>
                Conectá <b>{actual.etiqueta}</b> al{' '}
                <b className="text-amber-300">
                  {nombreDelPin(actual.esperado)}
                </b>{' '}
                del Arduino.
              </span>
            </div>
            <div
              className={`mt-1 text-gray-400 ${enVentana ? 'text-sm' : 'text-xs'}`}
            >
              Lo encontrás {dondeEsta(actual.esperado)}. Arrastrá el conector
              hasta ese pin (o hacé clic):
            </div>
          </div>
          <Escalado activo={enVentana}>
            <TableroDeConexion
              cablesComponente={cables.filter(
                c => c.componente === actual.componente
              )}
              todosLosCables={cables}
              actual={actual}
              conexiones={conexiones}
              marcado={aviso && !aviso.ok ? actual.esperado : null}
              onElegir={elegir}
            />
          </Escalado>
          {aviso && (
            <p className={aviso.ok ? 'text-arduino-suave' : 'text-amber-300'}>
              {aviso.ok ? '✓ ' : '✗ '}
              {aviso.texto}
            </p>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-arduino bg-arduino-profundo/40 p-3">
          <p className="mb-3 text-base text-arduino-suave">
            🎉 ¡Circuito armado! Ya podés probar tu programa.
          </p>
          <Button
            className="bg-arduino text-white hover:bg-arduino-oscuro"
            onClick={onAprobar}
          >
            <PlayIcon className="mr-1.5 h-3.5 w-3.5" />
            Probar mi programa
          </Button>
        </div>
      )}
      {!actual && (
        <Escalado activo={enVentana}>
          <TableroDeConexion
            cablesComponente={[]}
            todosLosCables={cables}
            actual={null}
            conexiones={conexiones}
            marcado={null}
            onElegir={() => {}}
          />
        </Escalado>
      )}

      {listos.length > 0 && (
        <ul
          className={`space-y-1 text-gray-400 ${enVentana ? 'text-sm' : 'text-xs'}`}
        >
          {listos.map(c => (
            <li key={c.id} className="flex items-center gap-2">
              <CheckCircledIcon className="h-3.5 w-3.5 shrink-0 text-arduino-claro" />
              <span
                className="h-1.5 w-4 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              <span>
                {c.etiqueta} → {nombreDelPin(c.esperado)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <>
      <Encabezado paso={1} encabezado={encabezado} />
      <div
        ref={filaRef}
        className={`flex min-h-0 flex-1 ${enVentana ? 'flex-row' : 'flex-col'}`}
      >
        {guia}
        {enVentana && (
          <DivisorArrastrable
            contenedorRef={filaRef}
            onCambiar={cambiarAnchoGuia}
          />
        )}
        {!sin3D && (
          <div className="relative min-h-0 min-w-0 flex-1">
            <div ref={contenedorRef} className="absolute inset-0" />
            {carga && !errorVista && (
              <CargaSimulador
                progreso={carga.progreso}
                mensaje={carga.mensaje}
              />
            )}
            {errorVista && (
              <pre className="absolute inset-x-0 bottom-0 z-10 max-h-[50%] overflow-auto bg-[#1e1e1e]/90 p-3 text-xs text-red-300">
                {errorVista}
              </pre>
            )}
          </div>
        )}
      </div>
    </>
  )
}

/** Etapa 2: compila el programa del alumno y lo corre en el circuito. */
const EtapaProbar = ({
  toolBox,
  codigo,
  conexiones,
  encabezado,
  onVolverAConectar,
  onSimulacionLista
}) => {
  const contenedorRef = useRef(null)
  const simuladorRef = useRef(null)
  const parlanteRef = useRef(null)
  const cargaIdRef = useRef(0)
  const [estado, setEstado] = useState('cargando') // cargando | corriendo | error
  const [carga, setCarga] = useState({
    progreso: 20,
    mensaje: 'Compilando tu programa…'
  })
  const [error, setError] = useState('')
  const [codigoCargado, setCodigoCargado] = useState(null)
  const desafio = escenaDelDesafio(toolBox, conexiones)

  const detenerParlante = useCallback(() => {
    cargaIdRef.current += 1
    parlanteRef.current?.detener()
    parlanteRef.current = null
  }, [])

  const detener = useCallback(() => {
    detenerParlante()
    simuladorRef.current?.cerrar()
    simuladorRef.current = null
  }, [detenerParlante])

  useEffect(() => {
    if (estado !== 'cargando') return undefined
    const timer = window.setInterval(() => {
      setCarga(prev =>
        prev.progreso < 92
          ? { ...prev, progreso: Math.min(92, prev.progreso + 2) }
          : prev
      )
    }, 400)
    return () => window.clearInterval(timer)
  }, [estado])

  const iniciar = useCallback(async () => {
    detenerParlante()
    const id = cargaIdRef.current
    setError('')
    if (!desafio) {
      detener()
      setEstado('error')
      setError('Este desafío todavía no tiene simulación.')
      return
    }
    if (!codigo || esMensajeDeBloqueo(codigo)) {
      detener()
      setEstado('error')
      setError(
        codigo
          ? 'Tu programa todavía no se puede ejecutar: dentro del bloque "Ejecutar" solo puede haber procedimientos.'
          : 'Armá tu programa con los bloques y volvé a probar.'
      )
      return
    }
    setEstado('cargando')
    setCarga({
      progreso: 20,
      mensaje: 'Compilando tu programa y cargando motor 3D…'
    })
    try {
      let compilo = false
      let cargoPuente = false
      const compilacion = compilar(prepararCodigoParaSimulador(codigo)).then(
        res => {
          compilo = true
          if (cargaIdRef.current === id && !cargoPuente) {
            setCarga({
              progreso: 55,
              mensaje: 'Terminando de cargar el motor 3D…'
            })
          }
          return res
        }
      )
      const puente = cargarPuente().then(res => {
        cargoPuente = true
        if (cargaIdRef.current === id && !compilo) {
          setCarga({ progreso: 45, mensaje: 'Compilando tu programa…' })
        }
        return res
      })
      const [hex] = await Promise.all([compilacion, puente])
      if (cargaIdRef.current !== id || !contenedorRef.current) return
      setCarga({
        progreso: 75,
        mensaje: 'Cargando circuito en el simulador…'
      })
      const parlante =
        desafio.pinParlante && usaParlante(codigo)
          ? new Parlante(frecuenciaDelParlante(codigo))
          : null
      parlanteRef.current = parlante
      let indicePinParlante = -1
      const opcionesMontaje = {
        escena: desafio.escena,
        hex,
        reproducir: true,
        // El programa arranca recién cuando el circuito ya se ve (ver simulador/src/simulador.tsx),
        // así no se pierde el comienzo; recién ahí se saca el cartel de carga.
        alListo: () => {
          if (cargaIdRef.current !== id) return
          setCodigoCargado(codigo)
          setEstado('corriendo')
          onSimulacionLista?.()
        },
        alMensaje: mensaje => {
          if (cargaIdRef.current !== id) return
          if (mensaje.type === 'scene') {
            indicePinParlante = mensaje.channels.pins.indexOf(
              desafio.pinParlante
            )
            setCarga({ progreso: 100, mensaje: 'Iniciando simulación…' })
          } else if (
            mensaje.type === 'frame' &&
            parlante &&
            indicePinParlante >= 0
          ) {
            parlante.muestra(
              mensaje.pins?.[indicePinParlante],
              mensaje.state === 'playing'
            )
          } else if (mensaje.type === 'closed') {
            detener()
            setEstado('error')
            setError(`El simulador se detuvo: ${mensaje.reason}`)
          }
        }
      }
      if (simuladorRef.current?.actualizar) {
        simuladorRef.current.actualizar(opcionesMontaje)
      } else {
        const sim = await montar(contenedorRef.current, opcionesMontaje)
        if (cargaIdRef.current !== id) {
          sim.cerrar()
          return
        }
        simuladorRef.current = sim
      }
    } catch (e) {
      if (cargaIdRef.current !== id) return
      detener()
      setEstado('error')
      setError(e.message || String(e))
    }
  }, [codigo, desafio, detener, detenerParlante])

  const iniciarRef = useRef(iniciar)
  iniciarRef.current = iniciar

  // Arranca al abrir la etapa; se cierra todo al salir.
  useEffect(() => {
    iniciarRef.current()
    return detener
  }, [toolBox, detener])

  const desactualizado = estado === 'corriendo' && codigoCargado !== codigo

  return (
    <>
      <Encabezado paso={2} encabezado={encabezado}>
        {!encabezado.compacto && !encabezado.navegacion && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-gray-300"
            onClick={onVolverAConectar}
            title="Volver a la etapa de conexión"
          >
            <ArrowLeftIcon className="mr-1 h-3.5 w-3.5" />
            Conexiones
          </Button>
        )}
        <Button
          size="sm"
          className={`h-8 text-white ${desactualizado ? 'animate-pulse bg-amber-700 hover:bg-amber-800' : 'bg-arduino hover:bg-arduino-oscuro'}`}
          onClick={iniciar}
          disabled={estado === 'cargando'}
          title="Compila tu programa y lo vuelve a cargar en el simulador"
        >
          {desactualizado ? (
            <PlayIcon className="mr-1.5 h-3.5 w-3.5" />
          ) : (
            <ReloadIcon className="mr-1.5 h-3.5 w-3.5" />
          )}
          {desactualizado ? 'Probar los cambios' : 'Reiniciar'}
        </Button>
      </Encabezado>

      {desafio?.controles.length > 0 && estado === 'corriendo' && (
        <ControlesDeSensores
          controles={desafio.controles}
          simulador={simuladorRef}
        />
      )}

      <div className="relative min-h-0 flex-1">
        <div ref={contenedorRef} className="absolute inset-0" />
        {estado === 'cargando' && (
          <CargaSimulador
            progreso={carga.progreso}
            mensaje={carga.mensaje}
            animacion
          />
        )}
        {estado === 'error' && (
          <div className="absolute inset-0 overflow-auto bg-[#1e1e1e] p-4 text-sm text-red-300">
            <p className="mb-2 font-semibold">No se pudo simular el programa</p>
            <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
          </div>
        )}
      </div>
    </>
  )
}

/** Botones y deslizadores para "tocar" los sensores de la escena. */
const ControlesDeSensores = ({ controles, simulador }) => {
  const enviar = comando =>
    simulador.current?.enviar(comando).then(
      r => {
        if (r && !r.ok) console.error('simulador:', r.error?.message)
      },
      e => console.error('simulador:', e)
    )
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 border-b border-gray-700 px-3 py-2 text-sm text-gray-200">
      {controles.map(control =>
        control.tipo === 'pulsador' ? (
          <Pulsador
            key={control.ref + control.etiqueta}
            control={control}
            enviar={enviar}
          />
        ) : (
          <Deslizador key={control.ref} control={control} enviar={enviar} />
        )
      )}
    </div>
  )
}

const Pulsador = ({ control, enviar }) => {
  const [apretado, setApretado] = useState(false)
  const cambiar = valor => {
    if (valor === apretado) return
    setApretado(valor)
    enviar({ cmd: valor ? 'press' : 'release', ref: control.ref })
  }
  return (
    <div className="flex items-center gap-2">
      <span>{control.etiqueta}:</span>
      <Button
        size="sm"
        className={`h-7 min-w-[250px] touch-none select-none text-white ${apretado ? 'bg-amber-700 hover:bg-amber-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        // La captura del puntero mantiene el botón apretado aunque el mouse se mueva un poco.
        onPointerDown={e => {
          e.currentTarget.setPointerCapture(e.pointerId)
          cambiar(true)
        }}
        onPointerUp={() => cambiar(false)}
        onPointerCancel={() => cambiar(false)}
        onLostPointerCapture={() => cambiar(false)}
        onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && cambiar(true)}
        onKeyUp={e => (e.key === ' ' || e.key === 'Enter') && cambiar(false)}
      >
        {apretado ? '¡Detectando!' : `${control.accion} (mantené apretado)`}
      </Button>
    </div>
  )
}

const Deslizador = ({ control, enviar }) => {
  const aValor = posicion =>
    Math.round(
      control.min +
        (control.invertido ? 1 - posicion : posicion) *
          (control.max - control.min)
    )
  const [valor, setValor] = useState(aValor(control.inicial))
  const cambiar = nuevo => {
    setValor(nuevo)
    const fraccion = (nuevo - control.min) / (control.max - control.min)
    const posicion = control.invertido ? 1 - fraccion : fraccion
    // El potenciómetro de ORBE no acepta los extremos exactos.
    enviar({
      cmd: 'set',
      ref: control.ref,
      value: Math.min(0.999, Math.max(0.001, posicion))
    })
  }
  return (
    <label className="flex items-center gap-2">
      <span>{control.etiqueta}:</span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        value={valor}
        onChange={e => cambiar(Number(e.target.value))}
        className="w-36 accent-arduino-claro"
      />
      <span className="w-14 tabular-nums">
        {valor} {control.unidad}
      </span>
    </label>
  )
}

export default PanelSimulador
