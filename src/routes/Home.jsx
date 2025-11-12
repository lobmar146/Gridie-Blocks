import React from 'react'
import { Link } from 'react-router-dom'
import { LogoTextoUNLPAM } from '@/components/logo-texto-unlpam'
import { LogoUNLPAM } from '@/components/logo-unlpam'

const Home = () => {
  return (
    <section className="m-5 max-w-4xl rounded-lg border bg-[#202020] p-5 lg:mx-auto">
      <div className="flex items-baseline justify-center gap-5">
        <div className="flex gap-2">
          <LogoUNLPAM className="w-[100.95px]" />
          <LogoTextoUNLPAM className="hidden w-[219.04px] invert sm:inline-block" />
        </div>
        <div>
          <img
            src="./UPA.svg"
            alt="Logo Universidad Pública"
            className="w-[125px]"
          />
        </div>
      </div>
      <h1 className="my-5 p-5 text-center text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
        Bienvenido a{' '}
        <span className="logo">
          <span className="texto-verde">GrID</span>
          <span className="texto-rojo">IE</span>
        </span>{' '}
        Blocks Alfa!
      </h1>
      <h3 className="mb-5 text-center text-xl font-bold text-primary">
        Este proyecto es para probar las características de Blockly
      </h3>
      {/* Clase 1 */}
      <section>
        <h2 className="border-y p-5 text-2xl font-extrabold dark:text-white">
          Clase 1: Secuencia y Procedimientos
        </h2>
        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/Ejercicio1"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/ejercicio1/led_encendido.png"
              alt="Led encedido"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 1: Encender un Led</p>
          </Link>
          <Link
            to="/Problema1"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/ejercicio1/led_apagado.png"
              alt="Led parpadeando"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Problema 1: Parpadear</p>
          </Link>
          <Link
            to="/Ejercicio2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/desafio2/semaforo.png"
              alt="Semáforo con led"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 2: El Semaforo</p>
          </Link>
        </div>
      </section>

      {/* Clase 2 */}
      <section>
        <h2 className="border-y p-5 text-2xl font-extrabold dark:text-white">
          Clase 2: Repetitivas
        </h2>

        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/Ejercicio1Clase2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/ejercicio1/led_encendido.png"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Ejercicio 1: Parpadear 5 veces</p>
          </Link>
          {/* <Link
            to="/Ejercicio2Clase2"
            className="card-flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/ejercicio1/led_encendido.png"
              alt="Imagen 1"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Ejercicio 2: Parpadeando el LED con Repetitivas.
            </p>
          </Link> */}
          <Link
            to="/Problema1Clase2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/problema1Clase2/SOS.png"
              alt="Imagen 1"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Problema 1: Señal de SOS</p>
          </Link>
          <Link
            to="/Problema2Clase2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/desafio2/semaforo.png"
              alt="Imagen 1"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Problema 2: Parpadear el Semaforo</p>
          </Link>
          <Link
            to="/Ejercicio2Clase2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/ejercicio3Clase2/servo.svg"
              alt="Imagen 1"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 2: Servomotor</p>
          </Link>
          <Link
            to="/Problema3Clase2"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/problema3Clase2/barrera.gif"
              alt="Imagen 1"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Problema 3: La barrera</p>
          </Link>
        </div>
      </section>
      {/* Clase 3 */}
      <section>
        <h2 className="border-y p-5 text-2xl font-extrabold dark:text-white">
          Clase 3: Alternativa Condicional
        </h2>

        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/Ejercicio1Clase3"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorObstaculos.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Ejercicio 1: Detección de obstaculos
            </p>
          </Link>
          <Link
            to="/Problema1Clase3"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorObstaculos.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Problema 1: Dejando de detectar obstaculos...
            </p>
          </Link>
          <Link
            to="/Ejercicio2Clase3"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorUltrasonico.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 2: Sensando a distancias</p>
          </Link>
          <Link
            to="/Problema2Clase3"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorUltrasonico.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">
              Problema 2: Sensor de estacionamiento.
            </p>
          </Link>
        </div>
      </section>

      {/* Clase 3 */}
      <section>
        <h2 className="border-y p-5 text-2xl font-extrabold dark:text-white">
          Clase 4: Concept Cards
        </h2>

        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/DesafioClase4"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorObstaculos.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Desafío: Concept Card</p>
          </Link>
        </div>
      </section>
    </section>
  )
}

export default Home
