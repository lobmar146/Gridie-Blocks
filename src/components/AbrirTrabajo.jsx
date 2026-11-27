import React, { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ArchivoInvalido,
  bloquesConTrabajo,
  EXTENSION,
  fechaLegible,
  guardarTrabajoDelArchivo,
  leerArchivo,
  leerBloques
} from '@/lib/trabajo'

// En el celular el selector no conoce la extensión .gridie: con `accept` deja el archivo
// gris y no se puede elegir. Ahí se muestra todo y se rechaza al leerlo.
const esCelular = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return (
    /Android|iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) // iPad que se hace pasar por Mac
  )
}
const FILTRO = esCelular() ? undefined : EXTENSION

const estiloAviso = {
  borderRadius: '10px',
  background: '#333',
  color: '#fff'
}

/** Quién y cuándo, para los avisos: "el trabajo de Ana (guardado el 26/11/2026 a las 18:30)". */
export const describirTrabajo = datos => {
  const quien = datos.alumno ? `el trabajo de ${datos.alumno}` : 'el trabajo'
  const cuando = fechaLegible(datos.guardado)
  return cuando ? `${quien} (guardado el ${cuando})` : quien
}

/**
 * Abrir un archivo .gridie: elegirlo (o soltarlo arriba de la página), avisar si va a
 * reemplazar lo que ya hay en ese desafío, y llevarlo a la pantalla del desafío.
 *
 * - `alAbrirAca(datos)`: si el archivo es del desafío que está abierto, lo carga sin salir
 *   de la pantalla. Si no, se navega al desafío del archivo, que lo lee del navegador.
 * - `hayTrabajoAca()`: si el desafío abierto tiene bloques del alumno.
 * - `soltar`: también abre un archivo que se suelte arriba de la página.
 *
 * Devuelve `elegirArchivo` (abre el selector) y `elementos` (el input y el aviso), que
 * hay que poner en la página.
 */
export function useAbrirTrabajo({
  alAbrirAca,
  hayTrabajoAca,
  soltar = false
} = {}) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inputRef = useRef(null)
  const [pendiente, setPendiente] = useState(null) // trabajo esperando confirmación

  const esDeAca = datos => alAbrirAca && datos.desafio.ruta === pathname

  const aplicar = datos => {
    guardarTrabajoDelArchivo(datos)
    const resumen = {
      alumno: datos.alumno || '',
      guardado: datos.guardado,
      titulo: datos.desafio.titulo
    }
    if (esDeAca(datos)) alAbrirAca(datos, resumen)
    else navigate(datos.desafio.ruta, { state: { trabajoAbierto: resumen } })
  }

  const abrirArchivo = useCallback(
    async archivo => {
      let datos
      try {
        datos = await leerArchivo(archivo)
      } catch (error) {
        toast.error(
          error instanceof ArchivoInvalido
            ? error.message
            : 'No se pudo leer el archivo.',
          { style: estiloAviso, duration: 6000 }
        )
        return
      }
      if (!String(datos.desafio.ruta || '').startsWith('/')) {
        toast.error('El archivo no dice de qué desafío es.', {
          style: estiloAviso
        })
        return
      }
      const yaHayTrabajo = esDeAca(datos)
        ? hayTrabajoAca?.()
        : bloquesConTrabajo(leerBloques(datos.desafio.toolBox))
      if (yaHayTrabajo) setPendiente(datos)
      else aplicar(datos)
    },
    [pathname, alAbrirAca, hayTrabajoAca]
  )

  const elegirArchivo = () => inputRef.current?.click()

  // Soltar el archivo arriba de la página (cómodo para el profe que corrige varios).
  useEffect(() => {
    if (!soltar) return undefined
    const tieneArchivos = evento =>
      Array.from(evento.dataTransfer?.types || []).includes('Files')
    const sobre = evento => {
      if (!tieneArchivos(evento)) return
      evento.preventDefault()
      evento.dataTransfer.dropEffect = 'copy'
    }
    const alSoltar = evento => {
      if (!tieneArchivos(evento)) return
      evento.preventDefault()
      const archivo = evento.dataTransfer.files?.[0]
      if (archivo) abrirArchivo(archivo)
    }
    window.addEventListener('dragover', sobre)
    window.addEventListener('drop', alSoltar)
    return () => {
      window.removeEventListener('dragover', sobre)
      window.removeEventListener('drop', alSoltar)
    }
  }, [soltar, abrirArchivo])

  const elementos = (
    <>
      {/* En la compu y la app de escritorio el selector muestra solo archivos .gridie.
          En el celular muestra todo (ver esCelular). Igual se valida al leerlo. */}
      <input
        ref={inputRef}
        type="file"
        accept={FILTRO}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={evento => {
          const archivo = evento.target.files?.[0]
          evento.target.value = '' // para poder elegir el mismo archivo otra vez
          if (archivo) abrirArchivo(archivo)
        }}
      />
      <Dialog
        open={!!pendiente}
        onOpenChange={abierto => !abierto && setPendiente(null)}
      >
        <DialogContent className="w-[92vw] max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>¿Reemplazar los bloques?</DialogTitle>
            <DialogDescription className="text-base">
              {pendiente &&
                `En "${pendiente.desafio.titulo}" ya hay bloques guardados en este dispositivo. Si abrís ${describirTrabajo(pendiente)}, se reemplazan por los del archivo.`}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-gray-400">
            Si querés conservarlos, primero guardalos en un archivo desde el
            menú “Mi trabajo”.
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => setPendiente(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="h-10 bg-arduino text-white hover:bg-arduino-oscuro"
              onClick={() => {
                const datos = pendiente
                setPendiente(null)
                aplicar(datos)
              }}
            >
              Reemplazar y abrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  return { elegirArchivo, abrirArchivo, elementos }
}

export { EXTENSION }
