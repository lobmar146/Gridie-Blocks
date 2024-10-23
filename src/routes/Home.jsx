import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <section className="menu">
      <h1 className="centered">
        Bienvenido a{' '}
        <span className="logo">
          <span className="texto-verde">GrID</span>
          <span className="texto-rojo">IE</span>
        </span>{' '}
        Blocks Alfa!
      </h1>
      <h3 className="centered">
        Este proyecto es para probar las características de Blockly, rompamos
        juntos :
      </h3>
      {/* Clase 1 */}
      <section className="clase">
        <hr></hr>
        <h2>Clase 1: Secuencia y Procedimientos</h2>
        <hr></hr>
        <div className="flex-container">
          <Link to="/Ejercicio1" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/ejercicio1/led_encendido.png" alt="Imagen 1" />
            </div>
            <div className="card-nivel-bottom">
              <h3>Ejercicio 1: Encender un Led</h3>
            </div>
          </Link>
          <Link to="/Problema1" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/ejercicio1/led_apagado.png" alt="Imagen 2" />
            </div>
            <div className="card-nivel-bottom">
              <h3>Problema 1: Parpadear</h3>
            </div>
          </Link>
          <Link to="/Ejercicio2" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/desafio2/semaforo.png" alt="Imagen 2" />
            </div>

            <div className="card-nivel-bottom">
              <h3>Ejercicio 2: El Semaforo</h3>
            </div>
          </Link>
        </div>
      </section>

      {/* Clase 2 */}
      <section className="clase">
        <hr></hr>
        <h2>Clase 2: Repetitivas</h2>
        <hr></hr>
        <div className="flex-container">
          <Link to="/Ejercicio1Clase2" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/ejercicio1/led_encendido.png" alt="Imagen 1" />
            </div>
            <div className="card-nivel-bottom">
              <h3>Ejercicio 1: subir y bajar la luz del led</h3>
            </div>
          </Link>
          <Link to="/Ejercicio2Clase2" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/ejercicio1/led_encendido.png" alt="Imagen 1" />
            </div>
            <div className="card-nivel-bottom">
              <h3>Ejercicio 2: Intensidad del led con Repetitivas</h3>
            </div>
          </Link>
          <Link to="/Ejercicio2Clase2Variante" className="card-nivel">
            <div className="card-nivel-header">
              <img src="img/ejercicio1/led_encendido.png" alt="Imagen 1" />
            </div>
            <div className="card-nivel-bottom">
              <h3>Ejercicio 2: Repetitiva VARIANTE</h3>
            </div>
          </Link>
        </div>
      </section>
    </section>
  )
}

export default Home
