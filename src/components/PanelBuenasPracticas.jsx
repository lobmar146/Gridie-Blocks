import { useState } from 'react'
import { CheckCircle2, ChevronRight, Circle, ListChecks, X } from 'lucide-react'

/** La lista de buenas prácticas; se van tildando a medida que el alumno arma el programa. */
function Lista({ reglas }) {
  return (
    <ul className="flex flex-col gap-3">
      {reglas.map(regla => (
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
          <div className="min-w-0">
            <p
              className={`text-sm font-semibold leading-snug ${regla.cumple ? 'text-arduino-suave' : 'text-gray-100'}`}
            >
              {regla.titulo}
            </p>
            <p className="text-xs leading-snug text-gray-400">
              {regla.detalle}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function Progreso({ hechas, total }) {
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={hechas}
    >
      <div
        className="h-full rounded-full bg-arduino-claro transition-all duration-300"
        style={{ width: `${total ? (hechas / total) * 100 : 0}%` }}
      />
    </div>
  )
}

export default function PanelBuenasPracticas({ reglas, compacto = false }) {
  const [abierto, setAbierto] = useState(!compacto)
  if (!reglas?.length) return null
  const hechas = reglas.filter(r => r.cumple).length
  const total = reglas.length
  const todas = hechas === total

  // En el celular: un botoncito con el puntaje que abre la lista encima de los bloques.
  if (compacto)
    return (
      <>
        <button
          type="button"
          onClick={() => setAbierto(a => !a)}
          aria-expanded={abierto}
          className={`absolute left-2 top-2 z-[61] flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold text-white shadow-lg ${todas ? 'bg-arduino' : 'bg-gray-700'}`}
        >
          <ListChecks className="h-4 w-4" />
          {hechas}/{total}
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
              <Progreso hechas={hechas} total={total} />
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
        <span className="text-sm font-semibold">
          {hechas}/{total}
        </span>
      </button>
    )

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col overflow-hidden rounded-[10px] bg-[#252526]">
      <div className="flex items-start justify-between gap-2 px-4 pb-2 pt-3">
        <div>
          <h2 className="text-base font-bold text-white">Buenas prácticas</h2>
          <p className="text-xs text-gray-400">
            {todas ? '¡Cumplís con todas!' : `Cumplís ${hechas} de ${total}`}
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
        <Progreso hechas={hechas} total={total} />
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <Lista reglas={reglas} />
      </div>
    </aside>
  )
}
