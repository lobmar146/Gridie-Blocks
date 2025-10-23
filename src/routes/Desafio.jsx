import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import {
  ChevronRightIcon,
  HomeIcon,
  InfoCircledIcon,
  MinusIcon,
  PlusIcon,
  UpdateIcon,
  UploadIcon
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import BlocklyComponent from '../components/BocklyComponent'

const App = ({ titulo, consigna, toolBox, conexion }) => {
  // ==== Zoom / Pan / Center ====

  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [translateStart, setTranslateStart] = useState({ x: 0, y: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false) // capa lista y centrada
  const INIT_ZOOM = 2 // 200%
  const [zoom, setZoom] = useState(INIT_ZOOM)

  const ZOOM_STEP = 0.25
  const MIN_ZOOM = 0.5
  const MAX_ZOOM = 5

  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const transformLayerRef = useRef(null)

  // Tamaño natural de la imagen para límites
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

  // Centrar si el contenido cabe en el viewport
  const centerContent = (nextZoom = zoom) => {
    const container = containerRef.current
    if (!container || !naturalSize.width || !naturalSize.height) return

    const viewportW = container.clientWidth
    const viewportH = container.clientHeight
    const contentW = naturalSize.width * nextZoom
    const contentH = naturalSize.height * nextZoom

    const x = Math.round((viewportW - contentW) / 2)
    const y = Math.round((viewportH - contentH) / 2)

    clampAndSetTranslate({ x, y }, nextZoom)
  }

  // Clampeo + centrado por eje
  const clampAndSetTranslate = (nextTranslate, nextZoom) => {
    const container = containerRef.current
    if (!container || !naturalSize.width || !naturalSize.height) {
      setTranslate(nextTranslate)
      return
    }

    const viewportW = container.clientWidth
    const viewportH = container.clientHeight
    const contentW = naturalSize.width * nextZoom
    const contentH = naturalSize.height * nextZoom

    const computeBounds = (viewport, content) => {
      if (content <= viewport) {
        const center = Math.round((viewport - content) / 2)
        return { min: center, max: center } // fijo al centro si entra
      }
      return { min: viewport - content, max: 0 } // si no entra, rango desplazable
    }

    const xBounds = computeBounds(viewportW, contentW)
    const yBounds = computeBounds(viewportH, contentH)

    const clamped = {
      x: Math.max(xBounds.min, Math.min(xBounds.max, nextTranslate.x)),
      y: Math.max(yBounds.min, Math.min(yBounds.max, nextTranslate.y))
    }
    setTranslate(clamped)
  }

  // Imagen cargada ⇒ guardamos tamaño natural y centramos de inmediato
  const handleImageLoad = () => {
    if (!imgRef.current) return
    const { naturalWidth, naturalHeight } = imgRef.current
    setNaturalSize({ width: naturalWidth, height: naturalHeight })
  }

  // Botones zoom
  const zoomIn = () => {
    const next = Math.min(MAX_ZOOM, zoom + ZOOM_STEP)
    setZoom(next)
    clampAndSetTranslate(translate, next)
  }
  const zoomOut = () => {
    const next = Math.max(MIN_ZOOM, zoom - ZOOM_STEP)
    setZoom(next)
    clampAndSetTranslate(translate, next)
  }
  const resetView = () => {
    setZoom(INIT_ZOOM)
    centerContent(INIT_ZOOM)
  }

  // Drag / pan con mouse
  const handleMouseDown = e => {
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    setTranslateStart({ ...translate })
  }
  const handleMouseMove = e => {
    if (!isPanning) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    clampAndSetTranslate(
      { x: translateStart.x + dx, y: translateStart.y + dy },
      zoom
    )
  }
  const handleMouseUp = () => setIsPanning(false)

  // Zoom con rueda (centrado al cursor)
  const handleWheel = e => {
    e.preventDefault()
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const cursor = { x: e.clientX - rect.left, y: e.clientY - rect.top }

    const prevZoom = zoom
    const factor = 1 + ZOOM_STEP
    const proposed = e.deltaY > 0 ? prevZoom / factor : prevZoom * factor
    const nextZoom = clamp(proposed, MIN_ZOOM, MAX_ZOOM)
    if (nextZoom === prevZoom) return

    const scale = nextZoom / prevZoom
    const nextTranslate = {
      x: cursor.x - (cursor.x - translate.x) * scale,
      y: cursor.y - (cursor.y - translate.y) * scale
    }

    clampAndSetTranslate(nextTranslate, nextZoom)
    setZoom(nextZoom)
  }

  // (Opcional) Re-centrar al redimensionar el viewport
  useEffect(() => {
    const onResize = () => centerContent(zoom)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [zoom, naturalSize.width, naturalSize.height])

  // Centra cuando el diálogo está abierto y ya conocemos el tamaño natural de la imagen
  useLayoutEffect(() => {
    if (!isDialogOpen) return
    if (!containerRef.current) return
    if (!naturalSize.width || !naturalSize.height) return

    setIsPositioned(false)

    requestAnimationFrame(() => {
      centerContent(INIT_ZOOM) // 👈 ahora centramos a 200%
      setZoom(INIT_ZOOM) // 👈 fijamos 200% en el estado
      requestAnimationFrame(() => setIsPositioned(true))
    })
  }, [isDialogOpen, naturalSize.width, naturalSize.height])

  const [placas, setPlacas] = useState([])
  const [placaSeleccionada, setPlacaSeleccionada] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const consignaRef = useRef(null) // Referencia al div de la consigna
  const [blocklyHeight, setBlocklyHeight] = useState('82vh') // Altura dinámica de Blockly

  const cargarPlacas = async () => {
    try {
      const salida = await window.electronAPI.listarPlacas()
      const lineas = salida.trim().split('\n').slice(1) // Saltamos el header
      const datos = lineas.map(linea => {
        const partes = linea.trim().split(/\s{2,}/) // Divide por múltiples espacios
        return {
          puerto: partes[0],
          nombre: partes[2] || '',
          fqbn: partes[3] || ''
        }
      })
      setPlacas(datos)

      const placaGuardada = localStorage.getItem('placaSeleccionada')
      if (placaGuardada && datos.some(p => p.puerto === placaGuardada)) {
        setPlacaSeleccionada(placaGuardada)
      } else {
        setPlacaSeleccionada('')
        localStorage.removeItem('placaSeleccionada')
      }
    } catch (error) {
      console.error('Error al listar placas:', error)
    }
  }

  useEffect(() => {
    const updateBlocklyHeight = () => {
      if (consignaRef.current) {
        const consignaHeight = consignaRef.current.offsetHeight // Altura del div de la consigna
        const windowHeight = window.innerHeight // Altura de la ventana
        const remainingHeight = windowHeight - consignaHeight - 66 // Espacio restante
        setBlocklyHeight(`${remainingHeight}px`)
      }
    }

    updateBlocklyHeight() // Calcula la altura inicialmente

    cargarPlacas()
    window.addEventListener('resize', updateBlocklyHeight) // Recalcula en caso de cambio de tamaño

    return () => {
      window.removeEventListener('resize', updateBlocklyHeight) // Limpieza del evento
    }
  }, [])

  useEffect(() => {
    if (placaSeleccionada) {
      localStorage.setItem('placaSeleccionada', placaSeleccionada)
    }
  }, [placaSeleccionada])

  const handleCodeChange = code => {
    setGeneratedCode(code) // Actualiza el estado con el código generado
  }

  const subirCodigo = async () => {
    if (!placaSeleccionada) {
      toast.error('Por favor, selecciona una placa antes de subir el código.', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
      return
    }

    setIsUploading(true)

    try {
      const respuesta = await window.electronAPI.subirCodigo(
        placaSeleccionada,
        generatedCode
      )
      toast.success('Código subido exitosamente', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
    } catch (error) {
      toast.error(`Error: al subir el código: ${error}`, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
      console.log('Error al subir el código:', error)
      alert(`Error: al subir el código`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="dark:bg-[#202020]">
        <header className="flex items-center justify-between px-5 py-2">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <h1 className="rounded-md bg-white px-[5px] py-[2px] font-bold">
                <span className="text-green-700">GrID</span>
                <span className="texto-rojo">IE</span>
              </h1>{' '}
            </Link>
            <div className="flex items-center text-gray-300">
              <Link to="/">
                <HomeIcon className="h-4 w-4" />
              </Link>
              <ChevronRightIcon className="mx-1 h-3 w-3" />
              <span className="text-sm">Blocks - {titulo}</span>
            </div>
          </div>
          {/* Right section: Board selection and upload */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-1.5 text-xs text-gray-300">Placa:</span>
              <Select
                value={placaSeleccionada}
                onValueChange={setPlacaSeleccionada}
                onOpenChange={open => {
                  if (open) cargarPlacas()
                }}
              >
                <SelectTrigger className="h-8 w-[200px] border-gray-700 bg-gray-800 text-sm">
                  <SelectValue placeholder="Seleccionar placa" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  {placas.map((placa, idx) => (
                    <SelectItem key={idx} value={placa.puerto}>
                      {placa.nombre} ({placa.puerto})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="default"
              size="sm"
              className={`bg-green-600 text-white hover:bg-green-700 ${isUploading ? 'opacity-70' : ''}`}
              onClick={subirCodigo}
              disabled={isUploading}
            >
              <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
              {isUploading ? 'Subiendo...' : 'Subir Código'}
            </Button>
          </div>
        </header>
      </div>

      <div
        ref={consignaRef}
        className="relative mx-2 mb-2 mt-1 max-h-[130px] overflow-y-auto rounded-xl p-5 leading-relaxed text-white dark:bg-[#202020]"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className={`absolute right-4 top-4 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-500`}
            >
              <InfoCircledIcon className="mr-1.5 h-3.5 w-3.5" />
              <span className="underline decoration-dotted underline-offset-4">
                ¿Cómo se conecta?
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-50 grid max-h-[92vh] w-[95vw] max-w-[95vw] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 shadow-lg sm:rounded-lg md:p-6">
            <DialogHeader>
              <DialogTitle>🔌 ¡Conectá el proyecto de esta manera!</DialogTitle>
              <DialogDescription>
                Vista del circuito y conexiones necesarias para que el proyecto
                funcione.
              </DialogDescription>
            </DialogHeader>

            {/* Viewport del canvas: oculta desbordes y escucha la rueda */}
            <div
              ref={containerRef}
              className="relative h-[74vh] overflow-hidden rounded-md border bg-muted/30"
              style={{ touchAction: 'none' }}
              onWheel={handleWheel}
            >
              {/* Capa transformada: translate + scale (anclada en top-left) */}
              <div
                ref={transformLayerRef}
                className="cursor-grab active:cursor-grabbing"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                  transition:
                    isPanning || !isPositioned
                      ? 'none'
                      : 'transform 100ms ease',
                  width: naturalSize.width || 'auto',
                  height: naturalSize.height || 'auto',
                  visibility: isPositioned ? 'visible' : 'hidden' // 👈 evita el flash en 0,0
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img
                  ref={imgRef}
                  src={conexion}
                  alt="Imagen del circuito"
                  className="pointer-events-none block max-w-none select-none"
                  draggable={false}
                  onLoad={handleImageLoad}
                />
              </div>

              {/* Controles fijos (overlay) */}
              <div className="pointer-events-auto absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-background/80 px-2 py-1 shadow backdrop-blur">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={zoomOut}
                  aria-label="Alejar"
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="w-14 text-center text-xs tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={zoomIn}
                  aria-label="Acercar"
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetView}>
                  Reset
                </Button>
              </div>
            </div>

            <DialogFooter className="sm:justify-start">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ReactMarkdown
          components={{
            ul: ({ children }) => (
              <ul className="list-inside list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-inside list-decimal">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h3: ({ node, children }) => {
              // Detectamos si es el primer nodo del árbol
              const isFirst = node?.position?.start?.line === 1
              const className = isFirst
                ? 'text-lg font-bold mb-2'
                : 'text-lg font-bold mt-5 mb-2'
              return <h3 className={className}>{children}</h3>
            },
            p: ({ children }) => <p className="mb-3">{children}</p>
          }}
        >
          {consigna}
        </ReactMarkdown>
      </div>

      <BlocklyComponent
        toolBoxDesafio={toolBox}
        altura={blocklyHeight}
        onCodeChange={handleCodeChange}
      />
    </>
  )
}

export default App
