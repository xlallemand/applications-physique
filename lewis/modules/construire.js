/* ============================================================
   Module 1 : de l'atome à la molécule (manipulation guidée sur un seul écran)
   LW.pageConstruire(zone)
   Deux onglets, chacun avec sa zone de travail :
   « Tableau des atomes » (en premier) : à gauche, la classification périodique (couches externes écrites
     dans les cases) ; l'élève traite les atomes H, C, N, O, S, Cl un par un, en quatre étapes expliquées
     (électrons de valence, électrons à gagner, liaisons, doublets non liants), avec la configuration
     électronique et avec la classification. Le dessin de l'atome se construit à chaque étape :
     électrons de valence, places à remplir, liaisons (traits pleins), doublets non liants.
     Tableau récapitulatif : un bouton ↺ par atome et « Refaire tous les atomes »
     (atomes faits gardés dans le navigateur : lewis-tableau).
   « Molécules » : seize situations (pastilles nommées par la formule, dans n'importe quel ordre) :
     H2, Cl2, HCl, H2O, NH3, CH4, H2S, CO2, N2, O2, puis C2H6, CH4O, CH5N, C2H3Cl, C3H3N,
     puis le défi C3H8O (trois molécules ; la même redessinée est reconnue). À droite, le tableau
     récapitulatif des atomes faits (sans « à gagner »). Molécule terminée : « 8 e⁻ » (« 2 e⁻ » pour H)
     sous chaque atome, bouton « Mettre en forme » (dessin régulier) ; pour aller plus loin (hors
     programme) : formule semi-développée (rendu 'semi' d'ORGA).
   Ce qui est trouvé pour l'atome en cours s'écrit au-dessus de la question.
   Téléphone : le récapitulatif est dans son propre onglet ; la méthode et le dessin de l'atome passent
   sous les onglets (la zone de travail garde la classification).
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const pl = LW.pl;
  const RAD = Math.PI / 180;
  const SITUATIONS = ['h2', 'cl2', 'hcl', 'h2o', 'nh3', 'ch4', 'h2s', 'co2', 'n2', 'o2', 'c2h6', 'ch4o', 'ch5n', 'c2h3cl', 'c3h3n', 'c3h8o'];
  const DEFI = ['propan1ol', 'propan2ol', 'methoxyethane'];
  const ATOMES = ['H', 'C', 'N', 'O', 'S', 'Cl'];          // tableau des atomes, dans l'ordre de Z
  const CLE = 'lewis-tableau';
  const ETAPES = [
    { id: 'v', t: 'Électrons de valence', c: 'Valence' },
    { id: 'g', t: 'Électrons à gagner', c: 'À gagner' },
    { id: 'l', t: 'Liaisons à former', c: 'Liaisons' },
    { id: 'd', t: 'Doublets non liants', c: 'Doublets non liants' },
  ];
  const ligne = LW.ligneAtome;

  function lireConnus() {
    try { const t = JSON.parse(localStorage.getItem(CLE) || '[]'); return new Set(Array.isArray(t) ? t.filter(el => ATOMES.indexOf(el) >= 0) : []); } catch (e) { return new Set(); }
  }
  function ecrireConnus(s) { try { localStorage.setItem(CLE, JSON.stringify([...s])); } catch (e) { /* stockage indisponible */ } }

  /* ============================================================
     DONNÉES D'UN ATOME POUR LE RAISONNEMENT
     ============================================================ */
  function donnees(el) {
    const s = LW.info(el), b = ligne(el), Z = s.Z;
    const conf = ATOME.config(Z), n = ATOME.derniereCouche(conf);
    const ext = conf.filter(t => ATOME.couche(t[0]) === n);
    const col = b.v <= 2 ? b.v : b.v + 10;
    const gazZ = n === 1 ? 2 : n === 2 ? 10 : 18, gaz = ATOME.element(gazZ).sym;
    const extHTML = ext.map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' ');
    return { s, b, Z, conf, n, ext, extHTML, col, gazZ, gaz, regle: s.regle, duet: s.regle === 2 ? 'règle du duet' : 'règle de l\'octet' };
  }

  /* ---------- Méthode de chaque étape (configuration et classification) ---------- */
  function methode(el, k) {
    const D = donnees(el), b = D.b;
    if (k === 0) {
      return `<p><b>Électrons de valence</b> : ceux de la <b>couche externe</b> (la dernière couche occupée).</p>
        <ul><li><b>Avec la configuration</b> : ${ATOME.configHTML(D.Z, { entourer: true })} : couche externe n = ${D.n} ; compte ses électrons.</li>
        <li><b>Avec la classification</b> : ${el} est dans la ligne ${D.n} (couche n = ${D.n}) et la colonne ${D.col}. ${D.col <= 2 ? 'Colonnes 1 et 2 : 1 et 2 électrons de valence.' : 'Colonnes 13 à 18 : on enlève 10 au numéro de la colonne.'}</li></ul>`;
    }
    if (k === 1) {
      return `<p>Pour être plus stable, l'atome cherche à avoir la configuration électronique du <b>gaz noble</b> le plus proche, ${D.gaz} : <b>${D.regle} électrons</b> sur sa couche externe (${D.duet}).</p>
        <ul><li><b>Avec la configuration</b> : ${el} a ${pl(b.v, 'électron')} sur sa couche externe ; il lui en faut ${D.regle}.</li>
        <li><b>Avec la classification</b> : compte les cases de ${el} jusqu'à ${D.gaz}, à la fin de sa ligne (colonne 18).</li></ul>`;
    }
    if (k === 2) {
      return `<p>Un atome gagne des électrons en formant des <b>liaisons covalentes</b> : deux atomes mettent chacun <b>un</b> électron en commun et forment un <b>doublet liant</b> (un trait). Chaque liaison fait donc gagner <b>un électron</b> à l'atome : ce sont ses électrons seuls qui forment les liaisons.</p>`;
    }
    return `<p>Les électrons de valence qui ne sont pas engagés dans les liaisons <b>restent</b> sur l'atome (en couleur sur le dessin) : il en reste ${b.v} − ${b.l}. Ils se regroupent <b>par deux</b> : chaque paire forme un <b>doublet non liant</b> (un trait).</p>`;
  }
  // question de l'étape
  function question(el, k) {
    return [`Combien ${el} a-t-il d'électrons de valence ?`, `Combien d'électrons ${el} doit-il gagner ?`,
      `Combien de liaisons ${el} forme-t-il ?`, `Combien de doublets non liants ${el} a-t-il ?`][k];
  }
  // explication après la réponse juste (ou affichée)
  function explication(el, k) {
    const D = donnees(el), b = D.b, somme = D.ext.map(t => t[1]).join(' + ');
    if (k === 0) {
      return `Couche externe ${D.extHTML} : ${D.ext.length > 1 ? `${somme} = ` : ''}${pl(b.v, 'électron')} de valence ; dans la classification, colonne ${D.col}${D.col > 2 ? ` : ${D.col} − 10 = ${b.v}` : ''}. Les voici autour du symbole : ${b.v > 4 ? 'd\'abord un par côté, puis par deux' : b.v > 1 ? 'un par côté' : 'un seul'}.`;
    }
    if (k === 1) {
      return `${D.regle} − ${b.v} = ${b.g} : ${el} doit gagner ${pl(b.g, 'électron')} pour avoir la configuration de ${D.gaz} (${b.g} case${b.g > 1 ? 's' : ''} jusqu'à ${D.gaz}). Les places à remplir sont dessinées en pointillés à côté des électrons seuls.`;
    }
    if (k === 2) {
      return `${el} gagne ${pl(b.g, 'électron')} : il forme ${b.l > 1 ? `<b>${b.l} liaisons</b>` : '<b>1 liaison</b>'}. Chaque électron seul et la place à côté deviennent une liaison (un trait plein).`;
    }
    const reste = b.v - b.l;
    return `Il reste ${b.v} − ${b.l} = ${pl(reste, 'électron')} → <b>${LW.doublets(b.d)}</b>. Dans une molécule, ${el} sera entouré de ${b.l} × 2 + ${b.d} × 2 = ${D.regle} électrons (${D.duet}).`;
  }
  // diagnostic d'une réponse fausse
  function diag(el, k, n) {
    const D = donnees(el), b = D.b;
    if (k === 0) {
      if (n === D.Z && D.Z !== b.v) return `${D.Z}, c'est le nombre total d'électrons. Les électrons de valence sont ceux de la couche externe (n = ${D.n}).`;
      if (n === D.n && D.n !== b.v) return `La ligne ${D.n} donne la couche externe (n = ${D.n}), pas le nombre d'électrons de valence : lis la colonne, ou compte les électrons de cette couche.`;
      if (n === D.col - 10 || n === D.col) return `Colonne ${D.col} : on enlève 10 au numéro de la colonne.`;
      if (D.ext.length > 1 && n === D.ext[D.ext.length - 1][1]) return `Compte toute la couche n = ${D.n} : ${D.ext.map(t => `${t[0]}<sup>${t[1]}</sup>`).join(' et ')}.`;
      return `Les électrons de valence sont ceux de la couche externe (n = ${D.n}) : compte-les dans la configuration, ou lis la colonne.`;
    }
    if (k === 1) {
      if (n === D.regle) return `Il lui faut ${D.regle} électrons en tout, et il en a déjà ${b.v} : combien lui en manque-t-il ?`;
      return LW.diagLigne(el, { v: b.v, g: n, l: b.l, d: b.d });
    }
    if (k === 2) {
      if (n === b.v && b.v !== b.l) return `${b.v}, c'est le nombre d'électrons de valence. Chaque liaison fait gagner un électron : il forme autant de liaisons que d'électrons à gagner (${b.g}).`;
      return LW.diagLigne(el, { v: b.v, g: b.g, l: n, d: b.d });
    }
    return LW.diagLigne(el, { v: b.v, g: b.g, l: b.l, d: n });
  }
  // une ligne du raisonnement (à côté du dessin)
  function etapeCourte(el, k) {
    const D = donnees(el), b = D.b;
    return [`${pl(b.v, 'électron')} de valence`, `${D.regle} − ${b.v} = ${b.g} à gagner`, pl(b.l, 'liaison'), `${b.v} − ${b.l} = ${b.v - b.l} → ${LW.doublets(b.d)}`][k];
  }

  /* ============================================================
     DESSIN DE L'ATOME, ÉTAPE PAR ÉTAPE
     k étapes faites : 1 électrons de valence (seuls d'abord, puis par deux) ; 2 places à remplir
     (pointillés, à côté des électrons seuls) ; 3 liaisons en traits pleins, électrons qui restent
     en couleur ; 4 doublets non liants (traits)
     ============================================================ */
  function dessinEtape(el, k) {
    const b = ligne(el), f = 30, W = 124, c0 = W / 2;
    const st = el === 'H' ? [0] : [180, 0, 90, 270].slice(0, b.l);
    const db = [270, 90, 0, 180].filter(a => st.indexOf(a) < 0).slice(0, b.d);
    const r1 = x => Math.round(x * 10) / 10;
    const pt = (a, r, dv) => { const c = Math.cos(a * RAD), s = Math.sin(a * RAD); return { x: c0 + c * r - s * dv, y: c0 + s * r + c * dv }; };
    const o = f * .21, re = f * .12, out = [];
    const nv = n => (n === k ? ' lw-nouv' : '');       // ce qui vient d'apparaître
    const e = (p, cls) => out.push(`<circle class="lw-e${cls || ''}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(re)}"/>`);
    st.forEach(a => {
      if (k >= 3) {
        const r0 = LW.bord(el, f, a, f * .12), p0 = pt(a, r0, 0), p1 = pt(a, r0 + f * 1.15, 0);
        out.push(`<line class="lw-li${nv(3)}" x1="${r1(p0.x)}" y1="${r1(p0.y)}" x2="${r1(p1.x)}" y2="${r1(p1.y)}" stroke-width="2.6"/>`);
      } else if (k >= 1) {
        const r = LW.bord(el, f, a, f * .32);
        if (k >= 2) { e(pt(a, r, -o)); out.push(`<circle class="lw-e-vide${nv(2)}" cx="${r1(pt(a, r, o).x)}" cy="${r1(pt(a, r, o).y)}" r="${r1(re + .6)}"/>`); }
        else e(pt(a, r, 0), nv(1));
      }
    });
    db.forEach(a => {
      if (k >= 4) {
        const r = LW.bord(el, f, a, f * .16), p = pt(a, r, 0), c = Math.cos(a * RAD), s = Math.sin(a * RAD), w = f * .34;
        out.push(`<line class="lw-dl${nv(4)}" x1="${r1(p.x - s * w)}" y1="${r1(p.y + c * w)}" x2="${r1(p.x + s * w)}" y2="${r1(p.y - c * w)}" stroke-width="2.6"/>`);
      } else if (k >= 1) {
        const r = LW.bord(el, f, a, f * .32), cls = k === 3 ? ' lw-e-reste' + nv(3) : nv(1);
        e(pt(a, r, -o), cls); e(pt(a, r, o), cls);
      }
    });
    out.push(`<text class="lw-at" x="${c0}" y="${c0}" dy=".35em" font-size="${f}">${el}</text>`);
    const lu = k >= 4 ? `${el} : ${pl(b.l, 'liaison')}, ${LW.doublets(b.d)}` : k >= 1 ? `${el} et ses ${pl(b.v, 'électron')} de valence` : `symbole ${el}`;
    return `<svg viewBox="0 0 ${W} ${W}" role="img" aria-label="${lu}">${out.join('')}</svg>`;
  }

  /* ============================================================
     PAGE
     ============================================================ */
  function pageConstruire(zone) {
    const connus = lireConnus();
    let outil = null, mol = null, trouvees = [], finie = false, forme = null, aConstruire = false;
    let mode = 'tab', ed = null;
    const mTab = { h: '', type: '' }, mMol = { h: '', type: '' };
    const c = LW.cadre(zone, {
      badge: 'MODULE 1 · MANIPULATION',
      titre: 'De l\'atome à la molécule',
      contexte: BULLE.info('<b>Tableau des atomes</b> : pour chaque atome, compte les électrons de valence, les électrons à gagner, les liaisons et les doublets non liants, avec la configuration électronique et avec la classification. <b>Molécules</b> : chaque atome arrive avec ses <b>liaisons à former</b> (traits libres en pointillés) et ses <b>doublets non liants</b>. Relie les traits libres deux à deux : <b>glisse</b> un trait vers un trait d\'un autre atome, ou <b>touche</b> les deux. Deux ou trois traits entre les mêmes atomes font une liaison double ou triple. Glisse un atome pour le déplacer ; touche une liaison pour la défaire.', 'Comment faire'),
      aria: 'Tableau des atomes et molécules',
      bande: `<p class="lw-bande-t" data-a="titre"></p>
        <span class="lw-bande-b lw-b-mol"><button type="button" class="btn-small" data-a="forme" hidden>Mettre en forme</button><button type="button" class="btn-small" data-a="voirSemi" hidden>Formule semi-développée</button><button type="button" class="btn-small" data-a="re">↺ Recommencer</button></span>`,
      onglets: [
        { id: 'tableau', nom: 'Tableau des atomes', html: `
          <div class="lw-et" data-a="etape">
            <p class="lw-et-t" data-a="etT"></p>
            <ol class="lw-chem" data-a="chem" aria-label="Ce que tu as trouvé"></ol>
            <div class="lw-et-tel" data-a="telPlace"></div>
            <p class="lw-et-q" data-a="etQ"></p>
            <div class="lw-pave" data-a="pave" role="group" aria-label="Réponse"></div>
            <div class="er-actions lw-ed-a" data-a="etA"></div>
          </div>
          <div class="lw-recap-place" data-place="tableau"></div>` },
        { id: 'molecules', nom: 'Molécules', html: `
          <div class="lw-defis-puces lw-sit-puces lw-puces-f" data-a="puces" role="tablist" aria-label="Molécules"></div>
          <p class="lw-sit-num" data-a="num"></p>
          <p class="lw-sit-consigne" data-a="consigne"></p>
          <div class="lw-trouvees" data-a="trouvees"></div>
          <div class="lw-semi" data-a="semi" hidden></div>
          <div class="lw-semi-place" data-a="semiPlace"></div>
          <div class="er-actions lw-sit-suite" data-a="suite"></div>
          <div class="lw-recap-place" data-place="molecules"></div>` },
        { id: 'recap', nom: 'Récapitulatif', tel: true, html: '<div class="lw-recap-place" data-place="recap"></div>' },
      ],
      surOnglet(id) { if (id === 'tableau') changerMode('tab'); else if (id === 'molecules') changerMode('mol'); else majRecap(); },
    });
    const $ = c.$;
    const racine = zone.querySelector('.lw-sim');
    racine.classList.add('lw-m1');

    // zone de travail : la classification (tableau des atomes) ou les atomes à relier (molécules)
    c.travail.innerHTML = `<div class="lw-vue-tab" data-a="vTab">
        <div class="lw-classif" data-a="classif"></div>
        <div class="lw-cote" data-a="cote"><div class="lw-dessin-at" data-a="dessin"></div></div>
        <div class="lw-methode" data-a="methode"></div>
      </div>
      <div class="lw-vue-mol" data-a="vMol"></div>`;
    const classif = CP.tableau($('classif'), { contenu: 'complet', min: 46, max: 72 });
    const recap = document.createElement('div');
    recap.className = 'lw-recap';

    /* ----- Messages : un par onglet (chacun retrouve le sien) ----- */
    function msgTab(h, type) { mTab.h = h || ''; mTab.type = type; if (mode === 'tab') c.message(h, type); }
    function msgMol(h, type) { mMol.h = h || ''; mMol.type = type; if (mode === 'mol') c.message(h, type); }

    /* ----- Places qui changent entre ordinateur et téléphone ----- */
    function placer() {
      const tel = c.estTel();
      if (tel) { $('telPlace').appendChild($('methode')); $('telPlace').appendChild($('cote')); }      // méthode, puis dessin à droite
      else { $('vTab').appendChild($('cote')); $('vTab').appendChild($('methode')); }
      // ordinateur : la formule semi-développée sous la bande de la molécule (le panneau garde le récapitulatif)
      // téléphone : la formule et son bouton dans le panneau (la bande garde une seule ligne)
      if (tel) { $('semiPlace').parentNode.insertBefore($('semi'), $('semiPlace')); $('semiPlace').appendChild($('voirSemi')); }
      else { c.travail.parentNode.insertBefore($('semi'), c.travail); $('re').parentNode.insertBefore($('voirSemi'), $('re')); }
      const lieu = tel ? 'recap' : mode === 'mol' ? 'molecules' : 'tableau';
      zone.querySelector(`[data-place="${lieu}"]`).appendChild(recap);
      // ordinateur : l'onglet actif suit le mode (pas d'onglet « Récapitulatif »)
      if (!tel && c.actif() !== (mode === 'mol' ? 'molecules' : 'tableau')) c.onglet(mode === 'mol' ? 'molecules' : 'tableau', true);
    }
    const mq = matchMedia('(max-width: 899px)');
    if (mq.addEventListener) mq.addEventListener('change', placer); else mq.addListener(placer);

    function changerMode(m) {
      mode = m;
      racine.classList.toggle('lw-mode-tab', m === 'tab');
      racine.classList.toggle('lw-mode-mol', m === 'mol');
      const M = m === 'tab' ? mTab : mMol;
      c.message(M.h, M.type);
      if (m === 'mol') entrerMolecules();
      majTitre();
      majRecap();
      placer();
    }
    function majTitre() {
      if (mode === 'tab') $('titre').innerHTML = ed ? `Tableau des atomes · ${ed.el} (${LW.info(ed.el).nom})` : 'Tableau des atomes';
      else if (mol) $('titre').innerHTML = SITUATIONS[S.n()] === 'c3h8o' ? `Défi : ${mol.f}` : `${mol.f}<span class="lw-nom"> · ${mol.nom}</span>`;
    }

    /* ============================================================
       TABLEAU DES ATOMES
       ============================================================ */
    $('pave').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button type="button" class="btn-secondary" data-n="${n}">${n}</button>`).join('');
    $('pave').querySelectorAll('[data-n]').forEach(b => { b.onclick = () => repondre(+b.dataset.n); });
    const aFaire = () => ATOMES.find(el => !connus.has(el)) || null;
    function commencer(el) {
      ed = el ? { el, k: 0, erreurs: 0, faux: [] } : null;
      msgTab(ed ? `Atome ${el} : réponds aux quatre questions, dans l'ordre.` : '', 'info');
      majAtome();
    }
    function majAtome() {
      majTitre();
      const zEt = $('etape');
      classif.effacerFleches(); classif.cible(null);
      if (!ed) {
        classif.choisir(null);
        $('etT').innerHTML = '';
        $('etQ').innerHTML = 'Tous les atomes sont dans le tableau. Touche ↺ sous un atome pour le refaire, ou passe aux molécules.';
        $('methode').innerHTML = '<p>Les six atomes des molécules du module sont dans le tableau récapitulatif.</p>';
        $('dessin').innerHTML = ''; $('chem').innerHTML = '';
        $('pave').hidden = true;
        boutonMolecules();
        zEt.classList.add('lw-et-fin');
        majRecap();
        return;
      }
      zEt.classList.remove('lw-et-fin');
      const D = donnees(ed.el), k = ed.k;
      classif.choisir(D.Z);
      if (k === 1) classif.cible(D.gazZ);
      if (k >= 2 && k < 4) arcs(D, false);
      $('etT').innerHTML = k < 4 ? `<b>${ed.el}</b> (Z = ${D.Z}) · étape ${k + 1} / 4 : ${ETAPES[k].t.toLowerCase()}` : `<b>${ed.el}</b> (Z = ${D.Z}) : schéma de l'atome terminé`;
      $('methode').innerHTML = k < 4 ? methode(ed.el, k) : `<p><b>Schéma de ${ed.el}</b> : ${pl(D.b.l, 'liaison')} (traits pleins) et ${LW.doublets(D.b.d)}. Il est repris dans le tableau récapitulatif.</p>`;
      $('dessin').innerHTML = dessinEtape(ed.el, k);
      $('chem').innerHTML = ETAPES.slice(0, k).map((e, i) => `<li>${etapeCourte(ed.el, i)}</li>`).join('');
      $('etQ').innerHTML = k < 4 ? `<span class="lw-et-n">${k + 1} / 4</span> ${question(ed.el, k)}` : '';
      $('pave').hidden = k >= 4;
      $('pave').querySelectorAll('[data-n]').forEach(b => {
        b.classList.toggle('faux', ed.faux.indexOf(+b.dataset.n) >= 0);
        b.disabled = false;
      });
      const a = $('etA');
      a.innerHTML = '';
      if (k < 4 && ed.erreurs >= 2) {
        const r = document.createElement('button');
        r.type = 'button'; r.className = 'btn-small'; r.textContent = 'Afficher la réponse';
        r.onclick = () => etapeFaite(true);
        a.appendChild(r);
      }
      if (k >= 4) {
        const suivant = aFaire();
        if (suivant) {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'btn-primary'; b.textContent = `Atome suivant : ${suivant} →`;
          b.onclick = () => commencer(suivant);
          a.appendChild(b);
        } else boutonMolecules();
      }
      majRecap();
    }
    function boutonMolecules() {
      const a = $('etA');
      a.innerHTML = '';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn-primary'; b.textContent = 'Molécules →';
      b.onclick = () => c.onglet('molecules');
      a.appendChild(b);
    }
    // flèches de case en case jusqu'au gaz noble de la ligne
    function arcs(D, anime) {
      const liste = [];
      for (let z = D.Z; z <= D.gazZ; z++) liste.push({ z });
      classif.arcs(liste, { sens: 'droite', anime });
      classif.voir(liste);
    }
    function repondre(n) {
      if (!ed || ed.k >= 4) return;
      const bonne = ligne(ed.el)[ETAPES[ed.k].id];
      if (n !== bonne) {
        ed.erreurs++;
        if (ed.faux.indexOf(n) < 0) ed.faux.push(n);
        msgTab(`<b class="er-ko">Ce n'est pas ça.</b> ${diag(ed.el, ed.k, n)}`, 'ko');      // à partir de deux erreurs : « Afficher la réponse »
        majAtome();
        return;
      }
      etapeFaite(false);
    }
    function etapeFaite(vue) {
      const k = ed.k, el = ed.el, D = donnees(el);
      ed.k++; ed.erreurs = 0; ed.faux = [];
      let fin = '';
      if (ed.k === 4) {
        connus.add(el); ecrireConnus(connus);
        if (mol && mol.atomes.some(a => a.el === el) && outil) outil.activer();
        const suivant = aFaire();
        fin = suivant ? ` Passe à l'atome suivant : <b>${suivant}</b>.` : ' Tous les atomes sont dans le tableau : passe aux molécules.';
      }
      msgTab(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${explication(el, k)}${fin}`, vue ? 'info' : 'ok');
      majAtome();
      if (k === 1) arcs(D, true);
    }
    // refaire un atome, ou tous
    function refaire(el) {
      connus.delete(el); ecrireConnus(connus);
      if (mol && mol.atomes.some(a => a.el === el)) aReconstruire();
      commencer(el);
      c.onglet('tableau');
    }
    function toutRefaire() {
      connus.clear(); ecrireConnus(connus);
      aReconstruire();
      commencer(ATOMES[0]);
      c.onglet('tableau');
    }
    function aReconstruire() {
      if (outil) { outil.detruire(); outil = null; }
      aConstruire = true; finie = false;
      $('forme').hidden = true; $('voirSemi').hidden = true; $('semi').hidden = true;
      if (SITUATIONS[S.n()] !== 'c3h8o' || !S.faites[S.n()]) suite(false);
    }

    /* ----- Tableau récapitulatif (une colonne par atome) ----- */
    function majRecap() {
      const enMol = mode === 'mol';
      const cols = enMol ? ATOMES.filter(el => connus.has(el)) : ATOMES;
      recap.classList.toggle('lw-recap-mol', enMol);
      if (!cols.length) {
        recap.innerHTML = '<p class="lw-sim-lab">Tableau des atomes</p><p class="lw-aide-t">Aucun atome n\'est encore fait : commence par l\'onglet « Tableau des atomes ».</p>';
        return;
      }
      const lignes = ETAPES.filter(e => !enMol || e.id !== 'g');
      const val = (el, e) => {
        const k = ETAPES.indexOf(e);
        return connus.has(el) || (ed && ed.el === el && ed.k > k) ? ligne(el)[e.id] : '…';
      };
      const cur = el => (!enMol && ed && ed.el === el ? ' class="lw-r-cur"' : '');
      recap.innerHTML = `<div class="lw-tab-defile"><table class="lw-tab-at lw-tab-r">
          <caption class="lw-vh">Tableau des atomes</caption>
          <thead><tr><th scope="col" class="lw-r-coin">Atome</th>${cols.map(el => `<th scope="col"${cur(el)}>${el}</th>`).join('')}</tr></thead>
          <tbody>${lignes.map(e => `<tr><th scope="row">${e.c}</th>${cols.map(el => `<td${cur(el)}>${val(el, e)}</td>`).join('')}</tr>`).join('')}
            <tr class="lw-r-sch"><th scope="row">Schéma</th>${cols.map(el => `<td${cur(el)}>${connus.has(el) ? LW.atomeSeul(el, ligne(el).l, ligne(el).d, 36) : ''}</td>`).join('')}</tr>
            ${enMol ? '' : `<tr class="lw-r-re"><th scope="row"><button type="button" class="lw-r-tout" data-a="toutRefaire">↺ Refaire tous les atomes</button></th>${cols.map(el => `<td${cur(el)}>${connus.has(el) || (ed && ed.el === el && ed.k) ? `<button type="button" class="lw-r-btn" data-re="${el}" aria-label="Refaire l'atome ${el}" title="Refaire ${el}">↺</button>` : ''}</td>`).join('')}</tr>`}
          </tbody></table></div>`;
      recap.querySelectorAll('[data-re]').forEach(b => { b.onclick = () => refaire(b.dataset.re); });
      const t = recap.querySelector('[data-a="toutRefaire"]');
      if (t) t.onclick = toutRefaire;
    }

    /* ============================================================
       MOLÉCULES
       ============================================================ */
    const S = LW.situations($('puces'), SITUATIONS.map(id => ({ label: id === 'c3h8o' ? 'C<sub>3</sub>H<sub>8</sub>O ★' : LW.MOL[id].f, aria: id === 'c3h8o' ? 'Défi C3H8O' : LW.MOL[id].f.replace(/<[^>]+>/g, ''), large: true })), {
      aller: situation,
      suite: { href: 'module_2_manip.html', label: 'Module 2 : ce schéma est-il juste ? →' },
    });
    $('re').onclick = () => { if (outil) { outil.recommencer(); cacherFin(); if (!S.faites[S.n()] || SITUATIONS[S.n()] === 'c3h8o') suite(false); annoncer(); } };
    $('voirSemi').onclick = () => montrerSemi();
    $('forme').onclick = () => { if (outil && forme) outil.miseEnForme(forme); };
    function cacherFin() { $('voirSemi').hidden = true; $('forme').hidden = true; $('semi').hidden = true; forme = null; }
    const elements = () => [...new Set(mol.atomes.map(a => a.el))];
    const manquants = () => elements().filter(el => !connus.has(el));

    function situation(i) {
      const id = SITUATIONS[i], defi = id === 'c3h8o';
      mol = LW.molecule(defi ? DEFI[0] : id);
      finie = false;
      mMol.h = '';
      if (mode === 'mol') c.message('');
      majTitre();
      $('num').innerHTML = `Situation ${i + 1} / ${SITUATIONS.length}`;
      $('consigne').innerHTML = defi ? `Avec ces atomes, on peut construire <b>trois</b> molécules différentes : trouve-les.` : 'Relie les traits libres deux à deux (glisse, ou touche les deux).';
      cacherFin(); $('semi').innerHTML = '';
      // défi déjà réussi : les trois molécules restent affichées (sinon, celles déjà trouvées)
      if (defi && S.faites[i]) trouvees = DEFI.slice();
      majTrouvees();
      if (defi && trouvees.length) $('consigne').innerHTML = '';
      if (outil) { outil.detruire(); outil = null; }
      if (mode === 'mol') creerOutil(); else aConstruire = true;
      suite(false);
      annoncer();
    }
    function creerOutil() {
      const defi = SITUATIONS[S.n()] === 'c3h8o';
      outil = LW.constructeur($('vMol'), mol, {
        connu: el => connus.has(el),
        cibles: defi ? null : [mol],
        message: msgMol,
        surFin: fin,
      });
      aConstruire = false;
    }
    function entrerMolecules() {
      if (aConstruire || !outil) creerOutil(); else outil.activer();
      annoncer(true);
    }
    // atomes pas encore faits dans le tableau : la molécule attend
    function annoncer(retour) {
      const m = manquants();
      if (m.length) {
        msgMol(`Complète d'abord ${m.length > 1 ? 'les atomes' : 'l\'atome'} <b>${m.join(', ')}</b> dans le tableau des atomes : ${m.length > 1 ? 'ils se dessineront' : 'il se dessinera'} avec ${m.length > 1 ? 'leurs' : 'ses'} liaisons et ${m.length > 1 ? 'leurs' : 'ses'} doublets non liants.`, 'info');
      } else if (retour && /Complète d'abord/.test(mMol.h)) msgMol('');
      if (!finie) suite(false);
    }
    function suite(principal) {
      const s = $('suite');
      s.innerHTML = '';
      if (mol && manquants().length) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-primary'; b.textContent = 'Tableau des atomes →';
        b.onclick = () => c.onglet('tableau');
        s.appendChild(b);
        return;
      }
      s.appendChild(S.suivante(principal));
    }

    /* ----- Molécule terminée ----- */
    function fin(r) {
      if (!r.ok) return;
      const i = S.n(), id = SITUATIONS[i];
      const stable = 'Chaque atome a la configuration d\'un gaz noble : la molécule est <b>plus stable</b> que les atomes isolés.';
      if (id === 'c3h8o') {
        const k = DEFI.findIndex(d => LW.meme(r.etat, LW.molecule(d)));
        forme = LW.molecule(DEFI[k]);
        $('forme').hidden = false;
        const deja = trouvees.indexOf(DEFI[k]);
        if (deja >= 0) {
          msgMol(`C'est la <b>même molécule</b> que la n° ${deja + 1}, dessinée autrement. Touche « ↺ Recommencer » et relie les atomes d'une autre façon.`, 'info');
          return;
        }
        trouvees.push(DEFI[k]);
        majTrouvees();
        $('consigne').innerHTML = '';
        if (trouvees.length === 3) {
          $('consigne').innerHTML = '';
          msgMol(`<b class="er-ok">Juste !</b> Tu as trouvé les trois molécules de formule ${mol.f} : il n'y en a pas d'autre. ${stable}`, 'ok');
          S.faite(i); suite(true);
        } else {
          msgMol(`<b class="er-ok">Juste !</b> Molécule n° ${trouvees.length} trouvée. ${stable}`, 'ok');
          const s = $('suite');
          s.innerHTML = '<button type="button" class="btn-primary" data-a="autre">Construire une autre molécule</button>';
          $('autre').onclick = () => { outil.recommencer(); cacherFin(); suite(false); };
        }
        return;
      }
      finie = true;
      forme = mol;
      $('consigne').innerHTML = '';
      msgMol(`<b class="er-ok">Juste !</b> ${stable}`, 'ok');
      S.faite(i);
      suite(true);
      $('forme').hidden = false;
      if (mol.atomes.some(a => a.el === 'C')) $('voirSemi').hidden = false;
    }
    function majTrouvees() {
      const t = $('trouvees');
      if (SITUATIONS[S.n()] !== 'c3h8o') { t.innerHTML = ''; return; }
      t.innerHTML = `<p class="lw-sim-lab">Molécules trouvées : ${trouvees.length} / 3</p>` +
        (trouvees.length ? `<ol class="lw-trouvees-l">${trouvees.map(d => `<li>${LW.MOL[d].semi}</li>`).join('')}</ol>` : '');
    }

    /* ----- Pour aller plus loin : formule semi-développée (hors programme) ----- */
    function montrerSemi() {
      const b = $('semi');
      const phrase = `On regroupe les hydrogènes sur les atomes auxquels ils sont liés et on ne représente pas les doublets non liants. La formule brute ${ORGA.formuleBrute(LW.versOrga(outil.etat), { html: true })} donne seulement la composition.`;
      b.innerHTML = `<p class="lw-semi-t"><b>Formule semi-développée</b> ${BULLE.info(`<b>Hors programme.</b> Pour aller plus loin : une autre écriture de la même molécule. ${phrase}`, 'Hors programme')}</p>
        <div class="lw-semi-f" data-a="semiF"></div>
        <p class="lw-petit lw-semi-p">${phrase}</p>`;
      ORGA.dessiner($('semiF'), LW.versOrga(outil.etat, true), { ecriture: 'semi', sansAide: true });
      b.hidden = false;
      c.onglet('molecules');
      $('voirSemi').hidden = true;
    }

    /* ----- Départ : le tableau des atomes s'il reste des atomes à faire, sinon les molécules ----- */
    S.aller(0);
    commencer(aFaire());
    if (!ed) msgTab('');
    const depart = aFaire() ? 'tab' : 'mol';
    c.onglet(depart === 'tab' ? 'tableau' : 'molecules', true);
    changerMode(depart);
    return { outil: () => outil, S, mode: () => mode, ed: () => ed, classif };
  }

  LW.pageConstruire = pageConstruire;
})();
