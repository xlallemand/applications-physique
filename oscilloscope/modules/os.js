/* ============================================================
   Moteur de l'application « Oscilloscope »
   (Physique · Lycée ; moteur de questions repris de « Période et fréquence d'un signal »,
   navigation commune assets/sommaire.js, oscilloscope dans modules/oscillo.js)

   OS.fmt(v, dec), OS.sci(v, c), OS.sciCourt(v), OS.sig(v, c), OS.court(v, c), OS.egal(v, c), OS.lire(s)   nombres
   OS.el(tag, cls, html), OS.melanger(t), OS.hasard(t), OS.defiler(e), OS.amener(e) (haut de e amené à l'écran)
   OS.PARTIES                       parties de question :
     'choix'  : p.options [{ id, label }], p.bonne, p.indices[id] ou p.indice
     'nombre' : p.label, p.unite, p.verifier(v) → { ok } | { diag } | { format } ; p.sci : saisie a × 10ⁿ ;
                p.signe : bouton ± pour la valeur ; p.calc : icône calculatrice ; p.lien : HTML sous la saisie ;
                p.remplir(ins) : réponse affichée (peut aussi placer les curseurs de l'oscilloscope)
     'perso'  : p.monter(zone, api) → { montrer() }
   OS.question(zone, q, cb, mode)   question en parties successives ; mode 'manip' : « Afficher la réponse »
                                    proposé après 2 erreurs sur la même partie
   OS.partiesFrequence(o)           parties « T en secondes » puis « f = 1 / T »
   OS.deroule(lis, n)               déroulé guidé : étapes faites (✓), en cours, à venir
   OS.finDefi(zone, bilan, liens, refaire)   fin d'un défi : bilan, « ↺ Nouveau signal », liens
   OS.revois(liste)                 liens « Revois… » vers d'autres applications (nouvelle fenêtre)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Plan de l'application (sommaire, accueil, progression) ---------- */
  const PLAN = [
    { n: 1, titre: 'Mesurer une durée entre deux signaux', desc: 'Décalage temporel entre les voies 1 et 2 : compter les carreaux, puis utiliser les curseurs', fiche: 'fiche_1', sousModules: true,
      parties: [{ nom: 'Compter les carreaux', slug: 'carreaux', simulation: 'module_1a_carreaux', noms: { simulation: 'Simulateur : compter les carreaux' } },
                { nom: 'Utiliser les curseurs', slug: 'curseurs', simulation: 'module_1b_curseurs', noms: { simulation: 'Simulateur : utiliser les curseurs' } }] },
    { n: 2, titre: 'Mesurer une fréquence', desc: 'Période T en comptant les carreaux ou avec les curseurs, puis f = 1 / T', fiche: 'fiche_2', sousModules: true,
      parties: [{ nom: 'Compter les carreaux', slug: 'carreaux', simulation: 'module_2a_carreaux', noms: { simulation: 'Simulateur : compter les carreaux' } },
                { nom: 'Utiliser les curseurs', slug: 'curseurs', simulation: 'module_2b_curseurs', noms: { simulation: 'Simulateur : utiliser les curseurs' } }] },
    { n: 3, titre: 'Mesurer une tension', desc: 'Tension maximale Uₘₐₓ sur deux voies d\'échelles différentes : carreaux, puis curseurs et ΔY / 2', fiche: 'fiche_3', sousModules: true,
      parties: [{ nom: 'Compter les carreaux', slug: 'carreaux', simulation: 'module_3a_carreaux', noms: { simulation: 'Simulateur : compter les carreaux' } },
                { nom: 'Utiliser les curseurs', slug: 'curseurs', simulation: 'module_3b_curseurs', noms: { simulation: 'Simulateur : utiliser les curseurs' } }] },
    { n: 4, titre: 'Mesurer une intensité', desc: 'Tension aux bornes d\'une résistance, puis i = u / R : Iₘₐₓ = Uₘₐₓ / R', fiche: 'fiche_4',
      parties: [{ nom: 'Mesurer une intensité', slug: 'intensite', simulation: 'module_4_intensite', noms: { simulation: 'Simulateur : mesurer une intensité' } }] },
  ];
  SOM.init({ nom: 'Oscilloscope', id: 'oscilloscope', plan: PLAN });
  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000 (dec : nombre de décimales imposé)
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      if (/e/.test(s)) return sci(v, 3);
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // écriture scientifique a × 10ⁿ avec c chiffres significatifs
  function sci(v, c) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toFixed((c || 2) - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return `${fmt(m, (c || 2) - 1)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // écriture scientifique sans zéros inutiles : 4 × 10⁻³, 2,5 × 10⁻³, 2,89 × 10⁻³
  function sciCourt(v) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toPrecision(3);
    if (Math.abs(m) >= 10) { m = +(m / 10).toPrecision(3); e++; }
    return `${fmt(m)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // valeur arrondie à c chiffres significatifs (3 par défaut), sans zéros inutiles : 2,5 ; 2 500 ; 66,7
  const court = (v, c) => fmt(+v.toPrecision(c || 3));
  // « = » si l'arrondi ne change pas la valeur, sinon « ≈ »
  const egal = (v, c) => Math.abs(+v.toPrecision(c || 3) - v) <= 1e-9 * Math.abs(v) ? '=' : '≈';
  // nombre avec c chiffres significatifs, écrit simplement (345 ; 2,90 ; 0,0029)
  function sig(v, c) {
    if (!v) return '0';
    const dec = Math.max(0, c - 1 - Math.floor(Math.log10(Math.abs(v)) + 1e-12));
    return fmt(v, dec);
  }
  // lecture d'une saisie : « 2,3 », « −0,5 », « 2,9e-3 », « 2,9.10^-3 », « 2,9 × 10⁻³ »
  function lire(s) {
    let t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(/[−–]/g, '-');
    t = t.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, c => ({ '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' })[c]);
    // a × 10^n écrit avec ×, x, *, ou un point (écriture « 2,9.10-3 » du cours)
    const m = t.match(/^([-+]?\d+(?:[.,]\d*)?)(?:[×x*.])10\^?([-+]?\d+)$/i);
    if (m) return parseFloat(m[1].replace(',', '.')) * Math.pow(10, +m[2]);
    t = t.replace(',', '.');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;
  // deux valeurs égales à r près (relatif)
  const proche = (a, b, r) => Math.abs(a - b) <= (r || 0.005) * Math.abs(b);

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
  function amener(e) {
    setTimeout(() => {
      if (!e) return;
      const r = e.getBoundingClientRect();
      if (r.top >= 70 && r.top <= innerHeight * 0.6) return;
      const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollBy({ top: r.top - 80, behavior: doux ? 'smooth' : 'auto' });
    }, 120);
  }

  // liens « Revois… » vers d'autres applications (nouvelle fenêtre)
  const APPLIS = {
    lecture: { href: '../../lecture-graphique/modules/fiche_1.html', texte: 'Revois la lecture graphique (fiche)' },
    proportionnalite: { href: '../../proportionnalite/index.html', texte: 'Revois les tableaux de proportionnalité' },
    conversions: { href: '../../conversions/index.html#fiche-1', texte: 'Revois les conversions (fiche)' },
    puissances: { href: '../../puissances-10/index.html', texte: 'Revois les puissances de 10' },
  };
  function revois(liste) {
    return `<p class="os-revois">${liste.map(k => `<a href="${APPLIS[k].href}" target="_blank" rel="noopener">${APPLIS[k].texte} ↗</a>`).join('')}</p>`;
  }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */
  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      box.appendChild(b);
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

  // Saisie d'un nombre : champ (± seulement si p.signe), unité ; p.sci : saisie a × 10ⁿ (deux champs,
  // ± devant l'exposant) ; p.calc : icône calculatrice ; p.lien : lien sous la saisie
  // p.verifier(v) → { ok } | { diag } | { format } ; p.reponse : texte de la réponse (affichée)
  function pNombre(zone, p, api) {
    const input = (cls, aria, ph) => `<input type="text" class="ph-champ ${cls}" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${aria}" placeholder="${ph || ''}">`;
    const pm = '<button type="button" class="os-pm" aria-label="Changer le signe">±</button>';
    const champ = (cls, aria, ph) => p.signe ? `<span class="os-champ-box">${input(cls, aria, ph)}${pm}</span>` : input(cls, aria, ph);
    const fin = (p.unite ? `<span class="os-unite">${p.unite}</span>` : '') + (p.calc ? CALC : '');
    const box = el('div', 'os-saisie', `<div class="os-saisie-l">${p.label ? `<span class="os-saisie-t">${p.label}</span>` : ''}
        ${p.sci ? `<span class="os-sci">${champ('os-mant', 'Nombre', '')}<span class="os-puiss"><span class="os-x10">× 10</span><span class="os-exp-box"><span class="os-champ-box">${pm}${input('os-exp', 'Exposant de 10', '0')}</span></span>${fin}</span></span>`
          : champ('os-val', p.aria || 'Réponse', '') + fin}</div>
      ${p.lien || ''}
      <div class="er-actions"><button type="button" class="btn-primary" data-a="ok">Valider</button></div>
      ${p.aide ? `<p class="os-aide-saisie">${p.aide}</p>` : ''}`);
    zone.appendChild(box);
    const ins = Array.from(box.querySelectorAll('input'));
    box.querySelectorAll('.os-pm').forEach(b => {
      b.onclick = () => {
        // le champ qui suit (exposant) ou qui précède (valeur) le bouton
        const i = b.nextElementSibling && b.nextElementSibling.tagName === 'INPUT' ? b.nextElementSibling : b.previousElementSibling;
        i.value = i.value.trim().startsWith(MOINS) || i.value.trim().startsWith('-') ? i.value.trim().slice(1) : MOINS + i.value.trim();
        if (surOrdi()) i.focus();
      };
    });
    function valeur() {
      if (!p.sci) return lire(ins[0].value);
      const a = lire(ins[0].value), e = ins[1].value.trim() === '' ? 0 : lire(ins[1].value);
      return isNaN(a) || isNaN(e) || Math.round(e) !== e ? NaN : a * Math.pow(10, e);
    }
    function valider() {
      if (api.fini()) return;
      const v = valeur();
      if (isNaN(v)) { api.message(p.sci ? 'Écris un nombre (avec une virgule si besoin) et un exposant entier.' : 'Écris un nombre (avec une virgule si besoin).'); return; }
      const r = p.verifier(v) || {};
      if (r.format) { api.message(r.format); return; }
      if (r.ok) { ins.forEach(i => { i.disabled = true; }); box.querySelectorAll('.os-pm').forEach(b => { b.disabled = true; }); api.reussi(); }
      else api.erreur(r.diag || '');
    }
    box.querySelector('[data-a="ok"]').onclick = valider;
    ins.forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } }));
    if (surOrdi()) setTimeout(() => ins[0].focus({ preventScroll: true }), 50);
    return {
      montrer() {
        ins.forEach(i => { i.disabled = true; });
        box.querySelectorAll('.os-pm').forEach(b => { b.disabled = true; });
        if (p.remplir) p.remplir(ins);
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
     Une partie finie garde son retour ; la suivante s'affiche dessous (« Suite → » en série).
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
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        // erreur comptée sans message (l'outil affiche lui-même son diagnostic)
        compter() { etat.erreurs++; erreursIci++; if (mode === 'manip' && erreursIci >= 2) aide.hidden = false; },
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
            a.querySelector('button').onclick = () => { d.remove(); partie(); defiler(zone); };
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
     FRÉQUENCE : T en secondes, puis f = 1 / T
     o = { T, unite: 'ms' | 's' | 'µs', sym: 'T', exact }
     Erreurs reconnues : T gardée en ms, conversion à l'envers (× 10³), T et f confondues.
     ============================================================ */
  const PUIS = { ms: -3, 'µs': -6, s: 0 };
  function partiesFrequence(o) {
    const sym = o.sym || 'T', u = o.unite || 'ms', k = PUIS[u];
    const Ts = o.T * Math.pow(10, k);                          // période de l'élève, en s
    const exS = (o.exact != null ? o.exact : o.T) * Math.pow(10, k);
    const fJ = 1 / Ts, fEx = 1 / exS;
    const unitePref = u === 'µs' ? '1 µs = 10<sup>−6</sup> s' : '1 ms = 10<sup>−3</sup> s';
    const parties = [];
    if (k) {
      parties.push({
        type: 'nombre', sci: true,
        q: `Convertis ${sym} en secondes.`,
        label: `${sym} = ${fmt(o.T)} ${u} =`, unite: 's',
        aide: `Écris le nombre, puis l'exposant de 10 (laisse 0 si tu écris un nombre décimal comme 0,002).`,
        lien: revois(['conversions']),
        verifier(v) {
          if (proche(v, Ts, 0.012) || proche(v, exS, 0.012)) return { ok: true };
          if (proche(v, o.T * Math.pow(10, -k), 0.02)) return { diag: `${unitePref} : ${sym} en secondes est plus petit que ${sym} en ${u}.` };
          if (proche(v, o.T, 0.02)) return { diag: `Tu as recopié la valeur en ${u} : convertis-la en secondes (${unitePref}).` };
          if (u === 'ms' && proche(v, o.T * 1e-6, 0.02)) return { diag: '1 ms = 10<sup>−3</sup> s (10<sup>−6</sup> s, c\'est 1 µs).' };
          if (u === 'µs' && proche(v, o.T * 1e-3, 0.02)) return { diag: '1 µs = 10<sup>−6</sup> s (10<sup>−3</sup> s, c\'est 1 ms).' };
          return { diag: `${unitePref} : multiplie ${fmt(o.T)} par 10<sup>${k === -3 ? '−3' : '−6'}</sup>.` };
        },
        solution: `${sym} = ${fmt(o.T)} ${u} = ${sciCourt(Ts)} s`,
        remplir(ins) { ins[0].value = fmt(+(Ts / Math.pow(10, k)).toPrecision(4)); ins[1].value = String(k).replace('-', MOINS); },
      });
    }
    parties.push({
      type: 'nombre',
      q: `Calcule la fréquence f (2 ou 3 chiffres significatifs).`,
      label: `f = 1 / ${sym} =`, unite: 'Hz', calc: true,
      verifier(v) {
        if (proche(v, fJ, 0.02) || proche(v, fEx, 0.025)) return { ok: true };
        if (k && proche(v, 1 / o.T, 0.03)) return { diag: `Tu as gardé ${sym} en ${u} : dans f = 1 / ${sym}, ${sym} doit être en secondes.` };
        if (k && proche(v, 1 / (o.T * Math.pow(10, -k)), 0.03)) return { diag: `${unitePref} : ${sym} en secondes est plus petit que ${sym} en ${u}.` };
        if (proche(v, Ts, 0.03) || proche(v, o.T, 0.03)) return { diag: `f = 1 / ${sym} : la fréquence est l'inverse de la période.` };
        if (proche(v, fJ / 1000, 0.03)) return { diag: 'Donne f en hertz (Hz), pas en kilohertz : 1 kHz = 10<sup>3</sup> Hz.' };
        return { diag: `f = 1 / ${sym}, avec ${sym} en secondes : calcule 1 / ${k ? `(${sciCourt(Ts)})` : fmt(Ts)}.` };
      },
      solution: () => `f = 1 / ${sym} = 1 / ${k ? `(${sciCourt(Ts)})` : fmt(Ts)} ${egal(fJ)} <b>${court(fJ)} Hz</b>`,
      remplir(ins) { ins[0].value = court(fJ).replace(/\s/g, ''); },
    });
    return parties;
  }

  /* ============================================================
     DÉROULÉ GUIDÉ ET FIN D'UN DÉFI
     ============================================================ */
  // étapes faites (✓), en cours, à venir
  const deroule = (lis, n) => lis.forEach((li, k) => { li.classList.toggle('fait', k < n); li.classList.toggle('ici', k === n); li.classList.toggle('avenir', k > n); });
  // fin d'un défi : bilan, « ↺ Nouveau signal », fiche, suite ; refaire() : nouveau signal
  function finDefi(fin, bilan, liens, refaire) {
    SOM.marquer({ fait: true });
    fin.innerHTML = `<div class="cle os-bilan"><p><b class="cle-titre">Bilan.</b> ${bilan}</p></div>
      <div class="er-actions"><button type="button" class="btn-secondary" data-a="re">↺ Nouveau signal</button>
      ${liens.fiche ? `<a class="btn-secondary" style="text-decoration:none" href="${liens.fiche}">Fiche récapitulative</a>` : ''}
      ${liens.suite ? `<a class="btn-primary" style="text-decoration:none" href="${liens.suite.href}">${liens.suite.label}</a>` : ''}</div>`;
    fin.querySelector('[data-a="re"]').onclick = refaire;
    // le « ↺ Nouveau signal » du déroulé laisse la place à celui du bilan
    const nv = fin.parentElement && fin.parentElement.querySelector('.os-nouveau');
    if (nv) nv.hidden = true;
    amener(fin);
  }

  window.OS = { CALC, fmt, sci, sciCourt, sig, court, egal, lire, fr, proche, el, melanger, hasard, defiler, amener, surOrdi, revois, PARTIES, question, partiesFrequence, deroule, finDefi, PLAN };
})();
