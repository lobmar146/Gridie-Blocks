import React from 'react'
import { Link } from 'react-router-dom'
import { UploadIcon } from '@radix-ui/react-icons'
import { useAbrirTrabajo } from '@/components/AbrirTrabajo'
import { LogoTextoUNLPAM } from '@/components/logo-texto-unlpam'
import { LogoUNLPAM } from '@/components/logo-unlpam'
import { LogoUPA } from '@/components/logo-upa'
import MarcaTerminado from '@/components/MarcaTerminado'
import { Button } from '@/components/ui/button'
import { useProgreso } from '@/lib/progreso'
import { EXTENSION } from '@/lib/trabajo'

const Home = () => {
  // Para abrir un trabajo guardado (por ejemplo, el profe con la entrega de un alumno):
  // lleva directo al desafío del archivo, con los bloques y los cables del alumno.
  const { elegirArchivo, elementos } = useAbrirTrabajo({ soltar: true })
  // Los desafíos que el alumno ya terminó en este navegador, con su mejor puntaje.
  const progreso = useProgreso()

  return (
    <section className="m-5 max-w-4xl rounded-lg border bg-[#202020] p-5 lg:mx-auto">
      <div className="flex items-baseline justify-center gap-5">
        <div className="flex gap-2">
          <LogoUNLPAM className="w-[100.95px]" />
          <LogoTextoUNLPAM className="hidden w-[219.04px] invert sm:inline-block" />
        </div>
        <div>
          <LogoUPA className="w-[125px]" />
        </div>
      </div>
      <h1 className="my-5 p-5 text-center text-3xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-5xl">
        ¡Bienvenido a{' '}
        <span className="logo">
          <span className="texto-verde">GrID</span>
          <span className="texto-rojo">IE</span>
        </span>{' '}
        Blocks!
      </h1>
      <div className="mb-5 flex flex-col items-center gap-1.5 text-center">
        <Button
          variant="secondary"
          className="bg-gray-800 text-gray-100 hover:bg-gray-700"
          onClick={elegirArchivo}
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          Abrir un trabajo guardado
        </Button>
        <p className="text-xs text-gray-400">
          Un archivo {EXTENSION} (también lo podés soltar arriba de esta página)
        </p>
        {elementos}
      </div>
      {/* Clase 1 */}
      <section>
        <h2 className="border-y p-5 text-2xl font-extrabold dark:text-white">
          Clase 1: Secuencia y Procedimientos
        </h2>
        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/Ejercicio1"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[1]} />
            <img
              src="img/ejercicio1/led_encendido.png"
              alt="Led encedido"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 1: Encender un Led</p>
          </Link>
          <Link
            to="/Problema1"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[2]} />
            <img
              src="img/ejercicio1/led_apagado.png"
              alt="Led parpadeando"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Problema 1: Parpadear</p>
          </Link>
          <Link
            to="/Ejercicio2"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[3]} />
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
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[4]} />
            <img
              src="img/ejercicio1/led_encendido.png"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Ejercicio 1: Parpadear 30 veces</p>
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
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[5]} />
            <img
              src="img/problema1Clase2/SOS.png"
              alt="Imagen 1"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Problema 1: Señal de SOS</p>
          </Link>
          <Link
            to="/Problema2Clase2"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[6]} />
            <img
              src="img/desafio2/semaforo.png"
              alt="Imagen 1"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Problema 2: Parpadear el Semaforo</p>
          </Link>
          <Link
            to="/Ejercicio2Clase2"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[7]} />
            <img
              src="img/ejercicio3Clase2/servo.svg"
              alt="Imagen 1"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 2: Servomotor</p>
          </Link>
          <Link
            to="/Problema3Clase2"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[8]} />
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
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[9]} />
            <img
              src="img/clase3/sensorPir.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Ejercicio 1: Detección de movimiento
            </p>
          </Link>
          <Link
            to="/Problema1Clase3"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[10]} />
            <img
              src="img/clase3/sensorPir.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Problema 1: Dejando de detectar movimiento...
            </p>
          </Link>
          <Link
            to="/Ejercicio2Clase3"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[11]} />
            <img
              src="img/clase3/sensorUltrasonico.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full object-contain"
            />
            <p className="font-semibold">Ejercicio 2: Sensando a distancias</p>
          </Link>
          <Link
            to="/Problema2Clase3"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[12]} />
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
          Clase 4: Pequeños Proyectos
        </h2>

        <div className="grid grid-cols-3 gap-4 py-5">
          <Link
            to="/DesafioHumedad"
            className="relative flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <MarcaTerminado progreso={progreso[14]} />
            <img
              src="img/clase3/sensorObstaculos.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">
              Desafío: Sistema de riego inteligente.
            </p>
          </Link>
          {/* <Link
            to="/DesafioClase4"
            className="flex transform flex-col rounded-lg border border-primary p-4 text-center transition-all duration-200 ease-in hover:scale-105"
          >
            <img
              src="img/clase3/sensorObstaculos.svg"
              alt="Led subir y bajar"
              className="mb-4 h-32 w-full rounded-full object-contain"
            />
            <p className="font-semibold">Desafío: Concept Card</p>
          </Link> */}
        </div>
      </section>
    </section>
  )
}

export default Home
