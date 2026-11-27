import { useState } from 'react'
import { CodeIcon, CopyIcon } from '@radix-ui/react-icons'
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  ListChecks,
  Star,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { puntaje, TEMAS } from '@/lib/buenasPracticas'
import CodigoColoreado from './CodigoColoreado'

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

export default function PanelBuenasPracticas({
  reglas,
  compacto = false,
  codigo,
  onCopiar
}) {
  const [abierto, setAbierto] = useState(!compacto)
  // En la computadora la columna muestra las buenas prácticas o el código fuente.
  const [verCodigo, setVerCodigo] = useState(false)
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
      <div className="flex h-full w-12 shrink-0 flex-col items-center gap-1 rounded-[10px] bg-[#252526] pt-2 text-white">
        <button
          type="button"
          onClick={() => {
            setVerCodigo(false)
            setAbierto(true)
          }}
          aria-label="Mostrar buenas prácticas"
          className="flex w-10 flex-col items-center gap-1.5 rounded-md py-2 hover:bg-[#2d2d2e]"
        >
          <ListChecks
            className={`h-5 w-5 ${todas ? 'text-arduino-claro' : 'text-gray-300'}`}
          />
          <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
          <span className="text-sm font-semibold">{hechos}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setVerCodigo(true)
            setAbierto(true)
          }}
          aria-label="Mostrar código"
          className="flex w-10 justify-center rounded-md py-2 text-gray-300 hover:bg-[#2d2d2e]"
        >
          <CodeIcon className="h-5 w-5" />
        </button>
      </div>
    )

  return (
    <aside
      className={`flex h-full shrink-0 flex-col overflow-hidden rounded-[10px] bg-[#252526] transition-[width] duration-200 ${verCodigo ? 'w-[min(420px,38%)]' : 'w-64'}`}
    >
      {/* Arriba de todo: el botón para pasar al código (y copiarlo). */}
      <div className="flex items-center gap-1.5 px-3 pt-3">
        <Button
          onClick={() => setVerCodigo(v => !v)}
          aria-pressed={verCodigo}
          className="h-9 flex-1 bg-arduino text-white hover:bg-arduino-oscuro"
        >
          {verCodigo ? (
            <ListChecks className="mr-2 h-4 w-4" />
          ) : (
            <CodeIcon className="mr-2 h-4 w-4" />
          )}
          {verCodigo ? 'Ver buenas prácticas' : 'Mostrar código'}
        </Button>
        {verCodigo && (
          <Button
            size="icon"
            onClick={onCopiar}
            aria-label="Copiar código"
            title="Copiar código"
            className="h-9 w-9 shrink-0 bg-arduino-profundo text-white hover:bg-arduino-oscuro"
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
        )}
        <button
          type="button"
          onClick={() => setAbierto(false)}
          aria-label="Achicar el panel"
          className="rounded p-1.5 text-gray-300 hover:bg-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {verCodigo ? (
        <CodigoColoreado
          codigo={codigo}
          className="m-3 min-h-0 flex-1 rounded-md"
        />
      ) : (
        <>
          <div className="px-4 pb-2 pt-3">
            <h2 className="text-base font-bold text-white">Buenas prácticas</h2>
            <p className="text-xs text-gray-400">
              {todas
                ? '¡Cumplís con todas!'
                : `Cumplís ${cumplidas} de ${reglas.length}`}
            </p>
          </div>
          <div className="px-4 pb-3">
            <Puntaje hechos={hechos} total={total} />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <Lista reglas={reglas} />
          </div>
        </>
      )}
    </aside>
  )
}
