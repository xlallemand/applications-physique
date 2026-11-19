/* ============================================================
   Module 1 : construire un atome (simulation sur un seul écran)
   AT.simulateurAtome(zone)
   Choix de l'élément (Z = 1 à 18 : − / + ou grille des symboles) : noyau dessiné avec Z protons
   et A − Z neutrons, écriture conventionnelle ᴬ_Z X.
   Deux dessins côte à côte qui se remplissent ensemble (outil ATOME) : cercles des couches n = 1, 2, 3
   et cases 1s | 2s 2p | 3s 3p 3d le long de la flèche « Énergie ».
   Électrons ajoutés un à un : « + électron », réserve à glisser vers une case ou un cercle, ou toucher
   une case / un cercle. Refus expliqués (case pleine, case sautée, plus d'électrons que de protons, 3d).
   Configuration écrite en direct, compteur « électrons / protons ».
   Électrons de valence : entourés dès que l'atome est complet, ou « À trouver » (l'élève touche la couche
   externe, puis donne leur nombre).
   « À essayer » : cinq défis cochés automatiquement, dans n'importe quel ordre ; tous réussis → page faite.
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';

  function simulateurAtome(zone) {
    const etat = { mode: 'auto', vus: {}, naEntoure: false, sTrouve: false, valenceDonnee: false, remplir: null };
    let defis = null;

    const cadre = AT.cadreSim(zone, {
      badge: 'MODULE 1 · SIMULATION',
      titre: 'Construire un atome',
      infos: `<div class="at-sim-cases" data-a="cases"></div>
        <div class="at-sim-bloc-config"><p class="at-sim-lab">Configuration électronique</p><p class="at-config" data-a="config"></p></div>
        <p class="at-compte" data-a="compte"></p>`,
      onglets: [
        { id: 'element', nom: 'Élément', html: '<div data-a="choix" data-bande></div>', tel: true },
        { id: 'electrons', nom: 'Électrons', html: `
          <div class="at-ligne"><span data-a="reserve"></span>
            <button type="button" class="btn-primary at-b" data-a="plus">+ électron</button>
            <button type="button" class="btn-secondary at-b" data-a="moins">${MOINS} électron</button></div>
          <p class="at-aide-t">Glisse l'électron de la réserve vers une case ou un cercle, ou touche une case.</p>
          <div class="at-ligne">
            <button type="button" class="btn-secondary at-b" data-a="remplir">Compléter l'atome</button>
            <button type="button" class="btn-secondary at-b" data-a="vider">↺ Recommencer</button></div>
          <p class="at-sim-lab">Électrons de valence</p>
          <div class="at-seg" role="group" aria-label="Électrons de valence">
            <button type="button" data-v="auto" aria-pressed="true">Montrés</button><button type="button" data-v="toucher" aria-pressed="false">À trouver</button></div>` },
        { id: 'defis', nom: 'À essayer', html: '<div data-a="defis"></div>' },
      ],
    });
    const $ = cadre.$;

    /* ----- Dessins de l'atome (outil ATOME) ----- */
    const d = ATOME.dessin({ couches: $('couches'), cases: $('cases') }, {
      Z: 1, electrons: 0, ajout: true, entourer: 'auto', alignement: 'xMaxYMax meet',
      textes: { trop: () => 'L\'atome a autant d\'électrons que de protons. Avec un électron de plus, ce serait un ion : voir le module 3.' },
      onMessage: (h, type) => cadre.message(h, type),
      onChange: (e, action) => maj(e, action),
      onEntourer: e => demanderValence(e),
    });
    const choix = AT.choixElement($('choix'), z => {
      arreterRemplir();
      d.regler({ Z: z, electrons: Math.min(d.etat().electrons, z) });
    });
    choix.montrer(1);
    ATOME.reserve($('reserve'), d);

    /* ----- Boutons ----- */
    $('plus').onclick = () => { arreterRemplir(); d.ajouter(); };
    $('moins').onclick = () => { arreterRemplir(); d.retirer(); };
    $('vider').onclick = () => { arreterRemplir(); d.regler({ electrons: 0 }); };
    // compléter : les électrons manquants arrivent un à un (d'un coup si l'on demande moins d'animations)
    $('remplir').onclick = () => {
      arreterRemplir();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) { while (d.etat().electrons < d.etat().Z) if (!d.ajouter()) break; return; }
      const pas = () => { if (d.etat().electrons < d.etat().Z && d.ajouter()) etat.remplir = setTimeout(pas, 110); else etat.remplir = null; };
      pas();
    };
    function arreterRemplir() { if (etat.remplir) { clearTimeout(etat.remplir); etat.remplir = null; } }
    // électrons de valence : entourés tout seuls, ou à trouver par l'élève
    function mode(m) {
      etat.mode = m;
      zone.querySelectorAll('[data-v]').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === m ? 'true' : 'false'));
      d.options({ entourer: m });
      etat.valenceDonnee = false;
      maj(d.etat(), 'mode');
    }
    zone.querySelectorAll('[data-v]').forEach(b => { b.onclick = () => mode(b.dataset.v); });

    /* ----- Électrons de valence à trouver : la couche externe est entourée, combien d'électrons ? ----- */
    function demanderValence(e) {
      cadre.message(`<p><b>Couche externe entourée.</b> Combien d'électrons de valence ?</p>
        <div class="at-nb" role="group" aria-label="Nombre d'électrons de valence">${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `<button type="button" class="btn-secondary" data-k="${k}">${k}</button>`).join('')}</div>
        <div data-a="nbRet"></div>`, 'info');
      cadre.zone.querySelectorAll('[data-k]').forEach(b => {
        b.onclick = () => {
          const k = +b.dataset.k, diag = ATOME.diagValence(e.config, k);
          if (diag) {
            b.disabled = true; b.classList.add('faux');
            $('nbRet').innerHTML = `<p class="at-sim-diag"><b>Ce n'est pas ça.</b> ${diag}</p>`;
            return;
          }
          etat.valenceDonnee = true;
          if (e.Z === 16) etat.sTrouve = true;
          cadre.message(`<b>Juste !</b> ${e.nom} : ${e.valence} électron${e.valence > 1 ? 's' : ''} de valence, ceux de la couche n = ${e.couche} (${ATOME.configHTML(e.config.filter(t => ATOME.couche(t[0]) === e.couche))}).`, 'ok');
          maj(d.etat(), 'valence');
        };
      });
      if (e.Z === 11) etat.naEntoure = true;
      maj(e, 'entoure');
    }

    /* ----- Mise à jour : écriture du noyau, configuration, compteur, informations, défis ----- */
    function maj(e, action) {
      const el = ATOME.element(e.Z);
      if (action === 'regler' || action === 'retrait' || action === 'ajout') etat.valenceDonnee = false;
      $('nota').innerHTML = `<span class="at-nota-x">${ATOME.notation(e.A, e.Z, el.sym)}</span><span class="at-nota-nom">${el.nom}</span>
        <span class="at-nota-c">${AT.LEGENDE.p}${e.Z} proton${e.Z > 1 ? 's' : ''}</span><span class="at-nota-c">${AT.LEGENDE.n}${e.A - e.Z} neutron${e.A - e.Z > 1 ? 's' : ''}</span>`;
      $('config').innerHTML = ATOME.configHTML(e.config, { entourer: e.entoure, vide: '<span class="atm-vide">aucun électron : ajoute-les un à un</span>' });
      const val = e.complet && e.entoure && (etat.mode === 'auto' || etat.valenceDonnee);
      $('compte').innerHTML = `<span>${AT.LEGENDE.e}électrons : <b>${e.electrons}</b> / protons : <b>${e.Z}</b></span>`
        + (val ? `<span class="at-compte-val">électrons de valence : <b>${e.valence}</b></span>` : '');
      // informations au moment où elles servent
      if (action === 'ajout') {
        const c = e.config, der = c[c.length - 1];
        if (e.complet && etat.mode === 'toucher') cadre.message('<b>L\'atome est complet.</b> Touche sa couche externe (un cercle ou ses cases) pour entourer les électrons de valence.', 'info');
        else if (e.complet) cadre.message(`<b>Atome complet :</b> ${e.electrons} électron${e.electrons > 1 ? 's' : ''} pour ${e.Z} proton${e.Z > 1 ? 's' : ''}. La dernière couche qui a des électrons (n = ${e.couche}) est entourée : ${e.valence} électron${e.valence > 1 ? 's' : ''} de valence.`, 'ok');
        else if (der[1] === 1 && der[0][1] === 's' && e.electrons > 1) cadre.message(`La couche n = ${e.couche - 1} est pleine : cet électron commence la couche n = ${e.couche}.`, 'info');
        else if (der[0] === '1s' && der[1] === 2) cadre.message('La sous-couche 1s est pleine : elle contient au plus 2 électrons.', 'info');
        else if (der[0][1] === 'p' && der[1] === 6) cadre.message(`La couche n = ${e.couche} est pleine : ${e.couche}s<sup>2</sup> ${e.couche}p<sup>6</sup>, soit 8 électrons.`, 'info');
      } else if ((action === 'regler' || action === 'mode') && e.complet && etat.mode === 'toucher') {
        cadre.message('<b>L\'atome est complet.</b> Touche sa couche externe (un cercle ou ses cases) pour entourer les électrons de valence.', 'info');
      }
      if (e.complet) etat.vus[e.Z] = true;
      choix.montrer(e.Z);
      $('moins').disabled = !e.electrons;
      $('remplir').disabled = e.complet;
      if (defis) defis.verifier(e);
    }

    /* ----- « À essayer » ----- */
    function preparer(z, m) {
      return () => {
        arreterRemplir();
        if (m && etat.mode !== m) mode(m);
        d.regler({ Z: z, electrons: 0 });
        cadre.onglet('electrons');
      };
    }
    defis = AT.defis($('defis'), [
      { t: 'Construis l\'atome d\'<b>hydrogène</b>, puis celui d\'<b>hélium</b>.', ok: () => etat.vus[1] && etat.vus[2], preparer: preparer(1) },
      { t: 'Construis le <b>lithium</b> : où va son 3<sup>e</sup> électron ?', ok: () => etat.vus[3], preparer: preparer(3) },
      { t: 'Construis le <b>néon</b> : quelle couche est pleine ?', ok: () => etat.vus[10], preparer: preparer(10) },
      { t: '<b>Sodium</b> : en mode « À trouver », entoure toi-même ses électrons de valence.', ok: () => etat.naEntoure, preparer: preparer(11, 'toucher') },
      { t: 'Défi : construis le soufre <span class="at-nota-txt">' + ATOME.notation(32, 16, 'S') + '</span> et trouve son nombre d\'électrons de valence.', ok: () => etat.sTrouve, preparer: preparer(16, 'toucher') },
    ], {
      bilan: '<b>Bravo !</b> Les électrons se placent dans l\'ordre 1s, 2s, 2p, 3s, 3p (s : 2 au plus, p : 6). Les <b>électrons de valence</b> sont ceux de la dernière couche qui a des électrons.',
    });
    maj(d.etat(), 'debut');
    cadre.message('Choisis un élément, puis ajoute ses électrons un à un : ils apparaissent en même temps sur les cercles et dans les cases.', 'info');
    AT.atomeEnCours = { d, etat, defis, cadre, mode };          // utile pour vérifier l'application
    return AT.atomeEnCours;
  }

  Object.assign(AT, { simulateurAtome });
})();
