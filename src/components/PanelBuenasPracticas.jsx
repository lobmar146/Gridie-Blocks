import { useState } from 'react'
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  ListChecks,
  Star,
  X
} from 'lucide-react'
import { puntaje, TEMAS } from '@/lib/buenasPracticas'

/** La lista de buenas prácticas, por tema; se van tildando a medida que el alumno programa. */
function Lista({ reglas }) {
  const temas = TEMAS.filter(t => reglas.some(r => r.tema === t.id))
  return (
    <div className="flex flex-col gap-4">
      {temas.map(tema => (
        <section key={tema.id}>
          {temas.length > 1 && (
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {tema.titulo}
            </h3>
          )}
          <ul className="flex flex-col gap-3">
            {reglas
              .filter(r => r.tema === tema.id)
              .map(regla => (
                <li key={regla.id} className="flex gap-2.5">
                  {regla.cumple ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-arduino-claro"
                      aria-label="Cumplido"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
                      aria-label="Pendiente"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold leading-snug ${regla.cumple ? 'text-arduino-suave' : 'text-gray-100'}`}
                    >
                      {regla.titulo}
                    </p>
                    <p className="text-xs leading-snug text-gray-400">
                      {regla.detalle}
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 shrink-0 text-xs font-semibold ${regla.cumple ? 'text-amber-300' : 'text-gray-500'}`}
                  >
                    +{regla.puntos}
                  </span>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function Puntaje({ hechos, total }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white">
        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
        {hechos}{' '}
        <span className="font-normal text-gray-400">de {total} puntos</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700"
        role="progressbar"
        aria-label="Puntaje"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={hechos}
      >
        <div
          className="h-full rounded-full bg-amber-300 transition-all duration-300"
          style={{ width: `${total ? (hechos / total) * 100 : 0}%` }}
        />
      </div>
    </div>
  )
}

export default function PanelBuenasPracticas({ reglas, compacto = false }) {
  const [abierto, setAbierto] = useState(!compacto)
  if (!reglas?.length) return null
  const { hechos, total } = puntaje(reglas)
  const cumplidas = reglas.filter(r => r.cumple).length
  const todas = cumplidas === reglas.length

  // En el celular: un botoncito con el puntaje que abre la lista encima de los bloques.
  if (compacto)
    return (
      <>
        <button
          type="button"
          onClick={() => setAbierto(a => !a)}
          aria-expanded={abierto}
          aria-label={`Buenas prácticas: ${hechos} de ${total} puntos`}
          className={`absolute left-2 top-2 z-[61] flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white shadow-lg ${todas ? 'bg-arduino' : 'bg-gray-700'}`}
        >
          <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
          {hechos}
        </button>
        {abierto && (
          <div className="absolute inset-x-2 top-12 z-[61] max-h-[70%] overflow-y-auto rounded-[10px] border border-gray-700 bg-[#252526] p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                Buenas prácticas
              </h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar buenas prácticas"
                className="rounded p-1 text-gray-300 hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-3">
              <Puntaje hechos={hechos} total={total} />
            </div>
            <Lista reglas={reglas} />
          </div>
        )}
      </>
    )

  // En la computadora: una columna a la derecha de los bloques, que se puede achicar.
  if (!abierto)
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Mostrar buenas prácticas"
        className="flex h-full w-12 shrink-0 flex-col items-center gap-2 rounded-[10px] bg-[#252526] pt-3 text-white hover:bg-[#2d2d2e]"
      >
        <ListChecks
          className={`h-5 w-5 ${todas ? 'text-arduino-claro' : 'text-gray-300'}`}
        />
        <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
        <span className="text-sm font-semibold">{hechos}</span>
      </button>
    )

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-[10px] bg-[#252526]">
      <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-3">
        <div>
          <h2 className="text-base font-bold text-white">Buenas prácticas</h2>
          <p className="text-xs text-gray-400">
            {todas
              ? '¡Cumplís con todas!'
              : `Cumplís ${cumplidas} de ${reglas.length}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Achicar buenas prácticas"
          className="rounded p-1 text-gray-300 hover:bg-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 pb-3">
        <Puntaje hechos={hechos} total={total} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <Lista reglas={reglas} />
      </div>
    </aside>
  )
}
