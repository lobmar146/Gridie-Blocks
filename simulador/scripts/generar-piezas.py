# Genera las piezas propias de GrIDIE para ORBE en simulador/piezas/: los módulos de los
# esquemas de conexión de las clases que ORBE no trae (semáforo, sensor ultrasónico HC-SR04,
# sensor PIR HC-SR501, sensor de obstáculos FC-51 y sensor de humedad FC-28).
#
# Cada módulo es una pieza compuesta de ORBE: un modelo 3D propio (el GLB que escribe este
# script) más piezas del catálogo de ORBE que hacen la parte eléctrica (LEDs, resistencias,
# pulsadores y trimmers). Lo que ORBE no simula, como el eco del ultrasónico o el calor que
# ve el PIR, lo hace una pieza escondida dentro del modelo que el panel del simulador maneja.
#
#   python3 simulador/scripts/generar-piezas.py
#
# Después: cd simulador && npm run build (copia las piezas a public/simulador/parts).
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from glb import Malla, escribir_glb  # noqa: E402

DESTINO = os.path.join(os.path.dirname(__file__), '..', 'piezas')

USOS = {
    'led-5mm': '0.3.1',
    'led-5mm-yellow': '0.1.1',
    'led-5mm-green': '0.1.1',
    'led-0805': '0.2.1',
    'resistor-0603': '0.2.0',
    'pin-header-1x3': '0.1.0',
    'pin-header-1x4': '0.1.0',
    'trimmer-3362p': '0.2.2',
    'tactile-switch-smd': '0.2.0',
}

MATERIALES = {
    'pcb_azul': {'color': '#1d4e9e', 'rugosidad': 0.55},
    'pcb_azul_oscuro': {'color': '#15265a', 'rugosidad': 0.55},
    'pcb_verde': {'color': '#1f6b34', 'rugosidad': 0.55},
    'pcb_negro': {'color': '#151515', 'rugosidad': 0.55},
    'plastico_negro': {'color': '#1b1b1b', 'rugosidad': 0.6},
    'plastico_gris': {'color': '#2c2c2c', 'rugosidad': 0.5},
    'plastico_blanco': {'color': '#f2f0e8', 'rugosidad': 0.35},
    'lente': {'color': '#fbfaf4', 'rugosidad': 0.25},
    'metal': {'color': '#c9ccd1', 'metal': 1, 'rugosidad': 0.3},
    'malla': {'color': '#5a5e63', 'metal': 0.6, 'rugosidad': 0.7},
    'estano': {'color': '#d4d7da', 'metal': 1, 'rugosidad': 0.35},
    'oro': {'color': '#d8a640', 'metal': 1, 'rugosidad': 0.3},
    'chip': {'color': '#202020', 'rugosidad': 0.45},
    'trimmer_azul': {'color': '#2a5fd6', 'rugosidad': 0.4},
    'trimmer_naranja': {'color': '#e08a2a', 'rugosidad': 0.4},
    'cable_rojo': {'color': '#c42020', 'rugosidad': 0.5},
    'cable_negro': {'color': '#111111', 'rugosidad': 0.5},
    'led_transparente': {'color': '#e8eef5', 'rugosidad': 0.15, 'opacidad': 0.85},
    'led_negro': {'color': '#0b0b0b', 'rugosidad': 0.2},
    'serigrafia': {'color': '#f4f4f4', 'rugosidad': 0.6},
}

COMUN = {
    'format': 1,
    'license': 'MIT',
    'docs': {'GrIDIE Blocks, esquemas de conexión de las clases': None},
}


def materiales_de(malla_nodos):
    usados = set()
    for _, m, _ in malla_nodos:
        usados |= set(m.grupos)
    return {k: v for k, v in MATERIALES.items() if k in usados}


def guardar(id_pieza, parte, nodos, comentario):
    carpeta = os.path.join(DESTINO, id_pieza)
    os.makedirs(carpeta, exist_ok=True)
    escribir_glb(os.path.join(carpeta, f'{id_pieza}.glb'), materiales_de(nodos), nodos)
    datos = {'format': 1, 'part': id_pieza, **{k: v for k, v in parte.items()}}
    datos.update({k: v for k, v in COMUN.items() if k not in datos})
    datos['uses'] = {p: USOS[p] for p in sorted({x['type'] for x in parte['parts'].values()})}
    orden = ['format', 'part', 'version', 'title', 'summary', 'tags', 'license', 'docs', 'real',
             'uses', 'parts', 'wires', 'layout', 'pins', 'not_simulated']
    datos = {k: datos[k] for k in orden if k in datos}
    texto = '\n'.join(f'// {l}' if l else '//' for l in comentario.strip().split('\n'))
    with open(os.path.join(carpeta, 'part.jsonc'), 'w') as f:
        f.write(texto + '\n' + json.dumps(datos, indent=2, ensure_ascii=False) + '\n')
    print('pieza', id_pieza)


