/* ============================================================
   Équations en physique (smartphone) — une question « combiner des équations »
   à l'écran (objet EPM.QC), partagée par la séance et la Découverte
   ------------------------------------------------------------
   Carte de la question (maquette validée : A2 + A4, B1, C1, D1/D3, F2, G1, E1) :
     - contexte physique et légende des grandeurs, consigne « Exprime … en fonction de … » ;
     - difficulté 1 : bandeau d'objectif (grandeurs permises, grandeurs à éliminer,
       barrées une fois éliminées) ; difficultés 2 et 3 : consigne seule ;
     - aides toujours disponibles : rappel, indices successifs, exemple (autre question
       de la même compétence, résolue), solution (0 point) ;
     - CO8 : formulaire du chapitre, « + Utiliser » (4 équations au plus) ;
     - résumé de toutes les équations (état en cours, « ✓ reportée dans l'éq. 2 »),
       puis un onglet par équation (téléphone) ; à partir de 900 px, les éditeurs
       côte à côte, 2 par ligne ;
     - un éditeur à tuiles par équation (assets/equations.js) : dès qu'une grandeur est
       seule à gauche d'une équation (étape vérifiée), l'outil « grandeur = expression »
       apparaît dans la réserve des autres équations qui la contiennent ; on le glisse
       sur la grandeur à remplacer ; simplification en deux appuis (même fraction, ou
       facteur commun aux deux membres) ;
     - fin : grandeur cherchée seule à gauche, grandeurs permises seulement, plus rien
       à simplifier (EPM.CO.controle) ; bilan, équation inutile expliquée.
   Points : 2 sans erreur, 1 après une erreur (étape fausse, déplacement refusé),
   0 solution affichée.
   API :
     EPM.QC.monter(carte, q, opts) → { terminer(pts) }
        q    : question de EPM.CO.question(id)
        opts : { rappel: true|false, surFin(pts, zoneActions, { aide, diff }) }
     EPM.QC.solutionHTML(q)       résolution détaillée (une étape par ligne)
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM, CO = EPM.CO;
  const el = EPM.el, bouton = EPM.bouton;
  const MAX = 4;     // équations au plus (formulaire)

  // une équation en écriture compacte, figée (HTML)
  const ligneEq = (txt, g) => { const e = EQ.lire(txt, g); return EQ.ligne(e.left, e.right); };
  // résolution détaillée : un commentaire, puis l'égalité, ligne par ligne
  function solutionHTML(q) {
    if (!q.res) return '';
    return '<div class="pmc-sol">' + q.res.lignes.map(l => '<p class="pmc-sol-t">' + l.texte + '</p><div class="pmc-sol-l' + (l.final ? ' pmc-final' : '') + '">' + ligneEq(l.eq, q.g) + '</div>').join('') + '</div>';
  }
  // grandeurs d'un état de l'éditeur
  function idsDe(st) {
    const o = new Set();
    (function voir(n) {
      if (!n) return;
      if (n.kind === 'simple') n.items.forEach(it => { if (it.id !== 'one') o.add(it.id); });
      else if (n.kind === 'seq') n.slots.forEach(voir);
      else if (n.kind === 'frac') { voir(n.num); voir(n.den); }
      else if (n.kind === 'func') voir(n.inner);
      else if (n.kind === 'sum') n.terms.forEach(t => voir(t.node));
    })({ kind: 'seq', slots: [st.left, st.right] });
    return o;
  }
  // grandeur seule à gauche (sans puissance) et absente à droite : elle peut se reporter
  function isolee(st) {
    let l = st.left;
    // produit d'une seule case, éventuellement imbriqué : son contenu
    while (l && l.kind === 'seq' && l.slots.length === 1) l = l.slots[0];
    if (!l || l.kind !== 'simple' || l.items.length !== 1) return null;
    const it = l.items[0];
    if ((it.pow || 1) !== 1 || it.id === 'one' || CO.NB[it.id]) return null;
    return idsDe({ left: { kind: 'simple', items: [] }, right: st.right }).has(it.id) ? null : it.id;
  }
  const pastille = (x, q, cls) => '<span class="pmc-g' + (cls ? ' ' + cls : '') + '">' + q.lab(x) + '</span>';

  function monter(carte, q, opts) {
    opts = opts || {};
    let erreurs = 0, fini = false, nInd = 0, aide = false;
    EPM.questionEnCours = q;                     // question affichée (tests automatiques)
    const g = q.g, lab = q.lab;
    // contexte, légende, consigne
    const ctx = el('div', 'pm-contexte');
    ctx.innerHTML = '<p class="pm-intro-q">' + q.ctx + '</p><p class="pm-leg">' + q.leg + '</p>';
    carte.appendChild(ctx);
    carte.appendChild(el('p', 'er-consigne pm-consigne', q.consigne.replace(/<i>/g, '<b class="pm-cible">').replace(/<\/i>/g, '</b>') + ' Écris-la <b>seule, à gauche</b> du signe =, sans rien à simplifier.'));
    // difficulté 1 : bandeau d'objectif (D1)
    let obj = null;
    if (q.diff === 1) {
      obj = el('div', 'pmc-obj');
      carte.appendChild(obj);
    }
    function majObjectif() {
      if (!obj) return;
      const etats = actifs().map(e => idsDe(e.ed.ops.etat()));
      const elimine = x => etats.some(s => s.has(q.cible) && !s.has(x));
      obj.innerHTML = '<p><span class="pmc-lab">Objectif</span> ' + pastille(q.cible, q, 'pmc-cible') + ' = … avec ' + q.avecSansNb.map(x => pastille(x, q)).join(' ') + '</p>' +
        (q.elim.length ? '<p><span class="pmc-lab">À éliminer</span> ' + q.elim.map(x => pastille(x, q, 'pmc-elim' + (elimine(x) ? ' pmc-fait' : '')) + (elimine(x) ? '<span class="pmc-ok" aria-label="éliminée">✓</span>' : '')).join(' ') + '</p>' : '');
    }
    // aides
    const barre = el('div', 'pm-aides');
    barre.setAttribute('role', 'group'); barre.setAttribute('aria-label', 'Aides');
    const zRap = el('div', 'pm-aide'), zInd = el('div', 'pm-aide'), zEx = el('div', 'pm-aide'), zSol = el('div', 'pm-aide');
    const bRap = bouton('btn-small', '📖 Rappel', () => {
      const oui = !zRap.firstChild;
      if (oui) aide = true;
      zRap.innerHTML = '';
      if (oui) { zRap.appendChild(EPM.blocRappel(q.comp)); EPM.monterCalc(zRap); EPM.versVue(zRap); }
      bRap.setAttribute('aria-expanded', oui);
    });
    bRap.setAttribute('aria-expanded', 'false');
    const I = q.indices;
    const bInd = bouton('btn-small', '💡 Indice', () => {
      if (nInd >= I.length) return;
      aide = true;
      const d = el('div', 'pm-indice', '<b>Indice ' + (nInd + 1) + '.</b> ' + I[nInd]);
      zInd.appendChild(d);
      nInd++;
      majInd();
      EPM.versVue(d);
    });
    const majInd = () => {
      bInd.innerHTML = nInd >= I.length ? '💡 Tous les indices sont affichés' : nInd ? '💡 Indice suivant (' + (nInd + 1) + '/' + I.length + ')' : '💡 Indice';
      bInd.disabled = nInd >= I.length;
    };
    // exemple : une autre question de la même compétence, résolue
    const bEx = bouton('btn-small', '✎ Exemple', () => montrerExemple());
    function montrerExemple() {
      aide = true;
      const L = CO.questions(q.comp).filter(x => x.id !== q.id);
      zEx.innerHTML = '';
      const b = el('div', 'pm-rappel');
      if (!L.length) { b.innerHTML = '<p>Pas d’autre exemple pour cette compétence : affiche le rappel.</p>'; zEx.appendChild(b); return; }
      const e = CO.question(L[Math.floor(Math.random() * L.length)].id);
      const eqs = e.form ? e.utiles.map(k => e.eqs[k]) : e.eqs;
      b.innerHTML = '<p class="pm-rappel-t">Exemple : ' + e.titre + '</p><p>' + e.ctx + '</p>' +
        '<div class="pmc-ex-eqs">' + eqs.map((x, k) => '<div class="pmc-ex-l"><span class="pmc-num">Éq. ' + (k + 1) + '</span>' + ligneEq(x.txt, e.g) + '</div>').join('') + '</div>' +
        '<p>' + e.consigne + '</p>' + solutionHTML(e);
      const r2 = el('div', 'pm-rangee');
      r2.appendChild(bouton('btn-small', '↻ Un autre exemple', montrerExemple));
      r2.appendChild(bouton('btn-small', 'Fermer', () => { zEx.innerHTML = ''; }));
      b.appendChild(r2);
      zEx.appendChild(b);
      EQ.finir(b);
      EPM.versVue(b);
    }
    const bSol = bouton('btn-small', 'Afficher la solution', () => {
      if (fini) return;
      zSol.innerHTML = '';
      const c = el('div', 'callout', '<b>Réponse.</b> Une résolution détaillée (0 point pour cette question) :' + solutionHTML(q));
      zSol.appendChild(c);
      EQ.finir(c);
      terminer(0);
    });
    majInd();
    (opts.rappel === false ? [bInd, bEx, bSol] : [bRap, bInd, bEx, bSol]).forEach(b => barre.appendChild(b));
    carte.appendChild(barre);
    [zRap, zInd, zEx].forEach(z => carte.appendChild(z));

    /* ---------- CO8 : formulaire du chapitre (E1) ---------- */
    let form = null;
    if (q.form) {
      form = el('div', 'pmc-form');
      carte.appendChild(form);
    }
    function majFormulaire() {
      if (!form) return;
      const n = actifs().length;
      form.innerHTML = '';
      form.appendChild(el('p', 'pmc-titre', 'Formulaire du chapitre : ' + q.form.titre));
      q.eqs.forEach((e, k) => {
        const l = el('div', 'pmc-form-l' + (eds[k] ? ' pris' : ''));
        l.innerHTML = '<span class="pmc-form-eq">' + EQ.ligne(e.G, e.D) + '</span><span class="pmc-form-nom">' + q.form.noms[k] + '</span>';
        if (eds[k]) {
          const libre = eds[k].ed.ops.historique().length === 1 && !utilisee(k) && JSON.stringify(eds[k].ed.ops.etat()) === JSON.stringify({ left: e.G, right: e.D });
          l.appendChild(el('span', 'pm-tag pm-tag-niv', '✓ Prise'));
          if (libre && !fini) l.appendChild(bouton('btn-small', 'Retirer', () => { retirer(k); }, 'Retirer la formule : ' + q.form.noms[k]));
        } else {
          const b = bouton('btn-small', '+ Utiliser', () => { ajouter(k); }, 'Utiliser la formule : ' + q.form.noms[k]);
          b.disabled = fini || n >= MAX;
          l.appendChild(b);
        }
        form.appendChild(l);
      });
      form.appendChild(el('p', 'pm-petit', 'Ton travail : ' + n + ' / ' + MAX + ' équations. ' + (n >= MAX ? 'Retire une formule pas encore utilisée pour en prendre une autre.' : 'Prends les formules qui te seront utiles.')));
      EQ.finir(form);
    }

    /* ---------- résumé, onglets, éditeurs (A2 + A4) ---------- */
    const resume = el('div', 'pmc-resume');
    resume.setAttribute('aria-label', 'Tes équations');
    const onglets = el('div', 'pmc-onglets');
    onglets.setAttribute('role', 'tablist');
    onglets.setAttribute('aria-label', 'Équations');
    const grille = el('div', 'pmc-eds');
    carte.appendChild(resume);
    carte.appendChild(onglets);
    carte.appendChild(grille);
    const bilan = el('div', 'pm-retour');
    bilan.setAttribute('aria-live', 'polite');
    carte.appendChild(bilan);
    carte.appendChild(zSol);
    const act = el('div', 'er-actions pm-suite');
    carte.appendChild(act);

    const eds = [];               // un éditeur par équation (k : rang de l'équation) : { ed, zone, k, rang }
    const reportee = {};          // équation k reportée dans l'équation j : reportee[k] = j
    let active = -1;
    const ordre = [];             // rangs des équations, dans l'ordre où elles ont été prises
    const actifs = () => ordre.map(k => eds[k]);
    const numero = k => actifs().indexOf(eds[k]) + 1;      // numéro affiché (ordre des équations prises)
    const utilisee = k => k in reportee;

    // valeurs qui vérifient les équations prises (vérification de chaque étape)
    function tirage() {
      const L = q.form ? actifs().map(e => q.eqs[e.k]) : null;
      return (L && L.length ? q.valeurs(L) : null) || q.valeurs();
    }
    function ajouter(k) {
      if (eds[k] || fini || actifs().length >= MAX) return;
      const e = q.eqs[k];
      const zone = el('div', 'pmc-ed');
      zone.setAttribute('role', 'tabpanel');
      grille.appendChild(zone);
      const exo = {
        tiles: EQ.tuilesDe({ left: e.G, right: e.D }),
        initialLeft: () => JSON.parse(JSON.stringify(e.G)), initialRight: () => JSON.parse(JSON.stringify(e.D)),
        targetId: q.cible, sample: tirage, funcTools: q.outils.slice(), needsParenTool: /[+\-]/.test(e.txt),
        remplacements: [], racineOuverte: q.racineOuverte, simplifier: true, simplifierMembres: true,
        controle: st => CO.controle(q, st),
        objectif: ' ', consigne: 'Déplace, remplace une grandeur (outil « grandeur = … » de la réserve), simplifie, puis vérifie l’étape.',
        messages: {
          BULLE_CHOIX: '<b>Simplifier</b> : touche maintenant {g} de l’autre côté du trait de fraction, ou dans l’autre membre. Les deux se barrent.',
          MSG_SIMPL: 'On simplifie une grandeur du numérateur avec la même au dénominateur d’une même fraction, ou une grandeur qui multiplie chacun des deux membres, à la même place (en haut des deux côtés, ou en bas).',
        },
      };
      const ed = EQ.monter(zone, exo, {
        surErreur: () => { erreurs++; },
        surMessage: f => setTimeout(() => EPM.versVue(f), 30),
        surEtape: () => majTout(),
        surRemplacement: id => {
          // l'équation où la grandeur était seule est reportée dans celle-ci (elle se replie dans le résumé)
          const src = actifs().find(x => x.k !== k && isolee(dernier(x)) === id);
          if (src && !(src.k in reportee)) reportee[src.k] = k;
          majTout();
        },
        surResolu: () => reussi(k),
      });
      eds[k] = { ed, zone, k };
      ordre.push(k);
      const t = ed.racine.querySelector('.ed-titre');
      if (t) t.textContent = 'Équation ' + numero(k);
      majTout();
      choisirOnglet(k);
    }
    function retirer(k) {
      const x = eds[k];
      if (!x) return;
      x.ed.detruire();
      x.zone.remove();
      eds[k] = null;
      ordre.splice(ordre.indexOf(k), 1);
      if (active === k) active = -1;
      actifs().forEach(e => { const t = e.ed.racine.querySelector('.ed-titre'); if (t) t.textContent = 'Équation ' + numero(e.k); });
      majTout();
      if (active < 0 && actifs().length) choisirOnglet(actifs()[0].k);
    }
    // dernier état vérifié d'un éditeur
    const dernier = x => { const h = x.ed.ops.historique(); return h[h.length - 1]; };
    // B1 : outils « grandeur = expression » dans la réserve des équations qui contiennent la grandeur
    function majOutils() {
      if (fini) return;
      actifs().forEach(j => {
        const ici = idsDe(j.ed.ops.etat()), outils = [];
        actifs().forEach(s => {
          if (s === j) return;
          const st = dernier(s), X = isolee(st);
          if (X && ici.has(X) && !outils.some(o => o.id === X && JSON.stringify(o.noeud) === JSON.stringify(st.right))) outils.push({ id: X, label: lab(X), noeud: JSON.parse(JSON.stringify(st.right)) });
        });
        const cle = JSON.stringify(outils);
        if (cle !== j.outils) { j.outils = cle; j.ed.ops.remplacements(outils); }
      });
    }
    // résumé (état en cours de chaque équation) et onglets
    function majResume() {
      resume.innerHTML = '';
      onglets.innerHTML = '';
      if (!actifs().length) { resume.appendChild(el('p', 'pm-petit', 'Choisis tes équations dans le formulaire.')); return; }
      resume.appendChild(el('p', 'pmc-titre', 'Tes équations'));
      actifs().forEach(x => {
        const st = x.ed.ops.etat(), n = numero(x.k), rep = utilisee(x.k);
        const b = bouton('pmc-res-l' + (rep ? ' pmc-rep' : '') + (x.k === active ? ' ici' : ''), '<span class="pmc-num">Éq. ' + n + '</span><span class="pmc-res-eq">' + EQ.ligne(st.left, st.right) + '</span>' +
          (rep ? '<span class="pmc-etat">✓ reportée dans l’éq. ' + numero(reportee[x.k]) + '</span>' : ''), () => { choisirOnglet(x.k); EPM.versVue(x.zone); }, 'Équation ' + n + (rep ? ', reportée' : '') + ' : ouvrir');
        resume.appendChild(b);
        const o = bouton('pmc-onglet', 'Équation ' + n + (rep ? ' ✓' : ''), () => choisirOnglet(x.k));
        o.setAttribute('role', 'tab');
        o.setAttribute('aria-selected', String(x.k === active));
        onglets.appendChild(o);
      });
      EQ.finir(resume);
    }
    function choisirOnglet(k) {
      if (!eds[k]) return;
      active = k;
      actifs().forEach(x => x.zone.classList.toggle('pmc-actif', x.k === k));
      majResume();
      EQ.finir(eds[k].zone);
      majOutils();
    }
    function majTout() { majOutils(); majResume(); majObjectif(); majFormulaire(); }

    // réussite : bilan, équation inutile expliquée (G1)
    function reussi(k) {
      if (fini) return;
      const pts = erreurs ? 1 : 2;
      const st = eds[k].ed.ops.etat();
      bilan.innerHTML = '';
      const m = el('div', 'callout callout-success pm-msg', (pts === 2 ? '<b>Juste !</b> ' : '<b>C’est juste.</b> ') + '<span class="pmc-res-eq">' + EQ.ligne(st.left, st.right) + '</span>' +
        (q.inutiles.length ? '<p class="pmc-inutile">' + q.inutiles.join(' ') + '</p>' : ''));
      const voir = bouton('btn-small', 'Voir une résolution détaillée', () => { const s = el('div', '', solutionHTML(q)); voir.replaceWith(s); EQ.finir(s); });
      m.appendChild(voir);
      bilan.appendChild(m);
      EQ.finir(m);
      terminer(pts);
    }
    // fin de la question : les éditeurs se figent, la page appelante enregistre et propose la suite
    function terminer(pts) {
      if (fini) return;
      fini = true;
      actifs().forEach(x => x.ed.fin());
      bSol.disabled = true;
      majFormulaire();
      if (opts.surFin) opts.surFin(pts, act, { aide, diff: q.diff });
      setTimeout(() => EPM.versVue(act.firstChild ? act : bilan), 40);
    }

    // équations données (toutes), ou formulaire (CO8 : aucune au départ)
    if (q.form) { majFormulaire(); majResume(); }
    else { q.eqs.forEach((e, k) => ajouter(k)); choisirOnglet(0); }
    majObjectif();
    const api = { terminer, erreurs: () => erreurs, editeurs: () => actifs().map(x => x.ed), ajouter, choisirOnglet, retirer };
    EPM.QC.enCours = api;          // question affichée (tests automatiques)
    return api;
  }

  EPM.QC = { monter, solutionHTML };
})();
