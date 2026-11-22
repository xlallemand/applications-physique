/* ============================================================
   Calcul numérique — défi chrono : 10 conversions (CN.defi)
   ------------------------------------------------------------
   Dix conversions de la compétence clé CV1 (vers ou depuis l'unité sans
   préfixe), à la suite, chronométrées. Une seule réponse par conversion :
   juste, on passe tout de suite à la suivante ; fausse, la bonne réponse
   s'affiche et on passe à la suite. Sans aide.
   Défi réussi : 10/10 en moins de 2 minutes. Record : le plus de réponses
   justes, puis le temps le plus court.
   Les 10 réponses comptent dans le suivi de CV1 (1 juste, 0 fausse) ;
   le défi compte dans les succès (modules/mes-succes.js).
   Stockage : calcul-numerique-defi { n: défis terminés, meilleur: { j, t } }
     (t en dixièmes de seconde)
   API : CN.defi(zone) ; CN.lireDefi() ; CN.recordDefi() (texte du record ou '') ; CN.duree(t)
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN, N = CN.N, C = CN.C;
  const el = CN.el, bouton = CN.bouton;
  const CLE = 'calcul-numerique-defi', NB = 10, LIMITE = 1200;   // 2 minutes, en dixièmes de seconde

  function lireDefi() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(CLE)); } catch (e) { v = null; }
    const d = { n: 0, meilleur: null };
    if (v && typeof v === 'object') {
      if (Number.isInteger(v.n) && v.n >= 0) d.n = v.n;
      if (v.meilleur && Number.isInteger(v.meilleur.j) && Number.isInteger(v.meilleur.t)) d.meilleur = { j: v.meilleur.j, t: v.meilleur.t };
    }
    return d;
  }
  function ecrireDefi(d) { try { localStorage.setItem(CLE, JSON.stringify(d)); } catch (e) { /* stockage indisponible */ } }
  // durée lisible : « 1 min 32 s », « 48,5 s »
  function duree(t) {
    const s = t / 10;
    if (s < 60) return String(Math.round(s * 10) / 10).replace('.', ',') + ' s';
    return Math.floor(s / 60) + ' min ' + String(Math.round(s % 60)).padStart(2, '0') + ' s';
  }
  const meilleur = (a, b) => !b || a.j > b.j || (a.j === b.j && a.t < b.t);
  function recordDefi() { const d = lireDefi(); return d.meilleur ? d.meilleur.j + '/' + NB + ' en ' + duree(d.meilleur.t) : ''; }

  function defi(zone) {
    function intro() {
      zone.innerHTML = '';
      const d = lireDefi();
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'cn-h3', '10 conversions, le plus vite possible'));
      c.appendChild(el('p', '', 'Des conversions <b>vers ou depuis l’unité sans préfixe</b> (km → m, mA → A, g → mg…), la compétence clé. Une seule réponse par conversion, sans aide : si c’est faux, la bonne réponse s’affiche et tu passes à la suivante.'));
      c.appendChild(el('div', 'cle', '<b class="cle-titre">Défi réussi :</b> 10 conversions justes en moins de 2 minutes. Tes réponses comptent dans le suivi de la compétence clé.'));
      c.appendChild(el('p', 'cn-petit', d.meilleur ? 'Ton record : <b>' + recordDefi() + '</b> · ' + CN.pluriel(d.n, 'défi terminé') + '.' : 'Pas encore de record : à toi de jouer.'));
      if (CN.statut('CV1') === 'v' || CN.statut('CV1') === 'n') c.appendChild(el('div', 'callout cn-conseil', 'Tu n’as pas encore travaillé ces conversions ? Commence par l’étape « Vers ou depuis l’unité sans préfixe » de la <a href="decouverte.html#' + (CN.etapeDe('CV1') + 1) + '">Découverte</a>.'));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'C’est parti →', jouer));
      c.appendChild(r);
      zone.appendChild(c);
    }

    function jouer() {
      const qs = [], vus = [];
      while (qs.length < NB) {
        const q = C.question('CV1', qs.length < 4 ? 2 : 3);
        if (vus.indexOf(q.cle) < 0) { vus.push(q.cle); qs.push(q); }
      }
      const res = [];
      const t0 = performance.now();
      let k = 0, fini = false;
      zone.innerHTML = '';
      const t = el('div', 'er-card cn-defi-tete');
      const chrono = el('div', 'cn-chrono', '0,0 s');
      chrono.setAttribute('role', 'timer');
      chrono.setAttribute('aria-label', 'Temps écoulé');
      const score = el('p', 'cn-petit cn-score');
      const barre = el('div', 'progress-bar', '<div class="progress-fill" style="width:0%"></div>');
      t.appendChild(el('span', 'er-badge', 'DÉFI CHRONO'));
      t.appendChild(chrono); t.appendChild(score); t.appendChild(barre);
      zone.appendChild(t);
      const c = el('div', 'er-card cn-defi-q');
      zone.appendChild(c);
      const cible = { champ: null };
      const zPave = el('div', 'cn-pave-z');
      const pv = N.pave(cible);
      zPave.appendChild(pv);
      const ecoule = () => Math.round((performance.now() - t0) / 100);
      const tic = setInterval(() => { if (!fini) chrono.textContent = duree(ecoule()); chrono.classList.toggle('cn-chrono-depasse', ecoule() > LIMITE); }, 100);
      function maj() {
        const j = res.filter(x => x).length;
        score.textContent = 'Conversion ' + Math.min(k + 1, NB) + '/' + NB + ' · ' + j + ' juste' + (j > 1 ? 's' : '');
        barre.firstChild.style.width = (100 * k / NB) + '%';
      }
      function question() {
        maj();
        const q = qs[k], p = q.parties[q.parties.length - 1];
        CN.questionEnCours = q;                         // conversion affichée (tests automatiques)
        c.innerHTML = '';
        c.appendChild(el('p', 'er-consigne cn-enonce', q.enonce.replace(/ Toute écriture juste est acceptée\./, '')));
        const ligne = el('div', 'cn-ligne cn-defi-ligne', '<span class="cn-texte">' + p.q + '</span>');
        const champ = new N.Champ({ label: 'Ta réponse', surValider: valider });
        ligne.appendChild(champ.el);
        ligne.appendChild(el('span', 'cn-apres', p.apres));
        c.appendChild(ligne);
        const bV = bouton('btn-primary cn-valider', 'Valider', () => champ.touche('valider'));
        bV.addEventListener('mousedown', e => e.preventDefault());
        bV.hidden = CN.pave();
        c.appendChild(bV);
        const ret = el('div', 'cn-reponse');
        ret.setAttribute('aria-live', 'polite');
        c.appendChild(ret);
        c.appendChild(zPave);
        zPave.hidden = !CN.pave();
        cible.champ = champ;
        pv.majChamp();
        if (matchMedia('(hover: hover)').matches) champ.el.focus({ preventScroll: true });
        function valider() {
          const r = champ.lire(), v = CN.Q.verifier(p, r);
          if (v.format) { ret.innerHTML = '<div class="callout cn-msg">' + v.format + '</div>'; return; }
          champ.fin();
          cible.champ = null;
          res.push(!!v.ok);
          if (v.ok) {
            ret.innerHTML = '<p class="cn-juste">✓ Juste !</p>';
            setTimeout(suite, 350);
          } else {
            ret.innerHTML = '<div class="callout-danger cn-msg"><b>Ce n’est pas ça.</b> ' + p.q + ' <b>' + CN.Q.attendue(p) + '</b></div>';
            const b = bouton('btn-primary', k === NB - 1 ? 'Voir mon résultat →' : 'Suivante →', suite);
            b.disabled = true; setTimeout(() => { b.disabled = false; }, 450);
            ret.appendChild(b);
            zPave.hidden = true;
            CN.versVue(b);
          }
        }
      }
      function suite() {
        if (fini || res.length !== k + 1) return;
        k++;
        if (k < NB) question(); else terminer();
      }
      function terminer() {
        fini = true;
        clearInterval(tic);
        const temps = Math.max(1, ecoule()), j = res.filter(x => x).length;
        const d = lireDefi(), ancien = d.meilleur;
        const r = { j, t: temps };
        const record = meilleur(r, ancien);
        d.n++;
        if (record) d.meilleur = r;
        ecrireDefi(d);
        // suivi de la compétence clé, puis succès
        CN.enregistrer(res.map(x => ({ r: 'CV1', ok: x ? 1 : 0, diff: 2, aide: false })), null);
        const ns = CN.succesDefi ? CN.succesDefi(j, temps) : [];
        zone.innerHTML = '';
        const f = el('div', 'er-card er-fin');
        const reussi = j === NB && temps < LIMITE;
        f.innerHTML = '<span class="er-badge">DÉFI TERMINÉ</span><p class="er-trophee">' + (reussi ? 'Défi réussi ! 10 conversions justes en moins de 2 minutes.' : j === NB ? 'Tout est juste ! Encore un peu plus vite pour réussir le défi.' : j >= 7 ? 'Bien joué : vise le 10/10.' : 'Continue : chaque défi te fait gagner en automatisme.') + '</p>' +
          '<div class="er-score">' + j + '<small>/' + NB + '</small></div><p class="er-score-pct">en ' + duree(temps) + (record && ancien ? ' · nouveau record !' : '') + '</p>' +
          (ancien && !record ? '<p class="cn-petit">Ton record : ' + ancien.j + '/' + NB + ' en ' + duree(ancien.t) + '</p>' : '');
        const g = el('div', 'er-recap');
        res.forEach((x, i) => g.appendChild(el('div', x ? 'ok' : 'ko', '<b>' + (i + 1) + '</b>' + (x ? '✓' : '✗'))));
        f.appendChild(g);
        const bloc = ns.length && CN.blocSucces ? CN.blocSucces(ns) : null;
        if (bloc) f.appendChild(bloc);
        const a = el('div', 'er-actions');
        a.appendChild(bouton('btn-primary', '↻ Rejouer', jouer));
        const s = el('a', 'btn-secondary', 'Séance'); s.href = 'seance.html'; a.appendChild(s);
        const m = el('a', 'btn-secondary', 'Mon suivi'); m.href = 'suivi.html'; a.appendChild(m);
        f.appendChild(a);
        zone.appendChild(f);
        if (reussi) CN.confettis();
        CN.versVue(zone.firstChild, 'start');
      }
      question();
      zone.firstChild.scrollIntoView({ block: 'start' });
    }

    intro();
  }

  Object.assign(CN, { defi, lireDefi, recordDefi, duree });
})();
