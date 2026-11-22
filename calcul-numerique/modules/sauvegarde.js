/* ============================================================
   Calcul numérique — sauvegarde de la progression (objet CN.sauvegarde)
   (copie de modules/sauvegarde.js de l'application Équations en physique, adaptée :
   clés du test de positionnement et du défi en plus)
   (même fonctionnement que modules/sauvegarde.js de l'application Orthographe)
   ------------------------------------------------------------
   Rôle :
     - application installable sur l'écran d'accueil (PWA) : manifeste,
       service worker (sw.js), bouton « Installer l'application » ;
     - sauvegarde automatique : la progression est gardée dans le navigateur
       à chaque question (localStorage) ; on demande au navigateur de la
       protéger (navigator.storage.persist) pour qu'il ne l'efface pas de
       lui-même (accordé d'office à l'application installée) ;
     - copie de secours dans un fichier : « Enregistrer une copie »
       (iPhone : feuille de partage, « Enregistrer dans Fichiers » ;
       Android et ordinateur : Téléchargements) et « Restaurer une copie »
       (choix du fichier) ;
     - rappel toutes les 5 séances terminées depuis la dernière copie.
   Même format et mêmes règles de fusion que la sauvegarde du portail
   applications-physique (assets/progression.js) :
     fichier .html autonome, données dans <script type="application/json"
     id="progression">, lien « Reprendre ma progression » vers
     index.html#reprise=<données> (JSON → UTF-8 → base64url) ;
     paquet { v: 1, app: 'calcul-numerique', date: "<ISO>", donnees: { <clé>: <valeur> } } ;
     ouvrir une vieille copie n'efface jamais une progression plus récente.
     Une copie faite ici s'ouvre aussi depuis le portail (« Reprendre depuis un fichier »),
     et une copie du portail se restaure ici (seules les clés de cette application sont lues).
   Le service worker (sw.js) sert la copie hors ligne d'abord et se met à jour pour le lancement suivant.
   Chargé AVANT cn.js : une reprise par l'adresse (#reprise=) est écrite
   avant que cn.js ne lise le stockage.

   Stockage :
     calcul-numerique-progression, -reglages, -suivi, -decouverte, -test, -defi, -succes : enregistrés dans la copie
     calcul-numerique-sauvegarde  { n, seuil, derniere } : séances depuis la dernière copie,
                                   prochain rappel, date de la dernière copie (jamais copié,
                                   ni par la sauvegarde du portail)

   API :
     CN.carteSauvegarde()   zone dépliable « Sauvegarde » de l'accueil (élément)
     CN.ouvrirSauvegarde()  ouvre cette zone et l'amène à l'écran (lien du sommaire, index.html#sauvegarde)
     CN.apresSeance()       appelé par CN.enregistrer à chaque séance notée
     CN.sauvegarde : { enregistrer(), restaurer(), installer(), paquet(), importer(paquet), fichier(paquet) }
   ============================================================ */
