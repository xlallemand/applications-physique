"""
Paquets SCORM 1.2 : un zip par activité (une page du plan de l'application).

Contenu d'un paquet, arborescence du dépôt conservée (chemins relatifs inchangés) :
  - tout le dossier de l'application (pages, scripts, images) ;
  - les fichiers communs qu'elle charge hors de son dossier (assets/…, moteur d'une autre application…) ;
  - elea/ : le pont SCORM (commun/elea-scorm.js), Tailwind et la police embarqués ;
  - imsmanifest.xml : un seul SCO, qui ouvre la page de l'activité.
Seule la page lancée reçoit le pont SCORM ; Tailwind (CDN) et Google Fonts sont remplacés
par les copies embarquées dans toutes les pages du paquet.
"""
import posixpath
import re
import zipfile
from xml.sax.saxutils import escape

DATE_ZIP = (2026, 1, 1, 0, 0, 0)        # date fixe : refabriquer sans changement donne le même zip
TAILWIND = re.compile(r'<script[^>]*\ssrc="https://cdn\.jsdelivr\.net/npm/@tailwindcss/browser@4[^"]*"[^>]*></script>')
POLICE_GOOGLE = re.compile(r"@import url\('https://fonts\.googleapis\.com/[^']*'\);")
SOMMAIRE = re.compile(r'<script src="[^"]*assets/sommaire\.js"></script>')
# ressources chargées par une page ou une feuille de style (pas les liens <a href>)
RESSOURCES_HTML = re.compile(r'<(?:script|img|source|audio|video|iframe)\b[^>]*\ssrc="([^"]+)"|<link\b[^>]*\shref="([^"]+)"')
RESSOURCES_CSS = re.compile(r'@import\s+url\([\'"]?([^\'")]+)|url\([\'"]?([^\'")]+)')
EN_LIGNE = re.compile(r'^(https?:)?//')


def relatif(de, vers):
    """Chemin relatif (séparateur /) du dossier du fichier « de » vers le fichier « vers » (chemins du dépôt)."""
    return posixpath.relpath(vers, posixpath.dirname(de))


def fichiers_communs(depot, appli, commun):
    """Fichiers communs à tous les paquets de l'application : {chemin: octets}, et les avertissements."""
    f, alertes = {}, []
    for p in sorted((depot / appli).rglob('*')):
        if p.is_file() and not any(x.startswith('.') for x in p.relative_to(depot).parts):
            f[p.relative_to(depot).as_posix()] = p.read_bytes()

    # dépendances hors du dossier de l'application, de proche en proche (pages, puis feuilles de style)
    a_voir = [c for c in f if c.endswith(('.html', '.css'))]
    while a_voir:
        c = a_voir.pop()
        texte = f[c].decode('utf-8', errors='replace')
        motif = RESSOURCES_HTML if c.endswith('.html') else RESSOURCES_CSS
        for m in motif.finditer(texte):
            lien = (m.group(1) or m.group(2) or '').split('#')[0].split('?')[0]
            if not lien or lien.startswith('data:'):
                continue
            if EN_LIGNE.match(lien):
                if '@tailwindcss/browser@4' not in lien and 'fonts.googleapis.com' not in lien:   # remplacés plus bas
                    alertes.append(f'{c} : ressource en ligne non embarquée ({lien})')
                continue
            cible = posixpath.normpath(posixpath.join(posixpath.dirname(c), lien))
            if cible in f:
                continue
            chemin = depot / cible
            if not chemin.is_file():
                alertes.append(f'{c} : fichier introuvable ({lien})')
                continue
            f[cible] = chemin.read_bytes()
            if cible.endswith(('.html', '.css')):
                a_voir.append(cible)

    # Tailwind et police embarqués
    tailwind = False
    for c in list(f):
        if c.endswith('.html'):
            texte = f[c].decode('utf-8')
            if TAILWIND.search(texte):
                tailwind = True
                local = f'<script src="{relatif(c, "elea/tailwind-browser-4.3.3.js")}"></script>'
                f[c] = TAILWIND.sub(lambda m: local, texte).encode('utf-8')
        elif c.endswith('.css'):
            texte = f[c].decode('utf-8')
            if POLICE_GOOGLE.search(texte):
                f[c] = POLICE_GOOGLE.sub(lambda m: f"@import url('{relatif(c, 'elea/police/hanken-grotesk.css')}');", texte).encode('utf-8')
    f['elea/elea-scorm.js'] = (commun / 'elea-scorm.js').read_bytes()
    for p in sorted((commun / 'police').iterdir()):
        f[f'elea/police/{p.name}'] = p.read_bytes()
    if tailwind:
        for p in sorted((commun / 'vendor').iterdir()):
            f[f'elea/{p.name}'] = p.read_bytes()
    return f, alertes


def fichiers_du_paquet(communs, act, app):
    """Fichiers d'un paquet : les fichiers communs, la page lancée avec le pont SCORM, le manifeste."""
    f = dict(communs)
    lance = act['lancement']
    page = f[lance].decode('utf-8')
    m = SOMMAIRE.search(page)
    if not m:
        raise SystemExit(f'{lance} : assets/sommaire.js n\'est pas chargé, le pont SCORM ne peut pas s\'y accrocher')
    attributs = f'data-page="{act["page"]}" data-type="{act["type"]}"'
    if act['type'] == 'exercices' and app['cleEx']:
        attributs += f' data-ex="{app["cleEx"]}"'
    if app['spa']:
        attributs += ' data-spa'
    pont = f'<script src="{relatif(lance, "elea/elea-scorm.js")}" {attributs}></script>'
    f[lance] = (page[:m.end()] + '\n' + pont + page[m.end():]).encode('utf-8')
    f['imsmanifest.xml'] = manifeste(act, sorted(f)).encode('utf-8')
    return f


def manifeste(act, chemins):
    """imsmanifest.xml SCORM 1.2. Identifiants fixes : remplacer le zip garde les notes des élèves."""
    i, t = act['ident'], escape(act['titre'])
    liste = '\n'.join(f'      <file href="{escape(c)}"/>' for c in chemins if c != 'imsmanifest.xml')
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="MANIFEST-{i}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="ORG-{i}">
    <organization identifier="ORG-{i}">
      <title>{t}</title>
      <item identifier="ITEM-{i}" identifierref="RES-{i}" isvisible="true">
        <title>{t}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RES-{i}" type="webcontent" adlcp:scormtype="sco" href="{escape(act['lancement'])}">
{liste}
    </resource>
  </resources>
</manifest>
'''


def ecrire_zip(chemin, fichiers):
    """Zip reproductible (date fixe, ordre alphabétique), imsmanifest.xml à la racine."""
    with zipfile.ZipFile(chemin, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for nom in sorted(fichiers):
            info = zipfile.ZipInfo(nom, DATE_ZIP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            z.writestr(info, fichiers[nom])
