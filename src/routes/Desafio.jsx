// src/App.jsx
import React from 'react'
import BlocklyComponent from '../components/BocklyComponent'
import '../App.css'

const App = ({ titulo, consigna, toolBox }) => {
  return (
    <div className='App'>
      <h1>{titulo}</h1>
      <p>{consigna}</p>
      <BlocklyComponent toolBoxDesafio={toolBox} />
    </div>
  )
}

export default App
