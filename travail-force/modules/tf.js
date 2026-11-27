/* ============================================================
   Travail d'une force — outils communs (objet TF)

   Écriture des nombres
     TF.fmt(v, dec)          v avec dec décimales, virgule, signe − (U+2212)
     TF.cs(v, n)             v avec n chiffres significatifs (espace des milliers,
                             écriture scientifique a × 10ⁿ au-delà de 10 000)
     TF.joules(w)            travail écrit en joules (3 chiffres significatifs, « 0 J »)
     TF.deg(a)               angle écrit en degrés (« −90° »)
     TF.lire(texte)          nombre tapé par l'élève (virgule ou point, − ou −,
                             espaces, « 9,4e4 », « 9,4 × 10^4 ») ; NaN sinon
     TF.cosd(a)              cosinus d'un angle en DEGRÉS, arrondi (cos 90° = 0)
     TF.nature(w)            'moteur' | 'nul' | 'résistant'
   Panneau des questions
     TF.question(zone, q)    une question, sans points :
       q.type 'choix'  : { options: [[v, texte]], bonne, indices: { v: diagnostic } }
       q.type 'nombre' : { label, unite, valeur (nombre ou fonction), rel | tol, calc (icône
                           calculatrice), diag(v) → diagnostic, affiche (réponse montrée) }
       q.type 'phrase' : { morceaux: ['texte', { options: [...], bonne, indices }, …] }
       q.type 'grille' : { options: [[v, texte]], lignes: [{ label, bonne, indices, indice }],
                           liste (menus déroulants au lieu de boutons) }
       communs : { enonce, solution, surReussite(), regler() (bouton « Régler le simulateur »,
                   libellé reglerNom) } → { reussie(), el }
       Retours : « Juste ! » / « C'est juste. », « Ce n'est pas ça. » + diagnostic ;
       « Afficher la réponse » après une erreur.
     TF.suite(zone, parties, opts)   questions qui s'enchaînent dans le panneau : chaque partie
                             réussie fait apparaître la suivante (défilement automatique).
       partie : une question (ci-dessus), ou { type: 'texte', html }, ou
                { type: 'perso', enonce, monter(zone, api) } (api.reussi(conclusion)) ;
                une partie peut être une fonction (construite au moment où elle apparaît) ;
                p.scene : réglages du simulateur pour cette partie (opts.surPartie(p))
       opts = { defile (élément qui défile), surPartie(p), fin() }
     TF.graphe(svg, o)       graphique de points : o = { pts: [[x, y]], xMin, xMax, xPas, xNom,
                             yNom, droite (droite passant par l'origine, coefficient), dec }
     TF.champ(opts)          champ numérique avec bouton ± → { el, input }
     TF.vec(nom)             nom de vecteur surmonté d'une flèche (VEC.nomHTML)
   ============================================================ */
