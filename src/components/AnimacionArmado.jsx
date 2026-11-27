// Animación chica para mientras se cargan las piezas y la escena 3D del simulador: las
// piezas (LED, servo, sensor) caen junto al Arduino, se conecta un cable a cada una y el
// LED se prende. Después se desarma y vuelve a empezar. Solo SVG + CSS, escala con el
// ancho disponible y, con "reducir movimiento" activado, queda quieta y armada.
import React from 'react'

const CICLO = 3.6 // segundos
const CABLES = ['#E65100', '#FDD835', '#29B6F6']

// Una regla de keyframes por pieza, para que caigan una detrás de otra y se desarmen juntas.
const keyframes = [0, 1, 2]
  .map(i => {
    const cae = 4 + i * 22
    const apoya = cae + 9
    const conecta = apoya + 10
    return `
@keyframes armado-pieza-${i} {
  0%, ${cae}% { transform: translateY(-26px); opacity: 0; }
  ${cae + 4}% { opacity: 1; }
  ${apoya}% { transform: translateY(0); }
  ${apoya + 3}% { transform: translateY(-2px); }
  ${apoya + 6}%, 86% { transform: translateY(0); opacity: 1; }
  96%, 100% { transform: translateY(0); opacity: 0; }
}
@keyframes armado-cable-${i} {
  0%, ${apoya}% { stroke-dashoffset: 1; opacity: 0; }
  ${apoya + 1}% { stroke-dashoffset: .95; opacity: 1; }
  ${conecta}%, 86% { stroke-dashoffset: 0; opacity: 1; }
  96%, 100% { stroke-dashoffset: 0; opacity: 0; }
}`
  })
  .join('')

const estilos = `
${keyframes}
.armado-pieza-0 { animation: armado-pieza-0 ${CICLO}s ease-out infinite both; }
.armado-pieza-1 { animation: armado-pieza-1 ${CICLO}s ease-out infinite both; }
.armado-pieza-2 { animation: armado-pieza-2 ${CICLO}s ease-out infinite both; }
.armado-cable-0 { animation: armado-cable-0 ${CICLO}s ease-in-out infinite both; }
.armado-cable-1 { animation: armado-cable-1 ${CICLO}s ease-in-out infinite both; }
.armado-cable-2 { animation: armado-cable-2 ${CICLO}s ease-in-out infinite both; }
.armado-luz { animation: armado-luz ${CICLO}s ease-out infinite both; }
@keyframes armado-luz {
  0%, 24% { opacity: 0; }
  28%, 86% { opacity: 1; }
  96%, 100% { opacity: 0; }
}
.armado-brazo { transform-box: fill-box; transform-origin: 2px 2px; animation: armado-brazo ${CICLO}s ease-in-out infinite both; }
@keyframes armado-brazo {
  0%, 48% { transform: rotate(0deg); }
  58% { transform: rotate(-55deg); }
  68%, 100% { transform: rotate(0deg); }
}
.armado-onda { animation: armado-onda ${CICLO / 4}s ease-out infinite; }
@keyframes armado-onda { 0% { opacity: .9; } 100% { opacity: .1; } }
@media (prefers-reduced-motion: reduce) {
  .armado-pieza-0, .armado-pieza-1, .armado-pieza-2,
  .armado-cable-0, .armado-cable-1, .armado-cable-2,
  .armado-luz, .armado-brazo, .armado-onda { animation: none; opacity: 1; stroke-dashoffset: 0; }
}
`

// Cables: desde la tira de pines del Arduino hasta cada pieza.
const RECORRIDOS = [
  'M70,18 C70,4 118,2 124,30',
  'M80,18 C84,8 156,10 160,40',
  'M60,18 C60,-4 200,-4 204,26'
]

