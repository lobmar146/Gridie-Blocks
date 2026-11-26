import * as Blockly from 'blockly/core'
import 'blockly/blocks'

// Botón "Crear comando" en el bloque "Definir" (como en Pilas Bloques):
// al tocarlo aparece, al lado de la definición, el bloque que llama a ese procedimiento.
// Funciona con mouse y con el dedo, porque es un campo del bloque que Blockly sabe cliquear.

const ANCHO = 132
const ALTO = 24
const COLOR = '#6b3f75'

// Ícono PlusCircledIcon de @radix-ui/react-icons (los mismos íconos que usa el resto de la app).
// Va copiado como dibujo porque el botón es una imagen dentro del bloque, no un componente de React.
const ICONO_RADIX_PLUS_CIRCLED =
  'M7.49991 0.876892C3.84222 0.876892 0.877075 3.84204 0.877075 7.49972C0.877075 11.1574 3.84222 14.1226 7.49991 14.1226C11.1576 14.1226 14.1227 11.1574 14.1227 7.49972C14.1227 3.84204 11.1576 0.876892 7.49991 0.876892ZM1.82707 7.49972C1.82707 4.36671 4.36689 1.82689 7.49991 1.82689C10.6329 1.82689 13.1727 4.36671 13.1727 7.49972C13.1727 10.6327 10.6329 13.1726 7.49991 13.1726C4.36689 13.1726 1.82707 10.6327 1.82707 7.49972ZM7.50003 4C7.77617 4 8.00003 4.22386 8.00003 4.5V7H10.5C10.7762 7 11 7.22386 11 7.5C11 7.77614 10.7762 8 10.5 8H8.00003V10.5C8.00003 10.7761 7.77617 11 7.50003 11C7.22389 11 7.00003 10.7761 7.00003 10.5V8H4.50003C4.22389 8 4.00003 7.77614 4.00003 7.5C4.00003 7.22386 4.22389 7 4.50003 7H7.00003V4.5C7.00003 4.22386 7.22389 4 7.50003 4Z'

// Pastilla blanca con el ícono y el texto "Crear comando".
const imagenBoton = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">` +
    `<rect x="0.5" y="0.5" width="${ANCHO - 1}" height="${ALTO - 1}" rx="${(ALTO - 1) / 2}" fill="#ffffff" stroke="${COLOR}" stroke-opacity="0.35"/>` +
    `<path transform="translate(7 3) scale(1.2)" d="${ICONO_RADIX_PLUS_CIRCLED}" fill="${COLOR}" fill-rule="evenodd" clip-rule="evenodd"/>` +
    `<text x="${(ANCHO + 24) / 2}" y="${ALTO / 2 + 1}" text-anchor="middle" dominant-baseline="middle" ` +
    `font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="13" font-weight="600" fill="${COLOR}">Crear comando</text>` +
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
