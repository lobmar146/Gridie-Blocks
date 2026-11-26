const ETIQUETA_PIN = {
  anode: '+ Larga',
  cathode: '− Corta',
  SIGNAL: 'Señal'
}

function textoTerminal(cable) {
  return ETIQUETA_PIN[cable.pin] ?? cable.pin
}

function SvgComponente({ tipo }) {
  switch (tipo) {
    case 'led':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          {/* Pata larga (+ izquierda) y pata corta (− derecha) */}
          <path
            d="M 46 34 L 46 60"
            stroke="#cbd5e1"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 74 34 L 74 51"
            stroke="#94a3b8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Cúpula del LED rojo */}
          <path
            d="M 42 32 L 42 18 A 18 18 0 0 1 78 18 L 78 32 Z"
            fill="#ef4444"
            stroke="#991b1b"
            strokeWidth="1.2"
          />
          <ellipse cx="53" cy="14" rx="4" ry="7" fill="#fca5a5" opacity="0.55" />
          <rect
            x="38"
            y="30"
            width="44"
            height="6"
            rx="1.5"
            fill="#dc2626"
            stroke="#7f1d1d"
            strokeWidth="1"
          />
          <text
            x="34"
            y="55"
            fill="#fca5a5"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            +
          </text>
          <text
            x="82"
            y="50"
            fill="#cbd5e1"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            −
          </text>
        </svg>
      )

    case 'semaforo':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="22"
            y="8"
            width="76"
            height="42"
            rx="6"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1.4"
          />
          <circle cx="40" cy="29" r="9.5" fill="#ef4444" stroke="#7f1d1d" />
          <circle cx="60" cy="29" r="9.5" fill="#eab308" stroke="#713f12" />
          <circle cx="80" cy="29" r="9.5" fill="#22c55e" stroke="#14532d" />
          <rect x="34" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="51" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="68" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="85" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )

    case 'servo':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          {/* Cuerpo azul SG90 */}
          <rect
            x="24"
            y="20"
            width="62"
            height="34"
            rx="3"
            fill="#2563eb"
            stroke="#1e40af"
            strokeWidth="1.2"
          />
          <rect x="16" y="27" width="78" height="6" rx="1.5" fill="#1d4ed8" />
          {/* Engranaje y brazo blanco */}
          <circle cx="66" cy="18" r="10" fill="#3b82f6" />
          <rect
            x="56"
            y="7"
            width="40"
            height="8"
            rx="4"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <circle cx="66" cy="11" r="2.5" fill="#64748b" />
          {/* Cable triple */}
          <path d="M 35 54 L 35 61" stroke="#f28c1c" strokeWidth="3" />
          <path d="M 41 54 L 41 61" stroke="#d12b2b" strokeWidth="3" />
          <path d="M 47 54 L 47 61" stroke="#6b3a1a" strokeWidth="3" />
        </svg>
      )

    case 'pir':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="24"
            y="28"
            width="72"
            height="22"
            rx="3"
            fill="#15803d"
            stroke="#166534"
            strokeWidth="1.2"
          />
          <path
            d="M 38 28 A 22 20 0 0 1 82 28 Z"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />
          <path
            d="M 46 28 A 14 13 0 0 1 74 28"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="0.9"
          />
          <rect x="44" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="59" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="74" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )

    case 'obstaculos':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="26"
            y="22"
            width="68"
            height="28"
            rx="3"
            fill="#1d4ed8"
            stroke="#1e3a8a"
            strokeWidth="1.2"
          />
          {/* LED emisor (claro) y receptor (negro) */}
          <rect
            x="40"
            y="7"
            width="10"
            height="16"
            rx="5"
            fill="#e2e8f0"
            stroke="#94a3b8"
          />
          <rect
            x="70"
            y="7"
            width="10"
            height="16"
            rx="5"
            fill="#0f172a"
            stroke="#334155"
          />
          {/* Potenciómetro azul */}
          <rect
            x="53"
            y="28"
            width="14"
            height="14"
            rx="1.5"
            fill="#0284c7"
            stroke="#0369a1"
          />
          <circle cx="60" cy="35" r="4" fill="#e2e8f0" />
          <rect x="44" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="59" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="74" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )

    case 'fuego':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="26"
            y="22"
            width="68"
            height="28"
            rx="3"
            fill="#b91c1c"
            stroke="#7f1d1d"
            strokeWidth="1.2"
          />
          {/* Fotodiodo negro sensor de llama */}
          <rect
            x="55"
            y="7"
            width="10"
            height="16"
            rx="5"
            fill="#0f172a"
            stroke="#334155"
          />
          <rect x="40" y="29" width="12" height="12" rx="1.5" fill="#0284c7" />
          <circle cx="46" cy="35" r="3.5" fill="#e2e8f0" />
          <rect x="44" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="59" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="74" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )

    case 'ultrasonico':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="16"
            y="10"
            width="88"
            height="40"
            rx="3"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="1.2"
          />
          <circle
            cx="38"
            cy="30"
            r="14"
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="1.4"
          />
          <circle cx="38" cy="30" r="9" fill="#334155" />
          <circle
            cx="82"
            cy="30"
            r="14"
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="1.4"
          />
          <circle cx="82" cy="30" r="9" fill="#334155" />
          <rect x="36" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="51" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="66" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="81" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )

    case 'parlante':
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <circle
            cx="60"
            cy="28"
            r="22"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="1.5"
          />
          <circle cx="60" cy="28" r="7" fill="#09090b" stroke="#52525b" />
          <text
            x="43"
            y="24"
            fill="#fca5a5"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            +
          </text>
          <path d="M 48 48 L 48 60" stroke="#ef4444" strokeWidth="3" />
          <path d="M 72 48 L 72 60" stroke="#94a3b8" strokeWidth="3" />
        </svg>
      )

    default:
      // Sensor de humedad o analógico
      return (
        <svg viewBox="0 0 120 62" className="h-14 w-28 shrink-0">
          <rect
            x="24"
            y="18"
            width="72"
            height="32"
            rx="3"
            fill="#0284c7"
            stroke="#0369a1"
            strokeWidth="1.2"
          />
          {/* Puntas tipo horquilla del sensor */}
          <rect x="38" y="4" width="12" height="15" rx="2" fill="#eab308" />
          <rect x="70" y="4" width="12" height="15" rx="2" fill="#eab308" />
          <rect x="48" y="25" width="24" height="14" rx="1.5" fill="#0f172a" />
          <rect x="44" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="59" y="50" width="3" height="10" fill="#cbd5e1" />
          <rect x="74" y="50" width="3" height="10" fill="#cbd5e1" />
        </svg>
      )
  }
}

