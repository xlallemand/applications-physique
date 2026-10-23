# Prompt : sauvegarder sa progression dans un fichier et la reprendre sur un autre appareil

À donner tel quel à une nouvelle session, sur le dépôt `xlallemand/applications-physique`.

---

## 1. Objectif

Tout visiteur du site (`https://xlallemand.github.io/applications-physique/`) doit pouvoir retrouver sa progression sur un autre appareil ou un autre navigateur, **sans compte, sans serveur et sans service extérieur**.

Principe retenu par l'enseignant :

1. Sur le portail, un bouton **« Enregistrer ma progression »** télécharge un fichier `progression-physique-chimie-AAAA-MM-JJ.html`, fabriqué dans le navigateur.
2. Ce fichier contient la progression. Quand on l'ouvre dans un navigateur, il ouvre aussitôt le portail avec la progression dans l'adresse : `…/index.html#reprise=<données>`.
3. Le portail lit `#reprise=`, **ajoute** cette progression à celle du navigateur sans jamais rien abîmer (on garde toujours le meilleur), retire `#reprise=` de l'adresse et affiche un message clair.

Le passage par l'adresse est obligatoire : un fichier ouvert depuis l'ordinateur (`file://`) n'a pas accès au `localStorage` du site, car chaque origine a le sien.

L'élève n'a donc pas de bouton « Reprendre » à chercher : il ouvre son fichier, et c'est tout. Une reprise de secours (« Reprendre depuis un fichier », §6) sert seulement quand l'ouverture du fichier ne marche pas.

## 2. À lire avant de commencer

1. `CLAUDE.md`, puis **en entier** `docs/charte-applications.md` : style, couleurs (variables de `assets/theme.css` uniquement), police sans empattement, souris et tactile, tutoiement.
2. `index.html` (portail : `APPS`, champ `dossier`), `assets/sommaire.js` (lignes 44-62 : progression), `assets/theme.css`.
3. L'inventaire des clés : `grep -rn "localStorage" --include=*.html --include=*.js .` (hors `Elea27/`).

## 3. Ce qui est stocké aujourd'hui (à vérifier par le grep)

Toutes les applications partagent l'origine `xlallemand.github.io`, donc le même `localStorage`. Cette origine peut aussi servir à d'autres dépôts de l'enseignant : **n'exporte que les clés des applications du portail**.

| Clé | Écrite par | Contenu |
|---|---|---|
| `<dossier>-progression` | `assets/sommaire.js`, `cinematique/modules/cin.js`, `transport-electricite/modules/te.js` | `{ derniere, pages: { <page>: { fait, note } } }` |
| `<dossier>-exercices` | pages d'exercices (`module_N.html`) | `{ <id>: { pts, max } }` |
| `combustions-exercices-faits` | `combustions/modules/module_7.html` | tableau d'indices d'exercices déjà tirés |
| `principe-dynamique-atelier` | `principe-dynamique/modules/module_2_simulation.html` | `{ <id>: true }` |
| `equamath_v2` | `equations-college/index.html` | `{ xp, results: { <module>: { score, bestScore, xp, attempts } }, showKb }` |

`<dossier>` = valeur `dossier` d'une entrée `APPS` du portail. C'est aussi l'`id` de `SOM.init` dans toutes les applications : vérifie-le.

