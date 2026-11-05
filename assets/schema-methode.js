/* ============================================================
   Schéma de la méthode « quantités de matière » (commun à plusieurs chapitres)
   Version générale du schéma de l'application « Chapitre 14 : Combustions »
   (CO.schema et CO.schemaDonnees dans combustions/modules/co.js), pour
   n'importe quelle équation (chapitres 15 et 16 de Terminale STI2D).
   Styles : assets/schema-methode.css (classes schm-…). Glisser-déposer :
   assets/dragdrop.js (à charger avant, pour la partie à compléter).

   L'équation est écrite en tête, une colonne par espèce. Sous l'espèce
   connue : la donnée (m, ou c et V…) puis n ; la ligne des relations
   stœchiométriques n(A) / a = n(B) / b = … ; sous l'espèce cherchée : n puis
   la grandeur demandée (m = n × M, c = n / V, Q = n × F…). Flèches pleines
   pour le chemin de calcul, en pointillés pour les autres colonnes.

   API (objet SCHM ; schemaMethode = SCHM.schema) :
     SCHM.schema(o)     HTML du schéma
       o.especes   [{ f (formule HTML), coef (nombre stœchiométrique ou lettre), rel: false (pas de fraction) }]
       o.produits  rang de la première espèce à droite de la flèche (signe placé avant elle)
       o.signe     '→' (équation, par défaut) ou '=' (demi-équation : colonne e⁻ comprise)
       o.depart    { k (colonne), donnees: [[étiquette, valeur], …], n: [étiquette, valeur] }
       o.cible     { k, n: valeur (ou [étiquette, valeur]), grandeur: [étiquette, valeur],
                     donnees: [[étiquette, valeur], …] (écrites dans la case de la grandeur, ex. M) }
       o.autres    colonnes calculables en plus (pointillés) : [k, …] ou [{ k, n }]
       o.lettres   true : nombres stœchiométriques écrits en lettres (équation à écrire)
       o.titre     texte de l'attribut aria-label
       Une valeur est un texte HTML, '?' (inconnue) ou '#id' (case vide où glisser une
       donnée, voir SCHM.partieDonnees) ; une case absente n'est pas dessinée.
     SCHM.partieDonnees(def, opts)
       partie « perso » de question (moteurs CIN, NUC, OX… : monter(zone, api) → { montrer() }) :
       l'élève glisse les données de l'énoncé dans les cases du schéma.
       def.schema    options de SCHM.schema, avec des cases '#id'
       def.etiquettes [{ id, label, cible (id de case), indice }]
       Au doigt : on touche une étiquette, puis une case.
     SCHM.choixRelation(o, opts)
       partie « choix » : la relation stœchiométrique utile entre o.depart.k et o.cible.k,
       avec les erreurs classiques (nombres inversés ou oubliés) et leurs diagnostics.
     SCHM.frac(a, b), SCHM.n(f)   écritures : fraction, « n(f) »
   ============================================================ */
