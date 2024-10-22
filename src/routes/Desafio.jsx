// src/App.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import BlocklyComponent from '../components/BocklyComponent'
import '../App.css'

const App = ({ titulo, consigna, toolBox }) => {
  return (
    <div className="App">
      <Link to="/">Volver a los niveles</Link>

      <h1>
        {' '}
        <span className="logo">
          <span className="texto-verde">GrID</span>
          <span className="texto-rojo">IE</span>
        </span>{' '}
        Blocks - {titulo}{' '}
      </h1>

      <p className="consigna">{consigna}</p>
      <BlocklyComponent toolBoxDesafio={toolBox} />
    </div>
  )
}

export default App
