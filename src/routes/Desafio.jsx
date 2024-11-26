import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@radix-ui/react-icons'
import BlocklyComponent from '../components/BocklyComponent'

const App = ({ titulo, consigna, toolBox }) => {
  const consignaRef = useRef(null) // Referencia al div de la consigna
  const [blocklyHeight, setBlocklyHeight] = useState('82vh') // Altura dinámica de Blockly

  useEffect(() => {
    const updateBlocklyHeight = () => {
      if (consignaRef.current) {
        const consignaHeight = consignaRef.current.offsetHeight // Altura del div de la consigna
        const windowHeight = window.innerHeight // Altura de la ventana
        const remainingHeight = windowHeight - consignaHeight - 60 // Espacio restante
        setBlocklyHeight(`${remainingHeight}px`)
      }
    }

    updateBlocklyHeight() // Calcula la altura inicialmente
    window.addEventListener('resize', updateBlocklyHeight) // Recalcula en caso de cambio de tamaño

    return () => {
      window.removeEventListener('resize', updateBlocklyHeight) // Limpieza del evento
    }
  }, [])

  return (
    <>
      <div className="dark:bg-[#202020]">
        <div className="flex items-center justify-between px-5 py-2">
          <h1 className="rounded-[20px] bg-white px-[5px] py-[2px]">
            <span className="texto-verde">GrID</span>
            <span className="texto-rojo">IE</span>
          </h1>{' '}
          <div className="flex gap-1">
            <Link to="/">
              <HomeIcon className="h-6 w-6" />
            </Link>
            <ChevronRightIcon className="h-6 w-6" />
            <span>Blocks - {titulo}</span>
          </div>
          <Link to="/">Volver a los niveles</Link>
        </div>
      </div>

      <div
        ref={consignaRef}
        className="mx-2 mb-2 mt-1 rounded-xl p-5 dark:bg-[#202020]"
      >
        {consigna}
      </div>

      <BlocklyComponent toolBoxDesafio={toolBox} altura={blocklyHeight} />
    </>
  )
}

export default App