Clés à exporter : toute clé qui commence par `<dossier>-` pour un dossier de `APPS`, plus `equamath_v2`. Pour savoir à quelle application appartient une clé, prends le **préfixe le plus long** (`equations-en-physique-avec-aide-…` n'appartient pas à `equations-en-physique`).

## 4. Règles de fusion (« ouvrir un vieux fichier n'écrase jamais une progression plus récente »)

| Donnée | Règle |
|---|---|
| `pages[<page>].fait` | vrai si vrai d'un côté ou de l'autre |
| `pages[<page>].note` | la plus haute |
| `derniere` | celle du navigateur si elle existe, sinon celle du fichier |
| `<dossier>-exercices[<id>]` | le meilleur résultat (`pts / max` le plus haut) |
| `combustions-exercices-faits` | réunion des deux listes, sans doublon |
| `principe-dynamique-atelier` | réunion |
| `equamath_v2` | `results` : pour chaque module, l'entrée au meilleur `bestScore`, `attempts` le plus grand ; `xp` le plus grand ; `showKb` celui du navigateur |
| clé inconnue | copiée si absente du navigateur, sinon on garde celle du navigateur |

La fusion doit donner le même résultat quand on rouvre le même fichier plusieurs fois (idempotente).

## 5. Format des données

- Objet `{ v: 1, date: "<ISO>", donnees: { <clé>: <valeur JSON déjà lue> } }`, converti en UTF-8, puis en base64url, placé après `#reprise=`.
- Pas de compression au départ. Mesure la taille de l'adresse avec une progression **complète** de toutes les applications. Si elle dépasse 100 000 caractères, propose une compression (`CompressionStream`) avant de l'ajouter.
- À l'arrivée, tout est **non fiable** : n'importe qui peut fabriquer un lien `#reprise=`.
  - Taille plafonnée, JSON vérifié, version `v` connue.
  - Seules les clés autorisées (§3), chaque valeur avec la forme attendue.
  - Rien n'est inséré en HTML sans échappement (`textContent`).
  - En cas d'erreur, rien n'est modifié et un message explique quoi faire (§7).

## 6. Ce qu'il faut construire

Code dans un nouveau fichier `assets/progression.js` (styles dans `assets/progression.css` si besoin), chargé **par le portail seulement**. Ne touche ni aux applications, ni à `assets/sommaire.js`, ni à `Elea27/`.

### Sur le portail

- Un bouton **« Enregistrer ma progression »**, visible sans défiler, sur ordinateur comme sur téléphone (par exemple dans `hero-nav`).
- Juste à côté, un lien discret **« Reprendre depuis un fichier »** : c'est la reprise de secours. Elle choisit le fichier `.html` (champ `<input type="file">`, qui marche aussi sur iPhone et Android) et en extrait les données (§ « Le fichier téléchargé »). La fusion et le message sont les mêmes qu'avec `#reprise=`.
- Au chargement, si l'adresse contient `#reprise=` : fusion, `history.replaceState` pour retirer l'ancre, message de résultat (§7).

### La fenêtre « Enregistrer ma progression »

Un `<dialog>` accessible : focus piégé, fermeture par Échap et par un bouton « Fermer », lisible à 360 px de large, en mode clair et sombre.

**Cas particuliers, avant tout le reste :**
- Stockage indisponible (navigation privée, réglage du navigateur) : « Ce navigateur ne garde pas ta progression (navigation privée ou réglage du navigateur). Il n'y a rien à enregistrer. Travaille dans une fenêtre normale. »
- Aucune progression : « Tu n'as encore rien fait sur ce navigateur : il n'y a rien à enregistrer pour l'instant. »

**Étape 1 : ce qui va se passer.** Trois phrases courtes, à peu près :
> Ta progression est gardée dans ce navigateur, sur cet appareil. Pour la retrouver ailleurs, enregistre-la dans un fichier. Il suffira d'ouvrir ce fichier avec un navigateur pour la reprendre. Ouvrir un ancien fichier n'efface jamais une progression plus récente : on garde toujours ton meilleur résultat.

Puis le résumé de ce qui sera enregistré : « 5 applications : pH, Cinématique… ».

**Étape 2 : « Où vas-tu reprendre ton travail ? »** Quatre choix (gros boutons), le plus probable présélectionné d'après l'appareil détecté :
1. Sur cet appareil, plus tard (si l'historique est effacé, ou dans un autre navigateur)
2. Sur un ordinateur (Windows, Mac, Linux, Chromebook)
3. Sur un téléphone ou une tablette Android
4. Sur un iPhone ou un iPad

**Étape 3 : bouton « Télécharger mon fichier ».** Le téléchargement part du clic (geste de l'utilisateur, nécessaire sur iPhone). La fenêtre affiche ensuite la marche à suivre, en trois blocs numérotés, adaptés à **l'appareil actuel** (détecté) et à **l'appareil choisi** :

1. **Retrouver ton fichier ici** : selon l'appareil et le navigateur actuels.
2. **L'envoyer sur l'autre appareil** : bloc masqué pour le choix 1.
3. **L'ouvrir là-bas** : selon le choix, avec un dépliant **« Ça ne marche pas ? »** qui liste les problèmes et leurs remèdes (§8).

Un bouton « Changer d'appareil » revient à l'étape 2 sans télécharger une seconde fois. Un bouton « Télécharger à nouveau » est proposé si le premier téléchargement n'a rien donné.

### Détection de l'environnement

- Système : Windows, macOS, Linux, ChromeOS, Android, iOS / iPadOS. Utilise `navigator.userAgentData` quand il existe, sinon `navigator.userAgent`. Un iPad se présente comme un Mac : Mac + `navigator.maxTouchPoints > 1` = iPad.
- Navigateur : Chrome, Edge, Firefox, Safari, Samsung Internet, Opera, autre.
- Si la détection échoue, textes génériques (« ton navigateur », « le dossier Téléchargements »), jamais de texte faux.
- Le nom du navigateur détecté apparaît dans les messages (« la progression est gardée dans **Chrome** »).

### Le fichier téléchargé

Une page HTML autonome : styles en ligne (couleurs recopiées de `theme.css`, police sans empattement), **aucune ressource extérieure**. Elle doit rester utile même si son script ne se lance pas (aperçu de l'appli Fichiers sur iPhone, par exemple).

- Nom : `progression-physique-chimie-AAAA-MM-JJ.html`. La date aide l'élève à trouver le plus récent.
- Données lisibles dans `<script type="application/json" id="progression">` : c'est là que la reprise de secours les lit, et elles restent récupérables si le site change d'adresse.
- Un **vrai lien** `<a href="…#reprise=…">Reprendre ma progression</a>`, écrit en dur dans le HTML et non ajouté par le script, en gros bouton.
- Un script qui fait `location.replace(<même adresse>)` dès l'ouverture.
- Le texte visible :
  - titre « Ma progression en Physique-Chimie », date, liste des applications ;
  - « Ouverture du site… Si rien ne se passe, touche le bouton. » ;
  - « Il faut être connecté à Internet. » ;
  - « Ta progression est ajoutée au navigateur qui ouvre ce fichier : ouvre-le avec celui où tu travailles. »
- Adresse du site : celle du portail au moment de l'enregistrement (`location.origin + location.pathname`). Le système marche ainsi aussi en test local.

## 7. Messages au retour sur le portail

- **Réussite :** « Progression restaurée. » Puis le détail : applications mises à jour, et applications déjà plus avancées ici, restées telles quelles. Ensuite :
  > Elle est gardée dans **<navigateur>** sur cet appareil. Si tu travailles avec un autre navigateur, ouvre ton fichier avec lui.
- **Safari (iPhone, iPad, Mac) :**
  > Safari efface la progression d'un site que tu n'ouvres pas pendant une semaine : enregistre un nouveau fichier à la fin de chaque séance.
- **Rien de nouveau :** « Ce fichier ne contient rien de plus que ce navigateur : tu étais déjà au même niveau ou plus loin. »
- **Données abîmées ou incomplètes :** « Ce fichier de progression est abîmé ou incomplet. Ta progression actuelle n'a pas changé. Essaie avec un fichier plus récent ou retélécharge-le. »
- **Stockage indisponible :** « Ce navigateur ne peut pas garder ta progression (navigation privée ou réglage). Ouvre ton fichier dans une fenêtre normale ou avec un autre navigateur. »

## 8. Contenu de la marche à suivre (à vérifier, compléter, puis rédiger court)

Phrases courtes, étapes numérotées, noms des boutons et des dossiers **tels qu'ils apparaissent à l'écran en français**, aucun mot technique (ni « localStorage », ni « origine », ni « URL »). Ce qui suit est une base : vérifie chaque point, corrige ce qui est faux, ne garde pour chaque environnement que ce qui le concerne.

### Retrouver le fichier sur l'appareil actuel

- **Ordinateur, Chrome ou Edge** : dossier « Téléchargements » ; l'icône de téléchargement en haut à droite du navigateur le montre.
- **Firefox** : flèche de téléchargement en haut à droite.
- **Safari (Mac)** : dossier « Téléchargements ».
- Si le navigateur demande où enregistrer : choisis un endroit que tu retrouveras (clé USB, Bureau).
- **Poste du lycée** : le dossier Téléchargements peut être vidé quand tu te déconnectes. Copie le fichier sur ta clé USB ou dans ton espace de l'ENT avant de partir.
- **Android** : notification « Téléchargement terminé » ; appli « Fichiers » (« Mes fichiers » sur Samsung), dossier « Téléchargements » (« Download »).
- **iPhone / iPad, Safari** : touche « Télécharger » dans la fenêtre qui s'affiche. Le fichier va dans l'appli « Fichiers », dossier « Téléchargements » (iCloud Drive ou « Sur mon iPhone »).
- **iPhone / iPad, Chrome** : barre « Ouvrir dans… », puis « Enregistrer dans Fichiers ».
- **Le navigateur signale un fichier « dangereux » ou bloque le téléchargement** : choisis « Conserver ». Le fichier ne contient que ta progression. Vérifie si ce message apparaît vraiment, et sur quels navigateurs.

### L'envoyer sur l'autre appareil

- Clé USB.
- Espace de stockage de l'ENT, Google Drive, OneDrive, iCloud Drive : sur l'autre appareil, **télécharge** le fichier avant de l'ouvrir. L'aperçu de ces sites affiche du code ou une page vide, et ne restaure rien.
- Mail à toi-même : certaines messageries refusent ou signalent les fichiers `.html`. Si c'est refusé, mets-le dans un dossier compressé (`.zip`) ou choisis une autre solution.
- AirDrop (entre appareils Apple), Partage à proximité (Android, Windows).

### L'ouvrir

**Ordinateur.** Double-clique sur le fichier. Il s'ouvre dans ton navigateur, qui ouvre le site et affiche « Progression restaurée ».

Ça ne marche pas ?
- Il s'ouvre dans un autre logiciel (Bloc-notes, Word…) : clic droit sur le fichier, « Ouvrir avec », puis ton navigateur. Ou fais glisser le fichier dans une fenêtre du navigateur.
- Il s'ouvre dans un autre navigateur que le tien : la progression irait dans celui-là. Ouvre-le avec le bon : « Ouvrir avec », ou Ctrl+O (Cmd+O sur Mac) dans ton navigateur, puis choisis le fichier.
- La page « Ma progression » reste affichée : clique sur « Reprendre ma progression ».
- Pas de connexion Internet : connecte-toi, puis rouvre le fichier.
- La progression disparaît quand tu fermes le navigateur : tu es en navigation privée, ou le navigateur efface tout en se fermant. Utilise une fenêtre normale.
- Rien ne change : tu étais déjà plus loin sur ce navigateur. C'est normal, on garde toujours le meilleur.
- Rien ne marche : va sur le site, « Reprendre depuis un fichier », puis choisis ton fichier.

**Android.** Ouvre l'appli « Fichiers », dossier « Téléchargements », touche le fichier et choisis Chrome (ou ton navigateur). Autre chemin : dans Chrome, menu ⋮ › « Téléchargements », puis touche le fichier.

Ça ne marche pas ?
- Il s'ouvre dans un « lecteur HTML » ou affiche du texte : choisis « Ouvrir avec », puis ton navigateur.
- La page « Ma progression » reste affichée : touche « Reprendre ma progression ».
- Rien ne marche : va sur le site, « Reprendre depuis un fichier », puis choisis ton fichier dans « Téléchargements ».

**iPhone / iPad.** Présente **d'emblée les deux façons**, car l'aperçu de l'appli Fichiers ne lance pas toujours le script :
1. Appli « Fichiers », dossier « Téléchargements » : touche le fichier, puis « Reprendre ma progression ».
2. Si ça ne marche pas : ouvre le site dans Safari, « Reprendre depuis un fichier », « Parcourir », puis choisis ton fichier.

Ça ne marche pas ?
- Tu travailles avec Chrome sur iPhone : utilise la façon 2 dans Chrome, sinon la progression irait dans Safari.
- Safari efface la progression d'un site que tu n'ouvres pas pendant une semaine : enregistre un nouveau fichier à la fin de chaque séance.

**Sur cet appareil, plus tard.** Garde le fichier. Quand ta progression a disparu (historique effacé, autre navigateur), ouvre-le comme indiqué pour cet appareil.

## 9. Charte

Mets à jour `docs/charte-applications.md` :
- §5 « Progression » : enregistrement dans un fichier, reprise, règles de fusion. Ajoute la règle : **toute nouvelle clé `localStorage` d'une application commence par `<dossier>-`**, sinon elle n'est pas enregistrée.
- §12 : une ligne « Enregistrer / reprendre la progression » → `assets/progression.js`.

## 10. Vérifications avant livraison

Avec Chromium (Playwright), le portail servi en local (`python3 -m http.server`) pour avoir une vraie origine. Le serveur ne sert qu'aux tests : le site doit toujours marcher sans serveur.

1. **Aller-retour** : remplir le `localStorage` de plusieurs applications, cliquer « Enregistrer ma progression », récupérer le fichier, l'ouvrir en `file://` dans un **nouveau contexte vide**, puis vérifier la redirection, la fusion, l'ancre retirée et le message.
2. **Fusion** : un vieux fichier (notes plus basses, moins de pages) ne fait rien baisser ; un fichier plus avancé complète ; rouvrir le même fichier ne change plus rien.
3. **Sécurité** : clés étrangères (autre dépôt sur la même origine) ni exportées ni importées ; `#reprise=` tronqué, invalide ou trop long = message d'erreur, rien de modifié ; aucun HTML injecté par les noms de clés ou les valeurs.
4. **Fichier sans script** (JavaScript désactivé) : le lien « Reprendre ma progression » marche seul.
5. **Reprise de secours** avec le fichier `.html`.
6. **Taille** : adresse obtenue avec une progression complète de toutes les applications (à indiquer dans le compte rendu).
7. **Cas particuliers** : stockage indisponible, aucune progression.
8. **Fenêtre** : au clavier (Tab, Échap), au toucher, à 360 px de large, en mode clair et sombre, aucun défilement horizontal, aucune erreur dans la console.
9. **Textes affichés** pour chaque combinaison (appareil actuel × appareil choisi) : simuler les `userAgent` de Windows/Chrome, Windows/Edge, Mac/Safari, Linux/Firefox, ChromeOS, Android/Chrome, Android/Samsung, iPhone/Safari, iPhone/Chrome et iPad. Joindre les captures.

Limites à écrire dans le compte rendu : ni iPhone, ni iPad, ni Android, ni les messageries ne sont testables dans cet environnement. Donne à l'enseignant une **liste courte de tests à faire à la main** sur ces appareils (enregistrer, transférer, ouvrir, reprise de secours).

## 11. Hors périmètre

- Aucun compte, aucun serveur, aucun service extérieur.
- Pas de bouton dans les applications elles-mêmes (portail seulement), sauf demande de l'enseignant.
- Ne modifie ni les applications, ni `Elea27/`.
