/* ============================================================
   Équations en physique : calculs illustrés des fiches récapitulatives.
   Écriture dans la page :
     <div class="fi-bloc"><div class="fi-calc">
       <div class="fi-l" data-op="÷ t">  <span>membre de gauche</span> <span>membre de droite</span>  </div>
       …
     </div></div>
   Attributs d'une ligne .fi-l :
     data-op    opération faite des deux côtés pour passer à la ligne suivante (deux flèches)
     data-note  remarque écrite sous la ligne
     data-esp   place laissée pour une flèche de déplacement (en em, 1,3 par défaut)
   Dans un membre :
     <span class="fi-fr"><span>numérateur</span><span>dénominateur</span></span>   fraction
     <span class="fi-zero">…</span>                                             ce qui s'annule
     <span class="fi-dep" data-de="a">…</span> … <span data-vers="a" data-pos="bas">…</span>
                                                     terme déplacé : flèche courbe vers sa nouvelle place,
                                                     dans la même ligne (voir tracerArcs)
     <span class="fi-rac">contenu</span>          racine carrée (data-de="a" : son signe se déplace)
   Deux méthodes côte à côte (titres ajoutés ici, les mêmes partout) :
     <div class="fi-duo"><div class="fi-pan" data-t="op">calcul</div><div class="fi-pan" data-t="dep">calcul</div></div>
     data-t : op (même opération des deux côtés) ou dep (raccourci) ; data-titre remplace le titre.
   Les grandeurs (une lettre seule) passent en italique, comme dans l'éditeur.
   Contenu ajouté après le chargement (carte « À retenir » d'un cours) : EPF.monter(élément).
   Racine carrée écrite par un script : EPF.rac(contenu) ; crochets des éditeurs : EPF.crochets(élément).
   ============================================================ */
