/* ============================================================
   Accueil du portail — code commun aux trois propositions
   ------------------------------------------------------------
   ACC.DOMAINES  liste des domaines (Physique, Chimie, Outils mathématiques)
   ACC.NIVEAUX   liste des niveaux (Collège, 2de, 1re, Tle spé, Tle STI2D)
   ACC.APPS      liste des applications avec leurs étiquettes
   ACC.filtre    état du tri : { dom: Set, niv: Set } (ensemble vide = tout afficher)
   ACC.basculer(groupe, id)   ajoute / retire une étiquette du tri
   ACC.toutAfficher(groupe)   vide le tri d'un groupe (ou des deux)
   ACC.visible(app)           l'application passe-t-elle le tri ?
   ACC.surChangement(fn)      fn() est appelée à chaque changement du tri
   ACC.chambre(canvas, graine) dessine le cliché de chambre à bulles
   ACC.parallaxe()            met en place l'image qui descend moins vite que la page

   Principe du tri : par défaut aucune étiquette n'est choisie et tout
   est affiché ; choisir une étiquette ne garde que les applications qui
   la portent, en choisir d'autres les ajoute. Les deux groupes
   (domaine, niveau) se combinent.
   ============================================================ */
(function () {
  'use strict';

  const DOMAINES = [
    { id: 'physique', nom: 'Physique', court: 'Physique' },
    { id: 'chimie', nom: 'Chimie', court: 'Chimie' },
    { id: 'maths', nom: 'Outils mathématiques', court: 'Outils maths' }
  ];

  // court : étiquette des pastilles ; abr : en-tête de colonne étroite
  const NIVEAUX = [
    { id: 'col', nom: 'Collège', court: 'Collège', abr: 'Coll.' },
    { id: '2de', nom: 'Seconde', court: '2de', abr: '2de' },
    { id: '1re', nom: 'Première', court: '1re', abr: '1re' },
    { id: 'spe', nom: 'Terminale spécialité', court: 'Tle spé', abr: 'Spé' },
    { id: 'sti', nom: 'Terminale STI2D', court: 'Tle STI2D', abr: 'STI2D' }
  ];

  // Lycée complet (outils mathématiques)
  const LYCEE = ['2de', '1re', 'spe', 'sti'];

  const APPS = [
    // ---- Physique ----
    { titre: 'Désintégration radioactive', dom: 'physique', niv: ['spe'], dossier: 'decroissance-radioactive',
      desc: 'Simulation interactive de la loi de décroissance radioactive.' },
    { titre: 'Puissance active', dom: 'physique', niv: ['sti'], dossier: 'puissance-active',
      desc: 'Valeur efficace, déphasage, puissance active et facteur de puissance en régime sinusoïdal.' },
    { titre: 'Spectres et étoiles', dom: 'physique', niv: ['2de'], dossier: 'spectres-etoiles',
      desc: "Spectres d'émission et d'absorption, température et composition chimique d'une étoile." },
    { titre: 'Cinématique', dom: 'physique', niv: ['spe'], dossier: 'cinematique',
      desc: 'Référentiel, vecteurs position, vitesse et accélération, repère de Frenet.' },
    // ---- Chimie ----
    { titre: 'Oxydoréduction', dom: 'chimie', niv: ['sti'], dossier: 'oxydoreduction-STI2D',
      desc: "Apprendre à écrire les réactions d'oxydoréduction." },
    { titre: "Schéma d'une pile", dom: 'chimie', niv: ['spe', 'sti'], dossier: 'pile',
      desc: "Compléter le schéma et le fonctionnement d'une pile électrochimique." },
    { titre: 'Équilibrer une réaction', dom: 'chimie', niv: LYCEE, dossier: 'equilibrer-reactions',
      desc: 'Conservation des atomes et nombres stœchiométriques.' },
    { titre: "Avancement d'une réaction", dom: 'chimie', niv: ['2de', '1re'], dossier: 'avancement-reaction',
      desc: "Réactif limitant et tableau d'avancement, des molécules aux moles." },
    { titre: 'Combustions', dom: 'chimie', niv: ['sti'], dossier: 'combustions',
      desc: 'Équilibrer une combustion, masse de CO₂ formé et énergie libérée.' },
    { titre: 'pH', dom: 'chimie', niv: ['spe', 'sti'], dossier: 'ph',
      desc: 'Logarithme décimal et relation entre le pH et la concentration en ions H₃O⁺.' },
    // ---- Outils mathématiques ----
    { titre: 'Puissances de 10', dom: 'maths', niv: LYCEE, dossier: 'puissances-10',
      desc: 'Utiliser les puissances de 10, indispensables pour les conversions.' },
    { titre: 'Conversions', dom: 'maths', niv: LYCEE, dossier: 'conversions',
      desc: 'Réaliser facilement des conversions avec les puissances de 10.' },
    { titre: 'Équations en physique', dom: 'maths', niv: LYCEE, dossier: 'equations-en-physique',
      desc: 'Exprimer une grandeur en fonction des autres.' },
    { titre: 'Équations en physique (avec aide)', dom: 'maths', niv: LYCEE, dossier: 'equations-en-physique-avec-aide',
      desc: 'Même entraînement, avec explication de la règle en cas d’erreur.' },
    { titre: 'Proportionnalité', dom: 'maths', niv: LYCEE, dossier: 'proportionnalite',
      desc: 'Reconnaître, calculer et lire une proportionnalité sur un graphique.' },
    { titre: 'Lecture graphique', dom: 'maths', niv: LYCEE, dossier: 'lecture-graphique',
      desc: 'Lire précisément une valeur sur un graphique.' },
    { titre: 'Équations du 1er degré', dom: 'maths', niv: ['col'], dossier: 'equations-college',
      desc: 'Résoudre des équations étape par étape.' },
    { titre: 'Fractions', dom: 'maths', niv: ['col'], dossier: 'fractions-college',
      desc: 'Simplifier, multiplier, diviser, additionner et soustraire des fractions.' }
  ];

  /* ---------- Tri : afficher / masquer ---------- */
  const filtre = { dom: new Set(), niv: new Set() };
  const abonnes = [];
  const prevenir = () => abonnes.forEach(fn => fn());

  function basculer(groupe, id) {
    const s = filtre[groupe];
    if (s.has(id)) s.delete(id); else s.add(id);
    // toutes les étiquettes choisies = aucune : on revient à « Tous »
    const total = groupe === 'dom' ? DOMAINES.length : NIVEAUX.length;
    if (s.size === total) s.clear();
    prevenir();
  }
  function toutAfficher(groupe) {
    if (groupe) filtre[groupe].clear(); else { filtre.dom.clear(); filtre.niv.clear(); }
    prevenir();
  }
  function visible(app) {
    const okDom = !filtre.dom.size || filtre.dom.has(app.dom);
    const okNiv = !filtre.niv.size || app.niv.some(n => filtre.niv.has(n));
    return okDom && okNiv;
  }
  // Une étiquette est « allumée » quand elle est choisie ; « Tous » quand le groupe est vide
  const choisi = (groupe, id) => filtre[groupe].has(id);
  const actif = () => filtre.dom.size > 0 || filtre.niv.size > 0;

  /* ---------- Image : cliché de chambre à bulles ----------
     Chaque trace est une suite de petites bulles. Une particule chargée
     décrit un arc de cercle ; en perdant de l'énergie son rayon diminue,
     d'où les spirales (électrons). */
  function graine(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function chambre(canvas, seed) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const rnd = graine(seed);
    const E = Math.max(w, h) / 1400;           // échelle des motifs
    const css = getComputedStyle(document.documentElement);
    const papier = css.getPropertyValue('--paper').trim() || '#f3f1ec';

    ctx.fillStyle = papier; ctx.fillRect(0, 0, w, h);

    // Repères (croix) gravés sur la fenêtre de la chambre
    ctx.strokeStyle = 'rgba(22,24,29,.12)'; ctx.lineWidth = 1;
    const pasCroix = 190 * E;
    for (let x = pasCroix / 2; x < w; x += pasCroix) for (let y = pasCroix / 2; y < h; y += pasCroix) {
      ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke();
    }

    // Trace d'une particule : k = courbure (rad/px), perte = croissance de k à chaque pas
    function trace(x, y, a, k, perte, longueur, taille, alpha) {
      const pas = 2.1 * E;
      ctx.fillStyle = `rgba(22,24,29,${alpha})`;
      for (let s = 0; s < longueur; s += pas) {
        x += Math.cos(a) * pas; y += Math.sin(a) * pas;
        a += k * pas; k *= perte;
        if (rnd() < .6) {
          ctx.beginPath();
          ctx.arc(x + (rnd() - .5) * .9, y + (rnd() - .5) * .9, taille * (.55 + rnd() * .7), 0, 7);
          ctx.fill();
        }
        if (Math.abs(k) > .5 / E || x < -300 || x > w + 300 || y < -300 || y > h + 300) break;
      }
      return { x, y, a };
    }
    const signe = () => (rnd() < .5 ? -1 : 1);

    // Faisceau incident : traces presque rectilignes venant de la gauche
    const nFaisceau = 9;
    for (let i = 0; i < nFaisceau; i++) {
      const y0 = h * (.08 + .86 * (i + rnd() * .6) / nFaisceau);
      const a0 = (rnd() - .5) * .04;
      const k0 = signe() * 2e-5 / E;
      const interaction = rnd() < .6;
      const L = interaction ? w * (.35 + rnd() * .55) : w * 1.3;
      const fin = trace(-40, y0, a0, k0, 1, L, 1.05 * E + .35, .55);

      if (interaction) {
        // Vertex d'interaction : gerbe de particules secondaires
        const n = 2 + Math.floor(rnd() * 4);
        for (let j = 0; j < n; j++) {
          trace(fin.x, fin.y, fin.a + (rnd() - .5) * 1.6, signe() * (4e-4 + rnd() * 2.2e-3) / E,
                1 + rnd() * .0025, (300 + rnd() * 900) * E, .95 * E + .35, .5);
        }
      }
      // Électrons arrachés (rayons delta) : petites spirales serrées
      if (rnd() < .7) {
        const px = w * (.1 + rnd() * .7), py = y0 + Math.tan(a0) * px;
        trace(px, py, rnd() * 6.28, signe() * (.01 + rnd() * .02) / E, 1.006, 700 * E, .8 * E + .3, .45);
      }
    }

    // Désintégrations « en V » d'une particule neutre (aucune trace incidente)
    for (let i = 0; i < 3; i++) {
      const vx = w * (.45 + rnd() * .5), vy = h * (.15 + rnd() * .7), a = (rnd() - .5) * .8;
      trace(vx, vy, a - .25, 1.2e-3 / E, 1.001, 700 * E, .95 * E + .35, .5);
      trace(vx, vy, a + .25, -1.4e-3 / E, 1.001, 650 * E, .95 * E + .35, .5);
    }

    // Quelques grandes spirales isolées
    for (let i = 0; i < 4; i++) {
      trace(w * (.3 + rnd() * .7), h * rnd(), rnd() * 6.28, signe() * (.003 + rnd() * .004) / E,
            1.0035, 2600 * E, .85 * E + .3, .42);
    }
  }

  /* ---------- Parallaxe : l'image descend à 60 % de la vitesse du scroll ---------- */
  function parallaxe() {
    const F = 0.4;                                   // retard de l'image
    const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const boites = [...document.querySelectorAll('.plx')];

    function dimensionner() {
      boites.forEach(b => {
        const cv = b.querySelector('canvas');
        const hb = b.offsetHeight;
        const hautMax = Math.min(b.getBoundingClientRect().top + scrollY, innerHeight);
        const f = reduit ? 0 : F;
        cv.style.top = (-f * hautMax) + 'px';
        cv.style.height = (hb + f * (hautMax + hb)) + 'px';
        chambre(cv, +b.dataset.graine);
      });
      deplacer();
    }
    function deplacer() {
      if (reduit) return;
      boites.forEach(b => {
        const r = b.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;       // hors écran : rien à faire
        b.querySelector('canvas').style.transform = `translate3d(0, ${-r.top * F}px, 0)`;
      });
    }

    dimensionner();
    let attente = false;
    addEventListener('scroll', () => {
      if (!attente) { attente = true; requestAnimationFrame(() => { deplacer(); attente = false; }); }
    }, { passive: true });
    let minuterie, largeur = innerWidth;
    addEventListener('resize', () => {
      clearTimeout(minuterie);
      // sur mobile, la barre d'adresse change la hauteur : on ne redessine que si la largeur change
      minuterie = setTimeout(() => { if (innerWidth !== largeur) { largeur = innerWidth; dimensionner(); } else deplacer(); }, 200);
    });
    document.fonts && document.fonts.ready.then(dimensionner);
  }

  /* ---------- Petits utilitaires d'affichage ---------- */
  const domaine = id => DOMAINES.find(d => d.id === id);
  const niveau = id => NIVEAUX.find(n => n.id === id);
  const fleche = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? 's' : ''}`;

  // Étiquettes de niveau d'une application : « Lycée » remplace les quatre niveaux du lycée
  function etiquettes(app) {
    const lycee = LYCEE.every(n => app.niv.includes(n));
    const liste = lycee ? [{ texte: 'Lycée', ids: LYCEE }] : [];
    app.niv.filter(n => !lycee || !LYCEE.includes(n)).forEach(n => liste.push({ texte: niveau(n).court, ids: [n] }));
    return liste.map(e => `<span class="niv${e.ids.some(n => filtre.niv.has(n)) ? ' ici' : ''}" title="${e.ids.map(n => niveau(n).nom).join(', ')}">${e.texte}</span>`).join('');
  }

  window.ACC = {
    DOMAINES, NIVEAUX, APPS, filtre, basculer, toutAfficher, visible, choisi, actif,
    surChangement: fn => abonnes.push(fn),
    chambre, parallaxe, domaine, niveau, fleche, pluriel, etiquettes
  };
})();
