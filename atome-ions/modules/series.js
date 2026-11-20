/* ============================================================
   Séries notées sur 20 (10 questions tirées au hasard dans des groupes)
   AT.questionsConfig()   module 2 : configuration électronique
     noyau (ᴬ_Z X → protons, neutrons, électrons, et l'inverse) ; de Z à la configuration (Z, ᴬ_Z X ou nombre
     d'électrons donné : composer la configuration, puis les électrons de valence) ; de la configuration à Z
     et à l'élément ; électrons de valence d'une configuration donnée.
   AT.questionsIons()     module 4 : ions et composés ioniques
     prévoir l'ion stable ; cet ion existe-t-il ? ; protons, électrons, neutrons d'un ion (et l'inverse) ;
     charge en e puis en coulombs ; atome, molécule, cation ou anion ; noms et formules des ions à connaître ;
     composés ioniques (formule, nom, ion manquant).
   Chaque question est une fabrique : nouvelles valeurs et nouveaux distracteurs à chaque appel.
   Diagnostics : erreurs classiques (A pris pour Z, ordre de remplissage, nombre maximal dépassé, total
   différent de Z, valence comptée sur la dernière sous-couche, électrons d'un cation ajoutés…).
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const E = z => ATOME.element(z);
  const nota = (A, Z, sym, q) => ATOME.notation(A, Z, sym, q);
  const f = (sym, q) => ATOME.formuleIon(sym, q);
  const cfg = n => ATOME.configHTML(n);
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  const art = el => (/^[aeéèêiouyh]/i.test(el.nom) ? 'l\'' + el.nom : 'le ' + el.nom);
  const hasard = AT.hasard, melanger = AT.melanger;
  // charge écrite comme au tableau : 2e, e, −e, −2e
  const enE = q => (q < 0 ? MOINS : '') + (Math.abs(q) > 1 ? Math.abs(q) : '') + 'e';
  // nombre signé écrit comme au tableau : +2, −1
  const sg = n => (n > 0 ? '+' : MOINS) + Math.abs(n);
  const sci = v => { const e = Math.floor(Math.log10(Math.abs(v)) + 1e-9), m = v / Math.pow(10, e); return `${AT.fmt(m, 2)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`; };

  /* ---------- Partie « composer la configuration » (outil ATOME.composeur) ---------- */
  function partieConfig(nb, opts) {
    opts = opts || {};
    return {
      type: 'perso', attendu: nb,          // nombre d'électrons attendu (utile pour vérifier l'application)
      q: opts.q || 'Écris sa configuration électronique : touche (ou glisse) les sous-couches dans l\'ordre, puis règle chaque exposant avec − / +.',
      monter(zone, api) {
        const c = ATOME.composeur(zone, { onChange: () => api.effacer(), aria: opts.aria });
        const act = AT.el('div', 'er-actions', '<button type="button" class="btn-primary">Valider</button>');
        zone.appendChild(act);
        const b = act.querySelector('button');
        b.onclick = () => {
          if (api.fini()) return;
          const r = ATOME.verifierConfig(c.valeur(), nb, { texteTotal: opts.texteTotal });
          if (r.code === 'vide') { api.message(r.diag); return; }
          if (r.ok) { c.bloquer(true); b.disabled = true; api.reussi(); } else api.erreur(r.diag);
        };
        return { montrer() { c.fixer(ATOME.config(nb)); c.bloquer(true); b.disabled = true; } };
      },
      solution: opts.solution || ATOME.configHTML(nb, { entourer: opts.entourer }),
    };
  }
  // Partie « électrons de valence » : choix d'un nombre, diagnostics de ATOME.diagValence
  function partieValence(n, opts) {
    opts = opts || {};
    const c = ATOME.config(n), v = ATOME.valence(c), der = c[c.length - 1], ext = ATOME.derniereCouche(c);
    const avant = c.filter(t => ATOME.couche(t[0]) === ext - 1).reduce((s, t) => s + t[1], 0);
    // toujours les deux erreurs classiques (dernière sous-couche seule, tous les électrons), puis d'autres
    const prio = [der[1], n].filter((x, i, a) => x >= 1 && x !== v && a.indexOf(x) === i);
    const autres = melanger([avant, v + 1, v - 1, v + 2].filter(x => x >= 1 && x !== v && prio.indexOf(x) < 0)).filter((x, i, a) => a.indexOf(x) === i);
    const opts4 = [v].concat(prio, autres).slice(0, 4);
    const indices = {};
    opts4.forEach(x => { if (x !== v) indices[x] = ATOME.diagValence(c, x); });
    return {
      type: 'choix', grand: true, q: opts.q || 'Combien d\'électrons de valence cet atome a-t-il ?',
      options: opts4.sort((a, b) => a - b).map(x => ({ id: x, label: String(x) })), bonne: v, melanger: false, indices,
      solution: `${ATOME.configHTML(c, { entourer: true })} : la dernière couche qui a des électrons est n = ${ext}, d'où <b>${pl(v, 'électron')} de valence</b>.`,
    };
  }
  // Choix d'un nombre (protons, électrons…) : saisie d'un entier
  function partieNombre(o) {
    return { type: 'nombre', entier: true, label: o.label, q: o.q, unite: o.unite, attendu: o.bonne,
      verifier: v => (v === o.bonne ? { ok: true } : { diag: (o.diag && o.diag(v)) || '' }),
      remplir: i => { i.value = String(o.bonne); }, solution: o.solution };
  }

  // tirage d'éléments différents d'une question à l'autre
  function pioche(liste) {
    let sac = [];
    return () => { if (!sac.length) sac = melanger(liste); return sac.pop(); };
  }

  /* ============================================================
     MODULE 2 : CONFIGURATION ÉLECTRONIQUE
     ============================================================ */
  // Noyau : de ᴬ_Z X aux nombres de protons, neutrons et électrons
  function qNoyau(z) {
    const el = E(z), A = el.A, N = A - z;
    return {
      theme: 'Composition d\'un atome',
      enonce: `<p>Un atome a pour écriture conventionnelle <span class="at-donnee">${nota(A, z, el.sym)}</span></p>`,
      parties: [{
        type: 'champs', q: 'Combien a-t-il de protons, de neutrons et d\'électrons ?',
        champs: [{ id: 'p', label: 'protons', bonne: z }, { id: 'n', label: 'neutrons', bonne: N }, { id: 'e', label: 'électrons', bonne: z }],
        verifier(v) {
          const faux = ['p', 'n', 'e'].filter(k => v[k] !== { p: z, n: N, e: z }[k]);
          if (!faux.length) return { ok: true };
          let d;
          if (v.p !== z) d = v.p === A ? `Le nombre de protons est Z, le nombre écrit en bas (ici ${z}) ; A = ${A} est le nombre de nucléons.` : `Le nombre de protons est le numéro atomique Z, écrit en bas : ${z}.`;
          else if (v.n !== N) d = v.n === A ? `A = ${A} compte tous les nucléons (protons + neutrons) : neutrons = A − Z = ${A} − ${z} = ${N}.`
            : v.n === A + z ? `On retire les protons des nucléons : neutrons = A − Z = ${A} − ${z} = ${N}.` : `Nombre de neutrons = A − Z = ${A} − ${z} = ${N}.`;
          else d = v.e === A ? `Tu as utilisé A = ${A} : le nombre d'électrons d'un atome est Z (ici ${z}).` : `L'atome est électriquement neutre : autant d'électrons que de protons, soit ${z}.`;
          return { diag: d, faux };
        },
        solution: `${pl(z, 'proton')} (Z = ${z}) ; A − Z = ${A} − ${z} = ${pl(N, 'neutron')} ; ${pl(z, 'électron')} (l'atome est neutre).`,
      }],
    };
  }
  // Noyau, dans l'autre sens : des nombres à l'écriture conventionnelle
  function qNoyauInverse(z) {
    const el = E(z), A = el.A, N = A - z;
    // symboles proposés : le bon, celui de Z = N (neutrons pris pour Z), des voisins
    const cand = [N, z - 1, z + 1, z + 2, z - 2].filter((x, i, a) => x >= 1 && x <= 18 && x !== z && a.indexOf(x) === i).slice(0, 3);
    const indices = {};
    cand.forEach(x => { indices[x] = x === N ? `Le numéro atomique Z est le nombre de <b>protons</b> (${z}), pas de neutrons. Z = ${x} correspond ${art(E(x)).replace(/^le /, 'au ').replace(/^l'/, 'à l\'')}.` : `L'élément de Z = ${x} est ${art(E(x))}. Ici Z = ${z} : le nombre de protons.`; });
    return {
      theme: 'Écriture conventionnelle du noyau',
      enonce: `<p>Un atome a <b>${pl(z, 'proton')}</b>, <b>${pl(N, 'neutron')}</b> et <b>${pl(z, 'électron')}</b>.</p>`,
      parties: [
        { type: 'choix', grand: true, q: 'Quel est son symbole ?', options: [z].concat(cand).map(x => ({ id: x, label: `${E(x).sym} <small>(${E(x).nom})</small>` })), bonne: z, indices,
          solution: `Z = ${z} (le nombre de protons) : c'est ${art(el)}, ${el.sym}.` },
        { type: 'perso', attendu: { A, Z: z }, q: `Écris son écriture conventionnelle : A en haut, Z en bas.`,
          monter: (zone, api) => notationSaisie(zone, api, { sym: el.sym, A, Z: z, N }),
          solution: `A = protons + neutrons = ${z} + ${N} = ${A} ; Z = ${z} : <span class="at-formule">${nota(A, z, el.sym)}</span>` },
      ],
    };
  }
  // saisie de A et Z à gauche du symbole
  function notationSaisie(zone, api, o) {
    zone.insertAdjacentHTML('beforeend', `<div class="at-nota-saisie">
        <div class="at-nota-saisie-az">
          <span class="at-nota-saisie-ligne"><span class="at-nota-saisie-l">A</span><input type="text" class="ph-champ" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="A : nombre de nucléons" data-k="A"></span>
          <span class="at-nota-saisie-ligne"><span class="at-nota-saisie-l">Z</span><input type="text" class="ph-champ" inputmode="numeric" autocomplete="off" spellcheck="false" aria-label="Z : numéro atomique" data-k="Z"></span>
        </div><span class="at-nota-saisie-x">${o.sym}${o.q ? `<sup>${ATOME.exposant(o.q)}</sup>` : ''}</span></div>
      <div class="er-actions"><button type="button" class="btn-primary">Valider</button></div>`);
    const iA = zone.querySelector('[data-k="A"]'), iZ = zone.querySelector('[data-k="Z"]'), b = zone.querySelector('.er-actions button');
    [iA, iZ].forEach(i => { i.addEventListener('input', () => { i.parentNode.classList.remove('ko'); api.effacer(); }); i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } }); });
    if (AT.surOrdi()) setTimeout(() => iA.focus({ preventScroll: true }), 50);
    function valider() {
      if (api.fini()) return;
      const A = AT.lire(iA.value), Z = AT.lire(iZ.value);
      if (!Number.isInteger(A) || !Number.isInteger(Z)) { api.message('Écris un nombre entier pour A et pour Z.'); return; }
      iA.classList.toggle('at-ko', A !== o.A); iZ.classList.toggle('at-ko', Z !== o.Z);
      if (A === o.A && Z === o.Z) { iA.disabled = iZ.disabled = b.disabled = true; api.reussi(); return; }
      let d;
      if (A === o.Z && Z === o.A) d = 'A (nombre de nucléons) s\'écrit en haut, Z (nombre de protons) en bas.';
      else if (Z !== o.Z) d = `Z est le nombre de protons : ${o.Z}.`;
      else if (A === o.N) d = `A est le nombre de nucléons : protons + neutrons = ${o.Z} + ${o.N} = ${o.A}.`;
      else if (o.e != null && A === o.Z + o.N + o.e) d = `Les électrons ne sont pas dans le noyau : A = protons + neutrons = ${o.A}.`;
      else d = `A = nombre de nucléons = protons + neutrons = ${o.Z} + ${o.N} = ${o.A}.`;
      api.erreur(d);
    }
    b.onclick = valider;
    return { montrer() { iA.value = o.A; iZ.value = o.Z; iA.disabled = iZ.disabled = b.disabled = true; iA.classList.remove('at-ko'); iZ.classList.remove('at-ko'); } };
  }

  // De Z (ou de ᴬ_Z X, ou du nombre d'électrons) à la configuration, puis les électrons de valence
  function qVersConfig(z, variante) {
    const el = E(z), A = el.A;
    const texteTotal = (t, nb) => `Ta configuration contient ${pl(t, 'électron')} ; l'atome en a Z = ${nb}.`;
    if (variante === 'nota') {
      return {
        theme: 'De l\'écriture du noyau à la configuration',
        enonce: `<p>On étudie l'atome <span class="at-donnee">${nota(A, z, el.sym)}</span></p>`,
        parties: [
          partieNombre({ q: 'Combien d\'électrons cet atome possède-t-il ?', label: 'électrons :', bonne: z,
            diag: v => (v === A ? `Tu as utilisé A = ${A} : le nombre d'électrons d'un atome est Z (ici ${z}).` : v === A - z ? `${A - z} est le nombre de neutrons. L'atome est neutre : autant d'électrons que de protons, Z = ${z}.` : `L'atome est neutre : il a autant d'électrons que de protons, soit Z = ${z}.`),
            solution: `${pl(z, 'électron')} : autant que de protons (Z = ${z}), car l'atome est neutre.` }),
          partieConfig(z, { texteTotal }),
          partieValence(z),
        ],
      };
    }
    const enonce = variante === 'e' ? `<p>Un atome possède <b>${pl(z, 'électron')}</b>.</p>`
      : `<p>Le numéro atomique ${el.nom === 'azote' || /^[aeéèêiouyh]/i.test(el.nom) ? 'de l\'' : 'du '}${el.nom} est <b>Z = ${z}</b>.</p>`;
    return {
      theme: 'Configuration électronique',
      enonce,
      parties: [partieConfig(z, { texteTotal }), partieValence(z)],
    };
  }
  // De la configuration au nombre d'électrons, à Z et à l'élément
  function qVersElement(z) {
    const el = E(z), c = ATOME.config(z);
    const somme = c.map(t => t[1]).join(' + ');
    const cand = [z - 1, z + 1, z - 8, z + 8, z - 2].filter((x, i, a) => x >= 1 && x <= 18 && a.indexOf(x) === i).slice(0, 3);
    const indices = {};
    cand.forEach(x => { indices[x] = `${E(x).nom[0].toUpperCase() + E(x).nom.slice(1)} a Z = ${x}. Ici Z = ${z}.`; });
    return {
      theme: 'De la configuration à l\'élément',
      enonce: `<p>Un atome a pour configuration électronique <span class="at-donnee">${cfg(z)}</span></p>`,
      parties: [
        partieNombre({ q: 'Combien d\'électrons possède-t-il ?', label: 'électrons :', bonne: z,
          diag: v => `Additionne tous les exposants : ${somme} = ${z}.`, solution: `${somme} = ${pl(z, 'électron')}.` }),
        partieNombre({ q: 'Quel est son numéro atomique Z ?', label: 'Z =', bonne: z,
          diag: v => `L'atome est neutre : il a autant de protons que d'électrons, donc Z = ${z}.`, solution: `Z = ${z} : ${pl(z, 'électron')}, donc ${pl(z, 'proton')} (car il est neutre).` }),
        { type: 'choix', q: 'Quel est cet élément ?', options: melanger([z].concat(cand)).map(x => ({ id: x, label: E(x).nom })), bonne: z, indices, melanger: false,
          solution: `Z = ${z} : c'est ${art(el)} (${el.sym}).` },
      ],
    };
  }
  // Électrons de valence d'une configuration donnée
  function qValence(z) {
    return {
      theme: 'Électrons de valence',
      enonce: `<p>Un atome a pour configuration électronique <span class="at-donnee">${cfg(z)}</span></p>`,
      parties: [partieValence(z)],
    };
  }

  function questionsConfig() {
    const p = pioche([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
    const fiche = hasard([9, 8, 3, 4]);       // éléments du tableau des nombres
    const qs = [qNoyau(fiche), qNoyauInverse(p()), qVersConfig(p(), 'Z'), qVersConfig(hasard([13, 15, 16, 17, 11, 12, 14]), 'nota'), qVersConfig(p(), 'e'),
      qVersElement(p()), qVersElement(p()), qValence(hasard([13, 14, 15, 16, 17])), qValence(p()), qValence(hasard([5, 6, 7, 8, 9]))];
    return qs;
  }

  /* ============================================================
     MODULE 4 : IONS ET COMPOSÉS IONIQUES
     ============================================================ */
  const IONS_STABLES = [1, 3, 4, 11, 12, 13, 9, 17, 8, 16];          // H⁺ Li⁺ Be²⁺ Na⁺ Mg²⁺ Al³⁺ F⁻ Cl⁻ O²⁻ S²⁻
  const regleTxt = n => (ATOME.regle(n) === 'duet' ? 'règle du duet' : 'règle de l\'octet');

  // Prévoir l'ion stable d'un élément à partir de sa configuration, puis la configuration de l'ion
  function qPrevoir(z) {
    const el = E(z), q = el.ion, n = z - q;
    const titre = `<p>${art(el)[0].toUpperCase() + art(el).slice(1)} ${el.sym} (Z = ${z}) a pour configuration électronique <span class="at-donnee">${cfg(z)}</span></p>`;
    const opts = [{ id: 'ok', label: f(el.sym, q) }];
    const indices = {};
    const ajouter = (id, qq, d) => { if (!opts.some(o => o.label === f(el.sym, qq)) && qq !== 0) { opts.push({ id, label: f(el.sym, qq) }); indices[id] = d; } };
    if (z === 1) {
      ajouter('signe', -1, 'L\'hydrogène forme l\'ion H<sup>+</sup> : il perd son unique électron (ion hydrogène, à connaître).');
      ajouter('deux', 2, 'L\'hydrogène n\'a qu\'un électron : il ne peut en perdre qu\'un.');
    } else {
      const g = ATOME.gazNobles(z), loin = q > 0 ? g.apres : g.avant;
      ajouter('signe', -q, q > 0 ? `${el.sym} perd ${pl(q, 'électron')} : la charge est positive (on enlève → +, à l'envers !).` : `${el.sym} gagne ${pl(-q, 'électron')} : la charge est négative (on ajoute → −, à l'envers !).`);
      if (loin) ajouter('loin', -loin.ecart, `${loin.ecart > 0 ? 'Gagner' : 'Perdre'} ${pl(Math.abs(loin.ecart), 'électron')} pour avoir la configuration de ${loin.sym} ? Le gaz noble le plus proche est ${ATOME.gazNobleProche(z).sym} : il suffit d'en ${q > 0 ? 'perdre' : 'gagner'} ${Math.abs(q)}.`);
      const q1 = q > 0 ? q - 1 : q + 1;
      if (q1) ajouter('moins', q1, `${f(el.sym, q1)} aurait ${pl(z - q1, 'électron')} : ${cfg(z - q1)}, ce n'est pas la configuration d'un gaz noble.`);
      else ajouter('plus', q > 0 ? q + 1 : q - 1, `${f(el.sym, q > 0 ? q + 1 : q - 1)} aurait ${pl(z - (q > 0 ? q + 1 : q - 1), 'électron')} : ${cfg(z - (q > 0 ? q + 1 : q - 1))}, ce n'est pas la configuration d'un gaz noble.`);
    }
    const parties = [{ type: 'choix', grand: true, q: 'Quel ion stable forme-t-il ?', options: opts, bonne: 'ok', indices,
      solution: z === 1 ? 'H perd son unique électron : <b>H<sup>+</sup></b>, l\'ion hydrogène (un cas à part : il n\'a plus d\'électron).'
        : `${el.sym} ${q > 0 ? 'perd' : 'gagne'} ${pl(Math.abs(q), 'électron')} pour avoir la configuration du gaz noble le plus proche, ${ATOME.gazNoble(n).sym} : <b>${f(el.sym, q)}</b>.` }];
    if (z === 1) {
      parties.push({ type: 'choix', grand: true, q: 'Combien d\'électrons l\'ion H<sup>+</sup> possède-t-il ?', options: [0, 1, 2].map(x => ({ id: x, label: String(x) })), bonne: 0, melanger: false,
        indices: { 1: 'H a 1 électron ; H<sup>+</sup> l\'a perdu : 1 − 1 = 0.', 2: 'H<sup>+</sup> a <b>perdu</b> son électron : 1 − 1 = 0 (on ne l\'ajoute pas).' },
        solution: 'Aucun : 1 − 1 = 0 électron. L\'ion H<sup>+</sup> est un proton seul.' });
    } else {
      parties.push(partieConfig(n, {
        q: `Écris la configuration électronique de l'ion ${f(el.sym, q)}.`,
        texteTotal: t => (t === z + q ? `${f(el.sym, q)} a <b>${q > 0 ? 'perdu' : 'gagné'}</b> ${pl(Math.abs(q), 'électron')} : ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${n}.`
          : t === z ? `C'est la configuration de l'atome. L'ion ${f(el.sym, q)} a ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${pl(n, 'électron')}.`
          : `Ta configuration contient ${pl(t, 'électron')} ; l'ion ${f(el.sym, q)} en a ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${n}.`),
        solution: `${f(el.sym, q)} : ${cfg(n)}, la configuration de ${ATOME.gazNoble(n).sym} (${regleTxt(n)}).`,
      }));
    }
    return { theme: 'Prévoir l\'ion stable', enonce: titre, parties };
  }

  // Cet ion existe-t-il ? configuration de l'ion, puis oui / non avec la raison
  const IONS_TESTES = [[11, -1], [11, 1], [9, -2], [9, -1], [9, 1], [13, 2], [13, 3], [13, -3], [8, -1], [8, -2], [12, 1], [12, 2], [3, -1], [3, 2], [3, 1], [17, -1], [17, 1], [16, -2], [16, -1], [4, 2], [4, 1]];
  function qExiste(z, q) {
    const el = E(z), n = z - q, gn = ATOME.gazNoble(n), oui = !!gn;
    const ion = f(el.sym, q);
    return {
      theme: 'Cet ion existe-t-il ?',
      enonce: `<p>On se demande si l'ion <span class="at-donnee">${ion}</span> existe.</p><p>${art(el)[0].toUpperCase() + art(el).slice(1)} a pour numéro atomique Z = ${z}.</p>`,
      parties: [
        partieConfig(n, {
          q: `Écris la configuration électronique de ${ion}.`,
          texteTotal: t => (t === z + q ? `${ion} a <b>${q > 0 ? 'perdu' : 'gagné'}</b> ${pl(Math.abs(q), 'électron')} : ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${n}.`
            : `Ta configuration contient ${pl(t, 'électron')} ; l'ion ${ion} en a ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${n}.`),
        }),
        { type: 'choix', colonne: true, q: `L'ion ${ion} est-il stable ?`, bonne: oui ? 'oui' : 'non',
          options: [
            { id: 'oui', label: 'Oui : sa configuration est celle d\'un gaz noble (He, Ne ou Ar).' },
            { id: 'non', label: 'Non : sa configuration n\'est pas celle d\'un gaz noble.' },
            { id: 'toujours', label: 'Oui : un atome peut toujours gagner ou perdre des électrons.' },
            { id: 'neutre', label: 'Non : un atome doit rester neutre.' },
          ],
          indices: {
            oui: `${cfg(n)} n'est pas la configuration d'un gaz noble (He : 1s<sup>2</sup>, Ne : …2s<sup>2</sup> 2p<sup>6</sup>, Ar : …3s<sup>2</sup> 3p<sup>6</sup>).`,
            non: `${cfg(n)} est la configuration de ${gn ? gn.sym : ''} : cet ion est stable.`,
            toujours: 'Un atome peut gagner ou perdre des électrons, mais l\'ion n\'est stable que s\'il a la configuration d\'un gaz noble.',
            neutre: 'Les atomes gagnent ou perdent des électrons pour avoir la configuration d\'un gaz noble : ils forment des ions.',
          },
          solution: oui ? `${ion} : ${cfg(n)}, la configuration de ${gn.sym} (${regleTxt(n)}) : il est stable.`
            : `${ion} : ${cfg(n)} n'est pas la configuration d'un gaz noble : cet ion n'existe pas${el.ion ? ` (${art(el)} forme ${f(el.sym, el.ion)})` : ''}.` },
      ],
    };
  }

  // Protons, neutrons, électrons d'un ion ; et l'inverse
  const IONS_NB = [[9, -1], [8, -2], [3, 1], [4, 2], [11, 1], [12, 2], [13, 3], [17, -1], [16, -2]];
  function qNombresIon(z, q) {
    const el = E(z), A = el.A, N = A - z, e = z - q, ion = f(el.sym, q);
    return {
      theme: 'Composition d\'un ion',
      enonce: `<p>On étudie l'ion <span class="at-donnee">${nota(A, z, el.sym, q)}</span></p>`,
      parties: [{
        type: 'champs', q: 'Combien a-t-il de protons, de neutrons et d\'électrons ?',
        champs: [{ id: 'p', label: 'protons', bonne: z }, { id: 'n', label: 'neutrons', bonne: N }, { id: 'e', label: 'électrons', bonne: e }],
        verifier(v) {
          const faux = ['p', 'n', 'e'].filter(k => v[k] !== { p: z, n: N, e }[k]);
          if (!faux.length) return { ok: true };
          let d;
          if (v.p !== z) d = `Le nombre de protons est Z = ${z} : il ne change pas quand l'atome devient un ion.`;
          else if (v.n !== N) d = `Nombre de neutrons = A − Z = ${A} − ${z} = ${N}.`;
          else if (v.e === z + q) d = `${ion} a <b>${q > 0 ? 'perdu' : 'gagné'}</b> ${pl(Math.abs(q), 'électron')} : ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${e}.`;
          else if (v.e === z) d = `La charge ${ATOME.exposant(q)} indique que l'ion a ${q > 0 ? 'perdu' : 'gagné'} ${pl(Math.abs(q), 'électron')} : ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${e}.`;
          else d = `${ion} a ${q > 0 ? 'perdu' : 'gagné'} ${pl(Math.abs(q), 'électron')} : ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${e}.`;
          return { diag: d, faux };
        },
        solution: `${pl(z, 'proton')} ; ${A} − ${z} = ${pl(N, 'neutron')} ; ${z} ${q > 0 ? MOINS : '+'} ${Math.abs(q)} = ${pl(e, 'électron')} (${q > 0 ? 'il a perdu' : 'il a gagné'} ${pl(Math.abs(q), 'électron')}).`,
      }],
    };
  }
  function qNombresIonInverse(z, q) {
    const el = E(z), A = el.A, N = A - z, e = z - q;
    const opts = [{ id: 'ok', label: nota(A, z, el.sym, q) }, { id: 'signe', label: nota(A, z, el.sym, -q) }, { id: 'neutre', label: nota(A, z, el.sym, 0) }];
    const indices = {
      signe: `${pl(z, 'proton')} et ${pl(e, 'électron')} : ${q > 0 ? 'il manque' : 'il y a en plus'} ${pl(Math.abs(q), 'électron')}, la charge est ${q > 0 ? 'positive' : 'négative'} : ${f(el.sym, q)}.`,
      neutre: `${pl(z, 'proton')} et ${pl(e, 'électron')} : la charge n'est pas nulle, c'est un ion.`,
    };
    if (e <= 18 && e !== z) { opts.push({ id: 'ze', label: nota(A, e, E(e).sym, 0) }); indices.ze = `L'élément est donné par le nombre de <b>protons</b> (Z = ${z}), pas par le nombre d'électrons.`; }
    else { opts.push({ id: 'an', label: nota(N, z, el.sym, q) }); indices.an = `A = protons + neutrons = ${z} + ${N} = ${A}.`; }
    return {
      theme: 'Écriture d\'un ion',
      enonce: `<p>Une entité a <b>${pl(z, 'proton')}</b>, <b>${pl(N, 'neutron')}</b> et <b>${pl(e, 'électron')}</b>.</p>`,
      parties: [{ type: 'choix', grand: true, q: 'Quelle est son écriture ?', options: opts, bonne: 'ok', indices,
        solution: `Z = ${z} (${el.nom}), A = ${z} + ${N} = ${A}, ${pl(e, 'électron')} pour ${pl(z, 'proton')} : charge ${enE(q)} → <span class="at-formule">${nota(A, z, el.sym, q)}</span>` }],
    };
  }

  // Charge d'un ion : en e, puis en coulombs
  const IONS_CHARGE = [['Cu', 29, 2], ['Fe', 26, 3], ['Fe', 26, 2], ['F', 9, -1], ['O', 8, -2], ['Na', 11, 1], ['Mg', 12, 2], ['Al', 13, 3], ['Cl', 17, -1], ['S', 16, -2], ['Ca', 20, 2]];
  function qCharge(sym, q) {
    const ion = f(sym, q), val = q * 1.60e-19;
    const cand = [q, -q, q > 0 ? 1 : -1, Math.abs(q) === 1 ? 2 * q : q / Math.abs(q)].filter((x, i, a) => a.indexOf(x) === i);
    const opts = cand.map(x => ({ id: String(x), label: enE(x) }));
    if (opts.length < 4) opts.push({ id: 'nb', label: String(Math.abs(q)) });
    const indices = { nb: `La charge s'écrit en multiple de e : ${enE(q)}.` };
    cand.forEach(x => { if (x !== q) indices[String(x)] = x === -q ? `${ion} a ${q > 0 ? 'perdu' : 'gagné'} ${pl(Math.abs(q), 'électron')} : sa charge est ${q > 0 ? 'positive' : 'négative'}, ${enE(q)}.` : `L'exposant ${ATOME.exposant(q)} donne la charge : ${enE(q)}.`; });
    return {
      theme: 'Charge d\'un ion',
      enonce: `<p>On étudie l'ion <span class="at-donnee">${ion}</span>.</p><p>Donnée : e = 1,60 × 10<sup>−19</sup> C.</p>`,
      parties: [
        { type: 'choix', grand: true, q: `Quelle est la charge de l'ion ${ion} ?`, options: opts, bonne: String(q), indices,
          solution: `${ion} ${q > 0 ? 'a perdu' : 'a gagné'} ${pl(Math.abs(q), 'électron')} : charge ${enE(q)}.` },
        { type: 'sci', q: 'Calcule cette charge en coulombs (3 chiffres significatifs).', label: 'q =', unite: 'C', calc: true, valeur: val, cs: 3, rel: 0.01,
          diag: v => (Math.abs(v + val) < Math.abs(val) * 0.01 ? (q < 0 ? `Un anion a une charge négative : q = ${enE(q)} = ${MOINS}${Math.abs(q)} × 1,60 × 10<sup>−19</sup> C.` : `Un cation a une charge positive : q = ${enE(q)}.`)
            : Math.abs(Math.abs(v) - 1.60e-19) < 1e-21 && Math.abs(q) > 1 ? `Multiplie e par le nombre de charges : q = ${q < 0 ? MOINS : ''}${Math.abs(q)} × 1,60 × 10<sup>−19</sup> C.`
            : Math.abs(Math.abs(v) / Math.abs(val) - 1) > 0.05 && Math.abs(Math.log10(Math.abs(v / val)) - Math.round(Math.log10(Math.abs(v / val)))) < 0.01 ? 'Vérifie la puissance de 10 : e = 1,60 × 10<sup>−19</sup> C.'
            : `q = ${q < 0 ? MOINS : ''}${Math.abs(q)} × 1,60 × 10<sup>−19</sup> C.`),
          solution: `q = ${q < 0 ? MOINS : ''}${Math.abs(q) > 1 ? Math.abs(q) + ' × ' : ''}1,60 × 10<sup>−19</sup> = <b>${q < 0 ? MOINS : ''}${sci(Math.abs(val))} C</b>${AT.revois(['puissances'])}` },
      ],
    };
  }

  // Atome, molécule, cation ou anion ?
  const ENTITES = [
    ['Na', 'atome'], ['Ne', 'atome'], ['Cu', 'atome'], ['Fe', 'atome'], ['He', 'atome'], ['C', 'atome'],
    ['H<sub>2</sub>O', 'molecule'], ['O<sub>2</sub>', 'molecule'], ['CO<sub>2</sub>', 'molecule'], ['N<sub>2</sub>', 'molecule'], ['CH<sub>4</sub>', 'molecule'], ['Cl<sub>2</sub>', 'molecule'],
    ['Mg<sup>2+</sup>', 'cation'], ['Na<sup>+</sup>', 'cation'], ['Fe<sup>3+</sup>', 'cation'], ['Cu<sup>2+</sup>', 'cation'], ['Al<sup>3+</sup>', 'cation'], ['H<sup>+</sup>', 'cation'],
    ['Cl<sup>−</sup>', 'anion'], ['F<sup>−</sup>', 'anion'], ['O<sup>2−</sup>', 'anion'], ['S<sup>2−</sup>', 'anion'], ['OH<sup>−</sup>', 'anion'],
  ];
  function qNature(x) {
    const [form, bon] = x;
    const charge = (form.match(/<sup>([^<]*)<\/sup>/) || [])[1];
    const NOM = { atome: 'Atome', molecule: 'Molécule', cation: 'Cation', anion: 'Anion' };
    const d = {};
    ['atome', 'molecule', 'cation', 'anion'].forEach(k => {
      if (k === bon) return;
      if (bon === 'molecule') d[k] = k === 'atome' ? `${form} est formée de plusieurs atomes liés : c'est une molécule.` : `${form} ne porte pas de charge : ce n'est pas un ion.`;
      else if (bon === 'atome') d[k] = k === 'molecule' ? `${form} est un seul atome : ce n'est pas une molécule.` : `${form} ne porte pas de charge : ce n'est pas un ion.`;
      else if (k === 'atome' || k === 'molecule') d[k] = `${form} porte une charge (${charge}) : c'est un ion.`;
      else d[k] = `Charge ${charge} : ${bon === 'cation' ? 'positive, c\'est un cation' : 'négative, c\'est un anion'} (charge + : cation ; charge − : anion).`;
    });
    const expl = { atome: 'un seul atome, sans charge', molecule: 'plusieurs atomes liés, sans charge', cation: `charge ${charge}, positive`, anion: `charge ${charge}, négative` }[bon];
    return {
      theme: 'Atome, molécule ou ion',
      enonce: `<p>On considère l'entité chimique <span class="at-donnee at-formule">${form}</span></p>`,
      parties: [{ type: 'choix', q: 'Comment la qualifier ?', options: ['atome', 'molecule', 'cation', 'anion'].map(k => ({ id: k, label: NOM[k] })), bonne: bon, melanger: false, indices: d,
        solution: `${form} : ${expl} → <b>${NOM[bon].toLowerCase()}</b>.` }],
    };
  }

  // Noms et formules des ions à connaître (Z ⩽ 18)
  const IONS_NOMS = [['H', 1, 'ion hydrogène', 'hydrogène'], ['Na', 1, 'ion sodium', 'sodium'], ['Mg', 2, 'ion magnésium', 'magnésium'], ['F', -1, 'ion fluorure', 'fluor'], ['Cl', -1, 'ion chlorure', 'chlore']];
  function qNoms(x, sens) {
    const [sym, q, nom, elt] = x, ion = f(sym, q);
    if (sens === 'formule') {
      const opts = [{ id: 'ok', label: ion }, { id: 'signe', label: f(sym, -q) }];
      const indices = { signe: q > 0 ? `L'${nom} est un cation : ${ion}.` : `L'${nom} est un anion (terminaison « ure ») : ${ion}.` };
      const q2 = q > 0 ? (q === 1 ? 2 : 1) : -2;
      opts.push({ id: 'nb', label: f(sym, q2) }); indices.nb = `L'${nom} porte la charge ${ATOME.exposant(q)} : ${ion}.`;
      if (sym === 'Cl' || sym === 'F') { opts.push({ id: 'mol', label: `${sym}<sub>2</sub>` }); indices.mol = `${sym}<sub>2</sub> est une molécule, pas un ion.`; }
      else { opts.push({ id: 'at', label: sym }); indices.at = `${sym} est l'atome : l'ion porte une charge.`; }
      return { theme: 'Noms et formules des ions', enonce: `<p>On parle de l'<b>${nom}</b>.</p>`,
        parties: [{ type: 'choix', grand: true, q: `Quelle est la formule de l'${nom} ?`, options: opts, bonne: 'ok', indices, solution: `${nom[0].toUpperCase() + nom.slice(1)} : <b>${ion}</b>.` }] };
    }
    const opts = [{ id: 'ok', label: nom }];
    const indices = {};
    if (q < 0) { opts.push({ id: 'ure', label: `ion ${elt}` }); indices.ure = `Le nom d'un anion monoatomique se termine en « ure » : ${nom}.`; }
    opts.push({ id: 'at', label: `atome ${/^[aeéèêiouyh]/i.test(elt) ? 'd\'' : 'de '}${elt}` }); indices.at = `${ion} porte une charge : c'est un ion, pas un atome.`;
    const autre = hasard(IONS_NOMS.filter(y => y[0] !== sym));
    opts.push({ id: 'autre', label: autre[2] }); indices.autre = `L'${autre[2]} a pour formule ${f(autre[0], autre[1])}.`;
    return { theme: 'Noms et formules des ions', enonce: `<p>On considère l'ion <span class="at-donnee">${ion}</span></p>`,
      parties: [{ type: 'choix', q: `Quel est le nom de l'ion ${ion} ?`, options: opts, bonne: 'ok', indices, solution: `${ion} : <b>${nom}</b>.` }] };
  }

  /* ---------- Composés ioniques ---------- */
  // ions : symbole écrit, charge, nom dans un composé (anion : « chlorure » ; cation : « de sodium »), groupe à parenthèses
  const CATIONS = { Na: ['Na', 1, 'sodium'], K: ['K', 1, 'potassium'], Ca: ['Ca', 2, 'calcium'], Mg: ['Mg', 2, 'magnésium'], Fe2: ['Fe', 2, 'fer II'], Fe3: ['Fe', 3, 'fer III'], Cu: ['Cu', 2, 'cuivre'], Al: ['Al', 3, 'aluminium'] };
  const ANIONS = { Cl: ['Cl', -1, 'chlorure'], F: ['F', -1, 'fluorure'], O: ['O', -2, 'oxyde'], S: ['S', -2, 'sulfure'], OH: ['OH', -1, 'hydroxyde', true], SO4: ['SO<sub>4</sub>', -2, 'sulfate', true] };
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : a);
  // formule d'un composé : indices les plus petits pour une charge totale nulle
  function formule(cat, an, opts) {
    opts = opts || {};
    const qc = cat[1], qa = -an[1], g = pgcd(qc, qa);
    let ic = qa / g, ia = qc / g;
    if (opts.inverses) [ic, ia] = [ia, ic];
    if (opts.un) { ic = 1; ia = 1; }
    const ind = k => (k > 1 ? `<sub>${k}</sub>` : '');
    const partA = an[3] && ia > 1 ? `(${an[0]})${ind(ia)}` : an[0] + ind(ia);
    const partC = cat[0] + ind(ic);
    if (opts.charges) return `${cat[0]}<sup>${ATOME.exposant(qc)}</sup>${ind(ic)}${an[3] ? `(${an[0]})<sup>${ATOME.exposant(-qa)}</sup>` : `${an[0]}<sup>${ATOME.exposant(-qa)}</sup>`}${ind(ia)}`;
    if (opts.anionDabord) return partA + partC;
    return partC + partA;
  }
  const nomCompose = (cat, an) => `${an[2]} ${/^[aeéèêiouyh]/i.test(cat[2]) ? 'd\'' : 'de '}${cat[2]}`;
  const ionHTML = x => (x[3] ? `${x[0]}<sup>${ATOME.exposant(x[1])}</sup>` : f(x[0], x[1]));
  const COMPOSES = [['Na', 'Cl'], ['Ca', 'F'], ['K', 'Cl'], ['Fe2', 'Cl'], ['Fe3', 'Cl'], ['Mg', 'Cl'], ['Al', 'Cl'], ['Na', 'O'], ['Mg', 'O'], ['Al', 'O'], ['Cu', 'SO4'], ['Cu', 'OH'], ['Na', 'S'], ['Ca', 'Cl']];

  function qFormuleCompose(k) {
    const cat = CATIONS[k[0]], an = ANIONS[k[1]], bon = formule(cat, an);
    const qc = cat[1], qa = -an[1], g = pgcd(qc, qa), ic = qa / g, ia = qc / g;
    const opts = [{ id: 'ok', label: bon }, { id: 'charges', label: formule(cat, an, { charges: true }) }, { id: 'anion', label: formule(cat, an, { anionDabord: true }) }];
    const indices = {
      charges: `Dans la formule d'un composé ionique, on n'écrit pas les charges : ${bon}.`,
      anion: `On écrit d'abord le cation, puis l'anion : ${bon}.`,
    };
    if (ic !== ia) { opts.push({ id: 'inv', label: formule(cat, an, { inverses: true }) }); indices.inv = `Il faut ${ia > 1 ? ia + ' ions ' + ionHTML(an) : 'un ion ' + ionHTML(an)} pour compenser ${ic > 1 ? 'les charges de ' + ic + ' ions ' + ionHTML(cat) : 'la charge ' + ATOME.exposant(qc) + ' d\'un ion ' + ionHTML(cat)} : ${bon}.`; }
    if (ic !== 1 || ia !== 1) { opts.push({ id: 'un', label: formule(cat, an, { un: true }) }); indices.un = `Avec un ion de chaque, la charge totale vaudrait (${sg(qc)}) + (${sg(-qa)}) = ${sg(qc - qa)} : le composé ne serait pas neutre.`; }
    else { const d2 = cat[0] + '<sub>2</sub>' + (an[3] ? `(${an[0]})<sub>2</sub>` : an[0] + '<sub>2</sub>'); opts.push({ id: 'pas', label: d2 }); indices.pas = `Les indices sont les plus petits possibles : ${bon}.`; }
    return {
      theme: 'Formule d\'un composé ionique',
      enonce: `<p>Un composé ionique est formé des ions <span class="at-donnee">${ionHTML(cat)}</span> et <span class="at-donnee">${ionHTML(an)}</span></p>`,
      parties: [{ type: 'choix', grand: true, q: 'Quelle est sa formule ?', options: opts, bonne: 'ok', indices,
        solution: `Électroneutralité : ${ic > 1 ? ic + ' × ' : ''}(${sg(qc)}) + ${ia > 1 ? ia + ' × ' : ''}(${sg(-qa)}) = 0 → <b class="at-formule">${bon}</b> (cation d'abord, sans les charges, indices les plus petits).` }],
    };
  }
  const NOMMES = [['Na', 'Cl'], ['K', 'Cl'], ['Ca', 'F'], ['Mg', 'Cl'], ['Fe2', 'Cl'], ['Fe3', 'Cl'], ['Na', 'F'], ['Ca', 'Cl'], ['Al', 'Cl'], ['Mg', 'F']];
  function qNomCompose(k) {
    const cat = CATIONS[k[0]], an = ANIONS[k[1]], form = formule(cat, an), bon = nomCompose(cat, an);
    const elA = { chlorure: 'chlore', fluorure: 'fluor' }[an[2]];
    const opts = [{ id: 'ok', label: bon }, { id: 'ordre', label: `${cat[2]} ${an[2]}` }, { id: 'ure', label: nomCompose(cat, [an[0], an[1], elA]) }];
    const indices = { ordre: `On écrit d'abord le nom de l'anion, puis celui du cation : ${bon}.`, ure: `L'anion prend la terminaison « ure » : ${an[2]}.` };
    if (k[0] === 'Fe2' || k[0] === 'Fe3') {
      const autre = k[0] === 'Fe2' ? CATIONS.Fe3 : CATIONS.Fe2;
      opts.push({ id: 'charge', label: nomCompose(autre, an) });
      indices.charge = `${form.match(/<sub>(\d)<\/sub>/) ? form.match(/<sub>(\d)<\/sub>/)[1] : 1} ions Cl<sup>−</sup> : charge ${cat[1]}− à compenser, l'ion fer est Fe<sup>${cat[1]}+</sup> : ${cat[2]}.`;
    } else {
      const autreA = an[0] === 'Cl' ? ANIONS.F : ANIONS.Cl;
      opts.push({ id: 'an', label: nomCompose(cat, autreA) });
      indices.an = `${ionHTML(an)} est l'ion ${an[2]} ; ${ionHTML(autreA)} est l'ion ${autreA[2]}.`;
    }
    return {
      theme: 'Nom d\'un composé ionique',
      enonce: `<p>On considère le composé ionique <span class="at-donnee at-formule">${form}</span></p>`,
      parties: [{ type: 'choix', q: 'Quel est son nom ?', options: opts, bonne: 'ok', indices,
        solution: `Nom de l'anion (${ionHTML(an)} : ${an[2]}), puis du cation (${ionHTML(cat)}) : <b>${bon}</b>.` }],
    };
  }
  // ion manquant : formule du composé et un des ions donnés
  const MANQUANTS = [['Ca', 'F', 'cat'], ['Mg', 'Cl', 'cat'], ['Al', 'Cl', 'cat'], ['Fe3', 'Cl', 'cat'], ['Cu', 'SO4', 'cat'], ['Na', 'O', 'an'], ['K', 'S', 'an'], ['Na', 'S', 'an'], ['Ca', 'Cl', 'cat']];
  function qManquant(k) {
    const cat = CATIONS[k[0]], an = ANIONS[k[1]], form = formule(cat, an), cherche = k[2] === 'cat' ? cat : an, donne = k[2] === 'cat' ? an : cat;
    const qc = cat[1], qa = -an[1], g = pgcd(qc, qa), ic = qa / g, ia = qc / g;
    const nbDonne = k[2] === 'cat' ? ia : ic, nbCherche = k[2] === 'cat' ? ic : ia;
    const q = cherche[1], s = cherche[0];
    const opts = [{ id: 'ok', label: ionHTML(cherche) }, { id: 'signe', label: ionHTML([s, -q, '', cherche[3]]) }];
    const indices = { signe: `${k[2] === 'cat' ? 'L\'ion cherché compense les charges négatives : il est positif.' : 'L\'ion cherché compense les charges positives : il est négatif.'}` };
    const q1 = q > 0 ? (q === 1 ? 2 : 1) : (q === -1 ? -2 : -1);
    opts.push({ id: 'nb', label: ionHTML([s, q1, '', cherche[3]]) });
    indices.nb = `${nbDonne} ion${nbDonne > 1 ? 's' : ''} ${ionHTML(donne)} : charge ${nbDonne > 1 ? nbDonne + ' × ' : ''}(${sg(donne[1])}) = ${sg(nbDonne * donne[1])} ; pour que le composé soit neutre, ${nbCherche > 1 ? `les ${nbCherche} ions cherchés portent ensemble` : 'l\'ion cherché porte'} ${sg(-nbDonne * donne[1])}.`;
    const nomCh = k[2] === 'cat' ? `l'ion ${cat[2].replace(/ I+$/, '')}` : `l'ion ${an[2]}`;
    return {
      theme: 'Ion manquant',
      enonce: `<p>Le composé ionique <b>${nomCompose(cat, an)}</b> a pour formule <span class="at-donnee at-formule">${form}</span>.</p><p>Il contient l'ion <span class="at-donnee">${ionHTML(donne)}</span>.</p>`,
      parties: [{ type: 'choix', grand: true, q: `Quelle est la formule de ${nomCh} ?`, options: opts, bonne: 'ok', indices,
        solution: `Électroneutralité : ${nbDonne > 1 ? nbDonne + ' × ' : ''}(${sg(donne[1])}) + ${nbCherche > 1 ? nbCherche + ' × ' : ''}(${sg(q)}) = 0 → <b>${ionHTML(cherche)}</b>.` }],
    };
  }

  function questionsIons() {
    const ps = AT.tirer(IONS_STABLES, 2);
    const ex = hasard(IONS_TESTES), nb = hasard(IONS_NB), nb2 = hasard(IONS_NB.filter(x => x !== nb));
    const ch = hasard(IONS_CHARGE);
    return [
      qPrevoir(ps[0]), qPrevoir(ps[1]), qExiste(ex[0], ex[1]),
      Math.random() < 0.6 ? qNombresIon(nb[0], nb[1]) : qNombresIonInverse(nb2[0], nb2[1]),
      qCharge(ch[0], ch[2]), qNature(hasard(ENTITES)), qNoms(hasard(IONS_NOMS), Math.random() < 0.5 ? 'formule' : 'nom'),
      qFormuleCompose(hasard(COMPOSES)), qNomCompose(hasard(NOMMES)), qManquant(hasard(MANQUANTS)),
    ];
  }

  Object.assign(AT, {
    questionsConfig, questionsIons,
    // fabriques, utiles pour vérifier l'application
    fabriques: { qNoyau, qNoyauInverse, qVersConfig, qVersElement, qValence, qPrevoir, qExiste, qNombresIon, qNombresIonInverse, qCharge, qNature, qNoms, qFormuleCompose, qNomCompose, qManquant,
      formule, nomCompose, COMPOSES, NOMMES, MANQUANTS, IONS_TESTES, IONS_NB, IONS_CHARGE, ENTITES, IONS_NOMS, CATIONS, ANIONS },
  });
})();
