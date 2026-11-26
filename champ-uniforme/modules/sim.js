/* ============================================================
   Cadre commun des trois pages sur un écran de l'application
   « Mouvement dans un champ uniforme » (simulateur de tir, simulateur
   de déviation, animation de l'accélérateur linéaire), repris de
   lois-newton/modules/sim.js (modèle : atome-ions/, cadreSim et defis).

   CU.cadre(zone, cfg) → { $, zone, onglet, message, fig, tel() }
     cfg = { badge, titre, bande (HTML au-dessus de la figure), bas (HTML sous la figure),
             onglets: [{ id, nom, sections: [ids], sectionsOrdi, tel (onglet du téléphone seulement),
                         ordi (onglet de l'ordinateur seulement) }],
             sections: [{ id, html }], surOnglet(id) }
     Ordinateur : figure à gauche, panneau à onglets à droite (≈ 330 px).
     Téléphone (< 900 px) : figure en haut, panneau à onglets dessous, dans l'écran.
   CU.defis(zone, liste, opts) → { verifier(etat), faits, tousFaits() }
     liste = [{ t (texte), ok(etat), preparer() }] ; cochés tout seuls, dans n'importe quel ordre ;
     opts.surReussite([i]), opts.bilan (HTML affiché quand tout est réussi).
   CU.reglage(o) → HTML d'un curseur : o = { id, nom, min, max, pas, val, aff(v) }
   ============================================================ */
