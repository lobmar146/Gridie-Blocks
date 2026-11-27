import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import { CodeIcon, CopyIcon, Cross2Icon, PlusIcon } from '@radix-ui/react-icons'
import * as Blockly from 'blockly/core'
import { Button } from '@/components/ui/button'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import * as Es from 'blockly/msg/es'
import { blocksArduino } from '../blocks/blocksArduino'
import '../blocks/botonCrearComando'
import { forBlock } from '../generators/customGeneratos'
import { generatorArduino } from '../generators/generatorArduino'
import { toolboxJS } from '../toolbox/Clase 1/toolbox'
import { toolboxDesafio1 } from '../toolbox/Clase 1/toolboxDesafio1'
import { toolboxDesafio2 } from '../toolbox/Clase 1/toolboxDesafio2'
import { toolboxDesafio3 } from '../toolbox/Clase 1/toolboxDesafio3'
import { toolboxDesafio1Clase2 } from '../toolbox/Clase 2/toolboxDesafio1Clase2'
import { toolboxDesafio2Clase2 } from '../toolbox/Clase 2/toolboxDesafio2Clase2'
import '../App.css'
import toast from 'react-hot-toast'
import { revisarBuenasPracticas } from '@/lib/buenasPracticas'
import { borrarBloques, guardarBloques, leerBloques } from '@/lib/trabajo'
import CodigoColoreado from './CodigoColoreado'
import PanelBuenasPracticas from './PanelBuenasPracticas'
import { toolboxDesafio3Clase2 } from '@/toolbox/Clase 2/toolboxDesafio3Clase2'
import { toolboxDesafio5Clase2 } from '@/toolbox/Clase 2/toolboxDesafio5Clase2'
import { toolboxEjercicio1Clase3PIR } from '@/toolbox/Clase 3/toolboxEjercicio1Clase3PIR'
import { toolboxEjercicio2Clase3 } from '@/toolbox/Clase 3/toolboxEjercicio2Clase3'
import { toolboxProlema1Clase3 } from '@/toolbox/Clase 3/toolboxProblema1Clase3'
import { toolboxProlema1Clase3PIR } from '@/toolbox/Clase 3/toolboxProblema1Clase3PIR'
import { toolboxProblema2Clase3 } from '@/toolbox/Clase 3/toolboxProblema2Clase3'
import { toolboxDesafioClase4 } from '@/toolbox/Clase 4/toolboxDesafioClase4'
import { toolboxDesafioHumedad } from '@/toolbox/Clase 4/toolboxDesafioHumedad'
import { toolboxDesafio4Clase2 } from '../toolbox/Clase 2/toolboxDesafio4Clase2'
import { toolboxEjercicio1Clase3 } from '../toolbox/Clase 3/toolboxEjercicio1Clase3'

// Todo Blockly en español (menú del clic derecho, avisos, etc.). Importar el archivo
// no alcanza: hay que aplicarlo, y antes de los textos propios de abajo.
Blockly.setLocale(Es)

// Sobrescribe los mensajes de los bloques de procedimientos
Blockly.Msg['CLEAN_UP'] = 'Organizar bloques'
Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = 'Definir'
Blockly.Msg['PROCEDURES_DEFNORETURN_DO'] = 'hacer'
Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE'] = 'Hacer algo'
Blockly.Msg['PROCEDURES_CALLNORETURN_TITLE'] = 'llamar a %1'
Blockly.Msg['PROCEDURES_DEFNORETURN_TOOLTIP'] =
  'Define un procedimiento sin retorno.'
Blockly.Msg['PROCEDURES_CALLNORETURN_TOOLTIP'] =
  'Llama a un procedimiento definido por el usuario sin retorno.'

// Ocultar los bloques de procedimientos con retorno
Blockly.Blocks['procedures_defreturn'] = null
Blockly.Blocks['procedures_callreturn'] = null
Blockly.Blocks['procedures_ifreturn'] = null

// Define los bloques una vez fuera del componente
Blockly.common.defineBlocks(blocksArduino)

const ICONO_AVISO = Blockly.icons.IconType.WARNING
const abriendo = new WeakSet() // burbujas de aviso que se están abriendo

