#!/usr/bin/env python3
"""
Fabrication du premier essai d'intégration dans Éléa : application Conversions.

Script propre à l'essai (ce n'est pas encore l'outil automatique) :
il fabrique, à partir des fichiers du dépôt,
  - un paquet SCORM 1.2 par activité (dossier scorm/) ;
  - le fichier .mbz du parcours (voir mbz.py).

Lancement, depuis n'importe quel dossier :
    python3 Elea27/conversions-essai/fabrication/construire_essai.py

Bibliothèque standard de Python uniquement, aucune connexion nécessaire.
"""
import re
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

import mbz

ICI = Path(__file__).resolve().parent
ESSAI = ICI.parent                    # Elea27/conversions-essai
ELEA = ESSAI.parent                   # Elea27
DEPOT = ELEA.parent                   # racine du dépôt
COMMUN = ELEA / 'commun'

APPLI = 'conversions'                 # dossier de l'application dans le dépôt
NOM = 'conversions-essai'             # préfixe des fichiers fabriqués

# Parcours de l'essai : sections (modules du PLAN) puis activités (pages du PLAN).
#   page : clé de la page dans le PLAN de l'application ; type : 'cours' ou 'serie' (note sur 20)
SECTIONS = [
    {'n': 1, 'titre': 'Module 1 · Les préfixes et la méthode',
     'resume': 'Le cours, puis une série de 10 questions sur les préfixes (notée sur 20).'},
    {'n': 2, 'titre': 'Module 2 · S\'entraîner à convertir',
     'resume': 'Deux niveaux d\'entraînement, chacun noté sur 20 : ta meilleure note est gardée.'},
]
ACTIVITES = [
    {'section': 1, 'page': 'cours', 'type': 'cours', 'titre': 'Cours : les préfixes et la méthode'},
    {'section': 1, 'page': 'prefixes', 'type': 'serie', 'titre': 'Apprendre les préfixes'},
    {'section': 2, 'page': 'niveau-1', 'type': 'serie', 'titre': 'Niveau 1 : nombres décimaux'},
    {'section': 2, 'page': 'niveau-2', 'type': 'serie', 'titre': 'Niveau 2 : puissances de 10'},
]

# Date fixe dans les zip : refabriquer sans changement donne des fichiers identiques
DATE_ZIP = (2026, 1, 1, 0, 0, 0)

TAILWIND_CDN = '<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>'
TAILWIND_LOCAL = '<script src="../elea/tailwind-browser-4.3.3.js"></script>'
POLICE_GOOGLE = re.compile(r"@import url\('https://fonts\.googleapis\.com/[^']*'\);")
POLICE_LOCALE = "@import url('../elea/police/hanken-grotesk.css');"
SOMMAIRE = '<script src="../assets/sommaire.js"></script>'


def ident(page):
    """Identifiant fixe de l'activité : le garder permet de remplacer le zip sans perdre les notes."""
    return f'{APPLI}-{page}'


def fichiers_du_paquet(act):
    """Contenu d'un paquet : {chemin dans le zip: octets}. Arborescence du dépôt conservée (chemins relatifs inchangés)."""
    page = (DEPOT / APPLI / 'index.html').read_text(encoding='utf-8')
    f = {}

    # page de l'application : Tailwind embarqué, pont SCORM juste après le module de navigation
    assert TAILWIND_CDN in page and SOMMAIRE in page
    pont = (f'<script src="../elea/elea-scorm.js" data-page="{act["page"]}" '
            f'data-type="{act["type"]}" data-spa></script>')
    html = page.replace(TAILWIND_CDN, TAILWIND_LOCAL).replace(SOMMAIRE, SOMMAIRE + '\n' + pont)
    f[f'{APPLI}/index.html'] = html.encode('utf-8')

    # feuilles et scripts communs chargés par la page (../assets/…, ../equilibrer-reactions/…)
    for chemin in re.findall(r'(?:href|src)="\.\./([^"]+)"', page):
        contenu = (DEPOT / chemin).read_bytes()
        if chemin == 'assets/theme.css':
            texte, n = POLICE_GOOGLE.subn(POLICE_LOCALE, contenu.decode('utf-8'))
            assert n == 1
            contenu = texte.encode('utf-8')
        f[chemin] = contenu

    # pont SCORM, Tailwind et police embarqués
    f['elea/elea-scorm.js'] = (COMMUN / 'elea-scorm.js').read_bytes()
    for p in sorted((COMMUN / 'vendor').iterdir()):
        f[f'elea/{p.name}'] = p.read_bytes()
    for p in sorted((COMMUN / 'police').iterdir()):
        f[f'elea/police/{p.name}'] = p.read_bytes()

    f['imsmanifest.xml'] = manifeste(act, sorted(f)).encode('utf-8')
    return f


def manifeste(act, chemins):
    """imsmanifest.xml SCORM 1.2 : un seul SCO qui ouvre la page de l'application."""
    i, t = ident(act['page']), escape(act['titre'])
    liste = '\n'.join(f'      <file href="{escape(c)}"/>' for c in chemins)
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
    <resource identifier="RES-{i}" type="webcontent" adlcp:scormtype="sco" href="{APPLI}/index.html">
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


def main():
    dossier = ESSAI / 'scorm'
    dossier.mkdir(exist_ok=True)
    paquets = []
    for k, act in enumerate(ACTIVITES, 1):
        fichiers = fichiers_du_paquet(act)
        zip_ = dossier / f'{NOM}-{k}-{act["page"]}.zip'
        ecrire_zip(zip_, fichiers)
        paquets.append({**act, 'ident': ident(act['page']), 'lancement': f'{APPLI}/index.html',
                        'zip': zip_, 'fichiers': fichiers})
        print(f'SCORM  {zip_.relative_to(DEPOT)}  ({zip_.stat().st_size // 1024} Ko)')
    sortie = ESSAI / f'{NOM}.mbz'
    mbz.fabriquer(sortie, nom_cours='Conversions (essai)', court='conversions-essai',
                  sections=SECTIONS, activites=paquets)
    print(f'MBZ    {sortie.relative_to(DEPOT)}  ({sortie.stat().st_size // 1024} Ko)')


if __name__ == '__main__':
    main()
