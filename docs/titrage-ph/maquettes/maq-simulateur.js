/* ============================================================
   Maquettes : simulateur de titrage (montage + commandes + courbe + tableau)
   (sera TITRAGE.creer dans assets/titrage.js)

   TPHM.simulateur(zone, {
     disposition: 'trois' | 'cote' | 'grand',   trois colonnes ; montage et courbe côte à côte, tableau en bandeau ;
                                                courbe en grand, montage réduit
     style: 'epure' | 'realiste',               dessin du montage
     commandes: 'pastilles' | 'boutons',        pastilles 1 / 0,2 / 0,1 mL puis « Verser » ; ou trois boutons « Verser … »
     fini(),                                    page terminée (V ≥ 16 mL et au moins 5 points dans le saut)
   }) → { verser(dixiemes), remplirAuto(), recommencer(), mesures() }
   Volumes gardés en dixièmes de mL entiers (pas d'erreur d'arrondi).
   ============================================================ */
(function () {
  'use strict';
  const NB = ' ';
  const fmt = (x, d) => TITRAGE.outils.fmt(x, d);
  const V_MAX = 250, V_FIN = 160;     // dixièmes de mL : burette de 25 mL ; aller jusqu'à 16 mL

  function simulateur(zone, o) {
    o = Object.assign({ disposition: 'trois', style: 'epure', commandes: 'pastilles' }, o || {});
    let pr = TPHM.prise();
    let modele = TPHM.modele(pr.veq);
    if (!pr.mesures.length) pr.mesures.push([0, TITRAGE.chimie.lecturePH(modele.pH(0), pr.decalage)]);
    let pas = 10;

    zone.innerHTML = `<div class="tph-sim tph-sim-${o.disposition}">
        <div class="tph-sim-montage" data-r="montage"></div>
        <div class="tph-sim-cmd" data-r="cmd">
          <p class="tph-consigne tph-sim-consigne">Verse l'acide 1 mL par 1 mL en notant le pH. Près du saut de pH, verse 0,2 mL à la fois, au moins 1 mL avant et 1 mL après le saut. Va jusqu'à 16 mL.</p>
          <div class="ttr-cmd" data-r="commandes"></div>
          <p class="ttr-msg" data-r="msg" role="status"></p>
        </div>
        <div class="tph-sim-courbe"><div class="tph-sim-c" data-r="courbe"></div>
          <div class="ttr-liens"><button type="button" class="lien" data-r="copier">Copier les mesures pour Regressi</button>
            <a href="../index.html#regressi" target="_blank" rel="noopener">Le faire avec Regressi</a>
            <button type="button" class="lien" data-r="recommencer">Recommencer (nouvelle prise d'essai)</button></div>
          <div data-r="copie"></div></div>
        <div class="tph-sim-tab" data-r="tab"></div>
      </div>`;
    const R = n => zone.querySelector(`[data-r="${n}"]`);
    const M = TPHM.montage(R('montage'), { style: o.style, appareil: 'ph', etiquettes: o.disposition !== 'grand' });
    const C = TPHM.courbe(R('courbe'), { xMax: 20 });
    const T = TPHM.tableau(R('tab'), { horizontal: o.disposition === 'cote' });

    // ---------- commandes ----------
    const cmd = R('commandes');
    if (o.commandes === 'pastilles') {
      cmd.innerHTML = `<div class="ttr-pas" role="group" aria-label="Volume à verser">${[10, 2, 1].map(p => `<button type="button" class="ttr-pastille" data-pas="${p}" aria-pressed="${p === pas}">${fmt(p / 10)} mL</button>`).join('')}</div>
        <div class="ttr-verser"><button type="button" class="btn-primary" data-r="verser">Verser</button><span class="ttr-lecture-v" data-r="lecV"></span></div>`;
      cmd.querySelectorAll('[data-pas]').forEach(b => b.addEventListener('click', () => {
        pas = +b.dataset.pas;
        cmd.querySelectorAll('[data-pas]').forEach(x => x.setAttribute('aria-pressed', x === b));
      }));
      R('verser').addEventListener('click', () => verser(pas));
    } else {
      cmd.innerHTML = `<div class="ttr-verser">${[10, 2, 1].map(p => `<button type="button" class="btn-secondary ttr-verser-direct" data-v="${p}">Verser ${fmt(p / 10)} mL</button>`).join('')}</div>
        <span class="ttr-lecture-v" data-r="lecV"></span>`;
      cmd.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => verser(+b.dataset.v)));
    }

    const vAct = () => pr.mesures.reduce((m, x) => Math.max(m, x[0]), 0);
    function afficher(goutte) {
      const v = vAct(), dern = pr.mesures.find(x => x[0] === v);
      M.maj({ V: v / 10, affichage: fmt(dern[1], 2), couleur: modele.couleur(v / 10), goutte });
      R('lecV').textContent = 'V = ' + fmt(v / 10, 1) + ' mL';
      C.maj(pr.mesures);
      T.maj(pr.mesures);
      etat();
    }
    function sauver() { TPHM.tpEcrire({ prise: pr }); }
    // la page est terminée quand V ≥ 16 mL et au moins 5 points dans le saut (± 1 mL autour de l'équivalence)
    function etat() {
      const v = vAct(), msg = R('msg');
      const dansSaut = pr.mesures.filter(x => Math.abs(x[0] / 10 - pr.veq) <= 1).length;
      if (v >= V_FIN && dansSaut >= 5) {
        msg.className = 'ttr-msg ok';
        msg.innerHTML = `✓ Titrage terminé. <a href="module_3a_equivalence.html">Repérer le volume équivalent →</a>`;
        if (!pr.fini) { pr.fini = true; sauver(); o.fini && o.fini(); }
      } else if (v >= V_FIN) {
        msg.className = 'ttr-msg';
        msg.textContent = 'Ajoute des points de 0,2 mL près du saut : la courbe y sera plus précise. Recommence le titrage (nouvelle prise d’essai).';
      } else if (v >= V_MAX) {
        msg.className = 'ttr-msg'; msg.textContent = 'La burette est vide (25 mL).';
      } else { msg.className = 'ttr-msg'; msg.textContent = ''; }
    }
    function verser(d) {
      const v = vAct();
      if (v + d > V_MAX) { R('msg').textContent = 'La burette ne contient que 25 mL.'; return; }
      const nv = v + d;
      pr.mesures.push([nv, TITRAGE.chimie.lecturePH(modele.pH(nv / 10), pr.decalage)]);
      sauver();
      afficher(true);
    }
    function remplirAuto() {
      pr.mesures = TPHM.mesuresAuto(pr);
      sauver();
      afficher(false);
    }
    // recommencer : confirmation sur place si des mesures existent
    R('recommencer').addEventListener('click', ev => {
      const b = ev.currentTarget;
      if (pr.mesures.length > 1 && !b.dataset.confirme) {
        b.dataset.confirme = '1';
        b.textContent = 'Effacer tes mesures et refaire une prise d’essai ? Oui';
        setTimeout(() => { delete b.dataset.confirme; b.textContent = 'Recommencer (nouvelle prise d’essai)'; }, 4000);
        return;
      }
      delete b.dataset.confirme;
      b.textContent = 'Recommencer (nouvelle prise d’essai)';
      pr = TPHM.nouvellePrise();
      modele = TPHM.modele(pr.veq);
      pr.mesures.push([0, TITRAGE.chimie.lecturePH(modele.pH(0), pr.decalage)]);
      sauver();
      afficher(false);
    });
    R('copier').addEventListener('click', () => TPHM.copierRegressi(pr.mesures.slice().sort((a, b) => a[0] - b[0]), R('copie')));
    afficher(false);
    return { verser, remplirAuto, mesures: () => pr.mesures };
  }

  window.TPHM.simulateur = simulateur;
})();
