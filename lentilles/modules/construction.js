/* ============================================================
   Module 1 : construire l'image A′B′ (série notée sur 20)
   LT.questionsSerie() → 10 questions (fabriques : nouvelles valeurs à chaque appel)

   Construction (objet réel au-delà de f′, images réelles seulement) :
     [F] placer les foyers F′ et F sur l'axe optique (distance focale donnée) ;
     (a) tracer au moins deux rayons issus de B (un troisième est accepté) ;
     (b) placer B′ à l'intersection des rayons émergents (tolérance ½ carreau) ;
     (c) placer A′ sur l'axe, à la verticale de B′ ; la flèche A′B′ se dessine ;
     (d) lire OA′ et A′B′ (avec l'échelle), donner le sens de l'image ;
     (e) calculer γ = A′B′ / AB ou γ = OA′ / OA.
   Composition de la série :
     2 constructions à partir de AB (la première question en est une),
     1 construction où l'élève place d'abord F et F′,
     2 constructions à rebours (l'image A′B′ est donnée, retrouver AB),
     3 calculs de grandissement sans figure,
     1 construction suivie d'un calcul : γ, puis A′B′ = γ × AB ou OA′ = γ × OA,
     1 question finale : AB dessiné et γ donné ; rayon par O, A′B′ = γ × AB, placer B′ sur le rayon.
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
  // 1 carreau ↔ 2 cm : f′ = 4 cm ou 6 cm
  const CONFIGS_E = [{ f: 2, OA: 6, AB: [2, 4] }, { f: 3, OA: 9, AB: [2, 4] }, { f: 3, OA: 6, AB: [1.5, 2, 2.5] }, { f: 2, OA: 4, AB: [1.5, 2] }];
  // question finale (γ donné) : grandissement simple (0,5 ; 1 ; 2)
  const CONFIGS_G = [
    { f: 2, OA: 6, AB: [2, 3, 4] }, { f: 3, OA: 9, AB: [2, 3, 4] }, { f: 4, OA: 12, AB: [2, 4] },
    { f: 2, OA: 4, AB: [2, 3] }, { f: 3, OA: 6, AB: [2, 3] }, { f: 2, OA: 3, AB: [1.5, 2] },
  ];

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
    const F = LT.figure(zone, Object.assign({ f: d.f, foyers: !o.sansFoyers, aria: o.aria }, d.cadre));
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
  // un foyer dessiné sur l'axe (s = 1 : F′, s = −1 : F)
  function dessinerFoyer(F, s) {
    F.S.ligne('deco', F.c([s * F.f, -0.25]), F.c([s * F.f, 0.25]), 'opt-foyer');
    F.S.texte('deco', F.c([s * F.f, -0.67]), s > 0 ? 'F′' : 'F', { cls: 'opt-nom-pt' });
  }

  /* ============================================================
     Parties de la construction
     ============================================================ */
  // [F] placer un foyer sur l'axe optique (s = 1 : foyer image F′, s = −1 : foyer objet F)
  function partieFoyer(ctx, s) {
    const nom = s > 0 ? 'F′' : 'F';
    return {
      type: 'perso', q: `Touche l'axe optique à l'endroit du <b>foyer ${s > 0 ? 'image F′' : 'objet F'}</b>.`,
      monter(zone, api) {
        const F = ctx.F, d = ctx.d, x = s * d.f, fcm = d.f * d.ech;
        let actif = true;
        zone.innerHTML = `<p class="lt-aide-t">OF = OF′ = f′ = ${cm(fcm)}${d.ech !== 1 ? `, soit ${fmt(d.f)} carreaux (1 carreau ↔ ${d.ech} cm)` : ' (1 carreau = 1 cm)'}.</p>`;
        const poser = () => { actif = false; dessinerFoyer(F, s); if (s < 0) ctx.foyersVus = true; };
        OPT.surAppui(F.S.svg, evt => {
          if (!actif) return;
          const p = F.toucher(evt);
          if (Math.abs(p[1]) > 0.6) { api.erreur('Les foyers F et F′ sont sur l\'axe optique.'); return; }
          if (Math.abs(p[0] - x) <= 0.4) { poser(); api.reussi(); return; }
          if (Math.abs(p[0] + x) <= 0.4) {
            api.erreur(s > 0 ? 'F′, le foyer image, est après la lentille, du côté où sort la lumière (à droite de O).'
              : 'F, le foyer objet, est avant la lentille, du côté d\'où vient la lumière (à gauche de O).');
            return;
          }
          api.erreur(`${nom} est à la distance f′ = ${cm(fcm)} du centre optique O : compte ${fmt(d.f)} carreaux depuis O, ${s > 0 ? 'vers la droite' : 'vers la gauche'}.`);
        });
        return { montrer() { if (actif) poser(); } };
      },
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

  // (f) déduire du grandissement une taille ou une distance de l'image
  function partieDeduire(ctx, quoi) {
    const d = ctx.d, ech = d.ech, g = d.g;
    const exact = Math.abs(g * 100 - Math.round(g * 100)) < 1e-9;
    const gT = exact ? fmt(g) : LT.sig(g, 2);
    const AB = Math.abs(d.h) * ech, OA = d.OA * ech;
    const L = quoi === 'AiBi'
      ? { nom: 'A′B′', base: 'AB', baseV: AB, val: Math.abs(d.hi) * ech, txt: 'la taille de l\'image', def: 'γ = A′B′ / AB' }
      : { nom: 'OA′', base: 'OA', baseV: OA, val: d.xi * ech, txt: 'la distance de la lentille à l\'image', def: 'γ = OA′ / OA' };
    return {
      type: 'nombre', q: `Utilise le grandissement pour calculer ${L.txt} : <b>${L.nom} = γ × ${L.base}</b>.`,
      label: `${L.nom} =`, unite: 'cm', calc: true, aria: `${L.nom} en centimètres`,
      verifier: v => egal(v, L.val, 0.06 * ech) ? { ok: true }
        : egal(v, L.baseV / g, 0.06 * ech) ? { diag: `${L.def}, donc ${L.nom} = γ × ${L.base} : multiplie ${L.base} par γ.` }
        : { diag: `${L.def}, donc ${L.nom} = γ × ${L.base} = ${gT} × ${fmt(L.baseV)} cm.` },
      remplir: i => { i.value = fmt(L.val); },
      solution: `${L.def}, donc ${L.nom} = γ × ${L.base} = ${gT} × ${cm(L.baseV)} ${exact ? '=' : '≈'} ${cm(L.val)}. C'est bien la valeur qu'on lit sur la figure.`,
    };
  }

  // question finale, (a) : seul le rayon qui passe par O est tracé
  function partieRayonO(ctx) {
    return {
      type: 'perso', q: 'Trace le rayon issu de B qui passe par le <b>centre optique O</b>.',
      monter(zone, api) {
        const F = ctx.F, d = ctx.d, r = LT.particulier(d.f, d.B, 'centre');
        const g = OPT.svgEl('g', null, F.S.calque('rayons'));
        F.rayon(g, d.B, r.I);
        zone.innerHTML = '<p class="lt-consigne">Le rayon issu de B est dessiné jusqu\'au centre optique O. Trace le rayon <b>qui sort de la lentille</b>.</p><div data-a="tr"></div>';
        let fait = false;
        const fini = () => {
          if (fait) return;
          fait = true; g.remove();
          F.rayon('rayons', d.B, r.I); F.rayon('rayons', r.I, F.bord(r.I, r.e));
          ctx.rayons = ['centre'];
        };
        const tr = LT.tracer(F, zone.querySelector('[data-a="tr"]'), {
          I: r.I, sens: 'aval', juste: r.e, diag: () => T.centre.diag,
          surJuste() { fini(); api.reussi(false, T.centre.regle); },
          surErreur(diag) { api.erreur(diag); },
        });
        return { montrer() { tr.quitter(); fini(); } };
      },
    };
  }
  // question finale, (c) : placer B′ sur le rayon, à la distance A′B′ de l'axe, de l'autre côté
  function partiePlacerImage(ctx) {
    return {
      type: 'perso', q: 'Touche la figure à l\'endroit du point <b>B′</b> : il est sur le rayon tracé, à la distance A′B′ de l\'axe optique.',
      monter(zone, api) {
        const F = ctx.F, d = ctx.d, ech = d.ech, hT = cm(Math.abs(d.hi) * ech);
        let actif = true;
        zone.innerHTML = `<p class="lt-aide-t">Tout rayon issu de B passe par B′, et l'image A′B′ mesure ${hT}.</p>`;
        const poser = () => {
          actif = false;
          F.S.cercle('textes', F.c(d.Bi), 4.5, 'opt-pose');
          nommer(F, d.Bi, 'B′', decalPointe(d.hi), 0.45);
          F.S.ligne('arcs', F.c(d.Bi), F.c(d.Ai), 'lt-projection');
          F.fleche('textes', d.Ai, d.Bi, 'opt-image');
          nommer(F, d.Ai, 'A′', decalPied(d.hi), 0.45);
        };
        // distance d'un point au rayon émergent (droite passant par O et B′)
        const auRayon = p => Math.abs(p[0] * d.Bi[1] - p[1] * d.Bi[0]) / V.len(d.Bi);
        OPT.surAppui(F.S.svg, evt => {
          if (!actif) return;
          const p = F.toucher(evt);
          if (V.len(V.sub(p, d.Bi)) <= 0.5) { poser(); api.reussi(false, 'A′ est sur l\'axe optique, à la verticale de B′ : la flèche A′B′ est dessinée.'); return; }
          if (p[0] <= 0.2) { api.erreur('L\'image est donnée par la lentille : B′ est après la lentille, sur le rayon qui en sort.'); return; }
          if (p[1] * d.h > 0) { api.erreur('L\'image donnée par la lentille est renversée : B′ est de l\'autre côté de l\'axe optique que B.'); return; }
          if (auRayon(p) <= 0.5) { api.erreur(`B′ est bien sur ce rayon, mais à la distance A′B′ = ${hT} de l'axe optique${ech !== 1 ? ` (1 carreau ↔ ${ech} cm)` : ''} : compte les carreaux.`); return; }
          api.erreur('B′ est sur le rayon issu de B qui passe par O : tout rayon issu de B passe par B′.');
        });
        return { montrer() { if (actif) poser(); } };
      },
    };
  }

  /* ============================================================
     Fabriques de questions
     ============================================================ */
  // construction de l'image (o = { configs, ech, sous, gamma, foyers: true (l'élève place F et F′),
  //   deduire: 'AiBi' | 'OAi' (une seule lecture, puis γ et calcul de l'autre grandeur) })
  function construire(o) {
    const c = hasard(o.configs), ab = hasard(c.AB), h = o.sous ? -ab : ab, ech = o.ech || 1;
    const ctx = { d: donnees(c, h, ech) };
    const d = ctx.d;
    ctx.foyersVus = !o.foyers;
    const parties = [];
    if (o.foyers) parties.push(partieFoyer(ctx, 1), partieFoyer(ctx, -1));
    parties.push(partieRayons(ctx, false), partiePoint(ctx, false), partiePied(ctx, false));
    let consigne = 'Construis l\'image A′B′ de l\'objet AB, puis détermine sa position, sa taille, son sens et le grandissement.';
    if (o.deduire) {
      // on lit une grandeur, on calcule γ avec elle, puis on calcule l'autre grandeur avec γ
      const lue = o.deduire === 'AiBi' ? 'OAi' : 'AiBi';
      parties.push(partieLecture(ctx, lue), partieGamma(ctx, lue === 'OAi' ? 'distances' : 'tailles'), partieDeduire(ctx, o.deduire));
      consigne = `Construis l'image A′B′ de l'objet AB, lis ${lue === 'OAi' ? 'sa position OA′' : 'sa taille A′B′'}, puis utilise le grandissement pour calculer ${o.deduire === 'AiBi' ? 'sa taille A′B′' : 'sa position OA′'}.`;
    } else {
      parties.push(partieLecture(ctx, 'OAi'), partieLecture(ctx, 'AiBi'), partieSens(ctx, false), partieGamma(ctx, o.gamma || 'tailles'));
    }
    if (o.foyers) consigne = 'Place les foyers F et F′, puis ' + consigne.charAt(0).toLowerCase() + consigne.slice(1);
    return {
      ctx, theme: o.theme, consigne,
      enonce: `<div class="lt-donnee"><span>Lentille convergente de distance focale <b>f′ = ${cm(c.f * ech)}</b>.</span><span>Objet AB perpendiculaire à l'axe optique : AB = <b>${cm(ab * ech)}</b>, OA = <b>${cm(c.OA * ech)}</b>.</span></div>`,
      figure: z => figure(ctx, z, { sansFoyers: !!o.foyers, aria: o.foyers ? 'Lentille convergente sur un quadrillage et objet AB : placer les foyers, puis construire l\'image A′B′' : 'Lentille convergente sur un quadrillage et objet AB : construire son image A′B′' }),
      parties,
      bilan: `A′B′ est ${d.g < 1 - 1e-9 ? 'plus petite que' : d.g > 1 + 1e-9 ? 'plus grande que' : 'de même taille que'} l'objet et renversée ; OA′ = ${cm(d.xi * ech)}, A′B′ = ${cm(Math.abs(d.hi) * ech)}.`,
    };
  }
  // question finale : AB dessiné et γ donné (foyers inconnus)
  function avecGamma() {
    const c = hasard(CONFIGS_G), ab = hasard(c.AB), h = Math.random() < 0.5 ? ab : -ab;
    const ctx = { d: donnees(c, h, 1) };
    const d = ctx.d, ABi = Math.abs(d.hi);
    ctx.foyersVus = false;
    return {
      ctx, theme: 'Construire l\'image avec le grandissement',
      consigne: 'Les foyers de la lentille ne sont pas connus, mais on connaît le grandissement γ. Trace le rayon qui passe par O, calcule la taille de l\'image, puis place l\'image A′B′.',
      enonce: `<div class="lt-donnee"><span>Lentille convergente, foyers inconnus.</span><span>Objet AB : AB = <b>${cm(ab)}</b>, OA = <b>${cm(c.OA)}</b>. Grandissement : <b>γ = ${fmt(d.g)}</b>.</span></div>`,
      figure: z => figure(ctx, z, { sansFoyers: true, aria: 'Lentille convergente sans ses foyers et objet AB : placer l\'image A′B′ à l\'aide du grandissement' }),
      parties: [
        partieRayonO(ctx),
        { type: 'nombre', q: 'Calcule la taille de l\'image : <b>A′B′ = γ × AB</b>.', label: 'A′B′ =', unite: 'cm', calc: true, aria: 'Taille de l\'image en centimètres',
          verifier: v => egal(v, ABi, 0.011) ? { ok: true } : egal(v, ab / d.g, 0.011) ? { diag: 'γ = A′B′ / AB, donc A′B′ = γ × AB : multiplie AB par γ.' } : { diag: `γ = A′B′ / AB, donc A′B′ = γ × AB = ${fmt(d.g)} × ${fmt(ab)} cm.` },
          remplir: i => { i.value = fmt(ABi); }, solution: `A′B′ = γ × AB = ${fmt(d.g)} × ${cm(ab)} = ${cm(ABi)}.` },
        partiePlacerImage(ctx),
        partieLecture(ctx, 'OAi'),
      ],
      bilan: `B′ est sur le rayon qui passe par O, à ${cm(ABi)} de l'axe optique, de l'autre côté que B (image renversée) ; OA′ = ${cm(d.xi)}.`,
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
  // la première est une construction à partir de AB, la dernière celle où γ est donné ; les autres sont mélangées
  function questionsSerie() {
    const ab = LT.melanger([
      construire({ configs: CONFIGS, theme: 'Construire l\'image', gamma: hasard(['tailles', 'distances']) }),
      Math.random() < 0.5
        ? construire({ configs: CONFIGS, theme: 'Objet sous l\'axe optique', sous: true, gamma: hasard(['tailles', 'distances']) })
        : construire({ configs: CONFIGS_E, theme: 'Figure à l\'échelle', ech: 2, sous: Math.random() < 0.5, gamma: hasard(['tailles', 'distances']) }),
    ]);
    const autres = LT.melanger([
      ab[1],
      construire({ configs: CONFIGS, theme: 'Placer les foyers', foyers: true, sous: Math.random() < 0.5, gamma: hasard(['tailles', 'distances']) }),
      rebours(),
      rebours(),
      ...CALCULS.map(q => q()),
      construire({ configs: CONFIGS, theme: 'Construire et calculer', deduire: hasard(['AiBi', 'OAi']), sous: Math.random() < 0.5 }),
    ]);
    return [ab[0], ...autres, avecGamma()];
  }

  Object.assign(LT, { questionsSerie, CONFIGS, CONFIGS_E, CONFIGS_G, donnees });
})();
