import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import ArduinoUnoInteractivo from './ArduinoUnoInteractivo'
import DibujoComponente from './DibujoComponente'

function trazarCurvaCable(desde, hasta) {
  const dy = Math.max(24, Math.abs(hasta.y - desde.y) * 0.55)
  const c1y = desde.y + dy
  const c2y = hasta.y - (hasta.y >= desde.y ? dy : -dy)
  return `M ${desde.x} ${desde.y} C ${desde.x} ${c1y}, ${hasta.x} ${c2y}, ${hasta.x} ${hasta.y}`
}

function encontrarPinBajoPuntero(contenedor, clientX, clientY) {
  if (!contenedor) return null
  const botones = contenedor.querySelectorAll('[data-arduino-pin]')
  let mejor = null
  let mejorDist = Infinity
  const margen = 6
  for (const btn of botones) {
    const r = btn.getBoundingClientRect()
    if (
      clientX >= r.left - margen &&
      clientX <= r.right + margen &&
      clientY >= r.top - margen &&
      clientY <= r.bottom + margen
    ) {
      const cx = (r.left + r.right) / 2
      const cy = (r.top + r.bottom) / 2
      const dist = (clientX - cx) ** 2 + (clientY - cy) ** 2
      if (dist < mejorDist) {
        mejorDist = dist
        mejor = {
          pin: btn.getAttribute('data-arduino-pin'),
          socketKey: btn.getAttribute('data-socket-key')
        }
      }
    }
  }
  return mejor
}

