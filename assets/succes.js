/* ============================================================
   Succès (comme dans les jeux vidéo) — moteur commun à toutes les applications (objet SUC)
   ------------------------------------------------------------
   Rôle :
     - chaque succès a 4 niveaux : bronze, argent, or, platine, chacun avec son seuil ;
       un niveau obtenu est gardé pour toujours (date d'obtention enregistrée) ;
     - l'application déclare ses succès (catégories) et la façon de calculer
       la valeur de chacun à partir de l'état (compteurs, jours, ensembles) ;
     - carte « Mes succès » (page de suivi) : compteur des médailles, succès
       tout près du niveau suivant, une ligne dépliable par catégorie ; pour
       chaque succès, sa condition, sa progression vers le niveau suivant et
       l'échelle des 4 niveaux avec leurs seuils ;
     - bloc « Nouveaux succès » (fin de séance…).
   Styles : assets/succes.css (classes suc-), couleurs des médailles dans
   assets/theme.css (--med-bronze, --med-argent, --med-or, --med-platine).

   Stockage (localStorage, toujours dans un try/catch) :
     <app>-succes  { v: 1,
                     c: { <compteur>: entier },            compteurs et records
                     j: ['AAAA-MM-JJ', …],                 jours d'activité (jours civils locaux)
                     e: { <ensemble>: [id, …] },           ensembles (ex. compétences maîtrisées une fois)
                     o: { <succès>: [t1, t2, t3, t4] } }   date (ms) d'obtention de chaque niveau, 0 sinon
   Fusion d'une copie (assets/progression.js, sauvegarde.js des applications mobiles) :
   compteurs : le plus grand ; jours et ensembles : réunion ; niveaux : obtenus d'un côté
   ou de l'autre (date la plus ancienne).

   Déclaration (une fois par page, après le moteur de l'application) :
     SUC.init({
       app: 'mon-app',                                     préfixe de la clé de stockage
       depart: () => ({ c, j, e }),                        état de départ si la clé n'existe pas (calcul
                                                           rétroactif d'après le suivi déjà enregistré), facultatif
       categories: [{ nom: 'Régularité', succes: [{
         id: 'regulier', ic: '🔥', nom: 'Régulier',
         cond: 'Jours d’affilée avec au moins une séance terminée',
         seuils: [3, 7, 14, 30] ou fonction (E) => [4 seuils croissants],
         u: 'j',                                           unité courte de l'échelle (facultatif)
         val: E => nombre,                                 valeur qui fixe le niveau obtenu
         avance: E => nombre,                              valeur de la barre de progression (facultatif : val)
         astuce: E => 'texte'                              conseil sous le succès (facultatif)
       }, …] }, …]
     });
   E (état passé aux fonctions) : { c, j, e, o } ; SUC.serie(E.j) donne la série de jours.

   API :
     SUC.init(cfg)
     SUC.etat()                     copie de l'état enregistré
     SUC.ajouter(cle, n)            compteur + n (1 par défaut)
     SUC.record(cle, n)             compteur = max(compteur, n)
     SUC.fixer(cle, n)              compteur = n
     SUC.jour()                     ajoute aujourd'hui aux jours d'activité
     SUC.reunir(nom, ids)           ajoute des identifiants à un ensemble
     SUC.verifier()                 enregistre les niveaux atteints ; renvoie les nouveaux [{ s, niv }]
     SUC.carte()                    carte « Mes succès » (élément, id="succes")
     SUC.blocNouveaux(liste, href)  bloc « Nouveaux succès » (élément) ou null si la liste est vide
     SUC.serie(jours)               { encours, record, aujourdhui } : jours d'affilée
     SUC.jourDe(t)                  'AAAA-MM-JJ' (jour civil local) d'une date en ms
     SUC.NIVEAUX                    [['b', 'Bronze'], ['a', 'Argent'], ['o', 'Or'], ['p', 'Platine']]
   ============================================================ */
