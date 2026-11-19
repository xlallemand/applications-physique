/* ============================================================
   Module 1 : les rayons particuliers (manipulation guidée)
   LT.manipRayons(zone)
   Situation 1 : placer les foyers F′ puis F (f′ = 3 cm), puis, pour une lentille
     de 25 δ, écrire f′ = 1 / 25 = 0,04 m = 4 cm avant de placer F′ et F.
   Situations 2 à 7 : un rayon incident est dessiné (parallèle à l'axe, passant par O,
     passant par F, au-dessus ou au-dessous de l'axe) ; l'élève trace le rayon émergent
     en glissant un point par où il passe (LT.tracer).
   Bilan : les trois règles, avec la figure.
   Quadrillage : 1 carreau = 1 cm.
   ============================================================ */
(function () {
  'use strict';

  const V = OPT.V, T = LT.TYPES, fmt = LT.fmt;
  const CADRE = { xmin: -10, xmax: 10, ymax: 4.5 };

  // situations 2 à 7 : type de rayon, lentille, point de départ du rayon incident (carreaux)
  const RAYONS = [
    { type: 'parallele', f: 3, A: [-10, 2], titre: 'Un rayon parallèle à l\'axe optique' },
    { type: 'centre', f: 3, A: [-9, 3], titre: 'Un rayon qui passe par le centre optique O' },
    { type: 'foyer', f: 3, A: [-9, 2], titre: 'Un rayon qui passe par le foyer objet F' },
    { type: 'parallele', f: 4, A: [-10, -2], titre: 'Un rayon parallèle à l\'axe, sous l\'axe' },
    { type: 'foyer', f: 4, A: [-8, -2], titre: 'Un rayon qui passe par F en montant' },
    { type: 'centre', f: 4, A: [-8, -2], titre: 'Un rayon qui passe par O en montant' },
  ];
  const lentilleTxt = f => (f === 3 ? 'Lentille de distance focale f′ = 3 cm.' : 'Lentille de 25 δ : f′ = 1 / 25 = 0,04 m = 4 cm.');

  // flèche « sens de la lumière » en haut à gauche de la figure
  function sensLumiere(F) {
    const y = F.ymax - 0.6, x = F.xmin + 0.4;
    F.S.fleche('textes', F.c([x, y]), F.c([x + 2.2, y]), 'opt-objet lt-sens');
    F.S.texte('textes', F.c([x + 2.5, y]), 'sens de la lumière', { ancre: 'start', taille: 12, cls: 'lt-g-txt' });
  }

  /* ============================================================
     Pas à pas dans une situation : une consigne à la fois
     pas = [{ texte, entrer(cmd, api) → { montrer(), quitter() } }]
     api = { ok(h), erreur(h), message(h), suivant(h, vue) }
     ============================================================ */
  function pasAPas(cmd, pas, o) {
    cmd.innerHTML = `<div class="lt-consigne" aria-live="polite"></div><div class="lt-cmd"></div>
      <div class="lt-retour" aria-live="polite"></div><div class="lt-aide" hidden><button type="button" class="btn-small">Afficher la réponse</button></div>`;
    const $c = cmd.querySelector('.lt-consigne'), $cmd = cmd.querySelector('.lt-cmd'), $ret = cmd.querySelector('.lt-retour'), $aide = cmd.querySelector('.lt-aide');
    let k = -1, erreurs = 0, courant = null, vues = 0;
    const api = {
      erreur(h) {
        erreurs++;
        $ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h}</p>${erreurs >= 2 ? '<p class="er-petit">Corrige ta réponse, ou affiche la réponse.</p>' : ''}</div>`;
        if (erreurs >= 2) $aide.hidden = false;
        LT.defiler($ret);
      },
      message(h) { $ret.innerHTML = `<p class="ph-msg">${h}</p>`; LT.defiler($ret); },
      effacer() { $ret.innerHTML = ''; },
      suivant(h, vue) {
        if (courant && courant.quitter) courant.quitter();
        $cmd.innerHTML = ''; $aide.hidden = true;
        if (vue) { vues++; $ret.innerHTML = `<div class="callout er-retour"><p><b>Réponse.</b> ${h || ''}</p></div>`; }
        else $ret.innerHTML = `<div class="callout-success er-retour"><p><b class="er-ok">${erreurs ? 'C\'est juste.' : 'Juste !'}</b> ${h || ''}</p></div>`;
        entrer(k + 1);
      },
    };
    $aide.querySelector('button').onclick = () => { if (courant && courant.montrer) courant.montrer(); };
    function entrer(n) {
      k = n; erreurs = 0;
      if (o.surEtape) o.surEtape(k);
      if (k >= pas.length) { $c.innerHTML = ''; o.surFin(vues); return; }
      $c.innerHTML = `<p>${pas[k].texte}</p>`;
      courant = pas[k].entrer($cmd, api);
    }
    entrer(0);
  }

  /* ---------- Placer un foyer : toucher l'axe optique ---------- */
  function placerFoyer(F, cmd, api, quel, etat, f, unite) {
    cmd.innerHTML = `<p class="lt-aide-t">Touche l'axe optique à l'endroit du foyer ${quel === 'Fi' ? 'image F′' : 'objet F'}.</p>`;
    const nom = quel === 'Fi' ? 'F′' : 'F', bon = quel === 'Fi' ? f : -f;
    let actif = true;
    const fin = vue => {
      actif = false;
      etat[quel] = bon; dessinerFoyers(F, etat);
      api.suivant(quel === 'Fi' ? `F′, le foyer image, est du côté où sort la lumière, à f′ = ${f} cm de O.` : `F et F′ sont symétriques par rapport à O : OF = OF′ = ${f} cm.`, vue);
    };
    OPT.surAppui(F.S.svg, evt => {
      if (!actif) return;
      const p = F.toucher(evt);
      if (Math.abs(p[1]) > 0.8) { api.message('Touche l\'axe optique : les foyers sont sur l\'axe.'); return; }
      const x = Math.round(p[0]);
      if (x === bon) { fin(); return; }
      if (x === 0) { api.message('Ce point est le centre optique O. Touche l\'axe à l\'endroit du foyer.'); return; }
      // l'essai reste visible, en pointillés
      etat.essai = { x, nom }; dessinerFoyers(F, etat);
      if (quel === 'Fi') {
        if (x === -f) api.erreur('F′, foyer image, est du côté où sort la lumière.');
        else api.erreur(`f′ = OF′ = ${f} cm : sur ce quadrillage, 1 carreau = 1 cm${unite ? ` ; ${unite}` : ''}.`);
      } else if (x === f) api.erreur('F′ est déjà de ce côté : F est de l\'autre côté de la lentille.');
      else api.erreur(`F et F′ sont symétriques par rapport à O : OF = OF′ = ${f} cm.`);
    });
    return { montrer: () => fin(true), quitter() { actif = false; etat.essai = null; dessinerFoyers(F, etat); } };
  }
  function dessinerFoyers(F, etat) {
    const S = F.S;
    S.vider('cibles');
    const trait = (x, nom, cls) => {
      S.ligne('cibles', F.c([x, -0.28]), F.c([x, 0.28]), cls);
      S.texte('cibles', F.c([x, -0.7]), nom, { cls: 'opt-nom-pt' });
    };
    if (etat.Fi != null) trait(etat.Fi, 'F′', 'opt-foyer');
    if (etat.Fo != null) trait(etat.Fo, 'F', 'opt-foyer');
    if (etat.essai) trait(etat.essai.x, etat.essai.nom + ' ?', 'lt-foyer-essai');
  }

  /* ---------- Situation 1 : les foyers ---------- */
  function situationFoyers(carte, num, total, passer, finie) {
    carte.innerHTML = tete('Placer les foyers F et F′', num, total) + corps('<p class="lt-fig-t" data-a="txt"></p><div class="lt-fig"></div>');
    const figZ = carte.querySelector('.lt-fig'), txt = carte.querySelector('[data-a="txt"]');
    let F = null;
    const etat = {};
    function nouvelleFigure(f, texte) {
      figZ.innerHTML = ''; txt.innerHTML = texte;
      F = LT.figure(figZ, Object.assign({ f, foyers: false, aria: 'Lentille convergente, axe optique et centre optique O ; les foyers sont à placer' }, CADRE));
      sensLumiere(F);
      etat.Fi = etat.Fo = null; etat.essai = null;
    }
    nouvelleFigure(3, 'Lentille convergente de distance focale <b>f′ = 3 cm</b>. Quadrillage : 1 carreau = 1 cm.');
    const pas = [
      { texte: 'Place le foyer image F′ (f′ = 3 cm).', entrer: (cmd, api) => placerFoyer(F, cmd, api, 'Fi', etat, 3) },
      { texte: 'Place le foyer objet F.', entrer: (cmd, api) => placerFoyer(F, cmd, api, 'Fo', etat, 3) },
      { texte: 'Nouvelle lentille, de <b>25 δ</b> : calcule sa distance focale f′.', entrer: (cmd, api) => {
        nouvelleFigure(4, 'Lentille convergente de vergence <b>v = 25 δ</b>. Quadrillage : 1 carreau = 1 cm.');
        return distanceFocale(cmd, api);
      } },
      { texte: 'Place le foyer image F′ de la lentille de 25 δ.', entrer: (cmd, api) => placerFoyer(F, cmd, api, 'Fi', etat, 4, 'f′ = 0,04 m = 4 cm : 4 carreaux') },
      { texte: 'Place le foyer objet F.', entrer: (cmd, api) => placerFoyer(F, cmd, api, 'Fo', etat, 4) },
    ];
    lancer(carte, pas, finie, 'Les foyers F et F′ sont symétriques par rapport au centre optique O ; F′ est du côté où sort la lumière. Avec une vergence, f′ = 1 / v, en mètres, puis en centimètres.');
  }
  // f′ = 1 / 25 = 0,04 m, puis 4 cm (deux saisies successives)
  function distanceFocale(cmd, api) {
    const zq = LT.el('div');
    cmd.appendChild(zq);
    LT.question(zq, { parties: [
      { type: 'nombre', q: 'La vergence v (en dioptries δ) et la distance focale f′ (en mètres) sont liées par <b>v = 1 / f′</b>, donc f′ = 1 / v.',
        label: 'f′ = 1 / 25 =', unite: 'm', calc: true, aria: 'f′ en mètres',
        verifier: v => Math.abs(v - 0.04) < 1e-9 ? { ok: true }
          : Math.abs(v - 4) < 1e-9 ? { diag: 'f′ = 1 / v donne des <b>mètres</b> : 1 / 25 = 0,04 m.' }
          : Math.abs(v - 25) < 1e-9 ? { diag: 'f′ = 1 / v : divise 1 par 25.' }
          : { diag: 'Calcule 1 / 25 à la calculatrice : f′ est en mètres.' },
        remplir: i => { i.value = '0,04'; } },
      { type: 'nombre', q: 'Le quadrillage est en centimètres : convertis f′.', label: 'f′ = 0,04 m =', unite: 'cm', aria: 'f′ en centimètres',
        verifier: v => Math.abs(v - 4) < 1e-9 ? { ok: true }
          : Math.abs(v - 0.04) < 1e-9 ? { diag: 'f′ = 0,04 m = 4 cm : 4 carreaux. Écris f′ en centimètres.' }
          : Math.abs(v - 0.4) < 1e-9 || Math.abs(v - 40) < 1e-9 ? { diag: '1 m = 100 cm : 0,04 m = 0,04 × 100 cm.' }
          : { diag: '1 m = 100 cm : multiplie par 100.' },
        remplir: i => { i.value = '4'; }, solution: LT.revois(['conversions']) },
    ] }, { fin: p => { setTimeout(() => api.suivant('v = 25 δ, f′ = 1 / v = 1 / 25 = 0,04 m = 4 cm.', p === 0), 600); } }, 'manip');
    return { montrer() { /* la question a son propre bouton « Afficher la réponse » */ } };
  }

  /* ---------- Situations 2 à 7 : tracer le rayon émergent ---------- */
  function situationRayon(carte, num, total, r, finie) {
    carte.innerHTML = tete(r.titre, num, total) + corps(`<p class="lt-fig-t">${lentilleTxt(r.f)} Quadrillage : 1 carreau = 1 cm.</p><div class="lt-fig"></div>`);
    const F = LT.figure(carte.querySelector('.lt-fig'), Object.assign({ f: r.f, aria: `Lentille convergente, foyers F et F′ ; un rayon incident ${T[r.type].label} arrive sur la lentille` }, CADRE));
    sensLumiere(F);
    // rayon incident (de A jusqu'à la lentille)
    const ray = r.type === 'parallele' ? { I: [0, r.A[1]], d: [1, 0] } : r.type === 'centre' ? { I: [0, 0], d: V.norm(V.sub([0, 0], r.A)) }
      : (() => { const d = V.norm(V.sub([-r.f, 0], r.A)); return { I: OPT.intersection(r.A, d, [0, 0], [0, 1]), d }; })();
    const e = OPT.emergent([0, 0], r.f, ray.I, ray.d);
    F.rayon('rayons', r.A, ray.I);
    F.point('textes', ray.I, '', { cls: 'lt-pt-I' });
    const pas = [{ texte: `Trace le rayon qui sort de la lentille. Le rayon incident est ${T[r.type].label}.`, entrer: (cmd, api) => LT.tracer(F, cmd, {
      I: ray.I, sens: 'aval', juste: e, diag: () => T[r.type].diag, diagCote: LT.diagFoyer(r.f, 'aval', r.type, T),
      surJuste(vue) { F.rayon('rayons', ray.I, F.bord(ray.I, e)); api.suivant(T[r.type].regle, vue); },
      surErreur: d => api.erreur(d),
    }) }];
    lancer(carte, pas, finie, T[r.type].regle);
  }

  /* ---------- En-tête et corps d'une situation ---------- */
  const tete = (titre, n, total) => `<div class="lt-sit-tete"><h3 class="lt-sit-titre">${titre}</h3><span class="lt-sit-num">Situation ${n} / ${total}</span></div>`;
  const corps = fig => `<div class="lt-manip"><div class="lt-manip-fig">${fig}</div>
      <div class="lt-manip-panneau"><ol class="lt-deroule lt-deroule-court" data-a="deroule"></ol><div class="lt-cmd-zone"></div><div data-a="suite"></div>
        <div class="lt-aide-ligne"><button type="button" class="btn-small lt-b-passer" data-a="passer"></button></div></div></div>`;
  // déroulé de la situation : liste des consignes, pas à pas, puis « Situation suivante → »
  function lancer(carte, pas, finie, bilan) {
    const ol = carte.querySelector('[data-a="deroule"]');
    ol.innerHTML = pas.length > 1 ? pas.map(p => `<li><span>${p.texte}</span></li>`).join('') : '';
    const lis = Array.from(ol.children);
    pasAPas(carte.querySelector('.lt-cmd-zone'), pas, {
      surEtape(k) {
        lis.forEach((li, i) => { li.classList.toggle('fait', i < k); li.classList.toggle('ici', i === k); li.classList.toggle('avenir', i > k); });
        if (k > 0 && k < pas.length) LT.amener(carte.querySelector(LT.surOrdi() ? '.lt-manip' : '.lt-manip-fig'), 0.35);
      },
      surFin(vues) { finie(bilan, vues); },
    });
  }

  /* ---------- Figure du bilan : les trois rayons issus de B ---------- */
  function figureBilan(zone) {
    const f = 3, B = [-7, 2];
    const F = LT.figure(zone, { f, xmin: -9, xmax: 9, ymax: 4, aria: 'Les trois rayons particuliers issus du point B d\'un objet' });
    F.fleche('textes', [B[0], 0], B, 'opt-objet');
    F.point('textes', B, 'B', { cls: 'lt-rien', dx: -0.4, dy: 0.4 });
    ['parallele', 'centre', 'foyer'].forEach(t => {
      const r = LT.particulier(f, B, t);
      F.rayon('rayons', B, r.I);
      F.rayon('rayons', r.I, F.bord(r.I, r.e));
    });
    const Bi = [OPT.conjuguer(B[0], f), B[1] * OPT.conjuguer(B[0], f) / B[0]];
    F.fleche('textes', [Bi[0], 0], Bi, 'opt-image');
    F.point('textes', Bi, 'B′', { cls: 'lt-rien', dx: 0.5, dy: -0.3 });
    return F;
  }
  function reglesHTML() {
    return `<ol class="lt-regles"><li>${T.centre.regle}</li><li>${T.parallele.regle}</li><li>${T.foyer.regle}</li></ol>`;
  }

  /* ============================================================
     PAGE DU MODULE 1
     ============================================================ */
  function manipRayons(zone) {
    const total = 1 + RAYONS.length;
    let num = 0, faites = 0;
    function afficher() {
      zone.innerHTML = '';
      window.scrollTo(0, 0);
      if (num >= total) { fin(); return; }
      const carte = LT.el('div', 'er-card');
      zone.appendChild(carte);
      // fin d'une situation : bilan et « Situation suivante → »
      const finie = (bilan, vues) => {
        faites++;
        const passer = carte.querySelector('[data-a="passer"]');
        if (passer) passer.parentNode.remove();
        const s = carte.querySelector('[data-a="suite"]');
        s.innerHTML = `<div class="callout-accent lt-complet"><p><b>À retenir.</b> ${bilan}</p></div>
          <div class="er-actions"><button type="button" class="btn-primary">${num < total - 1 ? 'Situation suivante →' : 'Voir le bilan →'}</button></div>`;
        s.querySelector('button').onclick = () => { num++; afficher(); };
        LT.defiler(s);
      };
      if (num === 0) situationFoyers(carte, 1, total, null, finie);
      else situationRayon(carte, num + 1, total, RAYONS[num - 1], finie);
      // passer à la situation suivante sans finir celle-ci
      const passer = carte.querySelector('[data-a="passer"]');
      passer.textContent = num < total - 1 ? 'Situation suivante →' : 'Voir le bilan →';
      passer.onclick = () => { num++; afficher(); };
    }
    function fin() {
      if (faites >= total) SOM.marquer({ fait: true });
      const carte = LT.el('div', 'er-card');
      carte.innerHTML = `<span class="er-badge">BILAN</span><h3 class="lt-sit-titre" style="margin-top:8px">Les trois rayons particuliers</h3>
        <p class="er-contexte" style="margin-top:6px">${faites >= total ? `Tu as réussi les ${total} situations.` : `Tu as fait ${faites} situation${faites > 1 ? 's' : ''} sur ${total} : refais celles que tu as passées.`}</p>
        <div class="lt-bilan"><div class="lt-bilan-fig"></div><div class="cle">${reglesHTML()}</div></div>
        <div class="er-actions">
          <button type="button" class="btn-secondary" data-a="re">↺ Recommencer</button>
          <a class="btn-primary" style="text-decoration:none" href="module_2_questions.html">Module 2 : construire l'image →</a>
        </div>`;
      zone.appendChild(carte);
      figureBilan(carte.querySelector('.lt-bilan-fig'));
      carte.querySelector('[data-a="re"]').onclick = () => { num = 0; faites = 0; afficher(); };
    }
    afficher();
  }

  Object.assign(LT, { manipRayons, figureBilan, reglesHTML, sensLumiere, pasAPas });
})();