/** Los cables de un dispositivo dibujados del conector al pin del Arduino. */
const CablesDibujados = ({ cables, className }) => (
  <svg
    className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
    aria-hidden="true"
  >
    {cables.map(c => {
      const d = trazarCurvaCable(c.desde, c.hasta)
      const esOscuro = /^#[0-3]/i.test(c.color)
      return (
        <g key={c.id}>
          <path
            d={d}
            fill="none"
            stroke={esOscuro ? '#475569' : '#090b0f'}
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.7"
          />
          <path
            d={d}
            fill="none"
            stroke={c.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle
            cx={c.hasta.x}
            cy={c.hasta.y}
            r="3.5"
            fill={c.color}
            stroke={esOscuro ? '#94a3b8' : '#090b0f'}
            strokeWidth="1.5"
          />
          <circle
            cx={c.desde.x}
            cy={c.desde.y}
            r="3"
            fill={c.color}
            stroke={esOscuro ? '#94a3b8' : '#090b0f'}
            strokeWidth="1.5"
          />
        </g>
      )
    })}
  </svg>
)

/**
 * Tablero interactivo de conexión: arriba los dispositivos que ya se conectaron (en chico,
 * con sus cables puestos), después el dispositivo actual y abajo el Arduino Uno, para
 * arrastrar cada cable hasta su pin (o hacer clic directo en el pin). Sin `actual` (todo
 * conectado) muestra el circuito completo.
 */
const TableroDeConexion = ({
  cablesComponente,
  todosLosCables = cablesComponente,
  actual,
  conexiones,
  marcado,
  onElegir,
  escala = 1
}) => {
  const stageRef = useRef(null)
  const [enchufes, setEnchufes] = useState({})
  const [arrastre, setArrastre] = useState(null)
  const [puntos, setPuntos] = useState({
    terminales: {},
    sockets: {},
    pinASocket: {}
  })

  // Limpia el mapeo de agujeros elegidos si el alumno reinicia las conexiones.
  useEffect(() => {
    if (Object.keys(conexiones).length === 0) setEnchufes({})
  }, [conexiones])

  const medirPuntos = useCallback(() => {
    const root = stageRef.current
    if (!root) return
    const base = root.getBoundingClientRect()
    const terminales = {}
    for (const el of root.querySelectorAll('[data-terminal-id]')) {
      const r = el.getBoundingClientRect()
      terminales[el.getAttribute('data-terminal-id')] = {
        x: (r.left - base.left + r.width / 2) / escala,
        y: (r.top - base.top + r.height) / escala
      }
    }
    const sockets = {}
    const pinASocket = {}
    for (const el of root.querySelectorAll('[data-socket-key]')) {
      const key = el.getAttribute('data-socket-key')
      const pin = el.getAttribute('data-arduino-pin')
      const r = el.getBoundingClientRect()
      sockets[key] = {
        x: (r.left - base.left + r.width / 2) / escala,
        y: (r.top - base.top + r.height / 2) / escala
      }
      if (pin && !pinASocket[pin]) pinASocket[pin] = key
    }
    setPuntos({ terminales, sockets, pinASocket })
  }, [escala])

  useLayoutEffect(() => {
    medirPuntos()
    const root = stageRef.current
    if (!root || typeof ResizeObserver === 'undefined') return undefined
    const obs = new ResizeObserver(medirPuntos)
    obs.observe(root)
    return () => obs.disconnect()
  }, [medirPuntos, actual?.componente, todosLosCables.length])

  const elegirConSocket = useCallback(
    (pin, socketKey) => {
      if (actual && pin === actual.esperado && socketKey) {
        setEnchufes(prev => ({ ...prev, [actual.id]: socketKey }))
      }
      onElegir(pin)
    },
    [actual, onElegir]
  )

  const iniciarArrastre = (cable, evento) => {
    if (evento.button !== 0 && evento.pointerType === 'mouse') return
    evento.preventDefault()
    const root = stageRef.current
    if (!root) return
    const base = root.getBoundingClientRect()
    const destino = encontrarPinBajoPuntero(
      root,
      evento.clientX,
      evento.clientY
    )
    setArrastre({
      cable,
      x: (evento.clientX - base.left) / escala,
      y: (evento.clientY - base.top) / escala,
      hoverPin: destino?.pin ?? null,
      hoverSocket: destino?.socketKey ?? null
    })
  }

  const estaArrastrando = Boolean(arrastre)
  useEffect(() => {
    if (!estaArrastrando) return undefined
    const mover = evento => {
      const root = stageRef.current
      if (!root) return
      const base = root.getBoundingClientRect()
      const destino = encontrarPinBajoPuntero(
        root,
        evento.clientX,
        evento.clientY
      )
      setArrastre(prev =>
        prev
          ? {
              ...prev,
              x: (evento.clientX - base.left) / escala,
              y: (evento.clientY - base.top) / escala,
              hoverPin: destino?.pin ?? null,
              hoverSocket: destino?.socketKey ?? null
            }
          : null
      )
    }
    const soltar = evento => {
      const root = stageRef.current
      const destino = encontrarPinBajoPuntero(
        root,
        evento.clientX,
        evento.clientY
      )
      setArrastre(null)
      if (destino?.pin) elegirConSocket(destino.pin, destino.socketKey)
    }
    const cancelar = () => setArrastre(null)

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', cancelar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', cancelar)
    }
  }, [estaArrastrando, elegirConSocket, escala])

  // Los dispositivos en el orden de la guía. Los anteriores al actual se muestran en chico
  // si ya tienen algún cable puesto.
  const dispositivos = []
  for (const c of todosLosCables) {
    if (!dispositivos.some(d => d.componente === c.componente))
      dispositivos.push({
        componente: c.componente,
        nombreComponente: c.nombreComponente,
        cables: todosLosCables.filter(x => x.componente === c.componente)
      })
  }
  const anteriores = dispositivos.filter(
    d =>
      d.componente !== actual?.componente &&
      d.cables.some(c => conexiones[c.id] === c.esperado)
  )

  // Cables ya conectados, para dibujarlos sobre el tablero 2D.
  const cablesDibujados = todosLosCables
    .filter(c => conexiones[c.id] === c.esperado)
    .map(c => {
      const desde = puntos.terminales[c.id]
      const socketKey = enchufes[c.id] ?? puntos.pinASocket[c.esperado]
      const hasta = socketKey ? puntos.sockets[socketKey] : null
      return desde && hasta
        ? { id: c.id, componente: c.componente, color: c.color, desde, hasta }
        : null
    })
    .filter(Boolean)

  const origenArrastre = arrastre ? puntos.terminales[arrastre.cable.id] : null
  const destinoArrastre = arrastre
    ? (arrastre.hoverSocket && puntos.sockets[arrastre.hoverSocket]) || {
        x: arrastre.x,
        y: arrastre.y
      }
    : null

  // Los cables de los dispositivos anteriores pasan por debajo de la tarjeta del actual
  // (que es opaca) y por encima del Arduino; los del actual van arriba de todo.
  return (
    <div
      ref={stageRef}
      className="relative inline-flex flex-col items-center gap-9"
    >
      {anteriores.length > 0 && (
        <div className="relative z-20 flex w-[396px] flex-wrap justify-center gap-2">
          {anteriores.map(d => (
            <DibujoComponente
              key={d.componente}
              compacto
              componente={d.componente}
              nombreComponente={d.nombreComponente}
              cablesComponente={d.cables}
              cableActualId={null}
              conexiones={conexiones}
            />
          ))}
        </div>
      )}

      {actual && (
        <div className="relative z-20">
          <DibujoComponente
            componente={actual.componente}
            nombreComponente={actual.nombreComponente}
            cablesComponente={cablesComponente}
            cableActualId={actual.id}
            conexiones={conexiones}
            arrastrandoId={arrastre?.cable.id ?? null}
            onIniciarArrastre={iniciarArrastre}
          />
        </div>
      )}

      <div className="relative z-0">
        <ArduinoUnoInteractivo
          onElegir={elegirConSocket}
          marcado={marcado}
          resaltadoArrastre={arrastre?.hoverSocket ?? null}
        />
      </div>

      <CablesDibujados
        className="z-10"
        cables={cablesDibujados.filter(
          c => c.componente !== actual?.componente
        )}
      />
      <CablesDibujados
        className="z-30"
        cables={cablesDibujados.filter(
          c => c.componente === actual?.componente
        )}
      />
      <svg
        className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {arrastre && origenArrastre && destinoArrastre && (
          <g>
            <path
              d={trazarCurvaCable(origenArrastre, destinoArrastre)}
              fill="none"
              stroke="#090b0f"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d={trazarCurvaCable(origenArrastre, destinoArrastre)}
              fill="none"
              stroke={arrastre.cable.color}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <circle
              cx={destinoArrastre.x}
              cy={destinoArrastre.y}
              r="5"
              fill={arrastre.cable.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  )
}

export default TableroDeConexion
