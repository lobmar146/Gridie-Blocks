import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  Cross2Icon,
  CrossCircledIcon,
  ReloadIcon
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  frecuenciaDelParlante,
  prepararCodigoParaSimulador,
  usaParlante
} from './codigoSimulador'
import { compilar } from './compilador'
import { cablesDelDesafio, escenaDelDesafio, PINES_ARDUINO } from './escenas'
import { Parlante } from './parlante'

// El puente con ORBE se compila aparte (carpeta simulador/) y se publica en public/simulador.
const urlSimulador = ruta => new URL(`simulador/${ruta}`, document.baseURI).href
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

/**
 * Panel del simulador, en dos etapas:
 * 1. Conectar: el alumno elige a qué pin del Arduino va cada cable y lo ve en 3D.
 *    Cuando están todos bien, pasa a la etapa 2.
 * 2. Probar: compila el programa, lo corre en el circuito y muestra los controles de los
 *    sensores.
 */
const PanelSimulador = ({ toolBox, codigo, onCerrar }) => {
  const guardado = leerGuardado(toolBox)
  const [conexiones, setConexiones] = useState(guardado.conexiones || {})
  const [etapa, setEtapa] = useState(
    guardado.verificado ? 'probar' : 'conectar'
  )

  const cambiarConexiones = nuevas => {
    setConexiones(nuevas)
    guardar(toolBox, { conexiones: nuevas, verificado: false })
  }
  const aprobar = () => {
    guardar(toolBox, { conexiones, verificado: true })
    setEtapa('probar')
  }

  return (
    <div className="ml-2 mr-2 flex h-full w-[45%] min-w-[380px] flex-col overflow-hidden rounded-[10px] border border-gray-700 bg-[#1e1e1e]">
      {etapa === 'conectar' ? (
        <EtapaConectar
          toolBox={toolBox}
          conexiones={conexiones}
          onCambiar={cambiarConexiones}
          onAprobar={aprobar}
          onCerrar={onCerrar}
        />
      ) : (
        <EtapaProbar
          toolBox={toolBox}
          codigo={codigo}
          conexiones={conexiones}
          onVolverAConectar={() => setEtapa('conectar')}
          onCerrar={onCerrar}
        />
      )}
    </div>
  )
}

const Encabezado = ({ paso, children, onCerrar }) => (
  <div className="flex items-center justify-between gap-2 border-b border-gray-700 px-3 py-2">
    <div className="flex items-center gap-3 text-sm">
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
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-gray-300"
        onClick={onCerrar}
        aria-label="Cerrar simulador"
      >
        <Cross2Icon className="h-4 w-4" />
      </Button>
    </div>
  </div>
)

/** Etapa 1: elegir el pin de cada cable y verlo en la escena. */
const EtapaConectar = ({
  toolBox,
  conexiones,
  onCambiar,
  onAprobar,
  onCerrar
}) => {
  const cables = cablesDelDesafio(toolBox)
  const contenedorRef = useRef(null)
  const [revision, setRevision] = useState(null) // { id: true | false }
  const [errorVista, setErrorVista] = useState('')

  // La vista 3D muestra solo los cables que el alumno ya conectó.
  useEffect(() => {
    let simulador = null
    let cancelado = false
    setErrorVista('')
    ;(async () => {
      try {
        const hex = await cargarHexVacio()
        if (cancelado || !contenedorRef.current) return
        simulador = await montar(contenedorRef.current, {
          escena: escenaDelDesafio(toolBox, conexiones, { soloElegidas: true })
            .escena,
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
  }, [toolBox, JSON.stringify(conexiones)])

  const elegir = (id, pin) => {
    setRevision(null)
    onCambiar({ ...conexiones, [id]: pin })
  }

  const verificar = () => {
    const resultado = Object.fromEntries(
      cables.map(c => [c.id, conexiones[c.id] === c.esperado])
    )
    setRevision(resultado)
    if (Object.values(resultado).every(Boolean)) setTimeout(onAprobar, 900)
  }

  const faltan = cables.filter(c => !conexiones[c.id]).length
  const malos = revision ? Object.values(revision).filter(ok => !ok).length : 0

  return (
    <>
      <Encabezado paso={1} onCerrar={onCerrar}>
        <Button
          size="sm"
          className="h-8 bg-emerald-700 text-white hover:bg-emerald-800"
          onClick={verificar}
          disabled={faltan > 0}
          title={faltan > 0 ? 'Conectá todos los cables primero' : ''}
        >
          Verificar conexiones
        </Button>
      </Encabezado>
      <div className="max-h-[45%] overflow-y-auto border-b border-gray-700 px-3 py-2 text-sm text-gray-200">
        <p className="mb-2 text-gray-300">
          🔌 Antes de programar, conectá el circuito: elegí a qué pin del
          Arduino va cada cable. Si tenés dudas, mirá «¿Cómo se conecta?».
        </p>
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1.5">
          {cables.map(cable => (
            <React.Fragment key={cable.id}>
              <span>{cable.etiqueta}</span>
              <select
                className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-white"
                value={conexiones[cable.id] || ''}
                onChange={e => elegir(cable.id, e.target.value)}
                aria-label={cable.etiqueta}
              >
                <option value="" disabled>
                  Elegí un pin
                </option>
                {PINES_ARDUINO.map(pin => (
                  <option key={pin} value={pin}>
                    {pin}
                  </option>
                ))}
              </select>
              <span className="w-5">
                {revision &&
                  (revision[cable.id] ? (
                    <CheckCircledIcon className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <CrossCircledIcon className="h-5 w-5 text-red-400" />
                  ))}
              </span>
            </React.Fragment>
          ))}
        </div>
        {revision && malos > 0 && (
          <p className="mt-2 text-amber-300">
            {malos === 1
              ? 'Hay un cable mal conectado'
              : `Hay ${malos} cables mal conectados`}
            . Revisalos y volvé a verificar.
          </p>
        )}
        {revision && malos === 0 && (
          <p className="mt-2 text-emerald-300">
            ¡Todo bien conectado! Vamos a probar tu programa…
          </p>
        )}
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={contenedorRef} className="absolute inset-0" />
        {errorVista && (
          <pre className="max-h-[50%] absolute inset-x-0 bottom-0 overflow-auto bg-[#1e1e1e]/90 p-3 text-xs text-red-300">
            {errorVista}
          </pre>
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
  onVolverAConectar,
  onCerrar
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
      <Encabezado paso={2} onCerrar={onCerrar}>
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
