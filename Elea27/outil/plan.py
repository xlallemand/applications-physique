"""
Lecture du plan d'une application (assets/sommaire.js) et liste des activités Éléa.

Le plan est écrit en JavaScript dans l'application :
    const PLAN = [ { n: 1, titre: '…', fiche: 'fiche_1', parties: [ { nom, cours, questions, noms } ] }, … ];
    SOM.init({ nom: 'pH', id: 'ph', cleEx: 'ph-exercices', spa: true, plan: PLAN });
On le lit avec un petit lecteur de littéraux JavaScript (objets, tableaux, chaînes,
nombres, true / false / null, commentaires), sans exécuter le code.

Une activité Éléa par page du plan, dans l'ordre du sommaire de l'application :
pages de chaque partie (simulation, cours, exemple, questions, entraînement),
puis la fiche du module, puis la page d'exercices.
"""
import re
from pathlib import Path

# types de pages d'une partie, dans l'ordre du sommaire (assets/sommaire.js : ONGLETS, NOMS)
ONGLETS = ['simulation', 'cours', 'exemple', 'questions', 'entrainement']
NOMS = {'simulation': 'Simulation', 'cours': 'Cours', 'exemple': 'Exemple', 'questions': 'Questions',
        'entrainement': 'Entraînement', 'fiche': 'Fiche récapitulative', 'exercices': 'Exercices'}
# comportement de l'activité dans Éléa (pont SCORM, commun/elea-scorm.js) :
#   serie : note sur 20 ; cours : terminé à la dernière étape ; vue : terminé à l'ouverture ;
#   exercices : terminé quand tous les exercices sont faits (sans note)
TYPES = {'simulation': 'vue', 'cours': 'cours', 'exemple': 'vue', 'questions': 'serie',
         'entrainement': 'serie', 'fiche': 'vue', 'exercices': 'exercices'}


class Brut(str):
    """Identifiant JavaScript non évalué (ex. PLAN dans SOM.init)."""


class LecteurJS:
    """Lecteur de littéraux JavaScript : renvoie dict, list, str, int, float, bool, None ou Brut."""

    def __init__(self, texte, pos=0):
        self.t, self.i = texte, pos

    def blancs(self):
        t = self.t
        while self.i < len(t):
            if t[self.i].isspace():
                self.i += 1
            elif t.startswith('//', self.i):
                fin = t.find('\n', self.i)
                self.i = len(t) if fin < 0 else fin + 1
            elif t.startswith('/*', self.i):
                self.i = t.index('*/', self.i) + 2
            else:
                break

    def valeur(self):
        self.blancs()
        c = self.t[self.i]
        if c == '{':
            return self.objet()
        if c == '[':
            return self.tableau()
        if c in '\'"`':
            return self.chaine()
        m = re.compile(r'-?\d+(\.\d+)?').match(self.t, self.i)
        if m:
            self.i = m.end()
            return float(m.group()) if m.group(1) else int(m.group())
        m = re.compile(r'[A-Za-z_$][\w$.]*').match(self.t, self.i)
        if m:
            self.i = m.end()
            mot = m.group()
            return {'true': True, 'false': False, 'null': None, 'undefined': None}.get(mot, Brut(mot))
        raise ValueError(f'littéral JavaScript non reconnu : {self.t[self.i:self.i + 40]!r}')

    def chaine(self):
        q, t = self.t[self.i], self.t
        self.i += 1
        morceaux = []
        while t[self.i] != q:
            if t[self.i] == '\\':
                s = t[self.i + 1]
                if s == 'u':
                    morceaux.append(chr(int(t[self.i + 2:self.i + 6], 16)))
                    self.i += 6
                    continue
                morceaux.append({'n': '\n', 't': '\t'}.get(s, s))
                self.i += 2
            else:
                if q == '`' and t.startswith('${', self.i):
                    raise ValueError('gabarit JavaScript avec ${…} dans le plan : non pris en charge')
                morceaux.append(t[self.i])
                self.i += 1
        self.i += 1
        return ''.join(morceaux)

    def objet(self):
        self.i += 1
        d = {}
        while True:
            self.blancs()
            if self.t[self.i] == '}':
                self.i += 1
                return d
            if self.t[self.i] in '\'"':
                cle = self.chaine()
            else:
                m = re.compile(r'[A-Za-z_$][\w$]*').match(self.t, self.i)
                cle = m.group()
                self.i = m.end()
            self.blancs()
            if self.t[self.i] == ':':
                self.i += 1
                d[cle] = self.valeur()
            else:                                   # raccourci { plan } = { plan: plan }
                d[cle] = Brut(cle)
            self.blancs()
            if self.t[self.i] == ',':
                self.i += 1

    def tableau(self):
        self.i += 1
        liste = []
        while True:
            self.blancs()
            if self.t[self.i] == ']':
                self.i += 1
                return liste
            liste.append(self.valeur())
            self.blancs()
            if self.t[self.i] == ',':
                self.i += 1