def traza(a, b):
    return [a, b, {'kind': 'trace'}]


def real_generico(numero):
    return {'generic': True, 'maker': None, 'number': numero,
            'datasheet': 'GrIDIE Blocks, esquemas de conexión de las clases'}


# ---- Semáforo ------------------------------------------------------------------------------
# El módulo de semáforo del kit: una caja negra acostada con las tres luces hacia arriba (la
# roja al fondo, +Y) y un conector de 4 pines arriba, adelante, con los pines hacia arriba para
# cables hembra: R, A (amarillo), V y GND. Cada LED tiene su resistencia de 220 ohm adentro de
# la caja, como el módulo real.
def semaforo():
    m = Malla()
    ancho, largo, alto = 24.0, 70.0, 32.0
    m.caja('plastico_negro', (-ancho / 2, 0, 0), (ancho / 2, largo, alto))
    m.caja('plastico_gris', (-ancho / 2 + 1, 13, alto), (ancho / 2 - 1, largo - 1, alto + 0.6))
    for y in LUCES_SEMAFORO.values():
        m.anillo('plastico_negro', (0, y, alto + 0.62), 6.4, 3.0)
        # Visera del lado de atrás de cada luz.
        m.caja('plastico_negro', (-7.5, y + 6.2, alto), (7.5, y + 7.2, alto + 7.5))
        m.caja('plastico_negro', (-7.6, y - 3, alto), (-6.6, y + 7.2, alto + 7.5))
        m.caja('plastico_negro', (6.6, y - 3, alto), (7.6, y + 7.2, alto + 7.5))
    # Las letras de los pines: una marquita blanca al lado de cada uno.
    for k in range(4):
        x = -3.81 + 2.54 * k
        m.caja('serigrafia', (x - 0.5, 7.5, alto), (x + 0.5, 9.5, alto + 0.05))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x4'},
        'rojo': {'type': 'led-5mm'},
        'amarillo': {'type': 'led-5mm-yellow'},
        'verde': {'type': 'led-5mm-green'},
    }
    layout = {'hdr': {'at': [0, 5, alto + 2.54], 'rotate': [180, 0, 0]}}
    wires = []
    for i, (luz, y) in enumerate(LUCES_SEMAFORO.items()):
        parts[f'r_{luz}'] = {'type': 'resistor-0603', 'resistance': '220'}
        # El LED parado con la cúpula afuera de la caja y las patas adentro.
        layout[luz] = {'at': [0, y, alto - 4]}
        layout[f'r_{luz}'] = {'at': [8, y, 10]}
        wires += [traza(f'hdr.{i + 1}', f'r_{luz}.a'), traza(f'r_{luz}.b', f'{luz}.anode'),
                  traza(f'{luz}.cathode', 'hdr.4')]
    guardar('gridie-semaforo', {
        'version': '0.1.0',
        'title': 'Módulo semáforo',
        'summary': 'Semáforo de tres luces (roja, amarilla y verde) con su resistencia de 220 ohm cada una y un conector de 4 pines: R, A, V y GND.',
        'tags': ['led', 'semaforo', 'modulo', 'gridie'],
        'real': real_generico('Semáforo LED'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'R': 'hdr.1', 'A': 'hdr.2', 'V': 'hdr.3', 'GND': 'hdr.4'},
        'not_simulated': [{'what': 'la caja', 'why': 'Es el dibujo del semáforo de los esquemas de GrIDIE; lo eléctrico son los tres LEDs y sus resistencias.'}],
    }, nodos, """
Módulo semáforo de los esquemas de GrIDIE Blocks (Clase 1 y 2): tres LEDs con su
resistencia y un conector R, A, V, GND. Generado por simulador/scripts/generar-piezas.py.""")


LUCES_SEMAFORO = {'rojo': 56.0, 'amarillo': 38.0, 'verde': 20.0}


