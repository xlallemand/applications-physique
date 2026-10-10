# Essai Conversions dans Éléa : procédure d'import et vérifications

Fichiers à récupérer dans ce dossier :

- `conversions-essai.mbz` : le parcours complet (méthode principale) ;
- `scorm/` : les 4 paquets SCORM séparés (méthode de secours, seulement si la restauration échoue).

Contenu du parcours :

| Section | Activité | Note |
|---|---|---|
| Module 1 · Les préfixes et la méthode | Cours : les préfixes et la méthode | non noté (achevé à la fin du cours) |
| | Apprendre les préfixes | sur 20 |
| Module 2 · S'entraîner à convertir | Niveau 1 : nombres décimaux | sur 20 |
| | Niveau 2 : puissances de 10 | sur 20 |

Note globale : total du parcours = moyenne des séries faites, sur 20.

---

## 1. Import (méthode principale, environ 3 minutes)

1. Dans Éléa, crée un nouveau parcours avec le gabarit **« parcours vide »**. Donne-lui un nom (par exemple « Conversions (essai) »).
2. Ouvre ce parcours. Dans le menu horizontal : **Plus → Réutilisation de cours**, puis dans le menu déroulant en haut de la page (« Importation ») choisis **Restauration**.
3. Dépose `conversions-essai.mbz` dans la zone « Fichiers » (glisser-déposer ou « Choisir un fichier… »), puis **Restauration**.
4. Page « Confirmer » : descends en bas, **Continuer**.
   - Un avertissement « sauvegarde créée avec une version plus récente » ne doit **pas** apparaître (le fichier se déclare Moodle 4.1). S'il apparaît, continue quand même et note-le.
5. Page « Destination » : coche **« Fusionner le cours sauvegardé avec ce cours »**, puis **Continuer**.
6. Pages « Réglages » et « Schéma » : ne change rien, **Suivant** deux fois.
7. Page « Vérification » : **Effectuer la restauration**.
   - Si Éléa affiche « La restauration est en attente » avec une barre de progression : c'est normal, elle se fait en arrière-plan. Attends une à deux minutes puis recharge le parcours.
8. **Continuer** : le parcours s'affiche avec ses deux sections et ses quatre activités.

## 2. Vérifications à faire

Pour tester comme un élève : menu de ton profil → **Prendre le rôle de… → Étudiant** (ou un compte élève de test).
Attention : en « prendre le rôle », les notes ne sont pas toujours enregistrées. Un vrai compte élève de test est plus sûr pour les points c et d.

a. **Parcours** : deux sections nommées, quatre activités dans l'ordre du tableau ci-dessus, chacune avec la mention d'achèvement (« À faire »).

b. **Ouverture d'une activité** : un clic ouvre directement l'application, sans page intermédiaire, sur la bonne page (le cours, ou la série). Pas de sommaire de l'application à gauche, pas de lien vers les autres pages. Le bouton **« Quitter l'activité »** d'Éléa ramène au parcours.

c. **Cours** : va jusqu'à la carte « À retenir » (ou « Afficher tout le cours »), quitte l'activité. L'activité passe à **« Terminé »**.

d. **Notes** : fais « Apprendre les préfixes » jusqu'au « Résultat final », quitte l'activité.
   - Dans **Notes** (carnet), la note sur 20 apparaît pour l'activité, et le **total du parcours** sur 20.
   - Refais la série avec un moins bon résultat : la note du carnet ne baisse pas. Avec un meilleur résultat : elle monte.
   - Une série ouverte mais pas finie ne compte pas dans le total.

e. **Côté enseignant** : Notes → Rapport de l'évaluateur (une colonne par série + total), et le rapport d'achèvement des activités.

f. **Affichage** : sur un téléphone ou une tablette, l'application est lisible, sans défilement horizontal.

Ce que je voudrais savoir en retour :

- la restauration est-elle passée, avec ou sans avertissement ou message d'erreur ? (une capture si possible) ;
- les points a à f sont-ils corrects ? sinon lesquels, avec ce que tu vois ;
- la version de Moodle d'Éléa si tu la trouves (souvent en bas de page ou dans l'aide).

## 3. Méthode de secours : paquets SCORM à la main (si la restauration échoue)

Pour chaque fichier de `scorm/`, dans la bonne section du parcours, mode édition activé :

1. **Ajouter une activité ou une ressource → Paquetage SCORM**.
2. Nom : celui du tableau ci-dessus ; **Paquetage** : déposer le zip.
3. **Apparence** : Afficher le paquetage « Fenêtre courante » ; Saut de la page d'accès au contenu « Toujours » ; Afficher la structure du cours « Désactivé » ; Afficher la navigation « Non ».
4. **Note** : Méthode d'évaluation « Note la plus haute », Note maximale **20** (pour le cours : « Objets d'apprentissage »).
5. **Gestion des tentatives** : Nombre de tentatives « Illimité », Évaluation des tentatives « Tentative la plus haute », Forcer une nouvelle tentative « Quand la tentative précédente est terminée, réussie ou échouée ».
6. **Achèvement d'activité** : « Ajouter des conditions », **Exiger le statut** « Terminé ».
7. Enregistrer.

Puis, pour la note globale : **Notes → Configuration du carnet de notes**, total du parcours : « Moyenne pondérée des notes », note maximale 20, coefficient 0 pour le cours.

## 4. Mise à jour d'une activité sans perdre les notes

Si l'application change : refabriquer les paquets, puis dans chaque activité concernée **Paramètres → Paquetage** : remplacer le zip, enregistrer. Les notes et l'achèvement des élèves sont conservés (l'identifiant interne du paquet ne change pas).
