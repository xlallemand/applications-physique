# Conversions dans Éléa : import et vérifications

Fichiers générés par `python3 Elea27/generer.py conversions` (ne pas les modifier à la main) :

- `conversions.mbz` : le parcours complet, à restaurer (méthode principale) ;
- `scorm/` : un paquet SCORM par activité (mises à jour, méthode de secours).

## Contenu du parcours

14 activités, dont 7 notées sur 20. Note globale : total du parcours = moyenne des séries faites, sur 20 (les activités non notées ont un coefficient 0).

| Section | Activité | Suivi dans Éléa | Paquet |
|---|---|---|---|
| Module 1 · Les préfixes et la méthode | Cours · Les préfixes et la méthode | terminé à la fin du cours | `conversions-01-cours.zip` |
|  | Astuces | terminé à l'ouverture | `conversions-02-astuces.zip` |
|  | Apprendre les préfixes | note sur 20 (meilleure gardée) | `conversions-03-prefixes.zip` |
|  | Fiche récapitulative · Les préfixes et la méthode | terminé à l'ouverture | `conversions-04-fiche-1.zip` |
| Module 2 · S'entraîner à convertir | Niveau 1 : nombres décimaux | note sur 20 (meilleure gardée) | `conversions-05-niveau-1.zip` |
|  | Niveau 2 : puissances de 10 | note sur 20 (meilleure gardée) | `conversions-06-niveau-2.zip` |
|  | Niveau 3 : sans aide | note sur 20 (meilleure gardée) | `conversions-07-niveau-3.zip` |
|  | Niveau 4 : expert | note sur 20 (meilleure gardée) | `conversions-08-niveau-4.zip` |
| Module 3 · Unités au carré et au cube | Cours · Unités au carré et au cube | terminé à la fin du cours | `conversions-09-cours-sq.zip` |
|  | Entraînement · Unités au carré et au cube | note sur 20 (meilleure gardée) | `conversions-10-ex-sq.zip` |
|  | Fiche récapitulative · Unités au carré et au cube | terminé à l'ouverture | `conversions-11-fiche-3.zip` |
| Module 4 · Unités composées | Cours · Unités composées | terminé à la fin du cours | `conversions-12-cours-comp.zip` |
|  | Entraînement · Unités composées | note sur 20 (meilleure gardée) | `conversions-13-ex-comp.zip` |
|  | Fiche récapitulative · Unités composées | terminé à l'ouverture | `conversions-14-fiche-4.zip` |

## 1. Import (méthode principale)

1. Dans Éléa, crée un nouveau parcours avec le gabarit **« parcours vide »** et donne-lui un nom.
2. Ouvre ce parcours. **Plus → Réutilisation de cours**, puis dans le menu déroulant en haut de la page (« Importation ») choisis **Restauration**.
3. Dépose `conversions.mbz` dans la zone « Fichiers », puis **Restauration**.
4. Page « Confirmer » : **Continuer** en bas de page.
5. Page « Destination » : coche **« Fusionner le cours sauvegardé avec ce cours »**, puis **Continuer**.
6. Pages « Réglages » et « Schéma » : ne change rien, **Suivant** deux fois.
7. Page « Vérification » : **Effectuer la restauration**. Si la restauration est « en attente », patiente une à deux minutes puis recharge le parcours.

## 2. Vérifications (avec un compte élève de test)

- Une section par module, les activités dans l'ordre du tableau, chacune avec sa mention d'achèvement.
- Chaque activité ouvre directement la bonne page de l'application, sans sommaire ni lien vers les autres pages ; « Quitter l'activité » ramène au parcours.
- Cours : terminé à la dernière carte (ou avec « Afficher tout le cours »). Fiches et exemples : terminés à l'ouverture.
- Séries : note sur 20 dans le carnet, la meilleure est gardée ; total du parcours sur 20.
- Exercices : terminés quand tous les exercices de la liste sont faits ; en revenant, l'élève retrouve ses résultats.

## 3. Méthode de secours : paquets SCORM à la main

Pour chaque zip de `scorm/`, dans la bonne section, mode édition activé : **Ajouter une activité ou une ressource → Paquetage SCORM**, nom du tableau, déposer le zip, puis :

- **Apparence** : afficher le paquetage « Fenêtre courante » ; saut de la page d'accès au contenu « Toujours » ; structure du cours « Désactivé » ; navigation « Non ».
- **Note** : séries : méthode « Note la plus haute », note maximale **20** ; autres activités : méthode « Objets d'apprentissage ».
- **Gestion des tentatives** : tentatives « Illimité », évaluation « Tentative la plus haute » ; forcer une nouvelle tentative « Quand la tentative précédente est terminée, réussie ou échouée » (sauf exercices : « Non »).
- **Achèvement d'activité** : « Ajouter des conditions », **Exiger le statut** « Terminé ».

Puis **Notes → Configuration du carnet de notes** : total du parcours en « Moyenne pondérée des notes », note maximale 20, coefficient 0 pour les activités non notées.

## 4. Mettre à jour l'application dans Éléa

1. Refabrique : `python3 Elea27/generer.py conversions`.
2. Dans chaque activité concernée : **Paramètres → Paquetage**, remplace le zip par celui de `scorm/` (même nom d'activité), enregistre. Les notes et l'achèvement des élèves sont conservés.

Nouvelle page ajoutée au plan de l'application : ajoute l'activité avec son zip (méthode de secours), ou restaure le nouveau `.mbz` dans un parcours neuf (à la rentrée, par exemple).
