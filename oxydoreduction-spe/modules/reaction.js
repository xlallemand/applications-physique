/* ============================================================
   Écrire l'équation d'une réaction d'oxydoréduction
   (application Oxydoréduction, 1re et terminale spécialité)

     REAC.reaction(a, b)      calculs : a est le couple dont l'oxydant réagit,
                              b celui dont le réducteur réagit ; renvoie
                              { A, B (demi-équations), nA, nB (électrons), L, mA, mB
                                (multiplicateurs), somme, finale (termes), html (équation) }
     REAC.ecrire(T, signe)    écriture HTML d'une équation (termes { f, cote, coef })

   Parties « perso » (cours : assets/cours.js ; séries : OX.question),
   o = { a, b, aides, serie } (aides : 'ouvertes', 'libre', 'payant', 'aucune') :
     REAC.partieOrienter(o)     inverser la demi-équation qui doit l'être (réactif à gauche)
     REAC.partieMultiplier(o)   multiplier pour égaliser les électrons
     REAC.partieAdditionner(o)  o.mode 'simplifier' : la somme est écrite, on touche les espèces
                                présentes des deux côtés pour les simplifier ;
                                'coefficients' : on règle les nombres de l'équation finale
     REAC.parties(o)            toute la méthode : les deux demi-équations (outil DEMI) puis
                                les trois parties ci-dessus ; o.niveau 1 (aides libres),
                                2 (aides payantes), 3 (sans aide, demi-équations en mode libre)

   Aides : réactifs repérés (orienter), électrons échangés par chaque
   demi-équation (multiplier), espèces présentes des deux côtés
   (simplifier), atomes et charges de chaque côté (coefficients).
   En aides payantes, la première ouverture compte comme une erreur
   (la question ne rapporte plus qu'un point au plus).
   Dépend de assets/molecules.js, ox.js (OX) et demi.js (DEMI).
   ============================================================ */
