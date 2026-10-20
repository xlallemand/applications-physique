/* ============================================================
   Écrire l'équation d'une réaction d'oxydoréduction
   (application Oxydoréduction, 1re et terminale spécialité)

     REAC.reaction(a, b)      calculs : a est le couple dont l'oxydant réagit,
                              b celui dont le réducteur réagit ; renvoie
                              { A, B (demi-équations), nA, nB (électrons), L, mA, mB
                                (multiplicateurs), somme, finale (termes), html (équation) }
     REAC.ecrire(T, signe)    écriture HTML d'une équation (termes { f, cote, coef }) ;
                              signe '→' (réaction, par défaut) ou '=' (demi-équation)
     REAC.solutionHTML(r, j)  les demi-équations (signe =), multipliées, puis l'équation

   Parties « perso » (cours : assets/cours.js ; séries : OX.question) :
     REAC.partieReactifs(o)     entourer (toucher) les deux réactifs dans les couples
     REAC.partieAutreReactif(o) un seul réactif donné : toucher l'autre (o.donne 'ox' ou 'red')
     REAC.partieBonCouple(o)    le second réactif appartient à deux couples : le toucher dans
                                le bon (o.x, o.leurre ; voir OX.DEUX_COUPLES)
     REAC.partieMultiplier(o)   multiplier pour égaliser les électrons (demi-équations données)
     REAC.partieAdditionner(o)  o.mode 'simplifier' : la somme est écrite, on touche les espèces
                                présentes des deux côtés pour les simplifier ;
                                'coefficients' : on règle les nombres de l'équation finale
     REAC.partie(o)             toute la réaction dans un seul outil compact (REAC.outil) :
                                une réserve, les deux demi-équations à écrire dans le sens de
                                la réaction (le réactif à gauche du signe =), un multiplicateur
                                à droite de chacune, puis l'équation de la réaction (flèche)
       o = { a, b, ordre ('ab' ou 'ba' : ordre des demi-équations), serie,
             niveau : 1  coefficients multipliés sous les yeux, aides libres
                      2  facteur « m × ( … ) » devant la demi-équation, aides payantes en série
                      3  facteur devant la demi-équation, pas d'aides
             reel, aides : pour régler à part ces deux aides,
             guide : true (cours) : étapes validées toutes seules, consigne de chaque
                     étape à côté de sa zone ; depart, jusqua : étapes déjà faites,
                     dernière étape à faire (0 à 2) ; electrons : électrons échangés
                     dans les aides (par défaut en mode guidé) ; aideEtapes : sous
                     chaque étape, un bouton d'aide qui dit exactement quoi faire }
     Aides de l'outil : nombre d'atomes de chaque élément et charges de chaque côté, en
     une ligne sous chaque équation. « Vérifier » une demi-équation est facultatif ;
     dans une série, s'en servir coûte un point (comme une aide payante) : seul le
     résultat final rapporte les 2 points.

   Dépend de assets/molecules.js, assets/dragdrop.js, ox.js (OX) et demi.js (DEMI).
   ============================================================ */
