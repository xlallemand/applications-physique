/* ============================================================
   Calcul numérique — module Découverte (CN.decouverte)
   ------------------------------------------------------------
   Trois parcours (puissances de 10, écrire un résultat, conversions) :
   une étape par compétence (CN.ETAPES), dans l'ordre de progression.
   Une étape par écran (adresse decouverte.html#3), avec :
     - la notion : règle, infographie (moyens mnémotechniques des préfixes,
       virgule qui se déplace, deux méthodes pour m/s ↔ km/h…), méthode en
       étapes, exemples séparés, piège ;
     - « À toi » : 2 ou 3 questions de la compétence (niveau 1 guidé, puis
       niveau 2), avec les aides (CN.Q) ;
     - « Étape suivante → ».
   Rien n'est noté : une étape est cochée (✓) quand ses questions sont
   finies. Elle ne compte pas dans le suivi des compétences (aucune
   influence sur le choix des séances), seulement dans les succès.
   La page est marquée faite quand toutes les étapes sont faites.
   API : CN.decouverte(zone)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN, C = CN.C;
  const el = CN.el, bouton = CN.bouton;
  const E = CN.ETAPES, NE = E.length;

  /* ---------- Compléments propres à la Découverte (les infographies sont dans les compétences : champ schema) ---------- */
  const PLUS = {
    CV1: '<div class="callout callout-accent"><b>Compétence clé.</b> C’est la conversion dont tu auras besoin dans presque tous les exercices de physique : les formules s’utilisent avec les unités du Système international (m, s, kg, A, W, J…). Elle revient dans chaque séance, et le <a href="defi.html">défi chrono</a> te fait gagner en vitesse.</div>'
  };
  // questions de l'étape : niveau 1 (guidé) puis niveau 2 ; la compétence clé en a trois
  const QUESTIONS = id => id === 'CV1' ? [1, 1, 2] : [1, 2];

  function decouverte(zone) {
    function numero() {
      const n = parseInt(location.hash.slice(1), 10);
      if (n >= 1 && n <= NE) return n - 1;
      const f = CN.decouverteFaits();
      for (let k = 0; k < NE; k++) if (f.indexOf(k) < 0) return k;
      return 0;
    }
    function aller(k) {
      if (k < 0 || k >= NE) return;
      if (location.hash !== '#' + (k + 1)) location.hash = '#' + (k + 1); else afficher(k);
    }

    function afficher(k) {
      const id = E[k], comp = C.R[id], th = C.themeDe(id);
      const faits = CN.decouverteFaits();
      const dansP = E.map((x, i) => i).filter(i => C.themeDe(E[i]) === th);
      zone.innerHTML = '';
      // en-tête : parcours, étape, pastilles des étapes du parcours
      const t = el('div', 'er-card cn-dec-tete');
      t.innerHTML = '<span class="er-badge">DÉCOUVERTE · ÉTAPE ' + (k + 1) + '/' + NE + '</span>' +
        '<h2 class="er-titre">' + comp.titre + '</h2>' +
        '<p class="cn-petit">' + (faits.indexOf(k) >= 0 ? '<span class="cn-ok">✓ déjà faite</span> · ' : '') + faits.length + (faits.length > 1 ? ' étapes faites' : ' étape faite') + ' sur ' + NE + '</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * faits.length / NE) + '%"></div></div>';
      const ch = el('div', 'cn-chips cn-parcours');
      ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Parcours');
      C.THEMES.forEach(x => {
        const ids = E.map((y, i) => i).filter(i => C.themeDe(E[i]) === x.id);
        const n = ids.filter(i => faits.indexOf(i) >= 0).length;
        const b = bouton('', CN.esc(x.nom) + ' <small>' + n + '/' + ids.length + '</small>', () => aller(ids.find(i => faits.indexOf(i) < 0) ?? ids[0]));
        b.setAttribute('aria-pressed', x.id === th);
        ch.appendChild(b);
      });
      t.appendChild(ch);
      const nav = el('nav', 'cn-dec-nav');
      nav.setAttribute('aria-label', 'Étapes du parcours');
      dansP.forEach(i => {
        const a = el('a', 'cn-dec-pt' + (faits.indexOf(i) >= 0 ? ' fait' : '') + (i === k ? ' ici' : ''), faits.indexOf(i) >= 0 && i !== k ? '✓' : String(i + 1));
        a.href = '#' + (i + 1);
        a.setAttribute('aria-label', 'Étape ' + (i + 1) + ' : ' + CN.sansBalises(C.R[E[i]].titre) + (faits.indexOf(i) >= 0 ? ' (faite)' : ''));
        if (i === k) a.setAttribute('aria-current', 'page');
        nav.appendChild(a);
      });
      t.appendChild(nav);
      const fl = el('div', 'cn-rangee cn-entre cn-dec-fl');
      const pre = bouton('btn-small', '← Précédente', () => aller(k - 1));
      pre.disabled = k === 0;
      const sui = bouton('btn-small', 'Suivante →', () => aller(k + 1));
      sui.disabled = k === NE - 1;
      fl.appendChild(pre); fl.appendChild(sui);
      t.appendChild(fl);
      zone.appendChild(t);

      // la notion
      const n = el('div', 'er-card cn-regle');
      n.innerHTML = '<h3 class="cours-titre">La notion</h3>' + CN.contenuHTML(comp, PLUS[id]) +
        '<div class="cn-piege"><b class="cle-titre">Attention.</b> ' + comp.piege + '</div>';
      zone.appendChild(n);

      // à toi : les questions, l'une après l'autre
      const a = el('div', 'er-card');
      a.appendChild(el('h3', 'cours-titre', 'À toi'));
      a.appendChild(el('p', 'cn-petit', 'Rien n’est noté : les aides sont là si tu en as besoin.'));
      zone.appendChild(a);
      const L = QUESTIONS(id), deja = [];
      let i = 0;
      function suivanteQ() {
        let q = null;
        for (let j = 0; j < 10 && (!q || deja.indexOf(q.cle) >= 0); j++) q = C.question(id, L[i]);
        deja.push(q.cle);
        const c = el('div', 'cn-dec-q');
        c.appendChild(el('p', 'er-q-nom', 'Question ' + (i + 1) + '/' + L.length + (L[i] === 1 ? ' <span class="cn-tag">guidée</span>' : '')));
        a.appendChild(c);
        // la première question ne fait pas défiler : l'étape s'ouvre sur son en-tête
        CN.Q.monter(c, q, { rappel: false, sansDefiler: i === 0, surFin: (pts, act) => {
          i++;
          if (i < L.length) { const b = bouton('btn-primary', 'Question suivante →', () => { b.remove(); suivanteQ(); }); act.appendChild(b); return; }
          // étape faite
          const f = CN.marquerDecouverte(k);
          if (f.length >= NE) SOM.marquer({ fait: true });
          const ns = CN.succesApres ? CN.succesApres([], null) : [];
          const bloc = ns.length && CN.blocSucces ? CN.blocSucces(ns) : null;
          if (bloc) act.parentNode.insertBefore(bloc, act);
          if (k < NE - 1) {
            const fin = C.themeDe(E[k + 1]) !== th;
            act.appendChild(bouton('btn-primary', fin ? 'Parcours suivant : ' + C.THEMES.find(x => x.id === C.themeDe(E[k + 1])).nom + ' →' : 'Étape suivante →', () => aller(k + 1)));
            if (fin) { const s = el('a', 'btn-secondary', 'Séance sur ce thème'); s.href = 'seance.html'; s.addEventListener('click', () => CN.regler('theme', th)); act.appendChild(s); }
          } else if (f.length < NE) {
            // dernière étape, mais il en reste à faire : retour à la première étape pas encore faite
            const r = E.findIndex((x, j) => f.indexOf(j) < 0);
            act.appendChild(bouton('btn-primary', 'Étape ' + (r + 1) + ' : ' + CN.sansBalises(C.R[E[r]].titre) + ' →', () => aller(r)));
          } else {
            act.appendChild(el('p', 'cn-petit cn-fin-dec', 'Découverte terminée : entraîne-toi maintenant avec les séances, l’application choisit les compétences à travailler.'));
            const s = el('a', 'btn-primary', 'Commencer une séance →'); s.href = 'seance.html'; act.appendChild(s);
          }
        } });
      }
      suivanteQ();
      zone.firstChild.scrollIntoView({ block: 'start' });
    }

    afficher(numero());
    addEventListener('hashchange', () => afficher(numero()));
  }

  CN.decouverte = decouverte;
})();
