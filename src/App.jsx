// src/App.jsx
import React from 'react'
import BlocklyComponent from './components/BocklyComponent'
import './App.css'
import { Toaster } from 'react-hot-toast'
import { Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Desafio from './routes/Desafio'
import Home from './routes/Home'

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Toaster />
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/Ejercicio1"
            element={
              <Desafio
                titulo="Ejercicio 1: Encender un Led"
                consigna={
                  'Como primer Programa para nuestra placa, encenderemos un LED. Para hacerlo, tendremos que Ejecutar 1 vez la primitiva "Encender Led conectado en Pin13. ¿Te animas a completar el desafío?'
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
                consigna={`Ahora queremos que el led Parpadee 1 vez. Para esto, deberemos:
                1)Encender el Led por un segundo. 2) Apagar el Led por un segundo. El problema esta en que no tenemos esas dos intrucciones... ¿Y si usamos procedimientos?.`}
                toolBox="2"
              />
            }
          />
          <Route
            path="/Ejercicio2"
            element={
              <Desafio
                titulo="Ejercicio 2: Encender el Semaforo"
                consigna={
                  'Ya sabemos hacer encender, apagar y parpadear un Led. Ahora, vamos a trabajar con varios a la vez. Conecta correctamente el semaforo y luego: ¿Cómo hacemos para encender A-B-C en secuencia? EXTRA: ¿Cómo hacemos para que Parpadee A, luego B y luego C?'
                }
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
                titulo="Ejercicio 2: Parpadeando con Repetitivas"
                consigna={
                  'Ahora, tenemos una nueva herramienta, se llaman Repetitivas. ¿Te animas a hacer parpadear el LED 5 veces utilizando las repetitivas? ¡Recorda que tenes que seguir usando procedimientos!'
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
                consigna={
                  '¿Te acordas del semaforo? ¡Volvio, en forma de repetitivas! ¿Cómo hacemos para hacer parpadear 3 veces A-C-E?'
                }
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
