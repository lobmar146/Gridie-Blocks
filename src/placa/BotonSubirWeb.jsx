// Botón "Subir a la placa" de la versión web: compila en el servidor de compilación y sube
// el .hex al Arduino Uno conectado por USB, con Web Serial (Chrome o Edge de escritorio).
import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { UploadIcon } from '@radix-ui/react-icons'
import { AvisoEnvio } from '@/components/AnimacionEnvio'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { compilar, ErrorDeCompilacion } from '../simulador/compilador'
import {
  elegirPuerto,
  ErrorDeSubida,
  hayWebSerial,
  subirHex
} from './subirWebSerial'

const estilo = {
  borderRadius: '10px',
  background: '#333',
  color: '#fff',
  fontSize: '18px',
  maxWidth: '520px'
}

// Si el alumno ya eligió su placa antes, se usa esa sin volver a preguntar.
async function puertoDeLaPlaca() {
  const conocidos = await navigator.serial.getPorts()
  if (conocidos.length === 1) return conocidos[0]
  return elegirPuerto()
}

export default function BotonSubirWeb({ codigo, onSubido }) {
  const [mensaje, setMensaje] = useState(null)

  const subir = async () => {
    if (!hayWebSerial()) {
      toast.error(
        'Este navegador no puede subir programas a la placa. Usá Chrome o Edge en una computadora, o la app de escritorio de GrIDIE.',
        { style: estilo, duration: 7000 }
      )
      return
    }
    if (!codigo || codigo.trim().startsWith('Recuerda')) {
      toast.error(
        codigo
          ? 'Tu programa todavía no se puede subir: dentro del bloque "Ejecutar" solo puede haber procedimientos.'
          : 'Armá tu programa con los bloques y volvé a probar.',
        { style: estilo }
      )
      return
    }

    let puerto
    try {
      // Hay que pedir el puerto enseguida, mientras dura el clic del alumno.
      puerto = await puertoDeLaPlaca()
      if (!puerto) return
      setMensaje('Compilando…')
      const hex = new TextDecoder().decode(await compilar(codigo))
      await subirHex(puerto, hex, (progreso, texto) =>
        setMensaje(
          progreso > 0 && progreso < 100 ? `${texto} ${progreso}%` : texto
        )
      )
      toast.success('¡Programa subido a la placa!', { style: estilo })
      onSubido?.()
    } catch (error) {
      const conocido =
        error instanceof ErrorDeSubida || error instanceof ErrorDeCompilacion
      toast.error(
        conocido
          ? error.message
          : `No se pudo subir el programa: ${error?.message ?? error}`,
        { style: estilo, duration: 8000 }
      )
      if (!conocido) console.error('Error al subir por Web Serial:', error)
    } finally {
      setMensaje(null)
    }
  }

  const ocupado = mensaje !== null
  return (
    <>
      {ocupado && <AvisoEnvio mensaje={mensaje} />}
      <Button
        variant="default"
        size="sm"
        className={`justify-start bg-arduino text-white hover:bg-arduino-oscuro ${ocupado ? 'opacity-70' : ''}`}
        onClick={subir}
        disabled={ocupado}
        title="Conectá el Arduino Uno por USB (Chrome o Edge)"
      >
        {ocupado ? (
          <Spinner className="mr-1.5" />
        ) : (
          <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
        )}
        {mensaje ?? 'Subir a la placa'}
      </Button>
    </>
  )
}
