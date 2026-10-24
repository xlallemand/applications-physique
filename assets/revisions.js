/* ============================================================
   Révisions espacées par flashcards : moteur commun (objet REV)
   (voir docs/charte-applications.md, section « Flashcards »)

   Une carte : une question au recto, la réponse au verso. L'élève range
   les cartes d'un cours (un « paquet ») dans une boîte de révision à
   7 cases : 1, 2, 4, 7, 14, 30 et 60 jours. Sue : la carte avance d'une
   case et revient plus tard ; ratée : elle recule d'une case et revient
   plus vite. Après la 7e case, la carte est sue (sortie du planning).

   Données :
     <dossier>/modules/flashcards.js     les cartes : REV.paquets(info, paquets), chargé par une balise <script>
       info    = { dossier, titre, court, matiere, spa }   (spa : application en une seule page)
       paquets = [{ id, module, titre, apres: [clés des pages à avoir faites],
                    cartes: [{ id, type, competence, faces: [{ q, r }, { q, r }] }] }]
     localStorage <dossier>-flashcards    { ajouts: { <paquet>: date }, cartes: { <id>: { c, d, s, v, n, ok } } }
       c case (1 à 7, 8 : sue), d prochaine révision (absente si sue), s face de la prochaine révision,
       v dernière révision, n nombre de révisions, ok nombre de « Je savais »
     localStorage revisions-reglages      { parSeance: 10 | 20 | 30 | 0 (sans limite) }
   Dates : jours civils locaux, « AAAA-MM-JJ ».

   API (objet REV) :
     REV.APPLIS                       dossiers des applications qui ont des cartes (dans l'ordre du portail)
     REV.paquets(info, paquets)       déclare les cartes d'une application (fichier flashcards.js)
     REV.lier(info, paquets)          relie cartes, paquets et application sans rien enregistrer (relecture)
     REV.charger(dossier, src, fn)    charge un fichier de cartes, puis fn(app) (fn(null) en cas d'échec)
     REV.chargerTout(racine, fn)      charge les cartes de toutes les applications de REV.APPLIS
     REV.app(dossier)                 données d'une application chargée
     REV.ajouter(dossier, ids)        range des paquets dans la boîte : première révision demain
     REV.repondre(carte, ok)          réponse en séance : la carte change de case
     REV.face(carte, sens, cote, o)   HTML d'une face ('recto' ou 'verso')
     REV.boite(lignes, o), REV.jours(lignes), REV.mini(lignes)   vues de la boîte
     REV.lignes(app)                  état de chaque carte d'une application
     REV.seance(zone, o)              séance de révision ou révision libre
     REV.portail(o)                   portail : pilule « Révisions » et carte noire du jour
     REV.pageRevisions(zone)          page Révisions (revisions.html) : #reviser, #reviser-<dossier>,
                                      #libre-<dossier>, #libre-<dossier>-<paquet>[,<paquet>…]
     REV.pageApplication(zone)        page Flashcards d'une application (modules/flashcards.html, #imprimer,
                                      export vers Anki : assets/anki.js)
     REV.accueil(zone, app)           accueil de l'application : bloc, boutons des modules, ligne Flashcards
     REV.compte(app)                  « cartes ajoutées / total » (sommaire, accueil)
     REV.finCours(carte, cle)         fin d'un cours : ranger les cartes de ce cours dans la boîte
   Dans les applications, assets/sommaire.js charge ce fichier et les cartes
   (SOM.init({ …, flashcards: true })) ; SOM.contexte() donne les chemins.
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     RÉGLAGES
     ============================================================ */
  // applications qui ont des cartes : dossiers, dans l'ordre du portail
  const APPLIS = ['changements-etat'];

  const INTERVALLES = [1, 2, 4, 7, 14, 30, 60];          // jours avant la révision suivante, case 1 à 7
  const MAX = INTERVALLES.length;                         // dernière case
  const SUE = MAX + 1;                                    // « case » des cartes sues
  const COURT = ['1 j', '2 j', '4 j', '7 j', '14 j', '30 j', '60 j'];
  const LONG = ['1 jour', '2 jours', '4 jours', '1 semaine', '2 semaines', '1 mois', '2 mois'];
  const TYPES = { definition: 'Définition', formule: 'Formule', savoir: 'À savoir', schema: 'Schéma', graphique: 'Lecture graphique', methode: 'Méthode', reflexe: 'Réflexe' };
  const LIMITES = [10, 20, 30, 0];                        // cartes par séance (0 : sans limite)
  const PAR_DEFAUT = 20;
  const CLE_REGLAGES = 'revisions-reglages';
  const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  /* ============================================================
     DATES : jours civils locaux (le jour change à minuit, heure locale)
     ============================================================ */
  const deux = n => (n < 10 ? '0' : '') + n;
  const texteDate = d => d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate());
  const versDate = s => { const t = s.split('-'); return new Date(+t[0], +t[1] - 1, +t[2]); };
  const aujourdhui = () => texteDate(new Date());
  // date s plus n jours
  function plus(s, n) { const d = versDate(s); d.setDate(d.getDate() + n); return texteDate(d); }
  // nombre de jours de a à b (négatif si b est avant a)
  function ecart(a, b) {
    const x = a.split('-'), y = b.split('-');
    return Math.round((Date.UTC(+y[0], +y[1] - 1, +y[2]) - Date.UTC(+x[0], +x[1] - 1, +x[2])) / 864e5);
  }
  const jourCourt = s => { const d = versDate(s); return `${JOURS[d.getDay()]} ${deux(d.getDate())}/${deux(d.getMonth() + 1)}`; };   // « sam. 24/10 »
  const jourMois = s => jourCourt(s).slice(5);                                                                                   // « 24/10 »
  const dans = n => (n < 0 ? `en retard de ${-n} j` : n === 0 ? 'aujourd\'hui' : n === 1 ? 'demain' : `dans ${n} j`);
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const minutes = n => Math.max(1, Math.ceil(n * 30 / 60));                // 30 s par carte, arrondi à la minute supérieure
  const estDate = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const entier = (v, min, max) => typeof v === 'number' && Math.floor(v) === v && v >= min && v <= max;
  // liste en français : « a », « a et b », « a, b et c »
  const enumerer = l => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1]);
  // nom court d'une application : « Chapitre 11 », sinon son titre
  const courtDe = titre => { const m = /^(Chapitre \d+)\s*:/.exec(titre || ''); return m ? m[1] : titre; };

  /* ============================================================
     STOCKAGE (toujours dans un try/catch : sans stockage, tout
     marche pour la page en cours et un message discret le signale)
     ============================================================ */
  const MEM = {};
  let sansStockage = (function () {
    try { const k = '__essai-revisions__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return false; } catch (e) { return true; }
  })();
  function lire(cle) {
    if (Object.prototype.hasOwnProperty.call(MEM, cle)) return MEM[cle];
    try { return JSON.parse(localStorage.getItem(cle)); } catch (e) { return null; }
  }
  function ecrire(cle, v) {
    try { localStorage.setItem(cle, JSON.stringify(v)); delete MEM[cle]; } catch (e) {
      MEM[cle] = JSON.parse(JSON.stringify(v));
      sansStockage = true;
      signaler();
    }
  }
  // message discret quand le navigateur ne garde rien
  function signaler() {
    if (!sansStockage) return;
    const ici = document.querySelector('.er-page');
    if (!ici || ici.querySelector('.rev-stockage')) return;
    ici.insertAdjacentHTML('afterbegin', '<p class="rev-stockage" role="status">Ton navigateur ne garde pas tes révisions (navigation privée ou réglage) : elles seront perdues en quittant la page.</p>');
  }

  // réglage : nombre de cartes par séance
  function parSeance() { const r = lire(CLE_REGLAGES); return estObjet(r) && LIMITES.indexOf(r.parSeance) >= 0 ? r.parSeance : PAR_DEFAUT; }
  function reglerParSeance(n) { if (LIMITES.indexOf(n) >= 0) ecrire(CLE_REGLAGES, { parSeance: n }); }

  // état d'une carte lu dans le navigateur (null si sa forme est abîmée)
  function propreCarte(x) {
    if (!estObjet(x) || !entier(x.c, 1, SUE)) return null;
    const r = { c: x.c };
    if (x.c < SUE) { if (!estDate(x.d)) return null; r.d = x.d; }
    r.s = entier(x.s, 0, 1) ? x.s : 0;
    if (estDate(x.v)) r.v = x.v;
    r.n = entier(x.n, 0, 1e6) ? x.n : 0;
    r.ok = entier(x.ok, 0, r.n) ? x.ok : 0;
    return r;
  }
  // avancement d'une application : { ajouts, cartes }
  function etat(dossier) {
    const v = lire(dossier + '-flashcards'), e = { ajouts: {}, cartes: {} };
    if (!estObjet(v)) return e;
    if (estObjet(v.ajouts)) Object.keys(v.ajouts).forEach(k => { if (estDate(v.ajouts[k])) e.ajouts[k] = v.ajouts[k]; });
    if (estObjet(v.cartes)) Object.keys(v.cartes).forEach(k => { const c = propreCarte(v.cartes[k]); if (c) e.cartes[k] = c; });
    return e;
  }
  const ecrireEtat = (dossier, e) => ecrire(dossier + '-flashcards', e);
  const nouvelle = auj => ({ c: 1, d: plus(auj, 1), s: 0, n: 0, ok: 0 });   // première révision le lendemain

  // pages de l'application faites (prérequis des paquets) : progression <dossier>-progression
  function faites(dossier) {
    const p = lire(dossier + '-progression'), pages = estObjet(p) && estObjet(p.pages) ? p.pages : {};
    return cle => estObjet(pages[cle]) && (pages[cle].fait === true || typeof pages[cle].note === 'number');
  }
  // statut d'un paquet : 'ajoute' (dans la boîte), 'pret' (cours faits), 'attente'
  const statut = (p, e, fait) => (e.ajouts[p.id] ? 'ajoute' : (p.apres || []).every(fait) ? 'pret' : 'attente');

  /* ============================================================
     CARTES DES APPLICATIONS
     ============================================================ */
  const DONNEES = {};
  const attentes = {};
  // relie cartes, paquets et application (sans rien enregistrer)
  function lier(info, liste) {
    const app = { dossier: info.dossier, titre: info.titre, court: info.court || courtDe(info.titre), matiere: info.matiere, spa: !!info.spa, paquets: liste, cartes: [] };
    liste.forEach(p => { p.app = app; (p.cartes || []).forEach(c => { c.paquet = p; c.app = app; app.cartes.push(c); }); });
    return app;
  }
  // REV.paquets(info, paquets) : appelé par <dossier>/modules/flashcards.js
  function declarer(info, liste) {
    const app = lier(info, liste);
    DONNEES[app.dossier] = app;
    completer(app);
    const l = attentes[app.dossier] || [];
    delete attentes[app.dossier];
    l.forEach(f => f(app));
    return app;
  }
  // carte apparue dans un paquet déjà ajouté (nouvelle version du fichier) : ajoutée comme les autres
  function completer(app) {
    const e = etat(app.dossier), auj = aujourdhui();
    let change = false;
    app.paquets.forEach(p => {
      if (!e.ajouts[p.id]) return;
      p.cartes.forEach(c => { if (!e.cartes[c.id]) { e.cartes[c.id] = nouvelle(auj); change = true; } });
    });
    if (change) ecrireEtat(app.dossier, e);
  }
  // charge le fichier de cartes d'une application (balise <script> : fonctionne en file://)
  function charger(dossier, src, fini) {
    if (DONNEES[dossier]) { fini(DONNEES[dossier]); return; }
    (attentes[dossier] = attentes[dossier] || []).push(fini);
    if (document.querySelector('script[data-rev-cartes="' + dossier + '"]')) return;
    const s = document.createElement('script');
    s.src = src;
    s.setAttribute('data-rev-cartes', dossier);
    const echec = () => { const l = attentes[dossier] || []; delete attentes[dossier]; l.forEach(f => f(null)); };
    s.onerror = echec;
    s.onload = () => { if (!DONNEES[dossier]) echec(); };
    document.head.appendChild(s);
  }
  // charge les cartes de toutes les applications (page Révisions, à la racine : racine = '')
  function chargerTout(racine, fini) {
    let reste = APPLIS.length;
    if (!reste) { fini(); return; }
    APPLIS.forEach(d => charger(d, racine + d + '/modules/flashcards.js', () => { if (--reste === 0) fini(); }));
  }
  const appsChargees = () => APPLIS.filter(d => DONNEES[d]).map(d => DONNEES[d]);

  // état de chaque carte : { c (carte), s (état ou null), k (case : 0 pas ajoutée, 1 à 7, 8 sue),
  //                          j (jours avant la révision, négatif : en retard), du (à réviser aujourd'hui) }
  function lignes(app, e, auj) {
    e = e || etat(app.dossier); auj = auj || aujourdhui();
    return app.cartes.map(c => {
      const s = e.ajouts[c.paquet.id] ? e.cartes[c.id] || null : null;
      const k = s ? s.c : 0, j = s && k <= MAX ? ecart(auj, s.d) : null;
      return { c, s, k, j, du: j !== null && j <= 0 };
    });
  }
  const toutesLignes = () => appsChargees().reduce((l, a) => l.concat(lignes(a)), []);
  // prochaine révision après aujourd'hui : { j, n } (dans j jours, n cartes), ou null
  function prochaine(l) {
    const js = l.filter(x => x.j !== null && x.j > 0).map(x => x.j);
    if (!js.length) return null;
    const j = Math.min.apply(null, js);
    return { j, n: l.filter(x => x.j === j).length };
  }
  const datePlus = j => (j > 1 ? ' (' + jourCourt(plus(aujourdhui(), j)) + ')' : '');
  // adresses depuis la racine du dépôt (page Révisions)
  const pageFc = app => (app.spa ? app.dossier + '/index.html#flashcards' : app.dossier + '/modules/flashcards.html');
  const titreFc = app => { const m = /^Chapitre (\d+)/.exec(app.court); return m ? 'Flashcards du chapitre ' + m[1] : 'Flashcards : ' + app.court; };

  /* ============================================================
     PLANNING
     ============================================================ */
  // range des paquets dans la boîte : chaque carte en case 1, première révision demain ; renvoie le nombre de cartes
  function ajouter(dossier, ids) {
    const app = DONNEES[dossier];
    if (!app) return 0;
    const e = etat(dossier), auj = aujourdhui();
    let n = 0;
    ids.forEach(id => {
      const p = app.paquets.find(x => x.id === id);
      if (!p) return;
      if (!e.ajouts[id]) e.ajouts[id] = auj;
      p.cartes.forEach(c => { if (!e.cartes[c.id]) e.cartes[c.id] = nouvelle(auj); n++; });
    });
    ecrireEtat(dossier, e);
    return n;
  }
  // réponse à la première présentation d'une carte en séance : « Je savais » + 1 case, « Je ne savais pas » − 1 case ;
  // le délai part du jour de la révision ; la face change (cartes à deux faces)
  function repondre(carte, ok) {
    const d = carte.app.dossier, e = etat(d), s = e.cartes[carte.id], auj = aujourdhui();
    if (!s || !e.ajouts[carte.paquet.id] || s.c > MAX) return null;
    s.c = ok ? s.c + 1 : Math.max(1, s.c - 1);
    if (s.c > MAX) delete s.d; else s.d = plus(auj, INTERVALLES[s.c - 1]);
    s.s = (s.s + 1) % carte.faces.length;
    s.v = auj;
    s.n++;
    if (ok) s.ok++;
    ecrireEtat(d, e);
    return s;
  }
  const etatDe = c => { const e = etat(c.app.dossier); return e.ajouts[c.paquet.id] ? e.cartes[c.id] || null : null; };
  // cartes dues (d'une application, ou de toutes), triées : case croissante, puis retard décroissant
  function dues(dossier) {
    const l = (dossier ? (DONNEES[dossier] ? lignes(DONNEES[dossier]) : []) : toutesLignes()).filter(x => x.du);
    l.sort((a, b) => a.k - b.k || a.j - b.j);
    return l.map(x => x.c);
  }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }
  // mélange en évitant deux cartes de la même application d'affilée quand c'est possible
  // (à chaque fois, l'application qui a le plus de cartes restantes parmi les autres) ; avant : application de la carte précédente
  function entrelacer(cartes, avant) {
    const groupes = {};
    melanger(cartes).forEach(c => { (groupes[c.app.dossier] = groupes[c.app.dossier] || []).push(c); });
    const r = [];
    avant = avant || null;
    while (r.length < cartes.length) {
      const ds = Object.keys(groupes).filter(d => groupes[d].length);
      const autres = ds.filter(d => d !== avant), choix = autres.length ? autres : ds;
      const max = Math.max.apply(null, choix.map(d => groupes[d].length));
      const gros = choix.filter(d => groupes[d].length === max);
      const d = gros[Math.floor(Math.random() * gros.length)];
      r.push(groupes[d].pop());
      avant = d;
    }
    return r;
  }

  /* ============================================================
     RENDUS : une face, la boîte, les 7 prochains jours, la mini-boîte
     ============================================================ */
  // texte d'une question sans ses figures (rappel au verso, listes)
  function texteQ(q) {
    const t = document.createElement('template');
    t.innerHTML = q;
    const f = t.content;
    f.querySelectorAll('.rev-fig, svg, small, table, img').forEach(x => x.remove());
    f.querySelectorAll('.rev-formule').forEach(x => {
      const s = document.createElement('span');
      while (x.firstChild) s.appendChild(x.firstChild);
      x.replaceWith(s, document.createTextNode(' : '));
    });
    f.querySelectorAll('p, div, li, ol, ul, br').forEach(x => x.replaceWith(...Array.from(x.childNodes), document.createTextNode(' ')));
    return t.innerHTML.replace(/\s+/g, ' ').trim();
  }
  // une face : o = { chapitre (écrire le chapitre), etat (case affichée en pied), pied: false, cache (aria-hidden) }
  function face(c, sens, cote, o) {
    o = o || {};
    sens = Math.min(sens || 0, c.faces.length - 1);
    const f = c.faces[sens];
    const ou = (o.chapitre ? c.app.court + ' · ' : '') + 'Module ' + c.paquet.module;
    const deuxSens = c.faces.length > 1 ? `<span class="rev-sens" title="Carte révisée dans les deux sens">⇄ ${sens + 1}/2</span>` : '';
    const tete = `<div class="rev-tete"><span class="rev-ou">${ou}</span>${deuxSens}<span class="rev-type">${TYPES[c.type] || c.type}</span></div>`;
    const cas = o.etat && o.etat.c <= MAX ? `Case ${o.etat.c} · revue après ${LONG[o.etat.c - 1]}` : '';
    const pied = o.pied === false ? '' : `<div class="rev-pied"><span>${cote === 'recto' ? 'Question' : 'Réponse'}</span><span>${cas}</span></div>`;
    const corps = cote === 'recto' ? `<div class="rev-q">${f.q}</div>` : `<div class="rev-rappel">${texteQ(f.q)}</div><div class="rev-rep">${f.r}</div>`;
    return `<div class="rev-face rev-${cote}"${o.cache ? ' aria-hidden="true"' : ''}>${tete}<div class="rev-corps">${corps}</div>${pied}</div>`;
  }
  // boîte à cases : o.nouvelles = colonne « + » des cartes pas encore ajoutées
  function boite(l, o) {
    o = o || {};
    const cols = [];
    if (o.nouvelles) cols.push({ nom: '+', titre: 'pas encore ajoutées', liste: l.filter(x => x.k === 0), cls: 'neuve', hors: true });
    for (let k = 1; k <= MAX; k++) cols.push({ nom: COURT[k - 1], titre: `case ${k} (revue après ${LONG[k - 1]})`, liste: l.filter(x => x.k === k), k });
    cols.push({ nom: '✓', titre: 'sues (sorties du planning)', liste: l.filter(x => x.k === SUE), cls: 'ok', hors: true });
    // les cartes à réviser en bas du tas (15 au plus dessinées)
    const tas = col => col.liste.slice().sort((a, b) => b.du - a.du).slice(0, 15).map(x => `<i class="${col.cls || (x.du ? 'du' : '')}"></i>`).join('');
    const aria = cols.map(c => {
      const du = c.k ? c.liste.filter(x => x.du).length : 0;
      return `${c.titre} : ${pluriel(c.liste.length, 'carte')}${du ? ` dont ${du} à réviser aujourd'hui` : ''}`;
    }).join(' ; ');
    return `<div class="rev-boite" style="--n:${cols.length}" role="img" aria-label="Boîte de révision. ${aria}">` +
      cols.map(col => {
        const n = col.liste.length, du = col.k ? col.liste.filter(x => x.du).length : 0;
        return `<div class="rev-case${col.hors ? ' horsboite' : ''}" title="${col.titre.charAt(0).toUpperCase() + col.titre.slice(1)}"><span class="rev-onglet">${col.nom}</span><div class="rev-tas">${tas(col)}</div><span class="rev-nb">${n}</span><span class="rev-du">${du ? du + ' auj.' : ''}</span></div>`;
      }).join('') + '</div>' +
      `<div class="rev-legende" aria-hidden="true"><span class="l-du">à réviser aujourd'hui</span><span>à réviser plus tard</span>${o.nouvelles ? '<span class="l-neuve">pas encore ajoutée</span>' : ''}<span class="l-ok">sue (sortie du planning)</span></div>`;
  }
  // cartes à réviser les 7 prochains jours (aujourd'hui : avec les cartes en retard)
  function jours(l) {
    const auj = aujourdhui();
    const n = [0, 1, 2, 3, 4, 5, 6].map(j => l.filter(x => x.j !== null && (j === 0 ? x.j <= 0 : x.j === j)).length);
    const m = Math.max.apply(null, n.concat(1));
    const nom = j => (j === 0 ? 'auj.' : j === 1 ? 'dem.' : jourCourt(plus(auj, j)).slice(0, 7));
    return `<div class="rev-jours" role="img" aria-label="Cartes à réviser : ${n.map((v, j) => (j === 0 ? 'aujourd\'hui' : j === 1 ? 'demain' : jourCourt(plus(auj, j))) + ' ' + v).join(', ')}">` +
      n.map((v, j) => `<div class="rev-jour${j === 0 ? ' auj' : ''}"><b>${v}</b><div class="b" style="height:${Math.max(4, Math.round(v / m * 64))}px"></div><span>${nom(j)}</span></div>`).join('') + '</div>';
  }
  // mini-boîte : une barre par case, puis les sues
  function mini(l) {
    const g = [];
    for (let k = 1; k <= SUE; k++) g.push(l.filter(x => x.k === k));
    const m = Math.max.apply(null, g.map(x => x.length).concat(1));
    return '<span class="rev-mini" aria-hidden="true">' + g.map((x, i) =>
      `<i class="${i === MAX ? 'ok' : x.some(y => y.du) ? 'du' : ''}" style="height:${x.length ? Math.max(3, Math.round(x.length / m * 28)) : 1}px"></i>`).join('') + '</span>';
  }
  // « cartes ajoutées / total »
  const compte = app => { const l = lignes(app); return l.filter(x => x.k > 0).length + '/' + l.length; };
  // après un ajout : compteur de l'entrée Flashcards du sommaire
  const majSommaire = app => document.querySelectorAll('#app-nav [data-rev-compte]').forEach(x => { x.textContent = compte(app); });

  /* ============================================================
     SÉANCE DE RÉVISION
     o = { libre (révision libre : la boîte ne change pas), cartes (révision libre),
           dossier (séance d'une application ; sinon toutes), retour() (✕ Arrêter, Plus tard),
           boite() (Voir ma boîte), chapitre (adresse de l'accueil de l'application), cartesApp (sa page Flashcards) }
     Une carte ratée revient à la fin de la séance jusqu'à « Je savais » ; sa case ne change qu'à la première réponse.
     Ordinateur : Espace ou Entrée (voir la réponse), → (je savais), ← (je ne savais pas).
     Téléphone : toucher la carte la retourne ; la glisser à droite = je savais, à gauche = je ne savais pas.
     ============================================================ */
  let seanceEnCours = null;               // { quitter() } : la séance affichée
  function quitterSeance() { if (seanceEnCours) { seanceEnCours.quitter(); seanceEnCours = null; } }
  const reduit = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function seance(zone, o) {
    quitterSeance();
    const html = document.documentElement, matiere0 = html.dataset.matiere;
    html.classList.add('rev-en-seance');
    let limite = o.libre ? 0 : parSeance();
    let lot = [], file = [], repondues = new Set(), ratees = new Set(), sens = new Map();
    let faites = 0, nOk = 0, nKo = 0, retournee = false, verrou = false;
    const choisir = () => dues(o.dossier);
    const portee = () => (o.dossier ? (DONNEES[o.dossier] ? lignes(DONNEES[o.dossier]) : []) : toutesLignes());

    function clavier(e) {
      if (!zone.querySelector('.rev-carte') || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target, tag = t && t.tagName;
      if (tag === 'SELECT' || tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === ' ' || e.key === 'Enter') && !retournee) {
        if (tag === 'BUTTON' && t.dataset.a === 'stop') return;
        e.preventDefault(); voir();
      } else if (retournee && e.key === 'ArrowRight') { e.preventDefault(); repondreIci(true); } else if (retournee && e.key === 'ArrowLeft') { e.preventDefault(); repondreIci(false); }
    }
    addEventListener('keydown', clavier);
    seanceEnCours = { quitter() { removeEventListener('keydown', clavier); html.classList.remove('rev-en-seance'); if (matiere0) html.dataset.matiere = matiere0; } };
    const sortir = f => () => { quitterSeance(); f(); };

    // un lot : les cartes dues les plus prioritaires (parSeance au plus), mélangées
    function nouveauLot() {
      const l = o.libre ? o.cartes : choisir();
      lot = limite ? l.slice(0, limite) : l.slice();
      file = entrelacer(lot);
      repondues = new Set(); ratees = new Set(); sens = new Map();
      faites = 0; nOk = 0; nKo = 0;
      if (!file.length) { fin(); return; }
      squelette();
      afficher();
    }
    function squelette() {
      const reglage = `<label class="rev-limite">Au plus <select aria-label="Nombre de cartes de la séance">${LIMITES.map(n => `<option value="${n}"${n === limite ? ' selected' : ''}>${n || 'sans limite'}</option>`).join('')}</select> cartes</label>`;
      zone.innerHTML = `<div class="rev-seance">
        <div class="rev-haut"><button type="button" class="btn-small" data-a="stop">✕ Arrêter</button><span class="rev-compte" aria-live="polite"></span>${o.libre ? '<span class="rev-libre" title="Ta boîte ne change pas">Révision libre</span>' : reglage}<span class="rev-score"></span></div>
        <div class="rev-barre" aria-hidden="true"><i></i></div>
        <div class="rev-scene" data-geste=""></div>
        <p class="rev-place"></p>
        <div class="rev-actions une"></div>
        <p class="rev-clavier"><kbd>Espace</kbd> voir la réponse · <kbd>←</kbd> je ne savais pas · <kbd>→</kbd> je savais</p>
        <p class="rev-geste"></p></div>`;
      zone.querySelector('[data-a="stop"]').addEventListener('click', sortir(o.retour));
      const sel = zone.querySelector('select');
      if (sel) sel.addEventListener('change', () => changerLimite(+sel.value));
      geste(zone.querySelector('.rev-scene'));
      signaler();
      scrollTo(0, 0);
    }
    function majHaut() {
      zone.querySelector('.rev-compte').textContent = `Carte ${Math.max(1, Math.min(faites + 1, lot.length))} / ${lot.length}`;
      const sc = zone.querySelector('.rev-score');
      sc.textContent = `✓ ${nOk} · ✗ ${nKo}`;
      sc.setAttribute('aria-label', `Je savais : ${nOk}, je ne savais pas : ${nKo}`);
      zone.querySelector('.rev-barre i').style.width = (lot.length ? faites / lot.length * 100 : 0) + '%';
    }
    // la carte en tête de file, côté question
    function afficher() {
      if (!file.length) { fin(); return; }
      const c = file[0], st = etatDe(c), revue = ratees.has(c.id);
      if (!sens.has(c.id)) sens.set(c.id, (st ? st.s : 0) % c.faces.length);     // une carte ratée revient avec la même face
      const s = sens.get(c.id);
      retournee = false;
      if (c.app.matiere) html.dataset.matiere = c.app.matiere;                   // couleur d'accent de la matière de la carte
      const scene = zone.querySelector('.rev-scene');
      scene.dataset.geste = '';
      scene.dataset.carte = c.id;
      scene.setAttribute('aria-label', 'Carte : touche-la pour voir la réponse');
      scene.innerHTML = `<div class="rev-carte">${face(c, s, 'recto', { chapitre: true, etat: st })}${face(c, s, 'verso', { chapitre: true, etat: st, cache: true })}</div>`;
      const j = st && st.c <= MAX ? ecart(aujourdhui(), st.d) : 0;
      zone.querySelector('.rev-place').innerHTML = revue ? '<b>Ratée tout à l\'heure</b> : on la revoit avant la fin de la séance'
        : o.libre ? 'Révision libre : ta boîte ne change pas'
        : j < 0 ? `<b>En retard de ${-j} j</b> : elle passe en priorité` : '&nbsp;';
      const act = zone.querySelector('.rev-actions');
      act.classList.add('une');
      act.innerHTML = '<button type="button" class="rev-bt rev-bt-voir" data-a="voir">Voir la réponse</button>';
      act.querySelector('[data-a="voir"]').addEventListener('click', voir);
      zone.querySelector('.rev-geste').textContent = 'Touche la carte pour la retourner';
      majHaut();
    }
    // ce que la réponse va changer (écrit sous le bouton)
    function consequence(c, ok) {
      if (ratees.has(c.id)) return ok ? 'c\'est bon pour aujourd\'hui' : 'on la revoit encore';
      if (o.libre) return 'révision libre : ta boîte ne change pas';
      const st = etatDe(c);
      if (!st) return '';
      const k = ok ? st.c + 1 : Math.max(1, st.c - 1);
      return '→ ' + (k > MAX ? 'sortie : sue ✓' : `case ${k} · ${dans(INTERVALLES[k - 1])}`);
    }
    function voir() {
      if (retournee || verrou || !file.length) return;
      retournee = true;
      const c = file[0], carte = zone.querySelector('.rev-carte');
      carte.classList.add('retournee');
      carte.children[0].setAttribute('aria-hidden', 'true');
      carte.children[1].removeAttribute('aria-hidden');
      zone.querySelector('.rev-scene').setAttribute('aria-label', 'Carte retournée : la réponse');
      const act = zone.querySelector('.rev-actions');
      act.classList.remove('une');
      act.innerHTML = `<button type="button" class="rev-bt rev-bt-ko" data-a="ko">✗ Je ne savais pas<small>${consequence(c, false)}</small></button>` +
        `<button type="button" class="rev-bt rev-bt-ok" data-a="ok">✓ Je savais<small>${consequence(c, true)}</small></button>`;
      act.querySelector('[data-a="ko"]').addEventListener('click', () => repondreIci(false));
      act.querySelector('[data-a="ok"]').addEventListener('click', () => repondreIci(true));
      zone.querySelector('.rev-geste').textContent = 'Glisse la carte à droite si tu savais, à gauche sinon';
    }
    // réponse : la case ne change qu'à la première présentation ; une carte ratée repart en fin de file
    function repondreIci(ok, delai) {
      if (!retournee || verrou || !file.length) return;
      verrou = true;
      const c = file.shift();
      if (!repondues.has(c.id)) {
        repondues.add(c.id);
        faites++;
        if (ok) nOk++; else nKo++;
        if (!o.libre) repondre(c, ok);
      }
      if (!ok) { ratees.add(c.id); file.push(c); }
      // protection contre le double appui
      zone.style.pointerEvents = 'none';
      setTimeout(() => { zone.style.pointerEvents = ''; verrou = false; afficher(); }, delai == null ? 300 : delai);
    }
    // « Au plus N cartes » pendant la séance : s'applique tout de suite (et devient le réglage)
    function changerLimite(n) {
      limite = n;
      reglerParSeance(n);
      const actuelle = file[0];
      const min = faites + (actuelle && !repondues.has(actuelle.id) ? 1 : 0);
      const cible = n ? Math.max(n, min) : Infinity;
      if (lot.length > cible) {
        // on retire les cartes jamais montrées les moins prioritaires
        const ordre = choisir();
        const retirables = file.slice(1).filter(c => !repondues.has(c.id)).sort((a, b) => ordre.indexOf(b) - ordre.indexOf(a));
        retirables.slice(0, lot.length - cible).forEach(c => { file.splice(file.indexOf(c), 1); lot.splice(lot.indexOf(c), 1); });
      } else if (lot.length < cible) {
        const encore = choisir().filter(c => lot.indexOf(c) < 0);
        encore.slice(0, cible === Infinity ? encore.length : cible - lot.length).forEach(c => { lot.push(c); file.push(c); });
      }
      // la suite de la file est de nouveau mélangée (les cartes ratées restent à la fin)
      const tete = file[0], suite = file.slice(1);
      file = [tete].concat(entrelacer(suite.filter(c => !ratees.has(c.id)), tete && tete.app.dossier), suite.filter(c => ratees.has(c.id)));
      majHaut();
    }
    // geste au doigt (ou au stylet) : la carte retournée suit le doigt ; au-delà d'un tiers de sa largeur, la réponse est donnée
    function geste(scene) {
      let x0 = null, dx = 0, id = null;
      scene.addEventListener('click', () => { if (!retournee) voir(); });
      scene.addEventListener('pointerdown', e => {
        if (!retournee || verrou || (e.pointerType !== 'touch' && e.pointerType !== 'pen')) return;
        x0 = e.clientX; dx = 0; id = e.pointerId;
        const carte = scene.querySelector('.rev-carte');
        if (carte) carte.style.transition = 'none';
      });
      scene.addEventListener('pointermove', e => {
        if (x0 === null || e.pointerId !== id) return;
        dx = e.clientX - x0;
        const carte = scene.querySelector('.rev-carte');
        if (carte) carte.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg) rotateY(180deg)`;
        scene.dataset.geste = dx > 40 ? 'ok' : dx < -40 ? 'ko' : '';
      });
      const lacher = e => {
        if (x0 === null || e.pointerId !== id) return;
        x0 = null;
        const carte = scene.querySelector('.rev-carte'), w = scene.clientWidth;
        if (!carte) return;
        if (e.type === 'pointerup' && Math.abs(dx) > w / 3) {
          // la carte part de côté, la réponse est donnée
          const sens1 = dx > 0 ? 1 : -1;
          carte.style.transition = reduit() ? 'none' : 'transform .2s ease-in';
          carte.style.transform = `translateX(${sens1 * w * 1.4}px) rotate(${sens1 * 18}deg) rotateY(180deg)`;
          repondreIci(dx > 0, reduit() ? 0 : 200);
        } else {
          // glisser trop court : la carte revient
          carte.style.transition = '';
          carte.style.transform = '';
          scene.dataset.geste = '';
        }
      };
      scene.addEventListener('pointerup', lacher);
      scene.addEventListener('pointercancel', lacher);
    }
    // fin du lot : bilan, cartes restantes, prochaine séance
    function fin() {
      const restent = o.libre ? 0 : choisir().length;
      const pr = prochaine(portee());
      const suite = pr ? `Prochaine séance : <b>${dans(pr.j)}${datePlus(pr.j)}, ${pluriel(pr.n, 'carte')}</b>.` : portee().some(x => x.k === SUE) ? 'Toutes tes cartes sont sues ✓' : '';
      const app = o.dossier && DONNEES[o.dossier];
      let note, boutons;
      if (o.libre) {
        note = 'Ta boîte n\'a pas changé : ces cartes restent à réviser à leur date.';
        boutons = `<button type="button" class="btn-primary" data-a="boite">Voir ma boîte →</button>${o.cartesApp ? `<a class="btn-secondary" href="${o.cartesApp}">Retour aux cartes</a>` : ''}`;
      } else if (restent) {
        const k = limite ? Math.min(restent, limite) : restent;
        note = `<b>Encore ${pluriel(restent, 'carte')} à réviser aujourd'hui.</b> Continue maintenant ou plus tard dans la journée.`;
        boutons = `<button type="button" class="btn-primary" data-a="encore">Continuer (${k} de plus) →</button><button type="button" class="btn-secondary" data-a="tard">Plus tard</button>`;
      } else {
        note = (lot.length ? 'Les cartes sues avancent d\'une case, les autres reculent d\'une case.<br>' : '') + `Tu as fini pour aujourd'hui ✓ ${suite}`;
        boutons = `<button type="button" class="btn-primary" data-a="boite">Voir ma boîte →</button>${app && o.chapitre ? `<a class="btn-secondary" href="${o.chapitre}">Retour au ${/^Chapitre/.test(app.court) ? 'chapitre' : 'cours'}</a>` : ''}`;
      }
      const chiffres = lot.length ? `<div class="rev-fin-chiffres"><div><b>${lot.length}</b><span>${lot.length > 1 ? 'cartes révisées' : 'carte révisée'}</span></div><div><b class="ok">${nOk}</b><span>✓ je savais</span></div><div><b class="ko">${nKo}</b><span>✗ à revoir</span></div></div>` : '';
      const badge = o.libre ? 'RÉVISION LIBRE TERMINÉE' : lot.length ? 'SÉANCE TERMINÉE' : 'RIEN À RÉVISER';
      zone.innerHTML = `<div class="rev-seance"><div class="er-card rev-fin-seance"><span class="er-badge">${badge}</span>${chiffres}<p class="rev-note">${note}</p><div class="er-actions">${boutons}</div></div></div>`;
      const b = a => zone.querySelector(`[data-a="${a}"]`);
      if (b('encore')) b('encore').addEventListener('click', nouveauLot);
      if (b('tard')) b('tard').addEventListener('click', sortir(o.retour));
      if (b('boite')) b('boite').addEventListener('click', sortir(o.boite));
      html.dataset.matiere = matiere0 || html.dataset.matiere;
      signaler();
      scrollTo(0, 0);
    }
    nouveauLot();
  }

  /* ============================================================
     PORTAIL : pilule « Révisions » et carte noire du jour
     (sans charger les cartes : à partir des clés <dossier>-flashcards)
     o = { pilule, carte, apps (ACC.APPS) }
     ============================================================ */
  function portail(o) {
    const auj = aujourdhui(), chap = [];
    let total = 0;
    APPLIS.forEach(d => {
      const e = etat(d);
      let n = 0;
      Object.keys(e.cartes).forEach(id => { const s = e.cartes[id]; if (s.c <= MAX && ecart(auj, s.d) <= 0) n++; });
      if (!n) return;
      total += n;
      const a = (o.apps || []).find(x => x.dossier === d);
      chap.push(courtDe(a ? a.titre : d));
    });
    if (o.pilule) {
      o.pilule.innerHTML = 'Révisions' + (total ? ` <i>${total}</i>` : '');
      o.pilule.setAttribute('aria-label', total ? `Révisions : ${pluriel(total, 'carte')} à réviser aujourd'hui` : 'Révisions');
    }
    if (o.carte) {
      o.carte.hidden = !total;
      o.carte.innerHTML = total ? `<div class="rev-auj"><span class="rev-auj-t"><small>Révisions</small><b>${pluriel(total, 'flashcard')} à réviser aujourd'hui</b><span class="rev-auj-d">${chap.join(', ')} · environ ${minutes(total)} min</span></span>` +
        '<a class="rev-sec" href="revisions.html">Ma boîte</a><a class="rev-go" href="revisions.html#reviser">Réviser →</a></div>' : '';
    }
    return total;
  }

  /* ============================================================
     PAGE RÉVISIONS (revisions.html, à la racine)
     Écrans par ancre : '' (la page), #reviser, #reviser-<dossier>, #libre-<dossier>, #libre-<dossier>-<paquets>
     ============================================================ */
  function pageRevisions(zone) {
    const html = document.documentElement, matiere0 = html.dataset.matiere;
    let vu = null;
    chargerTout('', () => {
      router();
      addEventListener('popstate', router);
      addEventListener('hashchange', router);
    });
    // écran ouvert depuis cette page : le retour arrière y revient
    function aller(h) {
      history.pushState({ rev: 'page' }, '', h ? '#' + h : location.pathname + location.search);
      router();
    }
    const dePage = () => !!(history.state && history.state.rev === 'page');
    // ✕ Arrêter, Plus tard : la page d'où l'on vient, sinon la page Révisions
    function retour() {
      if (dePage() || history.length > 1) history.back();
      else versBoite();
    }
    function versBoite() {
      if (dePage()) { history.back(); return; }
      history.replaceState(null, '', location.pathname + location.search);
      router();
    }
    function router() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (h === vu) return;
      vu = h;
      quitterSeance();
      if (matiere0) html.dataset.matiere = matiere0;
      document.title = 'Révisions — Physique-Chimie';
      const libre = /^libre-(.+)$/.exec(h), une = /^reviser-(.+)$/.exec(h);
      if (h === 'reviser') { seance(zone, { retour, boite: versBoite }); return; }
      if (une && DONNEES[une[1]]) {
        const d = une[1];
        seance(zone, { dossier: d, retour, boite: versBoite, chapitre: d + '/index.html' });
        return;
      }
      if (libre) {
        // dossier le plus long qui convient, puis les paquets (séparés par des virgules)
        const reste = libre[1], d = APPLIS.filter(x => DONNEES[x] && (reste === x || reste.indexOf(x + '-') === 0)).sort((a, b) => b.length - a.length)[0];
        if (d) {
          const app = DONNEES[d], ids = reste.slice(d.length + 1).split(',').filter(Boolean);
          const ps = ids.length ? app.paquets.filter(p => ids.indexOf(p.id) >= 0) : app.paquets;
          const cartes = ps.reduce((l, p) => l.concat(p.cartes), []);
          if (cartes.length) { seance(zone, { libre: true, cartes, dossier: d, retour, boite: versBoite, chapitre: d + '/index.html', cartesApp: pageFc(app) }); return; }
        }
      }
      principale();
    }
    // la page : aujourd'hui, réglage, boîte, 7 jours, applications, méthodes, boîte en papier
    function principale() {
      const apps = appsChargees(), l = toutesLignes();
      const avec = apps.filter(a => lignes(a).some(x => x.k > 0));
      zone.innerHTML = `
        <div class="er-card">
          <span class="er-badge">RÉVISIONS</span>
          <h2 class="er-titre">Mes flashcards</h2>
          <p class="er-contexte">Les cartes de tous tes chapitres, revues au bon moment : une carte sue revient de plus en plus tard, une carte ratée revient plus vite.</p>
        </div>
        <div data-z="auj" style="margin-bottom:16px"></div>
        <div class="rev-reglage" role="group" aria-label="Cartes par séance"><span>Cartes par séance</span>${LIMITES.map(n => `<button type="button" class="btn-small" data-n="${n}" aria-pressed="false">${n || 'Sans limite'}</button>`).join('')}</div>
        <div class="rev-deux">
          <section class="er-card"><h3 class="rev-h">Ma boîte <small>toutes applications</small></h3>${boite(l)}</section>
          <section class="er-card"><h3 class="rev-h">Les 7 prochains jours</h3>${jours(l)}<p class="rev-note" data-z="retard" style="margin-top:12px"></p></section>
        </div>
        ${sectionApps(avec)}
        ${METHODES}
        ${PAPIER}`;
      majAujourdhui();
      zone.querySelectorAll('.rev-reglage button').forEach(b => b.addEventListener('click', () => { reglerParSeance(+b.dataset.n); majAujourdhui(); }));
      zone.addEventListener('click', e => {
        const a = e.target.closest('[data-ecran]');
        if (!a || !zone.contains(a)) return;
        e.preventDefault();
        aller(a.dataset.ecran);
      });
      courbeOubli(zone.querySelector('[data-z="oubli"]'));
      minuteur(zone.querySelector('.rev-pomo'));
      signaler();
    }
    // carte « Aujourd'hui », réglage du nombre de cartes, note sur les retards
    function majAujourdhui() {
      const apps = appsChargees(), l = toutesLignes(), lim = parSeance();
      const du = l.filter(x => x.du), boiteN = l.filter(x => x.k > 0).length;
      let h;
      if (du.length) {
        const chap = apps.filter(a => lignes(a).some(x => x.du)).map(a => a.court);
        const n = du.length, parS = lim && n > lim;
        h = `<div class="rev-auj"><span class="rev-auj-t"><small>Aujourd'hui</small><b>${pluriel(n, 'carte')} à réviser</b><span class="rev-auj-d">${chap.join(', ')} · environ ${minutes(parS ? lim : n)} min${parS ? ` par séance de ${lim} cartes` : ''}</span></span>` +
          '<a class="rev-go" href="#reviser" data-ecran="reviser">Réviser maintenant →</a></div>';
      } else if (boiteN) {
        const pr = prochaine(l);
        h = `<div class="rev-auj ajour"><span class="rev-auj-t"><small>Aujourd'hui</small><b>À jour ✓</b><span class="rev-auj-d">${pr ? `Prochaine révision : ${dans(pr.j)}${datePlus(pr.j)}, ${pluriel(pr.n, 'carte')}` : 'Toutes tes cartes sont sues : bravo !'}</span></span></div>`;
      } else {
        h = '<div class="rev-auj vide"><span class="rev-auj-t"><small>Aujourd\'hui</small><b>Pas encore de flashcards</b><span class="rev-auj-d">Termine un cours, puis ajoute ses cartes. Les applications qui ont des cartes :</span></span>' +
          `<ul>${apps.map(a => `<li><a href="${pageFc(a)}">${a.titre}</a> : ${pluriel(a.cartes.length, 'carte')}</li>`).join('')}</ul></div>`;
      }
      zone.querySelector('[data-z="auj"]').innerHTML = h;
      zone.querySelectorAll('.rev-reglage button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.n === lim));
      zone.querySelector('[data-z="retard"]').textContent = 'Un jour sans réviser ? Les cartes t\'attendent : elles passent en premier la fois suivante' + (lim ? `, par séances de ${lim} cartes au plus.` : '.');
    }
    // une ligne par application qui a des cartes dans la boîte ; puis les cartes prêtes à ajouter
    function sectionApps(avec) {
      // une ligne par application : les paquets dont les cours sont faits, pas encore ajoutés
      const prets = [];
      appsChargees().forEach(a => {
        const e = etat(a.dossier), fait = faites(a.dossier), ps = a.paquets.filter(p => statut(p, e, fait) === 'pret');
        if (ps.length) prets.push({ a, ps });
      });
      const ligneP = x => {
        const m = []; x.ps.forEach(p => { if (m.indexOf(p.module) < 0) m.push(p.module); });
        const n = x.ps.reduce((t, p) => t + p.cartes.length, 0);
        return `<p class="rev-note"><span>Prêtes à ajouter, tu as fini le cours : <b>${x.a.court}</b>, ${m.length > 1 ? 'modules' : 'module'} ${enumerer(m.map(String))} (${pluriel(n, 'carte')})</span> ` +
          `<a class="btn-small" href="${pageFc(x.a)}${x.a.spa ? '' : '#' + x.ps[0].id}">Voir</a></p>`;
      };
      const listePrets = prets.length ? `<div class="rev-prets">${prets.map(ligneP).join('')}</div>` : '';
      if (!avec.length) return prets.length ? `<section class="er-card"><h3 class="rev-h">Cartes prêtes à ajouter</h3>${listePrets}</section>` : '';
      const ligne = a => {
        const l = lignes(a), dansB = l.filter(x => x.k > 0), du = l.filter(x => x.du).length, pr = prochaine(l);
        const chip = du ? `<span class="rev-chip du">Réviser ${du} →</span>` : `<span class="rev-chip rien">${pr ? 'À jour ✓ · ' + dans(pr.j) : 'Toutes sues ✓'}</span>`;
        const attr = du ? `href="#reviser-${a.dossier}" data-ecran="reviser-${a.dossier}"` : `href="${pageFc(a)}"`;
        return `<a class="rev-app" ${attr}><span class="rev-app-t"><b>${a.titre}</b><small>${pluriel(dansB.length, 'carte')} · ${pluriel(dansB.filter(x => x.k === SUE).length, 'sue')}</small></span>${mini(l)}${chip}</a>`;
      };
      return `<section class="er-card"><h3 class="rev-h">Par application</h3><div class="rev-apps">${avec.map(ligne).join('')}</div>${listePrets}</section>`;
    }
  }

  /* ---------- Bien réviser : méthodes (textes des maquettes validées) ---------- */
  const METHODES = `<section class="er-card">
    <h3 class="rev-h">Bien réviser</h3>
    <div class="rev-methodes">
      <div class="rev-methode">
        <h4>La feuille blanche</h4>
        <p>Relire donne l'impression de savoir. Ce qui fait retenir, c'est d'aller <b>chercher</b> l'information dans sa mémoire.</p>
        <ol><li>Cours fermé, prends une feuille blanche.</li><li>Écris tout ce dont tu te souviens : définitions, formules, schémas, méthodes.</li><li>Ouvre la fiche et complète d'une autre couleur ce qui manquait.</li><li>Ce qui est en couleur : à revoir en priorité.</li></ol>
      </div>
      <div class="rev-methode">
        <h4>Les révisions espacées</h4>
        <p>On oublie vite ce qu'on vient d'apprendre. Chaque fois qu'on s'en souvient à nouveau, on oublie <b>moins vite</b> : on peut attendre plus longtemps avant de revoir.</p>
        <div data-z="oubli"></div>
        <p>C'est le principe des flashcards : 1 jour, 2 jours, 4 jours, 1 semaine…</p>
      </div>
      <div class="rev-methode">
        <h4>La méthode Pomodoro</h4>
        <ol><li>Une seule tâche, téléphone dans une autre pièce.</li><li><b>25 min</b> de travail sans interruption.</li><li><b>5 min</b> de vraie pause : bouge, bois.</li><li>Après 4 pomodoros : pause de 15 à 30 min.</li></ol>
        <p>Une séance de flashcards tient dans un pomodoro.</p>
        <div class="rev-pomo">
          <div class="rev-pomo-modes" role="group" aria-label="Durée"><button type="button" class="btn-small" data-m="25" aria-pressed="true">Travail 25 min</button><button type="button" class="btn-small" data-m="5" aria-pressed="false">Pause 5 min</button></div>
          <b class="rev-pomo-t" role="timer" aria-live="off">25:00</b>
          <div class="rev-pomo-bt"><button type="button" class="btn-primary" data-a="go">Démarrer</button><button type="button" class="btn-small" data-a="raz" aria-label="Remettre à zéro">↺</button></div>
        </div>
      </div>
    </div>
  </section>`;

  /* ---------- Fabrique ta boîte en papier ---------- */
  const PAPIER = (function () {
    const noms = ['1 j', '2 j', '4 j', '1 sem', '2 sem', '1 mois', '2 mois', 'sues'], nb = [3, 6, 5, 4, 2, 1, 0, 2];
    let s = '<rect x="6" y="70" width="328" height="70" rx="8" fill="#ebe8e1" stroke="#c9c4b9" stroke-width="1.5"/>';
    noms.forEach((n, i) => {
      const x0 = 12 + i * 40.5;
      for (let k = 0; k < nb[i]; k++) s += `<rect x="${x0 + 4 + k * 4}" y="${50 - (k % 2) * 3}" width="30" height="40" rx="2" fill="#ffffff" stroke="#c9c4b9"/>`;
      s += `<rect x="${x0}" y="34" width="36" height="22" rx="4" fill="${i === 7 ? '#e7f3ed' : '#ffffff'}" stroke="#8d8f94"/><text x="${x0 + 18}" y="49" font-size="9.5" font-weight="700" text-anchor="middle" fill="#16181d">${n}</text>`;
    });
    s += '<rect x="6" y="88" width="328" height="52" rx="8" fill="#f3f1ec" stroke="#c9c4b9" stroke-width="1.5"/><text x="170" y="120" font-size="11" font-weight="700" text-anchor="middle" fill="#55585f">la boîte : on avance d\'une case quand on sait</text>';
    const dessin = `<svg viewBox="0 0 340 146" role="img" aria-label="Boîte de fiches avec 8 intercalaires : 1 j, 2 j, 4 j, 1 sem, 2 sem, 1 mois, 2 mois, sues" style="width:100%;height:auto">${s}</svg>`;
    return `<section class="er-card">
    <h3 class="rev-h">Fabrique ta boîte en papier</h3>
    <div class="rev-deux">
      <ol class="rev-papier">
        <li><b>Des fiches bristol</b> : une question au recto, la réponse au verso. Une seule idée par carte, avec tes mots et un schéma si besoin.</li>
        <li><b>Une boîte avec 7 intercalaires</b> : 1 j, 2 j, 4 j, 1 sem, 2 sem, 1 mois, 2 mois, et une case « sues ».</li>
        <li>Une nouvelle carte va dans la case <b>1 j</b>. Note au crayon, dans un coin, la <b>date</b> de sa prochaine révision.</li>
        <li>Chaque jour, sors les cartes dont la date est passée. <b>Sue</b> : case suivante. <b>Ratée</b> : case précédente. Efface et écris la nouvelle date.</li>
        <li>Carte dans les deux sens (formule, définition) : une fois sur deux, lis le <b>verso</b> et retrouve le recto.</li>
      </ol>
      <div>${dessin}<p class="rev-note" style="margin-top:8px">Ce site fait exactement la même chose avec tes cartes de physique-chimie. Pour passer au papier : « Imprimer les cartes » sur la page Flashcards de chaque chapitre.</p></div>
    </div>
  </section>`;
  })();

  // courbe de l'oubli : sans révision / avec révisions espacées (J1, J3, J7, J14)
  function courbeOubli(z) {
    if (!z) return;
    const x = t => 40 + t * 14.8, y = r => 12 + (1 - r) * 92;
    let sans = '', avec = '', S = 1.2, t0 = 0;
    const rev = [1, 3, 7, 14];
    for (let t = 0; t <= 17; t += 0.1) sans += (t ? 'L' : 'M') + x(t).toFixed(1) + ',' + y(Math.exp(-t / 1.2)).toFixed(1);
    for (let t = 0; t <= 17; t += 0.1) {
      if (rev.length && t >= rev[0]) { avec += 'L' + x(rev[0]).toFixed(1) + ',' + y(1); t0 = rev.shift(); S *= 2.6; }
      avec += (t ? 'L' : 'M') + x(t).toFixed(1) + ',' + y(Math.exp(-(t - t0) / S)).toFixed(1);
    }
    z.innerHTML = `<svg viewBox="0 0 300 130" role="img" aria-label="Courbe de l'oubli : sans révision, le souvenir s'effondre en quelques jours ; avec des révisions à J1, J3, J7 et J14, il reste haut">
      <line x1="40" y1="104" x2="294" y2="104" stroke="#16181d"/><line x1="40" y1="104" x2="40" y2="8" stroke="#16181d"/>
      <text x="36" y="16" font-size="11" text-anchor="end" fill="#55585f">100 %</text><text x="292" y="118" font-size="11" text-anchor="end" fill="#55585f">jours</text>
      ${[1, 3, 7, 14].map(t => `<text x="${x(t)}" y="118" font-size="11" text-anchor="middle" fill="#55585f">J${t}</text>`).join('')}
      <path d="${sans}" fill="none" stroke="#8d8f94" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="${avec}" fill="none" style="stroke:var(--accent)" stroke-width="2.2"/>
      <text x="122" y="94" font-size="11" fill="#55585f">sans révision</text><text x="158" y="62" font-size="11" style="fill:var(--accent-ink)" font-weight="700">avec révisions</text></svg>`;
  }

  /* ---------- Minuteur Pomodoro : 25 min de travail, 5 min de pause, passage automatique ----------
     (l'état reste en mémoire pendant les séances de la page ; rien n'est enregistré) */
  const POMO = { mode: 25, reste: 25 * 60, fin: null, horloge: null, el: null, titre: null, audio: null };
  const mmss = s => deux(Math.floor(s / 60)) + ':' + deux(s % 60);
  function minuteur(el) {
    POMO.el = el;
    if (!el) return;
    el.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { pomoArreter(); POMO.mode = +b.dataset.m; POMO.reste = POMO.mode * 60; pomoAfficher(); }));
    el.querySelector('[data-a="go"]').addEventListener('click', () => { pomoSon(true); if (POMO.fin) pomoArreter(); else pomoDemarrer(); });
    el.querySelector('[data-a="raz"]').addEventListener('click', () => { pomoArreter(); POMO.reste = POMO.mode * 60; pomoAfficher(); });
    pomoAfficher();
  }
  function pomoAfficher() {
    const el = POMO.el;
    if (POMO.fin) {
      if (POMO.titre === null) POMO.titre = document.title;
      document.title = mmss(POMO.reste) + ' · ' + (POMO.mode === 25 ? 'Travail' : 'Pause') + ' — ' + POMO.titre;
    } else if (POMO.titre !== null) { document.title = POMO.titre; POMO.titre = null; }
    if (!el || !document.contains(el)) return;
    el.querySelector('.rev-pomo-t').textContent = mmss(POMO.reste);
    el.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.m === POMO.mode));
    el.querySelector('[data-a="go"]').textContent = POMO.fin ? 'Pause' : 'Démarrer';
  }
  function pomoDemarrer() {
    POMO.fin = Date.now() + POMO.reste * 1000;
    clearInterval(POMO.horloge);
    POMO.horloge = setInterval(pomoTic, 250);
    pomoAfficher();
  }
  function pomoArreter() {
    if (POMO.fin) POMO.reste = Math.max(0, Math.ceil((POMO.fin - Date.now()) / 1000));
    POMO.fin = null;
    clearInterval(POMO.horloge);
    POMO.horloge = null;
    pomoAfficher();
  }
  function pomoTic() {
    if (!POMO.fin) return;
    POMO.reste = Math.max(0, Math.ceil((POMO.fin - Date.now()) / 1000));
    if (POMO.reste <= 0) {
      // fin de la période : un son court, puis l'autre période commence
      pomoSon();
      POMO.mode = POMO.mode === 25 ? 5 : 25;
      POMO.reste = POMO.mode * 60;
      POMO.fin = Date.now() + POMO.reste * 1000;
    }
    pomoAfficher();
  }
  // son court (Web Audio), seulement après un clic de l'élève
  function pomoSon(preparer) {
    try {
      if (preparer) {
        if (!POMO.audio && (window.AudioContext || window.webkitAudioContext)) POMO.audio = new (window.AudioContext || window.webkitAudioContext)();
        if (POMO.audio && POMO.audio.state === 'suspended') POMO.audio.resume();
        return;
      }
      const a = POMO.audio;
      if (!a) return;
      [0, 0.22].forEach(t => {
        const o = a.createOscillator(), g = a.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.0001, a.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.25, a.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.18);
        o.connect(g); g.connect(a.destination);
        o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.2);
      });
    } catch (e) { /* pas de son : rien de grave */ }
  }

  /* ============================================================
     DANS UNE APPLICATION : contexte donné par assets/sommaire.js
     ============================================================ */
  const ctxApp = () => (window.SOM && window.SOM.contexte ? window.SOM.contexte() : { id: '', racine: '../', adresse: c => c + '.html', nomPage: c => c });
  const revisionsHref = ctx => ctx.racine + 'revisions.html';
  const nomsAttente = (p, fait, ctx) => enumerer((p.apres || []).filter(k => !fait(k)).map(k => ctx.nomPage(k)));

  /* ---------- Fin d'un cours (carte « À retenir ») ----------
     un bloc par paquet dont les prérequis (apres) contiennent cette page */
  function finCours(carte, cle) {
    const ctx = ctxApp(), app = DONNEES[ctx.id];
    if (!app || !carte) return;
    cle = cle || (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
    const ps = app.paquets.filter(p => (p.apres || []).indexOf(cle) >= 0);
    if (!ps.length) return;
    let z = carte.querySelector('.rev-fins');
    if (!z) { z = document.createElement('div'); z.className = 'rev-fins'; carte.appendChild(z); }
    const ajoutes = {};
    const fc = ctx.adresse('flashcards');
    function rendre() {
      const e = etat(app.dossier), fait = faites(app.dossier), L = lignes(app, e);
      z.innerHTML = ps.map(p => {
        const n = p.cartes.length, st = statut(p, e, fait), t = '<small>Flashcards</small>';
        if (st === 'ajoute' && ajoutes[p.id]) {
          return `<div class="rev-fin"><p>${t}<b>✓ ${pluriel(n, 'carte')} ${n > 1 ? 'ajoutées' : 'ajoutée'}.</b> Première révision demain. Tu peux déjà les revoir maintenant : ta boîte ne changera pas.</p>` +
            `<a class="btn-primary" href="${revisionsHref(ctx)}#libre-${app.dossier}-${p.id}">Les réviser maintenant</a></div>`;
        }
        if (st === 'ajoute') {
          const lp = L.filter(x => x.c.paquet === p), pr = prochaine(lp);
          const quand = lp.some(x => x.du) ? 'aujourd\'hui' : pr ? dans(pr.j) + datePlus(pr.j) : 'toutes sues ✓';
          return `<div class="rev-fin"><p>${t}✓ Ces ${pluriel(n, 'carte')} sont dans tes révisions · prochaine révision : ${quand}.</p><a class="rev-lien" href="${fc}${ctx.spa ? '' : '#' + p.id}">Voir les cartes</a></div>`;
        }
        if (st === 'pret') {
          return `<div class="rev-fin"><p>${t}Range les ${pluriel(n, 'carte')} de ce cours dans ta boîte de révision : première révision demain.</p>` +
            `<button type="button" class="btn-primary" data-ajout="${p.id}">Ajouter les ${pluriel(n, 'carte')} à mes révisions</button></div>`;
        }
        return `<div class="rev-fin attente"><p>${t}Ces ${pluriel(n, 'carte')} seront disponibles après : <b>${nomsAttente(p, fait, ctx)}</b>.</p><button type="button" class="rev-lien" data-ajout="${p.id}">Ajouter quand même</button></div>`;
      }).join('');
      z.querySelectorAll('[data-ajout]').forEach(b => b.addEventListener('click', () => {
        ajouter(app.dossier, [b.dataset.ajout]);
        ajoutes[b.dataset.ajout] = true;
        rendre();
        majSommaire(app);
        const l = z.querySelector('a.btn-primary');
        if (l) l.focus();
      }));
    }
    rendre();
  }

  /* ---------- Accueil de l'application : bloc « Flashcards du chapitre », bouton de chaque module, ligne Flashcards ---------- */
  const messages = {};                 // messages affichés après un ajout (clé : 'bloc' ou numéro de module)
  function accueil(zone, app) {
    const ctx = ctxApp(), d = app.dossier, rev = revisionsHref(ctx), fc = ctx.adresse('flashcards');
    zone.querySelectorAll('.rev-int').forEach(x => x.remove());
    const e = etat(d), fait = faites(d), L = lignes(app, e);
    const dansB = L.filter(x => x.k > 0), du = L.filter(x => x.du).length;
    const prets = app.paquets.filter(p => statut(p, e, fait) === 'pret');
    const nPrets = prets.reduce((n, p) => n + p.cartes.length, 0);
    const modulesDe = ps => { const m = []; ps.forEach(p => { if (m.indexOf(p.module) < 0) m.push(p.module); }); return (m.length > 1 ? 'modules ' : 'module ') + enumerer(m.map(String)); };
    const libre = ids => `${rev}#libre-${d}-${ids.join(',')}`;

    // 1. bloc sous « Reprendre »
    let b, s, act;
    const aAjouter = nPrets ? ` · ${nPrets} à ajouter (${modulesDe(prets)})` : '';
    if (du) {
      b = `${pluriel(du, 'carte')} à réviser aujourd'hui`;
      s = `${pluriel(dansB.length, 'carte')} dans tes révisions${aAjouter}`;
      act = `<a class="btn-primary" href="${rev}#reviser-${d}">Réviser →</a><a class="btn-small" href="${fc}">Toutes les cartes</a>`;
    } else if (dansB.length) {
      const pr = prochaine(L);
      b = pr ? `À jour ✓ · prochaine révision ${dans(pr.j)}${datePlus(pr.j)} (${pluriel(pr.n, 'carte')})` : 'À jour ✓ · toutes tes cartes sont sues';
      s = `${pluriel(dansB.length, 'carte')} dans tes révisions${aAjouter}`;
      act = `<a class="btn-small" href="${fc}">Toutes les cartes</a>`;
    } else if (nPrets) {
      b = `${pluriel(nPrets, 'carte')} ${nPrets > 1 ? 'prêtes' : 'prête'} à ajouter (${modulesDe(prets)})`;
      s = 'Range-les dans ta boîte de révision : première révision demain.';
      act = `<button type="button" class="btn-primary" data-ajout="${prets.map(p => p.id).join(',')}" data-ou="bloc">Ajouter</button><a class="btn-small" href="${fc}">Toutes les cartes</a>`;
    } else {
      b = `${pluriel(L.length, 'carte')} ${L.length > 1 ? 't\'attendent' : 't\'attend'}`;
      s = 'Elles arrivent quand tu finis les cours.';
      act = `<a class="btn-small" href="${fc}">Voir les cartes</a>`;
    }
    const bloc = `<div class="rev-bloc rev-int"><span class="rev-bloc-t"><small>Flashcards du chapitre</small><b>${b}</b><span>${s}</span></span>${dansB.length ? mini(L) : ''}${act}</div>` +
      (messages.bloc ? `<p class="rev-msg rev-int" role="status">${messages.bloc}</p>` : '');
    const rep = zone.querySelector('.som-reprendre'), mods = zone.querySelector('.som-modules');
    if (rep) rep.insertAdjacentHTML('afterend', bloc); else if (mods) mods.insertAdjacentHTML('beforebegin', bloc);

    // 2. un bouton dans chaque module, après « Fiche »
    const nums = [];
    app.paquets.forEach(p => { if (nums.indexOf(p.module) < 0) nums.push(p.module); });
    nums.forEach(n => {
      const reg = zone.querySelector('#som-m' + n);
      if (!reg) return;
      const acts = reg.querySelectorAll('.som-actions'), ici = acts[acts.length - 1];
      const ps = app.paquets.filter(p => p.module === n), pr = ps.filter(p => statut(p, e, fait) === 'pret');
      let bt;
      if (ps.every(p => e.ajouts[p.id])) bt = `<a class="som-bt fait rev-int" href="${fc}${ctx.spa ? '' : '#m' + n}">Flashcards ✓</a>`;
      else if (pr.length) {
        const k = pr.reduce((t, p) => t + p.cartes.length, 0);
        bt = `<button type="button" class="som-bt ici rev-int rev-bt-fc" data-ajout="${pr.map(p => p.id).join(',')}" data-ou="${n}">+ Ajouter ${k > 1 ? 'les ' + k + ' flashcards' : 'la flashcard'}</button>`;
      } else bt = `<a class="som-bt rev-int" href="${fc}${ctx.spa ? '' : '#m' + n}">Flashcards</a>`;
      if (ici) ici.insertAdjacentHTML('beforeend', bt);
      if (messages[n]) reg.insertAdjacentHTML('beforeend', `<p class="rev-msg rev-int" role="status">${messages[n]}</p>`);
    });

    // 3. ligne « Flashcards » (posée par sommaire.js) : description et compteur
    const desc = zone.querySelector('[data-rev-desc]'), cpt = zone.querySelector('[data-rev-compte]');
    if (desc) desc.textContent = `${pluriel(L.length, 'carte')} pour retenir l'essentiel du chapitre`;
    if (cpt) { cpt.textContent = dansB.length + '/' + L.length; cpt.title = `${pluriel(dansB.length, 'carte')} dans tes révisions sur ${L.length}`; }

    // ajout sans changer de page, puis « Les réviser maintenant »
    zone.querySelectorAll('.rev-int[data-ajout], .rev-int [data-ajout]').forEach(x => x.addEventListener('click', () => {
      const ids = x.dataset.ajout.split(','), n = ajouter(d, ids);
      messages[x.dataset.ou] = `✓ ${pluriel(n, 'carte')} ${n > 1 ? 'ajoutées' : 'ajoutée'} : première révision demain. <a href="${libre(ids)}">Les réviser maintenant →</a>`;
      accueil(zone, app);
      const m = zone.querySelector(x.dataset.ou === 'bloc' ? '.rev-bloc + .rev-msg a' : `#som-m${x.dataset.ou} .rev-msg a`);
      if (m) m.focus();
    }));
    signaler();
  }

  /* ============================================================
     PAGE FLASHCARDS D'UNE APPLICATION (modules/flashcards.html)
     écrans : la liste (ancres #m1, #m2a… : un paquet, #m2 : le premier paquet du module 2), #imprimer
     ============================================================ */
  function pageApplication(zone) {
    const ctx = ctxApp(), app = DONNEES[ctx.id];
    if (!app) { zone.innerHTML = '<div class="er-card"><p class="er-contexte">Les flashcards de ce chapitre n\'ont pas pu être chargées.</p></div>'; return; }
    const d = app.dossier, rev = revisionsHref(ctx);
    let ecran = null;
    const ouverts = new Set(), ajoutes = {};
    function router() {
      if (location.hash === '#imprimer') {
        if (ecran !== 'imp') { ecran = 'imp'; impression(); }
        return;
      }
      if (ecran !== 'liste') { ecran = 'liste'; liste(); }
      ouvrirAncre();
    }
    router();
    addEventListener('hashchange', router);
    addEventListener('popstate', router);

    function liste() {
      document.documentElement.classList.remove('rev-imprimer');
      zone.innerHTML = `
        <div class="er-card">
          <span class="er-badge">FLASHCARDS</span>
          <h2 class="er-titre">${titreFc(app)}</h2>
          <p class="er-contexte">${pluriel(app.cartes.length, 'carte')} pour retenir l'essentiel. Quand tu as fini un cours, <b>ajoute ses cartes à tes révisions</b> : elles reviendront au bon moment.</p>
        </div>
        <div class="rev-deux">
          <section class="er-card"><h3 class="rev-h">Ma boîte <small>ce chapitre</small></h3><div data-z="boite"></div></section>
          <section class="er-card rev-avant"><h3 class="rev-h">Aujourd'hui</h3><div data-z="auj"></div></section>
        </div>
        <section class="er-card"><h3 class="rev-h">Les cartes, cours par cours <small>touche une carte pour la voir</small></h3><div data-z="paquets"></div></section>`;
      // ouverts par défaut : les paquets prêts à ajouter, sinon le premier
      const e = etat(d), fait = faites(d);
      app.paquets.forEach(p => { if (statut(p, e, fait) === 'pret') ouverts.add(p.id); });
      if (!ouverts.size && app.paquets[0]) ouverts.add(app.paquets[0].id);
      majHaut();
      majPaquets();
      signaler();
    }
    // la boîte du chapitre et « Aujourd'hui »
    function majHaut() {
      const L = lignes(app), du = L.filter(x => x.du).length, dansB = L.filter(x => x.k > 0).length;
      zone.querySelector('[data-z="boite"]').innerHTML = boite(L, { nouvelles: true });
      let txt;
      if (du) txt = `<b>${pluriel(du, 'carte')}</b> à réviser · ${pluriel(dansB, 'carte')} dans tes révisions.`;
      else if (dansB) { const pr = prochaine(L); txt = `<b>À jour ✓</b> · ${pluriel(dansB, 'carte')} dans tes révisions.${pr ? ` Prochaine révision : ${dans(pr.j)}${datePlus(pr.j)} (${pluriel(pr.n, 'carte')}).` : ''}`; }
      else txt = 'Aucune carte dans tes révisions pour l\'instant : ajoute celles des cours que tu as finis.';
      const choix = app.paquets.map(p => `<label><input type="checkbox" value="${p.id}" checked> Module ${p.module} · ${p.titre} (${p.cartes.length})</label>`).join('');
      zone.querySelector('[data-z="auj"]').innerHTML = `<p style="font-size:1.05rem;margin-bottom:12px">${txt}</p>
        <div class="rev-boutons">
          ${du ? `<a class="btn-primary" href="${rev}#reviser-${d}">Réviser les ${pluriel(du, 'carte')} →</a>` : ''}
          <button type="button" class="btn-secondary" data-a="tout" aria-expanded="false" aria-controls="rev-choix">Tout réviser (sans changer mon planning)</button>
          <div class="rev-choix" id="rev-choix" hidden><p>Les cours à réviser :</p>${choix}<a class="btn-primary" data-a="libre" href="${rev}#libre-${d}">Commencer →</a></div>
          <a class="btn-secondary" href="#imprimer" data-a="imprimer">Imprimer les cartes</a>
          <button type="button" class="btn-secondary" data-a="anki">Exporter les cartes sous Anki</button>
          <p class="rev-note" data-z="anki" role="status" hidden></p>
        </div>`;
      const z = zone.querySelector('[data-z="auj"]'), bt = z.querySelector('[data-a="tout"]'), ch = z.querySelector('#rev-choix'), go = z.querySelector('[data-a="libre"]');
      bt.addEventListener('click', () => { const oui = ch.hidden; ch.hidden = !oui; bt.setAttribute('aria-expanded', oui); });
      ch.addEventListener('change', () => {
        const ids = Array.from(ch.querySelectorAll('input:checked')).map(i => i.value);
        go.href = `${rev}#libre-${d}` + (ids.length && ids.length < app.paquets.length ? '-' + ids.join(',') : '');
        go.setAttribute('aria-disabled', !ids.length);
      });
      z.querySelector('[data-a="imprimer"]').addEventListener('click', ev => {
        ev.preventDefault();
        history.pushState({ revImp: 1 }, '', '#imprimer');
        router();
      });
      z.querySelector('[data-a="anki"]').addEventListener('click', ev => exporterAnki(app, ctx, ev.currentTarget, z.querySelector('[data-z="anki"]')));
    }
    // les paquets : résumé, bloc d'ajout, une ligne par carte (aperçu au clic)
    function majPaquets() {
      const e = etat(d), fait = faites(d), L = lignes(app, e);
      zone.querySelector('[data-z="paquets"]').innerHTML = app.paquets.map(p => {
        const st = statut(p, e, fait), lp = L.filter(x => x.c.paquet === p), n = p.cartes.length, du = lp.filter(x => x.du).length;
        let resume = '';
        if (st === 'ajoute') { const pr = prochaine(lp); resume = du ? `<b class="rev-du">${du} à réviser aujourd'hui</b>` : pr ? 'prochaine : ' + dans(pr.j) : 'toutes sues ✓'; }
        else if (st === 'pret') resume = '<b class="rev-du">prêt à ajouter</b>';
        const etiquette = st === 'ajoute' ? `<span class="rev-etat ok">✓ Dans tes révisions depuis le ${jourMois(e.ajouts[p.id])}</span>` : st === 'attente' ? '<span class="rev-etat">Pas encore dans tes révisions</span>' : '';
        let ajout = '';
        if (st === 'ajoute' && ajoutes[p.id]) {
          ajout = `<div class="rev-ajout"><p><b>✓ ${pluriel(n, 'carte')} ${n > 1 ? 'ajoutées' : 'ajoutée'}.</b> Première révision demain. Tu peux déjà les revoir maintenant : ta boîte ne changera pas.</p><a class="btn-primary" href="${rev}#libre-${d}-${p.id}">Les réviser maintenant</a></div>`;
        } else if (st === 'pret') {
          const tete = (p.apres || []).length ? `<b>${p.apres.length > 1 ? 'Cours terminés' : 'Cours terminé'} ✓</b> ` : '';
          ajout = `<div class="rev-ajout"><p>${tete}Range ces ${pluriel(n, 'carte')} dans ta boîte : première révision demain.</p><button type="button" class="btn-primary" data-ajout="${p.id}">Ajouter les ${pluriel(n, 'carte')} à mes révisions</button></div>`;
        } else if (st === 'attente') {
          const manque = (p.apres || []).filter(k => !fait(k));
          ajout = `<div class="rev-ajout attente"><p>Disponible après : <b>${nomsAttente(p, fait, ctx)}</b>.</p><a class="btn-small" href="${ctx.adresse(manque[0])}">Aller au cours</a><button type="button" class="rev-lien" data-ajout="${p.id}">Ajouter quand même</button></div>`;
        }
        const lignesH = lp.map(x => {
          const c = x.c;
          const qd = !x.s ? '—' : x.k === SUE ? 'sue ✓' : x.j <= 0 ? 'aujourd\'hui' : `${dans(x.j)} · ${jourCourt(x.s.d)}`;
          return `<button type="button" class="rev-ligne${x.s ? '' : ' inactive'}" data-carte="${c.id}" aria-expanded="false" aria-controls="ap-${c.id}">` +
            `<span class="ty">${TYPES[c.type] || c.type}${c.faces.length > 1 ? ' ⇄' : ''}</span><span class="txt">${texteQ(c.faces[0].q)}</span>` +
            `<span class="cs">${x.s ? (x.k === SUE ? 'Sue' : 'Case ' + x.k) : ''}</span><span class="qd${x.du ? ' du' : x.k === SUE ? ' ok' : ''}">${qd}</span></button>` +
            `<div class="rev-apercu" id="ap-${c.id}" hidden></div>`;
        }).join('');
        return `<details class="rev-paquet" id="${p.id}" data-module="${p.module}"${ouverts.has(p.id) ? ' open' : ''}><summary class="rev-paquet-h"><h4>Module ${p.module} · ${p.titre}<small>${pluriel(n, 'carte')}${resume ? ' · ' + resume : ''}</small></h4>${etiquette}</summary>${ajout}<div class="rev-lignes">${lignesH}</div></details>`;
      }).join('');
      const z = zone.querySelector('[data-z="paquets"]');
      z.querySelectorAll('details').forEach(x => x.addEventListener('toggle', () => { if (x.open) ouverts.add(x.id); else ouverts.delete(x.id); }));
      // un clic sur une ligne montre la carte, recto et verso côte à côte, dans les deux sens
      z.querySelectorAll('.rev-ligne').forEach(b => b.addEventListener('click', () => {
        const c = app.cartes.find(x => x.id === b.dataset.carte), ap = document.getElementById('ap-' + c.id), ouvre = ap.hidden;
        if (ouvre && !ap.innerHTML) {
          ap.innerHTML = c.faces.map((f, s) => (c.faces.length > 1 ? `<p class="rev-sens-lab">Sens ${s + 1}${s ? ' : la révision suivante' : ''}</p>` : '') +
            face(c, s, 'recto', { pied: false }) + face(c, s, 'verso', { pied: false })).join('');
        }
        ap.hidden = !ouvre;
        b.setAttribute('aria-expanded', ouvre);
      }));
      z.querySelectorAll('[data-ajout]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.ajout;
        ajouter(d, [id]);
        ajoutes[id] = true;
        ouverts.add(id);
        majHaut();
        majPaquets();
        majSommaire(app);
        const l = zone.querySelector(`#${CSS.escape(id)} .rev-ajout a.btn-primary`);
        if (l) l.focus();
      }));
    }
    // ancre d'un paquet (#m2a) ou d'un module (#m2 : son premier paquet) : ouvert et amené à l'écran
    function ouvrirAncre() {
      const h = decodeURIComponent(location.hash.slice(1));
      if (!h) return;
      let el = document.getElementById(h);
      const m = /^m(\d+)$/.exec(h);
      if ((!el || !el.matches('details')) && m) el = zone.querySelector(`details[data-module="${m[1]}"]`);
      if (!el || !el.matches('details.rev-paquet')) return;
      el.open = true;
      ouverts.add(el.id);
      setTimeout(() => el.scrollIntoView({ block: 'start' }), 30);
    }

    /* ---------- Impression : A4 recto verso, 8 cartes par feuille, versos en miroir ---------- */
    function impression() {
      const html = document.documentElement;
      html.classList.add('rev-imprimer');
      const choix = app.paquets.map(p => `<label class="btn-small"><input type="checkbox" value="${p.id}" checked> Module ${p.module} · ${p.titre}</label>`).join('');
      zone.innerHTML = `
        <div class="er-card">
          <span class="er-badge">IMPRIMER LES CARTES</span>
          <h2 class="er-titre">${app.court} : cartes à imprimer</h2>
          <p class="er-contexte">Imprime en <b>recto verso</b> (retournement sur le <b>bord long</b>), sur papier épais si possible. Découpe en suivant les pointillés : <b>8 cartes</b> de 99 × 70 mm par feuille. Les versos sont placés en miroir pour tomber derrière leur recto.</p>
          <div class="rev-imp-choix" role="group" aria-label="Cours à imprimer" style="margin-top:12px">${choix}</div>
          <div class="er-actions"><button type="button" class="btn-primary" data-a="imprimer">Imprimer</button><button type="button" class="btn-secondary" data-a="retour">← Retour aux cartes</button></div>
        </div>
        <div class="rev-imp-defile"><div class="rev-feuilles"></div></div>`;
      const feuilles = zone.querySelector('.rev-feuilles');
      const ab = s => s.replace(/^Chapitre /, 'Ch. ');
      const tete = c => `<div class="rev-imp-tete"><span>${ab(app.court)} · Module ${c.paquet.module}</span><span>${TYPES[c.type] || c.type}${c.faces.length > 1 ? ' ⇄' : ''}</span></div>`;
      const carte = (c, cote) => (c ? `<div class="rev-imp-carte rev-imp-${cote}">${tete(c)}<div class="rev-imp-corps">${cote === 'recto' ? c.faces[0].q : c.faces[0].r}</div></div>` : '<div class="rev-imp-carte"></div>');
      function dessiner() {
        const ids = Array.from(zone.querySelectorAll('.rev-imp-choix input:checked')).map(i => i.value);
        const cartes = app.paquets.filter(p => ids.indexOf(p.id) >= 0).reduce((l, p) => l.concat(p.cartes), []);
        let h = '';
        for (let i = 0, f = 1; i < cartes.length; i += 8, f++) {
          const lot = cartes.slice(i, i + 8);
          const rectos = [0, 1, 2, 3, 4, 5, 6, 7].map(j => carte(lot[j], 'recto')).join('');
          // verso : colonnes échangées, pour que chaque réponse tombe derrière sa question (retournement sur le bord long)
          const versos = [1, 0, 3, 2, 5, 4, 7, 6].map(j => carte(lot[j], 'verso')).join('');
          h += `<div><p class="rev-imp-lab">Feuille ${f} · recto (questions)</p><div class="rev-feuille">${rectos}</div></div>` +
            `<div><p class="rev-imp-lab">Feuille ${f} · verso (réponses, en miroir)</p><div class="rev-feuille">${versos}</div></div>`;
        }
        feuilles.innerHTML = h;
        ajuster();
        zone.querySelector('[data-a="imprimer"]').disabled = !cartes.length;
      }
      dessiner();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajuster);
      zone.querySelector('.rev-imp-choix').addEventListener('change', dessiner);
      zone.querySelector('[data-a="imprimer"]').addEventListener('click', () => { ajuster(); window.print(); });
      zone.querySelector('[data-a="retour"]').addEventListener('click', () => {
        if (history.state && history.state.revImp) history.back();
        else { history.replaceState(null, '', location.pathname + location.search); router(); }
      });
    }
    // aucun contenu ne déborde : la police diminue si besoin
    function ajuster() {
      zone.querySelectorAll('.rev-imp-corps').forEach(c => {
        c.style.fontSize = '';
        let t = parseFloat(getComputedStyle(c).fontSize) * 0.75;       // px → pt
        let garde = 0;
        while (c.scrollHeight > c.clientHeight + 1 && t > 5.5 && garde++ < 40) { t -= 0.5; c.style.fontSize = t + 'pt'; }
      });
    }
    addEventListener('beforeprint', () => { if (ecran === 'imp') ajuster(); });
  }

  /* ---------- Export vers Anki : fichier .apkg de toutes les cartes de l'application
     (assets/anki.js, chargé au premier export) ---------- */
  function exporterAnki(app, ctx, bouton, info) {
    const echec = () => { info.textContent = 'L\'export n\'a pas pu se faire : recharge la page et réessaie.'; bouton.disabled = false; };
    bouton.disabled = true;
    info.hidden = false;
    info.textContent = 'Préparation du fichier…';
    function telecharger() {
      let octets;
      try { octets = window.ANKI.paquet(app); } catch (e) { echec(); return; }
      const nom = window.ANKI.nomFichier(app);
      const url = URL.createObjectURL(new Blob([octets], { type: 'application/octet-stream' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = nom;
      a.hidden = true;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      info.innerHTML = `<b>✓ ${nom}</b> téléchargé. Ouvre-le avec Anki (ou, dans Anki : Fichier › Importer).`;
      bouton.disabled = false;
    }
    if (window.ANKI) { telecharger(); return; }
    const s = document.createElement('script');
    s.src = ctx.racine + 'assets/anki.js';
    s.onload = () => { if (window.ANKI) telecharger(); else echec(); };
    s.onerror = echec;
    document.head.appendChild(s);
  }

  window.REV = {
    APPLIS, INTERVALLES, COURT, LONG, TYPES, LIMITES,
    paquets: declarer, lier, charger, chargerTout, app: d => DONNEES[d] || null,
    etat, lignes, ajouter, repondre, dues, parSeance, reglerParSeance,
    aujourdhui, plus, ecart, dans, jourCourt, texteQ,
    face, boite, jours, mini, compte, seance, portail, pageRevisions, pageApplication, accueil, finCours,
  };
})();
