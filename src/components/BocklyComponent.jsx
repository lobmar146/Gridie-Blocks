import React, { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import 'blockly/msg/es'
import { blocksDesafio1 } from '../blocks/desafio1'
import { forBlock } from '../generators/customGeneratos'
import { desafio1Generator } from '../generators/desafio1'
import { toolboxJS } from '../toolbox/toolbox'
import { toolboxDesafio1 } from '../toolbox/toolboxDesafio1'
import { toolboxDesafio1Clase2 } from '../toolbox/toolboxDesafio1Clase2'
import { toolboxDesafio2 } from '../toolbox/toolboxDesafio2'
import { toolboxDesafio2Clase2 } from '../toolbox/toolboxDesafio2Clase2'
import { toolboxDesafio3 } from '../toolbox/toolboxDesafio3'
import '../App.css'
import toast from 'react-hot-toast'
import { toolboxDesafio3Clase2 } from '@/toolbox/toolboxDesafio3Clase2'
import { toolboxDesafio4Clase2 } from '../toolbox/toolboxDesafio4Clase2'

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
Blockly.common.defineBlocks(blocksDesafio1)

const BlocklyComponent = ({ toolBoxDesafio, altura }) => {
  const blocklyDiv = useRef(null)
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
    7: toolboxDesafio4Clase2
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
    // Acceder dinámicamente al toolbox según el prop
    const selectedToolbox = toolboxMap[toolBoxDesafio] || toolboxDesafio1 // Default toolbox in case of no match

    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      renderer: 'zelos',
      toolbox: selectedToolbox,
      theme: darkTheme,
      locale: 'es',
      scrollbars: true,
      zoom: {
        controls: true,
        wheel: false,
        startScale: 1.0,
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

    const initialBlock = workspaceRef.current.newBlock('ejecutar_una_vez')
    initialBlock.initSvg()
    initialBlock.render()
    initialBlock.moveBy(10, 10)
    initialBlock.setDeletable(false)

    const onWorkspaceChange = () => {
      const allBlocks = workspaceRef.current.getAllBlocks()
      let shouldDisableAll = false

      // Determinar si todos los bloques deben deshabilitarse
      allBlocks.forEach(block => {
        const isInsideEjecutarUnaVez =
          block.getSurroundParent()?.type === 'ejecutar_una_vez'
        if (toolBoxDesafio !== '1' && isInsideEjecutarUnaVez) {
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
      })

      // Mostrar la alerta solo una vez cuando se deshabilitan todos los bloques
      if (shouldDisableAll && !alertShownRef.current) {
        toast(
          `Recuerda: 
          \nEn el bloque 'Ejecutar 1 vez 'solo puedes incluir procedimientos. \n\n ¡Planifica tu estrategia de solución con cuidado para asegurar el éxito de tu programa!.`,
          {
            icon: '❗',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
              fontSize: '20px'
            }
          }
        )
        alertShownRef.current = true // Actualizar ref para que la alerta no se muestre de nuevo
      } else if (!shouldDisableAll && alertShownRef.current) {
        alertShownRef.current = false // Restablecer para permitir futuras alertas
      }

      // Generar y mostrar código
      const generatedCode = shouldDisableAll
        ? `Recuerda: En el bloque \n'Ejecutar 1 vez 'solo puedes incluir\nprocedimientos. \n\n ¡Planifica tu estrategia de solución con cuidado para asegurar el éxito de tu programa!.`
        : desafio1Generator.workspaceToCode(workspaceRef.current)
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
          'Código copiado al portapapeles. Recorda pegarlo en el Arduino IDE y subirlo a la placa.',
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

  return (
    <div className="blockly-container" style={{ height: altura }}>
      <div
        ref={blocklyDiv}
        className={showCode ? 'blockly-workspace' : 'blockly-workspace-full'}
      >
        {/* {parseInt(toolBoxDesafio) > 6 && (
          <div
            className={
              showCode
                ? 'monitor-variable mostrando-codigo'
                : 'monitor-variable'
            }
          >
            <p>Grados del Servo</p>
            <span>1</span>
          </div>
        )} */}
        <button
          onClick={copyToClipboard}
          className={
            showCode ? 'monitor-variable mostrando-codigo' : 'monitor-variable'
          }
          style={{ top: '70px' }}
        >
          Copiar Código
        </button>
        <button
          onClick={() => setShowCode(!showCode)}
          className="blockly-toggle-button"
        >
          {showCode ? 'Ocultar Código' : 'Mostrar Código'}
        </button>
      </div>
      {showCode && (
        <textarea value={code} readOnly className="blockly-code-area" />
      )}
    </div>
  )
}

export default BlocklyComponent
