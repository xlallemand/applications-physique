# pH dans Éléa : import et vérifications

Fichiers générés par `python3 Elea27/generer.py ph` (ne pas les modifier à la main) :

- `ph.mbz` : le parcours complet, à restaurer (méthode principale) ;
- `scorm/` : un paquet SCORM par activité (mises à jour, méthode de secours).

## Contenu du parcours

7 activités, dont 2 notées sur 20. Note globale : total du parcours = moyenne des séries faites, sur 20 (les activités non notées ont un coefficient 0).

| Section | Activité | Suivi dans Éléa | Paquet |
|---|---|---|---|
| Module 1 · La fonction logarithme décimal | Cours · La fonction logarithme décimal | terminé à la fin du cours | `ph-01-module_1_cours.zip` |
|  | Questions · La fonction logarithme décimal | note sur 20 (meilleure gardée) | `ph-02-module_1_questions.zip` |
|  | Fiche récapitulative · La fonction logarithme décimal | terminé à l'ouverture | `ph-03-fiche_1.zip` |
| Module 2 · Définition du pH | Cours · Définition du pH | terminé à la fin du cours | `ph-04-module_2_cours.zip` |
|  | Questions · Définition du pH | note sur 20 (meilleure gardée) | `ph-05-module_2_questions.zip` |
|  | Fiche récapitulative · Définition du pH | terminé à l'ouverture | `ph-06-fiche_2.zip` |
| Module 3 · Exercices d'entraînement | Exercices d'entraînement | terminé quand tous les exercices sont faits (sans note) | `ph-07-module_3.zip` |

## 1. Import (méthode principale)

1. Dans Éléa, crée un nouveau parcours avec le gabarit **« parcours vide »** et donne-lui un nom.
2. Ouvre ce parcours. **Plus → Réutilisation de cours**, puis dans le menu déroulant en haut de la page (« Importation ») choisis **Restauration**.
3. Dépose `ph.mbz` dans la zone « Fichiers », puis **Restauration**.
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

1. Refabrique : `python3 Elea27/generer.py ph`.
2. Dans chaque activité concernée : **Paramètres → Paquetage**, remplace le zip par celui de `scorm/` (même nom d'activité), enregistre. Les notes et l'achèvement des élèves sont conservés.

Nouvelle page ajoutée au plan de l'application : ajoute l'activité avec son zip (méthode de secours), ou restaure le nouveau `.mbz` dans un parcours neuf (à la rentrée, par exemple).