(function () {
  'use strict';
  const NIVEAUX = [['b', 'Bronze'], ['a', 'Argent'], ['o', 'Or'], ['p', 'Platine']];
  const MAX_JOURS = 1000;
  let cfg = null, cle = null;
  const ouverts = {};                               // catégories dépliées (carte « Mes succès »)

  /* ---------- Petits outils ---------- */
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const deux = n => (n < 10 ? '0' : '') + n;
  // jour civil local (jamais toISOString, en UTC)
  const jourDe = t => { const d = new Date(t); return d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()); };
  // jour précédent d'un jour 'AAAA-MM-JJ' (midi : pas d'ennui avec le changement d'heure)
  const veille = j => { const d = new Date(+j.slice(0, 4), +j.slice(5, 7) - 1, +j.slice(8, 10), 12); d.setDate(d.getDate() - 1); return jourDe(d.getTime()); };
  const tous = () => cfg ? cfg.categories.reduce((l, c) => l.concat(c.succes), []) : [];
  const seuilsDe = (s, E) => (typeof s.seuils === 'function' ? s.seuils(E) : s.seuils);
  const nombre = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* ---------- Stockage ---------- */
  function vide() { return { v: 1, c: {}, j: [], e: {}, o: {} }; }
  // état enregistré, remis en forme (une valeur abîmée est ignorée)
  function lire() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(cle)); } catch (e) { v = null; }
    const s = vide();
    if (!v || typeof v !== 'object') {
      // première fois : état de départ calculé par l'application (suivi déjà enregistré)
      if (cfg && typeof cfg.depart === 'function') {
        let d = null;
        try { d = cfg.depart(); } catch (e) { d = null; }
        if (d) { Object.assign(s.c, d.c || {}); s.j = (d.j || []).slice(); Object.assign(s.e, d.e || {}); }
        s.j = Array.from(new Set(s.j)).sort();
      }
      return s;
    }
    if (v.c && typeof v.c === 'object') Object.keys(v.c).forEach(k => { if (typeof v.c[k] === 'number' && isFinite(v.c[k])) s.c[k] = v.c[k]; });
    if (Array.isArray(v.j)) s.j = v.j.filter(x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x));
    if (v.e && typeof v.e === 'object') Object.keys(v.e).forEach(k => { if (Array.isArray(v.e[k])) s.e[k] = v.e[k].filter(x => typeof x === 'string'); });
    if (v.o && typeof v.o === 'object') Object.keys(v.o).forEach(k => { if (Array.isArray(v.o[k]) && v.o[k].length === 4) s.o[k] = v.o[k].map(x => (typeof x === 'number' && x > 0 ? x : 0)); });
    return s;
  }
  function ecrire(s) { try { localStorage.setItem(cle, JSON.stringify(s)); } catch (e) { /* stockage indisponible : on continue sans */ } }
  // lit, modifie, écrit (toujours relu : plusieurs onglets possibles)
  function modifier(fn) { if (!cfg) return; const s = lire(); fn(s); ecrire(s); }

  /* ---------- Compteurs, jours, ensembles ---------- */
  const ajouter = (k, n) => modifier(s => { s.c[k] = (s.c[k] || 0) + (n == null ? 1 : n); });
  const record = (k, n) => modifier(s => { if (!(s.c[k] >= n)) s.c[k] = n; });
  const fixer = (k, n) => modifier(s => { s.c[k] = n; });
  const jour = () => modifier(s => {
    const a = jourDe(Date.now());
    if (s.j.indexOf(a) < 0) { s.j.push(a); s.j.sort(); if (s.j.length > MAX_JOURS) s.j.splice(0, s.j.length - MAX_JOURS); }
  });
  const reunir = (nom, ids) => modifier(s => {
    const l = s.e[nom] = s.e[nom] || [];
    ids.forEach(id => { if (l.indexOf(id) < 0) l.push(id); });
  });

  // jours d'affilée : série en cours (jusqu'à aujourd'hui ou hier), record, activité aujourd'hui
  function serie(jours) {
    const l = Array.from(new Set(jours || [])).sort();
    let record = 0, n = 0, prec = null;
    l.forEach(j => { n = prec && veille(j) === prec ? n + 1 : 1; prec = j; if (n > record) record = n; });
    const auj = jourDe(Date.now()), hier = veille(auj);
    const dernier = l[l.length - 1];
    return { encours: dernier === auj || dernier === hier ? n : 0, record, aujourdhui: dernier === auj };
  }

  /* ---------- Niveaux ---------- */
  // niveau atteint par la valeur (0 : aucun, 1 bronze … 4 platine)
  const niveauVal = (s, E) => { const v = s.val(E); return seuilsDe(s, E).filter(x => v >= x).length; };
  // niveau obtenu (gardé pour toujours) : le plus haut niveau enregistré
  const niveauObtenu = (s, E) => { const o = E.o[s.id] || [0, 0, 0, 0]; let n = 0; o.forEach((t, i) => { if (t) n = i + 1; }); return n; };
  // enregistre les niveaux atteints ; renvoie les nouveaux [{ s, niv }]
  function verifier() {
    if (!cfg) return [];
    const E = lire(), nouveaux = [], t = Date.now();
    tous().forEach(s => {
      const n = niveauVal(s, E), o = E.o[s.id] = E.o[s.id] || [0, 0, 0, 0];
      for (let i = 0; i < n; i++) if (!o[i]) { o[i] = t; nouveaux.push({ s, niv: i + 1 }); }
      if (!o.some(x => x)) delete E.o[s.id];
    });
    ecrire(E);
    // un seul message par succès : son plus haut nouveau niveau
    const r = [];
    nouveaux.forEach(x => { const i = r.findIndex(y => y.s === x.s); if (i < 0) r.push(x); else if (x.niv > r[i].niv) r[i] = x; });
    return r;
  }

  /* ---------- Affichage ---------- */
  // médaille : disque à la couleur du niveau, pictogramme au centre
  const medaille = (ic, n, cls) => '<span class="suc-med ' + (n ? NIVEAUX[n - 1][0] : 'sans') + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + (ic ? '<span>' + ic + '</span>' : '') + '</span>';
  const barre = r => '<span class="progress-bar suc-barre"><span class="progress-fill" style="width:' + Math.min(100, Math.max(0, 100 * r)).toFixed(1) + '%"></span></span>';

  // une ligne de succès : médaille, nom et niveau, condition, progression, échelle des 4 niveaux, conseil
  function ligne(s, E) {
    const n = niveauObtenu(s, E), S = seuilsDe(s, E), v = s.val(E);
    const av = typeof s.avance === 'function' ? s.avance(E) : v;
    const d = el('div', 'suc-s');
    let h = medaille(s.ic, n) + '<div class="suc-corps"><p class="suc-nom"><b>' + s.nom + '</b> <span class="suc-niv ' + (n ? NIVEAUX[n - 1][0] : '') + '">' + (n ? NIVEAUX[n - 1][1] : 'À débloquer') + '</span></p>' +
      '<p class="suc-cond">' + s.cond + '</p>';
    if (n < 4) {
      const cible = S[n];
      h += '<p class="suc-prog">' + barre(av / cible) + '<span><b>' + nombre(Math.min(av, cible)) + '/' + nombre(cible) + '</b> → ' + NIVEAUX[n][1] + '</span></p>';
    } else h += '<p class="suc-prog"><span><b>' + nombre(v) + '</b> · niveau maximal atteint ✓</span></p>';
    h += '</div><div class="suc-echelle" role="list" aria-label="Les 4 niveaux">' + S.map((x, i) => '<span role="listitem" class="' + NIVEAUX[i][0] + (i < n ? ' ok' : i === n ? ' vise' : '') + '"><b>' + NIVEAUX[i][1] +
      (i < n ? ' ✓' : '') + '</b>' + nombre(x) + (s.u ? ' ' + s.u : '') + (i < n ? '<span class="suc-sr"> (obtenu)</span>' : i === n ? '<span class="suc-sr"> (prochain niveau)</span>' : '') + '</span>').join('') + '</div>';
    const a = typeof s.astuce === 'function' ? s.astuce(E) : '';
    if (a) h += '<p class="suc-astuce">' + a + '</p>';
    d.innerHTML = h;
    return d;
  }

  // carte « Mes succès »
  function carte() {
    const c = el('div', 'er-card suc-carte');
    c.id = 'succes';
    if (!cfg) return c;
    const E = lire(), L = tous();
    const niv = s => niveauObtenu(s, E);
    const paliers = L.reduce((a, s) => a + niv(s), 0);
    const cpt = [0, 0, 0, 0];
    L.forEach(s => { if (niv(s)) cpt[niv(s) - 1]++; });
    c.innerHTML = '<div class="suc-tete"><h3 class="suc-h3">Mes succès</h3><span class="suc-tag">' + paliers + ' palier' + (paliers > 1 ? 's' : '') + ' sur ' + 4 * L.length + '</span></div>' +
      '<p class="suc-petit">Chaque succès a 4 niveaux : bronze, argent, or, platine. Un niveau obtenu est gardé pour toujours.</p>' +
      '<div class="suc-tableau" role="list" aria-label="Mes médailles">' + NIVEAUX.map((x, i) => '<div role="listitem">' + medaille('', i + 1) + '<b>' + cpt[i] + '</b>' + x[1] + '</div>').join('') + '</div>';
    // les 3 succès les plus près de leur niveau suivant
    const proches = L.filter(s => niv(s) < 4).map(s => {
      const cible = seuilsDe(s, E)[niv(s)], av = typeof s.avance === 'function' ? s.avance(E) : s.val(E);
      return { s, cible, av, r: av / cible };
    }).filter(x => x.r > 0 && x.r < 1).sort((a, b) => b.r - a.r).slice(0, 3);
    if (proches.length) {
      c.appendChild(el('p', 'suc-sous', 'Tout près du niveau suivant'));
      const ul = el('ul', 'suc-proches');
      proches.forEach(x => ul.appendChild(el('li', '', medaille(x.s.ic, niv(x.s), 'petit') + '<span><b>' + x.s.nom + '</b> <span class="suc-petit">· ' + nombre(x.av) + '/' + nombre(x.cible) + ' → ' + NIVEAUX[niv(x.s)][1] + '</span>' + barre(x.r) + '</span>')));
      c.appendChild(ul);
    }
    // une ligne dépliable par catégorie
    cfg.categories.forEach((cat, k) => {
      const g = el('div', 'suc-grp' + (ouverts[cat.nom] ? ' ouvert' : ''));
      const nb = cat.succes.reduce((a, s) => a + niv(s), 0);
      const t = el('button', 'suc-grp-t', '<span><b>' + cat.nom + '</b> <span class="suc-petit">· ' + nb + '/' + 4 * cat.succes.length + '</span></span><span class="suc-mini" aria-hidden="true">' +
        cat.succes.map(s => medaille('', niv(s))).join('') + '</span><span class="suc-chev" aria-hidden="true">▾</span>');
      t.type = 'button';
      const idc = 'suc-cat-' + k;
      t.setAttribute('aria-controls', idc);
      t.setAttribute('aria-expanded', !!ouverts[cat.nom]);
      t.addEventListener('click', () => {
        ouverts[cat.nom] = !ouverts[cat.nom];
        g.classList.toggle('ouvert', ouverts[cat.nom]);
        t.setAttribute('aria-expanded', ouverts[cat.nom]);
      });
      g.appendChild(t);
      const z = el('div', 'suc-grp-c');
      z.id = idc;
      cat.succes.forEach(s => z.appendChild(ligne(s, E)));
      g.appendChild(z);
      c.appendChild(g);
    });
    return c;
  }

  // bloc « Nouveaux succès » : niveau obtenu, seuil atteint et niveau suivant
  function blocNouveaux(liste, href) {
    if (!cfg || !liste || !liste.length) return null;
    const E = lire();
    const b = el('div', 'suc-nouveaux');
    b.setAttribute('role', 'status');
    let h = '<p class="suc-nouveaux-t">🏆 ' + (liste.length > 1 ? 'Nouveaux succès' : 'Nouveau succès') + '</p><ul>';
    liste.forEach(x => {
      const S = seuilsDe(x.s, E);
      h += '<li>' + medaille(x.s.ic, x.niv) + '<span><b>' + x.s.nom + ' · ' + NIVEAUX[x.niv - 1][1] + '</b><br><span class="suc-petit">' + x.s.cond + ' : ' + nombre(S[x.niv - 1]) + '. ' +
        (x.niv < 4 ? 'Prochain niveau : ' + nombre(S[x.niv]) + ' (' + NIVEAUX[x.niv][1] + ').' : 'Niveau maximal !') + '</span></span></li>';
    });
    b.innerHTML = h + '</ul>';
    if (href) {
      const a = el('a', 'btn-secondary', 'Voir mes succès →');
      a.href = href;
      const r = el('div', 'er-actions');
      r.appendChild(a);
      b.appendChild(r);
    }
    return b;
  }

  function init(c) { cfg = c; cle = c.app + '-succes'; }

  window.SUC = { init, etat: lire, ajouter, record, fixer, jour, reunir, verifier, carte, blocNouveaux, serie, jourDe, NIVEAUX };
})();
