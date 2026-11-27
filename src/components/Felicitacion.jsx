import { AlertTriangle, Star, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

/** El cartel que aparece cuando el programa anda y cumple todas las buenas prácticas. */
export default function Felicitacion({
  abierto,
  onCerrar,
  puntos,
  extraProlijo
}) {
  return (
    <Dialog open={abierto} onOpenChange={abrir => !abrir && onCerrar()}>
      <DialogContent className="max-w-sm border-gray-700 bg-[#252526] text-center text-white">
        <DialogHeader className="items-center sm:text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/15">
            <Trophy className="h-9 w-9 text-amber-300" />
          </div>
          <DialogTitle className="text-xl">
            ¡Cumpliste todas las buenas prácticas!
          </DialogTitle>
          <DialogDescription className="text-base text-gray-300">
            ¡Sos un súper programador!
            {extraProlijo && ' Y encima tu programa es extra prolijo.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-300">
          <Star className="h-6 w-6 fill-amber-300" />
          {puntos} puntos
        </div>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onCerrar}
            className="bg-arduino text-white hover:bg-arduino-oscuro"
          >
            ¡Genial!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const EXPLICACION = {
  servo:
    '¿El servo tiene tiempo? Es como los LED: si no tiene tiempo, no vas a ver su movimiento. Agregá un Esperar después de moverlo.',
  led: '¿El LED tiene tiempo? Si se prende y se apaga sin un Esperar en el medio, no vas a ver el cambio.'
}

/** El cartel que aparece cuando el programa compila pero algo no se llega a ver. */
export function AvisoNoResuelto({ problema, onCerrar }) {
  return (
    <Dialog open={!!problema} onOpenChange={abrir => !abrir && onCerrar()}>
      <DialogContent className="max-w-sm border-gray-700 bg-[#252526] text-center text-white">
        <DialogHeader className="items-center sm:text-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-300/15">
            <AlertTriangle className="h-9 w-9 text-amber-300" />
          </div>
          <DialogTitle className="text-xl">
            ¡Todavía el desafío no fue resuelto!
          </DialogTitle>
          <DialogDescription className="text-base text-gray-300">
            El programa compila bien, pero no funciona.{' '}
            {EXPLICACION[problema] || ''}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button
            onClick={onCerrar}
            className="bg-arduino text-white hover:bg-arduino-oscuro"
          >
            Lo reviso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