# ---- Sensor ultrasónico HC-SR04 -----------------------------------------------------------
# Parado sobre la protoboard, con los dos "ojos" al frente (-Y) y los pines VCC, Trig, Echo y
# GND hacia abajo. ORBE no simula el eco: el trimmer escondido en el ojo izquierdo da una
# tensión proporcional a la distancia en el pin DIST, que la escena lleva a A1 (ver
# src/simulador/codigoSimulador.js).
def hc_sr04():
    m = Malla()
    pcb_y = (0.0, 1.6)
    m.caja('pcb_azul', (-22.5, pcb_y[0], 3.0), (22.5, pcb_y[1], 23.0))
    for x in (-13.0, 13.0):
        m.cilindro('metal', (x, 0, 13), 8.0, 12.0, '-y', lados=40)
        m.disco('malla', (x, -12.05, 13), 6.6, '-y', lados=40)
        m.anillo('plastico_negro', (x, -12.06, 13), 6.9, 6.6, '-y', lados=40)
    # Cristal y un integrado de cada lado.
    m.cilindro('metal', (-4.0, 0, 20.3), 1.6, 3.4, '-y', lados=16)
    m.cilindro('metal', (4.0, 0, 20.3), 1.6, 3.4, '-y', lados=16)
    m.caja('metal', (-4.0, -3.4, 18.7), (4.0, 0, 21.9))
    m.caja('chip', (-5, pcb_y[1], 8), (5, pcb_y[1] + 1.5, 15))
    m.caja('chip', (-17, pcb_y[1], 6), (-9, pcb_y[1] + 1.5, 12))
    m.caja('chip', (9, pcb_y[1], 6), (17, pcb_y[1] + 1.5, 12))
    # Etiquetas de los pines: una marquita blanca sobre cada uno.
    for k in range(4):
        x = -3.81 + 2.54 * k
        m.caja('serigrafia', (x - 0.5, -0.05, 4.2), (x + 0.5, 0, 6.6))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x4'},
        'eco': {'type': 'trimmer-3362p', 'resistance': '10k', 'position': 0.6},
    }
    layout = {
        'hdr': {'at': [0, 0.8, 0]},
        # Adentro del ojo izquierdo, con las patas hacia la plaqueta.
        'eco': {'at': [-13, -4.5, 13], 'rotate': [90, 0, 0]},
    }
    wires = [traza('eco.a', 'hdr.4'), traza('eco.b', 'hdr.1')]
    guardar('gridie-hc-sr04', {
        'version': '0.1.0',
        'title': 'Sensor ultrasónico HC-SR04',
        'summary': 'Sensor de distancia por ultrasonido con pines VCC, Trig, Echo y GND. En el simulador la distancia sale como tensión en el pin DIST.',
        'tags': ['sensor', 'ultrasonico', 'distancia', 'hc-sr04', 'gridie'],
        'real': real_generico('HC-SR04'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'VCC': 'hdr.1', 'Trig': 'hdr.2', 'Echo': 'hdr.3', 'GND': 'hdr.4', 'DIST': 'eco.wiper'},
        'not_simulated': [{'what': 'el ultrasonido', 'why': 'ORBE no simula el eco. Trig y Echo no hacen nada: la distancia es la posición del trimmer escondido, que va de GND a VCC por el pin DIST. GrIDIE cambia lecturaUltrasonica() por una lectura de A1.'}],
    }, nodos, """
Sensor ultrasónico HC-SR04 de los esquemas de GrIDIE Blocks (Clase 3).
Generado por simulador/scripts/generar-piezas.py.""")


