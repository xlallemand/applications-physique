/* ============================================================
   Moteur de l'application « Cinématique » (Terminale)
   (même fonctionnement que l'application « pH »)

   CIN.fmt, CIN.lire             écriture et lecture des nombres (virgule)
   CIN.PARTIES                   parties de question :
       'choix'    boutons à choisir
       'nombre'   valeur numérique (avec bouton ±)
       'coord'    coordonnées d'un vecteur en colonne
       'ij'       écriture a i⃗ + b j⃗ avec un clavier à l'écran
       'gabarit'  expression à trous (ex. : □ t + □)
       'tracer'   vecteurs à tracer dans un repère (voir vecteurs.js)
   CIN.question(zone, q, cb)     question en plusieurs parties
   CIN.serie(opts)               série de questions notée sur 20
   CIN.aToi(zone, items, fin)    « À toi » dans les cours : il faut réussir pour continuer
   CIN.Cours                     cours par étapes (une étape réussie fait apparaître la suivante)
   CIN.graphe(opts)              repère pour tracer des courbes (SVG)
   CIN.menu(cle)                 bandeau et menu communs aux modules

   Les styles des cartes, boutons et écrans de fin viennent de
   equilibrer-reactions/modules/er.css (même présentation).
   ============================================================ */
(function () {
  'use strict';

  const V = window.VEC;
  const MOINS = '−';

  /* ============================================================
     NOMBRES
     ============================================================ */
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000
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
    let s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // n chiffres significatifs, zéros finaux gardés : 4,70 ; −0,107
  function cs(v, n) {
    const e = Math.floor(Math.log10(Math.abs(v) || 1));
    if (e >= n) return fmt(Math.round(v));
    return v.toPrecision(n).replace('-', MOINS).replace('.', ',');
  }
  function sci(v, c) {
    if (v === 0) return '0';
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12), m = +(v / Math.pow(10, e)).toFixed((c || 2) - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return `${fmt(m, (c || 2) - 1)} × 10<sup>${String(e).replace('-', MOINS)}</sup>`;
  }
  // lecture d'une saisie : « 2,3 », « −0,5 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .01 : rel) * Math.abs(b) + 1e-12;
  // signe d'un nombre dans une somme : « + 3 », « − 3 »
  const sgn = (v, txt) => (v < 0 ? ` ${MOINS} ` : ' + ') + (txt == null ? fmt(Math.abs(v)) : txt);

  // écritures de la dérivation : fraction, d/dt, polynôme a t² + b t + c
  const fr = (h, b) => `<span class="fr"><span>${h}</span><span>${b}</span></span>`;
  const dd = (f, v) => fr('d' + f, 'd' + (v || 't'));
  function poly(c, v) {
    v = v || 't';
    const deg = c.length - 1;
    const t = c.map((k, i) => [k, deg - i === 0 ? '' : deg - i === 1 ? v : `${v}${deg - i === 2 ? '²' : deg - i === 3 ? '³' : '<sup>' + (deg - i) + '</sup>'}`]).filter(x => x[0]);
    if (!t.length) return '0';
    return t.map(([k, p], i) => (k < 0 ? (i ? ` ${MOINS} ` : MOINS) : (i ? ' + ' : '')) + (Math.abs(k) === 1 && p ? '' : fmt(Math.abs(k))) + p).join('');
  }

  /* ============================================================
     OUTILS
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const surOrdi = () => matchMedia('(hover: hover)').matches;

  // Champ de saisie d'un nombre, avec un bouton ± (le pavé numérique
  // des smartphones n'a pas toujours de touche « − »)
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'ph-champ-box' + (opts.petit ? ' petit' : ''));
    d.innerHTML = `${opts.signe === false ? '' : `<button type="button" class="ph-pm" aria-label="Changer le signe" title="Changer le signe">±</button>`}
      <input type="text" class="ph-champ" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.ph-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
        input.dispatchEvent(new Event('input'));
        // pas de focus sur smartphone : le clavier masquerait la question
        if (surOrdi()) input.focus();
      });
    }
    return { el: d, input, desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     api.reussi(silencieux, note) · api.erreur(indice) · api.effacer() · api.message(h) · api.fini()
     ============================================================ */

  // Choix parmi des boutons : p.options [{ id, label }], p.bonne, p.indice ou p.indices[id], p.colonne
  function pChoix(zone, p, api) {
    const box = el('div', 'ph-choix' + (p.colonne ? ' ph-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      b.dataset.id = o.id;
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

  // Bouton « Valider » d'une partie
  function boutonValider(zone) {
    const a = el('div', 'er-actions ph-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    // une fois la partie terminée, le bouton disparaît
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }
  function juste(v, p) {
    if (p.tol != null) return Math.abs(v - p.valeur) <= p.tol + 1e-12;
    return proche(v, p.valeur, p.rel == null ? .005 : p.rel);
  }
  // valeur affichée par « Afficher la réponse »
  function affichage(p) {
    if (p.affiche) return p.affiche;
    if (p.cs) return cs(p.valeur, p.cs);
    if (p.dec != null) return fmt(p.valeur, p.dec);
    if (p.tol != null && p.tol >= 1e-4) return fmt(p.valeur, Math.max(0, Math.ceil(-Math.log10(2 * p.tol) - 1e-9)));
    return fmt(p.valeur);
  }

  // Valeur numérique : p.label, p.valeur, p.tol (écart absolu) ou p.rel (écart relatif), p.unite, p.diag(v), p.indice
  function pNombre(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const ch = champ({ signe: p.signe });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    ch.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(v, p)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // messages pour une lecture de coordonnées (diagnostic de vecteurs.js)
  function messageLecture(code, u) {
    u = u || ['i', 'j'];
    const ui = V.nomHTML(u[0]), uj = V.nomHTML(u[1]);
    return {
      inverse: `tu as inversé les coordonnées : en haut le déplacement horizontal (selon ${ui}), en bas le déplacement vertical (selon ${uj}).`,
      signeX: 'la 1<sup>re</sup> coordonnée a le mauvais signe : vers la droite elle est positive, vers la gauche négative.',
      signeY: 'la 2<sup>de</sup> coordonnée a le mauvais signe : vers le haut elle est positive, vers le bas négative.',
      signes: 'les deux coordonnées ont le mauvais signe (positif : vers la droite et vers le haut).',
      y: 'la 1<sup>re</sup> coordonnée est juste, pas la 2<sup>de</sup> : compte les carreaux verticalement, de l\'origine à la pointe de la flèche.',
      x: 'la 2<sup>de</sup> coordonnée est juste, pas la 1<sup>re</sup> : compte les carreaux horizontalement, de l\'origine à la pointe de la flèche.',
      autre: 'compte les carreaux de l\'origine à la pointe de la flèche : d\'abord horizontalement, puis verticalement.',
    }[code] || '';
  }

  // Coordonnées en colonne : p.label (ex. nom du vecteur), p.valeurs [a, b], p.tol, p.unites, p.unite, p.lecture (diagnostic)
  function pCoord(zone, p, api) {
    const d = el('div', 'ph-valeur cin-coord');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const col = el('span', 'vcol cin-vcol');
    const a = champ({ petit: true, aria: '1re coordonnée' }), b = champ({ petit: true, aria: '2de coordonnée' });
    col.appendChild(a.el); col.appendChild(b.el);
    d.appendChild(col);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [a, b].forEach((c, k) => {
      c.input.addEventListener('input', () => { api.effacer(); c.el.classList.remove('ko'); });
      c.input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (k === 0 && b.input.value.trim() === '') b.input.focus(); else valider();
      });
    });
    const tol = p.tol == null ? 1e-9 : p.tol;
    function valider() {
      if (api.fini()) return;
      const va = lire(a.input.value), vb = lire(b.input.value);
      if (isNaN(va) || isNaN(vb)) { secouer(d); api.message('Écris les deux coordonnées (en haut, puis en bas).'); return; }
      const oka = Math.abs(va - p.valeurs[0]) <= tol + 1e-12, okb = Math.abs(vb - p.valeurs[1]) <= tol + 1e-12;
      if (oka && okb) { a.desactiver(true); b.desactiver(true); bVal.fermer(); api.reussi(); return; }
      a.el.classList.toggle('ko', !oka); b.el.classList.toggle('ko', !okb);
      let msg = p.diag && p.diag([va, vb]);
      if (!msg && p.lecture && Number.isInteger(va) && Number.isInteger(vb)) msg = 'Pas tout à fait : ' + messageLecture(V.diagnostic([va, vb], p.valeurs), p.unites);
      api.erreur(msg || p.indice || 'Vérifie les coordonnées.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        a.input.value = p.affiche ? p.affiche[0] : fmt(p.valeurs[0]); b.input.value = p.affiche ? p.affiche[1] : fmt(p.valeurs[1]);
        a.el.classList.remove('ko'); b.el.classList.remove('ko');
        a.desactiver(true); b.desactiver(true); bVal.fermer();
      },
    };
  }

  /* ---------- Écriture a i⃗ + b j⃗ avec un clavier à l'écran ----------
     Pas de champ texte : le clavier du téléphone ne s'ouvre pas et les
     vecteurs unitaires s'écrivent avec leur flèche. Au clavier de
     l'ordinateur : chiffres, virgule, + et −, i et j (ou x et y). */
  function analyserIJ(toks) {
    if (!toks.length) return { err: 'vide' };
    const c = [0, 0], notes = new Set(), vus = [];
    let i = 0, premier = true;
    while (i < toks.length) {
      let signe = 1, nSignes = 0;
      while (toks[i] === '+' || toks[i] === '−') { if (toks[i] === '−') signe = -signe; nSignes++; i++; }
      if (!premier && nSignes === 0) return { err: 'colle' };
      if (nSignes > 1) notes.add('signes');
      let num = '';
      while (i < toks.length && /^[0-9,]$/.test(toks[i])) num += toks[i++];
      if (toks[i] !== 'u0' && toks[i] !== 'u1') return { err: num ? (i < toks.length ? 'colle' : 'sansUnite') : 'incomplet' };
      const k = toks[i++] === 'u0' ? 0 : 1;
      if (num && !/^\d+(,\d+)?$/.test(num)) return { err: 'nombre' };
      const val = num ? parseFloat(num.replace(',', '.')) : 1;
      if (num && val === 1) notes.add('un');
      if (num && val === 0) notes.add('zero');
      if (vus.includes(k)) notes.add('double');
      if (premier && k === 1 && !vus.length) notes.add('ordre');
      vus.push(k);
      c[k] += signe * val;
      premier = false;
    }
    return { c, notes };
  }
  function pIJ(zone, p, api) {
    const u = p.unites || ['i', 'j'];
    const d = el('div', 'cin-ij');
    d.innerHTML = `<div class="ph-valeur">${p.label ? `<span class="ph-lab">${p.label}</span>` : ''}
        <div class="cin-ij-champ" tabindex="0" role="textbox" aria-label="Écriture avec ${u[0].replace('_', '')} et ${u[1].replace('_', '')}"></div></div>
      <div class="cin-ij-clavier">
        ${['7', '8', '9', 'del', '4', '5', '6', '+', '1', '2', '3', '−', '0', ',', 'u0', 'u1'].map(t => `<button type="button" data-t="${t}" class="${/u|del|\+|−/.test(t) ? 'cin-ij-op' : ''}"${t === 'del' ? ' aria-label="Effacer"' : ''}>${t === 'del' ? '⌫' : t === 'u0' ? V.nomHTML(u[0]) : t === 'u1' ? V.nomHTML(u[1]) : t}</button>`).join('')}
      </div>`;
    zone.appendChild(d);
    const ch = d.querySelector('.cin-ij-champ'), clav = d.querySelector('.cin-ij-clavier');
    const bVal = boutonValider(zone);
    let toks = [], bloque = false;
    function rendre(t) {
      t = t || toks;
      let h = '';
      t.forEach(x => {
        if (x === '+' || x === '−') h += ` ${x} `;
        else if (x === 'u0' || x === 'u1') h += `<span class="cin-ij-u">${V.nomHTML(u[x === 'u0' ? 0 : 1])}</span>`;
        else h += x;
      });
      ch.innerHTML = (h || '<span class="cin-ij-vide">écris avec les touches</span>') + (bloque ? '' : '<span class="cin-ij-curseur"></span>');
    }
    function taper(t) {
      if (bloque || api.fini()) return;
      if (t === 'del') toks.pop();
      else if (toks.length < 24) toks.push(t);
      api.effacer();
      rendre();
    }
    clav.querySelectorAll('button').forEach(b => { b.onclick = () => taper(b.dataset.t); });
    ch.addEventListener('keydown', e => {
      // touche du vecteur unitaire : sa lettre (i, j) ou son indice (x, y pour u⃗ₓ, u⃗ᵧ ; t, n pour u⃗ₜ, u⃗ₙ)
      const k = e.key, x = { '+': '+', '-': '−', '−': '−', ',': ',', '.': ',', Backspace: 'del' }[k] ||
        (/^[0-9]$/.test(k) ? k : null) || (k === u[0].split('_').pop() ? 'u0' : null) || (k === u[1].split('_').pop() ? 'u1' : null);
      if (k === 'Enter') { e.preventDefault(); valider(); return; }
      if (x) { e.preventDefault(); taper(x); }
    });
    rendre();
    const attendu = p.valeurs;
    const propre = V.ijHTML(attendu[0], attendu[1], u);
    function valider() {
      if (api.fini()) return;
      const r = analyserIJ(toks);
      const U = `${V.nomHTML(u[0])} ou ${V.nomHTML(u[1])}`;
      if (r.err) {
        secouer(d);
        api.message({
          vide: 'Écris le vecteur avec les touches.',
          sansUnite: `Chaque nombre doit être suivi d'un vecteur unitaire (${U}).`,
          incomplet: `L'écriture est incomplète : il manque un vecteur unitaire (${U}) après un signe.`,
          colle: 'Sépare les termes par + ou −.',
          nombre: 'Un des nombres est mal écrit.',
        }[r.err]);
        return;
      }
      const okv = Math.abs(r.c[0] - attendu[0]) < 1e-9 && Math.abs(r.c[1] - attendu[1]) < 1e-9;
      if (okv) {
        bloque = true; rendre(); clav.classList.add('fini'); bVal.fermer();
        const n = [];
        if (r.notes.has('zero')) n.push(`on n'écrit pas un terme nul (0 ${V.nomHTML(u[0])} ou 0 ${V.nomHTML(u[1])})`);
        if (r.notes.has('un')) n.push('on n\'écrit pas le coefficient 1');
        if (r.notes.has('signes')) n.push(`« + ${MOINS} » s'écrit « ${MOINS} »`);
        if (r.notes.has('double')) n.push('on regroupe les termes en un seul par vecteur unitaire');
        if (r.notes.has('ordre')) n.push(`on écrit d'habitude ${V.nomHTML(u[0])} en premier`);
        api.reussi(false, n.length ? `Plus simplement : <b>${propre}</b> (${n.join(' ; ')}).` : '');
        return;
      }
      let msg = p.diag && p.diag(r.c);
      if (!msg && Number.isInteger(r.c[0]) && Number.isInteger(r.c[1]) && p.lecture !== false) {
        const code = V.diagnostic(r.c, attendu);
        msg = {
          inverse: `Tu as inversé : le nombre devant ${V.nomHTML(u[0])} est le déplacement horizontal, le nombre devant ${V.nomHTML(u[1])} le déplacement vertical.`,
          signeX: `Le terme en ${V.nomHTML(u[0])} a le mauvais signe.`,
          signeY: `Le terme en ${V.nomHTML(u[1])} a le mauvais signe.`,
          signes: 'Les deux termes ont le mauvais signe.',
          y: `Le terme en ${V.nomHTML(u[0])} est juste, pas celui en ${V.nomHTML(u[1])}.`,
          x: `Le terme en ${V.nomHTML(u[1])} est juste, pas celui en ${V.nomHTML(u[0])}.`,
        }[code];
      }
      api.erreur(msg || p.indice || 'Vérifie les coefficients.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        bloque = true; clav.classList.add('fini'); bVal.fermer();
        ch.innerHTML = propre;
      },
    };
  }

  // Expression à trous : p.label, p.morceaux = [texte HTML | { v, tol, rel, aria }], p.diag(valeurs)
  function pGabarit(zone, p, api) {
    const d = el('div', 'ph-valeur cin-gabarit');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const champs = [];
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { d.appendChild(el('span', 'cin-g-txt', m)); return; }
      const c = champ({ petit: true, aria: m.aria || 'Nombre à compléter' });
      c.m = m; champs.push(c); d.appendChild(c.el);
    });
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    champs.forEach((c, k) => {
      c.input.addEventListener('input', () => { api.effacer(); c.el.classList.remove('ko'); });
      c.input.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const vide = champs.find(x => x.input.value.trim() === '');
        if (vide) vide.input.focus(); else valider();
      });
    });
    function valider() {
      if (api.fini()) return;
      const vals = champs.map(c => lire(c.input.value));
      if (vals.some(isNaN)) { secouer(d); api.message('Complète toutes les cases (écris 0 si le terme n\'existe pas).'); return; }
      const oks = champs.map((c, k) => juste(vals[k], { valeur: c.m.v, tol: c.m.tol == null ? (c.m.rel == null ? 1e-9 : null) : c.m.tol, rel: c.m.rel }));
      if (oks.every(Boolean)) { champs.forEach(c => c.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      champs.forEach((c, k) => c.el.classList.toggle('ko', !oks[k]));
      api.erreur((p.diag && p.diag(vals)) || p.indice || (oks.filter(x => !x).length > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'));
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        champs.forEach(c => { c.input.value = c.m.affiche || fmt(c.m.v); c.el.classList.remove('ko'); c.desactiver(true); });
        bVal.fermer();
      },
    };
  }

  // Vecteurs à tracer : p.repere = options de VEC.Repere (vecteurs à tracer avec leurs coordonnées)
  function pTracer(zone, p, api) {
    const d = el('div', 'cin-tracer');
    zone.appendChild(d);
    const r = new V.Repere(d, Object.assign({ mode: 'mixte' }, p.repere, { onChange: () => api.effacer() }));
    const bVal = boutonValider(zone);
    bVal.onclick = () => {
      if (api.fini()) return;
      const res = r.verifier(), faux = res.filter(x => x.code !== 'ok' && x.code !== 'vide'), vides = res.filter(x => x.code === 'vide');
      if (!faux.length && !vides.length) { bVal.fermer(); api.reussi(); return; }
      if (!faux.length) {
        secouer(d);
        api.message(vides.length === res.length ? `Trace ${res.length > 1 ? 'les vecteurs' : 'le vecteur'} avant de valider.` : `Il reste à tracer : ${vides.map(x => V.nomHTML(x.v.nom)).join(', ')}.`);
        return;
      }
      api.erreur(faux.map(x => `${res.length > 1 ? `<b>${V.nomHTML(x.v.nom)}</b> : ` : ''}${V.message(x.code, r.o.unitaires || p.unites)}`).join('<br>') +
        (vides.length ? `<br>Il reste aussi à tracer : ${vides.map(x => V.nomHTML(x.v.nom)).join(', ')}.` : '') +
        (res.length > 1 && res.some(x => x.code === 'ok') ? '<br><span class="er-petit">Les vecteurs justes (en vert) sont bloqués.</span>' : ''));
      secouer(d);
    };
    return { montrer() { r.montrer(); bVal.fermer(); }, repere: r };
  }

  // Écriture scientifique a × 10ⁿ : p.label, p.valeur, p.unite, p.rel (écart relatif, 3 % par défaut), p.cs, p.diag(v)
  function pSci(zone, p, api) {
    const d = el('div', 'ph-valeur');
    if (p.label) d.appendChild(el('span', 'ph-lab', p.label));
    const s = el('span', 'ph-sci'), a = champ({ petit: true, aria: 'Nombre devant la puissance de 10' }), n = champ({ petit: true, aria: 'Exposant de la puissance de 10' });
    n.el.classList.add('ph-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'ph-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'ph-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [a, n].forEach(c => {
      c.input.addEventListener('input', () => api.effacer());
      c.input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    });
    function valider() {
      if (api.fini()) return;
      const va = lire(a.input.value), vn = lire(n.input.value);
      if (isNaN(va)) { secouer(d); api.message('Écris le nombre devant la puissance de 10.'); return; }
      if (isNaN(vn) || !Number.isInteger(vn)) { secouer(d); api.message('Écris l\'exposant de la puissance de 10 (un nombre entier).'); return; }
      const v = va * Math.pow(10, vn);
      if (proche(v, p.valeur, p.rel == null ? .03 : p.rel)) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        let e = Math.floor(Math.log10(Math.abs(p.valeur)) + 1e-12), m = +(p.valeur / Math.pow(10, e)).toFixed((p.cs || 2) - 1);
        if (Math.abs(m) >= 10) { m /= 10; e++; }
        a.input.value = fmt(m, (p.cs || 2) - 1); n.input.value = String(e).replace('-', MOINS);
        a.desactiver(true); n.desactiver(true); bVal.fermer();
      },
    };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, coord: pCoord, ij: pIJ, gabarit: pGabarit, tracer: pTracer, sci: pSci };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    let k = 0;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    function partie() {
      const p = q.parties[k];
      window.CIN.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      let finie = false, erreursIci = 0;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="ph-msg">${h}</p>`; },
        compterErreur() { etat.erreurs++; erreursIci++; aide.classList.remove('hidden'); },
        erreur(h) {
          api.compterErreur();
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p>${erreursIci >= 2 && mode !== 'cours' ? `<p class="er-petit">Corrige ta réponse, ou ${mode === 'exercice' ? 'regarde la correction' : 'affiche la réponse'} (0 point pour cette ${mode === 'exercice' ? 'partie' : 'question'}).</p>` : ''}</div>`;
        },
        reussi(silencieux, note) { terminer(false, silencieux, note); },
      };
      const ctx = PARTIES[p.type](d.querySelector('.ph-partie-zone'), p, api);
      p.ctx = ctx;
      bRep.onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue, silencieux, note) {
        finie = true;
        aide.remove();
        etat.details.push({ vue, erreurs: erreursIci });
        const titre = vue ? (mode === 'exercice' ? 'Correction' : 'Réponse') : (erreursIci ? 'C\'est juste.' : 'Juste !');
        const sol = p.solution || p.correction;
        if (sol || vue || note) {
          ret.innerHTML = `<div class="${vue ? 'callout' : 'callout-success'} er-retour ph-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b>${note ? ' ' + note : ''}</p>${sol ? `<div>${sol}</div>` : ''}</div>`;
        } else if (!silencieux) {
          ret.innerHTML = '<p class="ph-ok">✓ Juste</p>';
        } else ret.innerHTML = '';
        k++;
        if (k < q.parties.length) {
          partie();
          const n = zone.lastElementChild;
          setTimeout(() => n.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        } else { etat.fini = true; cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat); }
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
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${opts.nombre || 10} questions, notées sur 20 :</p>
          <ul class="er-liste"><li><b>2 points</b> si tout est juste du premier coup ;</li><li><b>1 point</b> si tu y arrives après au moins une erreur ;</li><li><b>0 point</b> si tu affiches la réponse.</li></ul></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
      window.scrollTo(0, 0);
    }
    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.CIN.questionEnCours = q;          // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
          <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${pts(score)}</b></p>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card ph-question">
          ${q.theme ? `<p class="er-q-nom">${q.theme}</p>` : ''}
          ${q.consigne ? `<div class="er-consigne">${q.consigne}</div>` : ''}
          ${q.enonce ? `<div class="ph-enonce">${q.enonce}</div>` : ''}
          <div data-a="fig"></div>
          <div data-a="parties"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="suite"></div>
        </div>`;
      window.scrollTo(0, 0);
      if (q.figure) q.figure(app.querySelector('[data-a="fig"]'));
      // évite qu'un double appui sur « Question suivante » réponde à la nouvelle question
      app.style.pointerEvents = 'none';
      setTimeout(() => { app.style.pointerEvents = ''; }, 350);
      question(app.querySelector('[data-a="parties"]'), q, {
        fin(p) {
          score += p; recap.push({ n: idx + 1, p });
          app.querySelector('[data-a="score"]').textContent = pts(score);
          const titre = p === 2 ? 'Bravo, juste du premier coup !' : p === 1 ? 'C\'est juste, après au moins une erreur.' : 'La réponse a été affichée.';
          app.querySelector('[data-a="retour"]').innerHTML = `<div class="${p ? 'callout-success' : 'callout'} er-retour ph-bilan"><p><b class="${p ? 'er-ok' : ''}">${titre}</b> +${pts(p)}</p>${q.bilan ? `<p>${q.bilan}</p>` : ''}</div>`;
          const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
          s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
          const b = s.querySelector('button');
          setTimeout(() => { b.disabled = false; }, 450);
          b.onclick = () => { idx++; afficher(); };
          setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
        },
      }, 'serie');
    }

    function fin() {
      const max = qs.length * 2, note = Math.round(score / max * 20 * 2) / 2, pct = Math.round(score / max * 100);
      const msg = score === max ? 'Tout est juste : bravo !' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence pour progresser : les questions changent à chaque fois.' : 'Continue à t\'entraîner : relis le cours, puis recommence.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
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

  /* ============================================================
     « À TOI » DANS LES COURS
     Une suite de petites questions sans points ; onFini() quand
     toutes sont réussies (ou leur réponse affichée).
     items = [{ titre, enonce, figure(zone), parties: [p] }]
     ============================================================ */
  function aToi(zone, items, onFini, titre) {
    const box = el('div', 'ph-atoi');
    box.innerHTML = `<p class="ph-atoi-t">${titre || 'À toi'}</p>`;
    zone.appendChild(box);
    let i = 0;
    function suivant() {
      if (i >= items.length) { if (onFini) onFini(); return; }
      const it = items[i];
      const d = el('div', 'ph-atoi-q', `${it.titre ? `<p class="ph-atoi-titre">${it.titre}</p>` : ''}${it.enonce ? `<div class="ph-enonce">${it.enonce}</div>` : ''}<div class="ph-atoi-fig"></div><div></div>`);
      box.appendChild(d);
      if (it.figure) it.figure(d.querySelector('.ph-atoi-fig'));
      question(d.lastElementChild, it, { fin() { i++; suivant(); } }, 'cours');
      if (i > 0) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    suivant();
    return box;
  }

  /* ============================================================
     COURS PAR ÉTAPES
     const cours = new CIN.Cours(zone, [ (c) => { … }, … ]);
     Chaque étape reçoit l'objet cours et construit sa carte avec
     cours.carte(titre), cours.ajouter(carte, html), puis appelle
     cours.continuer(carte) pour proposer l'étape suivante.
     ============================================================ */
  function Cours(zone, etapes) {
    this.zone = zone; this.etapes = etapes; this.n = 0;
    this.lancer(0);
  }
  Cours.prototype.carte = function (titre) {
    const c = el('section', 'er-card er-etape');
    c.innerHTML = `<h3 class="cours-titre">${titre}</h3>`;
    this.zone.appendChild(c);
    return c;
  };
  Cours.prototype.ajouter = function (parent, html) {
    const d = el('div', null, html);
    parent.appendChild(d);
    return d;
  };
  Cours.prototype.lancer = function (n) {
    this.n = n;
    return this.etapes[n](this);
  };
  // bouton « Continuer » : affiche l'étape suivante et la fait défiler à l'écran
  Cours.prototype.continuer = function (parent, texte) {
    const moi = this;
    if (this.n + 1 >= this.etapes.length) return;
    const d = this.ajouter(parent, `<div class="er-suite"><button type="button" class="btn-primary">${texte || 'Continuer →'}</button></div>`);
    d.querySelector('button').onclick = () => {
      d.remove();
      const c = moi.lancer(moi.n + 1);
      if (c) setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    };
  };

  /* ============================================================
     REPÈRE POUR COURBES (SVG)
     opts = { xmin, xmax, ymin, ymax, w, h, pasX, pasY, nomX, nomY, grille }
     Renvoie { px(x), py(y), fond (SVG : grille, axes, graduations) }
     ============================================================ */
  function graphe(opts) {
    const o = Object.assign({ xmin: 0, xmax: 10, ymin: 0, ymax: 10, w: 600, h: 320, pasX: 1, pasY: 1, nomX: 'x', nomY: 'y', grille: true, gradX: true, gradY: true, m: { g: 38, d: 22, h: 22, b: 28 } }, opts);
    const L = o.w - o.m.g - o.m.d, H = o.h - o.m.h - o.m.b;
    const px = x => o.m.g + (x - o.xmin) / (o.xmax - o.xmin) * L;
    const py = y => o.m.h + (o.ymax - y) / (o.ymax - o.ymin) * H;
    const C = V.C;
    let g = '';
    const nbPas = (a, b, p) => { const t = []; for (let v = Math.ceil(a / p - 1e-9) * p; v <= b + 1e-9; v += p) t.push(+v.toFixed(6)); return t; };
    if (o.grille) {
      nbPas(o.xmin, o.xmax, o.pasX).forEach(x => { g += V.trait(px(x), py(o.ymin), px(x), py(o.ymax), C.grille, 1); });
      nbPas(o.ymin, o.ymax, o.pasY).forEach(y => { g += V.trait(px(o.xmin), py(y), px(o.xmax), py(y), C.grille, 1); });
    }
    const X0 = px(Math.max(o.xmin, Math.min(0, o.xmax))), Y0 = py(Math.max(o.ymin, Math.min(0, o.ymax)));
    g += V.fleche(px(o.xmin), Y0, px(o.xmax) + 14, Y0, C.encre, 1.6, 9);
    g += V.fleche(X0, py(o.ymin), X0, py(o.ymax) - 14, C.encre, 1.6, 9);
    const t = o.taille || 13;
    if (o.gradX) nbPas(o.xmin, o.xmax, o.gradPasX || o.pasX).forEach(x => { if (Math.abs(x) > 1e-9) g += `<text x="${px(x)}" y="${Y0 + t + 4}" font-size="${t}" font-weight="600" fill="${C.encre2}" text-anchor="middle">${fmt(x)}</text>`; });
    if (o.gradY) nbPas(o.ymin, o.ymax, o.gradPasY || o.pasY).forEach(y => { if (Math.abs(y) > 1e-9) g += `<text x="${X0 - 6}" y="${py(y) + t * .36}" font-size="${t}" font-weight="600" fill="${C.encre2}" text-anchor="end">${fmt(y)}</text>`; });
    g += `<text x="${X0 - 6}" y="${Y0 + t + 4}" font-size="${t}" font-weight="600" fill="${C.encre2}" text-anchor="end">O</text>`;
    g += `<text x="${px(o.xmax) + 12}" y="${Y0 - 8}" font-size="${t + 1}" font-weight="700" fill="${C.encre}" text-anchor="end">${o.nomX}</text>`;
    g += `<text x="${X0 + 8}" y="${py(o.ymax) - 6}" font-size="${t + 1}" font-weight="700" fill="${C.encre}">${o.nomY}</text>`;
    // courbe d'une fonction
    function courbe(f, a, b, coul, ep, n) {
      let d = '';
      n = n || 200;
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = f(x);
        if (isFinite(y)) d += (d ? 'L' : 'M') + px(x).toFixed(1) + ',' + py(y).toFixed(1);
      }
      return `<path d="${d}" fill="none" stroke="${coul || 'var(--accent)'}" stroke-width="${ep || 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
    }
    const svg = (contenu, aria) => `<svg viewBox="0 0 ${o.w} ${o.h}" class="cin-graphe" role="img" aria-label="${aria || 'Graphique'}" style="font-family:var(--font-sans)">${g}${contenu || ''}</svg>`;
    return Object.assign(o, { px, py, fond: g, courbe, svg, X0, Y0 });
  }

  /* ---------- Bandeau et menu communs aux modules ---------- */
  const GROUPES = [
    { title: 'Module 1 · Référentiel', items: [
      { key: 'module_1_cours', label: 'Cours : référentiel et trajectoire' },
      { key: 'module_1_questions', label: 'Questions sur le référentiel' },
    ]},
    { title: 'Module 2 · Les vecteurs', items: [
      { key: 'module_2_cours', label: 'Cours : coordonnées d\'un vecteur' },
      { key: 'module_2_questions', label: 'Questions : lire et tracer' },
      { key: 'module_2b_cours', label: 'Cours : module et trigonométrie' },
      { key: 'module_2b_questions', label: 'Questions : module et trigonométrie' },
    ]},
    { title: 'Module 3 · Dérivation en physique', items: [
      { key: 'module_3_cours', label: 'Cours : dériver en physique' },
      { key: 'module_3_questions', label: 'Questions sur la dérivation' },
    ]},
    { title: 'Module 4 · Position, vitesse, accélération', items: [
      { key: 'module_4_cours', label: 'Cours : position, vitesse, accélération' },
      { key: 'module_4_questions', label: 'Questions : vitesse et accélération' },
    ]},
    { title: 'Module 5 · Repère de Frenet', items: [
      { key: 'module_5_cours', label: 'Cours : le repère de Frenet' },
      { key: 'module_5_questions', label: 'Questions sur le repère de Frenet' },
    ]},
    { title: 'Module 6 · Exercices', items: [
      { key: 'module_6', label: 'Exercices du cours' },
    ]},
  ];
  function menu(cle) {
    const n = window.AppNav.init({
      appName: 'Cinématique', portalHref: '../../index.html', portalLabel: 'Toutes les applications',
      onHome: () => { window.location.href = '../index.html'; },
      onNavigate: key => { window.location.href = key + '.html'; },
      groups: GROUPES,
    });
    n.setActive(cle);
    const g = GROUPES.find(x => x.items.some(m => m.key === cle));
    const item = g && g.items.find(m => m.key === cle);
    n.setTitle(item ? `${g.title.split(' · ')[0]} · ${item.label}` : null);
    return n;
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

  window.CIN = Object.assign(window.CIN || {}, {
    MOINS, fmt, cs, sci, lire, proche, sgn, fr, dd, poly, el, secouer, melanger, hasard, entre, champ, PARTIES, analyserIJ,
    question, serie, aToi, Cours, graphe, menu, GROUPES, confettis,
  });
})();
