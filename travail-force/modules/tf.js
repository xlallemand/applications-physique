/* ============================================================
   Travail d'une force — outils communs du simulateur (objet TF)
   Application d'un seul écran (comme double-periodicite/) ; cadre et
   défis repris de champ-uniforme/modules/sim.js (modèle : atome-ions/).

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
   Écran
     TF.cadre(zone, cfg)     figure à gauche, panneau à onglets à droite
                             (téléphone < 900 px : figure en haut, panneau dessous)
       cfg = { bande, bas (HTML au-dessus / au-dessous de la figure),
               onglets: [{ id, nom, court (nom sur téléphone) }], sections: [{ id, html }], surOnglet(id) }
       → { $, zone, onglet(id), courant(), message(html, type), fig, tel() }
     TF.defis(zone, liste, opts)   défis « À essayer », cochés tout seuls,
                             dans n'importe quel ordre
       liste = [{ t (texte ou fonction), ok(etat), preparer(), debut() }]
       opts = { bilan (HTML quand tout est réussi), surTout() }
       → { verifier(etat), faits, tousFaits(), choisir(i) }
     TF.question(zone, q)    question du panneau, sans points :
       q.type 'choix'  : { options: [[v, texte]], bonne, indices: { v: diagnostic } }
       q.type 'nombre' : { label, unite, valeur, rel | tol, calc (icône calculatrice),
                           diag(v) → diagnostic ou null }
       q.type 'phrase' : { morceaux: ['texte', { options: [...], bonne, indices }, …] }
       communs : { enonce, solution, surReussite(), regler() (bouton « Régler le simulateur »,
                   libellé reglerNom) } → { reussie() }
       Retours : « Juste ! » / « C'est juste. », « Ce n'est pas ça. » + diagnostic ;
       « Afficher la réponse » après une erreur.
     TF.champ(opts)          champ numérique avec bouton ± → { el, input }
     TF.vec(nom)             nom de vecteur surmonté d'une flèche (VEC.nomHTML)
   ============================================================ */
