/* ============================================================
   Navigation commune des applications : sommaire de toute
   l'application, accueil en lignes dépliables, progression.
   (même présentation et même fonctionnement que la navigation
   de l'application « Cinématique », voir docs/charte-applications.md §5)

   Utilisation :
     SOM.init({
       nom: 'pH',                    nom de l'application
       id: 'ph',                     clé de progression : localStorage « ph-progression »
       cleEx: 'ph-exercices',        (facultatif) résultats des exercices { id: { pts, max } }
       spa: false,                   true : application en une seule page, les pages sont des ancres (#cle)
       plan: PLAN,
     });
     SOM.menu(cle)        cle = 'accueil' (bandeau avec le lien vers le portail)
                          ou la clé d'une page du plan (sommaire)
     SOM.accueil(zone)    liste des modules en lignes dépliables, carte « Reprendre »
     SOM.marquer(info)    { fait: true } (cours terminé…) ou { note } (note sur 20, on garde la meilleure)

   PLAN = [{ n, titre, desc, fiche,          fiche : clé de la fiche récapitulative (s'il y a un cours)
             parties: [{ nom, slug, simulation, cours, exemple, questions, entrainement, noms }],
             exercices, exNom, nbEx }]       page d'exercices du module (nbEx : nombre d'exercices comptés)
     Chaque type de page d'une partie vaut la clé de la page (nom du fichier sans .html,
     ou nom de l'ancre en mode page unique). noms : libellés propres, ex. { questions: 'Vérification' }.

   Ordinateur (900 px et plus) : sommaire toujours ouvert dans une colonne à gauche.
   Téléphone : bandeau « où suis-je » ; un appui déroule le sommaire sous le bandeau.
   ============================================================ */