(function () {
  'use strict';
  const CN = window.CN = window.CN || {};

  /* ---------- Réglages ---------- */
  const VERSION = 1;
  const RAPPEL = 5;                  // rappel toutes les 5 séances terminées
  const MAX_ANCRE = 200000;          // longueur maximale des données de #reprise=
  const MAX_FICHIER = 3000000;       // taille maximale du fichier choisi (octets)
  const MAX_ENTREES = 1000;
  const APP = 'calcul-numerique';
  const CLE_PROG = APP + '-progression', CLE_REG = APP + '-reglages',
    CLE_SUIVI = APP + '-suivi', CLE_DEC = APP + '-decouverte', CLE_TEST = APP + '-test', CLE_DEFI = APP + '-defi', CLE_SUC = APP + '-succes', CLE_SAUV = APP + '-sauvegarde', CLE_MSG = APP + '-message';
  const TYPES = { [CLE_PROG]: 'progression', [CLE_REG]: 'reglages', [CLE_SUIVI]: 'suivi', [CLE_DEC]: 'decouverte', [CLE_TEST]: 'test', [CLE_DEFI]: 'defi', [CLE_SUC]: 'succes' };

  // pages des modules dans modules/, accueil à la racine
  const RACINE = /\/modules\/[^/]*$/.test(location.pathname) ? '../' : '';
  const ACCUEIL = new URL(RACINE + 'index.html', location.href).href.replace(/#.*$/, '');
  const surLeWeb = /^https?:$/.test(location.protocol);

  /* ---------- Appareil ---------- */
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const firefox = /Firefox|FxiOS/.test(ua);
  const installee = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;

  /* ---------- Petits utilitaires ---------- */
  const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const estNombre = (v, min, max) => typeof v === 'number' && isFinite(v) && v >= min && v <= max;
  const entier = (v, min, max) => estNombre(v, min, max) && Math.floor(v) === v;
  const propre = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const cles = o => Object.keys(o);
  const copie = v => JSON.parse(JSON.stringify(v));
  const deux = n => (n < 10 ? '0' : '') + n;
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');
  const nomOk = k => typeof k === 'string' && /^[A-Za-z0-9_.-]{1,100}$/.test(k) && k !== '__proto__';
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateCourte = d => d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear();
  const dateLongue = d => dateCourte(d) + ' à ' + d.getHours() + ' h ' + deux(d.getMinutes());
  const nomFichier = d => 'calcul-numerique-progression-' + d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '.html';
  const echapper = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // le stockage, ou null s'il est indisponible (navigation privée, réglage du navigateur)
  function stockage() {
    try {
      const s = window.localStorage, essai = '__essai-calcul__';
      s.setItem(essai, '1'); s.removeItem(essai);
      return s;
    } catch (e) { return null; }
  }
  function lire(cle) { try { return JSON.parse(localStorage.getItem(cle)); } catch (e) { return null; } }
  function ecrire(cle, v) { try { localStorage.setItem(cle, JSON.stringify(v)); return true; } catch (e) { return false; } }

  // état de la sauvegarde : séances depuis la dernière copie, prochain rappel, date de la dernière copie
  function lireEtat() {
    const v = lire(CLE_SAUV), e = { n: 0, seuil: RAPPEL, derniere: null };
    if (estObjet(v)) {
      if (entier(v.n, 0, 1e6)) e.n = v.n;
      if (entier(v.seuil, 1, 1e6)) e.seuil = v.seuil;
      if (typeof v.derniere === 'string' && v.derniere.length <= 40 && !isNaN(Date.parse(v.derniere))) e.derniere = v.derniere;
    }
    return e;
  }
  const ecrireEtat = e => ecrire(CLE_SAUV, e);

  /* =====================================================================
     Forme attendue de chaque valeur (tout ce qui arrive d'un fichier est non fiable)
     strict : la moindre anomalie lève une erreur ; sinon, ce qui ne va pas est laissé de côté.
     ===================================================================== */
  function nettoyer(type, v, strict) {
    const ok = c => { if (!c && strict) throw new Error('forme inattendue'); return !!c; };
    switch (type) {
      // { derniere, pages: { <page>: { fait, note } } } (assets/sommaire.js)
      case 'progression': {
        if (!ok(estObjet(v))) return undefined;
        const r = {};
        cles(v).forEach(k => ok(k === 'derniere' || k === 'pages'));
        if (propre(v, 'derniere') && ok(nomOk(v.derniere))) r.derniere = v.derniere;
        if (propre(v, 'pages') && ok(estObjet(v.pages) && cles(v.pages).length <= MAX_ENTREES)) {
          r.pages = {};
          cles(v.pages).forEach(p => {
            const e = v.pages[p];
            if (!ok(nomOk(p) && estObjet(e))) return;
            const x = {};
            cles(e).forEach(k => ok(k === 'fait' || k === 'note'));
            if (propre(e, 'fait') && ok(typeof e.fait === 'boolean') && e.fait) x.fait = true;
            if (propre(e, 'note') && ok(estNombre(e.note, 0, 20))) x.note = e.note;
            if (x.fait || propre(x, 'note')) r.pages[p] = x;
          });
        }
        return r;
      }
      // { v: 1, r: { <compétence>: [[t, ok], …] }, notes: [[t, 's', note], …] } (modules/cn.js)
      case 'suivi': {
        if (!ok(estObjet(v))) return undefined;
        const r = { v: 1, r: {}, notes: [] };
        cles(v).forEach(k => ok(k === 'v' || k === 'r' || k === 'notes'));
        const date = t => entier(t, 1, 1e14);
        if (propre(v, 'r') && ok(estObjet(v.r) && cles(v.r).length <= 100)) {
          cles(v.r).forEach(id => {
            const l = v.r[id];
            if (!ok(/^[A-Z]{2}\d{1,2}$/.test(id) && Array.isArray(l) && l.length <= 200)) return;
            const x = l.filter(e => ok(Array.isArray(e) && e.length === 2 && date(e[0]) && [0, 0.5, 1].indexOf(e[1]) >= 0)).map(e => [e[0], e[1]]);
            if (x.length) r.r[id] = x;
          });
        }
        if (propre(v, 'notes') && ok(Array.isArray(v.notes) && v.notes.length <= MAX_ENTREES)) {
          v.notes.forEach(e => { if (ok(Array.isArray(e) && e.length === 3 && date(e[0]) && e[1] === 's' && estNombre(e[2], 0, 20))) r.notes.push([e[0], e[1], e[2]]); });
        }
        return r;
      }
      // étapes faites de la Découverte : { faits: [numéros] } (modules/cn.js)
      case 'decouverte': {
        if (!ok(estObjet(v) && Array.isArray(v.faits) && v.faits.length <= 100)) return undefined;
        return { faits: v.faits.filter(k => ok(entier(k, 0, 99))).filter((k, i, l) => l.indexOf(k) === i) };
      }
      // test de positionnement : { themes: { <thème>: date }, acquis: { <compétence>: date } } (modules/cn.js)
      case 'test': {
        if (!ok(estObjet(v))) return undefined;
        const r = { themes: {}, acquis: {} };
        cles(v).forEach(k => ok(k === 'themes' || k === 'acquis'));
        if (propre(v, 'themes') && ok(estObjet(v.themes))) cles(v.themes).forEach(k => { if (ok(['P', 'R', 'C'].indexOf(k) >= 0 && entier(v.themes[k], 1, 1e14))) r.themes[k] = v.themes[k]; });
        if (propre(v, 'acquis') && ok(estObjet(v.acquis) && cles(v.acquis).length <= 100)) cles(v.acquis).forEach(k => { if (ok(/^[A-Z]{2}\d{1,2}$/.test(k) && entier(v.acquis[k], 1, 1e14))) r.acquis[k] = v.acquis[k]; });
        return r;
      }
      // défi chrono : { n: défis terminés, meilleur: { j: justes, t: durée en dixièmes de seconde } } (modules/defi.js)
      case 'defi': {
        if (!ok(estObjet(v))) return undefined;
        const r = { n: 0 };
        cles(v).forEach(k => ok(k === 'n' || k === 'meilleur'));
        if (propre(v, 'n') && ok(entier(v.n, 0, 1e6))) r.n = v.n;
        if (propre(v, 'meilleur') && ok(estObjet(v.meilleur) && entier(v.meilleur.j, 0, 10) && entier(v.meilleur.t, 1, 1e6))) r.meilleur = { j: v.meilleur.j, t: v.meilleur.t };
        return r;
      }
      // succès (assets/succes.js) : { v: 1, c: { <compteur>: entier }, j: ['AAAA-MM-JJ', …], e: { <ensemble>: [id, …] }, o: { <succès>: [t1, t2, t3, t4] } }
      case 'succes': {
        if (!ok(estObjet(v))) return undefined;
        const r = { v: 1, c: {}, j: [], e: {}, o: {} };
        const ent = (x, min, max) => typeof x === 'number' && Math.floor(x) === x && x >= min && x <= max;
        cles(v).forEach(k => ok(['v', 'c', 'j', 'e', 'o'].indexOf(k) >= 0));
        if (propre(v, 'c') && ok(estObjet(v.c) && cles(v.c).length <= 200)) cles(v.c).forEach(k => { if (ok(nomOk(k) && ent(v.c[k], 0, 1e9))) r.c[k] = v.c[k]; });
        if (propre(v, 'j') && ok(Array.isArray(v.j) && v.j.length <= MAX_ENTREES)) v.j.forEach(x => { if (ok(typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)) && r.j.indexOf(x) < 0) r.j.push(x); });
        if (propre(v, 'e') && ok(estObjet(v.e) && cles(v.e).length <= 50)) {
          cles(v.e).forEach(k => {
            if (!ok(nomOk(k) && Array.isArray(v.e[k]) && v.e[k].length <= MAX_ENTREES)) return;
            r.e[k] = v.e[k].filter(x => ok(nomOk(x))).filter((x, i, l) => l.indexOf(x) === i);
          });
        }
        if (propre(v, 'o') && ok(estObjet(v.o) && cles(v.o).length <= 200)) {
          cles(v.o).forEach(k => { if (ok(nomOk(k) && Array.isArray(v.o[k]) && v.o[k].length === 4 && v.o[k].every(t => ent(t, 0, 1e14)))) r.o[k] = v.o[k].slice(); });
        }
        r.j.sort();
        return r;
      }
      // réglages de l'élève (modules/cn.js) : on ne garde que les champs connus, cn.js revérifie les valeurs
      case 'reglages': {
        if (!ok(estObjet(v))) return undefined;
        const r = {}, simple = x => ['string', 'number', 'boolean'].indexOf(typeof x) >= 0 && String(x).length <= 300;
        ['auto', 'theme', 'pave'].forEach(k => { if (propre(v, k) && simple(v[k])) r[k] = v[k]; });
        if (propre(v, 'comps') && estObjet(v.comps) && cles(v.comps).length <= 200) {
          r.comps = {};
          cles(v.comps).forEach(id => { if (/^[A-Z]{2}\d{1,2}$/.test(id) && v.comps[id] === true) r.comps[id] = true; });
        }
        return r;
      }
    }
    return undefined;
  }
  // la valeur contient-elle quelque chose ?
  function significatif(type, v) {
    if (!v) return false;
    if (type === 'progression') return !!v.pages && cles(v.pages).length > 0;
    if (type === 'suivi') return cles(v.r).length > 0 || v.notes.length > 0;
    if (type === 'decouverte') return v.faits.length > 0;
    if (type === 'test') return cles(v.themes).length > 0 || cles(v.acquis).length > 0;
    if (type === 'defi') return v.n > 0 || !!v.meilleur;
    if (type === 'succes') return cles(v.c).length > 0 || v.j.length > 0 || cles(v.o).length > 0;
    return cles(v).length > 0;
  }

  /* ---------- Fusion : ouvrir une vieille copie n'efface jamais une progression plus récente ----------
     a : valeur actuelle (brute, peut être absente) ; b : valeur de la copie (nettoyée).
     On part d'une copie de a sans jamais rien lui retirer ; rouvrir la même copie ne change plus rien. */
  function fusionner(type, a, b) {
    if (a === undefined || a === null) {
      if (type !== 'suivi') return copie(b);
      a = {};                     // suivi : même mise en forme (doublons retirés) qu'à la fusion suivante
    }
    switch (type) {
      case 'progression': {
        const r = estObjet(a) ? copie(a) : {};
        if (typeof r.derniere !== 'string' && b.derniere !== undefined) r.derniere = b.derniere;
        if (b.pages) {
          if (!estObjet(r.pages)) r.pages = {};
          cles(b.pages).forEach(p => {
            if (!estObjet(r.pages[p])) r.pages[p] = {};
            const x = r.pages[p], e = b.pages[p];
            if (e.fait && x.fait !== true) x.fait = true;                                                   // fait d'un côté ou de l'autre
            if (e.note !== undefined && !(typeof x.note === 'number' && x.note >= e.note)) x.note = e.note;   // la plus haute
          });
        }
        return r;
      }
      case 'suivi': {
        // réunion sans doublon (même date) ; les 30 dernières questions par compétence, les 100 dernières notes
        const r = estObjet(a) ? copie(a) : {};
        r.v = 1;
        if (!estObjet(r.r)) r.r = {};
        if (!Array.isArray(r.notes)) r.notes = [];
        const reunir = (x, y, max) => {
          const vu = {}, l = [];
          (Array.isArray(x) ? x : []).concat(y).forEach(e => { if (Array.isArray(e) && !vu[e[0]]) { vu[e[0]] = true; l.push(e); } });
          return l.sort((p, q) => p[0] - q[0]).slice(-max);
        };
        cles(b.r).forEach(id => { r.r[id] = reunir(r.r[id], b.r[id], 30); });
        r.notes = reunir(r.notes, b.notes, 100);
        return r;
      }
      case 'decouverte': {
        // réunion des étapes faites
        const f = estObjet(a) && Array.isArray(a.faits) ? a.faits.slice() : [];
        b.faits.forEach(k => { if (f.indexOf(k) < 0) f.push(k); });
        return { faits: f.sort((x, y) => x - y) };
      }
      case 'test': {
        // thèmes faits et compétences acquises : réunion (date la plus récente)
        const r = estObjet(a) ? copie(a) : {};
        ['themes', 'acquis'].forEach(k => {
          if (!estObjet(r[k])) r[k] = {};
          cles(b[k]).forEach(x => { if (!(typeof r[k][x] === 'number' && r[k][x] >= b[k][x])) r[k][x] = b[k][x]; });
        });
        return r;
      }
      case 'defi': {
        // le plus de défis terminés ; le meilleur défi (plus de réponses justes, puis le plus rapide)
        const r = estObjet(a) ? copie(a) : {};
        if (!(typeof r.n === 'number' && r.n >= b.n)) r.n = b.n;
        const m = r.meilleur, x = b.meilleur;
        if (x && !(estObjet(m) && (m.j > x.j || (m.j === x.j && m.t <= x.t)))) r.meilleur = { j: x.j, t: x.t };
        return r;
      }
      case 'succes': {
        // compteurs : le plus grand ; jours et ensembles : réunion ; niveaux : obtenus d'un côté ou de l'autre (date la plus ancienne)
        const r = estObjet(a) ? copie(a) : {};
        r.v = 1;
        ['c', 'e', 'o'].forEach(k => { if (!estObjet(r[k])) r[k] = {}; });
        if (!Array.isArray(r.j)) r.j = [];
        cles(b.c).forEach(k => { if (!(typeof r.c[k] === 'number' && r.c[k] >= b.c[k])) r.c[k] = b.c[k]; });
        b.j.forEach(x => { if (r.j.indexOf(x) < 0) r.j.push(x); });
        r.j.sort();
        if (r.j.length > 1000) r.j.splice(0, r.j.length - 1000);
        cles(b.e).forEach(k => {
          const l = r.e[k] = Array.isArray(r.e[k]) ? r.e[k] : [];
          b.e[k].forEach(x => { if (l.indexOf(x) < 0) l.push(x); });
        });
        cles(b.o).forEach(k => {
          const x = Array.isArray(r.o[k]) && r.o[k].length === 4 ? r.o[k] : [0, 0, 0, 0];
          r.o[k] = x.map((t, i) => { const u = b.o[k][i]; return t > 0 && u > 0 ? Math.min(t, u) : (t > 0 ? t : u); });
        });
        return r;
      }
      default: return a;          // réglages : on garde ceux de cet appareil
    }
  }

  /* ---------- Paquet à enregistrer ---------- */
  function paquet() {
    const s = stockage();
    if (!s) return null;
    const donnees = {};
    cles(TYPES).forEach(cle => {
      let v;
      try { v = JSON.parse(s.getItem(cle)); } catch (e) { return; }
      v = nettoyer(TYPES[cle], v, false);
      if (significatif(TYPES[cle], v)) donnees[cle] = v;
    });
    return { v: VERSION, app: APP, date: new Date().toISOString(), donnees };
  }
  const nbSeances = p => (p.donnees[CLE_SUIVI] ? p.donnees[CLE_SUIVI].notes.length : 0);
  const aDuContenu = p => !!(p.donnees[CLE_SUIVI] || p.donnees[CLE_PROG]);

  /* ---------- Fusion d'un paquet reçu (tout ou rien) ---------- */
  function importer(p) {
    const s = stockage();
    if (!s) return { etat: 'stockage' };
    const lu = [];
    try {
      if (!estObjet(p) || p.v !== VERSION || !estObjet(p.donnees)) throw new Error('paquet');
      if (propre(p, 'app') && p.app !== APP) throw new Error('autre application');
      if (propre(p, 'date') && !(typeof p.date === 'string' && p.date.length <= 40)) throw new Error('date');
      cles(p.donnees).forEach(cle => {
        if (!TYPES[cle]) return;                                   // clé étrangère : ni lue ni écrite
        const v = nettoyer(TYPES[cle], p.donnees[cle], true);
        if (significatif(TYPES[cle], v)) lu.push({ cle, type: TYPES[cle], valeur: v });
      });
      if (!lu.some(x => x.type !== 'reglages')) throw new Error('vide');
    } catch (e) { return { etat: 'abime' }; }
    const ecritures = [];
    lu.forEach(x => {
      const avantTexte = s.getItem(x.cle);
      let avant;
      try { avant = avantTexte === null ? undefined : JSON.parse(avantTexte); } catch (e) { avant = undefined; }
      const apresTexte = JSON.stringify(fusionner(x.type, avant, x.valeur));
      if (apresTexte !== avantTexte) ecritures.push({ cle: x.cle, avantTexte, apresTexte });
    });
    try {
      ecritures.forEach(e => s.setItem(e.cle, e.apresTexte));
    } catch (err) {
      // stockage plein ou refusé en cours de route : on remet tout comme avant
      ecritures.forEach(e => { try { if (e.avantTexte === null) s.removeItem(e.cle); else s.setItem(e.cle, e.avantTexte); } catch (x) { /* rien de plus à faire */ } });
      return { etat: 'stockage' };
    }
    // la copie restaurée compte comme la dernière copie (si elle est plus récente)
    const e = lireEtat(), d = Date.parse(p.date);
    if (!isNaN(d) && (!e.derniere || Date.parse(e.derniere) < d)) { e.derniere = new Date(d).toISOString(); e.n = 0; e.seuil = RAPPEL; ecrireEtat(e); }
    return { etat: ecritures.some(x => x.cle !== CLE_REG) ? 'ok' : 'rien', date: p.date };
  }

  /* ---------- Codage dans l'adresse : JSON → UTF-8 → base64url ---------- */
  function versBase64url(texte) {
    const octets = new TextEncoder().encode(texte);
    let bin = '';
    for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function depuisBase64url(t) {
    if (!/^[A-Za-z0-9_-]+$/.test(t)) throw new Error('caractères');
    let b = t.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b), octets = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(octets);
  }
  function depuisAncre(brut) {
    if (!stockage()) return { etat: 'stockage' };
    if (brut.length > MAX_ANCRE) return { etat: 'abime' };
    let p;
    try { p = JSON.parse(depuisBase64url(brut.indexOf('%') >= 0 ? decodeURIComponent(brut) : brut)); } catch (e) { return { etat: 'abime' }; }
    return importer(p);
  }
  // texte du fichier choisi : bloc <script id="progression">, sinon JSON seul, sinon le lien #reprise=
  function depuisFichier(texte) {
    if (!stockage()) return { etat: 'stockage' };
    let p = null;
    try {
      // DOMParser ne lance aucun script et ne charge rien
      const bloc = new DOMParser().parseFromString(texte, 'text/html').getElementById('progression');
      p = JSON.parse(bloc ? bloc.textContent : texte);
    } catch (e) { p = null; }
    if (p) return importer(p);
    const m = /#reprise=([A-Za-z0-9_-]+)/.exec(texte);
    return m ? depuisAncre(m[1]) : { etat: 'abime' };
  }

  /* ---------- Le fichier de la copie ----------
     Page HTML autonome : styles en ligne (couleurs de theme.css), aucune ressource extérieure,
     utile même sans script (vrai lien écrit en dur). Sur un ordinateur, l'ouvrir suffit à restaurer. */
  function fichier(p) {
    const json = JSON.stringify(p).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    const lien = ACCUEIL + '#reprise=' + versBase64url(JSON.stringify(p));
    const d = new Date(p.date), n = nbSeances(p);
    return '<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="robots" content="noindex">\n' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'">\n' +
      '<title>Ma progression en calcul numérique (' + echapper(dateCourte(d)) + ')</title>\n' +
      '<style>\n' +
      '  /* couleurs recopiées de assets/theme.css, police sans empattement du système */\n' +
      '  html { -webkit-text-size-adjust: 100%; }\n' +
      '  body { margin: 0; background: #f3f1ec; color: #16181d; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; }\n' +
      '  main { max-width: 36rem; margin: 0 auto; padding: 24px 16px 40px; }\n' +
      '  .carte { background: #ffffff; border: 1px solid #ebe8e2; border-radius: 22px; padding: 24px 22px; }\n' +
      '  h1 { margin: 0; font-size: 1.6rem; line-height: 1.15; letter-spacing: -.02em; }\n' +
      '  p { margin: 12px 0 0; }\n' +
      '  .date { margin-top: 6px; color: #55585f; }\n' +
      '  .bouton { display: block; margin-top: 18px; padding: 16px 24px; border-radius: 999px; background: #16181d; color: #ffffff;\n' +
      '    font-size: 1.1rem; font-weight: 700; text-align: center; text-decoration: none; }\n' +
      '  .bouton:focus-visible { outline: 2px solid #2952c8; outline-offset: 3px; }\n' +
      '  .aide { color: #55585f; font-size: .92rem; }\n' +
      '</style>\n</head>\n<body>\n<main>\n<div class="carte">\n' +
      '  <h1>Ma progression : calcul numérique</h1>\n' +
      '  <p class="date">Copie du ' + echapper(dateLongue(d)) + (n ? ' · ' + echapper(pluriel(n, 'séance')) : '') + '</p>\n' +
      '  <p><b>Sur un téléphone ou une tablette</b> : ouvre l’application Calcul numérique, ouvre « Sauvegarde » sur son accueil, touche « Restaurer une copie », puis choisis ce fichier.</p>\n' +
      '  <p><b>Sur un ordinateur</b> : touche le bouton (il faut être connecté à Internet).</p>\n' +
      '  <a class="bouton" id="reprendre" href="' + echapper(lien) + '">Reprendre ma progression</a>\n' +
      '  <p class="aide">Ouvrir une ancienne copie n’efface jamais une progression plus récente : on garde toujours ton meilleur résultat.</p>\n' +
      '</div>\n</main>\n' +
      '<script type="application/json" id="progression">' + json + '</script>\n' +
      // ordinateur : on part tout de suite vers l'application (pas sur un téléphone : la copie s'y restaure dans l'application)
      '<script>if (!/Android|iPhone|iPad|iPod/.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent))) location.replace(document.getElementById("reprendre").href);</script>\n' +
      '</body>\n</html>\n';
  }

  /* =====================================================================
     Application installable (PWA) et protection du stockage
     ===================================================================== */
  let invite = null;          // invitation d'installation (Chrome, Edge, Samsung Internet)
  let protegee = null;        // true : le navigateur n'effacera pas la progression de lui-même ; null : inconnu
  if (surLeWeb) {
    // le manifeste n'est lu que sur le site (une page ouverte depuis l'ordinateur ne peut pas le charger)
    const l = document.createElement('link');
    l.rel = 'manifest'; l.href = RACINE + 'manifest.webmanifest';
    document.head.appendChild(l);
    if ('serviceWorker' in navigator) addEventListener('load', () => { navigator.serviceWorker.register(RACINE + 'sw.js').catch(() => { /* hors ligne impossible : l'application marche quand même */ }); });
  }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); invite = e; majCarte(); });
  addEventListener('appinstalled', () => { invite = null; proteger(); });

  // demande de protection : accordée sans question à l'application installée (Chrome, Safari) ;
  // Firefox pose la question : on ne la pose qu'après un geste de l'élève (Enregistrer)
  function proteger() {
    const st = navigator.storage;
    if (!st || !st.persisted || !st.persist) return;
    st.persisted().then(p => p || st.persist()).then(p => { protegee = !!p; majCarte(); }, () => { /* refusé : rien à faire */ });
  }
  if (navigator.storage && navigator.storage.persisted) {
    navigator.storage.persisted().then(p => { protegee = p; if (!p && !firefox) proteger(); else majCarte(); }, () => { /* inconnu */ });
  }

  function installer() {
    if (invite) {
      const i = invite;
      invite = null;
      i.prompt();
      if (i.userChoice) i.userChoice.then(r => { if (r && r.outcome !== 'accepted') invite = i; majCarte(); }, () => { /* rien */ });
      majCarte();
      return;
    }
    // pas d'invitation (iPhone, Firefox…) : marche à suivre dans la carte
    aideInstall = !aideInstall;
    majCarte();
  }
  let aideInstall = false;

  /* =====================================================================
     Enregistrer une copie, restaurer une copie
     ===================================================================== */
  function marquerCopie() {
    const e = lireEtat();
    e.n = 0; e.seuil = RAPPEL; e.derniere = new Date().toISOString();
    ecrireEtat(e);
    fermerToast('rappel');
    majCarte();
  }
  function telecharger(f) {
    const url = URL.createObjectURL(f), a = document.createElement('a');
    a.href = url; a.download = f.name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  // ou : 'auto' (iPhone : partage ; ailleurs : Téléchargements) ou 'partage' (Drive, mail…)
  function enregistrer(ou) {
    if (firefox) proteger();
    const p = paquet();
    if (!p) { message('Ce navigateur ne garde pas ta progression (navigation privée ou réglage du navigateur) : il n’y a rien à enregistrer.'); return; }
    if (!aDuContenu(p)) { message('Tu n’as encore fait aucune séance sur cet appareil : il n’y a rien à enregistrer pour l’instant.'); return; }
    const f = new File([fichier(p)], nomFichier(new Date()), { type: 'text/html' });
    const partager = (ou === 'partage' || ios) && navigator.canShare && navigator.share && navigator.canShare({ files: [f] });
    if (partager) {
      // la feuille de partage doit s'ouvrir tout de suite après le geste de l'élève
      navigator.share({ files: [f], title: 'Ma progression en calcul numérique' }).then(() => {
        marquerCopie();
        message('Copie enregistrée. Garde-la : avec « Restaurer une copie », tu retrouves ta progression.', 'ok');
      }, err => {
        if (err && err.name === 'AbortError') return;          // partage annulé : rien n'est enregistré
        telecharger(f); marquerCopie();
        message(texteTelecharge(), 'ok');
      });
      return;
    }
    telecharger(f);
    marquerCopie();
    message(texteTelecharge(), 'ok');
  }
  const texteTelecharge = () => (ios ? 'Copie enregistrée : touche « Télécharger » si on te le demande. Elle va dans l’appli Fichiers, dossier Téléchargements.'
    : 'Copie enregistrée dans Téléchargements. Garde-la : avec « Restaurer une copie », tu retrouves ta progression.');

  function restaurer() {
    const champ = document.createElement('input');
    champ.type = 'file';
    champ.accept = '.html,.htm,text/html,.json,application/json';
    champ.style.display = 'none';
    champ.addEventListener('change', () => {
      const f = champ.files && champ.files[0];
      champ.remove();
      if (!f) return;
      if (f.size > MAX_FICHIER) { bilan({ etat: 'abime' }); return; }
      const r = new FileReader();
      r.onload = () => {
        const b = depuisFichier(String(r.result));
        if (b.etat === 'ok') {
          // eq.js a déjà lu le stockage : on recharge la page, le message suit
          try { sessionStorage.setItem(CLE_MSG, JSON.stringify(b)); } catch (e) { /* pas de message après rechargement */ }
          location.reload();
        } else bilan(b);
      };
      r.onerror = () => bilan({ etat: 'abime' });
      r.readAsText(f);
    });
    document.body.appendChild(champ);
    champ.click();
  }

  function bilan(b) {
    if (b.etat === 'ok') message('Progression restaurée' + (b.date && !isNaN(Date.parse(b.date)) ? ' (copie du ' + dateCourte(new Date(b.date)) + ')' : '') + '. Tes séances et ton suivi des compétences sont de retour.', 'ok');
    else if (b.etat === 'rien') message('Cette copie ne contient rien de plus que ce qui est déjà ici : tu étais au même niveau ou plus loin.');
    else if (b.etat === 'stockage') message('Ce navigateur ne peut pas garder ta progression (navigation privée ou réglage). Rien n’a changé.');
    else message('Ce fichier n’est pas une copie de ta progression en calcul numérique, ou il est abîmé. Rien n’a changé.');
  }

  /* =====================================================================
     Messages (bandeau en bas de l'écran) et rappel
     ===================================================================== */
  const toasts = {};
  function el(tag, cls, txt) { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function bouton(cls, txt, fn) { const b = el('button', cls, txt); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function fermerToast(id) { if (toasts[id]) { toasts[id].remove(); delete toasts[id]; } }
  function toast(id, texte, boutons, genre) {
    const montrer = () => {
      cles(toasts).forEach(fermerToast);           // un seul bandeau à la fois
      const t = el('div', 'sauv-toast' + (genre ? ' ' + genre : ''));
      t.setAttribute('role', id === 'rappel' ? 'alertdialog' : 'status');
      t.setAttribute('aria-live', 'polite');
      t.appendChild(el('p', '', texte));
      const r = el('div', 'sauv-toast-b');
      boutons.forEach(b => r.appendChild(b));
      t.appendChild(r);
      document.body.appendChild(t);
      toasts[id] = t;
    };
    if (document.body) montrer(); else addEventListener('DOMContentLoaded', montrer);
  }
  function message(texte, genre) {
    toast('message', texte, [bouton('btn-small', 'OK', () => fermerToast('message'))], genre);
    majCarte();
  }
  function rappel() {
    const e = lireEtat();
    if (e.n < e.seuil) return;
    const t = e.derniere ? 'Tu as fait ' + pluriel(e.n, 'séance') + ' depuis ta dernière copie. Enregistre ta progression pour ne pas la perdre.'
      : 'Tu as fait ' + pluriel(e.n, 'séance') + '. Enregistre une copie de ta progression pour ne pas la perdre.';
    toast('rappel', t, [
      bouton('btn-primary sauv-pt', 'Enregistrer une copie', () => enregistrer('auto')),
      bouton('btn-small', 'Plus tard', () => { const x = lireEtat(); x.seuil = x.n + RAPPEL; ecrireEtat(x); fermerToast('rappel'); majCarte(); })
    ], 'rappel');
  }
  // appelé par CN.enregistrer à chaque séance notée
  function apresSeance() {
    const e = lireEtat();
    e.n++;
    ecrireEtat(e);
    majCarte();
    if (e.n >= e.seuil) setTimeout(rappel, 1500);
  }

  /* =====================================================================
     Zone « Sauvegarde » de l'accueil (dépliable)
     Repliée : le titre et, s'il le faut, les alertes (progression non protégée,
     pas de copie depuis RAPPEL séances ou plus).
     ===================================================================== */
  let carte = null, carteT = null, carteC = null, carteOuverte = false;
  function carteSauvegarde() {
    carte = el('div', 'cn-zone sauv-carte');
    carte.id = 'sauvegarde';
    carteT = el('button', 'cn-zone-t');
    carteT.type = 'button';
    carteT.setAttribute('aria-controls', 'sauvegarde-c');
    carteT.addEventListener('click', () => { carteOuverte = !carteOuverte; majCarte(); });
    carteC = el('div', 'cn-zone-c');
    carteC.id = 'sauvegarde-c';
    carte.appendChild(carteT); carte.appendChild(carteC);
    majCarte();
    return carte;
  }
  // ouvre la zone « Sauvegarde » de l'accueil et l'amène à l'écran (lien « Sauvegarde » du sommaire)
  function ouvrirSauvegarde() {
    if (!carte) return;
    carteOuverte = true;
    majCarte();
    carte.scrollIntoView({ behavior: 'smooth', block: 'start' });
    carteT.focus({ preventScroll: true });
  }
  function majCarte() {
    if (!carte) return;
    const e = lireEtat(), s = stockage(), p = s ? paquet() : null, inst = installee();
    // en-tête : titre, alertes, chevron
    carteT.innerHTML = '';
    carteT.setAttribute('aria-expanded', String(carteOuverte));
    carteT.appendChild(el('span', 'cn-zone-nom', 'Sauvegarde'));
    const al = el('span', 'cn-zone-alertes');
    if (!s) al.appendChild(el('span', 'cn-zone-alerte', 'Non enregistrée'));
    else {
      if (!protegee) al.appendChild(el('span', 'cn-zone-alerte', 'Non protégée'));
      if (e.n >= RAPPEL) al.appendChild(el('span', 'cn-zone-alerte', pluriel(e.n, 'séance') + ' sans copie'));
    }
    if (al.childNodes.length) carteT.appendChild(al);
    carteT.appendChild(el('span', 'cn-zone-chev', '›')).setAttribute('aria-hidden', 'true');
    // contenu
    carteC.hidden = !carteOuverte;
    carteC.innerHTML = '';
    const l = el('ul', 'sauv-etat');
    const ligne = (t, cls) => l.appendChild(el('li', cls || '', t));
    if (!s) ligne('Ce navigateur ne garde pas ta progression (navigation privée ou réglage) : travaille dans une fenêtre normale.', 'alerte');
    else {
      ligne('Ta progression s’enregistre toute seule sur cet appareil, à chaque question.');
      if (protegee) ligne('Protégée : l’appareil ne l’effacera pas de lui-même.');
      else if (inst) ligne('Non protégée : l’appareil peut l’effacer s’il manque de place. Garde une copie.', 'alerte');
      else if (ios) ligne('Non protégée : dans Safari, elle est effacée si tu n’ouvres pas l’application pendant 7 jours. Installe l’application pour la protéger.', 'alerte');
      else ligne('Non protégée : le navigateur peut l’effacer (nettoyage, manque de place). Installe l’application pour la protéger.', 'alerte');
      const n = e.n, retard = n >= RAPPEL ? 'alerte' : '';
      if (e.derniere) ligne('Dernière copie : le ' + dateCourte(new Date(e.derniere)) + (n ? ' (' + pluriel(n, 'séance') + ' depuis)' : '') + '.', retard);
      else ligne('Aucune copie pour l’instant' + (p && aDuContenu(p) ? ' : enregistre-en une.' : '.'), retard);
    }
    carteC.appendChild(l);
    // boutons
    const r = el('div', 'sauv-boutons');
    r.appendChild(bouton((e.n >= e.seuil ? 'btn-primary' : 'btn-secondary') + ' sauv-pt', 'Enregistrer une copie', () => enregistrer('auto')));
    const envoyer = android && !firefox && !!navigator.canShare;
    if (envoyer) r.appendChild(bouton('btn-secondary sauv-pt', 'Envoyer (Drive, mail…)', () => enregistrer('partage')));
    r.appendChild(bouton('btn-secondary sauv-pt', 'Restaurer une copie', restaurer));
    const peutInstaller = surLeWeb && !inst && (invite || ios || android);
    if (peutInstaller) {
      const bi = bouton('btn-secondary sauv-pt', 'Installer l’application', installer);
      if (!invite) bi.setAttribute('aria-expanded', String(aideInstall));
      r.appendChild(bi);
    }
    carteC.appendChild(r);
    // marche à suivre pour installer (pas d'invitation du navigateur)
    if (peutInstaller && !invite && aideInstall) {
      const a = el('div', 'sauv-aide');
      if (ios) {
        a.appendChild(el('p', '', 'Dans Safari : touche le bouton Partager (le carré avec une flèche vers le haut), puis « Sur l’écran d’accueil », puis « Ajouter ».'));
        if (p && aDuContenu(p)) a.appendChild(el('p', '', 'Sur iPhone et iPad, l’application installée ne reprend pas ce que tu as fait dans Safari : enregistre d’abord une copie ici, puis, dans l’application, touche « Restaurer une copie ».'));
      } else a.appendChild(el('p', '', 'Ouvre le menu du navigateur (⋮), puis « Installer l’application » ou « Ajouter à l’écran d’accueil ».'));
      carteC.appendChild(a);
    }
    // où va la copie
    const ou = ios ? 'La copie : choisis « Enregistrer dans Fichiers », puis iCloud Drive. Pour la reprendre : « Restaurer une copie », puis le fichier le plus récent.'
      : android ? 'La copie va dans Téléchargements' + (envoyer ? ' (ou sur ton Drive avec « Envoyer »)' : '') + '. Pour la reprendre : « Restaurer une copie », puis le fichier le plus récent.'
        : 'La copie va dans Téléchargements. Pour la reprendre : ouvre-la, ou « Restaurer une copie ».';
    carteC.appendChild(el('p', 'cn-petit sauv-ou', ou));
  }

  /* =====================================================================
     Au chargement
     ===================================================================== */
  // reprise par l'adresse (copie ouverte sur un ordinateur) : écrite avant que eq.js ne lise le stockage
  const m = /^#reprise=(.*)$/.exec(location.hash);
  if (m) {
    const b = depuisAncre(m[1]);
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* l'ancre reste : sans effet */ }
    bilan(b);
  }
  // message laissé avant un rechargement (restauration depuis un fichier)
  try {
    const t = sessionStorage.getItem(CLE_MSG);
    if (t) { sessionStorage.removeItem(CLE_MSG); const b = JSON.parse(t); if (estObjet(b)) bilan({ etat: 'ok', date: typeof b.date === 'string' ? b.date : null }); }
  } catch (e) { /* pas de message */ }
  // rappel en attente (séances faites, pas de copie depuis)
  // arrivée par le lien « Sauvegarde » du sommaire (index.html#sauvegarde) : zone ouverte, ancre retirée
  addEventListener('DOMContentLoaded', () => {
    if (location.hash !== '#sauvegarde') return;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* l'ancre reste : sans effet */ }
    ouvrirSauvegarde();
  });
  addEventListener('DOMContentLoaded', () => { if (!toasts.message && /(^|\/)(index\.html)?$/.test(location.pathname)) rappel(); });

  Object.assign(CN, {
    carteSauvegarde, apresSeance, ouvrirSauvegarde,
    sauvegarde: { enregistrer, restaurer, installer, paquet, importer, fichier, depuisFichier }
  });
})();
