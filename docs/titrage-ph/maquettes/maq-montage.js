/* ============================================================
   Maquettes : schéma SVG du montage de titrage
   (sera TITRAGE.montage dans assets/titrage.js à l'étape 2)

   TPHM.montage(zone, {
     style: 'epure' | 'realiste',     schéma au trait comme le cours, ou dessin plus réaliste
     appareil: 'ph' | 'conductimetre' | null,
     etiquettes: true,                espèces, concentrations, volumes écrits à côté de la burette et du bécher
     aCompleter: false,               zones de dépôt vides (HTML par-dessus le SVG) à la place des étiquettes
   }) → {
     el, maj({ V, affichage, couleur, goutte }),   V versé (mL), valeur affichée par l'appareil (texte), couleur { r, g, b, a }
     zones: { id: élément },          zones à compléter (aCompleter)
     poserAppareil(type)              dessine l'appareil choisi dans sa zone ('ph', 'conductimetre', 'indicateur', null)
   }
   Géométrie (unités du viewBox 320 × 392) : burette graduée de 0 (y = 30) à 25 mL (y = 230), 8 unités par mL.
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';
  // couleurs de présentation du dessin réaliste (constantes, comme VEC.C) : verre, métal, plastique
  const C = {
    verre1: '#f4f8fb', verre2: '#dfe8ee', reflet: '#ffffff', metal1: '#c9ccd1', metal2: '#8e939b', metal3: '#5f646c',
    plastique: '#eceae5', plastique2: '#d6d3cc', bouton: '#55585f', ecranR: '#1f2a24', ecranTxt: '#b8f5d2', burette: '#e9f1f6',
  };
  const svgNS = 'http://www.w3.org/2000/svg';
  let nb = 0;   // identifiants uniques des dégradés (plusieurs montages dans la page)

  const Y0 = 30, PX = 8;                      // graduation 0 et pixels par mL
  const yBur = V => Y0 + PX * V;
  // hauteur de la solution dans le bécher (volume total en mL)
  const ySol = Vt => 330 - (6 + Math.min(40, Vt) * 0.95);

  function montage(zone, o) {
    o = Object.assign({ style: 'epure', appareil: 'ph', etiquettes: true, aCompleter: false }, o || {});
    const k = ++nb, real = o.style === 'realiste';
    const el = document.createElement('div');
    el.className = 'ttr-montage' + (real ? ' ttr-realiste' : '');
    const g = (id) => `url(#ttr${k}-${id})`;

    // ---------- définitions (dessin réaliste) ----------
    const defs = real ? `<defs>
      <linearGradient id="ttr${k}-metal" x1="0" x2="1"><stop offset="0" stop-color="${C.metal2}"/><stop offset=".45" stop-color="${C.metal1}"/><stop offset="1" stop-color="${C.metal3}"/></linearGradient>
      <linearGradient id="ttr${k}-socle" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.metal1}"/><stop offset="1" stop-color="${C.metal3}"/></linearGradient>
      <linearGradient id="ttr${k}-verre" x1="0" x2="1"><stop offset="0" stop-color="${C.verre2}"/><stop offset=".3" stop-color="${C.verre1}"/><stop offset=".8" stop-color="${C.verre1}"/><stop offset="1" stop-color="${C.verre2}"/></linearGradient>
      <linearGradient id="ttr${k}-plast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.plastique}"/><stop offset="1" stop-color="${C.plastique2}"/></linearGradient>
      <linearGradient id="ttr${k}-sol" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".10"/><stop offset=".35" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
    </defs>` : '';

    // ---------- potence ----------
    const potence = real
      ? `<rect x="6" y="352" width="190" height="11" rx="3" fill="${g('socle')}"/>
         <rect x="27" y="10" width="7" height="344" rx="2" fill="${g('metal')}"/>
         <rect x="31" y="19" width="92" height="5" rx="2" fill="${g('metal')}"/><rect x="113" y="15" width="26" height="13" rx="3" fill="${C.metal3}"/>
         <rect x="31" y="233" width="92" height="5" rx="2" fill="${g('metal')}"/><rect x="113" y="229" width="26" height="13" rx="3" fill="${C.metal3}"/>`
      : `<rect class="ttr-support" x="6" y="352" width="190" height="10"/>
         <line class="ttr-trait" x1="30" y1="10" x2="30" y2="352"/>
         <line class="ttr-trait" x1="30" y1="22" x2="118" y2="22"/><line class="ttr-trait" x1="114" y1="17" x2="114" y2="27"/>
         <line class="ttr-trait" x1="30" y1="236" x2="118" y2="236"/><line class="ttr-trait" x1="114" y1="231" x2="114" y2="241"/>`;

    // ---------- burette graduée ----------
    let grad = '';
    for (let v = 0; v <= 25; v++) {
      const y = yBur(v), long = v % 5 === 0;
      grad += `<line class="ttr-grad" x1="118" y1="${y}" x2="${long ? 126 : 122}" y2="${y}"/>`;
      if (long) grad += `<text class="ttr-grad-txt" x="114" y="${y + 2.5}" text-anchor="end">${v}</text>`;
    }
    const burette = `
      ${real ? '' : '<path class="ttr-trait" d="M110 6 L118 16 M142 6 L134 16"/>'}
      <rect data-r="liq-bur" x="119" y="${Y0}" width="14" height="${238 - Y0}" fill="${C.burette}"/>
      <rect x="118" y="14" width="16" height="226" ${real ? `fill="${g('verre')}" fill-opacity=".55" stroke="${C.metal2}" stroke-width="1.2"` : 'fill="none" class="ttr-trait"'}/>
      <line data-r="menisque" x1="119" x2="133" y1="${Y0}" y2="${Y0}" stroke="var(--accent-ink)" stroke-width="1.6"/>
      ${grad}
      <path d="M121 240 L131 240 L128 266 L124 266 Z" ${real ? `fill="${g('verre')}" stroke="${C.metal2}"` : 'class="ttr-verre"'}/>
      <rect x="106" y="242" width="40" height="7" rx="3" ${real ? `fill="${C.bouton}"` : 'class="ttr-support"'}/>
      <circle class="ttr-goutte" data-r="goutte" cx="126" cy="270" r="2.6"/>`;

    // ---------- bécher, solution, barreau, agitateur ----------
    const becher = `
      <rect x="74" y="330" width="104" height="22" rx="${real ? 5 : 0}" ${real ? `fill="${g('plast')}" stroke="${C.plastique2}"` : 'class="ttr-support"'}/>
      <circle cx="162" cy="341" r="5" ${real ? `fill="${C.bouton}"` : 'class="ttr-appareil"'}/>
      ${real ? `<rect x="84" y="333" width="62" height="4" rx="2" fill="${C.plastique2}"/>` : ''}
      <path data-r="sol" d="" stroke="none"/>
      ${real ? `<path data-r="sol-reflet" d="" fill="${g('sol')}"/>` : ''}
      <rect class="ttr-barreau" data-r="barreau" x="116" y="322" width="20" height="5" rx="2.5"/>
      <path d="M90 256 L94 260 L94 330 L160 330 L160 258" ${real ? `fill="${g('verre')}" fill-opacity=".35" stroke="${C.metal2}" stroke-width="1.6"` : 'class="ttr-trait"'}/>
      ${real ? '<line x1="99" y1="266" x2="99" y2="322" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>' : ''}`;

    el.innerHTML = `<svg viewBox="0 0 320 392" role="img" aria-label="Schéma du montage de titrage" preserveAspectRatio="xMidYMid meet">${defs}
      ${potence}${becher}${burette}
      <g data-r="appareil"></g>
      <g data-r="textes"></g>
    </svg>`;
    zone.appendChild(el);
    const R = n => el.querySelector(`[data-r="${n}"]`);
    const textes = R('textes');

    // ---------- appareil de mesure (pH-mètre, conductimètre, gouttes d'indicateur) ----------
    function dessinAppareil(type) {
      if (!type) return '';
      if (type === 'indicateur') return `
        <path d="M206 214 l0 -26 a6 6 0 0 1 12 0 l0 26 l-4 10 l-4 0 Z" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/>
        <circle cx="212" cy="232" r="2.5" fill="var(--accent)"/>
        <text class="ttr-txt-2" x="226" y="206">quelques gouttes</text><text class="ttr-txt-2" x="226" y="219">d'indicateur coloré</text>`;
      const nomAp = type === 'ph' ? 'pH-mètre' : 'conductimètre';
      const lab = type === 'ph' ? 'pH' : 'σ (mS/m)';
      // sonde (pH) ou cellule (conductimètre) plongée dans le bécher, câble vers l'appareil
      const sonde = type === 'ph'
        ? `<rect x="143" y="236" width="7" height="82" rx="3" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/><circle cx="146.5" cy="318" r="4.5" ${real ? `fill="${C.verre2}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/>`
        : `<rect x="142" y="236" width="9" height="78" rx="2" ${real ? `fill="${C.plastique}" stroke="${C.metal3}"` : 'class="ttr-verre"'}/><rect x="140" y="304" width="13" height="14" rx="1" fill="none" stroke="var(--ink)" stroke-width="1.4"/>`;
      return `${sonde}
        <path class="ttr-cable" d="M146.5 236 C 146 214, 190 214, 204 270"/>
        <rect x="196" y="262" width="110" height="70" rx="${real ? 9 : 4}" ${real ? `fill="${g('plast')}" stroke="${C.plastique2}"` : 'class="ttr-appareil"'}/>
        <rect x="204" y="270" width="94" height="34" rx="4" ${real ? `fill="${C.ecranR}"` : 'class="ttr-ecran"'}/>
        <text x="210" y="282" style="font:700 9px var(--font-sans)" fill="${real ? C.ecranTxt : 'var(--sheet)'}">${lab}</text>
        <text data-r="aff" x="292" y="299" text-anchor="end" style="font:800 17px var(--font-sans);font-variant-numeric:tabular-nums" fill="${real ? C.ecranTxt : 'var(--sheet)'}"></text>
        <text class="ttr-ecran-lab" x="251" y="323" text-anchor="middle">${nomAp}</text>`;
    }
    function poserAppareil(type) {
      R('appareil').innerHTML = dessinAppareil(type);
      o.appareil = type;
      maj(etat);
    }

    // ---------- textes (espèces, concentrations, volumes) ----------
    const ligne = (x1, y1, x2, y2) => `<line class="ttr-fin" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    if (o.etiquettes && !o.aCompleter) {
      textes.innerHTML = `
        ${ligne(136, 60, 150, 60)}
        <text class="ttr-txt" x="152" y="46">H₃O⁺ + Cl⁻</text>
        <text class="ttr-txt-2" x="152" y="66">c<tspan baseline-shift="sub" font-size="9">A</tspan> = 0,100 mol·L⁻¹</text>
        <text class="ttr-acc" data-r="V" x="152" y="96">V = 0,0 mL</text>
        ${ligne(160, 196, 158, 280)}
        <text class="ttr-txt" x="164" y="180">S₀${NB}: Na⁺ + HO⁻</text>
        <text class="ttr-txt-2" x="164" y="200">V<tspan baseline-shift="sub" font-size="9">B</tspan> = 10,0 mL</text>
        <text class="ttr-txt-2" x="12" y="384">agitation</text>${ligne(50, 374, 80, 352)}`;
    } else if (!o.etiquettes) {
      textes.innerHTML = `<text class="ttr-acc" data-r="V" x="150" y="46">V = 0,0 mL</text>`;
    }

    // ---------- zones à compléter (HTML au-dessus du SVG, positions en % du viewBox) ----------
    const zones = {};
    if (o.aCompleter) {
      textes.innerHTML = `${ligne(136, 74, 148, 74)}${ligne(150, 196, 156, 280)}${ligne(70, 374, 84, 352)}
        <rect x="194" y="258" width="116" height="80" rx="10" fill="none" stroke="var(--line-strong)" stroke-width="2" stroke-dasharray="6 4" data-r="cadre-app"/>`;
      const pos = {
        bur_esp: [150, 44], bur_c: [150, 76], bur_v: [150, 108],
        bec_esp: [150, 164], bec_c: [150, 196], bec_v: [150, 228],
        agit: [6, 374], app: [198, 298],
      };
      for (const id in pos) {
        const z = document.createElement('button');
        z.type = 'button';
        z.className = 'ttr-zone';
        z.dataset.zone = id;
        z.style.left = (pos[id][0] / 320 * 100) + '%';
        z.style.top = (pos[id][1] / 392 * 100) + '%';
        z.style.width = (id === 'app' ? 108 : id === 'agit' ? 100 : 166) / 320 * 100 + '%';
        z.setAttribute('aria-label', 'Zone à compléter');
        z.innerHTML = '<span class="ttr-zone-vide">?</span>';
        el.appendChild(z);
        zones[id] = z;
      }
    }

    // ---------- état ----------
    let etat = { V: 0, affichage: '', couleur: { r: 220, g: 236, b: 245, a: 0.35 } };
    function maj(e) {
      etat = Object.assign(etat, e || {});
      const V = Math.max(0, Math.min(25, etat.V));
      const yL = yBur(V);
      const liq = R('liq-bur');
      liq.setAttribute('y', yL); liq.setAttribute('height', Math.max(0, 238 - yL));
      R('menisque').setAttribute('y1', yL); R('menisque').setAttribute('y2', yL);
      const ys = ySol(10 + etat.V);
      const c = etat.couleur;
      const d = `M95 ${ys} L159 ${ys} L159 329 L95 329 Z`;
      const sol = R('sol');
      sol.setAttribute('d', d);
      sol.setAttribute('fill', `rgba(${c.r},${c.g},${c.b},${c.a})`);
      if (R('sol-reflet')) R('sol-reflet').setAttribute('d', d);
      const tV = R('V');
      if (tV) tV.textContent = 'V = ' + TITRAGE.outils.fmt(etat.V, 1) + ' mL';
      const aff = R('aff');
      if (aff) aff.textContent = etat.affichage || '';
      R('barreau').classList.toggle('ttr-tourne', etat.agitation !== false);
      if (e && e.goutte) {
        const gt = R('goutte');
        gt.classList.remove('tombe'); void gt.getBBox(); gt.classList.add('tombe');
      }
    }
    if (!o.aCompleter) poserAppareil(o.appareil); else maj();
    return { el, maj, zones, poserAppareil };
  }

  window.TPHM = window.TPHM || {};
  window.TPHM.montage = montage;
})();
