import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import {
  ChevronRightIcon,
  HomeIcon,
  UpdateIcon,
  UploadIcon
} from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import BlocklyComponent from '../components/BocklyComponent'

const App = ({ titulo, consigna, toolBox }) => {
  const [placas, setPlacas] = useState([])
  const [placaSeleccionada, setPlacaSeleccionada] = useState('')
  const [generatedCode, setGeneratedCode] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const consignaRef = useRef(null) // Referencia al div de la consigna
  const [blocklyHeight, setBlocklyHeight] = useState('82vh') // Altura dinámica de Blockly

  const cargarPlacas = async () => {
    try {
      const salida = await window.electronAPI.listarPlacas()
      const lineas = salida.trim().split('\n').slice(1) // Saltamos el header
      const datos = lineas.map(linea => {
        const partes = linea.trim().split(/\s{2,}/) // Divide por múltiples espacios
        return {
          puerto: partes[0],
          nombre: partes[2] || '',
          fqbn: partes[3] || ''
        }
      })
      setPlacas(datos)

      const placaGuardada = localStorage.getItem('placaSeleccionada')
      if (placaGuardada && datos.some(p => p.puerto === placaGuardada)) {
        setPlacaSeleccionada(placaGuardada)
      } else {
        setPlacaSeleccionada('')
        localStorage.removeItem('placaSeleccionada')
      }
    } catch (error) {
      console.error('Error al listar placas:', error)
    }
  }

  useEffect(() => {
    const updateBlocklyHeight = () => {
      if (consignaRef.current) {
        const consignaHeight = consignaRef.current.offsetHeight // Altura del div de la consigna
        const windowHeight = window.innerHeight // Altura de la ventana
        const remainingHeight = windowHeight - consignaHeight - 66 // Espacio restante
        setBlocklyHeight(`${remainingHeight}px`)
      }
    }

    updateBlocklyHeight() // Calcula la altura inicialmente

    cargarPlacas()
    window.addEventListener('resize', updateBlocklyHeight) // Recalcula en caso de cambio de tamaño

    return () => {
      window.removeEventListener('resize', updateBlocklyHeight) // Limpieza del evento
    }
  }, [])

  useEffect(() => {
    if (placaSeleccionada) {
      localStorage.setItem('placaSeleccionada', placaSeleccionada)
    }
  }, [placaSeleccionada])

  const handleCodeChange = code => {
    setGeneratedCode(code) // Actualiza el estado con el código generado
  }

  const subirCodigo = async () => {
    if (!placaSeleccionada) {
      toast.error('Por favor, selecciona una placa antes de subir el código.', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
      return
    }

    setIsUploading(true)

    try {
      const respuesta = await window.electronAPI.subirCodigo(
        placaSeleccionada,
        generatedCode
      )
      toast.success('Código subido exitosamente', {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
    } catch (error) {
      toast.error(`Error: al subir el código: ${error}`, {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
          fontSize: '20px'
        }
      })
      console.log('Error al subir el código:', error)
      alert(`Error: al subir el código`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      <div className="dark:bg-[#202020]">
        <header className="flex items-center justify-between px-5 py-2">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <h1 className="rounded-md bg-white px-[5px] py-[2px] font-bold">
                <span className="text-green-700">GrID</span>
                <span className="texto-rojo">IE</span>
              </h1>{' '}
            </Link>
            <div className="flex items-center text-gray-300">
              <Link to="/">
                <HomeIcon className="h-4 w-4" />
              </Link>
              <ChevronRightIcon className="mx-1 h-3 w-3" />
              <span className="text-sm">Blocks - {titulo}</span>
            </div>
          </div>
          {/* Right section: Board selection and upload */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="mr-1.5 text-xs text-gray-300">Placa:</span>
              <Select
                value={placaSeleccionada}
                onValueChange={setPlacaSeleccionada}
                onOpenChange={open => {
                  if (open) cargarPlacas()
                }}
              >
                <SelectTrigger className="h-8 w-[200px] border-gray-700 bg-gray-800 text-sm">
                  <SelectValue placeholder="Seleccionar placa" />
                </SelectTrigger>
                <SelectContent className="border-gray-700 bg-gray-800">
                  {placas.map((placa, idx) => (
                    <SelectItem key={idx} value={placa.puerto}>
                      {placa.nombre} ({placa.puerto})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="default"
              size="sm"
              className={`bg-green-600 text-white hover:bg-green-700 ${isUploading ? 'opacity-70' : ''}`}
              onClick={subirCodigo}
              disabled={isUploading}
            >
              <UploadIcon className="mr-1.5 h-3.5 w-3.5" />
              {isUploading ? 'Subiendo...' : 'Subir Código'}
            </Button>
          </div>
        </header>
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

      <BlocklyComponent
        toolBoxDesafio={toolBox}
        altura={blocklyHeight}
        onCodeChange={handleCodeChange}
      />
    </>
  )
}

export default App
