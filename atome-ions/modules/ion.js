/* ============================================================
   Module 3 : former un ion (simulation sur un seul écran)
   AT.simulateurIon(zone)
   L'atome (Z = 1 à 18) est dessiné avec ses charges (outil ATOME) : cercles et cases ensemble,
   protons ⊕ du noyau et électrons ⊖ rangés par paires (ils se compensent deux à deux).
   L'élève retire un électron de la couche externe (le glisser hors de l'atome, ou « − électron »)
   ou en ajoute un (« + électron », ou la réserve à glisser) : la charge restante (+e, −2e…) et la
   formule (Na⁺, O²⁻…) s'écrivent ; le noyau ne change pas. Refus : retirer un électron d'une couche
   interne. Rappel visible : on enlève → charge + ; on ajoute → charge − (à l'envers !).
   Gaz nobles : configurations de He, Ne et Ar affichées ; badge « stable : même configuration que… »
   (règle du duet ou de l'octet) ou « cet ion n'est pas stable ». Case « Montrer les chemins vers un
   gaz noble » : perdre ou gagner des électrons, le plus proche signalé.
   « À essayer » : six défis cochés automatiquement, dans n'importe quel ordre ; tous réussis → page faite.
   ============================================================ */
(function () {
  'use strict';

  const MOINS = '−';
  // ions à connaître (Z ⩽ 18) : leur nom s'affiche
  const NOMS = { '1:1': 'ion hydrogène', '11:1': 'ion sodium', '12:2': 'ion magnésium', '9:-1': 'ion fluorure', '17:-1': 'ion chlorure' };
  const pl = (k, mot) => `${k} ${mot}${k > 1 ? 's' : ''}`;

  function simulateurIon(zone) {
    const etat = { vus: {}, chemins: false };
    let defis = null;

    const cadre = AT.cadreSim(zone, {
      badge: 'MODULE 3 · SIMULATION',
      titre: 'Former un ion',
      haut: true,
      infos: `<p class="at-ion-tete" data-a="ion" data-haut aria-live="polite"></p>
        <p class="at-ion-noyau" data-a="noyau" data-haut></p>
        <div class="at-sim-cases" data-a="cases"></div>
        <div class="at-sim-bloc-config"><p class="at-config" data-a="config"></p></div>
        <div class="at-charges" data-a="charges" data-tel="charges"></div>
        <div class="at-stab" data-a="stabBloc"><p data-a="stab" aria-live="polite"></p>
          <div class="at-gaz" data-a="gaz" data-tel="charges" aria-label="Configurations des gaz nobles"></div></div>`,
      onglets: [
        { id: 'element', nom: 'Élément', html: '<div data-a="choix" data-bande></div>', tel: true },
        { id: 'electrons', nom: 'Électrons', html: `
          <p class="at-rappel">On <b>enlève</b> un électron → charge <b>+</b> ; on <b>ajoute</b> un électron → charge <b>${MOINS}</b> (à l'envers !).</p>
          <div class="at-ligne"><span data-a="reserve"></span>
            <button type="button" class="btn-secondary at-b" data-a="moins">${MOINS} électron</button>
            <button type="button" class="btn-secondary at-b" data-a="plus">+ électron</button></div>
          <p class="at-aide-t">Glisse un électron hors de l'atome pour le retirer.</p>
          <div class="at-ligne"><button type="button" class="btn-secondary at-b" data-a="neutre">↺ Recommencer : atome neutre</button></div>
          <div class="at-chemins-bloc" data-tel="charges"><label class="at-coche-l"><input type="checkbox" data-a="voirChemins"> Montrer les chemins vers un gaz noble</label>
            <p class="at-chemins" data-a="chemins" aria-live="polite" hidden></p></div>` },
        { id: 'charges', nom: 'Charges', titre: 'Charges et gaz nobles', html: '', tel: true },
        { id: 'defis', nom: 'À essayer', html: '<div data-a="defis"></div>' },
      ],
    });
    const $ = cadre.$;

    /* ----- Dessins de l'atome (outil ATOME) : jusqu'à 18 électrons, retrait par glisser ----- */
    const d = ATOME.dessin({ couches: $('couches'), cases: $('cases') }, {
      Z: 3, electrons: 3, max: 18, ajout: true, retrait: true, entourer: 'toujours', alignement: 'xMaxYMax meet',
      onMessage: (h, type) => cadre.message(h, type),
      onChange: (e, action) => maj(e, action),
    });
    const choix = AT.choixElement($('choix'), z => d.regler({ Z: z, electrons: z }));
    choix.montrer(3);
    ATOME.reserve($('reserve'), d, { aria: 'Réserve d\'électrons : glisser un électron vers l\'atome, ou toucher pour en ajouter un' });

    $('moins').onclick = () => d.retirer();
    $('plus').onclick = () => d.ajouter();
    $('neutre').onclick = () => d.regler({ electrons: d.etat().Z });
    $('voirChemins').onchange = () => { etat.chemins = $('voirChemins').checked; maj(d.etat(), 'chemins'); };

    /* ----- Stabilité : configuration d'un gaz noble ? ----- */
    function stabilite(e) {
      const el = ATOME.element(e.Z), n = e.electrons, gn = ATOME.gazNoble(n), q = e.charge;
      if (!q) {
        if (gn) return { ok: true, h: `<b>Atome de gaz noble :</b> configuration stable (règle ${ATOME.regle(n) === 'duet' ? 'du duet' : 'de l\'octet'}). Il ne forme pas d'ion.` };
        return { ok: false, h: 'Atome neutre : sa configuration n\'est pas celle d\'un gaz noble.' };
      }
      if (!n) {
        if (e.Z === 1) return { ok: true, h: '<b>H<sup>+</sup> n\'a plus d\'électron :</b> l\'ion hydrogène est un cas à part (ion à connaître).' };
        return { ok: false, h: '<b>Plus aucun électron :</b> cet ion n\'est pas stable.' };
      }
      if (!gn) return { ok: false, h: '<b>Cet ion n\'est pas stable :</b> sa configuration n\'est pas celle d\'un gaz noble.' };
      let h = `<b>Stable :</b> même configuration que ${gn.sym} (règle ${ATOME.regle(n) === 'duet' ? 'du duet' : 'de l\'octet'}).`;
      // configuration d'un gaz noble, mais ce n'est pas l'ion qui se forme
      const proche = ATOME.gazNobleProche(e.Z);
      if (ATOME.gazNoble(e.Z)) h += ` Mais ${article(el)} est déjà un gaz noble : il ne forme pas d'ion.`;
      else if (e.Z === 1) h += ' Mais l\'hydrogène forme surtout l\'ion H<sup>+</sup> (ion à connaître).';
      else if (!proche) h += ` Mais ${article(el)} est à égale distance de deux gaz nobles (${Math.abs(n - e.Z)} électrons) : il ne forme pas d'ion.`;
      else if (proche.Z !== n) h += ` Mais il faudrait ${q > 0 ? 'perdre' : 'gagner'} ${pl(Math.abs(q), 'électron')} : ${article(el)} prend plutôt la configuration du gaz noble le plus proche, ${proche.sym} (${proche.ecart > 0 ? 'gagner' : 'perdre'} ${pl(Math.abs(proche.ecart), 'électron')}).`;
      return { ok: true, h };
    }
    // « le sodium », « l'oxygène », « l'hélium »
    function article(el) { return /^[aeéèêiouyh]/i.test(el.nom) ? 'l\'' + el.nom : 'le ' + el.nom; }

    /* ----- Mise à jour ----- */
    function maj(e, action) {
      const el = ATOME.element(e.Z), q = e.charge;
      const type = !q ? 'atome (neutre)' : q > 0 ? 'cation (ion positif)' : 'anion (ion négatif)';
      const nom = NOMS[`${e.Z}:${q}`];
      $('nota').innerHTML = `<span class="at-nota-x">${ATOME.notation(e.A, e.Z, el.sym, q)}</span><span class="at-nota-nom">${el.nom}</span>
        <span class="at-nota-c">${AT.LEGENDE.p}${pl(e.Z, 'proton')}</span><span class="at-nota-c">${AT.LEGENDE.n}${pl(e.A - e.Z, 'neutron')}</span>`;
      $('ion').innerHTML = `<b>${type}</b>${nom ? ` · <span class="at-ion-nom">${nom}</span> (à connaître)` : ''}`;
      $('noyau').innerHTML = q ? `Même noyau (${pl(e.Z, 'proton')}) : c'est toujours l'élément ${el.nom}.` : '';
      $('noyau').hidden = !q;
      $('config').innerHTML = ATOME.configHTML(e.config, { entourer: true, vide: '<span class="atm-vide">aucun électron</span>' });
      $('charges').innerHTML = `${ATOME.paires(e.Z, e.electrons)}
        <p class="at-charges-t">${AT.LEGENDE.p}${e.Z} et ${AT.LEGENDE.e}${e.electrons} par paires → charge${q ? ' restante' : ''} <b>${ATOME.chargeTexte(q)}</b>${q ? '' : ' (neutre)'}</p>`;
      const s = stabilite(e);
      $('stab').innerHTML = s.h;
      $('stabBloc').className = 'at-stab' + (s.ok ? ' at-stab-ok' : '');
      $('gaz').innerHTML = [2, 10, 18].map(k => `<span class="${k === e.electrons ? 'at-gaz-ici' : ''}">${ATOME.element(k).sym} : ${ATOME.configHTML(k)}</span>`).join('');
      // chemins vers un gaz noble (pour l'atome de départ)
      const ch = $('chemins');
      ch.hidden = !etat.chemins;
      if (etat.chemins) {
        const g = ATOME.gazNobles(e.Z), proche = ATOME.gazNobleProche(e.Z);
        if (ATOME.gazNoble(e.Z)) ch.innerHTML = `<b>Chemins :</b> ${el.sym} est un gaz noble, sa configuration est déjà stable.`;
        else {
          const c = x => `<b>${x.sym}</b> : ${x.ecart > 0 ? 'gagner' : 'perdre'} ${pl(Math.abs(x.ecart), 'électron')}${proche && proche.Z === x.Z ? ' (le plus proche)' : ''}`;
          ch.innerHTML = `<b>Chemins vers un gaz noble :</b> ${[g.avant, g.apres].filter(Boolean).map(c).join(' · ')}${proche ? '' : ' (à égalité : pas d\'ion)'}${e.Z === 1 ? ' ; l\'hydrogène forme surtout H<sup>+</sup>.' : '.'}`;
        }
      }
      choix.montrer(e.Z);
      $('moins').disabled = !e.electrons;
      etat.vus[`${e.Z}:${q}`] = true;
      if (defis) defis.verifier(e);
    }

    /* ----- « À essayer » ----- */
    const vu = (z, q) => !!etat.vus[`${z}:${q}`];
    function preparer(z, chemins) {
      return () => {
        if (chemins && !etat.chemins) { $('voirChemins').checked = true; etat.chemins = true; }
        d.regler({ Z: z, electrons: z });
        cadre.onglet('electrons');
      };
    }
    defis = AT.defis($('defis'), [
      { t: '<b>Lithium</b> : enlève 1 électron. Quel ion obtiens-tu ? Quelle configuration ?', ok: () => vu(3, 1), preparer: preparer(3),
        bravo: 'Li<sup>+</sup> est un cation : il a perdu 1 électron, sa configuration 1s<sup>2</sup> est celle de He (règle du duet).' },
      { t: '<b>Fluor</b> : ajoute 1 électron. Cation ou anion ?', ok: () => vu(9, -1), preparer: preparer(9),
        bravo: 'F<sup>−</sup> est un anion : il a gagné 1 électron, sa configuration est celle de Ne (règle de l\'octet).' },
      { t: '<b>Sodium</b> : montre les chemins vers un gaz noble, puis forme l\'ion stable.', ok: () => vu(11, 1) && etat.chemins, preparer: preparer(11, true),
        bravo: 'Na perd 1 électron plutôt que d\'en gagner 7 : il prend la configuration du gaz noble le plus proche, Ne. Na<sup>+</sup> : ion sodium.' },
      { t: '<b>Magnésium</b> et <b>oxygène</b> : forme leurs ions stables.', ok: () => vu(12, 2) && vu(8, -2), preparer: preparer(12),
        bravo: 'Mg<sup>2+</sup> (2 électrons perdus) et O<sup>2−</sup> (2 électrons gagnés) ont la configuration de Ne.' },
      { t: '<b>Lithium</b> : forme Li<sup>−</sup> puis Li<sup>2+</sup>. Sont-ils stables ?', ok: () => vu(3, -1) && vu(3, 2), preparer: preparer(3),
        bravo: 'Li<sup>−</sup> (1s<sup>2</sup> 2s<sup>2</sup>) et Li<sup>2+</sup> (1s<sup>1</sup>) n\'ont pas la configuration d\'un gaz noble : ils ne sont pas stables.' },
      { t: 'Forme les <b>ions à connaître</b> : H<sup>+</sup>, Na<sup>+</sup>, Mg<sup>2+</sup>, F<sup>−</sup> et Cl<sup>−</sup>. Lis leur nom.', ok: () => vu(1, 1) && vu(11, 1) && vu(12, 2) && vu(9, -1) && vu(17, -1), preparer: preparer(1),
        bravo: 'Ion hydrogène H<sup>+</sup>, ion sodium Na<sup>+</sup>, ion magnésium Mg<sup>2+</sup>, ion fluorure F<sup>−</sup>, ion chlorure Cl<sup>−</sup>.' },
    ], {
      bilan: '<b>Bravo !</b> Un atome perd ou gagne des électrons pour avoir la configuration du gaz noble le plus proche : il forme un ion stable. Perdre des électrons donne un <b>cation</b> (charge +), en gagner donne un <b>anion</b> (charge −).',
      surReussite: dd => cadre.message(`<b>✓ Défi réussi.</b> ${dd.bravo}`, 'ok'),
    });
    maj(d.etat(), 'debut');
    cadre.message('Retire un électron de la couche externe (glisse-le hors de l\'atome) ou ajoute-en un : la charge et la formule s\'écrivent.', 'info');
    AT.ionEnCours = { d, etat, defis, cadre };          // utile pour vérifier l'application
    return AT.ionEnCours;
  }

  Object.assign(AT, { simulateurIon });
})();
