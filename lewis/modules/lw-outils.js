/* ============================================================
   Outils des modules 2 à 4 de « Schémas de Lewis » (à charger après lw-schema.js)

   LW.vue(boite, mol, o) → { mol, rendre(opts), redessiner(), detruire() }
     schéma dessiné dans boite (toute sa taille) ; mol est lu à chaque rendu (doublets, ordres) ;
     o.surAtome(i), o.surLiaison(k) : atome ou liaison touché (zone sensible de 44 px au moins,
     l'atome le plus proche) ; rendre({ choisi, marques (Set), etiquettes }) garde les options.

   LW.completeur(boiteSchema, boitePanneau, mol, o) → { verifier(), montrer(), vue }
     toucher un atome puis « + / − doublet non liant » ; toucher une liaison change son ordre
     (simple → double → triple → simple) ; « Vérifier » : atomes fautifs entourés, diagnostic.
     o = { solution (molécule juste), message(html, type), surVerif({ ok, diag }) }

   LW.conclusion(boite, mol, o) → { montrer() }
     expressions à piocher (toucher ou glisser) pour conclure : « le schéma est juste / faux », « car »,
     raisons (LW.raisons) ; « Valider » → o.surValider({ ok, diag, texte }).
     o.raisons : nombre de raisons proposées (8 par défaut) ; actions() : la ligne des boutons
     (Valider, Effacer), qui peut recevoir d'autres boutons
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
  const E = '<tspan dy="-.45em" font-size=".75em">−</tspan>';

  /* ============================================================
     SCHÉMA À TOUCHER
     ============================================================ */
  function vue(boite, mol, o) {
    o = o || {};
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'lw-svg' + (o.surAtome || o.surLiaison ? ' lw-svg-actif' : ''));
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Schéma de Lewis proposé (${mol.f.replace(/<[^>]+>/g, '')})`);
    boite.appendChild(svg);
    let W = 0, H = 0, f = 22, pos = [], geo = null;
    const cache = [];
    let opts = {};
    function mesurer() {
      const r = boite.getBoundingClientRect();
      W = Math.max(120, r.width); H = Math.max(100, r.height);
      const a = LW.ajuster(mol, W, H, { fmax: o.fmax || 24 });
      pos = a.pos; f = a.f;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      cache.length = 0;
    }
    function rendre(nv) {
      if (nv) opts = Object.assign({}, opts, nv);
      const etat = { atomes: mol.atomes.map((a, i) => ({ el: a.el, x: pos[i].x, y: pos[i].y, d: a.d })), liaisons: mol.liaisons };
      const r = LW.rendu(etat, { f, cache, choisi: opts.choisi, marques: opts.marques, etiquettes: opts.etiquettes });
      svg.innerHTML = r.html;
      geo = r.geo;
    }
    // l'atome ou la liaison le plus proche du doigt
    let p0 = null;
    const point = ev => { const r = svg.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
    svg.addEventListener('pointerdown', ev => { p0 = { p: point(ev), id: ev.pointerId }; });
    svg.addEventListener('pointerup', ev => {
      if (!p0 || p0.id !== ev.pointerId || !geo) return;
      const p = point(ev);
      if (dist(p, p0.p) > 10) { p0 = null; return; }
      p0 = null;
      let ia = -1, da = Infinity;
      geo.atomes.forEach(a => { const d = dist(p, a); if (d < da) { da = d; ia = a.i; } });
      let il = -1, dl = Infinity;
      geo.liaisons.forEach(l => { const d = distSegment(p, { x: l.x1, y: l.y1 }, { x: l.x2, y: l.y2 }); if (d < dl) { dl = d; il = l.k; } });
      const seuilA = Math.max(24, f * 1.1);
      if (o.surLiaison && il >= 0 && dl < 16 && (dl < da * .6 || da > f * .8)) return o.surLiaison(il);
      if (o.surAtome && ia >= 0 && da < seuilA) return o.surAtome(ia);
    });
    let ro = null;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => { const r = boite.getBoundingClientRect(); if (Math.abs(r.width - W) > 1 || Math.abs(r.height - H) > 1) { mesurer(); rendre(); } });
      ro.observe(boite);
    }
    mesurer(); rendre();
    return { mol, rendre, redessiner() { mesurer(); rendre(); }, detruire() { if (ro) ro.disconnect(); svg.remove(); }, f: () => f };
  }

  /* ============================================================
     COMPLÉTER UN SCHÉMA
     ============================================================ */
  function completeur(boiteSchema, boitePanneau, mol, o) {
    o = o || {};
    const msg = o.message || (() => {});
    let choisi = null, marques = new Set(), fini = false;
    const v = vue(boiteSchema, mol, {
      surAtome(i) { if (fini) return; choisi = i; marques = new Set(); majPanneau(); v.rendre({ choisi, marques }); },
      surLiaison(k) {
        if (fini) return;
        const l = mol.liaisons[k], A = mol.atomes[l.a], B = mol.atomes[l.b];
        if ((A.el === 'H' || B.el === 'H') && l.o === 1) return msg('H ne forme qu\'<b>une</b> liaison simple : cette liaison ne peut pas devenir double.', 'refus');
        l.o = l.o >= 3 ? 1 : l.o + 1;
        marques = new Set();
        msg(`Liaison ${A.el}${l.o === 3 ? '≡' : l.o === 2 ? '=' : '–'}${B.el} : liaison ${l.o === 3 ? 'triple' : l.o === 2 ? 'double' : 'simple'}.`, 'info');
        v.rendre({ marques });
      },
    });
    boitePanneau.innerHTML = `<p class="lw-cmp-t" data-c="t"></p>
      <div class="lw-cmp-b"><button type="button" class="btn-secondary" data-c="moins" aria-label="Retirer un doublet non liant">− doublet</button>
        <button type="button" class="btn-secondary" data-c="plus" aria-label="Ajouter un doublet non liant">+ doublet</button></div>
      <div class="er-actions lw-cmp-v"><button type="button" class="btn-primary" data-c="verifier">Vérifier</button></div>`;
    const $ = c => boitePanneau.querySelector(`[data-c="${c}"]`);
    function majPanneau() {
      $('t').innerHTML = choisi == null ? 'Touche un atome pour ajouter ou retirer un doublet non liant ; touche une liaison pour changer son ordre.'
        : `Atome choisi : <b>${mol.atomes[choisi].el}</b> (${LW.doublets(mol.atomes[choisi].d)}). Touche une liaison pour changer son ordre.`;
      $('moins').disabled = $('plus').disabled = choisi == null || fini;
    }
    function doublet(k) {
      if (choisi == null || fini) return;
      const a = mol.atomes[choisi];
      if (k > 0 && a.el === 'H') return msg('H n\'a qu\'un électron de valence : il n\'a <b>jamais</b> de doublet non liant.', 'refus');
      if (k > 0 && a.d >= 4) return msg(`Pas plus de 4 doublets non liants autour de ${a.el}.`, 'refus');
      if (k < 0 && !a.d) return msg(`${a.el} n'a pas de doublet non liant à retirer.`, 'refus');
      a.d += k;
      marques = new Set();
      msg('');
      majPanneau();
      v.rendre({ marques });
    }
    $('plus').onclick = () => doublet(1);
    $('moins').onclick = () => doublet(-1);
    function verifier() {
      if (fini) return;
      const fautifs = mol.atomes.map((a, i) => i).filter(i => LW.diagAtome(mol, i));
      marques = new Set(fautifs);
      if (!fautifs.length) {
        fini = true; choisi = null;
        const an = LW.analyse(mol);
        v.rendre({ choisi, marques, etiquettes: an.map(a => ({ t: `${a.e} e${E}` })) });
        majPanneau();
        if (o.surVerif) o.surVerif({ ok: true });
        return;
      }
      // diagnostics des deux premiers atomes fautifs (les autres sont entourés)
      const vus = new Set(), d = [];
      fautifs.forEach(i => { const t = LW.diagAtome(mol, i); if (!vus.has(t)) { vus.add(t); d.push(t); } });
      const diag = d.slice(0, 2).join(' ') + (d.length > 2 ? ` Les autres atomes entourés ne sont pas justes non plus.` : '');
      v.rendre({ choisi, marques });
      if (o.surVerif) o.surVerif({ ok: false, diag });
    }
    $('verifier').onclick = verifier;
    majPanneau();
    return {
      vue: v, verifier,
      // réponse affichée : le schéma juste
      montrer() {
        const s = o.solution;
        mol.atomes.forEach((a, i) => { a.d = s.atomes[i].d; });
        mol.liaisons.forEach((l, k) => { l.o = s.liaisons[k].o; });
        fini = true; choisi = null; marques = new Set();
        v.rendre({ choisi, marques, etiquettes: LW.analyse(mol).map(a => ({ t: `${a.e} e${E}` })) });
        majPanneau();
      },
      fini: () => fini,
    };
  }

  /* ============================================================
     CONCLURE AVEC DES EXPRESSIONS À PIOCHER
     ============================================================ */
  function conclusion(boite, mol, o) {
    o = o || {};
    const R = LW.raisons(mol), an = R.analyse;
    // raisons proposées : toutes les vraies (au plus 4), puis des fausses, mélangées
    const vraies = R.raisons.filter(r => r.vraie && (R.juste ? r.sorte === 'regle' : r.sorte === 'defaut'));
    const autres = LW.melanger(R.raisons.filter(r => vraies.indexOf(r) < 0));
    const nb = o.raisons || 8;
    const prises = LW.melanger(vraies.slice(0, 4).concat(autres.slice(0, Math.max(0, nb - Math.min(4, vraies.length)))));
    const T = { juste: { id: 'juste', t: 'le schéma est juste', v: 'juste' }, faux: { id: 'faux', t: 'le schéma est faux', v: 'faux' },
      car: { id: 'car', t: 'car' }, et: { id: 'et', t: 'et', multi: true } };
    prises.forEach(r => { T[r.id] = { id: r.id, t: r.t, r }; });
    const ordre = ['juste', 'faux', 'car', 'et'].concat(prises.map(r => r.id));
    const bouton = id => `<button type="button" class="lw-exp${T[id].v ? ' lw-exp-v' : id === 'car' || id === 'et' ? ' lw-exp-l' : ''}" data-e="${id}">${T[id].t}</button>`;
    boite.innerHTML = `<div class="lw-phrase" data-k="phrase" aria-label="Ta conclusion" aria-live="polite"></div>
      <div class="lw-pioche" data-k="pioche"><div class="lw-pioche-f">${ordre.slice(0, 4).map(bouton).join('')}</div><div class="lw-pioche-r">${ordre.slice(4).map(bouton).join('')}</div></div>
      <div class="er-actions lw-concl-a"><button type="button" class="btn-primary" data-k="valider" aria-label="Valider la conclusion">Valider</button><button type="button" class="btn-small" data-k="effacer">Effacer</button></div>`;
    const $ = k => boite.querySelector(`[data-k="${k}"]`);
    let phrase = [], fini = false;
    function maj() {
      const ph = $('phrase');
      ph.innerHTML = phrase.length ? phrase.map((id, k) => `<button type="button" class="lw-exp lw-exp-pris${T[id].v ? ' lw-exp-v' : ''}" data-k2="${k}" aria-label="Retirer : ${T[id].t}">${T[id].t}</button>`).join('')
        : '<span class="lw-phrase-vide">Touche ou glisse les expressions ici, dans l\'ordre.</span>';
      ph.querySelectorAll('[data-k2]').forEach(b => { b.onclick = () => { if (fini) return; phrase.splice(+b.dataset.k2, 1); maj(); if (o.surChange) o.surChange(); }; });
      boite.querySelectorAll('[data-e]').forEach(b => { const id = b.dataset.e; b.disabled = fini || (!T[id].multi && phrase.indexOf(id) >= 0); });
    }
    function ajouter(id) {
      if (fini || (!T[id].multi && phrase.indexOf(id) >= 0)) return;
      phrase.push(id); maj();
      if (o.surChange) o.surChange();
    }
    boite.querySelectorAll('[data-e]').forEach(b => {
      if (window.DragDrop) {
        DragDrop.enable(b, {
          zoneSelector: '.lw-phrase',
          dragOverClass: 'lw-survol',
          onDrop(item, z, ev) {
            const r = b.getBoundingClientRect();
            const tape = ev && ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
            if ((z && z.closest('.lw-phrase') === $('phrase')) || tape) ajouter(b.dataset.e);
          },
        });
      } else b.onclick = () => ajouter(b.dataset.e);
    });
    $('effacer').onclick = () => { if (fini) return; phrase = []; maj(); if (o.surChange) o.surChange(); };

    // conclusion finie : la pioche et les boutons Valider / Effacer disparaissent
    function ranger() { $('pioche').hidden = true; $('valider').hidden = true; $('effacer').hidden = true; }

    // la conclusion est-elle juste ?
    function evaluer() {
      const toks = phrase.map(id => T[id]);
      const ko = d => ({ ok: false, diag: d });
      const verdicts = toks.filter(t => t.v);
      if (!verdicts.length) return ko('Commence par dire si le schéma est juste ou faux.');
      if (verdicts.length > 1) return ko('Choisis « le schéma est juste » ou « le schéma est faux », pas les deux.');
      if (!toks[0].v) return ko('Commence par la conclusion (« le schéma est … »), puis « car » et la raison.');
      const dit = toks[0].v;
      if (dit === 'juste' && !R.juste) {
        const f = an.find(a => !a.ok);
        if (f) return ko(`${f.el} est entouré de ${f.e} électrons au lieu de ${f.regle} : le schéma ne peut pas être juste.`);
        const a = an.find(x => !x.bon), s = a.info;
        return ko(`Tous les atomes ont bien 8 électrons autour d'eux (2 pour H), mais ${a.el} a ${s.valence} électrons de valence : il doit former ${LW.pl(s.liaisons, 'liaison')} ${s.doublets ? 'et avoir ' + LW.doublets(s.doublets) : 'sans doublet non liant'}. Le schéma ne peut pas être juste.`);
      }
      if (dit === 'faux' && R.juste) return ko('Chaque atome est entouré de 8 électrons (2 pour H) et forme le bon nombre de liaisons : relis ton comptage.');
      const rs = toks.filter(t => t.r);
      const nCar = toks.filter(t => t.id === 'car').length;
      if (!rs.length) return ko(dit === 'faux' ? 'Dis quel atome ne respecte pas la règle : ajoute « car » puis la raison.' : 'Dis pourquoi : ajoute « car » puis les règles respectées.');
      if (!nCar) return ko('Relie la conclusion et la raison par « car ».');
      if (nCar > 1) return ko('Un seul « car » suffit : relie ensuite les raisons par « et ».');
      if (toks[1].id !== 'car') return ko('« car » se place juste après la conclusion.');
      const fausse = rs.find(t => !t.r.vraie);
      if (fausse) return ko(`« ${fausse.r.t} » : ${fausse.r.diag}`);
      const hors = rs.find(t => (dit === 'faux' ? t.r.sorte !== 'defaut' : t.r.sorte !== 'regle'));
      if (hors) return ko(`« ${hors.r.t} » : c'est vrai, mais ce n'est pas ce qui rend le schéma ${dit}.`);
      return { ok: true, texte: phrase.map(id => T[id].t).join(' ') };
    }
    $('valider').onclick = () => {
      if (fini) return;
      if (!phrase.length) { if (o.surValider) o.surValider({ ok: false, vide: true, diag: 'Touche les expressions pour écrire ta conclusion.' }); return; }
      const r = evaluer();
      if (r.ok) { fini = true; maj(); ranger(); }
      if (o.surValider) o.surValider(r);
    };
    maj();
    return {
      juste: R.juste,
      actions: () => boite.querySelector('.lw-concl-a'),
      // réponse affichée : une conclusion juste
      montrer() {
        phrase = [R.juste ? 'juste' : 'faux', 'car'];
        const vr = prises.filter(r => vraies.indexOf(r) >= 0);
        vr.forEach((r, k) => { if (k) phrase.push('et'); phrase.push(r.id); });
        fini = true; maj(); ranger();
      },
      fini: () => fini,
    };
  }

  // correction écrite : chaque atome fautif et ce qui ne va pas
  function correction(mol) {
    const an = LW.analyse(mol);
    // un C entouré de moins de 8 électrons, sans doublet ni liaison multiple : un H a été oublié
    const d = [...new Set(mol.atomes.map((a, i) => {
      const t = LW.diagAtome(mol, i), x = an[i];
      return t && x.el === 'C' && x.e < 8 && !x.d && x.nv === x.l ? t.replace(/il lui manque une liaison\.$/, 'il lui manque une liaison avec un atome H.') : t;
    }).filter(Boolean))];
    return d.length ? d.join(' ') : 'H est entouré de 2 électrons (règle du duet), chacun des autres atomes de 8 électrons (règle de l\'octet).';
  }

  Object.assign(LW, { vue, completeur, conclusion, correction });
})();
