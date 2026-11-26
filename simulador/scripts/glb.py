# Escribe modelos 3D (GLB) simples para las piezas propias de GrIDIE, en el formato que
# toma el visor de ORBE: un nodo raíz con el giro de -90° en X de glTF y los nodos con
# mallas como hijos. Las medidas se dan en mm, en el marco de la pieza (+Z hacia arriba).
import json
import math
import struct

import numpy as np


def color(hexa):
    """'#rrggbb' en sRGB -> factor lineal de glTF."""
    hexa = hexa.lstrip('#')
    c = [int(hexa[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


class Malla:
    """Triángulos agrupados por material."""

    def __init__(self):
        self.grupos = {}  # material -> (posiciones, normales, índices)

    def _agregar(self, mat, pos, nor, idx):
        p, n, i = self.grupos.setdefault(mat, ([], [], []))
        base = sum(len(x) for x in p)
        p.append(np.asarray(pos, dtype=np.float32))
        n.append(np.asarray(nor, dtype=np.float32))
        i.append(np.asarray(idx, dtype=np.uint32) + base)

    def caja(self, mat, desde, hasta):
        """Caja alineada a los ejes entre dos esquinas (mm)."""
        x0, y0, z0 = desde
        x1, y1, z1 = hasta
        caras = [
            ((1, 0, 0), [(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)]),
            ((-1, 0, 0), [(x0, y1, z0), (x0, y0, z0), (x0, y0, z1), (x0, y1, z1)]),
            ((0, 1, 0), [(x1, y1, z0), (x0, y1, z0), (x0, y1, z1), (x1, y1, z1)]),
            ((0, -1, 0), [(x0, y0, z0), (x1, y0, z0), (x1, y0, z1), (x0, y0, z1)]),
            ((0, 0, 1), [(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]),
            ((0, 0, -1), [(x0, y1, z0), (x1, y1, z0), (x1, y0, z0), (x0, y0, z0)]),
        ]
        for normal, vs in caras:
            self._agregar(mat, vs, [normal] * 4, [0, 1, 2, 0, 2, 3])

    def cilindro(self, mat, centro, radio, largo, eje='z', lados=32, tapas=True):
        """Cilindro con la base en `centro` que crece `largo` mm a lo largo de `eje`
        (con signo: '-y' crece hacia -Y)."""
        signo = -1 if eje.startswith('-') else 1
        e = eje[-1]
        pos, nor, idx = [], [], []
        for k in range(lados + 1):
            a = 2 * math.pi * k / lados
            c, s = math.cos(a), math.sin(a)
            for h in (0, largo):
                pos.append(self._punto(centro, e, signo * h, radio * c, radio * s))
                nor.append(self._punto((0, 0, 0), e, 0, c, s))
        for k in range(lados):
            a, b, c, d = 2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 3
            idx += [a, c, d, a, d, b] if signo > 0 else [a, d, c, a, b, d]
        self._agregar(mat, pos, nor, idx)
        if tapas:
            for h, n in ((0, -1), (largo, 1)):
                self.disco(mat, self._punto(centro, e, signo * h, 0, 0), radio, ('-' if n * signo < 0 else '') + e, lados)

    def disco(self, mat, centro, radio, eje='z', lados=32):
        signo = -1 if eje.startswith('-') else 1
        e = eje[-1]
        pos = [tuple(centro)]
        normal = self._punto((0, 0, 0), e, signo, 0, 0)
        for k in range(lados + 1):
            a = 2 * math.pi * k / lados
            pos.append(self._punto(centro, e, 0, radio * math.cos(a), radio * math.sin(a)))
        idx = []
        for k in range(lados):
            idx += [0, k + 1, k + 2] if signo > 0 else [0, k + 2, k + 1]
        self._agregar(mat, pos, [normal] * len(pos), idx)

    def anillo(self, mat, centro, r_ext, r_int, eje='z', lados=32):
        signo = -1 if eje.startswith('-') else 1
        e = eje[-1]
        normal = self._punto((0, 0, 0), e, signo, 0, 0)
        pos, idx = [], []
        for k in range(lados + 1):
            a = 2 * math.pi * k / lados
            for r in (r_ext, r_int):
                pos.append(self._punto(centro, e, 0, r * math.cos(a), r * math.sin(a)))
        for k in range(lados):
            a, b, c, d = 2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 3
            idx += [a, c, d, a, d, b] if signo > 0 else [a, d, c, a, b, d]
        self._agregar(mat, pos, [normal] * len(pos), idx)

    def cupula(self, mat, centro, radio, alto=None, eje='z', lados=24, anillos=8, facetas=False):
        """Casquete esférico apoyado en `centro`, de `alto` mm (por defecto media esfera)."""
        alto = radio if alto is None else alto
        signo = -1 if eje.startswith('-') else 1
        e = eje[-1]
        # Esfera de radio R cuyo casquete de altura `alto` tiene base de radio `radio`.
        R = (radio ** 2 + alto ** 2) / (2 * alto)
        tope = math.asin(min(1, radio / R))
        if alto > R:
            tope = math.pi - tope
        pos, nor, idx = [], [], []
        for j in range(anillos + 1):
            t = tope * (1 - j / anillos)  # ángulo desde el polo
            for k in range(lados + 1):
                a = 2 * math.pi * k / lados
                n = (math.sin(t) * math.cos(a), math.sin(t) * math.sin(a), math.cos(t))
                h = R * n[2] - (R - alto)
                pos.append(self._punto(centro, e, signo * h, R * n[0], R * n[1]))
                nor.append(self._punto((0, 0, 0), e, signo * n[2], n[0], n[1]))
        fila = lados + 1
        for j in range(anillos):
            for k in range(lados):
                a = j * fila + k
                b, c, d = a + 1, a + fila, a + fila + 1
                idx += [a, b, d, a, d, c] if signo > 0 else [a, d, b, a, c, d]
        if facetas:
            pos, nor, idx = _facetar(pos, idx)
        self._agregar(mat, pos, nor, idx)

    @staticmethod
    def _punto(centro, eje, h, u, v):
        x, y, z = centro
        if eje == 'z':
            return (x + u, y + v, z + h)
        if eje == 'y':
            return (x + v, y + h, z + u)
        return (x + h, y + u, z + v)


def _facetar(pos, idx):
    pos = np.asarray(pos, dtype=np.float32)
    nuevos, normales = [], []
    for t in range(0, len(idx), 3):
        a, b, c = (pos[i] for i in idx[t:t + 3])
        n = np.cross(b - a, c - a)
        largo = np.linalg.norm(n)
        if largo == 0:
            continue
        n = n / largo
        nuevos += [a, b, c]
        normales += [n, n, n]
    return nuevos, normales, list(range(len(nuevos)))


def escribir_glb(ruta, materiales, nodos):
    """`materiales`: {nombre: dict(color, metal, rugosidad, opacidad)}.
    `nodos`: lista de (nombre o None, Malla, traslación en mm o None)."""
    nombres_mat = list(materiales)
    gltf = {
        'asset': {'version': '2.0', 'generator': 'GrIDIE Blocks scripts/glb.py'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'rotation': [-math.sqrt(0.5), 0, 0, math.sqrt(0.5)], 'children': []}],
        'meshes': [],
        'materials': [],
        'accessors': [],
        'bufferViews': [],
        'buffers': [],
    }
    for nombre in nombres_mat:
        m = materiales[nombre]
        base = color(m['color']) + [m.get('opacidad', 1)]
        mat = {
            'name': nombre,
            'doubleSided': True,
            'pbrMetallicRoughness': {
                'baseColorFactor': base,
                'metallicFactor': m.get('metal', 0),
                'roughnessFactor': m.get('rugosidad', 0.5),
            },
        }
        if m.get('opacidad', 1) < 1:
            mat['alphaMode'] = 'BLEND'
        gltf['materials'].append(mat)

    datos = bytearray()

    def vista(arr, objetivo):
        nonlocal datos
        while len(datos) % 4:
            datos.append(0)
        inicio = len(datos)
        datos += arr.tobytes()
        gltf['bufferViews'].append({'buffer': 0, 'byteOffset': inicio, 'byteLength': arr.nbytes, 'target': objetivo})
        return len(gltf['bufferViews']) - 1

    for nombre, malla, traslacion in nodos:
        primitivas = []
        for mat, (p, n, i) in malla.grupos.items():
            pos = np.concatenate(p) / 1000.0  # mm -> m
            nor = np.concatenate(n)
            nor = nor / np.maximum(np.linalg.norm(nor, axis=1, keepdims=True), 1e-9)
            ind = np.concatenate(i)
            if traslacion is not None:
                pos = pos - np.asarray(traslacion, dtype=np.float32) / 1000.0
            pos = pos.astype(np.float32)
            nor = nor.astype(np.float32)
            ind = ind.astype(np.uint32)
            acc = len(gltf['accessors'])
            gltf['accessors'] += [
                {'bufferView': vista(pos, 34962), 'componentType': 5126, 'count': len(pos), 'type': 'VEC3',
                 'min': pos.min(axis=0).tolist(), 'max': pos.max(axis=0).tolist()},
                {'bufferView': vista(nor, 34962), 'componentType': 5126, 'count': len(nor), 'type': 'VEC3'},
                {'bufferView': vista(ind, 34963), 'componentType': 5125, 'count': len(ind), 'type': 'SCALAR'},
            ]
            primitivas.append({'attributes': {'POSITION': acc, 'NORMAL': acc + 1}, 'indices': acc + 2,
                               'material': nombres_mat.index(mat)})
        gltf['meshes'].append({'primitives': primitivas})
        nodo = {'mesh': len(gltf['meshes']) - 1}
        if nombre:
            nodo['name'] = nombre
        if traslacion is not None:
            nodo['translation'] = [v / 1000.0 for v in traslacion]
        gltf['nodes'].append(nodo)
        gltf['nodes'][0]['children'].append(len(gltf['nodes']) - 1)

    while len(datos) % 4:
        datos.append(0)
    gltf['buffers'].append({'byteLength': len(datos)})
    texto = json.dumps(gltf, separators=(',', ':')).encode()
    while len(texto) % 4:
        texto += b' '
    total = 12 + 8 + len(texto) + 8 + len(datos)
    with open(ruta, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(texto), 0x4E4F534A) + texto)
        f.write(struct.pack('<II', len(datos), 0x004E4942) + bytes(datos))