(function () {
  'use strict';

  const C = { nom: '', id: 'app', cleEx: null, spa: false, plan: [] };

  // types de pages d'une partie, dans l'ordre d'affichage
  const ONGLETS = ['simulation', 'cours', 'exemple', 'questions', 'entrainement'];
  const NOMS = { simulation: 'Simulation', cours: 'Cours', exemple: 'Exemple', questions: 'Questions', entrainement: 'Entraînement', fiche: 'Fiche récapitulative', exercices: 'Exercices' };
  const ICONES = { simulation: '▸', cours: 'C', exemple: 'Ex', questions: 'Q', entrainement: 'E', fiche: '≡', exercices: '#' };

  const fmt = v => String(v).replace('.', ',');

  /* ---------- Progression (gardée dans le navigateur) ---------- */
  const clePro = () => C.id + '-progression';
  function lireProg() { try { return JSON.parse(localStorage.getItem(clePro())) || {}; } catch (e) { return {}; } }
  function ecrireProg(p) { try { localStorage.setItem(clePro(), JSON.stringify(p)); } catch (e) { /* stockage indisponible : rien à faire */ } }
  function lireExercices() {
    if (!C.cleEx) return {};
    try { return JSON.parse(localStorage.getItem(C.cleEx)) || {}; } catch (e) { return {}; }
  }
  let pageEnCours = null;
  const cleDePage = () => pageEnCours || (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  // info = { fait: true } quand une page est terminée, { note } pour une note sur 20 (on garde la meilleure)
  function marquer(info, cle) {
    const p = lireProg();
    cle = cle || cleDePage();
    p.pages = p.pages || {};
    const a = p.pages[cle] || {};
    if (info.fait) a.fait = true;
    if (info.note != null) a.note = Math.max(a.note == null ? 0 : a.note, info.note);
    p.pages[cle] = a;
    ecrireProg(p);
  }

  const pagesPartie = pt => ONGLETS.filter(o => pt[o]);
  const nomPage = (pt, o) => (pt && pt.noms && pt.noms[o]) || NOMS[o];
  // une page est faite quand elle est terminée ou qu'elle a une note
  const pageFaite = (pt, o, pages) => { const a = pages[pt[o]] || {}; return !!a.fait || a.note != null; };
  const partieFaite = (pt, pages) => pagesPartie(pt).every(o => pageFaite(pt, o, pages));
  const parties = m => m.parties || [];

  /* ---------- Où se trouve-t-on ? ---------- */
  function situer(cle) {
    for (const m of C.plan) {
      if (m.exercices === cle) return { m, onglet: 'exercices' };
      if (m.fiche && m.fiche === cle) {
        const h = C.spa ? '' : location.hash.slice(1), i = Math.max(0, parties(m).findIndex(p => p.slug === h));
        return { m, i, p: parties(m)[i], onglet: 'fiche' };
      }
      for (let i = 0; i < parties(m).length; i++) {
        const o = pagesPartie(m.parties[i]).find(x => m.parties[i][x] === cle);
        if (o) return { m, i, p: m.parties[i], onglet: o };
      }
    }
    return null;
  }
  // adresse d'une page (depuis l'accueil : pages dans modules/ ; depuis une page : même dossier)
  function adresse(cle, depuisAccueil) {
    if (C.spa) return '#' + cle;
    return (depuisAccueil ? 'modules/' : '') + cle + '.html';
  }
  function lien(m, p, onglet, depuisAccueil) {
    if (onglet === 'fiche') return adresse(m.fiche, depuisAccueil) + (!C.spa && p && p.slug && parties(m).length > 1 ? '#' + p.slug : '');
    if (onglet === 'exercices') return adresse(m.exercices, depuisAccueil);
    return adresse(p[onglet], depuisAccueil);
  }
  const accueilApp = () => (C.spa ? 'index.html' : '../index.html');
  function libelle(cle) {
    const s = situer(cle);
    if (!s) return '';
    if (s.onglet === 'exercices') return `Module ${s.m.n} · ${s.m.exNom || 'Exercices'}`;
    const quoi = s.onglet === 'fiche' ? NOMS.fiche : nomPage(s.p, s.onglet);
    return parties(s.m).length > 1 && s.onglet !== 'fiche' ? `Module ${s.m.n} · ${s.p.nom} · ${quoi}` : `Module ${s.m.n} · ${quoi}`;
  }

  /* ---------- Avancement d'un module (sommaire et accueil) ---------- */
  // une page par simulation, cours, série… ; les exercices comptent chacun pour un (ou la page pour un)
  const nbEx = m => (m.exercices ? (m.nbEx || 1) : 0);
  const totalModule = m => parties(m).reduce((n, pt) => n + pagesPartie(pt).length, 0) + nbEx(m);
  function exFaits(m, pages, ex) {
    if (!m.exercices) return 0;
    if (m.nbEx) return Math.min(m.nbEx, Object.keys(ex).length);
    const a = pages[m.exercices] || {};
    return a.fait || a.note != null ? 1 : 0;
  }
  const faitModule = (m, pages, ex) => parties(m).reduce((n, pt) => n + pagesPartie(pt).filter(o => pageFaite(pt, o, pages)).length, 0) + exFaits(m, pages, ex);
  // état d'une page : ✓ ou meilleure note
  function etatPage(cle, pages) {
    const a = pages[cle] || {};
    return a.note != null ? fmt(a.note) + '/20' : a.fait ? '✓' : '';
  }

  /* ---------- Sommaire de toute l'application ---------- */
  const chev = '<span class="som-chev" aria-hidden="true">›</span>';
  const feuille = (href, ic, lib, etat, ici) =>
    `<a class="som-page${ici ? ' ici' : ''}" href="${href}"${ici ? ' aria-current="page"' : ''}><span class="ic" aria-hidden="true">${ic}</span>${lib}${etat ? `<em>${etat}</em>` : ''}</a>`;
  // les pages d'une partie (Cours ✓, Questions 16/20…), puis la fiche du module
  function feuilles(m, p, s, pages) {
    const ici = o => s.m === m && s.p === p && s.onglet === o;
    return pagesPartie(p).map(o => feuille(lien(m, p, o), ICONES[o], nomPage(p, o), etatPage(p[o], pages), ici(o))).join('') +
      (m.fiche ? feuille(lien(m, p, 'fiche'), ICONES.fiche, 'Fiche', '', ici('fiche')) : '');
  }
  const feuilleEx = (m, s, pages) => feuille(lien(m, null, 'exercices'), ICONES.exercices, m.exNom || 'Exercices', m.nbEx ? '' : etatPage(m.exercices, pages), s.m === m && s.onglet === 'exercices');
  function sommaire(s, pages, ex) {
    return C.plan.map(m => {
      const ici = s.m === m, n = faitModule(m, pages, ex), t = totalModule(m), fini = n === t;
      let enfants;
      if (parties(m).length <= 1) enfants = `<div class="som-spages">${parties(m).length ? feuilles(m, m.parties[0], s, pages) : ''}${m.exercices ? feuilleEx(m, s, pages) : ''}</div>`;
      else enfants = m.parties.map((p, i) => {
        const pici = ici && s.p === p, id = `som-s${m.n}-${i}`;
        return `<button type="button" class="som-spt${pici ? ' ici' : ''}" aria-expanded="${pici}" aria-controls="${id}">${partieFaite(p, pages) ? '<span class="som-v" aria-label="terminé">✓</span>' : ''}${p.nom}${chev}</button>` +
          `<div class="som-spages" id="${id}"${pici ? '' : ' hidden'}>${feuilles(m, p, s, pages)}</div>`;
      }).join('') + (m.exercices ? `<div class="som-spages">${feuilleEx(m, s, pages)}</div>` : '');
      return `<div class="som-smod${ici ? ' ici' : ''}"><button type="button" class="som-sligne" aria-expanded="${ici}" aria-controls="som-s${m.n}">` +
        `<span class="som-snum${fini ? ' fait' : ''}">${fini ? '✓' : m.n}</span><span class="som-st">${m.titre}</span><span class="som-sn">${n}/${t}</span>${chev}</button>` +
        `<div class="som-senf" id="som-s${m.n}"${ici ? '' : ' hidden'}>${enfants}</div></div>`;
    }).join('');
  }

  /* ---------- Navigation d'une page ---------- */
  let ecoute = false;
  const html = document.documentElement;
  function ouvrir(oui) {
    html.classList.toggle('som-ouvert', oui);
    const b = document.querySelector('.som-ou');
    if (b) { b.setAttribute('aria-expanded', oui); b.querySelector('.som-ou-chev').textContent = oui ? '▴' : '▾'; }
  }
  function menu(cle) {
    const racine = document.getElementById('app-nav');
    if (!racine) return;
    if (!ecoute) {
      ecoute = true;
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('som-ouvert')) ouvrir(false); });
    }
    html.classList.remove('som-nav', 'som-ouvert');
    pageEnCours = C.spa ? cle : null;
    // accueil de l'application : bandeau avec le lien vers le portail des applications
    if (cle === 'accueil' || !situer(cle)) {
      racine.innerHTML = '<div class="app-topbar"><a class="som-pilule" href="../index.html"><span aria-hidden="true">←</span><span class="som-court">Applications</span><span class="som-long">Toutes les applications</span></a>' +
        `<div class="app-topbar-title"><span class="app-name">${C.nom}</span></div></div><div class="app-topbar-spacer"></div>`;
      return;
    }
    const prog = lireProg();
    prog.derniere = cle; ecrireProg(prog);                       // pour « Reprendre » sur l'accueil
    html.classList.add('som-nav');
    // (re)construit le bandeau et le sommaire ; sur une fiche, la partie dépend de l'ancre
    function rendre() {
      const s = situer(cle), pages = lireProg().pages || {}, ex = lireExercices();
      const multi = parties(s.m).length > 1;
      const ou = s.onglet === 'exercices' ? (s.m.exNom || NOMS.exercices) : s.onglet === 'fiche' ? NOMS.fiche
        : multi ? `${s.p.nom} · ${nomPage(s.p, s.onglet)}` : nomPage(s.p, s.onglet);
      racine.innerHTML =
        `<div class="som-barre"><button type="button" class="som-ou" aria-expanded="false" aria-controls="som-som" aria-label="Sommaire : module ${s.m.n}, ${ou}">` +
        `<span class="som-snum">${s.m.n}</span><span class="som-ou-t"><small>${s.m.titre}</small><b>${ou}</b></span><span class="som-ou-chev" aria-hidden="true">▾</span></button></div>` +
        '<div class="som-barre-esp"></div><div class="som-voile"></div>' +
        `<aside class="som-som" id="som-som" aria-label="Sommaire"><div class="som-tete"><a class="som-app" href="${accueilApp()}">${C.nom}</a>` +
        `<a class="som-pilule" href="${accueilApp()}"><span aria-hidden="true">⌂</span>Accueil</a></div>` +
        `<p class="som-lab">Sommaire</p><nav class="som-arbre" aria-label="Modules">${sommaire(s, pages, ex)}</nav></aside>`;
      // déplier / replier un module ou une partie sur place
      racine.querySelectorAll('.som-sligne, .som-spt').forEach(b => b.addEventListener('click', () => {
        const oui = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', oui);
        document.getElementById(b.getAttribute('aria-controls')).hidden = !oui;
      }));
      racine.querySelector('.som-ou').addEventListener('click', () => ouvrir(!html.classList.contains('som-ouvert')));
      racine.querySelector('.som-voile').addEventListener('click', () => ouvrir(false));
      // un lien vers une autre partie de la même page ne recharge pas la page : on referme
      racine.querySelectorAll('.som-page, .som-pilule, .som-app').forEach(a => a.addEventListener('click', () => ouvrir(false)));
      // ordinateur : la page en cours visible dans la colonne
      const ici = racine.querySelector('.som-page.ici'), col = racine.querySelector('.som-som');
      if (ici && col.scrollHeight > col.clientHeight) col.scrollTop = ici.offsetTop - col.clientHeight / 2;
    }
    rendre();
    const s = situer(cle);
    if (C.spa || s.onglet !== 'fiche') return;
    // fiche : la partie choisie est donnée par l'ancre de la page (#slug)
    // (les figures de la fiche peuvent se dessiner après le premier défilement : on recale la page sur l'ancre)
    if (location.hash.length > 1) {
      const aller = () => { const e = document.getElementById(location.hash.slice(1)); if (e) e.scrollIntoView(); };
      addEventListener('load', () => { aller(); setTimeout(aller, 250); });
    }
    addEventListener('hashchange', () => { rendre(); ouvrir(false); });
  }

  /* ---------- Accueil : une ligne dépliable par module ---------- */
  function accueil(zone) {
    const prog = lireProg(), pages = prog.pages || {}, ex = lireExercices();
    const derniere = prog.derniere && situer(prog.derniere) ? prog.derniere : null;
    const total = totalModule, fait = m => faitModule(m, pages, ex);
    const ouvert = derniere ? situer(derniere).m.n : (C.plan.find(m => fait(m) < total(m)) || C.plan[0]).n;
    const bt = (cle, txt, cls) => `<a class="som-bt${cls ? ' ' + cls : ''}" href="${adresse(cle, true)}">${txt}</a>`;
    // bouton d'une page d'une partie : Cours ✓, Questions 14/20…
    const btPage = (pt, o) => {
      const a = pages[pt[o]] || {}, fini = pageFaite(pt, o, pages);
      const etat = a.note != null ? ` <span class="som-sc">${fmt(a.note)}/20</span>` : fini ? ' ✓' : '';
      return bt(pt[o], nomPage(pt, o) + etat, (fini ? 'fait ' : '') + (derniere === pt[o] ? 'ici' : ''));
    };
    const module = m => {
      const n = fait(m), t = total(m), termine = n === t, ouv = m.n === ouvert;
      const multi = parties(m).length > 1;
      const btFiche = m.fiche ? bt(m.fiche, multi ? 'Fiche récapitulative' : 'Fiche', derniere === m.fiche ? 'ici' : '') : '';
      const btEx = m.exercices ? bt(m.exercices, (m.exNom || NOMS.exercices) + ' →', 'noir') : '';
      // module à une seule partie : tout dans la même carte ; sinon une carte par partie, puis la fiche
      const corps = (parties(m).length ? `<div class="som-grille${multi ? ' deux' : ''}">` + m.parties.map(pt =>
        `<div class="som-partie">${multi || m.exercices ? `<span class="som-partie-nom${partieFaite(pt, pages) ? ' ok' : ''}">${pt.nom}</span>` : ''}<div class="som-actions">${pagesPartie(pt).map(o => btPage(pt, o)).join('')}${multi ? '' : btFiche}</div></div>`).join('') +
        `</div>` : '') + `${multi && btFiche ? `<div class="som-actions">${btFiche}</div>` : ''}${btEx ? `<div class="som-actions">${btEx}</div>` : ''}`;
      return `<div class="som-module"><button class="som-ligne" type="button" id="som-b${m.n}" aria-expanded="${ouv}" aria-controls="som-m${m.n}">` +
        `<span class="som-badge${termine ? ' fait' : ''}">${termine ? '✓' : m.n}</span>` +
        `<span class="som-ligne-t">${m.titre}<small>${m.desc}</small></span><span class="som-ligne-n">${n}/${t}</span><span class="som-chev" aria-hidden="true">›</span></button>` +
        `<div class="som-ouvert" id="som-m${m.n}" role="region" aria-labelledby="som-b${m.n}"${ouv ? '' : ' hidden'}>${corps}</div></div>`;
    };
    zone.innerHTML = (derniere ? `<a class="som-reprendre" href="${adresse(derniere, true)}"><small>Reprendre</small><b>${libelle(derniere)} →</b></a>` : '') +
      `<div class="som-modules">${C.plan.map(module).join('')}</div>`;
    // un seul module déplié à la fois
    const lignes = zone.querySelectorAll('.som-ligne');
    lignes.forEach(b => b.addEventListener('click', () => {
      const ouvrirLigne = b.getAttribute('aria-expanded') !== 'true';
      lignes.forEach(x => { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
      if (ouvrirLigne) {
        b.setAttribute('aria-expanded', 'true');
        document.getElementById(b.getAttribute('aria-controls')).hidden = false;
        setTimeout(() => b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
      }
    }));
  }

  // (chaque appel remplace toute la configuration : une page qui charge le moteur d'une autre application la reconfigure)
  function init(opts) { Object.assign(C, { nom: '', id: 'app', cleEx: null, spa: false, plan: [] }, opts); return window.SOM; }

  window.SOM = { init, menu, accueil, marquer, situer, libelle, lireProg, NOMS };
})();
