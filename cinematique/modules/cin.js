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
   CIN.menu(cle)                 sommaire de toute l'application (navigation d'une page)
   CIN.accueil(zone)             accueil : une ligne dépliable par module

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

  // système de coordonnées avec une accolade à sa hauteur : sys('x(t) = 3t + 2', 'y(t) = 0', …)
  const ACC = '<span class="cin-acc" aria-hidden="true"><svg viewBox="0 0 10 8"><path d="M10,1 Q5,1 5,8"/></svg><i></i>' +
    '<svg viewBox="0 0 10 14"><path d="M5,0 Q5,7 0,7 Q5,7 5,14"/></svg><i></i><svg viewBox="0 0 10 8"><path d="M5,0 Q5,7 10,7"/></svg></span>';
  const sys = (...l) => `<span class="cin-sys">${ACC}<span class="cin-sys-l">${l.map(x => `<span>${x}</span>`).join('')}</span></span>`;

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
    // chaque case forme un groupe insécable avec le texte qui la suit (et le texte d'ouverture
    // avec la première case) : sur un petit écran, la ligne ne se coupe qu'entre deux groupes
    const champs = [];
    let grp = el('span', 'cin-g-grp');
    d.appendChild(grp);
    p.morceaux.forEach(m => {
      if (typeof m === 'string') { grp.appendChild(el('span', 'cin-g-txt', m)); return; }
      if (champs.length) { grp = el('span', 'cin-g-grp'); d.appendChild(grp); }
      const c = champ({ petit: true, aria: m.aria || 'Nombre à compléter' });
      c.m = m; champs.push(c); grp.appendChild(c.el);
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

  // Vecteurs à tracer : p.repere = options de VEC.Repere (vecteurs à tracer avec leurs coordonnées), p.diag(v, code)
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
      const maj = t => t.charAt(0).toUpperCase() + t.slice(1);
      // p.diag(vecteur, code) : message propre à la question (ou rien : message général)
      const msg = x => (p.diag && p.diag(x.v, x.code)) || V.message(x.code, r.o.unitaires || p.unites);
      api.erreur(faux.map(x => (res.length > 1 ? `<b>${V.nomHTML(x.v.nom)}</b> : ${msg(x)}` : maj(msg(x)))).join('<br>') +
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
     « AFFICHER TOUT LE COURS »
     Les questions et les « À toi » en cours s'inscrivent ici. Quand
     l'élève demande tout le cours, chacun « se déplie » : toutes ses
     parties sont affichées d'un coup, avec le bouton « Afficher la
     réponse » disponible tout de suite. CIN.tout reste vrai ensuite :
     les nouvelles questions s'affichent directement dépliées.
     ============================================================ */
  const vivants = new Set();

  /* ============================================================
     UNE QUESTION : parties successives
     q = { parties: [p] } ; p = { type, q (texte), figure(zone), solution (HTML affiché après), … }
     mode : 'serie'    bouton « Afficher la réponse » (0 point pour la question)
            'exercice' bouton « Voir la correction » toujours disponible
            'cours'    « Afficher la réponse » proposé après une erreur
                       (ou tout de suite quand tout le cours est affiché)
     cb.fin(points) : 2 sans erreur, 1 après au moins une erreur, 0 si une réponse est affichée
     ============================================================ */
  function question(zone, q, cb, mode) {
    mode = mode || 'serie';
    const etat = { erreurs: 0, vue: false, fini: false, details: [] };
    const n = q.parties.length, aides = [];
    let rendues = 0, finies = 0, deplie = false;
    const libAide = mode === 'exercice' ? 'Voir la correction' : 'Afficher la réponse';
    // « Afficher tout le cours » : les parties restantes apparaissent d'un coup
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        aides.forEach(a => a.classList.remove('hidden'));
        while (rendues < n) partie();
      },
    };
    function partie() {
      const p = q.parties[rendues++];
      window.CIN.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'ph-partie', `${p.q ? `<div class="ph-partie-q">${p.q}</div>` : ''}<div class="ph-partie-fig"></div><div class="ph-partie-zone"></div><div class="ph-partie-retour"></div>
        <div class="ph-partie-aide${mode === 'cours' && !deplie ? ' hidden' : ''}"><button type="button" class="btn-small">${libAide}</button></div>`);
      zone.appendChild(d);
      if (p.figure) p.figure(d.querySelector('.ph-partie-fig'));
      const ret = d.querySelector('.ph-partie-retour'), aide = d.querySelector('.ph-partie-aide'), bRep = aide.querySelector('button');
      aides.push(aide);
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
        finies++;
        if (finies < n) {
          // partie suivante (déjà affichée si tout le cours est déplié)
          if (!deplie && rendues < n) {
            partie();
            const s = zone.lastElementChild;
            setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          }
        } else {
          etat.fini = true;
          vivants.delete(inst);
          cb.fin(etat.vue ? 0 : etat.erreurs ? 1 : 2, etat);
        }
      }
    }
    if (mode === 'cours') vivants.add(inst);
    partie();
    if (mode === 'cours' && window.CIN.tout) inst.deplier();
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
      marquer({ note });
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
    box.innerHTML = `<div class="ph-atoi-tete"><p class="ph-atoi-t">${titre || 'À toi'}</p></div>`;
    zone.appendChild(box);
    let i = 0, deplie = false, termine = false;
    // « Afficher tout le cours » : toutes les questions restantes, puis la suite du cours
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        while (i < items.length) rendre(i++);
        finir();
      },
    };
    function finir() {
      if (termine) return;
      termine = true;
      vivants.delete(inst);
      if (onFini) onFini();
    }
    function rendre(k) {
      const it = items[k];
      const d = el('div', 'ph-atoi-q', `${it.titre ? `<p class="ph-atoi-titre">${it.titre}</p>` : ''}${it.enonce ? `<div class="ph-enonce">${it.enonce}</div>` : ''}<div class="ph-atoi-fig"></div><div></div>`);
      box.appendChild(d);
      if (it.figure) it.figure(d.querySelector('.ph-atoi-fig'));
      question(d.lastElementChild, it, { fin() { if (!deplie) suivant(); } }, 'cours');
      if (k > 0 && !deplie) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    function suivant() {
      if (i >= items.length) { finir(); return; }
      rendre(i++);
    }
    vivants.add(inst);
    suivant();
    if (window.CIN.tout) inst.deplier();
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
    this.zone = zone; this.etapes = etapes; this.n = 0; this.attente = null; this.bouton = null;
    vivants.add(this);
    this.lancer(0);
    this.boutonTout();
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
    const c = this.etapes[n](this);
    if (n === this.etapes.length - 1) { this.toutEstAffiche(); marquer({ fait: true }); }
    return c;
  };
  // bouton « Continuer » : affiche l'étape suivante et la fait défiler à l'écran
  // (quand tout le cours est affiché, l'étape suivante apparaît directement)
  Cours.prototype.continuer = function (parent, texte) {
    if (this.n + 1 >= this.etapes.length) return;
    if (window.CIN.tout) { this.lancer(this.n + 1); return; }
    const d = this.ajouter(parent, `<div class="er-suite"><button type="button" class="btn-primary">${texte || 'Continuer →'}</button></div>`);
    this.attente = d;
    d.querySelector('button').onclick = () => this.suivante(true);
  };
  Cours.prototype.suivante = function (defiler) {
    const d = this.attente;
    if (!d) return;
    this.attente = null;
    d.remove();
    if (defiler) {
      // évite qu'un double appui sur « Continuer » réponde à l'étape suivante
      this.zone.style.pointerEvents = 'none';
      setTimeout(() => { this.zone.style.pointerEvents = ''; }, 400);
    }
    const c = this.lancer(this.n + 1);
    if (c && defiler) setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  Cours.prototype.deplier = function () { this.suivante(false); };

  // bouton « Afficher tout le cours », dans le premier « À toi », près de la première question
  Cours.prototype.boutonTout = function () {
    const tete = this.zone.querySelector('.ph-atoi-tete');
    if (!tete) return;
    const b = el('button', 'btn-small cin-tout', 'Afficher tout le cours');
    b.type = 'button';
    b.title = 'Affiche toutes les parties du cours sans avoir à répondre aux questions (tu peux toujours y répondre)';
    tete.appendChild(b);
    this.bouton = b;
    if (this.n === this.etapes.length - 1) this.toutEstAffiche();
    b.onclick = () => this.toutAfficher();
  };
  Cours.prototype.toutAfficher = function () {
    const b = this.bouton;
    if (!b || b.disabled) return;
    // la position de la page ne bouge pas : on garde le bouton au même endroit à l'écran
    const avant = b.getBoundingClientRect().top;
    window.CIN.tout = true;
    Array.from(vivants).forEach(x => x.deplier());
    this.toutEstAffiche();
    window.scrollBy(0, b.getBoundingClientRect().top - avant);
  };
  Cours.prototype.toutEstAffiche = function () {
    if (!this.bouton) return;
    this.bouton.disabled = true;
    this.bouton.textContent = 'Tout le cours est affiché';
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

  /* ============================================================
     PLAN DE L'APPLICATION, PROGRESSION ET NAVIGATION

     Sommaire de toute l'application : modules → parties → pages (Cours, Questions, Fiche).
     Le module et la partie de la page en cours sont dépliés, la page en cours est encadrée.
     Un clic sur un module ou une partie le déplie sur place (sans changer de page) ;
     les pages sont des liens ordinaires. La fiche d'un module s'ouvre à la partie choisie
     (ancre #slug dans la page de la fiche).
       ordinateur : sommaire toujours ouvert dans une colonne à gauche (pas de bandeau) ;
       téléphone  : bandeau « où suis-je » ; un appui déroule le sommaire sous le bandeau.
     ============================================================ */
  const PLAN = [
    { n: 1, titre: 'Référentiel', desc: 'Définition, trajectoire, vocabulaire, trois référentiels', fiche: 'fiche_1',
      parties: [{ nom: 'Référentiel', cours: 'module_1_cours', questions: 'module_1_questions' }] },
    { n: 2, titre: 'Les vecteurs', desc: 'Coordonnées, tracé, somme, module, trigonométrie', fiche: 'fiche_2',
      parties: [
        { nom: 'Coordonnées', slug: 'coordonnees', cours: 'module_2_cours', questions: 'module_2_questions' },
        { nom: 'Module et trigonométrie', slug: 'module', cours: 'module_2b_cours', questions: 'module_2b_questions' },
      ] },
    { n: 3, titre: 'Dérivation en physique', desc: 'Notation d/dt, tableau des dérivées, dériver un vecteur', fiche: 'fiche_3',
      parties: [{ nom: 'Dérivation en physique', cours: 'module_3_cours', questions: 'module_3_questions' }] },
    { n: 4, titre: 'Position, vitesse, accélération', desc: 'Les trois vecteurs du mouvement, détermination expérimentale', fiche: 'fiche_4',
      parties: [
        { nom: 'Position', slug: 'position', cours: 'module_4a_cours', questions: 'module_4a_questions' },
        { nom: 'Vitesse', slug: 'vitesse', cours: 'module_4b_cours', questions: 'module_4b_questions' },
        { nom: 'Accélération', slug: 'acceleration', cours: 'module_4c_cours', questions: 'module_4c_questions' },
        { nom: 'Détermination expérimentale', slug: 'experimental', cours: 'module_4d_cours', questions: 'module_4d_questions' },
      ] },
    { n: 5, titre: 'Repère de Frenet', desc: 'Vitesse et accélération, mouvement circulaire uniforme', fiche: 'fiche_5',
      parties: [{ nom: 'Repère de Frenet', cours: 'module_5_cours', questions: 'module_5_questions' }] },
    { n: 6, titre: 'Exercices du cours', desc: 'Les exercices 1 à 16 du chapitre', exercices: 'module_6' },
  ];

  /* ---------- Progression (gardée dans le navigateur) ---------- */
  const CLE_PROG = 'cinematique-progression', CLE_EX = 'cinematique-exercices';
  function lireProg() { try { return JSON.parse(localStorage.getItem(CLE_PROG)) || {}; } catch (e) { return {}; } }
  function ecrireProg(p) { try { localStorage.setItem(CLE_PROG, JSON.stringify(p)); } catch (e) { /* stockage indisponible : rien à faire */ } }
  function lireExercices() { try { return JSON.parse(localStorage.getItem(CLE_EX)) || {}; } catch (e) { return {}; } }
  const cleDePage = () => (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  // info = { fait: true } quand un cours est terminé, { note } pour la note sur 20 d'une série (on garde la meilleure)
  function marquer(info) {
    const p = lireProg(), cle = cleDePage();
    p.pages = p.pages || {};
    const a = p.pages[cle] || {};
    if (info.fait) a.fait = true;
    if (info.note != null) a.note = Math.max(a.note == null ? 0 : a.note, info.note);
    p.pages[cle] = a;
    ecrireProg(p);
  }
  const partieFaite = (pt, pages) => !!(pages[pt.cours] && pages[pt.cours].fait) && !!pages[pt.questions] && pages[pt.questions].note != null;

  /* ---------- Où se trouve-t-on ? ---------- */
  function situer(cle) {
    for (const m of PLAN) {
      if (m.exercices === cle) return { m, onglet: 'exercices' };
      if (m.fiche === cle) {
        const h = location.hash.slice(1), i = Math.max(0, m.parties.findIndex(p => p.slug === h));
        return { m, i, p: m.parties[i], onglet: 'fiche' };
      }
      const i = (m.parties || []).findIndex(p => p.cours === cle || p.questions === cle);
      if (i >= 0) return { m, i, p: m.parties[i], onglet: m.parties[i].cours === cle ? 'cours' : 'questions' };
    }
    return null;
  }
  // adresse d'un onglet d'une partie (pre : dossier des pages, vide dans modules/)
  function lien(m, p, onglet, pre) {
    pre = pre || '';
    if (onglet === 'cours') return pre + p.cours + '.html';
    if (onglet === 'questions') return pre + p.questions + '.html';
    return pre + m.fiche + '.html' + (p && p.slug ? '#' + p.slug : '');
  }
  function libelle(cle) {
    const s = situer(cle);
    if (!s) return '';
    if (s.onglet === 'exercices') return `Module ${s.m.n} · Exercices`;
    const quoi = { cours: 'Cours', questions: 'Questions', fiche: 'Fiche récapitulative' }[s.onglet];
    return s.m.parties.length > 1 && s.onglet !== 'fiche' ? `Module ${s.m.n} · ${s.p.nom} · ${quoi}` : `Module ${s.m.n} · ${quoi}`;
  }

  /* ---------- Avancement d'un module (sommaire et accueil) ---------- */
  const totalModule = m => (m.exercices ? 16 : m.parties.length * 2);
  const faitModule = (m, pages, ex) => (m.exercices ? Math.min(16, Object.keys(ex).length)
    : m.parties.reduce((n, pt) => n + (pages[pt.cours] && pages[pt.cours].fait ? 1 : 0) + (pages[pt.questions] && pages[pt.questions].note != null ? 1 : 0), 0));

  /* ---------- Sommaire de toute l'application ---------- */
  const NOMS_PAGES = { cours: 'Cours', questions: 'Questions', fiche: 'Fiche récapitulative', exercices: 'Exercices' };
  const chev = '<span class="cin-chev" aria-hidden="true">›</span>';
  const feuille = (href, ic, lib, etat, ici) =>
    `<a class="cin-page${ici ? ' ici' : ''}" href="${href}"${ici ? ' aria-current="page"' : ''}><span class="ic" aria-hidden="true">${ic}</span>${lib}${etat ? `<em>${etat}</em>` : ''}</a>`;
  // les trois pages d'une partie : Cours (✓), Questions (meilleure note), Fiche
  function feuilles(m, p, s, pages) {
    const ici = o => s.m === m && s.p === p && s.onglet === o;
    const c = pages[p.cours] || {}, q = pages[p.questions] || {};
    return feuille(lien(m, p, 'cours'), 'C', 'Cours', c.fait ? '✓' : '', ici('cours')) +
      feuille(lien(m, p, 'questions'), 'Q', 'Questions', q.note != null ? fmt(q.note) + '/20' : '', ici('questions')) +
      feuille(lien(m, p, 'fiche'), '≡', 'Fiche', '', ici('fiche'));
  }
  function sommaire(s, pages, ex) {
    return PLAN.map(m => {
      const ici = s.m === m, n = faitModule(m, pages, ex), t = totalModule(m), fini = n === t;
      let enfants;
      if (m.exercices) enfants = `<div class="cin-spages">${feuille(m.exercices + '.html', '#', 'Exercices 1 à 16', '', s.onglet === 'exercices')}</div>`;
      else if (m.parties.length === 1) enfants = `<div class="cin-spages">${feuilles(m, m.parties[0], s, pages)}</div>`;
      else enfants = m.parties.map((p, i) => {
        const pici = ici && s.p === p, id = `cin-s${m.n}-${i}`;
        return `<button type="button" class="cin-spt${pici ? ' ici' : ''}" aria-expanded="${pici}" aria-controls="${id}">${partieFaite(p, pages) ? '<span class="cin-v" aria-label="terminé">✓</span>' : ''}${p.nom}${chev}</button>` +
          `<div class="cin-spages" id="${id}"${pici ? '' : ' hidden'}>${feuilles(m, p, s, pages)}</div>`;
      }).join('');
      return `<div class="cin-smod${ici ? ' ici' : ''}"><button type="button" class="cin-sligne" aria-expanded="${ici}" aria-controls="cin-s${m.n}">` +
        `<span class="cin-snum${fini ? ' fait' : ''}">${fini ? '✓' : m.n}</span><span class="cin-st">${m.titre}</span><span class="cin-sn">${n}/${t}</span>${chev}</button>` +
        `<div class="cin-senf" id="cin-s${m.n}"${ici ? '' : ' hidden'}>${enfants}</div></div>`;
    }).join('');
  }

  /* ---------- Navigation d'une page ---------- */
  function menu(cle) {
    const racine = document.getElementById('app-nav');
    if (!racine) return;
    const html = document.documentElement;
    // accueil de l'application : bandeau avec le lien vers le portail des applications
    if (cle === 'accueil') {
      racine.innerHTML = '<div class="app-topbar"><a class="cin-pilule" href="../index.html"><span aria-hidden="true">←</span><span class="cin-court">Applications</span><span class="cin-long">Toutes les applications</span></a>' +
        '<div class="app-topbar-title"><span class="app-name">Cinématique</span></div></div><div class="app-topbar-spacer"></div>';
      return;
    }
    if (!situer(cle)) return;
    const prog = lireProg();
    prog.derniere = cle; ecrireProg(prog);                       // pour « Reprendre » sur l'accueil
    html.classList.add('cin-nav');
    const ouvrir = oui => {
      html.classList.toggle('cin-som-ouvert', oui);
      const b = racine.querySelector('.cin-ou');
      if (b) { b.setAttribute('aria-expanded', oui); b.querySelector('.cin-ou-chev').textContent = oui ? '▴' : '▾'; }
    };
    // (re)construit le bandeau et le sommaire ; sur une fiche, la partie dépend de l'ancre
    function rendre() {
      const s = situer(cle), pages = lireProg().pages || {}, ex = lireExercices();
      const multi = s.m.parties && s.m.parties.length > 1;
      const ou = s.onglet === 'exercices' || s.onglet === 'fiche' || !multi ? NOMS_PAGES[s.onglet] : `${s.p.nom} · ${NOMS_PAGES[s.onglet]}`;
      racine.innerHTML =
        `<div class="cin-barre"><button type="button" class="cin-ou" aria-expanded="false" aria-controls="cin-som" aria-label="Sommaire : module ${s.m.n}, ${ou}">` +
        `<span class="cin-snum">${s.m.n}</span><span class="cin-ou-t"><small>${s.m.titre}</small><b>${ou}</b></span><span class="cin-ou-chev" aria-hidden="true">▾</span></button></div>` +
        '<div class="cin-barre-esp"></div><div class="cin-voile"></div>' +
        `<aside class="cin-som" id="cin-som" aria-label="Sommaire"><div class="cin-som-tete"><a class="cin-som-app" href="../index.html">Cinématique</a>` +
        '<a class="cin-pilule" href="../index.html"><span aria-hidden="true">⌂</span>Accueil</a></div>' +
        `<p class="cin-som-lab">Sommaire</p><nav class="cin-som-arbre" aria-label="Modules">${sommaire(s, pages, ex)}</nav></aside>`;
      // déplier / replier un module ou une partie sur place
      racine.querySelectorAll('.cin-sligne, .cin-spt').forEach(b => b.addEventListener('click', () => {
        const oui = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', oui);
        document.getElementById(b.getAttribute('aria-controls')).hidden = !oui;
      }));
      racine.querySelector('.cin-ou').addEventListener('click', () => ouvrir(!html.classList.contains('cin-som-ouvert')));
      racine.querySelector('.cin-voile').addEventListener('click', () => ouvrir(false));
      // un lien vers une autre partie de la même fiche ne recharge pas la page : on referme
      racine.querySelectorAll('.cin-page').forEach(a => a.addEventListener('click', () => ouvrir(false)));
      // ordinateur : la page en cours visible dans la colonne
      const ici = racine.querySelector('.cin-page.ici'), col = racine.querySelector('.cin-som');
      if (ici && col.scrollHeight > col.clientHeight) col.scrollTop = ici.offsetTop - col.clientHeight / 2;
    }
    rendre();
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && html.classList.contains('cin-som-ouvert')) ouvrir(false); });
    const s = situer(cle);
    if (s.onglet !== 'fiche') return;
    // fiche : la partie choisie est donnée par l'ancre de la page (#vitesse…)
    // (les figures de la fiche se dessinent après le premier défilement : on recale la page sur l'ancre)
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
    const ouvert = derniere ? situer(derniere).m.n : (PLAN.find(m => fait(m) < total(m)) || PLAN[0]).n;
    const bt = (cle, txt, cls) => `<a class="cin-bt${cls ? ' ' + cls : ''}" href="modules/${cle}.html">${txt}</a>`;
    const btCours = pt => { const a = pages[pt.cours] || {}; return bt(pt.cours, 'Cours' + (a.fait ? ' ✓' : ''), (a.fait ? 'fait ' : '') + (derniere === pt.cours ? 'ici' : '')); };
    const btQuestions = pt => { const a = pages[pt.questions] || {}; return bt(pt.questions, 'Questions' + (a.note != null ? ` <span class="cin-sc">${fmt(a.note)}/20</span>` : ''), (a.note != null ? 'fait ' : '') + (derniere === pt.questions ? 'ici' : '')); };
    const module = m => {
      const n = fait(m), t = total(m), termine = n === t, ouv = m.n === ouvert;
      let corps;
      if (m.exercices) corps = `<div class="cin-actions">${bt(m.exercices, 'Exercices 1 à 16 →', 'noir')}</div>`;
      else {
        const multi = m.parties.length > 1;
        const btFiche = bt(m.fiche, multi ? 'Fiche récapitulative' : 'Fiche', derniere === m.fiche ? 'ici' : '');
        // module à une seule partie : tout dans la même carte ; sinon une carte par partie, puis la fiche
        corps = `<div class="cin-grille${multi ? ' deux' : ''}">` + m.parties.map(pt =>
          `<div class="cin-partie">${multi ? `<span class="cin-partie-nom${partieFaite(pt, pages) ? ' ok' : ''}">${pt.nom}</span>` : ''}<div class="cin-actions">${btCours(pt)}${btQuestions(pt)}${multi ? '' : btFiche}</div></div>`).join('') +
          `</div>${multi ? `<div class="cin-actions">${btFiche}</div>` : ''}`;
      }
      return `<div class="cin-module"><button class="cin-ligne" type="button" id="cin-b${m.n}" aria-expanded="${ouv}" aria-controls="cin-m${m.n}">` +
        `<span class="cin-badge${termine ? ' fait' : ''}">${termine ? '✓' : m.n}</span>` +
        `<span class="cin-ligne-t">${m.titre}<small>${m.desc}</small></span><span class="cin-ligne-n">${n}/${t}</span><span class="cin-chev" aria-hidden="true">›</span></button>` +
        `<div class="cin-ouvert" id="cin-m${m.n}" role="region" aria-labelledby="cin-b${m.n}"${ouv ? '' : ' hidden'}>${corps}</div></div>`;
    };
    zone.innerHTML = (derniere ? `<a class="cin-reprendre" href="modules/${derniere}.html"><small>Reprendre</small><b>${libelle(derniere)} →</b></a>` : '') +
      `<div class="cin-modules">${PLAN.map(module).join('')}</div>`;
    // un seul module déplié à la fois
    const lignes = zone.querySelectorAll('.cin-ligne');
    lignes.forEach(b => b.addEventListener('click', () => {
      const ouvrir = b.getAttribute('aria-expanded') !== 'true';
      lignes.forEach(x => { x.setAttribute('aria-expanded', 'false'); document.getElementById(x.getAttribute('aria-controls')).hidden = true; });
      if (ouvrir) {
        b.setAttribute('aria-expanded', 'true');
        document.getElementById(b.getAttribute('aria-controls')).hidden = false;
        setTimeout(() => b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 30);
      }
    }));
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
    MOINS, fmt, cs, sci, lire, proche, sgn, fr, dd, poly, sys, el, secouer, melanger, hasard, entre, champ, PARTIES, analyserIJ,
    question, serie, aToi, Cours, graphe, menu, accueil, PLAN, marquer, confettis,
  });
})();
