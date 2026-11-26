import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import PanelSimulador from './PanelSimulador'
import { escucharCodigo, leerCodigo } from './ventana'

/** La ventana emergente del simulador: el panel ocupa toda la ventana. */
const VentanaSimulador = () => {
  const { toolBox } = useParams()
  const [consulta] = useSearchParams()
  const titulo = consulta.get('titulo')
  const esquema = consulta.get('esquema')
  const [codigo, setCodigo] = useState(() => leerCodigo(toolBox))

  useEffect(() => escucharCodigo(toolBox, setCodigo), [toolBox])
  useEffect(() => {
    document.title = titulo
      ? `Simulador - ${titulo} - GrIDIE Blocks`
      : 'Simulador - GrIDIE Blocks'
  }, [titulo])

  return (
    <div className="flex h-screen w-screen flex-col bg-[#141414] p-2">
      <PanelSimulador
        toolBox={toolBox}
        codigo={codigo}
        titulo={titulo}
        esquema={esquema}
        enVentana
        onCerrar={() => window.close()}
      />
    </div>
  )
}

export default VentanaSimulador
