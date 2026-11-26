/* ============================================================
   Atelier « somme des forces et accélération » (module 4, page sur un écran)

   LN.atelierSomme(zone) : sur un quadrillage, des forces données sont
   appliquées au point G (1 carreau = 1 N). Pour chaque situation, quatre
   tâches, dans n'importe quel ordre, cochées toutes seules :
     ① tracer Σ F⃗ depuis G (règle du parallélogramme ou bout à bout :
        option « Bout à bout » qui dessine les forces à la suite) ;
     ② tracer a⃗ = Σ F⃗ / m depuis G, à l'échelle 1 carreau = 1 m·s⁻² ;
     ③ coordonnées (projections) de Σ F⃗ sur x et y ;
     ④ coordonnées de a⃗.
   Tracé : glisser la pointe (souris, doigt), boutons fléchés, touches
   fléchées ; « Vérifier » donne un diagnostic. Situations accessibles à
   tout moment (onglet « Situations ») ; réussies gardées dans le
   navigateur (clé lois-newton-atelier). Page marquée faite quand toutes
   les situations sont réussies, ou à l'ouverture de l'onglet « Bilan ».
   ============================================================ */
(function () {
  'use strict';
  const LN = window.LN, BF = window.BF;
  const { V, SF, fl, nom } = LN;
  const MOINS = '−', E = 6, MS2 = 'm·s<sup>−2</sup>';
  const CLE = 'lois-newton-atelier';
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } };
  const noter = id => { try { const r = lire(); r[id] = true; localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { /* stockage indisponible */ } };

  // forces : [nom, indice, coordonnées (carreaux = N)] ; m en kg ; Σ F⃗ / m tombe sur le quadrillage
  const SITUATIONS = [
    { id: 's1', titre: 'Deux forces perpendiculaires', m: 1, mTxt: '1,0 kg', forces: [['F', '1', [3, 0]], ['F', '2', [0, 2]]] },
    { id: 's2', titre: 'Trois forces', m: 2, mTxt: '2,0 kg', forces: [['F', '1', [4, 0]], ['F', '2', [-2, 0]], ['F', '3', [0, 2]]] },
    { id: 's3', titre: 'Un système léger', m: .5, mTxt: '0,50 kg', forces: [['F', '1', [0, -3]], ['F', '2', [1, 0]], ['F', '3', [0, 2]]] },
    { id: 's4', titre: 'Caisse tirée sur le sol, avec frottements', m: 2, mTxt: '2,0 kg', forces: [['P', '', [0, -4]], ['R', 'N', [0, 4]], ['F', '', [4, 0]], ['f', '', [-2, 0]]] },
    { id: 's5', titre: 'Deux forces obliques', m: 1, mTxt: '1,0 kg', forces: [['F', '1', [2, 3]], ['F', '2', [-4, 1]]] },
    { id: 's6', titre: 'Des forces qui se compensent', m: 4, mTxt: '4,0 kg', forces: [['F', '1', [4, 4]], ['F', '2', [0, -4]], ['F', '3', [-4, 0]]] },
  ];
  const COULS = { P: BF.COUL.P, R: BF.COUL.RN, f: BF.COUL.f };
  const QUAD = ['#d9480f', '#1971c2', '#5c940d', '#862e9c'];
  const coulDe = (f, i) => COULS[f[0]] || QUAD[i % QUAD.length];
  const nb = v => String(v).replace('-', MOINS).replace('.', ',');
  const somme = s => s.forces.reduce((t, f) => [t[0] + f[2][0], t[1] + f[2][1]], [0, 0]);

  function atelierSomme(zone) {
    const faitsSits = lire();
    const c = LN.cadre(zone, {
      badge: 'MODULE 4 · ATELIER', titre: 'Somme des forces et accélération',
      bande: '<p class="ln-at-sit"><b data-a="sitTitre"></b><span data-a="sitInfo"></span></p><div class="ln-at-vec" data-a="taches"></div>',
      onglets: [{ id: 'tracer', nom: 'Atelier', sections: ['tracer'], sectionsOrdi: ['tracer', 'coord'] }, { id: 'coord', nom: 'x et y', sections: ['coord'], tel: true },
        { id: 'sits', nom: 'Situations', sections: ['sits'] }, { id: 'bilan', nom: 'Bilan', sections: ['bilan'] }],
      sections: [
        { id: 'tracer', html: `<p class="ln-lab">Vecteur à tracer depuis G</p>
            <div class="ln-seg" role="group" aria-label="Vecteur à tracer"><button type="button" data-v="S" aria-pressed="true">${SF}</button><button type="button" data-v="a" aria-pressed="false">${V('a')}</button>
              <button type="button" data-a="bout" aria-pressed="false">Bout à bout</button></div>
            <div class="ln-at-pad" role="group" aria-label="Déplacer la pointe d'un carreau">
              <button type="button" data-d="0,1" aria-label="Pointe un carreau vers le haut">↑</button><button type="button" data-d="-1,0" aria-label="Pointe un carreau vers la gauche">←</button>
              <button type="button" data-d="1,0" aria-label="Pointe un carreau vers la droite">→</button><button type="button" data-d="0,-1" aria-label="Pointe un carreau vers le bas">↓</button></div>
            <div class="ln-ligne"><span class="ln-gf-val" data-a="val"></span><button type="button" class="btn-small" data-a="verif">Vérifier</button></div>` },
        { id: 'coord', html: `<p class="ln-lab">Coordonnées (projections sur x et y)</p>
            <div class="ln-at-champs" data-a="cS"><span>Σ F<sub>x</sub> =</span><span data-c="Sx"></span><span>N ; Σ F<sub>y</sub> =</span><span data-c="Sy"></span><span>N</span><button type="button" class="btn-small" data-ok="S">Valider</button></div>
            <div class="ln-at-champs" data-a="ca"><span>a<sub>x</sub> =</span><span data-c="ax"></span><span>${MS2} ; a<sub>y</sub> =</span><span data-c="ay"></span><span>${MS2}</span><button type="button" class="btn-small" data-ok="a">Valider</button></div>` },
        { id: 'sits', html: `<p class="ln-lab">Situations (dans n'importe quel ordre)</p><div class="ln-at-sits" data-a="pastilles"></div><p class="ln-petit" data-a="compte"></p>` },
        { id: 'bilan', html: `<div class="ln-bilan"><div class="cle"><p><b>Somme des forces</b> : on met les flèches bout à bout (ou règle du parallélogramme) ; ses coordonnées sont les sommes des coordonnées : Σ F<sub>x</sub> = F<sub>1x</sub> + F<sub>2x</sub> + …</p></div>
            <div class="cle"><p><b>Deuxième loi de Newton</b> : ${V('a')} = Σ ${V('F')} / m : même direction, même sens ; a<sub>x</sub> = Σ F<sub>x</sub> / m, a<sub>y</sub> = Σ F<sub>y</sub> / m.</p></div>
            <div class="cle"><p>Si Σ ${V('F')} = ${V('0')}, alors ${V('a')} = ${V('0')} : principe d'inertie.</p></div></div>` },
      ],
      surOnglet: id => { if (id === 'bilan') window.SOM.marquer({ fait: true }); },
    });
    const $ = c.$;
    // champs de saisie (avec ±)
    const ch = {};
    ['Sx', 'Sy', 'ax', 'ay'].forEach(k => { ch[k] = BF.champ({ petit: true, aria: k }); zone.querySelector(`[data-c="${k}"]`).appendChild(ch[k].el); ch[k].input.addEventListener('input', () => c.message('')); });

    let sit = null, st = null, sel = 'S', bout = false;
    const svg = () => c.fig.querySelector('svg');

    /* ---------- Choix de la situation ---------- */
    function choisir(i) {
      sit = SITUATIONS[i];
      const S = somme(sit);
      st = { i, S, A: [S[0] / sit.m, S[1] / sit.m], tip: { S: null, a: null }, ok: { S: false, a: false, cS: false, ca: false } };
      Object.keys(ch).forEach(k => { ch[k].input.value = ''; ch[k].desactiver(false); });
      $('sitTitre').textContent = `Situation ${i + 1} : ${sit.titre}`;
      $('sitInfo').innerHTML = ` · m = ${sit.mTxt} · forces : 1 carreau = 1 N ; ${V('a')} : 1 carreau = 1 ${MS2}`;
      c.message('');
      pastilles();
      dessiner();
    }
    function pastilles() {
      $('pastilles').innerHTML = SITUATIONS.map((s, i) => `<button type="button" class="ln-puce${faitsSits[s.id] ? ' fait' : ''}" data-s="${i}" aria-selected="${sit === s}" aria-label="Situation ${i + 1}${faitsSits[s.id] ? ', réussie' : ''}">${i + 1}</button>`).join('');
      $('pastilles').querySelectorAll('[data-s]').forEach(b => { b.onclick = () => { choisir(+b.dataset.s); c.onglet('tracer'); }; });
      const n = SITUATIONS.filter(s => faitsSits[s.id]).length;
      $('compte').textContent = `${n} situation${n > 1 ? 's' : ''} réussie${n > 1 ? 's' : ''} sur ${SITUATIONS.length}.`;
    }

    /* ---------- Dessin du quadrillage ---------- */
    let geo = null;
    function dessiner() {
      const r = c.fig.getBoundingClientRect(), Wp = Math.max(200, r.width), Hp = Math.max(160, r.height);
      const u = Math.min((Wp - 16) / (2 * E), (Hp - 16) / (2 * E)), ox = Wp / 2, oy = Hp / 2;
      geo = { u, ox, oy, Wp, Hp };
      const X = x => ox + x * u, Y = y => oy - y * u;
      let s = `<rect x="${X(-E)}" y="${Y(E)}" width="${2 * E * u}" height="${2 * E * u}" fill="#fff"/>`;
      for (let k = -E; k <= E; k++) s += `<line x1="${X(k)}" y1="${Y(-E)}" x2="${X(k)}" y2="${Y(E)}" stroke="#dcd7e8"/><line x1="${X(-E)}" y1="${Y(k)}" x2="${X(E)}" y2="${Y(k)}" stroke="#dcd7e8"/>`;
      s += `<line x1="${X(-E)}" y1="${Y(0)}" x2="${X(E)}" y2="${Y(0)}" stroke="#8d8f94" stroke-width="1.2"/><line x1="${X(0)}" y1="${Y(-E)}" x2="${X(0)}" y2="${Y(E)}" stroke="#8d8f94" stroke-width="1.2"/>`;
      s += LN.txt(X(E) - 12, Y(0) - 6, 'x', { g: 800, c: '#16181d', t: 13 }) + LN.txt(X(0) + 6, Y(E) + 14, 'y', { g: 800, c: '#16181d', t: 13 });
      const t = Math.max(12, Math.min(16, u * .5));
      // forces données (option « bout à bout » : chacune part de l'extrémité de la précédente, en pointillés)
      let bx = 0, by = 0;
      sit.forces.forEach((f, i) => {
        const cl = coulDe(f, i);
        s += fl(X(0), Y(0), X(f[2][0]), Y(f[2][1]), cl, { ep: 2.6, lt: Math.max(9, u * .4) });
        s += nom(X(f[2][0] * 1.08) + (f[2][0] >= 0 ? 10 : -10), Y(f[2][1] * 1.08) + (f[2][1] > 0 ? -4 : 16), f[0], f[1], cl, { t });
        if (bout && i > 0) s += fl(X(bx), Y(by), X(bx + f[2][0]), Y(by + f[2][1]), cl, { ep: 1.8, tirets: true, lt: Math.max(8, u * .35) });
        bx += f[2][0]; by += f[2][1];
      });
      // vecteurs tracés par l'élève
      [['S', '#16181d', 'ΣF'], ['a', '#5a3fc4', 'a']].forEach(([k, cl, n]) => {
        const p = st.tip[k];
        if (!p || (!p[0] && !p[1])) return;
        const col = st.ok[k] ? '#16a34a' : cl;
        s += fl(X(0), Y(0), X(p[0]), Y(p[1]), col, { ep: 3.4, lt: Math.max(10, u * .45) });
        s += k === 'S' ? nom(X(p[0]) + (p[0] >= 0 ? 14 : -14), Y(p[1]) + (p[1] > 0 ? -6 : 18), n, '', col, { t }) : nom(X(p[0]) + (p[0] >= 0 ? -14 : 14), Y(p[1]) + (p[1] > 0 ? 22 : -8), n, '', col, { t });
      });
      const p = st.tip[sel];
      if (p) s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${u * .3}" fill="none" stroke="#5a3fc4" stroke-width="1.5" stroke-dasharray="3 2"/>`;
      s += `<circle cx="${X(0)}" cy="${Y(0)}" r="3.5" fill="#16181d"/>` + LN.txt(X(0) - 16, Y(0) + 16, 'G', { g: 800, c: '#16181d', t: 13 });
      // le SVG est créé une seule fois : un glisser en cours garde sa capture du pointeur
      if (!svg()) { c.fig.innerHTML = '<svg class="ln-sim-svg ln-at-svg" tabindex="0" role="img" aria-label="Quadrillage : forces appliquées en G ; glisse la pointe du vecteur choisi"></svg>'; brancher(); }
      svg().setAttribute('viewBox', `0 0 ${Wp} ${Hp}`);
      svg().innerHTML = s;
      majTaches();
    }
    function majTaches() {
      const T = [['S', `① tracer ${SF}`], ['a', `② tracer ${V('a')}`], ['cS', `③ coord. de ${SF}`], ['ca', `④ coord. de ${V('a')}`]];
      $('taches').innerHTML = T.map(([k, t]) => `<span class="ln-at-tache${st.ok[k] ? ' fait' : ''}"><span class="ln-at-tache-t">${t}</span></span>`).join('');
      zone.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === sel ? 'true' : 'false'));
      const p = st.tip[sel], k = sel === 'S' ? 'Σ F' : 'a', u = sel === 'S' ? 'N' : MS2;
      $('val').innerHTML = p ? `${k} tracé : (${nb(p[0])} ; ${nb(p[1])}) carreaux, valeur ≈ ${BF.fmt(+Math.hypot(p[0], p[1]).toFixed(1))} ${u}` : 'Glisse la pointe depuis G, ou utilise les flèches.';
      zone.querySelectorAll('[data-ok]').forEach(b => { b.disabled = st.ok[b.dataset.ok === 'S' ? 'cS' : 'ca']; });
    }

    /* ---------- Tracé ---------- */
    function poser(p) {
      if (st.ok[sel]) return;
      p = [Math.max(-E, Math.min(E, p[0])), Math.max(-E, Math.min(E, p[1]))];
      st.tip[sel] = p;
      const bon = sel === 'S' ? st.S : st.A;
      if (p[0] === bon[0] && p[1] === bon[1] && (bon[0] || bon[1])) reussir(sel);
      dessiner();
    }
    function brancher() {
      const s = svg();
      let drag = null;
      const versGrille = e => { const r = s.getBoundingClientRect(), k = geo.Wp / r.width; return [Math.round(((e.clientX - r.left) * k - geo.ox) / geo.u), Math.round((geo.oy - (e.clientY - r.top) * k) / geo.u)]; };
      s.addEventListener('pointerdown', e => { drag = e.pointerId; try { s.setPointerCapture(e.pointerId); } catch (er) { /* rien */ } poser(versGrille(e)); e.preventDefault(); });
      s.addEventListener('pointermove', e => { if (drag !== e.pointerId) return; const p = versGrille(e), q = st.tip[sel]; if (!q || p[0] !== q[0] || p[1] !== q[1]) poser(p); });
      const fin = e => { if (drag === e.pointerId) drag = null; };
      s.addEventListener('pointerup', fin); s.addEventListener('pointercancel', fin);
      s.addEventListener('keydown', e => {
        const d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
        if (!d) return;
        e.preventDefault(); bouger(d);
      });
    }
    function bouger(d) { const q = st.tip[sel] || [0, 0]; poser([q[0] + d[0], q[1] + d[1]]); }
    zone.querySelectorAll('.ln-at-pad [data-d]').forEach(b => { b.onclick = () => bouger(b.dataset.d.split(',').map(Number)); });
    zone.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => { sel = b.dataset.v; dessiner(); }; });
    $('bout').onclick = () => { bout = !bout; $('bout').setAttribute('aria-pressed', bout ? 'true' : 'false'); dessiner(); };
    $('verif').onclick = () => {
      const p = st.tip[sel], bon = sel === 'S' ? st.S : st.A, n = sel === 'S' ? SF : V('a');
      if (st.ok[sel]) { c.message(`${n} est juste.`, 'ok'); return; }
      if (!bon[0] && !bon[1]) {
        c.message(`Les forces se compensent : ${SF} = ${V('0')}, donc ${V('a')} = ${V('0')}. Il n'y a rien à tracer : ${sel === 'S' ? 'la flèche revient au point G' : 'principe d\'inertie'}.`, 'ok');
        reussir(sel); dessiner(); return;
      }
      if (!p || (!p[0] && !p[1])) { c.message(`Trace d'abord ${n} depuis G.`, 'refus'); return; }
      let m;
      if (p[0] === -bon[0] && p[1] === -bon[1]) m = 'Le sens est inversé.';
      else if (sel === 'a' && p[0] === st.S[0] && p[1] === st.S[1]) m = `Tu as recopié ${SF} : ${V('a')} = ${SF} / m, avec m = ${sit.mTxt}.`;
      else if (p[0] * bon[1] - p[1] * bon[0] === 0 && p[0] * bon[0] + p[1] * bon[1] > 0) m = sel === 'S' ? 'Bonne direction, bon sens, mais pas la bonne longueur : additionne toutes les forces.' : `Bonne direction, bon sens : vérifie la longueur, a = Σ F / m (m = ${sit.mTxt}).`;
      else if (sel === 'S') m = 'Mets les flèches bout à bout (bouton « Bout à bout ») : Σ <span class="vec-nom">F</span> va de G à l\'extrémité de la dernière flèche. Ou additionne les coordonnées : Σ F<sub>x</sub> = F<sub>1x</sub> + F<sub>2x</sub> + …';
      else m = `${V('a')} a la même direction et le même sens que ${SF} ; ses coordonnées sont celles de ${SF} divisées par m.`;
      c.message(`<b>Ce n'est pas ça.</b> ${m}`, 'refus');
    };

    /* ---------- Coordonnées ---------- */
    zone.querySelectorAll('[data-ok]').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.ok, cx = ch[k === 'S' ? 'Sx' : 'ax'], cy = ch[k === 'S' ? 'Sy' : 'ay'];
        const x = BF.lire(cx.input.value), y = BF.lire(cy.input.value), bon = k === 'S' ? st.S : st.A;
        if (isNaN(x) || isNaN(y)) { c.message('Écris les deux coordonnées (avec une virgule si besoin, 0 si elle est nulle).', 'info'); return; }
        const eg = (u, v) => Math.abs(u - v) < 1e-6;
        if (eg(x, bon[0]) && eg(y, bon[1])) { cx.desactiver(true); cy.desactiver(true); reussir(k === 'S' ? 'cS' : 'ca'); dessiner(); return; }
        let m;
        if (eg(x, bon[1]) && eg(y, bon[0])) m = 'Les coordonnées sont inversées : d\'abord x (horizontale), puis y (verticale).';
        else if (eg(Math.abs(x), Math.abs(bon[0])) && eg(Math.abs(y), Math.abs(bon[1]))) m = 'Attention aux signes : négatif vers la gauche (x) ou vers le bas (y).';
        else if (k === 'a' && eg(x, st.S[0]) && eg(y, st.S[1])) m = `Ce sont les coordonnées de Σ <span class="vec-nom">F</span> : divise par m = ${sit.mTxt}.`;
        else if (k === 'a' && eg(x, st.S[0] * sit.m) && eg(y, st.S[1] * sit.m)) m = 'a = Σ F / m : on divise par la masse, on ne multiplie pas.';
        else m = k === 'S' ? 'Additionne les coordonnées de toutes les forces (en carreaux, 1 carreau = 1 N).' : `a<sub>x</sub> = Σ F<sub>x</sub> / m et a<sub>y</sub> = Σ F<sub>y</sub> / m, avec m = ${sit.mTxt}.`;
        c.message(`<b>Ce n'est pas ça.</b> ${m}`, 'refus');
      };
    });

    function reussir(k) {
      if (st.ok[k]) return;
      st.ok[k] = true;
      const tous = Object.keys(st.ok).every(x => st.ok[x]);
      const txt = { S: `${SF} est juste.`, a: `${V('a')} est juste : même direction et même sens que ${SF}.`, cS: `Coordonnées de ${SF} justes.`, ca: `Coordonnées de ${V('a')} justes.` }[k];
      if (tous) {
        faitsSits[sit.id] = true; noter(sit.id); pastilles();
        const suiv = SITUATIONS.findIndex(s => !faitsSits[s.id]);
        c.message(`<b>Situation ${st.i + 1} réussie !</b> ${suiv >= 0 ? `Passe à une autre situation (onglet « Situations »).` : 'Toutes les situations sont réussies : ouvre le « Bilan ».'}`, 'ok');
        if (SITUATIONS.every(s => faitsSits[s.id])) window.SOM.marquer({ fait: true });
      } else c.message(`<b>Juste !</b> ${txt}`, 'ok');
    }

    const redim = () => { if (sit) dessiner(); };
    if (window.ResizeObserver) new ResizeObserver(() => { const r = c.fig.getBoundingClientRect(); if (!geo || Math.abs(r.width - geo.Wp) > 2 || Math.abs(r.height - geo.Hp) > 2) redim(); }).observe(c.fig);
    else addEventListener('resize', redim);
    const debut = SITUATIONS.findIndex(s => !faitsSits[s.id]);
    choisir(debut >= 0 ? debut : 0);
  }

  LN.atelierSomme = atelierSomme;
})();
