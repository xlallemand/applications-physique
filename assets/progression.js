/* ============================================================
   Enregistrer sa progression dans un fichier et la reprendre sur
   un autre appareil ou un autre navigateur (portail seulement,
   voir docs/charte-applications.md §5). Sans compte, sans serveur,
   sans service extérieur.

   Principe :
   - « Enregistrer ma progression » fabrique dans le navigateur le
     fichier progression-physique-chimie-AAAA-MM-JJ.html. Ouvert dans
     un navigateur, ce fichier ouvre aussitôt le portail avec la
     progression dans l'adresse : …/index.html#reprise=<données>.
   - Au chargement, le portail lit #reprise=, AJOUTE cette progression
     à celle du navigateur (on garde toujours le meilleur), retire
     l'ancre de l'adresse et affiche le résultat.
   - Reprise de secours : « Reprendre depuis un fichier » lit le
     fichier .html choisi (bloc <script id="progression">).
   Le passage par l'adresse est obligatoire : un fichier ouvert depuis
   l'ordinateur (file://) n'a pas accès au stockage du site.

   Données : { v: 1, date: "<ISO>", donnees: { <clé>: <valeur> } }
   en JSON, puis UTF-8, puis base64url, après #reprise=.
   Clés enregistrées : celles qui commencent par « <dossier>- » pour un
   dossier de la liste APPS du portail (préfixe le plus long), plus
   equamath_v2 (Équations du 1er degré). Les autres clés du navigateur
   (autres sites de la même adresse) ne sont ni enregistrées ni reprises.
   Tout ce qui arrive est non fiable : taille plafonnée, forme de chaque
   valeur vérifiée, aucun texte inséré en HTML (textContent seulement).

   API (objet PROG) :
     PROG.ouvrir()            fenêtre « Enregistrer ma progression »
     PROG.choisirFichier()    reprise de secours : choix du fichier .html
     PROG.detecter()          { os, nav, famille } de l'appareil actuel
     PROG.exporter()          { donnees, apps } ou null (stockage indisponible)
     PROG.importer(paquet)    fusionne { v, date, donnees } ; renvoie le bilan
                              { etat: 'ok' | 'rien' | 'abime' | 'stockage', maj, deja }
     PROG.fichier(paquet, apps)  texte HTML du fichier téléchargé
   Dépend du portail : ACC.APPS, ACC.niveau, ACC.rafraichir (avancement x/y après une reprise).
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Réglages ---------- */
  const VERSION = 1;
  const MAX_ANCRE = 200000;      // longueur maximale des données de #reprise= (caractères)
  const MAX_FICHIER = 3000000;   // taille maximale du fichier lu par la reprise de secours (octets)
  const MAX_CLES = 300;          // nombre maximal de clés dans un paquet
  const MAX_ENTREES = 1000;      // nombre maximal d'entrées dans une valeur (pages, exercices…)
  const MAX_INCONNUE = 50000;    // taille maximale (JSON) d'une valeur de forme inconnue
  const NOM_CLE = /^[A-Za-z0-9_-]{1,120}$/;
  const NOM_ID = /^[A-Za-z0-9_.-]{1,100}$/;     // nom de page, d'exercice, de module…
  const nomOk = k => typeof k === 'string' && NOM_ID.test(k) && k !== '__proto__';

  // adresse du portail au moment de l'enregistrement (marche aussi en test local)
  const ADRESSE = location.protocol + '//' + location.host + location.pathname;
  // la même, lisible par l'élève : xlallemand.github.io/applications-physique
  const SITE = (location.host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '') || ADRESSE;

  const APPS = (window.ACC && window.ACC.APPS) || [];
  // dossiers du plus long au plus court : le premier qui convient est le préfixe le plus long
  const DOSSIERS = APPS.map(a => a.dossier).sort((x, y) => y.length - x.length);
  const appDe = dossier => APPS.find(a => a.dossier === dossier);

  /* ---------- Petits utilitaires ---------- */
  const estObjet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const estNombre = (v, min, max) => typeof v === 'number' && isFinite(v) && v >= min && v <= max;
  const propre = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const cles = o => Object.keys(o);
  const copie = v => JSON.parse(JSON.stringify(v));
  const deux = n => (n < 10 ? '0' : '') + n;

  // Nom court d'une application : sans « Chapitre N : », avec le niveau si deux noms sont identiques
  const sansChapitre = t => t.replace(/^Chapitre \d+\s*:\s*/, '');
  function nomCourt(app) {
    const nom = sansChapitre(app.titre);
    if (!APPS.some(b => b !== app && sansChapitre(b.titre) === nom)) return nom;
    const niv = app.niv.map(n => (window.ACC && ACC.niveau(n) ? ACC.niveau(n).court : n));
    return nom + ' (' + niv.join(', ') + ')';
  }
  const listeNoms = apps => apps.map(nomCourt).join(', ');
  // résumé court : au-delà de 8 applications, les 6 premières puis « et N autres »
  const resumeNoms = apps => (apps.length > 8 ? listeNoms(apps.slice(0, 6)) + ' et ' + (apps.length - 6) + ' autres' : listeNoms(apps));
  const pluriel = (n, mot) => n + ' ' + mot + (n > 1 ? 's' : '');

  /* ---------- Quelles clés enregistrer ? ---------- */
  // { dossier, type } pour une clé à enregistrer, null sinon
  function typeDeCle(cle) {
    if (typeof cle !== 'string' || !NOM_CLE.test(cle)) return null;
    if (cle === 'equamath_v2') return appDe('equations-college') ? { dossier: 'equations-college', type: 'equamath' } : null;
    const dossier = DOSSIERS.find(d => cle.length > d.length + 1 && cle.slice(0, d.length + 1) === d + '-');
    if (!dossier) return null;
    const reste = cle.slice(dossier.length + 1);
    if (reste === 'progression') return { dossier, type: 'progression' };
    if (reste === 'exercices') return { dossier, type: 'exercices' };
    if (cle === 'combustions-exercices-faits') return { dossier, type: 'liste' };
    if (cle === 'principe-dynamique-atelier') return { dossier, type: 'atelier' };
    return { dossier, type: 'inconnue' };
  }

  /* ---------- Forme attendue de chaque valeur ----------
     Renvoie une copie propre de la valeur.
     strict (reprise) : la moindre anomalie lève une erreur ;
     sinon (enregistrement) : ce qui n'a pas la forme attendue est laissé de côté. */
  function nettoyer(type, v, strict) {
    const ok = condition => {
      if (!condition && strict) throw new Error('forme inattendue');
      return !!condition;
    };
    switch (type) {
      // { derniere, pages: { <page>: { fait, note } } }
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
      // { <id>: { pts, max } }
      case 'exercices': {
        if (!ok(estObjet(v) && cles(v).length <= MAX_ENTREES)) return undefined;
        const r = {};
        cles(v).forEach(id => {
          const e = v[id];
          if (ok(nomOk(id) && estObjet(e) && cles(e).every(k => k === 'pts' || k === 'max') &&
                 estNombre(e.pts, 0, 10000) && estNombre(e.max, 0, 10000))) r[id] = { pts: e.pts, max: e.max };
        });
        return r;
      }
      // [ indices des exercices déjà tirés ]
      case 'liste': {
        if (!ok(Array.isArray(v) && v.length <= MAX_ENTREES)) return undefined;
        return v.filter(n => ok(typeof n === 'number' && Math.floor(n) === n && n >= 0 && n <= 10000));
      }
      // { <id>: true }
      case 'atelier': {
        if (!ok(estObjet(v) && cles(v).length <= MAX_ENTREES)) return undefined;
        const r = {};
        cles(v).forEach(id => { if (ok(nomOk(id) && v[id] === true)) r[id] = true; });
        return r;
      }
      // { xp, results: { <module>: { score, bestScore, xp, attempts } }, showKb }
      case 'equamath': {
        if (!ok(estObjet(v))) return undefined;
        const r = {};
        cles(v).forEach(k => ok(k === 'xp' || k === 'results' || k === 'showKb'));
        if (propre(v, 'xp') && ok(estNombre(v.xp, 0, 1e9))) r.xp = v.xp;
        if (propre(v, 'showKb') && ok(typeof v.showKb === 'boolean')) r.showKb = v.showKb;
        if (propre(v, 'results') && ok(estObjet(v.results) && cles(v.results).length <= MAX_ENTREES)) {
          r.results = {};
          cles(v.results).forEach(m => {
            const e = v.results[m];
            if (ok(/^\d{1,4}$/.test(m) && estObjet(e) &&
                   cles(e).every(k => ['score', 'bestScore', 'xp', 'attempts'].indexOf(k) >= 0) &&
                   estNombre(e.score, 0, 20) && estNombre(e.bestScore, 0, 20) && estNombre(e.xp, 0, 1e9) &&
                   estNombre(e.attempts, 0, 1e6) && Math.floor(e.attempts) === e.attempts)) {
              r.results[m] = { score: e.score, bestScore: e.bestScore, xp: e.xp, attempts: e.attempts };
            }
          });
        }
        return r;
      }
      // clé d'une application, de forme inconnue : seule la taille est vérifiée
      default: {
        let t = null;
        try { t = JSON.stringify(v); } catch (e) { t = null; }
        if (!ok(typeof t === 'string' && t.length <= MAX_INCONNUE)) return undefined;
        return JSON.parse(t);
      }
    }
  }

  // La valeur contient-elle une vraie progression (pas seulement la dernière page ouverte) ?
  function significatif(type, v) {
    if (v === undefined || v === null) return false;
    switch (type) {
      case 'progression': return !!v.pages && cles(v.pages).length > 0;
      case 'liste': return v.length > 0;
      case 'equamath': return v.xp > 0 || (!!v.results && cles(v.results).length > 0);
      case 'inconnue': return v !== '' && v !== false && !(Array.isArray(v) && !v.length) && !(estObjet(v) && !cles(v).length);
      default: return cles(v).length > 0;      // exercices, atelier
    }
  }

  /* ---------- Fusion : « ouvrir un vieux fichier n'écrase jamais une progression plus récente » ----------
     a : valeur actuelle du navigateur (brute, peut être absente ou abîmée)
     b : valeur du fichier (déjà nettoyée)
     On part toujours d'une copie de a et on ne lui retire jamais rien ; le résultat
     est le même si on rouvre le même fichier plusieurs fois. */
  function fusionner(type, a, b) {
    if (a === undefined) return copie(b);
    switch (type) {
      case 'progression': {
        const r = estObjet(a) ? copie(a) : {};
        // dernière page ouverte : celle du navigateur si elle existe
        if (typeof r.derniere !== 'string' && b.derniere !== undefined) r.derniere = b.derniere;
        if (b.pages) {
          if (!estObjet(r.pages)) r.pages = {};
          cles(b.pages).forEach(p => {
            if (!estObjet(r.pages[p])) r.pages[p] = {};
            const x = r.pages[p], e = b.pages[p];
            if (e.fait && x.fait !== true) x.fait = true;                                       // fait d'un côté ou de l'autre
            if (e.note !== undefined && !(typeof x.note === 'number' && x.note >= e.note)) x.note = e.note;   // la plus haute
          });
        }
        return r;
      }
      case 'exercices': {
        // le meilleur résultat : pts / max le plus haut (à égalité, celui du navigateur)
        const r = estObjet(a) ? copie(a) : {};
        const taux = e => (estObjet(e) && typeof e.pts === 'number' && typeof e.max === 'number' ? (e.max > 0 ? e.pts / e.max : 0) : -1);
        cles(b).forEach(id => { if (taux(b[id]) > taux(r[id])) r[id] = copie(b[id]); });
        return r;
      }
      case 'liste': {
        // réunion des deux listes, sans doublon
        const r = Array.isArray(a) ? a.slice() : [];
        b.forEach(n => { if (r.indexOf(n) < 0) r.push(n); });
        return r;
      }
      case 'atelier': {
        const r = estObjet(a) ? copie(a) : {};
        cles(b).forEach(id => { r[id] = true; });
        return r;
      }
      case 'equamath': {
        const r = estObjet(a) ? copie(a) : {};
        if (b.xp !== undefined && !(typeof r.xp === 'number' && r.xp >= b.xp)) r.xp = b.xp;   // xp le plus grand ; showKb : celui du navigateur
        if (b.results) {
          if (!estObjet(r.results)) r.results = {};
          cles(b.results).forEach(m => {
            const x = r.results[m], e = b.results[m];
            const xOk = estObjet(x) && typeof x.bestScore === 'number';
            const essais = Math.max(e.attempts, xOk && typeof x.attempts === 'number' ? x.attempts : 0);
            // l'entrée au meilleur bestScore, avec le plus grand nombre de tentatives
            if (!xOk || e.bestScore > x.bestScore) r.results[m] = { score: e.score, bestScore: e.bestScore, xp: e.xp, attempts: essais };
            else if (x.attempts !== essais) x.attempts = essais;
          });
        }
        return r;
      }
      default: return a;          // clé inconnue déjà présente : on garde celle du navigateur
    }
  }

  /* ---------- Stockage du navigateur ---------- */
  // le stockage, ou null s'il est indisponible (navigation privée, réglage du navigateur)
  function stockage() {
    try {
      const s = window.localStorage, essai = '__essai-progression__';
      s.setItem(essai, '1');
      s.removeItem(essai);
      return s;
    } catch (e) { return null; }
  }

  // Progression enregistrable de ce navigateur : { donnees, apps } (apps dans l'ordre du portail)
  function exporter() {
    const s = stockage();
    if (!s) return null;
    const trouvees = [];
    for (let i = 0; i < s.length; i++) trouvees.push(s.key(i));
    const donnees = {}, dossiers = {};
    trouvees.sort().forEach(cle => {
      const t = typeDeCle(cle);
      if (!t) return;
      let v;
      try { v = JSON.parse(s.getItem(cle)); } catch (e) { return; }
      v = nettoyer(t.type, v, false);
      if (!significatif(t.type, v)) return;
      donnees[cle] = v;
      dossiers[t.dossier] = true;
    });
    return { donnees, apps: APPS.filter(a => dossiers[a.dossier]) };
  }

  // Lit un paquet reçu (non fiable) : liste des valeurs à fusionner, ou erreur
  function lirePaquet(paquet) {
    if (!estObjet(paquet) || paquet.v !== VERSION || !estObjet(paquet.donnees)) throw new Error('paquet');
    if (propre(paquet, 'date') && !(typeof paquet.date === 'string' && paquet.date.length <= 40)) throw new Error('date');
    const liste = cles(paquet.donnees);
    if (liste.length > MAX_CLES) throw new Error('trop de clés');
    const lu = [];
    liste.forEach(cle => {
      const t = typeDeCle(cle);
      if (!t) return;                                   // clé étrangère : ni lue ni écrite
      const valeur = nettoyer(t.type, paquet.donnees[cle], true);
      if (significatif(t.type, valeur)) lu.push({ cle, type: t.type, dossier: t.dossier, valeur });
    });
    if (!lu.length) throw new Error('vide');
    return lu;
  }

  // Fusionne un paquet dans le navigateur. Tout ou rien : en cas d'erreur, rien n'est modifié.
  function importer(paquet) {
    const s = stockage();
    if (!s) return { etat: 'stockage' };
    let lu;
    try { lu = lirePaquet(paquet); } catch (e) { return { etat: 'abime' }; }
    const ecritures = [], maj = {}, vues = {};
    lu.forEach(x => {
      const avantTexte = s.getItem(x.cle);
      let avant;
      try { avant = avantTexte === null ? undefined : JSON.parse(avantTexte); } catch (e) { avant = undefined; }
      const apresTexte = JSON.stringify(fusionner(x.type, avant, x.valeur));
      vues[x.dossier] = true;
      if (apresTexte !== avantTexte) { ecritures.push({ cle: x.cle, avantTexte, apresTexte }); maj[x.dossier] = true; }
    });
    try {
      ecritures.forEach(e => s.setItem(e.cle, e.apresTexte));
    } catch (err) {
      // stockage plein ou refusé en cours de route : on remet tout comme avant
      ecritures.forEach(e => {
        try { if (e.avantTexte === null) s.removeItem(e.cle); else s.setItem(e.cle, e.avantTexte); } catch (x) { /* rien de plus à faire */ }
      });
      return { etat: 'stockage' };
    }
    return {
      etat: ecritures.length ? 'ok' : 'rien',
      maj: APPS.filter(a => maj[a.dossier]),
      deja: APPS.filter(a => vues[a.dossier] && !maj[a.dossier])
    };
  }

  /* ---------- Codage dans l'adresse : JSON → UTF-8 → base64url ---------- */
  function versBase64url(texte) {
    const octets = new TextEncoder().encode(texte);
    let bin = '';
    for (let i = 0; i < octets.length; i += 0x8000) bin += String.fromCharCode.apply(null, octets.subarray(i, i + 0x8000));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function depuisBase64url(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('caractères');
    let b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    const bin = atob(b), octets = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) octets[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: true }).decode(octets);
  }

  // Données de #reprise= (ou du lien du fichier) → bilan de la fusion
  function depuisAncre(brut) {
    if (!stockage()) return { etat: 'stockage' };
    if (brut.length > MAX_ANCRE) return { etat: 'abime' };
    let paquet;
    try {
      if (brut.indexOf('%') >= 0) brut = decodeURIComponent(brut);
      paquet = JSON.parse(depuisBase64url(brut));
    } catch (e) { return { etat: 'abime' }; }
    return importer(paquet);
  }

  // Texte du fichier .html (reprise de secours) → bilan de la fusion
  function depuisFichier(texte) {
    if (!stockage()) return { etat: 'stockage' };
    let paquet = null;
    try {
      // DOMParser ne lance aucun script et ne charge rien
      const bloc = new DOMParser().parseFromString(texte, 'text/html').getElementById('progression');
      if (bloc) paquet = JSON.parse(bloc.textContent);
    } catch (e) { paquet = null; }
    if (paquet) return importer(paquet);
    // sinon, les données du lien « Reprendre ma progression »
    const m = /#reprise=([A-Za-z0-9_-]+)/.exec(texte);
    return m ? depuisAncre(m[1]) : { etat: 'abime' };
  }

  /* ---------- Le fichier téléchargé ---------- */
  const echapper = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const dateLongue = d => d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear() + ' à ' + d.getHours() + ' h ' + deux(d.getMinutes());
  const nomFichier = d => 'progression-physique-chimie-' + d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()) + '.html';

  // Page HTML autonome : styles en ligne (couleurs de theme.css), aucune ressource extérieure,
  // utile même sans script (vrai lien écrit en dur).
  function fichier(paquet, apps) {
    const json = JSON.stringify(paquet).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    const lien = ADRESSE + '#reprise=' + versBase64url(JSON.stringify(paquet));
    const d = new Date(paquet.date);
    return '<!DOCTYPE html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
      '<meta name="robots" content="noindex">\n' +
      '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'">\n' +
      '<title>Ma progression en Physique-Chimie (' + echapper(d.getDate() + ' ' + MOIS[d.getMonth()] + ' ' + d.getFullYear()) + ')</title>\n' +
      '<style>\n' +
      '  /* couleurs recopiées de assets/theme.css, police sans empattement du système */\n' +
      '  html { -webkit-text-size-adjust: 100%; }\n' +
      '  body { margin: 0; background: #f3f1ec; color: #16181d; font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5; }\n' +
      '  main { max-width: 36rem; margin: 0 auto; padding: 24px 16px 40px; }\n' +
      '  .carte { background: #ffffff; border: 1px solid #ebe8e2; border-radius: 22px; padding: 24px 22px; }\n' +
      '  h1 { margin: 0; font-size: 1.6rem; line-height: 1.15; letter-spacing: -.02em; }\n' +
      '  h2 { margin: 26px 0 6px; font-size: 1.05rem; letter-spacing: -.02em; }\n' +
      '  p { margin: 12px 0 0; }\n' +
      '  .date { margin-top: 6px; color: #55585f; }\n' +
      '  .bouton { display: block; margin-top: 18px; padding: 16px 24px; border-radius: 999px; background: #16181d; color: #ffffff;\n' +
      '    font-size: 1.1rem; font-weight: 700; text-align: center; text-decoration: none; }\n' +
      '  .bouton:focus-visible { outline: 2px solid #2952c8; outline-offset: 3px; }\n' +
      '  ul { margin: 0; padding-left: 1.2em; color: #55585f; }\n' +
      '  .aide { color: #55585f; font-size: .92rem; }\n' +
      '</style>\n</head>\n<body>\n<main>\n<div class="carte">\n' +
      '  <h1>Ma progression en Physique-Chimie</h1>\n' +
      '  <p class="date">Enregistrée le ' + echapper(dateLongue(d)) + '</p>\n' +
      '  <p>Ouverture du site… Si rien ne se passe, touche le bouton.</p>\n' +
      '  <a class="bouton" id="reprendre" href="' + echapper(lien) + '">Reprendre ma progression</a>\n' +
      '  <p>Il faut être connecté à Internet.</p>\n' +
      '  <p>Ta progression est ajoutée au navigateur qui ouvre ce fichier : ouvre-le avec celui où tu travailles.</p>\n' +
      '  <h2>' + echapper(pluriel(apps.length, 'application')) + '</h2>\n' +
      '  <ul>' + apps.map(a => '<li>' + echapper(nomCourt(a)) + '</li>').join('') + '</ul>\n' +
      '  <p class="aide">Si le bouton ne marche pas : va sur ' + echapper(SITE) + ', touche « Reprendre depuis un fichier », puis choisis ce fichier.</p>\n' +
      '</div>\n</main>\n' +
      '<script type="application/json" id="progression">' + json + '</script>\n' +
      '<script>location.replace(document.getElementById("reprendre").href);</script>\n' +
      '</body>\n</html>\n';
  }

  /* ---------- Appareil et navigateur actuels ---------- */
  const NOMS_NAV = { chrome: 'Chrome', edge: 'Edge', firefox: 'Firefox', safari: 'Safari', samsung: 'Samsung Internet', opera: 'Opera' };
  // os : windows, mac, linux, chromeos, android, iphone, ipad (null si inconnu)
  // nav : chrome, edge, firefox, safari, samsung, opera (null : autre ou inconnu)
  // famille : ordi, android, apple (null si inconnu)
  function detecter() {
    const ua = navigator.userAgent || '';
    const uad = navigator.userAgentData;
    let os = null, nav = null;

    // Système : navigator.userAgentData quand il le donne, sinon navigator.userAgent
    const PLATEFORMES = { 'Windows': 'windows', 'macOS': 'mac', 'Linux': 'linux', 'Chrome OS': 'chromeos', 'ChromeOS': 'chromeos',
      'Chromium OS': 'chromeos', 'Android': 'android', 'iOS': 'iphone' };
    const plateforme = uad && typeof uad.platform === 'string' ? uad.platform : '';
    if (PLATEFORMES[plateforme]) os = PLATEFORMES[plateforme];
    else if (/iPad/.test(ua)) os = 'ipad';
    else if (/iPhone|iPod/.test(ua)) os = 'iphone';
    else if (/Android/.test(ua)) os = 'android';
    else if (/CrOS/.test(ua)) os = 'chromeos';
    else if (/Windows/.test(ua)) os = 'windows';
    else if (/Macintosh|Mac OS X/.test(ua)) os = 'mac';
    else if (/Linux|X11/.test(ua)) os = 'linux';
    if (os === 'iphone' && /iPad/.test(ua)) os = 'ipad';
    // un iPad se présente comme un Mac : un Mac à écran tactile est un iPad
    if (os === 'mac' && navigator.maxTouchPoints > 1) os = 'ipad';

    // Navigateur
    const marques = uad && Array.isArray(uad.brands) ? uad.brands.map(b => b.brand) : [];
    const marque = n => marques.indexOf(n) >= 0;
    if (/; wv\)|FBAN|FBAV|Instagram|Snapchat|Line\/|MiuiBrowser|HuaweiBrowser|YaBrowser|Vivaldi|UCBrowser|DuckDuckGo|Brave|Silk\//.test(ua) || navigator.brave) {
      nav = null;                                                   // navigateur d'une appli, ou peu courant
    } else if (marques.length) {
      if (marque('Microsoft Edge')) nav = 'edge';
      else if (marque('Opera') || marque('Opera GX')) nav = 'opera';
      else if (marque('Samsung Internet')) nav = 'samsung';
      else if (marque('Google Chrome')) nav = 'chrome';
      // autre navigateur construit sur Chromium : on ne le nomme pas
    } else if (/Edge?\/|EdgA\/|EdgiOS\//.test(ua)) nav = 'edge';
    else if (/OPR\/|OPT\/|Opera/.test(ua)) nav = 'opera';
    else if (/SamsungBrowser\//.test(ua)) nav = 'samsung';
    else if (/Firefox\/|FxiOS\//.test(ua)) nav = 'firefox';
    else if (/CriOS\//.test(ua)) nav = 'chrome';
    else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) nav = 'chrome';
    else if (/Version\/[\d.]+.*Safari\//.test(ua)) nav = 'safari';

    const famille = os === 'android' ? 'android' : (os === 'iphone' || os === 'ipad') ? 'apple' : os ? 'ordi' : null;
    return { os, nav, famille };
  }
  const nomNav = env => NOMS_NAV[env.nav] || null;

  /* ---------- Construction de la fenêtre (jamais de innerHTML) ---------- */
  // « **mot** » devient <b>mot</b> ; tout le reste reste du texte.
  // Espaces insécables dans « … » et devant : et ? (pas de guillemet seul en bout de ligne)
  const insecables = t => t.replace(/« /g, '«\u00a0').replace(/ (»|:|\?)/g, '\u00a0$1');
  function texteRiche(t) {
    return insecables(String(t)).split('**').map((morceau, i) => {
      if (!(i % 2)) return document.createTextNode(morceau);
      const b = document.createElement('b');
      b.textContent = morceau;
      return b;
    });
  }
  function ajouter(n, enfants) {
    enfants.forEach(e => {
      if (e === null || e === undefined || e === false) return;
      if (Array.isArray(e)) ajouter(n, e);
      else if (typeof e === 'string') texteRiche(e).forEach(x => n.appendChild(x));
      else n.appendChild(e);
    });
  }
  function el(balise, attributs, ...enfants) {
    const n = document.createElement(balise);
    if (attributs) cles(attributs).forEach(k => {
      const v = attributs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    ajouter(n, enfants);
    return n;
  }
  const liste = (lignes, balise) => el(balise || 'ul', { class: 'prog-liste' }, lignes.map(l => el('li', null, l)));
  const depliant = lignes => el('details', { class: 'prog-depliant' }, el('summary', null, 'Ça ne marche pas ?'), liste(lignes));

  /* ---------- Marche à suivre (textes) ---------- */
  const CHOIX = [
    { id: 'ici', titre: 'Sur cet appareil, plus tard', detail: 'Si l\'historique est effacé, ou dans un autre navigateur' },
    { id: 'ordi', titre: 'Sur un ordinateur', detail: 'Windows, Mac, Linux, Chromebook' },
    { id: 'android', titre: 'Sur un téléphone ou une tablette Android' },
    { id: 'apple', titre: 'Sur un iPhone ou un iPad' }
  ];
  const appareilApple = env => (env.os === 'ipad' ? 'iPad' : 'iPhone');

  // Bloc « Retrouver ton fichier ici » : selon l'appareil et le navigateur actuels
  function lignesRetrouver(env) {
    const N = nomNav(env), L = [];
    const dossier = 'Il est dans le dossier « **Téléchargements** ».';
    if (env.famille === 'ordi') {
      if (env.os === 'chromeos') L.push('Il est dans l\'appli « **Fichiers** », dossier « **Téléchargements** ».');
      else if (env.nav === 'chrome' || env.nav === 'edge') L.push(dossier + ' Pour le voir, clique sur l\'icône de téléchargement (flèche vers le bas) en haut à droite de ' + N + ', puis sur l\'icône de dossier à côté du fichier.');
      else if (env.nav === 'firefox') L.push(dossier + ' Pour le voir, clique sur la flèche de téléchargement en haut à droite de Firefox, puis sur l\'icône de dossier à côté du fichier.');
      else if (env.nav === 'safari') L.push(dossier + ' Pour le voir, clique sur le bouton de téléchargement (flèche vers le bas) en haut à droite de Safari, puis sur la loupe à côté du fichier.');
      else L.push('Il est en général dans le dossier « **Téléchargements** ». La liste des téléchargements de ' + (N || 'ton navigateur') + ' le montre aussi.');
      L.push('Si le navigateur te demande où enregistrer le fichier, choisis un endroit que tu retrouveras (clé USB, Bureau).');
      L.push('Sur un ordinateur du lycée, le dossier « Téléchargements » peut être vidé quand tu te déconnectes : copie le fichier sur ta clé USB ou dans ton espace de l\'ENT avant de partir.');
      if (env.nav === 'chrome' || env.nav === 'edge') L.push('Si ' + N + ' signale un fichier dangereux, choisis « **Conserver** » : le fichier ne contient que ta progression.');
    } else if (env.famille === 'android') {
      L.push('Une notification « **Téléchargement terminé** » apparaît.');
      L.push('Le fichier est dans l\'appli « **Fichiers** » (« **Mes fichiers** » sur Samsung), dossier « **Téléchargements** » (parfois « **Download** »).');
      if (env.nav === 'chrome' || env.nav === 'firefox') L.push('Dans ' + N + ', tu le retrouves aussi par le menu ⋮ › « **Téléchargements** ».');
      if (env.nav === 'samsung') L.push('Dans Samsung Internet, tu le retrouves aussi par le menu ≡ › « **Téléchargements** ».');
    } else if (env.famille === 'apple') {
      const ou = '« **Fichiers** », dossier « **Téléchargements** » (dans « iCloud Drive » ou « Sur mon ' + appareilApple(env) + ' »)';
      if (env.nav === 'safari') L.push('Safari te demande si tu veux télécharger le fichier : touche « **Télécharger** ».', 'Le fichier va dans l\'appli ' + ou + '.');
      else if (env.nav === 'chrome') L.push('Chrome affiche une barre en bas de l\'écran : touche « **Ouvrir dans…** », puis « **Enregistrer dans Fichiers** ».', 'Choisis l\'appli ' + ou + '.');
      else L.push('Enregistre-le dans l\'appli ' + ou + '.');
    } else {
      L.push('Il est en général dans le dossier « **Téléchargements** ». La liste des téléchargements de ' + (N || 'ton navigateur') + ' le montre aussi.');
    }
    return L;
  }

  // Bloc « L'envoyer sur l'autre appareil »
  function lignesEnvoyer(env, cible) {
    const L = [], ordi = env.famille === 'ordi' || !env.famille;
    if (ordi && cible === 'ordi') L.push('Une **clé USB** : copie le fichier dessus, puis branche-la sur l\'autre ordinateur.');
    L.push('Ton **espace de stockage de l\'ENT**, **Google Drive**, **OneDrive** ou **iCloud Drive** : dépose le fichier. Sur l\'autre appareil, **télécharge-le** avant de l\'ouvrir : l\'aperçu de ces sites affiche du code ou une page vide, et ne restaure rien.');
    L.push('Un **mail à toi-même**, avec le fichier en pièce jointe. Sur l\'autre appareil, télécharge la pièce jointe avant de l\'ouvrir. Certaines messageries refusent ou signalent les fichiers « .html » : si c\'est refusé, ' +
      (ordi ? 'mets-le dans un dossier compressé (.zip) ou choisis une autre solution.' : 'choisis une autre solution.'));
    if ((env.os === 'mac' || env.famille === 'apple') && (cible === 'apple' || cible === 'ordi')) L.push('**AirDrop**, entre deux appareils Apple (iPhone, iPad, Mac).');
    if ((env.famille === 'android' && (cible === 'android' || cible === 'ordi')) || ((env.os === 'windows' || env.os === 'chromeos') && cible === 'android')) {
      L.push('**Quick Share** (anciennement « Partage à proximité »), entre un appareil Android et un autre appareil Android, un PC Windows ou un Chromebook.');
    }
    if (env.os === 'windows' && cible === 'ordi') L.push('Le **Partage de proximité** de Windows, entre deux PC Windows proches l\'un de l\'autre.');
    return L;
  }

  // Bloc « L'ouvrir » : selon l'appareil où l'élève reprendra (famille), env si c'est cet appareil
  function contenuOuvrir(famille, ici, env) {
    const N = ici ? nomNav(env) : null;
    const rienNeChange = 'Rien ne change : tu étais déjà plus loin sur ce navigateur. C\'est normal, on garde toujours le meilleur.';
    const secours = 'Rien ne marche : va sur le site (' + SITE + '), « **Reprendre depuis un fichier** », puis choisis ton fichier.';
    if (famille === 'ordi') {
      const mac = ici && env.os === 'mac';
      const raccourci = !ici ? 'Ctrl+O (Cmd+O sur Mac)' : mac ? 'Cmd+O' : 'Ctrl+O';
      return [
        el('p', null, 'Double-clique sur le fichier. Il s\'ouvre dans ' + (N ? N : 'ton navigateur') + ', qui ouvre le site et affiche « **Progression restaurée** ». Il faut être connecté à Internet.'),
        depliant([
          'Il s\'ouvre dans un autre logiciel (' + (mac ? 'TextEdit' : 'Bloc-notes') + ', Word…) : ' + (mac ? 'clic droit (ou Ctrl+clic)' : 'clic droit') + ' sur le fichier, « **Ouvrir avec** », puis ton navigateur. Ou fais glisser le fichier dans une fenêtre du navigateur.',
          'Il s\'ouvre dans un autre navigateur que le tien : la progression irait dans celui-là. Ouvre-le avec le bon : « **Ouvrir avec** », ou ' + raccourci + ' dans ton navigateur, puis choisis le fichier.',
          'La page « Ma progression » reste affichée : clique sur « **Reprendre ma progression** ».',
          'Pas de connexion Internet : connecte-toi, puis rouvre le fichier.',
          'La progression disparaît quand tu fermes le navigateur : tu es en navigation privée, ou le navigateur efface tout en se fermant. Utilise une fenêtre normale.',
          rienNeChange,
          secours
        ])
      ];
    }
    if (famille === 'android') {
      const nav = ici ? (N || 'ton navigateur') : 'Chrome (ou ton navigateur)';
      // autre chemin : la liste des téléchargements du navigateur (seulement quand on sait lequel)
      const menu = !ici || env.nav === 'chrome' ? 'dans Chrome, menu ⋮ › « **Téléchargements** »'
        : env.nav === 'samsung' ? 'dans Samsung Internet, menu ≡ › « **Téléchargements** »'
        : env.nav === 'firefox' ? 'dans Firefox, menu ⋮ › « **Téléchargements** »' : null;
      return [
        el('p', null, 'Ouvre l\'appli « **Fichiers** » (« **Mes fichiers** » sur Samsung), dossier « **Téléchargements** », touche le fichier et choisis ' + nav + '. Il faut être connecté à Internet.'),
        menu ? el('p', null, 'Autre chemin : ' + menu + ', puis touche le fichier.') : null,
        depliant([
          'Il s\'ouvre dans un « lecteur HTML » ou affiche du texte : choisis « **Ouvrir avec** », puis ton navigateur.',
          'La page « Ma progression » reste affichée : touche « **Reprendre ma progression** ».',
          rienNeChange,
          'Rien ne marche : va sur le site (' + SITE + '), « **Reprendre depuis un fichier** », puis choisis ton fichier dans « **Téléchargements** ».'
        ])
      ];
    }
    if (famille === 'apple') {
      const nav = ici && env.nav && env.nav !== 'safari' ? N : 'Safari';
      return [
        el('p', null, 'Deux façons, essaie-les dans l\'ordre. Il faut être connecté à Internet.'),
        liste([
          'Appli « **Fichiers** », dossier « **Téléchargements** » : touche le fichier, puis « **Reprendre ma progression** ».',
          'Si ça ne marche pas : ouvre le site dans ' + nav + ' (' + SITE + '), touche « **Reprendre depuis un fichier** », puis « **Parcourir** », et choisis ton fichier.'
        ], 'ol'),
        depliant([
          !ici || env.nav === 'chrome' ? 'Tu travailles avec Chrome sur ' + (ici ? appareilApple(env) : 'iPhone ou iPad') + ' : utilise la façon 2 dans Chrome, sinon la progression irait dans Safari.' : null,
          !ici || env.nav === 'safari' ? 'Safari efface la progression d\'un site que tu n\'ouvres pas pendant une semaine : enregistre un nouveau fichier à la fin de chaque séance.' : null,
          rienNeChange
        ].filter(Boolean))
      ];
    }
    // appareil inconnu : textes génériques
    return [
      el('p', null, 'Ouvre le fichier avec ton navigateur : il ouvre le site et affiche « **Progression restaurée** ». Il faut être connecté à Internet.'),
      depliant([
        'La page « Ma progression » reste affichée : touche ou clique sur « **Reprendre ma progression** ».',
        rienNeChange,
        secours
      ])
    ];
  }

  /* ---------- La fenêtre ---------- */
  const etat = { cible: null, telecharge: false, nom: '' };
  let fenetre = null, avantOuverture = null;

  function creerFenetre() {
    if (fenetre) return fenetre;
    fenetre = el('dialog', { class: 'prog-fenetre', 'aria-labelledby': 'prog-titre' });
    document.body.appendChild(fenetre);
    fenetre.addEventListener('keydown', pieger);
    fenetre.addEventListener('close', () => {
      document.documentElement.classList.remove('prog-ouvert');
      if (avantOuverture && avantOuverture.focus) avantOuverture.focus();
    });
    // un clic sur le voile (hors de la fenêtre) ne ferme rien : seuls « Fermer » et Échap ferment
    return fenetre;
  }

  // Le focus reste dans la fenêtre (Tab et Maj+Tab bouclent) ; Échap ferme
  function pieger(e) {
    if (e.key === 'Escape' && !fenetre.showModal) { fermer(); return; }
    if (e.key !== 'Tab') return;
    const vus = {};
    const elements = Array.prototype.filter.call(
      fenetre.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'),
      x => {
        if (!x.getClientRects().length) return false;                  // masqué (dépliant fermé…)
        if (x.type === 'radio') {                                       // un seul arrêt par groupe de boutons radio
          if (vus[x.name] || !(x.checked || !fenetre.querySelector('input[name="' + x.name + '"]:checked'))) return false;
          vus[x.name] = true;
        }
        return true;
      });
    if (!elements.length) return;
    const premier = elements[0], dernier = elements[elements.length - 1], ici = document.activeElement;
    if (e.shiftKey && (ici === premier || elements.indexOf(ici) < 0)) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && ici === dernier) { e.preventDefault(); premier.focus(); }
  }

  // Remplace le contenu de la fenêtre et l'ouvre si besoin
  function afficher(titre, corps, actions) {
    creerFenetre();
    while (fenetre.firstChild) fenetre.removeChild(fenetre.firstChild);
    ajouter(fenetre, [
      el('div', { class: 'prog-tete' },
        el('h2', { id: 'prog-titre', class: 'prog-titre', tabindex: '-1' }, titre),
        el('button', { type: 'button', class: 'btn-small prog-fermer', onclick: fermer }, 'Fermer')),
      el('div', { class: 'prog-corps' }, corps, actions && actions.length ? el('div', { class: 'prog-boutons' }, actions) : null)
    ]);
    if (!fenetre.open) {
      avantOuverture = document.activeElement;
      document.documentElement.classList.add('prog-ouvert');
      if (typeof fenetre.showModal === 'function') fenetre.showModal();
      else { fenetre.setAttribute('open', ''); fenetre.classList.add('prog-sans-modal'); }
    }
    fenetre.querySelector('.prog-corps').scrollTop = 0;
    fenetre.querySelector('#prog-titre').focus();
  }
  function fermer() {
    if (!fenetre) return;
    if (typeof fenetre.close === 'function' && fenetre.showModal) fenetre.close();
    else {
      fenetre.removeAttribute('open');
      fenetre.dispatchEvent(new Event('close'));
    }
  }

  // Ouverture de « Enregistrer ma progression »
  function ouvrir() {
    const exp = exporter();
    if (!exp) {
      return afficher('Enregistrer ma progression', el('p', null,
        'Ce navigateur ne garde pas ta progression (navigation privée ou réglage du navigateur). Il n\'y a rien à enregistrer. Travaille dans une fenêtre normale.'));
    }
    if (!exp.apps.length) {
      return afficher('Enregistrer ma progression', el('p', null,
        'Tu n\'as encore rien fait sur ce navigateur : il n\'y a rien à enregistrer pour l\'instant.'));
    }
    const env = detecter();
    etat.telecharge = false;
    etat.cible = { ordi: 'ordi', android: 'android', apple: 'apple' }[env.famille] || 'ordi';
    ecranChoix(exp);
  }

  // Étapes 1 et 2 : ce qui va se passer, ce qui sera enregistré, où l'élève reprendra
  function ecranChoix(exp) {
    const env = detecter(), N = nomNav(env);
    const intro = [
      el('p', null, 'Ta progression est gardée ' + (N ? 'dans **' + N + '**' : 'dans ce navigateur') + ', sur cet appareil. Pour la retrouver ailleurs, enregistre-la dans un fichier. Il suffira d\'ouvrir ce fichier avec un navigateur pour la reprendre.'),
      el('p', null, 'Ouvrir un ancien fichier n\'efface jamais une progression plus récente : on garde toujours ton meilleur résultat.'),
      el('p', { class: 'callout prog-resume' }, 'À enregistrer : **' + pluriel(exp.apps.length, 'application') + '** : ' + resumeNoms(exp.apps) + '.')
    ];
    const choix = el('fieldset', { class: 'prog-choix' },
      el('legend', null, 'Où vas-tu reprendre ton travail ?'),
      CHOIX.map(c => el('label', { class: 'prog-option' },
        el('input', { type: 'radio', name: 'prog-cible', value: c.id, checked: etat.cible === c.id,
          onchange: () => { etat.cible = c.id; } }),
        el('span', { class: 'prog-option-corps' }, el('b', null, c.titre), c.detail ? el('small', null, c.detail) : null))));
    const bouton = etat.telecharge
      ? el('button', { type: 'button', class: 'btn-primary', onclick: () => ecranMarche() }, 'Afficher la marche à suivre')
      : el('button', { type: 'button', class: 'btn-primary', onclick: () => { if (telecharger()) ecranMarche(); } }, 'Télécharger mon fichier');
    afficher('Enregistrer ma progression', [etat.telecharge ? null : intro, choix], [bouton]);
  }

  // Étape 3 : marche à suivre, selon l'appareil actuel et l'appareil choisi
  function ecranMarche() {
    const env = detecter(), ici = etat.cible === 'ici';
    const blocs = [{ titre: 'Retrouver ton fichier ici', corps: liste(lignesRetrouver(env)) }];
    if (!ici) blocs.push({ titre: 'L\'envoyer sur l\'autre appareil', corps: liste(lignesEnvoyer(env, etat.cible)) });
    blocs.push({
      titre: ici ? 'L\'ouvrir plus tard' : 'L\'ouvrir là-bas',
      corps: [ici ? el('p', null, 'Garde ce fichier. Quand ta progression a disparu (historique effacé, autre navigateur), ouvre-le comme ceci :') : null,
        contenuOuvrir(ici ? env.famille : etat.cible, ici, env)]
    });
    const corps = [
      el('p', null, 'Ton fichier : **' + etat.nom + '**. La date dans son nom t\'aide à trouver le plus récent.'),
      blocs.map((b, i) => el('section', { class: 'prog-bloc' },
        el('h3', null, el('span', { class: 'prog-num', 'aria-hidden': 'true' }, String(i + 1)), b.titre), b.corps)),
      el('p', { class: 'prog-encore' }, 'Rien n\'a été téléchargé ? ',
        el('button', { type: 'button', class: 'btn-small', onclick: () => { telecharger(); } }, 'Télécharger à nouveau'))
    ];
    const titre = CHOIX.find(c => c.id === etat.cible).titre;
    afficher(titre, corps, [el('button', { type: 'button', class: 'btn-secondary', onclick: () => ecranChoix(exporter() || { apps: [] }) }, 'Changer d\'appareil')]);
  }

  // Téléchargement du fichier (doit partir du clic : geste de l'utilisateur, nécessaire sur iPhone)
  function telecharger() {
    const exp = exporter();
    if (!exp || !exp.apps.length) { ouvrir(); return false; }
    const maintenant = new Date();
    const paquet = { v: VERSION, date: maintenant.toISOString(), donnees: exp.donnees };
    etat.nom = nomFichier(maintenant);
    const url = URL.createObjectURL(new Blob([fichier(paquet, exp.apps)], { type: 'text/html;charset=utf-8' }));
    // le lien est placé dans la fenêtre : le reste de la page est inerte pendant qu'elle est ouverte
    const a = el('a', { href: url, download: etat.nom, class: 'prog-cache' });
    (fenetre && fenetre.open ? fenetre : document.body).appendChild(a);
    a.click();
    a.parentNode.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    etat.telecharge = true;
    return true;
  }

  /* ---------- Messages au retour sur le portail ---------- */
  function montrerBilan(b) {
    const env = detecter(), N = nomNav(env);
    // progression ajoutée : l'avancement x/y de la liste du portail change
    if (b.etat === 'ok' && window.ACC && typeof ACC.rafraichir === 'function') ACC.rafraichir();
    if (b.etat === 'ok') {
      afficher('Progression restaurée.', [
        b.maj.length ? el('p', null, '**Mises à jour** : ' + listeNoms(b.maj) + '.') : null,
        b.deja.length ? el('p', null, '**Déjà plus avancées ici, restées telles quelles** : ' + listeNoms(b.deja) + '.') : null,
        el('p', { class: 'callout' }, 'Elle est gardée ' + (N ? 'dans **' + N + '**' : 'dans ce navigateur') + ' sur cet appareil. Si tu travailles avec un autre navigateur, ouvre ton fichier avec lui.'),
        env.nav === 'safari' ? el('p', null, 'Safari efface la progression d\'un site que tu n\'ouvres pas pendant une semaine : enregistre un nouveau fichier à la fin de chaque séance.') : null
      ]);
    } else if (b.etat === 'rien') {
      afficher('Rien de nouveau', el('p', null, 'Ce fichier ne contient rien de plus que ce navigateur : tu étais déjà au même niveau ou plus loin.'));
    } else if (b.etat === 'stockage') {
      afficher('Progression non restaurée', el('p', null, 'Ce navigateur ne peut pas garder ta progression (navigation privée ou réglage). Ouvre ton fichier dans une fenêtre normale ou avec un autre navigateur.'));
    } else {
      afficher('Progression non restaurée', el('p', null, 'Ce fichier de progression est abîmé ou incomplet. Ta progression actuelle n\'a pas changé. Essaie avec un fichier plus récent ou retélécharge-le.'));
    }
  }

  /* ---------- Reprise de secours : choisir le fichier .html ---------- */
  function choisirFichier() {
    const champ = document.getElementById('prog-fichier');
    if (champ) champ.click();
  }
  function lireFichierChoisi(champ) {
    const f = champ.files && champ.files[0];
    champ.value = '';                                     // le même fichier pourra être choisi à nouveau
    if (!f) return;
    if (f.size > MAX_FICHIER) return montrerBilan(stockage() ? { etat: 'abime' } : { etat: 'stockage' });
    const lecteur = new FileReader();
    lecteur.onload = () => montrerBilan(depuisFichier(String(lecteur.result)));
    lecteur.onerror = () => montrerBilan({ etat: 'abime' });
    lecteur.readAsText(f, 'utf-8');
  }

  /* ---------- Mise en place ---------- */
  const bEnregistrer = document.getElementById('prog-enregistrer');
  const bReprendre = document.getElementById('prog-reprendre');
  const champ = document.getElementById('prog-fichier');
  if (bEnregistrer) bEnregistrer.addEventListener('click', ouvrir);
  if (bReprendre) bReprendre.addEventListener('click', choisirFichier);
  if (champ) champ.addEventListener('change', () => lireFichierChoisi(champ));

  // Arrivée depuis un fichier de progression : #reprise=<données>
  // (au chargement, ou portail déjà ouvert dans cet onglet)
  function lireAncre() {
    if (location.hash.indexOf('#reprise=') !== 0) return;
    const brut = location.hash.slice('#reprise='.length);
    // on retire tout de suite les données de l'adresse (retour arrière, favoris, partage)
    try { history.replaceState(history.state, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    montrerBilan(depuisAncre(brut));
  }
  lireAncre();
  addEventListener('hashchange', lireAncre);

  window.PROG = { ouvrir, choisirFichier, detecter, exporter, importer, fichier, typeDeCle };
})();