/**
 * Muestra el componente actual arriba del Arduino Uno con sus terminales interactivos
 * para arrastrar el cable hasta el pin correspondiente.
 */
const DibujoComponente = ({
  componente,
  nombreComponente,
  cablesComponente,
  cableActualId,
  conexiones,
  arrastrandoId,
  onIniciarArrastre
}) => {
  return (
    <div className="flex w-[396px] flex-col items-center rounded-lg border border-gray-700 bg-gray-800/80 px-3 pt-2 pb-2.5 shadow-inner">
      <div className="mb-1 flex w-full items-center justify-between text-[11px]">
        <span className="font-semibold uppercase tracking-wide text-gray-300">
          {nombreComponente}
        </span>
        <span className="text-gray-400">Arrastrá el conector al Arduino</span>
      </div>

      <SvgComponente tipo={componente} />

      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        {cablesComponente.map(cable => {
          const conectado = conexiones[cable.id] === cable.esperado
          const esActual = cable.id === cableActualId
          const arrastrando = arrastrandoId === cable.id
          return (
            <button
              key={cable.id}
              type="button"
              data-terminal-id={cable.id}
              disabled={!esActual}
              onPointerDown={
                esActual ? e => onIniciarArrastre(cable, e) : undefined
              }
              title={
                esActual
                  ? `Arrastrá ${cable.etiqueta} hasta el Arduino`
                  : conectado
                    ? `${cable.etiqueta} conectado`
                    : cable.etiqueta
              }
              className={`flex touch-none select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                esActual
                  ? `cursor-grab border-amber-400 bg-gray-900 text-white shadow-md ring-2 ring-amber-400/50 active:cursor-grabbing ${arrastrando ? 'scale-105 ring-arduino-claro' : 'animate-pulse'}`
                  : conectado
                    ? 'cursor-default border-arduino/70 bg-arduino-profundo/60 text-arduino-suave'
                    : 'cursor-default border-gray-700 bg-gray-900/50 text-gray-500'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/40"
                style={{ background: cable.color }}
              />
              <span>{textoTerminal(cable)}</span>
              {conectado && <span className="text-arduino-claro">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DibujoComponente
