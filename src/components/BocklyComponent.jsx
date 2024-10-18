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
import { toolboxDesafio2 } from '../toolbox/toolboxDesafio2'
import { toolboxDesafio3 } from '../toolbox/toolboxDesafio3'
import '../App.css'

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

const BlocklyComponent = ({ toolBoxDesafio }) => {
  const blocklyDiv = useRef(null)
  const workspaceRef = useRef(null) // Referencia al workspace
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)

  // Definir todos los toolboxes disponibles en un objeto
  const toolboxMap = {
    1: toolboxDesafio1,
    2: toolboxDesafio2,
    3: toolboxDesafio3
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
      trashcan: true
    })

    const initialBlock = workspaceRef.current.newBlock('ejecutar_una_vez')
    initialBlock.initSvg()
    initialBlock.render()
    initialBlock.moveBy(20, 20)
    initialBlock.setDeletable(false)

    const onWorkspaceChange = () => {
      // Recorre todos los bloques en el workspace
      workspaceRef.current.getAllBlocks().forEach(block => {
        // Verifica si el bloque no es del tipo 'ejecutar_una_vez'
        if (block.type !== 'ejecutar_una_vez') {
          if (
            block.type === 'procedures_defnoreturn' ||
            block.type === 'procedures_defreturn' ||
            block.type === 'procedures_callnoreturn'
          ) {
            block.setEnabled(true)
          } else {
            let parentBlock = block.getSurroundParent()
            let isInsideProcedure = false
            while (parentBlock) {
              if (
                parentBlock.type === 'procedures_defnoreturn' ||
                parentBlock.type === 'procedures_defreturn' ||
                parentBlock.type === 'ejecutar_una_vez'
              ) {
                isInsideProcedure = true
                break
              }
              parentBlock = parentBlock.getSurroundParent()
            }
            if (isInsideProcedure) {
              block.setEnabled(true)
            } else {
              block.setEnabled(false)
            }
          }
        }
      })

      // Genera el código para todo el workspace
      const generatedCode = desafio1Generator.workspaceToCode(
        workspaceRef.current
      )
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

  return (
    <div className="blockly-container">
      <div
        ref={blocklyDiv}
        className={showCode ? 'blockly-workspace' : 'blockly-workspace-full'}
      ></div>
      {showCode && (
        <textarea value={code} readOnly className="blockly-code-area" />
      )}
      <button
        onClick={() => setShowCode(!showCode)}
        className="blockly-toggle-button"
      >
        {showCode ? 'Ocultar Código' : 'Mostrar Código'}
      </button>
    </div>
  )
}

export default BlocklyComponent