(function () {
  'use strict';

  const NB = '\u00a0';                 // espace insécable
  const MOINS = '−';              // signe moins typographique

  /* ---------- Écriture des nombres ---------- */
  // espace insécable entre les groupes de trois chiffres de la partie entière
  function milliers(s) {
    const [e, d] = s.split('.');
    const g = e.replace(/\B(?=(\d{3})+(?!\d))/g, NB);
    return d != null ? g + ',' + d : g;
  }
  function fmt(v, dec) {
    if (dec == null) dec = 0;
    const n = Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v;
    const s = Math.abs(n).toFixed(dec);
    return (n < 0 ? MOINS : '') + milliers(s);
  }
  // n chiffres significatifs ; écriture scientifique pour |v| ≥ 10 000 ou très petit
  function cs(v, n) {
    if (!isFinite(v)) return '?';
    if (v === 0) return '0';
    const a = Math.abs(v), p = Math.floor(Math.log10(a));
    if (p >= 4 || p < -3) {
      let m = a / Math.pow(10, p), e = p;
      m = +m.toFixed(n - 1);
      if (m >= 10) { m /= 10; e += 1; }
      return (v < 0 ? MOINS : '') + m.toFixed(n - 1).replace('.', ',') + ' × 10<sup>' + (e < 0 ? MOINS : '') + Math.abs(e) + '</sup>';
    }
    const dec = Math.max(0, n - 1 - p);
    const r = +a.toFixed(dec);
    // un arrondi qui ajoute un chiffre (9,99 → 10,0) : on garde n chiffres
    const p2 = Math.floor(Math.log10(r || 1)), dec2 = Math.max(0, n - 1 - p2);
    return (v < 0 ? MOINS : '') + milliers(r.toFixed(dec2));
  }
  const joules = w => (Math.abs(w) < 1e-9 ? '0' : cs(w, 3)) + NB + 'J';
  const deg = a => (a < 0 ? MOINS : '') + Math.abs(Math.round(a)) + '°';
  // lecture d'une saisie : « 7,66 », « −7.66 », « 9,4e4 », « 9,4 × 10^4 », « 9,4x10^4 »
  function lire(t) {
    let s = String(t == null ? '' : t).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');
    s = s.replace(/[×x*]10\^?\(?(-?\d+)\)?$/i, 'e$1');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  const rad = a => a * Math.PI / 180;
  // cosinus en degrés, arrondi : cos 90° vaut 0 (pas 6 × 10⁻¹⁷)
  function cosd(a) { const c = Math.cos(rad(a)); return Math.abs(c) < 1e-9 ? 0 : Math.round(c * 1e12) / 1e12; }
  function sind(a) { const s = Math.sin(rad(a)); return Math.abs(s) < 1e-9 ? 0 : Math.round(s * 1e12) / 1e12; }
  const nature = w => (w > 1e-9 ? 'moteur' : w < -1e-9 ? 'résistant' : 'nul');
  const vec = n => (window.VEC ? window.VEC.nomHTML(n) : `<span class="vec-nom">${n}</span>`);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const surOrdi = () => matchMedia('(hover: hover)').matches;
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // amène un élément à l'écran dans le panneau qui défile (charte §8)
  const amener = e => { if (e && e.scrollIntoView) setTimeout(() => e.scrollIntoView({ block: 'nearest', behavior: reduit() ? 'auto' : 'smooth' }), 60); };
  const valeurDe = v => (typeof v === 'function' ? v() : v);

  /* ---------- Champ numérique avec ± ---------- */
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'tf-champ-g');
    d.innerHTML = `<button type="button" class="tf-pm" aria-label="Changer le signe">±</button><input class="tf-champ" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input');
    d.querySelector('.tf-pm').onclick = () => {
      const v = input.value.trim();
      input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
      if (surOrdi()) input.focus();
      input.dispatchEvent(new Event('input'));
    };
    return { el: d, input };
  }

  /* ---------- Une question (sans points) ---------- */
  function question(zone, q) {
    const boite = el('div', 'tf-q');
    boite.innerHTML = `<div class="tf-q-enonce">${valeurDe(q.enonce) || ''}</div><div class="tf-q-rep" data-q="rep"></div>
      <div class="tf-q-retour" data-q="retour" aria-live="polite"></div>
      <div class="tf-q-actions">${q.regler ? `<button type="button" class="btn-small" data-q="regler">${q.reglerNom || 'Régler le simulateur'}</button>` : ''}<button type="button" class="btn-small" data-q="aide" hidden>Afficher la réponse</button></div>`;
    zone.appendChild(boite);
    const rep = boite.querySelector('[data-q="rep"]'), retour = boite.querySelector('[data-q="retour"]'), bAide = boite.querySelector('[data-q="aide"]');
    let erreurs = 0, fini = false;
    function reussi() {
      if (fini) return;
      fini = true;
      retour.innerHTML = `<div class="callout-success tf-msg-in"><b>${erreurs ? 'C\'est juste.' : 'Juste' + NB + '!'}</b> ${valeurDe(q.solution) || ''}</div>`;
      bAide.hidden = true;
      verrouiller();
      amener(retour);
      if (q.surReussite) q.surReussite();
    }
    function erreur(diag) {
      erreurs++;
      retour.innerHTML = `<div class="callout-danger tf-msg-in"><b>Ce n'est pas ça.</b> ${diag || ''}${erreurs >= 2 ? ' Corrige ta réponse, ou affiche la réponse.' : ''}</div>`;
      bAide.hidden = false;
      amener(retour);
    }
    function avertir(t) { retour.innerHTML = `<div class="callout tf-msg-in">${t}</div>`; }
    function montrer() {
      if (fini) return;
      fini = true;
      retour.innerHTML = `<div class="callout tf-msg-in"><b>Réponse${NB}:</b> ${valeurDe(q.solution) || ''}</div>`;
      bAide.hidden = true;
      verrouiller(true);
      amener(retour);
      if (q.surReussite) q.surReussite();
    }
    bAide.onclick = montrer;
    const bReg = boite.querySelector('[data-q="regler"]');
    if (bReg) bReg.onclick = () => q.regler();
    let verrouiller = () => {};

    if (q.type === 'choix') {
      rep.innerHTML = `<div class="tf-choix">${q.options.map(([v, t]) => `<button type="button" class="btn-secondary" data-v="${v}">${t}</button>`).join('')}</div>`;
      rep.querySelectorAll('[data-v]').forEach(b => {
        b.onclick = () => {
          if (fini) return;
          if (b.dataset.v === String(q.bonne)) { b.classList.add('tf-bon'); reussi(); }
          else { b.classList.add('tf-faux'); erreur((q.indices || {})[b.dataset.v]); }
        };
      });
      verrouiller = montre => rep.querySelectorAll('[data-v]').forEach(b => { b.disabled = true; if (montre && b.dataset.v === String(q.bonne)) b.classList.add('tf-bon'); });
    } else if (q.type === 'nombre') {
      const ligne = el('div', 'tf-q-ligne');
      ligne.innerHTML = `<span class="tf-q-label">${q.label || ''}</span>`;
      const c = champ({ aria: (q.label || 'Valeur').replace(/<[^>]+>/g, '') });
      ligne.appendChild(c.el);
      ligne.insertAdjacentHTML('beforeend', `<span class="tf-q-unite">${q.unite || ''}</span>${q.calc ? '<span class="calc-icone" role="img" aria-label="À calculer à la calculatrice" title="À calculer à la calculatrice"></span>' : ''}<button type="button" class="btn-primary tf-valider">Valider</button>`);
      rep.appendChild(ligne);
      const valider = () => {
        if (fini) return;
        const v = lire(c.input.value);
        if (isNaN(v)) { avertir('Écris un nombre (avec une virgule si besoin).'); return; }
        const att = valeurDe(q.valeur);
        const ok = q.tol != null ? Math.abs(v - att) <= q.tol + 1e-12 : Math.abs(v - att) <= Math.abs(att) * (q.rel || 0.01) + 1e-12;
        if (ok) reussi(); else erreur((q.diag && q.diag(v, att)) || 'Recommence le calcul.');
      };
      ligne.querySelector('.tf-valider').onclick = valider;
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
      verrouiller = montre => {
        c.input.disabled = true; ligne.querySelectorAll('button').forEach(b => { b.disabled = true; });
        if (montre && q.affiche) c.input.value = q.affiche;
      };
    } else if (q.type === 'phrase') {
      const p = el('p', 'tf-phrase');
      const trous = [];
      q.morceaux.forEach(m => {
        if (typeof m === 'string') { p.insertAdjacentHTML('beforeend', m); return; }
        const s = el('select', 'tf-trou');
        s.setAttribute('aria-label', 'Mot à choisir');
        s.innerHTML = '<option value="">…</option>' + m.options.map(o => `<option value="${o}">${o}</option>`).join('');
        p.appendChild(s);
        trous.push({ s, m });
      });
      rep.appendChild(p);
      const b = el('button', 'btn-primary tf-valider', 'Valider');
      b.type = 'button';
      rep.appendChild(b);
      b.onclick = () => {
        if (fini) return;
        if (trous.some(t => !t.s.value)) { avertir('Choisis un mot dans chaque case.'); return; }
        const faux = trous.find(t => t.s.value !== t.m.bonne);
        trous.forEach(t => t.s.classList.toggle('tf-faux', t.s.value !== t.m.bonne));
        if (!faux) reussi(); else erreur((faux.m.indices || {})[faux.s.value] || 'Relis la case en rouge.');
      };
      verrouiller = montre => { trous.forEach(t => { if (montre) t.s.value = t.m.bonne; t.s.classList.remove('tf-faux'); t.s.disabled = true; }); b.disabled = true; };
    } else if (q.type === 'grille') {
      // une ligne par élément ; une réponse par ligne (boutons ou menu déroulant)
      const g = el('div', 'tf-grille-q');
      const choix = q.lignes.map(() => null);
      q.lignes.forEach((l, i) => {
        const r = el('div', 'tf-gl');
        r.innerHTML = `<div class="tf-gl-l">${l.label}</div>` + (q.liste
          ? `<select class="tf-trou tf-gl-s" aria-label="${l.label.replace(/<[^>]+>/g, '')}"><option value="">…</option>${q.options.map(([v, t]) => `<option value="${v}">${t.replace(/<[^>]+>/g, '')}</option>`).join('')}</select>`
          : `<div class="tf-seg tf-gl-b" role="group">${q.options.map(([v, t]) => `<button type="button" data-v="${v}" aria-pressed="false">${t}</button>`).join('')}</div>`);
        g.appendChild(r);
        if (q.liste) {
          const s = r.querySelector('select');
          s.onchange = () => { choix[i] = s.value || null; s.classList.remove('tf-faux'); };
        } else r.querySelectorAll('[data-v]').forEach(b => {
          b.onclick = () => {
            if (fini) return;
            choix[i] = b.dataset.v;
            r.querySelectorAll('[data-v]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
            r.classList.remove('tf-gl-faux');
          };
        });
      });
      rep.appendChild(g);
      const b = el('button', 'btn-primary tf-valider', 'Valider');
      b.type = 'button';
      rep.appendChild(b);
      b.onclick = () => {
        if (fini) return;
        if (choix.some(x => x == null)) { avertir('Réponds pour chaque ligne.'); return; }
        let premier = -1;
        q.lignes.forEach((l, i) => {
          const faux = choix[i] !== String(l.bonne), r = g.children[i];
          r.classList.toggle('tf-gl-faux', faux);
          if (q.liste) r.querySelector('select').classList.toggle('tf-faux', faux);
          if (faux && premier < 0) premier = i;
        });
        if (premier < 0) reussi();
        else { const l = q.lignes[premier]; erreur(((l.indices || {})[choix[premier]]) || l.indice || 'Relis la ligne en rouge.'); }
      };
      verrouiller = montre => {
        q.lignes.forEach((l, i) => {
          const r = g.children[i];
          r.classList.remove('tf-gl-faux');
          if (q.liste) { const s = r.querySelector('select'); if (montre) s.value = l.bonne; s.classList.remove('tf-faux'); s.disabled = true; }
          else r.querySelectorAll('[data-v]').forEach(x => { x.disabled = true; if (montre) x.setAttribute('aria-pressed', String(x.dataset.v === String(l.bonne))); });
        });
        b.disabled = true;
      };
    }
    return { reussie: () => fini, el: boite };
  }

  /* ---------- Questions qui s'enchaînent ---------- */
  function suite(zone, parties, opts) {
    opts = opts || {};
    let i = -1, finie = false;
    // fait défiler le panneau : la nouvelle partie en entier si possible,
    // sans cacher le retour de la partie précédente quand il y a la place
    function defiler(d) {
      const c = opts.defile;
      if (!c) { amener(d); return; }
      setTimeout(() => {
        const rc = c.getBoundingClientRect(), rd = d.getBoundingClientRect();
        const haut = rd.top - rc.top + c.scrollTop, bas = haut + rd.height;
        const prec = d.previousElementSibling, rp = prec ? prec.getBoundingClientRect() : null;
        const retourHaut = rp ? rp.bottom - rc.top + c.scrollTop - Math.min(rp.height, 110) : haut;
        let cible = Math.max(bas - c.clientHeight + 10, retourHaut - 6);
        cible = Math.min(cible, haut - 6);
        if (cible > c.scrollTop) c.scrollTo({ top: cible, behavior: reduit() ? 'auto' : 'smooth' });
      }, 80);
    }
    function suivante() {
      i++;
      if (i >= parties.length) { finie = true; if (opts.fin) opts.fin(); return; }
      let p = parties[i];
      if (typeof p === 'function') p = p();
      if (opts.surPartie) opts.surPartie(p);
      const d = el('div', 'tf-partie');
      zone.appendChild(d);
      if (p.type === 'texte') {
        d.innerHTML = p.html;
        defiler(d);
        suivante();
        return;
      }
      if (p.type === 'perso') {
        d.innerHTML = `<div class="tf-q"><div class="tf-q-enonce">${valeurDe(p.enonce) || ''}</div><div data-q="corps"></div><div class="tf-q-retour" data-q="retour" aria-live="polite"></div></div>`;
        const retour = d.querySelector('[data-q="retour"]');
        let fait = false;
        p.monter(d.querySelector('[data-q="corps"]'), {
          reussi(conclusion) {
            if (fait) return;
            fait = true;
            const t = conclusion || valeurDe(p.solution);
            if (t) retour.innerHTML = `<div class="callout-success tf-msg-in"><b>C'est fait${NB}!</b> ${t}</div>`;
            if (p.surReussite) p.surReussite();
            suivante();
          },
          fait: () => fait,
        });
      } else question(d, Object.assign({}, p, { surReussite: () => { if (p.surReussite) p.surReussite(); suivante(); } }));
      defiler(d);
    }
    suivante();
    return { index: () => i, finie: () => finie };
  }

  /* ---------- Graphique de points (SVG) ---------- */
  const pasJoli = m => { const p = Math.pow(10, Math.floor(Math.log10(m / 2))), r = m / 2 / p; return (r < 1.5 ? 1 : r < 3.5 ? 2 : r < 7.5 ? 5 : 10) * p; };
  function graphe(svg, o) {
    const pts = o.pts || [];
    const g0 = { l: 46, r: 288, t: 18, b: 146 };
    const xMin = o.xMin != null ? o.xMin : Math.min(0, ...pts.map(p => p[0])), xMax = o.xMax != null ? o.xMax : Math.max(1e-9, ...pts.map(p => p[0]));
    const xPas = o.xPas || pasJoli(xMax - xMin);
    const ym = Math.max(o.yMax || 1, ...pts.map(p => Math.abs(p[1])));
    const pasY = pasJoli(ym), Y = Math.ceil(ym / pasY - 1e-9) * pasY;
    const neg = o.neg || pts.some(p => p[1] < -1e-9), pos = o.neg || pts.some(p => p[1] > 1e-9) || !neg;
    const y0 = neg ? -Y : 0, y1 = pos ? Y : 0;
    const px = x => g0.l + (x - xMin) / (xMax - xMin) * (g0.r - g0.l), py = y => g0.b - (y - y0) / ((y1 - y0) || 1) * (g0.b - g0.t);
    const dx = o.dec != null ? o.dec : xPas < 1 ? (xPas < 0.1 ? 2 : 1) : 0;
    let h = '';
    for (let x = xMin; x <= xMax + 1e-9; x += xPas) h += `<line x1="${px(x).toFixed(1)}" y1="${g0.t}" x2="${px(x).toFixed(1)}" y2="${g0.b}" class="tf-grille"/><text x="${px(x).toFixed(1)}" y="${g0.b + 14}" class="tf-grad" text-anchor="middle">${fmt(x, dx)}</text>`;
    for (let y = y0; y <= y1 + 1e-9; y += pasY) h += `<line x1="${g0.l}" y1="${py(y).toFixed(1)}" x2="${g0.r}" y2="${py(y).toFixed(1)}" class="tf-grille"/><text x="${g0.l - 5}" y="${(py(y) + 4).toFixed(1)}" class="tf-grad" text-anchor="end">${fmt(y, pasY < 1 ? 1 : 0)}</text>`;
    const x0 = px(Math.max(xMin, Math.min(xMax, 0)));
    h += `<line x1="${g0.l}" y1="${py(0).toFixed(1)}" x2="${g0.r}" y2="${py(0).toFixed(1)}" class="tf-axe"/><line x1="${x0.toFixed(1)}" y1="${g0.t}" x2="${x0.toFixed(1)}" y2="${g0.b}" class="tf-axe"/>`;
    h += `<text x="${g0.r}" y="${g0.b + 28}" class="tf-nom-axe" text-anchor="end">${o.xNom || ''}</text><text x="4" y="${g0.t - 5}" class="tf-nom-axe">${o.yNom || 'W (J)'}</text>`;
    if (o.droite != null) h += `<line x1="${px(xMin).toFixed(1)}" y1="${py(o.droite * xMin).toFixed(1)}" x2="${px(xMax).toFixed(1)}" y2="${py(o.droite * xMax).toFixed(1)}" class="tf-courbe-th"/>`;
    pts.forEach(p => { h += `<circle cx="${px(p[0]).toFixed(1)}" cy="${py(p[1]).toFixed(1)}" r="4" class="tf-pt"/>`; });
    svg.setAttribute('viewBox', '0 0 300 180');
    svg.innerHTML = h;
    svg.setAttribute('aria-label', `${o.aria || 'Graphique'} : ${pts.length} point${pts.length > 1 ? 's' : ''}`);
  }

  window.TF = { NB, MOINS, fmt, cs, joules, deg, lire, rad, cosd, sind, nature, vec, el, surOrdi, reduit, amener, champ, question, suite, graphe, pasJoli };
})();
