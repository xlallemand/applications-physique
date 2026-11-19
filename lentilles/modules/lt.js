/* ============================================================
   Moteur de l'application « Image par une lentille convergente »
   (Physique · Seconde ; moteur de questions repris de « Réfraction et loi
   de Snell-Descartes », navigation commune assets/sommaire.js, figures
   avec l'outil OPT de assets/optique.js)

   LT.fmt(v, dec), LT.lire(s), LT.cs(s), LT.sig(v, c), LT.court(v, c), LT.fr(h, b)   écriture et lecture des nombres
   LT.el(tag, cls, html), LT.melanger(t), LT.hasard(t), LT.defiler(e), LT.amener(e), LT.surOrdi()
   LT.PARTIES                       parties de question :
     'choix'  : p.options [{ id, label }], p.bonne, p.indices[id] ou p.indice, p.colonne
     'nombre' : p.label, p.unite, p.verifier(v, texte) → { ok } | { diag } | { format } ;
                p.calc : icône calculatrice ; p.remplir(input) : réponse affichée
     'perso'  : p.monter(zone, api) → { montrer() } ; api.reussi(), api.erreur(diag), api.message(h)
   LT.question(zone, q, cb, mode)   question en parties successives ; mode 'serie' ou 'manip'
   LT.serie(opts)                   série de 10 questions notée sur 20
   LT.revois(liste)                 liens « Revois… » vers d'autres applications (nouvelle fenêtre)
   LT.pleinEcran()                  bouton [data-plein] « ⤢ Plein écran » des pages de manipulation
   LT.fenetre(titre, remplir), LT.boutonAide(zone, texte, titre, remplir)   fenêtre d'aide par-dessus la page
   LT.vergence(v)                   écriture du passage de la vergence à la distance focale
   LT.lettre(parent, x, y, taille, renversee, cls)   lettre « d » (objet du banc d'optique, image sur l'écran ou la rétine)
   LT.confettis()
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Les rayons particuliers', desc: 'Placer les foyers F et F′, tracer le rayon qui sort de la lentille',
      parties: [{ nom: 'Les rayons particuliers', entrainement: 'module_1_manip', noms: { entrainement: 'Manipulation : les rayons particuliers' } }] },
    { n: 2, titre: 'Construire l\'image A′B′', desc: 'Série notée sur 20 : rayons issus de B, position, taille et sens de l\'image, grandissement',
      parties: [{ nom: 'Construire l\'image A′B′', questions: 'module_2_questions', noms: { questions: 'Entraînement : construire l\'image' } }] },
    { n: 3, titre: 'Le banc d\'optique', desc: 'Chercher l\'image nette sur l\'écran, mesurer, calculer le grandissement',
      parties: [{ nom: 'Le banc d\'optique', simulation: 'module_3_simulation', noms: { simulation: 'Simulateur : le banc d\'optique' } }] },
    { n: 4, titre: 'Le modèle de l\'œil', desc: 'Œil réduit : diaphragme, lentille, écran ; accommodation du cristallin',
      parties: [{ nom: 'Le modèle de l\'œil', simulation: 'module_4_simulation', noms: { simulation: 'Simulateur : l\'œil et l\'accommodation' } }] },
  ];
  SOM.init({ nom: 'Image par une lentille convergente', id: 'lentilles', plan: PLAN });


  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // nombre avec c chiffres significatifs, écrit simplement (22,1 ; 0,376 ; 33)
  function sig(v, c) {
    if (!v) return '0';
    const dec = Math.max(0, c - 1 - Math.floor(Math.log10(Math.abs(v)) + 1e-12));
    // un 5 exact en dernière position s'arrondit au-dessus (0,8365 → 0,837)
    return fmt(v * (1 + 1e-12), dec);
  }
  const court = (v, c) => fmt(+v.toPrecision(c || 3));
  // lecture d'une saisie : « 2,3 », « −0,5 », « 22.1 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(',', '.');
    return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
  }
  // nombre de chiffres significatifs d'une saisie (« 0,376 » → 3 ; « 22,1 » → 3 ; « 33 » → 2)
  function cs(s) {
    let t = String(s).trim().replace(/[\s  ]/g, '').replace(/[−–+-]/g, '').replace(',', '.');
    if (!/^\d*\.?\d*$/.test(t)) return 0;
    t = t.replace('.', '').replace(/^0+/, '');
    return t.length || 1;
  }
  // la saisie t est-elle la valeur exacte arrondie avec moins de chiffres significatifs que demandé ?
  function tropCourt(v, t, exact, csDemande) {
    const n = cs(t);
    return exact !== 0 && n < csDemande && Math.abs(v - +exact.toPrecision(n)) <= 1e-9 * Math.max(1, Math.abs(v));
  }
  // nombre de décimales d'une saisie (« 22,0 » → 1)
  function decimales(t) {
    const m = String(t).replace(/[\s  ]/g, '').replace('.', ',').split(',');
    return m[1] ? m[1].length : 0;
  }
  // la saisie v (texte t) est-elle l'arrondi d'une des valeurs exactes, avec les décimales écrites ?
  function arrondiJuste(v, t, exacts) {
    const d = decimales(t), u = Math.pow(10, -d);
    return exacts.some(y => y != null && Math.abs(v - +(y * (1 + 1e-12)).toFixed(d)) < u / 10);
  }
  // saisie v (texte t) mal arrondie : à moins d'une unité du dernier chiffre écrit d'une des valeurs exactes,
  // sans en être l'arrondi → message d'erreur qui l'explique (null sinon) ; csDemande : chiffres significatifs demandés
  function malArrondi(v, t, exacts, csDemande) {
    const d = decimales(t), u = Math.pow(10, -d);
    const x = exacts.find(y => y != null && Math.abs(v - y) < u);
    if (x == null) return null;
    // bien arrondi pour l'une des valeurs exactes : ce n'est pas un problème d'arrondi
    if (exacts.some(y => y != null && Math.abs(v - +(y * (1 + 1e-12)).toFixed(d)) < u / 10)) return null;
    const bon = fmt(x * (1 + 1e-12), d);
    const p = Math.pow(10, d + 3), long = fmt(Math.trunc(x * p) / p, d + 3);
    const s = Math.floor(Math.abs(x) * Math.pow(10, d + 1) + 1e-9) % 10;
    const n = cs(t);
    return `Ta valeur est mal arrondie : la calculatrice donne ${long}… ; avec ${n} chiffre${n > 1 ? 's' : ''} significatif${n > 1 ? 's' : ''}, on écrit ${bon} (le chiffre suivant, ${s}, est ${s >= 5 ? 'supérieur ou égal à 5 : on arrondit au-dessus' : 'inférieur à 5 : on garde le dernier chiffre'}).${csDemande && n !== csDemande ? ` On demande ${csDemande} chiffres significatifs.` : ''}`;
  }
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;
  const RAD = Math.PI / 180;
  const sinD = a => Math.sin(a * RAD);
  const asinD = x => Math.asin(x) / RAD;

  /* ============================================================
     OUTILS
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const defiler = e => setTimeout(() => e && e.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  const surOrdi = () => matchMedia('(hover: hover)').matches;
  // amène le haut de e à l'écran (sous le bandeau du sommaire) s'il n'y est pas : on n'a jamais
  // à remonter dans la page pour répondre à la question suivante
  function amener(e, haut) {
    setTimeout(() => {
      if (!e) return;
      const r = e.getBoundingClientRect();
      if (r.top >= 62 && r.top <= innerHeight * (haut || 0.6)) return;
      const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: r.top - 72, behavior: doux ? 'smooth' : 'auto' });
    }, 120);
  }

  /* ============================================================
     PLEIN ÉCRAN (pages de manipulation) : bouton [data-plein] de la première carte.
     Cache le sommaire, donne toute la largeur à la page et passe le navigateur
     en plein écran quand il le permet (comme titrage-conductimetrique).
     ============================================================ */
  function pleinEcran() {
    const b = document.querySelector('[data-plein]');
    if (!b) return;
    const html = document.documentElement;
    function regler(on) {
      html.classList.toggle('lt-plein', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? '⤡ Quitter le plein écran' : '⤢ Plein écran';
      // les figures gardent leurs poignées de 44 px (largeur affichée qui change)
      setTimeout(() => dispatchEvent(new Event('resize')), 60);
    }
    b.addEventListener('click', () => {
      const on = !html.classList.contains('lt-plein');
      regler(on);
      try {
        if (on && html.requestFullscreen) html.requestFullscreen().catch(() => {});
        if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
      } catch (e) { /* plein écran indisponible (iPhone…) : la page sans sommaire suffit */ }
    });
    // Échap sort du plein écran du navigateur : on remet aussi le sommaire
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) regler(false); });
  }

  /* ============================================================
     FENÊTRE D'AIDE (schéma de référence, loi, calculatrice)
     fenetre(titre, remplir(zone)) : fenêtre par-dessus la page ; ✕, Échap ou appui à côté pour fermer
     ============================================================ */
  function fenetre(titre, remplir) {
    const voile = el('div', 'lt-voile');
    const f = el('div', 'lt-fenetre', `<div class="lt-fenetre-tete"><h3>${titre}</h3><button type="button" class="btn-small lt-fermer" aria-label="Fermer">✕</button></div><div class="lt-fenetre-corps"></div>`);
    f.setAttribute('role', 'dialog'); f.setAttribute('aria-modal', 'true'); f.setAttribute('aria-label', titre.replace(/<[^>]+>/g, ''));
    voile.appendChild(f);
    document.body.appendChild(voile);
    const avant = document.activeElement;
    function fermer() { voile.remove(); document.removeEventListener('keydown', clavier); if (avant && avant.focus) avant.focus({ preventScroll: true }); }
    function clavier(e) { if (e.key === 'Escape') fermer(); }
    document.addEventListener('keydown', clavier);
    voile.addEventListener('click', e => { if (e.target === voile) fermer(); });
    f.querySelector('.lt-fermer').onclick = fermer;
    remplir(f.querySelector('.lt-fenetre-corps'));
    f.querySelector('.lt-fermer').focus({ preventScroll: true });
    return { fermer };
  }
  // bouton qui ouvre une fenêtre d'aide
  function boutonAide(zone, texte, titre, remplir) {
    const b = el('button', 'btn-small lt-b-aide', texte);
    b.type = 'button';
    b.onclick = () => fenetre(titre, remplir);
    zone.appendChild(b);
    return b;
  }


  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */
  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : '') + (p.figures ? ' lt-choix-fig' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button'; b.dataset.id = o.id;
      box.appendChild(b);
      if (o.figure) o.figure(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (o.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi();
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[o.id]) || p.indice || '');
        }
      };
      return { b, o };
    });
    return { montrer() { bs.forEach(({ b, o }) => { b.disabled = true; if (o.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // icône calculatrice (assets/theme.css) : valeur à calculer à la calculatrice
  const CALC = '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>';

  // Saisie d'un nombre : champ, unité, icône calculatrice ; p.avant(zone) : contenu sous le champ
  // p.verifier(v, texte) → { ok } | { diag } | { format } ; p.remplir(input) : réponse affichée
  function pNombre(zone, p, api) {
    const fin = (p.unite ? `<span class="lt-unite">${p.unite}</span>` : '') + (p.calc ? CALC : '');
    const box = el('div', 'lt-saisie', `<div class="lt-saisie-l">${p.label ? `<span class="lt-saisie-t">${p.label}</span>` : ''}
        <input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${p.aria || 'Réponse'}">${fin}</div>
      <div class="lt-saisie-plus"></div>
      <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>
      ${p.aide ? `<p class="lt-aide-saisie">${p.aide}</p>` : ''}`);
    zone.appendChild(box);
    const input = box.querySelector('input');
    if (p.avant) p.avant(box.querySelector('.lt-saisie-plus'), input);
    function valider() {
      if (api.fini()) return;
      const v = lire(input.value);
      if (isNaN(v)) { api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      const r = p.verifier(v, input.value) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { input.disabled = true; box.querySelectorAll('button').forEach(b => { b.disabled = true; }); api.reussi(); }
      else api.erreur(r.diag || '');
    }
    box.querySelector('[data-a="ok"]').onclick = valider;
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    if (surOrdi() && p.focus !== false) setTimeout(() => input.focus({ preventScroll: true }), 50);
    return {
      montrer() {
        input.disabled = true;
        box.querySelectorAll('button').forEach(b => { b.disabled = true; });
        if (p.remplir) p.remplir(input);
      },
    };
  }
  // Outil propre à l'application : p.monter(zone, api) → { montrer() }
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }
  const PARTIES = { choix: pChoix, nombre: pNombre, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     cb.partie(i) : appelée quand la partie i est réussie (déroulé guidé)
     mode 'serie' : « Afficher la réponse » toujours là (0 point pour la question) ;
     mode 'manip' : proposé après deux erreurs sur la même partie.
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false };
    const n = q.parties.length;
    let rendues = 0, finies = 0;
    function partie() {
      const p = q.parties[rendues++];
      const num = n > 1 && mode === 'serie' ? `<p class="ph-partie-num">Question ${rendues} / ${n}</p>` : '';
      const d = el('div', 'ph-partie', `${num}${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour" aria-live="polite"></div>
        <div class="ph-partie-aide"${mode === 'manip' ? ' hidden' : ''}><button type="button" class="btn-small">Afficher la réponse</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) { ret.innerHTML = `<p class="ph-msg">${h}</p>`; defiler(ret); } },
        erreur(h) {
          etat.erreurs++; erreursIci++;
          const fin = mode === 'serie' ? 'Corrige ta réponse, ou affiche la réponse (0 point pour cette question).' : 'Corrige ta réponse, ou affiche la réponse.';
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 ? `<p class="er-petit">${fin}</p>` : ''}</div>`;
          if (mode === 'manip' && erreursIci >= 2) aide.hidden = false;
          defiler(ret);
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        const titre = vue ? 'Réponse' : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${typeof sol === 'function' ? sol() : sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        finies++;
        if (cb.partie) cb.partie(finies - 1, vue);
        if (finies < n) {
          if (mode === 'serie') {
            // la partie suivante remplace celle-ci, une fois son retour lu
            const a = el('div', 'er-actions ph-partie-suite', '<button type="button" class="btn-primary">Suite →</button>');
            d.appendChild(a);
            a.querySelector('button').onclick = () => { d.remove(); partie(); amener(zone, 0.5); };
            defiler(a);
          } else { partie(); defiler(zone.lastElementChild); }
        } else {
          etat.fini = true;
          cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat);
        }
      }
    }
    partie();
  }

  /* ============================================================
     SÉRIE DE QUESTIONS NOTÉE SUR 20
     opts = { app, badge, titre, intro, questions: () => [q], revoir, suite }
     q = { theme, consigne, enonce, figure(zone), parties, bilan }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [];
    const pts = v => `${v} pt${v > 1 ? 's' : ''}`;

    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.LT.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card ph-tete"><div class="lt-tete"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
            <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p></div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          <div class="lt-q-corps">${q.figure ? '<div class="lt-q-fig"></div>' : ''}<div class="lt-q-texte">${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}<div data-a="parties"></div></div></div>
          <div data-a="retour"></div><div class="er-actions" data-a="suite"></div></div>`;
      if (q.figure) q.figure(app.querySelector('.lt-q-fig'));
      window.scrollTo(0, 0);
      // évite qu'un double appui sur « Question suivante » réponde à la nouvelle question
      app.style.pointerEvents = 'none';
      setTimeout(() => { app.style.pointerEvents = ''; }, 350);
      question(app.querySelector('[data-a="parties"]'), q, {
        fin(p) {
          score += p; recap.push({ n: idx + 1, p });
          app.querySelector('[data-a="score"]').textContent = pts(score);
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
          app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour ph-bilan"><p><b class="${p ? 'er-ok' : ''}">${titre}</b> +${pts(p)}</p>${q.bilan ? `<p>${q.bilan}</p>` : ''}</div>`;
          const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
          s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
          const b = s.querySelector('button');
          setTimeout(() => { b.disabled = false; }, 450);
          b.onclick = () => { idx++; afficher(); };
          defiler(s);
        },
      }, 'serie');
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      SOM.marquer({ note });
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : refais les manipulations des modules 1 et 3, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${fmt(note)} / 20</div><p class="er-score-pct">${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 1 ? 'moyen' : 'ko'}">Q${r.n}<b>${r.p}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${opts.revoir ? `<a class="btn-secondary" style="text-decoration:none" href="${opts.revoir.href}">${opts.revoir.label}</a>` : ''}
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }
    intro();
  }

  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#5a3fc4', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const e = document.createElement('div');
      e.className = 'er-confetti';
      e.style.left = (Math.random() * 100) + 'vw';
      e.style.background = col[i % col.length];
      e.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      e.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 4800);
    }
  }


  /* ---------- Liens « Revois… » vers d'autres applications (nouvelle fenêtre) ---------- */
  const APPLIS = {
    conversions: { href: '../../conversions/index.html', texte: 'Revois les conversions (m, cm, mm)' },
    proportionnalite: { href: '../../proportionnalite/index.html', texte: 'Revois la proportionnalité' },
    refraction: { href: '../../refraction/index.html', texte: 'Revois la réfraction' },
  };
  function revois(liste) {
    return `<p class="lt-revois">${liste.map(k => `<a href="${APPLIS[k].href}" target="_blank" rel="noopener">${APPLIS[k].texte} ↗</a>`).join('')}</p>`;
  }

  /* ---------- Vergence → distance focale : « v = 10 δ, f′ = 1 / v = 1 / 10 = 0,10 m = 10 cm » ---------- */
  function vergence(v) {
    const fm = 1 / v, fcm = fm * 100;
    return `v = ${fmt(v)} δ, f′ = 1 / v = 1 / ${fmt(v)} = ${fmt(fm, fm < 0.1 - 1e-9 ? 3 : 2).replace(/0$/, fm < 0.1 - 1e-9 ? '' : '0')} m = ${fmt(fcm)} cm`;
  }

  /* ---------- La lettre « d » : hauteur 1, pied (A) en (0, 0), repère SVG (y vers le bas) ---------- */
  function lettre(parent, x, y, taille, renversee, cls) {
    const g = OPT.svgEl('g', { class: cls || 'lt-lettre', transform: `translate(${x} ${y}) scale(${taille})${renversee ? ' rotate(180)' : ''}` }, parent);
    OPT.svgEl('line', { x1: 0.18, y1: -1, x2: 0.18, y2: 0, 'stroke-width': 0.15, 'stroke-linecap': 'butt' }, g);
    OPT.svgEl('circle', { cx: -0.1, cy: -0.27, r: 0.21, 'stroke-width': 0.13, fill: 'none' }, g);
    return g;
  }

  window.LT = {
    PLAN, CALC, fmt, sig, court, lire, cs, fr, el, melanger, hasard, defiler, amener, surOrdi, revois, vergence,
    PARTIES, question, serie, confettis, malArrondi, pleinEcran, fenetre, boutonAide, lettre,
  };
})();
