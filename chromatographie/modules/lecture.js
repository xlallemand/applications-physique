/* ============================================================
   Module 2 : « Manipulation : lire un chromatogramme »
   (application « Chromatographie sur couche mince »)

   CC.SITUATIONS                 les 6 situations (espèces fictives)
   CC.lireChromato(zone)         situations successives : questions, taches à toucher,
                                 conclusions construites avec des expressions à piocher
   CC.rapportFrontal(zone)       « Pour aller plus loin » : mesurer h et H à la règle, R_f = h / H
                                 (facultatif : ne compte pas pour marquer la page)
   Utilise CCM (ccm.js), CC.chromato, CC.phrase, CC.enonce, CC.reponse (cc.js).
   ============================================================ */
(function () {
  'use strict';

  const d = (nom, especes) => ({ nom, especes });
  // q : { type: 'pur' | 'contient' | 'tache' | 'nombre', depot, ref, espece } (indices des dépôts)
  const SITUATIONS = [
    { titre: 'Deux corps purs et un mélange', depots: [d('1', ['e1']), d('2', ['e2']), d('3', ['e1', 'e2', 'e3'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 0 }, { type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'tache', depot: 2, espece: 'e3' }] },
    { titre: 'Un mélange de deux espèces', depots: [d('A', ['e4']), d('B', ['e5']), d('M', ['e4', 'e5'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'contient', depot: 2, ref: 1 }] },
    { titre: 'Une espèce absente', depots: [d('A', ['e1']), d('B', ['e3']), d('C', ['e6']), d('M', ['e1', 'e6'])], refs: [0, 1, 2],
      questions: [{ type: 'contient', depot: 3, ref: 1 }, { type: 'tache', depot: 3, espece: 'e6' }, { type: 'pur', depot: 3 }] },
    { titre: 'Un dépôt à une seule tache', depots: [d('A', ['e2']), d('B', ['e4']), d('M', ['e4'])], refs: [0, 1],
      questions: [{ type: 'pur', depot: 2 }, { type: 'contient', depot: 2, ref: 0 }, { type: 'tache', depot: 2, espece: 'e4' }] },
    { titre: 'Des espèces non identifiées', depots: [d('A', ['e3']), d('B', ['e7']), d('C', ['e2']), d('M', ['e3', 'e6', 'e1'])], refs: [0, 1, 2],
      questions: [{ type: 'nombre', depot: 3 }, { type: 'tache', depot: 3, espece: 'e1' }, { type: 'contient', depot: 3, ref: 1 }] },
    { titre: 'Quatre taches', depots: [d('1', ['e5']), d('2', ['e1']), d('3', ['e6']), d('4', ['e5', 'e6', 'e4', 'e7'])], refs: [0, 1, 2],
      questions: [{ type: 'contient', depot: 3, ref: 1 }, { type: 'nombre', depot: 3 }, { type: 'tache', depot: 3, espece: 'e4' }] },
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
          <div class="cc-lire-g"><div class="cc-chromato"></div><p class="cc-aide">Touche une tache pour la choisir (encore une fois pour l'enlever) : des pointillés relient les taches choisies de même hauteur.</p></div>
          <div class="cc-lire-d"><ol class="cc-deroule cc-questions">${S.questions.map(q => `<li><span>${CC.enonce(q, S)}</span></li>`).join('')}</ol><div class="cc-q"></div></div>
        </div>
        <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <button type="button" class="btn-primary" data-a="suite" disabled>${k < SITUATIONS.length - 1 ? 'Situation suivante →' : 'Module 3 : entraînement →'}</button></div>`;
      const ch = CC.chromato(zone.querySelector('.cc-chromato'), S);
      zone.querySelector('[data-a="re"]').onclick = afficher;
      zone.querySelector('[data-a="suite"]').onclick = () => {
        if (k < SITUATIONS.length - 1) { k++; afficher(); window.scrollTo(0, 0); } else location.href = 'module_3_questions.html';
      };
      function poser() {
        const q = S.questions[iq], zq = zone.querySelector('.cc-q');
        zone.querySelectorAll('.cc-questions li').forEach((li, i) => { li.className = i < iq ? 'fait' : i === iq ? 'ici' : 'avenir'; });
        ch.effacer();
        ch.marquer(q.type === 'tache' ? q.depot + '|' + q.espece : null);
        zq.innerHTML = `<p class="cc-q-t">${iq + 1}. ${CC.enonce(q, S)}</p><div class="cc-q-outil"></div><div class="cc-q-retour" aria-live="polite"></div><div class="cc-q-aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></div>`;
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
          onReussi(t) { fini(`<div class="callout-success er-retour"><p><b class="er-ok">${erreurs ? 'C\'est juste.' : 'Juste !'}</b> ${t}</p></div>`); },
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
            zone.querySelectorAll('.cc-questions li').forEach(li => { li.className = 'fait'; });
            faites.add(k);
            const b = zone.querySelector('[data-a="suite"]');
            b.disabled = false;
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

  /* ============================================================
     POUR ALLER PLUS LOIN : LE RAPPORT FRONTAL
     Deux plaques, même espèce F, élutions différentes (H = 5 cm et 7,5 cm).
     Une règle glissable (ou ▲ ▼ au mm) pour mesurer h et H depuis le trait.
     ============================================================ */
  const PLAQUES = [{ hauteur: 7, H: 5 }, { hauteur: 9.5, H: 7.5 }];
  function rapportFrontal(zone) {
    const hF = CCM.hauteur('F');
    zone.innerHTML = `<div class="cc-rf">${PLAQUES.map((P, i) => `<div class="cc-rf-p" data-i="${i}">
        <p class="cc-rf-t">Plaque ${i + 1}</p><div class="cc-fig cc-rf-fig"></div>
        <div class="cc-outil-b"><button type="button" class="btn-secondary cc-fl" data-a="+" aria-label="Monter la règle d'un millimètre">▲</button><button type="button" class="btn-secondary cc-fl" data-a="-" aria-label="Descendre la règle d'un millimètre">▼</button><span class="cc-val-t">règle : glisse-la ou règle-la au mm</span></div>
        <div class="cc-rf-champs">
          <label class="cc-rf-c"><span>h =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="h en cm, plaque ${i + 1}" data-c="h"><span>cm</span></label>
          <label class="cc-rf-c"><span>H =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="H en cm, plaque ${i + 1}" data-c="H"><span>cm</span></label>
          <label class="cc-rf-c"><span>R<sub>f</sub> =</span><input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="Rapport frontal, plaque ${i + 1}" data-c="rf"></label>
        </div>
        <div class="er-actions"><button type="button" class="btn-primary" data-a="ver">Vérifier</button></div>
        <div class="cc-rf-retour" aria-live="polite"></div></div>`).join('')}</div>
      <div class="cc-rf-bilan" aria-live="polite"></div>`;
    const reussies = new Set();
    zone.querySelectorAll('.cc-rf-p').forEach(bloc => {
      const i = +bloc.dataset.i, P = PLAQUES[i], hv = Math.round(hF * P.H * 10) / 10;
      let zero = 0;            // position du 0 de la règle (cm depuis le bas de la plaque)
      const pl = CCM.plaque(bloc.querySelector('.cc-rf-fig'), {
        depots: [{ nom: 'F', especes: ['F'] }], largeur: 2.4, hauteur: P.hauteur, echelle: 32, marges: { d: 1.5 },
        aria: `Plaque ${i + 1} : une tache F et le front de l'éluant ; une règle graduée en mm à droite`,
        calque(g) {
          const k = g.k, x = g.px(2.4) + .2 * k, y0 = g.py(zero), lg = P.hauteur;
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
          if (!gr.firstChild) { const r = document.createElementNS('http://www.w3.org/2000/svg', 'rect'); r.setAttribute('class', 'ccm-poignee'); gr.appendChild(r); }
          const k = g.k, x = g.px(2.4) + .2 * k, y0 = g.py(zero), r = gr.firstChild;
          r.setAttribute('x', x - .2 * k); r.setAttribute('y', y0 - P.hauteur * k); r.setAttribute('width', 1.45 * k); r.setAttribute('height', P.hauteur * k);
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
      const ret = bloc.querySelector('.cc-rf-retour');
      const champ = c => CC.lire(bloc.querySelector(`[data-c="${c}"]`).value);
      bloc.querySelector('[data-a="ver"]').onclick = () => {
        const h = champ('h'), H = champ('H'), rf = champ('rf');
        if ([h, H, rf].some(isNaN)) { ret.innerHTML = '<p class="ph-msg">Écris un nombre dans chaque case (avec une virgule si besoin).</p>'; return; }
        const pres = (a, b, t) => Math.abs(a - b) <= t + 1e-9;
        let diag = null;
        if (pres(h, hv + 1, .1) || pres(H, P.H + 1, .1)) diag = 'Les hauteurs se mesurent à partir du trait de dépôt, d\'où partent les espèces.';
        else if (!pres(h, hv, .1)) diag = 'Mesure h de nouveau : mets le 0 de la règle sur le trait de dépôt, puis lis la hauteur du centre de la tache.';
        else if (!pres(H, P.H, .1)) diag = 'Mesure H de nouveau : mets le 0 de la règle sur le trait de dépôt, puis lis la hauteur du trait du front.';
        else if (pres(rf, H / h, .02)) diag = 'R<sub>f</sub> = h / H : la hauteur de la tache divisée par celle du front (R<sub>f</sub> est plus petit que 1).';
        else if (!pres(rf, h / H, .015)) diag = `Calcule R<sub>f</sub> = h / H avec tes mesures, arrondi au centième.`;
        if (diag) { ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p></div>`; return; }
        ret.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Juste !</b> R<sub>f</sub> = ${CC.fmt(hv)} / ${CC.fmt(P.H)} = ${CC.fmt(hv / P.H, 2)}.</p></div>`;
        bloc.querySelectorAll('input, button').forEach(x => { x.disabled = true; });
        reussies.add(i);
        if (reussies.size === PLAQUES.length) {
          zone.querySelector('.cc-rf-bilan').innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">Même R<sub>f</sub> sur les deux plaques.</b> Le front n'est pas monté aussi haut, mais pour la même espèce, avec le même éluant, R<sub>f</sub> = h / H ne change pas : il aide à identifier une espèce.</p></div>`;
        }
      };
    });
  }

  window.CC = Object.assign(window.CC || {}, { SITUATIONS, lireChromato, rapportFrontal });
})();
