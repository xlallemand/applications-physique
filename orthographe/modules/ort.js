/* ============================================================
   Orthographe — moteur commun de l'application (objet ORT)
   ------------------------------------------------------------
   Rôle :
     - PLAN de l'application et navigation commune (assets/sommaire.js),
       bouton « ⚙ Réglages » ajouté au sommaire et au bandeau du téléphone ;
     - réglages de l'élève (panneau latéral), gardés dans le navigateur ;
     - suivi : chaque occasion de faute enregistrée avec sa règle,
       historique des notes, statut de chaque règle, priorités et
       choix automatique des notions ;
     - synthèse vocale (voix française du navigateur) ;
     - rappel d'une règle ; accueil ; pages « Mon suivi » et « Fiches ».
   Dépend de : assets/sommaire.js (SOM), regles.js (ORTHO_DONNEES), langue.js (ORT.L).

   Stockage (localStorage, toujours dans un try/catch) :
     orthographe-progression  (SOM) { derniere, pages: { <page>: { fait, note } } }
     orthographe-reglages     { auto, notions: { <règle>: true }, type, rep, corr, longueur, vitesse, lectures, relecture }
     orthographe-suivi        { v: 1, r: { <règle>: [[t, ok], …] }, notes: [[t, 'c' | 'b', note], …] }
                              t : date en ms (unique), ok : 1 juste, 0,5 juste au 2e essai, 0 faute
     (fusion fine dans assets/progression.js, type « ortho-suivi »)

   API :
     ORT.menu(cle)                 sommaire (SOM.menu) + bouton Réglages
     ORT.reglages()                réglages en cours ; ORT.regler(cle, val) ; ORT.ouvrirReglages() ; ORT.surReglages(fn)
     ORT.resumeReglages()          étiquettes du résumé des réglages
     ORT.enregistrer(occ, note, type)   occasions [{ r, ok }] et note sur 20 ('c' dictée courte, 'b' brevet)
     ORT.statut(id) 'm' maîtrisée | 'f' fragile | 't' à travailler | 'n' pas encore vue | 'v' prérequis à acquérir
     ORT.taux(id) ; ORT.priorites() ; ORT.choixAuto() ; ORT.notes(type)
     ORT.voix : { dispo(), dire(liste, opts), arreter() }
     ORT.blocRegle(id)             rappel de la règle (élément), lien vers la fiche
     ORT.accueil(zone) ; ORT.pageSuivi(zone) ; ORT.pageFiches(zone)
     ORT.el, ORT.esc, ORT.marque, ORT.virg, ORT.versVue, ORT.R, ORT.NOMC, ORT.PASSAGES
   ============================================================ */
