/* ============================================================
   Atelier « Bilan des forces » sur un seul écran (application « Bilan des forces »)

   BF.atelier(zone) : toutes les situations de modules/situations.js
   (BF.PARCOURS : par niveau, puis du plus simple au plus difficile),
   chacune accessible à tout moment (pastilles numérotées, filtre de
   niveau : 2de, 1re et Tle), sans points.

   Écran (ordinateur) : à gauche, la situation (titre, énoncé), le schéma
   et le diagramme objet-action côte à côte (l'un sous l'autre si la place
   est plus haute que large), puis les messages ; à droite, un panneau à
   onglets : « Étapes » (l'étape en cours du bilan), « Situations »
   (pastilles, filtre de niveau), « Bilan » (ce qu'il faut retenir).
   Téléphone (< 900 px) : la figure en haut (schéma ou diagramme, au
   choix), le panneau à onglets dessous, dans l'écran.

   Les étapes forment la méthode du cours : elles restent dans l'ordre
   (refus expliqué si l'on touche une étape suivante) :
     1. actions à distance, 2. objets qui touchent le système (diagramme
     objet-action), 3. force de l'air négligeable ou non (si l'air touche
     le système), 4. tracé de chaque force (point de départ : sur le
     schéma ou par un bouton ; direction et sens : flèches, directions
     propres, ou glisser depuis le point), 5. noms, 6. compensation.
   Règles et diagnostics : ceux de BF.bilan (BF.verif). « Afficher la
   réponse » est proposé après une erreur.
   1re et Terminale : bouton « R⃗ = R⃗ₙ + f⃗ » : la réaction de chaque support
   est dessinée (en noir, avec le parallélogramme) une fois le tracé fait.

   Situations réussies gardées dans le navigateur (clé bilan-forces-atelier) ;
   page faite quand toutes les situations sont réussies, ou à l'ouverture
   de l'onglet « Bilan ».
   ============================================================ */
