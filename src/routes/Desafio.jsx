import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  CodeIcon,
  Cross2Icon,
  EnterIcon,
  ExternalLinkIcon,
  EyeNoneIcon,
  FileTextIcon,
  HomeIcon,
  InfoCircledIcon,
  Link2Icon,
  MinusIcon,
  PlayIcon,
  PlusIcon,
  ReaderIcon,
  UpdateIcon,
  UploadIcon
} from '@radix-ui/react-icons'
import { describirTrabajo } from '@/components/AbrirTrabajo'
import MenuTrabajo from '@/components/MenuTrabajo'
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
import { Spinner } from '@/components/ui/spinner'
import useEsMovil, { esPantallaMovil } from '@/lib/useEsMovil'
import BlocklyComponent from '../components/BocklyComponent'
import BotonSubirWeb from '../placa/BotonSubirWeb'
import { TOOLBOXES_CON_SIMULADOR } from '../simulador/escenas'
import PanelSimulador, {
  conexionCompletaGuardada
} from '../simulador/PanelSimulador'
import { precargarSimuladorDesafio } from '../simulador/precarga'
import { abrirVentanaSimulador, publicarCodigo } from '../simulador/ventana'

// Todo el texto de un nodo de markdown, para reconocer el párrafo del objetivo.
const textoPlano = nodo =>
  nodo?.type === 'text'
    ? nodo.value
    : (nodo?.children || []).map(textoPlano).join('')

// En la app de escritorio hay arduino-cli para subir a una placa real.
// En el navegador (modalidad a distancia por web) solo está el simulador.
const hayPlaca = typeof window !== 'undefined' && Boolean(window.electronAPI)

