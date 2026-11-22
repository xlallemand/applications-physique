/* ============================================================
   Calcul numérique — infographies des notions (objet CN.I)
   ------------------------------------------------------------
   Petits schémas en HTML ou SVG, rendus dans les notions de la Découverte,
   les fiches et les rappels (champ « schema » des compétences) :
     CN.I.etapes(liste)            méthode en étapes numérotées, bien séparées
     CN.I.exemples(liste)          exemples séparés les uns des autres
     CN.I.zeros(n)                 10ⁿ ou 10⁻ⁿ : les zéros comptés un par un
     CN.I.sauts(t, n, legende)     la virgule de t saute de n rangs (n > 0 : vers la droite)
     CN.I.chiffresCS(t)            chiffres significatifs comptés, zéros de gauche barrés
     CN.I.arrondi(t, n)            chiffres gardés, chiffre suivant entouré
     CN.I.fleches(a, b, aller, retour, legende)  deux unités et les facteurs dans les deux sens
                                   (aller, retour : facteur, ou [calcul, facteur])
     CN.I.echellePref()            les préfixes : les grands et les petits
     CN.I.memoPref()               cartes pour retenir les préfixes
     CN.I.carre() / CN.I.cube()    1 m² = 10⁴ cm², 1 m³ = 10⁶ cm³
     CN.I.relationsL()             les trois égalités des volumes (1 m³ = 1 000 L d'abord)
     CN.I.fraction(num, den, nNum, nDen)  unité composée : effet du numérateur et du dénominateur
     CN.I.marche()                 repère de la marche (1 m/s ≈ 4 km/h)
     CN.I.verdicts(liste)          exemples ✓ / ✗, un par ligne
   Les couleurs viennent des variables de assets/theme.css (classes de cn.css).
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN = window.CN || {};
  const N = CN.N, p10 = N.p10, NB = ' ';

  /* ---------- Méthode en étapes, exemples séparés ---------- */
  const etapes = l => '<ol class="cn-etapes">' + l.map(x => '<li>' + x + '</li>').join('') + '</ol>';
  const exemples = l => '<div class="cn-exs">' + l.map(x => '<div class="cn-ex">' + x + '</div>').join('') + '</div>';
  const verdicts = l => '<ul class="cn-verdicts">' + l.map(([t, ok, pourquoi]) => '<li class="' + (ok ? 'ok' : 'ko') + '"><span class="cn-v-ic" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span><span>' + t + (pourquoi ? ' <small>' + pourquoi + '</small>' : '') + '</span></li>').join('') + '</ul>';

  /* ---------- 10ⁿ : les zéros comptés ---------- */
  const caseC = (t, n, cls) => '<span class="cn-case' + (cls ? ' ' + cls : '') + '"><b>' + t + '</b>' + (n ? '<small>' + n + '</small>' : '<small>&nbsp;</small>') + '</span>';
  function zeros(n) {
    let h = '', leg;
    if (n >= 0) {
      h = caseC('1', '', 'un');
      for (let i = 1; i <= n; i++) h += caseC('0', i, 'z');
      leg = p10(n) + ' : un 1 suivi de <b>' + n + ' zéro' + (n > 1 ? 's' : '') + '</b>';
    } else {
      // n zéros en comptant celui avant la virgule, puis le 1
      h = caseC('0', 1, 'z') + '<span class="cn-case cn-case-v"><b>,</b><small>&nbsp;</small></span>';
      for (let i = 2; i <= -n; i++) h += caseC('0', i, 'z');
      h += caseC('1', '', 'un');
      leg = p10(n) + ' : <b>' + (-n) + ' zéro' + (-n > 1 ? 's' : '') + '</b> (en comptant celui avant la virgule), puis le 1';
    }
    return '<figure class="cn-fig"><div class="cn-cases" role="img" aria-label="' + N.nb(Math.pow(10, n)) + '">' + h + '</div><figcaption>' + leg + ' : ' + p10(n) + ' = ' + N.nb(Math.pow(10, n)) + '</figcaption></figure>';
  }

  /* ---------- La virgule qui saute ---------- */
  // t : nombre écrit (« 3,45 », « 45000 ») ; n : rangs (n > 0 vers la droite, n < 0 vers la gauche)
  function sauts(t, n, legende) {
    const [i, f] = t.replace(/\s/g, '').split(',');
    let ch = i + (f || ''), c0 = i.length, c1 = c0 + n;
    const g = c1 < 1 ? 1 - c1 : 0, d = c1 > ch.length ? c1 - ch.length : 0;
    const cases = '0'.repeat(g).split('').filter(Boolean).map(x => [x, 'aj']).concat(ch.split('').map(x => [x, ''])).concat('0'.repeat(d).split('').filter(Boolean).map(x => [x, 'aj']));
    c0 += g; c1 += g;
    const W = 24, X = 14, H = 76, L = cases.length * W + 2 * X;
    const x = k => X + k * W;
    let s = '';
    cases.forEach(([c, cl], k) => { s += '<text x="' + (x(k) + W / 2) + '" y="62" class="cn-sv-ch' + (cl ? ' cn-sv-aj' : '') + '">' + c + '</text>'; });
    // ancienne virgule (grise), nouvelle virgule (couleur), sauf à la fin d'un entier
    if (c0 < cases.length) s += '<text x="' + x(c0) + '" y="66" class="cn-sv-v0">,</text>';
    if (c1 < cases.length) s += '<text x="' + x(c1) + '" y="66" class="cn-sv-v1">,</text>';
    const sg = Math.sign(n);
    for (let j = 0; j < Math.abs(n); j++) {
      const a = x(c0 + sg * j), b = x(c0 + sg * (j + 1)), m = (a + b) / 2;
      s += '<path d="M' + a + ' 42 Q' + m + ' 20 ' + b + ' 42" class="cn-sv-arc"/>';
      s += '<text x="' + m + '" y="17" class="cn-sv-n">' + (j + 1) + '</text>';
      if (j === Math.abs(n) - 1) {
        // pointe dans le prolongement de l'arc : direction de la tangente en bout de courbe (point de contrôle → extrémité)
        const dx = b - m, dy = 42 - 20, l = Math.hypot(dx, dy), ux = dx / l, uy = dy / l, L0 = 8, l0 = 4;
        const bx = b - L0 * ux, by = 42 - L0 * uy;
        s += '<path d="M' + b + ' 42 L' + (bx - l0 * uy).toFixed(2) + ' ' + (by + l0 * ux).toFixed(2) + ' L' + (bx + l0 * uy).toFixed(2) + ' ' + (by - l0 * ux).toFixed(2) + ' Z" class="cn-sv-pt"/>';
      }
    }
    const dit = 'La virgule se déplace de ' + Math.abs(n) + ' rang' + (Math.abs(n) > 1 ? 's' : '') + ' vers la ' + (n > 0 ? 'droite' : 'gauche');
    return '<figure class="cn-fig"><svg class="cn-svg" viewBox="0 0 ' + L + ' ' + H + '" width="' + L + '" height="' + H + '" role="img" aria-label="' + dit + '">' + s + '</svg>' +
      '<figcaption>' + (legende || dit) + (g || d ? ' <span class="cn-aj">0</span> : zéro ajouté.' : '') + '</figcaption></figure>';
  }

  /* ---------- Chiffres significatifs ---------- */
  function chiffresCS(t) {
    const s = t.replace(/\s/g, '');
    let h = '', k = 0, debut = false;
    for (const c of s) {
      if (c === ',') { h += '<span class="cn-case cn-case-v"><b>,</b><small>&nbsp;</small></span>'; continue; }
      if (!debut && c === '0') { h += caseC('0', '', 'barre'); continue; }
      debut = true; k++;
      h += caseC(c, k, 'cs');
    }
    return '<figure class="cn-fig"><div class="cn-cases" role="img" aria-label="' + t + ' : ' + k + ' chiffres significatifs">' + h + '</div><figcaption><span class="cn-barre">0</span> zéros de gauche : ne comptent pas · ' + k + ' chiffre' + (k > 1 ? 's' : '') + ' significatif' + (k > 1 ? 's' : '') + '</figcaption></figure>';
  }
  // t arrondi à n chiffres significatifs : les n gardés, le suivant entouré
  function arrondi(t, n, res) {
    const s = t.replace(/\s/g, '');
    let h = '', k = 0, debut = false, suiv = null;
    for (const c of s) {
      if (c === ',') { h += '<span class="cn-case cn-case-v"><b>,</b><small>&nbsp;</small></span>'; continue; }
      if (!debut && c === '0') { h += caseC('0', '', 'gris'); continue; }
      debut = true; k++;
      if (k === n + 1) suiv = +c;
      h += k <= n ? caseC(c, k, 'cs') : k === n + 1 ? caseC(c, '?', 'suiv') : caseC(c, '', 'gris');
    }
    // le chiffre suivant décide : 5 ou plus, le dernier chiffre gardé augmente ; sinon il reste
    const dit = suiv >= 5 ? suiv + ' ≥ 5 : on augmente de 1 le dernier chiffre gardé' : suiv + ' &lt; 5 : on garde le dernier chiffre tel quel';
    return '<figure class="cn-fig"><div class="cn-cases" role="img" aria-label="' + t + ' arrondi à ' + n + ' chiffres significatifs : ' + res + '">' + h + '</div><figcaption>On garde ' + n + ' chiffres ; le <span class="cn-suiv">suivant</span> vaut ' + dit + ' → <b>' + res + '</b></figcaption></figure>';
  }

  /* ---------- Deux unités, un facteur dans chaque sens ---------- */
  // une flèche : libellé au-dessus, trait et pointe sur la même ligne (pointe centrée sur le trait)
  const POINTE = '<svg class="cn-fl2-pt" viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M0 0 L10 5 L0 10 Z"/></svg>';
  const fleche = (cls, txt) => '<span class="' + cls + '"><span class="cn-fl2-t">' + txt + '</span><span class="cn-fl2-trait"><i></i>' + POINTE + '</span></span>';
  // aller, retour : texte du facteur, ou [calcul, facteur] (le calcul s'écrit au-dessus du facteur)
  const libelle = x => Array.isArray(x) ? '<small>' + x[0] + '</small>' + x[1] : x;
  function fleches(a, b, aller, retour, legende) {
    return '<figure class="cn-fig"><div class="cn-fl2" role="img" aria-label="De ' + CN_txt(a) + ' à ' + CN_txt(b) + ' : ' + CN_txt(libelle(aller)) + ' ; de ' + CN_txt(b) + ' à ' + CN_txt(a) + ' : ' + CN_txt(libelle(retour)) + '">' +
      '<span class="cn-fl2-u">' + a + '</span><span class="cn-fl2-m">' + fleche('cn-fl2-h', libelle(aller)) + fleche('cn-fl2-b', libelle(retour)) + '</span><span class="cn-fl2-u">' + b + '</span></div>' +
      (legende ? '<figcaption>' + legende + '</figcaption>' : '') + '</figure>';
  }
  const CN_txt = h => String(h).replace(/<sup>/g, ' puissance ').replace(/<[^>]+>/g, '').replace(/"/g, '');

  /* ---------- Les préfixes ---------- */
  // tous les préfixes affichés (femto en plus : il n'est pas dans les questions)
  const GRANDS = [['T', 'téra', 12], ['G', 'giga', 9], ['M', 'méga', 6], ['k', 'kilo', 3], ['h', 'hecto', 2], ['da', 'déca', 1]];
  const PETITS = [['d', 'déci', -1], ['c', 'centi', -2], ['m', 'milli', -3], ['µ', 'micro', -6], ['n', 'nano', -9], ['p', 'pico', -12], ['f', 'femto', -15]];
  const rangP = ([s, nom, e]) => '<li class="' + (Math.abs(e) % 3 === 0 ? 'cn-p3' : 'cn-p1') + '"><b class="cn-p-s">' + s + '</b><span class="cn-p-n">' + nom + '</span><span class="cn-p-e">' + p10(e) + '</span></li>';
  function echellePref() {
    return '<figure class="cn-fig cn-fig-large"><div class="cn-echelle">' +
      '<div class="cn-ech-col cn-ech-g"><p class="cn-ech-t">Les grands <small>exposant positif</small></p><ul>' + GRANDS.map(rangP).join('') + '</ul></div>' +
      '<div class="cn-ech-u"><b>unité</b> ' + p10(0) + ' = 1<small>m, g, s, A, W, L…</small></div>' +
      '<div class="cn-ech-col cn-ech-p"><p class="cn-ech-t">Les petits <small>exposant négatif</small></p><ul>' + PETITS.map(rangP).join('') + '</ul></div>' +
      '</div><figcaption>En gras : les préfixes qui vont de 3 en 3, les plus utilisés en physique.</figcaption></figure>';
  }
  function memoPref() {
    const mot = (m, pre, e) => '<span class="cn-mot"><b><span class="cn-ini">' + m.charAt(0) + '</span>' + m.slice(1) + '</b><small>' + pre + '</small><small>' + p10(e) + '</small></span>';
    const carte = (ic, titre, corps) => '<div class="cn-memo"><p class="cn-memo-t"><span aria-hidden="true">' + ic + '</span> ' + titre + '</p>' + corps + '</div>';
    return '<div class="cn-memos">' +
      carte('3️⃣', 'De 3 en 3', '<p class="cn-memo-l"><span class="cn-nw"><b>k</b> 10<sup>3</sup></span> → <span class="cn-nw"><b>M</b> 10<sup>6</sup></span> → <span class="cn-nw"><b>G</b> 10<sup>9</sup></span> → <span class="cn-nw"><b>T</b> 10<sup>12</sup></span></p><p class="cn-memo-l"><span class="cn-nw"><b>m</b> 10<sup>−3</sup></span> → <span class="cn-nw"><b>µ</b> 10<sup>−6</sup></span> → <span class="cn-nw"><b>n</b> 10<sup>−9</sup></span> → <span class="cn-nw"><b>p</b> 10<sup>−12</sup></span> → <span class="cn-nw"><b>f</b> 10<sup>−15</sup></span></p>') +
      carte('💾', 'Les grands : les fichiers', '<ul class="cn-memo-li"><li>un texte : quelques <b>k</b>o <span>10<sup>3</sup></span></li><li>une photo : quelques <b>M</b>o <span>10<sup>6</sup></span></li><li>un film : quelques <b>G</b>o <span>10<sup>9</sup></span></li><li>un disque dur : quelques <b>T</b>o <span>10<sup>12</sup></span></li></ul>') +
      carte('🎤', 'Les petits : « Mon Micro N’a Pas Froid »', '<div class="cn-mots">' + mot('Mon', 'milli', -3) + mot('Micro', 'micro', -6) + mot('N’a', 'nano', -9) + mot('Pas', 'pico', -12) + mot('Froid', 'femto', -15) + '</div>') +
      carte('🪙', 'Centi et déci : la vie courante', '<ul class="cn-memo-li"><li>un <b>c</b>entime = 1/100 d’euro : <span>c = 10<sup>−2</sup></span></li><li>un <b>d</b>ixième (la 1<sup>re</sup> décimale) : <span>d = 10<sup>−1</sup></span></li></ul>') +
      carte('🏅', 'Déca et hecto : 10 et 100', '<ul class="cn-memo-li"><li>un <b>déca</b>thlon : 10 épreuves : <span>da = 10<sup>1</sup></span></li><li>un <b>h</b>ectare : 100 ares : <span>h = 10<sup>2</sup></span></li></ul>') +
      '</div>';
  }
  // tableau des préfixes (femto compris)
  const tablePref = () => '<div class="crs-defile"><table class="cn-tab"><thead><tr><th>Préfixe</th><th>Symbole</th><th>Puissance</th></tr></thead><tbody>' +
    GRANDS.concat(PETITS).map(([s, nom, e]) => '<tr' + (Math.abs(e) % 3 === 0 ? ' class="cn-p3"' : '') + '><td>' + nom + '</td><td><b>' + s + '</b></td><td>' + p10(e) + '</td></tr>').join('') + '</tbody></table></div>';

  /* ---------- Carré et cube ---------- */
  function carre() {
    let g = '';
    for (let i = 1; i < 10; i++) g += '<line x1="' + (20 + i * 10) + '" y1="20" x2="' + (20 + i * 10) + '" y2="120" class="cn-sv-gr"/><line x1="20" y1="' + (20 + i * 10) + '" x2="120" y2="' + (20 + i * 10) + '" class="cn-sv-gr"/>';
    return '<figure class="cn-fig"><div class="cn-fig-r"><svg class="cn-svg" viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="Un carré de 1 m de côté">' +
      '<rect x="20" y="20" width="100" height="100" class="cn-sv-fond"/>' + g + '<rect x="20" y="20" width="10" height="10" class="cn-sv-petit"/><rect x="20" y="20" width="100" height="100" class="cn-sv-bord"/>' +
      '<text x="70" y="137" class="cn-sv-l">1 m = 10² cm</text><text x="12" y="70" class="cn-sv-l" transform="rotate(-90 12 70)">1 m = 10² cm</text></svg>' +
      '<p class="cn-fig-t">1 m² = 1 m × 1 m<br>= 10<sup>2</sup> cm × 10<sup>2</sup> cm<br>= <b>10<sup>4</sup> cm²</b></p></div>' +
      '<figcaption>Le grand carré contient 10<sup>2</sup> × 10<sup>2</sup> = 10<sup>4</sup> carrés de 1 cm² (schéma simplifié) : l’exposant des longueurs est multiplié par 2.</figcaption></figure>';
  }
  function cube() {
    return '<figure class="cn-fig"><div class="cn-fig-r"><svg class="cn-svg" viewBox="0 0 150 140" width="150" height="140" role="img" aria-label="Un cube de 1 m d’arête">' +
      '<path d="M20 50 L90 50 L90 120 L20 120 Z" class="cn-sv-fond"/><path d="M20 50 L50 25 L120 25 L90 50 Z" class="cn-sv-fond2"/><path d="M90 50 L120 25 L120 95 L90 120 Z" class="cn-sv-fond3"/>' +
      '<path d="M20 50 L90 50 L90 120 L20 120 Z M20 50 L50 25 L120 25 L90 50 M90 120 L120 95 L120 25" class="cn-sv-bord"/>' +
      '<text x="55" y="136" class="cn-sv-l">1 m = 10² cm</text></svg>' +
      '<p class="cn-fig-t">1 m³ = 1 m × 1 m × 1 m<br>= (10<sup>2</sup> cm)<sup>3</sup><br>= <b>10<sup>6</sup> cm³</b></p></div>' +
      '<figcaption>Trois longueurs : l’exposant des longueurs est multiplié par 3.</figcaption></figure>';
  }

  /* ---------- Volumes : litres et m³ ---------- */
  function relationsL() {
    return '<div class="cn-rel">' +
      '<div class="cn-rel-c cn-rel-1"><b>1 m³ = 1' + NB + '000 L</b><small>soit 10<sup>3</sup> L</small></div>' +
      '<div class="cn-rel-c"><b>1 L = 1 dm³</b><small>un cube de 10 cm de côté</small></div>' +
      '<div class="cn-rel-c"><b>1 mL = 1 cm³</b><small>un cube de 1 cm de côté</small></div>' +
      '</div>';
  }

  /* ---------- Unité composée : numérateur et dénominateur ---------- */
  function fraction(num, den, nNum, nDen) {
    return '<figure class="cn-fig"><div class="cn-frac-r"><span class="cn-frac"><span class="cn-frac-n">' + num + '</span><span class="cn-frac-d">' + den + '</span></span>' +
      '<span class="cn-frac-notes"><span class="cn-frac-nn">' + nNum + '</span><span class="cn-frac-nd">' + nDen + '</span></span></div></figure>';
  }

  /* ---------- Le repère de la marche ---------- */
  function marche() {
    return '<figure class="cn-fig"><div class="cn-marche"><span class="cn-marche-ic" aria-hidden="true">🚶</span>' +
      '<span class="cn-marche-c"><b>1 m</b> en <b>1 s</b><small>≈ 1 m/s</small></span><span class="cn-marche-eg" aria-hidden="true">≈</span>' +
      '<span class="cn-marche-c"><b>4 km</b> en <b>1 h</b><small>≈ 4 km/h</small></span></div>' +
      '<figcaption>Pour la même vitesse, la valeur en km/h est la plus <b>grande</b>.</figcaption></figure>';
  }

  CN.I = { etapes, exemples, verdicts, zeros, sauts, chiffresCS, arrondi, fleches, echellePref, memoPref, tablePref, carre, cube, relationsL, fraction, marche, GRANDS, PETITS };
})();