(function () {
  'use strict';

  // flèche courbe « même opération » (même dessin que dans les pages de méthode)
  const FLECHE = '<svg viewBox="0 0 60 46" aria-hidden="true"><path d="M46,4 Q12,10 16,38" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/><path d="M16,38 L7,26 M16,38 L25,29" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ── racine carrée : crochet à la hauteur du contenu, relié au trait du haut (dessin : fiches.css) ──
  // repère retourné : y = 0 en bas ; le petit trait part de la gauche, le grand monte jusqu'au trait
  const CROCHET = '<line x1="0" y1=".42em" x2="40%" y2="0"/><line x1="40%" y1="0" x2="100%" y2="100%"/>';
  const rac = (contenu, de) => '<span class="sqrt-wrap fi-racine' + (de ? ' fi-rac-dep' : '') + '">' +
    '<svg class="sqrt-hook" aria-hidden="true"' + (de ? ' data-de="' + de + '"' : '') + '>' + CROCHET + '</svg>' +
    '<span class="sqrt-inner">' + contenu + '</span></span>';
  // crochets des éditeurs (balises <svg class="sqrt-hook"> vides)
  function crochets(racine) {
    racine.querySelectorAll('svg.sqrt-hook').forEach(s => { if (!s.firstChild) s.innerHTML = CROCHET; });
  }

  // ── titres des deux méthodes côte à côte, avec leur pictogramme ──
  const PICTO = {
    op: '<svg viewBox="0 0 64 30" aria-hidden="true"><path d="M26,3 Q8,6 10,24 M10,24 L4,17 M10,24 L16,18 M38,3 Q56,6 54,24 M54,24 L60,17 M54,24 L48,18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dep: '<svg viewBox="0 0 64 30" aria-hidden="true"><path d="M6,8 Q30,34 56,10 M56,10 L48,10 M56,10 L55,18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };
  const TITRE = { op: 'Même opération des deux côtés', dep: 'Raccourci : le terme change de côté' };
  function titres(racine) {
    racine.querySelectorAll('.fi-pan[data-t]:not(.fi-pret)').forEach(p => {
      p.classList.add('fi-pret');
      const t = p.dataset.t;
      p.insertAdjacentHTML('afterbegin', '<p class="fi-pan-t">' + (PICTO[t] || '') + '<span>' + (p.dataset.titre || TITRE[t] || '') + '</span></p>');
    });
  }

  // ── grandeurs en italique : une lettre seule ; mots (sin, Ec…), Δ, π, nombres et indices droits ──
  const LETTRES = /\p{L}+/gu;
  function italiques(racine) {
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT, {
      acceptNode: n => n.parentElement.closest('sub, sup, i, .fi-note') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const textes = [];
    while (w.nextNode()) textes.push(w.currentNode);
    textes.forEach(n => {
      const s = n.nodeValue;
      const lettres = [...s.matchAll(LETTRES)].filter(m => m[0].length === 1 && m[0] !== 'Δ' && m[0] !== 'π');
      if (!lettres.length) return;
      const f = document.createDocumentFragment();
      let i = 0;
      lettres.forEach(m => {
        f.appendChild(document.createTextNode(s.slice(i, m.index)));
        const it = document.createElement('i');
        it.textContent = m[0];
        f.appendChild(it);
        i = m.index + 1;
      });
      f.appendChild(document.createTextNode(s.slice(i)));
      n.parentNode.replaceChild(f, n);
    });
  }

  // ── calcul aligné sur le signe = : chaque ligne devient trois cases de la grille ──
  function monter(calc) {
    const lignes = [...calc.querySelectorAll(':scope > .fi-l')];
    let plusLong = 0;
    lignes.forEach((l, k) => {
      const [g, d] = l.children;
      const op = l.dataset.op;
      // flèche de déplacement partant de cette ligne (repérée avant de vider la ligne)
      const fa = l.querySelector('[data-de]'), fb = fa && calc.querySelector('[data-vers="' + fa.dataset.de + '"]');
      const cg = document.createElement('span'), ce = document.createElement('span'), cd = document.createElement('span');
      cg.className = 'fi-g'; ce.className = 'fi-e'; cd.className = 'fi-d';
      if (k === 0) [cg, ce, cd].forEach(c => c.classList.add('fi-l0'));
      while (g.firstChild) cg.appendChild(g.firstChild);
      while (d.firstChild) cd.appendChild(d.firstChild);
      ce.textContent = '=';
      const apres = [cg, ce, cd];
      if (op) {
        // deux flèches sous la ligne, l'opération écrite à l'extérieur
        const lab = '<span class="fi-lab">' + op + '</span>';
        cg.insertAdjacentHTML('beforeend', '<span class="fi-fl g" aria-hidden="true">' + lab + FLECHE + '</span>');
        cd.insertAdjacentHTML('beforeend', '<span class="fi-fl d" aria-hidden="true">' + FLECHE + lab + '</span>');
        plusLong = Math.max(plusLong, op.replace(/<[^>]*>/g, '').length);
      }
      // place pour une flèche de déplacement : au-dessus de la ligne (arrivée en haut) ou au-dessous (arrivée en bas)
      if (fb) {
        calc.classList.add('fi-avec-dep');
        const e = document.createElement('div');
        e.className = 'fi-arc-esp';
        e.style.height = (l.dataset.esp || 1.6) + 'em';
        if (enBas(fb)) apres.push(e); else apres.unshift(e);
      }
      if (l.dataset.note) {
        const n = document.createElement('p');
        n.className = 'fi-note';
        n.innerHTML = l.dataset.note;
        apres.push(n);
      }
      if (op) { const e = document.createElement('div'); e.className = 'fi-esp'; apres.push(e); }
      l.replaceWith(...apres);
    });
    // place pour les flèches et leurs libellés, de chaque côté
    if (plusLong) {
      calc.classList.add('fi-avec');
      calc.style.setProperty('--fi-pad', (2.1 + 0.5 * plusLong).toFixed(2) + 'em');
    }
  }

  // ── flèches de déplacement : dans l'équation de départ, du terme déplacé vers sa nouvelle place ──
  // Le terme déplacé porte data-de="a" (data-lab : texte écrit sur la flèche, par exemple « − v₀ ») ;
  // l'endroit d'arrivée porte data-vers="a" et data-pos :
  //   bas      : en dessous de cet élément (nouveau dénominateur, barre de fraction en pointillés)
  //   cote     : à côté de cet élément, du côté du terme déplacé (valeur par défaut)
  //   droite, gauche : à côté, de ce côté-là
  // Arrivée en bas (pos bas, ou élément dans un dénominateur) : la flèche passe sous l'équation et
  // remonte vers l'arrivée. Sinon (numérateur, ou même ligne) : elle passe au-dessus et redescend.
  const enBas = b => b.dataset.pos === 'bas' || !!b.closest('.fi-fr > span + span');
  const fraction = (e, partie) => { const f = e.closest('.fi-fr > span' + partie); return f ? f.parentElement : null; };
  function tracerArcs() {
    document.querySelectorAll('.fi-calc').forEach(c => {
      c.querySelectorAll('.fi-arc, .fi-arc-lab').forEach(s => { if (s.parentElement === c) s.remove(); });
      if (!c.getClientRects().length) return;
      const em = parseFloat(getComputedStyle(c).fontSize);
      c.querySelectorAll('[data-de]').forEach(a => {
        const b = c.querySelector('[data-vers="' + a.dataset.de + '"]');
        if (!b) return;
        const r = c.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        const X = v => v - r.left, Y = v => v - r.top;
        // ligne de l'équation : ses trois cases (gauche, =, droite)
        const cg = a.closest('.fi-g') || a.closest('.fi-d').previousElementSibling.previousElementSibling;
        const cases = [cg, cg.nextElementSibling, cg.nextElementSibling.nextElementSibling].map(e => e.getBoundingClientRect());
        const haut = Y(Math.min(...cases.map(q => q.top))), bas = Y(Math.max(...cases.map(q => q.bottom)));
        const xa = X(ra.left + ra.width / 2), xb = X(rb.left + rb.width / 2);
        const dir = xb < xa ? -1 : 1;                                   // sens du déplacement
        let pos = b.dataset.pos || 'cote';
        if (pos === 'cote') pos = dir < 0 ? 'droite' : 'gauche';         // côté tourné vers le terme déplacé
        const dessous = enBas(b);
        const k = 1.05 * em;
        let x1, y1, x2, y2, c1, c2, extra = '', debut = '';
        // départ : sur le contour du terme (le contour déborde de 3 px de sa boîte), au-dessus ou au-dessous.
        // S'il est dans l'autre étage d'une fraction, la flèche part du côté du terme opposé à l'arrivée,
        // sort de la fraction par un petit virage, puis la contourne sans la traverser ni croiser le signe =
        const frAutre = dessous ? fraction(a, ':first-child') : fraction(a, ' + span');
        if (frAutre) {
          const rf = frAutre.getBoundingClientRect();
          const x0 = X(dir < 0 ? ra.right + 2 : ra.left - 2), y0 = Y(ra.top + ra.height / 2);
          x1 = X(dir < 0 ? rf.right : rf.left) - dir * 14; y1 = y0 + (dessous ? 12 : -12);
          debut = 'M' + x0 + ',' + y0 + ' Q' + x1 + ',' + y0 + ' ' + x1 + ',' + y1 + ' ';
        } else { x1 = xa; y1 = dessous ? Y(ra.bottom) + 2 : Y(ra.top) - 2; }
        // arrivée à côté : jamais trop près du départ, sinon la flèche n'est qu'une petite boucle
        // (terme qui sort d'une fraction par le côté) ; elle arrive alors plus loin, à mi-hauteur
        const loin = (xc, yc) => {
          if (pos === 'bas' || Math.abs(xc - x1) >= 2.2 * em) return [xc, yc];
          return [x1 + (pos === 'droite' ? 1 : -1) * 2.2 * em, Y(rb.top + rb.height / 2) + (dessous ? .3 : -.3) * em];
        };
        if (dessous) {
          const bas2 = Math.max(bas, Y(rb.bottom) + 8) + k;
          if (pos === 'bas') {
            // nouveau dénominateur : barre en pointillés sous l'élément, la flèche arrive dessous
            const yb = Y(rb.bottom) + 3;
            extra = '<path d="M' + (X(rb.left) - 3) + ',' + yb + ' H' + (X(rb.right) + 3) + '" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"/>';
            x2 = xb; y2 = yb + 5; c2 = [x2, bas2];
          } else {
            [x2, y2] = loin(pos === 'droite' ? X(rb.right) + 2 : X(rb.left) - 2, Y(rb.bottom) - 2);
            c2 = [x2 + (pos === 'droite' ? 8 : -8), bas2];
          }
          c1 = [x1, bas2];
        } else {
          const haut2 = Math.min(haut, Y(rb.top) - 8) - k;
          [x2, y2] = loin(pos === 'droite' ? X(rb.right) + 2 : X(rb.left) - 2, Y(rb.top) + 2);
          c2 = [x2 + (pos === 'droite' ? 8 : -8), haut2];
          c1 = [x1, haut2];
        }
        const d = (debut || 'M' + x1 + ',' + y1 + ' ') + 'C' + c1 + ' ' + c2 + ' ' + x2 + ',' + y2;
        // pointe alignée sur la fin visible de la courbe : direction prise entre la pointe et le point
        // de la courbe situé à une longueur de pointe en arrière (la courbe tourne encore sur ce bout)
        const P = 9;
        const B = t => { const u = 1 - t; return [u*u*u*x1 + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t*t*t*x2, u*u*u*y1 + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t*t*t*y2]; };
        let q = B(0.99);
        for (let t = 0.99; t > 0; t -= 0.01) { q = B(t); if (Math.hypot(x2 - q[0], y2 - q[1]) >= P) break; }
        const ang = Math.atan2(y2 - q[1], x2 - q[0]);
        const p1 = [x2 - P * Math.cos(ang - 0.5), y2 - P * Math.sin(ang - 0.5)], p2 = [x2 - P * Math.cos(ang + 0.5), y2 - P * Math.sin(ang + 0.5)];
        const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sv.setAttribute('class', 'fi-arc');
        sv.setAttribute('width', r.width); sv.setAttribute('height', r.height); sv.setAttribute('aria-hidden', 'true');
        sv.innerHTML = extra + '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M' + p1 + ' L' + x2 + ',' + y2 + ' L' + p2 + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        c.appendChild(sv);
        // texte écrit sur la flèche (changement de signe) : au sommet de la courbe
        if (a.dataset.lab) {
          const l = document.createElement('span');
          l.className = 'fi-arc-lab' + (dessous ? ' dessous' : '');
          l.innerHTML = a.dataset.lab;
          // milieu de la courbe de Bézier
          l.style.left = ((x1 + 3 * c1[0] + 3 * c2[0] + x2) / 8) + 'px';
          l.style.top = ((y1 + 3 * c1[1] + 3 * c2[1] + y2) / 8) + 'px';
          c.appendChild(l);
        }
      });
    });
  }

  // ── mise en forme des calculs d'une partie de la page (fiche, ou carte « À retenir » d'un cours) ──
  // les flèches de déplacement sont retracées dès que la taille d'un calcul change (affichage, polices, écran)
  let attente = 0;
  const retracer = () => { cancelAnimationFrame(attente); attente = requestAnimationFrame(tracerArcs); };
  const surveille = typeof ResizeObserver === 'function' ? new ResizeObserver(retracer) : null;
  function monterTout(racine) {
    racine = racine || document;
    racine.querySelectorAll('.fi-rac').forEach(r => { r.outerHTML = rac(r.innerHTML, r.dataset.de); });
    titres(racine);
    racine.querySelectorAll('.fi-calc:not(.fi-pret)').forEach(c => {
      monter(c);
      c.classList.add('fi-pret');
      if (surveille) surveille.observe(c);
    });
    racine.querySelectorAll('.fi-calc, .fi-m, .som-fiche .som-formule').forEach(italiques);
    retracer();
  }
  // ── écriture des schémas depuis un script (cours) : mêmes balises que dans les fiches ──
  //   ligne(gauche, droite, { op, note, esp }), calc(lignes…), pan('op' | 'dep', contenu, titre), duo(panneaux…)
  const attr = (o, n) => o && o[n] != null ? ' data-' + n + '="' + o[n] + '"' : '';
  const ligne = (g, d, o) => '<div class="fi-l"' + attr(o, 'op') + attr(o, 'note') + attr(o, 'esp') + '><span>' + g + '</span><span>' + d + '</span></div>';
  const calc = (...l) => '<div class="fi-calc">' + l.join('') + '</div>';
  const pan = (t, contenu, titre) => '<div class="fi-pan" data-t="' + t + '"' + (titre ? ' data-titre="' + titre + '"' : '') + '>' + contenu + '</div>';
  const duo = (...p) => '<div class="fi-duo">' + p.join('') + '</div>';
  //   de(clé, terme, texte sur la flèche) : terme déplacé ; vers(clé, élément, place) : où il arrive (bas, cote, droite, gauche)
  const de = (cle, t, lab) => '<span class="fi-dep" data-de="' + cle + '"' + (lab ? ' data-lab="' + lab + '"' : '') + '>' + t + '</span>';
  const vers = (cle, t, pos) => '<span data-vers="' + cle + '" data-pos="' + (pos || 'cote') + '">' + t + '</span>';
  window.EPF = { monter: monterTout, rac, crochets, ligne, calc, pan, duo, de, vers };

  function init() {
    monterTout(document);
    addEventListener('resize', retracer);
    if (document.fonts) document.fonts.ready.then(retracer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
