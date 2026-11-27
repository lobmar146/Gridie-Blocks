import { Star, Trophy } from 'lucide-react'
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