# ---- Sensor PIR HC-SR501 ------------------------------------------------------------------
# Acostado sobre la protoboard, con la cúpula blanca arriba y los pines VCC, OUT y GND hacia
# abajo en el borde de adelante. Un pulsador escondido debajo de la cúpula hace de "detectó
# movimiento": pone OUT en VCC; si no, la resistencia de 10k lo deja en GND.
def pir():
    m = Malla()
    m.caja('pcb_verde', (-16, -12, 2.54), (16, 12, 4.14))
    m.caja('plastico_blanco', (-11.5, -11.5, 4.14), (11.5, 11.5, 6.4))
    m.cupula('lente', (0, 0, 6.4), 11.2, 10.5, lados=20, anillos=7, facetas=True)
    m.caja('trimmer_naranja', (10.5, 7, 4.14), (14.5, 11, 7))
    m.caja('trimmer_naranja', (10.5, -11, 4.14), (14.5, -7, 7))
    m.caja('oro', (-15, -3, 4.14), (-12.5, 3, 5.2))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x3'},
        'sw': {'type': 'tactile-switch-smd'},
        'r': {'type': 'resistor-0603', 'resistance': '10k'},
    }
    layout = {
        'hdr': {'at': [0, -9.5, 0]},
        'sw': {'at': [0, 0, 4.14]},
        'r': {'at': [0, 6, 4.14]},
    }
    wires = [traza('hdr.1', 'sw.a'), traza('sw.b', 'hdr.2'), traza('r.a', 'hdr.2'), traza('r.b', 'hdr.3')]
    guardar('gridie-pir', {
        'version': '0.1.0',
        'title': 'Sensor de movimiento PIR HC-SR501',
        'summary': 'Sensor infrarrojo pasivo con pines VCC, OUT y GND. OUT queda en HIGH mientras detecta movimiento.',
        'tags': ['sensor', 'pir', 'movimiento', 'hc-sr501', 'gridie'],
        'real': real_generico('HC-SR501'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'VCC': 'hdr.1', 'OUT': 'hdr.2', 'GND': 'hdr.3'},
        'not_simulated': [{'what': 'el infrarrojo, el retardo y la sensibilidad', 'why': 'El movimiento es el pulsador escondido debajo de la cúpula, que el panel aprieta. Los dos trimmers naranjas son dibujo.'}],
    }, nodos, """
Sensor PIR HC-SR501 de GrIDIE Blocks (Clase 3). Generado por simulador/scripts/generar-piezas.py.""")


# ---- Sensor de obstáculos FC-51 -----------------------------------------------------------
# Acostado sobre la protoboard: los pines OUT, GND y VCC abajo en el borde de atrás (Y = 0) y
# el emisor y el receptor infrarrojos al frente (-Y). Un pulsador escondido debajo de la
# plaqueta hace de "hay un obstáculo": pone OUT en GND (el sensor da LOW al detectar) y prende
# el LED verde, como el módulo real.
def fc51():
    m = Malla()
    m.caja('pcb_azul', (-7, -31, 2.54), (7, 1.5, 4.14))
    # Emisor (transparente) y receptor (negro), acostados mirando al frente.
    for x, mat in ((-3.3, 'led_transparente'), (3.3, 'led_negro')):
        m.cilindro(mat, (x, -31, 7.2), 2.5, 4.5, '-y', lados=24)
        m.cupula(mat, (x, -35.5, 7.2), 2.5, 2.5, '-y', lados=24, anillos=6)
        m.anillo(mat, (x, -31, 7.2), 2.9, 2.5, 'y', lados=24)
        for dx in (-1.27, 1.27):
            m.caja('metal', (x + dx - 0.25, -31, 4.14), (x + dx + 0.25, -29, 4.7))
            m.caja('metal', (x + dx - 0.25, -31.2, 4.4), (x + dx + 0.25, -31, 7.2))
    # Trimmer azul y el comparador.
    m.caja('trimmer_azul', (-3.4, -21, 4.14), (3.4, -14, 9))
    m.cilindro('serigrafia', (0, -17.5, 9), 1.6, 0.2, 'z', lados=16)
    m.caja('chip', (-3, -11, 4.14), (3, -6, 5.7))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x3'},
        'sw': {'type': 'tactile-switch-smd'},
        'r_pu': {'type': 'resistor-0603', 'resistance': '10k'},
        'r_obs': {'type': 'resistor-0603', 'resistance': '1k'},
        'r_pwr': {'type': 'resistor-0603', 'resistance': '1k'},
        'led_obs': {'type': 'led-0805', 'color': 'green'},
        'led_pwr': {'type': 'led-0805', 'color': 'red'},
    }
    layout = {
        'hdr': {'at': [0, 0, 0]},
        # Debajo de la plaqueta, para que no se vea desde arriba.
        'sw': {'at': [0, -25, 2.54], 'rotate': [180, 0, 0]},
        'r_pu': {'at': [-4.5, -3.5, 4.14]},
        'r_obs': {'at': [4.5, -3.5, 4.14]},
        'r_pwr': {'at': [-4.5, -24, 4.14]},
        'led_obs': {'at': [4.5, -24, 4.14]},
        'led_pwr': {'at': [-4.5, -26.5, 4.14]},
    }
    wires = [
        traza('r_pu.a', 'hdr.3'), traza('r_pu.b', 'hdr.1'),
        traza('sw.a', 'hdr.1'), traza('sw.b', 'hdr.2'),
        traza('r_obs.a', 'hdr.3'), traza('r_obs.b', 'led_obs.anode'), traza('led_obs.cathode', 'hdr.1'),
        traza('r_pwr.a', 'hdr.3'), traza('r_pwr.b', 'led_pwr.anode'), traza('led_pwr.cathode', 'hdr.2'),
    ]
    guardar('gridie-fc51', {
        'version': '0.1.0',
        'title': 'Sensor de obstáculos infrarrojo FC-51',
        'summary': 'Sensor de obstáculos con pines OUT, GND y VCC. OUT queda en LOW mientras hay un obstáculo adelante y se prende el LED verde.',
        'tags': ['sensor', 'obstaculos', 'infrarrojo', 'fc-51', 'gridie'],
        'real': real_generico('FC-51'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'OUT': 'hdr.1', 'GND': 'hdr.2', 'VCC': 'hdr.3'},
        'not_simulated': [{'what': 'el infrarrojo y la distancia de detección', 'why': 'El obstáculo es el pulsador escondido debajo de la plaqueta, que el panel aprieta. El trimmer azul es dibujo.'}],
    }, nodos, """
Sensor de obstáculos FC-51 de GrIDIE Blocks (Clase 3 y 4). Generado por simulador/scripts/generar-piezas.py.""")