const PantallaDesafio = ({ titulo, consigna, toolBox, conexion }) => {
  // Los bloques del alumno (para guardarlos en un archivo o cargar uno).
  const blocklyRef = useRef(null)
  // Si se abrió un trabajo guardado (por ejemplo, el profe mirando el de un alumno), quién
  // lo hizo y cuándo, para mostrarlo arriba.
  const location = useLocation()
  const navigate = useNavigate()
  const [trabajoAbierto, setTrabajoAbierto] = useState(
    () => location.state?.trabajoAbierto ?? null
  )
  useEffect(() => {
    // Que no vuelva a aparecer el aviso al recargar la página.
    if (location.state?.trabajoAbierto)
      navigate(location.pathname, { replace: true, state: null })
  }, [])

  // ==== Zoom / Pan / Center ====

  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [translateStart, setTranslateStart] = useState({ x: 0, y: 0 })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false) // capa lista y centrada
  const INIT_ZOOM = 1.6 // 200%
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
  const tieneSimulador = TOOLBOXES_CON_SIMULADOR.includes(Number(toolBox))
  // Los pasos del desafío: 1. Programá, 2. Conectá, 3. Probá (los dos últimos, con el
  // simulador ocupando el lugar de los bloques o en una ventana aparte).
  // En el celular se ve una pantalla por vez y la consigna es un paso más, el primero.
  const esMovil = useEsMovil()
  const [paso, setPaso] = useState(() =>
    esPantallaMovil() ? 'consigna' : 'programar'
  )
  useEffect(() => {
    if (!esMovil && paso === 'consigna') setPaso('programar')
  }, [esMovil, paso])
  const [conexionLista, setConexionLista] = useState(() =>
    conexionCompletaGuardada(toolBox)
  )
  const [ventanaAparte, setVentanaAparte] = useState(null)
  // La consigna se puede esconder con un botón. Si nadie la tocó, se ve en Programá y se
  // esconde en Conectá y Probá, para que el simulador tenga toda la pantalla.
  const [consignaElegida, setConsignaElegida] = useState(null)
  const consignaOculta = esMovil
    ? paso !== 'consigna'
    : (consignaElegida ?? (tieneSimulador && paso !== 'programar'))
  useEffect(() => setConsignaElegida(null), [paso])
  // Cambia cada vez que el simulador vuelve de la ventana aparte, para que el panel relea lo
  // que el alumno conectó allá.
  const [vueltaDeLaVentana, setVueltaDeLaVentana] = useState(0)

  const consignaRef = useRef(null) // Referencia al div de la consigna
  const avisoRef = useRef(null)
  const [blocklyHeight, setBlocklyHeight] = useState('82vh') // Altura dinámica de Blockly

  const cargarPlacas = async () => {
    if (!hayPlaca) return
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
        const avisoHeight = avisoRef.current?.offsetHeight || 0 // "Estás viendo el trabajo de…"
        const remainingHeight = windowHeight - consignaHeight - avisoHeight - 66 // Espacio restante
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

  // La ventana del simulador lee el programa de acá cada vez que cambia.
  useEffect(() => {
    if (tieneSimulador) publicarCodigo(toolBox, generatedCode)
  }, [toolBox, generatedCode, tieneSimulador])

  // Precarga el motor 3D, WASM y las piezas del desafío en segundo plano sin bloquear el arranque.
  useEffect(() => {
    if (!tieneSimulador) return undefined
    const timer = window.setTimeout(() => {
      precargarSimuladorDesafio(toolBox)
    }, 800)
    return () => window.clearTimeout(timer)
  }, [toolBox, tieneSimulador])

  // Blockly mide su contenedor sólo cuando cambia el tamaño de la ventana.
  useEffect(() => {
    window.dispatchEvent(new Event('resize'))
  }, [paso, ventanaAparte, consignaOculta, esMovil, trabajoAbierto])

  const traerDeVuelta = () => {
    setVentanaAparte(ventana => {
      if (ventana && !ventana.closed) ventana.close()
      return null
    })
    setConexionLista(conexionCompletaGuardada(toolBox))
    setVueltaDeLaVentana(n => n + 1)
  }

  // Se abrió un archivo de este mismo desafío: los bloques ya están; el simulador relee
  // los cables.
  const alAbrirTrabajo = resumen => {
    setTrabajoAbierto(resumen)
    setConexionLista(conexionCompletaGuardada(toolBox))
    setVueltaDeLaVentana(n => n + 1)
    if (paso === 'probar' && !conexionCompletaGuardada(toolBox))
      setPaso('conectar')
  }

  // Cuando el alumno cierra la ventana aparte, el simulador vuelve a la pestaña.
  useEffect(() => {
    if (!ventanaAparte) return undefined
    const timer = window.setInterval(() => {
      if (ventanaAparte.closed) traerDeVuelta()
    }, 500)
    return () => window.clearInterval(timer)
  }, [ventanaAparte])

  const desacoplar = () => {
    publicarCodigo(toolBox, generatedCode)
    const ventana = abrirVentanaSimulador(toolBox, {
      titulo,
      esquema: conexion ? new URL(conexion, document.baseURI).href : null,
      etapa: paso === 'probar' ? 'probar' : 'conectar'
    })
    if (ventana) setVentanaAparte(ventana)
    else
      toast.error(
        'El navegador bloqueó la ventana emergente. Permitila para usar el simulador aparte.'
      )
  }

  const pestanas = [
    { id: 'programar', nombre: '1. Programá', Icono: CodeIcon },
    { id: 'conectar', nombre: '2. Conectá', Icono: Link2Icon },
    {
      id: 'probar',
      nombre: '3. Probá',
      Icono: PlayIcon,
      bloqueada: !conexionLista,
      ayuda: 'Primero conectá bien todos los cables'
    }
  ]

  // En el celular: Consigna → Programá → Conectá → Probá, con Atrás / Siguiente.
  const pasosMovil = [
    { id: 'consigna', nombre: 'Consigna', Icono: ReaderIcon },
    { id: 'programar', nombre: 'Programá', Icono: CodeIcon },
    ...(tieneSimulador
      ? [
          { id: 'conectar', nombre: 'Conectá', Icono: Link2Icon },
          {
            id: 'probar',
            nombre: 'Probá',
            Icono: PlayIcon,
            bloqueada: !conexionLista,
            ayuda: 'Primero conectá bien todos los cables'
          }
        ]
      : [])
  ]
  const indiceMovil = Math.max(
    0,
    pasosMovil.findIndex(p => p.id === paso)
  )
  const pasoAnterior = pasosMovil[indiceMovil - 1]
  const pasoSiguiente = pasosMovil[indiceMovil + 1]

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

  const textoConsigna = (
    <div className="consigna max-w-3xl">
      <ReactMarkdown
        components={{
          h3: ({ node, children }) => {
            // El primer título es el del desafío; los siguientes (p. ej. "Extra") van
            // separados con una línea.
            const esPrimero = node?.position?.start?.line === 1
            return (
              <h3
                className={
                  esPrimero
                    ? 'mb-2 text-lg font-bold text-white'
                    : 'mb-2 mt-5 border-t border-gray-700 pt-4 text-lg font-bold text-white'
                }
              >
                {children}
              </h3>
            )
          },
          p: ({ node, children }) =>
            textoPlano(node).includes('Objetivo:') ? (
              <p className="my-3 rounded-lg border-l-4 border-arduino-claro bg-arduino-profundo/40 px-3 py-2">
                {children}
              </p>
            ) : (
              <p className="mb-3">{children}</p>
            ),
          strong: ({ children }) => (
            <strong className="font-semibold text-arduino-suave">
              {children}
            </strong>
          ),
          em: ({ children }) => <em className="text-gray-300">{children}</em>
        }}
      >
        {consigna}
      </ReactMarkdown>
    </div>
  )

  return (
    <div
      className={
        esMovil
          ? 'grid h-[100dvh] grid-cols-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden'
          : undefined
      }
    >
      <div className="row-start-1 dark:bg-[#202020]">
        <header
          className={`flex items-center justify-between ${esMovil ? 'gap-2 px-3 py-2' : 'px-5 py-2'}`}
        >
          <div
            className={`flex min-w-0 items-center ${esMovil ? 'gap-2' : 'space-x-4'}`}
          >
            <Link to="/">
              <h1 className="rounded-md bg-white px-[5px] py-[2px] font-bold">
                <span className="text-green-700">GrID</span>
                <span className="texto-rojo">IE</span>
              </h1>{' '}
            </Link>
            <div className="flex min-w-0 items-center text-gray-300">
              <Link to="/" aria-label="Inicio">
                <HomeIcon className="h-4 w-4" />
              </Link>
              <ChevronRightIcon className="mx-1 h-3 w-3 shrink-0" />
              <span
                className={esMovil ? 'truncate text-xs' : 'text-sm'}
                title={titulo}
              >
                {esMovil ? titulo : `Blocks - ${titulo}`}
              </span>
            </div>
          </div>
          {/* Right section: Board selection and upload */}
          <div
            className={`flex items-center ${esMovil ? 'gap-1' : 'space-x-4'}`}
          >
            <MenuTrabajo
              titulo={titulo}
              toolBox={toolBox}
              codigo={generatedCode}
              blocklyRef={blocklyRef}
              compacto={esMovil}
              onTrabajoAbierto={alAbrirTrabajo}
              onEmpezarDeNuevo={() => setTrabajoAbierto(null)}
            />
            {/* En el celular no hay Web Serial: no se puede subir a una placa. */}
            {!hayPlaca && !esMovil && <BotonSubirWeb codigo={generatedCode} />}
            {hayPlaca && (
              <>
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
                  className={`min-w-[125.3px] justify-start bg-arduino text-white hover:bg-arduino-oscuro ${isUploading ? 'opacity-70' : ''}`}
                  onClick={subirCodigo}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Spinner className="mr-1.5" />
                  ) : (
                    <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {isUploading ? 'Subiendo...' : 'Subir Código'}
                </Button>
              </>
            )}
          </div>
        </header>
        {trabajoAbierto && (
          <div
            ref={avisoRef}
            role="status"
            className={`flex items-center gap-2 border-y border-arduino/40 bg-arduino-profundo/40 text-gray-100 ${esMovil ? 'px-3 py-1.5 text-xs' : 'px-5 py-1.5 text-sm'}`}
          >
            <FileTextIcon className="h-4 w-4 shrink-0 text-arduino-claro" />
            {esMovil ? (
              <span className="min-w-0 flex-1 truncate">
                Estás viendo{' '}
                <strong className="font-semibold">
                  {describirTrabajo(trabajoAbierto)}
                </strong>
              </span>
            ) : (
              <span className="min-w-0 flex-1">
                Estás viendo{' '}
                <strong className="font-semibold">
                  {describirTrabajo(trabajoAbierto)}
                </strong>
                . Los cambios que hagas se guardan en este dispositivo.
              </span>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={() => setTrabajoAbierto(null)}
              aria-label="Cerrar aviso"
            >
              <Cross2Icon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div
        ref={consignaRef}
        className={
          esMovil
            ? `relative z-20 col-start-1 row-start-3 mx-2 min-h-0 overflow-y-auto rounded-xl p-4 leading-relaxed text-white dark:bg-[#202020] ${consignaOculta ? 'hidden' : ''}`
            : `relative mx-2 mb-2 mt-1 max-h-[130px] overflow-y-auto rounded-xl p-5 leading-relaxed text-white dark:bg-[#202020] ${consignaOculta ? 'hidden' : ''}`
        }
      >
        <div
          className={
            esMovil
              ? '-ml-3 mb-2 flex items-center'
              : 'absolute right-4 top-4 flex items-center gap-1'
          }
        >
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                className={`text-arduino-claro hover:bg-arduino-claro/10 hover:text-arduino-suave`}
              >
                <InfoCircledIcon className="mr-1.5 h-3.5 w-3.5" />
                <span className="underline decoration-dotted underline-offset-4">
                  ¿Cómo se conecta?
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 z-50 grid max-h-[92vh] w-[95vw] max-w-[95vw] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 shadow-lg sm:rounded-lg md:p-6">
              <DialogHeader>
                <DialogTitle>
                  🔌 ¡Conectá el proyecto de esta manera!
                </DialogTitle>
                <DialogDescription>
                  Vista del circuito y conexiones necesarias para que el
                  proyecto funcione.
                </DialogDescription>
              </DialogHeader>

              {/* Viewport del canvas: oculta desbordes y escucha la rueda */}
              <div
                ref={containerRef}
                className="relative h-[74vh] overflow-hidden rounded-md border bg-muted"
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
                  onPointerDown={handleMouseDown}
                  onPointerMove={handleMouseMove}
                  onPointerUp={handleMouseUp}
                  onPointerCancel={handleMouseUp}
                  onPointerLeave={handleMouseUp}
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
          {!esMovil && (
            <Button
              variant="ghost"
              className="text-gray-300"
              onClick={() => setConsignaElegida(true)}
              aria-expanded={true}
            >
              <EyeNoneIcon className="mr-1.5 h-3.5 w-3.5" />
              Esconder consigna
            </Button>
          )}
        </div>

        {textoConsigna}
      </div>

      <div
        className={
          esMovil
            ? 'row-start-2 mx-2 mb-1.5'
            : 'mx-2 mb-1 flex h-10 items-center gap-3'
        }
      >
        {esMovil && (
          <nav
            className="flex items-center gap-1 rounded-lg bg-[#2a2a2a] p-1"
            aria-label="Pasos del desafío"
          >
            {pasosMovil.map((p, i) => (
              <button
                key={p.id}
                type="button"
                disabled={p.bloqueada}
                aria-current={paso === p.id ? 'step' : undefined}
                aria-label={`Paso ${i + 1}: ${p.nombre}`}
                title={p.bloqueada ? p.ayuda : undefined}
                onClick={() => setPaso(p.id)}
                className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-1 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arduino-claro ${
                  paso === p.id
                    ? 'bg-arduino font-semibold text-white'
                    : p.bloqueada
                      ? 'text-gray-500'
                      : 'text-gray-300'
                }`}
              >
                <p.Icono className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{p.nombre}</span>
              </button>
            ))}
          </nav>
        )}
        {tieneSimulador && !esMovil && (
          <nav
            className="flex w-fit items-center gap-1 rounded-lg bg-[#2a2a2a] p-1"
            aria-label="Pasos del desafío"
          >
            {pestanas.map(pestana => (
              <button
                key={pestana.id}
                type="button"
                disabled={pestana.bloqueada}
                aria-current={paso === pestana.id ? 'step' : undefined}
                title={pestana.bloqueada ? pestana.ayuda : undefined}
                onClick={() => setPaso(pestana.id)}
                className={`flex items-center rounded-md px-4 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arduino-claro ${
                  paso === pestana.id
                    ? 'bg-arduino font-semibold text-white'
                    : pestana.bloqueada
                      ? 'cursor-not-allowed text-gray-500'
                      : 'text-gray-200 hover:bg-[#3a3a3a]'
                }`}
              >
                <pestana.Icono className="mr-1.5 h-3.5 w-3.5" />
                {pestana.nombre}
              </button>
            ))}
          </nav>
        )}
        {consignaOculta && !esMovil && (
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-200"
            onClick={() => setConsignaElegida(false)}
            aria-expanded={false}
          >
            <ReaderIcon className="mr-1.5 h-3.5 w-3.5" />
            Ver consigna
          </Button>
        )}
      </div>
      <div
        className={
          esMovil
            ? 'relative col-start-1 row-start-3 flex min-h-0'
            : 'relative flex'
        }
        style={
          esMovil ? undefined : { height: `calc(${blocklyHeight} - 44px)` }
        }
      >
        {/* En Conectá y Probá los bloques quedan montados pero invisibles (sin cambiar de
            tamaño), así Blockly no pierde nada ni se corre al volver. */}
        <div
          className={`relative min-w-0 flex-1 ${paso === 'programar' ? '' : 'invisible'}`}
          aria-hidden={paso !== 'programar'}
        >
          <BlocklyComponent
            ref={blocklyRef}
            toolBoxDesafio={toolBox}
            altura="100%"
            onCodeChange={handleCodeChange}
            compacto={esMovil}
          />
          {tieneSimulador && paso === 'programar' && !esMovil && (
            <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
              <Button
                className="bg-arduino text-base text-white shadow-lg hover:bg-arduino-oscuro"
                onClick={() => setPaso('conectar')}
              >
                <Link2Icon className="mr-2 h-4 w-4" />
                ¡Estoy listo para conectar!
              </Button>
            </div>
          )}
        </div>
        {tieneSimulador && (paso === 'conectar' || paso === 'probar') && (
          <div className="absolute inset-y-0 left-2 right-2">
            {ventanaAparte ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-gray-700 bg-[#1e1e1e] p-6 text-center text-sm text-gray-300">
                <p>El simulador está abierto en una ventana aparte.</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => ventanaAparte.focus()}
                  >
                    <ExternalLinkIcon className="mr-1.5 h-3.5 w-3.5" />
                    Ir a la ventana
                  </Button>
                  <Button
                    size="sm"
                    className="bg-arduino text-white hover:bg-arduino-oscuro"
                    onClick={traerDeVuelta}
                  >
                    <EnterIcon className="mr-1.5 h-3.5 w-3.5" />
                    Traer de vuelta acá
                  </Button>
                </div>
              </div>
            ) : (
              <PanelSimulador
                key={vueltaDeLaVentana}
                embebido
                compacto={esMovil}
                toolBox={toolBox}
                codigo={generatedCode}
                titulo={titulo}
                esquema={conexion}
                etapa={paso === 'probar' ? 'probar' : 'conectar'}
                onEtapa={setPaso}
                onConexion={setConexionLista}
                onDesacoplar={esMovil ? undefined : desacoplar}
              />
            )}
          </div>
        )}
      </div>
      {esMovil && (
        <nav
          className="row-start-4 flex items-center gap-2 border-t border-gray-800 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 dark:bg-[#202020]"
          aria-label="Avanzar o volver de paso"
        >
          <Button
            variant="secondary"
            className="h-11 flex-1"
            disabled={!pasoAnterior}
            onClick={() => pasoAnterior && setPaso(pasoAnterior.id)}
          >
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Atrás
          </Button>
          {pasoSiguiente ? (
            <Button
              className="h-11 flex-[2] bg-arduino text-white hover:bg-arduino-oscuro"
              disabled={pasoSiguiente.bloqueada}
              onClick={() => setPaso(pasoSiguiente.id)}
            >
              {pasoSiguiente.bloqueada
                ? 'Conectá todos los cables'
                : `Siguiente: ${pasoSiguiente.nombre}`}
              {!pasoSiguiente.bloqueada && (
                <ArrowRightIcon className="ml-1.5 h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="h-11 flex-[2]"
              onClick={() => setPaso(tieneSimulador ? 'programar' : 'consigna')}
            >
              {tieneSimulador ? (
                <CodeIcon className="mr-1.5 h-4 w-4" />
              ) : (
                <ReaderIcon className="mr-1.5 h-4 w-4" />
              )}
              {tieneSimulador ? 'Volver a los bloques' : 'Ver consigna'}
            </Button>
          )}
        </nav>
      )}
    </div>
  )
}

// Cada desafío empieza de cero al cambiar de ruta (por ejemplo, al abrir un archivo de
// otro desafío desde uno): sin la clave, React reusaría el estado del anterior.
const Desafio = props => {
  const { pathname } = useLocation()
  return <PantallaDesafio key={pathname} {...props} />
}

export default Desafio
