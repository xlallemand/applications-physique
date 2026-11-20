/* ============================================================
   Équations en physique (smartphone) — une question à l'écran (objet EPM.Q)
   (partagé par la séance de résolution et le module Découverte)
   ------------------------------------------------------------
   Carte de la question : contexte physique (intro, légende des grandeurs),
   équation de départ, consigne « Exprime … », aides toujours disponibles
   (rappel de la compétence, indices successifs, exemple sur une autre
   équation de la même compétence, solution à 0 point), éditeur à tuiles
   (modules/editeur.js), puis bilan et bouton suivant.
   Points : 2 résolue sans erreur, 1 après une erreur (étape fausse ou
   déplacement refusé), 0 solution affichée.
   API :
     EPM.Q.monter(carte, q, opts) → { terminer(pts) }
        q    : question de EPM.B.question(cle)
        opts : { rappel: true|false, surFin(pts, zoneActions, { aide, diff }), apres(zoneActions) }
                                    aide : rappel, indice ou exemple ouvert ; diff : difficulté de l'équation
     EPM.Q.solutionHTML(q)       résolution détaillée (calcul aligné, flèches « même opération »)
     EPM.Q.choisir(comp, niv, deja)   une question de la compétence, difficulté niv (1 à 3)
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM;
  const el = EPM.el, bouton = EPM.bouton;

  // ligne d'un calcul aligné (notation de fiches.js)
  const ligne = (g, d, op, note) => '<div class="fi-l"' + (op ? ' data-op="' + op + '"' : '') + (note ? ' data-note="' + note + '"' : '') + '><span>' + g + '</span><span>' + d + '</span></div>';
  // résolution détaillée : équation de départ, puis une ligne par étape ; l'opération faite des deux côtés
  // est écrite sous la ligne qui précède (deux flèches), l'échange des membres en note
  function solutionHTML(q) {
    const E = q.cible.etapes, lignes = [q.depart].concat(E.map(e => e[2]));
    let h = '';
    lignes.forEach((l, k) => {
      const [g, d] = EPM.P.htmlEq(l, q.g);
      const suiv = E[k];
      const op = suiv && suiv[0] && suiv[0] !== '⇄' ? suiv[0] : '';
      const note = suiv && suiv[0] === '⇄' ? '⇄ on échange les deux membres' : '';
      h += ligne(g, d, op, note);
    });
    return '<div class="fi-bloc pm-sol"><div class="fi-calc">' + h + '</div></div>';
  }

  // une question de la compétence : difficulté niv de préférence, jamais deux fois la même dans la séance
  function choisir(comp, niv, deja) {
    deja = deja || [];
    const L = EPM.C.cibles(comp);
    const libres = L.filter(x => deja.indexOf(x.cle) < 0);
    const base = libres.length ? libres : L;
    let cand = base.filter(x => x.cible.diff === niv);
    if (!cand.length) cand = base.filter(x => x.cible.diff <= niv);
    if (!cand.length) cand = base;
    return EPM.B.question(cand[Math.floor(Math.random() * cand.length)].cle);
  }

  function monter(carte, q, opts) {
    opts = opts || {};
    let erreurs = 0, fini = false, nInd = 0, aide = false;    // aide : rappel, indice ou exemple ouvert (succès « Autonome »)
    const E = q.cible.etapes;
    EPM.questionEnCours = q;                     // question affichée (tests automatiques)
    // contexte et équation
    const ctx = el('div', 'pm-contexte');
    ctx.innerHTML = '<p class="pm-intro-q">' + q.eq.intro + '</p><div class="pm-enonce">' + q.enonce() + '</div><p class="pm-leg">' + q.eq.leg + '</p>';
    carte.appendChild(ctx);
    carte.appendChild(el('p', 'er-consigne pm-consigne', 'Exprime <b class="pm-cible">' + q.nom + '</b> : écris-la <b>seule, à gauche</b> du signe =.'));
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
    const bInd = bouton('btn-small', '💡 Indice', () => {
      if (nInd >= E.length) return;
      aide = true;
      const d = el('div', 'pm-indice', '<b>Indice ' + (nInd + 1) + '.</b> ' + E[nInd][1]);
      zInd.appendChild(d);
      nInd++;
      majInd();
      EPM.versVue(d);
    });
    const majInd = () => {
      bInd.innerHTML = nInd >= E.length ? '💡 Tous les indices sont affichés' : nInd ? '💡 Indice suivant (' + (nInd + 1) + '/' + E.length + ')' : '💡 Indice';
      bInd.disabled = nInd >= E.length;
    };
    // exemple : une autre équation de la même compétence, résolue
    const bEx = bouton('btn-small', '✎ Exemple', () => montrerExemple());
    function montrerExemple() {
      aide = true;
      const L = EPM.C.cibles(q.comp).filter(x => x.cle !== q.cle);
      if (!L.length) { zEx.innerHTML = '<div class="pm-rappel"><p>Pas d’autre exemple pour cette compétence : affiche le rappel.</p></div>'; return; }
      const e = EPM.B.question(L[Math.floor(Math.random() * L.length)].cle);
      zEx.innerHTML = '';
      const b = el('div', 'pm-rappel');
      b.innerHTML = '<p class="pm-rappel-t">Exemple sur une autre équation</p><p>' + e.eq.intro + '</p><p>On exprime <b>' + e.nom + '</b> :</p>' + solutionHTML(e);
      const r2 = el('div', 'pm-rangee');
      r2.appendChild(bouton('btn-small', '↻ Un autre exemple', montrerExemple));
      r2.appendChild(bouton('btn-small', 'Fermer', () => { zEx.innerHTML = ''; }));
      b.appendChild(r2);
      zEx.appendChild(b);
      EPM.monterCalc(b);
      EPM.versVue(b);
    }
    const bSol = bouton('btn-small', 'Afficher la solution', () => {
      if (fini) return;
      zSol.innerHTML = '';
      const c = el('div', 'callout', '<b>Réponse.</b> Une résolution détaillée (0 point pour cette question) :' + solutionHTML(q));
      zSol.appendChild(c);
      EPM.monterCalc(c);
      terminer(0);
    });
    majInd();
    (opts.rappel === false ? [bInd, bEx, bSol] : [bRap, bInd, bEx, bSol]).forEach(b => barre.appendChild(b));
    carte.appendChild(barre);
    [zRap, zInd, zEx].forEach(z => carte.appendChild(z));
    // l'éditeur
    const zEd = el('div', 'pm-editeur');
    carte.appendChild(zEd);
    const bilan = el('div', 'pm-retour');
    bilan.setAttribute('aria-live', 'polite');
    carte.appendChild(bilan);
    carte.appendChild(zSol);
    const act = el('div', 'er-actions pm-suite');
    carte.appendChild(act);
    EPM.ED.monter(zEd, q.exo, {
      surErreur: () => { erreurs++; },
      // après chaque vérification, le message et l'équation suivante restent à l'écran (jamais remonter)
      surMessage: f => setTimeout(() => EPM.versVue(f), 30),
      surResolu: () => {
        const pts = erreurs ? 1 : 2;
        bilan.innerHTML = '';
        const m = el('div', 'callout callout-success pm-msg', (pts === 2 ? '<b>Juste !</b> ' : '<b>C’est juste.</b> ') + '<b>' + q.nom + '</b> est isolée : l’équation est résolue.');
        const voir = bouton('btn-small', 'Voir une résolution détaillée', () => { const s = el('div', '', solutionHTML(q)); voir.replaceWith(s); EPM.monterCalc(s); });
        m.appendChild(el('br'));
        m.appendChild(voir);
        bilan.appendChild(m);
        terminer(pts);
      },
    });
    // fin de la question : l'éditeur se fige, la page appelante enregistre et propose la suite
    function terminer(pts) {
      if (fini) return;
      fini = true;
      EPM.ED.fin();
      bSol.disabled = true;
      if (opts.surFin) opts.surFin(pts, act, { aide, diff: q.diff });
      setTimeout(() => EPM.versVue(act.firstChild ? act : bilan), 40);
    }
    return { terminer, erreurs: () => erreurs };
  }

  EPM.Q = { monter, solutionHTML, choisir };
})();
