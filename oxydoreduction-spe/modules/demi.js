/* ============================================================
   Outil « Équilibrer une demi-équation »
   (application Oxydoréduction, 1re et terminale spécialité)

     DEMI.outil(zone, opts)   construit l'outil dans zone et renvoie
                              { montrer(), reprendre() }
       opts = {
         couple: { ox: 'MnO4^-', red: 'Mn^2+' }   formules (charge après ^)
         onFini(bilan)     demi-équation équilibrée ;
                           bilan = { erreurs, vues, codes, html }
         onErreur(code)    une erreur vient d'être repérée (voir DIFFICULTES)
       }
     DEMI.solution(couple)    demi-équation équilibrée, étape par étape
     DEMI.ecrire(termes)      écriture HTML d'une demi-équation
     DEMI.DIFFICULTES         libellé de chaque difficulté repérée

   Méthode suivie, une étape après l'autre (chaque étape est validée) :
     1. oxydant à gauche, réducteur à droite ; équilibrer les éléments
        autres que O et H
     2. équilibrer O en ajoutant H2O
     3. équilibrer H en ajoutant H+
     4. équilibrer les charges en ajoutant des électrons e−
   On glisse les espèces (celles du couple, puis H2O, H+ et e− de la
   réserve) dans les membres ; les flèches règlent les nombres
   stœchiométriques. « Afficher les aides » : nombre d'atomes de chaque
   élément et charge totale de chaque côté du signe =, en direct.

   Plusieurs outils peuvent coexister dans une page (ni id, ni état
   global). Dépend de assets/molecules.js (MOL) et assets/dragdrop.js.
   ============================================================ */
