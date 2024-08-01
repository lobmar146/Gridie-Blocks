// src/App.jsx
import React from 'react'
import BlocklyComponent from '../components/BocklyComponent'
import '../App.css'
import { Link } from 'react-router-dom'

const App = ({ titulo, consigna, toolBox }) => {
  return (
    <div className='App'>
      <Link to='/'>Volver a los niveles</Link>
      <h1>{titulo}</h1>
      <p className='consigna'>{consigna}</p>
      <BlocklyComponent toolBoxDesafio={toolBox} />
    </div>
  )
}

export default App
