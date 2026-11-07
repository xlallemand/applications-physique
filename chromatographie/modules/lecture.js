/* ============================================================
   Module 2 : « Manipulation : lire un chromatogramme »
   (application « Chromatographie sur couche mince »)

   CC.SITUATIONS                 les 6 situations (espèces fictives)
   CC.lireChromato(zone)         situations successives : questions, taches à toucher,
                                 conclusions construites avec des expressions à piocher
   (« Pour aller plus loin : le rapport frontal » : page module_2_rf, rapport.js)
   Utilise CCM (ccm.js), CC.chromato, CC.phrase, CC.enonce, CC.reponse (cc.js).
   ============================================================ */
(function () {
  'use strict';

  const d = (nom, especes) => ({ nom, especes });
  // q : { type: 'pur' | 'contient' | 'tache' | 'nombre' | 'constituants', depot, ref, espece } (indices des dépôts)
  const SITUATIONS = [
    { titre: 'Deux corps purs et un mélange', depots: [d('1', ['e1']), d('2', ['e2']), d('3', ['e1', 'e2', 'e3'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 0 }, { type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'constituants', depot: 2 }] },
    { titre: 'Un mélange de deux espèces', depots: [d('A', ['e4']), d('B', ['e5']), d('M', ['e4', 'e5'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'constituants', depot: 2 }] },
    { titre: 'Une espèce absente', depots: [d('A', ['e1']), d('B', ['e3']), d('C', ['e6']), d('M', ['e1', 'e6'])], refs: [0, 1, 2],
      questions: [{ type: 'contient', depot: 3, ref: 1 }, { type: 'tache', depot: 3, espece: 'e6' }, { type: 'pur', depot: 3 }] },
    { titre: 'Un dépôt à une seule tache', depots: [d('A', ['e2']), d('B', ['e4']), d('M', ['e4'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'tache', depot: 2, espece: 'e4' }] },
    { titre: 'Des espèces non identifiées', depots: [d('A', ['e3']), d('B', ['e7']), d('C', ['e2']), d('M', ['e3', 'e6', 'e1'])], refs: [0, 1, 2],
      questions: [{ type: 'nombre', depot: 3 }, { type: 'tache', depot: 3, espece: 'e1' }, { type: 'contient', depot: 3, ref: 1 }] },
    { titre: 'Quatre taches', depots: [d('1', ['e5']), d('2', ['e1']), d('3', ['e6']), d('4', ['e5', 'e6', 'e4', 'e7'])], refs: [0, 1, 2],
      questions: [{ type: 'contient', depot: 3, ref: 1 }, { type: 'nombre', depot: 3 }, { type: 'constituants', depot: 3 }] },
  ];

  /* ============================================================
     SITUATIONS SUCCESSIVES
     ============================================================ */
  function lireChromato(zone) {
    let k = 0;
    const faites = new Set();
    function afficher() {
      const S = SITUATIONS[k];
      let iq = 0;
      zone.innerHTML = `<div class="cc-sit-tete"><h3 class="cc-sit-titre">${S.titre}</h3><span class="cc-sit-num">Situation ${k + 1} / ${SITUATIONS.length}</span></div>
        <div class="cc-lire">
          <div class="cc-lire-g"><div class="cc-chromato"></div><p class="cc-aide">Touche une tache pour la choisir (encore une fois pour l'enlever) : des pointillés relient les taches choisies de même hauteur.</p></div>
          <div class="cc-lire-d"><div class="cc-q"></div></div>
        </div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < SITUATIONS.length - 1 ? 'Situation suivante →' : 'Module 3 : entraînement →'}</button>
          ${k < SITUATIONS.length - 1 ? '' : '<a class="btn-secondary" style="text-decoration:none" href="module_2_rf.html" data-a="rf" hidden>Pour aller plus loin : le rapport frontal</a>'}</div>`;
      const ch = CC.chromato(zone.querySelector('.cc-chromato'), S);
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < SITUATIONS.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = 'module_3_questions.html';
      };
      function poser() {
        const q = S.questions[iq], zq = zone.querySelector('.cc-q');
        ch.effacer();
        ch.marquer(q.type === 'tache' ? q.depot + '|' + q.espece : null);
        zq.innerHTML = `<div class="cc-q-encours"><p class="cc-q-num">Question ${iq + 1} / ${S.questions.length}</p><p class="cc-q-texte">${CC.enonce(q, S)}</p></div><div class="cc-q-outil"></div><div class="cc-q-retour" aria-live="polite"></div><div class="cc-q-aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></div>`;
        const ret = zq.querySelector('.cc-q-retour'), aide = zq.querySelector('.cc-q-aide');
        let erreurs = 0;
        const outil = CC.phrase(zq.querySelector('.cc-q-outil'), {
          situation: S, q, montrer: c => ch.montrer(c),
          onMessage(m) { ret.innerHTML = m ? `<p class="ph-msg">${m}</p>` : ''; },
          onErreur(diag) {
            erreurs++;
            ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
            if (erreurs >= 2) aide.hidden = false;
            CC.defiler(ret);
          },
          onReussi(t) { fini(`<div class="callout-success er-retour"><p><b class="er-ok">${erreurs ? 'C\'est juste.' : 'Juste !'}</b> ${t}</p></div>`); },
        });
        aide.querySelector('button').onclick = () => {
          outil.montrer();
          fini(`<div class="callout er-retour"><p><b>Réponse</b> ${CC.reponse(q, S)}</p></div>`);
        };
        function fini(h) {
          aide.hidden = true;
          const der = iq === S.questions.length - 1;
          ret.innerHTML = h + (der ? '' : '<div class="er-actions"><button type="button" class="btn-primary" data-a="qs">Question suivante →</button></div>');
          if (der) {
            faites.add(k);
            const b = zone.querySelector('[data-a="suite"]'), rf = zone.querySelector('[data-a="rf"]');
            b.disabled = false;
            if (rf) rf.hidden = false;
            if (faites.size === SITUATIONS.length) SOM.marquer({ fait: true });
            CC.defiler(b);
          } else {
            const b = ret.querySelector('[data-a="qs"]');
            b.disabled = true; setTimeout(() => { b.disabled = false; }, 350);
            b.onclick = () => { iq++; poser(); CC.defiler(zone.querySelector('.cc-q')); };
            CC.defiler(b);
          }
        }
      }
      poser();
    }
    afficher();
  }

  window.CC = Object.assign(window.CC || {}, { SITUATIONS, lireChromato });
})();
