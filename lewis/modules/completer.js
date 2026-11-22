/* ============================================================
   Module 3 : compléter un schéma (manipulation guidée sur un seul écran)
   LW.pageCompleter(zone)
   Huit schémas incomplets (dans n'importe quel ordre) : éthanamine, éthane-1,2-diol, méthanal,
   méthanimine (doublets non liants manquants), CO2, N2, acrylonitrile (liaison double ou triple
   manquante), puis le glucose en défi final.
   Gestes (LW.completeur) : toucher un atome puis + / − doublet non liant ; toucher une liaison
   change son ordre (simple → double → triple → simple). « Vérifier » : contrôle atome par atome,
   l'atome fautif est entouré et le diagnostic le nomme.
   ============================================================ */
(function () {
  'use strict';
  const LW = window.LW;
  // sans les doublets non liants des atomes el
  const sansDoublets = els => m => { m.atomes.forEach(a => { if (els.indexOf(a.el) >= 0) a.d = 0; }); };
  // liaisons multiples remplacées par des liaisons simples
  const simples = m => { m.liaisons.forEach(l => { l.o = 1; }); };
  const SITUATIONS = [
    { id: 'ethanamine', mod: sansDoublets(['N']) },
    { id: 'ethanediol', mod: sansDoublets(['O']) },
    { id: 'methanal', mod: sansDoublets(['O']) },
    { id: 'methanimine', mod: sansDoublets(['N']) },
    { id: 'co2', mod: simples },
    { id: 'n2', mod: simples },
    { id: 'c3h3n', mod: simples },
    { id: 'glucose', mod: sansDoublets(['O']), defi: true },
  ];

  function pageCompleter(zone) {
    let mol = null, outil = null, erreurs = 0;
    const c = LW.cadre(zone, {
      badge: 'MODULE 3 · MANIPULATION',
      titre: 'Compléter un schéma',
      contexte: BULLE.info('Il manque des <b>doublets non liants</b> ou une <b>liaison double ou triple</b>. Touche un atome puis ajoute ou retire un doublet non liant ; touche une liaison pour changer son ordre. Chaque atome doit être entouré de <b>8 électrons</b> (2 pour H).', 'Comment compléter un schéma'),
      aria: 'Compléter le schéma',
      bande: '<p class="lw-bande-t" data-a="titre"></p><span class="lw-bande-b"><button type="button" class="btn-small" data-a="re">↺ Recommencer</button></span>',
      onglets: [{ id: 'schema', nom: 'Schéma', html: `
        <div class="lw-sit-tete"><div class="lw-defis-puces lw-sit-puces" data-a="puces" role="tablist" aria-label="Situations"></div><span data-a="peTel"></span></div>
        <p class="lw-sit-num" data-a="num"></p>
        <p class="lw-sit-consigne" data-a="consigne"></p>
        <div class="lw-cmp" data-a="outils"></div>
        <div class="er-actions lw-sit-suite" data-a="suite"></div>` }],
      peTel: '[data-a="peTel"]',
    });
    const $ = c.$;
    const msg = (h, type) => c.message(h, type);
    const S = LW.situations($('puces'), SITUATIONS.map((s, i) => ({ label: s.defi ? `${i + 1} ★` : String(i + 1), large: s.defi, aria: s.defi ? 'Défi final : le glucose' : `Situation ${i + 1}` })), {
      aller: situation,
      suite: { href: 'module_4_questions.html', label: 'Module 4 : entraînement →' },
    });
    $('re').onclick = () => situation(S.n());

    function situation(i) {
      const s = SITUATIONS[i];
      mol = LW.molecule(s.id, s.mod);
      erreurs = 0;
      if (outil) outil.vue.detruire();
      msg('');
      $('titre').innerHTML = `${s.defi ? 'Défi : ' : ''}${mol.f} · ${mol.nom}`;
      $('num').innerHTML = `Situation ${i + 1} / ${SITUATIONS.length}`;
      $('consigne').innerHTML = s.defi ? 'Complète le schéma du glucose, puis vérifie.' : 'Complète le schéma, puis vérifie.';
      outil = LW.completeur(c.travail, $('outils'), mol, {
        solution: LW.molecule(s.id),
        message: msg,
        surVerif: verif,
      });
      suite();
    }
    function suite(principal) {
      const z = $('suite');
      z.innerHTML = '';
      if (!principal && erreurs >= 2 && !outil.fini()) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'btn-small'; b.textContent = 'Afficher la réponse';
        b.onclick = () => { outil.montrer(); fin(true); };
        z.appendChild(b);
      }
      z.appendChild(S.suivante(principal));
    }
    function verif(r) {
      if (r.ok) return fin(false);
      erreurs++;
      msg(`<b class="er-ko">Ce n'est pas ça.</b> ${r.diag}${erreurs >= 2 ? '<br><span class="er-petit">Corrige ta réponse, ou affiche la réponse.</span>' : ''}`, 'ko');
      suite();
    }
    function fin(vue) {
      msg(`<b class="${vue ? '' : 'er-ok'}">${vue ? 'Réponse.' : 'Juste !'}</b> Chaque atome a la configuration d'un gaz noble : ${LW.bilanJuste(mol)}`, vue ? 'info' : 'ok');
      S.faite(S.n());
      suite(true);
    }

    S.aller(0);
    LW.etatPage = () => ({ mol, outil });
    return { S };
  }

  LW.pageCompleter = pageCompleter;
})();