def texte_seul(html):
    """Titre sans balises HTML (noms d'activités Éléa) : 'g.L<sup>−1</sup>' → 'g.L−1'."""
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html)).strip()


def lire_application(depot, appli):
    """Plan et réglages SOM.init de l'application : {'nom', 'id', 'spa', 'cleEx', 'plan', 'fichier'}."""
    dossier = depot / appli
    candidats = [dossier / 'index.html'] + sorted((dossier / 'modules').glob('*.js')) + sorted((dossier / 'modules').glob('*.html'))
    plan = init = source = None
    for f in candidats:
        if not f.is_file():
            continue
        t = f.read_text(encoding='utf-8')
        m = re.search(r'\bPLAN\s*=\s*\[', t)
        if m and plan is None:
            plan, source = LecteurJS(t, m.end() - 1).valeur(), f
        m = re.search(r'SOM\.init\s*\(\s*\{', t)
        if m and init is None:
            init = LecteurJS(t, m.end() - 1).valeur()
    if plan is None or init is None:
        raise SystemExit(f'{appli} : plan (const PLAN = […]) ou SOM.init introuvable : application non prise en charge '
                         '(elle doit utiliser la navigation commune assets/sommaire.js)')
    return {'nom': init.get('nom', appli), 'id': init.get('id', appli), 'spa': bool(init.get('spa')),
            'cleEx': init.get('cleEx'), 'plan': plan, 'fichier': source}


def activites(app):
    """Sections (une par module) et activités (une par page du plan), dans l'ordre du sommaire."""
    sections, acts = [], []
    for m in app['plan']:
        titre_m = texte_seul(m['titre'])
        sections.append({'n': m['n'], 'titre': f"Module {m['n']} · {titre_m}", 'resume': m.get('desc', '')})
        parties = m.get('parties') or []
        for p in parties:
            pages = [o for o in ONGLETS if p.get(o)]
            for o in pages:
                perso = (p.get('noms') or {}).get(o)
                if len(parties) > 1 and len(pages) == 1:
                    titre = texte_seul(p['nom'])                      # ex. « Niveau 1 : nombres décimaux »
                elif perso:
                    titre = texte_seul(perso)                         # libellé choisi dans le plan (« Astuces »)
                else:
                    base = texte_seul(p['nom']) if len(parties) > 1 else titre_m
                    titre = f'{NOMS[o]} · {base}'
                acts.append({'section': m['n'], 'page': p[o], 'onglet': o, 'type': TYPES[o], 'titre': titre})
        if m.get('fiche'):
            acts.append({'section': m['n'], 'page': m['fiche'], 'onglet': 'fiche', 'type': 'vue',
                         'titre': f"{NOMS['fiche']} · {titre_m}"})
        if m.get('exercices'):
            acts.append({'section': m['n'], 'page': m['exercices'], 'onglet': 'exercices', 'type': 'exercices',
                         'titre': titre_m})
    return sections, acts


def fichier_de_page(app, appli, page):
    """Fichier lancé par l'activité, relatif à la racine du dépôt."""
    return f'{appli}/index.html' if app['spa'] else f'{appli}/modules/{page}.html'


if __name__ == '__main__':
    import sys
    depot = Path(__file__).resolve().parents[2]
    for a in sys.argv[1:]:
        app = lire_application(depot, a)
        print(app['nom'], app['id'], 'spa' if app['spa'] else 'pages', app['cleEx'], app['fichier'].relative_to(depot))
        secs, acts = activites(app)
        for s in secs:
            print(' ', s['titre'])
            for x in acts:
                if x['section'] == s['n']:
                    print('     ', x['type'].ljust(9), x['page'].ljust(20), x['titre'])