(function () {
  'use strict';

  const B = window.BF;
  const { el, cap, melanger, secouer, nomV, scene, diagrammeDe, sceneRemplie, couleursForces, reactions, reactionsSVG,
    verif, DIST, OPTS_AIR, DIRS8, DIR_TXT, texteDir, ecartAngle, sorteDist, HS } = B;
  const S = B.SITUATIONS, ORDRE = B.PARCOURS;
  const CLE = 'bilan-forces-atelier';
  function lireFaits() { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } }
  function noterFait(id) { try { const r = lireFaits(); r[id] = true; localStorage.setItem(CLE, JSON.stringify(r)); } catch (e) { /* stockage indisponible */ } }

  const ETAPES = { dist: 'Actions à distance', contact: 'Objets qui touchent', air: 'Force de l\'air', trace: 'Tracé des forces', noms: 'Noms des forces', comp: 'Compensation' };
  const lieu = p => (p === 'G' ? 'le centre G' : 'le point ' + p);

  function atelier(zone) {
    zone.innerHTML = `<div class="bf-at">
      <div class="er-card bf-at-tete">
        <div class="bf-at-titre"><span class="er-badge">MODULE 6 · ATELIER</span><h2 class="er-titre">Bilan des forces</h2></div>
        <span data-plein></span>
      </div>
      <div class="bf-at-corps">
        <div class="er-card bf-at-scene">
          <div class="bf-at-sit">
            <p class="bf-at-sit-t"><span data-a="num"></span><span class="bf-niv" data-a="niv"></span><b data-a="titre"></b></p>
            <p class="bf-at-enonce" data-a="enonce"></p>
          </div>
          <div class="bf-at-outils">
            <div class="bf-at-vue" role="group" aria-label="Figure affichée"><button type="button" data-vue="schema" aria-pressed="true">Schéma</button><button type="button" data-vue="do" aria-pressed="false">Diagramme</button></div>
            <button type="button" class="bf-at-r" data-a="optR" aria-pressed="false" hidden><span class="vec-nom">R</span> = <span class="vec-nom">R</span><sub>N</sub> + <span class="vec-nom">f</span> <span class="bf-niv">1re et Tle</span></button>
          </div>
          <div class="bf-at-figs" data-a="figs">
            <div class="bf-at-fig bf-at-sc" data-a="sc"></div>
            <div class="bf-at-fig bf-at-do" data-a="do"></div>
          </div>
          <div class="bf-at-msg" data-a="msg" aria-live="polite"></div>
        </div>
        <aside class="er-card bf-at-panneau" aria-label="Bilan des forces">
          <div class="bf-at-onglets" role="tablist">
            <button type="button" role="tab" data-o="etapes" aria-selected="true">Étapes</button>
            <button type="button" role="tab" data-o="situations" aria-selected="false">Situations</button>
            <button type="button" role="tab" data-o="bilan" aria-selected="false">Bilan</button>
          </div>
          <section class="bf-at-bloc" data-s="etapes"></section>
          <section class="bf-at-bloc" data-s="situations"></section>
          <section class="bf-at-bloc" data-s="bilan"></section>
        </aside>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const blocEtapes = zone.querySelector('[data-s="etapes"]'), blocSits = zone.querySelector('[data-s="situations"]'), blocBilan = zone.querySelector('[data-s="bilan"]');
    const tel = matchMedia('(max-width: 899px)');
    let marque = false;
    const marquerPage = () => { if (!marque) { marque = true; B.marquer({ fait: true }); } };

    /* ---------- onglets du panneau ---------- */
    function onglet(o) {
      zone.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-selected', b.dataset.o === o ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('actif', s.dataset.s === o));
      if (o === 'bilan') marquerPage();
    }
    zone.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    onglet('etapes');

    /* ---------- bouton plein écran : dans l'en-tête, au bout des onglets sur téléphone ---------- */
    function placerPlein() {
      const pe = zone.querySelector('.pe-bouton');
      if (pe) (tel.matches ? zone.querySelector('.bf-at-onglets') : zone.querySelector('.bf-at-tete')).appendChild(pe);
    }
    setTimeout(placerPlein, 0);
    if (tel.addEventListener) tel.addEventListener('change', () => { placerPlein(); vueAuto(); }); else tel.addListener(placerPlein);

    /* ---------- Bilan (ce qu'il faut retenir) ---------- */
    blocBilan.innerHTML = `<div class="bf-at-retenir">
      <p><b>Diagramme objet-action</b> : le système au centre ; la Terre (toujours), plus rarement un aimant ou un objet électrisé : trait en pointillés ; une bulle pour <b>chaque objet qui touche</b> le système, l'air compris : trait plein ; trait barré : force négligeable.</p>
      <p><b>Tracé</b> : une force à distance part du centre G ; une force de contact, du point de contact. Pour chacune : direction, sens, nom.</p>
      <p><b>Air</b> : force négligée, sauf frottements (${nomV('Fair')}) ou poussée d'Archimède (${nomV('Farchi')}) non négligeables.</p>
      <p><b>Support</b> : sans frottement, réaction perpendiculaire au support ; ${nomV('R')} = ${nomV('RN')} + ${nomV('f')}, ${nomV('f')} opposée au glissement qu'il y aurait sans frottement.</p>
      <p><b>Pièges</b> : un objet qui ne touche plus le système n'exerce plus de force ; le moteur ou les freins font partie de la voiture.</p>
      <p><b>Compensation</b> : somme nulle ⇔ immobile ou mouvement rectiligne uniforme.</p></div>
      <a class="btn-primary bf-at-suite" href="module_6_questions.html">Questions de synthèse →</a>`;

    /* ---------- Situations : pastilles par niveau, filtre ---------- */
    let filtre = 'tous';
    function dessinerSits() {
      const faits = lireFaits(), nbFaits = ORDRE.filter(id => faits[id]).length;
      blocSits.innerHTML = `<div class="bf-at-filtre" role="group" aria-label="Niveau">${[{ id: 'tous', nom: 'Tous' }].concat(B.NIVEAUX).map(n => `<button type="button" data-f="${n.id}" aria-pressed="${filtre === n.id}">${n.nom}</button>`).join('')}</div>
        <p class="bf-at-compte">${nbFaits} / ${ORDRE.length} situations réussies</p>
        ${B.NIVEAUX.filter(n => filtre === 'tous' || filtre === n.id).map(n => `<div class="bf-at-groupe"><p class="bf-at-groupe-t">${n.nom}</p><div class="bf-at-pastilles">${ORDRE.map((id, k) => (S[id].niv !== n.id ? '' :
          `<button type="button" data-k="${k}" class="${faits[id] ? 'fait' : ''}" aria-current="${k === courant}" title="${S[id].titre}" aria-label="Situation ${k + 1} : ${S[id].titre}${faits[id] ? ', réussie' : ''}">${faits[id] ? '✓' : k + 1}</button>`)).join('')}</div></div>`).join('')}
        <p class="bf-at-ici">Situation ${courant + 1} : ${S[ORDRE[courant]].titre}</p>`;
      blocSits.querySelectorAll('[data-f]').forEach(b => { b.onclick = () => { filtre = b.dataset.f; dessinerSits(); }; });
      blocSits.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { charger(+b.dataset.k); onglet('etapes'); }; });
    }
    // situation suivante dans l'ordre du filtre (une pas encore réussie de préférence)
    function suivante() {
      const faits = lireFaits(), liste = ORDRE.map((id, k) => k).filter(k => filtre === 'tous' || S[ORDRE[k]].niv === filtre);
      const apres = liste.filter(k => k > courant).concat(liste.filter(k => k <= courant));
      return apres.find(k => !faits[ORDRE[k]] && k !== courant) ?? apres[0];
    }

    /* ---------- figure : schéma et diagramme objet-action ---------- */
    const figs = $('figs'), scZ = $('sc'), doZ = $('do');
    let vue = 'schema', vueChoisie = false;
    function montrerVue() {
      zone.querySelectorAll('[data-vue]').forEach(b => b.setAttribute('aria-pressed', b.dataset.vue === vue ? 'true' : 'false'));
      figs.dataset.vue = vue;
    }
    zone.querySelectorAll('[data-vue]').forEach(b => { b.onclick = () => { vue = b.dataset.vue; vueChoisie = true; montrerVue(); }; });
    // téléphone : le diagramme pendant qu'on le construit, le schéma ensuite (sauf choix de l'élève)
    function vueAuto() {
      if (!vueChoisie) vue = ['dist', 'contact', 'air'].indexOf(st && st.etape) !== -1 ? 'do' : 'schema';
      montrerVue();
    }
    // côte à côte si la place est plus large que haute, l'un sous l'autre sinon
    const disposer = () => { figs.classList.toggle('pile', figs.clientWidth < 1.3 * figs.clientHeight); };
    if (window.ResizeObserver) new ResizeObserver(disposer).observe(figs); else addEventListener('resize', disposer);

    /* ---------- message sous la figure ---------- */
    function message(h, type) {
      const m = $('msg');
      if (!h) { m.innerHTML = ''; return; }
      const cls = type === 'ko' ? 'callout-danger' : type === 'ok' ? 'callout-success' : type === 'rep' ? 'callout' : 'callout-accent';
      m.innerHTML = `<div class="${cls} bf-at-msg-in">${h}</div>`;
    }
    // après une validation, le message reste visible (téléphone : la figure est au-dessus du panneau)
    const voir = () => { if (tel.matches) setTimeout(() => $('msg').scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60); };

    /* ---------- option « R⃗ = R⃗ₙ + f⃗ » (1re et Terminale) ---------- */
    let optR = false;
    $('optR').onclick = () => { optR = !optR; $('optR').setAttribute('aria-pressed', optR ? 'true' : 'false'); dessiner(); };

    /* ============================================================
       UNE SITUATION
       ============================================================ */
    let courant = 0, s = null, st = null, cols = [];
    function charger(k) {
      courant = k; s = S[ORDRE[k]]; cols = couleursForces(s.forces);
      const etapes = ['dist'];
      if (verif.objets(s).length) etapes.push('contact');
      if (s.air) etapes.push('air');
      etapes.push('trace', 'noms');
      if (s.comp) etapes.push('comp');
      st = { etapes, etape: 'dist', dist: [], contacts: [], distOk: false, contactOk: false, air: null, erreurs: 0, sel: 0, fini: false,
        pos: s.forces.map(() => ({ pt: null, ang: null, etat: '', ok: false })), noms: s.forces.map(() => null), objets: melanger(verif.objets(s)) };
      $('num').textContent = `Situation ${k + 1} / ${ORDRE.length}`;
      $('niv').textContent = B.NIVEAUX.find(n => n.id === s.niv).nom;
      $('titre').textContent = s.titre;
      $('enonce').textContent = s.enonce || '';
      $('optR').hidden = !reactions(s).length;
      vueChoisie = false;
      message('');
      etape(st.etape);
      dessinerSits();
    }
    // bulles du diagramme dessinées par l'élève (comme BF.bilan)
    const distants = () => verif.distants(s), contacts = () => verif.contacts(s);
    function etatDO() {
      return {
        bulles: () => (st.distOk ? distants() : DIST.filter(x => st.dist.indexOf(x.id) !== -1).map(x => distants().find(a => sorteDist(s, a) === x.id) || { id: '_' + x.id, nom: x.court }))
          .map(a => ({ a, type: 'distance' }))
          .concat((st.contactOk ? contacts() : st.contacts.map(id => verif.objets(s).find(x => x.id === id))).map(a => ({ a, type: 'contact' }))),
        air: st.air, noms: st.noms,
      };
    }
    const avant = e => st.etapes.indexOf(st.etape) < st.etapes.indexOf(e);
    function dessiner() {
      doZ.innerHTML = st.fini ? diagrammeDe(s) : diagrammeDe(s, etatDO());
      const traceFait = !avant('noms');
      // réaction R⃗ = R⃗ₙ + f⃗ : une fois le tracé fait
      const dessus = optR && traceFait ? reactionsSVG(s) : '';
      if (st.fini) { scZ.innerHTML = sceneRemplie(s, { dessus }); return; }
      if (st.etape === 'trace') {
        scZ.innerHTML = scene(s, { forces: st.pos.map((p, i) => ({ pt: p.pt, ang: p.ang, num: i + 1, coul: cols[i], cote: s.forces[i].cote, L: s.forces[i].L, etat: p.etat || (i === st.sel ? 'actif' : '') })),
          points: true, actif: st.pos[st.sel].pt, aria: `${s.titre} : forces à tracer` });
      } else if (traceFait) {
        // positions choisies par l'élève (points et directions acceptés)
        scZ.innerHTML = scene(s, { forces: s.forces.map((f, i) => ({ pt: st.pos[i].pt || f.pts[0], ang: st.pos[i].ang == null ? f.angs[0] : st.pos[i].ang, nom: st.noms[i], num: i + 1, coul: cols[i], cote: f.cote, L: f.L })),
          marques: Object.keys(s.points), dessus, aria: `${s.titre} : forces tracées` });
      } else {
        scZ.innerHTML = scene(s, { aria: s.titre });
      }
    }

    /* ---------- l'étape en cours, dans le panneau ---------- */
    function etape(e) {
      st.etape = e; st.erreurs = 0;
      vueAuto();
      const n = st.etapes.indexOf(e);
      const puces = st.etapes.map((x, i) => `<button type="button" class="bf-at-puce${i < n || st.fini ? ' fait' : ''}${i === n && !st.fini ? ' ici' : ''}" data-e="${x}" aria-label="Étape ${i + 1} : ${ETAPES[x]}${i < n || st.fini ? ', faite' : ''}">${i < n || st.fini ? '✓' : i + 1}</button>`).join('');
      const tete = `<div class="bf-at-etapes"><div class="bf-at-puces" role="group" aria-label="Étapes du bilan">${puces}</div>
        <p class="bf-at-etape-t">${st.fini ? 'Bilan terminé' : `Étape ${n + 1} / ${st.etapes.length} : ${ETAPES[e]}`}</p></div>`;
      blocEtapes.innerHTML = tete + '<div class="bf-at-corps-etape" data-a="etape"></div><div class="bf-at-actions" data-a="actions"></div>';
      blocEtapes.dataset.etape = st.fini ? 'fin' : e;
      blocEtapes.querySelectorAll('[data-e]').forEach(b => {
        b.onclick = () => {
          const i = st.etapes.indexOf(b.dataset.e);
          if (st.fini || i <= n) return;
          message(`Fais les étapes dans l'ordre de la méthode : d'abord l'étape ${n + 1} (${ETAPES[e].toLowerCase()}).`, 'info');
        };
      });
      const z = blocEtapes.querySelector('[data-a="etape"]');
      if (st.fini) return finie(z);
      ({ dist: etDist, contact: etContact, air: etAir, trace: etTrace, noms: etNoms, comp: etComp })[e](z);
      dessiner();
    }
    // boutons « Valider » et « Afficher la réponse » (après une erreur)
    function actions(valider, montrer) {
      const a = blocEtapes.querySelector('[data-a="actions"]');
      a.innerHTML = `${valider ? '<button type="button" class="btn-primary" data-b="val">Valider</button>' : ''}<button type="button" class="btn-small" data-b="rep"${st.erreurs ? '' : ' hidden'}>Afficher la réponse</button>`;
      if (valider) a.querySelector('[data-b="val"]').onclick = valider;
      a.querySelector('[data-b="rep"]').onclick = montrer;
    }
    function erreur(h) {
      st.erreurs++;
      const r = blocEtapes.querySelector('[data-b="rep"]');
      if (r) r.hidden = false;
      message(`<p><b class="er-ko">Ce n'est pas ça.</b> ${h}</p>`, 'ko');
      voir();
    }
    // étape réussie (ou réponse affichée) : son explication sous la figure, puis l'étape suivante
    function reussie(sol, vue) {
      message(`<p><b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse' : st.erreurs ? 'C\'est juste.' : 'Juste !'}</b></p>${sol}`, vue ? 'rep' : 'ok');
      const i = st.etapes.indexOf(st.etape);
      if (i < st.etapes.length - 1) etape(st.etapes[i + 1]);
      else { st.fini = true; noterFait(s.id); if (ORDRE.every(id => lireFaits()[id])) marquerPage(); etape(st.etape); dessiner(); dessinerSits(); }
      voir();
    }

    // boutons à cocher : actions à distance, objets qui touchent
    function cocher(z, liste, choisis) {
      z.insertAdjacentHTML('beforeend', `<div class="bf-acts bf-at-acts">${liste.map(a => `<button type="button" class="bf-act" data-id="${a.id}" aria-pressed="${choisis.indexOf(a.id) !== -1}">${cap(a.label || a.nom)}</button>`).join('')}</div>`);
      z.querySelectorAll('.bf-act').forEach(b => {
        b.onclick = () => {
          const oui = b.getAttribute('aria-pressed') !== 'true', k = choisis.indexOf(b.dataset.id);
          b.setAttribute('aria-pressed', oui ? 'true' : 'false');
          if (oui && k === -1) choisis.push(b.dataset.id);
          if (!oui && k !== -1) choisis.splice(k, 1);
          b.classList.remove('ko');
          message('');
          dessiner();
        };
      });
    }

    /* 1. les actions à distance */
    function etDist(z) {
      z.innerHTML = `<p class="bf-at-q">D'abord les actions <b>à distance</b> (trois possibles). Lesquelles s'exercent sur ${s.systeme} ?</p>`;
      cocher(z, DIST, st.dist);
      const sol = `<p>${distants().map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ')}. Dans le diagramme : trait en <b>pointillés</b>.</p>`;
      const finir = vue => { st.distOk = true; st.dist = verif.distance(s, []).presentes.slice(); reussie(sol, vue); };
      actions(() => {
        if (!st.dist.length) { secouer(z); message('Touche les actions à distance qui s\'exercent sur le système, puis valide.', 'info'); return; }
        const r = verif.distance(s, st.dist);
        if (r.ok) { finir(false); return; }
        r.intrus.forEach(k => z.querySelector(`[data-id="${k}"]`).classList.add('ko'));
        erreur('<br>' + r.msg); secouer(z);
      }, () => finir(true));
    }
    /* 2. les objets qui touchent le système */
    function etContact(z) {
      z.innerHTML = `<p class="bf-at-q">Puis une bulle pour <b>chaque objet qui touche</b> ${s.systeme} : chacun donne une force.</p>`;
      cocher(z, st.objets, st.contacts);
      const cs = contacts();
      const sol = `<p>${cs.length ? cs.map(a => `${cap(a.nom)} : ${a.pourquoi}`).join(' ; ') + '. Dans le diagramme : trait <b>plein</b>.' : 'Aucun objet ne touche le système.'}</p>`;
      const finir = vue => { st.contactOk = true; st.contacts = cs.map(a => a.id); reussie(sol, vue); };
      actions(() => {
        if (!st.contacts.length && cs.length) { secouer(z); message('Touche les objets qui touchent le système, puis valide.', 'info'); return; }
        const r = verif.contact(s, st.contacts);
        if (r.ok) { finir(false); return; }
        r.intrus.forEach(k => z.querySelector(`[data-id="${k}"]`).classList.add('ko'));
        erreur('<br>' + r.msg); secouer(z);
      }, () => finir(true));
    }
    /* 3. la force de l'air : négligeable ou non */
    function etAir(z) {
      z.innerHTML = `<p class="bf-at-q">L'air touche le système : peut-on <b>négliger</b> sa force ? (Si oui, son trait est barré.)</p>
        <div class="ph-choix ph-choix-col bf-at-choix">${OPTS_AIR.map(x => `<button type="button" class="btn-secondary" data-id="${x.id}">${x.label}</button>`).join('')}</div>`;
      const sol = `<p>${s.air.raison}</p>`;
      const finir = vue => { st.air = s.air.neglige; reussie(sol, vue); };
      z.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = () => {
          const r = verif.air(s, b.dataset.id);
          if (r.ok) { finir(false); return; }
          b.classList.add('faux'); b.disabled = true;
          erreur(r.msg);
        };
      });
      actions(null, () => finir(true));
    }
    /* 4. le tracé de chaque force */
    function etTrace(z) {
      const pos = st.pos, verrou = i => pos[i].ok;
      const specs = s.speciales || [];
      z.innerHTML = `<p class="bf-at-q">Dessine chaque force du diagramme : <b>point de départ</b>, puis <b>direction</b> et <b>sens</b>.${s.air && s.air.neglige ? ' (Force de l\'air négligée : on ne la dessine pas.)' : ''}</p>
        <div class="bf-at-l1"><div class="bf-at-forces" role="group" aria-label="Force à tracer">${s.forces.map((f, i) => `<button type="button" data-i="${i}" style="--c:${cols[i]}" aria-label="Force ${i + 1} : ${f.lib}">${i + 1}</button>`).join('')}</div>
        <div class="bf-at-pts" role="group" aria-label="Point de départ"><span class="bf-at-lab">Départ</span>${Object.keys(s.points).map(id => `<button type="button" data-pt="${id}" title="${s.nomsPts[id]}" aria-label="Point ${id} : ${s.nomsPts[id]}">${id}</button>`).join('')}</div></div>
        <p class="bf-at-lib" data-a="lib"></p>
        <p class="bf-at-ptnom" data-a="ptnom"></p>
        <div class="bf-at-dirs"><div class="bf-pad" role="group" aria-label="Direction et sens">${DIRS8.map(x => (x ? `<button type="button" data-a2="${x[0]}" aria-label="${DIR_TXT[x[0]]}" title="${DIR_TXT[x[0]]}">${x[1]}</button>` : '<span aria-hidden="true"></span>')).join('')}</div>
          ${specs.length ? `<div class="bf-spec">${specs.map(x => `<button type="button" data-a2="${x.ang}" aria-label="${x.label}" title="${x.label}">${x.court || x.label}</button>`).join('')}</div>` : ''}</div>`;
      function maj() {
        const p = pos[st.sel];
        z.querySelectorAll('.bf-at-forces button').forEach(b => {
          const i = +b.dataset.i, q = pos[i];
          b.classList.toggle('actif', i === st.sel); b.classList.toggle('place', q.pt != null && q.ang != null);
          b.classList.toggle('ok', q.etat === 'ok'); b.classList.toggle('ko', q.etat === 'ko'); b.setAttribute('aria-pressed', i === st.sel ? 'true' : 'false');
        });
        z.querySelector('[data-a="lib"]').innerHTML = `<b>Force ${st.sel + 1}</b> : ${s.forces[st.sel].lib}${p.ok ? ' ✓' : ''}`;
        z.querySelectorAll('[data-pt]').forEach(b => { b.setAttribute('aria-pressed', p.pt === b.dataset.pt ? 'true' : 'false'); b.disabled = verrou(st.sel); });
        z.querySelector('[data-a="ptnom"]').textContent = p.pt ? `${p.pt} : ${s.nomsPts[p.pt]}` : 'Touche le point de départ, sur le schéma ou ci-dessus.';
        z.querySelectorAll('[data-a2]').forEach(b => { b.disabled = verrou(st.sel); b.classList.toggle('choisi', p.ang != null && ecartAngle(+b.dataset.a2, p.ang) < 1); });
        dessiner();
      }
      const prochaine = () => { const k = pos.findIndex((p, i) => i > st.sel && (p.pt == null || p.ang == null)); if (k >= 0) st.sel = k; };
      z.querySelectorAll('.bf-at-forces button').forEach(b => { b.onclick = () => { st.sel = +b.dataset.i; maj(); }; });
      function poserPoint(id) {
        if (verrou(st.sel)) return;
        pos[st.sel].pt = id; pos[st.sel].etat = '';
        message(''); maj();
      }
      z.querySelectorAll('[data-pt]').forEach(b => { b.onclick = () => poserPoint(b.dataset.pt); });
      z.querySelectorAll('[data-a2]').forEach(b => {
        b.onclick = () => {
          if (verrou(st.sel)) return;
          if (pos[st.sel].pt == null) { message(`Choisis d'abord le <b>point de départ</b> de la force ${st.sel + 1}.`, 'info'); secouer(z.querySelector('.bf-at-pts')); return; }
          pos[st.sel].ang = +b.dataset.a2; pos[st.sel].etat = '';
          message(''); prochaine(); maj();
        };
      });
      // sur le schéma : toucher un point, puis glisser (la pointe suit, aimantée sur les directions proposées)
      const angles = DIRS8.filter(Boolean).map(x => x[0]).concat(specs.map(x => x.ang));
      let drag = null;
      const coord = e => { const svg = scZ.querySelector('svg'), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(svg.getScreenCTM().inverse()); return [q.x, q.y]; };
      scZ.ontouchstart = e => { if (st.etape === 'trace' && e.target.closest && e.target.closest('.bf-poignee')) e.preventDefault(); };
      scZ.onpointerdown = e => {
        if (st.etape !== 'trace') return;
        const h = e.target.closest && e.target.closest('.bf-poignee');
        if (!h || drag || verrou(st.sel)) return;
        e.preventDefault();
        poserPoint(h.dataset.pt);
        drag = { id: e.pointerId, bouge: false };
        try { scZ.setPointerCapture(e.pointerId); } catch (_) { /* rien */ }
      };
      scZ.onpointermove = e => {
        if (!drag || e.pointerId !== drag.id || st.etape !== 'trace') return;
        const [x, y] = coord(e), [px, py] = s.points[pos[st.sel].pt];
        if (Math.hypot(x - px, y - py) < 16) return;
        const brut = Math.atan2(py - y, x - px) * 180 / Math.PI;
        const a = angles.reduce((m, v) => (ecartAngle(v, brut) < ecartAngle(m, brut) ? v : m), angles[0]);
        if (pos[st.sel].ang == null || ecartAngle(pos[st.sel].ang, a) > .5) { pos[st.sel].ang = a; pos[st.sel].etat = ''; drag.bouge = true; message(''); maj(); }
      };
      const finDrag = e => {
        if (!drag || e.pointerId !== drag.id) return;
        const bouge = drag.bouge;
        drag = null;
        if (bouge) { prochaine(); maj(); }
      };
      scZ.onpointerup = scZ.onpointercancel = scZ.onlostpointercapture = finDrag;
      // explication courte : le schéma montre les forces ; une force seule est décrite en entier
      const decrire = (f, i) => `${s.forces.length > 1 ? `${i + 1}. ` : ''}${cap(f.lib)} : depuis ${lieu(f.pts[0])}${f.pts.length > 1 ? ` (ou ${f.pts.slice(1).map(lieu).join(', ')})` : ''}, ${texteDir(s, f.angs[0])}.`;
      const finir = vue => {
        if (vue) s.forces.forEach((f, i) => Object.assign(pos[i], { pt: f.pts[0], ang: f.angs[0], ok: true, etat: 'ok' }));
        scZ.onpointerdown = scZ.onpointermove = scZ.ontouchstart = null;
        reussie(s.forces.length <= 2 ? `<p>${s.forces.map(decrire).join('<br>')}</p>`
          : `<p>${vue ? 'Les forces sont dessinées sur le schéma' : `Les ${s.forces.length} forces sont bien tracées`} : à distance depuis le centre G, de contact depuis le point de contact.</p>`, vue);
      };
      actions(() => {
        const manque = pos.findIndex(p => p.pt == null || p.ang == null);
        if (manque >= 0) { st.sel = manque; maj(); secouer(scZ); message(`Trace d'abord la force ${manque + 1} : ${s.forces[manque].lib}.`, 'info'); return; }
        const msgs = [];
        s.forces.forEach((f, i) => {
          const p = pos[i];
          if (p.ok) return;
          const r = verif.force(s, i, p);
          if (r.ok) { p.ok = true; p.etat = 'ok'; return; }
          p.etat = 'ko';
          msgs.push(`☛ <b>Force ${i + 1}</b> (${f.lib}) : ${r.msg}`);
        });
        if (!msgs.length) { finir(false); return; }
        st.sel = pos.findIndex(p => !p.ok);
        maj();
        erreur('<br>' + msgs.join('<br>')); secouer(scZ);
      }, () => finir(true));
      maj();
    }
    /* 5. le nom de chaque force : choisir une force (pastille), puis son nom */
    function etNoms(z) {
      const cands = s.nomsProposes, faux = s.forces.map(() => false);
      st.sel = Math.max(0, st.noms.findIndex(k => !k));
      z.innerHTML = `<p class="bf-at-q">Donne le <b>nom</b> de chaque vecteur force (il s'écrit aussi sur le schéma et sur le diagramme).</p>
        <div class="bf-at-forces" role="group" aria-label="Force à nommer">${s.forces.map((f, i) => `<button type="button" data-i="${i}" style="--c:${cols[i]}" aria-label="Force ${i + 1} : ${f.lib}">${i + 1}</button>`).join('')}</div>
        <p class="bf-at-lib" data-a="lib"></p>
        <div class="bf-nom-ch bf-at-noms" role="group" aria-label="Nom de la force">${cands.map(k => `<button type="button" data-k="${k}" aria-pressed="false">${nomV(k)}</button>`).join('')}</div>`;
      function maj() {
        z.querySelectorAll('.bf-at-forces button').forEach(b => {
          const i = +b.dataset.i;
          b.classList.toggle('actif', i === st.sel); b.classList.toggle('place', !!st.noms[i]); b.classList.toggle('ko', faux[i]);
          b.setAttribute('aria-pressed', i === st.sel ? 'true' : 'false');
          b.innerHTML = st.noms[i] ? `${i + 1}&nbsp;${nomV(st.noms[i])}` : String(i + 1);
        });
        z.querySelector('[data-a="lib"]').innerHTML = `<b>Force ${st.sel + 1}</b> : ${s.forces[st.sel].lib}`;
        z.querySelectorAll('.bf-at-noms button').forEach(b => b.setAttribute('aria-pressed', st.noms[st.sel] === b.dataset.k ? 'true' : 'false'));
        dessiner();
      }
      z.querySelectorAll('.bf-at-forces button').forEach(b => { b.onclick = () => { st.sel = +b.dataset.i; maj(); }; });
      z.querySelectorAll('.bf-at-noms button').forEach(b => {
        b.onclick = () => {
          st.noms[st.sel] = b.dataset.k; faux[st.sel] = false;
          message('');
          // force suivante sans nom
          const k = st.noms.findIndex((n, i) => i > st.sel && !n);
          if (k >= 0) st.sel = k;
          maj();
        };
      });
      const finir = vue => {
        if (vue) s.forces.forEach((f, i) => { if (f.noms.indexOf(st.noms[i]) === -1) st.noms[i] = f.noms[0]; });
        reussie(`<p>${s.forces.length <= 3 ? s.forces.map((f, i) => `${cap(f.lib)} : ${nomV(st.noms[i])}`).join(' ; ') + '.' : 'Les noms sont écrits sur le schéma et sur le diagramme objet-action.'}</p>`, vue);
      };
      actions(() => {
        const sans = st.noms.findIndex(k => !k);
        if (sans >= 0) { st.sel = sans; maj(); secouer(z); message('Choisis un nom pour chaque force.', 'info'); return; }
        const ko = s.forces.map((f, i) => !verif.nom(s, i, st.noms[i]).ok);
        if (!ko.some(Boolean)) { finir(false); return; }
        ko.forEach((x, i) => { faux[i] = x; });
        st.sel = ko.indexOf(true);
        maj();
        erreur('<br>' + ko.map((x, i) => (x ? `☛ <b>Force ${i + 1}</b> : ${verif.nom(s, i, st.noms[i]).msg}` : '')).filter(Boolean).join('<br>'));
        secouer(z);
      }, () => finir(true));
      maj();
    }
    /* 6. les forces se compensent-elles ? */
    function etComp(z) {
      z.innerHTML = `<p class="bf-at-q">${s.comp.q || 'Ces forces se compensent-elles ?'}</p>
        <div class="ph-choix ph-choix-col bf-at-choix"><button type="button" class="btn-secondary" data-id="oui">oui : leur somme est nulle</button><button type="button" class="btn-secondary" data-id="non">non : leur somme n'est pas nulle</button></div>`;
      const sol = `<p>${s.comp.expl}</p>`;
      z.querySelectorAll('[data-id]').forEach(b => {
        b.onclick = () => {
          if (b.dataset.id === s.comp.bonne) { reussie(sol, false); return; }
          b.classList.add('faux'); b.disabled = true;
          erreur(s.comp.indice);
        };
      });
      actions(null, () => reussie(sol, true));
    }
    /* bilan terminé : situation suivante ou refaire */
    function finie(z) {
      const k = suivante(), tous = ORDRE.every(id => lireFaits()[id]);
      z.innerHTML = `<p class="bf-at-bravo">✓ Situation réussie${tous ? ' : toutes les situations sont réussies !' : '.'}</p>
        <p class="bf-at-q">Le diagramme objet-action et toutes les forces sont dessinés.${reactions(s).length ? ` En 1re et en Terminale, touche « ${nomV('R')} = ${nomV('RN')} + ${nomV('f')} » pour voir la réaction de chaque support.` : ''}</p>`;
      const a = blocEtapes.querySelector('[data-a="actions"]');
      a.innerHTML = `<button type="button" class="btn-primary" data-b="suite">Situation ${k + 1} →</button><button type="button" class="btn-small" data-b="re">↺ Refaire</button>`;
      a.querySelector('[data-b="suite"]').onclick = () => charger(k);
      a.querySelector('[data-b="re"]').onclick = () => charger(courant);
      dessiner();
    }

    // reprise à la première situation pas encore réussie
    const faits = lireFaits(), premiere = ORDRE.findIndex(id => !faits[id]);
    charger(premiere < 0 ? 0 : premiere);
    return { charger, onglet };
  }

  B.atelier = atelier;
})();
