import React from 'react'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className='container'>
      <h1 className='centered'>Bienvenido a GridieBlocks Alfa!</h1>
      <h2 className='centered'>
        Este proyecto es para probar las características de Blockly, rompamos
        juntos :
      </h2>

      <div className='flex-container'>
        <Link to='/Desafio1' className='button'>
          <div className='box'>
            <img
              src='https://cdn-icons-png.flaticon.com/512/2534/2534928.png'
              alt='Imagen 1'
            />
            <h3>Desafío 1: Encender un Led</h3>
          </div>
        </Link>
        <Link to='/Desafio2' className='button'>
          <div className='box'>
            <img
              src='https://cdn-icons-png.flaticon.com/512/2338/2338838.png'
              alt='Imagen 2'
            />
            <h3>Desafío 2: Parpadear</h3>
          </div>
        </Link>
      </div>
    </div>
  )
}
export default Home
