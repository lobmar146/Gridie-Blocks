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
                consigna={`### 💡 Ejercicio 1: Encender un LED

Como primer programa para nuestra placa, vamos a **encender un LED**.

🧠 **Objetivo:** Ejecutar correctamente nuestra primer primitiva.

1. Usá el bloque **"Ejecutar 1 vez"** como estructura principal.
2. Dentro de él, colocá la primitiva **"Encender Led conectado en Pin 13"**.
3. Asegurate de que esté todo bien conectado antes de ejecutar.

🚀 *Este es el primer paso para aprender a progamar con robots. ¡Vamos con todo!*
`}
                toolBox="1"
              />
            }
          />
          <Route
            path="/Problema1"
            element={
              <Desafio
                titulo="Problema 1: Parpadear"
                consigna={`### ✴️ Problema 1: Parpadear

Ahora queremos que el **LED parpadee una vez**.

🧠 **Objetivo:** Hacer que el LED se encienda y apague con pausas de 1 segundo.

1. **Encendé** el LED durante **1 segundo**.
2. Luego, **apagalo** durante **1 segundo**.

😬 El problema es que **no tenemos** primtiivas como: **"Prender por un 1 segundo"** o **"Apagar por un segundo"**...

💡 ¿Y si usamos **procedimientos** para crear nuestras propias los primitivas?

✨ *Animate a resolverlo usando lo que aprendiste. ¡Estás cada vez más de crear tus propias primitivas 😎*
`}
                toolBox="2"
              />
            }
          />
          <Route
            path="/Ejercicio2"
            element={
              <Desafio
                titulo="Ejercicio 2: Encender el Semaforo"
                consigna={`### 🚦 Ejercicio 2: Encender el Semáforo

Ya sabés **encender**, **apagar** y **parpadear** un LED. Ahora vamos a trabajar con **varios LEDs a la vez**, como si fueran un semáforo.

🧠 **Objetivo:** Encender los LEDs A, B y C en orden.

1. Conectá correctamente el semáforo a tu placa.
2. Encendé los LEDs **A → B → C** en secuencia.
3. Asegurate de que se vean claramente los cambios.



### 🔁 Extra: Parpadeo Secuencial

¡Felicitaciones! Si llegaste hasta acá, ya sos una experta/experto en encender Leds 🎇

Te proponemos un desafío final: Hacé que **parpadee A**, luego **parpadee B**, y finalmente **parpadee C**.

💡 *Pensá cómo podrías reutilizar procedimientos o repetir patrones. ¡Este ejercicio pone a prueba tu creatividad!*
`}
                toolBox="3"
              />
            }
          />
          <Route
            path="/Ejercicio1Clase2"
            element={
              <Desafio
                titulo="Ejercicio 1: Parpadear 30 veces"
                consigna={`### ✴️ Ejercicio 1: Parpadear 5 veces

¿Cómo hacemos para que el **LED parpadee 5 veces**?

🧠 **Objetivo:** Repetir una secuencia de encendido y apagado varias veces.

1. Encendé el LED y dejalo prendido por 1 segundo.
2. Apagalo durante 1 segundo.
3. Repetí esta secuencia **30 veces**. **SI, 30 VECES** 🤯.


🔁Esto de **Repetir** se hace un poco tedioso... ¿No habra una solución mejor 🤬?

💡 *¡Recordá que todo debe estar organizado usando **procedimientos**! Eso te va a permitir que tu código sea más legible y plantea tu estrategía de solución.*`}
                toolBox="4"
              />
            }
          />
          {/* <Route
            path="/Ejercicio2Clase2"
            element={
              <Desafio
                titulo="Ejercicio 2: Parpadeando con Repetitivas"
                consigna={`### 🔁 Ejercicio 2: Parpadeando con Repetitivas

Ahora tenemos una nueva herramienta: las **repetitivas**.

🧠 **Objetivo:** Usar estructuras repetitivas junto con procedimientos para hacer parpadear un LED.

1. Usá el  **Repetir** para ejecutar un bloque varias veces.
2. Recordá seguir usando los **procedimiento** para el parpadeo (encender, esperar, apagar, esperar).
3. Repetí esta secuencia **30 veces**. SI, 30 VECES 🤯.


`}
                toolBox="5"
              />
            }
          /> */}
          <Route
            path="/Problema1Clase2"
            element={
              <Desafio
                titulo="Problema 1: Señal de S.O.S"
                consigna={`### 🚨 Problema 1: Señal de S.O.S

Vamos a recrear una **señal de auxilio clásica** con tu LED: la señal de **S.O.S**.

🧠 **Objetivo:** Usar temporizaciones y repeticiones para representar una secuencia con significado.

La señal está compuesta por:

- **3 parpadeos cortos** (duración: 300 milisegundos)
- **3 parpadeos largos** (duración: 1000 milisegundos)
- **3 parpadeos cortos** nuevamente

📏 Recordá:

- Parpadeo **corto** = 300 ms  
- Parpadeo **largo** = 1000 ms  

💡 *Usá **procedimientos** para no repetir bloques innecesariamente. Podés tener uno para parpadeo corto y otro para parpadeo largo.*

🚀 ¿Te animás a codificar un mensaje de auxilio visual?
`}
                toolBox="5"
              />
            }
          />
          <Route
            path="/Problema2Clase2"
            element={
              <Desafio
                titulo="Problema 2: Parpadear el Semaforo"
                consigna={`### 🚦 Problema: Parpadear el Semáforo

¿Te acordás del semáforo? ¡Volvió, en forma de **repetitivas**! 😄

🧠 **Objetivo:** Hacer parpadear cada luz del semáforo por separado, usando repeticiones.

1. Hacé que la luz **A** parpadee **3 veces**.
2. Luego, hacé que la luz **B** parpadee **3 veces**.
3. Finalmente, hacé que la luz **C** parpadee **3 veces**.

💡 *Recordá usar **procedimientos** para cada color, y repetitivas para no repetir bloques manualmente. ¡Animate a ordenar tu código como un profesional!*
`}
                toolBox="6"
              />
            }
          />
          <Route
            path="/Ejercicio2Clase2"
            element={
              <Desafio
                titulo="Ejercicio 2: Servo Motor"
                consigna={`### ⚙️ Ejercicio 2: Servomotor

¡Vamos a comenzar a trabajar con el **servomotor**!

🧠 **Objetivo:** Aprender a mover el servomotor a posiciones específicas.

1. Mové el servomotor a **180 grados**.
2. Luego, regresalo a **0 grados**.

🔎 *Recordá revisar las **primitivas disponibles** para controlar el servomotor.*`}
                toolBox="7"
              />
            }
          />
          <Route
            path="/Problema3Clase2"
            element={
              <Desafio
                titulo="Problema 3: La Barrera"
                consigna={`### 🚧 Problema 3: La Barrera

Ahora vamos a hacer una barrera, ¡como la de los trenes! 🚧🚅 Para esto, necesitás tener conectado el **semáforo** también.

🧠 **Objetivo:** Controlar el movimiento del servomotor y sincronizarlo con luces del semáforo.

1. Debés **subir la barrera a 90°** lentamente.
2. Luego, **bajarla a 0°** lentamente.
3. Mientras la barrera está **arriba**, debe encenderse la **luz verde** del semáforo.
4. Cuando la barrera está **abajo**, debe encenderse la **luz roja**.

💡 *Recordá usar **repetitivas** y **procedimientos** para organizar bien los pasos y movimientos.*

      `}
                toolBox="8"
              />
            }
          />
          <Route
            path="/Ejercicio1Clase3"
            element={
              <Desafio
                titulo="Ejercicio 1: Detección de obstaculos"
                consigna={`# 🚦 Detectar obstáculo con Sensor IR y encender LED

🧠 **Objetivo:**  
Leer el estado de un **sensor de obstáculo IR** y **encender un LED** cuando detecte algo delante, usando la nueva categoría **Alternativa condicional** y los bloques de **Sensores**.

🔁 **Importante:**  
**De ahora en más, deberás programar dentro del **Ejecutar por siempre** para que el programa repita continuamente la acción y pueda sensar todo el tiempo.

---

1. Usar una **alternativa condicional** para:  
   - **Si detecta un obstáculo** ➜ encender el LED.  

💡 *Recordá usar la categoría **Sensores** para leer el estado del IR y **Alternativa condicional** para tomar la decisión.*


      `}
                toolBox="9"
              />
            }
          />
        </Routes>
        
      </div>
    </ThemeProvider>
  )
}

export default App
