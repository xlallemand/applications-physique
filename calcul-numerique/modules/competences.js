/* ============================================================
   Calcul numérique — les compétences (objet CN.C)
   ------------------------------------------------------------
   Trois thèmes (choix au début d'une séance), cinq familles :
     P  Puissances de 10     : PU (puissances de 10)
     R  Écrire un résultat   : ES (écriture scientifique), CS (chiffres significatifs)
     C  Conversions          : PR (préfixes), CV (conversions)
   Chaque compétence : identifiant, famille, niveau (ordre de progression),
   prérequis, titre, fiche (regle, methode, exemple, piege : HTML),
   et gen(niv) : une question différente à chaque appel, niv = difficulté 1 à 3
   (1 : guidée en 2 ou 3 parties ; 2 : une étape intermédiaire ; 3 : réponse directe).
   CV1 (vers ou depuis l'unité sans préfixe) est la compétence clé : cle: true
   (maîtrise plus exigeante, présente dans chaque séance, défi chrono).

   Question produite :
     { comp, diff, cle, enonce, parties: [partie], solution, indices: [html] }
   Partie :
     { type: 'nb', q, apres, v, rel, forme: 'sci' | 'dec', cs, brut, entier, sup, calc, diag(r) }
        q : texte avant le champ ; apres : unité après le champ ; v : valeur attendue ;
        rel : tolérance relative ; forme : écriture imposée ; cs : chiffres significatifs
        attendus (brut : valeur avant arrondi) ; entier : exposant ou entier seul ;
        sup : champ en exposant (« 10^□ ») ; calc : icône calculatrice ;
        diag(r) : diagnostic d'une valeur fausse (r : lecture du champ, CN.N.Champ.lire)
     { type: 'choix', q, options: [{ id, label }], bonne, indices: { id: diagnostic } }
   Ce fichier : thèmes, familles, outils communs des fabriques et compétences
   PU, ES, CS, PR (CN.C0) ; conversions.js ajoute les compétences CV et construit CN.C.
   API (après conversions.js) : CN.C.THEMES, CN.C.familles, CN.C.liste, CN.C.R (par identifiant),
         CN.C.question(id, niv), CN.C.PREF (préfixes), CN.C.themeDe(id)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN = window.CN || {};
  const N = CN.N;
  const { hasard, entre, melanger, nb, ent, p10, ecr } = N;
  const P10 = n => Math.pow(10, n);
  const fix = x => +(+x).toPrecision(12);                      // efface les restes du calcul en virgule flottante
  const par = n => (n < 0 ? '(' + ent(n) + ')' : ent(n));       // (−3) après un signe
  const lg = (v, x) => Math.log10(v / x);
  const entierPres = r => Math.abs(r - Math.round(r)) < 1e-6;
  const calc = (...l) => '<p class="cn-calc">' + l.join('') + '</p>';
  const c = t => '<span class="c">' + t + '</span>';             // résultat mis en valeur

  /* ---------- Parties de question ---------- */
  const nbP = (q, v, o) => Object.assign({ type: 'nb', q, v }, o || {});
  const expP = (q, v, o) => Object.assign({ type: 'nb', q, v, entier: true, sup: true }, o || {});
  const choixP = (q, options, bonne, indices) => ({ type: 'choix', q, options, bonne, indices: indices || {} });
  const question = (comp, diff, cle, enonce, parties, solution, indices) => ({ comp, diff, cle, enonce, parties, solution, indices: indices || [] });

  /* =====================================================================
     Thèmes et familles
     ===================================================================== */
  const THEMES = [
    { id: 'P', nom: 'Puissances de 10', fam: ['PU'] },
    { id: 'R', nom: 'Écrire un résultat', fam: ['ES', 'CS'] },
    { id: 'C', nom: 'Conversions', fam: ['PR', 'CV'] }
  ];
  const familles = [
    { id: 'PU', theme: 'P', nom: 'Puissances de 10', desc: '10ⁿ est un 1 suivi de n zéros, 10⁻ⁿ un 1 au n-ième rang après la virgule. Multiplier par 10ⁿ déplace la virgule.' },
    { id: 'ES', theme: 'R', nom: 'Écriture scientifique', desc: 'Un nombre s’écrit a × 10ⁿ avec 1 ≤ a < 10 : un seul chiffre non nul avant la virgule.' },
    { id: 'CS', theme: 'R', nom: 'Chiffres significatifs', desc: 'Les chiffres significatifs disent la précision d’une valeur : on les compte, on arrondit, et un résultat n’est pas plus précis que ses données.' },
    { id: 'PR', theme: 'C', nom: 'Préfixes', desc: 'Chaque préfixe (k, m, µ…) est une puissance de 10 : les connaître par cœur, c’est la moitié d’une conversion.' },
    { id: 'CV', theme: 'C', nom: 'Conversions', desc: 'On recopie le nombre et on le multiplie par 10 puissance (préfixe de départ) − (préfixe d’arrivée).' }
  ];

  /* =====================================================================
     Préfixes
     ===================================================================== */
  const PREF = [
    { s: 'T', nom: 'téra', e: 12 }, { s: 'G', nom: 'giga', e: 9 }, { s: 'M', nom: 'méga', e: 6 }, { s: 'k', nom: 'kilo', e: 3 },
    { s: 'h', nom: 'hecto', e: 2 }, { s: 'da', nom: 'déca', e: 1 }, { s: '', nom: 'aucun', e: 0 }, { s: 'd', nom: 'déci', e: -1 },
    { s: 'c', nom: 'centi', e: -2 }, { s: 'm', nom: 'milli', e: -3 }, { s: 'µ', nom: 'micro', e: -6 }, { s: 'n', nom: 'nano', e: -9 },
    { s: 'p', nom: 'pico', e: -12 }
  ];
  const PR = s => PREF.find(q => q.s === s);
  const AVEC = PREF.filter(q => q.s);
  // préfixes souvent confondus
  const CONFUS = { T: 'G', G: 'M', M: 'm', k: 'h', h: 'k', da: 'd', d: 'da', c: 'm', m: 'M', 'µ': 'm', n: 'µ', p: 'n' };
  // « k (kilo = 10³) », « aucun préfixe (10⁰) »
  const dit = q => (q.s ? '<b>' + q.s + '</b> (' + q.nom + ' = ' + p10(q.e) + ')' : '<i>aucun préfixe</i> (' + p10(0) + ')');

  /* =====================================================================
     Conversions : outils communs
     Une unité : { h: écriture HTML, e: exposant par rapport à l'unité de référence }.
     Exposant de conversion E = e(départ) − e(arrivée) ; x × 10^p (départ) = x × 10^(p+E) (arrivée).
     ===================================================================== */
  const sup = k => (k > 1 ? '<sup>' + k + '</sup>' : '');
  const U = (q, u, k) => ({ h: q.s + u + sup(k || 1), e: q.e * (k || 1), q, u, k: k || 1 });
  // unité de volume en litres : L = dm³ = 10⁻³ m³ (référence : m³)
  const UL = q => ({ h: q.s + 'L', e: q.e - 3, q, u: 'L', k: 1, litre: true });
  // unité composée : (préfixe, numérateur) / (préfixe, dénominateur)^kd ; écriture « / » ou « ·⁻¹ »
  function UC(qn, un, qd, ud, kd, ecr0) {
    kd = kd || 1;
    const h = ecr0 === 'pt' ? qn.s + un + '·' + qd.s + ud + '<sup>' + ent(-kd) + '</sup>' : qn.s + un + '/' + qd.s + ud + sup(kd);
    return { h, e: qn.e - kd * qd.e, qn, un, qd, ud, kd };
  }
  const valConv = (x, p, E) => fix(x * P10(p + E));
  // résultat écrit : décimal quand il reste lisible, sinon a × 10ⁿ
  function resultat(x, p, E) {
    const v = valConv(x, p, E);
    const lisible = Math.abs(v) >= 1e-4 && Math.abs(v) < 1e7;
    return (p + E ? ecr(x, p + E) + (lisible ? ' = ' + nb(v) : '') : nb(x));
  }
  // diagnostic d'une conversion : exposant obtenu par l'élève, comparé aux erreurs typiques
  function diagConv(o) {
    return r => {
      const v = r.v, x = o.x, p = o.p || 0, E = o.E;
      if (!(v > 0)) return 'Une conversion ne change pas le signe : le résultat est positif.';
      const rr = lg(v, x), R = Math.round(rr);
      if (!entierPres(rr)) return 'Recopie le nombre ' + nb(x) + ' tel quel : une conversion ne change que la puissance de 10 (la virgule se déplace).';
      for (const [cand, msg] of (o.erreurs || [])) if (R === p + cand) return msg;
      if (R === p - E) return 'Tu as fait la conversion à l’envers. ' + (E > 0
        ? 'L’unité ' + o.vers.h + ' est plus petite que ' + o.de.h + ' : il en faut plus, le nombre doit <b>augmenter</b>.'
        : 'L’unité ' + o.vers.h + ' est plus grande que ' + o.de.h + ' : il en faut moins, le nombre doit <b>diminuer</b>.');
      if (R === p) return 'Le nombre n’a pas changé : les deux unités ne sont pas les mêmes, il faut multiplier par une puissance de 10.';
      if (p && R === E) return 'N’oublie pas la puissance de 10 du nombre : on <b>ajoute</b> l’exposant de conversion à son exposant ' + ent(p) + '.';
      if (p && R === E - p) return 'On <b>ajoute</b> l’exposant de conversion à celui du nombre (10<sup>a</sup> × 10<sup>b</sup> = 10<sup>a+b</sup>), on ne le retranche pas.';
      return o.aide || 'Exposant de conversion = (puissance du préfixe de départ) − (puissance du préfixe d’arrivée).';
    };
  }
  // la partie « résultat » d'une conversion
  function partieConv(o, q) {
    return nbP(q || ecr(o.x, o.p || 0, true) + '&nbsp;' + o.de.h + ' =', valConv(o.x, o.p || 0, o.E), { apres: o.vers.h, diag: diagConv(o) });
  }
  // une puissance de 10 à écrire (exposant), avec des erreurs typiques
  function partieExp(q, v, erreurs, defaut) {
    return expP(q, v, { diag: r => { for (const [cand, msg] of erreurs) if (r.v === cand) return msg; return defaut; } });
  }
  const signePref = q => 'Attention au signe : ' + q.nom + ' sert pour les ' + (q.e > 0 ? 'grandes' : 'petites') + ' valeurs, son exposant est ' + (q.e > 0 ? 'positif' : 'négatif') + '.';
  // « Le préfixe k (kilo) vaut 10^□ »
  function partiePref(q) {
    const err = [[-q.e, signePref(q)]];
    AVEC.forEach(x => { if (x !== q && x.e !== -q.e) err.push([x.e, p10(x.e) + ' correspond au préfixe <b>' + x.s + '</b> (' + x.nom + '), pas à <b>' + q.s + '</b> (' + q.nom + ').']); });
    return partieExp('Le préfixe <b>' + q.s + '</b> (' + q.nom + ') vaut 10', q.e, err, 'Relis le tableau des préfixes : ' + q.nom + ' (' + q.s + ').');
  }
  // lignes de la solution d'une conversion simple (préfixes)
  function solConv(o) {
    const p = o.p || 0;
    let h = '<p>Préfixe de départ : ' + dit(o.de.q) + ' → préfixe d’arrivée : ' + dit(o.vers.q) + '.</p>';
    if (o.de.k > 1) {
      const d = o.de.q.e - o.vers.q.e;
      h += '<p>Différence des exposants : ' + ent(o.de.q.e) + ' − ' + par(o.vers.q.e) + ' = ' + ent(d) + ' ; unité au ' + (o.de.k === 2 ? 'carré' : 'cube') + ' : ' + par(d) + ' × ' + o.de.k + ' = <b>' + ent(o.E) + '</b></p>';
    } else h += '<p>Exposant de conversion : ' + ent(o.de.q.e) + ' − ' + par(o.vers.q.e) + ' = <b>' + ent(o.E) + '</b></p>';
    if (p) h += '<p>On l’ajoute à l’exposant du nombre : ' + ent(p) + ' + ' + par(o.E) + ' = <b>' + ent(p + o.E) + '</b></p>';
    h += calc(ecr(o.x, p, true) + '&nbsp;' + o.de.h + ' = ' + c(resultat(o.x, p, o.E) + '&nbsp;' + o.vers.h));
    return h;
  }
  // phrase « l'unité d'arrivée est plus petite : le nombre augmente »
  const sens = o => o.E > 0 ? 'L’unité ' + o.vers.h + ' est plus petite que ' + o.de.h + ' : il en faut plus, le nombre <b>augmente</b>.'
    : o.E < 0 ? 'L’unité ' + o.vers.h + ' est plus grande que ' + o.de.h + ' : il en faut moins, le nombre <b>diminue</b>.' : 'Les deux unités sont égales : le nombre ne change pas.';

  /* ---------- Coefficients courants ---------- */
  const COEF1 = [2, 3, 5, 7, 1.5, 2.5, 3.2, 4.5, 1.2, 0.5, 0.8, 12, 25, 150, 250, 450, 60];
  const COEF2 = [1.5, 2.4, 3.2, 4.5, 6.8, 7.5, 0.25, 0.6, 12.5, 35, 120, 480, 0.045, 2.05];
  const COEF3 = [0.035, 0.45, 1.25, 3.7, 6.02, 12.4, 0.008, 1250, 0.72, 45.6, 0.0125, 307];

  /* =====================================================================
     Les compétences
     ===================================================================== */
  const liste = [];
  const ajouter = x => liste.push(x);

  /* -------------------- PUISSANCES DE 10 -------------------- */
  ajouter({ id: 'PU1', famille: 'PU', niveau: 1, prerequis: [], titre: '10<sup>n</sup> et l’écriture décimale',
    regle: '10<sup>n</sup> (n positif) s’écrit avec un 1 suivi de <b>n zéros</b> : 10<sup>3</sup> = 1&nbsp;000. 10<sup>−n</sup> s’écrit avec le chiffre 1 au <b>n-ième rang après la virgule</b> : 10<sup>−3</sup> = 0,001. Et 10<sup>0</sup> = 1.',
    methode: 'Pour 10<sup>n</sup> : écris 1 puis n zéros. Pour 10<sup>−n</sup> : écris 0, puis la virgule, puis place le 1 au rang n (n − 1 zéros après la virgule).',
    exemple: calc('10<sup>4</sup> = ' + c('10&nbsp;000')) + calc('10<sup>−2</sup> = ' + c('0,01')) + calc('0,000&nbsp;1 = ' + c('10<sup>−4</sup>')),
    piege: 'Un exposant négatif ne donne pas un nombre négatif : 10<sup>−3</sup> = 0,001 (un millième), pas −1&nbsp;000.',
    gen(niv) {
      const n = niv === 1 ? entre(1, 6) : niv === 2 ? -entre(1, 6) : hasard([0, -5, -6, -4, 7, 8, 9, 5, -1]);
      const v = P10(n), dir = Math.random() < 0.5;
      const sol = n >= 0 ? '<p>10<sup>' + n + '</sup> : un 1 suivi de ' + n + ' zéro' + (n > 1 ? 's' : '') + '.</p>' : '<p>10<sup>' + ent(n) + '</sup> : le chiffre 1 au ' + (-n) + '<sup>e</sup> rang après la virgule.</p>';
      if (dir) {
        return question('PU1', niv, 'PU1:d' + n, 'Écris ce nombre en écriture décimale.', [
          nbP(p10(n) + ' =', v, { forme: 'dec', diag: r => {
            if (r.v < 0) return 'Un exposant négatif ne donne pas un nombre négatif : ' + p10(n) + ' est positif, ' + (n < 0 ? 'plus petit que 1.' : '.');
            const R = Math.round(Math.log10(Math.abs(r.v)));
            if (r.v === 10 * n) return p10(n) + ' n’est pas 10 × ' + n + ' : c’est 10 multiplié ' + n + ' fois par lui-même.';
            if (R === -n && n) return 'Attention au signe de l’exposant : ' + (n > 0 ? 'positif, le nombre est grand.' : 'négatif, le nombre est plus petit que 1.');
            if (n < 0 && R !== n) return 'Pour 10<sup>−n</sup>, le 1 est au n-ième rang après la virgule : 10<sup>−3</sup> = 0,001 (trois chiffres après la virgule).';
            if (n >= 0 && R !== n) return 'Compte les zéros : 10<sup>n</sup> s’écrit 1 suivi de n zéros.';
            return null;
          } })], sol + calc(p10(n) + ' = ' + c(nb(v))),
          [n >= 0 ? 'L’exposant ' + n + ' donne le nombre de zéros après le 1.' : 'L’exposant est négatif : le nombre est plus petit que 1.', n < 0 ? 'Le chiffre 1 est au rang ' + (-n) + ' après la virgule.' : 'Écris 1 puis ' + n + ' zéros.']);
      }
      return question('PU1', niv, 'PU1:r' + n, 'Écris ce nombre comme une puissance de 10.', [
        partieExp(nb(v) + ' = 10', n, [[-n, 'Attention au signe : ' + (n < 0 ? 'un nombre plus petit que 1 a un exposant négatif.' : 'un nombre plus grand que 1 a un exposant positif.')], [n + 1, 'Compte encore : ' + (n >= 0 ? 'le nombre de zéros après le 1.' : 'le rang du 1 après la virgule.')], [n - 1, 'Compte encore : ' + (n >= 0 ? 'le nombre de zéros après le 1.' : 'le rang du 1 après la virgule.')]],
          n >= 0 ? 'Compte les zéros après le 1.' : 'Compte le rang du chiffre 1 après la virgule : c’est l’exposant, avec un signe −.')],
        sol + calc(nb(v) + ' = ' + c(p10(n))),
        [n >= 0 ? 'Compte les zéros après le 1.' : 'Le nombre est plus petit que 1 : l’exposant est négatif.', n < 0 ? 'Compte le rang du 1 après la virgule.' : 'Il y a ' + n + ' zéro' + (n > 1 ? 's' : '') + '.']);
    } });

  ajouter({ id: 'PU2', famille: 'PU', niveau: 2, prerequis: ['PU1'], titre: 'Multiplier par 10<sup>n</sup> : la virgule se déplace',
    regle: 'Multiplier par 10<sup>n</sup> déplace la virgule de <b>n rangs vers la droite</b> (le nombre grandit). Multiplier par 10<sup>−n</sup> la déplace de <b>n rangs vers la gauche</b> (le nombre rapetisse). Les chiffres ne changent pas : on ajoute des zéros si besoin.',
    methode: 'Repère le signe de l’exposant (droite si positif, gauche si négatif), puis déplace la virgule d’autant de rangs que l’exposant, en complétant par des zéros.',
    exemple: calc('3,45 × 10<sup>2</sup> = ' + c('345')) + calc('3,45 × 10<sup>−2</sup> = ' + c('0,0345')) + calc('2,7 × 10<sup>3</sup> = ' + c('2&nbsp;700')),
    piege: 'On ne colle pas des zéros à la fin d’un décimal : 3,45 × 10<sup>2</sup> = 345, pas 3,4500.',
    gen(niv) {
      const x = niv === 1 ? hasard([3.45, 2.7, 12.5, 1.08, 0.6, 4.2, 7.35, 5.1]) : niv === 2 ? hasard([3.45, 27, 125, 4.2, 0.8, 56, 9.1, 1.6]) : hasard([0.052, 45.6, 3080, 0.7, 1.25, 607, 0.0039]);
      const n = niv === 1 ? entre(1, 3) : niv === 2 ? -entre(1, 3) : hasard([4, 5, -4, -5, 6, -3]);
      const v = fix(x * P10(n));
      const parts = [];
      if (niv === 1) parts.push(choixP('Dans quel sens la virgule se déplace-t-elle ?', [{ id: 'd', label: 'Vers la droite' }, { id: 'g', label: 'Vers la gauche' }], n > 0 ? 'd' : 'g',
        { [n > 0 ? 'g' : 'd']: n > 0 ? 'L’exposant est positif : le nombre grandit, la virgule va vers la droite.' : 'L’exposant est négatif : le nombre rapetisse, la virgule va vers la gauche.' }));
      parts.push(nbP(ecr(x, n) + ' =', v, { forme: 'dec', diag: r => {
        if (r.v <= 0) return 'Le résultat est positif : un exposant négatif rend le nombre plus petit, pas négatif.';
        const rr = lg(r.v, x), R = Math.round(rr);
        if (!entierPres(rr)) return 'Les chiffres ne changent pas (' + nb(x) + ') : seule la virgule se déplace. Ajoute des zéros si besoin.';
        if (R === -n) return 'Tu as déplacé la virgule dans le mauvais sens : ' + (n > 0 ? 'exposant positif → vers la droite (le nombre grandit).' : 'exposant négatif → vers la gauche (le nombre rapetisse).');
        return 'Tu as déplacé la virgule de ' + Math.abs(R) + ' rang' + (Math.abs(R) > 1 ? 's' : '') + ' : il faut ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + '.';
      } }));
      return question('PU2', niv, 'PU2:' + x + ':' + n, 'Écris le résultat en écriture décimale.', parts,
        '<p>Exposant ' + ent(n) + ' : la virgule se déplace de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ' vers la ' + (n > 0 ? 'droite' : 'gauche') + '.</p>' + calc(ecr(x, n) + ' = ' + c(nb(v))),
        [n > 0 ? 'Exposant positif : la virgule va vers la droite.' : 'Exposant négatif : la virgule va vers la gauche.', 'Elle se déplace de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ' ; complète par des zéros si besoin.']);
    } });

  ajouter({ id: 'PU3', famille: 'PU', niveau: 3, prerequis: ['PU1'], titre: 'Produit et quotient de puissances de 10',
    regle: 'Pour un <b>produit</b>, on <b>additionne</b> les exposants : 10<sup>a</sup> × 10<sup>b</sup> = 10<sup>a + b</sup>. Pour un <b>quotient</b>, on <b>soustrait</b> : 10<sup>a</sup> / 10<sup>b</sup> = 10<sup>a − b</sup>. Avec des nombres devant : on calcule les nombres entre eux, les puissances de 10 entre elles.',
    methode: 'Écris l’opération sur les exposants, avec des parenthèses autour des exposants négatifs : 10<sup>3</sup> / 10<sup>−2</sup> = 10<sup>3 − (−2)</sup> = 10<sup>5</sup>.',
    exemple: calc('10<sup>5</sup> × 10<sup>−2</sup> = 10<sup>5 + (−2)</sup> = ' + c('10<sup>3</sup>')) + calc('10<sup>3</sup> / 10<sup>−2</sup> = 10<sup>3 − (−2)</sup> = ' + c('10<sup>5</sup>')) +
      calc('(2 × 10<sup>3</sup>) × (4 × 10<sup>−5</sup>) = 8 × 10<sup>−2</sup>'),
    piege: 'On ne multiplie pas les exposants d’un produit : 10<sup>2</sup> × 10<sup>3</sup> = 10<sup>5</sup>, pas 10<sup>6</sup>.',
    gen(niv) {
      const prod = Math.random() < 0.5;
      if (niv < 3) {
        let a = niv === 1 ? entre(1, 6) : hasard([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]);
        let b = niv === 1 ? entre(1, 5) : hasard([-5, -4, -3, -2, -1, 1, 2, 3, 4]);
        if (niv === 1 && !prod && b >= a) { const t = a; a = b + 1; b = t; }
        const v = prod ? a + b : a - b;
        const err = prod ? [[a - b, 'Pour un produit, on <b>additionne</b> les exposants.'], [a * b, 'On additionne les exposants d’un produit, on ne les multiplie pas.'], [-(a + b), 'Attention aux signes des exposants.']]
          : [[a + b, 'Pour un quotient, on <b>soustrait</b> : exposant du haut − exposant du bas.' + (b < 0 ? ' Ici ' + ent(a) + ' − ' + par(b) + '.' : '')], [b - a, 'Dans l’ordre : exposant du haut − exposant du bas.'], [-(a - b), 'Attention aux signes : ' + ent(a) + ' − ' + par(b) + '.']];
        const h = prod ? p10(a) + ' × ' + p10(b) : p10(a) + ' / ' + p10(b);
        return question('PU3', niv, 'PU3:' + prod + a + ':' + b, 'Écris le résultat comme une seule puissance de 10.', [
          partieExp(h + ' = 10', v, err, prod ? 'Produit : on additionne les exposants.' : 'Quotient : exposant du haut − exposant du bas.')],
          calc(h + ' = 10<sup>' + ent(a) + (prod ? ' + ' : ' − ') + par(b) + '</sup> = ' + c(p10(v))),
          [prod ? 'Pour un produit, on additionne les exposants.' : 'Pour un quotient, on soustrait : haut − bas.', 'Calcule ' + ent(a) + (prod ? ' + ' : ' − ') + par(b) + '.']);
      }
      // niveau 3 : des nombres devant les puissances
      const [x, y] = prod ? hasard([[2, 3], [2, 4], [3, 3], [1.5, 2], [2.5, 4], [5, 2], [4, 2], [1.2, 3]]) : hasard([[8, 2], [6, 3], [9, 3], [6, 2], [4, 8], [3, 6], [7.5, 2.5]]);
      const m = hasard([2, 3, 4, 5, -2, -3, 6]), n = hasard([-5, -4, -2, 3, 4, -6, 2]);
      const v = fix(prod ? x * y * P10(m + n) : x / y * P10(m - n));
      const h = '(' + ecr(x, m) + ') ' + (prod ? '×' : '/') + ' (' + ecr(y, n) + ')';
      const k = fix(prod ? x * y : x / y), e = prod ? m + n : m - n;
      return question('PU3', niv, 'PU3:' + h, 'Calcule, sans calculatrice. Toute écriture juste est acceptée.', [
        nbP(h + ' =', v, { diag: r => {
          const rr = lg(r.v, k);
          if (entierPres(rr)) return 'Le calcul des nombres (' + nb(x) + (prod ? ' × ' : ' / ') + nb(y) + ' = ' + nb(k) + ') est juste ; revois les exposants : ' + (prod ? 'on les additionne.' : 'haut − bas.');
          return 'Calcule à part les nombres (' + nb(x) + (prod ? ' × ' : ' / ') + nb(y) + ') et les puissances de 10 (' + p10(m) + (prod ? ' × ' : ' / ') + p10(n) + ').';
        } })],
        calc(h + ' = (' + nb(x) + (prod ? ' × ' : ' / ') + nb(y) + ') × 10<sup>' + ent(m) + (prod ? ' + ' : ' − ') + par(n) + '</sup> = ' + c(ecr(k, e))),
        ['Regroupe les nombres d’un côté et les puissances de 10 de l’autre.', 'Nombres : ' + nb(x) + (prod ? ' × ' : ' / ') + nb(y) + ' ; puissances : ' + (prod ? 'on additionne les exposants.' : 'haut − bas.')]);
    } });

  ajouter({ id: 'PU4', famille: 'PU', niveau: 4, prerequis: ['PU3'], titre: 'Inverse et puissance d’une puissance',
    regle: 'L’<b>inverse</b> change le signe de l’exposant : 1 / 10<sup>n</sup> = 10<sup>−n</sup>. La <b>puissance d’une puissance</b> multiplie les exposants : (10<sup>a</sup>)<sup>b</sup> = 10<sup>a × b</sup>.',
    methode: 'Inverse : garde la valeur de l’exposant, change son signe. Puissance d’une puissance : multiplie les deux exposants (attention aux signes). Termine par les règles du produit et du quotient.',
    exemple: calc('1 / 10<sup>4</sup> = ' + c('10<sup>−4</sup>')) + calc('1 / 10<sup>−3</sup> = ' + c('10<sup>3</sup>')) + calc('(10<sup>−2</sup>)<sup>3</sup> = 10<sup>−2 × 3</sup> = ' + c('10<sup>−6</sup>')),
    piege: '(10<sup>2</sup>)<sup>3</sup> = 10<sup>6</sup> (on multiplie), alors que 10<sup>2</sup> × 10<sup>3</sup> = 10<sup>5</sup> (on additionne).',
    gen(niv) {
      const t = niv === 1 ? 'inv' : niv === 2 ? 'pp' : hasard(['inv-pp', 'pp-prod', 'pp-quot']);
      if (t === 'inv') {
        const n = hasard([-6, -4, -3, -2, -1, 1, 2, 3, 5, 6]);
        return question('PU4', niv, 'PU4:i' + n, 'Écris l’inverse comme une puissance de 10.', [
          partieExp('1 / ' + p10(n) + ' = 10', -n, [[n, 'L’inverse <b>change le signe</b> de l’exposant.']], 'L’inverse garde la valeur de l’exposant et change son signe.')],
          calc('1 / ' + p10(n) + ' = ' + c(p10(-n))), ['L’inverse change le signe de l’exposant.']);
      }
      if (t === 'pp') {
        const a = hasard([-5, -3, -2, -1, 2, 3, 4]), b = hasard([2, 3, 4]);
        return question('PU4', niv, 'PU4:p' + a + b, 'Écris le résultat comme une seule puissance de 10.', [
          partieExp('(' + p10(a) + ')<sup>' + b + '</sup> = 10', a * b, [[a + b, 'Puissance d’une puissance : on <b>multiplie</b> les exposants (on additionne pour un produit).'], [-a * b, 'Attention au signe : ' + par(a) + ' × ' + b + '.']], 'On multiplie les exposants : ' + par(a) + ' × ' + b + '.')],
          calc('(' + p10(a) + ')<sup>' + b + '</sup> = 10<sup>' + par(a) + ' × ' + b + '</sup> = ' + c(p10(a * b))), ['Puissance d’une puissance : on multiplie les exposants.']);
      }
      const a = hasard([-3, -2, 2, 3]), b = hasard([2, 3]), d = hasard([-4, -2, 1, 3, 5]);
      let h, v, s;
      if (t === 'inv-pp') { h = '1 / (' + p10(a) + ')<sup>' + b + '</sup>'; v = -a * b; s = '1 / 10<sup>' + ent(a * b) + '</sup> = ' + c(p10(v)); }
      else if (t === 'pp-prod') { h = '(' + p10(a) + ')<sup>' + b + '</sup> × ' + p10(d); v = a * b + d; s = '10<sup>' + ent(a * b) + '</sup> × ' + p10(d) + ' = 10<sup>' + ent(a * b) + ' + ' + par(d) + '</sup> = ' + c(p10(v)); }
      else { h = '(' + p10(a) + ')<sup>' + b + '</sup> / ' + p10(d); v = a * b - d; s = '10<sup>' + ent(a * b) + '</sup> / ' + p10(d) + ' = 10<sup>' + ent(a * b) + ' − ' + par(d) + '</sup> = ' + c(p10(v)); }
      return question('PU4', niv, 'PU4:' + h, 'Écris le résultat comme une seule puissance de 10.', [
        partieExp(h + ' = 10', v, [], 'D’abord la puissance d’une puissance : (' + p10(a) + ')<sup>' + b + '</sup> = 10<sup>' + ent(a * b) + '</sup>. Puis ' + (t === 'inv-pp' ? 'l’inverse change le signe.' : t === 'pp-prod' ? 'le produit : on additionne.' : 'le quotient : haut − bas.'))],
        calc('(' + p10(a) + ')<sup>' + b + '</sup> = 10<sup>' + ent(a * b) + '</sup>') + calc(s),
        ['Commence par (' + p10(a) + ')<sup>' + b + '</sup> : on multiplie les exposants.', t === 'inv-pp' ? 'Puis l’inverse change le signe de l’exposant.' : t === 'pp-prod' ? 'Puis le produit : on additionne les exposants.' : 'Puis le quotient : exposant du haut − exposant du bas.']);
    } });

  /* -------------------- ÉCRITURE SCIENTIFIQUE -------------------- */
  // a × 10ⁿ écrit avec la mantisse donnée en texte (pour garder les zéros)
  const ecrT = (ta, n) => ta + ' × ' + p10(n);
  ajouter({ id: 'ES1', famille: 'ES', niveau: 2, prerequis: ['PU1'], titre: 'Reconnaître l’écriture scientifique',
    regle: 'L’<b>écriture scientifique</b> d’un nombre est a × 10<sup>n</sup>, avec <b>1 ≤ a &lt; 10</b> (un seul chiffre, non nul, avant la virgule) et n entier.',
    methode: 'Regarde seulement le nombre a devant la puissance de 10 : il doit être au moins égal à 1 et plus petit que 10.',
    exemple: '<p>4,5 × 10<sup>3</sup> ✓ · 1 × 10<sup>−6</sup> ✓ · 45 × 10<sup>2</sup> ✗ (45 ≥ 10) · 0,45 × 10<sup>4</sup> ✗ (0,45 &lt; 1)</p>',
    piege: '10 × 10<sup>3</sup> n’est pas une écriture scientifique : a doit être <b>strictement</b> plus petit que 10. On écrit 1 × 10<sup>4</sup>.',
    gen(niv) {
      if (niv === 2) {
        const cas = hasard([['0,5', 3, false, '0,5 est plus petit que 1.'], ['12', -2, false, '12 est plus grand que 10.'], ['3,7', 5, true], ['1', 4, true], ['10', 3, false, 'a doit être strictement plus petit que 10.'], ['9,9', -3, true], ['0,08', 6, false, '0,08 est plus petit que 1.'], ['6,02', 23, true]]);
        return question('ES1', niv, 'ES1:' + cas[0] + cas[1], 'Réponds par oui ou par non.', [
          choixP('<b>' + ecrT(cas[0], cas[1]) + '</b> est-il écrit en écriture scientifique ?', [{ id: 'o', label: 'Oui' }, { id: 'n', label: 'Non' }], cas[2] ? 'o' : 'n',
            { o: 'Regarde a = ' + cas[0] + ' : ' + (cas[3] || '') + ' Il faut 1 ≤ a &lt; 10.', n: 'a = ' + cas[0] + ' est bien entre 1 et 10 (1 ≤ a &lt; 10) : c’est une écriture scientifique.' })],
          '<p>a = ' + cas[0] + ' : ' + (cas[2] ? 'on a bien 1 ≤ a &lt; 10, c’est une écriture scientifique.' : (cas[3] || '') + ' Ce n’est pas une écriture scientifique.') + '</p>',
          ['Regarde le nombre a devant la puissance de 10.', 'Il faut 1 ≤ a &lt; 10.']);
      }
      const ta = niv === 1 ? hasard(['4,5', '3,2', '7,8', '2,05', '6,4']) : hasard(['9,99', '1,0', '1,05', '9,5']);
      const n = hasard([2, 3, 4, -2, -3, 5, -5]);
      const a = parseFloat(ta.replace(',', '.'));
      const op = [{ id: 'ok', label: ecrT(ta, n) },
        { id: 'gr', label: ecrT(nb(fix(a * 10)), n - 1) },
        { id: 'pe', label: ecrT(nb(fix(a / 10)), n + 1) },
        { id: 'di', label: niv === 3 ? ecrT('10', n - 1).replace('10 ×', '10,0 ×') : ecrT(nb(fix(a * 100)), n - 2) }];
      return question('ES1', niv, 'ES1:' + ta + n, 'Ces quatre écritures sont égales. Choisis celle qui est en écriture scientifique.', [
        choixP('Laquelle est en écriture scientifique ?', melanger(op), 'ok', { gr: 'Le nombre devant la puissance de 10 est plus grand que 10.', pe: 'Le nombre devant la puissance de 10 est plus petit que 1.', di: 'Le nombre devant la puissance de 10 n’est pas plus petit que 10.' })],
        '<p>Il faut 1 ≤ a &lt; 10 : ' + c(ecrT(ta, n)) + '.</p>', ['Regarde seulement le nombre devant la puissance de 10.', 'Il doit avoir un seul chiffre, non nul, avant la virgule.']);
    } });

  ajouter({ id: 'ES2', famille: 'ES', niveau: 4, prerequis: ['ES1', 'PU2'], titre: 'Mettre un nombre en écriture scientifique',
    regle: 'On place la virgule juste après le <b>premier chiffre non nul</b> : c’est a. L’exposant n est le nombre de rangs dont la virgule s’est déplacée : <b>positif</b> pour un nombre plus grand que 10, <b>négatif</b> pour un nombre plus petit que 1. On garde <b>tous les chiffres significatifs</b>.',
    methode: '1. Écris a avec les chiffres du nombre (sans les zéros de gauche). 2. Compte les rangs entre l’ancienne et la nouvelle place de la virgule. 3. Vérifie : a × 10<sup>n</sup> redonne bien le nombre.',
    exemple: calc('45&nbsp;000 = ' + c('4,5 × 10<sup>4</sup>')) + calc('0,003&nbsp;2 = ' + c('3,2 × 10<sup>−3</sup>')) + calc('0,000&nbsp;405&nbsp;0 = ' + c('4,050 × 10<sup>−4</sup>') + ' (le zéro final compte)'),
    piege: 'Pour un nombre plus petit que 1, l’exposant est négatif : 0,003&nbsp;2 = 3,2 × 10<sup>−3</sup>, pas 3,2 × 10<sup>3</sup>.',
    gen(niv) {
      let ta, n;
      if (niv === 1) { ta = hasard(['4,5', '3,2', '6,8', '1,25', '7', '2,04', '9,1']); n = entre(2, 6); }
      else if (niv === 2) { ta = hasard(['3,2', '4,5', '1,8', '6,05', '2', '7,25']); n = -entre(1, 5); }
      else { ta = hasard(['4,050', '7,02', '2,30', '1,008', '6,00', '3,40']); n = hasard([-4, -5, -3, 5, 7, 6]); }
      const a = parseFloat(ta.replace(',', '.')), cs = N.compteCS(ta), x = fix(a * P10(n));
      const tx = niv === 3 && n < 0 ? N.txtCS(x, cs) : nb(x);
      const diagSci = r => {
        const rr = lg(r.v, x);
        if (r.v > 0 && entierPres(rr)) {
          const R = Math.round(rr);
          if (R === -2 * n) return 'Attention au signe de l’exposant : ' + (n > 0 ? 'le nombre est plus grand que 10, l’exposant est positif.' : 'le nombre est plus petit que 1, l’exposant est négatif.');
          return 'Le nombre a est juste ; recompte les rangs dont la virgule se déplace (' + (R > 0 ? 'tu en as compté trop' : 'il en manque') + ').';
        }
        return 'Écris a avec les chiffres de ' + tx + ', la virgule après le premier chiffre non nul.';
      };
      const parts = [];
      if (niv === 1) {
        parts.push(nbP('Le nombre a (1 ≤ a &lt; 10) :', a, { diag: () => 'a s’écrit avec les chiffres de ' + tx + ' et la virgule juste après le premier chiffre : un seul chiffre avant la virgule.' }));
        parts.push(partieExp(tx + ' = ' + ta + ' × 10', n, [[-n, 'Le nombre est plus grand que 10 : l’exposant est positif.'], [n + 1, 'Recompte les rangs : de la place de la virgule (après le dernier chiffre) jusqu’après le premier chiffre.'], [n - 1, 'Recompte les rangs : de la place de la virgule (après le dernier chiffre) jusqu’après le premier chiffre.']], 'Compte les rangs dont la virgule s’est déplacée.'));
      } else parts.push(nbP(tx + ' =', x, { forme: 'sci', cs: niv === 3 ? cs : null, csLibre: niv !== 3, diag: diagSci }));
      return question('ES2', niv, 'ES2:' + ta + n, 'Écris ce nombre en écriture scientifique' + (niv === 3 ? ', en gardant tous ses chiffres significatifs.' : '.'), parts,
        '<p>Virgule après le premier chiffre non nul : a = ' + ta + ' ; elle s’est déplacée de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ' vers la ' + (n > 0 ? 'gauche (nombre plus grand que 10 : exposant positif).' : 'droite (nombre plus petit que 1 : exposant négatif).') + '</p>' + calc(tx + ' = ' + c(ecrT(ta, n))),
        ['La virgule va juste après le premier chiffre non nul : a = ' + ta + '.', n > 0 ? 'Le nombre est plus grand que 10 : l’exposant est positif.' : 'Le nombre est plus petit que 1 : l’exposant est négatif.', 'Compte les rangs : ' + Math.abs(n) + '.']);
    } });

  ajouter({ id: 'ES3', famille: 'ES', niveau: 3, prerequis: ['PU2'], titre: 'Revenir à l’écriture décimale',
    regle: 'Pour passer de a × 10<sup>n</sup> à l’écriture décimale, on déplace la virgule de a de <b>n rangs</b> : vers la droite si n est positif, vers la gauche si n est négatif.',
    methode: 'Pars des chiffres de a, déplace la virgule, complète par des zéros. Vérifie l’ordre de grandeur : 10<sup>4</sup>, c’est des dizaines de milliers.',
    exemple: calc('3,2 × 10<sup>4</sup> = ' + c('32&nbsp;000')) + calc('4,5 × 10<sup>−3</sup> = ' + c('0,004&nbsp;5')),
    piege: '4,5 × 10<sup>−3</sup> = 0,004&nbsp;5 : le 4 est au 3<sup>e</sup> rang après la virgule, pas au 4<sup>e</sup>.',
    gen(niv) {
      const a = niv === 3 ? hasard([7.05, 1.234, 9.6, 3.08, 2.5]) : hasard([3.2, 4.5, 1.25, 6, 7.8, 2.04]);
      const n = niv === 1 ? entre(1, 4) : niv === 2 ? -entre(1, 4) : hasard([-6, -5, -4, 4, 5, 6, 7]);
      const v = fix(a * P10(n));
      return question('ES3', niv, 'ES3:' + a + n, 'Écris ce nombre en écriture décimale.', [
        nbP(ecr(a, n) + ' =', v, { forme: 'dec', diag: r => {
          if (r.v <= 0) return 'Le nombre est positif : un exposant négatif le rend plus petit que 1, pas négatif.';
          const rr = lg(r.v, a), R = Math.round(rr);
          if (!entierPres(rr)) return 'Garde les chiffres de ' + nb(a) + ' : seule la virgule se déplace.';
          if (R === -n) return 'Mauvais sens : ' + (n > 0 ? 'exposant positif, le nombre est grand (virgule vers la droite).' : 'exposant négatif, le nombre est plus petit que 1 (virgule vers la gauche).');
          return 'La virgule se déplace de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ', pas de ' + Math.abs(R) + '.';
        } })],
        '<p>La virgule de ' + nb(a) + ' se déplace de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ' vers la ' + (n > 0 ? 'droite' : 'gauche') + '.</p>' + calc(ecr(a, n) + ' = ' + c(nb(v))),
        [n > 0 ? 'Exposant positif : virgule vers la droite.' : 'Exposant négatif : virgule vers la gauche.', 'De ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ', en complétant par des zéros.']);
    } });

  ajouter({ id: 'ES4', famille: 'ES', niveau: 5, prerequis: ['ES2', 'PU3'], titre: 'Corriger une écriture a × 10<sup>n</sup>',
    regle: 'Si a n’est pas entre 1 et 10, on le corrige sans changer la valeur : quand a est <b>divisé par 10</b>, l’exposant <b>augmente de 1</b> ; quand a est <b>multiplié par 10</b>, l’exposant <b>diminue de 1</b>.',
    methode: 'Écris a lui-même en écriture scientifique, puis multiplie les puissances de 10 : 45 × 10<sup>3</sup> = 4,5 × 10<sup>1</sup> × 10<sup>3</sup> = 4,5 × 10<sup>4</sup>.',
    exemple: calc('45 × 10<sup>3</sup> = 4,5 × 10<sup>1</sup> × 10<sup>3</sup> = ' + c('4,5 × 10<sup>4</sup>')) + calc('0,32 × 10<sup>−4</sup> = 3,2 × 10<sup>−1</sup> × 10<sup>−4</sup> = ' + c('3,2 × 10<sup>−5</sup>')),
    piege: 'Les deux changements se compensent : 45 × 10<sup>3</sup> = 4,5 × 10<sup>4</sup>, pas 4,5 × 10<sup>2</sup> (qui est 100 fois plus petit).',
    gen(niv) {
      const m = niv === 1 ? hasard([45, 32, 12, 68, 25, 73]) : niv === 2 ? hasard([0.32, 0.045, 450, 0.7, 1200, 36.5]) : hasard([450, 0.32, 68, 0.0071, 23.5, 0.6]);
      const n = niv === 3 ? -entre(2, 7) : entre(2, 6);
      const x = fix(m * P10(n)), d = N.decompose(m), na = d.n + n;
      const diag = r => {
        const rr = lg(r.v, x), R = Math.round(rr);
        if (r.v > 0 && entierPres(rr)) return R === -2 * d.n ? 'L’exposant a bougé dans le mauvais sens : ' + (d.n > 0 ? 'a a été divisé par ' + nb(P10(d.n)) + ', l’exposant doit augmenter de ' + d.n + '.' : 'a a été multiplié par ' + nb(P10(-d.n)) + ', l’exposant doit diminuer de ' + (-d.n) + '.')
          : 'Le nombre a est juste ; l’exposant doit compenser : ' + nb(m) + ' = ' + ecr(d.a, d.n) + '.';
        return 'Écris d’abord ' + nb(m) + ' en écriture scientifique.';
      };
      const parts = [];
      if (niv === 1) {
        parts.push(nbP(nb(m) + ' = ', d.a, { apres: '× 10<sup>' + d.n + '</sup>', diag: () => 'Un seul chiffre avant la virgule : ' + nb(m) + ' = ? × 10.' }));
        parts.push(partieExp(ecr(m, n) + ' = ' + nb(d.a) + ' × 10<sup>' + d.n + '</sup> × ' + p10(n) + ' = ' + nb(d.a) + ' × 10', na, [[n - d.n, 'a a été divisé par 10 : l’exposant doit <b>augmenter</b> de 1, pas diminuer.'], [n, 'Il faut compenser : ' + p10(d.n) + ' × ' + p10(n) + ' = 10<sup>' + d.n + ' + ' + par(n) + '</sup>.']], 'On additionne les exposants : ' + d.n + ' + ' + par(n) + '.'));
      } else parts.push(nbP(ecr(m, n) + ' =', x, { forme: 'sci', diag }));
      return question('ES4', niv, 'ES4:' + m + n, 'Écris ce nombre en écriture scientifique.', parts,
        calc(ecr(m, n) + ' = ' + ecr(d.a, d.n) + ' × ' + p10(n) + ' = ' + c(ecr(d.a, na))),
        ['Écris d’abord ' + nb(m) + ' en écriture scientifique : ' + nb(m) + ' = ' + ecr(d.a, d.n) + '.', 'Puis additionne les exposants : ' + d.n + ' + ' + par(n) + '.']);
    } });

  /* -------------------- CHIFFRES SIGNIFICATIFS -------------------- */
  // [écriture, nombre de chiffres significatifs, piège de l'écriture]
  const CS_N1 = [['3,45', 3], ['12,6', 3], ['7,2', 2], ['125', 3], ['4,817', 4], ['2,5', 2], ['8', 1], ['1,08', 3], ['9,81', 3], ['15,07', 4]];
  const CS_N2 = [['0,045', 2, 'g'], ['0,003&nbsp;07', 3, 'g'], ['0,5', 1, 'g'], ['0,08', 1, 'g'], ['0,602', 3, 'g'], ['0,012&nbsp;5', 3, 'g'], ['0,7', 1, 'g']];
  const CS_N3 = [['2,50', 3, 'd'], ['0,040&nbsp;0', 3, 'gd'], ['3,0 × 10<sup>4</sup>', 2, 'p'], ['1,200 × 10<sup>−3</sup>', 4, 'p'], ['10,0', 3, 'd'], ['0,010', 2, 'gd'], ['6,00', 3, 'd'], ['5,0 × 10<sup>−6</sup>', 2, 'p']];
  ajouter({ id: 'CS1', famille: 'CS', niveau: 1, prerequis: [], titre: 'Compter les chiffres significatifs',
    regle: 'On compte les chiffres <b>à partir du premier chiffre non nul</b>. Les zéros <b>à gauche</b> ne comptent pas (ils placent la virgule) ; les zéros <b>au milieu et à droite</b> comptent (ils disent la précision). La puissance de 10 ne compte pas.',
    methode: 'Cache les zéros de gauche et la puissance de 10, puis compte tous les chiffres qui restent, zéros finaux compris.',
    exemple: '<p>3,45 → <b>3</b> · 0,045 → <b>2</b> · 1,08 → <b>3</b> · 2,50 → <b>3</b> · 3,0 × 10<sup>4</sup> → <b>2</b></p>',
    piege: '2,5 et 2,50 ont la même valeur mais pas la même précision : 2 chiffres significatifs pour 2,5, 3 pour 2,50.',
    gen(niv) {
      const [t, n, pi] = hasard(niv === 1 ? CS_N1 : niv === 2 ? CS_N2 : CS_N3);
      const tous = t.replace(/×.*$/, '').replace(/[^\d]/g, '').length;
      const ops = [...new Set([n, n + 1, Math.max(1, n - 1), tous, n + 2])].filter(x => x >= 1).slice(0, 4).sort((a, b) => a - b);
      const ind = {};
      ops.forEach(x => {
        if (x === n) return;
        ind[x] = x === tous && pi && pi.indexOf('g') >= 0 ? 'Les zéros à gauche ne comptent pas : ils servent seulement à placer la virgule.'
          : x < n && pi && pi.indexOf('d') >= 0 ? 'Les zéros à droite comptent : ils disent la précision de la valeur.'
          : x > n && pi === 'p' ? 'La puissance de 10 ne compte pas : compte seulement les chiffres du nombre devant.'
          : 'Compte à partir du premier chiffre non nul, jusqu’au dernier chiffre écrit.';
      });
      return question('CS1', niv, 'CS1:' + t, 'Compte les chiffres significatifs.', [
        choixP('Combien de chiffres significatifs dans <b>' + t + '</b> ?', ops.map(x => ({ id: String(x), label: String(x) })), String(n), ind)],
        '<p>On compte à partir du premier chiffre non nul' + (pi && pi.indexOf('d') >= 0 ? ', zéros de droite compris' : '') + (pi === 'p' ? ', sans la puissance de 10' : '') + ' : ' + c(n + ' chiffre' + (n > 1 ? 's' : '') + ' significatif' + (n > 1 ? 's' : '')) + '.</p>',
        ['Les zéros à gauche ne comptent pas.', 'Les zéros au milieu et à droite comptent ; la puissance de 10 ne compte pas.']);
    } });

  // nombre au hasard avec k chiffres (le dernier non nul), ordre de grandeur 10^e
  function auHasard(k, e) {
    let s = String(entre(1, 9));
    for (let i = 1; i < k; i++) s += String(i === k - 1 ? entre(1, 9) : entre(0, 9));
    return fix(parseInt(s, 10) * P10(e - k + 1));
  }
  const tronque = (x, n) => { const d = N.decompose(x); return fix(Math.trunc(fix(d.a * P10(n - 1))) * P10(d.n - n + 1)); };
  ajouter({ id: 'CS2', famille: 'CS', niveau: 3, prerequis: ['CS1'], titre: 'Arrondir à n chiffres significatifs',
    regle: 'On garde les n premiers chiffres significatifs et on regarde le <b>chiffre suivant</b> : s’il vaut <b>5 ou plus</b>, on augmente de 1 le dernier chiffre gardé ; sinon on le laisse. On garde les zéros utiles (10,0) et on passe à l’écriture scientifique quand il le faut.',
    methode: 'Souligne les n premiers chiffres significatifs, regarde le suivant, arrondis, puis vérifie que ton résultat a bien n chiffres significatifs.',
    exemple: calc('3,141&nbsp;59 à 3 c.s. → ' + c('3,14')) + calc('0,004&nbsp;567 à 2 c.s. → ' + c('0,004&nbsp;6')) + calc('9,996 à 3 c.s. → ' + c('10,0')) + calc('123&nbsp;456 à 3 c.s. → ' + c('1,23 × 10<sup>5</sup>')),
    piege: 'Arrondir n’est pas couper : 12,46 à 3 chiffres significatifs donne 12,5 (le 6 qui suit fait monter le 4), pas 12,4.',
    gen(niv) {
      let x, n;
      if (niv === 3 && Math.random() < 0.6) [x, n] = hasard([[9.996, 3], [0.09996, 2], [123456, 3], [1.0049, 3], [29.97, 2], [0.0059987, 3], [699.8, 3]]);
      else {
        n = entre(2, 4);
        x = auHasard(n + entre(2, 3), niv === 1 ? entre(0, 2) : niv === 2 ? -entre(2, 4) : hasard([4, 5, -5]));
        if (fix(N.arrondi(x, n)) === tronque(x, n) && Math.random() < 0.6) x = fix(x + 6 * P10(N.decompose(x).n - n));   // le plus souvent, l'arrondi fait monter un chiffre
      }
      const v = N.arrondi(x, n), tv = Math.abs(N.decompose(v).n) > 5 ? N.sci(v, n) : N.txtCS(v, n);
      return question('CS2', niv, 'CS2:' + x + ':' + n, 'Arrondis ce nombre.' + (Math.abs(N.decompose(x).n) > 4 ? ' Tu peux utiliser l’écriture scientifique.' : ''), [
        nbP('<b>' + nb(x) + '</b> arrondi à <b>' + n + '</b> chiffres significatifs :', v, { cs: n, brut: x, diag: r => {
          if (N.egal(r.v, tronque(x, n))) return 'Arrondir n’est pas couper : regarde le chiffre qui suit le ' + n + '<sup>e</sup> chiffre significatif. S’il vaut 5 ou plus, on augmente le dernier chiffre gardé.';
          for (const k of [n - 1, n + 1]) if (k > 0 && N.egal(r.v, N.arrondi(x, k))) return 'Tu as gardé ' + k + ' chiffres significatifs, il en faut ' + n + '. Compte à partir du premier chiffre non nul.';
          if (N.egal(r.v, N.arrondi(x, n), 0.2) || entierPres(lg(r.v, v))) return 'Garde l’ordre de grandeur : l’arrondi doit rester proche de ' + nb(x) + '.';
          return 'Compte les ' + n + ' premiers chiffres à partir du premier chiffre non nul, puis regarde le suivant.';
        } })],
        '<p>Les ' + n + ' premiers chiffres significatifs, puis on regarde le suivant (5 ou plus : on augmente).</p>' + calc(nb(x) + ' ≈ ' + c(tv)),
        ['Repère le premier chiffre non nul, puis garde ' + n + ' chiffres.', 'Regarde le chiffre suivant : 5 ou plus, on augmente le dernier chiffre gardé.']);
    } });

  /* Formules et données pour la règle du produit et du quotient : [résultat, opération, [nom, unité] des données] */
  const FORM = [
    ['v', 'd / Δt', [['d', 'm'], ['Δt', 's']], 'm/s'], ['ρ', 'm / V', [['m', 'g'], ['V', 'mL']], 'g/mL'], ['P', 'U × I', [['U', 'V'], ['I', 'A']], 'W'],
    ['U', 'R × I', [['R', 'Ω'], ['I', 'A']], 'V'], ['C', 'n / V', [['n', 'mol'], ['V', 'L']], 'mol/L'], ['E', 'P × Δt', [['P', 'W'], ['Δt', 's']], 'J'],
    ['n', 'm / M', [['m', 'g'], ['M', 'g/mol']], 'mol'], ['F', 'm × a', [['m', 'kg'], ['a', 'm/s²']], 'N']
  ];
  const FORM3 = [['E<sub>p</sub>', 'm × g × h', [['m', 'kg'], ['g', 'N/kg'], ['h', 'm']], 'J'], ['Q', 'm × c × ΔT', [['m', 'kg'], ['c', 'J/(kg·K)'], ['ΔT', 'K']], 'J'], ['P', 'R × I²', [['R', 'Ω'], ['I', 'A'], ['I', 'A']], 'W']];
  // les données d'un calcul : valeurs et chiffres significatifs
  function donnees(niv) {
    const f = niv === 3 ? hasard(FORM3.slice(0, 2)) : hasard(FORM);
    const k = f[2].length;
    let css = f[2].map(() => entre(2, 4));
    if (css.every(x => x === css[0])) css[0] = css[0] === 2 ? 3 : css[0] - 1;
    f[2].forEach((d, i) => { if (d[0] === 'g') css[i] = 3; });
    if (css.every(x => x === css[0])) css[0] = 2;
    const ds = f[2].map((d, i) => {
      const cs = css[i];
      // niveau 2 : une donnée plus petite que 1 (zéros à gauche) ; niveau 3 : zéros finaux significatifs
      // (jamais d'entier terminé par un zéro : ses chiffres significatifs seraient ambigus)
      const zero = niv === 3 && i === k - 1;
      const e = niv === 2 && i === 0 ? -entre(1, 2) : entre(0, Math.max(0, Math.min(2, cs - (zero ? 2 : 1))));
      let v = auHasard(cs, e);
      if (zero) v = fix(N.arrondi(v, cs - 1));                            // un zéro final qui compte
      if (d[0] === 'g') return { nom: 'g', u: d[1], v: 9.81, cs: 3, t: '9,81' };   // intensité de la pesanteur
      return { nom: d[0], u: d[1], v, cs, t: N.txtCS(v, cs) };
    });
    let r = ds[0].v;
    const ops = f[1].split(' ');
    for (let i = 1; i < k; i++) r = ops[2 * i - 1] === '/' ? r / ds[i].v : r * ds[i].v;
    return { f, ds, r: fix(r), cs: Math.min(...css) };
  }
  const phraseDonnees = D => D.ds.map(d => d.nom + ' = ' + d.t + '&nbsp;' + d.u).join(' ; ');
  ajouter({ id: 'CS3', famille: 'CS', niveau: 4, prerequis: ['CS1'], titre: 'Le nombre de chiffres significatifs d’un résultat',
    regle: 'Le résultat d’un <b>produit</b> ou d’un <b>quotient</b> s’écrit avec autant de chiffres significatifs que la donnée qui en a <b>le moins</b> : un résultat n’est pas plus précis que la donnée la moins précise.',
    methode: 'Compte les chiffres significatifs de chaque donnée, prends le plus petit nombre.',
    exemple: '<p>v = d / Δt avec d = 12,5 m (3 c.s.) et Δt = 4,2 s (2 c.s.) : on écrit v avec <b>2</b> chiffres significatifs.</p>',
    piege: 'Ce n’est ni le plus grand nombre de chiffres significatifs, ni la somme : c’est le plus petit.',
    gen(niv) {
      const D = donnees(niv);
      const ops = [...new Set([D.cs, D.cs + 1, Math.max(...D.ds.map(d => d.cs)), D.cs - 1, D.cs + 2])].filter(x => x >= 1).slice(0, 4).sort((a, b) => a - b);
      const ind = {};
      ops.forEach(x => { if (x !== D.cs) ind[x] = x > D.cs ? 'C’est la donnée la <b>moins</b> précise qui fixe la précision du résultat : prends le plus petit nombre de chiffres significatifs.' : 'Recompte les chiffres significatifs de chaque donnée (les zéros de gauche ne comptent pas, ceux de droite comptent).'; });
      return question('CS3', niv, 'CS3:' + phraseDonnees(D), 'On calcule <b>' + D.f[0] + ' = ' + D.f[1] + '</b> avec ' + phraseDonnees(D) + '.', [
        choixP('Avec combien de chiffres significatifs faut-il écrire ' + D.f[0] + ' ?', ops.map(x => ({ id: String(x), label: String(x) })), String(D.cs), ind)],
        '<p>' + D.ds.map(d => d.t + ' : ' + d.cs + ' c.s.').join(' ; ') + '. Le plus petit nombre : ' + c(String(D.cs)) + '.</p>',
        ['Compte les chiffres significatifs de chaque donnée.', 'Garde le plus petit de ces nombres.']);
    } });

  // affichage d'une calculatrice (point décimal, « E » pour les puissances de 10)
  function calculatrice(x) {
    const d = N.decompose(x);
    if (Math.abs(d.n) >= 6) return (+d.a.toPrecision(10)).toString() + 'E' + (d.n < 0 ? '-' : '') + String(Math.abs(d.n)).padStart(2, '0');
    return (+x.toPrecision(10)).toString();
  }
  ajouter({ id: 'CS4', famille: 'CS', niveau: 6, prerequis: ['CS2', 'CS3', 'ES2'], titre: 'Écrire le résultat de la calculatrice',
    regle: 'La calculatrice donne trop de chiffres. On écrit le résultat avec le <b>bon nombre de chiffres significatifs</b> (celui de la donnée la moins précise), souvent en <b>écriture scientifique</b>, avec son <b>unité</b>. Sur l’écran, « E−05 » veut dire × 10<sup>−5</sup>.',
    methode: '1. Compte les chiffres significatifs des données, garde le plus petit nombre. 2. Arrondis l’affichage à ce nombre de chiffres. 3. Écris le résultat (écriture scientifique si le nombre est très grand ou très petit) suivi de l’unité.',
    exemple: '<p>v = d / Δt avec d = 12,5 m et Δt = 4,2 s ; la calculatrice affiche 2.976190476.</p>' + calc('v = ' + c('3,0&nbsp;m/s') + ' (2 chiffres significatifs)'),
    piege: 'On garde les zéros utiles : 2,976 arrondi à 2 chiffres significatifs s’écrit 3,0 (pas 3).',
    gen(niv) {
      let D = donnees(niv === 1 ? 1 : 2);
      if (niv === 3) {
        // résultat très grand ou très petit : écriture scientifique
        D = donnees(2);
        const k = hasard([-6, -5, 6, 7]);
        D.ds[0].v = fix(D.ds[0].v * P10(k)); D.ds[0].t = N.sci(D.ds[0].v, D.ds[0].cs);
        D.r = fix(D.f[1].indexOf('/') >= 0 ? D.ds[0].v / D.ds[1].v : D.ds[0].v * D.ds[1].v);
      }
      const v = N.arrondi(D.r, D.cs), ecran = calculatrice(D.r);
      const parts = [];
      if (niv === 1) {
        const ops = [...new Set([D.cs, D.cs + 1, D.cs - 1, 10])].filter(x => x >= 1).slice(0, 4).sort((a, b) => a - b);
        parts.push(choixP('Avec combien de chiffres significatifs faut-il écrire ' + D.f[0] + ' ?', ops.map(x => ({ id: String(x), label: String(x) })), String(D.cs),
          Object.fromEntries(ops.filter(x => x !== D.cs).map(x => [x, x === 10 ? 'On ne recopie pas tous les chiffres de la calculatrice : le résultat n’est pas plus précis que les données.' : 'C’est la donnée la moins précise qui compte : le plus petit nombre de chiffres significatifs.']))));
      }
      parts.push(nbP(D.f[0] + ' =', v, { apres: D.f[3], cs: D.cs, brut: D.r, forme: niv === 3 ? 'sci' : null, diag: r => {
        if (N.egal(r.v, tronque(D.r, D.cs))) return 'Arrondir n’est pas couper : regarde le chiffre suivant.';
        if (entierPres(lg(r.v, v))) return 'Attention à la puissance de 10' + (/E/.test(ecran) ? ' : « E' + ecran.split('E')[1] + ' » veut dire × 10<sup>' + ent(parseInt(ecran.split('E')[1], 10)) + '</sup>.' : '.');
        return 'Pars de l’affichage ' + ecran + ' et arrondis-le à ' + D.cs + ' chiffres significatifs.';
      } }));
      return question('CS4', niv, 'CS4:' + phraseDonnees(D), 'On calcule <b>' + D.f[0] + ' = ' + D.f[1] + '</b> avec ' + phraseDonnees(D) + '. La calculatrice affiche :<span class="cn-ecran">' + ecran + '</span>Écris le résultat' + (niv === 3 ? ' en écriture scientifique' : '') + ' avec le bon nombre de chiffres significatifs.', parts,
        '<p>' + D.ds.map(d => d.t + ' : ' + d.cs + ' c.s.').join(' ; ') + ' → ' + D.cs + ' chiffres significatifs.</p>' + calc(D.f[0] + ' = ' + c((niv === 3 || Math.abs(N.decompose(v).n) > 4 ? N.sci(v, D.cs) : N.txtCS(v, D.cs)) + '&nbsp;' + D.f[3])),
        ['Compte les chiffres significatifs des données ; garde le plus petit nombre : ' + D.cs + '.', 'Arrondis l’affichage ' + ecran + ' à ' + D.cs + ' chiffres significatifs.']);
    } });

  /* -------------------- PRÉFIXES -------------------- */
  const PR_N = { 1: ['k', 'm', 'c'], 2: ['M', 'µ', 'd', 'h', 'G'], 3: ['n', 'T', 'da', 'p', 'µ', 'G'] };
  ajouter({ id: 'PR1', famille: 'PR', niveau: 1, prerequis: [], titre: 'Du préfixe à la puissance de 10',
    regle: 'Chaque préfixe est une puissance de 10 : T = 10<sup>12</sup>, G = 10<sup>9</sup>, M = 10<sup>6</sup>, k = 10<sup>3</sup>, h = 10<sup>2</sup>, da = 10<sup>1</sup>, d = 10<sup>−1</sup>, c = 10<sup>−2</sup>, m = 10<sup>−3</sup>, µ = 10<sup>−6</sup>, n = 10<sup>−9</sup>, p = 10<sup>−12</sup>.',
    methode: 'Les principaux vont <b>de 3 en 3</b> : T G M k (12, 9, 6, 3) puis m µ n p (−3, −6, −9, −12). Les grands : pense aux fichiers (ko, Mo, Go, To). Les petits : « <b>M</b>on <b>M</b>icro <b>N</b>’a <b>P</b>as froid » (milli, micro, nano, pico). Centi : le centime (1/100 d’euro). Déci : les décimales (1/10). Déca : le décathlon (10 épreuves). Hecto : 10<sup>2</sup> (h comme <b>h</b>ecto = cent).',
    exemple: calc('1&nbsp;km = 10<sup>3</sup>&nbsp;m = 1&nbsp;000&nbsp;m') + calc('1&nbsp;µs = 10<sup>−6</sup>&nbsp;s') + calc('1&nbsp;GHz = 10<sup>9</sup>&nbsp;Hz'),
    piege: 'M (méga, 10<sup>6</sup>) et m (milli, 10<sup>−3</sup>) : la majuscule compte !',
    gen(niv) {
      const q = PR(hasard(PR_N[niv]));
      const u = hasard(['m', 's', 'g', 'W', 'Hz', 'A', 'J']);
      const parts = [partiePref(q)];
      return question('PR1', niv, 'PR1:' + q.s, 'Donne la puissance de 10 du préfixe' + (niv > 1 ? ' (par exemple 1&nbsp;' + q.s + u + ' = ? ' + u + ')' : '') + '.', parts,
        calc(q.nom + ' : ' + q.s + ' = ' + c(p10(q.e))) + calc('1&nbsp;' + q.s + u + ' = ' + p10(q.e) + '&nbsp;' + u),
        [q.e > 0 ? 'C’est un préfixe des grandes valeurs : exposant positif.' : 'C’est un préfixe des petites valeurs : exposant négatif.', Math.abs(q.e) % 3 === 0 ? 'Les principaux préfixes vont de 3 en 3.' : 'Pense à la vie courante : centime, décimale, décathlon, hectare.']);
    } });

  ajouter({ id: 'PR2', famille: 'PR', niveau: 2, prerequis: ['PR1'], titre: 'De la puissance de 10 au préfixe',
    regle: 'À chaque puissance de 10 du tableau correspond un préfixe : 10<sup>3</sup> → k (kilo), 10<sup>−6</sup> → µ (micro)… Attention à la casse : M (méga) n’est pas m (milli).',
    methode: 'Le signe de l’exposant dit si c’est un grand (positif) ou un petit (négatif) préfixe ; sa valeur te place dans la chaîne de 3 en 3 : k M G T ou m µ n p.',
    exemple: '<p>10<sup>6</sup> → <b>M</b> (méga) · 10<sup>−9</sup> → <b>n</b> (nano) · 10<sup>−2</sup> → <b>c</b> (centi)</p>',
    piege: '10<sup>−3</sup>, c’est m (milli), pas µ (micro, 10<sup>−6</sup>).',
    gen(niv) {
      const q = PR(hasard(PR_N[niv].concat(niv === 1 ? ['k'] : [])));
      const opp = AVEC.find(x => x.e === -q.e);
      const cands = [...new Set([q, opp, PR(CONFUS[q.s]), ...melanger(AVEC)].filter(Boolean))].slice(0, 4);
      const ind = {};
      cands.forEach(x => { if (x !== q) ind[x.s] = '<b>' + x.s + '</b> (' + x.nom + ') vaut ' + p10(x.e) + '.' + (x === opp ? ' Attention au signe de l’exposant.' : ''); });
      const parNom = niv > 1 && Math.random() < 0.4;
      return question('PR2', niv, 'PR2:' + q.s + parNom, parNom ? 'Retrouve le symbole du préfixe.' : 'Retrouve le préfixe.', [
        choixP(parNom ? 'Quel est le symbole du préfixe <b>' + q.nom + '</b> (' + p10(q.e) + ') ?' : 'Quel préfixe correspond à <b>' + p10(q.e) + '</b> ?', melanger(cands).map(x => ({ id: x.s, label: '<b>' + x.s + '</b>' + (parNom ? '' : ' (' + x.nom + ')') })), q.s, ind)],
        calc(p10(q.e) + ' → ' + c('<b>' + q.s + '</b> (' + q.nom + ')')),
        [q.e > 0 ? 'Exposant positif : un préfixe des grandes valeurs (k, M, G, T…).' : 'Exposant négatif : un préfixe des petites valeurs (m, µ, n, p…).', 'Les principaux préfixes vont de 3 en 3.']);
    } });

  CN.C0 = { liste, ajouter, familles, THEMES, PREF, PR, AVEC, CONFUS, dit, U, UL, UC, valConv, resultat, diagConv, partieConv, partieExp, partiePref, solConv, sens,
    COEF1, COEF2, COEF3, nbP, expP, choixP, question, calc, c, fix, par, P10, lg, entierPres, sup };
})();
