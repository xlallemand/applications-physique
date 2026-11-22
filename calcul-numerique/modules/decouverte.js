/* ============================================================
   Calcul numérique — module Découverte (CN.decouverte)
   ------------------------------------------------------------
   Trois parcours (puissances de 10, écrire un résultat, conversions) :
   une étape par compétence (CN.ETAPES), dans l'ordre de progression.
   Une étape par écran (adresse decouverte.html#3), avec :
     - la notion : règle, méthode, compléments (moyens mnémotechniques des
       préfixes, deux méthodes pour m/s ↔ km/h…), exemple, piège ;
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

  /* ---------- Compléments de certaines notions ---------- */
  const chaine = (l) => '<div class="cn-chaine">' + l.map(([s, n, e]) => '<span class="cn-maillon"><b>' + s + '</b><small>' + n + '</small><small>10<sup>' + e + '</sup></small></span>').join('<span class="cn-fl" aria-hidden="true">→</span>') + '</div>';
  const PLUS = {
    PR1: '<p class="cn-lab">Pour les retenir</p>' +
      '<p><b>1. Les principaux vont de 3 en 3.</b></p>' +
      chaine([['T', 'téra', '12'], ['G', 'giga', '9'], ['M', 'méga', '6'], ['k', 'kilo', '3'], ['—', 'unité', '0'], ['m', 'milli', '−3'], ['µ', 'micro', '−6'], ['n', 'nano', '−9'], ['p', 'pico', '−12']]) +
      '<p><b>2. Les grands : pense aux fichiers informatiques.</b> Un texte fait quelques ko (kilooctets, 10<sup>3</sup>), une photo quelques Mo (10<sup>6</sup>), un film quelques Go (10<sup>9</sup>), un disque dur quelques To (10<sup>12</sup>).</p>' +
      '<p><b>3. Les petits : « <b>M</b>on <b>M</b>icro <b>N</b>’a <b>P</b>as froid ».</b> milli, micro, nano, pico : 10<sup>−3</sup>, 10<sup>−6</sup>, 10<sup>−9</sup>, 10<sup>−12</sup>.</p>' +
      '<p><b>4. Centi et déci : la vie de tous les jours.</b> Un centime, c’est 1/100 d’euro : c = 10<sup>−2</sup>. Les décimales sont les dixièmes : d = 10<sup>−1</sup>.</p>' +
      '<p><b>5. Déca et hecto : 1 et 2.</b> Un décathlon compte 10 épreuves : da = 10<sup>1</sup>. Un hectare fait 100 ares : h = 10<sup>2</sup>.</p>',
    PR2: '<div class="crs-defile"><table class="cn-tab"><thead><tr><th>Préfixe</th><th>Symbole</th><th>Puissance</th></tr></thead><tbody>' +
      C.PREF.filter(p => p.s).map(p => '<tr><td>' + p.nom + '</td><td><b>' + p.s + '</b></td><td>10<sup>' + CN.N.ent(p.e) + '</sup></td></tr>').join('') + '</tbody></table></div>',
    CV1: '<div class="callout callout-accent"><b>Compétence clé.</b> C’est la conversion dont tu auras besoin dans presque tous les exercices de physique : les formules s’utilisent avec les unités du Système international (m, s, kg, A, W, J…). Elle revient dans chaque séance, et le <a href="defi.html">défi chrono</a> te fait gagner en vitesse.</div>',
    CV10: '<div class="callout callout-accent"><b>Pour ne jamais te tromper de sens.</b> Quand tu marches, tu avances d’environ <b>1 m en 1 s</b>, et d’environ <b>4 km en 1 h</b>. Pour la même vitesse, la valeur en km/h est donc <b>plus grande</b> que la valeur en m/s : de m/s à km/h on <b>multiplie</b> par 3,6, de km/h à m/s on <b>divise</b> par 3,6.</div>'
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
      n.innerHTML = '<h3 class="cours-titre">La notion</h3><p>' + comp.regle + '</p>' + (PLUS[id] || '') +
        '<div class="cle"><b class="cle-titre">Méthode.</b> ' + comp.methode + '</div>' +
        '<div class="cn-exemple"><p class="cn-exemple-t">Exemple</p>' + comp.exemple + '</div>' +
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
        CN.Q.monter(c, q, { rappel: false, surFin: (pts, act) => {
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
