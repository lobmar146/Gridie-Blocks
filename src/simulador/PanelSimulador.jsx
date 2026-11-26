import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  Cross2Icon,
  ImageIcon,
  ReloadIcon,
  ResetIcon
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

const CargaSimulador = ({ progreso, mensaje }) => (
  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#1e1e1e]/85 p-6">
    <div className="flex w-full max-w-xs flex-col gap-2.5 text-center">
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

// Lo que conectó el alumno se guarda en el navegador, por desafío.
const claveConexiones = toolBox => `gridie-conexiones-${toolBox}`
const leerGuardado = toolBox => {
  try {
    return JSON.parse(localStorage.getItem(claveConexiones(toolBox))) || {}
  } catch {
    return {}
  }
}
const guardar = (toolBox, datos) => {
  try {
    localStorage.setItem(claveConexiones(toolBox), JSON.stringify(datos))
  } catch {
    // sin almacenamiento: no pasa nada, solo no se recuerda
  }
}

/** Monta el visor de ORBE en `contenedor` y devuelve el simulador (o lanza). */
async function montar(contenedor, { escena, hex, reproducir, alMensaje }) {
  const puente = await cargarPuente()
  return puente.montarSimulador(contenedor, {
    escena,
    hex,
    base: urlSimulador(''),
    reproducir,
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
 */
const PanelSimulador = ({
  toolBox,
  codigo,
  titulo,
  esquema,
  enVentana = false,
  onCerrar
}) => {
  const cables = cablesDelDesafio(toolBox)
  const guardado = leerGuardado(toolBox)
  const [conexiones, setConexiones] = useState(guardado.conexiones || {})
  const completo = cables.every(c => conexiones[c.id] === c.esperado)
  const [etapa, setEtapa] = useState(
    guardado.verificado && completo ? 'probar' : 'conectar'
  )
  const [verEsquema, setVerEsquema] = useState(false)

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
    onVerEsquema: () => setVerEsquema(true),
    onCerrar
  }

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-[10px] border border-gray-700 bg-[#1e1e1e] ${enVentana ? 'w-full' : 'ml-2 mr-2 w-[45%] min-w-[380px]'}`}
    >
      {etapa === 'conectar' ? (
        <EtapaConectar
          toolBox={toolBox}
          cables={cables}
          conexiones={conexiones}
          enVentana={enVentana}
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
  <div className="flex items-center justify-between gap-2 border-b border-gray-700 px-3 py-2">
    <div className="flex min-w-0 items-center gap-3 text-sm">
      {encabezado.titulo && (
        <span className="truncate font-semibold text-violet-300">
          {encabezado.titulo}
        </span>
      )}
      <span
        className={paso === 1 ? 'font-semibold text-white' : 'text-gray-400'}
      >
        1. Conectar
      </span>
      <span className="text-gray-600">›</span>
      <span
        className={paso === 2 ? 'font-semibold text-white' : 'text-gray-400'}
      >
        2. Probar
      </span>
    </div>
    <div className="flex items-center gap-2">
      {children}
      {encabezado.esquema && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-gray-300"
          onClick={encabezado.onVerEsquema}
          title="Ver el esquema de conexión del desafío"
        >
          <ImageIcon className="mr-1 h-3.5 w-3.5" />
          Esquema
        </Button>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-gray-300"
        onClick={encabezado.onCerrar}
        aria-label="Cerrar simulador"
      >
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

// ---- Etapa 1: conexión guiada ------------------------------------------------------------

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
  useEffect(() => {
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
  }, [toolBox, claveConexionesHechas])

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
      className={`flex flex-col gap-3 overflow-y-auto px-4 py-3 text-sm text-gray-200 ${enVentana ? 'w-[440px] shrink-0 border-r border-gray-700' : 'max-h-[55%] border-b border-gray-700'}`}
    >
      <div className="flex items-center justify-between text-xs text-gray-400">
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
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${(100 * listos.length) / cables.length}%` }}
        />
      </div>

      {actual ? (
        <>
          <div className="rounded-lg border border-gray-600 bg-gray-800/70 p-3">
            <div className="mb-1 text-xs uppercase tracking-wide text-gray-400">
              {actual.nombreComponente}
            </div>
            <div className="flex items-start gap-2 text-base">
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
            <div className="mt-1 text-xs text-gray-400">
              Lo encontrás {dondeEsta(actual.esperado)}. Arrastrá el conector
              hasta ese pin (o hacé clic):
            </div>
          </div>
          <div className="overflow-x-auto">
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
          </div>
          {aviso && (
            <p className={aviso.ok ? 'text-emerald-300' : 'text-amber-300'}>
              {aviso.ok ? '✓ ' : '✗ '}
              {aviso.texto}
            </p>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-emerald-700 bg-emerald-900/30 p-3">
          <p className="mb-3 text-base text-emerald-200">
            🎉 ¡Circuito armado! Ya podés probar tu programa.
          </p>
          <Button
            className="bg-emerald-700 text-white hover:bg-emerald-800"
            onClick={onAprobar}
          >
            Probar mi programa ▶
          </Button>
        </div>
      )}

      {listos.length > 0 && (
        <ul className="space-y-1 text-xs text-gray-400">
          {listos.map(c => (
            <li key={c.id} className="flex items-center gap-2">
              <CheckCircledIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
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
        className={`flex min-h-0 flex-1 ${enVentana ? 'flex-row' : 'flex-col'}`}
      >
        {guia}
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
  onVolverAConectar
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
        alMensaje: mensaje => {
          if (cargaIdRef.current !== id) return
          if (mensaje.type === 'scene') {
            indicePinParlante = mensaje.channels.pins.indexOf(
              desafio.pinParlante
            )
            setCarga({ progreso: 100, mensaje: 'Iniciando simulación…' })
            window.requestAnimationFrame(() => {
              if (cargaIdRef.current !== id) return
              setCodigoCargado(codigo)
              setEstado('corriendo')
            })
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
        <Button
          size="sm"
          className={`h-8 text-white ${desactualizado ? 'animate-pulse bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'}`}
          onClick={iniciar}
          disabled={estado === 'cargando'}
          title="Compila tu programa y lo vuelve a cargar en el simulador"
        >
          <ReloadIcon className="mr-1.5 h-3.5 w-3.5" />
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
          <CargaSimulador progreso={carga.progreso} mensaje={carga.mensaje} />
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
        className={`h-7 min-w-[250px] touch-none select-none text-white ${apretado ? 'bg-amber-600 hover:bg-amber-600' : 'bg-gray-700 hover:bg-gray-600'}`}
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
        className="w-36 accent-emerald-500"
      />
      <span className="w-14 tabular-nums">
        {valor} {control.unidad}
      </span>
    </label>
  )
}

export default PanelSimulador
