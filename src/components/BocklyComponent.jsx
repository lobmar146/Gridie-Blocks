import React, { useEffect, useRef, useState } from 'react'
import * as Blockly from 'blockly/core'
import 'blockly/blocks'
import { javascriptGenerator } from 'blockly/javascript'
import 'blockly/msg/es' // For localization if needed
import { forBlock } from '../generators/customGeneratos' // Import your custom generators
import { toolboxJS } from '../toolbox/toolbox'

// las cositas del desafio 1
import { blocksDesafio1 } from '../blocks/desafio1'
import { desafio1Generator } from '../generators/desafio1'
import { toolboxDesafio1 } from '../toolbox/toolboxDesafio1'

const BlocklyComponent = () => {
  const blocklyDiv = useRef(null)
  const toolbox = useRef(null)
  const [code, setCode] = useState('')

  useEffect(() => {
    // // Assign custom generators to Blockly.JavaScript
    // Object.assign(javascriptGenerator, forBlock)

    // Register the blocks and generator with Blockly
    Blockly.common.defineBlocks(blocksDesafio1)

    // Initialize Blockly workspace with the dark theme
    const workspace = Blockly.inject(blocklyDiv.current, {
      toolbox: toolboxDesafio1,
      theme: Blockly.Themes.Dark, // Apply the dark theme here
      locale: 'es' // Set the locale
    })

    const onWorkspaceChange = () => {
      const code = desafio1Generator.workspaceToCode(workspace) // Use the imported generator
      setCode(code)
    }
    workspace.addChangeListener(onWorkspaceChange)

    return () => {
      workspace.removeChangeListener(onWorkspaceChange)
      workspace.dispose()
    }
  }, [])

  return (
    <div style={{ display: 'flex' }}>
      <div ref={blocklyDiv} style={{ height: 480, width: 800 }}></div>
      <textarea
        value={code}
        readOnly
        style={{ height: 480, width: 600, marginLeft: 20 }}
      />
    </div>
  )
}

export default BlocklyComponent
