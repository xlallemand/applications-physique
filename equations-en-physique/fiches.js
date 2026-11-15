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
     data-esp   place laissée sous la ligne pour une flèche de déplacement (en em)
   Dans un membre :
     <span class="fi-fr"><span>numérateur</span><span>dénominateur</span></span>   fraction
     <span class="fi-zero">…</span>                                             ce qui s'annule
     <span class="fi-dep" data-de="a">…</span> … <span class="fi-dep" data-vers="a">…</span>
                                                     terme déplacé : flèche courbe de l'un à l'autre
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
      // place pour une flèche de déplacement, puis la remarque, puis la place des flèches « même opération »
      if (l.dataset.esp) {
        const e = document.createElement('div');
        e.className = 'fi-arc-esp';
        e.style.height = l.dataset.esp + 'em';
        apres.push(e);
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
      calc.style.setProperty('--fi-pad', (1.6 + 0.5 * plusLong).toFixed(2) + 'em');
    }
  }

  // ── flèches courbes de déplacement : tracées après l'affichage et à chaque changement de taille ──
  function tracerArcs() {
    document.querySelectorAll('.fi-calc').forEach(c => {
      c.querySelectorAll(':scope > .fi-arc').forEach(s => s.remove());
      if (!c.getClientRects().length) return;
      c.querySelectorAll('[data-de]').forEach(a => {
        const b = c.querySelector('[data-vers="' + a.dataset.de + '"]');
        if (!b) return;
        const r = c.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        let x1 = ra.left + ra.width / 2 - r.left, y1 = ra.bottom - r.top + 2;
        const x2 = rb.left + rb.width / 2 - r.left;
        const depuisNum = !!a.closest('.fi-fr > span:first-child');
        const versDen = b.parentElement.matches('.fi-fr > span + span') || !!b.closest('.fi-fr > span + span');
        let y2, d, cx, cy;
        if (versDen) {
          // vers un dénominateur : la flèche contourne la ligne d'arrivée par le côté et par-dessous
          y2 = rb.bottom - r.top + 2;
          const s = x2 >= x1 ? -1 : 1, bas = y2 + 22;
          // ligne d'arrivée : ses trois cases (gauche, =, droite) ; la flèche passe au-delà de son bord
          const cg = b.closest('.fi-g') || b.closest('.fi-d').previousElementSibling.previousElementSibling;
          const cd = cg.nextElementSibling.nextElementSibling;
          const bord = s > 0 ? Math.max(cd.getBoundingClientRect().right - r.left + 14, x1 + 30)
                             : Math.min(cg.getBoundingClientRect().left - r.left - 14, x1 - 30);
          const ym = (cg.getBoundingClientRect().top + cg.getBoundingClientRect().bottom) / 2 - r.top;
          cx = x2 + s * 25; cy = bas + 16;
          // depuis un numérateur : la flèche part du côté du terme, sans traverser sa fraction
          let c1 = (x1 + s * 8) + ',' + (y1 + 30);
          if (depuisNum) {
            x1 = (s < 0 ? ra.left - 3 : ra.right + 3) - r.left; y1 = ra.top + ra.height / 2 - r.top;
            c1 = (x1 + s * 30) + ',' + y1;
          }
          d = 'M' + x1 + ',' + y1 + ' C' + c1 + ' ' + bord + ',' + (ym - 30) + ' ' + bord + ',' + ym +
            ' C' + bord + ',' + (bas + 6) + ' ' + cx + ',' + cy + ' ' + x2 + ',' + y2;
        } else if (depuisNum && x2 > ra.right - r.left) {
          // depuis un numérateur vers la droite : la flèche part du côté du terme, sans traverser la fraction
          x1 = ra.right - r.left + 3; y1 = ra.top + ra.height / 2 - r.top;
          y2 = rb.top - r.top - 2;
          cx = x2; cy = y1;
          d = 'M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2;
        } else {
          y2 = rb.top - r.top - 2;
          cx = (x1 + x2) / 2; cy = Math.max(y1, y2) + 4;
          d = 'M' + x1 + ',' + y1 + ' Q' + cx + ',' + cy + ' ' + x2 + ',' + y2;
        }
        // pointe orientée selon la tangente en fin de courbe
        const ang = Math.atan2(y2 - cy, x2 - cx), P = 8;
        const p1 = [x2 - P * Math.cos(ang - 0.5), y2 - P * Math.sin(ang - 0.5)], p2 = [x2 - P * Math.cos(ang + 0.5), y2 - P * Math.sin(ang + 0.5)];
        const sv = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        sv.setAttribute('class', 'fi-arc');
        sv.setAttribute('width', r.width); sv.setAttribute('height', r.height); sv.setAttribute('aria-hidden', 'true');
        sv.innerHTML = '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M' + p1 + ' L' + x2 + ',' + y2 + ' L' + p2 + '" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>';
        c.appendChild(sv);
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
  window.EPF = { monter: monterTout, rac, crochets, ligne, calc, pan, duo };

  function init() {
    monterTout(document);
    addEventListener('resize', retracer);
    if (document.fonts) document.fonts.ready.then(retracer);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
