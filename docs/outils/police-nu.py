#!/usr/bin/env python3
"""Police d'un seul caractère : la lettre grecque ν (nu), dessinée pour ne pas ressembler à un v.

Dans les polices sans empattement, ν et v sont presque identiques. Ce script dessine un ν
(crochet en haut à gauche, fond arrondi, branche droite courbée qui revient vers la gauche),
écrit une police TrueType minimale (sans bibliothèque) en deux graisses, et affiche les règles
@font-face (police intégrée en base64, unicode-range limité à U+03BD) à coller dans la feuille
de style d'une application :

    python3 docs/outils/police-nu.py > /tmp/nu.css
"""
import base64, math, struct, sys

EM = 1000

# ---------- ligne médiane du tracé : courbes de Bézier cubiques (unités de la police) ----------
TRACE = [
    ((40, 470), (85, 520), (150, 535), (178, 455)),     # crochet en haut à gauche
    ((178, 455), (205, 330), (240, 150), (262, 75)),    # jambe gauche, vers le bas
    ((262, 75), (280, 10), (345, 0), (380, 60)),        # fond arrondi
    ((380, 60), (450, 170), (500, 330), (480, 445)),    # branche droite, courbée
    ((480, 445), (470, 505), (440, 525), (400, 528)),   # retour vers la gauche, en haut
]


def bezier(c, t):
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = c
    u = 1 - t
    return (u**3 * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t**3 * x3,
            u**3 * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t**3 * y3)


