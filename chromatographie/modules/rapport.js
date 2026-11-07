/* ============================================================
   Module 2, pour aller plus loin : « Le rapport frontal »
   (application « Chromatographie sur couche mince », page module_2_rf)

   CC.pageRf({ mesurer, comparer, identifier, fin })
       les trois parties de la page, affichées l'une après l'autre (chacune
       dans sa carte, qui apparaît quand la précédente est réussie) ; à la fin,
       la page est faite (SOM.marquer) et la carte fin s'affiche
   CC.mesurerRf(zone, onFini)      deux plaques, même espèce, élutions différentes :
                                   mesurer h et H à la règle, calculer R_f (le même)
   CC.comparerRf(zone, onFini)     même espèce ? comparer les R_f de deux taches
                                   de plaques différentes (même éluant)
   CC.identifierRf(zone, onFini)   mesurer R_f et trouver l'espèce dans une table
   Toutes les plaques mesurent HP = 10 cm ; chaque cas donne H, la hauteur
   où le front est monté, mesurée comme h depuis le trait de dépôt (à 1 cm
   du bas de la plaque).
   Utilise CCM (ccm.js), CC.lire, CC.fmt, CC.melanger, CC.defiler (cc.js).
   ============================================================ */
(function () {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const RF = 'R<sub>f</sub>';
  const pres = (a, b, t) => Math.abs(a - b) <= t + 1e-9;
  const ko = d => `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${d}</p></div>`;
  const ok = (t, d) => `<div class="callout-success er-retour"><p><b class="er-ok">${t}</b> ${d}</p></div>`;
  const cm = v => CC.fmt(v, 1);
  const HP = 10;                                       // hauteur de toutes les plaques (cm)
  const hDe = (esp, H) => Math.round(CCM.hauteur(esp) * H * 10) / 10;   // hauteur de la tache au-dessus du trait (cm)

  /* ============================================================
     PLAQUE AVEC UNE RÈGLE GRADUÉE GLISSABLE (▲ ▼ : au mm)
     ============================================================ */
  const blocRegle = () => `<div class="cc-fig cc-rf-fig"></div>
    <div class="cc-outil-b"><button type="button" class="btn-secondary cc-fl" data-a="+" aria-label="Monter la règle d'un millimètre">▲</button><button type="button" class="btn-secondary cc-fl" data-a="-" aria-label="Descendre la règle d'un millimètre">▼</button><span class="cc-val-t">règle : glisse-la, ou règle-la au mm</span></div>`;
  // bloc : contient blocRegle() ; P = { H (front au-dessus du trait, cm), depots, aria }
  function plaqueRegle(bloc, P) {
    let zero = 0;                                       // position du 0 de la règle (cm depuis le bas de la plaque)
    const La = 2.4, lg = HP;
    const pl = CCM.plaque(bloc.querySelector('.cc-rf-fig'), {
      depots: P.depots, largeur: La, hauteur: HP, front: 1 + P.H, frontTrait: 1 + P.H, echelle: 32, marges: { d: 1.5 }, aria: P.aria,
      calque(g) {
        const k = g.k, x = g.px(La) + .2 * k, y0 = g.py(zero);
        let s = `<rect class="ccm-regle" x="${x}" y="${y0 - lg * k}" width="${1.05 * k}" height="${lg * k + 3}" rx="3"/>`;
        for (let mm = 0; mm <= lg * 10; mm++) {
          const y = y0 - mm / 10 * k, l = mm % 10 === 0 ? .42 : mm % 5 === 0 ? .3 : .17;
          s += `<line class="ccm-grad" x1="${x}" y1="${y}" x2="${x + l * k}" y2="${y}"/>`;
          if (mm % 10 === 0) s += `<text class="ccm-grad-t" x="${x + .72 * k}" y="${y + .13 * k}" font-size="${.34 * k}">${mm / 10}</text>`;
        }
        return s;
      },
      // poignée persistante de la règle (jamais redessinée pendant le glisser)
      fixe(g, gr) {
        if (!gr.firstChild) { const r = document.createElementNS(NS, 'rect'); r.setAttribute('class', 'ccm-poignee'); gr.appendChild(r); }
        const k = g.k, x = g.px(La) + .2 * k, y0 = g.py(zero), r = gr.firstChild;
        r.setAttribute('x', x - .2 * k); r.setAttribute('y', y0 - lg * k); r.setAttribute('width', 1.45 * k); r.setAttribute('height', lg * k);
      },
    });
    const maj = () => pl.maj({});
    // glisser la règle verticalement
    let dep = null;
    pl.svg.addEventListener('pointerdown', ev => {
      if (!(ev.target.closest && ev.target.closest('.ccm-poignee'))) return;
      dep = { y: pl.versPlaque(ev).y, z: zero };
      try { pl.svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignoré */ }
      ev.preventDefault();
    });
    pl.svg.addEventListener('pointermove', ev => {
      if (!dep) return;
      zero = Math.min(2, Math.max(0, Math.round((dep.z + pl.versPlaque(ev).y - dep.y) * 10) / 10));
      maj();
    });
    const lacher = () => { dep = null; };
    pl.svg.addEventListener('pointerup', lacher);
    pl.svg.addEventListener('pointercancel', lacher);
    bloc.querySelector('[data-a="+"]').onclick = () => { zero = Math.min(2, Math.round((zero + .1) * 10) / 10); maj(); };
    bloc.querySelector('[data-a="-"]').onclick = () => { zero = Math.max(0, Math.round((zero - .1) * 10) / 10); maj(); };
    return pl;
  }

  // cases h, H et R_f
  const champs = n => `<div class="cc-rf-champs">
      <label class="cc-rf-c"><span>h =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="h en cm, ${n}" data-c="h"><span>cm</span></label>
      <label class="cc-rf-c"><span>H =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="H en cm, ${n}" data-c="H"><span>cm</span></label>
      <label class="cc-rf-c"><span>${RF} =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Rapport frontal, ${n}" data-c="rf"></label>
    </div>`;
  // vérifie les mesures et le calcul ; hv, Hv : valeurs justes (cm)
  function verifierMesure(bloc, hv, Hv) {
    const champ = c => CC.lire(bloc.querySelector(`[data-c="${c}"]`).value);
    const h = champ('h'), H = champ('H'), rf = champ('rf');
    if ([h, H, rf].some(isNaN)) return { msg: 'Écris un nombre dans chaque case (avec une virgule si besoin).' };
    if (pres(h, hv + 1, .1) || pres(H, Hv + 1, .1)) return { diag: 'Les hauteurs se mesurent à partir du trait de dépôt, d\'où partent les espèces.' };
    if (!pres(h, hv, .1)) return { diag: 'Mesure h de nouveau : mets le 0 de la règle sur le trait de dépôt, puis lis la hauteur du centre de la tache.' };
    if (!pres(H, Hv, .1)) return { diag: 'Mesure H de nouveau : mets le 0 de la règle sur le trait de dépôt, puis lis la hauteur du trait du front.' };
    if (pres(rf, H / h, .02)) return { diag: `${RF} = h / H : la hauteur de la tache divisée par celle du front (${RF} est plus petit que 1).` };
    if (!pres(rf, h / H, .015)) return { diag: `Calcule ${RF} = h / H avec tes mesures, arrondi au centième.` };
    return { ok: true, rf: h / H };
  }
  const bloquer = bloc => bloc.querySelectorAll('input, button').forEach(x => { x.disabled = true; });

  /* ============================================================
     1. MESURER LE RAPPORT FRONTAL : même espèce, élutions différentes
     ============================================================ */
  const PLAQUES = [{ H: 5 }, { H: 7.5 }];
  function mesurerRf(zone, onFini) {
    zone.innerHTML = `<div class="cc-rf">${PLAQUES.map((P, i) => `<div class="cc-rf-p" data-i="${i}">
        <p class="cc-rf-t">Plaque ${i + 1}</p>${blocRegle()}${champs('plaque ' + (i + 1))}
        <div class="er-actions"><button type="button" class="btn-primary" data-a="ver">Vérifier</button></div>
        <div class="cc-rf-retour" aria-live="polite"></div></div>`).join('')}</div>
      <div class="cc-rf-bilan" aria-live="polite"></div>`;
    const reussies = new Set();
    zone.querySelectorAll('.cc-rf-p').forEach(bloc => {
      const i = +bloc.dataset.i, P = PLAQUES[i], Hv = P.H, hv = hDe('F', P.H);
      plaqueRegle(bloc, { H: P.H, depots: [{ nom: 'F', especes: ['F'] }], aria: `Plaque ${i + 1} : une tache F et le front de l'éluant ; une règle graduée en mm à droite` });
      const ret = bloc.querySelector('.cc-rf-retour');
      bloc.querySelector('[data-a="ver"]').onclick = () => {
        const r = verifierMesure(bloc, hv, Hv);
        if (r.msg) { ret.innerHTML = `<p class="ph-msg">${r.msg}</p>`; return; }
        if (r.diag) { ret.innerHTML = ko(r.diag); return; }
        ret.innerHTML = ok('Juste !', `${RF} = ${cm(hv)} / ${cm(Hv)} = ${CC.fmt(hv / Hv, 2)}.`);
        bloquer(bloc);
        reussies.add(i);
        if (reussies.size === PLAQUES.length) {
          zone.querySelector('.cc-rf-bilan').innerHTML = ok(`Même ${RF} sur les deux plaques.`, `Le front n'est pas monté aussi haut, mais pour la même espèce, avec le même éluant, ${RF} = h / H ne change pas : on peut comparer des taches de plaques différentes.`);
          onFini();
        }
      };
    });
  }

  /* ============================================================
     2. MÊME ESPÈCE ? Deux taches X et Y sur deux plaques (même éluant)
     ============================================================ */
  const CAS = [
    { p: [{ H: 6, esp: 'aspirine' }, { H: 8, esp: 'aspirine' }] },   // 3,0 / 6,0 et 4,0 / 8,0 : 0,50 et 0,50
    { p: [{ H: 6, esp: 'aspirine' }, { H: 7.5, esp: 'e5' }] },        // 3,0 / 6,0 et 3,0 / 7,5 : même hauteur, 0,50 et 0,40
    { p: [{ H: 5, esp: 'e1' }, { H: 7.5, esp: 'e1' }] },        // 4,0 / 5,0 et 6,0 / 7,5 : 0,80 et 0,80
  ];
  const NOMS = ['X', 'Y'];
  // flèche de cote verticale (de ya à yb, unités SVG)
  function fleche(x, ya, yb, k) {
    const a = .16 * k, s = yb < ya ? 1 : -1;
    return `<line class="cc-cote" x1="${x}" y1="${ya}" x2="${x}" y2="${yb}"/>
      <polygon class="cc-cote-p" points="${x},${ya} ${x - a / 2.4},${ya - s * a} ${x + a / 2.4},${ya - s * a}"/>
      <polygon class="cc-cote-p" points="${x},${yb} ${x - a / 2.4},${yb + s * a} ${x + a / 2.4},${yb + s * a}"/>`;
  }
  // plaque avec les cotes h (trait → tache) et H (trait → front)
  function plaqueCotee(fig, nom, P) {
    const La = 1.6, H = P.H, h = hDe(P.esp, H);
    CCM.plaque(fig, {
      depots: [{ nom, especes: [P.esp] }], largeur: La, hauteur: HP, front: 1 + H, frontTrait: 1 + H, echelle: 26, marges: { d: 2 },
      aria: `Plaque de la tache ${nom} : h = ${cm(h)} cm, H = ${cm(H)} cm`,
      calque(g) {
        const k = g.k, xp = g.px(La), y0 = g.py(1), yh = g.py(1 + h), yH = g.py(1 + H), x1 = xp + .5 * k, x2 = xp + 1.25 * k;
        return `<line class="cc-cote-rappel" x1="${g.px(La / 2) + .3 * k}" y1="${yh}" x2="${x1 + .2 * k}" y2="${yh}"/>
          <line class="cc-cote-rappel" x1="${xp}" y1="${y0}" x2="${x2 + .2 * k}" y2="${y0}"/>
          <line class="cc-cote-rappel" x1="${xp}" y1="${yH}" x2="${x2 + .2 * k}" y2="${yH}"/>
          ${fleche(x1, y0, yh, k)}${fleche(x2, y0, yH, k)}
          <text class="cc-cote-t" x="${x1 + .2 * k}" y="${(y0 + yh) / 2 + .18 * k}" font-size="${.5 * k}">h</text>
          <text class="cc-cote-t" x="${x2 + .2 * k}" y="${(y0 + yH) / 2 + .18 * k}" font-size="${.5 * k}">H</text>`;
      },
    });
    return { h, H };
  }
  function comparerRf(zone, onFini) {
    let i = 0;
    function afficher() {
      const C = CAS[i];
      zone.innerHTML = `<p class="cc-sit-num">Cas ${i + 1} / ${CAS.length}</p>
        <div class="cc-cmp">${C.p.map(() => `<div class="cc-cmp-p"><div class="cc-fig cc-cmp-fig"></div><p class="cc-cmp-v"></p></div>`).join('')}</div>
        <p class="cc-q-t">Les deux plaques ont été éluées avec le même éluant, mais pas aussi longtemps. Calcule ${RF} = h / H pour chaque tache : les taches X et Y sont-elles dues à la même espèce ?</p>
        <div class="ph-choix ph-choix-col"></div><div class="cc-rf-retour" aria-live="polite"></div>`;
      const m = C.p.map((P, j) => {
        const b = zone.querySelectorAll('.cc-cmp-p')[j], v = plaqueCotee(b.querySelector('.cc-cmp-fig'), NOMS[j], P);
        b.querySelector('.cc-cmp-v').innerHTML = `Tache <b>${NOMS[j]}</b> : h = ${cm(v.h)} cm ; H = ${cm(v.H)} cm`;
        return Object.assign(v, { rf: v.h / v.H });
      });
      const meme = pres(m[0].rf, m[1].rf, .005), hMeme = pres(m[0].h, m[1].h, .01);
      const calc = `${RF}(X) = ${cm(m[0].h)} / ${cm(m[0].H)} = ${CC.fmt(m[0].rf, 2)} et ${RF}(Y) = ${cm(m[1].h)} / ${cm(m[1].H)} = ${CC.fmt(m[1].rf, 2)}`;
      const options = [
        { id: 'egal', label: `Oui : elles ont le même ${RF}.` },
        { id: 'diff', label: `Non : leurs ${RF} sont différents.` },
        hMeme ? { id: 'h', label: 'Oui : elles sont à la même hauteur.' } : { id: 'h', label: 'Non : elles ne sont pas à la même hauteur.' },
      ];
      const bonne = meme ? 'egal' : 'diff';
      const indice = {
        h: `Les fronts ne sont pas montés aussi haut : on ne compare pas les hauteurs des taches de deux plaques différentes, mais leurs ${RF} = h / H.`,
        egal: `Calcule ${RF} = h / H pour chaque tache : les deux ${RF} ne sont pas égaux.`,
        diff: `Calcule ${RF} = h / H pour chaque tache : les deux ${RF} sont égaux.`,
      };
      const box = zone.querySelector('.ph-choix'), ret = zone.querySelector('.cc-rf-retour');
      CC.melanger(options).forEach(o => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-secondary'; b.innerHTML = o.label;
        box.appendChild(b);
        b.onclick = () => {
          if (o.id !== bonne) { b.classList.add('faux'); b.disabled = true; ret.innerHTML = ko(indice[o.id]); return; }
          b.classList.add('juste');
          box.querySelectorAll('button').forEach(x => { x.disabled = true; });
          const der = i === CAS.length - 1;
          ret.innerHTML = ok('Juste !', `${calc} : ${meme ? `même ${RF} avec le même éluant, c'est la même espèce` : `${RF} différents, ce sont deux espèces différentes`}${!meme && hMeme ? ', bien qu\'elles soient à la même hauteur' : ''}.`)
            + (der ? ok('Bien vu.', `Avec le même éluant, deux taches de plaques différentes sont dues à la même espèce quand elles ont le même ${RF}, même si elles ne sont pas à la même hauteur.`)
              : '<div class="er-actions"><button type="button" class="btn-primary" data-a="suite">Cas suivant →</button></div>');
          if (der) { onFini(); return; }
          const s = ret.querySelector('[data-a="suite"]');
          s.onclick = () => { i++; afficher(); CC.defiler(zone); };
          CC.defiler(s);
        };
      });
    }
    afficher();
  }

  /* ============================================================
     3. IDENTIFIER UNE ESPÈCE AVEC UNE TABLE DE R_f (même éluant)
     ============================================================ */
  const TABLE = ['menthol', 'citral', 'eucalyptol', 'carvone', 'menthone', 'limonene'];
  const CAS_ID = [{ nom: 'S', H: 6, esp: 'eucalyptol' }, { nom: 'T', H: 7, esp: 'menthone' }];
  const rfTable = id => Math.round(CCM.hauteur(id) * 100) / 100;
  function identifierRf(zone, onFini) {
    let i = 0;
    function afficher() {
      const C = CAS_ID[i], Hv = C.H, hv = hDe(C.esp, C.H);
      zone.innerHTML = `<p class="cc-sit-num">Espèce ${i + 1} / ${CAS_ID.length}</p>
        <div class="cc-rf">
          <div class="cc-rf-p">${blocRegle()}</div>
          <div class="cc-rf-p">
            <p class="cc-q-t">Une espèce ${C.nom}, extraite d'une plante, a été éluée avec le même éluant que celui de la table. Mesure h et H, calcule ${RF}, puis trouve l'espèce dans la table.</p>
            ${champs('espèce ' + C.nom)}
            <div class="er-actions"><button type="button" class="btn-primary" data-a="ver">Vérifier</button></div>
            <div class="cc-rf-retour" aria-live="polite"></div>
            <div class="cc-table-rf" hidden>
              <p class="cc-pioche-t">Table des ${RF} (même éluant) : touche l'espèce ${C.nom}</p>
              <div class="cc-table-l">${TABLE.map(id => `<button type="button" class="btn-secondary cc-table-b" data-id="${id}"><span>${CCM.ESPECES[id].nom}</span><b>${CC.fmt(rfTable(id), 2)}</b></button>`).join('')}</div>
              <div class="cc-table-retour" aria-live="polite"></div>
            </div>
          </div>
        </div>`;
      const blocG = zone.querySelectorAll('.cc-rf-p')[0], bloc = zone.querySelectorAll('.cc-rf-p')[1];
      plaqueRegle(blocG, { H: C.H, depots: [{ nom: C.nom, especes: [C.esp] }], aria: `Plaque de l'espèce ${C.nom} : une tache et le front de l'éluant ; une règle graduée en mm à droite` });
      const ret = bloc.querySelector('.cc-rf-retour'), table = bloc.querySelector('.cc-table-rf'), retT = bloc.querySelector('.cc-table-retour');
      bloc.querySelector('[data-a="ver"]').onclick = () => {
        const r = verifierMesure(bloc, hv, Hv);
        if (r.msg) { ret.innerHTML = `<p class="ph-msg">${r.msg}</p>`; return; }
        if (r.diag) { ret.innerHTML = ko(r.diag); return; }
        ret.innerHTML = ok('Juste !', `${RF} = ${cm(hv)} / ${cm(Hv)} = ${CC.fmt(hv / Hv, 2)}. Cherche cette valeur dans la table.`);
        bloquer(blocG); bloquer(bloc.querySelector('.cc-rf-champs')); bloc.querySelector('[data-a="ver"]').disabled = true;
        table.hidden = false;
        CC.defiler(table);
      };
      table.querySelectorAll('.cc-table-b').forEach(b => {
        b.onclick = () => {
          const id = b.dataset.id;
          if (id !== C.esp) {
            b.classList.add('faux'); b.disabled = true;
            retT.innerHTML = ko(`Le ${RF} ${CCM.ESPECES[id].du} est ${CC.fmt(rfTable(id), 2)} : cherche l'espèce dont le ${RF} est égal à ta mesure, ${CC.fmt(hv / Hv, 2)}.`);
            return;
          }
          b.classList.add('juste');
          table.querySelectorAll('.cc-table-b').forEach(x => { x.disabled = true; });
          const der = i === CAS_ID.length - 1, E = CCM.ESPECES[C.esp];
          retT.innerHTML = ok('Juste !', `${RF} = ${CC.fmt(hv / Hv, 2)}, comme ${E.le} dans la table : l'espèce ${C.nom} est ${E.le}.`)
            + (der ? '' : '<div class="er-actions"><button type="button" class="btn-primary" data-a="suite">Espèce suivante →</button></div>');
          if (der) { onFini(); return; }
          const s = retT.querySelector('[data-a="suite"]');
          s.onclick = () => { i++; afficher(); CC.defiler(zone); };
          CC.defiler(s);
        };
      });
    }
    afficher();
  }

  /* ---------- la page ---------- */
  // les parties apparaissent l'une après l'autre (carte de la partie suivante cachée jusque-là)
  function pageRf(z) {
    const carte = e => e.closest('.er-card') || e;
    const montrer = e => { carte(e).hidden = false; setTimeout(() => carte(e).scrollIntoView({ behavior: 'smooth', block: 'start' }), 900); };
    [z.comparer, z.identifier, z.fin].forEach(e => { carte(e).hidden = true; });
    mesurerRf(z.mesurer, () => { montrer(z.comparer); comparerRf(z.comparer, () => {
      montrer(z.identifier); identifierRf(z.identifier, () => { SOM.marquer({ fait: true }); montrer(z.fin); });
    }); });
  }

  window.CC = Object.assign(window.CC || {}, { pageRf, mesurerRf, comparerRf, identifierRf });
})();
