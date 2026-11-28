/* ============================================================
   Équations en physique (smartphone) — les compétences (objet EPM.C)
   ------------------------------------------------------------
   Chaque compétence : identifiant, famille, niveau (ordre de progression),
   prérequis, classe minimale (2de, 1re, tle : réglage « Ma classe »),
   titre, règle, calcul illustré (notation de fiches.js : fi-calc, fi-duo),
   méthode et piège (fiche, rappel pendant une question, carte « La règle »
   du module Découverte).
   API : EPM.C.familles, EPM.C.liste, EPM.C.R (par identifiant),
         EPM.C.CLASSES, EPM.C.permise(id, classe), EPM.C.cibles(id) (questions de la compétence)
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM = window.EPM || {};

  /* ---------- Petits outils d'écriture (notation des fiches) ---------- */
  const fr = (n, d) => '<span class="fi-fr"><span>' + n + '</span><span>' + d + '</span></span>';
  const rac = (x, n) => '<span class="fi-rac"' + (n ? ' data-n="' + n + '"' : '') + '>' + x + '</span>';
  const lg = (g, d, op, note) => '<div class="fi-l"' + (op ? ' data-op="' + op + '"' : '') + (note ? ' data-note="' + note + '"' : '') + '><span>' + g + '</span><span>' + d + '</span></div>';
  const calc = (...l) => '<div class="fi-calc">' + l.join('') + '</div>';
  const op = c => '<div class="fi-pan" data-t="op">' + c + '</div>';
  const dep = c => '<div class="fi-pan" data-t="dep">' + c + '</div>';
  // cadre sans titre de méthode (combiner des équations : ni « même opération » ni raccourci)
  const pan = c => '<div class="fi-pan">' + c + '</div>';
  const duo = (...p) => '<div class="fi-duo">' + p.join('') + '</div>';
  const de = (k, t, lab) => '<span class="fi-dep" data-de="' + k + '"' + (lab ? ' data-lab="' + lab + '"' : '') + '>' + t + '</span>';
  const vers = (k, t, pos) => '<span data-vers="' + k + '" data-pos="' + (pos || 'cote') + '">' + t + '</span>';
  const m = t => '<span class="fi-m">' + t + '</span>';
  const s0 = '<sub>0</sub>';

  const familles = [
    { id: 'MU', nom: 'Produits et quotients', desc: 'Un terme qui multiplie ou qui divise passe de l’autre côté en changeant de place : en haut ↔ en bas.' },
    { id: 'AD', nom: 'Termes additifs', desc: 'Un terme relié par + ou − passe de l’autre côté en changeant de signe.' },
    { id: 'FO', nom: 'Fonctions réciproques', desc: 'Une fonction (carré, racine, sinus, log…) s’annule en appliquant sa fonction réciproque aux deux membres.' },
    { id: 'CO', nom: 'Combiner des équations', desc: 'Une grandeur seule dans une équation se remplace par son expression dans une autre : on élimine ainsi les grandeurs intermédiaires.' }
  ];
  const CLASSES = [['2de', '2de'], ['1re', '1re'], ['tle', 'Terminale']];
  const RANG = { '2de': 0, '1re': 1, tle: 2 };

  const liste = [
    /* ---------------- Produits et quotients ---------------- */
    { id: 'MU1', famille: 'MU', niveau: 1, prerequis: [], classe: '2de', titre: 'Une grandeur qui multiplie',
      regle: 'Une égalité reste vraie si on <b>divise les deux membres</b> par le même terme. Raccourci : un terme qui <b>multiplie</b> (en haut) passe <b>en bas</b>, de l’autre côté.',
      illus: duo(op(calc(lg('P', 'U × I', '÷ U'), lg(fr('P', 'U'), '<span class="fi-zero">' + fr('U × I', 'U') + '</span>', '', 'U ÷ U = 1'), lg(fr('P', 'U'), 'I'))),
        dep(calc(lg(vers('a', 'P', 'bas'), de('a', 'U') + ' × I'), lg(fr('P', 'U'), 'I')))),
      methode: 'Repère ce qui multiplie la grandeur cherchée. Fais-le passer en bas, de l’autre côté (on divise les deux membres), puis échange les deux membres avec ⇄ pour avoir la grandeur à gauche.',
      piege: 'Un terme qui multiplie ne change pas de signe, il change de <b>place</b> : ' + m('P = U × I') + ' donne ' + m('I = ' + fr('P', 'U')) + ', pas ' + m('I = P − U') + '.' },
    { id: 'MU2', famille: 'MU', niveau: 1, prerequis: [], classe: '2de', titre: 'Une grandeur au numérateur',
      regle: 'On peut <b>multiplier les deux membres</b> par le même terme. Raccourci : un terme qui <b>divise</b> (en bas) passe <b>en haut</b>, de l’autre côté.',
      illus: duo(op(calc(lg('v', fr('d', 'Δt'), '× Δt'), lg('v × Δt', '<span class="fi-zero">' + fr('d', 'Δt') + ' × Δt</span>', '', '÷ Δt puis × Δt : Δt disparaît'), lg('v × Δt', 'd'))),
        dep(calc(lg(vers('a', 'v', 'cote'), fr('d', de('a', 'Δt'))), lg('v × Δt', 'd')))),
      methode: 'La grandeur cherchée est en haut d’une fraction : fais passer le dénominateur en haut, de l’autre côté. Échange ensuite les deux membres.',
      piege: 'Le dénominateur passe <b>en haut</b> : ' + m('v = ' + fr('d', 'Δt')) + ' donne ' + m('d = v × Δt') + ', pas ' + m('d = ' + fr('v', 'Δt')) + '.' },
    { id: 'MU3', famille: 'MU', niveau: 2, prerequis: ['MU1', 'MU2'], classe: '2de', titre: 'Une grandeur au dénominateur',
      regle: 'La grandeur cherchée est <b>en bas</b> : on la fait d’abord <b>monter</b> (on multiplie les deux membres par elle), puis on fait passer ce qui la multiplie <b>en bas</b>, de l’autre côté.',
      illus: duo(op(calc(lg('R', fr('U', 'I'), '× I'), lg('R × I', 'U', '÷ R'), lg('I', fr('U', 'R')))),
        dep(calc(lg(vers('a', 'R', 'cote'), fr('U', de('a', 'I'))), lg(de('b', 'R') + ' × I', vers('b', 'U', 'bas')), lg('I', fr('U', 'R'))))),
      methode: 'Deux étapes : la grandeur cherchée monte (elle change de côté), puis ce qui la multiplie descend de l’autre côté. Si un numérateur se vide, écris 1 ; un 1 au dénominateur s’efface.',
      piege: 'Une grandeur en bas ne s’isole pas en une seule étape : ' + m('R = ' + fr('U', 'I')) + ' donne ' + m('I = ' + fr('U', 'R')) + ', pas ' + m('I = U × R') + '.' },
    { id: 'MU4', famille: 'MU', niveau: 2, prerequis: ['MU3'], classe: '2de', titre: 'Une fraction et d’autres facteurs',
      regle: 'Tout est multiplié : la fraction et les facteurs à côté forment un seul produit. Le <b>dénominateur</b> passe en haut de l’autre côté, chaque <b>facteur</b> gênant passe en bas.',
      illus: duo(op(calc(lg('E<sub>c</sub>', fr('1', '2') + ' × m × v²', '× 2'), lg('2 × E<sub>c</sub>', 'm × v²', '÷ v²'), lg(fr('2 × E<sub>c</sub>', 'v²'), 'm'))),
        dep(calc(lg(vers('a', 'E<sub>c</sub>', 'cote'), fr('1', de('a', '2')) + ' × m × v²'), lg(vers('b', '2 × E<sub>c</sub>', 'bas'), 'm × ' + de('b', 'v²')), lg(fr('2 × E<sub>c</sub>', 'v²'), 'm')))),
      methode: 'Fais d’abord passer les dénominateurs de l’autre côté (en haut), efface les 1 inutiles, puis fais passer les facteurs gênants en bas.',
      piege: 'Le 2 est <b>en bas</b> : il passe <b>en haut</b>. ' + m('m = ' + fr('2 × E<sub>c</sub>', 'v²')) + ', pas ' + m('m = ' + fr('E<sub>c</sub>', '2 × v²')) + '.' },

    /* ---------------- Termes additifs ---------------- */
    { id: 'AD1', famille: 'AD', niveau: 2, prerequis: ['MU1'], classe: '2de', titre: 'Déplacer un terme additif',
      regle: 'On peut <b>ajouter ou soustraire</b> le même terme aux deux membres. Raccourci : un terme relié par + ou − passe de l’autre côté en <b>changeant de signe</b>.',
      illus: duo(op(calc(lg('v', 'v' + s0 + ' + a × t', '− v' + s0), lg('v − v' + s0, '<span class="fi-zero">v' + s0 + ' − v' + s0 + '</span> + a × t', '', 'v<sub>0</sub> − v<sub>0</sub> = 0'), lg('v − v' + s0, 'a × t'))),
        dep(calc(lg(vers('a', 'v', 'cote'), de('a', 'v' + s0, '− v' + s0) + ' + a × t'), lg('v − v' + s0, 'a × t')))),
      methode: 'Fais passer de l’autre côté chaque terme relié par + ou − qui gêne : + devient −, − devient +.',
      piege: 'Un terme additif change de <b>signe</b>, pas de place : ' + m('v − v' + s0 + ' = a × t') + ', pas ' + m(fr('v', 'v' + s0) + ' = a × t') + '.' },
    { id: 'AD2', famille: 'AD', niveau: 3, prerequis: ['AD1'], classe: '2de', titre: 'Une grandeur isolée négative',
      regle: 'Une grandeur seule mais précédée d’un signe − n’est pas encore isolée : on <b>multiplie les deux membres par −1</b>. Chaque terme change de signe.',
      illus: duo(op(calc(lg('− P<sub>1</sub>', '− P<sub>2</sub> + ρ × g × h', '× (−1)'), lg('P<sub>1</sub>', 'P<sub>2</sub> − ρ × g × h')))),
      methode: 'Utilise l’outil ×(−1) sur chacun des deux membres : tous les signes changent, des deux côtés.',
      piege: 'Tous les termes changent de signe, des deux côtés : ' + m('− x = a − b') + ' donne ' + m('x = − a + b') + ', pas ' + m('x = a − b') + '.' },
    { id: 'AD3', famille: 'AD', niveau: 3, prerequis: ['AD1', 'MU3'], classe: '2de', titre: 'Une somme multipliée',
      regle: 'La somme entre parenthèses reste <b>en bloc</b> : on enlève d’abord ce qui la multiplie, puis on déplace ses termes.',
      illus: duo(op(calc(lg('Q', 'm × c × (T<sub>f</sub> − T<sub>i</sub>)', '÷ m × c'), lg(fr('Q', 'm × c'), 'T<sub>f</sub> − T<sub>i</sub>', '+ T<sub>i</sub>'), lg(fr('Q', 'm × c') + ' + T<sub>i</sub>', 'T<sub>f</sub>'))),
        dep(calc(lg(vers('a', 'Q', 'bas'), de('a', 'm × c') + ' × (T<sub>f</sub> − T<sub>i</sub>)'), lg(vers('b', fr('Q', 'm × c'), 'cote'), 'T<sub>f</sub> ' + de('b', '− T<sub>i</sub>', '+ T<sub>i</sub>')), lg(fr('Q', 'm × c') + ' + T<sub>i</sub>', 'T<sub>f</sub>')))),
      methode: 'Fais d’abord passer en bas, de l’autre côté, ce qui multiplie la parenthèse. La parenthèse disparaît : déplace alors ses termes (ils changent de signe).',
      piege: 'On ne touche pas aux termes de la parenthèse tant qu’elle est multipliée : ' + m('Q = m × c × (T<sub>f</sub> − T<sub>i</sub>)') + ' ne donne pas ' + m('Q + T<sub>i</sub> = m × c × T<sub>f</sub>') + '.' },
    { id: 'AD4', famille: 'AD', niveau: 3, prerequis: ['AD1', 'MU3'], classe: '2de', titre: 'Diviser une somme',
      regle: 'Pour diviser une somme, on la met <b>entre parenthèses</b> : c’est le bloc entier qui passe au numérateur.',
      illus: duo(op(calc(lg('v − v' + s0, 'a × t', '÷ t'), lg(fr('(v − v' + s0 + ')', 't'), '<span class="fi-zero">' + fr('a × t', 't') + '</span>', '', 't ÷ t = 1'), lg(fr('v − v' + s0, 't'), 'a'))),
        dep(calc(lg(vers('c', '(v − v' + s0 + ')', 'bas'), 'a × ' + de('c', 't')), lg(fr('v − v' + s0, 't'), 'a')))),
      methode: 'D’abord les termes additifs (ils changent de signe), ensuite ce qui multiplie la grandeur cherchée. Dans l’éditeur : outil ( ) sur la somme, puis outil fraction.',
      piege: m('a = ' + fr('v − v' + s0, 't')) + ', pas ' + m('a = v − ' + fr('v' + s0, 't')) + ' (qui ne divise que v<sub>0</sub>).' },

    /* ---------------- Fonctions réciproques ---------------- */
    { id: 'FO1', famille: 'FO', niveau: 1, prerequis: [], classe: '2de', titre: 'Supprimer un carré',
      regle: 'La <b>racine carrée</b> annule le carré : quand le carré est seul d’un côté, on applique √ aux <b>deux membres</b>.',
      illus: duo(op(calc(lg('v²', '2 × g × h', '√'), lg('<span class="fi-zero">' + rac('v²') + '</span>', rac('2 × g × h'), '', '√ annule le carré'), lg('v', rac('2 × g × h'))))),
      methode: 'Isole d’abord le carré (règles des produits et des sommes), puis applique la racine carrée aux deux membres (outil √, sur chaque membre).',
      piege: 'La racine couvre <b>tout</b> l’autre membre : ' + m('v = ' + rac('2 × g × h')) + ', pas ' + m('v = ' + rac('2') + ' × g × h') + '.' },
    { id: 'FO2', famille: 'FO', niveau: 1, prerequis: [], classe: '2de', titre: 'Supprimer une racine carrée',
      regle: 'Le <b>carré</b> annule la racine carrée : quand la racine est seule d’un côté, on élève les <b>deux membres</b> au carré.',
      illus: duo(op(calc(lg('v', rac('2 × g × h'), '( )²'), lg('v²', '<span class="fi-zero">(' + rac('2 × g × h') + ')²</span>', '', '( )² annule √'), lg('v²', '2 × g × h')))),
      methode: 'Isole d’abord la racine, puis applique le carré aux deux membres (outil x², sur chaque membre). Termine avec les règles des produits.',
      piege: 'On élève <b>tout</b> le membre au carré : ' + m('v = 2 × ' + rac('x')) + ' donne ' + m('v² = 4 × x') + ' ; isole plutôt la racine d’abord.' },
    { id: 'FO3', famille: 'FO', niveau: 3, prerequis: ['FO1', 'FO2', 'MU3'], classe: '2de', titre: 'Sinus, cosinus, tangente',
      regle: '<b>Arcsin</b> annule sin, <b>Arccos</b> annule cos, <b>Arctan</b> annule tan : quand la fonction est seule d’un côté, on applique sa réciproque aux <b>deux membres</b>.',
      illus: duo(op(calc(lg('sin(i)', '0,5', 'Arcsin'), lg('<span class="fi-zero">Arcsin(sin(i))</span>', 'Arcsin(0,5)', '', 'Arcsin annule sin'), lg('i', '30°'))),
        op(calc(lg('cos(α)', fr('W', 'F × AB'), 'Arccos'), lg('α', 'Arccos(' + fr('W', 'F × AB') + ')')))),
      methode: 'Isole d’abord sin, cos ou tan, puis applique sa réciproque aux deux membres. À la calculatrice (en degrés) : shift + sin donne Arcsin (noté aussi sin<sup>−1</sup>).',
      piege: 'On n’applique Arcsin qu’à une fonction <b>seule</b> : dans ' + m('n<sub>1</sub> × sin(i<sub>1</sub>) = …') + ', divise d’abord par n<sub>1</sub>.' },
    { id: 'FO4', famille: 'FO', niveau: 4, prerequis: ['FO3'], classe: '2de', titre: 'Supprimer un cube',
      regle: 'La <b>racine cubique</b> ∛ annule le cube : quand le cube est seul d’un côté, on applique ∛ aux <b>deux membres</b>.',
      illus: duo(op(calc(lg(fr('T²', 'k'), 'a³', '∛'), lg(rac(fr('T²', 'k'), 3), '<span class="fi-zero">' + rac('a³', 3) + '</span>', '', '∛ annule le cube'), lg(rac(fr('T²', 'k'), 3), 'a')))),
      methode: 'Isole d’abord le cube, puis applique la racine cubique aux deux membres (outil ∛). À la calculatrice : ∛, ou la puissance 1/3.',
      piege: 'La racine cubique n’est pas la racine carrée : ' + m(rac('8', 3) + ' = 2') + ' car 2 × 2 × 2 = 8.' },
    { id: 'FO5', famille: 'FO', niveau: 5, prerequis: ['FO4'], classe: '1re', titre: 'Puissance n et puissance 1/n',
      regle: 'La puissance <b>1/n</b> annule la puissance <b>n</b> (et inversement) : ' + m('(T<sup>4</sup>)<sup>1/4</sup> = T') + '. Quand la puissance est seule d’un côté, on l’applique aux <b>deux membres</b>.',
      illus: duo(op(calc(lg(fr('P', 'σ × S'), 'T<sup>4</sup>', '( )<sup>1/4</sup>'), lg('(' + fr('P', 'σ × S') + ')<sup>1/4</sup>', '<span class="fi-zero">(T<sup>4</sup>)<sup>1/4</sup></span>', '', '1/4 × 4 = 1'), lg('(' + fr('P', 'σ × S') + ')<sup>1/4</sup>', 'T')))),
      methode: 'Isole d’abord la puissance, puis élève les deux membres à la puissance inverse : 1/n pour supprimer une puissance n, n pour supprimer une puissance 1/n (outils x<sup>1/n</sup> et x<sup>n</sup>).',
      piege: 'La puissance 1/4 porte sur <b>tout</b> le membre : ' + m('T = (' + fr('P', 'σ × S') + ')<sup>1/4</sup>') + ', pas ' + m('T = ' + fr('P<sup>1/4</sup>', 'σ × S')) + '.' },
    { id: 'FO8', famille: 'FO', niveau: 4, prerequis: ['AD1', 'MU3'], classe: '1re', titre: 'Inverser les deux membres',
      regle: 'Si deux nombres sont égaux, leurs <b>inverses</b> sont égaux : ' + m(fr('1', 'a') + ' = b') + ' donne ' + m('a = ' + fr('1', 'b')) + '. On prend l’inverse des <b>deux membres</b> (outil 1/x).',
      illus: duo(op(calc(lg(fr('1', 'f′'), fr('1', 'OA′') + ' − ' + fr('1', 'OA'), '+ 1/OA'), lg(fr('1', 'f′') + ' + ' + fr('1', 'OA'), fr('1', 'OA′'), '1/x'), lg(fr('1', fr('1', 'f′') + ' + ' + fr('1', 'OA')), 'OA′')))),
      methode: 'Isole d’abord la fraction 1/x qui contient la grandeur cherchée (les autres termes changent de côté), puis prends l’inverse des deux membres.',
      piege: 'L’inverse d’une somme n’est pas la somme des inverses : ' + m(fr('1', 'R') + ' = ' + fr('1', 'R<sub>1</sub>') + ' + ' + fr('1', 'R<sub>2</sub>')) + ' ne donne pas ' + m('R = R<sub>1</sub> + R<sub>2</sub>') + '.' },
    { id: 'FO6', famille: 'FO', niveau: 6, prerequis: ['FO5'], classe: '1re', titre: 'log et 10<sup>x</sup>',
      regle: '<b>10<sup>x</sup></b> annule log, et <b>log</b> annule 10<sup>x</sup> : ' + m('log(x) = y') + ' ⇔ ' + m('x = 10<sup>y</sup>') + '. On applique la réciproque aux <b>deux membres</b>.',
      illus: duo(op(calc(lg('− pH', 'log(' + fr('C', 'C' + s0) + ')', '10<sup>x</sup>'), lg('10<sup>−pH</sup>', '<span class="fi-zero">10<sup>log(C/C<sub>0</sub>)</sup></span>', '', '10<sup>x</sup> annule log'), lg('10<sup>−pH</sup>', fr('C', 'C' + s0))))),
      methode: 'Isole d’abord log (ou 10<sup>…</sup>), sans signe − devant, puis applique sa réciproque aux deux membres. Calculatrice : shift + log donne 10<sup>x</sup>.',
      piege: 'Applique 10<sup>x</sup> à un log <b>seul</b> : dans ' + m('pH = − log(C)') + ', multiplie d’abord par −1.' },
    { id: 'FO7', famille: 'FO', niveau: 7, prerequis: ['FO6'], classe: 'tle', titre: 'ln et e<sup>x</sup>',
      regle: '<b>ln</b> annule l’exponentielle, et <b>e<sup>x</sup></b> annule ln : ' + m('e<sup>x</sup> = y') + ' ⇔ ' + m('x = ln(y)') + '. On applique la réciproque aux <b>deux membres</b>.',
      illus: duo(op(calc(lg(fr('N', 'N' + s0), 'e<sup>−λ × t</sup>', 'ln'), lg('ln(' + fr('N', 'N' + s0) + ')', '<span class="fi-zero">ln(e<sup>−λ × t</sup>)</span>', '', 'ln annule e<sup>x</sup>'), lg('ln(' + fr('N', 'N' + s0) + ')', '− λ × t')))),
      methode: 'Isole d’abord l’exponentielle (ou ln), puis applique sa réciproque aux deux membres. Termine avec les règles des produits et des signes. Calculatrice : shift + ln donne e<sup>x</sup>.',
      piege: 'Divise par N<sub>0</sub> <b>avant</b> d’appliquer ln : ln(N<sub>0</sub> × e<sup>−λt</sup>) n’est pas égal à N<sub>0</sub> × (−λt).' }
  ];


  /* ---------------- Combiner des équations (questions : modules/combiner.js) ---------------- */
  const sb = x => '<sub>' + x + '</sub>';
  liste.push(
    { id: 'CO1', famille: 'CO', niveau: 2, prerequis: ['MU1', 'MU2', 'MU3', 'MU4'], classe: '2de', titre: 'Remplacer une grandeur',
      regle: 'Quand une grandeur est <b>seule</b> d’un côté d’une équation (n = m / M), on peut la <b>remplacer</b> par son expression dans une autre équation.',
      illus: duo(pan(calc(lg('c', fr('n', 'V'), '', 'équation 1'), lg('n', fr('m', 'M'), '', 'équation 2 : n est seule'), lg('c', fr('m', 'M × V'), '', 'n remplacée dans l’équation 1')))),
      methode: 'Repère la grandeur qui n’est pas dans la liste demandée. Trouve l’équation où elle est seule, et reporte son expression dans l’autre équation : glisse l’outil « n = … » de la réserve sur n.',
      piege: 'Une fraction reportée se répartit : ' + m(fr('n', 'V')) + ' avec ' + m('n = ' + fr('m', 'M')) + ' donne ' + m(fr('m', 'M × V')) + ' : M passe en bas, avec V.' },
    { id: 'CO2', famille: 'CO', niveau: 3, prerequis: ['CO1', 'MU3'], classe: '2de', titre: 'Isoler pour remplacer',
      regle: 'Pour remplacer une grandeur, il faut d’abord l’<b>isoler</b> dans une équation ; on la reporte, puis on isole la grandeur cherchée.',
      illus: duo(pan(calc(lg('c', fr('n', 'V'), '× V'), lg('c × V', 'n', '⇄'), lg('n', 'c × V', '', 'n est seule : on la reporte'), lg(fr('m', 'M'), 'c × V', '', 'dans n = m / M'), lg('m', 'c × V × M')))),
      methode: 'Choisis la grandeur à éliminer. Isole-la dans une équation et vérifie l’étape : l’outil « grandeur = … » apparaît dans la réserve de l’autre équation. Reporte-la, puis isole la grandeur cherchée.',
      piege: 'On ne reporte qu’une grandeur seule, à gauche : dans ' + m('c = ' + fr('n', 'V')) + ', n n’est pas encore isolée (' + m('n = c × V') + ').' },
    { id: 'CO3', famille: 'CO', niveau: 3, prerequis: ['CO2'], classe: '2de', titre: 'Remplacer puis simplifier',
      regle: 'Une grandeur présente <b>au numérateur et au dénominateur</b> d’une même fraction se <b>simplifie</b> ; une grandeur qui <b>multiplie chacun des deux membres</b> aussi (on divise les deux membres par elle).',
      illus: duo(pan(calc(lg('P', 'm × g', '', 'équation 1'), lg(fr('G × M' + sb('T') + ' × m', 'R' + sb('T') + '²'), 'm × g', '÷ m', 'P remplacé'), lg(fr('G × M' + sb('T'), 'R' + sb('T') + '²'), 'g')))),
      methode: 'Après le report, touche une grandeur, puis la même en haut et en bas de la fraction, ou dans l’autre membre : elles se barrent. Vérifie l’étape : les termes barrés s’effacent.',
      piege: 'On ne simplifie que des facteurs : dans ' + m(fr('m + M', 'm')) + ', m ne se simplifie pas.' },
    { id: 'CO4', famille: 'CO', niveau: 4, prerequis: ['CO3'], classe: '1re', titre: 'Trois équations',
      regle: 'Avec trois équations, on élimine les grandeurs intermédiaires <b>une à une</b> : chaque report fait disparaître une grandeur.',
      illus: duo(pan(calc(lg('C' + sb('m'), fr('m', 'V'), '', 'équation 1'), lg('C' + sb('m'), fr('n × M', 'V'), '', 'm = n × M remplacée'), lg('C' + sb('m'), fr('c × V × M', 'V'), '', 'n = c × V remplacée'), lg('C' + sb('m'), 'c × M', '', 'V simplifié')))),
      methode: 'Liste les grandeurs à éliminer. Pour chacune, trouve une équation qui la donne, isole-la et reporte-la. Termine par les simplifications et l’isolement.',
      piege: 'Ne reporte pas une grandeur dans l’équation d’où elle vient : tu retrouverais une égalité toujours vraie, sans rien de nouveau.' },
    { id: 'CO5', famille: 'CO', niveau: 4, prerequis: ['CO2'], classe: '1re', titre: 'Repérer l’équation inutile',
      regle: 'Toutes les équations données ne servent pas toujours : on n’utilise que celles qui relient la grandeur cherchée aux grandeurs demandées.',
      illus: duo(pan(calc(lg('c', fr('n', 'V'), '', 'utile'), lg('n', fr('m', 'M'), '', 'utile'), lg('N', 'n × N' + sb('A'), '', 'inutile : N n’est pas demandée'), lg('m', 'c × V × M')))),
      methode: 'Pour chaque équation, regarde si elle contient la grandeur cherchée ou une grandeur à éliminer. Une équation qui n’apporte que des grandeurs étrangères à la consigne ne sert pas.',
      piege: 'Une équation qui introduit une nouvelle grandeur (absente de la liste) ajoute une grandeur à éliminer : elle ne sert souvent à rien.' },
    { id: 'CO6', famille: 'CO', niveau: 5, prerequis: ['CO3', 'FO1', 'FO2'], classe: '1re', titre: 'Remplacer dans un carré ou une racine',
      regle: 'Une grandeur au carré se remplace avec son expression <b>au carré</b> : v = d / Δt donne v² = d² / Δt². Un facteur qui entre sous une racine y entre <b>au carré</b>.',
      illus: duo(pan(calc(lg('E' + sb('c'), fr('1', '2') + ' × m × v²', '', 'v = d / Δt'), lg('E' + sb('c'), fr('m × d²', '2 × Δt²'), '', 'v² remplacé : d² / Δt²')))),
      methode: 'Reporte l’expression : chaque grandeur prend la puissance. Simplifie, puis applique √ aux deux membres si la grandeur cherchée est au carré. Glisse un facteur sur une racine pour l’y faire entrer au carré.',
      piege: m('(d / Δt)² = d² / Δt²') + ' : le carré porte sur le numérateur <b>et</b> sur le dénominateur.' },
    { id: 'CO7', famille: 'CO', niveau: 6, prerequis: ['CO4', 'CO5', 'CO6'], classe: 'tle', titre: 'Jusqu’à quatre équations',
      regle: 'Une démonstration de Terminale enchaîne plusieurs reports : on garde le même principe, une grandeur éliminée à chaque report.',
      illus: duo(pan(calc(lg('t', fr('m' + sb('NaOH'), 'm' + sb('sol')), '', 'titre massique'), lg('t', fr('C' + sb('m') + ' × V', 'ρ × V'), '', 'deux reports'), lg('t', fr('c × M', 'ρ'), '', 'C' + sb('m') + ' = c × M, V simplifié')))),
      methode: 'Commence par l’équation qui contient la grandeur cherchée ; remplace ses grandeurs une à une jusqu’à n’avoir que les grandeurs demandées. Simplifie à chaque étape.',
      piege: 'Simplifie au fur et à mesure : une expression trop longue cache les grandeurs qui se simplifient.' },
    { id: 'CO8', famille: 'CO', niveau: 7, prerequis: ['CO7'], classe: '1re', titre: 'Choisir ses équations',
      regle: 'Pour exprimer une grandeur, on cherche dans le cours les relations qui la relient aux grandeurs connues.',
      illus: duo(pan(calc(lg('m', '?', '', 'cherchée : formule qui contient m'), lg('n', fr('m', 'M'), '', 'formulaire'), lg('c', fr('n', 'V'), '', 'formulaire : n s’élimine'), lg('m', 'c × V × M')))),
      methode: 'Choisis d’abord une formule qui contient la grandeur cherchée. Si elle contient une grandeur inconnue, cherche une formule qui la donne, et ainsi de suite (4 formules au plus).',
      piege: 'Vérifie que chaque grandeur de la formule choisie a bien le même sens dans la situation : m de la soude ou m de la solution ?' }
  );

  const R = {};
  liste.forEach(c => { R[c.id] = c; });
  // compétence disponible dans la classe choisie (2de : sans puissance n, log, ln, 1/x ; 1re : sans ln)
  const permise = (id, classe) => RANG[R[id].classe] <= RANG[classe || 'tle'];
  // les questions (équation + grandeur à isoler) d'une compétence
  const cibles = id => EPM.B.cibles.filter(x => x.cible.comp === id);

  EPM.C = { familles, liste, R, CLASSES, permise, cibles };
})();
