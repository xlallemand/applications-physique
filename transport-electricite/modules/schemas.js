/* ============================================================
   Schémas électriques de l'application « Transport et distribution
   de l'électricité » (HTML + CSS, voir te.css, section SCHÉMAS)

   Une chaîne de distribution se lit de gauche à droite :
     étage (deux fils, tension u, intensité i) — transformateur —
     étage — transformateur — étage — charge — puissance utile
   Sur un écran étroit, le schéma se met à la verticale (requête de
   conteneur dans te.css) : il se lit alors de haut en bas.

     SCH.chaine(o)       schéma complet (voir le format ci-dessous)
     SCH.l(nom, h)       ligne « nom = contenu » d'un étage
     SCH.v(txt)          valeur placée sur le schéma
     SCH.inc()           grandeur inconnue (« ? »)
     SCH.slot(id)        case vide où glisser une étiquette (partie 'schema' de te.js)
     SCH.transfo1(val)   transformateur seul, avec ses valeurs (voir plus bas)
     SCH.reseau(val)     chaîne complète : production, transport, distribution, charge
     SCH.tableau()       tableau électrique d'un logement (SVG)

   o = {
     etages:   [{ titre, u, i, lignes: [HTML], bas: [HTML] }],
     transfos: [{ nom, n: [gauche, droite], lignes: [HTML] }],   (un de moins que d'étages)
     charge:   { nom, lignes: [HTML] }                           (au bout du dernier étage)
     sortie:   { lignes: [HTML], pertes: [HTML] }                (puissance utile, pertes)
   }
   ============================================================ */