(function () {
  'use strict';

  const frac = (a, b) => `<span class="schm-frac"><span>${a}</span><span>${b}</span></span>`;
  const nDe = f => `n(${f})`;
  const def = x => x !== undefined && x !== null;
  const texte = h => String(h).replace(/<[^>]+>/g, '');

  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }

  // contenu d'une case : texte, '?' (inconnue) ou '#id' (case où glisser une donnée)
  const contenu = x => (x === '?' ? '<b class="schm-inc">?</b>'
    : String(x)[0] === '#' ? `<span class="schm-slot" data-slot="${String(x).slice(1)}"><span class="schm-slot-ph">?</span></span>` : `<b>${x}</b>`);

  /* ============================================================
     LE SCHÉMA
     ============================================================ */
  function schema(o) {
    const esp = o.especes, N = esp.length, signe = o.signe || '→';
    const prod = def(o.produits) ? o.produits : Math.ceil(N / 2);
    const dep = o.depart || {}, cib = o.cible || {};
    const autres = (o.autres || []).map(a => (typeof a === 'number' ? { k: a } : a)).filter(a => a.k !== dep.k && a.k !== cib.k);
    const kA = autres.map(a => a.k);
    // chaque ligne du schéma a son numéro (grid-row) : les cases restent dans leur colonne
    let r = 0;
    const cell = (k, html, cls, attr) => `<div class="schm-c${cls ? ' ' + cls : ''}" style="grid-column:${k + 1};grid-row:${r}"${attr || ''}>${html}</div>`;
    const lig = (lab, x) => `<span class="schm-lab">${lab}</span>${contenu(x)}`;
    // flèches d'une ligne : pleines (chemin du calcul) ou en pointillés (autres colonnes)
    const fl = (pleines, pointilles) => {
      r++;
      return pleines.map(k => cell(k, '↓', 'schm-fl')).join('') + (pointilles || []).map(k => cell(k, '↓', 'schm-fl pointille')).join('');
    };
    const op = k => (k === 0 ? '' : ` data-op="${k === prod ? signe : '+'}"`);
    const coef = c => (o.lettres ? `<span class="schm-coef schm-lettre">${c}</span>` : (c > 1 ? `<span class="schm-coef">${c}</span>` : ''));

    r = 1;
    let h = esp.map((e, k) => cell(k, `<span class="schm-f">${coef(e.coef)}${e.f}</span>`, 'schm-eq', op(k))).join('');
    // sous l'espèce connue : les données, puis n
    if (def(dep.k)) {
      if (dep.donnees && dep.donnees.length) {
        h += fl([dep.k]);
        r++;
        h += cell(dep.k, dep.donnees.map(([lab, x]) => lig(lab, x)).join(''), 'schm-v');
        h += fl([dep.k]);
      } else {
        h += fl([dep.k]);
      }
      r++;
      const dn = Array.isArray(dep.n) ? dep.n : [nDe(esp[dep.k].f), def(dep.n) ? dep.n : '?'];
      h += cell(dep.k, lig(dn[0], dn[1]), 'schm-v');
    }
    // la ligne des relations stœchiométriques
    h += fl([dep.k, cib.k].filter(def), kA);
    r++;
    h += esp.map((e, k) => cell(k, e.rel === false ? '' : frac(nDe(e.f), o.lettres ? `<i>${e.coef}</i>` : e.coef), 'schm-rel', k ? ' data-op="="' : '')).join('');
    // sous l'espèce cherchée : n, puis la grandeur demandée ; autres colonnes en pointillés
    const bas = def(cib.k) ? [cib.k] : [];
    const autresN = autres.filter(a => def(a.n));
    if (bas.length || autresN.length) {
      h += fl(bas, autresN.map(a => a.k));
      r++;
      if (bas.length) {
        const cn = Array.isArray(cib.n) ? cib.n : [nDe(esp[cib.k].f), def(cib.n) ? cib.n : '?'];
        h += cell(cib.k, lig(cn[0], cn[1]), 'schm-v');
      }
      h += autresN.map(a => cell(a.k, lig(nDe(esp[a.k].f), a.n), 'schm-v pointille')).join('');
    }
    if (cib.grandeur) {
      h += fl([cib.k]);
      r++;
      h += cell(cib.k, (cib.donnees || []).map(([lab, x]) => lig(lab, x)).join('') + lig(cib.grandeur[0], cib.grandeur[1]), 'schm-v');
    }
    const aria = o.titre || 'Schéma de la méthode : une colonne par espèce de l\'équation';
    return `<div class="schm-defile"><div class="schm-schema" style="--schm-n:${N}" role="group" aria-label="${aria.replace(/"/g, '&quot;')}">${h}</div></div>`;
  }

  /* ============================================================
     DÉFILEMENT AUTOMATIQUE pendant un glisser (étiquette tenue près
     du haut ou du bas de l'écran), comme dans co.js
     ============================================================ */
  const defil = { y: -1, raf: null };
  function suivreY(e) { defil.y = e.clientY; }
  function tick() {
    const h = innerHeight, y = defil.y, haut = 110, bas = 60;
    let dy = 0;
    if (y >= 0 && y < haut) dy = -Math.min(16, Math.ceil((haut - y) / 4));
    else if (y > h - bas) dy = Math.min(16, Math.ceil((y - (h - bas)) / 4));
    if (dy) scrollBy(0, dy);
    defil.raf = requestAnimationFrame(tick);
  }
  function debutDefil() { defil.y = -1; addEventListener('pointermove', suivreY); if (!defil.raf) defil.raf = requestAnimationFrame(tick); }
  function finDefil() { removeEventListener('pointermove', suivreY); if (defil.raf) cancelAnimationFrame(defil.raf); defil.raf = null; }

  /* ============================================================
     PARTIE « DONNÉES À GLISSER SUR LE SCHÉMA » (outil perso)
     Toutes les étiquettes doivent être placées, puis « Valider ».
     Plusieurs exemplaires possibles dans une page (aucun état global).
     ============================================================ */
  function monterDonnees(zone, d, api) {
    const box = el('div', 'schm-exo');
    box.innerHTML = `<div class="schm-palette"><p class="schm-palette-t">Données de l'énoncé <span>· fais-les glisser sur le schéma, ou touche une étiquette puis une case</span></p>
        <div class="schm-palette-liste">${melanger(d.etiquettes).map(e => `<button type="button" class="schm-chip" data-id="${e.id}"><span>${e.label}</span></button>`).join('')}</div></div>
      ${schema(d.schema)}`;
    zone.appendChild(box);
    const palette = box.querySelector('.schm-palette-liste');
    const chips = Array.from(box.querySelectorAll('.schm-chip'));
    const slots = Array.from(box.querySelectorAll('.schm-slot'));
    const etiq = id => d.etiquettes.find(e => e.id === id);
    const act = el('div', 'er-actions schm-actions', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(act);
    const bVal = act.querySelector('button');
    let choisie = null, fini = false;

    function choisir(c) {
      if (choisie) choisie.classList.remove('schm-choisie');
      choisie = c;
      if (c) c.classList.add('schm-choisie');
      box.classList.toggle('schm-en-choix', !!c);
    }
    function remettrePh(s) {
      if (s && s.classList.contains('schm-slot') && !s.querySelector('.schm-chip') && !s.querySelector('.schm-slot-ph')) s.insertAdjacentHTML('afterbegin', '<span class="schm-slot-ph">?</span>');
    }
    // place une étiquette dans une case (l'occupante retourne dans la palette) ou dans la palette
    function placer(c, cible) {
      const ancien = c.parentElement;
      if (cible === ancien) return;
      if (cible.classList.contains('schm-slot')) {
        const occ = cible.querySelector('.schm-chip');
        if (occ) palette.appendChild(occ);
        const ph = cible.querySelector('.schm-slot-ph');
        if (ph) ph.remove();
        cible.appendChild(c);
      } else palette.appendChild(c);
      remettrePh(ancien);
      slots.forEach(s => s.classList.remove('ok', 'ko'));
      box.querySelector('.schm-palette').classList.toggle('vide', !palette.querySelector('.schm-chip'));
      api.effacer();
    }
    chips.forEach(c => {
      let x0 = 0, y0 = 0;
      c.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; }, true);
      window.DragDrop.enable(c, {
        zoneSelector: '.schm-slot, .schm-palette',
        dragOverClass: 'schm-over',
        onStart: debutDefil,
        onCancel: finDefil,
        onDrop: (item, z, e) => {
          finDefil();
          if (fini) return;
          // simple appui (sans glisser) : sélection, ou dépôt de l'étiquette déjà choisie dans cette case
          if (Math.hypot(e.clientX - x0, e.clientY - y0) < 8) {
            if (choisie === item) { choisir(null); return; }
            if (choisie && item.parentElement.classList.contains('schm-slot')) { placer(choisie, item.parentElement); choisir(null); return; }
            choisir(item);
            return;
          }
          choisir(null);
          if (!z || !box.contains(z)) return;
          placer(item, z.classList.contains('schm-palette') ? palette : z);
        },
      });
      // clavier (Entrée, Espace) : sélection
      c.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && !fini) { e.preventDefault(); choisir(choisie === c ? null : c); }
      });
    });
    slots.forEach(s => {
      s.addEventListener('click', e => {
        if (fini || !choisie || e.target.closest('.schm-chip')) return;
        placer(choisie, s); choisir(null);
      });
      s.tabIndex = 0;
      s.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === s && choisie && !fini) { e.preventDefault(); placer(choisie, s); choisir(null); }
      });
    });
    box.querySelector('.schm-palette').addEventListener('click', e => {
      if (fini || !choisie || e.target.closest('.schm-chip')) return;
      placer(choisie, palette); choisir(null);
    });

    function terminer() {
      fini = true;
      choisir(null);
      chips.forEach(c => { c.style.pointerEvents = 'none'; c.tabIndex = -1; });
      slots.forEach(s => { s.tabIndex = -1; });
      box.classList.add('schm-fini');
      act.remove();
    }
    bVal.onclick = () => {
      if (fini || api.fini()) return;
      const reste = palette.querySelectorAll('.schm-chip').length;
      if (reste) {
        secouer(box.querySelector('.schm-palette'));
        api.message(`Place toutes les données sur le schéma (il en reste ${reste}).`);
        return;
      }
      const fausses = [];
      chips.forEach(c => {
        const s = c.parentElement, ok = s.dataset.slot === etiq(c.dataset.id).cible;
        s.classList.toggle('ok', ok); s.classList.toggle('ko', !ok);
        if (!ok) fausses.push(c);
      });
      if (!fausses.length) { terminer(); api.reussi(); return; }
      const indices = fausses.map(c => etiq(c.dataset.id).indice).filter(Boolean);
      api.erreur(`${fausses.length > 1 ? `${fausses.length} données sont mal placées` : 'Une donnée est mal placée'} (case rouge).` +
        (indices.length ? '<br>' + indices.map(t => '☛ ' + t).join('<br>') : ''));
      secouer(box.querySelector('.schm-schema') || box);
    };
    return {
      montrer() {
        chips.forEach(c => {
          const s = slots.find(x => x.dataset.slot === etiq(c.dataset.id).cible);
          placer(c, s);
          s.classList.add('ok');
        });
        terminer();
      },
    };
  }
  const partieDonnees = (d, opts) => Object.assign({ type: 'perso', outil: 'schema', def: d, monter: (z, api) => monterDonnees(z, d, api) }, opts);

  /* ============================================================
     PARTIE « RELATION STŒCHIOMÉTRIQUE UTILE » (choix)
     o : mêmes options que le schéma (especes, depart.k, cible.k)
     ============================================================ */
  function choixRelation(o, opts) {
    const A = o.especes[o.depart.k], B = o.especes[o.cible.k];
    const a = A.coef, b = B.coef;
    const rel = (x, y) => `${frac(nDe(A.f), x)} = ${frac(nDe(B.f), y)}`;
    const cands = [{ id: 'ok', x: a, y: b }, { id: 'inv', x: b, y: a }, { id: 'egal', x: 1, y: 1 }];
    if (a === b) cands.push({ id: 'double', x: 1, y: 2 }, { id: 'demi', x: 2, y: 1 });
    // pas deux fois la même relation (ex. : a = b rend « inversée » identique à la bonne)
    const vus = new Set(), options = [];
    cands.forEach(c => {
      const cle = c.x / c.y;
      if (vus.has(cle)) return;
      vus.add(cle);
      options.push({ id: c.id, label: rel(c.x, c.y) });
    });
    const conclusion = b === a ? `${nDe(B.f)} = ${nDe(A.f)}` : `${nDe(B.f)} = ${b === 1 ? '' : b + ' × '}${nDe(A.f)}${a === 1 ? '' : ' / ' + a}`;
    return Object.assign({
      type: 'choix', colonne: true, melanger: true,
      q: `Quelle relation stœchiométrique relie ${nDe(A.f)} et ${nDe(B.f)} ?`,
      options, bonne: 'ok',
      indices: {
        inv: `Tu as inversé les nombres stœchiométriques : chaque quantité de matière est divisée par <b>son propre</b> nombre stœchiométrique, celui écrit devant l'espèce dans l'équation (${a} devant ${A.f}, ${b} devant ${B.f}).`,
        egal: `Les nombres stœchiométriques ne sont pas tous égaux à 1 : il y a ${a} devant ${A.f} et ${b} devant ${B.f} dans l'équation.`,
        double: `Lis les nombres stœchiométriques dans l'équation : ${a} devant ${A.f} et ${b} devant ${B.f}.`,
        demi: `Lis les nombres stœchiométriques dans l'équation : ${a} devant ${A.f} et ${b} devant ${B.f}.`,
      },
      solution: `<p>${rel(a, b)}, avec les nombres stœchiométriques de l'équation ; donc <b>${conclusion}</b>.</p>`,
    }, opts);
  }

  window.SCHM = { schema, partieDonnees, monterDonnees, choixRelation, frac, n: nDe, texte };
  window.schemaMethode = schema;
})();
