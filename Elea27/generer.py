#!/usr/bin/env python3
"""
Outil local : fabrique le parcours Éléa d'une ou plusieurs applications du dépôt.

    python3 Elea27/generer.py conversions ph

Pour chaque application, écrit Elea27/<application>/ :
  - <application>.mbz   parcours complet à restaurer dans Éléa (une section par module,
                        une activité « Paquetage SCORM » par page du plan, carnet réglé) ;
  - scorm/*.zip         un paquet SCORM par activité (mises à jour, méthode de secours) ;
  - PROCEDURE.md        import, vérifications, mise à jour.
Le plan est lu dans l'application (const PLAN, SOM.init) : rien d'autre à décrire.
Python 3 et sa bibliothèque standard uniquement, aucune connexion nécessaire.
Choix et réglages : Elea27/README.md.
"""
import sys
from pathlib import Path

sys.dont_write_bytecode = True                  # pas de __pycache__ dans le dépôt
from outil import mbz, paquet, plan, procedure  # noqa: E402

ELEA = Path(__file__).resolve().parent
DEPOT = ELEA.parent


def generer(appli):
    app = plan.lire_application(DEPOT, appli)
    sections, acts = plan.activites(app)
    communs, alertes = paquet.fichiers_communs(DEPOT, appli, ELEA / 'commun')

    sortie = ELEA / appli
    (sortie / 'scorm').mkdir(parents=True, exist_ok=True)
    for ancien in (sortie / 'scorm').glob('*.zip'):          # paquets d'une fabrication précédente
        ancien.unlink()
    for k, a in enumerate(acts, 1):
        a['ident'] = f"{app['id']}-{a['page']}"               # identifiant fixe (notes gardées à la mise à jour)
        a['lancement'] = plan.fichier_de_page(app, appli, a['page'])
        if a['lancement'] not in communs:
            raise SystemExit(f"{appli} : page {a['page']} du plan introuvable ({a['lancement']})")
        a['fichiers'] = paquet.fichiers_du_paquet(communs, a, app)
        a['zip'] = sortie / 'scorm' / f"{appli}-{k:02d}-{a['page']}.zip"
        paquet.ecrire_zip(a['zip'], a['fichiers'])

    fichier_mbz = sortie / f'{appli}.mbz'
    mbz.fabriquer(fichier_mbz, nom_cours=app['nom'], court=app['id'], sections=sections, activites=acts)
    procedure.ecrire(sortie / 'PROCEDURE.md', app, appli, sections, acts)

    print(f"{app['nom']} : {len(sections)} sections, {len(acts)} activités dont "
          f"{sum(a['type'] == 'serie' for a in acts)} notées → {fichier_mbz.relative_to(DEPOT)} "
          f"({fichier_mbz.stat().st_size // 1024} Ko)")
    for alerte in alertes:
        print('  attention :', alerte)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    for nom in sys.argv[1:]:
        generer(nom.strip('/'))
