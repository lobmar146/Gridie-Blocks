import { Check, Star } from 'lucide-react'

/**
 * La marca que va en la esquina de la tarjeta de un desafío terminado: un tilde y, si el
 * desafío tiene buenas prácticas, el mejor puntaje que sacó el alumno.
 * `progreso`: { puntos, total, fecha } (o nada si todavía no lo terminó).
 */
export default function MarcaTerminado({ progreso }) {
  if (!progreso) return null
  const { puntos = 0, total = 0, fecha } = progreso
  const dia = fecha ? new Date(fecha).toLocaleDateString('es-AR') : ''
  const descripcion = [
    dia ? `Terminado el ${dia}` : 'Terminado',
    total ? `${puntos} de ${total} puntos de buenas prácticas` : ''
  ]
    .filter(Boolean)
    .join(', ')
  return (
    <div
      className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1 sm:right-2 sm:top-2"
      title={descripcion}
      aria-label={descripcion}
      role="img"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 shadow-md ring-2 ring-[#202020] sm:h-8 sm:w-8">
        <Check className="h-4 w-4 text-white sm:h-5 sm:w-5" strokeWidth={3} />
      </span>
      {total > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-gray-900/90 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 shadow-md ring-1 ring-amber-300/40 sm:px-2 sm:text-xs">
          <Star className="hidden h-3 w-3 fill-amber-300 sm:block" />
          <span>
            {puntos}
            <span className="font-normal text-gray-400">/{total}</span>
          </span>
        </span>
      )}
    </div>
  )
}
