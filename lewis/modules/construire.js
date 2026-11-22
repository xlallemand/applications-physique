/* ============================================================
   Module 1 : de l'atome à la molécule (manipulation guidée sur un seul écran)
   LW.pageConstruire(zone)
   Seize situations (pastilles nommées par la formule, accessibles dans n'importe quel ordre) :
     H2, Cl2, HCl, H2O, NH3, CH4, H2S, CO2, N2, O2, puis C2H6, CH4O, CH5N, C2H3Cl, C3H3N,
     puis le défi C3H8O : trouver les trois molécules (la même molécule redessinée est reconnue).
   La première fois qu'un élément apparaît, l'élève complète sa ligne du tableau des atomes
   (électrons de valence, électrons à gagner, liaisons, doublets non liants) : l'atome se dessine
   ensuite avec ses traits libres et ses doublets (tableau gardé dans le navigateur : lewis-tableau).
   Molécule terminée (aucun trait libre) : « 8 e⁻ » (« 2 e⁻ » pour H) sous chaque atome.
   Pour aller plus loin (hors programme) : formule semi-développée (rendu 'semi' d'ORGA).
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  const pl = LW.pl;
  const SITUATIONS = ['h2', 'cl2', 'hcl', 'h2o', 'nh3', 'ch4', 'h2s', 'co2', 'n2', 'o2', 'c2h6', 'ch4o', 'ch5n', 'c2h3cl', 'c3h3n', 'c3h8o'];
  const DEFI = ['propan1ol', 'propan2ol', 'methoxyethane'];
  const CLE = 'lewis-tableau';
  const COLS = [
    { id: 'v', t: 'Électrons de valence', c: 'Valence' },
    { id: 'g', t: 'Électrons à gagner', c: 'À gagner' },
    { id: 'l', t: 'Liaisons', c: 'Liaisons' },
    { id: 'd', t: 'Doublets non liants', c: 'Doublets' },
  ];

  const ligne = LW.ligneAtome, diagLigne = LW.diagLigne;

  function lireConnus() {
    try { const t = JSON.parse(localStorage.getItem(CLE) || '[]'); return new Set(Array.isArray(t) ? t : []); } catch (e) { return new Set(); }
  }
  function ecrireConnus(s) { try { localStorage.setItem(CLE, JSON.stringify([...s])); } catch (e) { /* stockage indisponible */ } }

  function pageConstruire(zone) {
    const connus = lireConnus();
    let outil = null, mol = null, ed = null, trouvees = [], finie = false;
    const c = LW.cadre(zone, {
      badge: 'MODULE 1 · MANIPULATION',
      titre: 'De l\'atome à la molécule',
      contexte: BULLE.info('Chaque atome arrive avec ses <b>liaisons à former</b> (traits libres en pointillés) et ses <b>doublets non liants</b>. Relie les traits libres deux à deux : <b>glisse</b> un trait vers un trait d\'un autre atome, ou <b>touche</b> les deux. Deux ou trois traits entre les mêmes atomes font une liaison double ou triple. Glisse un atome pour le déplacer ; touche une liaison pour la défaire.', 'Comment construire la molécule'),
      aria: 'Molécule et tableau des atomes',
      bande: `<p class="lw-bande-t" data-a="titre"></p><span class="lw-bande-b"><button type="button" class="btn-small" data-a="voirSemi" hidden>Formule semi-développée</button><button type="button" class="btn-small" data-a="re">↺ Recommencer</button></span>`,
      onglets: [
        { id: 'molecules', nom: 'Molécules', html: `
          <div class="lw-defis-puces lw-sit-puces lw-puces-f" data-a="puces" role="tablist" aria-label="Molécules"></div>
          <p class="lw-sit-num" data-a="num"></p>
          <p class="lw-sit-consigne" data-a="consigne"></p>
          <div class="lw-trouvees" data-a="trouvees"></div>
          <div class="lw-semi" data-a="semi" hidden></div>
          <div class="er-actions lw-sit-suite" data-a="suite"></div>` },
        { id: 'tableau', nom: 'Tableau des atomes', html: `
          <div class="lw-tab-defile"><table class="lw-tab-at" data-a="tab"></table></div>
          <div class="lw-ed" data-a="edition"></div>
          ${LW.revois(['classif'])}` },
      ],
    });
    const $ = c.$;
    const msg = (h, type) => c.message(h, type);
    const S = LW.situations($('puces'), SITUATIONS.map(id => ({ label: id === 'c3h8o' ? 'C<sub>3</sub>H<sub>8</sub>O ★' : LW.MOL[id].f, aria: id === 'c3h8o' ? 'Défi C3H8O' : LW.MOL[id].f.replace(/<[^>]+>/g, ''), large: true })), {
      aller: situation,
      suite: { href: 'module_2_manip.html', label: 'Module 2 : ce schéma est-il juste ? →' },
    });
    $('re').onclick = () => { if (outil) { outil.recommencer(); $('voirSemi').hidden = true; $('semi').hidden = true; if (!S.faites[S.n()] || SITUATIONS[S.n()] === 'c3h8o') suite(false); } };
    $('voirSemi').onclick = () => montrerSemi();

    /* ----- Une situation ----- */
    function situation(i) {
      const id = SITUATIONS[i], defi = id === 'c3h8o';
      mol = LW.molecule(defi ? DEFI[0] : id);
      finie = false;
      if (outil) outil.detruire();
      msg('');
      $('titre').innerHTML = defi ? `Défi : ${mol.f}` : `${mol.f} · ${mol.nom}`;
      $('num').innerHTML = `Situation ${i + 1} / ${SITUATIONS.length}`;
      $('consigne').innerHTML = defi ? `Avec ces atomes, on peut construire <b>trois</b> molécules différentes : trouve-les.` : 'Relie les traits libres deux à deux (glisse, ou touche les deux).';
      $('voirSemi').hidden = true; $('semi').hidden = true; $('semi').innerHTML = '';
      // défi déjà réussi : les trois molécules restent affichées (sinon, celles déjà trouvées)
      if (defi && S.faites[i]) trouvees = DEFI.slice();
      majTrouvees();
      outil = LW.constructeur(c.travail, mol, {
        connu: el => connus.has(el),
        cibles: defi ? null : [mol],
        message: msg,
        surFin: fin,
      });
      suite(false);
      preparerTableau();
    }
    function suite(principal) {
      const s = $('suite');
      s.innerHTML = '';
      s.appendChild(S.suivante(principal));
    }

    /* ----- Molécule terminée ----- */
    function fin(r) {
      if (!r.ok) return;
      const i = S.n(), id = SITUATIONS[i];
      const stable = 'Chaque atome a la configuration d\'un gaz noble : la molécule est <b>plus stable</b> que les atomes isolés.';
      if (id === 'c3h8o') {
        const k = DEFI.findIndex(d => LW.meme(r.etat, LW.molecule(d)));
        const deja = trouvees.indexOf(DEFI[k]);
        if (deja >= 0) {
          msg(`C'est la <b>même molécule</b> que la n° ${deja + 1}, dessinée autrement. Touche « ↺ Recommencer » et relie les atomes d'une autre façon.`, 'info');
          return;
        }
        trouvees.push(DEFI[k]);
        majTrouvees();
        if (trouvees.length === 3) {
          msg(`<b class="er-ok">Juste !</b> Tu as trouvé les trois molécules de formule ${mol.f} : il n'y en a pas d'autre. ${stable}`, 'ok');
          S.faite(i); suite(true);
        } else {
          msg(`<b class="er-ok">Juste !</b> Molécule n° ${trouvees.length} trouvée. ${stable}`, 'ok');
          const s = $('suite');
          s.innerHTML = '<button type="button" class="btn-primary" data-a="autre">Construire une autre molécule</button>';
          $('autre').onclick = () => { outil.recommencer(); $('voirSemi').hidden = true; $('semi').hidden = true; suite(false); };
        }
        $('voirSemi').hidden = false;
        return;
      }
      finie = true;
      $('consigne').innerHTML = '';
      msg(`<b class="er-ok">Juste !</b> ${stable}`, 'ok');
      S.faite(i);
      suite(true);
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

    /* ============================================================
       TABLEAU DES ATOMES
       ============================================================ */
    const elements = () => [...new Set(mol.atomes.map(a => a.el))];
    function preparerTableau() {
      const manque = elements().filter(el => !connus.has(el));
      ed = manque.length ? { el: manque[0], x: { v: null, g: null, l: null, d: null }, sel: 'v', erreurs: 0 } : null;
      majTableau();
      if (ed) {
        c.onglet('tableau');
        msg(`Complète la ligne de <b>${ed.el}</b> dans le tableau des atomes : il se dessinera ensuite avec ses liaisons et ses doublets non liants.`, 'info');
      } else c.onglet('molecules');
    }
    function majTableau() {
      const els = elements();
      $('tab').innerHTML = `<thead><tr><th>Atome</th>${COLS.map(k => `<th>${k.c}</th>`).join('')}<th>Dessin</th></tr></thead><tbody>${els.map(el => {
        if (connus.has(el)) {
          const b = ligne(el);
          return `<tr><th>${el}</th>${COLS.map(k => `<td>${b[k.id]}</td>`).join('')}<td class="lw-tab-dessin">${LW.atomeSeul(el, b.l, b.d, 46)}</td></tr>`;
        }
        if (ed && ed.el === el) {
          return `<tr class="lw-tab-ed"><th>${el}</th>${COLS.map(k => `<td><button type="button" class="lw-case${ed.sel === k.id ? ' lw-case-sel' : ''}${ed.ko && ed.ko.indexOf(k.id) >= 0 ? ' ko' : ''}" data-case="${k.id}" aria-pressed="${ed.sel === k.id}" aria-label="${k.t} de ${el} : ${ed.x[k.id] == null ? 'à remplir' : ed.x[k.id]}">${ed.x[k.id] == null ? '?' : ed.x[k.id]}</button></td>`).join('')}<td></td></tr>`;
        }
        return `<tr class="lw-tab-att"><th>${el}</th>${COLS.map(() => '<td>…</td>').join('')}<td></td></tr>`;
      }).join('')}</tbody>`;
      $('tab').querySelectorAll('[data-case]').forEach(b => { b.onclick = () => { ed.sel = b.dataset.case; majTableau(); }; });
      const e = $('edition');
      if (!ed) { e.innerHTML = els.every(el => connus.has(el)) ? '<p class="lw-aide-t">Tous les atomes de la molécule sont dans le tableau.</p>' : ''; return; }
      const Z = LW.info(ed.el).Z, k = COLS.find(x => x.id === ed.sel);
      e.innerHTML = `<p class="lw-ed-conf"><b>${ed.el}</b> (Z = ${Z}) : ${ATOME.configHTML(Z, { entourer: true })}</p>
        <p class="lw-ed-t">${k.t} de ${ed.el} :</p>
        <div class="lw-pave" role="group" aria-label="Chiffres">${[0, 1, 2, 3, 4, 5, 6, 7, 8].map(n => `<button type="button" class="btn-secondary" data-n="${n}">${n}</button>`).join('')}</div>
        <div class="er-actions lw-ed-a"><button type="button" class="btn-primary" data-a="valLigne">Valider la ligne</button><button type="button" class="btn-small" data-a="repLigne"${ed.erreurs >= 2 ? '' : ' hidden'}>Afficher la réponse</button></div>`;
      e.querySelectorAll('[data-n]').forEach(b => { b.onclick = () => chiffre(+b.dataset.n); });
      $('valLigne').onclick = validerLigne;
      $('repLigne').onclick = () => { ed.x = ligne(ed.el); ed.vue = true; validerLigne(); };
    }
    // un chiffre dans la case choisie, puis la case suivante encore vide
    function chiffre(n) {
      ed.x[ed.sel] = n;
      if (ed.ko) ed.ko = ed.ko.filter(id => id !== ed.sel);
      const ids = COLS.map(k => k.id), i = ids.indexOf(ed.sel);
      // case suivante : encore vide ou fausse, sinon la voisine
      const prochaine = ids.slice(i + 1).concat(ids.slice(0, i)).find(id => ed.x[id] == null || (ed.ko && ed.ko.indexOf(id) >= 0));
      ed.sel = prochaine || ids[(i + 1) % ids.length];
      majTableau();
    }
    function validerLigne() {
      const vide = COLS.find(k => ed.x[k.id] == null);
      if (vide) { msg(`Remplis les quatre cases de la ligne de <b>${ed.el}</b> (case « ${vide.t} »).`, 'info'); ed.sel = vide.id; majTableau(); return; }
      const b = ligne(ed.el);
      const ko = COLS.map(k => k.id).filter(id => ed.x[id] !== b[id]);
      if (ko.length) {
        ed.erreurs++; ed.ko = ko; ed.sel = ko[0];
        msg(`<b class="er-ko">Ce n'est pas ça.</b> ${diagLigne(ed.el, ed.x)}${ed.erreurs >= 2 ? '<br><span class="er-petit">Corrige ta réponse, ou affiche la réponse.</span>' : ''}`, 'ko');
        majTableau();
        return;
      }
      const el = ed.el, s = LW.info(el);
      connus.add(el); ecrireConnus(connus);
      const vue = ed.vue;
      ed = null;
      outil.activer();
      const txt = `${el} : ${pl(b.v, 'électron')} de valence ; il en gagne ${b.g} pour avoir ${s.regle} électrons comme ${s.regle === 2 ? 'He' : 'le gaz noble de sa ligne'} → <b>${pl(b.l, 'liaison')}</b> ; ${b.d ? `il reste ${b.v - b.l} électrons → <b>${LW.doublets(b.d)}</b>` : '<b>aucun doublet non liant</b>'}.`;
      const manque = elements().filter(x => !connus.has(x));
      if (manque.length) {
        ed = { el: manque[0], x: { v: null, g: null, l: null, d: null }, sel: 'v', erreurs: 0 };
        majTableau();
        msg(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${txt} Complète maintenant la ligne de <b>${ed.el}</b>.`, vue ? 'info' : 'ok');
      } else {
        majTableau();
        msg(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> ${txt} Relie maintenant les traits libres.`, vue ? 'info' : 'ok');
        c.onglet('molecules');
      }
    }

    S.aller(0);
    return { outil: () => outil, S };
  }

  LW.pageConstruire = pageConstruire;
})();
