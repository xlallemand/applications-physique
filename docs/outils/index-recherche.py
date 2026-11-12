#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Index de recherche du portail : génère assets/recherche-index.js.

Usage (depuis la racine du dépôt) :
    python3 docs/outils/index-recherche.py             # (re)génère l'index
    python3 docs/outils/index-recherche.py --verifier  # signale seulement s'il n'est plus à jour

À relancer après chaque ajout d'application ou changement d'un PLAN
(titre, description, parties, noms des pages) : charte §2 et §10.

Sources lues (rien d'autre n'est modifié) :
  - la liste APPS de index.html (racine) : dossiers des applications ;
  - le PLAN de chaque application (premier fichier modules/*.js qui le
    déclare) : modules, parties, pages et leurs noms ;
  - la première phrase de chaque page (.er-contexte, sinon
    <meta name="description">, sinon le premier paragraphe) : texte cherché.
Les textes recopiés reçoivent les espaces insécables de typo.py (« Atelier : … »
s'affiche correctement sur le portail même si le PLAN l'a oubliée).
Les titres, descriptions et mots-clés des applications ne sont pas recopiés :
le portail les lit directement dans APPS.

Type de chaque page (pastilles « Manipuler » et « Fiches » du portail,
libellé des résultats) : voir type_page() et EXCEPTIONS ci-dessous.
  simulateur, animation, atelier  → pastille « Manipuler »
  fiche                           → pastille « Fiches »
  activite, cours, exercices      → pas de pastille (libellé seulement)

Format produit (objet global RECH) :
  RECH[dossier] = { m: [ { n, t, d, p: [ { k, ty, l, c, d } ] } ] }   application avec un PLAN
  RECH[dossier] = { seul: c }                                        application d'une seule page
    n : numéro du module, t : titre, d : description / première phrase
    k : clé de la page (fichier sans .html), ty : nature dans le PLAN
        (simulation, cours, exemple, questions, entrainement, fiche, exercices)
    l : libellé de la page (comme dans le sommaire), c : type ci-dessus
Code de sortie 1 si --verifier trouve un index périmé ou si un PLAN est illisible.
"""
import html
import json
import os
import re
import sys

sys.dont_write_bytecode = True                                 # pas de __pycache__ dans docs/outils
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from typo import corriger_texte  # espaces insécables (même règle que typo.py)

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SORTIE = os.path.join(RACINE, 'assets', 'recherche-index.js')
NBSP = ' '

# Pages dont le type n'est pas celui que donnent les règles de type_page()
# (clé : « dossier/page », ou « dossier » pour une application d'une seule page)
EXCEPTIONS = {
    'decroissance-radioactive': 'simulateur',
    'montage-electrique/module_1a_manip': 'simulateur',       # prise en main du simulateur de montage
    'principe-dynamique/module_2_simulation': 'atelier',      # « Atelier : bilan des forces » (page d'exemple)
    'periode-frequence/module_2_manip': 'atelier',            # mesurer T et calculer f
    'titrage-ph/module_3a_equivalence': 'atelier',            # repérer le volume équivalent
    'orthographe/fiches': 'fiche',                            # « Fiches de règles » (page de cours du PLAN)
}

# Libellés par défaut des pages (mêmes que NOMS de assets/sommaire.js)
NOMS = {'simulation': 'Simulation', 'cours': 'Cours', 'exemple': 'Exemple', 'questions': 'Questions',
        'entrainement': 'Entraînement', 'fiche': 'Fiche récapitulative', 'exercices': 'Exercices'}
ORDRE = ['simulation', 'cours', 'exemple', 'questions', 'entrainement']   # ordre des pages d'une partie


def type_page(nature, libelle):
    """Type d'une page d'après sa nature dans le PLAN et son libellé."""
    if nature == 'simulation':
        for debut, c in (('Simulateur', 'simulateur'), ('Animation', 'animation'),
                         ('Atelier', 'atelier'), ('Activité', 'activite')):
            if libelle.startswith(debut):
                return c
        return 'simulateur'                                    # autre simulation (ex. transformateur)
    if nature in ('cours', 'exemple'):
        return 'cours'
    if nature == 'fiche':
        return 'fiche'
    return 'exercices'                                         # questions, entraînement, exercices


# ---------------------------------------------------------------------------
# Lecture d'un littéral JavaScript (tableaux, objets, chaînes, nombres)
# ---------------------------------------------------------------------------
class ErreurJS(Exception):
    pass


class LecteurJS:
    """Lit un littéral JS simple et le rend en objets Python.
    Identifiants connus : true, false, null, LYCEE (les quatre niveaux du lycée)."""
    CONSTANTES = {'true': True, 'false': False, 'null': None, 'LYCEE': ['2de', '1re', 'spe', 'sti']}

    def __init__(self, texte):
        self.s, self.i = texte, 0

    def erreur(self, msg):
        ligne = self.s.count('\n', 0, self.i) + 1
        raise ErreurJS(f'{msg} (ligne {ligne} du littéral)')

    def blancs(self):
        s = self.s
        while self.i < len(s):
            if s[self.i].isspace():
                self.i += 1
            elif s.startswith('//', self.i):
                j = s.find('\n', self.i)
                self.i = len(s) if j < 0 else j
            elif s.startswith('/*', self.i):
                j = s.find('*/', self.i + 2)
                if j < 0:
                    self.erreur('commentaire non fermé')
                self.i = j + 2
            else:
                break

    def valeur(self):
        self.blancs()
        c = self.s[self.i:self.i + 1]
        if c == '[':
            return self.tableau()
        if c == '{':
            return self.objet()
        if c in '\'"`':
            return self.chaine()
        m = re.compile(r'-?\d+(\.\d+)?').match(self.s, self.i)
        if m:
            self.i = m.end()
            return float(m.group()) if m.group(1) else int(m.group())
        m = re.compile(r'[A-Za-z_$][\w$]*').match(self.s, self.i)
        if m and m.group() in self.CONSTANTES:
            self.i = m.end()
            return self.CONSTANTES[m.group()]
        self.erreur('valeur inattendue : ' + self.s[self.i:self.i + 30].replace('\n', ' '))

    def tableau(self):
        self.i += 1
        res = []
        while True:
            self.blancs()
            if self.s[self.i] == ']':
                self.i += 1
                return res
            res.append(self.valeur())
            self.blancs()
            if self.s[self.i] == ',':
                self.i += 1
            elif self.s[self.i] != ']':
                self.erreur('« , » ou « ] » attendu')

    def objet(self):
        self.i += 1
        res = {}
        while True:
            self.blancs()
            if self.s[self.i] == '}':
                self.i += 1
                return res
            if self.s[self.i] in '\'"':
                cle = self.chaine()
            else:
                m = re.compile(r'[\w$]+').match(self.s, self.i)
                if not m:
                    self.erreur('clé attendue')
                cle, self.i = m.group(), m.end()
            self.blancs()
            if self.s[self.i] != ':':
                self.erreur('« : » attendu après ' + cle)
            self.i += 1
            res[cle] = self.valeur()
            self.blancs()
            if self.s[self.i] == ',':
                self.i += 1
            elif self.s[self.i] != '}':
                self.erreur('« , » ou « } » attendu')

    def chaine(self):
        q = self.s[self.i]
        self.i += 1
        res = []
        while True:
            if self.i >= len(self.s):
                self.erreur('chaîne non fermée')
            c = self.s[self.i]
            if c == q:
                self.i += 1
                return ''.join(res)
            if q == '`' and self.s.startswith('${', self.i):
                self.erreur('gabarit ${…} non pris en charge')
            if c == '\\':
                e = self.s[self.i + 1]
                if e == 'u' and self.s[self.i + 2] == '{':
                    j = self.s.index('}', self.i)
                    res.append(chr(int(self.s[self.i + 3:j], 16)))
                    self.i = j + 1
                    continue
                if e == 'u':
                    res.append(chr(int(self.s[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                if e == 'x':
                    res.append(chr(int(self.s[self.i + 2:self.i + 4], 16)))
                    self.i += 4
                    continue
                res.append({'n': '\n', 't': '\t', 'r': '', '\n': ''}.get(e, e))
                self.i += 2
                continue
            res.append(c)
            self.i += 1


def litteral_apres(texte, motif):
    """Littéral (tableau) qui suit le motif « NOM = » dans un texte JS."""
    m = re.search(motif, texte)
    if not m:
        return None
    lecteur = LecteurJS(texte)
    lecteur.i = texte.index('[', m.start())
    return lecteur.valeur()


# ---------------------------------------------------------------------------
# Première phrase d'une page (texte cherché, et aide pour l'élève)
# ---------------------------------------------------------------------------
def premiere_phrase(chemin):
    if not os.path.exists(chemin):
        return ''
    s = open(chemin, encoding='utf-8').read()
    m = (re.search(r'class="er-contexte"[^>]*>([\s\S]*?)</p>', s)
         or re.search(r'<meta name="description" content="([^"]*)"', s)
         or re.search(r'<p[^>]*>([^<]{30,}[\s\S]*?)</p>', s))
    if not m:
        return ''
    t = re.sub(r'<[^>]+>', '', m.group(1))
    t = re.sub(r'[ \t\r\n]+', ' ', html.unescape(t).replace('\\\'', "'")).strip()
    if '${' in t:                                              # texte fabriqué par JavaScript : inutilisable
        return ''
    if len(t) > 170:                                           # coupé à la fin d'un mot
        t = t[:170].rsplit(' ', 1)[0] + '…'
    return t


# ---------------------------------------------------------------------------
# Construction de l'index
# ---------------------------------------------------------------------------
def plan_de(dossier):
    """PLAN de l'application (None si elle n'en a pas), et le fichier qui le déclare."""
    rep = os.path.join(RACINE, dossier, 'modules')
    if not os.path.isdir(rep):
        return None, None
    for f in sorted(os.listdir(rep)):
        if not f.endswith('.js'):
            continue
        texte = open(os.path.join(rep, f), encoding='utf-8').read()
        if re.search(r'\bPLAN\s*=\s*\[', texte):
            return litteral_apres(texte, r'\bPLAN\s*=\s*\['), f
    return None, None


def libelle(partie, nature, module):
    """Libellé d'une page comme dans le sommaire : nom propre, sinon nom par défaut (+ partie)."""
    noms = partie.get('noms') or {}
    if noms.get(nature):
        return noms[nature]
    nom = partie.get('nom', '')
    return NOMS[nature] + (' · ' + nom if nom and nom != module['titre'] else '')


def construire():
    portail = open(os.path.join(RACINE, 'index.html'), encoding='utf-8').read()
    apps = litteral_apres(portail, r'const APPS\s*=\s*\[')
    index, bilan = {}, []
    for a in apps:
        d = a['dossier']
        plan, fichier = plan_de(d)
        if not plan:
            index[d] = {'seul': EXCEPTIONS.get(d, 'exercices')}     # titre et description : dans APPS
            bilan.append(f'  {d:34} une seule page ({index[d]["seul"]})')
            continue
        mods = []
        for m in plan:
            pages = []
            if m.get('exercices'):
                k = m['exercices']
                pages.append({'k': k, 'ty': 'exercices', 'l': m.get('exNom') or NOMS['exercices'], 'c': 'exercices',
                              'd': premiere_phrase(os.path.join(RACINE, d, 'modules', k + '.html'))})
            for pt in m.get('parties') or []:
                for nature in ORDRE:
                    k = pt.get(nature)
                    if not k:
                        continue
                    l = libelle(pt, nature, m)
                    pages.append({'k': k, 'ty': nature, 'l': l,
                                  'c': EXCEPTIONS.get(f'{d}/{k}', type_page(nature, l)),
                                  'd': premiere_phrase(os.path.join(RACINE, d, 'modules', k + '.html'))})
            if m.get('fiche'):
                pages.append({'k': m['fiche'], 'ty': 'fiche', 'l': 'Fiche' + NBSP + ': ' + m['titre'], 'c': 'fiche', 'd': ''})
            for pg in pages:
                pg['l'], pg['d'] = corriger_texte(pg['l']), corriger_texte(pg['d'])
            mods.append({'n': m['n'], 't': corriger_texte(m['titre']), 'd': corriger_texte(m.get('desc', '')), 'p': pages})
        index[d] = {'m': mods}
        nb = sum(len(m['p']) for m in mods)
        manip = sum(1 for m in mods for p in m['p'] if p['c'] in ('simulateur', 'animation', 'atelier'))
        bilan.append(f'  {d:34} {fichier:10} {len(mods)} modules, {nb} pages dont {manip} « Manipuler »')
    # exceptions qui ne désignent plus aucune page
    connues = {d for d in index} | {f'{d}/{p["k"]}' for d, v in index.items() for m in v.get('m', []) for p in m['p']}
    perdues = [e for e in EXCEPTIONS if e not in connues]
    return index, bilan, perdues


def texte_fichier(index):
    entete = ('/* ============================================================\n'
              '   Index de recherche du portail (pages de toutes les applications)\n'
              '   FICHIER GÉNÉRÉ par docs/outils/index-recherche.py : ne pas le\n'
              '   modifier à la main ; relancer le script après tout changement\n'
              '   d\'un PLAN ou de la liste APPS du portail.\n'
              '   Format : voir l\'en-tête du script.\n'
              '   ============================================================ */\n')
    lignes = ',\n'.join(f'  {json.dumps(d, ensure_ascii=False)}: {json.dumps(v, ensure_ascii=False, separators=(",", ":"))}'
                        for d, v in index.items())
    return entete + 'window.RECH = {\n' + lignes + '\n};\n'


def main():
    verifier = '--verifier' in sys.argv[1:]
    try:
        index, bilan, perdues = construire()
    except ErreurJS as e:
        print('PLAN illisible :', e)
        return 1
    texte = texte_fichier(index)
    for e in perdues:
        print('Attention : exception sans page correspondante :', e)
    ancien = open(SORTIE, encoding='utf-8').read() if os.path.exists(SORTIE) else ''
    if verifier:
        if ancien != texte:
            print('assets/recherche-index.js n\'est plus à jour : lance python3 docs/outils/index-recherche.py')
            return 1
        print('Index de recherche à jour.')
        return 0
    print('\n'.join(bilan))
    if ancien == texte:
        print('Index de recherche déjà à jour.')
    else:
        open(SORTIE, 'w', encoding='utf-8').write(texte)
        print(f'assets/recherche-index.js écrit ({len(texte) // 1024} ko, {len(index)} applications).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
