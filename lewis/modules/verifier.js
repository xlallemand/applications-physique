/* ============================================================
   Module 2 : ce schéma est-il juste ? (manipulation guidée sur un seul écran)
   LW.pageVerifier(zone)
   Dix situations (dans n'importe quel ordre) : HOCl (juste), HCN (deux propositions),
   un schéma d'élève de C4H10O, puis des variantes fausses : doublet non liant retiré sur O
   ou sur N, liaison en trop sur C, H avec deux liaisons, doublet en trop sur Cl,
   liaison double au lieu de simple.
   1. Compter : toucher un atome, donner ses doublets liants, ses doublets non liants et le nombre
      d'électrons autour (2 par doublet) ; l'atome reçoit son étiquette « 8 e⁻ ». Les H qui n'ont
      qu'une liaison sont tous pareils : en compter un suffit.
   2. Conclure avec des expressions à piocher (LW.conclusion), une fois tous les atomes comptés.
   Diagnostics : doublet compté pour 1 électron, liaison comptée pour un seul atome, liaison double
   comptée pour un seul doublet, « faux » sans dire quel atome, « juste » alors qu'un atome n'a pas 8 électrons.
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const E = '<tspan dy="-.45em" font-size=".75em">−</tspan>';
  const SITUATIONS = [
    { id: 'hocl', titre: 'HOCl' },
    { id: 'hcn', titre: 'HCN, proposition 1', mod: m => { m.liaisons[1].o = 1; m.atomes[1].d = 2; m.atomes[2].d = 3; } },
    { id: 'hcn', titre: 'HCN, proposition 2' },
    { id: 'c4h10o', titre: 'Schéma proposé pour C<sub>4</sub>H<sub>10</sub>O', mod: m => {
      // schéma d'un élève : O sans doublet non liant, deux C sans leur quatrième liaison (H oubliés)
      m.atomes[12].d = 0;
      [14, 8].forEach(h => { m.atomes.splice(h, 1); m.liaisons = m.liaisons.filter(l => l.a !== h && l.b !== h).map(l => ({ a: l.a > h ? l.a - 1 : l.a, b: l.b > h ? l.b - 1 : l.b, o: l.o })); });
    } },
    { id: 'h2o', mod: m => { m.atomes[1].d = 1; } },
    { id: 'nh3', mod: m => { m.atomes[1].d = 0; } },
    { id: 'c2h6', mod: m => { m.liaisons[0].o = 2; } },
    { id: 'hcl', mod: m => { m.liaisons[0].o = 2; m.atomes[1].d = 2; } },
    { id: 'ch3cl', mod: m => { m.atomes[4].d = 4; } },
    { id: 'ch4o', mod: m => { m.liaisons[3].o = 2; } },
  ];
  const COMPTEURS = [{ id: 'l', t: 'Liants', aria: 'doublets liants' }, { id: 'd', t: 'Non liants', aria: 'doublets non liants' }, { id: 'e', t: 'Électrons', aria: 'électrons autour' }];

  // diagnostic du comptage d'un atome (x : { l, d, e } donné par l'élève)
  function diagCompte(a, x) {
    const el = a.el;
    if (x.l !== a.l) {
      if (x.l === a.nv && a.l > a.nv) return 'Une liaison double compte pour 2 doublets liants, une liaison triple pour 3.';
      if (x.l < a.l) return el === 'H' ? 'Le trait entre H et son voisin est une liaison : une liaison compte pour les deux atomes qu\'elle relie.'
        : `Compte tous les traits qui relient ${el} à ses voisins, même ceux qui vont vers un H : une liaison compte pour les deux atomes qu'elle relie.`;
      return `Compte seulement les traits qui relient ${el} à un autre atome : les traits seuls, autour du symbole, sont des doublets non liants.`;
    }
    if (x.d !== a.d) {
      if (x.d === a.d + a.l) return `Les doublets non liants sont les traits qui ne relient ${el} à aucun atome : ne compte pas les liaisons.`;
      return `Compte les traits autour de ${el} qui ne le relient à aucun atome.`;
    }
    if (x.e !== a.e) {
      if (x.e === 2 * a.l + a.d && a.d) return 'Un doublet, c\'est 2 électrons : les doublets non liants aussi comptent pour 2.';
      if (x.e === a.l + a.d) return 'Un doublet (liant ou non liant), c\'est 2 électrons.';
      if (x.e === a.l + 2 * a.d) return 'Chaque liaison est un doublet de 2 électrons : elle compte pour les deux atomes qu\'elle relie.';
      return `${LW.pl(a.l + a.d, 'doublet')} autour de ${el} : 2 électrons par doublet.`;
    }
    return '';
  }

  function pageVerifier(zone) {
    let mol = null, an = null, vue = null, conc = null, choisi = null, compte = [], x = null, err = { c: 0, k: 0 }, finie = false;
    const c = LW.cadre(zone, {
      badge: 'MODULE 2 · MANIPULATION',
      titre: 'Ce schéma est-il juste ?',
      contexte: BULLE.info('Pour chaque atome, compte les <b>doublets liants</b> (les liaisons) et les <b>doublets non liants</b> : 2 électrons par doublet. H doit être entouré de <b>2 électrons</b> (règle du duet), les autres atomes de <b>8 électrons</b> (règle de l\'octet). Puis conclus.', 'Comment vérifier un schéma'),
      aria: 'Comptage et conclusion',
      bande: '<p class="lw-bande-t" data-a="titre"></p>',
      entete: `<div class="lw-sit-tete"><div class="lw-defis-puces lw-sit-puces" data-a="puces" role="tablist" aria-label="Situations"></div></div>`,
      onglets: [
        { id: 'compter', nom: 'Compter', html: `<div class="lw-cpt-zone" data-a="cpt"></div>` },
        { id: 'conclure', nom: 'Conclure', html: `<p class="lw-cpt-t" data-a="avant"></p><div class="lw-concl" data-a="concl"></div>` },
      ],
      surOnglet: o => { zone.querySelector('.lw-sim').classList.toggle('lw-mode-concl', o === 'conclure'); },
    });
    zone.querySelector('.lw-sim').classList.add('lw-m2');
    const $ = c.$;
    const msg = (h, type) => c.message(h, type);
    const S = LW.situations($('puces'), SITUATIONS.map((s, i) => ({ label: String(i + 1) })), {
      aller: situation,
      suite: { href: 'module_3_manip.html', label: 'Module 3 : compléter un schéma →' },
    });
    // « Afficher la réponse » de la conclusion (placé sur la ligne de Valider)
    const repC = document.createElement('button');
    repC.type = 'button'; repC.className = 'btn-small'; repC.textContent = 'Afficher la réponse'; repC.hidden = true;
    repC.onclick = () => { if (conc && !conc.fini()) { conc.montrer(); terminer(true); } };

    /* ----- Une situation ----- */
    function situation(i) {
      const s = SITUATIONS[i];
      mol = LW.molecule(s.id, s.mod);
      an = LW.analyse(mol);
      compte = an.map(() => null);
      choisi = null; finie = false; err = { c: 0, k: 0 };
      if (vue) vue.detruire();
      $('titre').innerHTML = `${i + 1}. ${s.titre || `Schéma proposé pour ${mol.f}`}`;
      msg('Touche un atome du schéma pour compter ses doublets.', 'info');
      vue = LW.vue(c.travail, mol, { surAtome: toucher });
      conc = null;
      $('concl').innerHTML = ''; repC.hidden = true;
      majCompteur(); majConclure();
      c.onglet('compter');
    }
    // atomes à compter : tous, sauf les H qui n'ont qu'une liaison (en compter un suffit)
    const groupe = i => (an[i].el === 'H' && an[i].l === 1 && an[i].d === 0 ? 'H' : i);
    const restants = () => an.map((a, i) => i).filter(i => !compte[i]).map(groupe).filter((g, k, t) => t.indexOf(g) === k);
    function etiquettes() {
      return compte.map((x, i) => (x ? { t: `${an[i].e} e${E}`, faux: an[i].e !== an[i].regle } : null));
    }
    function rendre(marques) { vue.rendre({ choisi, etiquettes: etiquettes(), marques: marques || new Set() }); }

    function toucher(i) {
      if (finie) return;
      choisi = i;
      x = { l: 0, d: 0, e: 0 };
      rendre();
      if (!compte[i]) msg('');
      if (c.actif() !== 'compter') c.onglet('compter');
      majCompteur();
    }

    /* ----- Compter ----- */
    function majCompteur() {
      const z = $('cpt'), n = restants().length;
      if (choisi == null) {
        z.innerHTML = `<p class="lw-cpt-t">Touche un atome du schéma : compte ses <b>doublets liants</b> (les liaisons), ses <b>doublets non liants</b> et les <b>électrons</b> autour de lui.</p>
          <p class="lw-compte">${n ? `Atomes à compter : ${n}` : 'Tous les atomes sont comptés.'}</p>`;
        return;
      }
      const a = an[choisi];
      if (compte[choisi]) {
        z.innerHTML = `<p class="lw-cpt-t"><b>${a.el}</b> : ${LW.pl(a.l, 'doublet')} liant${a.l > 1 ? 's' : ''}, ${LW.pl(a.d, 'doublet')} non liant${a.d > 1 ? 's' : ''} → <b>${a.e} électrons</b> autour${a.e === a.regle ? ` : il respecte la règle ${a.regle === 2 ? 'du duet' : 'de l\'octet'}` : ` au lieu de ${a.regle}`}.</p>
          <p class="lw-compte">${n ? `Atomes à compter : ${n}` : 'Tous les atomes sont comptés : conclus.'}</p>`;
        return;
      }
      z.innerHTML = `<p class="lw-cpt-t">Autour de <b>${a.el}</b> :</p>
        <div class="lw-cpts">${COMPTEURS.map(k => `<div class="lw-cpt${x.ko && x.ko.indexOf(k.id) >= 0 ? ' ko' : ''}"><span class="lw-cpt-l">${k.t}</span>
          <span class="lw-cpt-c"><button type="button" class="btn-secondary" data-m="${k.id}" aria-label="Moins de ${k.aria}">−</button><output class="lw-cpt-v" aria-label="${k.aria}">${x[k.id]}</output><button type="button" class="btn-secondary" data-p="${k.id}" aria-label="Plus de ${k.aria}">+</button></span></div>`).join('')}</div>
        <div class="er-actions lw-cpt-a"><button type="button" class="btn-primary" data-a="valCpt">Valider pour ${a.el}</button><button type="button" class="btn-small" data-a="repCpt"${err.c >= 2 ? '' : ' hidden'}>Afficher la réponse</button></div>`;
      z.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => { x[b.dataset.m] = Math.max(0, x[b.dataset.m] - 1); majCompteur(); }; });
      z.querySelectorAll('[data-p]').forEach(b => { b.onclick = () => { x[b.dataset.p] = Math.min(12, x[b.dataset.p] + 1); majCompteur(); }; });
      $('valCpt').onclick = () => validerCompte(false);
      $('repCpt').onclick = () => validerCompte(true);
    }
    function validerCompte(vue) {
      const a = an[choisi];
      if (!vue) {
        const ko = COMPTEURS.map(k => k.id).filter(id => x[id] !== a[id]);
        if (ko.length) {
          err.c++; x.ko = ko;
          msg(`<b class="er-ko">Ce n'est pas ça.</b> ${diagCompte(a, x)}${err.c >= 2 ? '<br><span class="er-petit">Corrige ta réponse, ou affiche la réponse.</span>' : ''}`, 'ko');
          majCompteur();
          return;
        }
      }
      err.c = 0;
      // l'atome compté, et les H pareils
      const g = groupe(choisi);
      an.forEach((b, i) => { if (i === choisi || (g === 'H' && groupe(i) === 'H')) compte[i] = { l: b.l, d: b.d, e: b.e }; });
      const regle = a.regle === 2 ? 'règle du duet' : 'règle de l\'octet';
      const txt = `${a.el} : ${a.l} + ${a.d} = ${LW.pl(a.l + a.d, 'doublet')}, soit <b>${a.e} électrons</b> autour${a.e === a.regle ? ` : ${regle} respectée` : ` au lieu de ${a.regle} : ${regle} <b>non respectée</b>`}.${g === 'H' ? ' Les autres H, liés une fois, sont pareils.' : ''}`;
      const n = restants().length;
      msg(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${txt}${n ? '' : ' Tous les atomes sont comptés : conclus.'}`, vue ? 'info' : 'ok');
      choisi = null;
      rendre();
      majCompteur();
      if (!n) { majConclure(); c.onglet('conclure'); }
    }

    /* ----- Conclure ----- */
    function majConclure() {
      const n = restants().length;
      if (n) {
        $('avant').innerHTML = `Compte d'abord les doublets autour de chaque atome (onglet Compter) : encore ${LW.pl(n, 'atome')} à compter.`;
        $('avant').hidden = false;
        return;
      }
      $('avant').hidden = true;
      if (conc) return;
      conc = LW.conclusion($('concl'), mol, {
        raisons: 6,
        surChange() { msg(''); },
        surValider(r) {
          if (r.vide) return msg(r.diag, 'info');
          if (!r.ok) {
            err.k++;
            msg(`<b class="er-ko">Ce n'est pas ça.</b> ${r.diag}${err.k >= 2 ? '<br><span class="er-petit">Corrige ta réponse, ou affiche la réponse.</span>' : ''}`, 'ko');
            if (err.k >= 2) repC.hidden = false;
            return;
          }
          terminer(false);
        },
      });
      conc.actions().appendChild(repC);
    }
    function terminer(vue) {
      finie = true;
      repC.hidden = true;
      const fautifs = new Set(an.map((a, i) => i).filter(i => !an[i].bon));
      rendre(fautifs);
      const txt = conc.juste ? `Le schéma est juste : ${LW.bilanJuste(mol)}` : `Le schéma est faux : ${LW.correction(mol)}`;
      msg(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${txt}`, vue ? 'info' : 'ok');
      S.faite(S.n());
      conc.actions().appendChild(S.suivante(true));
    }

    S.aller(0);
    // état de la page (utile pour vérifier l'application)
    LW.etatPage = () => ({ mol, an, compte, restants: restants() });
    return { S };
  }

  LW.pageVerifier = pageVerifier;
})();
