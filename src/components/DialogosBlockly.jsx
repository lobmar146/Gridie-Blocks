import React, { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly/core'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

// Reemplaza los carteles del navegador (prompt, alert y confirm) que usa Blockly por un
// diálogo de la app, con Radix + Tailwind. El caso más común: en el celular o la tablet,
// Blockly pide el nombre del procedimiento (o cualquier valor de un campo) con prompt().
// Se monta una sola vez, en App.

const sinDosPuntos = texto => String(texto ?? '').replace(/:\s*$/, '')

// Título del cartel cuando Blockly pide un valor: si se está editando el nombre
// de un procedimiento, lo dice así; si no, usa el texto que manda Blockly.
const tituloPrompt = (mensaje, valorInicial) => {
  const seleccionado = Blockly.getSelected?.()
  if (
    seleccionado?.type === 'procedures_defnoreturn' &&
    seleccionado.getFieldValue('NAME') === valorInicial
  )
    return 'Nombre del procedimiento'
  return sinDosPuntos(mensaje) || 'Cambiar el valor'
}

const DialogosBlockly = () => {
  // { tipo: 'prompt' | 'alert' | 'confirm', titulo, mensaje, valor, responder }
  const [dialogo, setDialogo] = useState(null)
  const [valor, setValor] = useState('')
  const inputRef = useRef(null)
  // Para responder una sola vez aunque el diálogo se cierre por varios caminos.
  const respondidoRef = useRef(false)

  useEffect(() => {
    const abrir = datos => {
      respondidoRef.current = false
      setValor(datos.valor ?? '')
      setDialogo(datos)
    }

    Blockly.dialog.setPrompt((mensaje, valorInicial, responder) =>
      abrir({
        tipo: 'prompt',
        titulo: tituloPrompt(mensaje, valorInicial),
        valor: valorInicial,
        numerico:
          valorInicial !== '' && !Number.isNaN(Number(valorInicial ?? 'x')),
        responder
      })
    )
    Blockly.dialog.setAlert((mensaje, responder) =>
      abrir({ tipo: 'alert', titulo: 'Aviso', mensaje, responder })
    )
    Blockly.dialog.setConfirm((mensaje, responder) =>
      abrir({ tipo: 'confirm', titulo: '¿Seguro?', mensaje, responder })
    )
  }, [])

  const cerrar = respuesta => {
    if (!dialogo || respondidoRef.current) return
    respondidoRef.current = true
    const { tipo, responder } = dialogo
    setDialogo(null)
    if (!responder) return
    if (tipo === 'prompt') responder(respuesta)
    else if (tipo === 'confirm') responder(Boolean(respuesta))
    else responder()
  }

  // Cerrar con Esc, tocando afuera o con la cruz cuenta como "Cancelar".
  const alCambiarAbierto = abierto => {
    if (abierto) return
    if (dialogo?.tipo === 'prompt') cerrar(null)
    else if (dialogo?.tipo === 'confirm') cerrar(false)
    else cerrar()
  }

  const esPrompt = dialogo?.tipo === 'prompt'

  return (
    <Dialog open={!!dialogo} onOpenChange={alCambiarAbierto}>
      <DialogContent
        className="w-[92vw] max-w-md rounded-lg"
        onOpenAutoFocus={evento => {
          if (!esPrompt) return
          evento.preventDefault()
          inputRef.current?.focus()
          inputRef.current?.select()
        }}
      >
        <form
          className="grid gap-4"
          onSubmit={evento => {
            evento.preventDefault()
            cerrar(esPrompt ? valor : true)
          }}
        >
          <DialogHeader>
            <DialogTitle>{dialogo?.titulo}</DialogTitle>
            {dialogo?.mensaje ? (
              <DialogDescription className="whitespace-pre-line text-base">
                {dialogo.mensaje}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">
                Escribí el valor y tocá Aceptar.
              </DialogDescription>
            )}
          </DialogHeader>

          {esPrompt && (
            <input
              ref={inputRef}
              value={valor}
              onChange={evento => setValor(evento.target.value)}
              inputMode={dialogo?.numerico ? 'decimal' : 'text'}
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arduino"
            />
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {dialogo?.tipo !== 'alert' && (
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                onClick={() => cerrar(esPrompt ? null : false)}
              >
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              className="h-10 bg-arduino text-white hover:bg-arduino-oscuro"
            >
              {dialogo?.tipo === 'alert' ? 'Entendido' : 'Aceptar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DialogosBlockly