// Las burbujas de Blockly no cortan el texto: lo partimos nosotros para que no queden
// larguísimas (sobre todo en el celular).
const partirEnRenglones = (texto, ancho = 42) =>
  texto
    .split(' ')
    .reduce((renglones, palabra) => {
      const ultimo = renglones[renglones.length - 1]
      if (ultimo && (ultimo + ' ' + palabra).length <= ancho)
        renglones[renglones.length - 1] = ultimo + ' ' + palabra
      else renglones.push(palabra)
      return renglones
    }, [])
    // Un espacio fijo a cada lado, para que el texto no quede pegado al borde.
    .map(renglon => `\u00a0${renglon}\u00a0`)
    .join('\n')

// Contraste (WCAG) entre un color #rrggbb y el blanco o el negro.
const luminancia = hex => {
  const [r, g, b] = [1, 3, 5].map(i => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const CONTRASTE_MINIMO = 4.6 // WCAG AA pide 4.5:1 para texto de este tamaño

const oscurecer = (hex, factor) =>
  '#' +
  [1, 3, 5]
    .map(i =>
      Math.round(parseInt(hex.slice(i, i + 2), 16) * factor)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')

/**
 * Las burbujas toman el color del bloque y llevan texto blanco. Si con ese color el blanco
 * no llega al contraste de WCAG AA, el globo se oscurece de a poco hasta que llegue.
 */
function ajustarTextoDeBurbujas(workspace) {
  const lienzo = workspace.getBubbleCanvas?.()
  lienzo?.querySelectorAll('.blocklyBubble').forEach(burbuja => {
    const formas = burbuja.querySelectorAll('.blocklyDraggable, .blocklyBubbleTail')
    let fondo = formas[0]?.getAttribute('fill')
    if (!/^#[0-9a-f]{6}$/i.test(fondo || '')) return
    let factor = 1
    while (1.05 / (luminancia(oscurecer(fondo, factor)) + 0.05) < CONTRASTE_MINIMO)
      factor -= 0.05
    if (factor === 1) return
    fondo = oscurecer(fondo, factor)
    formas.forEach(forma => forma.setAttribute('fill', fondo))
  })
}

/**
 * Pone (o saca) el aviso de Blockly de cada bloque. Los avisos se abren solos para que el
 * alumno los lea: cada vez que cambia algo del programa, se vuelven a abrir los que tenga
 * cerrados (si el alumno solo cerró la burbuja sin cambiar nada, queda cerrada).
 */
function aplicarAvisos(workspace, avisos, evento) {
  const cambioElPrograma = evento && !evento.isUiEvent
  workspace.getAllBlocks(false).forEach(bloque => {
    const textos = avisos.get(bloque)
    const texto = textos
      ? textos
          .map((t, i) =>
            // Si hay más de uno, van numerados para leerlos de a uno.
            textos.length > 1
              ? partirEnRenglones(`${i + 1}. ${t}`)
              : partirEnRenglones(t)
          )
          .join('\n\n')
      : null
    const icono = bloque.getIcon(ICONO_AVISO)
    if (!texto) {
      if (icono) bloque.setWarningText(null)
      return
    }
    if (icono?.getText() !== texto) bloque.setWarningText(texto)
    if (!cambioElPrograma || workspace.isDragging()) return
    const nuevo = bloque.getIcon(ICONO_AVISO)
    // Abrir la burbuja tarda un poquito: no la pedimos dos veces (quedaría una colgada).
    if (!nuevo || nuevo.bubbleIsVisible() || abriendo.has(nuevo)) return
    abriendo.add(nuevo)
    Promise.resolve(nuevo.setBubbleVisible(true)).finally(() =>
      abriendo.delete(nuevo)
    )
  })
}

// El bloque principal de cada desafío: <9 => Ejecutar 1 vez | >=9 => Ejecutar por siempre
const tipoRaiz = toolBoxDesafio =>
  (Number(toolBoxDesafio) || 1) >= 9
    ? 'ejecutar_por_siempre'
    : 'ejecutar_una_vez'
const TIPOS_RAIZ = ['ejecutar_una_vez', 'ejecutar_por_siempre']

/**
 * Pone en el área de trabajo los bloques guardados (o nada) y se asegura de que esté el
 * bloque principal del desafío, que no se puede borrar. Devuelve false si los bloques
 * guardados no se pudieron cargar.
 */
function prepararAreaDeTrabajo(workspace, toolBoxDesafio, bloques) {
  let pudo = true
  workspace.clear()
  if (bloques) {
    try {
      Blockly.serialization.workspaces.load(bloques, workspace)
    } catch (error) {
      console.error('No se pudieron cargar los bloques guardados:', error)
      workspace.clear()
      pudo = false
    }
  }
  const raices = workspace
    .getTopBlocks(false)
    .filter(b => TIPOS_RAIZ.includes(b.type))
  raices.forEach(b => b.setDeletable(false))
  if (!raices.some(b => b.type === tipoRaiz(toolBoxDesafio))) {
    const initialBlock = workspace.newBlock(tipoRaiz(toolBoxDesafio))
    initialBlock.initSvg()
    initialBlock.render()
    initialBlock.moveBy(10, 10)
    initialBlock.setDeletable(false)
  }
  return pudo
}

/** Si el área de trabajo tiene algo más que el bloque principal vacío. */
const tieneTrabajo = workspace =>
  workspace.getAllBlocks(false).some(b => !TIPOS_RAIZ.includes(b.type))

const BlocklyComponent = forwardRef(function BlocklyComponent(
  { toolBoxDesafio, altura, onCodeChange, onPracticasChange, compacto = false },
  ref
) {
  const blocklyDiv = useRef(null)
  // En el celular los bloques arrancan más chicos; se lee al crear el área de trabajo.
  const compactoRef = useRef(compacto)
  compactoRef.current = compacto
  // En el celular la caja de bloques es un cajón: se esconde y se trae con un botón.
  const [cajonAbierto, setCajonAbierto] = useState(false)
  const workspaceRef = useRef(null) // Referencia al workspace
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)
  // Cómo va el programa con las buenas prácticas (la lista del costado).
  const [practicas, setPracticas] = useState([])
  const alertShownRef = useRef(false) // Usamos useRef en lugar de useState

  // Definir todos los toolboxes disponibles en un objeto
  const toolboxMap = {
    1: toolboxDesafio1,
    2: toolboxDesafio2,
    3: toolboxDesafio3,
    4: toolboxDesafio1Clase2,
    5: toolboxDesafio2Clase2,
    6: toolboxDesafio3Clase2,
    7: toolboxDesafio4Clase2,
    8: toolboxDesafio5Clase2,
    9: toolboxEjercicio1Clase3PIR,
    10: toolboxProlema1Clase3PIR,
    11: toolboxEjercicio2Clase3,
    12: toolboxProblema2Clase3,
    13: toolboxDesafioClase4,
    14: toolboxDesafioHumedad
    // Agrega aquí otros toolboxes si los tienes
  }
  const darkTheme = Blockly.Theme.defineTheme('darkTheme', {
    base: Blockly.Themes.Classic,
    blockStyles: {
      colour_blocks: {
        colourPrimary: '#a5745b',
        colourSecondary: '#dbc7bd',
        colourTertiary: '#845d49'
      }
      // Define otros estilos de bloque si es necesario
    },
    categoryStyles: {
      list_category: {
        colour: '#745ba5'
      }
    },
    componentStyles: {
      workspaceBackgroundColour: '#1e1e1e',
      toolboxBackgroundColour: '#333',
      toolboxForegroundColour: '#fff',
      flyoutBackgroundColour: '#252526',
      flyoutForegroundColour: '#ccc',
      flyoutOpacity: 1,
      scrollbarColour: '#797979',
      scrollbarOpacity: 0.8
    }
  })

  useEffect(() => {
    if (onCodeChange) {
      onCodeChange(code) // Notifica al componente padre cada vez que `code` cambie
    }
  }, [code, onCodeChange])

  // La pantalla del desafío usa las buenas prácticas para felicitar al alumno.
  useEffect(() => {
    onPracticasChange?.(practicas)
  }, [practicas, onPracticasChange])

  useEffect(() => {
    const toolboxIndex = Number(toolBoxDesafio) || 1
    // Acceder dinámicamente al toolbox según el prop
    const selectedToolbox = toolboxMap[toolBoxDesafio] || toolboxDesafio1 // Default toolbox in case of no match

    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      renderer: 'zelos',
      // Íconos (zoom, tacho) y sonidos de Blockly desde la app: por defecto los busca en
      // unpkg.com, de la última versión, y sin internet o con otra versión se ven rotos.
      media:
        import.meta.env.MODE === 'development'
          ? '/blockly-media/'
          : './blockly-media/',
      toolbox: selectedToolbox,
      theme: darkTheme,
      locale: 'es',
      scrollbars: true,
      zoom: {
        controls: true,
        wheel: false,
        pinch: true,
        startScale: compactoRef.current ? 0.75 : 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true,
      grid: {
        spacing: 20, // Espaciado entre las líneas de la cuadrícula
        length: 5, // Longitud de las líneas de la cuadrícula (0 para puntos)
        colour: '#393838', // Color de la cuadrícula
        snap: true // Los bloques se alinearán a la cuadrícula cuando se suelten
      }
    })

    // Lo que el alumno dejó la última vez en este desafío (o solo el bloque principal).
    const guardados = leerBloques(toolBoxDesafio)
    if (!prepararAreaDeTrabajo(workspaceRef.current, toolBoxDesafio, guardados))
      toast.error(
        'No se pudieron recuperar los bloques que tenías guardados. Empezás con el área vacía.'
      )

    //funcion para saber si es un bloque flotante.
    // Función para saber si el bloque está flotando (ni dentro de ejecutar_una_vez / ejecutar_por_siempre ni dentro de un procedimiento)
    const isFloatingBlock = block => {
      let current = block.getParent()
      let isInsideProcedure = false

      while (current) {
        if (current.type === 'procedures_defnoreturn') {
          isInsideProcedure = true
          break
        }
        current = current.getParent()
      }

      const parentBlock = block.getSurroundParent()
      const isInsideEjecutar = parentBlock?.type === 'ejecutar_una_vez'
      const isProcedureBlock =
        block.type === 'procedures_defnoreturn' ||
        block.type === 'procedures_callnoreturn'
      const isRootBlock =
        block.type === 'ejecutar_una_vez' ||
        block.type === 'ejecutar_por_siempre'

      return (
        !isInsideEjecutar &&
        !isInsideProcedure &&
        !isProcedureBlock &&
        !isRootBlock
      )
    }

    const onWorkspaceChange = evento => {
      const allBlocks = workspaceRef.current.getAllBlocks()
      let shouldDisableAll = false

      // Determinar si todos los bloques deben deshabilitarse
      allBlocks.forEach(block => {
        const parentType = block.getSurroundParent()?.type
        const isInsideEjecutarUnaVez = parentType === 'ejecutar_una_vez'
        const isInsideEjecutarPorSiempre = parentType === 'ejecutar_por_siempre'

        if (
          toolBoxDesafio !== '1' &&
          (isInsideEjecutarUnaVez || isInsideEjecutarPorSiempre)
        ) {
          if (
            block.type !== 'procedures_defnoreturn' &&
            block.type !== 'procedures_callnoreturn'
          ) {
            shouldDisableAll = true
          }
        }
      })

      // Deshabilitar o habilitar bloques
      allBlocks.forEach(block => {
        block.setEnabled(!shouldDisableAll)

        //evaluamos aparte, si el bloque es un bloque floante.
        const shouldDisableFloatingBlock = isFloatingBlock(block)
        if (shouldDisableFloatingBlock) {
          block.setEnabled(false)
        }
      })

      // Buenas prácticas: los avisos de Blockly en cada bloque y la lista del costado.
      const revision = revisarBuenasPracticas(
        Blockly,
        workspaceRef.current,
        toolBoxDesafio,
        selectedToolbox
      )
      aplicarAvisos(workspaceRef.current, revision.avisos, evento)
      requestAnimationFrame(() => ajustarTextoDeBurbujas(workspaceRef.current))
      setPracticas(anteriores =>
        JSON.stringify(anteriores) === JSON.stringify(revision.reglas)
          ? anteriores
          : revision.reglas
      )
      const msg =
        toolboxIndex >= 9
          ? `Recuerda: 
          \nEn el bloque 'Ejecutar por siempre' solo puedes incluir procedimientos. \n\n ¡Planifica tu estrategia de solución con cuidado para asegurar el éxito de tu programa!.`
          : `Recuerda: 
          \nEn el bloque 'Ejecutar 1 vez 'solo puedes incluir procedimientos. \n\n ¡Planifica tu estrategia de solución con cuidado para asegurar el éxito de tu programa!.`
      // Mostrar la alerta solo una vez cuando se deshabilitan todos los bloques
      if (shouldDisableAll && !alertShownRef.current) {
        toast(msg, {
          icon: '❗',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '20px'
          }
        })

        alertShownRef.current = true // Actualizar ref para que la alerta no se muestre de nuevo
      } else if (!shouldDisableAll && alertShownRef.current) {
        alertShownRef.current = false // Restablecer para permitir futuras alertas
      }

      // Generar y mostrar código
      const generatedCode = shouldDisableAll
        ? msg
        : generatorArduino.workspaceToCode(workspaceRef.current)
      setCode(generatedCode)
    }

    workspaceRef.current.addChangeListener(onWorkspaceChange)

    // En el celular, el cajón se cierra solo cuando el alumno suelta un bloque.
    const cerrarCajonAlSoltar = evento => {
      if (
        compactoRef.current &&
        evento.type === Blockly.Events.BLOCK_DRAG &&
        !evento.isStart
      )
        setCajonAbierto(false)
    }
    workspaceRef.current.addChangeListener(cerrarCajonAlSoltar)

    // Autoguardado: cada vez que cambian los bloques (no al hacer zoom o seleccionar), se
    // guardan en el navegador, un ratito después para no guardar en cada pasito del arrastre.
    const workspace = workspaceRef.current
    let espera = null
    const guardarAhora = () => {
      window.clearTimeout(espera)
      espera = null
      guardarBloques(
        toolBoxDesafio,
        Blockly.serialization.workspaces.save(workspace)
      )
    }
    const autoguardar = evento => {
      if (evento.isUiEvent) return
      window.clearTimeout(espera)
      espera = window.setTimeout(guardarAhora, 300)
    }
    workspace.addChangeListener(autoguardar)
    // Si cierra la pestaña o la app justo después de mover un bloque.
    const alSalir = () => espera && guardarAhora()
    window.addEventListener('pagehide', alSalir)

    return () => {
      alSalir()
      window.removeEventListener('pagehide', alSalir)
      workspace.removeChangeListener(autoguardar)
      workspaceRef.current.removeChangeListener(cerrarCajonAlSoltar)
      workspaceRef.current.removeChangeListener(onWorkspaceChange)
      workspaceRef.current.dispose()
    }
  }, [toolBoxDesafio]) // Se actualizará cada vez que cambie el prop 'toolBoxDesafio'

  // Lo que usa la pantalla del desafío para guardar y abrir archivos.
  useImperativeHandle(
    ref,
    () => ({
      obtenerBloques: () =>
        Blockly.serialization.workspaces.save(workspaceRef.current),
      tieneTrabajo: () => tieneTrabajo(workspaceRef.current),
      cargarBloques: bloques =>
        prepararAreaDeTrabajo(workspaceRef.current, toolBoxDesafio, bloques),
      empezarDeNuevo: () => {
        borrarBloques(toolBoxDesafio)
        prepararAreaDeTrabajo(workspaceRef.current, toolBoxDesafio, null)
      }
    }),
    [toolBoxDesafio]
  )

  useEffect(() => {
    if (workspaceRef.current) {
      Blockly.svgResize(workspaceRef.current)
    }
  }, [showCode])

  // Muestra u oculta la caja de bloques (en escritorio siempre se ve).
  useEffect(() => {
    const ws = workspaceRef.current
    const toolbox = ws?.getToolbox()
    if (!toolbox) return
    const visible = !compacto || cajonAbierto
    if (!visible) toolbox.clearSelection()
    toolbox.setVisible(visible)
    Blockly.svgResize(ws)
  }, [compacto, cajonAbierto, toolBoxDesafio])

  // Escucha cambios en la altura del contenedor y fuerza un redibujado
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current) // Forzar redimensionamiento de Blockly
      }
    })

    if (blocklyDiv.current) {
      resizeObserver.observe(blocklyDiv.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [altura])

  // Función para copiar el código al portapapeles
  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(code)
      .then(() => {
        toast.success(
          'Código copiado. Recorda pegarlo en el Arduino IDE y subirlo a la placa.',
          {
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff'
            }
          }
        )
      })
      .catch(() => {
        toast.error('Error al copiar el código', {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff'
          }
        })
      })
  }

  // En la computadora, con buenas prácticas, el código se ve en la columna de la derecha.
  const conPanel = !compacto && practicas.length > 0
  const codigoAParte = showCode && !compacto && !conPanel

  return (
    <div
      className={`blockly-container ${compacto ? 'blockly-compacto' : ''}`}
      style={{ height: altura }}
    >
      <div
        ref={blocklyDiv}
        className={
          codigoAParte ? 'blockly-workspace' : 'blockly-workspace-full'
        }
      >
        {compacto && (
          <Button
            onClick={() => setCajonAbierto(abierto => !abierto)}
            className={`absolute bottom-3 left-3 z-[60] h-11 px-4 text-base text-white shadow-lg ${cajonAbierto ? 'bg-gray-600 hover:bg-gray-500' : 'bg-arduino hover:bg-arduino-oscuro'}`}
            aria-expanded={cajonAbierto}
          >
            {cajonAbierto ? (
              <Cross2Icon className="mr-1.5 h-4 w-4" />
            ) : (
              <PlusIcon className="mr-1.5 h-4 w-4" />
            )}
            {cajonAbierto ? 'Cerrar' : 'Bloques'}
          </Button>
        )}
        {compacto ? (
          // En el celular: dos botones chicos, solo con ícono, para dejar lugar a los bloques.
          <div className="absolute right-2 top-2 z-10 flex gap-1.5">
            <Button
              size="icon"
              onClick={() => setShowCode(!showCode)}
              className="h-9 w-9 bg-arduino text-white hover:bg-arduino-oscuro"
              aria-label={showCode ? 'Ocultar código' : 'Mostrar código'}
              aria-pressed={showCode}
            >
              <CodeIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              onClick={copyToClipboard}
              className="h-9 w-9 bg-arduino-profundo text-white hover:bg-arduino-oscuro"
              aria-label="Copiar código"
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          !conPanel && (
          <>
            <Button
              onClick={() => setShowCode(!showCode)}
              className="absolute right-8 top-2 z-10 w-[160px] bg-arduino text-white hover:bg-arduino-oscuro"
            >
              <CodeIcon className="mr-2 h-4 w-4" />
              {showCode ? 'Ocultar Código' : 'Mostrar Código'}
            </Button>
            <Button
              onClick={copyToClipboard}
              className="absolute right-8 top-[52px] z-10 w-[160px] bg-arduino-profundo text-white hover:bg-arduino-oscuro"
            >
              <CopyIcon className="mr-2 h-4 w-4" />
              Copiar Código
            </Button>
          </>
          )
        )}
        {compacto && (
          <PanelBuenasPracticas reglas={practicas} compacto key="compacto" />
        )}
        {showCode && compacto && (
          <CodigoColoreado
            codigo={code}
            className="absolute inset-x-0 bottom-0 z-10 m-0 h-[45%] rounded-t-[10px] border-t border-gray-700"
          />
        )}
      </div>
      {conPanel && (
        <PanelBuenasPracticas
          reglas={practicas}
          codigo={code}
          onCopiar={copyToClipboard}
        />
      )}
      {codigoAParte && (
        <CodigoColoreado codigo={code} className="blockly-code-area" />
      )}
    </div>
  )
})

export default BlocklyComponent
