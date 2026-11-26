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
import { Spinner } from '@/components/ui/spinner'
import {
  frecuenciaDelParlante,
  prepararCodigoParaSimulador,
  usaParlante
} from './codigoSimulador'
import { compilar } from './compilador'
import { cablesDelDesafio, escenaDelDesafio, nombreDelPin } from './escenas'
import { Parlante } from './parlante'

// El puente con ORBE se compila aparte (carpeta simulador/) y se publica en public/simulador.
// En desarrollo la app vive en la raíz del servidor; en producción, al lado de index.html.
const baseDeLaApp = () =>
  import.meta.env.MODE === 'development'
    ? `${window.location.origin}/`
    : document.baseURI
const urlSimulador = ruta => new URL(`simulador/${ruta}`, baseDeLaApp()).href
const cargarPuente = () =>
  import(/* @vite-ignore */ urlSimulador('gridie-simulador.js'))
let hexVacio = null
const cargarHexVacio = async () => {
  if (!hexVacio) {
    const r = await fetch(urlSimulador('vacio.hex'))
    hexVacio = new Uint8Array(await r.arrayBuffer())
  }
  return hexVacio
}

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
const CONECTOR_DIGITAL = [
  { texto: 'AREF' },
  { texto: 'GND', pin: 'GND' },
  ...[13, 12, 11, 10, 9, 8].map(n => ({ texto: `${n}`, pin: `D${n}` })),
  null,
  ...[7, 6, 5, 4, 3, 2].map(n => ({ texto: `${n}`, pin: `D${n}` })),
  { texto: 'TX 1' },
  { texto: 'RX 0' }
]
const CONECTOR_ABAJO = [
  { texto: 'IOREF' },
  { texto: 'RESET' },
  { texto: '3.3V', pin: '3V3' },
  { texto: '5V', pin: '5V' },
  { texto: 'GND', pin: 'GND' },
  { texto: 'GND', pin: 'GND' },
  { texto: 'Vin' },
  null,
  ...[0, 1, 2, 3, 4, 5].map(n => ({ texto: `A${n}`, pin: `A${n}` }))
]

/** Dónde está un pin en la placa, para ayudar a encontrarlo. */
const dondeEsta = pin => {
  if (/^D/.test(pin))
    return 'en el conector de arriba, el de los pines digitales'
  if (/^A/.test(pin)) return 'abajo a la derecha, en ANALOG IN'
  if (pin === 'GND')
    return 'abajo, en POWER (también hay uno arriba, al lado del 13)'
  return 'abajo, en el conector POWER'
}

