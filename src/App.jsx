// src/App.jsx
import React from 'react'
import BlocklyComponent from './components/BocklyComponent'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Desafio from './routes/Desafio'
import Home from './routes/Home'

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/Ejercicio1"
            element={
              <Desafio
                titulo="Ejercicio 1: Encender un Led"
                consigna={
                  'Como primer paso deberemos encender un led. Ayudas a la placa Arduino a encender el led?'
                }
                toolBox="1"
              />
            }
          />
          <Route
            path="/Problema1"
            element={
              <Desafio
                titulo="Ejercicio1: Parpadear"
                consigna={
                  'Ahora queremos que parpadee. Puedes ayudar a la placa Arduino a hacerlo?'
                }
                toolBox="2"
              />
            }
          />
          <Route
            path="/Ejercicio2"
            element={
              <Desafio
                titulo="Ejercicio 2: Encender el Semaforo"
                consigna={'¿Cómo hacemos para encender A-B-C en secuencia?'}
                toolBox="3"
              />
            }
          />
          <Route
            path="/Ejercicio1Clase2"
            element={
              <Desafio
                titulo="Ejercicio 1: Parpadear 5 veces"
                consigna={'¿Cómo hacemos para hacer parpadear el LED 5 veces? '}
                toolBox="4"
              />
            }
          />
          <Route
            path="/Ejercicio2Clase2"
            element={
              <Desafio
                titulo="Ejercicio 2: Parpeando con Repetitivas"
                consigna={
                  '¿Cómo hacemos para subir y bajar gradualmente la luz del LED usando repetitivas?'
                }
                toolBox="5"
              />
            }
          />
          <Route
            path="/Problema1Clase2"
            element={
              <Desafio
                titulo="Problema 1: Señal de S.O.S"
                consigna={
                  'La señal de S.O.S, esta compuesta por 3 parpadeos cortos , luego 3 parpadeos largos y nuevamente 3 parpadeos cortos. Los parpadeos largos duran 1000 milisegundos y los parpardeos cortos 300 milisegundos. ¿Te animas a recrear la señal de S.O.S en el LED conectado al Pin 13?'
                }
                toolBox="6"
              />
            }
          />
          <Route
            path="/Problema2Clase2"
            element={
              <Desafio
                titulo="Problema 1: Parpadear el Semaforo"
                consigna={'¿Cómo hacemos para hacer parpadear 3 veces A-C-E?'}
                toolBox="7"
              />
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
