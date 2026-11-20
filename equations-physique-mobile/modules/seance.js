/* ============================================================
   Équations en physique (smartphone) — séance de 5 questions (EPM.seance)
   (même déroulé que modules/seance.js de l'application Équations du 1er degré)
   ------------------------------------------------------------
   Rôle :
     - plan de la séance (EPM.planSeance : mode automatique, compétences
       choisies, ou adresse seance.html#comp=FO1,AD2) ;
     - pour chaque question : une équation de la compétence, dans son
       contexte physique, et la grandeur à isoler, choisies au hasard selon
       la difficulté (progressive d'après le suivi, ajustée à chaque question) ;
       résolution dans l'éditeur à tuiles, aides toujours disponibles (EPM.Q) ;
     - points : 2 sans erreur, 1 après erreur, 0 solution affichée ;
       note sur 20 ; suivi enregistré à chaque question (EPM.enregistrer).
   Dépend de : epm.js, question.js, equations.js, competences.js, editeur.js.
   API : EPM.seance(zone)
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM, C = EPM.C;
  const el = EPM.el, bouton = EPM.bouton;
  const NB = 5;
  const RAISONS = { 'à travailler': 'à travailler', fragile: 'fragile', 'en cours': 'en cours', nouvelle: 'nouvelle', 'révision': 'révision' };

  function seance(zone) {
    const demande = (/#comp=([A-Z0-9,]+)/.exec(location.hash) || [])[1];
    let plan, k, points, res;
    EPM.noteReglages = 'Les changements de classe et de compétences s’appliquent à la prochaine séance.';

    function intro() {
      plan = EPM.planSeance(demande ? demande.split(',') : null);
      k = 0; points = 0; res = [];
      zone.innerHTML = '';
      const c = el('div', 'er-card');
      const auto = !demande && EPM.reglages().auto;
      c.appendChild(el('h3', 'pm-h3', 'Ta séance : ' + NB + ' équations'));
      // conseil : la Découverte d'abord
      if (EPM.decouverteFaits().length < EPM.DECOUVERTE.length) {
        c.appendChild(el('div', 'callout callout-accent pm-conseil', 'Tu découvres l’application ? Commence par la <a href="decouverte.html">Découverte des méthodes</a> : une règle par équation, dans l’ordre. Reviens ensuite t’entraîner ici.'));
      }
      c.appendChild(el('p', 'pm-petit', demande ? 'Les compétences demandées :' : auto ? 'Choisies automatiquement d’après ton suivi (classe : ' + EPM.NOM_CLASSE[EPM.reglages().classe] + ') :' : 'Les compétences cochées dans tes réglages :'));
      const vus = [];
      const ul = el('ul', 'pm-plan');
      plan.forEach(p => {
        if (vus.indexOf(p.comp) >= 0) return;
        vus.push(p.comp);
        const n = plan.filter(x => x.comp === p.comp).length, r = RAISONS[p.raison];
        ul.appendChild(el('li', '', '<b>' + C.R[p.comp].titre + '</b> <span class="pm-petit">· ' + EPM.pluriel(n, 'question') + (r ? ' · ' + r : '') + '</span>'));
      });
      c.appendChild(ul);
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Barème.</b> 2 points pour une équation résolue sans erreur, 1 point après une erreur (étape fausse ou déplacement refusé), 0 si tu affiches la solution. Le rappel, les indices et l’exemple sont gratuits. Note sur 20.'));
      c.appendChild(el('p', 'pm-petit', 'Déplace les grandeurs dans l’équation et utilise les outils de la réserve, puis touche « Vérifier l’étape ». La question est finie quand la grandeur demandée est seule, à gauche du signe =.'));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Commencer →', () => question()));
      r.appendChild(bouton('btn-small', '⚙ Changer les compétences', EPM.ouvrirReglages));
      c.appendChild(r);
      zone.appendChild(c);
    }

    // difficulté : d'après le suivi, puis ajustée selon la question précédente de la même compétence
    function niveau(comp) {
      let n = EPM.niveauDe(comp);
      const avant = res.filter(x => x.comp === comp);
      if (avant.length) {
        const der = avant[avant.length - 1];
        n = der.pts === 2 ? Math.min(3, der.niv + 1) : der.pts === 0 ? Math.max(1, der.niv - 1) : der.niv;
      }
      return n;
    }

    function question() {
      const p = plan[k], niv = niveau(p.comp);
      const q = EPM.Q.choisir(p.comp, niv, res.map(x => x.cle));
      zone.innerHTML = '';
      // en-tête : numéro, score, barre de progression
      const t = el('div', 'er-card pm-entete-q');
      t.innerHTML = '<span class="er-badge">SÉANCE · QUESTION ' + (k + 1) + '/' + NB + '</span><p class="pm-petit pm-score">Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts</p>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (100 * k / NB) + '%"></div></div>';
      zone.appendChild(t);
      const c = el('div', 'er-card pm-q');
      const r = RAISONS[p.raison];
      c.appendChild(el('p', 'er-q-nom', C.R[p.comp].titre + (r ? ' <span class="pm-tag">' + r + '</span>' : '')));
      zone.appendChild(c);
      EPM.Q.monter(c, q, {
        surFin: (pts, act, info) => {
          points += pts;
          res.push({ comp: p.comp, niv: q.diff, pts, cle: q.cle });
          EPM.enregistrer([{ r: p.comp, ok: pts / 2, diff: info.diff, aide: info.aide }], null);
          t.querySelector('.pm-score').textContent = 'Question ' + (k + 1) + '/' + NB + ' · Score : ' + points + ' pts';
          t.querySelector('.progress-fill').style.width = (100 * (k + 1) / NB) + '%';
          const dernier = k === NB - 1;
          const b = bouton('btn-primary', dernier ? 'Voir mon résultat →' : 'Question suivante →', () => {
            zone.style.pointerEvents = 'none';
            setTimeout(() => { zone.style.pointerEvents = ''; }, 350);
            k++;
            if (dernier) fin(); else question();
            EPM.versVue(zone.firstChild, 'start');
          });
          b.disabled = true;
          setTimeout(() => { b.disabled = false; }, 450);
          act.appendChild(b);
        },
      });
    }

    function fin() {
      const note = Math.round(points / (2 * NB) * 20 * 2) / 2;
      SOM.marquer({ note });
      EPM.enregistrer([], note);
      zone.innerHTML = '';
      const c = el('div', 'er-card er-fin');
      const pct = Math.round(100 * points / (2 * NB));
      const msg = pct === 100 ? 'Sans faute ! Bravo.' : pct >= 70 ? 'Très bien : continue comme ça.' : pct >= 50 ? 'C’est bien parti : refais une séance pour consolider.' : 'Ces compétences demandent encore du travail : relis leurs fiches et refais une séance.';
      c.innerHTML = '<span class="er-badge">SÉANCE TERMINÉE</span><p class="er-trophee">' + msg + '</p><div class="er-score">' + EPM.virg(note) + '<small>/20</small></div><p class="er-score-pct">' + pct + ' % des points</p>';
      const g = el('div', 'er-recap');
      res.forEach((x, i) => g.appendChild(el('div', x.pts === 2 ? 'ok' : x.pts === 0 ? 'ko' : '', '<b>Q' + (i + 1) + '</b>' + x.pts + ' pt' + (x.pts > 1 ? 's' : ''))));
      c.appendChild(g);
      // bilan par compétence, avec son statut à jour
      const ul = el('ul', 'pm-bilan');
      const vus = [];
      res.forEach(x => {
        if (vus.indexOf(x.comp) >= 0) return;
        vus.push(x.comp);
        const l = res.filter(y => y.comp === x.comp), p = l.reduce((a, y) => a + y.pts, 0);
        const st = EPM.statut(x.comp);
        ul.appendChild(el('li', '', '<span class="pm-puce pm-s-' + st + '" aria-hidden="true"></span><span><b>' + C.R[x.comp].titre + '</b> · ' + p + '/' + (2 * l.length) + ' pts</span><span class="pm-pct">' + EPM.LIBS[st].toLowerCase() + '</span>'));
      });
      c.appendChild(ul);
      // nouveaux succès de la séance (modules/mes-succes.js)
      const ns = EPM.blocSucces ? EPM.blocSucces(EPM.nouveauxSucces) : null;
      if (ns) c.appendChild(ns);
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Nouvelle séance →', () => { if (demande) history.replaceState(null, '', location.pathname); location.reload(); }));
      const s = el('a', 'btn-secondary', 'Mon suivi'); s.href = 'suivi.html'; a.appendChild(s);
      const f = el('a', 'btn-secondary', 'Fiches des compétences'); f.href = 'fiches.html'; a.appendChild(f);
      c.appendChild(a);
      zone.appendChild(c);
      if (pct === 100) EPM.confettis();
    }

    intro();
  }

  EPM.seance = seance;
})();
