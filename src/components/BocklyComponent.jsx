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
        //si no es del tipo ejecutar una vez lo desahbilita
        if (block.type !== 'ejecutar_una_vez') {
          const parentBlock = block.getSurroundParent()
          if (!parentBlock || parentBlock.type !== 'ejecutar_una_vez') {
            block.setEnabled(false)
          } else {
            block.setEnabled(true)
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