# ---- Sensor de fuego (llama) --------------------------------------------------------------
# Como el de obstáculos, pero con un solo receptor negro al frente. En GrIDIE da HIGH cuando ve
# una llama: el pulsador escondido pone OUT en VCC y la resistencia de 10k lo deja en GND.
def fuego():
    m = Malla()
    m.caja('pcb_azul', (-7, -31, 2.54), (7, 1.5, 4.14))
    m.cilindro('led_negro', (0, -31, 7.2), 2.5, 4.5, '-y', lados=24)
    m.cupula('led_negro', (0, -35.5, 7.2), 2.5, 2.5, '-y', lados=24, anillos=6)
    m.anillo('led_negro', (0, -31, 7.2), 2.9, 2.5, 'y', lados=24)
    for dx in (-1.27, 1.27):
        m.caja('metal', (dx - 0.25, -31, 4.14), (dx + 0.25, -29, 4.7))
        m.caja('metal', (dx - 0.25, -31.2, 4.4), (dx + 0.25, -31, 7.2))
    m.caja('trimmer_azul', (-3.4, -21, 4.14), (3.4, -14, 9))
    m.cilindro('serigrafia', (0, -17.5, 9), 1.6, 0.2, 'z', lados=16)
    m.caja('chip', (-3, -11, 4.14), (3, -6, 5.7))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x3'},
        'sw': {'type': 'tactile-switch-smd'},
        'r_pd': {'type': 'resistor-0603', 'resistance': '10k'},
        'r_det': {'type': 'resistor-0603', 'resistance': '1k'},
        'r_pwr': {'type': 'resistor-0603', 'resistance': '1k'},
        'led_det': {'type': 'led-0805', 'color': 'green'},
        'led_pwr': {'type': 'led-0805', 'color': 'red'},
    }
    layout = {
        'hdr': {'at': [0, 0, 0]},
        'sw': {'at': [0, -25, 2.54], 'rotate': [180, 0, 0]},
        'r_pd': {'at': [-4.5, -3.5, 4.14]},
        'r_det': {'at': [4.5, -3.5, 4.14]},
        'r_pwr': {'at': [-4.5, -24, 4.14]},
        'led_det': {'at': [4.5, -24, 4.14]},
        'led_pwr': {'at': [-4.5, -26.5, 4.14]},
    }
    wires = [
        traza('sw.a', 'hdr.3'), traza('sw.b', 'hdr.1'),
        traza('r_pd.a', 'hdr.1'), traza('r_pd.b', 'hdr.2'),
        traza('r_det.a', 'hdr.1'), traza('r_det.b', 'led_det.anode'), traza('led_det.cathode', 'hdr.2'),
        traza('r_pwr.a', 'hdr.3'), traza('r_pwr.b', 'led_pwr.anode'), traza('led_pwr.cathode', 'hdr.2'),
    ]
    guardar('gridie-fuego', {
        'version': '0.1.0',
        'title': 'Sensor de fuego (llama)',
        'summary': 'Sensor de llama infrarrojo con pines OUT, GND y VCC. En GrIDIE OUT queda en HIGH mientras ve una llama y se prende el LED verde.',
        'tags': ['sensor', 'fuego', 'llama', 'infrarrojo', 'gridie'],
        'real': real_generico('Sensor de llama'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'OUT': 'hdr.1', 'GND': 'hdr.2', 'VCC': 'hdr.3'},
        'not_simulated': [{'what': 'el infrarrojo de la llama', 'why': 'La llama es el pulsador escondido debajo de la plaqueta, que el panel aprieta. El trimmer azul es dibujo.'}],
    }, nodos, """
Sensor de fuego de GrIDIE Blocks (Clase 4). Generado por simulador/scripts/generar-piezas.py.""")


