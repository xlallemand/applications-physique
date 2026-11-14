/* ============================================================
   Fractions — moteur commun de l'application (objet FRA)
   ------------------------------------------------------------
   Rôle :
     - PLAN de l'application et navigation commune (assets/sommaire.js),
       bouton « ⚙ Réglages » ajouté au sommaire et au bandeau du téléphone ;
     - réglages de l'élève (panneau latéral), gardés dans le navigateur ;
     - suivi : chaque question enregistrée avec sa compétence, historique
       des notes, statut de chaque compétence, priorités et choix
       automatique et progressif des compétences d'une séance ;
     - rappel d'une compétence ; accueil ; pages « Mon suivi » et « Fiches ».
   Dépend de : assets/sommaire.js (SOM), expr.js (FRA.X), competences.js (FRA.C),
   sauvegarde.js (facultatif : carte « Ta sauvegarde », rappel après chaque séance notée, installation).

   Stockage (localStorage, toujours dans un try/catch) :
     fractions-college-progression  (SOM) { derniere, pages: { <page>: { fait, note } } }
     fractions-college-reglages     { auto, comps: { <id>: true }, nombres, pave }
     fractions-college-suivi        { v: 1, r: { <id>: [[t, ok], …] }, notes: [[t, 's', note], …] }
                                    t : date en ms (unique), ok : 1 juste du premier coup, 0,5 juste après erreur, 0 solution affichée
     (fusion fine dans assets/progression.js, type « suivi-competences »)

   API :
     FRA.menu(cle)                   sommaire (SOM.menu) + bouton Réglages
     FRA.reglages() ; FRA.regler(cle, val) ; FRA.ouvrirReglages() ; FRA.surReglages(fn) ; FRA.resumeReglages()
     FRA.enregistrer(occ, note)      occasions [{ r, ok }] et note sur 20 (ou null)
     FRA.statut(id) 'm' maîtrisée | 'e' en bonne voie (réussie, pas encore assez de questions) | 'f' fragile | 't' à travailler
                    | 'n' pas encore vue | 'v' prérequis à acquérir
     FRA.taux(id) ; FRA.stats(id) ; FRA.priorites() ; FRA.planSeance(ids) ; FRA.niveauDe(id) ; FRA.notes()
     FRA.blocRappel(id)              rappel de la compétence (élément), lien vers la fiche
     FRA.accueil(zone) ; FRA.pageSuivi(zone) ; FRA.pageFiches(zone)
     FRA.el, FRA.bouton, FRA.esc, FRA.virg, FRA.pluriel, FRA.versVue, FRA.confettis
   ============================================================ */