(function () {
  'use strict';
  const { E, EAU, HP, pgcd, q, atomes, charges, fq, kf, html, texte, reel } = window.DEMI.outils;
  const { el, secouer, boutonValider, couple } = window.OX;
  const { selecteur } = window.MOL;
  const ppcm = (a, b) => a * b / pgcd(a, b);
  const elec = n => `${n}&nbsp;e<sup>−</sup>`;
  const MAXM = 20;                                    // plus grand nombre devant une espèce (demi-équation)

  /* ============================================================
     CALCULS
     ============================================================ */
  // ordre d'écriture : espèces du couple a, du couple b, puis H+, H2O et e−
  const rang = t => (t.f === E ? 4 : t.f === EAU && t.role !== 'red' && t.role !== 'ox' ? 3 : t.f === HP && t.role !== 'ox' ? 2 : t.de === 'b' ? 1 : 0);
  const trier = T => T.slice().sort((x, y) => rang(x) - rang(y));
  // signe : '→' (réaction, par défaut) ou '=' (demi-équation, même orientée)
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
  // les deux demi-équations dans le sens de la réaction (signe =), multipliées, puis l'équation (HTML)
  // jusqua : 0 (les demi-équations seules), 1 (multipliées), 2 (puis l'équation, par défaut)
  function solutionHTML(r, jusqua) {
    const j = jusqua == null ? 2 : jusqua;
    const ligne = (T, m) => (j > 0 && m > 1 ? `${m} × ( ${ecrire(T, '=')} )` : ecrire(T, '='));
    const demis = `<p class="ox-eqn">${ligne(r.A, r.mA)} &nbsp;(réduction)<br>${ligne(inverser(r.B), r.mB)} &nbsp;(oxydation)</p>`;
    if (j === 0) return demis;
    if (j === 1) return `${demis}<p>Les deux demi-équations échangent ${elec(r.L)}.</p>`;
    return `${demis}<p class="ox-eqn"><b>${r.html}</b></p>`;
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
     ENTOURER LES RÉACTIFS : on touche les deux réactifs dans les couples
     o = { a, b, ordre }
     ============================================================ */
  function partieReactifs(o) {
    const especes = [{ f: o.a.ox, reactif: true, de: o.a }, { f: o.a.red, de: o.a }, { f: o.b.ox, de: o.b }, { f: o.b.red, reactif: true, de: o.b }];
    return {
      type: 'perso', outil: 'reactifs', o,
      q: o.q || 'Entoure les deux réactifs dans les couples : touche chacun d\'eux.',
      solution: o.solution != null ? o.solution
        : `<p>Les réactifs sont <span class="ox-entoure">${html(o.a.ox)}</span> (couple ${couple(o.a)}) et <span class="ox-entoure">${html(o.b.red)}</span> (couple ${couple(o.b)}).</p>`,
      monter(zone, api) {
        const box = el('div', 'ox-ent');
        zone.appendChild(box);
        // les deux couples, dans l'ordre demandé ; chaque espèce est un bouton
        const cps = o.ordre === 'ba' ? [especes.slice(2), especes.slice(0, 2)] : [especes.slice(0, 2), especes.slice(2)];
        box.innerHTML = cps.map(L => `<span class="ox-ent-c">${L.map(x => `<button type="button" class="ox-ent-b" aria-pressed="false" data-f="${x.f}">${html(x.f)}</button>`).join('<span class="ox-barre" aria-hidden="true">/</span>')}</span>`).join('<span class="ox-ent-et">et</span>');
        const bs = Array.from(box.querySelectorAll('.ox-ent-b'));
        let fini = false;
        bs.forEach(b => {
          b.onclick = () => {
            if (fini || api.fini()) return;
            b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
            api.effacer();
          };
        });
        const bVal = boutonValider(zone);
        function terminer() { fini = true; bs.forEach(b => { b.disabled = true; }); bVal.fermer(); }
        bVal.onclick = () => {
          if (api.fini()) return;
          const pris = especes.filter(x => bs.find(b => b.dataset.f === x.f).getAttribute('aria-pressed') === 'true');
          if (pris.length !== 2) { secouer(box); api.message('Entoure exactement deux espèces : les deux réactifs, un dans chaque couple.'); return; }
          const faux = pris.find(x => !x.reactif);
          if (!faux) { terminer(); api.reussi(); return; }
          const r = faux.de === o.a ? o.a.ox : o.b.red;
          api.erreur(`${html(faux.f)} n'est pas un réactif : dans cette réaction, il se forme à partir de ${html(r)}. Les réactifs sont les deux espèces mises en présence au départ : relis l'énoncé.`);
          secouer(box);
        };
        return {
          montrer() { bs.forEach(b => b.setAttribute('aria-pressed', String(especes.some(x => x.reactif && x.f === b.dataset.f)))); terminer(); },
        };
      },
    };
  }

  /* ============================================================
     L'AUTRE RÉACTIF : un seul réactif est donné (déjà entouré dans son couple) ;
     on touche l'autre, dans l'autre couple (un seul choix, validé tout de suite).
     Un oxydant réagit avec un réducteur, un réducteur avec un oxydant.
     o = { a, b, ordre, donne : 'ox' (l'oxydant de a est donné) ou 'red' (le réducteur de b) }
     ============================================================ */
  const BARRE = '<span class="ox-barre" aria-hidden="true">/</span>';
  const donneHTML = f => `<span class="ox-ent-b ox-ent-donne" role="img" aria-label="${texte(html(f))}, réactif donné">${html(f)}</span>`;
  const fixeHTML = f => `<span class="ox-ent-f">${html(f)}</span>`;
  // rôle de l'espèce donnée (ox : oxydant) : son nom, celui du rôle de l'autre réactif (avec leurs articles),
  // et la place de l'autre réactif dans Ox / Red
  const roles = ox => ({
    nom: ox ? 'oxydant' : 'réducteur', leNom: ox ? 'l\'oxydant' : 'le réducteur',
    autre: ox ? 'réducteur' : 'oxydant', leAutre: ox ? 'le réducteur' : 'l\'oxydant', deAutre: ox ? 'de réducteur' : 'd\'oxydant',
    place: ox ? 'en second' : 'en premier',
  });
  // boutons : bonne réponse en vert, mauvais choix en rouge (et désactivé), comme un choix
  function choixUnique(bs, juste, api, diag, box) {
    let fini = false;
    const terminer = () => { fini = true; bs.forEach(b => { b.disabled = true; }); };
    bs.forEach(b => {
      b.onclick = () => {
        if (fini || api.fini() || b.disabled) return;
        if (juste(b)) { b.classList.add('juste'); terminer(); api.reussi(); return; }
        b.classList.add('faux'); b.disabled = true;
        api.erreur(diag(b));
        secouer(box);
      };
    });
    return { montrer() { bs.filter(juste).forEach(b => b.classList.add('juste')); terminer(); } };
  }
  function partieAutreReactif(o) {
    const ox = o.donne === 'ox', R = roles(ox);
    const G = ox ? o.a.ox : o.b.red, X = ox ? o.b.red : o.a.ox;            // réactif donné, réactif à trouver
    const cG = ox ? o.a : o.b, cX = ox ? o.b : o.a;
    const regle = `${html(G)} est un <b>${R.nom}</b> : il réagit avec un <b>${R.autre}</b>, celui de l'autre couple`;
    return {
      type: 'perso', outil: 'autre-reactif', o,
      q: o.q || `${html(G)} est entouré : c'est un des deux réactifs. Touche l'autre réactif.`,
      solution: `<p>${html(G)} est <b>${R.leNom}</b> du couple ${couple(cG)}. Un ${R.nom} réagit toujours avec un <b>${R.autre}</b> : l'autre réactif est ${R.leAutre} de l'autre couple, <span class="ox-entoure">${html(X)}</span> (couple ${couple(cX)}, écrit ${R.place}).</p>`,
      monter(zone, api) {
        const box = el('div', 'ox-ent');
        zone.appendChild(box);
        const cps = o.ordre === 'ba' ? [o.b, o.a] : [o.a, o.b];
        box.innerHTML = cps.map(c => `<span class="ox-ent-c">${[c.ox, c.red].map(f => (f === G ? donneHTML(f)
          : `<button type="button" class="ox-ent-b" data-f="${f}">${html(f)}</button>`)).join(BARRE)}</span>`).join('<span class="ox-ent-et">et</span>');
        const bs = Array.from(box.querySelectorAll('button.ox-ent-b'));
        const diag = b => (b.dataset.f === (ox ? o.a.red : o.b.ox)
          ? `${html(b.dataset.f)} est dans le même couple que ${html(G)} : c'est l'espèce que ${html(G)} devient, pas un réactif. ${regle}.`
          : `${html(b.dataset.f)} est un ${R.nom}, comme ${html(G)}. Un ${R.nom} ne réagit pas avec un autre ${R.nom} : il réagit avec un <b>${R.autre}</b>. Dans l'autre couple, ${R.leAutre} est écrit ${R.place} (Ox / Red).`);
        return choixUnique(bs, b => b.dataset.f === X, api, diag, box);
      },
    };
  }

  /* ============================================================
     LE BON COUPLE : un réactif est donné avec son couple ; le second réactif
     appartient à deux couples (oxydant dans l'un, réducteur dans l'autre) :
     on le touche dans le couple où il joue le rôle qui convient (validé tout de suite).
     o = { a, b, x (0 : ce réactif est l'oxydant de a ; 1 : le réducteur de b),
           leurre (son autre couple), ordre (ordre des deux couples proposés) }
     ============================================================ */
  function partieBonCouple(o) {
    const X = o.x ? o.b.red : o.a.ox, G = o.x ? o.a.ox : o.b.red;          // réactif à placer, réactif donné
    const cX = o.x ? o.b : o.a, cG = o.x ? o.a : o.b, L = o.leurre;
    const R = roles(!!o.x);                                                 // rôle du réactif donné (oxydant si x = 1)
    const lAilleurs = o.x ? 'l\'oxydant' : 'le réducteur', placeL = o.x ? 'en premier' : 'en second';   // son rôle dans le leurre
    const deux = o.ordre === 'ba' ? [L, cX] : [cX, L];
    return {
      type: 'perso', outil: 'bon-couple', o,
      q: o.q || `${html(X)} appartient à deux couples. Touche-le dans le couple où il réagit avec ${html(G)}.`,
      solution: `<p>${html(G)} est un <b>${R.nom}</b> : il réagit avec un <b>${R.autre}</b>. Ici, ${html(X)} joue donc le rôle <b>${R.deAutre}</b> : on le prend dans le couple <span class="ox-entoure">${couple(cX)}</span>, où il est écrit ${R.place} (Ox / Red). Dans le couple ${couple(L)}, il est ${lAilleurs} : ce couple ne sert pas.</p>`,
      monter(zone, api) {
        const box = el('div', 'ox-ent');
        zone.appendChild(box);
        // le couple du réactif donné (entouré), puis les deux couples du second réactif, lui seul à toucher
        box.innerHTML = `<span class="ox-ent-c">${[cG.ox, cG.red].map(f => (f === G ? donneHTML(f) : fixeHTML(f))).join(BARRE)}</span><span class="ox-ent-et">et</span>` +
          deux.map((c, i) => `<span class="ox-ent-c">${[c.ox, c.red].map(f => (f === X
            ? `<button type="button" class="ox-ent-b" data-i="${i}" aria-label="${texte(html(X))} dans le couple ${texte(couple(c))}">${html(f)}</button>` : fixeHTML(f))).join(BARRE)}</span>`).join('<span class="ox-ent-et">ou</span>');
        const bs = Array.from(box.querySelectorAll('button.ox-ent-b'));
        const diag = () => `Dans le couple ${couple(L)}, ${html(X)} est <b>${lAilleurs}</b> (écrit ${placeL}). Or ${html(G)} est un <b>${R.nom}</b> : il réagit avec un <b>${R.autre}</b>. Prends ${html(X)} dans le couple où il est ${R.autre} (écrit ${R.place}).`;
        return choixUnique(bs, b => deux[+b.dataset.i] === cX, api, diag, box);
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
            <div class="ox-rx-eq ox-eqn">( ${ecrire(L.T, '=')} )</div><p class="ox-rx-ne"></p></div>`).join('') + '<p class="ox-rx-aide hidden"></p>';
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
     DIAGNOSTIC D'UNE ÉQUATION DE RÉACTION ÉCRITE PAR L'ÉLÈVE
     T : termes { f, cote, coef } (une seule fois chaque espèce de chaque côté)
     renvoie null (juste) ou { msg, faux: [formules dont le nombre est faux] }
     ============================================================ */
  function diagReaction(r, T) {
    const { a, b } = r, F = r.finale;
    const reactifs = [a.ox, b.red], produits = [a.red, b.ox];
    const nom = f => html(f);
    if (T.some(t => t.f === E)) return { msg: 'Les électrons ne figurent jamais dans l\'équation d\'une réaction : tous ceux que cède le réducteur sont captés par l\'oxydant. Égalise les électrons des deux demi-équations (multiplicateurs), puis additionne-les : ils se simplifient.' };
    const deux = T.find(t => T.some(u => u !== t && u.f === t.f && u.cote !== t.cote));
    if (deux) return { msg: `${nom(deux.f)} figure des deux côtés de la flèche : simplifie-le, en retirant le même nombre de chaque côté.` };
    const inconnu = T.find(t => !F.some(x => x.f === t.f));
    if (inconnu) return { msg: `${nom(inconnu.f)} ne figure pas dans l'équation de cette réaction : additionne les deux demi-équations multipliées, puis simplifie ce qui figure des deux côtés.` };
    for (const x of F) {
      const t = T.find(u => u.f === x.f);
      const role = reactifs.includes(x.f) ? 'reactif' : produits.includes(x.f) ? 'produit' : null;
      if (!t) {
        return { msg: role === 'reactif' ? `Il manque ${nom(x.f)} : c'est un réactif.` : role === 'produit' ? `Il manque ${nom(x.f)} : il se forme pendant la réaction.`
          : `Il manque ${nom(x.f)} : additionne les deux demi-équations multipliées, puis simplifie ce qui figure des deux côtés.` };
      }
      if (t.cote !== x.cote) {
        return { msg: role === 'reactif' ? `${nom(x.f)} est un réactif : il s'écrit à gauche de la flèche.`
          : role === 'produit' ? `${nom(x.f)} se forme pendant la réaction : c'est un produit, il s'écrit à droite de la flèche.`
            : `${nom(x.f)} n'est pas du bon côté : dans la somme des deux demi-équations, il y en a davantage ${x.cote === 'g' ? 'à gauche' : 'à droite'}, c'est de ce côté qu'il en reste après simplification.` };
      }
    }
    const faux = F.filter(x => T.find(u => u.f === x.f).coef !== x.coef);
    if (!faux.length) return null;
    const v = f => T.find(u => u.f === f).coef;
    const k = v(F[0].f) / F[0].coef;
    if (k > 1 && F.every(x => v(x.f) === k * x.coef)) return { msg: 'L\'équation est équilibrée, mais il faut les plus petits nombres entiers possibles.', faux: [] };
    const fs = faux.map(x => x.f);
    // H+ ou H2O non simplifiés : on a gardé le nombre d'un côté de la somme
    const ns = faux.find(x => (x.f === HP || x.f === EAU) && r.somme.filter(u => u.f === x.f).length > 1 && r.somme.some(u => u.f === x.f && u.coef === v(x.f)));
    if (ns) {
      const g = r.somme.find(u => u.f === ns.f && u.cote === 'g').coef, d = r.somme.find(u => u.f === ns.f && u.cote === 'd').coef;
      return { msg: `Après l'addition, ${nom(ns.f)} figure des deux côtés de la flèche (${g} à gauche, ${d} à droite) : il faut simplifier.`, faux: fs };
    }
    // espèce d'un couple non multipliée
    const mult = f => ([a.ox, a.red].includes(f) ? r.mA : [b.ox, b.red].includes(f) ? r.mB : 1);
    const nm = faux.find(x => mult(x.f) > 1 && v(x.f) * mult(x.f) === x.coef);
    if (nm) {
      const c = [a.ox, a.red].includes(nm.f) ? a : b;
      return { msg: `N'oublie pas de multiplier toute la demi-équation du couple ${couple(c)} : ${nom(nm.f)} est multiplié aussi.`, faux: fs };
    }
    return { msg: `${faux.length > 1 ? 'Les nombres en rouge sont faux' : 'Le nombre en rouge est faux'}. Multiplie les deux demi-équations pour qu'elles échangent le même nombre d'électrons, additionne-les, puis simplifie ce qui figure des deux côtés.`, faux: fs };
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
        const sel = selecteur({ valeur: 1, min: 1, max: 30, label: 'le nombre devant ' + texte(html(t.f)), onChange: v => { t.v = v; api.effacer(); box.querySelectorAll('.ox-terme').forEach(x => x.classList.remove('ko')); maj(); } });
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
        const d = diagReaction(r, F.map(t => ({ f: t.f, cote: t.cote, coef: t.v })));
        if (!d) { terminer(); api.reussi(); return; }
        (d.faux || []).forEach(f => box.querySelector(`[data-i="${F.findIndex(t => t.f === f)}"]`).classList.add('ko'));
        api.erreur(d.msg);
        secouer(box);
      };
      maj();
      return { montrer() { F.forEach((t, i) => { t.v = t.coef; sels[i].fixer(t.coef); }); box.querySelectorAll('.ox-terme').forEach(x => x.classList.remove('ko')); terminer(); maj(); } };
    }
  }

  /* ============================================================
     TOUTE LA RÉACTION DANS UN SEUL OUTIL
     Une réserve (espèces des deux couples, H2O, H+, e−) au-dessus de deux
     demi-équations vides, à écrire dans le sens de la réaction (le réactif à
     gauche du signe =), chacune avec son multiplicateur à droite et un bouton
     « Vérifier » facultatif ; puis l'équation de la réaction (avec la flèche),
     validée par « Valider la réaction ».
     Mode guidé (o.guide, cours du module 3) : trois étapes validées toutes
     seules dès qu'elles sont justes, sans bouton à toucher :
       0. les deux demi-équations, 1. les multiplicateurs, 2. l'équation.
     La consigne de chaque étape est écrite juste à côté de sa zone, et une
     étape validée est marquée « ✓ Étape n validée ».
       o.depart (0 à 2) : étapes déjà faites (demi-équations écrites, multipliées)
       o.jusqua (0 à 2) : dernière étape à faire (les suivantes ne sont pas montrées)
     o.electrons : les aides donnent aussi les électrons échangés par chaque
     demi-équation (par défaut en mode guidé).
     ============================================================ */
  function outil(zone, o) {
    const r = reaction(o.a, o.b), api = o.api, serie = !!o.serie;
    const niveau = o.niveau || 1;
    const reelMult = o.reel != null ? !!o.reel : niveau === 1;          // coefficients multipliés sous les yeux
    const modeAides = o.aides || (niveau === 1 ? 'libre' : niveau === 2 ? (serie ? 'payant' : 'libre') : 'aucune');
    const guide = !!o.guide;
    const depart = guide ? o.depart || 0 : 0, jusqua = guide && o.jusqua != null ? o.jusqua : 2;
    const avecE = o.electrons != null ? !!o.electrons : guide;            // électrons échangés dans les aides
    // équations présentes : sans la réaction si on s'arrête avant (mode guidé)
    const KS = jusqua === 2 ? ['A', 'B', 'R'] : ['A', 'B'];
    let etape = depart;                                                   // étape en cours (mode guidé)
    // les trois équations : A (réduction de l'oxydant réactif), B (oxydation du réducteur réactif), R (réaction)
    const EQ = {
      A: { cp: o.a, sens: 'red', T: [], m: 1, ok: false, max: MAXM },
      B: { cp: o.b, sens: 'ox', T: [], m: 1, ok: false, max: MAXM },
      R: { T: [], max: 30, faux: [] },
    };
    const ordre = o.ordre === 'ba' ? ['B', 'A'] : ['A', 'B'];
    // espèces de la réserve (une seule fois chacune) et ordre d'écriture dans un membre
    const RES = [];
    [o.a.ox, o.b.red, o.a.red, o.b.ox].forEach(f => { if (!RES.includes(f)) RES.push(f); });
    const ordreRes = (ordre[0] === 'A' ? [o.a.ox, o.a.red, o.b.ox, o.b.red] : [o.b.ox, o.b.red, o.a.ox, o.a.red]).filter((f, i, l) => l.indexOf(f) === i);
    [HP, E, EAU].forEach(f => { if (!ordreRes.includes(f)) ordreRes.push(f); });
    const rangF = f => (RES.includes(f) ? RES.indexOf(f) : f === HP ? 4 : f === E ? 5 : 6);
    let fini = false, verifVu = false, aidesOuv = modeAides === 'ouvertes', aidesVues = aidesOuv;

    // consignes des étapes du mode guidé (texte, puis message une fois l'étape validée ou déjà faite)
    const ETAPES = [
      { titre: 'Les deux demi-équations, dans le sens de la réaction',
        texte: `Écris chaque demi-équation avec le <b>réactif à gauche du signe =</b> : glisse les espèces de la réserve, puis règle les nombres avec les boutons ▲ ▼. Celle de ${html(o.a.ox)} est une réduction (électrons à gauche), celle de ${html(o.b.red)} une oxydation (électrons à droite). Une demi-équation juste est marquée « ✓ juste ».`,
        fait: 'les deux demi-équations sont justes.', donne: 'les deux demi-équations sont écrites dans le sens de la réaction.' },
      { titre: 'Égaliser les électrons',
        texte: 'Règle le <b>multiplicateur ×</b> de chaque demi-équation : les deux doivent échanger <b>le même nombre d\'électrons</b>, le plus petit possible.',
        fait: `les deux demi-équations échangent ${elec(r.L)}.`, donne: `les demi-équations sont multipliées : elles échangent ${elec(r.L)}.` },
      { titre: 'L\'équation de la réaction',
        texte: 'Additionne les deux demi-équations multipliées : glisse chaque espèce de la réserve du bon côté de la flèche et règle les nombres. Simplifie ce qui figure des deux côtés : il ne reste <b>aucun électron</b>.',
        fait: 'l\'équation de la réaction est juste.' },
    ];
    const blocEtape = k => (guide && k <= jusqua ? `<div class="ox-rxo-g" data-e="${k}">
        <p class="ox-rxo-g-t"><span class="ox-rxo-g-n" aria-hidden="true">${k + 1}</span><span class="ox-rxo-g-l" aria-live="polite"></span></p>
        <p class="ox-rxo-g-x"></p><p class="ox-rxo-g-m"></p>
        ${o.aideEtapes ? '<div class="ox-rxo-g-aide hidden"><button type="button" class="btn-small" aria-expanded="false">Aide pour cette étape</button><div class="ox-rxo-g-ad hidden"></div></div>' : ''}</div>` : '');
    const ligneDemi = k => `<div class="ox-rxo-l" data-k="${k}">
        <div class="ox-rxo-tete"><span class="ox-rxo-nom">Couple ${couple(EQ[k].cp)}</span><span class="ox-rxo-etat"></span></div>
        <div class="ox-rxo-ligne">
          <div class="ox-rxo-eq"></div>
          ${jusqua >= 1 ? '<div class="ox-rxo-mult"><span class="ox-rxo-x" aria-hidden="true">×</span></div>' : ''}
          <button type="button" class="btn-small ox-rxo-verif"></button>
        </div>
        <div class="ox-rxo-cpt hidden"></div>
        <div class="ox-rxo-msg"></div>
      </div>`;
    zone.innerHTML = `<div class="ox-rxo${guide ? ' ox-rxo-guide' : ''}">
        <div class="ox-rxo-res${guide && depart === 1 && jusqua === 1 ? ' hidden' : ''}"><span class="ox-etiq">Réserve</span><div class="ox-rxo-jetons"></div></div>
        ${blocEtape(0)}
        ${ordre.map(ligneDemi).join('')}
        ${blocEtape(1)}
        ${blocEtape(2)}
        ${jusqua === 2 ? `<div class="ox-rxo-l ox-rxo-r" data-k="R">
          <div class="ox-rxo-tete"><span class="ox-rxo-nom">Équation de la réaction</span></div>
          <div class="ox-rxo-ligne"><div class="ox-rxo-eq"></div></div>
          <div class="ox-rxo-cpt hidden"></div>
        </div>` : ''}
        <div class="er-actions ox-rxo-actions${guide && modeAides === 'aucune' ? ' hidden' : ''}">
          ${guide ? '' : '<button type="button" class="btn-primary ox-rxo-valider">Valider la réaction</button>'}
          <button type="button" class="btn-small ox-rxo-b-aides${modeAides === 'aucune' ? ' hidden' : ''}" aria-expanded="false"></button>
        </div>
      </div>`;
    const $ = s => zone.querySelector(s);
    const ligne = k => zone.querySelector(`.ox-rxo-l[data-k="${k}"]`);

    /* ---------- Réserve : chaque espèce se glisse autant de fois qu'on veut ---------- */
    const jetons = $('.ox-rxo-jetons');
    ordreRes.forEach(f => {
      const j = el('span', 'ox-jeton ox-rxo-j', `<span>${html(f)}</span>`);
      j.dataset.f = f;
      jetons.appendChild(j);
      mobile(j, { f });
    });
    function mobile(e, src) {
      e.classList.add('ox-mobile');
      e.setAttribute('aria-label', 'Glisser ' + texte(html(src.f || src.t.f)));
      DragDrop.enable(e, { zoneSelector: '.ox-rxo-m', dragOverClass: 'ox-survol', onDrop: (it, z) => deposer(src, z) });
    }
    // mode guidé : seules les équations de l'étape en cours se modifient
    const modifiable = k => !fini && !(EQ[k].ok) && (!guide || etape === (k === 'R' ? 2 : 0));

    /* ---------- Une équation : membres, termes, facteur ---------- */
    // nombre affiché devant une espèce (multiplié sous les yeux au niveau 1)
    const affiche = (k, t) => (k !== 'R' && reelMult ? t.coef * EQ[k].m : t.coef);
    function rendreEq(k) {
      const Q = EQ[k], box = ligne(k).querySelector('.ox-rxo-eq');
      const facteur = k !== 'R' && !reelMult && Q.m > 1;
      // demi-équation : signe = (même orientée) ; réaction : flèche
      box.innerHTML = (facteur ? `<span class="ox-rxo-fact">${Q.m}&nbsp;×&nbsp;(</span>` : '') +
        `<div class="ox-rxo-m" data-k="${k}" data-cote="g" role="group" aria-label="Membre de gauche"></div><span class="ox-rxo-fl" aria-hidden="true">${k === 'R' ? '→' : '='}</span>` +
        `<div class="ox-rxo-m" data-k="${k}" data-cote="d" role="group" aria-label="Membre de droite"></div>` +
        (facteur ? '<span class="ox-rxo-fact">)</span>' : '');
      ['g', 'd'].forEach(c => {
        const m = box.querySelector(`.ox-rxo-m[data-cote="${c}"]`);
        const L = Q.T.filter(t => t.cote === c).sort((x, y) => rangF(x.f) - rangF(y.f));
        if (!L.length) m.innerHTML = modifiable(k) ? '<span class="ox-vide">Glisse ici</span>' : '<span class="ox-vide">—</span>';
        L.forEach((t, i) => {
          if (i) m.insertAdjacentHTML('beforeend', '<span class="ox-plus" aria-hidden="true">+</span>');
          m.appendChild(terme(k, t));
        });
      });
      majLigne(k);
    }
    function terme(k, t) {
      const b = el('div', 'ox-terme' + (k === 'R' && EQ.R.faux.includes(t.f) ? ' ko' : ''));
      b.dataset.f = t.f;
      const n = affiche(k, t);
      if (!modifiable(k)) {
        b.innerHTML = `${n > 1 ? `<span class="er-coef-fixe">${n}</span>` : ''}<span class="ox-f">${html(t.f)}</span>`;
        return b;
      }
      const m = k !== 'R' && reelMult ? EQ[k].m : 1, max = EQ[k].max;
      // au niveau 1, le sélecteur montre le nombre multiplié ; chaque flèche change le nombre de la demi-équation de 1
      const sel = selecteur({
        valeur: n, min: m, max: max * m, label: 'le nombre devant ' + texte(html(t.f)),
        onChange: v => {
          if (!modifiable(k)) return;                                     // équation validée entre-temps (mode guidé)
          if (m > 1) { t.coef = Math.min(max, Math.max(1, t.coef + (v > t.coef * m ? 1 : -1))); sel.fixer(t.coef * m); } else t.coef = v;
          changement(k, false);
        },
      });
      b.appendChild(sel.el);
      const f = el('span', 'ox-f', html(t.f));
      mobile(f, { k, t });
      b.appendChild(f);
      return b;
    }
    // électrons d'une demi-équation, sans son multiplicateur
    const nbElec = k => EQ[k].T.filter(t => t.f === E).reduce((x, t) => x + t.coef, 0);
    // état d'une ligne : facteur, bouton « Vérifier », aides (atomes, charges, électrons)
    function majLigne(k) {
      const L = ligne(k), Q = EQ[k];
      if (k !== 'R') {
        L.classList.toggle('ok', Q.ok);
        L.querySelector('.ox-rxo-etat').innerHTML = Q.ok ? '<span class="ox-ok-tag">✓ juste</span>' : '';
        const b = L.querySelector('.ox-rxo-verif');
        b.textContent = serie && !verifVu ? 'Vérifier (1 point de moins)' : 'Vérifier';
        b.classList.toggle('hidden', guide || Q.ok || fini);
      }
      const cpt = L.querySelector('.ox-rxo-cpt');
      cpt.classList.toggle('hidden', !aidesOuv || !Q.T.length);
      if (!aidesOuv || !Q.T.length) return;
      const T = Q.T.map(t => ({ f: t.f, cote: t.cote, coef: affiche(k, t) }));
      const AG = atomes(T, 'g'), AD = atomes(T, 'd');
      const els = Object.keys(Object.assign({}, AG, AD)).sort((x, y) => (x === 'H') - (y === 'H') || (x === 'O') - (y === 'O'));
      const pastille = (nom, g, d) => `<span class="ox-cpt${g === d ? ' ok' : ''}"><b>${nom}</b> ${g} ${g === d ? '=' : '≠'} ${d}</span>`;
      const qG = charges(T, 'g'), qD = charges(T, 'd');
      cpt.innerHTML = els.map(x => pastille(x, AG[x] || 0, AD[x] || 0)).join('') + pastille('charge', fq(qG), fq(qD));
      // électrons échangés : en vert quand les deux demi-équations en échangent autant
      if (avecE && k !== 'R') {
        const n = nbElec(k), tot = n * Q.m, autre = k === 'A' ? 'B' : 'A';
        const egal = tot > 0 && tot === nbElec(autre) * EQ[autre].m;
        cpt.insertAdjacentHTML('beforeend', `<span class="ox-cpt${egal ? ' ok' : ''}"><b>électrons échangés</b> ${Q.m > 1 ? `${Q.m} × ${n} = ` : ''}${tot}${egal ? ' : autant que l\'autre' : ''}</span>`);
      }
    }
    // une équation vient de changer : messages effacés, aides à jour, étape contrôlée (mode guidé)
    function changement(k, redessiner) {
      if (k === 'R') EQ.R.faux = [];
      if (redessiner) rendreEq(k); else majLigne(k);
      if (k === 'R' && !redessiner) zone.querySelectorAll('.ox-rxo-r .ox-terme.ko').forEach(x => x.classList.remove('ko'));
      if (k !== 'R') ligne(k).querySelector('.ox-rxo-msg').innerHTML = '';
      if (avecE && k !== 'R') ['A', 'B'].forEach(majLigne);              // électrons des deux demi-équations
      if (api) api.effacer();
      controler();
    }

    /* ---------- Glisser-déposer ---------- */
    // src = { f } (réserve) ou { k, t } (espèce déjà placée dans l'équation k)
    function deposer(src, z) {
      if (fini) return;
      const dest = z && zone.contains(z) ? { k: z.dataset.k, c: z.dataset.cote } : null;
      if (dest && !modifiable(dest.k)) return;
      const ajouter = (k, f, c, n) => {
        const u = EQ[k].T.find(x => x.f === f && x.cote === c);
        if (u) u.coef = Math.min(EQ[k].max, u.coef + n); else EQ[k].T.push({ f, cote: c, coef: n });
      };
      if (src.t) {
        if (!modifiable(src.k)) return;
        const L = EQ[src.k].T;
        if (dest && dest.k === src.k && dest.c === src.t.cote) return;
        L.splice(L.indexOf(src.t), 1);                                     // retirée de sa place…
        if (dest) ajouter(dest.k, src.t.f, dest.c, src.t.coef);             // … et posée ailleurs (sinon : retirée)
        changement(src.k, true);
      } else if (dest) ajouter(dest.k, src.f, dest.c, 1);
      if (dest && !fini) changement(dest.k, true);
    }

    /* ---------- Multiplicateurs ---------- */
    const mults = {};
    if (jusqua >= 1) {
      ['A', 'B'].forEach(k => {
        const sel = selecteur({
          valeur: 1, min: 1, max: 10, label: 'le multiplicateur de la demi-équation du couple ' + texte(couple(EQ[k].cp)),
          onChange: v => { if (fini || (guide && etape !== 1)) return; EQ[k].m = v; changement(k, true); },
        });
        ligne(k).querySelector('.ox-rxo-mult').appendChild(sel.el);
        mults[k] = sel;
      });
    }

    /* ---------- Vérifier une demi-équation (facultatif) ---------- */
    ['A', 'B'].forEach(k => {
      ligne(k).querySelector('.ox-rxo-verif').onclick = () => {
        const Q = EQ[k];
        if (fini || Q.ok) return;
        const msg = ligne(k).querySelector('.ox-rxo-msg');
        // dans une série, se servir de « Vérifier » coûte un point (une seule fois)
        if (serie && !verifVu) { verifVu = true; if (api) api.compterErreur(); }
        const v = window.DEMI.verifier(Q.cp, Q.T, { sens: Q.sens, reactif: true });
        if (v.format) msg.innerHTML = `<div class="callout er-retour"><p>${v.msg}</p></div>`;
        else if (!v.ok) { msg.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Pas encore.</b> ${v.msg}</p></div>`; secouer(ligne(k).querySelector('.ox-rxo-eq')); }
        else { Q.ok = true; msg.innerHTML = ''; rendreEq(k); }
        ['A', 'B'].forEach(majLigne);
      };
    });

    /* ---------- Aides : atomes et charges sous chaque équation ---------- */
    const bAides = $('.ox-rxo-b-aides');
    function majAides() {
      bAides.textContent = aidesOuv ? 'Masquer les aides' : modeAides === 'payant' && !aidesVues ? 'Afficher les aides (1 point de moins)' : 'Afficher les aides';
      bAides.setAttribute('aria-expanded', String(aidesOuv));
      KS.forEach(majLigne);
    }
    bAides.onclick = () => {
      if (fini || modeAides === 'aucune') return;
      aidesOuv = !aidesOuv;
      if (aidesOuv && !aidesVues) { aidesVues = true; if (modeAides === 'payant' && serie && api) api.compterErreur(); }
      majAides();
    };

    /* ---------- Mode guidé : chaque étape validée toute seule dès qu'elle est juste ---------- */
    function controler() {
      if (!guide || fini) return;
      if (etape === 0) {
        ['A', 'B'].forEach(k => {
          const Q = EQ[k];
          if (!Q.ok && Q.T.length && window.DEMI.verifier(Q.cp, Q.T, { sens: Q.sens, reactif: true }).ok) { Q.ok = true; rendreEq(k); }
        });
        if (EQ.A.ok && EQ.B.ok) etapeFaite();
      } else if (etape === 1) {
        const eA = EQ.A.m * r.nA, eB = EQ.B.m * r.nB;
        // électrons égaux mais trop nombreux : on le dit, sans compter d'erreur
        bloc(1).querySelector('.ox-rxo-g-m').innerHTML = eA === eB && eA > r.L
          ? `Les deux demi-équations échangent ${elec(eA)} : c'est bien autant, mais prends les plus petits multiplicateurs possibles.` : '';
        if (eA === eB && eA === r.L) etapeFaite();
      } else if (etape === 2 && EQ.R.T.length && !diagReaction(r, EQ.R.T)) etapeFaite();
    }
    const bloc = k => zone.querySelector(`.ox-rxo-g[data-e="${k}"]`);
    // l'étape en cours est juste : on passe à la suivante (ou c'est fini)
    function etapeFaite() {
      etape++;
      if (etape > jusqua) { terminer(); if (api) api.reussi(); return; }
      majGuide();
      const b = bloc(etape);
      setTimeout(() => b.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
      controler();                                                        // déjà juste (autant d'électrons) : validée tout de suite
    }
    // consignes des étapes (validée : une seule ligne ; en cours : avec son texte ; à venir : le titre),
    // multiplicateurs, et réserve placée sous la consigne de l'étape où l'on glisse des espèces
    // (elle reste près de l'équation à écrire : on n'a pas à glisser d'un bout à l'autre de l'outil)
    function majGuide() {
      if (!guide) return;
      zone.querySelectorAll('.ox-rxo-g').forEach(b => {
        const k = +b.dataset.e;
        b.classList.toggle('fait', k < etape);
        b.classList.toggle('encours', k === etape);
        b.classList.toggle('avenir', k > etape);
        b.querySelector('.ox-rxo-g-n').textContent = k < etape ? '✓' : k + 1;
        b.querySelector('.ox-rxo-g-l').innerHTML = k < etape
          ? (k < depart ? `<b>Étape ${k + 1} déjà faite</b> : ${ETAPES[k].donne}` : `<b>Étape ${k + 1} validée</b> : ${ETAPES[k].fait}`)
          : `<b>Étape ${k + 1} · ${ETAPES[k].titre}</b>`;
        b.querySelector('.ox-rxo-g-x').innerHTML = k === etape ? ETAPES[k].texte : '';
        if (k !== etape) b.querySelector('.ox-rxo-g-m').innerHTML = '';
        // aide détaillée : seulement sous l'étape en cours
        const a = b.querySelector('.ox-rxo-g-aide');
        if (a) a.classList.toggle('hidden', fini || k !== etape);
      });
      Object.values(mults).forEach(x => x.activer(!fini && etape === 1));
      const res = $('.ox-rxo-res');
      res.classList.toggle('ox-rxo-off', fini || etape === 1);
      if (!fini && (etape === 0 || etape === 2)) bloc(etape).after(res);
      KS.forEach(rendreEq);
    }

    /* ---------- Mode guidé, o.aideEtapes : sous chaque étape, une aide qui dit exactement quoi faire ---------- */
    // « A, B et C »
    const liste = L => (L.length > 1 ? `${L.slice(0, -1).join(', ')} et ${L[L.length - 1]}` : L[0] || '');
    const membre = (T, c) => liste(T.filter(t => t.cote === c).sort((x, y) => rangF(x.f) - rangF(y.f)).map(t => kf(t.coef, t.f)));
    function aideEtape(k) {
      // 1. chaque demi-équation : le réactif à gauche, les espèces et leurs nombres de chaque côté
      if (k === 0) {
        return ordre.map(K => {
          const Q = EQ[K], inv = Q.sens === 'ox', T = reel(window.DEMI.solution(Q.cp).etapes[3], inv);
          return `<p>Couple ${couple(Q.cp)} : le réactif ${html(inv ? Q.cp.red : Q.cp.ox)} va à gauche, c'est une ${inv ? 'oxydation' : 'réduction'}. Glisse à gauche du signe = : ${membre(T, 'g')} ; à droite : ${membre(T, 'd')}. Règle chaque nombre avec ▲ ▼ : ${window.DEMI.ecrire(T, '=')}.</p>`;
        }).join('');
      }
      // 2. les multiplicateurs : plus petit multiple commun des deux nombres d'électrons
      if (k === 1) {
        const n = K => (K === 'A' ? r.nA : r.nB), m = K => (K === 'A' ? r.mA : r.mB);
        const regle = K => `${m(K) > 1 ? 'règle' : 'laisse'} le multiplicateur de la demi-équation du couple ${couple(EQ[K].cp)} sur <b>${m(K)}</b> (${m(K)} × ${n(K)} = ${r.L})`;
        return `<p>La demi-équation du couple ${couple(o.a)} échange ${elec(r.nA)}, celle du couple ${couple(o.b)} ${elec(r.nB)}. Le plus petit multiple commun de ${r.nA} et ${r.nB} est ${r.L} : ${ordre.map(regle).join(' ; ')}.</p>`;
      }
      // 3. l'équation : ce qui se simplifie dans la somme, puis chaque espèce et son nombre
      const nb = (f, c) => r.somme.filter(t => t.f === f && t.cote === c).reduce((x, t) => x + t.coef, 0);
      const simpl = [E, HP, EAU].map(f => {
        const g = nb(f, 'g'), d = nb(f, 'd');
        if (!g || !d) return '';
        if (g === d) return `Les ${kf(g, f)} de chaque côté se simplifient.`;
        return `${kf(g, f)} à gauche et ${kf(d, f)} à droite : il en reste ${Math.abs(g - d)} ${g > d ? 'à gauche' : 'à droite'}.`;
      }).filter(Boolean);
      return `<p>Additionne les deux demi-équations multipliées, puis simplifie. ${simpl.join(' ')}</p>
        <p>Glisse à gauche de la flèche : ${membre(r.finale, 'g')} ; à droite : ${membre(r.finale, 'd')}. Règle chaque nombre avec ▲ ▼ : ${r.html}.</p>`;
    }
    zone.querySelectorAll('.ox-rxo-g-aide').forEach(a => {
      const b = a.querySelector('button'), d = a.querySelector('.ox-rxo-g-ad'), k = +a.parentElement.dataset.e;
      b.onclick = () => {
        const ouvrir = d.classList.contains('hidden');
        if (ouvrir && !d.innerHTML) d.innerHTML = aideEtape(k);
        d.classList.toggle('hidden', !ouvrir);
        b.textContent = ouvrir ? 'Masquer l\'aide' : 'Aide pour cette étape';
        b.setAttribute('aria-expanded', String(ouvrir));
      };
    });

    /* ---------- Valider la réaction ---------- */
    function terminer() {
      fini = true;
      if (guide) etape = jusqua + 1;
      $('.ox-rxo').classList.add('ox-rxo-fini');
      Object.values(mults).forEach(x => x.activer(false));
      const a = $('.ox-rxo-actions');
      if (a) a.remove();
      if (guide) majGuide(); else KS.forEach(rendreEq);
    }
    if (!guide) {
      $('.ox-rxo-valider').onclick = () => {
        if (fini || (api && api.fini())) return;
        if (!EQ.R.T.length) {
          if (api) api.message('Écris l\'équation de la réaction : glisse les espèces de la réserve de chaque côté de la flèche, puis règle les nombres.');
          secouer(ligne('R'));
          return;
        }
        const d = diagReaction(r, EQ.R.T);
        if (!d) { terminer(); if (api) api.reussi(); return; }
        EQ.R.faux = d.faux || [];
        rendreEq('R');
        if (api) api.erreur(d.msg);
        secouer(ligne('R'));
      };
    }

    // les deux demi-équations dans le sens de la réaction (justes)
    function remplirDemis() {
      EQ.A.T = reel(window.DEMI.solution(o.a).etapes[3], false).map(t => ({ f: t.f, cote: t.cote, coef: t.coef }));
      EQ.B.T = reel(window.DEMI.solution(o.b).etapes[3], true).map(t => ({ f: t.f, cote: t.cote, coef: t.coef }));
      EQ.A.ok = EQ.B.ok = true;
    }
    // mode guidé : étapes déjà faites
    if (depart >= 1) remplirDemis();
    if (depart >= 2) { EQ.A.m = r.mA; EQ.B.m = r.mB; mults.A.fixer(r.mA); mults.B.fixer(r.mB); }

    majAides();
    if (guide) majGuide(); else KS.forEach(rendreEq);
    return {
      // toute la réponse : les deux demi-équations dans le sens de la réaction, multipliées, et l'équation
      montrer() {
        remplirDemis();
        if (jusqua >= 1) { EQ.A.m = r.mA; EQ.B.m = r.mB; mults.A.fixer(r.mA); mults.B.fixer(r.mB); }
        if (jusqua === 2) { EQ.R.T = r.finale.map(t => ({ f: t.f, cote: t.cote, coef: t.coef })); EQ.R.faux = []; }
        ['A', 'B'].forEach(k => { ligne(k).querySelector('.ox-rxo-msg').innerHTML = ''; });
        terminer();
      },
    };
  }

  // l'outil en partie « perso » d'un cours ou d'une série ; en mode guidé, rien ne se
  // valide à la main : « Afficher la réponse » est proposé tout de suite (cours)
  function partie(o) {
    const r = reaction(o.a, o.b);
    const p = {
      type: 'perso', outil: 'reaction', o, aide: !!o.guide,
      q: o.q || 'Écris les deux demi-équations dans le sens de la réaction (le réactif à gauche du signe =), multiplie-les pour égaliser les électrons, puis écris l\'équation de la réaction.',
      solution: o.solution != null ? o.solution : solutionHTML(r, o.guide && o.jusqua != null ? o.jusqua : 2),
    };
    p.monter = (zone, api) => outil(zone, Object.assign({}, o, { api }));
    return p;
  }

  window.REAC = { reaction, ecrire, inverser, multiplier, solutionHTML, diagReaction, partieReactifs, partieAutreReactif, partieBonCouple, partieMultiplier, partieAdditionner, outil, partie };
})();
