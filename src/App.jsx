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
                conexion="./img/conexiones/clase1/Eje1Cl1.svg"
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
                conexion="./img/conexiones/clase1/Eje1Cl1.svg"
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
                conexion="./img/conexiones/clase1/Eje2Cl1.svg"
              />
            }
          />
          <Route
            path="/Ejercicio1Clase2"
            element={
              <Desafio
                titulo="Ejercicio 1: Parpadear 30 veces"
                consigna={`### ✴️ Ejercicio 1: Parpadear 30 veces

¿Cómo hacemos para que el **LED parpadee 30 veces**?

🧠 **Objetivo:** Repetir una secuencia de encendido y apagado varias veces.

1. Encendé el LED y dejalo prendido por 1 segundo.
2. Apagalo durante 1 segundo.
3. Repetí esta secuencia **30 veces**. **SI, 30 VECES** 🤯.


🔁Esto de **Repetir** se hace un poco tedioso... ¿No habra una solución mejor 🤬?

💡 *¡Recordá que todo debe estar organizado usando **procedimientos**! Eso te va a permitir que tu código sea más legible y plantea tu estrategía de solución.*`}
                toolBox="4"
                conexion="./img/conexiones/clase1/Eje1Cl1.svg"
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
                conexion="./img/conexiones/clase1/Eje1Cl1.svg"
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
                conexion="./img/conexiones/clase1/Eje2Cl1.svg"
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
                conexion="./img/conexiones/clase2/Eje2Cl2.svg"
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
                conexion="./img/conexiones/clase2/Pro3Cl2.svg"
              />
            }
          />
          <Route
            path="/Ejercicio1Clase3"
            element={
              <Desafio
                titulo="Ejercicio 1: Detección de movimientos"
                consigna={`### 📡 Detectar movimiento con el Sensor PIR y encender LED  

Seguimos avanzando con **sensores** 😎. Esta vez vamos a usar el **sensor de movimiento PIR**.  

La idea es simple: cuando el sensor detecte un movimiento, vamos a **encender el LED conectado en el pin 13**.  

Para lograrlo, necesitaremos usar un nuevo tipo de bloque que nos permita **hacer preguntas** al sensor y tomar decisiones según su respuesta.  

🧠 **Objetivo:**  
Leer el estado de un **sensor de obstáculos PIR** y **encender un LED** cuando se detecte movimiento, usando la categoría **Alternativa condicional** y los bloques de **Sensores**.  

🔁 **Importante:**  
A partir de ahora, siempre que trabajemos con sensores vamos a programar dentro del bloque **Ejecutar por siempre**.  
De esa manera, el programa repetirá continuamente la acción y podrá “estar atento” todo el tiempo a lo que pasa alrededor.  
`}
                toolBox="9"
                conexion="./img/conexiones/clase3/Ej1Cl3.svg"
              />
            }
          />

          <Route
            path="/Problema1Clase3"
            element={
              <Desafio
                titulo="Problema 1: Dejando de detectar movimiento..."
                consigna={`### 📡 Dejando de detectar movimiento...  

Ya sabemos cómo **encender un LED cuando el sensor PIR detecta movimiento**.  
Ahora vamos a dar un paso más: cuando el sensor **deje de detectar movimiento**, el LED deberá **apagarse automáticamente**.  

De esta manera, el LED funcionará como una **luz de aviso**:  
- Si hay algo delante 👉 se enciende.  
- Si ya no hay nada 👉 se apaga.  

🧠 **Objetivo:**  
Leer continuamente el estado del **sensor de obstáculos IR** y:  
- **Encender el LED** en el pin 13 si detecta algo.  
- **Apagar el LED** cuando ya no lo detecte.  

🔁 **Importante:**  
Seguiremos programando dentro del bloque **Ejecutar por siempre**, porque necesitamos que el Arduino **chequee todo el tiempo** si aparece o desaparece un obstáculo.  

`}
                toolBox="10"
                conexion="./img/conexiones/clase3/Ej1Cl3.svg"
              />
            }
          />
          <Route
            path="/Ejercicio2Clase3"
            element={
              <Desafio
                titulo="Ejercicio 2: Sensando Distancias"
                consigna={`### 🦇 Ejercicio 2: Sensando Distancias 

¡Nuevo sensor y nuevo actuador!  
El **Sensor Ultrasónico 🦇** nos va a permitir detectar obstáculos a distintas distancias.  
El **parlante** nos permitirá emitir sonidos cuando lo deseemos... entonces, ¿cómo los combinamos?  

Para ir conociéndolos, te proponemos armar una pequeña **alarma** que suene de forma diferente según la distancia:  

- **Si hay un obstáculo muy cerca** (distancia entre **1 y 10 cm**), el parlante deberá **sonar cada 500 milisegundos**.  
- **Si hay un obstáculo cerca** (distancia entre **11 y 15 cm**), el parlante deberá **sonar cada 1000 milisegundos**.  
- **Si hay un obstáculo lejos** (distancia entre **16 y 100 cm**), el parlante deberá **no sonar**.  

🧠 **Objetivo:**  
Leer continuamente el estado del **sensor ultrasónico** y controlar el **parlante** para que funcione como una alarma, variando su comportamiento según la distancia del obstáculo.  

`}
                toolBox="11"
                conexion="./img/conexiones/clase3/Ej2Cl3.svg"
              />
            }
          />
          <Route
            path="/Problema2Clase3"
            element={
              <Desafio
                titulo="Problema 2: Sensor de estacionamiento."
                consigna={`### 🚗 🔊 Problema 2: Sensor de estacionamiento.  
Ya sabemos cómo utilizar el **Sensor Ultrasónico 🦇** y el **Parlante 🔊**. Si a esto le agregamos el **Semáforo 🚦**, podemos crear nuestro propio **Sensor de estacionamiento**, tal como usan los autos modernos.  

El objetivo es combinar el sensor para medir la distancia de un obstáculo, junto con el parlante y el semáforo, para dar **indicaciones visuales y sonoras** sobre qué tan cerca está el objeto.  

¿Te animás a armarlo siguiendo estas instrucciones?  

🚨 **Muy cerca de chocar (1–7 cm):**  
- Encender **las tres luces**.  
- Hacer sonar el parlante cada **0 ms** (sonido constante).  

🟡 **Distancia media (8–11 cm):**  
- Encender **luz amarilla y verde**.  
- Hacer sonar el parlante cada **300 ms**.  

🟢 **Próximo (13–20 cm):**  
- Encender **luz verde**.  
- Hacer sonar el parlante cada **600 ms**.  

⚪ **Lejos (21-100 cm):**  
- No encender ninguna luz.  
- El parlante debe permanecer **apagado**.  

`}
                toolBox="12"
                conexion="./img/conexiones/clase3/Pro3Cl3.svg"
              />
            }
          />
          <Route
            path="/DesafioClase4"
            element={
              <Desafio
                titulo="Desafío: Concept Card. "
                consigna={`### 💳 **Desafío: Concept Card**

¡Sorpresa! 🎉  
Ahora tenés **todos los bloques a tu disposición**.  
Tu tarea es **elegir cuidadosamente** aquellos que correspondan al proyecto que te fue asignado.  

Antes de empezar, **leé con atención la Concept Card** que te tocó y pensá en los siguientes puntos:

1.💡 **¿Qué hay que hacer?**  
   Identificá el objetivo principal del proyecto.  

2.🔍 **¿Qué sensores y actuadores participan?**  
   Analizá cuáles son los componentes necesarios y su función.  

3.⚙️ **¿Cómo se conectan en la placa?**  
   Revisá el esquema de conexión y los pines que utiliza cada componente.  

4.🧩 **Explorá la caja de herramientas**  
   Seleccioná los bloques que permitan reproducir el funcionamiento del proyecto.



`}
                toolBox="13"
              />
            }
          />
          <Route
            path="/DesafioHumedad"
            element={
              <Desafio
                titulo="Desafío: Sistema de riego inteligente."
                consigna={`### 🌱💧 **Desafío: Sistema de riego inteligente.**

¡Vamos a construir nuestro propio **sistema de riego inteligente**! Para eso, usaremos el **Sensor de Humedad en la Tierra** 🌱💧

Tu proyecto deberá funcionar de la siguiente manera:

1.🔴 **Humedad en la tierra baja.**  
   Cuando la humedad en la tierra sea baja, encendé la luz **roja** del semáforo.

2.🟡 **Humedad en la tierra media**  
   Cuando la humedad en la tierra sea media, encendé la luz **amarilla** del semáforo.

3.🟢 **Humedad en la tierra alta**  
   Cuando la humedad en la tierra sea alta, encendé la luz **verde** del semáforo.

➕**Extra:**  
Si querés sumar dificultad, hacé que suene la **alarma cada 1000 ms** cuando la humedad sea baja 🔊

`}
                toolBox="14"
                conexion="./img/conexiones/clase4/sensor_humedad_tierra.svg"
              />
            }
          />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
