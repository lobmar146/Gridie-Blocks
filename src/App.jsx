// src/App.jsx
import React from 'react'
import BlocklyComponent from './components/BocklyComponent'
import './App.css'

const App = () => {
  return (
    <div className='App'>
      <h1>Blockly with React and Vite</h1>
      <BlocklyComponent />
    </div>
  )
}

export default App
