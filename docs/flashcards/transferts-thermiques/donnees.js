/* Relecture des flashcards de l'application « Chapitre 5 : Flux et transferts thermiques » (transferts-thermiques)
   Tour 1 : compétences et paquets proposés (voir docs/flashcards/prompt-generation.md)
   Un paquet par cours (modules 1 à 4) ; le module 5 (exercices du manuel) n'a pas de cours :
   ses méthodes et exercices-types sont rangés dans les paquets m3 et m4.
   Prérequis proposés : chaque paquet après son cours. */
RELECTURE({
  dossier: 'transferts-thermiques', titre: 'Chapitre 5 : Flux et transferts thermiques', court: 'Chapitre 5', matiere: 'physique',
  tour: 1, etape: 'competences',
  // pages de cours de l'application (prérequis possibles)
  cours: [
    { cle: 'module_1_cours', nom: 'Cours : température et modes de transfert' },
    { cle: 'module_2_cours', nom: 'Cours : flux thermique' },
    { cle: 'module_3_cours', nom: 'Cours : résistance thermique d\'une paroi' },
    { cle: 'module_4_cours', nom: 'Cours : parois composées' },
  ],
  paquets: [
    /* ---------- Module 1 · Température et modes de transfert ---------- */
    { id: 'm1', module: 1, titre: 'Température et modes de transfert', apres: ['module_1_cours'],
      competences: [
        { id: 'c1', texte: 'Passer des °C aux kelvins et des kelvins aux °C : T (K) = θ (°C) + 273 (de tête)', types: ['formule'], source: 'fiche_1 · Kelvins et degrés Celsius ; série 1 · conversions (diagnostic : 273 retiré au lieu d\'être ajouté)' },
        { id: 'c2', texte: 'Donner le zéro absolu (0 K = −273 °C) ; savoir qu\'une température en kelvins n\'est jamais négative', types: ['savoir'], source: 'fiche_1 · Kelvins et degrés Celsius ; série 1 · zéro absolu' },
        { id: 'c3', texte: 'Lire les repères sur les deux échelles K et °C (zéro absolu, azote liquide, eau qui gèle, eau qui bout)', types: ['schema'], source: 'cours 1 · figure des deux échelles ; fiche_1' },
        { id: 'c4', texte: 'Calculer un écart de température ΔT = T_chaud − T_froid avec une température négative (de tête)', types: ['reflexe'], source: 'fiche_1 · Écart de température ; série 1 · diagnostic « soustraire un nombre négatif »' },
        { id: 'c5', texte: 'Savoir qu\'un écart de température a la même valeur en K et en °C (on n\'ajoute pas 273 à un écart)', types: ['reflexe'], source: 'fiche_1 · Écart de température ; série 1 · diagnostic « 273 ajouté à un écart »' },
        { id: 'c6', texte: 'Définir les trois modes de transfert : conduction, convection, rayonnement', types: ['definition'], source: 'fiche_1 · Modes et sens du transfert ; À retenir' },
        { id: 'c7', texte: 'Reconnaître les trois modes de transfert sur un schéma (casserole sur une plaque)', types: ['schema'], source: 'cours 1 · étape 3, exemple de la casserole ; figure des modes' },
        { id: 'c8', texte: 'Donner le sens du transfert thermique (du chaud vers le froid) ; le « froid » ne se transfère pas', types: ['savoir', 'reflexe'], source: 'fiche_1 · sens du transfert ; série 1 · diagnostic « le froid qui se transfère »' },
      ] },

    /* ---------- Module 2 · Flux thermique ---------- */
    { id: 'm2', module: 2, titre: 'Flux thermique', apres: ['module_2_cours'],
      competences: [
        { id: 'c1', texte: 'Définir le flux thermique Φ : une puissance, en W', types: ['definition'], source: 'fiche_2 · Le flux thermique est une puissance ; série 2 · unité de Φ' },
        { id: 'c2', texte: 'Connaître la formule Φ = Q / Δt et les unités (W, J, s)', types: ['formule'], source: 'fiche_2 · Le flux thermique ; À retenir' },
        { id: 'c3', texte: 'Relier Φ = Q / Δt et Q = Φ × Δt à P = E / Δt et E = P × Δt (mêmes formules, autres noms)', types: ['savoir'], source: 'fiche_2 · tableau énergie et puissance / transfert thermique ; série 2 · flux et puissance' },
        { id: 'c4', texte: 'Connaître la formule Q = Φ × Δt : Δt en s donne des J, Δt en h donne des Wh', types: ['formule'], source: 'fiche_2 · L\'énergie transférée ; À retenir' },
        { id: 'c5', texte: 'Convertir une durée en heures et minutes en secondes (1 h 15 = 4 500 s, et non 1,15 h)', types: ['reflexe'], source: 'cours 2 · étape 2 ; série 2 · diagnostic « durée non convertie en secondes » ; exercice 7' },
        { id: 'c6', texte: 'Connaître les conversions d\'énergie : kJ, MJ, Wh, kWh (1 Wh = 3 600 J)', types: ['savoir'], source: 'fiche_2 · Conversions ; série 2 · Wh et joules' },
        { id: 'c7', texte: 'Exercice-type : calculer un flux à partir d\'une énergie en kJ et d\'une durée en h et min (calculatrice)', types: ['methode'], source: 'exercice 7 a) · 750 kJ en 1 h 15 ; exercice 8 c)' },
        { id: 'c8', texte: 'Exercice-type : calculer l\'énergie perdue en un jour, en J et en kWh (calculatrice)', types: ['methode'], source: 'cours 2 · étape 3 (vitrage, 88 W pendant 24 h) ; exercice 19 d) et e)' },
      ] },

    /* ---------- Module 3 · Résistance thermique d'une paroi ---------- */
    { id: 'm3', module: 3, titre: 'Résistance thermique d\'une paroi', apres: ['module_3_cours'],
      competences: [
        { id: 'c1', texte: 'Connaître la formule Φ = ΔT / R_th et les unités (W, K, K·W⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
        { id: 'c2', texte: 'Connaître la formule R_th = e / (λ × S) et les unités (m, m², W·m⁻¹·K⁻¹)', types: ['formule'], source: 'fiche_3 · Flux et résistance thermique ; À retenir' },
        { id: 'c3', texte: 'Définir la conductivité thermique λ : petite pour un matériau isolant', types: ['definition'], source: 'fiche_3 · Raisonner ; série 3 · le meilleur isolant (tableau de λ)' },
        { id: 'c4', texte: 'Donner le flux et son sens en STI2D : Φ positif, ΔT = T_chaud − T_froid, sens à part (vers l\'intérieur quand il fait plus chaud dehors)', types: ['savoir', 'graphique'], source: 'fiche_3 · En STI2D, Φ est compté positivement ; cours 3 · schéma de paroi avec la flèche du flux ; exercice 8 b)' },
        { id: 'c5', texte: 'Interpréter un flux négatif : il va dans le sens contraire de la flèche (ce n\'est pas faux)', types: ['reflexe'], source: 'fiche_3 · Remarque ; série 3 · « Un élève écrit Φ = −… W »' },
        { id: 'c6', texte: 'Raisonner : λ petit = isolant ; R grande = Φ petit ; doubler e double R et divise Φ par 2 ; doubler S divise R par 2', types: ['savoir'], source: 'fiche_3 · Raisonner ; cours 3 · paroi réglable ; série 3 · doubler e, S ou ΔT' },
        { id: 'c7', texte: 'Isoler R, λ ou e : R = ΔT / Φ ; λ = e / (R × S) ; e = R × λ × S (crayon)', types: ['methode'], source: 'fiche_3 · Isoler une grandeur ; exercices 15 et 16 c)' },
        { id: 'c8', texte: 'Convertir e et S en m et en m² avant de calculer R (cm, mm, cm²)', types: ['reflexe'], source: 'fiche_3 · conversions ; série 3 · diagnostic « e laissée en cm ou en mm », surface de 100 cm²' },
      ] },

    /* ---------- Module 4 · Parois composées ---------- */
    { id: 'm4', module: 4, titre: 'Parois composées', apres: ['module_4_cours'],
      competences: [
        { id: 'c1', texte: 'Connaître la résistance d\'une paroi en couches accolées : R = R₁ + R₂ + R₃, même surface S', types: ['formule'], source: 'fiche_4 · Couches accolées ; À retenir' },
        { id: 'c2', texte: 'Appliquer la méthode avec un schéma : e et λ de chaque couche, températures, S → chaque Rᵢ → R → Φ', types: ['methode'], source: 'fiche_4 · La méthode avec un schéma ; cours 4 · étape 2 (glisser-déposer sur le schéma)' },
        { id: 'c3', texte: 'Lire le schéma d\'une paroi en couches : où sont e, λ, les températures, S, la flèche du flux', types: ['schema'], source: 'cours 4 · schéma de la paroi en couches (TT.paroiRemplie) ; fiche_4' },
        { id: 'c4', texte: 'Additionner les résistances (pas les multiplier) et prendre la résistance totale pour calculer Φ', types: ['reflexe'], source: 'série 4 · diagnostics « résistances multipliées », « résistance d\'une seule couche »' },
        { id: 'c5', texte: 'Expliquer ce qui isole dans un double vitrage : la lame d\'air immobile (λ = 0,025)', types: ['savoir'], source: 'fiche_4 · Double vitrage ; série 4 · double vitrage ; exercice 19' },
        { id: 'c6', texte: 'Calculer l\'épaisseur d\'isolant à ajouter : R_isolant = R visée − R des autres couches, puis e = R_isolant × λ × S', types: ['methode'], source: 'fiche_4 · isolant à ajouter ; série 4 · diagnostic « R du mur oubliée » ; exercice 18' },
        { id: 'c7', texte: 'Choisir l\'isolant qui donne la couche la plus mince (le plus petit λ, à R égale)', types: ['savoir'], source: 'série 4 · « quel isolant permet la couche la plus mince »' },
        { id: 'c8', texte: 'Exercice-type : mur de béton isolé par du polystyrène, résistance totale et flux (calculatrice)', types: ['methode'], source: 'fiche_4 · exemple (béton 15 cm + polystyrène 5 cm) ; exercice 13' },
      ] },
  ],
});
