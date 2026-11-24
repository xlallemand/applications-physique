/* ============================================================
   Module 4 : entraînement (série notée sur 20)
   LW.questionsEntrainement() → 10 questions de trois sortes (parties 'perso' reprenant les outils
   des modules 1 à 3, plusieurs exemplaires possibles dans la page) :
     construire  petites molécules du module 1 et C2H6S (les deux molécules possibles sont acceptées) ;
     vérifier    schéma juste ou faux (une seule erreur), conclure avec les expressions à piocher ;
     compléter   doublets non liants ou liaison multiple manquants.
   Une question sur deux commence par la méthode : électrons de valence (d'après la configuration
   ou d'après la position dans la classification), électrons à gagner, liaisons, doublets non liants.
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const pl = LW.pl;
  const CONSTRUIRE = ['h2o', 'nh3', 'ch4', 'h2s', 'co2', 'n2', 'o2', 'hcl', 'cl2', 'ch3cl', 'c2h6s'];
  const VERIFIER = ['h2o', 'nh3', 'ch4', 'h2s', 'co2', 'hcl', 'hocl', 'ch3cl', 'ch4o', 'ch5n', 'c2h6', 'hcn', 'cf4', 'methanal'];
  const COMPLETER = ['h2o', 'nh3', 'h2s', 'hocl', 'ch3cl', 'ch4o', 'ch5n', 'methanal', 'methanimine', 'ethanamine', 'ethanediol', 'co2', 'n2', 'hcn', 'o2', 'c2h3cl', 'c3h3n', 'cf4'];
  const sans = h => String(h).replace(/<b class="er-ko">Ce n'est pas ça\.<\/b>\s*/, '');

  // zone de travail et message local d'une partie (refus, informations : sans erreur comptée)
  function cadreQuestion(zone, petit) {
    zone.innerHTML = `<div class="lw-q-zone${petit ? ' lw-q-petit' : ''}" data-q="z"></div><div class="lw-q-outils" data-q="o"></div><div class="lw-q-msg" data-q="m" aria-live="polite"></div>`;
    const m = zone.querySelector('[data-q="m"]');
    return {
      z: zone.querySelector('[data-q="z"]'), o: zone.querySelector('[data-q="o"]'),
      msg(h, type) {
        if (!h || type === 'ok') { m.innerHTML = ''; return; }
        m.innerHTML = `<div class="${type === 'refus' ? 'callout-danger' : 'callout-accent'}">${h}</div>`;
      },
    };
  }

  /* ---------- Méthode : ligne du tableau des atomes ---------- */
  function partieMethode(mol) {
    const els = [...new Set(mol.atomes.map(a => a.el))].filter(el => el !== 'H');
    const el = LW.hasard(els.length ? els : ['H']);
    const s = LW.info(el), b = LW.ligneAtome(el), Z = s.Z;
    const position = Math.random() < .5;
    const n = ATOME.derniereCouche(ATOME.config(Z)), col = b.v <= 2 ? b.v : b.v + 10;
    const donnee = position ? `${el} est dans la <b>ligne ${n}</b> et la <b>colonne ${col}</b> de la classification périodique.`
      : `Configuration électronique de ${el} : <span class="lw-conf">${ATOME.configHTML(Z)}</span>.`;
    return {
      type: 'champs', ligne: true,
      q: `${donnee} Pour ${el}, donne :`,
      champs: [
        { id: 'v', label: 'Électrons de valence', bonne: b.v },
        { id: 'g', label: 'Électrons à gagner', bonne: b.g },
        { id: 'l', label: 'Liaisons', bonne: b.l },
        { id: 'd', label: 'Doublets non liants', bonne: b.d },
      ],
      verifier(x) {
        const faux = ['v', 'g', 'l', 'd'].filter(k => x[k] !== b[k]);
        if (!faux.length) return { ok: true };
        return { diag: LW.diagLigne(el, x, position ? 'position' : 'config'), faux };
      },
      solution: `${el} : ${pl(b.v, 'électron')} de valence ; il en gagne ${b.g} pour en avoir ${s.regle} (${s.regle === 2 ? 'règle du duet' : 'règle de l\'octet'}) → <b>${pl(b.l, 'liaison')}</b> ; ${b.d ? `il reste ${b.v - b.l} électrons → <b>${LW.doublets(b.d)}</b>` : '<b>aucun doublet non liant</b>'}.`,
    };
  }

  /* ---------- Construire ---------- */
  function qConstruire(id) {
    const deux = id === 'c2h6s';
    const mol = LW.molecule(deux ? 'c2h6s1' : id);
    const cibles = deux ? [LW.molecule('c2h6s1'), LW.molecule('c2h6s2')] : [mol];
    return {
      theme: 'Construire une molécule',
      mol,
      consigne: deux ? `Construis <b>une</b> molécule de formule ${mol.f} (il y en a deux possibles).` : `Construis la molécule de ${mol.nom} (${mol.f}).`,
      parties: [{
        type: 'perso',
        q: 'Relie les traits libres deux à deux : glisse un trait vers un trait d\'un autre atome, ou touche les deux. Glisse un atome pour le déplacer ; touche une liaison pour la défaire.',
        monter(zone, api) {
          const c = cadreQuestion(zone);
          const outil = LW.constructeur(c.z, mol, {
            cibles,
            message(h, type) { if (type === 'ko') { c.msg(''); api.erreur(sans(h)); } else { api.effacer(); c.msg(h, type); } },
            surFin(r) { if (r.ok) { c.msg(''); api.reussi(); } },
          });
          return { montrer() { outil.montrer(); c.msg(''); } };
        },
        solution: () => `Chaque atome a la configuration d'un gaz noble : ${LW.bilanJuste(mol)}${deux ? ` Les deux molécules possibles : ${LW.MOL.c2h6s1.semi} et ${LW.MOL.c2h6s2.semi}.` : ''}`,
      }],
      bilan: `${mol.f} : ${LW.bilanJuste(mol)}`,
    };
  }

  /* ---------- Vérifier ---------- */
  function qVerifier(id) {
    let mol = LW.molecule(id), juste = Math.random() < .3;
    if (!juste) {
      const types = LW.melanger(['moinsDoublet', 'plusDoublet', 'double', 'hDouble', 'manqueH']);
      let v = null;
      for (const t of types) { v = LW.fausser(mol, t); if (v) break; }
      if (v) mol = Object.assign(v.mol, { f: mol.f, nom: mol.nom }); else juste = true;
    }
    return {
      theme: 'Vérifier un schéma',
      mol,
      consigne: `Voici un schéma de Lewis proposé pour la molécule ${mol.f}. Est-il juste ? Conclus avec les expressions : touche-les (ou glisse-les) dans l'ordre.`,
      parties: [{
        type: 'perso',
        monter(zone, api) {
          const c = cadreQuestion(zone, true);
          const v = LW.vue(c.z, mol, { fmax: 22 });
          const conc = LW.conclusion(c.o, mol, {
            raisons: 6,
            surChange() { api.effacer(); },
            surValider(r) {
              if (r.vide) return api.message(r.diag);
              if (!r.ok) return api.erreur(r.diag);
              montrerFautes(); api.reussi();
            },
          });
          function montrerFautes() {
            v.rendre({ marques: new Set(mol.atomes.map((a, i) => i).filter(i => LW.diagAtome(mol, i))), etiquettes: LW.analyse(mol).map(a => ({ t: `${a.e} e<tspan dy="-.45em" font-size=".75em">−</tspan>`, faux: !a.ok })) });
          }
          return { montrer() { conc.montrer(); montrerFautes(); } };
        },
        solution: () => (LW.analyse(mol).every(a => a.bon) ? `Le schéma est juste : ${LW.bilanJuste(mol)}` : `Le schéma est faux : ${LW.correction(mol)}`),
      }],
      bilan: LW.analyse(mol).every(a => a.bon) ? `Schéma juste : ${LW.bilanJuste(mol)}` : `Schéma faux : ${LW.correction(mol)}`,
    };
  }

  /* ---------- Compléter ---------- */
  function qCompleter(id) {
    const sol = LW.molecule(id);
    const multiple = sol.liaisons.some(l => l.o > 1), heteros = sol.atomes.some(a => a.d > 0);
    const liaisons = multiple && (!heteros || Math.random() < .5);
    const mol = LW.molecule(id, m => {
      if (liaisons) m.liaisons.forEach(l => { l.o = 1; });
      else {
        // les doublets non liants d'un ou de tous les éléments qui en ont
        const els = [...new Set(m.atomes.filter(a => a.d > 0).map(a => a.el))];
        const pris = Math.random() < .5 ? els : [LW.hasard(els)];
        m.atomes.forEach(a => { if (pris.indexOf(a.el) >= 0) a.d = 0; });
      }
    });
    return {
      theme: 'Compléter un schéma',
      mol,
      consigne: `Ce schéma de Lewis de la molécule ${mol.f}${mol.nom ? ` (${mol.nom})` : ''} est incomplet : il manque ${liaisons ? 'une liaison double ou triple' : 'des doublets non liants'}. Complète-le, puis vérifie.`,
      parties: [{
        type: 'perso',
        monter(zone, api) {
          const c = cadreQuestion(zone, true);
          const outil = LW.completeur(c.z, c.o, mol, {
            solution: sol,
            message(h, type) { api.effacer(); c.msg(h, type); },
            surVerif(r) { c.msg(''); if (r.ok) api.reussi(); else api.erreur(r.diag); },
          });
          return { montrer() { outil.montrer(); c.msg(''); } };
        },
        solution: () => `Chaque atome a la configuration d'un gaz noble : ${LW.bilanJuste(sol)}`,
      }],
      bilan: `${mol.f} : ${LW.bilanJuste(sol)}`,
    };
  }

  // 10 questions : 4 à construire, 3 à vérifier, 3 à compléter ; la méthode une question sur deux
  function questionsEntrainement() {
    const qs = LW.melanger(
      LW.tirer(CONSTRUIRE, 4).map(qConstruire)
        .concat(LW.tirer(VERIFIER, 3).map(qVerifier))
        .concat(LW.tirer(COMPLETER, 3).map(qCompleter)));
    qs.forEach((q, i) => {
      if (i % 2 === 0) {
        q.parties.unshift(partieMethode(q.mol));
        q.consigne = 'Commence par la méthode : électrons de valence, électrons à gagner, liaisons et doublets non liants. ' + q.consigne;
      }
    });
    return qs;
  }

  LW.questionsEntrainement = questionsEntrainement;
})();
