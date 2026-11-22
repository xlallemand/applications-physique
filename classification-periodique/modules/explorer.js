/* ============================================================
   Module 1 : explorer le tableau (simulation sur un seul écran)
   CP.explorer(zone)
   Tableau des éléments Z = 1 à 20 (lignes 1 à 4, colonnes 1, 2 et 13 à 18, écart des
   10 colonnes cachées). Toucher un élément ouvre son panneau, à droite (dessous sur téléphone) :
   nom et Z, puis trois rubriques en onglets :
     Position : configuration en cases (outil ATOME, couche externe entourée ; pas pour K et Ca),
                ligne ↔ couche externe, colonne ↔ électrons de valence ;
     Ion      : flèches de case en case jusqu'à la dernière colonne (animées), formule et nom ;
     Liaisons : électrons à gagner pour avoir la configuration d'un gaz noble → liaisons,
                électrons restants → doublets non liants ; l'atome dessiné avec ses traits.
   Boutons de familles (alcalins, halogènes, gaz nobles) : cadre épais et nom écrit.
   « À essayer » : six défis cochés automatiquement, dans n'importe quel ordre ; tous réussis → page faite.
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;
  const METAUX = [3, 4, 11, 12, 13, 19, 20];

  function explorer(zone) {
    const st = { Z: null, touches: [], familles: [], dessin: null };
    let defis = null, minuteur = null;

    const bulleFam = {
      alcalins: BULLE.info('Famille donnée en complément : les éléments de la colonne 1, sauf l\'hydrogène (lithium, sodium, potassium…).', 'Famille des alcalins'),
      'halogènes': BULLE.info('Famille à connaître : colonne 17 (l\'avant-dernière). Le brome Br et l\'iode I, plus bas dans cette colonne, sont aussi des halogènes.', 'Famille des halogènes'),
      'gaz nobles': BULLE.info('Famille à connaître : colonne 18 (la dernière). Ce sont des éléments très stables qui ne participent à aucune réaction chimique.', 'Famille des gaz nobles'),
    };
    const c = CP.cadre(zone, {
      badge: 'MODULE 1 · SIMULATION',
      titre: 'Explorer le tableau',
      contexte: BULLE.info('Touche un élément : sa <b>ligne</b> donne la <b>couche externe</b>, sa <b>colonne</b> le nombre d\'<b>électrons de valence</b> ; on y lit aussi l\'<b>ion</b> qu\'il forme et son nombre de <b>liaisons</b>.', 'À quoi sert cette page'),
      bande: `<div class="cp-fam" data-tel="familles" role="group" aria-label="Familles">
          <span class="cp-fam-t">Familles :</span>
          ${['alcalins', 'halogènes', 'gaz nobles'].map(k => `<span class="cp-fam-l"><button type="button" class="btn-secondary cp-fam-b" data-f="${k}" aria-pressed="false">${k[0].toUpperCase() + k.slice(1)}</button>${bulleFam[k]}</span>`).join('')}
        </div>`,
      entete: '<div class="cp-fiche" data-a="fiche" aria-live="polite"></div>',
      aria: 'Panneau de l\'élément',
      onglets: [
        { id: 'position', nom: 'Position', html: '<div class="cp-rub" data-a="position"></div>' },
        { id: 'ion', nom: 'Ion', html: '<div class="cp-rub" data-a="ion"></div>' },
        { id: 'liaisons', nom: 'Liaisons', html: '<div class="cp-rub" data-a="liaisons"></div>' },
        { id: 'familles', nom: 'Familles', html: '', tel: true },
        { id: 'defis', nom: 'À essayer', titre: 'À essayer', html: '<div data-a="defis"></div>', toujours: true },
      ],
      surOnglet: () => { maj(true); verifier(); },
    });
    const $ = c.$;
    const T = CP.tableau(c.tableau, {
      contenu: 'complet',
      surToucher: z => toucher(z),
    });

    /* ----- Familles ----- */
    zone.querySelectorAll('.cp-fam-b').forEach(b => {
      b.onclick = () => {
        const k = b.dataset.f, i = st.familles.indexOf(k);
        if (i >= 0) st.familles.splice(i, 1); else st.familles.push(k);
        majFamilles();
        if (i < 0) c.message(texteFamille(k), 'info'); else c.message('', 'info');
        verifier();
      };
    });
    function majFamilles() {
      zone.querySelectorAll('.cp-fam-b').forEach(b => b.setAttribute('aria-pressed', st.familles.indexOf(b.dataset.f) >= 0 ? 'true' : 'false'));
      T.familles(st.familles);
    }
    function texteFamille(k) {
      if (k === 'alcalins') return '<b>Famille des alcalins</b> (colonne 1, sans H) : Li, Na, K ont <b>1 électron de valence</b>, donc des propriétés chimiques communes.';
      if (k === 'halogènes') return '<b>Famille des halogènes</b> (colonne 17) : F et Cl ont <b>7 électrons de valence</b>, donc des propriétés chimiques communes.';
      return '<b>Famille des gaz nobles</b> (colonne 18) : couche externe pleine (2 électrons pour He, 8 pour Ne et Ar) : très stables, ils ne forment <b>ni ion ni liaison</b>.';
    }

    /* ----- Toucher un élément ----- */
    function toucher(z) {
      st.Z = z;
      st.touches.push(z);
      if (st.touches.length > 30) st.touches.shift();
      T.choisir(z);
      c.message('', 'info');
      maj(true);
      // sur téléphone, le panneau montre la rubrique de l'élément (pas les familles ni les défis)
      if (c.estTel() && ['position', 'ion', 'liaisons'].indexOf(c.actif()) < 0) c.onglet('position');
      verifier();
    }

    /* ----- Panneau de l'élément ----- */
    function maj(anime) {
      const z = st.Z;
      clearTimeout(minuteur);
      if (!z) {
        $('fiche').innerHTML = '<p class="cp-fiche-vide">Touche un élément du tableau.</p>';
        ['position', 'ion', 'liaisons'].forEach(k => { $(k).innerHTML = '<p class="cp-aide-t">Touche un élément du tableau pour voir sa position, son ion et ses liaisons.</p>'; });
        T.effacerFleches();
        return;
      }
      const e = ATOME.element(z), p = CP.position(z);
      $('fiche').innerHTML = `<span class="cp-fiche-sym">${e.sym}</span><span class="cp-fiche-t"><b>${CP.nom(z)}</b><span>Z = ${z} · ligne ${p.ligne} · colonne ${p.col}</span></span>`;
      majPosition(z);
      majIon(z, anime);
      majLiaisons(z);
      if (c.actif() !== 'ion') T.effacerFleches();
    }

    function majPosition(z) {
      const p = CP.position(z), v = CP.valenceCase(z);
      const zone = $('position');
      let conf;
      if (z <= 18) conf = `<p class="cp-config">${ATOME.configHTML(z, { entourer: true })}</p><div class="cp-cases" data-a="cases"></div>`;
      else conf = `<p class="cp-rub-p cp-k">Z = ${z} : configuration non étudiée (au-delà de Z = 18). Tout se lit sur le tableau.</p>`;
      let col;
      if (z === 2) col = `<b>Colonne 18</b>, mais He n'a que <b>2 électrons de valence</b> (1s<sup>2</sup>, couche n = 1 pleine) : c'est l'exception.`;
      else if (p.col <= 2) col = `<b>Colonne ${p.col}</b> → <b>${pl(v, 'électron')} de valence</b>.`;
      else col = `<b>Colonne ${p.col}</b> → ${p.col} ${MOINS} 10 = <b>${v} électrons de valence</b> ${BULLE.info('Entre les colonnes 2 et 13, le tableau saute 10 colonnes cachées (elles commencent à la ligne 4, après le calcium). Les colonnes 13 à 18 sont les 3<sup>e</sup> à 8<sup>e</sup> cases de la ligne.', 'Pourquoi retirer 10')}`;
      zone.innerHTML = `${conf}
        <p class="cp-rub-p"><b>Ligne ${p.ligne}</b> → la couche externe est <b>n = ${p.ligne}</b>.</p>
        <p class="cp-rub-p">${col}</p>`;
      if (z <= 18) {
        // configuration en cases, couche externe entourée (outil ATOME)
        st.dessin = ATOME.dessin(zone.querySelector('[data-a="cases"]'), { mode: 'cases', Z: z, electrons: z, entourer: 'auto' });
      }
    }

    function majIon(z, anime) {
      const i = CP.ion(z), e = ATOME.element(z), zone = $('ion');
      const voirFleches = c.actif() === 'ion';
      if (i.type === 'stable') {
        zone.innerHTML = `<p class="cp-rub-p"><b>${e.sym} est un gaz noble :</b> déjà stable (couche externe pleine), il <b>ne forme pas d'ion</b>.</p>`;
        return;
      }
      if (i.type === 'H') {
        zone.innerHTML = `<p class="cp-ion-f">H<sup>+</sup> <span>ion hydrogène</span></p>
          <p class="cp-rub-p"><b>Cas à part :</b> H forme l'ion H<sup>+</sup> en perdant son unique électron (ion à connaître).</p>`;
        return;
      }
      if (i.type === 'egal') {
        zone.innerHTML = `<p class="cp-rub-p">${e.sym} est à <b>4 cases</b> de la dernière colonne d'un côté comme de l'autre : il <b>ne forme pas d'ion</b>.</p>`;
        return;
      }
      const gaz = ATOME.element(i.gaz), nomI = CP.nomIon(z);
      const sens = i.sens === 'droite'
        ? `<b>${pl(i.n, 'case')} vers la droite</b> jusqu'à la dernière colonne (${gaz.sym}) : ${e.sym} <b>gagne ${pl(i.n, 'électron')}</b>.`
        : `<b>${pl(i.n, 'case')} vers la gauche</b> jusqu'au gaz noble de la ligne précédente (${gaz.sym}) : ${e.sym} <b>perd ${pl(i.n, 'électron')}</b>.`;
      zone.innerHTML = `<p class="cp-rub-p">${sens}</p>
        <p class="cp-ion-f" data-a="formule">${ATOME.formuleIon(e.sym, i.q)}${nomI ? ` <span>${nomI}${CP.ionAConnaitre(z) ? ' (à connaître)' : ''}</span>` : ''}</p>
        <p class="cp-rub-p cp-petit">Une case vers la droite : un électron en plus ; une case vers la gauche : un électron en moins.</p>
        <div class="er-actions"><button type="button" class="btn-small" data-a="rejouer">↺ Rejouer les flèches</button></div>`;
      zone.querySelector('[data-a="rejouer"]').onclick = () => { if (c.actif() !== 'ion') c.onglet('ion'); else majIon(z, true); };
      if (voirFleches) {
        const duree = T.fleches(z, { anime });
        // la formule s'écrit à la fin des flèches
        const f = zone.querySelector('[data-a="formule"]');
        if (duree) { f.classList.add('cp-attente'); minuteur = setTimeout(() => f.classList.remove('cp-attente'), duree); }
      }
    }

    function majLiaisons(z) {
      const l = CP.liaisons(z), e = ATOME.element(z), zone = $('liaisons');
      if (l.type === 'stable') { zone.innerHTML = `<p class="cp-rub-p"><b>${e.sym} est un gaz noble :</b> déjà stable, il <b>ne forme pas de liaison</b>.</p>`; return; }
      if (l.type === 'metal') { zone.innerHTML = `<p class="cp-rub-p">${CP.nom(z)} : il ${CP.ion(z).type === 'ion' ? `perd facilement ses électrons de valence et <b>forme plutôt un ion</b> (${ATOME.formuleIon(e.sym, CP.ion(z).q)})` : 'forme plutôt un ion'}.</p>`; return; }
      if (l.type === 'bore') { zone.innerHTML = '<p class="cp-rub-p">Le bore n\'est pas étudié ici : pas de nombre de liaisons proposé.</p>'; return; }
      const gaz = ATOME.element(l.gaz), reste = l.valence - l.gagner;
      zone.innerHTML = `<div class="cp-liai">${CP.atomeLiaisons(e.sym, l.liaisons, l.doublets)}
        <div class="cp-liai-t">
          <p class="cp-rub-p">${pl(l.valence, 'électron')} de valence.</p>
          <p class="cp-rub-p">Électrons à gagner pour avoir la configuration d'un gaz noble (${gaz.sym}, règle ${l.regle === 'duet' ? 'du duet' : 'de l\'octet'}) : <b>${l.gagner}</b> → <b>${pl(l.liaisons, 'liaison')}</b>.</p>
          <p class="cp-rub-p">${reste ? `Il reste ${l.valence} ${MOINS} ${l.gagner} = ${pl(reste, 'électron')} de valence → <b>${CP.doublets(l.doublets)}</b>.` : 'Il ne reste aucun électron de valence : <b>aucun doublet non liant</b>.'}</p>
        </div></div>
        <p class="cp-rub-p cp-petit">Dans une liaison covalente, chacun des deux atomes gagne un électron.</p>`;
    }

    /* ----- « À essayer » ----- */
    const fin = n => st.touches.slice(-n);
    const egal = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
    function preparer(z, rub, msg) {
      return () => {
        st.touches = [];
        st.familles = [];
        majFamilles();
        st.Z = z || null;
        T.choisir(st.Z);
        if (rub) c.onglet(rub, true);
        maj(false);
        c.message(msg, 'info');
        if (c.estTel() && !z) c.onglet('defis', true);
      };
    }
    defis = CP.defis($('defis'), [
      { t: 'Touche les éléments de la <b>ligne 2</b> dans l\'ordre, de Li à Ne. Que devient Z d\'une case à la suivante ?',
        ok: () => egal(fin(8), [3, 4, 5, 6, 7, 8, 9, 10]), preparer: preparer(null, 'position', 'Touche Li, puis chaque case de la ligne 2 jusqu\'à Ne.'),
        bravo: 'Dans une ligne, les éléments sont rangés par Z croissant : une case vers la droite = <b>1 proton et 1 électron en plus</b>.' },
      { t: 'Touche <b>Na</b> puis <b>Cl</b>. Qu\'ont-ils en commun ?',
        ok: () => egal(fin(2), [11, 17]), preparer: preparer(null, 'position', 'Touche Na, puis Cl.'),
        bravo: 'Na et Cl sont dans la même ligne (ligne 3) : <b>même couche externe, n = 3</b> (3s<sup>1</sup> et 3s<sup>2</sup> 3p<sup>5</sup>).' },
      { t: 'Touche <b>Li</b>, <b>Na</b> et <b>K</b>. Qu\'ont-ils en commun ?',
        ok: () => [3, 11, 19].every(z => st.touches.indexOf(z) >= 0), preparer: preparer(null, 'position', 'Touche Li, Na et K, dans l\'ordre que tu veux.'),
        bravo: 'Li, Na et K sont dans la même colonne (colonne 1) : <b>1 électron de valence</b>, donc des propriétés chimiques communes : c\'est une <b>famille</b> (les alcalins).' },
      { t: 'Trouve l\'<b>ion de O</b> en comptant les cases jusqu\'à la dernière colonne (rubrique Ion).',
        ok: () => st.Z === 8 && c.actif() === 'ion', preparer: preparer(8, 'position', 'O est choisi. Compte les cases jusqu\'à la dernière colonne, puis ouvre la rubrique Ion.'),
        bravo: 'O est à 2 cases de la dernière colonne, vers la droite : il gagne 2 électrons et forme l\'ion <b>O<sup>2−</sup></b> (configuration de Ne).' },
      { t: 'Trouve le <b>nombre de liaisons de N</b> (rubrique Liaisons).',
        ok: () => st.Z === 7 && c.actif() === 'liaisons', preparer: preparer(7, 'position', 'N est choisi. Combien d\'électrons doit-il gagner ? Ouvre la rubrique Liaisons.'),
        bravo: 'N a 5 électrons de valence : il doit en gagner 3 pour avoir la configuration de Ne : <b>3 liaisons</b> ; il reste 2 électrons : <b>1 doublet non liant</b>.' },
      { t: 'Montre la famille des <b>gaz nobles</b>. Pourquoi ne forment-ils ni ion ni liaison ?',
        ok: () => st.familles.indexOf('gaz nobles') >= 0, preparer: preparer(null, null, 'Touche le bouton « Gaz nobles ».'),
        bravo: 'Les gaz nobles ont déjà une <b>couche externe pleine</b> (configuration stable) : ils ne gagnent ni ne perdent d\'électron, ils ne forment <b>ni ion ni liaison</b>.' },
    ], {
      bilan: '<b>Bravo !</b> La <b>ligne</b> donne la couche externe, la <b>colonne</b> le nombre d\'électrons de valence ; une même colonne forme une <b>famille</b>. En comptant les cases jusqu\'à la dernière colonne, on trouve l\'<b>ion</b> et le nombre de <b>liaisons</b>.',
      surReussite: d => c.message(`<b>✓ Défi réussi.</b> ${d.bravo}`, 'ok'),
    });
    function verifier() { defis.verifier(st); }

    maj(false);
    c.message('Touche un élément du tableau. Les boutons « Familles » encadrent les familles.', 'info');
    CP.explorerEnCours = { st, T, cadre: c, defis, toucher };          // utile pour vérifier l'application
    return CP.explorerEnCours;
  }

  Object.assign(CP, { explorer });
})();
