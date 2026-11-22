/* ============================================================
   Calcul numérique — moteur commun de l'application (objet CN)
   (même fonctionnement que modules/epm.js de l'application Équations en physique)
   ------------------------------------------------------------
   Rôle :
     - PLAN de l'application et navigation commune (assets/sommaire.js),
       bouton « ⚙ Réglages » ajouté au sommaire et au bandeau du téléphone ;
     - réglages de l'élève (panneau latéral) : compétences travaillées
       (automatique ou choisies), pavé sur ordinateur, tests de positionnement ;
       le thème de la séance (tout, puissances de 10, écrire un résultat,
       conversions) se choisit au début de la séance et reste mémorisé ;
     - suivi : chaque question enregistrée avec sa compétence, historique
       des notes, statut de chaque compétence, priorités et choix
       automatique et progressif des compétences d'une séance ;
       CV1 (compétence clé) : maîtrise plus exigeante, présente dans chaque
       séance automatique « Tout » ou « Conversions » ;
     - test de positionnement (par thème) : compétences acquises ;
     - progression du module Découverte (étapes faites) ;
     - rappel d'une compétence ; accueil ; pages « Mon suivi » (et ses succès,
       modules/mes-succes.js) et « Fiches ».
   Dépend de : assets/sommaire.js (SOM), nombre.js (CN.N), competences.js et
   conversions.js (CN.C), sauvegarde.js (facultatif : carte « Sauvegarde », rappel, installation).

   Stockage (localStorage, toujours dans un try/catch) :
     calcul-numerique-progression  (SOM) { derniere, pages: { <page>: { fait, note } } }
     calcul-numerique-reglages     { auto, comps: { <id>: true }, theme: 'T' | 'P' | 'R' | 'C', pave: 'oui' | 'non' }
     calcul-numerique-suivi        { v: 1, r: { <id>: [[t, ok], …] }, notes: [[t, 's', note], …] }
                                   t : date en ms (unique), ok : 1 juste du premier coup, 0,5 juste après erreur, 0 solution affichée
     calcul-numerique-decouverte   { faits: [<numéro de l'étape>, …] }
     calcul-numerique-test         { themes: { <thème>: date }, acquis: { <id>: date } }
     calcul-numerique-defi         { n, meilleur: { j, t } } (modules/defi.js)

   API :
     CN.menu(cle)                  sommaire (SOM.menu) + pastilles Réglages et Sauvegarde
     CN.reglages() ; CN.regler(cle, val) ; CN.ouvrirReglages() ; CN.surReglages(fn) ; CN.resumeReglages()
     CN.enregistrer(occ, note)     occasions [{ r, ok, diff, aide }] et note sur 20 (ou null) ; renvoie les nouveaux succès
     CN.statut(id) 'm' maîtrisée | 'e' en bonne voie | 'f' fragile | 't' à travailler | 'n' pas encore vue | 'v' prérequis à acquérir
     CN.taux(id) ; CN.stats(id) ; CN.priorites() ; CN.planSeance(ids, theme) ; CN.niveauDe(id) ; CN.notes()
     CN.testFait(theme) ; CN.marquerTest(theme, resultats) ; CN.acquis(id) ; CN.themeTravaille(theme)
     CN.blocRappel(id) ; CN.ETAPES (compétences de la Découverte, dans l'ordre) ; CN.etapeDe(id) ; CN.decouverteFaits() ; CN.marquerDecouverte(k)
     CN.accueil(zone) ; CN.pageSuivi(zone) ; CN.pageFiches(zone)
     CN.el, CN.bouton, CN.esc, CN.virg, CN.pluriel, CN.versVue, CN.confettis, CN.pave()
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN = window.CN || {};
  const C = CN.C, R = C.R;
  const APP = 'calcul-numerique';

  /* ---------- Plan de l'application (sommaire, accueil, index de recherche du portail) ---------- */
  const PLAN = [
    { n: 1, titre: 'Découverte', desc: 'Trois parcours guidés : puissances de 10, écrire un résultat, conversions. Une notion, un exemple, puis à toi.',
      parties: [{ nom: 'Découverte', cours: 'decouverte', noms: { cours: 'Découverte des notions' } }] },
    { n: 2, titre: 'Séance de 5 questions', desc: 'Les compétences choisies d’après ton suivi, dans le thème de ton choix, avec des aides.',
      parties: [{ nom: 'Séance de 5 questions', questions: 'seance', noms: { questions: 'Séance de 5 questions' } }] },
    { n: 3, titre: 'Défi chrono : conversions', desc: '10 conversions vers ou depuis l’unité sans préfixe, le plus vite possible : bats ton record.',
      parties: [{ nom: 'Défi chrono', entrainement: 'defi', noms: { entrainement: 'Défi chrono' } }] },
    { n: 4, titre: 'Mon suivi', desc: 'Les compétences que tu maîtrises, celles à travailler en priorité, et tes succès.',
      parties: [{ nom: 'Mon suivi', entrainement: 'suivi', noms: { entrainement: 'Mon suivi' } }] },
    { n: 5, titre: 'Fiches des compétences', desc: 'Chaque compétence expliquée : règle, méthode, exemple, piège.',
      parties: [{ nom: 'Fiches des compétences', cours: 'fiches', noms: { cours: 'Fiches des compétences' } }] }
  ];
  // sommaire sans coches (le suivi des compétences suffit), modules d'une seule page en liens directs
  SOM.init({ nom: 'Calcul numérique', id: APP, coches: false, liensDirects: true, mobile: true, plan: PLAN });

  /* ---------- Petits outils ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function bouton(cls, html, fn, label) {
    const b = el('button', cls, html);
    b.type = 'button';
    if (label) b.setAttribute('aria-label', label);
    if (fn) b.addEventListener('click', fn);
    return b;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const virg = x => String(Math.round(x * 100) / 100).replace('.', ',');
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // amène un élément à l'écran sans sauter dans la page (sous le bandeau grâce à scroll-padding)
  function versVue(n, bloc) { if (n && n.scrollIntoView) n.scrollIntoView({ block: bloc || 'nearest', behavior: reduit() ? 'auto' : 'smooth' }); }
  function lire(cle) { try { return JSON.parse(localStorage.getItem(cle)); } catch (e) { return null; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on continue sans */ } }
  const sansBalises = t => String(t).replace(/<sup>/g, '').replace(/<[^>]+>/g, '');
  // confettis (séance sans faute, défi réussi)
  function confettis() {
    if (reduit()) return;
    const col = ['#2952c8', '#16a34a', '#c2570c', '#5a3fc4', '#e8b400'];
    for (let i = 0; i < 70; i++) {
      const e = el('div', 'er-confetti');
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.background = col[i % col.length];
      e.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      e.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 4800);
    }
  }

  /* =====================================================================
     Réglages de l'élève
     ===================================================================== */
  const CLE_REG = APP + '-reglages';
  const S = { auto: true, comps: {}, theme: 'T', pave: 'oui' };
  C.liste.forEach(c => { if (c.niveau === 1) S.comps[c.id] = true; });
  (function charger() {
    const v = lire(CLE_REG);
    if (!v || typeof v !== 'object') return;
    if (typeof v.auto === 'boolean') S.auto = v.auto;
    if (v.comps && typeof v.comps === 'object') { S.comps = {}; Object.keys(v.comps).forEach(k => { if (R[k] && v.comps[k] === true) S.comps[k] = true; }); }
    if (['T', 'P', 'R', 'C'].indexOf(v.theme) >= 0) S.theme = v.theme;
    if (v.pave === 'oui' || v.pave === 'non') S.pave = v.pave;
  })();
  const ecoutes = [];
  function changer(cle, val) {
    S[cle] = val;
    ecrire(CLE_REG, S);
    ecoutes.forEach(fn => fn(cle));
  }
  const THEMES = [['T', 'Tout']].concat(C.THEMES.map(t => [t.id, t.nom]));
  const NOM_THEME = Object.fromEntries(THEMES);
  const famDe = id => C.familles.find(f => f.id === R[id].famille);
  const dansTheme = (id, th) => !th || th === 'T' || C.themeDe(id) === th;
  const compsChoisies = () => C.liste.filter(c => S.comps[c.id]).map(c => c.id);
  // pavé à l'écran : toujours sur un écran tactile ; sur ordinateur, selon le réglage
  const pave = () => !(S.pave === 'non' && matchMedia('(hover: hover) and (pointer: fine)').matches);
  function resumeReglages() {
    return [S.auto ? 'Compétences : automatique' : 'Compétences : ' + pluriel(compsChoisies().length, 'choisie'), 'Thème : ' + NOM_THEME[S.theme], 'Pavé sur ordinateur : ' + S.pave];
  }

  /* ---------- Panneau des réglages ---------- */
  let panneau = null, voile = null, retourFocus = null;
  const ouvertsF = {};
  // groupe de boutons à choix unique (aria-pressed)
  function segment(choix, val, fn, label) {
    const s = el('div', 'cn-seg');
    s.setAttribute('role', 'group');
    if (label) s.setAttribute('aria-label', label);
    choix.forEach(c => {
      const b = bouton('', esc(c[1]), () => fn(c[0]));
      b.setAttribute('aria-pressed', String(c[0]) === String(val));
      s.appendChild(b);
    });
    return s;
  }
  function contenuReglages(z) {
    z.innerHTML = '';
    // ce que l'élève travaille
    const s1 = el('div', 'cn-sect');
    s1.appendChild(el('h4', '', 'Ce que tu travailles'));
    s1.appendChild(segment([[1, 'Automatique (conseillé)'], [0, 'Je choisis']], S.auto ? 1 : 0, v => { changer('auto', !!+v); contenuReglages(z); }, 'Choix des compétences'));
    if (S.auto) s1.appendChild(el('p', 'cn-petit', 'L’application choisit d’après ton suivi, dans le thème choisi au début de la séance : d’abord les compétences de base, puis les suivantes quand leurs prérequis sont maîtrisés. Elle revient sur ce qui te pose problème, fait réviser ce que tu sais, et propose toujours au moins une conversion vers ou depuis l’unité sans préfixe (thèmes « Tout » et « Conversions »).'));
    else {
      const cpt = el('p', 'cn-petit');
      const majC = () => { const n = compsChoisies().length; cpt.textContent = n ? n + (n > 1 ? ' compétences cochées' : ' compétence cochée') : 'Aucune compétence cochée : la séance sera choisie automatiquement.'; };
      const majG = [];
      C.familles.forEach(f => {
        const Lc = C.liste.filter(c => c.famille === f.id);
        const d = el('div', 'cn-fam');
        const t = el('div', 'cn-fam-t');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', 'Toute la famille ' + f.nom);
        const n = el('span', 'cn-petit');
        const ouvrir = bouton('cn-fam-o', '<b>' + esc(f.nom) + '</b><span class="cn-chev" aria-hidden="true">▾</span>', () => {
          ouvertsF[f.id] = !ouvertsF[f.id];
          ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
          cc.hidden = !ouvertsF[f.id];
        });
        ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
        t.appendChild(cb); t.appendChild(ouvrir); t.appendChild(n);
        const cc = el('div', 'cn-fam-c');
        cc.hidden = !ouvertsF[f.id];
        cb.addEventListener('change', () => {
          Lc.forEach(c => { if (cb.checked) S.comps[c.id] = true; else delete S.comps[c.id]; });
          cc.querySelectorAll('input').forEach(i => { i.checked = cb.checked; });
          changer('comps', S.comps); majC(); majG.forEach(g => g());
        });
        Lc.forEach(c => {
          const l = el('label', 'cn-cb', '<input type="checkbox"' + (S.comps[c.id] ? ' checked' : '') + '><span>' + c.titre + (c.cle ? ' <span class="cn-cle">clé</span>' : '') + ' <span class="cn-niv">niv. ' + c.niveau + '</span></span>');
          l.querySelector('input').addEventListener('change', ev => {
            if (ev.target.checked) S.comps[c.id] = true; else delete S.comps[c.id];
            changer('comps', S.comps); majC(); majG.forEach(g => g());
          });
          cc.appendChild(l);
        });
        d.appendChild(t); d.appendChild(cc); s1.appendChild(d);
        majG.push(() => {
          const k = Lc.filter(c => S.comps[c.id]).length;
          cb.checked = k === Lc.length; cb.indeterminate = k > 0 && k < Lc.length;
          n.textContent = k + '/' + Lc.length;
        });
      });
      majG.forEach(g => g()); majC();
      s1.appendChild(cpt);
    }
    z.appendChild(s1);
    // pavé à l'écran sur ordinateur
    const s2 = el('div', 'cn-sect');
    s2.appendChild(el('h4', '', 'Pavé à l’écran sur ordinateur'));
    s2.appendChild(segment([['oui', 'Affiché'], ['non', 'Masqué (clavier)']], S.pave, v => { changer('pave', v); contenuReglages(z); }, 'Pavé sur ordinateur'));
    s2.appendChild(el('p', 'cn-petit', 'Au clavier : tape 4,5e-3 ou 4,5*10^-3 pour 4,5 × 10<sup>−3</sup>, Entrée pour valider. Sur un téléphone ou une tablette, le pavé est toujours affiché.'));
    z.appendChild(s2);
    // tests de positionnement
    const s3 = el('div', 'cn-sect');
    s3.appendChild(el('h4', '', 'Test de positionnement'));
    s3.appendChild(el('p', 'cn-petit', 'Six questions difficiles, sans aide, sur un thème : ce que tu réussis est compté comme acquis, et les séances passent à la suite. La conversion vers ou depuis l’unité sans préfixe se gagne seulement en séance.'));
    const r = el('div', 'cn-rangee');
    C.THEMES.forEach(t => {
      const a = el('a', 'btn-small', (testFait(t.id) ? '↻ ' : '') + esc(t.nom));
      a.href = (/\/modules\//.test(location.pathname) ? '' : 'modules/') + 'seance.html#test=' + t.id;
      r.appendChild(a);
    });
    s3.appendChild(r);
    z.appendChild(s3);
    z.appendChild(el('p', 'cn-petit', CN.noteReglages || 'Un changement de compétences s’applique à la prochaine séance.'));
  }
  function ouvrirReglages() {
    fermerSommaire();
    if (panneau) return;
    retourFocus = document.activeElement;
    voile = el('div', 'cn-voile');
    voile.addEventListener('click', fermerReglages);
    panneau = el('aside', 'cn-tiroir');
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-label', 'Réglages');
    const h = el('div', 'cn-tiroir-t', '<b>⚙ Réglages</b>');
    const f = bouton('btn-small', 'Fermer ✕', fermerReglages);
    h.appendChild(f);
    const c = el('div', 'cn-tiroir-c');
    contenuReglages(c);
    panneau.appendChild(h); panneau.appendChild(c);
    document.body.appendChild(voile); document.body.appendChild(panneau);
    document.documentElement.classList.add('cn-tiroir-ouvert');
    f.focus({ preventScroll: true });
  }
  function fermerReglages() {
    if (!panneau) return;
    panneau.remove(); voile.remove(); panneau = voile = null;
    document.documentElement.classList.remove('cn-tiroir-ouvert');
    if (retourFocus && retourFocus.focus) retourFocus.focus({ preventScroll: true });
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && panneau) fermerReglages(); });

  /* ---------- Navigation : sommaire commun + bouton Réglages ---------- */
  function fermerSommaire() {
    const h = document.documentElement;
    if (!h.classList.contains('som-ouvert')) return;
    h.classList.remove('som-ouvert');
    const b = document.querySelector('.som-ou');
    if (b) { b.setAttribute('aria-expanded', 'false'); const c = b.querySelector('.som-ou-chev'); if (c) c.textContent = '▾'; }
  }
  function menu(cle) {
    SOM.menu(cle);
    const nav = document.getElementById('app-nav');
    if (!nav) return;
    // ordinateur : dans le sommaire, sous le nom de l'application
    const tete = nav.querySelector('.som-tete');
    if (tete && !nav.querySelector('.cn-reg')) {
      // pastilles Réglages et Sauvegarde (la sauvegarde s'ouvre sur l'accueil, comme sa zone dépliable)
      const pil = el('div', 'cn-nav-pil');
      pil.appendChild(bouton('som-pilule cn-reg', '<span aria-hidden="true">⚙</span>Réglages', ouvrirReglages));
      const app = tete.querySelector('.som-app');
      const sur = cle === 'accueil';
      const a = el('a', 'som-pilule cn-reg', '<span aria-hidden="true">⤓</span>Sauvegarde');
      a.href = sur ? '#sauvegarde' : (app ? app.getAttribute('href') : '../index.html') + '#sauvegarde';
      if (sur) a.addEventListener('click', e => {
        // déjà sur l'accueil : on ouvre la zone sans recharger
        e.preventDefault();
        fermerSommaire();
        if (typeof CN.ouvrirSauvegarde === 'function') CN.ouvrirSauvegarde();
      });
      pil.appendChild(a);
      tete.insertAdjacentElement('afterend', pil);
    }
    // téléphone : à droite du bandeau « où suis-je »
    const barre = nav.querySelector('.som-barre');
    if (barre && !barre.querySelector('.cn-reg-rond')) barre.appendChild(bouton('cn-reg-rond', '<span aria-hidden="true">⚙</span>', ouvrirReglages, 'Réglages'));
  }

  /* =====================================================================
     Test de positionnement : compétences acquises
     ===================================================================== */
  const CLE_TEST = APP + '-test';
  function lireTest() {
    const v = lire(CLE_TEST), t = { themes: {}, acquis: {} };
    if (v && typeof v === 'object') {
      if (v.themes && typeof v.themes === 'object') Object.keys(v.themes).forEach(k => { if (['P', 'R', 'C'].indexOf(k) >= 0 && typeof v.themes[k] === 'number') t.themes[k] = v.themes[k]; });
      if (v.acquis && typeof v.acquis === 'object') Object.keys(v.acquis).forEach(k => { if (R[k] && typeof v.acquis[k] === 'number') t.acquis[k] = v.acquis[k]; });
    }
    return t;
  }
  let test = lireTest();
  const testFait = th => !!test.themes[th];
  const acquis = id => !!test.acquis[id] && !R[id].cle;
  /* résultats : { <id>: true | false } des compétences testées. Une compétence réussie devient acquise,
     ainsi que tous ses prérequis (de tous les thèmes) qui n'ont pas été ratés ; une compétence ratée perd
     son acquis. CV1 n'est jamais acquise par le test (elle se gagne en séance) : on passe seulement
     à ses prérequis. */
  function marquerTest(th, resultats) {
    test = lireTest();
    const t = Date.now();
    test.themes[th] = t;
    const rates = Object.keys(resultats).filter(id => !resultats[id]);
    rates.forEach(id => { delete test.acquis[id]; });
    const ajouter = id => {
      if (!R[id] || rates.indexOf(id) >= 0) return;
      if (!R[id].cle) test.acquis[id] = t;
      R[id].prerequis.forEach(ajouter);
    };
    Object.keys(resultats).forEach(id => { if (resultats[id]) ajouter(id); });
    ecrire(CLE_TEST, test);
    return Object.keys(test.acquis).filter(id => test.acquis[id] === t);
  }

  /* =====================================================================
     Suivi : questions par compétence, notes
     ===================================================================== */
  const CLE_SUIVI = APP + '-suivi';
  const NB_OCC = 10, MIN_OCC = 4;                 // statut calculé sur les 10 dernières questions (4 au moins pour « maîtrisée »)
  const MIN_CLE = 8, SEUIL_CLE = 0.9;             // compétence clé : 90 % sur 8 questions au moins, sans erreur dans les 3 dernières
  function lireSuivi() {
    const v = lire(CLE_SUIVI);
    const s = { v: 1, r: {}, notes: [] };
    if (v && typeof v === 'object') {
      if (v.r && typeof v.r === 'object') Object.keys(v.r).forEach(k => { if (R[k] && Array.isArray(v.r[k])) s.r[k] = v.r[k].filter(x => Array.isArray(x) && x.length === 2); });
      if (Array.isArray(v.notes)) s.notes = v.notes.filter(x => Array.isArray(x) && x.length === 3);
    }
    return s;
  }
  let suivi = lireSuivi();
  // occasions : [{ r, ok }] ; note sur 20 (ou null)
  function enregistrer(occasions, note) {
    suivi = lireSuivi();
    // dates toujours croissantes et uniques (la fusion des copies retire les doublons de même date)
    let tmax = 0;
    Object.keys(suivi.r).forEach(k => suivi.r[k].forEach(x => { if (x[0] > tmax) tmax = x[0]; }));
    suivi.notes.forEach(x => { if (x[0] > tmax) tmax = x[0]; });
    const t0 = Math.max(Date.now(), tmax + 1);
    occasions.forEach((o, i) => {
      if (!R[o.r]) return;
      const l = suivi.r[o.r] = suivi.r[o.r] || [];
      l.push([t0 + i, Math.round(o.ok * 2) / 2]);
      if (l.length > 30) l.splice(0, l.length - 30);
    });
    if (note != null) { suivi.notes.push([t0 + occasions.length, 's', note]); if (suivi.notes.length > 100) suivi.notes.splice(0, suivi.notes.length - 100); }
    ecrire(CLE_SUIVI, suivi);
    // séance notée : compteur du rappel de sauvegarde (modules/sauvegarde.js)
    if (note != null && typeof CN.apresSeance === 'function') CN.apresSeance();
    // succès (modules/mes-succes.js, s'il est chargé) : renvoie les nouveaux succès
    return typeof CN.succesApres === 'function' ? CN.succesApres(occasions, note) : [];
  }
  // les dernières questions d'une compétence
  function stats(id) {
    const l = (suivi.r[id] || []).slice(-NB_OCC);
    const ok = l.reduce((a, x) => a + x[1], 0);
    return { n: l.length, taux: l.length ? ok / l.length : null, der: l.length ? l[l.length - 1][0] : 0, recente: l.slice(-3).some(x => x[1] < 1) };
  }
  /* maîtrisée : 80 % de réussite sur les 10 dernières questions (4 questions au moins) ;
     compétence clé (CV1) : 90 % sur 8 questions au moins, et aucune erreur dans les 3 dernières ;
     acquise au test de positionnement : maîtrisée tant que les questions suivantes réussissent */
  function statut(id, memo) {
    memo = memo || {};
    if (memo[id]) return memo[id];
    const s = stats(id), cle = R[id].cle;
    let st;
    if (s.n) {
      if (cle) st = s.taux >= SEUIL_CLE && !s.recente ? (s.n >= MIN_CLE ? 'm' : 'e') : s.taux >= 0.5 ? 'f' : 't';
      else st = s.taux >= 0.8 ? (s.n >= MIN_OCC || acquis(id) ? 'm' : 'e') : s.taux >= 0.5 ? 'f' : 't';
    } else if (acquis(id)) st = 'm';
    else st = prerequisOk(id, memo) ? 'n' : 'v';
    memo[id] = st;
    return st;
  }
  function prerequisOk(id, memo) { return R[id].prerequis.every(p => statut(p, memo) === 'm'); }
  const taux = id => stats(id).taux;
  // un thème a-t-il déjà été travaillé (questions en séance ou test fait) ?
  const themeTravaille = th => testFait(th) || C.liste.some(c => C.themeDe(c.id) === th && (suivi.r[c.id] || []).length);
  // 3 compétences prioritaires : à travailler ou fragiles, prérequis maîtrisés (la compétence clé d'abord)
  function priorites() {
    const memo = {}, st = id => statut(id, memo);
    return C.liste.filter(c => (st(c.id) === 't' || st(c.id) === 'f') && prerequisOk(c.id, memo))
      .sort((a, b) => ((b.cle ? 1 : 0) - (a.cle ? 1 : 0)) || (a.niveau - b.niveau) || ((st(a.id) === 't' ? 0 : 1) - (st(b.id) === 't' ? 0 : 1)))
      .slice(0, 3).map(c => c.id);
  }
  // difficulté des questions (1 à 3) pour une compétence, d'après le suivi (progressif)
  function niveauDe(id) {
    const s = stats(id);
    if (!s.n && acquis(id)) return 3;
    if (s.n < 2 || s.taux < 0.6) return 1;
    return s.taux < 0.8 || s.n < MIN_OCC ? 2 : 3;
  }
  /* Plan d'une séance de 5 questions : [{ comp, raison }]
     - ids donnés (adresse #comp=…) ou réglage « Je choisis » : ces compétences, à tour de rôle ;
     - automatique, dans le thème choisi : compétences du thème dont les prérequis sont maîtrisés,
       et les prérequis d'un autre thème qui bloquent le thème. D'abord celles à retravailler, sinon
       une nouvelle compétence (la plus basse dans la progression) ; 3 ou 4 questions dessus, une autre
       compétence à travailler ou nouvelle, et une compétence maîtrisée à réviser ;
     - thèmes « Tout » et « Conversions » : au moins une question de la compétence clé CV1 dès que ses
       prérequis sont maîtrisés (même maîtrisée : révision permanente). */
  function planSeance(ids, theme) {
    const memo = {}, st = id => statut(id, memo);
    const choisis = ids && ids.length ? ids.filter(id => R[id]) : (!S.auto ? compsChoisies() : []);
    const plan = [];
    const parNiveau = l => l.sort((a, b) => R[a.comp].niveau - R[b.comp].niveau);
    if (choisis.length) {
      const l = choisis.slice().sort((a, b) => R[a].niveau - R[b].niveau);
      for (let i = 0; plan.length < 5; i++) plan.push({ comp: l[i % l.length], raison: 'choisie' });
      return parNiveau(plan);
    }
    theme = theme || 'T';
    const dans = C.liste.filter(c => dansTheme(c.id, theme));
    const cand = dans.filter(c => prerequisOk(c.id, memo));
    // prérequis d'un autre thème qui bloquent une compétence du thème
    const bloque = [];
    const chercher = id => R[id].prerequis.forEach(p => {
      if (st(p) === 'm' || bloque.indexOf(p) >= 0) return;
      if (prerequisOk(p, memo)) { if (!dansTheme(p, theme)) bloque.push(p); } else chercher(p);
    });
    if (theme !== 'T') dans.filter(c => !prerequisOk(c.id, memo)).forEach(c => chercher(c.id));
    const tous = cand.concat(bloque.map(id => R[id]));
    const rang = id => 'tfe'.indexOf(st(id));
    const A = tous.filter(c => rang(c.id) >= 0).sort((a, b) => (a.niveau - b.niveau) || (rang(a.id) - rang(b.id)));
    const B = tous.filter(c => st(c.id) === 'n').sort((a, b) => a.niveau - b.niveau);
    const M = cand.filter(c => st(c.id) === 'm').sort((a, b) => stats(a.id).der - stats(b.id).der);
    const F = [];
    const raisonDe = c => bloque.indexOf(c.id) >= 0 ? 'prérequis' : st(c.id) === 't' ? 'à travailler' : st(c.id) === 'f' ? 'fragile' : st(c.id) === 'e' ? 'en cours' : 'nouvelle';
    A.slice(0, 2).forEach(c => F.push({ comp: c.id, raison: raisonDe(c) }));
    while (F.length < 2 && B.length) { const c = B.shift(); F.push({ comp: c.id, raison: raisonDe(c) }); }
    if (!F.length && M.length) F.push({ comp: M.shift().id, raison: 'révision' });
    if (!F.length) F.push({ comp: dans[0].id, raison: 'nouvelle' });
    const rev = M.length ? { comp: M[0].id, raison: 'révision' } : null;
    const n1 = F.length > 1 ? 3 : (rev ? 4 : 5);
    for (let i = 0; i < n1; i++) plan.push(F[0]);
    if (F.length > 1) for (let i = 0; i < (rev ? 1 : 2); i++) plan.push(F[1]);
    if (rev) plan.push(rev);
    // la compétence clé dans chaque séance « Tout » ou « Conversions »
    if ((theme === 'T' || theme === 'C') && prerequisOk('CV1', memo) && !plan.some(p => p.comp === 'CV1')) {
      const i = rev ? plan.length - 1 : plan.length - 1;
      plan[i] = { comp: 'CV1', raison: st('CV1') === 'm' ? 'compétence clé' : 'compétence clé, ' + (st('CV1') === 'n' ? 'nouvelle' : 'à consolider') };
    }
    return parNiveau(plan.slice(0, 5).map(p => Object.assign({}, p)));
  }
  const notes = () => suivi.notes.slice();

  /* ---------- Module Découverte : une étape par compétence, dans cet ordre (trois parcours) ---------- */
  const ETAPES = ['PU1', 'PU2', 'PU3', 'PU4', 'ES1', 'ES2', 'ES3', 'ES4', 'CS1', 'CS2', 'CS3', 'CS4',
    'PR1', 'PR2', 'CV1', 'CV2', 'CV3', 'CV4', 'CV5', 'CV6', 'CV7', 'CV8', 'CV9', 'CV10'];
  const etapeDe = id => ETAPES.indexOf(id);
  const CLE_DEC = APP + '-decouverte';
  function decouverteFaits() {
    const v = lire(CLE_DEC);
    return v && Array.isArray(v.faits) ? v.faits.filter(k => Number.isInteger(k) && k >= 0) : [];
  }
  function marquerDecouverte(k) {
    const f = decouverteFaits();
    if (f.indexOf(k) < 0) { f.push(k); f.sort((a, b) => a - b); ecrire(CLE_DEC, { faits: f }); }
    return f;
  }

  /* ---------- Rappel d'une compétence (aide pendant une question) ---------- */
  function contenuHTML(c) {
    return '<p>' + c.regle + '</p><div class="cle"><b class="cle-titre">Méthode.</b> ' + c.methode + '</div><div class="cn-exemple"><p class="cn-exemple-t">Exemple</p>' + c.exemple + '</div>';
  }
  function blocRappel(id) {
    const c = R[id], b = el('div', 'cn-rappel');
    b.innerHTML = '<p class="cn-rappel-t">' + c.titre + '</p>' + contenuHTML(c) +
      '<a class="cn-lien-fiche" href="fiches.html#' + id + '" target="_blank" rel="noopener">Voir la fiche ↗</a>';
    return b;
  }

  /* =====================================================================
     Accueil de l'application
     ===================================================================== */
  const cleDe = m => { const pt = m.parties[0]; return pt.questions || pt.entrainement || pt.cours; };
  function accueil(zone) {
    zone.innerHTML = '';
    const nf = decouverteFaits().length, nd = ETAPES.length;
    const conseil = el('div', 'callout callout-accent cn-conseil');
    conseil.innerHTML = suivi.notes.length || nf >= nd
      ? '<b>Continue avec les séances.</b> L’application choisit les compétences à travailler dans le thème de ton choix. Pour t’entraîner aux conversions les plus utiles, lance un <b>défi chrono</b>.'
      : '<b>Tu ne sais pas par où commencer ?</b> Suis la <b>Découverte</b> : une notion à la fois, avec un exemple et des questions guidées. <b>Tu as déjà de bonnes bases ?</b> Va directement à la <b>séance</b> : un test de positionnement te fait passer ce que tu sais.';
    zone.appendChild(conseil);
    // les modules : chaque ligne ouvre directement la page du module
    const liste = el('div', 'som-modules');
    PLAN.forEach(m => {
      const d = el('div', 'som-module');
      let cpt = '';
      if (m.n === 1) cpt = '<span class="som-compte">' + nf + '/' + nd + '</span>';
      if (m.n === 3 && CN.recordDefi) { const r = CN.recordDefi(); if (r) cpt = '<span class="som-compte">record ' + r + '</span>'; }
      const a = el('a', 'som-ligne', '<span class="som-badge">' + m.n + '</span><span class="som-ligne-t">' + esc(m.titre) + '<small>' + esc(m.desc) + '</small></span>' + cpt +
        '<span class="som-chev" aria-hidden="true">›</span>');
      a.href = 'modules/' + cleDe(m) + '.html';
      d.appendChild(a); liste.appendChild(d);
    });
    zone.appendChild(liste);
    // zones dépliables « Sauvegarde » (modules/sauvegarde.js) et « Réglages » (en dernier), séparées des modules
    const annexes = el('div', 'cn-annexes');
    if (typeof CN.carteSauvegarde === 'function') annexes.appendChild(CN.carteSauvegarde());
    const c = el('div', 'cn-zone cn-reglages-ligne');
    const t = bouton('cn-zone-t', '<span class="cn-zone-nom">Réglages</span><span class="cn-zone-chev" aria-hidden="true">›</span>', () => {
      const oui = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', String(oui));
      cc.hidden = !oui;
    });
    t.setAttribute('aria-expanded', 'false');
    t.setAttribute('aria-controls', 'reglages-c');
    const cc = el('div', 'cn-zone-c');
    cc.id = 'reglages-c'; cc.hidden = true;
    cc.appendChild(bouton('btn-small', '⚙ Réglages', ouvrirReglages));
    const tags = el('div', 'cn-tags');
    const majTags = () => { tags.innerHTML = resumeReglages().map(x => '<span class="cn-tag">' + esc(x) + '</span>').join(''); };
    majTags(); ecoutes.push(majTags);
    cc.appendChild(tags);
    c.appendChild(t); c.appendChild(cc);
    annexes.appendChild(c);
    zone.appendChild(annexes);
  }

  /* =====================================================================
     Mon suivi (groupé par famille)
     ===================================================================== */
  const LIBS = { m: 'Maîtrisée', e: 'En bonne voie', f: 'Fragile', t: 'À travailler', n: 'Pas encore vue', v: 'Prérequis à acquérir' };
  const ouvertsS = {};
  // petite courbe des dernières notes
  function courbe(vals) {
    const w = 120, h = 30;
    if (vals.length < 2) return '';
    const pts = vals.map((v, i) => (3 + i * (w - 6) / (vals.length - 1)).toFixed(1) + ',' + (h - 3 - v / 20 * (h - 6)).toFixed(1)).join(' ');
    const sens = vals[vals.length - 1] > vals[0] ? 'en hausse' : vals[vals.length - 1] < vals[0] ? 'en baisse' : 'stables';
    return '<svg class="cn-courbe" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Évolution des notes : ' + sens + '"><polyline points="' + pts + '"/></svg>';
  }
  function pageSuivi(zone) {
    suivi = lireSuivi(); test = lireTest();
    const memo = {}, st = id => statut(id, memo);
    const nb = suivi.notes.length;
    const ctx = document.querySelector('#entete .er-contexte');
    if (ctx) ctx.innerHTML = nb ? 'Calculé sur tes <b>' + pluriel(nb, 'séance') + '</b> (les 10 dernières questions de chaque compétence), tes défis et tes tests de positionnement. Une compétence se débloque quand ses prérequis sont maîtrisés.'
      : 'Fais tes premières séances : chaque question est rangée avec sa compétence. Une compétence se débloque quand ses prérequis sont maîtrisés.';
    zone.innerHTML = '';
    // la compétence clé, mise en avant
    const k = R.CV1, sk = st('CV1'), sx = stats('CV1');
    const ck = el('div', 'er-card cn-carte-cle');
    ck.innerHTML = '<div class="cn-rangee cn-entre"><h3 class="cn-h3">Compétence clé : ' + k.titre + '</h3><span class="cn-puce cn-s-' + sk + '" aria-hidden="true"></span></div>' +
      '<p class="cn-petit">C’est la conversion la plus utile en physique : elle est travaillée dans chaque séance et dans le défi chrono. ' +
      (sx.n ? '<b>' + LIBS[sk] + '</b> · ' + Math.round(sx.taux * 100) + ' % sur ' + pluriel(sx.n, 'question') + '.' : '<b>' + LIBS[sk] + '.</b>') +
      ' Maîtrisée : au moins 90 % sur 8 questions, sans erreur dans les 3 dernières.</p>';
    const rk = el('div', 'cn-rangee');
    const a1 = el('a', 'btn-secondary cn-pt', 'Défi chrono →'); a1.href = 'defi.html'; rk.appendChild(a1);
    const a2 = el('a', 'btn-small', 'Séance sur cette compétence'); a2.href = 'seance.html#comp=CV1'; rk.appendChild(a2);
    ck.appendChild(rk);
    zone.appendChild(ck);
    // priorités
    const pr = el('div', 'er-card cn-prio');
    pr.appendChild(el('h3', 'cn-h3', 'À travailler en priorité'));
    const P = priorites();
    if (P.length) {
      const ol = el('ol', 'cn-prio-l');
      P.forEach(id => ol.appendChild(el('li', '', '<b>' + R[id].titre + '</b> <span class="cn-petit">· ' + LIBS[st(id)].toLowerCase() + ' · ' + Math.round(taux(id) * 100) + ' %</span> <a class="cn-lien-fiche" href="fiches.html#' + id + '">fiche</a>')));
      pr.appendChild(ol);
    } else pr.appendChild(el('p', 'cn-petit', nb ? 'Aucune compétence fragile pour l’instant : continue avec le mode automatique.' : 'Tes priorités apparaîtront ici après quelques séances.'));
    const r = el('div', 'cn-rangee cn-prio-b');
    const a = el('a', 'btn-primary', P.length ? 'Séance sur ces compétences →' : 'Commencer une séance →');
    a.href = 'seance.html' + (P.length ? '#comp=' + P.join(',') : '');
    r.appendChild(a);
    const der = suivi.notes.slice(-7).map(x => x[2]);
    if (der.length) r.appendChild(el('span', 'cn-petit cn-notes', 'Dernières notes : ' + der.slice(-3).map(virg).join(' · ') + ' /20 ' + courbe(der)));
    pr.appendChild(r);
    zone.appendChild(pr);
    // compétences par thème puis par famille
    const c = el('div', 'er-card');
    c.appendChild(el('h3', 'cn-h3', 'Mes compétences'));
    const ordre = ['m', 'e', 'f', 't', 'n', 'v'];
    C.THEMES.forEach(th => {
      c.appendChild(el('p', 'cn-lab', esc(th.nom) + (testFait(th.id) ? ' <span class="cn-niv">test fait</span>' : '')));
      C.familles.filter(f => f.theme === th.id).forEach(f => {
        const Lc = C.liste.filter(x => x.famille === f.id);
        const cpt = { m: 0, e: 0, f: 0, t: 0, n: 0, v: 0 };
        Lc.forEach(x => { cpt[st(x.id)]++; });
        const g = el('div', 'cn-grp' + (ouvertsS[f.id] ? ' ouvert' : ''));
        const pile = '<span class="cn-pile" role="img" aria-label="' + ordre.filter(s => cpt[s]).map(s => cpt[s] + ' ' + LIBS[s].toLowerCase()).join(', ') + '">' +
          ordre.map(s => (cpt[s] ? '<i class="cn-s-' + s + '" style="width:' + (100 * cpt[s] / Lc.length).toFixed(1) + '%"></i>' : '')).join('') + '</span>';
        const alerte = cpt.t ? ' <span class="cn-alerte">· ' + cpt.t + ' à travailler</span>' : cpt.f ? ' <span class="cn-petit">· ' + pluriel(cpt.f, 'fragile') + '</span>' : '';
        const t = bouton('cn-grp-t', '<span><b>' + esc(f.nom) + '</b>' + alerte + '</span>' + pile + '<span class="cn-petit cn-adroite">' + cpt.m + '/' + Lc.length + '</span><span class="cn-chev" aria-hidden="true">▾</span>', () => {
          ouvertsS[f.id] = !ouvertsS[f.id];
          g.classList.toggle('ouvert', ouvertsS[f.id]);
          t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
        });
        t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
        g.appendChild(t);
        const cc = el('div', 'cn-grp-c');
        Lc.forEach(x => {
          const s = st(x.id), n = stats(x.id).n;
          const l = el('div', 'cn-ligne-r' + (s === 'v' ? ' cn-plus-tard' : ''), '<span class="cn-puce cn-s-' + s + '" aria-hidden="true"></span><span>' + x.titre + (x.cle ? ' <span class="cn-cle">clé</span>' : '') +
            ' <span class="cn-sr">(' + LIBS[s].toLowerCase() + ')</span></span><span class="cn-pct">' + (s === 'v' ? 'plus tard' : !n && acquis(x.id) ? 'acquise au test' : s === 'n' ? 'pas encore vue'
            : Math.round(taux(x.id) * 100) + ' % <small>(' + pluriel(n, 'question') + ')</small>') + '</span>');
          if (s === 'v') l.title = 'D’abord : ' + x.prerequis.filter(p => st(p) !== 'm').map(p => sansBalises(R[p].titre)).join(' ; ');
          cc.appendChild(l);
        });
        g.appendChild(cc);
        c.appendChild(g);
      });
    });
    c.appendChild(el('div', 'cn-legende', ordre.map(s => '<span><span class="cn-puce cn-s-' + s + '" aria-hidden="true"></span>' + LIBS[s] + '</span>').join('')));
    c.appendChild(el('p', 'cn-petit', 'Maîtrisée : au moins 80 % de réussite sur les 10 dernières questions (4 questions au moins ; avant, elle est « en bonne voie ») ; pour la compétence clé, 90 % sur 8 questions, sans erreur dans les 3 dernières. Une question compte 1 si elle est réussie sans erreur, 0,5 après une erreur, 0 si tu as affiché la solution. Une compétence réussie au test de positionnement compte comme maîtrisée tant que tu la réussis. Une compétence n’est proposée en mode automatique que si ses prérequis sont maîtrisés.'));
    zone.appendChild(c);
    // succès, après les compétences (modules/mes-succes.js) ; adresse suivi.html#succes : amenés à l'écran
    if (typeof CN.carteSucces === 'function') {
      zone.appendChild(CN.carteSucces());
      if (location.hash === '#succes' && !pageSuivi.vu) { pageSuivi.vu = true; setTimeout(() => versVue(document.getElementById('succes'), 'start'), 60); }
    }
    SOM.marquer({ fait: true });
    // Firefox, page ouverte depuis l'ordinateur (file://) : chaque page garde ses données pour elle seule
    if (!nb && location.protocol === 'file:' && /Firefox\//.test(navigator.userAgent)) {
      zone.insertBefore(el('div', 'callout cn-msg', 'Tes séances n’apparaissent pas ici ? Avec Firefox, une page ouverte depuis l’ordinateur garde ses données pour elle seule : ton suivi ne peut pas passer d’une page à l’autre. Ouvre l’application avec Chrome ou Edge, ou depuis son adresse en ligne.'), zone.firstChild);
    }
    // affichage toujours à jour : page revenue par « Précédent » (cache du navigateur), suivi changé
    if (!pageSuivi.ecoute) {
      pageSuivi.ecoute = true;
      const maj = () => { menu('suivi'); pageSuivi(zone); };
      addEventListener('pageshow', e => { if (e.persisted) maj(); });
      addEventListener('storage', e => { if (e.key === CLE_SUIVI || e.key === CLE_TEST || e.key === null) maj(); });
    }
  }

  /* =====================================================================
     Fiches des compétences (pastilles des familles, compétences en lignes dépliables)
     ===================================================================== */
  function pageFiches(zone) {
    const FI = { choix: C.familles[0].id, comp: null };
    // adresse fiches.html#CV (famille) ou #CV2 (compétence ouverte)
    function lireAncre() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (R[h]) { FI.choix = R[h].famille; FI.comp = h; }
      else if (C.familles.some(f => f.id === h)) { FI.choix = h; FI.comp = null; }
    }
    function ligneComp(c) {
      const d = el('div', 'cn-fr' + (FI.comp === c.id ? ' ouvert' : ''));
      d.id = c.id;
      const t = bouton('cn-fr-t', '<span>' + c.titre + (c.cle ? ' <span class="cn-cle">clé</span>' : '') + ' <span class="cn-niv">niv. ' + c.niveau + '</span></span><span class="cn-chev" aria-hidden="true">▾</span>', () => {
        FI.comp = FI.comp === c.id ? null : c.id;
        dessiner();
        if (FI.comp) versVue(document.getElementById(c.id));
      });
      t.setAttribute('aria-expanded', FI.comp === c.id);
      d.appendChild(t);
      if (FI.comp === c.id) {
        const pre = c.prerequis.length ? '<p class="cn-petit">Avant : ' + c.prerequis.map(p => '<a class="cn-lien-fiche" href="#' + p + '">' + R[p].titre + '</a>').join(' · ') + '</p>' : '';
        const x = el('div', 'cn-fr-c', contenuHTML(c) + '<div class="cn-piege"><b class="cle-titre">Attention.</b> ' + c.piege + '</div>' + pre);
        const r = el('div', 'cn-rangee');
        const a = el('a', 'btn-secondary cn-pt', 'M’entraîner sur cette compétence →');
        a.href = 'seance.html#comp=' + c.id;
        r.appendChild(a);
        const k = etapeDe(c.id);
        if (k >= 0) { const b = el('a', 'btn-small', 'Voir dans la Découverte'); b.href = 'decouverte.html#' + (k + 1); r.appendChild(b); }
        if (c.cle) { const b = el('a', 'btn-small', 'Défi chrono'); b.href = 'defi.html'; r.appendChild(b); }
        x.appendChild(r);
        d.appendChild(x);
      }
      return d;
    }
    function dessiner() {
      zone.innerHTML = '';
      const ch = el('div', 'cn-chips');
      ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Familles de compétences');
      C.familles.forEach(f => {
        const b = bouton('', esc(f.nom), () => { FI.choix = f.id; FI.comp = null; history.replaceState(null, '', '#' + f.id); dessiner(); });
        b.setAttribute('aria-pressed', f.id === FI.choix);
        ch.appendChild(b);
      });
      zone.appendChild(ch);
      const f = C.familles.find(x => x.id === FI.choix);
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'cn-h3', esc(f.nom)));
      c.appendChild(el('p', 'cn-intro', esc(f.desc)));
      const g = el('div', 'cn-liste-r');
      C.liste.filter(x => x.famille === f.id).forEach(x => g.appendChild(ligneComp(x)));
      c.appendChild(g);
      zone.appendChild(c);
    }
    lireAncre();
    dessiner();
    if (FI.comp) setTimeout(() => versVue(document.getElementById(FI.comp), 'center'), 60);
    addEventListener('hashchange', () => { lireAncre(); dessiner(); if (FI.comp) versVue(document.getElementById(FI.comp), 'center'); });
    SOM.marquer({ fait: true });
  }

  Object.assign(CN, {
    PLAN, LIBS, THEMES, NOM_THEME, el, bouton, esc, virg, pluriel, versVue, confettis, sansBalises, pave, famDe,
    menu, reglages: () => S, regler: changer, ouvrirReglages, fermerReglages, surReglages: fn => ecoutes.push(fn), resumeReglages, compsChoisies,
    enregistrer, statut: id => statut(id), taux, stats, priorites, planSeance, niveauDe, notes, blocRappel, contenuHTML,
    testFait, marquerTest, acquis, themeTravaille, ETAPES, etapeDe, decouverteFaits, marquerDecouverte, accueil, pageSuivi, pageFiches
  });
})();
