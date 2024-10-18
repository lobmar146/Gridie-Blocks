import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="container">
      <h1 className="centered">Bienvenido a GridieBlocks Alfa!</h1>
      <h2 className="centered">
        Este proyecto es para probar las características de Blockly, rompamos
        juntos :
      </h2>

      <div className="flex-container">
        <Link to="/Ejercicio1" className="button">
          <div className="box">
            <img src="img/ejercicio1/led_encendido.png" alt="Imagen 1" />
            <h3>Ejercicio 1: Encender un Led</h3>
          </div>
        </Link>
        <Link to="/Problema1" className="button">
          <div className="box">
            <img src="img/ejercicio1/led_apagado.png" alt="Imagen 2" />
            <h3>Problema 1: Parpadear</h3>
          </div>
        </Link>
        <Link to="/Ejercicio2" className="button">
          <div className="box">
            <img src="/img/desafio2/semaforo.png" alt="Imagen 2" />
            <h3>Ejercicio 2: El Semaforo</h3>
          </div>
        </Link>
      </div>
    </div>
  )
}
export default Home