# ---- Sensor de humedad en tierra FC-28 ----------------------------------------------------
# La horquilla que va en la tierra y la plaquetita del comparador, con los pines A0, D0, GND y
# VCC hacia arriba para cables hembra (como en el esquema, va al Arduino sin protoboard). La
# humedad es un trimmer escondido debajo de la plaqueta: su cursor es A0.
def humedad():
    m = Malla()
    # Plaquetita del comparador.
    m.caja('pcb_azul_oscuro', (-8, -15, 2.54), (8, 15, 4.14))
    m.caja('trimmer_azul', (-3.4, -2, 4.14), (3.4, 5, 9))
    m.cilindro('serigrafia', (0, 1.5, 9), 1.6, 0.2, 'z', lados=16)
    m.caja('chip', (-3, -9, 4.14), (3, -4, 5.7))
    m.caja('plastico_negro', (-2.6, 11, 4.14), (2.6, 14.5, 8.5))  # conector de la horquilla
    # Cables a la horquilla.
    for x, mat in ((-1.27, 'cable_rojo'), (1.27, 'cable_negro')):
        m.cilindro(mat, (x, 14.5, 7), 0.6, 16, 'y', lados=10)
    # La horquilla FC-28.
    m.caja('pcb_negro', (-10, 30, 2.54), (10, 42, 4.14))
    m.caja('plastico_negro', (-2.6, 30.5, 4.14), (2.6, 34, 8.5))
    for x0, x1 in ((-10, -3.5), (3.5, 10)):
        m.caja('pcb_negro', (x0, 42, 2.54), (x1, 88, 4.14))
        m.caja('estano', (x0 + 1, 42, 4.14), (x1 - 1, 86, 4.3))
    nodos = [(None, m, None)]
    parts = {
        'hdr': {'type': 'pin-header-1x4'},
        'tierra': {'type': 'trimmer-3362p', 'resistance': '10k', 'position': 0.5},
        'r_pwr': {'type': 'resistor-0603', 'resistance': '1k'},
        'led_pwr': {'type': 'led-0805', 'color': 'red'},
    }
    layout = {
        'hdr': {'at': [0, -12, 6.68], 'rotate': [180, 0, 0]},
        'tierra': {'at': [0, 6, 2.54], 'rotate': [180, 0, 0]},
        'r_pwr': {'at': [5, -6, 4.14], 'rotate': [0, 0, 90]},
        'led_pwr': {'at': [5, -2, 4.14], 'rotate': [0, 0, 90]},
    }
    wires = [
        traza('tierra.a', 'hdr.3'), traza('tierra.b', 'hdr.4'), traza('tierra.wiper', 'hdr.1'),
        traza('r_pwr.a', 'hdr.4'), traza('r_pwr.b', 'led_pwr.anode'), traza('led_pwr.cathode', 'hdr.3'),
    ]
    guardar('gridie-humedad', {
        'version': '0.1.0',
        'title': 'Sensor de humedad en tierra FC-28',
        'summary': 'Horquilla FC-28 con su plaqueta comparadora y pines A0, D0, GND y VCC. A0 es más alto cuanto más seca está la tierra.',
        'tags': ['sensor', 'humedad', 'tierra', 'fc-28', 'gridie'],
        'real': real_generico('FC-28'),
        'parts': parts, 'wires': wires, 'layout': layout,
        'pins': {'A0': 'hdr.1', 'D0': 'hdr.2', 'GND': 'hdr.3', 'VCC': 'hdr.4'},
        'not_simulated': [{'what': 'la tierra y la salida D0', 'why': 'La humedad es la posición del trimmer escondido debajo de la plaqueta, que el panel mueve. D0 no se usa en GrIDIE y queda sin conectar.'}],
    }, nodos, """
Sensor de humedad en tierra FC-28 de GrIDIE Blocks (Clase 4). Generado por simulador/scripts/generar-piezas.py.""")


if __name__ == '__main__':
    semaforo()
    hc_sr04()
    pir()
    fc51()
    fuego()
    humedad()
