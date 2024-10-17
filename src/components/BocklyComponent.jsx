import React, { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import 'blockly/msg/es'
import { forBlock } from '../generators/customGeneratos'
import { toolboxJS } from '../toolbox/toolbox'
import { blocksDesafio1 } from '../blocks/desafio1'
import { desafio1Generator } from '../generators/desafio1'
import { toolboxDesafio1 } from '../toolbox/toolboxDesafio1'
import { toolboxDesafio2 } from '../toolbox/toolboxDesafio2'
import '../App.css'

// Sobrescribe los mensajes de los bloques de procedimientos
// Sobrescribe los mensajes de los bloques de procedimientos
Blockly.Msg['PROCEDURES_DEFNORETURN_TITLE'] = 'Definir' // Título del procedimiento por defecto
Blockly.Msg['PROCEDURES_DEFNORETURN_DO'] = 'hacer'
Blockly.Msg['PROCEDURES_DEFNORETURN_PROCEDURE'] = 'Hacer algo' // Nombre predeterminado del procedimiento
Blockly.Msg['PROCEDURES_CALLNORETURN_TITLE'] = 'llamar a %1' // Título de "call no return"
Blockly.Msg['PROCEDURES_DEFNORETURN_TOOLTIP'] =
  'Define un procedimiento sin retorno.'
Blockly.Msg['PROCEDURES_CALLNORETURN_TOOLTIP'] =
  'Llama a un procedimiento definido por el usuario sin retorno.'

// Ocultar los bloques de procedimientos con retorno
Blockly.Blocks['procedures_defreturn'] = null // Deshabilita el bloque de procedimientos con retorno
Blockly.Blocks['procedures_callreturn'] = null // Deshabilita el bloque de llamada a procedimientos con retorno
Blockly.Blocks['procedures_ifreturn'] = null // Deshabilita el bloque "if [] return"

// Define los bloques una vez fuera del componente
Blockly.common.defineBlocks(blocksDesafio1)

const BlocklyComponent = ({ toolBoxDesafio }) => {
  const blocklyDiv = useRef(null)
  const toolbox = useRef(null)
  const workspaceRef = useRef(null) // Referencia al workspace
  const [code, setCode] = useState('')
  const [showCode, setShowCode] = useState(false)

  useEffect(() => {
    workspaceRef.current = Blockly.inject(blocklyDiv.current, {
      toolbox: toolBoxDesafio === '1' ? toolboxDesafio1 : toolboxDesafio2,
      theme: Blockly.Themes.Dark,
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
          // Excepciones: No deshabilitar bloques de procedimientos
          if (
            block.type === 'procedures_defnoreturn' ||
            block.type === 'procedures_defreturn' ||
            block.type === 'procedures_callnoreturn'
          ) {
            // Si es un bloque de procedimiento, mantenerlo habilitado
            block.setEnabled(true)
          } else {
            // Revisa si el bloque está dentro de un procedimiento o de 'ejecutar_una_vez'
            let parentBlock = block.getSurroundParent()
            let isInsideProcedure = false

            // Busca si el bloque tiene un padre que sea un procedimiento
            while (parentBlock) {
              if (
                parentBlock.type === 'procedures_defnoreturn' ||
                parentBlock.type === 'procedures_defreturn' ||
                parentBlock.type === 'ejecutar_una_vez'
              ) {
                isInsideProcedure = true
                break
              }
              parentBlock = parentBlock.getSurroundParent() // Sigue subiendo en la jerarquía de bloques
            }

            // Habilita los bloques que estén dentro de un procedimiento o 'ejecutar_una_vez'
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
  }, [toolBoxDesafio])

  useEffect(() => {
    if (workspaceRef.current) {
      Blockly.svgResize(workspaceRef.current)
    }
  }, [showCode])

  return (
    <div className='blockly-container'>
      <div
        ref={blocklyDiv}
        className={showCode ? 'blockly-workspace' : 'blockly-workspace-full'}
      ></div>
      {showCode && (
        <textarea value={code} readOnly className='blockly-code-area' />
      )}
      <button
        onClick={() => setShowCode(!showCode)}
        className='blockly-toggle-button'
      >
        {showCode ? 'Ocultar Código' : 'Mostrar Código'}
      </button>
    </div>
  )
}

export default BlocklyComponent
