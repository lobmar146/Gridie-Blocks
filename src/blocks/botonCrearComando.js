import * as Blockly from 'blockly/core'
import 'blockly/blocks'

// Botón "Crear comando" en el bloque "Definir" (como en Pilas Bloques):
// al tocarlo aparece, al lado de la definición, el bloque que llama a ese procedimiento.
// Funciona con mouse y con el dedo, porque es un campo del bloque que Blockly sabe cliquear.

const ANCHO = 112
const ALTO = 24

const imagenBoton = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">` +
    `<rect x="0.5" y="0.5" width="${ANCHO - 1}" height="${ALTO - 1}" rx="${(ALTO - 1) / 2}" fill="#ffffff" stroke="#6b3f75" stroke-opacity="0.35"/>` +
    `<text x="${ANCHO / 2}" y="${ALTO / 2 + 1}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="#6b3f75">Crear comando</text>` +
    `</svg>`
)}`

// ¿Hay algún bloque suelto con la esquina en (x, y)? Para no apilar los comandos uno encima del otro.
const lugarOcupado = (workspace, x, y) =>
  workspace.getTopBlocks(false).some(bloque => {
    const pos = bloque.getRelativeToSurfaceXY()
    return Math.abs(pos.x - x) < 20 && Math.abs(pos.y - y) < 20
  })

export const crearComando = definicion => {
  const workspace = definicion.workspace
  if (!workspace || definicion.isInFlyout || workspace.isFlyout) return null

  const nombre = definicion.getFieldValue('NAME')
  const grupoAnterior = Blockly.Events.getGroup()
  if (!grupoAnterior) Blockly.Events.setGroup(true) // Un solo paso para "deshacer"
  let llamada
  try {
    llamada = Blockly.serialization.blocks.append(
      {
        type: 'procedures_callnoreturn',
        extraState: { name: nombre, params: definicion.getVars() }
      },
      workspace
    )

    // Lo ubica a la derecha de la definición; si ahí no entra en pantalla (celular),
    // debajo. Y más abajo todavía si ya hay otro comando en ese lugar.
    const pos = definicion.getRelativeToSurfaceXY()
    const tamDef = definicion.getHeightWidth()
    let x = pos.x + tamDef.width + 30
    let y = pos.y
    const vista = workspace.rendered
      ? workspace.getMetricsManager().getViewMetrics(true)
      : null
    if (vista && x + llamada.getHeightWidth().width > vista.left + vista.width) {
      x = pos.x
      y = pos.y + tamDef.height + 24
    }
    while (lugarOcupado(workspace, x, y)) y += 64
    llamada.moveTo(new Blockly.utils.Coordinate(x, y))
  } finally {
    if (!grupoAnterior) Blockly.Events.setGroup(false)
  }

  if (workspace.rendered) {
    // Si quedó fuera de la vista (pantalla chica), la mueve para que se vea.
    const caja = llamada.getBoundingRectangle()
    if (workspace.scrollBoundsIntoView) workspace.scrollBoundsIntoView(caja)
  }
  return llamada
}

const iniciarOriginal = Blockly.Blocks['procedures_defnoreturn'].init
Blockly.Blocks['procedures_defnoreturn'].init = function () {
  iniciarOriginal.call(this)
  const boton = new Blockly.FieldImage(
    imagenBoton,
    ANCHO,
    ALTO,
    'Crear comando',
    campo => crearComando(campo.getSourceBlock())
  )
  boton.setTooltip?.('Crea el bloque para usar este procedimiento')
  this.inputList[0].appendField(boton, 'CREAR_COMANDO')
}
