// Animación chica que acompaña la compilación y la subida: bloques de colores (como los
// de Blockly) que salen del programa y viajan por el cable USB hasta el Arduino, que
// parpadea su LED "L" cada vez que llega uno. Es solo SVG + CSS (sin librerías), escala
// con el ancho disponible y, con "reducir movimiento" activado, queda quieta.
import React from 'react'

// Colores de las categorías de bloques de GrIDIE (src/blocks/blocksArduino.js).
const COLORES_VIAJE = ['#0D47A1', '#E65100', '#1B5E20']
const COLORES_PILA = ['#6b3f75', '#0D47A1', '#B71C1C']

// Bloque estilo zelos: muesca arriba y saliente abajo para encastrar.
const BLOQUE =
  'M0,3 a3,3 0 0 1 3,-3 h3 l2,2 h6 l2,-2 h8 a3,3 0 0 1 3,3 v7 a3,3 0 0 1 -3,3 h-8 l-2,2 h-6 l-2,-2 h-3 a3,3 0 0 1 -3,-3 z'

const estilos = `
.envio-viaje {
  transform-box: fill-box;
  transform-origin: center;
  animation: envio-viajar 1.8s cubic-bezier(.45,0,.55,1) infinite both;
}
@keyframes envio-viajar {
  0%   { transform: translate(0px, 0px) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  45%  { transform: translate(55px, -9px) scale(.85); }
  85%  { opacity: 1; }
  100% { transform: translate(112px, 0px) scale(.45); opacity: 0; }
}
.envio-cable { animation: envio-flujo .6s linear infinite; }
@keyframes envio-flujo { to { stroke-dashoffset: -12; } }
.envio-led { animation: envio-led .6s ease-out infinite; }
@keyframes envio-led {
  0%, 55% { fill: #5d4037; }
  70%     { fill: #ffb300; }
  100%    { fill: #5d4037; }
}
.envio-pila { animation: envio-latido 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: left center; }
@keyframes envio-latido { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(1.5px); } }
@media (prefers-reduced-motion: reduce) {
  .envio-viaje, .envio-cable, .envio-led, .envio-pila { animation: none; }
  .envio-viaje { opacity: 1; }
  .envio-viaje-1 { transform: translate(28px, -6px) scale(.9); }
  .envio-viaje-2 { transform: translate(66px, -8px) scale(.75); }
  .envio-viaje-3 { transform: translate(100px, -3px) scale(.55); }
  .envio-led { fill: #ffb300; }
}
`

export default function AnimacionEnvio({ className = '' }) {
  return (
    <svg
      viewBox="0 0 240 84"
      className={className}
      role="img"
      aria-label="Tus bloques viajan hacia el Arduino"
    >
      <style>{estilos}</style>

      {/* El programa: una pila de bloques encastrados */}
      <g className="envio-pila">
        {COLORES_PILA.map((color, i) => (
          <path
            key={color}
            d={BLOQUE}
            transform={`translate(10 ${22 + i * 13})`}
            fill={color}
            stroke="rgba(255,255,255,.25)"
            strokeWidth=".8"
          />
        ))}
      </g>

      {/* Cable USB */}
      <path
        d="M44,42 C80,42 110,42 152,42"
        fill="none"
        stroke="#555"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        className="envio-cable"
        d="M44,42 C80,42 110,42 152,42"
        fill="none"
        stroke="#4DB6AC"
        strokeWidth="1.5"
        strokeDasharray="4 8"
        strokeLinecap="round"
        opacity=".8"
      />

      {/* Arduino Uno */}
      <g>
        <rect
          x="160"
          y="14"
          width="74"
          height="56"
          rx="5"
          fill="#00796B"
          stroke="#4DB6AC"
          strokeWidth="1"
        />
        {/* puerto USB y conector de alimentación */}
        <rect
          x="150"
          y="34"
          width="16"
          height="16"
          rx="1.5"
          fill="#b0bec5"
          stroke="#78909c"
          strokeWidth=".8"
        />
        <rect x="153" y="58" width="12" height="9" rx="1.5" fill="#263238" />
        {/* tiras de pines */}
        {Array.from({ length: 10 }, (_, i) => (
          <rect
            key={`a${i}`}
            x={182 + i * 4.8}
            y="17"
            width="3"
            height="4"
            fill="#212121"
          />
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <rect
            key={`b${i}`}
            x={190 + i * 4.8}
            y="63"
            width="3"
            height="4"
            fill="#212121"
          />
        ))}
        {/* microcontrolador */}
        <rect x="192" y="40" width="34" height="10" rx="1" fill="#212121" />
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={`c${i}`}
            x={194 + i * 4.6}
            y="37.5"
            width="1.6"
            height="2.5"
            fill="#9e9e9e"
          />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={`d${i}`}
            x={194 + i * 4.6}
            y="50"
            width="1.6"
            height="2.5"
            fill="#9e9e9e"
          />
        ))}
        {/* LEDs: ON (verde fijo) y L (parpadea cuando llega un bloque) */}
        <circle cx="176" cy="27" r="2" fill="#69f0ae" />
        <circle className="envio-led" cx="183" cy="27" r="2" fill="#5d4037" />
        <text
          x="172"
          y="34"
          fontSize="4"
          fill="#e0f2f1"
          fontFamily="sans-serif"
        >
          ON L
        </text>
      </g>

      {/* Bloques que viajan por el cable */}
      {COLORES_VIAJE.map((color, i) => (
        // El transform de CSS reemplaza al atributo, por eso la posición va en el <g>.
        <g key={color} transform="translate(30 35)">
          <path
            className={`envio-viaje envio-viaje-${i + 1}`}
            d={BLOQUE}
            fill={color}
            stroke="rgba(255,255,255,.35)"
            strokeWidth=".8"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
        </g>
      ))}
    </svg>
  )
}

/**
 * Tarjeta flotante con la animación, para cuando se sube el programa a la placa
 * (la subida no tiene una pantalla propia donde mostrarla).
 */
export function AvisoEnvio({ mensaje }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 flex-col items-center gap-1.5 rounded-xl border border-arduino/40 bg-[#252526]/95 px-4 pb-3 pt-2 text-center text-sm text-gray-200 shadow-xl"
    >
      <AnimacionEnvio className="w-full max-w-[240px]" />
      <span>{mensaje}</span>
    </div>
  )
}