(function () {
  'use strict';

  const NB = ' ';                 // espace insécable
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
    let s = String(t == null ? '' : t).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(/,/g, '.');
    s = s.replace(/[×x*]10\^?\(?(-?\d+)\)?$/i, 'e$1');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  const rad = a => a * Math.PI / 180;
  // cosinus en degrés, arrondi : cos 90° vaut 0 (pas 6 × 10⁻¹⁷)
  function cosd(a) { const c = Math.cos(rad(a)); return Math.abs(c) < 1e-9 ? 0 : Math.round(c * 1e12) / 1e12; }
  const nature = w => (w > 1e-9 ? 'moteur' : w < -1e-9 ? 'résistant' : 'nul');
  const vec = n => (window.VEC ? window.VEC.nomHTML(n) : `<span class="vec-nom">${n}</span>`);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const surOrdi = () => matchMedia('(hover: hover)').matches;
  // amène un élément à l'écran sans sauter (charte §8)
  const amener = e => { if (e && e.scrollIntoView) setTimeout(() => e.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60); };

  /* ---------- Cadre de l'écran ---------- */
  function cadre(zone, cfg) {
    zone.innerHTML = `<div class="tf-sim">
        <div class="er-card tf-scene">
          ${cfg.bande ? `<div class="tf-bande" data-a="bande">${cfg.bande}</div>` : ''}
          <div class="tf-fig" data-a="fig"></div>
          ${cfg.bas ? `<div class="tf-bas" data-a="bas">${cfg.bas}</div>` : ''}
          <div class="tf-msg" data-a="msg" aria-live="polite"></div>
        </div>
        <aside class="er-card tf-panneau" aria-label="Valeurs, graphiques, défis et bilan">
          <div class="tf-onglets" role="tablist">${cfg.onglets.map(o => `<button type="button" role="tab" data-o="${o.id}" aria-selected="false">${o.court ? `<span class="tf-o-long">${o.nom}</span><span class="tf-o-court" aria-hidden="true">${o.court}</span>` : o.nom}</button>`).join('')}</div>
          <div class="tf-blocs" data-a="blocs">${cfg.sections.map(s => `<section class="tf-bloc" data-s="${s.id}" role="tabpanel">${s.html}</section>`).join('')}</div>
        </aside>
      </div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const mq = matchMedia('(max-width: 899px)');
    let courant = cfg.onglets[0].id;
    function onglet(id) {
      const o = cfg.onglets.find(x => x.id === id) || cfg.onglets[0];
      courant = o.id;
      zone.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-selected', b.dataset.o === o.id ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('actif', s.dataset.s === o.id));
      $('blocs').scrollTop = 0;
      if (cfg.surOnglet) cfg.surOnglet(o.id);
    }
    zone.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    function message(h, type) {
      const m = $('msg');
      if (!h) { m.innerHTML = ''; return; }
      const c = type === 'refus' ? 'callout-danger' : type === 'ok' ? 'callout-success' : 'callout-accent';
      m.innerHTML = `<div class="${c} tf-msg-in">${h}</div>`;
    }
    onglet(courant);
    return { $, zone, onglet, courant: () => courant, message, fig: $('fig'), tel: () => mq.matches };
  }

  /* ---------- Défis « À essayer » ---------- */
  function defis(zone, liste, opts) {
    opts = opts || {};
    zone.innerHTML = `<div class="tf-puces" role="tablist" aria-label="Défis">${liste.map((d, i) => `<button type="button" role="tab" class="tf-puce" data-p="${i}" aria-selected="false" aria-label="Défi ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="tf-defi-t" data-a="defiTexte"></div><div class="tf-defis-bilan" data-a="bilanDefis" aria-live="polite"></div>`;
    const faits = liste.map(() => false), puces = Array.from(zone.querySelectorAll('.tf-puce'));
    let choisi = 0, fini = false;
    const texte = d => (typeof d.t === 'function' ? d.t() : d.t);
    function choisir(i, sansDebut) {
      choisi = i;
      puces.forEach((p, k) => p.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      if (puces[i].parentElement.scrollWidth > puces[i].parentElement.clientWidth) puces[i].scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const d = liste[i];
      if (!sansDebut && !faits[i] && d.debut) d.debut();
      zone.querySelector('[data-a="defiTexte"]').innerHTML = `<p>${faits[i] ? '<b class="tf-ok">✓ Réussi' + NB + ':</b> ' : ''}${texte(d)}</p>${!faits[i] && d.preparer ? '<button type="button" class="btn-small tf-essayer" data-go>Essayer</button>' : ''}`;
      const go = zone.querySelector('[data-go]');
      if (go) go.onclick = () => { d.preparer(); choisir(i, true); };
    }
    puces.forEach((p, i) => { p.onclick = () => choisir(i); });
    function verifier(etat) {
      const nouveaux = [];
      liste.forEach((d, i) => {
        if (!faits[i] && d.ok(etat)) { faits[i] = true; nouveaux.push(i); }
        puces[i].classList.toggle('fait', faits[i]);
        puces[i].setAttribute('aria-label', `Défi ${i + 1}${faits[i] ? ', réussi' : ''}`);
      });
      if (nouveaux.length) {
        // le défi réussi reste affiché (coché) : l'élève voit ce qu'il a obtenu
        choisir(nouveaux[nouveaux.length - 1], true);
        if (opts.surReussite) opts.surReussite(nouveaux);
      }
      if (faits.every(Boolean) && !fini) {
        fini = true;
        zone.querySelector('[data-a="bilanDefis"]').innerHTML = opts.bilan ? `<div class="callout-success tf-msg-in">${opts.bilan}</div>` : '';
        if (opts.surTout) opts.surTout();
      }
    }
    choisir(0, true);
    return { verifier, faits, tousFaits: () => faits.every(Boolean), choisir, choisi: () => choisi, rafraichir: () => choisir(choisi, true) };
  }

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

  /* ---------- Question du panneau (sans points) ---------- */
  function question(zone, q) {
    const boite = el('div', 'tf-q');
    boite.innerHTML = `<div class="tf-q-enonce">${q.enonce}</div><div class="tf-q-rep" data-q="rep"></div>
      <div class="tf-q-retour" data-q="retour" aria-live="polite"></div>
      <div class="tf-q-actions">${q.regler ? `<button type="button" class="btn-small" data-q="regler">${q.reglerNom || 'Régler le simulateur'}</button>` : ''}<button type="button" class="btn-small" data-q="aide" hidden>Afficher la réponse</button></div>`;
    zone.appendChild(boite);
    const rep = boite.querySelector('[data-q="rep"]'), retour = boite.querySelector('[data-q="retour"]'), bAide = boite.querySelector('[data-q="aide"]');
    let erreurs = 0, fini = false;
    function reussi() {
      if (fini) return;
      fini = true;
      retour.innerHTML = `<div class="callout-success tf-msg-in"><b>${erreurs ? 'C\'est juste.' : 'Juste' + NB + '!'}</b> ${q.solution || ''}</div>`;
      bAide.hidden = true;
      verrouiller();
      if (q.surReussite) q.surReussite();
      amener(retour);
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
      retour.innerHTML = `<div class="callout tf-msg-in"><b>Réponse${NB}:</b> ${q.solution || ''}</div>`;
      bAide.hidden = true;
      verrouiller(true);
      if (q.surReussite) q.surReussite();
      amener(retour);
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
        const att = typeof q.valeur === 'function' ? q.valeur() : q.valeur;
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
    }
    return { reussie: () => fini, el: boite };
  }

  window.TF = { NB, MOINS, fmt, cs, joules, deg, lire, rad, cosd, nature, vec, el, surOrdi, amener, cadre, defis, champ, question };
})();
