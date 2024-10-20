// src/App.jsx
import React from 'react'
import BlocklyComponent from './components/BocklyComponent'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import Desafio from './routes/Desafio'

import Home from './routes/Home'

const App = () => {
  return (
    <div className='App'>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route
          path='/Ejercicio1'
          element={
            <Desafio
              titulo='Ejercicio 1: Encender un Led'
              consigna={
                'Como primer paso deberemos encender un led. Ayudas a la placa Arduino a encender el led?'
              }
              toolBox='1'
            />
          }
        />
        <Route
          path='/Problema1'
          element={
            <Desafio
              titulo='Ejercicio1: Parpadear'
              consigna={
                'Ahora queremos que parpadee. Puedes ayudar a la placa Arduino a hacerlo?'
              }
              toolBox='2'
            />
          }
        />
                <Route
          path='/Ejercicio2'
          element={
            <Desafio
              titulo='Ejercicio 2: Encender el Semaforo'
              consigna={
                '¿Cómo hacemos para encender A-B-C en secuencia?'
              }
              toolBox='3'
            />
          }
        />
      </Routes>
    </div>
  )
}

export default App
