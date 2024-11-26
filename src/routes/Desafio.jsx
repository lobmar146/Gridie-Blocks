// src/App.jsx
import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@radix-ui/react-icons'
import BlocklyComponent from '../components/BocklyComponent'

const App = ({ titulo, consigna, toolBox }) => {
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

      <div className="mx-2 mb-2 mt-1 rounded-xl p-5 dark:bg-[#202020]">
        {consigna}
      </div>
      <BlocklyComponent toolBoxDesafio={toolBox} />
    </>
  )
}

export default App