(function () {
  'use strict';
  const ORT = window.ORT = window.ORT || {};
  const D = window.ORTHO_DONNEES;
  const R = {};
  D.regles.forEach(r => { R[r.id] = r; });
  // noms courts des familles (pastilles, suivi, résultat)
  const NOMC = { GN: 'Groupe nominal', SV: 'Sujet-verbe', EE: '-é, -er, -i, -u', CJ: 'Conjugaison', PP: 'Participe passé', HO: 'Homophones', LX: 'Orthographe d’usage' };
  const PASSAGES = { 1: 'Accords', 2: 'Conjugaison', 3: 'Mots particuliers', 4: 'À l’envers' };

  /* ---------- Plan de l'application (sommaire, accueil, index de recherche du portail) ---------- */
  const PLAN = [
    { n: 1, titre: 'Dictée courte', desc: 'Un texte court : relis-le en 4 passages, corrige, obtiens ta note.',
      parties: [{ nom: 'Dictée courte', questions: 'dictee_courte', noms: { questions: 'Dictée courte' } }] },
    { n: 2, titre: 'Dictée brevet', desc: 'Une dictée complète, en conditions réelles (20 min).',
      parties: [{ nom: 'Dictée brevet', questions: 'dictee_brevet', noms: { questions: 'Dictée brevet' } }] },
    { n: 3, titre: 'Mon suivi', desc: 'Ce que tu maîtrises et ce qu’il faut travailler en priorité.',
      parties: [{ nom: 'Mon suivi', entrainement: 'suivi', noms: { entrainement: 'Mon suivi' } }] },
    { n: 4, titre: 'Fiches de règles', desc: 'Les règles de chaque famille, avec leurs tests.',
      parties: [{ nom: 'Fiches de règles', cours: 'fiches', noms: { cours: 'Fiches de règles' } }] }
  ];
  SOM.init({ nom: 'Orthographe', id: 'orthographe', plan: PLAN });

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
  // exemple d'une règle : le mot visé entre [[ ]] est mis en valeur
  const marque = s => esc(s).replace(/\[\[(.+?)\]\]/g, '<mark>$1</mark>');
  const virg = x => String(Math.round(x * 100) / 100).replace('.', ',');
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // amène un élément à l'écran sans sauter dans la page (sous le bandeau grâce à scroll-padding)
  function versVue(n, bloc) { if (n && n.scrollIntoView) n.scrollIntoView({ block: bloc || 'nearest', behavior: reduit() ? 'auto' : 'smooth' }); }
  function lire(cle) { try { return JSON.parse(localStorage.getItem(cle)); } catch (e) { return null; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); } catch (e) { /* stockage indisponible : on continue sans */ } }

  /* =====================================================================
     Réglages de l'élève
     ===================================================================== */
  const CLE_REG = 'orthographe-reglages';
  // relecture : 'etapes' (4 passages) ou 'unique' (toutes les fautes d'un seul coup)
  const S = { auto: true, notions: {}, type: 'texte', rep: 'arep', corr: 'qcm', longueur: 'tc', vitesse: 0.85, lectures: 2, relecture: 'etapes' };
  D.regles.forEach(r => { if (r.niveau === 1) S.notions[r.id] = true; });
  (function charger() {
    const v = lire(CLE_REG);
    if (!v || typeof v !== 'object') return;
    if (typeof v.auto === 'boolean') S.auto = v.auto;
    if (v.notions && typeof v.notions === 'object') { S.notions = {}; Object.keys(v.notions).forEach(k => { if (R[k] && v.notions[k] === true) S.notions[k] = true; }); }
    if (['texte', 'audio'].indexOf(v.type) >= 0) S.type = v.type;
    if (['arep', 'reperees'].indexOf(v.rep) >= 0) S.rep = v.rep;
    if (['qcm', 'saisie', 'fin'].indexOf(v.corr) >= 0) S.corr = v.corr;
    if (['tc', 'c'].indexOf(v.longueur) >= 0) S.longueur = v.longueur;
    if ([0.7, 0.85, 1].indexOf(v.vitesse) >= 0) S.vitesse = v.vitesse;
    if ([1, 2, 3].indexOf(v.lectures) >= 0) S.lectures = v.lectures;
    if (['etapes', 'unique'].indexOf(v.relecture) >= 0) S.relecture = v.relecture;
  })();
  const ecoutes = [];
  function changer(cle, val) {
    S[cle] = val;
    ecrire(CLE_REG, S);
    ecoutes.forEach(fn => fn(cle));
  }
  const notionsChoisies = () => Object.keys(S.notions).filter(k => S.notions[k]);
  function resumeReglages() {
    const t = [S.auto ? 'Notions : automatique' : 'Notions : ' + pluriel(notionsChoisies().length, 'choisie')];
    if (S.type === 'audio') {
      t.push('Dictée audio', { 0.7: 'lecture lente', 0.85: 'lecture normale', 1: 'lecture rapide' }[S.vitesse], pluriel(S.lectures, 'lecture') + ' par groupe');
    } else {
      t.push('Texte à corriger');
      if (S.corr !== 'fin') t.push(S.rep === 'arep' ? 'fautes à repérer' : 'fautes déjà repérées');
      t.push({ qcm: 'choix multiples', saisie: 'j’écris le mot', fin: 'j’écris la fin du mot' }[S.corr]);
    }
    // pas de relecture quand les fautes sont déjà repérées
    if (S.type === 'audio' || S.rep === 'arep' || S.corr === 'fin') t.push(S.relecture === 'unique' ? 'relecture d’un seul coup' : 'relecture en 4 passages');
    t.push(S.longueur === 'tc' ? 'très courte' : 'courte');
    return t;
  }

  /* ---------- Panneau des réglages ---------- */
  let panneau = null, voile = null, retourFocus = null;
  const ouvertsF = {};
  // groupe de boutons à choix unique (aria-pressed)
  function segment(choix, val, fn, inactif, label) {
    const s = el('div', 'ort-seg' + (inactif ? ' off' : ''));
    s.setAttribute('role', 'group');
    if (label) s.setAttribute('aria-label', label);
    choix.forEach(c => {
      const b = bouton('', esc(c[1]), () => { if (!inactif) fn(c[0]); });
      b.setAttribute('aria-pressed', String(c[0]) === String(val));
      if (inactif) b.disabled = true;
      s.appendChild(b);
    });
    return s;
  }
  function ligne(lib, contenu) { const l = el('div', 'ort-lig'); l.appendChild(el('span', '', esc(lib))); l.appendChild(contenu); return l; }
  function contenuReglages(z) {
    z.innerHTML = '';
    // ce que l'élève travaille
    const s1 = el('div', 'ort-sect');
    s1.appendChild(el('h4', '', 'Ce que tu travailles'));
    s1.appendChild(segment([[1, 'Automatique (conseillé)'], [0, 'Je choisis']], S.auto ? 1 : 0, v => { changer('auto', !!+v); contenuReglages(z); }, false, 'Choix des notions'));
    if (S.auto) s1.appendChild(el('p', 'ort-petit', 'L’application choisit d’après ton suivi : d’abord le socle, puis ce qui te coûte le plus de points.'));
    else {
      const cpt = el('p', 'ort-petit');
      const majC = () => { const n = notionsChoisies().length; cpt.textContent = n + (n > 1 ? ' notions cochées' : ' notion cochée'); };
      const majG = [];
      D.familles.forEach(f => {
        const Lr = D.regles.filter(r => r.famille === f.id);
        const d = el('div', 'ort-fam');
        const t = el('div', 'ort-fam-t');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', 'Toute la famille ' + NOMC[f.id]);
        const n = el('span', 'ort-petit');
        const ouvrir = bouton('ort-fam-o', '<b>' + esc(f.nom) + '</b><span class="ort-chev" aria-hidden="true">▾</span>', () => {
          ouvertsF[f.id] = !ouvertsF[f.id];
          ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
          cc.hidden = !ouvertsF[f.id];
        });
        ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
        t.appendChild(cb); t.appendChild(ouvrir); t.appendChild(n);
        const cc = el('div', 'ort-fam-c');
        cc.hidden = !ouvertsF[f.id];
        cb.addEventListener('change', () => {
          Lr.forEach(r => { if (cb.checked) S.notions[r.id] = true; else delete S.notions[r.id]; });
          cc.querySelectorAll('input').forEach(i => { i.checked = cb.checked; });
          changer('notions', S.notions); majC(); majG.forEach(g => g());
        });
        Lr.forEach(r => {
          const l = el('label', 'ort-cb', '<input type="checkbox"' + (S.notions[r.id] ? ' checked' : '') + '><span>' + esc(r.titre) + ' <span class="ort-niv">niv. ' + r.niveau + '</span></span>');
          l.querySelector('input').addEventListener('change', ev => {
            if (ev.target.checked) S.notions[r.id] = true; else delete S.notions[r.id];
            changer('notions', S.notions); majC(); majG.forEach(g => g());
          });
          cc.appendChild(l);
        });
        d.appendChild(t); d.appendChild(cc); s1.appendChild(d);
        majG.push(() => {
          const k = Lr.filter(r => S.notions[r.id]).length;
          cb.checked = k === Lr.length; cb.indeterminate = k > 0 && k < Lr.length;
          n.textContent = k + '/' + Lr.length;
        });
      });
      majG.forEach(g => g()); majC();
      s1.appendChild(cpt);
    }
    z.appendChild(s1);
    // dictée courte
    const s2 = el('div', 'ort-sect');
    s2.appendChild(el('h4', '', 'Dictée courte'));
    const re = cle => v => { changer(cle, v); contenuReglages(z); };
    s2.appendChild(ligne('Type', segment([['texte', 'Texte à corriger'], ['audio', 'Dictée audio']], S.type, re('type'), false, 'Type')));
    const tx = S.type !== 'texte';
    s2.appendChild(ligne('Les fautes', segment([['reperees', 'Déjà repérées'], ['arep', 'À repérer']], S.rep, re('rep'), tx || S.corr === 'fin', 'Les fautes')));
    s2.appendChild(ligne('Pour corriger', segment([['qcm', 'Choix multiples'], ['saisie', 'J’écris le mot'], ['fin', 'J’écris la fin du mot']], S.corr, re('corr'), tx, 'Pour corriger')));
    s2.appendChild(ligne('Longueur', segment([['tc', 'Très courte'], ['c', 'Courte']], S.longueur, re('longueur'), false, 'Longueur')));
    if (tx) s2.appendChild(el('p', 'ort-petit', '« Les fautes » et « Pour corriger » concernent le texte à corriger.'));
    else if (S.corr === 'fin') s2.appendChild(el('p', 'ort-petit', 'Avec « J’écris la fin du mot », les mots à compléter sont déjà repérés.'));
    z.appendChild(s2);
    // façon de relire (dictée courte et dictée brevet)
    const s4 = el('div', 'ort-sect');
    s4.appendChild(el('h4', '', 'Relecture (dictée courte et dictée brevet)'));
    s4.appendChild(ligne('Ta relecture', segment([['etapes', 'En 4 passages'], ['unique', 'D’un seul coup']], S.relecture, re('relecture'), false, 'Ta relecture')));
    s4.appendChild(el('p', 'ort-petit', S.relecture === 'unique' ? 'Tu corriges toutes les fautes en une fois, avec les mêmes aides.'
      : 'Un passage par type de faute : accords, conjugaison, mots particuliers, puis le texte à l’envers.'));
    z.appendChild(s4);
    // lecture à voix haute
    const s3 = el('div', 'ort-sect');
    s3.appendChild(el('h4', '', 'Lecture à voix haute (dictée audio et dictée brevet)'));
    s3.appendChild(ligne('Vitesse', segment([[0.7, 'Lente'], [0.85, 'Normale'], [1, 'Rapide']], S.vitesse, v => { changer('vitesse', +v); contenuReglages(z); }, false, 'Vitesse')));
    s3.appendChild(ligne('Lectures par groupe', segment([[1, '1'], [2, '2'], [3, '3']], S.lectures, v => { changer('lectures', +v); contenuReglages(z); }, false, 'Lectures par groupe')));
    if (!voix.dispo()) s3.appendChild(el('p', 'ort-petit', 'La synthèse vocale n’est pas disponible dans ce navigateur.'));
    z.appendChild(s3);
    z.appendChild(el('p', 'ort-petit', ORT.noteReglages || 'Un changement de réglage démarre une nouvelle dictée.'));
  }
  function ouvrirReglages() {
    fermerSommaire();
    if (panneau) return;
    retourFocus = document.activeElement;
    voile = el('div', 'ort-voile');
    voile.addEventListener('click', fermerReglages);
    panneau = el('aside', 'ort-tiroir');
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-label', 'Réglages');
    const h = el('div', 'ort-tiroir-t', '<b>⚙ Réglages</b>');
    const f = bouton('btn-small', 'Fermer ✕', fermerReglages);
    h.appendChild(f);
    const c = el('div', 'ort-tiroir-c');
    contenuReglages(c);
    panneau.appendChild(h); panneau.appendChild(c);
    document.body.appendChild(voile); document.body.appendChild(panneau);
    document.documentElement.classList.add('ort-tiroir-ouvert');
    f.focus({ preventScroll: true });
  }
  function fermerReglages() {
    if (!panneau) return;
    panneau.remove(); voile.remove(); panneau = voile = null;
    document.documentElement.classList.remove('ort-tiroir-ouvert');
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
    if (tete && !nav.querySelector('.ort-reg')) {
      const b = bouton('som-pilule ort-reg', '<span aria-hidden="true">⚙</span>Réglages', ouvrirReglages);
      tete.insertAdjacentElement('afterend', b);
    }
    // téléphone : à droite du bandeau « où suis-je »
    const barre = nav.querySelector('.som-barre');
    if (barre && !barre.querySelector('.ort-reg-rond')) barre.appendChild(bouton('ort-reg-rond', '<span aria-hidden="true">⚙</span>', ouvrirReglages, 'Réglages'));
  }

  /* =====================================================================
     Suivi : occasions de faute par règle, notes
     ===================================================================== */
  const CLE_SUIVI = 'orthographe-suivi';
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
  // occasions : [{ r, ok }] ; note sur 20 (ou null) ; type 'c' (dictée courte) ou 'b' (brevet)
  function enregistrer(occasions, note, type) {
    suivi = lireSuivi();
    const t0 = Date.now();
    occasions.forEach((o, i) => {
      if (!R[o.r]) return;
      const l = suivi.r[o.r] = suivi.r[o.r] || [];
      l.push([t0 + i, Math.round(o.ok * 2) / 2]);
      if (l.length > 30) l.splice(0, l.length - 30);
    });
    if (note != null) { suivi.notes.push([t0, type, note]); if (suivi.notes.length > 100) suivi.notes.splice(0, suivi.notes.length - 100); }
    ecrire(CLE_SUIVI, suivi);
  }
  // les 20 dernières occasions d'une règle
  function stats(id) {
    const l = (suivi.r[id] || []).slice(-20);
    const ok = l.reduce((a, x) => a + x[1], 0);
    return { n: l.length, taux: l.length ? ok / l.length : null, der: l.length ? l[l.length - 1][0] : 0 };
  }
  // maîtrisée : 80 % de réussite sur les 20 dernières occasions (au moins 5 occasions)
  function statut(id, memo) {
    memo = memo || {};
    if (memo[id]) return memo[id];
    const s = stats(id);
    let st;
    if (s.n) st = s.taux >= 0.8 && s.n >= 5 ? 'm' : s.taux >= 0.5 ? 'f' : 't';
    else st = prerequisOk(id, memo) ? 'n' : 'v';
    memo[id] = st;
    return st;
  }
  function prerequisOk(id, memo) { return R[id].prerequis.every(p => statut(p, memo) === 'm'); }
  const taux = id => stats(id).taux;
  // 3 règles prioritaires : à travailler ou fragiles (moins de 80 % de réussite), prérequis maîtrisés ;
  // niveau, puis à travailler avant fragile, puis fréquence au brevet
  function priorites() {
    const memo = {};
    return D.regles.filter(r => { const s = statut(r.id, memo); return (s === 't' || (s === 'f' && taux(r.id) < 0.8)) && prerequisOk(r.id, memo); })
      .sort((a, b) => (a.niveau - b.niveau) || ((statut(a.id, memo) === 't' ? 0 : 1) - (statut(b.id, memo) === 't' ? 0 : 1)) || (b.brevet - a.brevet))
      .slice(0, 3).map(r => r.id);
  }
  // mode automatique : règles dont les prérequis sont maîtrisés ; d'abord les règles à retravailler,
  // puis de nouvelles règles en commençant par le niveau 1, puis une règle maîtrisée à réviser (révision espacée)
  function choixAuto() {
    const memo = {};
    const cand = D.regles.filter(r => prerequisOk(r.id, memo));
    const st = r => statut(r.id, memo);
    const A = cand.filter(r => st(r) === 't' || st(r) === 'f')
      .sort((a, b) => (a.niveau - b.niveau) || ((st(a) === 't' ? 0 : 1) - (st(b) === 't' ? 0 : 1)) || (b.brevet - a.brevet));
    const B = ORT.L.melanger(cand.filter(r => st(r) === 'n')).sort((a, b) => a.niveau - b.niveau);
    const C = cand.filter(r => st(r) === 'm').sort((a, b) => stats(a.id).der - stats(b.id).der);
    const res = A.slice(0, 3);
    while (res.length < 3 && B.length) res.push(B.shift());
    if (C.length) res.push(C[0]);
    if (!res.length) return D.regles.filter(r => r.niveau === 1).map(r => r.id);
    return res.map(r => r.id);
  }
  const notes = type => suivi.notes.filter(x => !type || x[1] === type);

  /* =====================================================================
     Synthèse vocale (Web Speech API, voix française du système)
     ===================================================================== */
  const voix = (function () {
    let jeton = 0, choisie = null;
    const dispo = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    function trouver() {
      if (!dispo()) return null;
      const l = speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang));
      return l.find(v => /fr[-_]FR/i.test(v.lang) && v.localService) || l.find(v => /fr[-_]FR/i.test(v.lang)) || l[0] || null;
    }
    if (dispo() && speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', () => { choisie = trouver(); });
    function arreter() { jeton++; if (dispo()) speechSynthesis.cancel(); }
    // liste : textes (ou { t, pause }) lus l'un après l'autre ; opts : { vitesse, pause (ms), debut(i), fin(complet) }
    function dire(liste, o) {
      o = o || {};
      if (!dispo()) { if (o.fin) o.fin(false); return false; }
      arreter();
      const id = jeton, l = [].concat(liste);
      let i = 0;
      const suivant = () => {
        if (id !== jeton) return;
        if (i >= l.length) { if (o.fin) o.fin(true); return; }
        const item = l[i++], texte = typeof item === 'string' ? item : item.t;
        const u = new SpeechSynthesisUtterance(texte);
        u.lang = 'fr-FR';
        u.rate = o.vitesse || S.vitesse;
        choisie = choisie || trouver();
        if (choisie) u.voice = choisie;
        if (o.debut) o.debut(i - 1);
        let fini = false;
        const apres = () => {
          if (fini || id !== jeton) return;
          fini = true;
          const p = typeof item === 'object' && item.pause != null ? item.pause : (o.pause || 0);
          setTimeout(suivant, p);
        };
        u.onend = apres; u.onerror = apres;
        speechSynthesis.speak(u);
      };
      suivant();
      return true;
    }
    return { dispo, dire, arreter, parle: () => dispo() && speechSynthesis.speaking };
  })();

  /* ---------- Rappel d'une règle (sur chaque faute) ---------- */
  function blocRegle(id) {
    const r = R[id], b = el('div', 'ort-rappel');
    b.innerHTML = '<p class="ort-rappel-t">' + esc(r.titre) + '</p><p>' + esc(r.regle) + '</p>' +
      '<p class="ort-test"><b>Test :</b> ' + esc(r.astuce) + '</p>' +
      '<p class="ort-ex">' + r.exemples.slice(0, 2).map(marque).join('<br>') + '</p>' +
      '<a class="ort-lien-fiche" href="fiches.html#' + id + '" target="_blank" rel="noopener">Voir la fiche ↗</a>';
    return b;
  }

  /* =====================================================================
     Accueil de l'application
     ===================================================================== */
  // page d'un module (une seule par module)
  const cleDe = m => { const pt = m.parties[0]; return pt.questions || pt.entrainement || pt.cours; };
  function accueil(zone) {
    const prog = SOM.lireProg(), pages = prog.pages || {};
    const der = prog.derniere && SOM.situer(prog.derniere) ? SOM.situer(prog.derniere).m : null;
    const derniereNote = t => { const l = notes(t); return l.length ? virg(l[l.length - 1][2]) + '/20' : ''; };
    zone.innerHTML = '';
    if (der) {
      const a = el('a', 'som-reprendre', '<small>Reprendre</small><b>' + esc(der.titre) + ' →</b>');
      a.href = 'modules/' + cleDe(der) + '.html';
      zone.appendChild(a);
    }
    // ligne « Tes réglages »
    const c = el('div', 'ort-reglages-ligne');
    c.appendChild(el('span', 'ort-petit', 'Tes réglages'));
    const tags = el('div', 'ort-tags');
    const majTags = () => {
      tags.innerHTML = resumeReglages().map(t => '<span class="ort-tag">' + esc(t) + '</span>').join('');
      tags.appendChild(bouton('btn-small', '⚙ Réglages', ouvrirReglages));
    };
    majTags(); ecoutes.push(majTags);
    c.appendChild(tags); zone.appendChild(c);
    // les 4 modules en lignes dépliables (un seul déplié à la fois)
    const demande = (/^#module-(\d)$/.exec(location.hash) || [])[1];
    const ouvert = demande ? +demande : der ? der.n : 1;
    const liste = el('div', 'som-modules');
    PLAN.forEach((m, k) => {
      const cle = cleDe(m);
      const etat = k === 0 ? derniereNote('c') : k === 1 ? derniereNote('b') : (pages[cle] && pages[cle].fait ? '✓' : '');
      const d = el('div', 'som-module');
      const b = el('button', 'som-ligne', '<span class="som-badge">' + m.n + '</span><span class="som-ligne-t">' + esc(m.titre) + '<small>' + esc(m.desc) + '</small></span>' +
        '<span class="som-ligne-n">' + etat + '</span><span class="som-chev" aria-hidden="true">›</span>');
      b.type = 'button'; b.id = 'som-b' + m.n;
      b.setAttribute('aria-expanded', m.n === ouvert);
      b.setAttribute('aria-controls', 'som-m' + m.n);
      const o = el('div', 'som-ouvert');
      o.id = 'som-m' + m.n; o.setAttribute('role', 'region'); o.setAttribute('aria-labelledby', 'som-b' + m.n);
      o.hidden = m.n !== ouvert;
      const a = el('a', 'som-bt noir', k < 2 ? 'Commencer →' : 'Ouvrir →');
      a.href = 'modules/' + cle + '.html';
      const act = el('div', 'som-actions'); act.appendChild(a); o.appendChild(act);
      b.addEventListener('click', () => {
        const oui = b.getAttribute('aria-expanded') !== 'true';
        liste.querySelectorAll('.som-ligne').forEach(x => { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
        if (oui) { b.setAttribute('aria-expanded', 'true'); o.hidden = false; setTimeout(() => versVue(b), 30); }
      });
      d.appendChild(b); d.appendChild(o); liste.appendChild(d);
    });
    zone.appendChild(liste);
    if (demande) setTimeout(() => { const b = document.getElementById('som-b' + demande); if (b) b.scrollIntoView({ block: 'center' }); }, 60);
  }

  /* =====================================================================
     Mon suivi (groupé par famille)
     ===================================================================== */
  const LIBS = { m: 'Maîtrisée', f: 'Fragile', t: 'À travailler', n: 'Pas encore vue', v: 'Prérequis à acquérir' };
  const ouvertsS = {};
  // petite courbe des dernières notes
  function courbe(vals) {
    const w = 120, h = 30;
    if (vals.length < 2) return '';
    const pts = vals.map((v, i) => (3 + i * (w - 6) / (vals.length - 1)).toFixed(1) + ',' + (h - 3 - v / 20 * (h - 6)).toFixed(1)).join(' ');
    const sens = vals[vals.length - 1] > vals[0] ? 'en hausse' : vals[vals.length - 1] < vals[0] ? 'en baisse' : 'stables';
    return '<svg class="ort-courbe" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Évolution des notes : ' + sens + '"><polyline points="' + pts + '"/></svg>';
  }
  function pageSuivi(zone) {
    suivi = lireSuivi();
    const memo = {}, st = id => statut(id, memo);
    const nb = suivi.notes.length;
    const ctx = document.querySelector('#entete .er-contexte');
    if (ctx) ctx.innerHTML = nb ? 'Calculé sur tes <b>' + pluriel(nb, 'dictée') + '</b> (les 20 dernières occasions de chaque règle). Une règle se débloque quand ses prérequis sont maîtrisés.'
      : 'Fais tes premières dictées : chaque faute est rangée avec sa règle. Une règle se débloque quand ses prérequis sont maîtrisés.';
    zone.innerHTML = '';
    // priorités
    const pr = el('div', 'er-card ort-prio');
    pr.appendChild(el('h3', 'ort-h3', 'À travailler en priorité'));
    const P = priorites();
    if (P.length) {
      const ol = el('ol', 'ort-prio-l');
      P.forEach(id => ol.appendChild(el('li', '', '<b>' + esc(R[id].titre) + '</b> <span class="ort-petit">· ' + LIBS[st(id)].toLowerCase() + ' · ' + Math.round(taux(id) * 100) + ' %</span>')));
      pr.appendChild(ol);
    } else pr.appendChild(el('p', 'ort-petit', nb ? 'Aucune règle fragile pour l’instant : continue avec le mode automatique.' : 'Tes priorités apparaîtront ici après quelques dictées.'));
    const r = el('div', 'ort-rangee ort-prio-b');
    const a = el('a', 'btn-primary', P.length ? 'Dictée courte sur ces règles →' : 'Commencer une dictée courte →');
    a.href = 'dictee_courte.html' + (P.length ? '#regles=' + P.join(',') : '');
    r.appendChild(a);
    const der = suivi.notes.slice(-7).map(x => x[2]);
    if (der.length) r.appendChild(el('span', 'ort-petit ort-notes', 'Dernières notes : ' + der.slice(-3).map(virg).join(' · ') + ' /20 ' + courbe(der)));
    pr.appendChild(r);
    zone.appendChild(pr);
    // compétences par famille
    const c = el('div', 'er-card');
    const tete = el('div', 'ort-rangee ort-entre');
    tete.appendChild(el('h3', 'ort-h3', 'Mes compétences'));
    tete.appendChild(bouton('btn-small ort-imprimer', '🖨 Imprimer mon bilan', () => {
      document.querySelectorAll('.ort-grp').forEach(g => { g.classList.add('ouvert'); g.querySelector('.ort-grp-t').setAttribute('aria-expanded', 'true'); });
      window.print();
    }));
    c.appendChild(tete);
    D.familles.forEach(f => {
      const Lr = D.regles.filter(x => x.famille === f.id);
      const cpt = { m: 0, f: 0, t: 0, n: 0, v: 0 };
      Lr.forEach(x => { cpt[st(x.id)]++; });
      const g = el('div', 'ort-grp' + (ouvertsS[f.id] ? ' ouvert' : ''));
      const pile = '<span class="ort-pile" role="img" aria-label="' + ['m', 'f', 't', 'n', 'v'].filter(s => cpt[s]).map(s => cpt[s] + ' ' + LIBS[s].toLowerCase()).join(', ') + '">' +
        ['m', 'f', 't', 'n', 'v'].map(s => (cpt[s] ? '<i class="ort-s-' + s + '" style="width:' + (100 * cpt[s] / Lr.length).toFixed(1) + '%"></i>' : '')).join('') + '</span>';
      const alerte = cpt.t ? ' <span class="ort-alerte">· ' + cpt.t + ' à travailler</span>' : cpt.f ? ' <span class="ort-petit">· ' + pluriel(cpt.f, 'fragile') + '</span>' : '';
      const t = bouton('ort-grp-t', '<span><b>' + esc(NOMC[f.id]) + '</b>' + alerte + '</span>' + pile + '<span class="ort-petit ort-adroite">' + cpt.m + '/' + Lr.length + '</span><span class="ort-chev" aria-hidden="true">▾</span>', () => {
        ouvertsS[f.id] = !ouvertsS[f.id];
        g.classList.toggle('ouvert', ouvertsS[f.id]);
        t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
      });
      t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
      g.appendChild(t);
      const cc = el('div', 'ort-grp-c');
      Lr.slice().sort((x, y) => 'tfmnv'.indexOf(st(x.id)) - 'tfmnv'.indexOf(st(y.id))).forEach(x => {
        const s = st(x.id);
        const l = el('div', 'ort-ligne-r' + (s === 'v' ? ' ort-plus-tard' : ''), '<span class="ort-puce ort-s-' + s + '" aria-hidden="true"></span><span>' + esc(x.titre) +
          ' <span class="ort-sr">(' + LIBS[s].toLowerCase() + ')</span></span><span class="ort-pct">' + (s === 'v' ? 'plus tard' : s === 'n' ? 'pas encore vue'
          : Math.round(taux(x.id) * 100) + ' % <small>(' + pluriel(stats(x.id).n, 'occasion') + ')</small>') + '</span>');
        if (s === 'v') l.title = 'D’abord : ' + x.prerequis.filter(p => st(p) !== 'm').map(p => R[p].titre).join(' ; ');
        cc.appendChild(l);
      });
      g.appendChild(cc);
      c.appendChild(g);
    });
    c.appendChild(el('div', 'ort-legende', ['m', 'f', 't', 'n', 'v'].map(s => '<span><span class="ort-puce ort-s-' + s + '" aria-hidden="true"></span>' + LIBS[s] + '</span>').join('')));
    c.appendChild(el('p', 'ort-petit', 'Maîtrisée : au moins 80 % de réussite sur les 20 dernières occasions (5 occasions au moins). Une règle n’est proposée en mode automatique que si ses prérequis sont maîtrisés.'));
    zone.appendChild(c);
    SOM.marquer({ fait: true });
    // Firefox, page ouverte depuis l'ordinateur (file://) : chaque page garde ses données pour elle seule
    if (!nb && location.protocol === 'file:' && /Firefox\//.test(navigator.userAgent)) {
      zone.insertBefore(el('div', 'callout ort-msg', 'Tes dictées n’apparaissent pas ici ? Avec Firefox, une page ouverte depuis l’ordinateur garde ses données pour elle seule : ton suivi ne peut pas passer d’une page à l’autre. Ouvre l’application avec Chrome ou Edge, ou depuis son adresse en ligne.'), zone.firstChild);
    }
    // affichage toujours à jour : page revenue par « Précédent » (cache du navigateur), ou suivi changé dans un autre onglet
    if (!pageSuivi.ecoute) {
      pageSuivi.ecoute = true;
      const maj = () => { menu('suivi'); pageSuivi(zone); };
      addEventListener('pageshow', e => { if (e.persisted) maj(); });
      addEventListener('storage', e => { if (e.key === CLE_SUIVI || e.key === null) maj(); });
    }
  }

  /* =====================================================================
     Fiches de règles (pastilles des familles, règles en lignes dépliables)
     ===================================================================== */
  function pageFiches(zone) {
    const FI = { choix: 'GN', regle: null, plus: {} };
    const trier = l => l.slice().sort((a, b) => a.niveau - b.niveau);
    // adresse fiches.html#HO (famille) ou #HO9 (règle ouverte)
    function lireAncre() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (R[h]) { FI.choix = R[h].famille; FI.regle = h; if (!R[h].essentielle) FI.plus[R[h].famille] = true; }
      else if (D.familles.some(f => f.id === h)) { FI.choix = h; FI.regle = null; }
    }
    function ligneRegle(r) {
      const d = el('div', 'ort-fr' + (FI.regle === r.id ? ' ouvert' : ''));
      d.id = r.id;
      const t = bouton('ort-fr-t', '<span>' + esc(r.titre) + '</span><span class="ort-chev" aria-hidden="true">▾</span>', () => {
        FI.regle = FI.regle === r.id ? null : r.id;
        dessiner();
        if (FI.regle) versVue(document.getElementById(r.id));
      });
      t.setAttribute('aria-expanded', FI.regle === r.id);
      d.appendChild(t);
      if (FI.regle === r.id) {
        d.appendChild(el('div', 'ort-fr-c', '<p>' + esc(r.regle) + '</p><div class="cle"><b class="cle-titre">Test :</b> ' + esc(r.astuce) + '</div>' +
          '<p class="ort-ex">' + r.exemples.slice(0, 2).map(marque).join('<br>') + '</p>'));
      }
      return d;
    }
    function dessiner() {
      zone.innerHTML = '';
      const ch = el('div', 'ort-chips');
      ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Familles de règles');
      D.familles.forEach(f => {
        const b = bouton('', esc(NOMC[f.id]), () => { FI.choix = f.id; FI.regle = null; history.replaceState(null, '', '#' + f.id); dessiner(); });
        b.setAttribute('aria-pressed', f.id === FI.choix);
        ch.appendChild(b);
      });
      zone.appendChild(ch);
      const f = D.familles.find(x => x.id === FI.choix);
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'ort-h3', esc(f.nom)));
      c.appendChild(el('p', 'ort-intro', esc(f.desc) + ' Se vérifie au passage ' + f.passage + ' de la relecture (' + PASSAGES[f.passage] + ').'));
      const Lr = D.regles.filter(r => r.famille === f.id);
      const ess = trier(Lr.filter(r => r.essentielle)), plus = trier(Lr.filter(r => !r.essentielle));
      const g = el('div', 'ort-liste-r');
      ess.forEach(r => g.appendChild(ligneRegle(r)));
      c.appendChild(g);
      if (plus.length) {
        const b = bouton('ort-plus', (FI.plus[f.id] ? '▴ ' : '▾ ') + 'Pour aller plus loin (' + plus.length + ')', () => { FI.plus[f.id] = !FI.plus[f.id]; dessiner(); });
        b.setAttribute('aria-expanded', !!FI.plus[f.id]);
        c.appendChild(b);
        if (FI.plus[f.id]) { const g2 = el('div', 'ort-liste-r'); plus.forEach(r => g2.appendChild(ligneRegle(r))); c.appendChild(g2); }
      }
      zone.appendChild(c);
    }
    lireAncre();
    dessiner();
    if (FI.regle) setTimeout(() => versVue(document.getElementById(FI.regle), 'center'), 60);
    addEventListener('hashchange', () => { lireAncre(); dessiner(); if (FI.regle) versVue(document.getElementById(FI.regle), 'center'); });
    SOM.marquer({ fait: true });
  }

  Object.assign(ORT, {
    PLAN, R, NOMC, PASSAGES, el, bouton, esc, marque, virg, pluriel, versVue,
    menu, reglages: () => S, regler: changer, ouvrirReglages, fermerReglages, surReglages: fn => ecoutes.push(fn), resumeReglages, notionsChoisies,
    enregistrer, statut: id => statut(id), taux, stats, priorites, choixAuto, notes, voix, blocRegle,
    accueil, pageSuivi, pageFiches
  });
})();