(function () {
  'use strict';
  const { E, EAU, HP, pgcd, q, atomes, charges, fq, kf, html } = window.DEMI.outils;
  const { el, secouer, boutonValider, couple } = window.OX;
  const { selecteur } = window.MOL;
  const ppcm = (a, b) => a * b / pgcd(a, b);
  const s = n => (n > 1 ? 's' : '');
  const elec = n => `${n}&nbsp;e<sup>−</sup>`;

  /* ============================================================
     CALCULS
     ============================================================ */
  // ordre d'écriture : espèces du couple a, du couple b, puis H+, H2O et e−
  const rang = t => (t.f === E ? 4 : t.f === EAU && t.role !== 'red' && t.role !== 'ox' ? 3 : t.f === HP && t.role !== 'ox' ? 2 : t.de === 'b' ? 1 : 0);
  const trier = T => T.slice().sort((x, y) => rang(x) - rang(y));
  function ecrire(T, signe) {
    const m = c => trier(T.filter(t => t.cote === c)).map(t => kf(t.coef, t.f)).join(' + ');
    return `${m('g')} ${signe || '→'} ${m('d')}`;
  }
  const nbE = T => T.filter(t => t.f === E).reduce((x, t) => x + t.coef, 0);
  const inverser = T => T.map(t => Object.assign({}, t, { cote: t.cote === 'g' ? 'd' : 'g' }));
  const multiplier = (T, m) => T.map(t => Object.assign({}, t, { coef: t.coef * m }));

  function reaction(a, b) {
    const A = window.DEMI.solution(a).etapes[3].map(t => Object.assign({}, t, { de: 'a' }));
    const B = window.DEMI.solution(b).etapes[3].map(t => Object.assign({}, t, { de: 'b' }));
    const nA = nbE(A), nB = nbE(B), L = ppcm(nA, nB), mA = L / nA, mB = L / nB;
    // somme membre à membre : A dans son sens (réduction), B inversée (oxydation)
    const somme = [];
    multiplier(A, mA).concat(multiplier(inverser(B), mB)).forEach(t => {
      const u = somme.find(x => x.f === t.f && x.cote === t.cote);
      if (u) u.coef += t.coef; else somme.push(Object.assign({}, t));
    });
    // simplification de ce qui figure des deux côtés (électrons, H+, H2O)
    let finale = somme.map(t => Object.assign({}, t));
    finale.forEach(t => {
      const u = finale.find(x => x !== t && x.f === t.f && x.cote !== t.cote);
      if (u && t.coef && u.coef) { const m = Math.min(t.coef, u.coef); t.coef -= m; u.coef -= m; }
    });
    finale = finale.filter(t => t.coef > 0);
    const g = finale.reduce((x, t) => pgcd(x, t.coef), 0);
    finale.forEach(t => { t.coef /= g; });
    return { a, b, A, B, nA, nB, L, mA, mB, somme, finale, html: ecrire(finale) };
  }

  /* ============================================================
     AIDES DES PARTIES (bouton commun)
     ============================================================ */
  // bouton « Afficher les aides » : mode 'ouvertes' (affichées), 'libre', 'payant' (une erreur comptée), 'aucune'
  function aides(zone, o, api, maj) {
    const mode = o.aides || 'libre';
    const etat = { ouvert: mode === 'ouvertes', vu: mode === 'ouvertes' };
    if (mode === 'aucune') return etat;
    const b = el('button', 'btn-small ox-rx-b-aides');
    b.type = 'button';
    zone.appendChild(b);
    const libelle = () => {
      b.textContent = etat.ouvert ? 'Masquer les aides' : mode === 'payant' && !etat.vu ? 'Afficher les aides (1 point de moins)' : 'Afficher les aides';
      b.setAttribute('aria-expanded', String(etat.ouvert));
    };
    b.onclick = () => {
      if (api.fini()) return;
      etat.ouvert = !etat.ouvert;
      if (etat.ouvert && !etat.vu) { etat.vu = true; if (mode === 'payant' && o.serie) api.compterErreur(); }
      libelle(); maj();
    };
    libelle();
    return etat;
  }

  /* ============================================================
     ORIENTER : la demi-équation du réactif oxydant reste dans son sens,
     celle du réactif réducteur est inversée (le réactif à gauche)
     ============================================================ */
  function partieOrienter(o) {
    const r = reaction(o.a, o.b);
    return {
      type: 'perso', outil: 'orienter', o,
      q: o.q || `Oriente les deux demi-équations : chaque réactif (${html(o.a.ox)} et ${html(o.b.red)}) doit être à gauche de la flèche.`,
      solution: o.solution != null ? o.solution
        : `<p class="ox-eqn">${ecrire(r.A)} &nbsp;(réduction)</p><p class="ox-eqn">${ecrire(inverser(r.B))} &nbsp;(oxydation)</p>
          <p>${html(o.a.ox)} capte des électrons : on garde sa demi-équation dans son sens. ${html(o.b.red)} cède des électrons : on inverse la sienne.</p>`,
      monter(zone, api) {
        const lignes = [{ k: 'A', T: r.A, inv: false, bon: false }, { k: 'B', T: r.B, inv: false, bon: true }];
        if (o.ordre === 'ba') lignes.reverse();
        const box = el('div', 'ox-rx');
        zone.appendChild(box);
        let fini = false;
        const reactif = f => f === o.a.ox || f === o.b.red;
        // demi-équation écrite dans le sens choisi, réactifs repérés si les aides sont affichées
        function ecr(L) {
          const T = L.inv ? inverser(L.T) : L.T;
          const m = c => T.filter(t => t.cote === c).sort((x, y) => rang(x) - rang(y))
            .map(t => (ai.ouvert && reactif(t.f) ? `<span class="ox-r">${kf(t.coef, t.f)}</span>` : kf(t.coef, t.f))).join(' + ');
          return `${m('g')} → ${m('d')}`;
        }
        function rendre() {
          box.innerHTML = lignes.map((L, i) => `<div class="ox-rx-l"><div class="ox-rx-eq ox-eqn">${ecr(L)}</div>
            ${fini ? `<span class="ox-rx-nom">${L.k === 'A' ? 'réduction' : 'oxydation'}</span>` : `<button type="button" class="btn-small ox-inv" data-i="${i}" aria-label="Inverser la demi-équation ${i + 1}">⇄ Inverser</button>`}</div>`).join('') +
            (ai.ouvert && !fini ? '<p class="ox-rx-aide">☛ Les réactifs sont surlignés : chacun doit se trouver <b>à gauche</b> de la flèche.</p>' : '');
          box.querySelectorAll('.ox-inv').forEach(b => { b.onclick = () => { if (fini) return; lignes[+b.dataset.i].inv = !lignes[+b.dataset.i].inv; api.effacer(); rendre(); }; });
        }
        const bVal = boutonValider(zone);
        const ai = aides(bVal.parentElement, o, api, rendre);
        function terminer() { fini = true; bVal.fermer(); rendre(); }
        bVal.onclick = () => {
          if (api.fini()) return;
          const lA = lignes.find(L => L.k === 'A'), lB = lignes.find(L => L.k === 'B');
          if (!lA.inv && lB.inv) { terminer(); api.reussi(); return; }
          let m;
          if (lA.inv && !lB.inv) m = `Les deux demi-équations sont mal orientées : ${html(o.a.ox)} et ${html(o.b.red)} sont tous les deux à droite de la flèche. Les réactifs s'écrivent à gauche.`;
          else if (lA.inv) m = `${html(o.a.ox)} est un réactif : il doit être à gauche de la flèche. Ne retourne pas la demi-équation du couple ${couple(o.a)}.`;
          else m = `${html(o.b.red)} est un réactif, mais il est à droite de la flèche. Inverse la demi-équation du couple ${couple(o.b)} pour l'avoir à gauche.`;
          api.erreur(m);
          secouer(box);
        };
        rendre();
        return { montrer() { lignes.forEach(L => { L.inv = L.bon; }); terminer(); } };
      },
    };
  }

  /* ============================================================
     MULTIPLIER : même nombre d'électrons dans les deux demi-équations
     ============================================================ */
  function partieMultiplier(o) {
    const r = reaction(o.a, o.b);
    const orA = r.A, orB = inverser(r.B);
    return {
      type: 'perso', outil: 'multiplier', o,
      q: o.q || 'Par combien multiplies-tu chaque demi-équation pour qu\'elles échangent le même nombre d\'électrons ? Règle les nombres avec les flèches.',
      solution: o.solution != null ? o.solution
        : `<p>${r.mA} × ${r.nA} = ${r.mB} × ${r.nB} = ${r.L} électrons : on multiplie la demi-équation du couple ${couple(o.a)} par ${r.mA} et celle du couple ${couple(o.b)} par ${r.mB}.</p>`,
      monter(zone, api) {
        const k = { A: 1, B: 1 };
        const box = el('div', 'ox-rx');
        zone.appendChild(box);
        let fini = false;
        const lignes = [{ c: 'A', T: orA, n: r.nA }, { c: 'B', T: orB, n: r.nB }];
        box.innerHTML = lignes.map(L => `<div class="ox-rx-l ox-rx-mult" data-c="${L.c}"><div class="ox-rx-k"></div><span class="ox-rx-x">×</span>
            <div class="ox-rx-eq ox-eqn">( ${ecrire(L.T)} )</div><p class="ox-rx-ne"></p></div>`).join('') + '<p class="ox-rx-aide hidden"></p>';
        const sels = {};
        lignes.forEach(L => {
          const sel = selecteur({ valeur: 1, min: 1, max: 10, label: 'le multiplicateur de la demi-équation', onChange: v => { k[L.c] = v; api.effacer(); maj(); } });
          box.querySelector(`[data-c="${L.c}"] .ox-rx-k`).appendChild(sel.el);
          sels[L.c] = sel;
        });
        // aides : électrons échangés par chaque demi-équation multipliée
        function maj() {
          lignes.forEach(L => {
            const p = box.querySelector(`[data-c="${L.c}"] .ox-rx-ne`);
            p.innerHTML = ai.ouvert || fini ? `${k[L.c]} × ${L.n} = <b>${elec(k[L.c] * L.n)}</b>` : '';
          });
          const a = box.querySelector('.ox-rx-aide'), eA = k.A * r.nA, eB = k.B * r.nB;
          a.classList.toggle('hidden', !ai.ouvert || fini);
          a.innerHTML = eA === eB ? `☛ Les deux demi-équations échangent ${elec(eA)}.` : `☛ ${elec(eA)} d'un côté, ${elec(eB)} de l'autre : il en faut autant.`;
        }
        const bVal = boutonValider(zone);
        const ai = aides(bVal.parentElement, o, api, maj);
        function terminer() { fini = true; Object.values(sels).forEach(x => x.activer(false)); bVal.fermer(); maj(); }
        bVal.onclick = () => {
          if (api.fini()) return;
          const eA = k.A * r.nA, eB = k.B * r.nB;
          if (eA === eB && eA === r.L) { terminer(); api.reussi(); return; }
          let m;
          if (eA === eB) m = `Les électrons sont bien égaux (${eA} de chaque côté), mais prends les plus petits multiplicateurs : ${r.L} électrons suffisent.`;
          else if (k.A === r.mB && k.B === r.mA) m = `Tu as échangé les multiplicateurs : avec tes valeurs, la première demi-équation échange ${elec(eA)} et la seconde ${elec(eB)}.`;
          else m = `Avec tes valeurs, la demi-équation du couple ${couple(o.a)} échange ${elec(eA)} et celle du couple ${couple(o.b)} ${elec(eB)}. Il en faut autant : cherche le plus petit multiple commun de ${r.nA} et ${r.nB}.`;
          api.erreur(m);
          secouer(box);
        };
        maj();
        return { montrer() { k.A = r.mA; k.B = r.mB; sels.A.fixer(r.mA); sels.B.fixer(r.mB); terminer(); } };
      },
    };
  }

  /* ============================================================
     ADDITIONNER
     'simplifier' : la somme membre à membre est écrite ; on touche une espèce
                    présente des deux côtés pour la simplifier (les électrons d'abord)
     'coefficients' : les espèces de l'équation finale sont placées, on règle leurs nombres
     ============================================================ */
  function partieAdditionner(o) {
    const r = reaction(o.a, o.b);
    const mode = o.mode || 'simplifier';
    return {
      type: 'perso', outil: mode, o,
      q: o.q || (mode === 'simplifier'
        ? 'Voici la somme membre à membre des deux demi-équations multipliées. Simplifie : touche une espèce présente des deux côtés de la flèche (les électrons d\'abord).'
        : 'Écris l\'équation de la réaction : règle le nombre stœchiométrique de chaque espèce.'),
      solution: o.solution != null ? o.solution : `<p class="ox-eqn">${r.html}</p>`,
      monter(zone, api) { return mode === 'simplifier' ? simplifier(zone, api) : coefficients(zone, api); },
    };

    function simplifier(zone, api) {
      let T = r.somme.map(t => Object.assign({}, t, { barre: 0 }));      // barre : nombre déjà simplifié
      const box = el('div', 'ox-rx');
      zone.appendChild(box);
      let fini = false;
      const reste = t => t.coef - t.barre;
      const double = t => reste(t) > 0 && T.some(u => u !== t && u.f === t.f && u.cote !== t.cote && reste(u) > 0);
      function terme(t) {
        const r0 = reste(t);
        const txt = t.barre ? (r0 ? `<span class="ox-barre-e">${kf(t.coef, t.f)}</span> ${kf(r0, t.f)}` : `<span class="ox-barre-e">${kf(t.coef, t.f)}</span>`) : kf(t.coef, t.f);
        return `<button type="button" class="ox-ts${ai.ouvert && double(t) && !fini ? ' ox-double' : ''}${r0 ? '' : ' ox-ts-vide'}" data-i="${T.indexOf(t)}"${fini ? ' disabled' : ''}>${txt}</button>`;
      }
      function rendre() {
        const m = c => trier(T.filter(t => t.cote === c)).map(terme).join('<span class="ox-plus">+</span>');
        box.innerHTML = `<div class="ox-rx-somme"><div class="ox-rx-membre">${m('g')}</div><span class="ox-rx-fl">→</span><div class="ox-rx-membre">${m('d')}</div></div>` +
          (ai.ouvert && !fini ? `<p class="ox-rx-aide">☛ ${T.some(double) ? 'Les espèces surlignées figurent des deux côtés de la flèche.' : 'Plus aucune espèce ne figure des deux côtés : valide.'}</p>` : '');
        box.querySelectorAll('.ox-ts').forEach(b => {
          b.onclick = () => {
            if (fini || api.fini()) return;
            const t = T[+b.dataset.i];
            if (!reste(t)) return;
            const u = T.find(x => x !== t && x.f === t.f && x.cote !== t.cote && reste(x) > 0);
            if (!u) { api.erreur(`${html(t.f)} ne figure que d'un seul côté de la flèche : on ne simplifie que ce qui est présent des deux côtés.`); secouer(b); return; }
            const k = Math.min(reste(t), reste(u));
            t.barre += k; u.barre += k;
            api.effacer(); rendre();
          };
        });
      }
      const bVal = boutonValider(zone);
      const ai = aides(bVal.parentElement, o, api, rendre);
      function terminer() {
        fini = true; bVal.fermer(); rendre();
        box.insertAdjacentHTML('beforeend', `<p class="ox-rx-fin ox-eqn">${r.html}</p>`);
      }
      bVal.onclick = () => {
        if (api.fini()) return;
        // les électrons d'abord, puis H+ ou H2O
        const d = T.find(t => t.f === E && double(t)) || T.find(double);
        if (!d) { terminer(); api.reussi(); return; }
        api.erreur(d.f === E
          ? 'Les électrons figurent encore des deux côtés : ils doivent disparaître de l\'équation. Simplifie-les.'
          : `${html(d.f)} figure encore des deux côtés de la flèche : simplifie-le.`);
        secouer(box);
      };
      rendre();
      return {
        montrer() {
          T.forEach(t => { const u = T.find(x => x !== t && x.f === t.f && x.cote !== t.cote); if (u) { const k = Math.min(reste(t), reste(u)); t.barre += k; u.barre += k; } });
          terminer();
        },
      };
    }

    function coefficients(zone, api) {
      // espèces de l'équation finale, à leur place ; nombres réglés par l'élève
      const F = trier(r.finale).map(t => Object.assign({}, t, { v: 1 }));
      const box = el('div', 'ox-rx');
      zone.appendChild(box);
      const membre = c => F.filter(t => t.cote === c).map(t => `<div class="ox-terme" data-i="${F.indexOf(t)}"><span class="ox-sel-place"></span><span class="ox-f">${html(t.f)}</span></div>`).join('<span class="ox-plus">+</span>');
      box.innerHTML = `<div class="ox-rx-coefs"><div class="ox-rx-membre">${membre('g')}</div><span class="ox-rx-fl">→</span><div class="ox-rx-membre">${membre('d')}</div></div><div class="ox-aides hidden"></div>`;
      const sels = F.map((t, i) => {
        const sel = selecteur({ valeur: 1, min: 1, max: 30, label: 'le nombre devant ' + html(t.f).replace(/<[^>]*>/g, ''), onChange: v => { t.v = v; api.effacer(); box.querySelectorAll('.ox-terme').forEach(x => x.classList.remove('ko')); maj(); } });
        box.querySelector(`[data-i="${i}"] .ox-sel-place`).replaceWith(sel.el);
        return sel;
      });
      // aides : atomes et charges de chaque côté de la flèche
      function maj() {
        const a = box.querySelector('.ox-aides');
        a.classList.toggle('hidden', !ai.ouvert);
        if (!ai.ouvert) return;
        const T = F.map(t => ({ f: t.f, cote: t.cote, coef: t.v }));
        const AG = atomes(T, 'g'), AD = atomes(T, 'd');
        const els = Object.keys(Object.assign({}, AG, AD)).sort((x, y) => (x === 'H') - (y === 'H') || (x === 'O') - (y === 'O'));
        const ligne = (nom, g, d, ag, ad) => `<tr class="${g === d ? 'ox-eg' : ''}"><th scope="row">${nom}</th><td><b>${ag}</b></td><td class="ox-signe">${g === d ? '=' : '≠'}</td><td><b>${ad}</b></td></tr>`;
        const qG = charges(T, 'g'), qD = charges(T, 'd');
        a.innerHTML = '<table class="ox-bilan"><thead><tr><th></th><th scope="col">Réactifs</th><th></th><th scope="col">Produits</th></tr></thead><tbody>' +
          els.map(x => ligne(x, AG[x] || 0, AD[x] || 0, AG[x] || 0, AD[x] || 0)).join('') + ligne('Charge', qG, qD, fq(qG), fq(qD)) + '</tbody></table>';
      }
      const bVal = boutonValider(zone);
      const ai = aides(bVal.parentElement, o, api, maj);
      function terminer() { sels.forEach(x => x.activer(false)); bVal.fermer(); }
      bVal.onclick = () => {
        if (api.fini()) return;
        const faux = F.filter(t => t.v !== t.coef);
        if (!faux.length) { terminer(); api.reussi(); return; }
        // tous proportionnels : pas les plus petits nombres
        const k = F[0].v / F[0].coef;
        if (k > 1 && F.every(t => t.v === k * t.coef)) { api.erreur('L\'équation est équilibrée, mais il faut les plus petits nombres entiers possibles.'); return; }
        faux.forEach(t => box.querySelector(`[data-i="${F.indexOf(t)}"]`).classList.add('ko'));
        // H+ ou H2O non simplifiés : on a gardé le nombre d'un côté de la somme
        const ns = faux.find(t => (t.f === HP || t.f === EAU) && r.somme.some(u => u.f === t.f && u.cote === t.cote && u.coef === t.v) && r.somme.filter(u => u.f === t.f).length > 1);
        let m;
        if (ns) {
          const g = r.somme.find(u => u.f === ns.f && u.cote === 'g').coef, d = r.somme.find(u => u.f === ns.f && u.cote === 'd').coef;
          m = `Après l'addition, ${html(ns.f)} figure des deux côtés de la flèche (${g} à gauche, ${d} à droite) : il faut simplifier.`;
        } else {
          // espèce d'un couple non multipliée
          const nm = faux.find(t => t.de && (t.de === 'a' ? r.mA : r.mB) > 1 && t.v * (t.de === 'a' ? r.mA : r.mB) === t.coef);
          m = nm ? `N'oublie pas de multiplier toute la demi-équation du couple ${couple(nm.de === 'a' ? o.a : o.b)} : ${html(nm.f)} est multiplié aussi.`
            : `${faux.length > 1 ? 'Les nombres en rouge sont faux' : 'Le nombre en rouge est faux'}. Additionne les deux demi-équations multipliées, puis simplifie ce qui figure des deux côtés.`;
        }
        api.erreur(m);
        secouer(box);
      };
      maj();
      return { montrer() { F.forEach((t, i) => { t.v = t.coef; sels[i].fixer(t.coef); }); box.querySelectorAll('.ox-terme').forEach(x => x.classList.remove('ko')); terminer(); maj(); } };
    }
  }

  /* ============================================================
     TOUTE LA MÉTHODE : demi-équations, orienter, multiplier, additionner
     o = { a, b, niveau (1, 2, 3), serie }
     ============================================================ */
  function parties(o) {
    const n = o.niveau || 1, serie = !!o.serie;
    const aidesN = n === 1 ? 'libre' : n === 2 ? 'payant' : 'aucune';
    const demi = (c, l) => window.DEMI.partie({
      couple: c, serie, mode: n === 3 ? 'libre' : 'guide', aides: aidesN,
      q: `${l}) Écris la demi-équation du couple ${couple(c)}.`,
    });
    const opt = x => Object.assign({ a: o.a, b: o.b, serie, aides: aidesN }, x);
    const pO = partieOrienter(opt()), pM = partieMultiplier(opt()), pA = partieAdditionner(opt({ mode: n === 3 ? 'coefficients' : 'simplifier' }));
    pO.q = `c) ${pO.q}`; pM.q = `d) ${pM.q}`; pA.q = `e) ${pA.q}`;
    return [demi(o.a, 'a'), demi(o.b, 'b'), pO, pM, pA];
  }

  window.REAC = { reaction, ecrire, inverser, multiplier, partieOrienter, partieMultiplier, partieAdditionner, parties };
})();
