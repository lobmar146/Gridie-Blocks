import React, { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileTextIcon,
  ResetIcon,
  UploadIcon
} from '@radix-ui/react-icons'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  armarArchivo,
  descargarArchivo,
  EXTENSION,
  guardarNombre,
  leerNombre,
  nombreDelArchivo
} from '@/lib/trabajo'
import { useAbrirTrabajo } from './AbrirTrabajo'

const estiloAviso = {
  borderRadius: '10px',
  background: '#333',
  color: '#fff'
}

/**
 * Menú "Mi trabajo" del desafío: guardar el trabajo en un archivo .gridie (para entregarlo
 * o seguir en otra compu), abrir uno, y empezar de nuevo. El trabajo ya se guarda solo en
 * el navegador mientras el alumno programa (lo hace BlocklyComponent).
 */
const MenuTrabajo = ({
  titulo,
  toolBox,
  codigo,
  blocklyRef,
  compacto = false,
  onTrabajoAbierto,
  onEmpezarDeNuevo
}) => {
  const { pathname } = useLocation()
  const [guardando, setGuardando] = useState(false)
  const [nombre, setNombre] = useState(leerNombre)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)
  const inputNombreRef = useRef(null)

  const { elegirArchivo, elementos } = useAbrirTrabajo({
    soltar: true,
    hayTrabajoAca: () => blocklyRef.current?.tieneTrabajo() ?? false,
    alAbrirAca: (datos, resumen) => {
      blocklyRef.current?.cargarBloques(datos.bloques)
      onTrabajoAbierto?.(resumen)
    }
  })

  const descargar = evento => {
    evento.preventDefault()
    const limpio = nombre.trim()
    guardarNombre(limpio)
    const bloques = blocklyRef.current?.obtenerBloques()
    if (!bloques) return
    const datos = armarArchivo({
      ruta: pathname,
      titulo,
      toolBox,
      nombre: limpio,
      bloques,
      codigo
    })
    const archivo = nombreDelArchivo({ titulo, nombre: limpio })
    descargarArchivo(datos, archivo)
    setGuardando(false)
    toast.success(
      `Listo: se descargó "${archivo}". Buscalo en la carpeta Descargas para entregarlo.`,
      { style: estiloAviso, duration: 6000 }
    )
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          {compacto ? (
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 shrink-0 text-gray-200"
              aria-label="Mi trabajo: guardar o abrir"
            >
              <FileTextIcon className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="h-8 bg-gray-800 text-gray-100 hover:bg-gray-700"
            >
              <FileTextIcon className="mr-1.5 h-3.5 w-3.5" />
              Mi trabajo
              <ChevronDownIcon className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-start gap-1.5">
            <CheckIcon className="mt-px h-3.5 w-3.5 shrink-0 text-arduino-claro" />
            Se guarda solo en este dispositivo mientras programás.
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setGuardando(true)
            }}
          >
            <DownloadIcon className="h-4 w-4" />
            <div>
              <div>Guardar en un archivo</div>
              <div className="text-xs text-gray-400">
                Para entregarlo o seguir en otro lado
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={elegirArchivo}>
            <UploadIcon className="h-4 w-4" />
            <div>
              <div>Abrir un archivo</div>
              <div className="text-xs text-gray-400">
                Un trabajo {EXTENSION} guardado antes
              </div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirmarBorrar(true)}>
            <ResetIcon className="h-4 w-4" />
            Empezar de nuevo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {elementos}

      {/* Guardar: el nombre va en el archivo para que el profe sepa de quién es. */}
      <Dialog open={guardando} onOpenChange={setGuardando}>
        <DialogContent
          className="w-[92vw] max-w-md rounded-lg"
          onOpenAutoFocus={evento => {
            evento.preventDefault()
            inputNombreRef.current?.focus()
            inputNombreRef.current?.select()
          }}
        >
          <form className="grid gap-4" onSubmit={descargar}>
            <DialogHeader>
              <DialogTitle>Guardar mi trabajo</DialogTitle>
              <DialogDescription className="text-base">
                Se descarga un archivo con tus bloques y cómo conectaste el
                circuito. Podés entregarlo en el aula virtual o abrirlo después
                desde “Mi trabajo”.
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-1.5 text-sm">
              <span className="text-gray-300">
                Tu nombre y apellido (para que tu profe sepa de quién es)
              </span>
              <input
                ref={inputNombreRef}
                value={nombre}
                onChange={evento => setNombre(evento.target.value)}
                placeholder="Por ejemplo: Ana Pérez"
                autoComplete="name"
                maxLength={60}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-base text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arduino"
              />
            </label>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                className="h-10"
                onClick={() => setGuardando(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-10 bg-arduino text-white hover:bg-arduino-oscuro"
              >
                <DownloadIcon className="mr-1.5 h-4 w-4" />
                Descargar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmarBorrar} onOpenChange={setConfirmarBorrar}>
        <DialogContent className="w-[92vw] max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>¿Empezar de nuevo?</DialogTitle>
            <DialogDescription className="text-base">
              Se borran todos tus bloques de este desafío y queda solo el bloque
              principal. Los cables que conectaste no se tocan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              className="h-10"
              onClick={() => setConfirmarBorrar(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10"
              onClick={() => {
                setConfirmarBorrar(false)
                blocklyRef.current?.empezarDeNuevo()
                onEmpezarDeNuevo?.()
              }}
            >
              Borrar mis bloques
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default MenuTrabajo