/** Los conectores del Arduino para hacer clic en el pin donde va el cable. */
const TableroDePines = ({ onElegir, marcado, deshabilitado }) => {
  const fila = (pines, arriba) => (
    <div className="flex gap-[2px]">
      {pines.map((p, i) =>
        p === null ? (
          <span key={i} className="w-2" />
        ) : (
          <button
            key={i}
            type="button"
            disabled={!p.pin || deshabilitado}
            onClick={() => onElegir(p.pin)}
            title={p.pin ? nombreDelPin(p.pin) : 'No se usa en GrIDIE'}
            className={`flex w-[22px] flex-col items-center gap-0.5 rounded-sm py-0.5 text-[9px] leading-none ${
              p.pin
                ? 'text-white hover:bg-white/20'
                : 'cursor-default text-white/40'
            } ${marcado && p.pin === marcado ? 'animate-pulse bg-amber-500/70' : ''}`}
          >
            {arriba && <span className="h-3">{p.texto}</span>}
            <span
              className={`h-3 w-3 rounded-[2px] border ${p.pin ? 'border-gray-500 bg-black' : 'border-gray-700 bg-gray-900'}`}
            />
            {!arriba && <span className="h-3">{p.texto}</span>}
          </button>
        )
      )}
    </div>
  )
  return (
    <div className="inline-flex flex-col gap-3 rounded-md bg-[#00878f] px-2 py-2 shadow-inner">
      <div className="flex items-end justify-end">
        {fila(CONECTOR_DIGITAL, true)}
      </div>
      <div className="text-center text-[10px] font-semibold tracking-widest text-white/80">
        ARDUINO UNO
      </div>
      <div className="flex justify-end pr-6">{fila(CONECTOR_ABAJO, false)}</div>
    </div>
  )
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
  const [errorVista, setErrorVista] = useState('')
  const [aviso, setAviso] = useState(null) // { ok, texto }
  const listos = conectadosBien(cables, conexiones)
  const actual = cables.find(c => conexiones[c.id] !== c.esperado)
  const numero = actual ? cables.indexOf(actual) + 1 : cables.length

  // La vista 3D muestra solo los cables que el alumno ya conectó.
  const conexionesHechas = Object.fromEntries(
    listos.map(c => [c.id, conexiones[c.id]])
  )
  useEffect(() => {
    let simulador = null
    let cancelado = false
    setErrorVista('')
    ;(async () => {
      try {
        const hex = await cargarHexVacio()
        if (cancelado || !contenedorRef.current) return
        simulador = await montar(contenedorRef.current, {
          escena: escenaDelDesafio(toolBox, conexionesHechas, {
            soloElegidas: true
          }).escena,
          hex,
          reproducir: false,
          alMensaje: m => m.type === 'closed' && setErrorVista(m.reason)
        })
        if (cancelado) simulador.cerrar()
      } catch (e) {
        setErrorVista(e.message || String(e))
      }
    })()
    return () => {
      cancelado = true
      simulador?.cerrar()
    }
  }, [toolBox, JSON.stringify(conexionesHechas)])

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
              Lo encontrás {dondeEsta(actual.esperado)}. Hacé clic en ese pin:
            </div>
          </div>
          <div className="overflow-x-auto">
            <TableroDePines
              onElegir={elegir}
              marcado={aviso && !aviso.ok ? actual.esperado : null}
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
          {errorVista && (
            <pre className="absolute inset-x-0 bottom-0 max-h-[50%] overflow-auto bg-[#1e1e1e]/90 p-3 text-xs text-red-300">
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
  const [estado, setEstado] = useState('compilando') // compilando | corriendo | error
  const [error, setError] = useState('')
  const [codigoCargado, setCodigoCargado] = useState(null)
  const desafio = escenaDelDesafio(toolBox, conexiones)

  const detener = () => {
    simuladorRef.current?.cerrar()
    simuladorRef.current = null
    parlanteRef.current?.detener()
    parlanteRef.current = null
  }

  const iniciar = useCallback(async () => {
    detener()
    setError('')
    if (!desafio) {
      setEstado('error')
      setError('Este desafío todavía no tiene simulación.')
      return
    }
    if (!codigo || esMensajeDeBloqueo(codigo)) {
      setEstado('error')
      setError(
        codigo
          ? 'Tu programa todavía no se puede ejecutar: dentro del bloque "Ejecutar" solo puede haber procedimientos.'
          : 'Armá tu programa con los bloques y volvé a probar.'
      )
      return
    }
    setEstado('compilando')
    try {
      const hex = await compilar(prepararCodigoParaSimulador(codigo))
      if (!contenedorRef.current) return
      const parlante =
        desafio.pinParlante && usaParlante(codigo)
          ? new Parlante(frecuenciaDelParlante(codigo))
          : null
      parlanteRef.current = parlante
      let indicePinParlante = -1
      simuladorRef.current = await montar(contenedorRef.current, {
        escena: desafio.escena,
        hex,
        reproducir: true,
        alMensaje: mensaje => {
          if (mensaje.type === 'scene') {
            indicePinParlante = mensaje.channels.pins.indexOf(
              desafio.pinParlante
            )
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
            setEstado('error')
            setError(`El simulador se detuvo: ${mensaje.reason}`)
          }
        }
      })
      setCodigoCargado(codigo)
      setEstado('corriendo')
    } catch (e) {
      setEstado('error')
      setError(e.message || String(e))
    }
  }, [codigo, toolBox])

  // Arranca al abrir la etapa; se cierra todo al salir.
  useEffect(() => {
    iniciar()
    return detener
  }, [toolBox])

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
          disabled={estado === 'compilando'}
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
        {estado === 'compilando' && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-[#1e1e1e]/80 text-gray-200">
            <Spinner /> Preparando tu programa…
          </div>
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