(function () {
  'use strict';
  const CU = window.CU;

  /* ---------- Cadre ---------- */
  function cadre(zone, cfg) {
    zone.innerHTML = `<div class="cu-sim">
      <div class="er-card cu-sim-tete">
        <div class="cu-sim-titre"><span class="er-badge">${cfg.badge}</span><h2 class="er-titre">${cfg.titre}</h2></div>
        <span data-plein></span>
      </div>
      <div class="cu-sim-corps">
        <div class="er-card cu-sim-scene">
          ${cfg.bande ? `<div class="cu-sim-bande">${cfg.bande}</div>` : ''}
          <div class="cu-sim-fig" data-a="fig"></div>
          ${cfg.bas ? `<div class="cu-sim-bas">${cfg.bas}</div>` : ''}
          <div class="cu-sim-msg" data-a="msg" aria-live="polite"></div>
        </div>
        <aside class="er-card cu-sim-panneau" aria-label="Réglages">
          <div class="cu-sim-onglets" role="tablist">${cfg.onglets.map(o => `<button type="button" role="tab" data-o="${o.id}" aria-selected="false"${o.tel ? ' data-tel' : ''}${o.ordi ? ' data-ordi' : ''}>${o.nom}</button>`).join('')}</div>
          <div class="cu-sim-blocs">${cfg.sections.map(s => `<section class="cu-sim-bloc" data-s="${s.id}">${s.html}</section>`).join('')}</div>
        </aside>
      </div></div>`;
    const $ = a => zone.querySelector(`[data-a="${a}"]`);
    const mq = matchMedia('(max-width: 899px)');
    let courant = cfg.onglets[0].id;
    // un onglet montre une ou plusieurs sections ; sur ordinateur, un onglet « tel » est fondu dans le précédent
    function onglet(id) {
      const tel = mq.matches;
      let o = cfg.onglets.find(x => x.id === id) || cfg.onglets[0];
      if (!tel && o.tel) o = cfg.onglets[Math.max(0, cfg.onglets.indexOf(o) - 1)];
      if (tel && o.ordi) o = cfg.onglets.find(x => x.tel) || o;
      courant = o.id;
      const secs = tel ? o.sections : (o.sectionsOrdi || o.sections);
      zone.querySelectorAll('[data-o]').forEach(b => b.setAttribute('aria-selected', b.dataset.o === o.id ? 'true' : 'false'));
      zone.querySelectorAll('[data-s]').forEach(s => s.classList.toggle('actif', secs.indexOf(s.dataset.s) !== -1));
      if (cfg.surOnglet) cfg.surOnglet(o.id);
    }
    zone.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => onglet(b.dataset.o); });
    const placer = () => {
      onglet(courant);
      // bouton plein écran : dans l'en-tête sur ordinateur, au bout des onglets sur téléphone (l'en-tête y est caché)
      const pe = zone.querySelector('.pe-bouton');
      if (pe) (mq.matches ? zone.querySelector('.cu-sim-onglets') : zone.querySelector('.cu-sim-tete')).appendChild(pe);
    };
    setTimeout(placer, 0);
    if (mq.addEventListener) mq.addEventListener('change', placer); else mq.addListener(placer);
    onglet(courant);
    function message(h, type) {
      const m = $('msg');
      if (!h) { m.innerHTML = ''; return; }
      const cls = type === 'refus' ? 'callout-danger' : type === 'ok' ? 'callout-success' : 'callout-accent';
      m.innerHTML = `<div class="${cls} cu-sim-msg-in">${h}</div>`;
    }
    return { $, zone, onglet, message, fig: $('fig'), tel: () => mq.matches };
  }

  /* ---------- Défis « À essayer » ---------- */
  function defis(zone, liste, opts) {
    opts = opts || {};
    zone.innerHTML = `<div class="cu-defis-puces" role="tablist" aria-label="Défis">${liste.map((d, i) => `<button type="button" role="tab" class="cu-puce" data-p="${i}" aria-selected="false" aria-label="Défi ${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="cu-defi-t" data-a="defiTexte"></div><div class="cu-defis-bilan" data-a="bilanDefis" aria-live="polite"></div>`;
    const faits = liste.map(() => false), puces = Array.from(zone.querySelectorAll('.cu-puce'));
    let choisi = 0, marque = false;
    function choisir(i) {
      choisi = i;
      puces.forEach((p, k) => p.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      const d = liste[i];
      zone.querySelector('[data-a="defiTexte"]').innerHTML = `<p>${faits[i] ? '<b class="cu-ok">✓ Réussi :</b> ' : ''}${d.t}</p>${!faits[i] && d.preparer ? '<button type="button" class="btn-small cu-essayer" data-go>Essayer</button>' : ''}`;
      const go = zone.querySelector('[data-go]');
      if (go) go.onclick = () => d.preparer();
    }
    puces.forEach((p, i) => { p.onclick = () => choisir(i); });
    choisir(0);
    function verifier(etat) {
      const nouveaux = [];
      liste.forEach((d, i) => {
        if (!faits[i] && d.ok(etat)) { faits[i] = true; nouveaux.push(i); }
        puces[i].classList.toggle('fait', faits[i]);
        puces[i].setAttribute('aria-label', `Défi ${i + 1}${faits[i] ? ', réussi' : ''}`);
      });
      // des défis réussis (parfois plusieurs à la fois) : le suivant pas encore fait est montré
      if (nouveaux.length) {
        const der = nouveaux[nouveaux.length - 1], suivant = faits.findIndex((f, i) => !f && i > der);
        choisir(suivant >= 0 ? suivant : faits.indexOf(false) >= 0 ? faits.indexOf(false) : der);
        if (opts.surReussite) opts.surReussite(nouveaux);
      } else choisir(choisi);
      if (faits.every(Boolean)) {
        zone.querySelector('[data-a="bilanDefis"]').innerHTML = opts.bilan ? `<div class="callout-success cu-sim-msg-in">${opts.bilan}</div>` : '';
        if (!marque) { marque = true; window.SOM.marquer({ fait: true }); }
      }
    }
    return { verifier, faits, tousFaits: () => faits.every(Boolean) };
  }

  /* ---------- Curseur de réglage (étiquette, valeur affichée, input range) ---------- */
  function reglage(o) {
    return `<label class="cu-reglage"><span class="cu-reglage-l"><span>${o.nom}</span><b data-v="${o.id}"></b></span>
      <input type="range" data-r="${o.id}" min="${o.min}" max="${o.max}" step="${o.pas}" value="${o.val}" aria-label="${o.aria || o.nom.replace(/<[^>]+>/g, '')}"></label>`;
  }

  Object.assign(CU, { cadre, defis, reglage });
})();
