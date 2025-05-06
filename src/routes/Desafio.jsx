import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
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
        className="mx-2 mb-2 mt-1 max-h-[130px] overflow-y-auto rounded-xl p-5 leading-relaxed text-white dark:bg-[#202020]"
      >
        <ReactMarkdown
          components={{
            ul: ({ children }) => (
              <ul className="list-inside list-disc">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-inside list-decimal">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-1">{children}</li>,
            h3: ({ node, children }) => {
              // Detectamos si es el primer nodo del árbol
              const isFirst = node?.position?.start?.line === 1
              const className = isFirst
                ? 'text-lg font-bold mb-2'
                : 'text-lg font-bold mt-5 mb-2'
              return <h3 className={className}>{children}</h3>
            },
            p: ({ children }) => <p className="mb-3">{children}</p>
          }}
        >
          {consigna}
        </ReactMarkdown>
      </div>

      <BlocklyComponent toolBoxDesafio={toolBox} altura={blocklyHeight} />
    </>
  )
}

export default App
