import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Cross2Icon, ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  frecuenciaDelParlante,
  prepararCodigoParaSimulador,
  usaParlante
} from './codigoSimulador'
import { compilar } from './compilador'
import { escenaDelDesafio } from './escenas'
import { Parlante } from './parlante'

// El puente con ORBE se compila aparte (carpeta simulador/) y se publica en public/simulador.
const cargarPuente = () =>
  import(
    /* @vite-ignore */ new URL(
      'simulador/gridie-simulador.js',
      document.baseURI
    ).href
  )

const esMensajeDeBloqueo = codigo => codigo.trim().startsWith('Recuerda')

/**
 * Panel con el simulador 3D: compila el programa del alumno, lo carga en la escena del
 * desafío y muestra los controles de los sensores.
 */
const PanelSimulador = ({ toolBox, codigo, onCerrar }) => {
  const contenedorRef = useRef(null)
  const simuladorRef = useRef(null)
  const parlanteRef = useRef(null)
  const [estado, setEstado] = useState('compilando') // compilando | corriendo | error
  const [error, setError] = useState('')
  const [codigoCargado, setCodigoCargado] = useState(null)
  const desafio = escenaDelDesafio(toolBox)

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
      const [hex, puente] = await Promise.all([
        compilar(prepararCodigoParaSimulador(codigo)),
        cargarPuente()
      ])
      if (!contenedorRef.current) return
      const parlante = usaParlante(codigo)
        ? new Parlante(frecuenciaDelParlante(codigo))
        : null
      parlanteRef.current = parlante
      let indicePinParlante = -1
      simuladorRef.current = puente.montarSimulador(contenedorRef.current, {
        escena: desafio.escena,
        hex,
        base: new URL('simulador/', document.baseURI).href,
        reproducir: true,
        alMensaje: mensaje => {
          // Para las pruebas automáticas en desarrollo.
          if (import.meta.env.DEV)
            window.__simuladorGridie = {
              ...window.__simuladorGridie,
              [mensaje.type]: mensaje
            }
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

  // Arranca al abrir el panel; se cierra todo al desmontar.
  useEffect(() => {
    iniciar()
    return detener
  }, [toolBox])

  const desactualizado = estado === 'corriendo' && codigoCargado !== codigo

  return (
    <div className="ml-2 mr-2 flex h-full w-[45%] min-w-[360px] flex-col overflow-hidden rounded-[10px] border border-gray-700 bg-[#1e1e1e]">
      <div className="flex items-center justify-between gap-2 border-b border-gray-700 px-3 py-2">
        <span className="text-sm font-semibold text-white">🧪 Simulador</span>
        <div className="flex items-center gap-2">
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
    </div>
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