export default function AnimacionArmado({ className = '' }) {
  return (
    <svg
      viewBox="0 0 240 84"
      className={className}
      role="img"
      aria-label="Armando el circuito con sus piezas"
    >
      <style>{estilos}</style>

      {/* Arduino Uno */}
      <g>
        <rect
          x="14"
          y="16"
          width="74"
          height="56"
          rx="5"
          fill="#00796B"
          stroke="#4DB6AC"
          strokeWidth="1"
        />
        <rect
          x="6"
          y="36"
          width="14"
          height="15"
          rx="1.5"
          fill="#b0bec5"
          stroke="#78909c"
          strokeWidth=".8"
        />
        <rect x="8" y="59" width="11" height="9" rx="1.5" fill="#263238" />
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={`a${i}`}
            x={38 + i * 4.8}
            y="19"
            width="3"
            height="4"
            fill="#212121"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={`b${i}`}
            x={46 + i * 4.8}
            y="65"
            width="3"
            height="4"
            fill="#212121"
          />
        ))}
        <rect x="46" y="42" width="34" height="10" rx="1" fill="#212121" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={`c${i}`}
            x={48 + i * 4.6}
            y="39.5"
            width="1.6"
            height="2.5"
            fill="#9e9e9e"
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={`d${i}`}
            x={48 + i * 4.6}
            y="52"
            width="1.6"
            height="2.5"
            fill="#9e9e9e"
          />
        ))}
        <circle cx="30" cy="29" r="2" fill="#69f0ae" />
      </g>

      {/* Cables (se dibujan cuando la pieza ya está apoyada) */}
      {RECORRIDOS.map((d, i) => (
        <path
          key={d}
          className={`armado-cable-${i}`}
          d={d}
          pathLength="1"
          strokeDasharray="1 1"
          fill="none"
          stroke={CABLES[i]}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ))}

      {/* LED rojo, que se prende cuando lo conectan */}
      <g className="armado-pieza-0">
        <line
          x1="121"
          y1="44"
          x2="121"
          y2="62"
          stroke="#bdbdbd"
          strokeWidth="1.2"
        />
        <line
          x1="127"
          y1="44"
          x2="127"
          y2="58"
          stroke="#bdbdbd"
          strokeWidth="1.2"
        />
        <circle
          className="armado-luz"
          cx="124"
          cy="36"
          r="11"
          fill="#ff5252"
          opacity=".25"
        />
        <path
          d="M117,45 v-9 a7,7 0 0 1 14,0 v9 z"
          fill="#c62828"
          stroke="#ef9a9a"
          strokeWidth=".8"
        />
        <path
          className="armado-luz"
          d="M117,45 v-9 a7,7 0 0 1 14,0 v9 z"
          fill="#ff5252"
        />
        <rect x="115.5" y="44" width="17" height="2.5" rx="1" fill="#b71c1c" />
      </g>

      {/* Servo azul con su brazo */}
      <g className="armado-pieza-1">
        <rect
          x="146"
          y="40"
          width="28"
          height="18"
          rx="2"
          fill="#1565C0"
          stroke="#90caf9"
          strokeWidth=".8"
        />
        <rect x="142" y="45" width="36" height="4" rx="1" fill="#0D47A1" />
        <circle cx="166" cy="45" r="4" fill="#e0e0e0" />
        <rect
          className="armado-brazo"
          x="164"
          y="43"
          width="16"
          height="4"
          rx="2"
          fill="#fafafa"
        />
      </g>

      {/* Sensor ultrasónico */}
      <g className="armado-pieza-2">
        <rect
          x="186"
          y="26"
          width="38"
          height="18"
          rx="2"
          fill="#1e88e5"
          stroke="#90caf9"
          strokeWidth=".8"
        />
        <circle cx="196" cy="35" r="6.5" fill="#cfd8dc" stroke="#78909c" />
        <circle cx="214" cy="35" r="6.5" fill="#cfd8dc" stroke="#78909c" />
        <circle cx="196" cy="35" r="3" fill="#546e7a" />
        <circle cx="214" cy="35" r="3" fill="#546e7a" />
        <g
          className="armado-onda"
          fill="none"
          stroke="#80CBC4"
          strokeWidth="1"
          strokeLinecap="round"
        >
          <path d="M200,52 q5,4 10,0" />
          <path d="M197,57 q8,6 16,0" />
        </g>
      </g>
    </svg>
  )
}
