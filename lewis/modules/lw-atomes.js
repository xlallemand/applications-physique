/* ============================================================
   Construire une molécule en reliant les traits libres des atomes
   (modules 1 et 4 de « Schémas de Lewis » ; à charger après lw-schema.js)

   LW.constructeur(boite, mol, o) → { etat, activer(), recommencer(), montrer(), fini(), redessiner(), detruire() }
     boite : conteneur ; le dessin prend toute sa taille (recalculé si elle change)
     mol   : molécule cible (LW.molecule) : ses atomes arrivent séparés, chacun avec ses traits
             libres (liaisons à former) et ses doublets non liants
     o = {
       connu(el) → bool    l'atome est dessiné avec ses traits (sinon : symbole seul, à compléter
                           dans le tableau des atomes) ; par défaut, tous
       cibles              molécules acceptées ([mol] par défaut) ; null : toute molécule juste (défi)
       f                   taille des symboles (22 par défaut)
       message(html, type) refus ('refus'), erreur ('ko'), information ('info'), réussite ('ok') ; '' : effacer
       surFin({ ok, etat, raison })   aucun trait libre : molécule juste (ok) ou non
     }
   Gestes (souris et doigt) :
     glisser un trait libre vers un trait libre (ou un atome) d'un autre atome, ou toucher les deux : liaison ;
     deux ou trois traits entre les mêmes atomes : liaison double ou triple ;
     glisser un atome : il se déplace ; toucher une liaison : elle se défait (un trait).
   Refus expliqués : relier deux traits d'un même atome, relier un trait à un doublet non liant,
   atome sans trait libre, plus de trois liaisons entre deux atomes.
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const NS = 'http://www.w3.org/2000/svg';
  const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
  function distSegment(p, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / L2));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  }
  // « H–H », « O=O » : écriture courte d'un morceau de molécule
  function morceau(etat, atomes) {
    const els = atomes.map(i => etat.atomes[i].el);
    if (atomes.length === 1) return `l'atome ${els[0]}`;
    if (atomes.length === 2) {
      const l = etat.liaisons.find(x => atomes.indexOf(x.a) >= 0 && atomes.indexOf(x.b) >= 0);
      return els[0] + (l && l.o === 3 ? '≡' : l && l.o === 2 ? '=' : '–') + els[1];
    }
    return 'un morceau (' + els.join(', ') + ')';
  }

  function constructeur(boite, mol, o) {
    o = o || {};
    const connu = o.connu || (() => true);
    const cibles = o.cibles === undefined ? [mol] : o.cibles;
    const msg = o.message || (() => {});
    let f = o.f || 22;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lw-svg lw-svg-actif');
    svg.setAttribute('role', 'img');
    boite.appendChild(svg);
    let W = 300, H = 200;
    const etat = { atomes: [], liaisons: [] };
    const cache = [];
    let stubChoisi = null, provisoire = null, geo = null, termine = false;

    const info = el => LW.info(el);
    const libres = i => { const a = etat.atomes[i]; return a.inconnu ? 0 : Math.max(0, info(a.el).liaisons - LW.somme(etat, i)); };

    /* ----- Taille du dessin ----- */
    function mesurer() {
      const r = boite.getBoundingClientRect();
      const w = Math.max(120, r.width), h = Math.max(120, r.height);
      // grand changement de taille (écran tourné, plein écran) : les positions suivent ;
      // petit changement (un message apparaît sous la zone) : les atomes ne bougent pas
      if (etat.atomes.length && W && H && (Math.abs(w - W) > W * .2 || Math.abs(h - H) > H * .2)) {
        etat.atomes.forEach(a => { a.x *= w / W; a.y *= h / H; });
      }
      W = w; H = h;
      f = Math.min(o.f || 22, Math.max(16, Math.min(W, H) / 13));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      garderDedans(true);
    }

    /* ----- Atomes séparés, en grille (atomes autres que H d'abord) ----- */
    function placer() {
      etat.liaisons = [];
      cache.length = 0;
      etat.atomes = mol.atomes.map(a => {
        const k = connu(a.el);
        return { el: a.el, x: 0, y: 0, d: k ? info(a.el).doublets : 0, inconnu: !k };
      });
      const ordre = etat.atomes.map((a, i) => i).sort((i, j) => (etat.atomes[i].el === 'H') - (etat.atomes[j].el === 'H') || i - j);
      const n = ordre.length, pas = f * 5.2;
      let cols = Math.max(1, Math.min(n, Math.floor(W / pas)));
      while (Math.ceil(n / cols) * f * 3.6 > H && cols < n) cols++;
      const rows = Math.ceil(n / cols), cw = W / cols, ch = H / rows;
      ordre.forEach((i, k) => {
        const r = Math.floor(k / cols), c = k % cols;
        const dansLigne = r === rows - 1 ? n - r * cols : cols;
        const dec = (cols - dansLigne) * cw / 2;
        etat.atomes[i].x = dec + cw * (c + .5);
        etat.atomes[i].y = ch * (r + .5);
      });
      termine = false; stubChoisi = null; provisoire = null;
    }

    // chaque morceau de molécule reste dans le dessin, traits libres compris
    const marge = i => (libres(i) ? f * 2.4 : f * 1.3);
    // serre : la zone vient de changer de taille (un message sous la zone) : seuls les symboles restent dedans
    function garderDedans(serre) {
      const comp = LW.composantes(etat);
      for (let k = 0; k < comp.n; k++) {
        const ids = etat.atomes.map((a, i) => i).filter(i => comp.c[i] === k);
        const m = i => (serre ? f * .9 : marge(i));
        const g = Math.min(...ids.map(i => etat.atomes[i].x - m(i))), d = Math.max(...ids.map(i => etat.atomes[i].x + m(i)));
        const h = Math.min(...ids.map(i => etat.atomes[i].y - m(i))), b = Math.max(...ids.map(i => etat.atomes[i].y + m(i)));
        let dx = 0, dy = 0;
        if (g < 0) dx = -g; else if (d > W) dx = W - d;
        if (h < 0) dy = -h; else if (b > H) dy = H - b;
        ids.forEach(i => { etat.atomes[i].x += dx; etat.atomes[i].y += dy; });
      }
    }

    /* ----- Dessin ----- */
    function redessiner() {
      etat.atomes.forEach((a, i) => { a.libres = libres(i); });
      const etiq = termine ? LW.analyse(etat).map(a => ({ t: `${a.e} e<tspan dy="-.45em" font-size=".75em">−</tspan>` })) : null;
      const r = LW.rendu(etat, { f, cache, stubChoisi, provisoire, etiquettes: etiq });
      svg.innerHTML = r.html;
      geo = r.geo;
      svg.setAttribute('aria-label', `Zone de travail : ${etat.atomes.length} atomes, ${etat.liaisons.length} liaison${etat.liaisons.length > 1 ? 's' : ''} formée${etat.liaisons.length > 1 ? 's' : ''}`);
    }

    /* ----- Ce qui est sous le doigt ----- */
    function cibleEn(p, sauf) {
      let best = null, bd = Infinity;
      geo.stubs.forEach(s => {
        if (sauf && s.i === sauf.i && s.k === sauf.k) return;
        const d = dist(p, s);
        if (d < 24 && d < bd) { bd = d; best = { type: 'stub', s }; }
      });
      if (best) return best;
      // atome ou doublet non liant (le doublet si on le vise de plus près que le symbole)
      geo.atomes.forEach(a => {
        const d = dist(p, a);
        if (d < Math.max(26, a.R + 8) && d < bd) { bd = d; best = { type: 'atome', i: a.i }; }
      });
      if (best) {
        const dbl = geo.doublets.filter(x => x.i === best.i).map(x => ({ x, d: dist(p, x) })).sort((a, b) => a.d - b.d)[0];
        if (dbl && dbl.d < bd && dbl.d < 12) return { type: 'doublet', i: best.i };
        return best;
      }
      let k = -1; bd = 14;
      geo.liaisons.forEach(l => { const d = distSegment(p, { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }); if (d < bd) { bd = d; k = l.k; } });
      return k >= 0 ? { type: 'liaison', k } : null;
    }

    /* ----- Former et défaire les liaisons ----- */
    function lier(i, j, angI) {
      const A = etat.atomes[i], B = etat.atomes[j];
      if (i === j) return msg('Relie deux traits de deux atomes <b>différents</b> : un atome ne se lie pas à lui-même.', 'refus');
      if (B.inconnu) return msg(`Complète d'abord la ligne de <b>${B.el}</b> dans le tableau des atomes : il se dessinera avec ses liaisons.`, 'refus');
      if (!libres(j)) return msg(`<b>${B.el}</b> n'a plus de trait libre : il a déjà toutes ses liaisons.`, 'refus');
      const ex = etat.liaisons.find(l => (l.a === i && l.b === j) || (l.a === j && l.b === i));
      if (ex && ex.o >= 3) return msg('Entre deux atomes, il y a au plus <b>trois</b> liaisons (liaison triple).', 'refus');
      const comp = LW.composantes(etat);
      const separes = comp.c[i] !== comp.c[j];
      if (ex) ex.o++; else etat.liaisons.push({ a: i, b: j, o: 1 });
      if (separes) rapprocher(i, j, angI, comp);
      stubChoisi = null;
      msg('');
      redessiner();
      verifier();
    }
    // le plus petit des deux morceaux vient se coller à l'autre, dans la direction du trait choisi
    function rapprocher(i, j, angI, comp) {
      const ni = comp.c.filter(c => c === comp.c[i]).length, nj = comp.c.filter(c => c === comp.c[j]).length;
      let fixe = i, mobile = j, ang = angI;
      if (ni < nj) { fixe = j; mobile = i; ang = null; }
      const A = etat.atomes[fixe], B = etat.atomes[mobile];
      if (ang == null) ang = Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI;
      const L = f * 3;
      const dx = A.x + Math.cos(ang * Math.PI / 180) * L - B.x, dy = A.y + Math.sin(ang * Math.PI / 180) * L - B.y;
      const km = comp.c[mobile];
      etat.atomes.forEach((a, k) => { if (comp.c[k] === km) { a.x += dx; a.y += dy; } });
      garderDedans();
      // les autres morceaux s'écartent s'ils sont dessous
      const c2 = LW.composantes(etat), kc = c2.c[fixe];
      for (let t = 0; t < 4; t++) {
        let bouge = false;
        etat.atomes.forEach((a, k) => {
          if (c2.c[k] === kc) return;
          const proche = etat.atomes.find((b, m) => c2.c[m] === kc && dist(a, b) < f * 2.4);
          if (!proche) return;
          const d = dist(a, proche) || 1, ux = (a.x - proche.x) / d || 0, uy = (a.y - proche.y) / d || 1;
          const pousse = f * 2.6 - d;
          etat.atomes.forEach((b, m) => { if (c2.c[m] === c2.c[k]) { b.x += ux * pousse; b.y += uy * pousse; } });
          bouge = true;
        });
        garderDedans();
        if (!bouge) break;
      }
    }
    function defaire(k) {
      if (termine) return;
      const l = etat.liaisons[k];
      if (l.o > 1) l.o--; else etat.liaisons.splice(k, 1);
      cache.length = 0;
      msg('Liaison défaite : les deux traits sont de nouveau libres.', 'info');
      redessiner();
      verifier(true);
    }

    /* ----- Où en est la molécule ? ----- */
    function verifier(silence) {
      const inc = etat.atomes.filter(a => a.inconnu);
      if (inc.length) return;
      const avec = etat.atomes.map((a, i) => ({ el: a.el, i, n: libres(i) })).filter(x => x.n);
      const total = avec.reduce((s, x) => s + x.n, 0);
      const comp = LW.composantes(etat);
      if (!total) {
        if (comp.n > 1) {
          // le plus petit morceau est « à part »
          const tailles = [];
          comp.c.forEach(c => { tailles[c] = (tailles[c] || 0) + 1; });
          const kmin = tailles.indexOf(Math.min(...tailles));
          const at = comp.c.map((c, i) => (c === kmin ? i : -1)).filter(i => i >= 0);
          msg(`<b class="er-ko">Ce n'est pas ça.</b> Tous les atomes doivent former <b>une seule molécule</b> : ici, ${morceau(etat, at)} est à part. Touche une liaison pour la défaire.`, 'ko');
          if (o.surFin) o.surFin({ ok: false, raison: 'separe', etat });
          return;
        }
        if (cibles && !cibles.some(c => LW.meme(etat, c))) {
          msg(`<b class="er-ko">Ce n'est pas ça.</b> Chaque atome a bien ses liaisons, mais ce n'est pas la molécule demandée${mol.indice ? ` : ${mol.indice}` : ''}. Touche une liaison pour la défaire.`, 'ko');
          if (o.surFin) o.surFin({ ok: false, raison: 'autre', etat });
          return;
        }
        termine = true;
        redessiner();
        if (o.surFin) o.surFin({ ok: true, etat });
        return;
      }
      if (silence) return;
      const noms = [...new Set(avec.map(x => x.el))].join(', ');
      if (comp.n === 1) {
        msg(`Il reste ${total === 1 ? 'une liaison libre' : total + ' liaisons libres'} sur ${noms} : chaque trait doit être relié.${avec.length === 2 ? ' Deux ou trois traits entre les mêmes atomes font une liaison double ou triple.' : ''}`, 'info');
      } else if (avec.length === 1) {
        msg(`Il reste ${total === 1 ? 'un trait libre' : total + ' traits libres'} sur ${noms}, et aucun autre atome n'en a : touche une liaison pour la défaire.`, 'info');
      }
    }

    /* ----- Gestes ----- */
    let geste = null;
    const point = ev => { const r = svg.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    svg.addEventListener('pointerdown', ev => {
      if (geste || !geo) return;
      const p = point(ev), c = cibleEn(p);
      geste = { id: ev.pointerId, p0: p, c, bouge: false };
      if (c && (c.type === 'stub' || c.type === 'atome')) { try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ } ev.preventDefault(); }
    });
    svg.addEventListener('pointermove', ev => {
      if (!geste || ev.pointerId !== geste.id) return;
      const p = point(ev);
      if (!geste.bouge && dist(p, geste.p0) > 7) geste.bouge = true;
      if (!geste.bouge || !geste.c) return;
      if (geste.c.type === 'stub' && !termine) {
        const s = geste.c.s;
        provisoire = { x1: s.x0, y1: s.y0, x2: p.x, y2: p.y };
        redessiner();
      } else if (geste.c.type === 'atome') {
        const a = etat.atomes[geste.c.i], m = Math.min(marge(geste.c.i), W / 2, H / 2);
        a.x = Math.max(m, Math.min(W - m, p.x)); a.y = Math.max(m, Math.min(H - m, p.y));
        redessiner();
      }
    });
    function fin(ev) {
      if (!geste || ev.pointerId !== geste.id) return;
      const g = geste; geste = null;
      const p = point(ev);
      if (provisoire) { provisoire = null; redessiner(); }
      if (ev.type === 'pointercancel') return;
      const c = g.c;
      if (!c) { if (stubChoisi) { stubChoisi = null; redessiner(); } return; }
      if (termine) return;
      if (c.type === 'stub' && g.bouge) {
        // trait libre glissé : relâché sur un trait, un atome ou un doublet
        const t = cibleEn(p, c.s);
        if (!t) return;
        if (t.type === 'doublet') return msg('Un doublet non liant ne forme pas de liaison : relie le trait à un <b>trait libre</b>.', 'refus');
        if (t.type === 'stub') return lier(c.s.i, t.s.i, c.s.a);
        if (t.type === 'atome') return lier(c.s.i, t.i, c.s.a);
        return;
      }
      if (c.type === 'stub') {
        // trait libre touché : choisi, puis le second
        if (!stubChoisi) { stubChoisi = { i: c.s.i, k: c.s.k, a: c.s.a }; msg('Touche maintenant un trait libre d\'un <b>autre</b> atome.', 'info'); redessiner(); return; }
        if (stubChoisi.i === c.s.i && stubChoisi.k === c.s.k) { stubChoisi = null; msg(''); redessiner(); return; }
        const s0 = stubChoisi;
        if (s0.i === c.s.i) { stubChoisi = null; redessiner(); return msg('Relie deux traits de deux atomes <b>différents</b> : un atome ne se lie pas à lui-même.', 'refus'); }
        return lier(s0.i, c.s.i, s0.a);
      }
      if (c.type === 'atome' && !g.bouge) {
        const a = etat.atomes[c.i];
        if (stubChoisi) { const s0 = stubChoisi; stubChoisi = null; return lier(s0.i, c.i, s0.a); }
        if (a.inconnu) return msg(`Complète la ligne de <b>${a.el}</b> dans le tableau des atomes : il se dessinera avec ses liaisons.`, 'info');
        return;
      }
      if (c.type === 'doublet' && !g.bouge) {
        if (stubChoisi) { stubChoisi = null; redessiner(); return msg('Un doublet non liant ne forme pas de liaison : relie le trait à un <b>trait libre</b>.', 'refus'); }
        return msg(`C'est un <b>doublet non liant</b> de ${etat.atomes[c.i].el} : il ne forme pas de liaison.`, 'info');
      }
      if (c.type === 'liaison' && !g.bouge) defaire(c.k);
    }
    svg.addEventListener('pointerup', fin);
    svg.addEventListener('pointercancel', fin);

    /* ----- Redimensionnement ----- */
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => { const r = boite.getBoundingClientRect(); if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) { mesurer(); redessiner(); } });
      ro.observe(boite);
    }
    mesurer();
    placer();
    redessiner();

    return {
      etat,
      fini: () => termine,
      redessiner() { mesurer(); redessiner(); },
      // un élément vient d'être complété dans le tableau des atomes : ses atomes se dessinent
      activer() {
        etat.atomes.forEach(a => { if (a.inconnu && connu(a.el)) { a.inconnu = false; a.d = info(a.el).doublets; } });
        cache.length = 0;
        redessiner();
        verifier(true);
      },
      recommencer() { msg(''); placer(); redessiner(); },
      // réponse affichée : la molécule cible dessinée
      montrer() {
        const cible = cibles && cibles[0] ? cibles[0] : mol;
        const a = LW.ajuster(cible, W, H, { fmax: f });
        etat.atomes.forEach((x, i) => { x.x = a.pos[i].x; x.y = a.pos[i].y; x.inconnu = false; x.d = info(x.el).doublets; });
        etat.liaisons = cible.liaisons.map(l => Object.assign({}, l));
        cache.length = 0; termine = true; stubChoisi = null;
        redessiner();
      },
      detruire() { if (ro) ro.disconnect(); svg.remove(); },
    };
  }

  LW.constructeur = constructeur;
})();
