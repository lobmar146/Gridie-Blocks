import { nombreDelPin } from './escenas'

const CONECTOR_DIGITAL = [
  { texto: 'AREF' },
  { texto: 'GND', pin: 'GND' },
  ...[13, 12, 11, 10, 9, 8].map(n => ({ texto: `${n}`, pin: `D${n}` })),
  null,
  ...[7, 6, 5, 4, 3, 2].map(n => ({ texto: `${n}`, pin: `D${n}` })),
  { texto: 'TX 1' },
  { texto: 'RX 0' }
]

const CONECTOR_ABAJO = [
  { texto: 'IOREF' },
  { texto: 'RESET' },
  { texto: '3.3V', pin: '3V3' },
  { texto: '5V', pin: '5V' },
  { texto: 'GND', pin: 'GND' },
  { texto: 'GND', pin: 'GND' },
  { texto: 'Vin' },
  null,
  ...[0, 1, 2, 3, 4, 5].map(n => ({ texto: `A${n}`, pin: `A${n}` }))
]

const FilaDePines = ({
  pines,
  arriba,
  onElegir,
  marcado,
  resaltadoArrastre,
  deshabilitado
}) => {
  // Se separa en dos tiras negras (como los conectores reales de la placa).
  const indiceCorte = pines.indexOf(null)
  const grupos =
    indiceCorte >= 0
      ? [
          { items: pines.slice(0, indiceCorte), offset: 0 },
          { items: pines.slice(indiceCorte + 1), offset: indiceCorte + 1 }
        ]
      : [{ items: pines, offset: 0 }]

  const renderPin = (p, i) => {
    const activo = Boolean(p.pin)
    const socketKey = `${arriba ? 'top' : 'bot'}-${p.texto}-${i}`
    const estaMarcado = Boolean(marcado && p.pin === marcado)
    const estaEnArrastre = Boolean(
      resaltadoArrastre && resaltadoArrastre === socketKey
    )
    const compacto = p.texto.length >= 4
    return (
      <button
        key={socketKey}
        type="button"
        data-arduino-pin={activo ? p.pin : undefined}
        data-socket-key={activo ? socketKey : undefined}
        disabled={!activo || deshabilitado}
        onClick={() => onElegir(p.pin, socketKey)}
        title={activo ? nombreDelPin(p.pin) : 'No se usa en GrIDIE'}
        className={`group flex w-[18px] flex-col items-center rounded-[3px] py-0.5 leading-none transition-colors ${
          activo
            ? 'cursor-pointer text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300'
            : 'cursor-default text-white/45'
        } ${estaEnArrastre ? 'scale-110 bg-arduino-claro/90 text-gray-950 ring-2 ring-white' : estaMarcado ? 'animate-pulse bg-amber-400/90 text-gray-950 ring-2 ring-amber-300' : ''}`}
      >
        {arriba && (
          <span
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border ${
              estaEnArrastre
                ? 'border-white bg-arduino-profundo'
                : estaMarcado
                  ? 'border-amber-900 bg-gray-950'
                  : activo
                    ? 'border-gray-500 bg-[#0d0f12] group-hover:border-white'
                    : 'border-gray-700 bg-[#171a1f]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-[1px] bg-black/90 ring-1 ring-gray-600/60" />
          </span>
        )}
        <span
          className={`mt-0.5 flex h-3 items-center justify-center font-mono font-semibold tracking-tighter ${
            compacto ? 'text-[6.5px]' : 'text-[8px]'
          }`}
        >
          {p.texto}
        </span>
        {!arriba && (
          <span
            className={`mt-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-[2px] border ${
              estaEnArrastre
                ? 'border-white bg-arduino-profundo'
                : estaMarcado
                  ? 'border-amber-900 bg-gray-950'
                  : activo
                    ? 'border-gray-500 bg-[#0d0f12] group-hover:border-white'
                    : 'border-gray-700 bg-[#171a1f]'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-[1px] bg-black/90 ring-1 ring-gray-600/60" />
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      {grupos.map((grupo, gi) => (
        <div
          key={gi}
          className="flex gap-[1px] rounded-[3px] border border-black/70 bg-[#171a1e]/95 px-[3px] py-[2px] shadow-sm"
        >
          {grupo.items.map((p, idx) => renderPin(p, grupo.offset + idx))}
        </div>
      ))}
    </div>
  )
}

/** Dibujo interactivo de una placa Arduino Uno R3 para elegir el pin donde va el cable. */
const ArduinoUnoInteractivo = ({
  onElegir,
  marcado,
  resaltadoArrastre,
  deshabilitado
}) => {
  return (
    <div className="relative inline-block h-[212px] w-[396px] select-none">
      {/* Ilustración vectorial de la placa Arduino Uno R3 */}
      <svg
        viewBox="0 0 396 212"
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pcbTeal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00979d" />
            <stop offset="100%" stopColor="#00767d" />
          </linearGradient>
          <linearGradient id="usbMetal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <linearGradient id="capMetal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Silueta característica del Arduino Uno con muesca derecha */}
        <path
          d="M 18 6 L 372 6 Q 376 6 376 10 L 376 24 L 389 37 L 389 190 L 376 200 L 376 202 Q 376 206 372 206 L 18 206 Q 14 206 14 202 L 14 10 Q 14 6 18 6 Z"
          fill="url(#pcbTeal)"
          stroke="#0ea5ad"
          strokeWidth="1.2"
        />

        {/* Agujeros de montaje */}
        {[
          [47, 18],
          [368, 52],
          [368, 192],
          [68, 192]
        ].map(([cx, cy], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r="5.5" fill="#d4af37" opacity="0.85" />
            <circle cx={cx} cy={cy} r="3" fill="#1e293b" />
          </g>
        ))}

        {/* Puerto USB Tipo-B (arriba a la izquierda, sobresale de la placa) */}
        <g>
          <rect
            x="2"
            y="38"
            width="48"
            height="42"
            rx="2.5"
            fill="url(#usbMetal)"
            stroke="#475569"
            strokeWidth="1"
          />
          <rect
            x="6"
            y="44"
            width="38"
            height="30"
            rx="1.5"
            fill="#cbd5e1"
            stroke="#64748b"
            strokeWidth="0.7"
          />
          <line
            x1="14"
            y1="38"
            x2="14"
            y2="80"
            stroke="#64748b"
            strokeWidth="0.8"
          />
        </g>

        {/* Botón RESET arriba a la izquierda */}
        <g>
          <rect
            x="20"
            y="11"
            width="15"
            height="13"
            rx="2"
            fill="#cbd5e1"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <circle cx="27.5" cy="17.5" r="3.8" fill="#e11d48" />
          <text
            x="27.5"
            y="30"
            textAnchor="middle"
            fill="#ffffffcc"
            fontSize="5.2"
            fontFamily="monospace"
            fontWeight="bold"
          >
            RESET
          </text>
        </g>

        {/* Conector de alimentación Barrel Jack (abajo a la izquierda) */}
        <g>
          <rect
            x="2"
            y="148"
            width="52"
            height="36"
            rx="2.5"
            fill="#17191d"
            stroke="#090a0c"
            strokeWidth="1"
          />
          <rect x="2" y="153" width="8" height="26" fill="#27272a" />
          <circle cx="14" cy="166" r="6" fill="#090a0c" stroke="#3f3f46" />
          <circle cx="14" cy="166" r="2" fill="#a1a1aa" />
        </g>

        {/* Regulador de tensión + 2 capacitores electrolíticos */}
        <g>
          <rect x="58" y="122" width="16" height="10" rx="1" fill="#18181b" />
          <rect x="61" y="118" width="10" height="4" fill="#cbd5e1" />
          <circle
            cx="72"
            cy="144"
            r="8.5"
            fill="url(#capMetal)"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <path d="M 65 140 A 8.5 8.5 0 0 1 79 140 Z" fill="#1e293b" />
          <circle
            cx="94"
            cy="144"
            r="8.5"
            fill="url(#capMetal)"
            stroke="#475569"
            strokeWidth="0.8"
          />
          <path d="M 87 140 A 8.5 8.5 0 0 1 101 140 Z" fill="#1e293b" />
        </g>

        {/* Chip USB ATmega16U2 + Cristal 16 MHz */}
        <g>
          <rect
            x="66"
            y="54"
            width="18"
            height="18"
            rx="1.5"
            fill="#18181b"
            stroke="#3f3f46"
            strokeWidth="0.8"
          />
          <circle cx="70" cy="58" r="1.2" fill="#94a3b8" />
          {/* Cristal oscilador */}
          <rect
            x="92"
            y="78"
            width="24"
            height="10"
            rx="5"
            fill="url(#usbMetal)"
            stroke="#64748b"
            strokeWidth="0.8"
          />
          <text
            x="104"
            y="85"
            textAnchor="middle"
            fill="#334155"
            fontSize="4.8"
            fontFamily="monospace"
            fontWeight="bold"
          >
            16.000
          </text>
        </g>

        {/* LEDs de estado (L, TX, RX, ON) */}
        <g fontFamily="monospace" fontSize="6" fill="#ffffffcc" fontWeight="bold">
          {/* L (pin 13) */}
          <rect x="128" y="61" width="6" height="4" rx="0.8" fill="#fbbf24" />
          <text x="122" y="65">L</text>
          {/* TX / RX */}
          <rect x="128" y="75" width="6" height="4" rx="0.8" fill="#475569" />
          <text x="117" y="79">TX</text>
          <rect x="128" y="84" width="6" height="4" rx="0.8" fill="#475569" />
          <text x="117" y="88">RX</text>
          {/* ON */}
          <circle cx="332" cy="79" r="4" fill="#22c55e" opacity="0.28" />
          <rect x="329" y="77" width="6" height="4" rx="0.8" fill="#4ade80" />
          <text x="326" y="74">ON</text>
        </g>

        {/* Marca ARDUINO UNO en el centro */}
        <g>
          {/* Símbolo infinito estilo Arduino */}
          <g
            transform="translate(274 72)"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.4"
            opacity="0.92"
          >
            <circle cx="7" cy="7" r="6" />
            <circle cx="19" cy="7" r="6" />
            <line x1="5" y1="7" x2="9" y2="7" strokeWidth="1.5" />
            <line x1="17" y1="7" x2="21" y2="7" strokeWidth="1.5" />
            <line x1="19" y1="5" x2="19" y2="9" strokeWidth="1.5" />
          </g>
          <text
            x="170"
            y="84"
            fill="#ffffff"
            fontSize="16"
            fontFamily="sans-serif"
            fontWeight="800"
            letterSpacing="1.4"
          >
            ARDUINO
          </text>
          <rect
            x="244"
            y="90"
            width="42"
            height="14"
            rx="2"
            fill="#ffffff"
            opacity="0.92"
          />
          <text
            x="265"
            y="100.5"
            textAnchor="middle"
            fill="#00878f"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="900"
            letterSpacing="1"
          >
            UNO
          </text>
          <text
            x="230"
            y="53"
            textAnchor="middle"
            fill="#ffffffaa"
            fontSize="6"
            fontFamily="sans-serif"
            fontWeight="600"
            letterSpacing="1.2"
          >
            DIGITAL (PWM~)
          </text>
        </g>

        {/* Microcontrolador ATmega328P DIP-28 con sus 28 patas */}
        <g transform="translate(154 114)">
          {Array.from({ length: 14 }, (_, idx) => {
            const px = 8 + idx * 10
            return (
              <g key={idx}>
                <rect x={px} y="0" width="5" height="5" fill="#cbd5e1" />
                <rect x={px} y="31" width="5" height="5" fill="#cbd5e1" />
              </g>
            )
          })}
          <rect
            x="2"
            y="4"
            width="142"
            height="28"
            rx="2"
            fill="#181a1f"
            stroke="#334155"
            strokeWidth="0.9"
          />
          <path d="M 2 13 A 5 5 0 0 1 2 23 Z" fill="#0f172a" />
          <text
            x="74"
            y="20.5"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="7"
            fontFamily="monospace"
            letterSpacing="0.8"
          >
            ATMEGA328P
          </text>
        </g>

        {/* Conector ICSP (6 pines) a la derecha */}
        <g transform="translate(362 110)">
          <rect
            x="0"
            y="0"
            width="18"
            height="26"
            rx="1.5"
            fill="#171a1e"
            stroke="#090a0c"
            strokeWidth="0.8"
          />
          {[5, 13].map(cx =>
            [6, 13, 20].map(cy => (
              <circle
                key={`${cx}-${cy}`}
                cx={cx}
                cy={cy}
                r="2"
                fill="#eab308"
              />
            ))
          )}
          <text
            x="9"
            y="33"
            textAnchor="middle"
            fill="#ffffffaa"
            fontSize="5.2"
            fontFamily="monospace"
          >
            ICSP
          </text>
        </g>

        {/* Etiquetas POWER y ANALOG IN */}
        <text
          x="164"
          y="163"
          textAnchor="middle"
          fill="#ffffffaa"
          fontSize="6"
          fontFamily="sans-serif"
          fontWeight="600"
          letterSpacing="1"
        >
          POWER
        </text>
        <text
          x="294"
          y="163"
          textAnchor="middle"
          fill="#ffffffaa"
          fontSize="6"
          fontFamily="sans-serif"
          fontWeight="600"
          letterSpacing="1"
        >
          ANALOG IN
        </text>
      </svg>

      {/* Conectores de pines interactivos arriba (DIGITAL) */}
      <div className="absolute right-[18px] top-[8px]">
        <FilaDePines
          pines={CONECTOR_DIGITAL}
          arriba
          onElegir={onElegir}
          marcado={marcado}
          resaltadoArrastre={resaltadoArrastre}
          deshabilitado={deshabilitado}
        />
      </div>

      {/* Conectores de pines interactivos abajo (POWER + ANALOG IN) */}
      <div className="absolute bottom-[9px] right-[44px]">
        <FilaDePines
          pines={CONECTOR_ABAJO}
          arriba={false}
          onElegir={onElegir}
          marcado={marcado}
          resaltadoArrastre={resaltadoArrastre}
          deshabilitado={deshabilitado}
        />
      </div>
    </div>
  )
}

export default ArduinoUnoInteractivo