(function () {
  'use strict';

  const l = (nom, h) => `<div class="sc-ligne"><span class="sc-nom">${nom}</span>${h}</div>`;
  const v = txt => `<span class="sc-val">${txt}</span>`;
  const inc = () => '<span class="sc-val inconnue">?</span>';
  const slot = id => `<span class="sc-slot" data-slot="${id}"><span class="sc-slot-ph">?</span></span>`;

  // symbole du transformateur : fils qui convergent vers deux cercles entrelacés
  // (deux tracés : horizontal sur ordinateur, vertical sur un écran étroit)
  const FILS = '<svg class="sch-fils-tr" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">' +
    '<path class="h" d="M0,0.8 L38,50 L0,99.2 M100,0.8 L62,50 L100,99.2"/>' +
    '<path class="v" d="M0.8,0 L50,36 L99.2,0 M0.8,100 L50,64 L99.2,100"/></svg>';
  const CERCLES = '<svg class="sch-cercles" viewBox="0 0 64 40" aria-hidden="true">' +
    '<circle cx="23" cy="20" r="15" class="fond"/><circle cx="41" cy="20" r="15" class="fond"/>' +
    '<circle cx="23" cy="20" r="15"/><circle cx="41" cy="20" r="15"/></svg>';

  function etage(e, dernier, charge) {
    return `<div class="sch-col sch-et${dernier && charge ? ' avec-charge' : ''}">
      <div class="sch-circ">
        ${e.titre ? `<p class="sch-titre">${e.titre}</p>` : ''}
        ${e.u ? `<span class="sch-u" aria-hidden="true"><i></i><b>${e.u}</b></span>` : ''}
        ${e.i ? `<span class="sch-i" aria-hidden="true"><i></i><b>${e.i}</b></span>` : ''}
        <div class="sch-lignes">${(e.lignes || []).join('')}</div>
      </div>
      ${e.bas ? `<div class="sch-bas">${e.bas.join('')}</div>` : ''}
    </div>`;
  }
  function transfo(t) {
    const bas = (t.n ? `<div class="sch-nn"><span>${t.n[0]}</span><span>${t.n[1]}</span></div>` : '') + (t.lignes || []).join('');
    return `<div class="sch-col sch-tr">
      <div class="sch-circ">${FILS}${CERCLES}
        ${t.nom ? `<p class="sch-titre">${t.nom}</p>` : ''}
      </div>
      ${bas ? `<div class="sch-bas">${bas}</div>` : ''}
    </div>`;
  }
  function charge(c) {
    return `<div class="sch-col sch-ch">
      <div class="sch-circ"><span class="sch-boite">${c.nom || 'charge'}</span></div>
      ${c.lignes ? `<div class="sch-bas">${c.lignes.join('')}</div>` : ''}
    </div>`;
  }
  function sortie(s) {
    return `<div class="sch-col sch-so">
      <div class="sch-circ"><span class="sch-fleche" aria-hidden="true"></span><div class="sch-so-lignes">${(s.lignes || []).join('')}</div>
        ${s.pertes ? `<span class="sch-fleche-p" aria-hidden="true"></span><div class="sch-pe-lignes">${s.pertes.join('')}</div>` : ''}</div>
    </div>`;
  }

  // largeur (px) nécessaire pour dessiner le schéma en ligne ; en dessous, il passe à la verticale
  const largeurMin = o => o.etages.length * 150 + (o.etages.length - 1) * 64 + (o.charge ? 100 : 0) + (o.sortie ? 150 : 0) + 20;
  // hauteur des fils : assez pour les lignes de l'étage le plus chargé
  const hauteur = o => Math.max(120, Math.max(...o.etages.map(e => (e.lignes || []).length)) * 46 + 22);

  function chaine(o) {
    let h = '';
    o.etages.forEach((e, k) => {
      h += etage(e, k === o.etages.length - 1, !!o.charge);
      if (k < o.etages.length - 1) h += transfo((o.transfos || [])[k] || {});
    });
    if (o.charge) h += charge(o.charge);
    if (o.sortie) h += sortie(o.sortie);
    const min = largeurMin(o);
    return `<div class="sch-cont"><div class="sch${o.classe ? ' ' + o.classe : ''}" data-min="${min}" style="--h:${hauteur(o)}px;max-width:${Math.round(min * 1.3)}px" role="${/sc-slot/.test(h) ? 'group' : 'img'}" aria-label="${o.aria || 'Schéma de la chaîne électrique'}">${h}</div></div>`;
  }

  /* ---------- En ligne ou à la verticale, selon la place disponible ----------
     Les schémas sont insérés à tout moment (cours par étapes, questions) :
     on surveille la page et on observe la largeur de chaque nouveau schéma. */
  const ajuster = c => { const s = c.firstElementChild; if (s) s.classList.toggle('vert', c.clientWidth < +s.dataset.min); };
  const tailles = typeof ResizeObserver === 'function' ? new ResizeObserver(l => l.forEach(e => ajuster(e.target))) : null;
  function surveiller(racine) {
    (racine.querySelectorAll ? racine.querySelectorAll('.sch-cont') : []).forEach(c => {
      if (c.dataset.vu) return;
      c.dataset.vu = '1';
      ajuster(c);
      if (tailles) tailles.observe(c);
    });
  }
  function demarrer() {
    surveiller(document);
    new MutationObserver(l => l.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) surveiller(n.classList.contains('sch-cont') ? n.parentElement : n); }))).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) demarrer(); else document.addEventListener('DOMContentLoaded', demarrer);

  /* ============================================================
     SCHÉMAS TOUT FAITS
     Chaque grandeur vaut : une valeur affichée (« 20 kV »), '?' (inconnue),
     '#id' (case vide où glisser une étiquette), ou rien (ligne absente).
     ============================================================ */
  const contenu = x => x === '?' ? inc() : String(x)[0] === '#' ? slot(String(x).slice(1)) : v(x);
  const lignes = (L, val) => L.filter(([, k]) => val[k] !== undefined).map(([nom, k]) => l(nom, contenu(val[k])));
  const sub = (x, i) => `${x}<sub>${i}</sub>`;

  // transformateur seul : val = { U1, I1, P1, N1, U2, I2, P2, N2, m } ; o.titres, o.charge (nom de l'appareil), o.i (flèches d'intensité)
  function transfo1(val, o) {
    o = o || {};
    const t = o.titres || ['primaire (entrée)', 'secondaire (sortie)'];
    const et = k => ({ titre: t[k - 1], u: sub('u', k), i: o.i ? sub('i', k) : '',
      lignes: lignes([[sub('U', k) + ' =', 'U' + k], [sub('I', k) + ' =', 'I' + k], [sub('P', k) + ' =', 'P' + k]], val),
      bas: val['N' + k] !== undefined ? [l(sub('N', k) + ' =', contenu(val['N' + k]))] : undefined });
    return chaine({ etages: [et(1), et(2)], transfos: [{ nom: o.nom || 'T', lignes: lignes([['m =', 'm']], val) }],
      charge: o.charge ? { nom: o.charge, lignes: lignes([['P =', 'P']], val) } : undefined, aria: o.aria || 'Schéma du transformateur avec les valeurs de l\'énoncé' });
  }

  // chaîne complète : production — T1 — transport — T2 — distribution — charge (k, η) — puissance utile
  // val = { U1, I1, m1, U2, I2, m2, U3, I3, S, P, k, eta, Pu, Pp } ; o.charge : nom de la charge
  // o.n = 2 : un seul transformateur (val.m), le 2e étage alimente la charge (U2, I2, S) ; o.titres : nom des étages
  function reseau(val, o) {
    o = o || {};
    const n = o.n || 3, titres = o.titres || (n === 3 ? ['production', 'transport', 'distribution'] : ['réseau', 'utilisation']);
    const et = k => ({ titre: titres[k - 1], u: sub('u', k), lignes: lignes([[sub('U', k) + ' =', 'U' + k], [sub('I', k) + ' =', 'I' + k]].concat(k === n ? [['S =', 'S']] : []), val) });
    const tr = k => n === 2 ? { nom: 'T', lignes: lignes([['m =', 'm']], val) } : { nom: sub('T', k), lignes: lignes([[sub('m', k) + ' =', 'm' + k]], val) };
    const ch = lignes([['P =', 'P'], ['k =', 'k'], ['η =', 'eta']], val);
    const so = lignes([[sub('P', 'u') + ' =', 'Pu']], val), pe = lignes([[sub('P', 'perdue') + ' =', 'Pp']], val);
    return chaine({
      etages: Array.from({ length: n }, (x, k) => et(k + 1)),
      transfos: Array.from({ length: n - 1 }, (x, k) => tr(k + 1)),
      charge: { nom: o.charge || 'charge', lignes: ch },
      sortie: so.length || pe.length ? { lignes: so, pertes: pe.length ? pe : undefined } : undefined,
      aria: o.aria || 'Schéma de la chaîne de distribution avec les valeurs de l\'énoncé',
    });
  }

  /* ============================================================
     TABLEAU ÉLECTRIQUE D'UN LOGEMENT (SVG 640 × 360)
     Deux rangées ; chacune commence par un interrupteur
     différentiel 30 mA (bouton test « T »), suivi des disjoncteurs
     divisionnaires de chaque circuit (calibre et section des fils).
     o.reperes : affiche les légendes « différentiel » et « disjoncteurs »
     ============================================================ */
  function tableau(o) {
    o = o || {};
    const C = { encre: '#16181d', encre2: '#55585f', gris: '#e9e6df', bord: '#bdb6a8', blanc: '#ffffff', accent: '#5a3fc4', fond: '#f3f1ec' };
    const X0 = 34, MW = 63;                                   // début des rangées, largeur d'un module
    let s = `<div class="te-defile"><svg class="sch-tableau" viewBox="0 0 700 ${o.reperes ? 404 : 364}" role="img" aria-label="Tableau électrique : chaque rangée commence par un interrupteur différentiel 30 mA, suivi des disjoncteurs des circuits">`;
    s += `<rect x="8" y="8" width="684" height="348" rx="14" fill="${C.fond}" stroke="${C.bord}" stroke-width="2"/>`;
    // une rangée : différentiel (2 modules) puis disjoncteurs (1 module chacun)
    const rangee = (y, diff, disj) => {
      let r = `<rect x="${X0 - 14}" y="${y + 36}" width="${MW * 10 + 4}" height="10" rx="3" fill="${C.bord}"/>`;
      // interrupteur différentiel
      r += `<rect x="${X0}" y="${y}" width="${MW * 2 - 4}" height="118" rx="6" fill="${C.blanc}" stroke="${C.encre}" stroke-width="1.8"/>`;
      r += `<rect x="${X0 + 10}" y="${y + 42}" width="${MW * 2 - 24}" height="36" rx="4" fill="${C.gris}" stroke="${C.encre}" stroke-width="1.2"/>`;
      r += `<rect x="${X0 + MW - 12}" y="${y + 47}" width="20" height="26" rx="3" fill="${C.encre}"/>`;
      r += `<circle cx="${X0 + MW * 2 - 22}" cy="${y + 22}" r="9" fill="${C.blanc}" stroke="${C.encre}" stroke-width="1.5"/><text x="${X0 + MW * 2 - 22}" y="${y + 26.5}" font-size="12" font-weight="800" text-anchor="middle" fill="${C.encre}">T</text>`;
      r += `<text x="${X0 + 8}" y="${y + 20}" font-size="12" font-weight="800" fill="${C.encre}">${diff[0]}</text>`;
      r += `<text x="${X0 + 8}" y="${y + 104}" font-size="13" font-weight="800" fill="${C.accent}">${diff[1]}</text>`;
      // disjoncteurs divisionnaires
      disj.forEach(([cal, nom, sec], k) => {
        const x = X0 + MW * 2 + k * MW;
        r += `<rect x="${x}" y="${y}" width="${MW - 4}" height="118" rx="6" fill="${C.blanc}" stroke="${C.encre}" stroke-width="1.8"/>`;
        r += `<text x="${x + (MW - 4) / 2}" y="${y + 22}" font-size="14" font-weight="800" text-anchor="middle" fill="${C.encre}">${cal}</text>`;
        r += `<rect x="${x + 10}" y="${y + 44}" width="${MW - 24}" height="32" rx="4" fill="${C.gris}" stroke="${C.encre}" stroke-width="1.2"/>`;
        r += `<rect x="${x + 15}" y="${y + 48}" width="${MW - 34}" height="14" rx="2" fill="${C.encre}"/>`;
        r += `<text x="${x + (MW - 4) / 2}" y="${y + 98}" font-size="11" text-anchor="middle" fill="${C.encre2}">${sec}</text>`;
        r += `<text x="${x + (MW - 4) / 2}" y="${y + 111}" font-size="11" font-weight="700" text-anchor="middle" fill="${C.encre2}">${nom}</text>`;
      });
      return r;
    };
    // 1re rangée : le tableau de l'exercice 16 ; 2e rangée : d'autres circuits du logement
    s += rangee(26, ['30 mA', '40 A'], [['32 A', 'cuisson', '6 mm²'], ['20 A', 'lave-linge', '2,5 mm²'], ['20 A', 'frigo', '2,5 mm²'], ['16 A', 'prise', '2,5 mm²'], ['16 A', 'prise', '2,5 mm²'], ['16 A', 'prise', '2,5 mm²'], ['10 A', 'éclairage', '1,5 mm²'], ['10 A', 'sonnerie', '1,5 mm²']]);
    s += rangee(206, ['30 mA', '40 A'], [['20 A', 'chauffe-eau', '2,5 mm²'], ['20 A', 'four', '2,5 mm²'], ['16 A', 'prise', '2,5 mm²'], ['16 A', 'prise', '2,5 mm²'], ['10 A', 'éclairage', '1,5 mm²']]);
    if (o.reperes) {
      // légendes : le différentiel en tête de rangée, les disjoncteurs à la suite
      s += `<path d="M${X0 + MW - 2},346 V378" stroke="${C.accent}" stroke-width="2"/><circle cx="${X0 + MW - 2}" cy="346" r="4" fill="${C.accent}"/>`;
      s += `<text x="${X0 + MW + 60}" y="396" font-size="14" font-weight="800" text-anchor="middle" fill="${C.accent}">interrupteur différentiel 30 mA</text>`;
      s += `<path d="M${X0 + MW * 2 + 4},368 H${X0 + MW * 10 - 8}" stroke="${C.encre}" stroke-width="2"/><path d="M${X0 + MW * 2 + 4},362 v12 M${X0 + MW * 10 - 8},362 v12" stroke="${C.encre}" stroke-width="2"/>`;
      s += `<text x="${X0 + MW * 6}" y="396" font-size="14" font-weight="800" text-anchor="middle" fill="${C.encre}">disjoncteurs (un par circuit)</text>`;
    }
    return s + '</svg></div>';
  }

  window.SCH = { chaine, transfo1, reseau, l, v, inc, slot, tableau };
})();