(function () {
  'use strict';
  const { analyser, formuleHTML, charge, selecteur } = window.MOL;

  const EAU = 'H2O', HP = 'H^+', E = 'e^-';
  const MAX = 20;                                    // plus grand nombre stœchiométrique
  // espèces de la réserve et étape (0 à 3) où chacune se glisse
  const RESERVE = [{ role: 'eau', f: EAU, etape: 1 }, { role: 'h', f: HP, etape: 2 }, { role: 'e', f: E, etape: 3 }];
  const F_ETAPE = [null, EAU, HP, E];                // espèce dont on règle le nombre à chaque étape
  const ROLE_ETAPE = [null, 'eau', 'h', 'e'];
  // ordre d'écriture dans un membre : espèce du couple, H+, e−, H2O
  const ORDRE = { ox: 0, red: 0, h: 1, e: 2, eau: 3 };
  const ETAPES = [
    { titre: 'Éléments autres que O et H',
      consigne: 'Glisse l\'oxydant à gauche du signe = et le réducteur à droite. Puis, avec les flèches, équilibre les éléments autres que O et H.' },
    { titre: 'O : ajouter H<sub>2</sub>O',
      consigne: 'Équilibre l\'élément O : glisse H<sub>2</sub>O du côté où il manque des atomes O, puis règle le nombre de molécules d\'eau. Si O est déjà équilibré, valide directement.' },
    { titre: 'H : ajouter H<sup>+</sup>',
      consigne: 'Équilibre l\'élément H : glisse H<sup>+</sup> du côté où il manque des atomes H, puis règle leur nombre. Si H est déjà équilibré, valide directement.' },
    { titre: 'Charges : ajouter e<sup>−</sup>',
      consigne: 'Équilibre les charges : glisse des électrons e<sup>−</sup> (charge −1 chacun) d\'un côté du signe =, puis règle leur nombre pour avoir la même charge totale des deux côtés.' },
  ];

  // Difficultés repérées par les diagnostics (code → libellé)
  const DIFFICULTES = {
    placement: 'oxydant et réducteur mal placés',
    indice: 'indice pris pour un nombre stœchiométrique',
    elements: 'éléments autres que O et H',
    simplifier: 'nombres non simplifiés',
    eau: 'équilibrer O avec H<sub>2</sub>O',
    'eau-cote': 'H<sub>2</sub>O du mauvais côté',
    h: 'équilibrer H avec H<sup>+</sup>',
    'h-cote': 'H<sup>+</sup> du mauvais côté',
    'h-eau': 'atomes H de H<sub>2</sub>O comptés une seule fois',
    'e-oubli': 'électrons oubliés',
    'e-deux': 'électrons des deux côtés',
    'e-cote': 'électrons du mauvais côté',
    'e-signe': 'électron compté comme une charge +1',
    'charge-signe': 'signe d\'une charge négative oublié',
    'charge-coef': 'charge non multipliée par le nombre stœchiométrique',
    'charge-somme': 'charges additionnées au lieu de calculer l\'écart',
    'charge-seul': 'charge d\'un seul côté prise en compte',
    'e-nombre': 'nombre d\'électrons',
  };

  /* ---------- Petits outils ---------- */
  const pgcd = (a, b) => (b ? pgcd(b, a % b) : Math.abs(a));
  const s = n => (n > 1 ? 's' : '');
  const cote = c => (c === 'g' ? 'à gauche' : 'à droite');
  const autre = c => (c === 'g' ? 'd' : 'g');
  const html = f => formuleHTML(f);
  const texte = h => h.replace(/<[^>]*>/g, '');
  const estCouple = t => t.role === 'ox' || t.role === 'red';
  // charge d'une espèce : 'MnO4^-' → −1, 'Fe^3+' → 3, 'H2O' → 0, 'e^-' → −1
  function q(f) {
    const c = charge(f).charge;
    if (!c) return 0;
    const n = parseInt(c, 10) || 1;
    return c.slice(-1) === '+' ? n : -n;
  }
  // nombre d'atomes de chaque élément d'une espèce (aucun pour l'électron)
  function compo(f) {
    const r = {};
    if (f !== E) analyser(f).forEach(a => { r[a.el] = (r[a.el] || 0) + a.n; });
    return r;
  }
  // charge écrite avec son signe : +7, −2, 0
  const fq = n => (n > 0 ? '+' + n : n < 0 ? '−' + -n : '0');
  // une espèce précédée de son nombre stœchiométrique (1 ne s'écrit pas)
  const kf = (k, f) => (k > 1 ? k + '&nbsp;' : '') + html(f);

  // Atomes et charge d'un membre (c : 'g' ou 'd') d'une liste de termes
  function atomes(T, c) {
    const r = {};
    T.filter(t => t.cote === c).forEach(t => {
      const a = compo(t.f);
      for (const el in a) r[el] = (r[el] || 0) + t.coef * a[el];
    });
    return r;
  }
  const charges = (T, c) => T.filter(t => t.cote === c).reduce((x, t) => x + t.coef * q(t.f), 0);
  // éléments autres que O et H du couple, dans l'ordre d'écriture
  function autres(cp) {
    const l = [];
    [cp.ox, cp.red].forEach(f => Object.keys(compo(f)).forEach(el => { if (el !== 'O' && el !== 'H' && !l.includes(el)) l.push(el); }));
    return l;
  }
  const trier = L => L.slice().sort((a, b) => ORDRE[a.role] - ORDRE[b.role]);

  // Écriture d'une demi-équation : « MnO4− + 8 H+ + 5 e− = Mn2+ + 4 H2O »
  function ecrire(T) {
    const m = c => trier(T.filter(t => t.cote === c)).map(t => kf(t.coef, t.f)).join(' + ');
    return `${m('g')} = ${m('d')}`;
  }

  /* ============================================================
     SOLUTION : la demi-équation après chacune des 4 étapes,
     avec l'explication de chaque étape
     ============================================================ */
  function solution(cp) {
    const T = [{ role: 'ox', f: cp.ox, cote: 'g', coef: 1 }, { role: 'red', f: cp.red, cote: 'd', coef: 1 }];
    const etapes = [], textes = [];
    const copie = () => T.map(t => Object.assign({}, t));
    // une espèce déjà présente du même côté voit son nombre augmenter (H2O2 / H2O : 2 H2O)
    // renvoie « , soit 2 H2O en tout » dans ce cas
    const ajouter = (role, f, c, k) => {
      const t = T.find(x => x.f === f && x.cote === c);
      if (!t) { T.push({ role, f, cote: c, coef: k }); return ''; }
      t.coef += k;
      return `, soit ${t.coef}&nbsp;${html(f)} en tout`;
    };
    // 1. éléments autres que O et H
    const X = autres(cp)[0];
    if (X) {
      const a = compo(cp.ox)[X], b = compo(cp.red)[X], g = pgcd(a, b);
      T[0].coef = b / g; T[1].coef = a / g;
      const n = T[0].coef * a;
      textes.push(T[0].coef === 1 && T[1].coef === 1
        ? `${X} est déjà équilibré : ${n} atome${s(n)} ${X} de chaque côté.`
        : `Il y a ${a} atome${s(a)} ${X} dans ${html(cp.ox)} et ${b} dans ${html(cp.red)} : on écrit ${kf(T[0].coef, cp.ox)} et ${kf(T[1].coef, cp.red)}, soit ${n} atomes ${X} de chaque côté.`);
    } else textes.push('Il n\'y a pas d\'autre élément que O et H dans ce couple : rien à équilibrer à cette étape.');
    etapes.push(copie());
    // 2. O avec H2O (une molécule d'eau apporte un atome O)
    const OG = atomes(T, 'g').O || 0, OD = atomes(T, 'd').O || 0;
    if (OG !== OD) {
      const c = OG > OD ? 'd' : 'g', k = Math.abs(OG - OD);
      const tout = ajouter('eau', EAU, c, k);
      textes.push(`Il y a ${OG} atome${s(OG)} O à gauche et ${OD} à droite : il manque ${k} atome${s(k)} O ${cote(c)}, on ajoute ${k}&nbsp;H<sub>2</sub>O ${cote(c)}${tout}.`);
    } else textes.push(OG ? `O est déjà équilibré (${OG} atome${s(OG)} de chaque côté) : pas besoin d'eau.` : 'Il n\'y a pas d\'atome O : pas besoin d\'eau.');
    etapes.push(copie());
    // 3. H avec H+ (un ion H+ apporte un atome H)
    const HG = atomes(T, 'g').H || 0, HD = atomes(T, 'd').H || 0;
    if (HG !== HD) {
      const c = HG > HD ? 'd' : 'g', k = Math.abs(HG - HD);
      const tout = ajouter('h', HP, c, k);
      textes.push(`Il y a ${HG} atome${s(HG)} H à gauche et ${HD} à droite : il manque ${k} atome${s(k)} H ${cote(c)}, on ajoute ${k}&nbsp;H<sup>+</sup> ${cote(c)}${tout}.`);
    } else textes.push(HG ? `H est déjà équilibré (${HG} atome${s(HG)} de chaque côté) : pas besoin d'ions H<sup>+</sup>.` : 'Il n\'y a pas d\'atome H : pas besoin d\'ions H<sup>+</sup>.');
    etapes.push(copie());
    // 4. charges avec e− (un électron fait baisser la charge de 1)
    const G0 = charges(T, 'g'), D0 = charges(T, 'd'), n = G0 - D0;
    const c = n > 0 ? 'g' : 'd';
    ajouter('e', E, c, Math.abs(n));
    textes.push(c === 'g'
      ? `Sans les électrons, la charge totale vaut ${fq(G0)} à gauche et ${fq(D0)} à droite. Avec ${n}&nbsp;e<sup>−</sup> à gauche, la charge de gauche devient ${fq(G0)} − ${n} = ${fq(D0)}.`
      : `Sans les électrons, la charge totale vaut ${fq(G0)} à gauche et ${fq(D0)} à droite. Avec ${-n}&nbsp;e<sup>−</sup> à droite, la charge de droite devient ${fq(D0)} − ${-n} = ${fq(G0)}.`);
    etapes.push(copie());
    return { etapes, textes, html: ecrire(T) };
  }

  /* ============================================================
     L'OUTIL
     ============================================================ */
  function outil(zone, opts) {
    const cp = opts.couple, ref = solution(cp);
    const nOx = html(cp.ox), nRed = html(cp.red);
    let T, etape, erreurs, vues, codes, aides = false;

    zone.innerHTML = `<div class="ox-outil">
        <div class="ox-haut">
          <div class="ox-palette">
            <div class="ox-couple"><p class="ox-etiq">Couple</p><div class="ox-couple-l"></div></div>
            <div class="ox-reserve"><p class="ox-etiq">Réserve</p><div class="ox-reserve-l"></div></div>
          </div>
          <div class="ox-demi"><p class="ox-etiq">Demi-équation</p>
            <div class="ox-eq">
              <div class="ox-membre" data-cote="g" role="group" aria-label="Membre de gauche"></div>
              <span class="ox-egal" aria-hidden="true">=</span>
              <div class="ox-membre" data-cote="d" role="group" aria-label="Membre de droite"></div>
            </div>
            <div class="ox-aides hidden" aria-live="polite"></div>
          </div>
        </div>
        <ol class="ox-etapes"></ol>
        <p class="ox-consigne"></p>
        <div class="er-actions ox-actions">
          <button type="button" class="btn-primary ox-valider">Valider l'étape</button>
          <button type="button" class="btn-small ox-b-aides" aria-expanded="false">Afficher les aides</button>
          <button type="button" class="btn-small ox-b-montrer hidden">Afficher la réponse de l'étape</button>
          <button type="button" class="btn-small ox-b-zero">Recommencer</button>
        </div>
        <div class="ox-retour"></div>
      </div>`;
    const $ = sel => zone.querySelector(sel);
    const racine = $('.ox-outil');

    /* ---------- Comptes sur la demi-équation de l'élève ---------- */
    const nb = (c, el) => atomes(T, c)[el] || 0;
    // nombre d'espèces f ajoutées d'un côté (sans celles du couple : H2O de H2O2 / H2O, H+ de H+ / H2)
    const ajoutes = (f, c) => T.filter(t => t.f === f && t.cote === c).reduce((x, t) => x + t.coef - t.base, 0);
    const molecules = (f, c) => T.filter(t => t.f === f && t.cote === c).reduce((x, t) => x + t.coef, 0);
    const role = r => T.find(t => t.role === r);

    /* ---------- Affichage ---------- */
    // nombre réglable : espèces du couple à l'étape 1, puis H2O, H+, e− à leur étape
    const reglable = t => (etape === 0 ? estCouple(t) : etape <= 3 && t.f === F_ETAPE[etape]);
    // espèce que l'on peut déplacer ou retirer (glisser hors de la demi-équation)
    const deplacable = t => (etape === 0 ? estCouple(t) : etape <= 3 && t.role === ROLE_ETAPE[etape]);

    function jeton(f) {
      const j = document.createElement('span');
      j.className = 'ox-jeton';
      j.innerHTML = `<span>${html(f)}</span>`;                    // (exposants et indices hors du flex)
      return j;
    }
    // élément à glisser : src = { role, f } (couple, réserve) ou { terme } (déjà placé)
    function mobile(el, src) {
      el.classList.add('ox-mobile');
      el.setAttribute('aria-label', 'Glisser ' + texte(html(src.f || src.terme.f)));
      DragDrop.enable(el, { zoneSelector: '.ox-membre', dragOverClass: 'ox-survol', onDrop: (it, z) => deposer(src, z) });
    }
    function terme(t) {
      const b = document.createElement('div');
      b.className = 'ox-terme';
      if (etape > 3) {
        // demi-équation terminée : nombres écrits, 1 n'est pas écrit
        b.innerHTML = `${t.coef > 1 ? `<span class="er-coef-fixe">${t.coef}</span>` : ''}<span class="ox-f">${html(t.f)}</span>`;
        return b;
      }
      const sel = selecteur({
        valeur: t.coef, min: Math.max(1, t.base), max: MAX, label: 'le nombre devant ' + texte(html(t.f)),
        onChange: v => { t.coef = v; majAides(); },
      });
      if (!reglable(t)) sel.activer(false);
      b.appendChild(sel.el);
      const f = document.createElement('span');
      f.className = 'ox-f';
      f.innerHTML = html(t.f);
      if (deplacable(t)) mobile(f, { terme: t });
      b.appendChild(f);
      return b;
    }
    function rendre() {
      const fini = etape > 3;
      racine.classList.toggle('ox-fini', fini);
      // couple : chaque espèce se glisse dans la demi-équation (étape 1)
      const lc = $('.ox-couple-l');
      lc.innerHTML = '';
      ['ox', 'red'].forEach((r, i) => {
        if (i) lc.insertAdjacentHTML('beforeend', '<span class="ox-barre" aria-hidden="true">/</span>');
        const j = jeton(cp[r]);
        if (role(r)) j.classList.add('ox-pris');
        else if (etape === 0) mobile(j, { role: r, f: cp[r] });
        lc.appendChild(j);
      });
      // membres de gauche et de droite
      ['g', 'd'].forEach(c => {
        const m = $(`.ox-membre[data-cote="${c}"]`);
        m.innerHTML = '';
        const L = trier(T.filter(t => t.cote === c));
        if (!L.length) m.innerHTML = '<span class="ox-vide">Glisse ici</span>';
        L.forEach((t, k) => {
          if (k) m.insertAdjacentHTML('beforeend', '<span class="ox-plus" aria-hidden="true">+</span>');
          m.appendChild(terme(t));
        });
      });
      // réserve : H2O, H+ puis e−, chacun à son étape
      const lr = $('.ox-reserve-l');
      lr.innerHTML = '';
      RESERVE.forEach(r => {
        const j = jeton(r.f);
        if (r.etape === etape) mobile(j, r); else j.classList.add('ox-off');
        lr.appendChild(j);
      });
      // étapes de la méthode
      $('.ox-etapes').innerHTML = ETAPES.map((e, k) => {
        const cls = k < etape ? 'ox-fait' : k === etape ? 'ox-encours' : '';
        return `<li class="${cls}"${k === etape ? ' aria-current="step"' : ''}><span class="ox-pastille">${k < etape ? '✓' : k + 1}</span><span>${e.titre}</span></li>`;
      }).join('');
      $('.ox-consigne').innerHTML = fini ? '' : `<b>Étape ${etape + 1}.</b> ${ETAPES[etape].consigne}`;
      $('.ox-consigne').classList.toggle('hidden', fini);
      $('.ox-valider').classList.toggle('hidden', fini);
      $('.ox-b-montrer').classList.toggle('hidden', fini || !erreurs[etape]);
      majAides();
    }

    /* ---------- Aides : atomes et charges de chaque côté ---------- */
    function majAides() {
      const box = $('.ox-aides'), b = $('.ox-b-aides');
      box.classList.toggle('hidden', !aides);
      b.textContent = aides ? 'Masquer les aides' : 'Afficher les aides';
      b.setAttribute('aria-expanded', String(aides));
      if (!aides) return;
      const els = autres(cp);
      ['O', 'H'].forEach(el => { if (nb('g', el) || nb('d', el)) els.push(el); });
      const ligne = (nom, g, d, ag, ad) => `<tr class="${g === d ? 'ox-eg' : ''}"><th scope="row">${nom}</th><td>${ag}</td>` +
        `<td class="ox-signe" aria-label="${g === d ? 'égal' : 'différent'}">${g === d ? '=' : '≠'}</td><td>${ad}</td></tr>`;
      // détail de la charge totale : (−1) + 8 × (+1)
      const detail = c => {
        const L = trier(T.filter(t => t.cote === c && q(t.f)));
        if (!L.length || (L.length === 1 && L[0].coef === 1)) return '';
        return `<small>${L.map(t => (t.coef > 1 ? `${t.coef} × (${fq(q(t.f))})` : `(${fq(q(t.f))})`)).join(' + ')}</small>`;
      };
      const qG = charges(T, 'g'), qD = charges(T, 'd');
      box.innerHTML = `<table class="ox-bilan"><thead><tr><th></th><th scope="col">À gauche</th><th></th><th scope="col">À droite</th></tr></thead><tbody>` +
        els.map(el => { const g = nb('g', el), d = nb('d', el); return ligne(el, g, d, `<b>${g}</b>`, `<b>${d}</b>`); }).join('') +
        ligne('Charge', qG, qD, `<b>${fq(qG)}</b>${detail('g')}`, `<b>${fq(qD)}</b>${detail('d')}`) +
        '</tbody></table>';
    }

    /* ---------- Glisser-déposer ---------- */
    function deposer(src, z) {
      const c = z && zone.contains(z) ? z.dataset.cote : null;
      if (src.terme) {
        const t = src.terme;
        if (!c) T.splice(T.indexOf(t), 1);                              // glissé hors de la demi-équation : retiré
        else if (c !== t.cote) {
          const u = T.find(x => x !== t && x.f === t.f && x.cote === c);
          if (u && !estCouple(t)) { u.coef = Math.min(MAX, u.coef + t.coef); T.splice(T.indexOf(t), 1); }
          else t.cote = c;
        }
      } else if (c) {
        const u = !estCouple(src) && T.find(x => x.f === src.f && x.cote === c);
        if (u) u.coef = Math.min(MAX, u.coef + 1);                     // déjà présente de ce côté : une de plus
        else T.push({ role: src.role, f: src.f, cote: c, coef: 1, base: 0 });
      }
      rendre();
    }

    /* ============================================================
       VÉRIFICATION DE CHAQUE ÉTAPE
       renvoie { ok } ou { code, msg } (erreur) ou { format, msg } (rien à juger)
       ============================================================ */
    // 1. placement de l'oxydant et du réducteur, éléments autres que O et H
    function v1() {
      const ox = role('ox'), red = role('red');
      if (!ox || !red) return { format: true, msg: `Glisse l'oxydant et le réducteur du couple ${nOx} / ${nRed} dans la demi-équation.` };
      if (ox.cote === red.cote) return { code: 'placement', msg: `L'oxydant et le réducteur ne vont pas du même côté du signe = : l'oxydant ${nOx} à gauche, le réducteur ${nRed} à droite.` };
      if (ox.cote === 'd') return { code: 'placement', msg: `Tu as inversé l'oxydant et le réducteur. On écrit l'oxydant à gauche du signe = et le réducteur à droite : Ox + n e<sup>−</sup> = Red. Dans le couple ${nOx} / ${nRed}, l'oxydant est écrit en premier.` };
      const els = autres(cp);
      if (!els.length) {
        if (ox.coef !== 1 || red.coef !== 1) return { code: 'elements', msg: 'Dans ce couple, il n\'y a pas d\'autre élément que O et H : il n\'y a rien à équilibrer à cette étape. Laisse 1 devant chaque espèce.' };
        return { ok: true };
      }
      for (const X of els) {
        const g = nb('g', X), d = nb('d', X);
        if (g === d) continue;
        const a = compo(cp.ox)[X] || 0, b = compo(cp.red)[X] || 0;
        // l'indice recopié devant l'espèce qui le porte : 2 Cr2O7^2- = Cr^3+
        if (a > 1 && ox.coef === a && red.coef === 1) return { code: 'indice', msg: `Il y a ${g} atomes ${X} à gauche et ${d} à droite. Le ${a} de ${nOx} est un indice : une seule entité ${nOx} contient déjà ${a} atomes ${X}. Ce n'est pas devant ${nOx} qu'il faut un nombre.` };
        if (b > 1 && red.coef === b && ox.coef === 1) return { code: 'indice', msg: `Il y a ${g} atome${s(g)} ${X} à gauche et ${d} à droite. Le ${b} de ${nRed} est un indice : une seule entité ${nRed} contient déjà ${b} atomes ${X}. Ce n'est pas devant ${nRed} qu'il faut un nombre.` };
        return { code: 'elements', msg: `Il y a ${g} atome${s(g)} ${X} à gauche et ${d} à droite : règle les nombres devant ${nOx} et ${nRed} avec les flèches pour en avoir autant des deux côtés.` };
      }
      const k = pgcd(ox.coef, red.coef);
      if (k > 1) return { code: 'simplifier', msg: `${els.join(', ')} est bien équilibré, mais il faut les plus petits nombres possibles : ${ox.coef} et ${red.coef} se divisent tous les deux par ${k}.` };
      return { ok: true };
    }

    // 2. et 3. : un élément (O ou H) équilibré avec une espèce de la réserve (H2O ou H+)
    // qui apporte un atome de cet élément
    function vElement(el, f, code, nom) {
      const G = nb('g', el), D = nb('d', el), aG = ajoutes(f, 'g'), aD = ajoutes(f, 'd');
      const G0 = G - aG, D0 = D - aD;                           // sans les espèces ajoutées
      if (aG > 0 && aD > 0) return { code, msg: `Tu as ajouté ${nom} des deux côtés du signe =. Il n'en faut que d'un seul côté : celui où il manque des atomes ${el}.` };
      if (G === D) return { ok: true };
      if (G0 === D0) return { code, msg: `L'élément ${el} était déjà équilibré (${G0} atome${s(G0)} de chaque côté) : il ne faut pas ${nom} ici. Retire ${html(f)} : fais-le glisser hors de la demi-équation.` };
      const m = G0 < D0 ? 'g' : 'd', a = m === 'g' ? aG : aD, ecart = Math.abs(G0 - D0);
      if (!aG && !aD) return { code, msg: `Il y a ${G} atome${s(G)} ${el} à gauche et ${D} à droite : ajoute ${nom} du côté où il en manque.` };
      if (!a) return { code: code + '-cote', msg: `Tu as mis ${html(f)} ${cote(autre(m))}, où il y a déjà le plus d'atomes ${el} (${Math.max(G0, D0)} contre ${Math.min(G0, D0)}). Il faut l'ajouter ${cote(m)}, là où il en manque.` };
      // H : chaque molécule d'eau de l'autre côté comptée pour un seul atome H
      const w = el === 'H' ? molecules(EAU, autre(m)) : 0;
      if (w && a === ecart - w) return { code: 'h-eau', msg: `Chaque molécule H<sub>2</sub>O contient 2 atomes H : ${w}&nbsp;H<sub>2</sub>O, c'est ${w} × 2 = ${2 * w} atomes H.` };
      if (a < ecart) return { code, msg: `Il y a ${G} atome${s(G)} ${el} à gauche et ${D} à droite : il en manque encore ${cote(m)}. Chaque ${html(f)} apporte un seul atome ${el}.` };
      return { code, msg: `Il y a maintenant trop d'atomes ${el} ${cote(m)} : ${m === 'g' ? G : D} contre ${m === 'g' ? D : G} ${cote(autre(m))}. Chaque ${html(f)} apporte un seul atome ${el}.` };
    }
    const v2 = () => vElement('O', EAU, 'eau', 'des molécules d\'eau H<sub>2</sub>O');
    const v3 = () => vElement('H', HP, 'h', 'des ions H<sup>+</sup>');

    // 4. charges avec les électrons
    function v4() {
      const qG = charges(T, 'g'), qD = charges(T, 'd'), eG = ajoutes(E, 'g'), eD = ajoutes(E, 'd');
      const G0 = qG + eG, D0 = qD + eD;                          // charges sans les électrons
      const n = G0 - D0;                                           // électrons attendus (à gauche)
      // à partir de la 2e erreur, on donne les charges de chaque côté
      const rappel = erreurs[3] ? ` Sans les électrons, la charge totale vaut ${fq(G0)} à gauche et ${fq(D0)} à droite.` : '';
      if (eG && eD) return { code: 'e-deux', msg: 'Tu as mis des électrons des deux côtés du signe = : il n\'en faut que d\'un seul côté.' };
      if (qG === qD) return { ok: true };
      if (!eG && !eD) return { code: 'e-oubli', msg: 'Les charges ne sont pas égales des deux côtés : ajoute des électrons e<sup>−</sup>.' + rappel };
      if (eD) {
        if (eD === n) return { code: 'e-signe', msg: 'Tu as fait comme si un électron portait une charge +1. Il porte une charge <b>−1</b> : des électrons à droite font baisser la charge de droite, l\'écart entre les deux côtés augmente. Les électrons se placent du côté de l\'oxydant : Ox + n e<sup>−</sup> = Red.' + rappel };
        return { code: 'e-cote', msg: 'Les électrons se placent du côté de l\'oxydant, à gauche : Ox + n e<sup>−</sup> = Red. C\'est l\'oxydant qui capte les électrons.' + rappel };
      }
      // électrons à gauche, mauvais nombre : quelle erreur de calcul de la charge ?
      const d = diagCharge(eG, G0, D0);
      if (d) return d;
      return { code: 'e-nombre', msg: erreurs[3]
        ? `Sans les électrons, la charge totale vaut ${fq(G0)} à gauche et ${fq(D0)} à droite. Avec ${eG}&nbsp;e<sup>−</sup> à gauche, la charge de gauche devient ${fq(G0)} − ${eG} = ${fq(G0 - eG)} : elle doit être égale à ${fq(D0)}.`
        : 'Ce n\'est pas le bon nombre d\'électrons. Calcule la charge totale de chaque côté, sans les électrons : chaque e<sup>−</sup> ajouté à gauche fait baisser la charge de gauche de 1.' };
    }
    // k électrons à gauche au lieu de G0 − D0 : on cherche l'erreur de calcul qui donne k
    // (un seul diagnostic possible, sinon message général)
    function diagCharge(k, G0, D0) {
      const L = T.filter(t => t.f !== E && q(t.f));             // espèces chargées
      const somme = fn => L.reduce((x, t) => x + (t.cote === 'g' ? 1 : -1) * fn(t), 0);
      const pistes = [];
      const neg = L.find(t => q(t.f) < 0);
      if (neg && k === Math.abs(somme(t => t.coef * Math.abs(q(t.f))))) {
        const v = neg.coef * q(neg.f);
        pistes.push({ code: 'charge-signe', msg: `Attention au signe : ${kf(neg.coef, neg.f)} porte une charge négative. Dans la charge totale, elle compte ${fq(v)}, pas ${fq(-v)}.` });
      }
      const multi = L.find(t => t.coef > 1);
      if (multi && k === Math.abs(somme(t => q(t.f)))) {
        pistes.push({ code: 'charge-coef', msg: `N'oublie pas de multiplier la charge d'un ion par son nombre stœchiométrique : ${kf(multi.coef, multi.f)}, c'est ${multi.coef} × (${fq(q(multi.f))}) = ${fq(multi.coef * q(multi.f))}.` });
      }
      if (D0 && k === Math.abs(G0 + D0)) pistes.push({ code: 'charge-somme', msg: `Tu as additionné les charges des deux côtés (${fq(G0)} et ${fq(D0)}). Les électrons doivent faire passer la charge de gauche de ${fq(G0)} à ${fq(D0)} : de combien doit-elle baisser ?` });
      if (D0 && k === Math.abs(G0)) pistes.push({ code: 'charge-seul', msg: `Tu as fait comme si la charge de gauche devait arriver à 0. Elle doit devenir égale à la charge de droite, ${fq(D0)}.` });
      return pistes.length === 1 ? pistes[0] : null;
    }

    /* ---------- Valider, réussir, montrer ---------- */
    function retour(h) {
      const r = $('.ox-retour');
      r.innerHTML = h;
      if (h) setTimeout(() => r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function valider() {
      if (etape > 3) return;
      const v = [v1, v2, v3, v4][etape]();
      if (v.format) { retour(`<div class="callout er-retour"><p>${v.msg}</p></div>`); return; }
      if (!v.ok) {
        erreurs[etape]++;
        codes.push(v.code);
        if (opts.onErreur) opts.onErreur(v.code);
        retour(`<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${v.msg}</p></div>`);
        $('.ox-b-montrer').classList.remove('hidden');
        return;
      }
      reussir(false);
    }
    function reussir(vue) {
      const k = etape;
      if (k === 0) T.forEach(t => { if (estCouple(t)) t.base = t.coef; });   // nombres du couple fixés
      vues[k] = vue;
      etape++;
      const titre = vue ? 'Réponse' : erreurs[k] ? 'C\'est juste.' : 'Juste !';
      let h = `<p><b class="${vue ? '' : 'er-ok'}">${titre}</b> ${ref.textes[k]}</p>`;
      if (etape > 3) {
        h += `<div class="ox-final">${ecrire(T)}</div>
          <p>Autant d'atomes de chaque élément et la même charge (${fq(charges(T, 'g'))}) de chaque côté : la demi-équation est équilibrée.</p>`;
      }
      retour(`<div class="${vue ? 'callout' : 'callout-success'} er-retour">${h}</div>`);
      rendre();
      if (etape > 3 && opts.onFini) {
        opts.onFini({ erreurs: erreurs.reduce((a, b) => a + b, 0), vues: vues.filter(Boolean).length, codes: codes.slice(), html: ecrire(T) });
      }
    }
    // réponse de l'étape en cours (les étapes déjà faites sont justes)
    function montrerEtape() {
      const b0 = r => ref.etapes[0].find(t => t.role === r).coef;
      T = ref.etapes[etape].map(t => Object.assign({}, t, { base: estCouple(t) && etape > 0 ? b0(t.role) : 0 }));
      reussir(true);
    }
    function reprendre() {
      T = []; etape = 0; erreurs = [0, 0, 0, 0]; vues = [false, false, false, false]; codes = [];
      retour('');
      rendre();
    }

    $('.ox-valider').onclick = valider;
    $('.ox-b-montrer').onclick = () => { if (etape <= 3) montrerEtape(); };
    $('.ox-b-zero').onclick = reprendre;
    $('.ox-b-aides').onclick = () => {
      aides = !aides;
      majAides();
      if (aides) $('.ox-aides').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    reprendre();
    return {
      reprendre,
      // toute la réponse (« Afficher la réponse » d'un cours)
      montrer() { while (etape <= 3) montrerEtape(); },
    };
  }

  window.DEMI = { outil, solution, ecrire, DIFFICULTES };
})();