def contour(epaisseur, n=24):
    """Contour fermé (sens horaire) du trait d'épaisseur donnée autour de la ligne médiane."""
    pts = []
    for k, c in enumerate(TRACE):
        for i in range(0 if k == 0 else 1, n + 1):
            pts.append(bezier(c, i / n))
    gauche, droite = [], []
    for i, (x, y) in enumerate(pts):
        a, b = pts[max(i - 1, 0)], pts[min(i + 1, len(pts) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        l = math.hypot(dx, dy) or 1
        nx, ny = -dy / l * epaisseur / 2, dx / l * epaisseur / 2
        gauche.append((x + nx, y + ny))
        droite.append((x - nx, y - ny))
    # bouts arrondis : demi-cercles aux deux extrémités
    def bout(p, q, centre, sens):
        cx, cy = centre
        a0 = math.atan2(p[1] - cy, p[0] - cx)
        r = math.hypot(p[0] - cx, p[1] - cy)
        return [(cx + r * math.cos(a0 + sens * math.pi * j / 8), cy + r * math.sin(a0 + sens * math.pi * j / 8)) for j in range(1, 8)]
    fin = bout(gauche[-1], droite[-1], pts[-1], -1)
    debut = bout(droite[0], gauche[0], pts[0], -1)
    poly = gauche + fin + droite[::-1] + debut
    poly = [(round(x), round(y)) for x, y in poly]
    # sens horaire (aire négative, y vers le haut) exigé par TrueType
    aire = sum(poly[i][0] * poly[i - 1][1] - poly[i - 1][0] * poly[i][1] for i in range(len(poly)))
    if aire < 0:
        poly.reverse()
    # points consécutifs identiques retirés
    return [p for i, p in enumerate(poly) if p != poly[i - 1]]


# ---------- écriture de la police TrueType ----------
def somme(data):
    data += b'\0' * (-len(data) % 4)
    return sum(struct.unpack('>%dI' % (len(data) // 4), data)) & 0xFFFFFFFF


def police(epaisseur, gras):
    pts = contour(epaisseur)
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    bbox = (min(xs), min(ys), max(xs), max(ys))
    avance = 560
    # glyphe 1 : un contour, points sur la courbe, coordonnées en écarts sur 16 bits
    g = struct.pack('>hhhhh', 1, *bbox) + struct.pack('>H', len(pts) - 1) + struct.pack('>H', 0)
    g += bytes([1]) * len(pts)
    px = py = 0
    dx, dy = b'', b''
    for x, y in pts:
        dx += struct.pack('>h', x - px); dy += struct.pack('>h', y - py)
        px, py = x, y
    g += dx + dy
    g += b'\0' * (-len(g) % 4)
    nom = 'Nu physique'
    style = 'Bold' if gras else 'Regular'
    tables = {}
    tables[b'head'] = struct.pack('>IIIIHHqqhhhhHHhhh', 0x00010000, 0x00010000, 0, 0x5F0F3CF5, 0x000B, EM, 0, 0,
                                  *bbox, 1 if gras else 0, 8, 2, 1, 0)
    tables[b'hhea'] = struct.pack('>IhhhHhhhhhhhhhhhH', 0x00010000, 900, -220, 0, avance, 0, bbox[0], bbox[2], 1, 0, 0, 0, 0, 0, 0, 0, 2)
    tables[b'maxp'] = struct.pack('>IHHHHHHHHHHHHHH', 0x00010000, 2, len(pts), 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0)
    tables[b'OS/2'] = struct.pack('>HhHHHhhhhhhhhhhh10sIIII4sHHHhhhHHIIhhHHH',
                                  4, avance, 700 if gras else 400, 5, 0, 650, 600, 0, 75, 650, 600, 0, 350, 50, 260, 0,
                                  bytes(10), 0x80, 0, 0, 0, b'NUPH', 0x20 if gras else 0x40, 0x3BD, 0x3BD,
                                  800, -200, 0, 900, 220, 1, 0, 520, 700, 0, 32, 1)
    tables[b'hmtx'] = struct.pack('>HhHh', avance, 0, avance, bbox[0])
    sous = struct.pack('>HHHHHHH', 4, 32, 0, 4, 4, 1, 0) + struct.pack('>HH', 0x3BD, 0xFFFF) + struct.pack('>H', 0) + \
        struct.pack('>HH', 0x3BD, 0xFFFF) + struct.pack('>HH', (1 - 0x3BD) & 0xFFFF, 1) + struct.pack('>HH', 0, 0)
    tables[b'cmap'] = struct.pack('>HHHHI', 0, 1, 3, 1, 12) + sous
    tables[b'glyf'] = g
    tables[b'loca'] = struct.pack('>III', 0, 0, len(g))
    noms = {1: nom, 2: style, 3: nom + ' ' + style, 4: nom + ' ' + style, 6: 'NuPhysique-' + style}
    chaines = b''
    recs = b''
    for i, t in sorted(noms.items()):
        e = t.encode('utf-16-be')
        recs += struct.pack('>HHHHHH', 3, 1, 0x409, i, len(e), len(chaines))
        chaines += e
    tables[b'name'] = struct.pack('>HHH', 0, len(noms), 6 + 12 * len(noms)) + recs + chaines
    tables[b'post'] = struct.pack('>IIhhIIIII', 0x00030000, 0, -100, 50, 0, 0, 0, 0, 0)
    # répertoire des tables, puis les tables alignées sur 4 octets
    tags = sorted(tables)
    n = len(tags)
    es = int(math.log2(n))
    entete = struct.pack('>IHHHH', 0x00010000, n, 16 * 2**es, es, 16 * n - 16 * 2**es)
    pos = 12 + 16 * n
    dirs, corps = b'', b''
    for t in tags:
        d = tables[t]
        dirs += struct.pack('>4sIII', t, somme(d), pos, len(d))
        d += b'\0' * (-len(d) % 4)
        corps += d
        pos += len(d)
    fonte = bytearray(entete + dirs + corps)
    # ajustement de la somme de contrôle (table head)
    adj = (0xB1B0AFBA - somme(bytes(fonte))) & 0xFFFFFFFF
    i = 12 + 16 * tags.index(b'head')
    off = struct.unpack('>I', fonte[i + 8:i + 12])[0]
    fonte[off + 8:off + 12] = struct.pack('>I', adj)
    return bytes(fonte)


def regle(epaisseur, gras):
    b64 = base64.b64encode(police(epaisseur, gras)).decode()
    poids = '550 1000' if gras else '1 549'
    return ("@font-face { font-family: 'Nu physique'; font-weight: %s; unicode-range: U+03BD;\n"
            "  src: url(data:font/ttf;base64,%s) format('truetype'); }" % (poids, b64))


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--ttf':
        open(sys.argv[2], 'wb').write(police(int(sys.argv[3]), sys.argv[3] != '80'))
    else:
        print(regle(80, False))
        print(regle(118, True))
