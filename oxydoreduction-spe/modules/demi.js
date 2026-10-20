/* ============================================================
   Outil « Équilibrer une demi-équation »
   (application Oxydoréduction, 1re et terminale spécialité)

     DEMI.outil(zone, opts)   construit l'outil dans zone et renvoie
                              { montrer(), reprendre() }
       opts = {
         couple: { ox: 'MnO4^-', red: 'Mn^2+' }   formules (charge après ^)
         mode: 'guide'     une étape de la méthode après l'autre, chacune validée (défaut)
               'libre'     toute la demi-équation, validée en une seule fois
         depart, jusqua    (guide) première et dernière étape à faire (0 à 3) :
                           les étapes avant « depart » sont déjà faites
         sens: 'red'       oxydant à gauche, réducteur à droite (défaut)
               'ox'        sens d'une oxydation : réducteur à gauche, électrons à droite
         reactif           true : demi-équation écrite dans le sens d'une réaction, le
                           réactif à gauche du signe = (jamais de flèche dans une
                           demi-équation : elle est réservée à l'équation d'une réaction)
         inverser          true : bouton « ⇄ Inverser » (échange les deux membres)
         explique          (guide) consigne détaillée de chaque étape : quelle espèce
                           glisser, de quel côté, et sur quel nombre régler les flèches
         aides: 'element'  (guide, défaut) l'aide de l'élément en cours d'équilibrage est
                           toujours affichée sous la demi-équation
                'libre'    bouton « Afficher les aides » (défaut en mode libre)
                'ouvertes' toutes les aides affichées dès le départ
                'payant'   la première ouverture coûte un point (série)
                'aucune'   pas d'aides
         api, compter      partie d'un moteur de questions (voir DEMI.partie) :
                           api.reussi() à la fin, api.compterErreur() à chaque
                           erreur et aide payante si compter
         part              la partie (DEMI.partie) dont l'outil complète la solution
         montrerEtape      false : pas de bouton « Afficher la réponse de l'étape »
         final             false : pas de demi-équation finale dans le message
         recommencer       false : pas de bouton « Recommencer »
         onFini(bilan)     demi-équation équilibrée ;
                           bilan = { erreurs, vues, codes, aides, html }
         onErreur(code)    une erreur vient d'être repérée (voir DIFFICULTES)
         onAide()          aides payantes ouvertes
       }
     DEMI.partie(o)           l'outil en partie « perso » d'un cours ou d'une série
     DEMI.solution(couple, o) demi-équation équilibrée, étape par étape (o : sens, reactif)
     DEMI.verifier(couple, termes, o)
                              vérifie une demi-équation écrite ailleurs (moteur des
                              réactions) : termes [{ f, cote, coef }], o = { sens, reactif } ;
                              renvoie { ok } ou { code, msg } ou { format, msg }
     DEMI.ecrire(termes, signe)  écriture HTML d'une demi-équation
     DEMI.DIFFICULTES         libellé de chaque difficulté repérée
     DEMI.outils              petits outils (charges, atomes, écriture)

   Méthode suivie :
     1. oxydant d'un côté, réducteur de l'autre ; équilibrer les éléments
        autres que O et H
     2. équilibrer O en ajoutant H2O
     3. équilibrer H en ajoutant H+
     4. équilibrer les charges en ajoutant des électrons e−
   On glisse les espèces (celles du couple, puis H2O, H+ et e− de la
   réserve) dans les membres ; les flèches règlent les nombres
   stœchiométriques. Aides : nombre d'atomes de chaque élément et charge
   totale de chaque côté, en direct.

   Côtés « logiques » : les vérifications raisonnent toujours avec
   l'oxydant à gauche ('g'). Dans le sens d'une oxydation, les membres
   écrits par l'élève sont échangés avant d'être vérifiés, et les
   messages disent le vrai côté.

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
    { titre: 'Éléments autres que O et H' },
    { titre: 'O : ajouter H<sub>2</sub>O' },
    { titre: 'H : ajouter H<sup>+</sup>' },
    { titre: 'Charges : ajouter e<sup>−</sup>' },
  ];

  // Difficultés repérées par les diagnostics (code → libellé)
  const DIFFICULTES = {
    placement: 'oxydant et réducteur mal placés',
    espece: 'espèce d\'un autre couple',
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
  // détail d'une charge totale : « (−2) + 14 × (+1) = +12 » (« +2 » pour un seul ion, « 0 » sans ion)
  function detailCharge(T, c) {
    const L = trier(T.filter(t => t.cote === c && q(t.f)));
    const tot = fq(charges(T, c));
    if (!L.length || (L.length === 1 && L[0].coef === 1)) return tot;
    return L.map(t => (t.coef > 1 ? `${t.coef} × (${fq(q(t.f))})` : `(${fq(q(t.f))})`)).join(' + ') + ' = ' + tot;
  }
  // éléments autres que O et H du couple, dans l'ordre d'écriture
  function autres(cp) {
    const l = [];
    [cp.ox, cp.red].forEach(f => Object.keys(compo(f)).forEach(el => { if (el !== 'O' && el !== 'H' && !l.includes(el)) l.push(el); }));
    return l;
  }
  const trier = L => L.slice().sort((a, b) => ORDRE[a.role] - ORDRE[b.role]);
  // copie des termes, membres échangés si inv (passage côté logique ↔ côté écrit)
  const reel = (L, inv) => L.map(t => Object.assign({}, t, inv ? { cote: autre(t.cote) } : {}));

  // Écriture d'une demi-équation : « MnO4− + 8 H+ + 5 e− = Mn2+ + 4 H2O »
  function ecrire(T, signe) {
    const m = c => trier(T.filter(t => t.cote === c)).map(t => kf(t.coef, t.f)).join(' + ');
    return `${m('g')} ${signe || '='} ${m('d')}`;
  }

  // mots des côtés : le côté logique c ('g' : celui de l'oxydant) dit avec son vrai côté
  // (une demi-équation s'écrit toujours avec le signe =, même orientée)
  function mots(o) {
    const inv = o.sens === 'ox', reactif = !!o.reactif;
    const cote = c => ((c === 'g') !== inv ? 'à gauche' : 'à droite');
    const de = c => ((c === 'g') !== inv ? 'de gauche' : 'de droite');
    return { inv, reactif, signe: '=', du: 'du signe =', cote, de };
  }

  /* ============================================================
     SOLUTION : la demi-équation après chacune des 4 étapes (côtés
     logiques), l'explication de chaque étape, et la consigne détaillée
     de chaque étape (mode « explique »)
     ============================================================ */
  function solution(cp, o) {
    const M = mots(o || {}), { cote, du } = M;
    const nOx = html(cp.ox), nRed = html(cp.red);
    const T = [{ role: 'ox', f: cp.ox, cote: 'g', coef: 1 }, { role: 'red', f: cp.red, cote: 'd', coef: 1 }];
    const etapes = [], textes = [], consignes = [];
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
    let c1 = `Glisse l'oxydant ${nOx} ${cote('g')} ${du} et le réducteur ${nRed} ${cote('d')}.`;
    if (X) {
      const a = compo(cp.ox)[X], b = compo(cp.red)[X], g = pgcd(a, b);
      T[0].coef = b / g; T[1].coef = a / g;
      const n = T[0].coef * a;
      if (T[0].coef === 1 && T[1].coef === 1) {
        textes.push(`${X} est déjà équilibré : ${n} atome${s(n)} ${X} de chaque côté.`);
        c1 += ` Il y a ${n} atome${s(n)} ${X} de chaque côté : ${X} est déjà équilibré, laisse 1 devant chaque espèce.`;
      } else {
        textes.push(`Il y a ${a} atome${s(a)} ${X} dans ${nOx} et ${b} dans ${nRed} : on écrit ${kf(T[0].coef, cp.ox)} et ${kf(T[1].coef, cp.red)}, soit ${n} atomes ${X} de chaque côté.`);
        const regler = T.filter(t => t.coef > 1).map(t => `devant ${html(t.f)} sur <b>${t.coef}</b>`).join(' et ');
        c1 += ` Il y a ${a} atome${s(a)} ${X} dans ${nOx} et ${b} dans ${nRed} : avec la flèche ▲, règle le nombre ${regler}.`;
      }
    } else {
      textes.push('Il n\'y a pas d\'autre élément que O et H dans ce couple : rien à équilibrer à cette étape.');
      c1 += ' Il n\'y a pas d\'autre élément que O et H dans ce couple : laisse 1 devant chaque espèce.';
    }
    consignes.push(c1 + ' Puis valide l\'étape.');
    etapes.push(copie());
    // 2. O avec H2O (une molécule d'eau apporte un atome O)
    const OG = atomes(T, 'g').O || 0, OD = atomes(T, 'd').O || 0;
    if (OG !== OD) {
      const c = OG > OD ? 'd' : 'g', k = Math.abs(OG - OD);
      const deja = T.find(x => x.f === EAU && x.cote === c);
      const tout = ajouter('eau', EAU, c, k);
      textes.push(`Il y a ${OG} atome${s(OG)} O ${cote('g')} et ${OD} ${cote('d')} : il manque ${k} atome${s(k)} O ${cote(c)}, on ajoute ${k}&nbsp;H<sub>2</sub>O ${cote(c)}${tout}.`);
      consignes.push(`Il y a ${OG} atome${s(OG)} O ${cote('g')} et ${OD} ${cote('d')} : il manque ${k} atome${s(k)} O ${cote(c)}. ` +
        (deja ? `Glisse H<sub>2</sub>O ${cote(c)}, puis règle le nombre devant H<sub>2</sub>O sur <b>${deja.coef}</b>.`
          : `Glisse H<sub>2</sub>O ${cote(c)}, puis règle son nombre sur <b>${k}</b> (une molécule d'eau apporte un atome O). Valide l'étape.`));
    } else {
      textes.push(OG ? `O est déjà équilibré (${OG} atome${s(OG)} de chaque côté) : <b>pas besoin d'ajouter H<sub>2</sub>O</b>.` : 'Il n\'y a pas d\'atome O : <b>pas besoin d\'ajouter H<sub>2</sub>O</b>.');
      consignes.push(`${OG ? `Il y a ${OG} atome${s(OG)} O de chaque côté : O est déjà équilibré.` : 'Il n\'y a pas d\'atome O.'} N'ajoute pas d'eau : valide directement l'étape.`);
    }
    etapes.push(copie());
    // 3. H avec H+ (un ion H+ apporte un atome H)
    const HG = atomes(T, 'g').H || 0, HD = atomes(T, 'd').H || 0;
    const eau = T.some(t => t.f === EAU) ? ' (une molécule H<sub>2</sub>O contient 2 atomes H)' : '';
    if (HG !== HD) {
      const c = HG > HD ? 'd' : 'g', k = Math.abs(HG - HD);
      const deja = T.find(x => x.f === HP && x.cote === c);
      const tout = ajouter('h', HP, c, k);
      textes.push(`Il y a ${HG} atome${s(HG)} H ${cote('g')} et ${HD} ${cote('d')} : il manque ${k} atome${s(k)} H ${cote(c)}, on ajoute ${k}&nbsp;H<sup>+</sup> ${cote(c)}${tout}.`);
      consignes.push(`Il y a ${HG} atome${s(HG)} H ${cote('g')} et ${HD} ${cote('d')}${eau} : il manque ${k} atome${s(k)} H ${cote(c)}. ` +
        (deja ? `Glisse H<sup>+</sup> ${cote(c)}, puis règle le nombre devant H<sup>+</sup> sur <b>${deja.coef}</b>.`
          : `Glisse H<sup>+</sup> ${cote(c)}, puis règle son nombre sur <b>${k}</b> (un ion H<sup>+</sup> apporte un atome H). Valide l'étape.`));
    } else {
      textes.push(HG ? `H est déjà équilibré (${HG} atome${s(HG)} de chaque côté) : <b>pas besoin d'ajouter H<sup>+</sup></b>.` : 'Il n\'y a pas d\'atome H : <b>pas besoin d\'ajouter H<sup>+</sup></b>.');
      consignes.push(`${HG ? `Il y a ${HG} atome${s(HG)} H de chaque côté : H est déjà équilibré.` : 'Il n\'y a pas d\'atome H.'} N'ajoute pas d'ions H<sup>+</sup> : valide directement l'étape.`);
    }
    etapes.push(copie());
    // 4. charges avec e− (un électron fait baisser la charge de 1)
    const G0 = charges(T, 'g'), D0 = charges(T, 'd'), n = G0 - D0;
    const dG = detailCharge(T, 'g'), dD = detailCharge(T, 'd');
    const c = n > 0 ? 'g' : 'd';
    ajouter('e', E, c, Math.abs(n));
    textes.push(c === 'g'
      ? `Sans les électrons, la charge totale vaut ${fq(G0)} ${cote('g')} et ${fq(D0)} ${cote('d')}. Avec ${n}&nbsp;e<sup>−</sup> ${cote('g')}, cette charge devient ${fq(G0)} − ${n} = ${fq(D0)}.`
      : `Sans les électrons, la charge totale vaut ${fq(G0)} ${cote('g')} et ${fq(D0)} ${cote('d')}. Avec ${-n}&nbsp;e<sup>−</sup> ${cote('d')}, cette charge devient ${fq(D0)} − ${-n} = ${fq(G0)}.`);
    consignes.push(`Charge totale ${cote('g')} : ${dG} ; ${cote('d')} : ${dD}. Un électron porte la charge −1 : glisse e<sup>−</sup> ${cote(c)}, du côté où la charge est la plus grande, puis règle leur nombre sur <b>${Math.abs(n)}</b> (l'écart entre ${fq(G0)} et ${fq(D0)}). Valide l'étape.`);
    etapes.push(copie());
    return { etapes, textes, consignes, html: ecrire(reel(T, M.inv), M.signe) };
  }

  /* ============================================================
     VÉRIFICATIONS (sur des termes aux côtés logiques : l'oxydant à gauche)
     renvoient { ok } ou { code, msg } (erreur) ou { format, msg } (rien à juger)
     ============================================================ */
  function controles(cp, o) {
    const M = mots(o || {}), { inv, reactif, du, cote, de } = M;
    const ref = solution(cp);
    const nOx = html(cp.ox), nRed = html(cp.red);
    const forme = inv ? 'Red = Ox + n e<sup>−</sup>' : 'Ox + n e<sup>−</sup> = Red';
    const nb = (T, c, el) => atomes(T, c)[el] || 0;
    // nombre d'espèces f ajoutées d'un côté (sans celles du couple : H2O de H2O2 / H2O, H+ de H+ / H2)
    const ajoutes = (T, f, c) => T.filter(t => t.f === f && t.cote === c).reduce((x, t) => x + t.coef - (t.base || 0), 0);
    const molecules = (T, f, c) => T.filter(t => t.f === f && t.cote === c).reduce((x, t) => x + t.coef, 0);
    const role = (T, r) => T.find(t => t.role === r);
    // nombre de chaque espèce du couple après l'étape 1 (solution)
    const base0 = r => ref.etapes[0].find(t => t.role === r).coef;

    // 1. placement de l'oxydant et du réducteur, éléments autres que O et H
    function v1(T) {
      const ox = role(T, 'ox'), red = role(T, 'red');
      if (!ox || !red) return { format: true, msg: `Glisse l'oxydant et le réducteur du couple ${nOx} / ${nRed} dans la demi-équation.` };
      if (ox.cote === red.cote) return { code: 'placement', msg: `L'oxydant et le réducteur ne vont pas du même côté ${du} : l'oxydant ${nOx} ${cote('g')}, le réducteur ${nRed} ${cote('d')}.` };
      if (ox.cote === 'd') {
        if (reactif && inv) return { code: 'placement', msg: `Le réactif est ${nRed} : il s'écrit à gauche du signe =, et l'oxydant ${nOx} qu'il forme à droite. C'est une oxydation : ${forme}.` };
        if (reactif) return { code: 'placement', msg: `Le réactif est ${nOx} : il s'écrit à gauche du signe =, et le réducteur ${nRed} qu'il forme à droite. C'est une réduction : ${forme}.` };
        return { code: 'placement', msg: `Tu as inversé l'oxydant et le réducteur. On écrit l'oxydant ${nOx} ${cote('g')} ${du} et le réducteur ${nRed} ${cote('d')} : ${forme}. Dans le couple ${nOx} / ${nRed}, l'oxydant est écrit en premier.` };
      }
      const els = autres(cp);
      if (!els.length) {
        if (ox.coef !== 1 || red.coef !== 1) return { code: 'elements', msg: 'Dans ce couple, il n\'y a pas d\'autre élément que O et H : il n\'y a rien à équilibrer à cette étape. Laisse 1 devant chaque espèce.' };
        return { ok: true };
      }
      for (const X of els) {
        const g = nb(T, 'g', X), d = nb(T, 'd', X);
        if (g === d) continue;
        const a = compo(cp.ox)[X] || 0, b = compo(cp.red)[X] || 0;
        const compte = `Il y a ${g} atome${s(g)} ${X} ${cote('g')} et ${d} ${cote('d')}.`;
        // l'indice recopié devant l'espèce qui le porte : 2 Cr2O7^2- = Cr^3+
        if (a > 1 && ox.coef === a && red.coef === 1) return { code: 'indice', msg: `${compte} Le ${a} de ${nOx} est un indice : une seule entité ${nOx} contient déjà ${a} atomes ${X}. Ce n'est pas devant ${nOx} qu'il faut un nombre.` };
        if (b > 1 && red.coef === b && ox.coef === 1) return { code: 'indice', msg: `${compte} Le ${b} de ${nRed} est un indice : une seule entité ${nRed} contient déjà ${b} atomes ${X}. Ce n'est pas devant ${nRed} qu'il faut un nombre.` };
        return { code: 'elements', msg: `${compte} Règle les nombres devant ${nOx} et ${nRed} avec les flèches pour en avoir autant des deux côtés.` };
      }
      const k = pgcd(ox.coef, red.coef);
      if (k > 1) return { code: 'simplifier', msg: `${els.join(', ')} est bien équilibré, mais il faut les plus petits nombres possibles : ${ox.coef} et ${red.coef} se divisent tous les deux par ${k}.` };
      return { ok: true };
    }

    // 2. et 3. : un élément (O ou H) équilibré avec une espèce de la réserve (H2O ou H+)
    // qui apporte un atome de cet élément
    function vElement(T, el, f, code, nom) {
      const G = nb(T, 'g', el), D = nb(T, 'd', el), aG = ajoutes(T, f, 'g'), aD = ajoutes(T, f, 'd');
      const G0 = G - aG, D0 = D - aD;                           // sans les espèces ajoutées
      if (aG > 0 && aD > 0) return { code, msg: `Tu as ajouté ${nom} des deux côtés ${du}. Il n'en faut que d'un seul côté : celui où il manque des atomes ${el}.` };
      if (G === D) return { ok: true };
      if (G0 === D0) return { code, msg: `L'élément ${el} était déjà équilibré (${G0} atome${s(G0)} de chaque côté) : il ne faut pas ${nom} ici. Retire ${html(f)} : fais-le glisser hors de la demi-équation.` };
      const m = G0 < D0 ? 'g' : 'd', a = m === 'g' ? aG : aD, ecart = Math.abs(G0 - D0);
      const compte = `Il y a ${G} atome${s(G)} ${el} ${cote('g')} et ${D} ${cote('d')}`;
      if (!aG && !aD) return { code, msg: `${compte} : ajoute ${nom} du côté où il en manque.` };
      if (!a) return { code: code + '-cote', msg: `Tu as mis ${html(f)} ${cote(autre(m))}, où il y a déjà le plus d'atomes ${el} (${Math.max(G0, D0)} contre ${Math.min(G0, D0)}). Il faut l'ajouter ${cote(m)}, là où il en manque.` };
      // H : chaque molécule d'eau de l'autre côté comptée pour un seul atome H
      const w = el === 'H' ? molecules(T, EAU, autre(m)) : 0;
      if (w && a === ecart - w) return { code: 'h-eau', msg: `Chaque molécule H<sub>2</sub>O contient 2 atomes H : ${w}&nbsp;H<sub>2</sub>O, c'est ${w} × 2 = ${2 * w} atomes H.` };
      if (a < ecart) return { code, msg: `${compte} : il en manque encore ${cote(m)}. Chaque ${html(f)} apporte un seul atome ${el}.` };
      return { code, msg: `Il y a maintenant trop d'atomes ${el} ${cote(m)} : ${m === 'g' ? G : D} contre ${m === 'g' ? D : G} ${cote(autre(m))}. Chaque ${html(f)} apporte un seul atome ${el}.` };
    }
    const v2 = T => vElement(T, 'O', EAU, 'eau', 'des molécules d\'eau H<sub>2</sub>O');
    const v3 = T => vElement(T, 'H', HP, 'h', 'des ions H<sup>+</sup>');

    // 4. charges avec les électrons ; deja : erreurs déjà faites (à partir de la 2e, on donne les charges)
    function v4(T, deja) {
      const qG = charges(T, 'g'), qD = charges(T, 'd'), eG = ajoutes(T, E, 'g'), eD = ajoutes(T, E, 'd');
      const G0 = qG + eG, D0 = qD + eD;                          // charges sans les électrons
      const n = G0 - D0;                                           // électrons attendus (côté de l'oxydant)
      const rappel = deja ? ` Sans les électrons, la charge totale vaut ${fq(G0)} ${cote('g')} et ${fq(D0)} ${cote('d')}.` : '';
      if (eG && eD) return { code: 'e-deux', msg: `Tu as mis des électrons des deux côtés ${du} : il n'en faut que d'un seul côté.` };
      if (qG === qD) return { ok: true };
      if (!eG && !eD) return { code: 'e-oubli', msg: 'Les charges ne sont pas égales des deux côtés : ajoute des électrons e<sup>−</sup>.' + rappel };
      if (eD) {
        if (eD === n) return { code: 'e-signe', msg: `Tu as fait comme si un électron portait une charge +1. Il porte une charge <b>−1</b> : des électrons ${cote('d')} font baisser la charge ${de('d')}, l'écart entre les deux côtés augmente. Les électrons se placent du côté de l'oxydant : ${forme}.` + rappel };
        return { code: 'e-cote', msg: `Les électrons se placent du côté de l'oxydant, ${cote('g')} : ${forme}. ${inv ? 'Le réducteur cède des électrons : ils apparaissent avec l\'oxydant qu\'il forme.' : 'C\'est l\'oxydant qui capte les électrons.'}` + rappel };
      }
      // électrons du côté de l'oxydant, mauvais nombre : quelle erreur de calcul de la charge ?
      const d = diagCharge(T, eG, G0, D0);
      if (d) return d;
      return { code: 'e-nombre', msg: deja
        ? `Sans les électrons, la charge totale vaut ${fq(G0)} ${cote('g')} et ${fq(D0)} ${cote('d')}. Avec ${eG}&nbsp;e<sup>−</sup> ${cote('g')}, la charge ${de('g')} devient ${fq(G0)} − ${eG} = ${fq(G0 - eG)} : elle doit être égale à ${fq(D0)}.`
        : `Ce n'est pas le bon nombre d'électrons. Calcule la charge totale de chaque côté, sans les électrons : chaque e<sup>−</sup> ajouté ${cote('g')} fait baisser la charge ${de('g')} de 1.` };
    }
    // k électrons du côté de l'oxydant au lieu de G0 − D0 : on cherche l'erreur de calcul qui donne k
    // (un seul diagnostic possible, sinon message général)
    function diagCharge(T, k, G0, D0) {
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
      if (D0 && k === Math.abs(G0 + D0)) pistes.push({ code: 'charge-somme', msg: `Tu as additionné les charges des deux côtés (${fq(G0)} et ${fq(D0)}). Les électrons doivent faire passer la charge ${de('g')} de ${fq(G0)} à ${fq(D0)} : de combien doit-elle baisser ?` });
      if (D0 && k === Math.abs(G0)) pistes.push({ code: 'charge-seul', msg: `Tu as fait comme si la charge ${de('g')} devait arriver à 0. Elle doit devenir égale à la charge ${de('d')}, ${fq(D0)}.` });
      return pistes.length === 1 ? pistes[0] : null;
    }

    // Toute la demi-équation, vérifiée étape par étape de la méthode. Les H2O (ou H+)
    // ajoutés à l'espèce du couple qui en est (H2O2 / H2O, H+ / H2) sont séparés du couple.
    function libre(T0, deja) {
      const T = [];
      T0.forEach(t => {
        if (!estCouple(t)) { T.push(Object.assign({}, t, { base: 0 })); return; }
        const b = base0(t.role);
        const reste = t.f === EAU ? 'eau' : t.f === HP ? 'h' : null;
        if (reste && t.coef > b) {
          T.push(Object.assign({}, t, { coef: b, base: b }));
          T.push({ role: reste, f: t.f, cote: t.cote, coef: t.coef - b, base: 0 });
        } else T.push(Object.assign({}, t, { base: t.coef }));
      });
      let v = { ok: true };
      for (let k = 0; k < 4 && v.ok; k++) {
        v = [v1, v2, v3, v4][k](T, deja);
        if (!v.ok && !v.format && v.code !== 'placement') v.msg = `<b>${ETAPES[k].titre}.</b> ${v.msg}`;
      }
      return v;
    }
    return { v: [v1, v2, v3, v4], libre, M };
  }

  /* Vérifie une demi-équation écrite dans un autre outil (moteur des réactions)
     termes [{ f, cote, coef }] aux côtés écrits ; o = { sens, reactif } */
  function verifier(cp, termes, o) {
    const C = controles(cp, o), { du } = C.M;
    if (!termes.length) return { format: true, msg: 'Cette demi-équation est vide : glisse les espèces du couple et, si besoin, H<sub>2</sub>O, H<sup>+</sup> et e<sup>−</sup>.' };
    // une seule fois chaque espèce de chaque côté
    const T = [];
    termes.forEach(t => {
      const u = T.find(x => x.f === t.f && x.cote === t.cote);
      if (u) u.coef += t.coef; else T.push({ f: t.f, cote: t.cote, coef: t.coef });
    });
    for (const t of T) {
      t.role = t.f === cp.ox ? 'ox' : t.f === cp.red ? 'red' : t.f === EAU ? 'eau' : t.f === HP ? 'h' : t.f === E ? 'e' : null;
      if (!t.role) return { code: 'espece', msg: `${html(t.f)} n'appartient pas au couple ${html(cp.ox)} / ${html(cp.red)} : cette demi-équation ne contient que les espèces de ce couple et, si besoin, H<sub>2</sub>O, H<sup>+</sup> et e<sup>−</sup>.` };
    }
    const deux = T.find(t => T.some(u => u !== t && u.f === t.f && u.cote !== t.cote));
    if (deux) return { code: deux.role === 'e' ? 'e-deux' : 'placement', msg: `${html(deux.f)} figure des deux côtés ${du} : il ne doit figurer que d'un seul côté.` };
    return C.libre(reel(T, C.M.inv), 0);
  }

  /* ============================================================
     L'OUTIL
     ============================================================ */
  function outil(zone, opts) {
    const cp = opts.couple, ref = solution(cp, opts), C = controles(cp, opts);
    const { inv, signe, du, cote } = C.M;
    const nOx = html(cp.ox), nRed = html(cp.red);
    const libre = opts.mode === 'libre';
    const depart = libre ? 0 : opts.depart || 0;
    const derniere = libre ? 3 : (opts.jusqua == null ? 3 : opts.jusqua);   // dernière étape à faire
    const modeAides = opts.aides || (libre ? 'libre' : 'element');
    const api = opts.api, compter = !!opts.compter;
    let T, etape, erreurs, vues, codes, aides = false, aidesVues = false, parMoteur = false;
    const fini = () => etape > derniere;
    // côtés logiques (l'oxydant à gauche) des termes écrits
    const logique = () => reel(T, inv);

    zone.innerHTML = `<div class="ox-outil${libre ? ' ox-libre' : ''}">
        <div class="ox-haut">
          <div class="ox-palette">
            <div class="ox-couple"><p class="ox-etiq">Couple</p><div class="ox-couple-l"></div></div>
            <div class="ox-reserve"><p class="ox-etiq">Réserve</p><div class="ox-reserve-l"></div></div>
          </div>
          <div class="ox-demi"><p class="ox-etiq">Demi-équation</p>
            <div class="ox-eq">
              <div class="ox-membre" data-cote="g" role="group" aria-label="Membre de gauche"></div>
              <span class="ox-egal" aria-hidden="true">${signe}</span>
              <div class="ox-membre" data-cote="d" role="group" aria-label="Membre de droite"></div>
            </div>
            <div class="ox-aides hidden" aria-live="polite"></div>
          </div>
        </div>
        <ol class="ox-etapes${libre ? ' hidden' : ''}"></ol>
        <p class="ox-consigne"></p>
        <div class="er-actions ox-actions">
          <button type="button" class="btn-primary ox-valider">${libre ? 'Valider' : 'Valider l\'étape'}</button>
          <button type="button" class="btn-small ox-b-inv${opts.inverser ? '' : ' hidden'}" aria-label="Inverser la demi-équation : échanger les deux membres">⇄ Inverser</button>
          <button type="button" class="btn-small ox-b-aides hidden" aria-expanded="false"></button>
          <button type="button" class="btn-small ox-b-montrer hidden">${libre ? 'Afficher la réponse' : 'Afficher la réponse de l\'étape'}</button>
          <button type="button" class="btn-small ox-b-zero${opts.recommencer === false ? ' hidden' : ''}">Recommencer</button>
        </div>
        <div class="ox-retour"></div>
      </div>`;
    const $ = sel => zone.querySelector(sel);
    const racine = $('.ox-outil');

    /* ---------- Comptes sur la demi-équation écrite (côtés écrits) ---------- */
    const nb = (c, el) => atomes(T, c)[el] || 0;
    const role = r => T.find(t => t.role === r);
    // nombre de chaque espèce du couple après l'étape 1 (solution)
    const base0 = r => ref.etapes[0].find(t => t.role === r).coef;

    /* ---------- Affichage ---------- */
    // nombre réglable : espèces du couple à l'étape 1, puis H2O, H+, e− à leur étape (tout en mode libre)
    const reglable = t => !fini() && (libre || (etape === 0 ? estCouple(t) : t.f === F_ETAPE[etape]));
    // espèce que l'on peut déplacer ou retirer (glisser hors de la demi-équation)
    const deplacable = t => !fini() && (libre || (etape === 0 ? estCouple(t) : t.role === ROLE_ETAPE[etape]));

    function jeton(f) {
      const j = document.createElement('span');
      j.className = 'ox-jeton';
      j.dataset.f = f;
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
      b.dataset.f = t.f;
      if (fini()) {
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
    // consigne de l'étape en cours (détaillée en mode « explique »)
    function consigne() {
      if (libre) return opts.consigne || `Écris la demi-équation du couple ${nOx} / ${nRed} : glisse les espèces, règle les nombres avec les flèches, puis valide une seule fois, quand tout est équilibré.`;
      if (opts.explique) return `<b>Étape ${etape + 1}.</b> ${ref.consignes[etape]}`;
      const c = [
        `Glisse l'oxydant ${cote('g')} ${du} et le réducteur ${cote('d')}. Puis, avec les flèches, équilibre les éléments autres que O et H.`,
        'Équilibre l\'élément O : glisse H<sub>2</sub>O du côté où il manque des atomes O, puis règle le nombre de molécules d\'eau. Si O est déjà équilibré, valide directement.',
        'Équilibre l\'élément H : glisse H<sup>+</sup> du côté où il manque des atomes H, puis règle leur nombre. Si H est déjà équilibré, valide directement.',
        `Équilibre les charges : glisse des électrons e<sup>−</sup> (charge −1 chacun) d'un côté ${du}, puis règle leur nombre pour avoir la même charge totale des deux côtés.`,
      ];
      return `<b>Étape ${etape + 1}.</b> ${c[etape]}`;
    }
    function rendre() {
      const f = fini();
      racine.classList.toggle('ox-fini', f);
      // couple : chaque espèce se glisse dans la demi-équation (étape 1)
      const lc = $('.ox-couple-l');
      lc.innerHTML = '';
      ['ox', 'red'].forEach((r, i) => {
        if (i) lc.insertAdjacentHTML('beforeend', '<span class="ox-barre" aria-hidden="true">/</span>');
        const j = jeton(cp[r]);
        if (role(r)) j.classList.add('ox-pris');
        else if (!f && (libre || etape === 0)) mobile(j, { role: r, f: cp[r] });
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
      // réserve : H2O, H+ puis e−, chacun à son étape (toutes en mode libre)
      const lr = $('.ox-reserve-l');
      lr.innerHTML = '';
      RESERVE.forEach(r => {
        const j = jeton(r.f);
        if (!f && (libre || r.etape === etape)) mobile(j, r); else j.classList.add('ox-off');
        lr.appendChild(j);
      });
      // étapes de la méthode
      $('.ox-etapes').innerHTML = ETAPES.map((e, k) => {
        const cls = k < etape ? 'ox-fait' : k === etape ? 'ox-encours' : '';
        return `<li class="${cls}"${k === etape ? ' aria-current="step"' : ''}><span class="ox-pastille">${k < etape ? '✓' : k + 1}</span><span>${e.titre}</span></li>`;
      }).join('');
      $('.ox-consigne').innerHTML = f ? '' : consigne();
      $('.ox-consigne').classList.toggle('hidden', f);
      $('.ox-valider').classList.toggle('hidden', f);
      $('.ox-b-inv').classList.toggle('hidden', f || !opts.inverser);
      $('.ox-b-montrer').classList.toggle('hidden', f || opts.montrerEtape === false || !(libre ? erreurs.some(Boolean) : erreurs[etape]));
      if (f && api) $('.ox-b-zero').classList.add('hidden');
      majAides();
    }

    /* ---------- Aides : atomes et charges de chaque côté du signe ---------- */
    // mode 'element' : seulement l'élément en cours d'équilibrage (tout, une fois la demi-équation finie)
    function majAides() {
      const box = $('.ox-aides'), b = $('.ox-b-aides');
      const parElement = modeAides === 'element', visible = parElement || aides;
      box.classList.toggle('hidden', !visible);
      b.classList.toggle('hidden', parElement || modeAides === 'aucune');
      b.textContent = aides ? 'Masquer les aides' : modeAides === 'payant' && !aidesVues ? 'Afficher les aides (1 point de moins)' : 'Afficher les aides';
      b.setAttribute('aria-expanded', String(aides));
      if (!visible) return;
      if (!T.length) { box.innerHTML = '<p class="ox-aide-vide">Glisse les espèces : l\'aide compte alors les atomes de chaque côté.</p>'; return; }
      const enCours = parElement && !fini();
      let els = autres(cp), avecCharge = true;
      if (enCours) {
        if (etape > 0) els = etape === 1 ? ['O'] : etape === 2 ? ['H'] : [];
        avecCharge = etape === 3;
      } else ['O', 'H'].forEach(el => { if (nb('g', el) || nb('d', el)) els.push(el); });
      if (enCours && etape === 0 && !els.length) {
        box.innerHTML = '<p class="ox-aide-vide">Pas d\'autre élément que O et H dans ce couple.</p>';
        return;
      }
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
        (avecCharge ? ligne('Charge', qG, qD, `<b>${fq(qG)}</b>${detail('g')}`, `<b>${fq(qD)}</b>${detail('d')}`) : '') +
        '</tbody></table>';
    }
    function basculerAides() {
      if (modeAides === 'aucune' || modeAides === 'element') return;
      aides = !aides;
      // aides payantes (séries) : la question ne rapporte plus qu'un point au plus
      if (aides && !aidesVues) {
        aidesVues = true;
        if (modeAides === 'payant') {
          if (api && compter) api.compterErreur();
          if (opts.onAide) opts.onAide();
        }
      }
      majAides();
      if (aides) $('.ox-aides').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      if (api) api.effacer();
      rendre();
    }
    // « ⇄ Inverser » : les deux membres échangent leur place
    function inverser() {
      if (fini()) return;
      T.forEach(t => { t.cote = autre(t.cote); });
      retour('');
      if (api) api.effacer();
      rendre();
    }

    /* ---------- Valider, réussir, montrer ---------- */
    function retour(h) {
      const r = $('.ox-retour');
      r.innerHTML = h;
      if (h) setTimeout(() => r.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
    function valider() {
      if (fini()) return;
      const L = logique();
      const v = libre ? C.libre(L, erreurs.reduce((a, b) => a + b, 0)) : C.v[etape](L, erreurs[3]);
      if (v.format) { retour(`<div class="callout er-retour"><p>${v.msg}</p></div>`); return; }
      if (!v.ok) {
        erreurs[etape]++;
        codes.push(v.code);
        if (opts.onErreur) opts.onErreur(v.code);
        if (api && compter) api.compterErreur();
        retour(`<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${v.msg}</p></div>`);
        if (opts.montrerEtape !== false) $('.ox-b-montrer').classList.remove('hidden');
        return;
      }
      if (libre) { T = reel(ref.etapes[3], inv).map(t => Object.assign(t, { base: 0 })); etape = 3; }
      reussir(false);
    }
    function reussir(vue) {
      const k = etape;
      if (k === 0) T.forEach(t => { if (estCouple(t)) t.base = t.coef; });   // nombres du couple fixés
      vues[k] = vue;
      etape++;
      const titre = vue ? 'Réponse' : erreurs.slice(libre ? 0 : k, k + 1).some(Boolean) ? 'C\'est juste.' : 'Juste !';
      let h = `<p><b class="${vue ? '' : 'er-ok'}">${titre}</b> ${libre ? 'La demi-équation est équilibrée.' : ref.textes[k]}</p>`;
      if (fini() && derniere === 3 && opts.final !== false) {
        h += `<div class="ox-final">${ecrire(T, signe)}</div>
          <p>Autant d'atomes de chaque élément et la même charge (${fq(charges(T, 'g'))}) de chaque côté : la demi-équation est équilibrée.</p>`;
      }
      // partie d'un moteur de questions : la réponse affichée par le moteur suffit ;
      // dans une série, le dernier message passe dans celui du moteur (« Juste ! » ou « C'est juste. »)
      const part = opts.part, eq = `<div class="ox-final">${ecrire(T, signe)}</div>`;
      if (fini() && api && part && (parMoteur || compter)) {
        retour('');
        part.solution = parMoteur ? eq : `<p>${libre ? 'La demi-équation est équilibrée.' : ref.textes[k]}</p>${derniere === 3 ? eq : ''}`;
      } else if (!parMoteur) retour(`<div class="${vue ? 'callout' : 'callout-success'} er-retour">${h}</div>`);
      rendre();
      if (fini()) {
        const bilan = { erreurs: erreurs.reduce((a, b) => a + b, 0), vues: vues.filter(Boolean).length, codes: codes.slice(), aides: aidesVues, html: ecrire(T, signe) };
        if (opts.onFini) opts.onFini(bilan);
        if (api && !parMoteur) api.reussi();
      }
    }
    // réponse de l'étape en cours (les étapes déjà faites sont justes)
    function montrerEtape() {
      if (libre) etape = 3;
      T = reel(ref.etapes[etape], inv).map(t => Object.assign(t, { base: estCouple(t) && etape > 0 ? base0(t.role) : 0 }));
      reussir(true);
    }
    // état de départ : demi-équation vide, ou déjà faite jusqu'à l'étape « depart »
    function reprendre() {
      T = depart ? reel(ref.etapes[depart - 1], inv).map(t => Object.assign(t, { base: estCouple(t) ? base0(t.role) : 0 })) : [];
      etape = depart; erreurs = [0, 0, 0, 0]; vues = [false, false, false, false]; codes = [];
      retour('');
      rendre();
    }

    $('.ox-valider').onclick = valider;
    $('.ox-b-inv').onclick = inverser;
    $('.ox-b-montrer').onclick = () => { if (!fini()) montrerEtape(); };
    $('.ox-b-zero').onclick = reprendre;
    $('.ox-b-aides').onclick = basculerAides;
    if (modeAides === 'ouvertes') aides = aidesVues = true;
    reprendre();
    return {
      reprendre,
      // toute la réponse (« Afficher la réponse » d'un cours ou d'une série)
      montrer() { parMoteur = true; while (!fini()) montrerEtape(); },
    };
  }

  /* Partie « perso » des moteurs de questions (cours : assets/cours.js ; séries : OX.question)
     o = { couple, q, serie (true : erreurs et aides payantes comptées, réponse donnée par le moteur),
           et les options de l'outil : mode, depart, jusqua, sens, reactif, inverser, explique, aides, onFini, onErreur }
     Dans un cours, l'outil affiche lui-même ses messages ; dans une série, le dernier passe
     dans celui du moteur. « Afficher la réponse » du moteur complète toute la demi-équation. */
  function partie(o) {
    const serie = !!o.serie;
    const def = serie ? { compter: true, montrerEtape: false, final: false, recommencer: false } : { compter: false };
    const p = {
      type: 'perso', outil: 'demi', o,
      q: o.q || `Équilibre la demi-équation du couple ${html(o.couple.ox)} / ${html(o.couple.red)}.`,
      solution: '',
    };
    p.monter = (zone, api) => outil(zone, Object.assign(def, o, { api, part: p }));
    return p;
  }

  window.DEMI = {
    outil, partie, solution, verifier, ecrire, DIFFICULTES, ETAPES,
    // petits outils communs avec l'écriture des réactions (reaction.js)
    outils: { EAU, HP, E, ORDRE, MAX, pgcd, q, compo, atomes, charges, autres, fq, kf, html, texte, trier, reel },
  };
})();
