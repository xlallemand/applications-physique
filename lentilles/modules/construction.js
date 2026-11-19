/* ============================================================
   Module 2 : construire l'image A′B′ (série notée sur 20)
   LT.questionsSerie() → 10 questions (fabriques : nouvelles valeurs à chaque appel)

   Construction (objet réel au-delà de 2f′, images réelles seulement) :
     [v] distance focale à partir de la vergence (lentille en δ) ;
     (a) tracer au moins deux rayons issus de B (un troisième est accepté) ;
     (b) placer B′ à l'intersection des rayons émergents (tolérance ½ carreau) ;
     (c) placer A′ sur l'axe, à la verticale de B′ ; la flèche A′B′ se dessine ;
     (d) lire OA′ et A′B′ (avec l'échelle), donner le sens de l'image ;
     (e) calculer γ = A′B′ / AB ou γ = OA′ / OA.
   À rebours : l'image A′B′ est donnée, retrouver l'objet AB.
   Calcul : grandissement à partir des tailles ou des distances (sans figure).
   Les valeurs sont choisies pour que B′ tombe sur un nœud ou un demi-nœud du quadrillage.
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, fmt = LT.fmt, hasard = LT.hasard, T = LT.TYPES, TR = LT.TYPES_REBOURS;

  // configurations (carreaux) : f, OA, tailles d'objet possibles → OA′ et A′B′ multiples de ½ carreau
  const CONFIGS = [
    { f: 2, OA: 6, AB: [2, 3, 4] }, { f: 2, OA: 4, AB: [1.5, 2, 2.5, 3] },
    { f: 3, OA: 6, AB: [1.5, 2, 2.5, 3] }, { f: 3, OA: 7.5, AB: [1.5, 3] }, { f: 3, OA: 9, AB: [2, 3, 4] }, { f: 3, OA: 12, AB: [3] },
    { f: 4, OA: 8, AB: [1.5, 2, 2.5] }, { f: 4, OA: 12, AB: [2, 3, 4] },
  ];
  const VERGENCES = { 2: 50, 4: 25, 5: 20 };
  const CONFIGS_V = [
    { f: 2, OA: 6, AB: [2, 3, 4] }, { f: 2, OA: 4, AB: [1.5, 2, 2.5] },
    { f: 4, OA: 8, AB: [1.5, 2, 2.5] }, { f: 4, OA: 12, AB: [2, 3, 4] }, { f: 5, OA: 10, AB: [1.5, 2, 2.5] },
  ];
  // 1 carreau ↔ 2 cm : f′ = 4 cm ou 6 cm
  const CONFIGS_E = [{ f: 2, OA: 6, AB: [2, 4] }, { f: 3, OA: 9, AB: [2, 4] }, { f: 3, OA: 6, AB: [1.5, 2, 2.5] }, { f: 2, OA: 4, AB: [1.5, 2] }];

  const cm = v => fmt(v) + ' cm';
  const egal = (a, b, t) => Math.abs(a - b) <= (t || 1e-9);

  /* ============================================================
     Géométrie d'une question
     ============================================================ */
  function donnees(c, h, ech) {
    const xi = OPT.conjuguer(-c.OA, c.f);           // OA′ (carreaux)
    const hi = -h * xi / c.OA;                     // ordonnée de B′
    const g = xi / c.OA;                           // grandissement (en valeur absolue)
    return {
      f: c.f, OA: c.OA, h, xi, hi, g, ech,
      A: [-c.OA, 0], B: [-c.OA, h], Ai: [xi, 0], Bi: [xi, hi],
      cadre: { xmin: -Math.ceil(c.OA + 1.5), xmax: Math.ceil(Math.max(xi, c.f) + 2.5), ymax: Math.max(3.5, Math.max(Math.abs(h), Math.abs(hi)) + 1.5) },
    };
  }
  // nom d'un point sur la figure (au-delà de la pointe de la flèche, ou de l'autre côté de l'axe)
  const decalPointe = y => (y >= 0 ? 0.45 : -0.45);
  const decalPied = y => (y >= 0 ? -0.55 : 0.55);

  /* ---------- Figure de la question ---------- */
  function figure(ctx, zone, o) {
    const d = ctx.d;
    const F = LT.figure(zone, Object.assign({ f: d.f, foyers: !o.vergence, aria: o.aria }, d.cadre));
    ctx.F = F;
    LT.sensLumiere(F);
    if (o.rebours) {
      F.fleche('textes', d.Ai, d.Bi, 'opt-image');
      nommer(F, d.Ai, 'A′', decalPied(d.hi), 0.4);
      nommer(F, d.Bi, 'B′', decalPointe(d.hi), 0.45);
    } else {
      F.fleche('textes', d.A, d.B, 'opt-objet');
      nommer(F, d.A, 'A', decalPied(d.h), -0.4);
      nommer(F, d.B, 'B', decalPointe(d.h), -0.4);
    }
    const ech = zone.appendChild(LT.el('p', 'lt-echelle', d.ech === 1 ? 'Quadrillage : 1 carreau = 1 cm.' : `Échelle : 1 carreau ↔ ${d.ech} cm.`));
    ech.setAttribute('aria-hidden', 'false');
    return F;
  }
  function nommer(F, p, nom, dy, dx) { F.S.texte('textes', F.c([p[0] + (dx || 0), p[1] + dy]), nom, { cls: 'opt-nom-pt' }); }
  // foyers dessinés après le calcul de f′ (lentille donnée par sa vergence)
  function dessinerFoyers(F) {
    [-1, 1].forEach(s => {
      F.S.ligne('deco', F.c([s * F.f, -0.25]), F.c([s * F.f, 0.25]), 'opt-foyer');
      F.S.texte('deco', F.c([s * F.f, -0.67]), s > 0 ? 'F′' : 'F', { cls: 'opt-nom-pt' });
    });
  }

  /* ============================================================
     Parties de la construction
     ============================================================ */
  // [v] distance focale à partir de la vergence
  function partieVergence(ctx, v) {
    const fcm = 100 / v;
    return {
      type: 'nombre', q: `La lentille a une vergence v = ${fmt(v)} δ. Calcule sa distance focale f′ en centimètres (f′ = 1 / v, en mètres).`,
      label: 'f′ =', unite: 'cm', calc: true, aria: 'Distance focale en centimètres',
      verifier: x => egal(x, fcm, 1e-6) ? { ok: true }
        : egal(x, fcm / 100, 1e-9) ? { diag: `f′ = 1 / v est en <b>mètres</b> : ${fmt(fcm / 100)} m = ${fmt(fcm)} cm.` }
        : egal(x, v, 1e-9) ? { diag: 'f′ = 1 / v : divise 1 par la vergence.' }
        : egal(x, fcm * 10, 1e-6) || egal(x, fcm / 10, 1e-6) ? { diag: '1 m = 100 cm : pour passer des mètres aux centimètres, multiplie par 100.' }
        : { diag: 'f′ = 1 / v donne f′ en mètres ; convertis ensuite en centimètres (× 100).' },
      remplir: i => { i.value = fmt(fcm); },
      solution: () => { dessinerFoyers(ctx.F); return `${LT.vergence(v)}. Les foyers F et F′ sont maintenant placés.`; },
    };
  }

  // (a) rayons issus de B (ou, à rebours, rayons qui arrivent en B′)
  function partieRayons(ctx, rebours) {
    const types = rebours ? TR : T;
    return {
      type: 'perso',
      q: rebours ? 'Trace au moins <b>deux rayons qui arrivent en B′</b> : choisis un rayon, puis trace le rayon incident qui lui correspond.'
        : 'Trace au moins <b>deux rayons issus de B</b> : choisis un rayon, puis trace le rayon qui sort de la lentille.',
      monter(zone, api) {
        const F = ctx.F, d = ctx.d, faits = [];
        zone.innerHTML = `<p class="lt-aide-t">${rebours ? 'Touche un bouton, ou touche directement sur la figure le point par où passe le rayon (O, F′, ou la lentille à la hauteur de B′).' : 'Touche un bouton, ou touche directement sur la figure le point par où passe le rayon (O, F, ou la lentille à la hauteur de B).'}</p>
          <div class="lt-choix-rayon" data-a="choix">${['parallele', 'centre', 'foyer'].map(t => `<button type="button" class="btn-secondary" data-t="${t}">Rayon ${types[t].court}</button>`).join('')}</div>
          <div data-a="trace"></div><div data-a="local" aria-live="polite"></div>`;
        const $ch = zone.querySelector('[data-a="choix"]'), $tr = zone.querySelector('[data-a="trace"]'), $loc = zone.querySelector('[data-a="local"]');
        let enCours = null, cibles = [], tr = null, reussi = false;
        // rayon complet (incident + émergent) dessiné sur la figure
        function dessiner(t) {
          if (rebours) {
            const r = LT.rebours(d.f, d.Bi, t);
            F.rayon('rayons', F.bord(r.I, V.mul(r.d, -1)), r.I);
            F.rayon('rayons', r.I, F.bord(r.I, r.e));
          } else {
            const r = LT.particulier(d.f, d.B, t);
            F.rayon('rayons', d.B, r.I);
            F.rayon('rayons', r.I, F.bord(r.I, r.e));
          }
        }
        function poserCibles() {
          retirerCibles();
          const pts = rebours ? { centre: [0, 0], foyer: [d.f, 0], parallele: [0, d.hi] } : { centre: [0, 0], foyer: [-d.f, 0], parallele: [0, d.h] };
          if (!ctx.foyersVus && !rebours) delete pts.foyer;
          Object.keys(pts).forEach(t => { if (!faits.includes(t)) cibles.push(OPT.cible(F.S, F.c(pts[t]), () => choisir(t))); });
        }
        function retirerCibles() { cibles.forEach(c => c.retirer()); cibles = []; }
        function boutons(actifs) { $ch.querySelectorAll('button').forEach(b => { b.disabled = !actifs || faits.includes(b.dataset.t); }); }
        function choisir(t) {
          if (enCours) return;
          if (faits.includes(t)) { $loc.innerHTML = '<p class="ph-msg">Ce rayon est déjà tracé : choisis-en un autre.</p>'; return; }
          enCours = t; retirerCibles(); boutons(false); $loc.innerHTML = '';
          const tz = LT.el('div'); $tr.innerHTML = ''; $tr.appendChild(tz);
          // partie déjà tracée du rayon : l'incident (sens direct) ou l'émergent (à rebours)
          const g = OPT.svgEl('g', null, F.S.calque('rayons'));
          let I, juste;
          if (rebours) {
            const r = LT.rebours(d.f, d.Bi, t);
            I = r.I; juste = V.mul(r.d, -1);
            F.rayon(g, r.I, F.bord(r.I, r.e));
          } else {
            const r = LT.particulier(d.f, d.B, t);
            I = r.I; juste = r.e;
            F.rayon(g, d.B, r.I);
          }
          tz.insertAdjacentHTML('beforeend', `<p class="lt-consigne">${rebours ? `Le rayon ${types[t].label} est dessiné à droite de la lentille. Trace le rayon <b>incident</b> qui lui correspond.` : `Le rayon issu de B ${T[t].label} est dessiné jusqu'à la lentille. Trace le rayon <b>qui sort de la lentille</b>.`}</p><div data-a="tr"></div>`);
          tr = LT.tracer(F, tz.querySelector('[data-a="tr"]'), {
            I, sens: rebours ? 'amont' : 'aval', juste,
            diag: () => types[t].diag, diagCote: LT.diagFoyer(d.f, rebours ? 'amont' : 'aval', t, types),
            surJuste() { g.remove(); dessiner(t); finir(t); },
            surErreur(diag) {
              if (reussi) $loc.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${diag}</p></div>`;
              else api.erreur(diag);
            },
          });
          ctx.annuler = () => { if (tr) tr.quitter(); g.remove(); };
          LT.defiler(tz);
        }
        function finir(t) {
          faits.push(t); enCours = null; tr = null; ctx.annuler = null; $tr.innerHTML = '';
          ctx.rayons = faits.slice();
          if (faits.length === 2 && !reussi) {
            reussi = true;
            api.reussi(false, 'Deux rayons suffisent pour trouver ' + (rebours ? 'B.' : 'B′.'));
            $loc.innerHTML = `<p class="lt-aide-t">Tu peux tracer le troisième rayon (facultatif) : il passe aussi par ${rebours ? 'B' : 'B′'}.</p>`;
          } else if (faits.length === 3) { $loc.innerHTML = `<p class="ph-ok">✓ Les trois rayons se croisent au même point.</p>`; $ch.remove(); return; }
          boutons(true); poserCibles();
        }
        $ch.querySelectorAll('button').forEach(b => { b.onclick = () => choisir(b.dataset.t); });
        poserCibles();
        // à la partie suivante : plus de cibles ni de rayon en cours (troisième rayon commencé)
        ctx.nettoyer = () => { retirerCibles(); if (ctx.annuler) ctx.annuler(); ctx.annuler = null; };
        return {
          montrer() {
            if (ctx.annuler) ctx.annuler();
            enCours = null; retirerCibles(); $tr.innerHTML = '';
            ['parallele', 'centre', 'foyer'].filter(t => !faits.includes(t)).slice(0, Math.max(0, 2 - faits.length)).forEach(t => { dessiner(t); faits.push(t); });
            ctx.rayons = faits.slice();
            $ch.remove();
          },
        };
      },
    };
  }

  // (b) placer B′ (ou B à rebours) à l'intersection des rayons
  function partiePoint(ctx, rebours) {
    const nom = rebours ? 'B' : 'B′';
    return {
      type: 'perso', q: `Touche la figure à l'endroit du point <b>${nom}</b>${rebours ? '' : ', image de B'}.`,
      monter(zone, api) {
        if (ctx.nettoyer) ctx.nettoyer();
        const F = ctx.F, d = ctx.d, cible = rebours ? d.B : d.Bi;
        let actif = true;
        zone.innerHTML = `<p class="lt-aide-t">${nom} est le point où les rayons tracés se croisent.</p>`;
        const poser = () => {
          actif = false;
          F.S.cercle('textes', F.c(cible), 4.5, 'opt-pose');
          if (rebours) nommer(F, cible, 'B', decalPointe(cible[1]), -0.4); else nommer(F, cible, 'B′', decalPointe(cible[1]), 0.45);
        };
        OPT.surAppui(F.S.svg, evt => {
          if (!actif) return;
          const p = F.toucher(evt);
          if (V.len(V.sub(p, cible)) <= 0.5) { poser(); api.reussi(); return; }
          // un rayon et l'axe optique ? (tous les rayons tracés coupent l'axe en un point)
          const coupeAxe = (ctx.rayons || []).some(t => {
            const r = rebours ? LT.rebours(d.f, d.Bi, t) : LT.particulier(d.f, d.B, t);
            const dir = rebours ? r.d : r.e;
            if (Math.abs(dir[1]) < 1e-9) return false;
            const x = r.I[0] - r.I[1] * dir[0] / dir[1];
            return Math.abs(p[1]) <= 0.6 && Math.abs(p[0] - x) <= 0.8;
          });
          if (coupeAxe) api.erreur(`${nom} est l'intersection de deux rayons ${rebours ? 'incidents' : 'qui sortent de la lentille'}, pas d'un rayon et de l'axe optique.`);
          else api.erreur(`${nom}, l'image ${rebours ? 'qui donne B′' : 'de B'}, est le point où les rayons ${rebours ? 'incidents' : 'émergents'} se croisent : ${rebours ? 'tous les rayons qui partent de B passent par B′' : 'tout rayon qui part de B passe par B′'}.`);
        });
        return { montrer() { if (actif) poser(); } };
      },
    };
  }

  // (c) placer A′ (ou A) sur l'axe optique, à la verticale de B′ (ou B)
  function partiePied(ctx, rebours) {
    const nom = rebours ? 'A' : 'A′', haut = rebours ? 'B' : 'B′';
    return {
      type: 'perso', q: `Touche l'axe optique à l'endroit du point <b>${nom}</b>${rebours ? '' : ', image de A'}.`,
      monter(zone, api) {
        const F = ctx.F, d = ctx.d, pied = rebours ? d.A : d.Ai, pt = rebours ? d.B : d.Bi;
        let actif = true;
        zone.innerHTML = '';
        const poser = () => {
          actif = false;
          F.S.ligne('arcs', F.c(pt), F.c(pied), 'lt-projection');
          if (rebours) { F.fleche('textes', d.A, d.B, 'opt-objet'); nommer(F, d.A, 'A', decalPied(d.h), -0.4); }
          else { F.fleche('textes', d.Ai, d.Bi, 'opt-image'); nommer(F, d.Ai, 'A′', decalPied(d.hi), 0.45); }
        };
        OPT.surAppui(F.S.svg, evt => {
          if (!actif) return;
          const p = F.toucher(evt);
          if (Math.abs(p[1]) > 0.6) { api.erreur(rebours ? 'A, le pied de l\'objet, est sur l\'axe optique.' : 'A′, l\'image de A, est sur l\'axe optique.'); return; }
          if (Math.abs(p[0] - pied[0]) <= 0.5) { poser(); api.reussi(false, `${nom} est sur l'axe optique, à la verticale de ${haut}.`); return; }
          api.erreur(`${nom} est sur l'axe optique, à la verticale de ${haut} : on projette ${haut} sur l'axe optique.`);
        });
        return { montrer() { if (actif) poser(); } };
      },
    };
  }

  // (d) lire une longueur sur le quadrillage (avec l'échelle)
  function partieLecture(ctx, quoi) {
    const d = ctx.d, ech = d.ech;
    const L = {
      OAi: { nom: 'OA′', val: d.xi, txt: 'la distance de la lentille à l\'image', autre: d.OA, autreNom: 'OA' },
      AiBi: { nom: 'A′B′', val: Math.abs(d.hi), txt: 'la taille de l\'image', autre: Math.abs(d.h), autreNom: 'AB' },
      OA: { nom: 'OA', val: d.OA, txt: 'la distance de la lentille à l\'objet', autre: d.xi, autreNom: 'OA′' },
      AB: { nom: 'AB', val: Math.abs(d.h), txt: 'la taille de l\'objet', autre: Math.abs(d.hi), autreNom: 'A′B′' },
    }[quoi];
    const bon = L.val * ech;
    return {
      type: 'nombre', q: `Lis sur le quadrillage ${L.txt} : <b>${L.nom}</b> en centimètres.`,
      label: `${L.nom} =`, unite: 'cm', aria: `${L.nom} en centimètres`,
      verifier: v => egal(v, bon, 0.2 * ech + 1e-9) ? { ok: true }
        : ech !== 1 && egal(v, L.val, 1e-9) ? { diag: `Tu as compté ${fmt(L.val)} carreaux : avec l'échelle 1 carreau ↔ ${ech} cm, ${L.nom} = ${fmt(L.val)} × ${ech} cm.` }
        : egal(v, L.autre * ech, 1e-9) && !egal(L.autre, L.val, 1e-9) ? { diag: `Ce nombre est ${L.autreNom}. ${L.nom} est ${L.txt}.` }
        : { diag: `Compte les carreaux de ${quoi[0] === 'O' ? `O à ${L.nom.slice(1)}` : `${L.nom.slice(0, L.nom.length / 2)} à ${L.nom.slice(L.nom.length / 2)}`}${ech !== 1 ? `, puis utilise l'échelle (1 carreau ↔ ${ech} cm)` : ' (1 carreau = 1 cm)'}.` },
      remplir: i => { i.value = fmt(bon); },
      solution: `${L.nom} = ${fmt(L.val)} carreau${L.val > 1 ? 'x' : ''}${ech !== 1 ? ` × ${ech} cm` : ''} = ${cm(bon)}.`,
    };
  }

  // (d) sens de l'image
  function partieSens(ctx, rebours) {
    const d = ctx.d, objHaut = d.h > 0;
    const diag = `B est ${objHaut ? 'au-dessus' : 'au-dessous'} de l'axe optique et B′ ${objHaut ? 'au-dessous' : 'au-dessus'} : l'image est à l'envers par rapport à l'objet AB.`;
    return {
      type: 'choix', q: 'Par rapport à l\'objet AB, l\'image A′B′ est :',
      options: [{ id: 'droite', label: 'droite (à l\'endroit)' }, { id: 'renversee', label: 'renversée (à l\'envers)' }], bonne: 'renversee', melanger: false,
      indices: { droite: diag },
      solution: `L'image est <b>renversée</b> : ${objHaut ? 'B est au-dessus de l\'axe, B′ au-dessous' : 'B est au-dessous de l\'axe, B′ au-dessus'}.`,
    };
  }

  // (e) grandissement : par les tailles ou par les distances
  function partieGamma(ctx, par) {
    const d = ctx.d, ech = d.ech;
    const AB = Math.abs(d.h) * ech, AiBi = Math.abs(d.hi) * ech, OA = d.OA * ech, OAi = d.xi * ech, g = d.g;
    const exact = Math.abs(g * 100 - Math.round(g * 100)) < 1e-9;
    const txt = par === 'tailles' ? `γ = A′B′ / AB` : `γ = OA′ / OA`;
    const calcul = par === 'tailles' ? `γ = A′B′ / AB = ${fmt(AiBi)} / ${fmt(AB)}` : `γ = OA′ / OA = ${fmt(OAi)} / ${fmt(OA)}`;
    const autre = par === 'tailles' ? `γ = OA′ / OA = ${fmt(OAi)} / ${fmt(OA)}` : `γ = A′B′ / AB = ${fmt(AiBi)} / ${fmt(AB)}`;
    const gTxt = exact ? fmt(g) : LT.sig(g, 2);
    return {
      type: 'nombre', q: `Calcule le grandissement <b>${txt}</b>${exact ? '' : ' (deux chiffres significatifs)'}.`,
      label: 'γ =', calc: true, aria: 'Grandissement',
      verifier: v => egal(v, g, 0.006) ? { ok: true }
        : egal(v, 1 / g, 0.02 / g) ? { diag: par === 'tailles' ? 'γ = A′B′ / AB : la taille de l\'image divisée par la taille de l\'objet.' : 'γ = OA′ / OA : la distance de l\'image divisée par la distance de l\'objet.' }
        : { diag: `Calcule ${txt} avec les valeurs en centimètres.` },
      remplir: i => { i.value = gTxt; },
      solution: `${calcul} ${exact ? '=' : '≈'} ${gTxt}. On trouve la même valeur avec ${autre}. ${g < 1 - 1e-9 ? 'γ < 1 : l\'image est plus petite que l\'objet.' : g > 1 + 1e-9 ? 'γ > 1 : l\'image est plus grande que l\'objet.' : 'γ = 1 : l\'image a la même taille que l\'objet.'}`,
    };
  }

  /* ============================================================
     Fabriques de questions
     ============================================================ */
  // construction de l'image (o = { configs, ech, vergence, sous, gamma })
  function construire(o) {
    const c = hasard(o.configs), ab = hasard(c.AB), h = o.sous ? -ab : ab, ech = o.ech || 1;
    const ctx = { d: donnees(c, h, ech) };
    const d = ctx.d, v = o.vergence ? VERGENCES[c.f * ech] : null;
    ctx.foyersVus = !v;
    const lentille = v ? `Lentille convergente de <b>vergence v = ${fmt(v)} δ</b>.` : `Lentille convergente de distance focale <b>f′ = ${cm(c.f * ech)}</b>.`;
    const parties = [];
    if (v) { const pv = partieVergence(ctx, v); const sol = pv.solution; pv.solution = () => { ctx.foyersVus = true; return sol(); }; parties.push(pv); }
    parties.push(partieRayons(ctx, false), partiePoint(ctx, false), partiePied(ctx, false),
      partieLecture(ctx, 'OAi'), partieLecture(ctx, 'AiBi'), partieSens(ctx, false), partieGamma(ctx, o.gamma || 'tailles'));
    return {
      ctx, theme: o.theme, consigne: 'Construis l\'image A′B′ de l\'objet AB, puis détermine sa position, sa taille, son sens et le grandissement.',
      enonce: `<div class="lt-donnee"><span>${lentille}</span><span>Objet AB perpendiculaire à l'axe optique : AB = <b>${cm(ab * ech)}</b>, OA = <b>${cm(c.OA * ech)}</b>.</span></div>`,
      figure: z => figure(ctx, z, { vergence: !!v, aria: 'Lentille convergente sur un quadrillage et objet AB : construire son image A′B′' }),
      parties,
      bilan: `A′B′ est ${d.g < 1 - 1e-9 ? 'plus petite que' : d.g > 1 + 1e-9 ? 'plus grande que' : 'de même taille que'} l'objet et renversée ; OA′ = ${cm(d.xi * ech)}, A′B′ = ${cm(Math.abs(d.hi) * ech)}.`,
    };
  }
  // à rebours : l'image est donnée, retrouver l'objet
  function rebours() {
    const c = hasard(CONFIGS.filter(x => x.OA >= 6)), ab = hasard(c.AB), h = Math.random() < 0.5 ? ab : -ab;
    const ctx = { d: donnees(c, h, 1) };
    ctx.foyersVus = true;
    const d = ctx.d;
    return {
      ctx, theme: 'Retrouver l\'objet', consigne: 'On connaît l\'image A′B′ donnée par la lentille. Retrouve l\'objet AB en traçant les rayons à rebours.',
      enonce: `<div class="lt-donnee"><span>Lentille convergente de distance focale <b>f′ = ${cm(c.f)}</b>.</span><span>Image A′B′ : OA′ = <b>${cm(d.xi)}</b>, A′B′ = <b>${cm(Math.abs(d.hi))}</b>.</span></div>`,
      figure: z => figure(ctx, z, { rebours: true, aria: 'Lentille convergente sur un quadrillage et image A′B′ : retrouver l\'objet AB' }),
      parties: [partieRayons(ctx, true), partiePoint(ctx, true), partiePied(ctx, true), partieLecture(ctx, 'OA'), partieLecture(ctx, 'AB'), partieSens(ctx, true)],
      bilan: `L'objet est à OA = ${cm(d.OA)} de la lentille et mesure AB = ${cm(Math.abs(d.h))}.`,
    };
  }
  // grandissement sans figure
  const CALCULS = [
    // tailles connues → γ
    () => {
      const [AB, ABi] = hasard([[2, 1.5], [3, 1.5], [4, 3], [2.5, 1], [2, 3], [1.5, 3]]);
      const g = ABi / AB;
      return { theme: 'Calculer un grandissement', enonce: `<div class="lt-donnee"><span>Un objet AB de taille <b>AB = ${fmt(AB, 1)} cm</b> donne, par une lentille convergente, une image A′B′ de taille <b>A′B′ = ${fmt(ABi, 1)} cm</b>.</span></div>`,
        parties: [{ type: 'nombre', q: 'Calcule le grandissement γ (deux chiffres significatifs).', label: 'γ =', calc: true, aria: 'Grandissement',
          verifier: v => egal(v, g, 0.006) ? { ok: true } : egal(v, 1 / g, 0.02 / g) ? { diag: 'γ = A′B′ / AB : la taille de l\'image divisée par la taille de l\'objet.' } : { diag: 'γ = A′B′ / AB.' },
          remplir: i => { i.value = LT.sig(g, 2); },
          solution: `γ = A′B′ / AB = ${fmt(ABi, 1)} / ${fmt(AB, 1)} = ${LT.sig(g, 2)}. ${g < 1 ? 'γ < 1 : l\'image est plus petite que l\'objet.' : 'γ > 1 : l\'image est plus grande que l\'objet.'}` }],
        bilan: `γ = ${LT.sig(g, 2)}.` };
    },
    // γ connu → taille de l'image
    () => {
      const AB = hasard([2, 3, 4]), g = hasard([0.7, 0.6, 0.8, 1.5, 0.4]);
      const ABi = AB * g;
      return { theme: 'Utiliser le grandissement', enonce: `<div class="lt-donnee"><span>Un objet AB de taille <b>AB = ${fmt(AB, 1)} cm</b> donne une image A′B′ avec un grandissement <b>γ = ${fmt(g, 2)}</b>.</span></div>`,
        parties: [{ type: 'nombre', q: 'Calcule la taille de l\'image A′B′.', label: 'A′B′ =', unite: 'cm', calc: true, aria: 'Taille de l\'image en centimètres',
          verifier: v => egal(v, ABi, 0.011) ? { ok: true } : egal(v, AB / g, 0.02) ? { diag: 'A′B′ = γ × AB : multiplie la taille de l\'objet par γ.' } : { diag: 'γ = A′B′ / AB, donc A′B′ = γ × AB.' },
          remplir: i => { i.value = fmt(ABi, 1); },
          solution: `γ = A′B′ / AB, donc A′B′ = γ × AB = ${fmt(g, 2)} × ${fmt(AB, 1)} = ${fmt(ABi, 1)} cm.` }],
        bilan: `A′B′ = ${fmt(ABi, 1)} cm.` };
    },
    // distances connues → γ, puis taille de l'image
    () => {
      const [f, OA, OAi, AB] = hasard([[3, 8, 4.8, 2], [2, 10, 2.5, 4], [4, 20, 5, 2], [5, 30, 6, 3], [10, 30, 15, 3], [4, 12, 6, 3]]);
      const g = OAi / OA, ABi = g * AB;
      const gT = LT.sig(g, 2);
      return { theme: 'Grandissement et distances', enonce: `<div class="lt-donnee"><span>Lentille convergente de distance focale f′ = ${fmt(f, 1)} cm.</span><span>Objet AB : <b>AB = ${fmt(AB, 1)} cm</b>, <b>OA = ${fmt(OA, 1)} cm</b>. Son image A′B′ est à <b>OA′ = ${fmt(OAi, 1)} cm</b> de la lentille.</span></div>`,
        parties: [
          { type: 'nombre', q: 'Calcule le grandissement γ avec les distances (deux chiffres significatifs).', label: 'γ =', calc: true, aria: 'Grandissement',
            verifier: v => egal(v, g, 0.006) ? { ok: true } : egal(v, 1 / g, 0.02 / g) ? { diag: 'γ = OA′ / OA : la distance de l\'image divisée par la distance de l\'objet.' } : egal(v, f / OA, 0.006) || egal(v, OAi / f, 0.006) ? { diag: 'f′ ne sert pas ici : γ = OA′ / OA.' } : { diag: 'γ = OA′ / OA.' },
            remplir: i => { i.value = gT; }, solution: `γ = OA′ / OA = ${fmt(OAi, 1)} / ${fmt(OA, 1)} = ${gT}.` },
          { type: 'nombre', q: 'Déduis-en la taille de l\'image A′B′.', label: 'A′B′ =', unite: 'cm', calc: true, aria: 'Taille de l\'image en centimètres',
            verifier: v => egal(v, ABi, 0.011) ? { ok: true } : egal(v, AB / g, 0.02) ? { diag: 'A′B′ = γ × AB : multiplie la taille de l\'objet par γ.' } : { diag: 'γ = A′B′ / AB, donc A′B′ = γ × AB.' },
            remplir: i => { i.value = fmt(ABi, 1); }, solution: `A′B′ = γ × AB = ${gT} × ${fmt(AB, 1)} = ${fmt(ABi, 1)} cm.` }],
        bilan: `γ = OA′ / OA = A′B′ / AB = ${gT}.` };
    },
  ];

  /* ---------- Les 10 questions ---------- */
  function questionsSerie() {
    const calc = LT.melanger(CALCULS);
    return [
      construire({ configs: CONFIGS, theme: 'Construire l\'image', gamma: 'tailles' }),
      construire({ configs: CONFIGS, theme: 'Construire l\'image', gamma: 'distances' }),
      construire({ configs: CONFIGS, theme: 'Objet sous l\'axe optique', sous: true, gamma: hasard(['tailles', 'distances']) }),
      construire({ configs: CONFIGS_V, theme: 'Lentille donnée par sa vergence', vergence: true, gamma: 'tailles' }),
      construire({ configs: CONFIGS_V, theme: 'Lentille donnée par sa vergence', vergence: true, sous: Math.random() < 0.5, gamma: 'distances' }),
      construire({ configs: CONFIGS_E, theme: 'Figure à l\'échelle', ech: 2, sous: Math.random() < 0.5, gamma: hasard(['tailles', 'distances']) }),
      rebours(),
      rebours(),
      calc[0](),
      calc[1](),
    ];
  }

  Object.assign(LT, { questionsSerie, CONFIGS, CONFIGS_V, CONFIGS_E, VERGENCES, donnees });
})();