(function () {
  'use strict';
  const FRA = window.FRA = window.FRA || {};
  const C = FRA.C, X = FRA.X, R = C.R;
  const NOMC = {};
  C.familles.forEach(f => { NOMC[f.id] = f.nom; });

  /* ---------- Plan de l'application (sommaire, accueil, index de recherche du portail) ---------- */
  const PLAN = [
    { n: 1, titre: 'Séance de calcul', desc: '5 questions à calculer comme sur une feuille, avec des aides.',
      parties: [{ nom: 'Séance de calcul', questions: 'seance', noms: { questions: 'Séance de 5 questions' } }] },
    { n: 2, titre: 'Mon suivi', desc: 'Les compétences que tu maîtrises et celles à travailler en priorité.',
      parties: [{ nom: 'Mon suivi', entrainement: 'suivi', noms: { entrainement: 'Mon suivi' } }] },
    { n: 3, titre: 'Fiches des compétences', desc: 'Chaque compétence expliquée : règle, méthode, exemple, piège.',
      parties: [{ nom: 'Fiches des compétences', cours: 'fiches', noms: { cours: 'Fiches des compétences' } }] }
  ];
  // sommaire sans coches (le suivi des compétences suffit), modules d'une seule page en liens directs
  SOM.init({ nom: 'Fractions', id: 'fractions-college', coches: false, liensDirects: true, plan: PLAN });

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
  // confettis (séance sans faute)
  function confettis() {
    if (reduit()) return;
    const col = ['#c2570c', '#16a34a', '#2952c8', '#5a3fc4', '#e8b400'];
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
  const CLE_REG = 'fractions-college-reglages';
  // nombres : 'prog' (progressif, d'après le suivi), 'simples', 'grands' ; pave : 'oui' | 'non' (ordinateur avec clavier)
  const S = { auto: true, comps: {}, nombres: 'prog', pave: 'oui' };
  C.liste.forEach(c => { if (c.niveau === 1) S.comps[c.id] = true; });
  (function charger() {
    const v = lire(CLE_REG);
    if (!v || typeof v !== 'object') return;
    if (typeof v.auto === 'boolean') S.auto = v.auto;
    if (v.comps && typeof v.comps === 'object') { S.comps = {}; Object.keys(v.comps).forEach(k => { if (R[k] && v.comps[k] === true) S.comps[k] = true; }); }
    if (['prog', 'simples', 'grands'].indexOf(v.nombres) >= 0) S.nombres = v.nombres;
    if (['oui', 'non'].indexOf(v.pave) >= 0) S.pave = v.pave;
  })();
  const ecoutes = [];
  function changer(cle, val) {
    S[cle] = val;
    ecrire(CLE_REG, S);
    ecoutes.forEach(fn => fn(cle));
  }
  const compsChoisies = () => C.liste.filter(c => S.comps[c.id]).map(c => c.id);
  function resumeReglages() {
    const t = [S.auto ? 'Compétences : automatique' : 'Compétences : ' + pluriel(compsChoisies().length, 'choisie')];
    t.push({ prog: 'nombres : progressifs', simples: 'nombres simples', grands: 'nombres plus grands' }[S.nombres]);
    if (S.pave === 'non') t.push('pavé masqué sur ordinateur');
    return t;
  }

  /* ---------- Panneau des réglages ---------- */
  let panneau = null, voile = null, retourFocus = null;
  const ouvertsF = {};
  // groupe de boutons à choix unique (aria-pressed)
  function segment(choix, val, fn, label) {
    const s = el('div', 'fra-seg');
    s.setAttribute('role', 'group');
    if (label) s.setAttribute('aria-label', label);
    choix.forEach(c => {
      const b = bouton('', esc(c[1]), () => fn(c[0]));
      b.setAttribute('aria-pressed', String(c[0]) === String(val));
      s.appendChild(b);
    });
    return s;
  }
  function ligne(lib, contenu) { const l = el('div', 'fra-lig'); l.appendChild(el('span', '', esc(lib))); l.appendChild(contenu); return l; }
  function contenuReglages(z) {
    z.innerHTML = '';
    // ce que l'élève travaille
    const s1 = el('div', 'fra-sect');
    s1.appendChild(el('h4', '', 'Ce que tu travailles'));
    s1.appendChild(segment([[1, 'Automatique (conseillé)'], [0, 'Je choisis']], S.auto ? 1 : 0, v => { changer('auto', !!+v); contenuReglages(z); }, 'Choix des compétences'));
    if (S.auto) s1.appendChild(el('p', 'fra-petit', 'L’application choisit d’après ton suivi : d’abord les compétences de base, puis les suivantes quand leurs prérequis sont maîtrisés. Elle revient sur ce qui te pose problème et fait réviser ce que tu sais.'));
    else {
      const cpt = el('p', 'fra-petit');
      const majC = () => { const n = compsChoisies().length; cpt.textContent = n ? n + (n > 1 ? ' compétences cochées' : ' compétence cochée') : 'Aucune compétence cochée : la séance sera choisie automatiquement.'; };
      const majG = [];
      C.familles.forEach(f => {
        const Lc = C.liste.filter(c => c.famille === f.id);
        const d = el('div', 'fra-fam');
        const t = el('div', 'fra-fam-t');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.setAttribute('aria-label', 'Toute la famille ' + f.nom);
        const n = el('span', 'fra-petit');
        const ouvrir = bouton('fra-fam-o', '<b>' + esc(f.nom) + '</b><span class="fra-chev" aria-hidden="true">▾</span>', () => {
          ouvertsF[f.id] = !ouvertsF[f.id];
          ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
          cc.hidden = !ouvertsF[f.id];
        });
        ouvrir.setAttribute('aria-expanded', !!ouvertsF[f.id]);
        t.appendChild(cb); t.appendChild(ouvrir); t.appendChild(n);
        const cc = el('div', 'fra-fam-c');
        cc.hidden = !ouvertsF[f.id];
        cb.addEventListener('change', () => {
          Lc.forEach(c => { if (cb.checked) S.comps[c.id] = true; else delete S.comps[c.id]; });
          cc.querySelectorAll('input').forEach(i => { i.checked = cb.checked; });
          changer('comps', S.comps); majC(); majG.forEach(g => g());
        });
        Lc.forEach(c => {
          const l = el('label', 'fra-cb', '<input type="checkbox"' + (S.comps[c.id] ? ' checked' : '') + '><span>' + esc(c.titre) + ' <span class="fra-niv">niv. ' + c.niveau + '</span></span>');
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
    // nombres
    const s2 = el('div', 'fra-sect');
    s2.appendChild(el('h4', '', 'Les nombres'));
    s2.appendChild(segment([['prog', 'Progressifs'], ['simples', 'Simples'], ['grands', 'Plus grands']], S.nombres, v => { changer('nombres', v); contenuReglages(z); }, 'Les nombres'));
    s2.appendChild(el('p', 'fra-petit', S.nombres === 'prog' ? 'Des nombres simples pour commencer une compétence, plus grands quand tu la réussis.'
      : S.nombres === 'simples' ? 'Toujours des petits nombres.' : 'Des nombres plus grands, et des fractions à simplifier.'));
    z.appendChild(s2);
    // pavé
    const s3 = el('div', 'fra-sect');
    s3.appendChild(el('h4', '', 'Pavé de calcul'));
    s3.appendChild(segment([['oui', 'Affiché'], ['non', 'Masqué (j’utilise le clavier)']], S.pave, v => { changer('pave', v); contenuReglages(z); }, 'Pavé de calcul'));
    s3.appendChild(el('p', 'fra-petit', 'Sur un écran tactile, le pavé est toujours affiché. ' + X.AIDE_CLAVIER));
    z.appendChild(s3);
    z.appendChild(el('p', 'fra-petit', FRA.noteReglages || 'Un changement de compétences ou de nombres s’applique à la prochaine séance.'));
  }
  function ouvrirReglages() {
    fermerSommaire();
    if (panneau) return;
    retourFocus = document.activeElement;
    voile = el('div', 'fra-voile');
    voile.addEventListener('click', fermerReglages);
    panneau = el('aside', 'fra-tiroir');
    panneau.setAttribute('role', 'dialog');
    panneau.setAttribute('aria-modal', 'true');
    panneau.setAttribute('aria-label', 'Réglages');
    const h = el('div', 'fra-tiroir-t', '<b>⚙ Réglages</b>');
    const f = bouton('btn-small', 'Fermer ✕', fermerReglages);
    h.appendChild(f);
    const c = el('div', 'fra-tiroir-c');
    contenuReglages(c);
    panneau.appendChild(h); panneau.appendChild(c);
    document.body.appendChild(voile); document.body.appendChild(panneau);
    document.documentElement.classList.add('fra-tiroir-ouvert');
    f.focus({ preventScroll: true });
  }
  function fermerReglages() {
    if (!panneau) return;
    panneau.remove(); voile.remove(); panneau = voile = null;
    document.documentElement.classList.remove('fra-tiroir-ouvert');
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
    if (tete && !nav.querySelector('.fra-reg')) tete.insertAdjacentElement('afterend', bouton('som-pilule fra-reg', '<span aria-hidden="true">⚙</span>Réglages', ouvrirReglages));
    // téléphone : à droite du bandeau « où suis-je »
    const barre = nav.querySelector('.som-barre');
    if (barre && !barre.querySelector('.fra-reg-rond')) barre.appendChild(bouton('fra-reg-rond', '<span aria-hidden="true">⚙</span>', ouvrirReglages, 'Réglages'));
  }

  /* =====================================================================
     Suivi : questions par compétence, notes
     ===================================================================== */
  const CLE_SUIVI = 'fractions-college-suivi';
  const NB_OCC = 10, MIN_OCC = 4;                 // statut calculé sur les 10 dernières questions (4 au moins pour « maîtrisée »)
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
    if (note != null && typeof FRA.apresSeance === 'function') FRA.apresSeance();
  }
  // les dernières questions d'une compétence
  function stats(id) {
    const l = (suivi.r[id] || []).slice(-NB_OCC);
    const ok = l.reduce((a, x) => a + x[1], 0);
    return { n: l.length, taux: l.length ? ok / l.length : null, der: l.length ? l[l.length - 1][0] : 0 };
  }
  // maîtrisée : 80 % de réussite sur les 10 dernières questions (4 questions au moins)
  function statut(id, memo) {
    memo = memo || {};
    if (memo[id]) return memo[id];
    const s = stats(id);
    let st;
    if (s.n) st = s.taux >= 0.8 ? (s.n >= MIN_OCC ? 'm' : 'e') : s.taux >= 0.5 ? 'f' : 't';
    else st = prerequisOk(id, memo) ? 'n' : 'v';
    memo[id] = st;
    return st;
  }
  function prerequisOk(id, memo) { return R[id].prerequis.every(p => statut(p, memo) === 'm'); }
  const taux = id => stats(id).taux;
  // 3 compétences prioritaires : à travailler ou fragiles, prérequis maîtrisés ; niveau, puis à travailler avant fragile
  function priorites() {
    const memo = {}, st = id => statut(id, memo);
    return C.liste.filter(c => (st(c.id) === 't' || st(c.id) === 'f') && prerequisOk(c.id, memo))
      .sort((a, b) => (a.niveau - b.niveau) || ((st(a.id) === 't' ? 0 : 1) - (st(b.id) === 't' ? 0 : 1)))
      .slice(0, 3).map(c => c.id);
  }
  // difficulté des nombres (1 à 3) pour une compétence, d'après les réglages et le suivi
  function niveauDe(id) {
    if (S.nombres === 'simples') return 1;
    if (S.nombres === 'grands') return 3;
    const s = stats(id);
    if (s.n < 2 || s.taux < 0.6) return 1;
    return s.taux < 0.8 || s.n < MIN_OCC ? 2 : 3;
  }
  /* Plan d'une séance de 5 questions : [{ comp, raison }]
     - ids donnés (adresse #comp=…) ou réglage « Je choisis » : ces compétences, à tour de rôle ;
     - automatique : compétences dont les prérequis sont maîtrisés. D'abord celles à retravailler,
       sinon une nouvelle compétence (la plus basse dans la progression) ; 3 ou 4 questions dessus,
       une autre compétence à travailler ou nouvelle, et une compétence maîtrisée à réviser. */
  function planSeance(ids) {
    const memo = {}, st = id => statut(id, memo);
    const choisis = ids && ids.length ? ids.filter(id => R[id]) : (!S.auto ? compsChoisies() : []);
    const plan = [];
    if (choisis.length) {
      const l = choisis.slice().sort((a, b) => R[a].niveau - R[b].niveau);
      for (let i = 0; plan.length < 5; i++) plan.push({ comp: l[i % l.length], raison: 'choisie' });
      return plan.sort((a, b) => R[a.comp].niveau - R[b.comp].niveau);
    }
    const cand = C.liste.filter(c => prerequisOk(c.id, memo));
    const rang = id => 'tfe'.indexOf(st(id));
    const A = cand.filter(c => rang(c.id) >= 0).sort((a, b) => (a.niveau - b.niveau) || (rang(a.id) - rang(b.id)));
    const B = cand.filter(c => st(c.id) === 'n').sort((a, b) => a.niveau - b.niveau);
    const M = cand.filter(c => st(c.id) === 'm').sort((a, b) => stats(a.id).der - stats(b.id).der);
    const F = [];
    A.slice(0, 2).forEach(c => F.push({ comp: c.id, raison: st(c.id) === 't' ? 'à travailler' : st(c.id) === 'f' ? 'fragile' : 'en cours' }));
    while (F.length < 2 && B.length) F.push({ comp: B.shift().id, raison: 'nouvelle' });
    if (!F.length && M.length) F.push({ comp: M.shift().id, raison: 'révision' });
    if (!F.length) F.push({ comp: C.liste[0].id, raison: 'nouvelle' });
    const rev = M.length ? { comp: M[0].id, raison: 'révision' } : null;
    const n1 = F.length > 1 ? (rev ? 3 : 3) : (rev ? 4 : 5);
    for (let i = 0; i < n1; i++) plan.push(F[0]);
    if (F.length > 1) for (let i = 0; i < (rev ? 1 : 2); i++) plan.push(F[1]);
    if (rev) plan.push(rev);
    return plan.slice(0, 5).map(p => Object.assign({}, p)).sort((a, b) => R[a.comp].niveau - R[b.comp].niveau);
  }
  const notes = () => suivi.notes.slice();

  /* ---------- Rappel d'une compétence (aide pendant une question) ---------- */
  function exempleHTML(c) {
    const e = c.exemple;
    const lignes = (e.affiche ? '<div class="fra-l-aff">' + C.texte(e.affiche) + '</div>' : '<div class="fra-l-aff">' + (e.prefixe ? '<span class="fra-pre">' + e.prefixe + '</span>' : '') + X.m(e.depart) + '</div>') +
      e.lignes.map(l => '<div class="fra-l-aff"><span class="fra-pre">=</span>' + X.m(l) + '</div>').join('');
    return '<div class="fra-ex-t">Exemple' + (e.consigne ? ' · ' + C.texte(e.consigne) : '') + '</div><div class="fra-feuille-s">' + lignes + '</div>';
  }
  function blocRappel(id) {
    const c = R[id], b = el('div', 'fra-rappel');
    b.innerHTML = '<p class="fra-rappel-t">' + esc(c.titre) + '</p><p>' + C.texte(c.regle) + '</p>' +
      '<div class="cle">' + C.texte(c.methode) + '</div>' + exempleHTML(c) +
      '<a class="fra-lien-fiche" href="fiches.html#' + id + '" target="_blank" rel="noopener">Voir la fiche ↗</a>';
    return b;
  }

  /* =====================================================================
     Accueil de l'application
     ===================================================================== */
  const cleDe = m => { const pt = m.parties[0]; return pt.questions || pt.entrainement || pt.cours; };
  function accueil(zone) {
    zone.innerHTML = '';
    // les modules : chaque ligne ouvre directement la page du module
    const liste = el('div', 'som-modules');
    PLAN.forEach(m => {
      const d = el('div', 'som-module');
      const a = el('a', 'som-ligne', '<span class="som-badge">' + m.n + '</span><span class="som-ligne-t">' + esc(m.titre) + '<small>' + esc(m.desc) + '</small></span>' +
        '<span class="som-chev" aria-hidden="true">›</span>');
      a.href = 'modules/' + cleDe(m) + '.html';
      d.appendChild(a); liste.appendChild(d);
    });
    zone.appendChild(liste);
    // zones dépliables « Ta sauvegarde » (modules/sauvegarde.js) et « Tes réglages » (en dernier), séparées des modules
    const annexes = el('div', 'fra-annexes');
    if (typeof FRA.carteSauvegarde === 'function') annexes.appendChild(FRA.carteSauvegarde());
    const c = el('div', 'fra-zone fra-reglages-ligne');
    const t = bouton('fra-zone-t', '<span class="fra-zone-nom">Tes réglages</span><span class="fra-zone-chev" aria-hidden="true">›</span>', () => {
      const oui = t.getAttribute('aria-expanded') !== 'true';
      t.setAttribute('aria-expanded', String(oui));
      cc.hidden = !oui;
    });
    t.setAttribute('aria-expanded', 'false');
    t.setAttribute('aria-controls', 'reglages-c');
    const cc = el('div', 'fra-zone-c');
    cc.id = 'reglages-c'; cc.hidden = true;
    // le bouton Réglages, puis le récapitulatif
    cc.appendChild(bouton('btn-small', '⚙ Réglages', ouvrirReglages));
    const tags = el('div', 'fra-tags');
    const majTags = () => { tags.innerHTML = resumeReglages().map(x => '<span class="fra-tag">' + esc(x) + '</span>').join(''); };
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
    return '<svg class="fra-courbe" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Évolution des notes : ' + sens + '"><polyline points="' + pts + '"/></svg>';
  }
  function pageSuivi(zone) {
    suivi = lireSuivi();
    const memo = {}, st = id => statut(id, memo);
    const nb = suivi.notes.length;
    const ctx = document.querySelector('#entete .er-contexte');
    if (ctx) ctx.innerHTML = nb ? 'Calculé sur tes <b>' + pluriel(nb, 'séance') + '</b> (les 10 dernières questions de chaque compétence). Une compétence se débloque quand ses prérequis sont maîtrisés.'
      : 'Fais tes premières séances : chaque question est rangée avec sa compétence. Une compétence se débloque quand ses prérequis sont maîtrisés.';
    zone.innerHTML = '';
    // priorités
    const pr = el('div', 'er-card fra-prio');
    pr.appendChild(el('h3', 'fra-h3', 'À travailler en priorité'));
    const P = priorites();
    if (P.length) {
      const ol = el('ol', 'fra-prio-l');
      P.forEach(id => ol.appendChild(el('li', '', '<b>' + esc(R[id].titre) + '</b> <span class="fra-petit">· ' + LIBS[st(id)].toLowerCase() + ' · ' + Math.round(taux(id) * 100) + ' %</span> <a class="fra-lien-fiche" href="fiches.html#' + id + '">fiche</a>')));
      pr.appendChild(ol);
    } else pr.appendChild(el('p', 'fra-petit', nb ? 'Aucune compétence fragile pour l’instant : continue avec le mode automatique.' : 'Tes priorités apparaîtront ici après quelques séances.'));
    const r = el('div', 'fra-rangee fra-prio-b');
    const a = el('a', 'btn-primary', P.length ? 'Séance sur ces compétences →' : 'Commencer une séance →');
    a.href = 'seance.html' + (P.length ? '#comp=' + P.join(',') : '');
    r.appendChild(a);
    const der = suivi.notes.slice(-7).map(x => x[2]);
    if (der.length) r.appendChild(el('span', 'fra-petit fra-notes', 'Dernières notes : ' + der.slice(-3).map(virg).join(' · ') + ' /20 ' + courbe(der)));
    pr.appendChild(r);
    zone.appendChild(pr);
    // compétences par famille
    const c = el('div', 'er-card');
    const tete = el('div', 'fra-rangee fra-entre');
    tete.appendChild(el('h3', 'fra-h3', 'Mes compétences'));
    c.appendChild(tete);
    const ordre = ['m', 'e', 'f', 't', 'n', 'v'];
    C.familles.forEach(f => {
      const Lc = C.liste.filter(x => x.famille === f.id);
      const cpt = { m: 0, e: 0, f: 0, t: 0, n: 0, v: 0 };
      Lc.forEach(x => { cpt[st(x.id)]++; });
      const g = el('div', 'fra-grp' + (ouvertsS[f.id] ? ' ouvert' : ''));
      const pile = '<span class="fra-pile" role="img" aria-label="' + ordre.filter(s => cpt[s]).map(s => cpt[s] + ' ' + LIBS[s].toLowerCase()).join(', ') + '">' +
        ordre.map(s => (cpt[s] ? '<i class="fra-s-' + s + '" style="width:' + (100 * cpt[s] / Lc.length).toFixed(1) + '%"></i>' : '')).join('') + '</span>';
      const alerte = cpt.t ? ' <span class="fra-alerte">· ' + cpt.t + ' à travailler</span>' : cpt.f ? ' <span class="fra-petit">· ' + pluriel(cpt.f, 'fragile') + '</span>' : '';
      const t = bouton('fra-grp-t', '<span><b>' + esc(f.nom) + '</b>' + alerte + '</span>' + pile + '<span class="fra-petit fra-adroite">' + cpt.m + '/' + Lc.length + '</span><span class="fra-chev" aria-hidden="true">▾</span>', () => {
        ouvertsS[f.id] = !ouvertsS[f.id];
        g.classList.toggle('ouvert', ouvertsS[f.id]);
        t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
      });
      t.setAttribute('aria-expanded', !!ouvertsS[f.id]);
      g.appendChild(t);
      const cc = el('div', 'fra-grp-c');
      Lc.forEach(x => {
        const s = st(x.id);
        const l = el('div', 'fra-ligne-r' + (s === 'v' ? ' fra-plus-tard' : ''), '<span class="fra-puce fra-s-' + s + '" aria-hidden="true"></span><span>' + esc(x.titre) +
          ' <span class="fra-sr">(' + LIBS[s].toLowerCase() + ')</span></span><span class="fra-pct">' + (s === 'v' ? 'plus tard' : s === 'n' ? 'pas encore vue'
          : Math.round(taux(x.id) * 100) + ' % <small>(' + pluriel(stats(x.id).n, 'question') + ')</small>') + '</span>');
        if (s === 'v') l.title = 'D’abord : ' + x.prerequis.filter(p => st(p) !== 'm').map(p => R[p].titre).join(' ; ');
        cc.appendChild(l);
      });
      g.appendChild(cc);
      c.appendChild(g);
    });
    c.appendChild(el('div', 'fra-legende', ordre.map(s => '<span><span class="fra-puce fra-s-' + s + '" aria-hidden="true"></span>' + LIBS[s] + '</span>').join('')));
    c.appendChild(el('p', 'fra-petit', 'Maîtrisée : au moins 80 % de réussite sur les 10 dernières questions (4 questions au moins ; avant, elle est « en bonne voie »). Une question compte 1 si elle est juste du premier coup, 0,5 après une erreur, 0 si tu as affiché la solution. Une compétence n’est proposée en mode automatique que si ses prérequis sont maîtrisés.'));
    zone.appendChild(c);
    SOM.marquer({ fait: true });
    // Firefox, page ouverte depuis l'ordinateur (file://) : chaque page garde ses données pour elle seule
    if (!nb && location.protocol === 'file:' && /Firefox\//.test(navigator.userAgent)) {
      zone.insertBefore(el('div', 'callout fra-msg', 'Tes séances n’apparaissent pas ici ? Avec Firefox, une page ouverte depuis l’ordinateur garde ses données pour elle seule : ton suivi ne peut pas passer d’une page à l’autre. Ouvre l’application avec Chrome ou Edge, ou depuis son adresse en ligne.'), zone.firstChild);
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
     Fiches des compétences (pastilles des familles, compétences en lignes dépliables)
     ===================================================================== */
  function pageFiches(zone) {
    const FI = { choix: C.familles[0].id, comp: null };
    // adresse fiches.html#AS (famille) ou #AS2 (compétence ouverte)
    function lireAncre() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (R[h]) { FI.choix = R[h].famille; FI.comp = h; }
      else if (C.familles.some(f => f.id === h)) { FI.choix = h; FI.comp = null; }
    }
    function ligneComp(c) {
      const d = el('div', 'fra-fr' + (FI.comp === c.id ? ' ouvert' : ''));
      d.id = c.id;
      const t = bouton('fra-fr-t', '<span>' + esc(c.titre) + ' <span class="fra-niv">niv. ' + c.niveau + '</span></span><span class="fra-chev" aria-hidden="true">▾</span>', () => {
        FI.comp = FI.comp === c.id ? null : c.id;
        dessiner();
        if (FI.comp) versVue(document.getElementById(c.id));
      });
      t.setAttribute('aria-expanded', FI.comp === c.id);
      d.appendChild(t);
      if (FI.comp === c.id) {
        const pre = c.prerequis.length ? '<p class="fra-petit">Avant : ' + c.prerequis.map(p => '<a class="fra-lien-fiche" href="#' + p + '">' + esc(R[p].titre) + '</a>').join(' · ') + '</p>' : '';
        const x = el('div', 'fra-fr-c', '<p>' + C.texte(c.regle) + '</p><div class="cle"><b class="cle-titre">Méthode.</b> ' + C.texte(c.methode) + '</div>' +
          exempleHTML(c) + '<div class="fra-piege"><b class="cle-titre">Attention.</b> ' + C.texte(c.piege) + '</div>' + pre);
        const a = el('a', 'btn-secondary fra-pt', 'M’entraîner sur cette compétence →');
        a.href = 'seance.html#comp=' + c.id;
        const r = el('div', 'fra-rangee'); r.appendChild(a); x.appendChild(r);
        d.appendChild(x);
      }
      return d;
    }
    function dessiner() {
      zone.innerHTML = '';
      const ch = el('div', 'fra-chips');
      ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Familles de compétences');
      C.familles.forEach(f => {
        const b = bouton('', esc(f.nom), () => { FI.choix = f.id; FI.comp = null; history.replaceState(null, '', '#' + f.id); dessiner(); });
        b.setAttribute('aria-pressed', f.id === FI.choix);
        ch.appendChild(b);
      });
      zone.appendChild(ch);
      const f = C.familles.find(x => x.id === FI.choix);
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'fra-h3', esc(f.nom)));
      c.appendChild(el('p', 'fra-intro', esc(f.desc)));
      const g = el('div', 'fra-liste-r');
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

  Object.assign(FRA, {
    PLAN, NOMC, LIBS, el, bouton, esc, virg, pluriel, versVue, confettis,
    menu, reglages: () => S, regler: changer, ouvrirReglages, fermerReglages, surReglages: fn => ecoutes.push(fn), resumeReglages, compsChoisies,
    enregistrer, statut: id => statut(id), taux, stats, priorites, planSeance, niveauDe, notes, blocRappel, exempleHTML,
    accueil, pageSuivi, pageFiches
  });
})();
