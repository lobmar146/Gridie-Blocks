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
import { borrarBloques, guardarBloques, leerBloques } from '@/lib/trabajo'
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

// Aviso para los comandos que quedan sueltos fuera de un procedimiento.
const AVISO_SIN_PROCEDIMIENTO =
  'Estos bloques deberían estar en un procedimiento. ¡No puede haber comandos sin procedimientos!'

const AVISO_NOMBRE_NO_SIGNIFICATIVO =
  'Este procedimiento no tiene un nombre significativo. Recordá cambiarle el nombre por uno significativo'

// Palabras que solas no dicen qué hace el procedimiento.
const NOMBRES_GENERICOS = new Set([
  'hacer algo', 'hacer', 'algo', 'cosa', 'cosas', 'hacer cosa', 'hacer cosas',
  'proc', 'procedimiento', 'procedimientos', 'comando', 'funcion', 'bloque',
  'nombre', 'nuevo', 'nueva', 'prueba', 'probar', 'test', 'hola', 'chau',
  'ejemplo', 'tarea', 'accion', 'paso', 'pasos', 'parte', 'programa'
])
// Tecleos al azar comunes.
const TECLEOS = ['asd', 'qwe', 'zxc', 'jkl', 'fgh', 'sdf', 'dfg', 'hjk']

// Decide si el nombre de un procedimiento no dice nada de lo que hace.
const nombreNoSignificativo = nombre => {
  const limpio = (nombre || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // sin tildes
    .replace(/[^a-zñ ]/g, ' ') // sin números ni signos
    .replace(/\s+/g, ' ')
    .trim()
  const letras = limpio.replace(/ /g, '')
  if (letras.length < 4) return true // "a", "p1", "abc"
  if (NOMBRES_GENERICOS.has(limpio)) return true // "Hacer algo 2", "prueba"
  if (/^(.)\1+$/.test(letras)) return true // "xxxx", "aaaa"
  if (!/[aeiou]/.test(letras)) return true // "sdfg", "prcd"
  if (TECLEOS.some(t => letras.includes(t))) return true // "asdasd", "qwerty"
  return false
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
  { toolBoxDesafio, altura, onCodeChange, compacto = false },
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

    const onWorkspaceChange = () => {
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

        // Aviso de Blockly (el triángulo) en la cabeza de cada pila suelta.
        const esCabezaSuelta = shouldDisableFloatingBlock && !block.getParent()
        if (esCabezaSuelta) block.setWarningText(AVISO_SIN_PROCEDIMIENTO)
        else if (block.type === 'procedures_defnoreturn')
          block.setWarningText(
            nombreNoSignificativo(block.getFieldValue('NAME'))
              ? AVISO_NOMBRE_NO_SIGNIFICATIVO
              : null
          )
        else if (block.getIcon(Blockly.icons.IconType.WARNING))
          block.setWarningText(null)
      })
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

  const codigoAParte = showCode && !compacto

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
        )}
        {showCode && compacto && (
          <textarea
            value={code}
            readOnly
            aria-label="Código generado"
            className="absolute inset-x-0 bottom-0 z-10 h-[45%] resize-none rounded-t-[10px] border-t border-gray-700 bg-[#1e1e1e] p-2.5 font-mono text-xs text-[#e0e0e0]"
          />
        )}
      </div>
      {codigoAParte && (
        <textarea value={code} readOnly className="blockly-code-area" />
      )}
    </div>
  )
})

export default BlocklyComponent
