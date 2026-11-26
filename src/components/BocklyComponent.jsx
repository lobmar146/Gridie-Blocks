import React, { useEffect, useRef, useState } from 'react'
import { CodeIcon, CopyIcon } from '@radix-ui/react-icons'
import * as Blockly from 'blockly/core'
import { Button } from '@/components/ui/button'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import 'blockly/msg/es'
import { blocksArduino } from '../blocks/blocksArduino'
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

const BlocklyComponent = ({
  toolBoxDesafio,
  altura,
  onCodeChange,
  compacto = false
}) => {
  const blocklyDiv = useRef(null)
  // En el celular los bloques arrancan más chicos; se lee al crear el área de trabajo.
  const compactoRef = useRef(compacto)
  compactoRef.current = compacto
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

    // Crear bloque raíz según etapa:
    // <9 => Ejecutar 1 vez | >=9 => Ejecutar por siempre
    const rootType =
      toolboxIndex >= 9 ? 'ejecutar_por_siempre' : 'ejecutar_una_vez'
    const initialBlock = workspaceRef.current.newBlock(rootType)
    initialBlock.initSvg()
    initialBlock.render()
    initialBlock.moveBy(10, 10)
    initialBlock.setDeletable(false)

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

    return () => {
      workspaceRef.current.removeChangeListener(onWorkspaceChange)
      workspaceRef.current.dispose()
    }
  }, [toolBoxDesafio]) // Se actualizará cada vez que cambie el prop 'toolBoxDesafio'

  useEffect(() => {
    if (workspaceRef.current) {
      Blockly.svgResize(workspaceRef.current)
    }
  }, [showCode])

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
}

export default BlocklyComponent
