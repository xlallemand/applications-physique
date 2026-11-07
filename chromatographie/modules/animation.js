/* ============================================================
   Module 1 : « Animation : réaliser une CCM »
   (application « Chromatographie sur couche mince »)

   CC.animationCCM(zone)
     zone : toute la manipulation, sur un seul écran d'ordinateur :
            la scène (plaque, cuve, outils dessinés) à gauche, la consigne
            et les outils de l'étape en cours à droite (dessous sur téléphone) ;
            le schéma à légender, puis le bilan, prennent ensuite sa place.

   Gestes dans l'ordre du laboratoire ; seuls les outils de l'étape en
   cours sont affichés ; un geste fait trop tôt dans l'étape est refusé
   (rien ne change) avec son explication :
     0 tracer le trait de dépôt   1 faire les dépôts (dont une espèce incolore)
     2 préparer la cuve           3 élution (sortir la plaque à temps)
     4 repérer le front           5 révéler sous UV et entourer
     6 légender le schéma         7 bilan
   Les boutons « Sortir la plaque » et de la lampe UV sont posés sur la
   scène, au-dessus de la plaque : on voit le front et le bouton ensemble.
   Utilise CCM (ccm.js), CC.legende (cc.js), SOM.marquer.
   ============================================================ */
(function () {
  'use strict';

  const L = 6, HP = 10;                                 // plaque : largeur et hauteur (cm)
  const EMPL = [1, 2, 3, 4, 5];                         // emplacements des dépôts sur le trait (cm)
  const MH = .7;                                        // place ajoutée au-dessus de la cuve (cm) : lampe, bouton « Sortir la plaque »
  const SORTIE = 8.5;                                   // hauteur du front (cm) à partir de laquelle on peut sortir la plaque
  const FLACONS = [
    { nom: 'A', especes: ['A'], t: 'corps pur coloré' }, { nom: 'B', especes: ['B'], t: 'corps pur incolore' },
    { nom: 'C', especes: ['C'], t: 'corps pur coloré' }, { nom: 'D', especes: ['D'], t: 'corps pur incolore' },
    { nom: 'M', especes: ['A', 'C'], t: 'mélange coloré' }, { nom: 'N', especes: ['B', 'D', 'X'], t: 'mélange incolore' },
  ];
  const ETAPES = [
    { t: 'Trait de dépôt', c: 'Trace le <b>trait de dépôt</b> au crayon, doucement, à 1 cm du bas de la plaque.' },
    { t: 'Dépôts', c: 'Fais 2 à 5 <b>dépôts</b> sur le trait, dont au moins un dépôt <b>incolore</b> : touche un flacon, puis un emplacement.' },
    { t: 'Cuve', c: 'Sous la hotte : verse l\'<b>éluant</b> dans la cuve, pose la plaque, ferme le <b>couvercle</b>, puis lance l\'élution.' },
    { t: 'Élution', c: 'L\'éluant monte et entraîne les espèces. <b>Sors la plaque</b> quand le front est à environ 1 cm du haut.' },
    { t: 'Front de l\'éluant', c: 'Repère le <b>front de l\'éluant</b> : trace un trait au crayon à sa hauteur, avant que la plaque sèche.' },
    { t: 'Révélation', c: 'Révèle les taches sous la <b>lampe UV</b> et entoure chaque tache au crayon.' },
    { t: 'Schéma', c: '<b>Légende le schéma</b> du dispositif.' },
  ];
  const PRINCIPE = 'Lors de la chromatographie, l\'éluant monte en entraînant avec lui les espèces présentes dans le dépôt. Les différentes espèces sont plus ou moins entraînées et montent à des hauteurs différentes. On peut ainsi séparer et identifier les constituants d\'un mélange.';
  const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const incolore = d => d.especes.some(s => !CCM.ESPECES[s].couleur);
  const pc = (v, t) => (v / t * 100).toFixed(2) + '%';
  const pluriel = (n, m) => `${n} ${m}${n > 1 ? 's' : ''}`;

  function animationCCM(zone) {
    let st, anim, etapeOutils = -1, cleSur = '';

    function etatInitial() {
      return {
        etape: 0, rate: false, echec: false, msg: null, diag: null,
        traitH: .5, progres: 0, trait: null,                    // étape 0
        depots: [], flacon: null,                               // étape 1
        niveau: 0, posee: false, couvercle: false,              // étape 2
        vit: 1,                                                 // étape 3
        front: null, ligne: 7, frontTrait: null,                // étape 4
        uv: false, vuUV: false, cercles: [],                    // étape 5
      };
    }

    /* ---------- page ---------- */
    function construire() {
      st = etatInitial(); etapeOutils = -1; cleSur = '';
      zone.innerHTML = `<div class="cc-manip">
          <div class="cc-fig cc-scene-cadre"><div class="cc-scene"><div class="cc-sur"></div></div></div>
          <div class="cc-panneau">
            <p class="cc-etape"></p>
            <div class="cc-consigne" aria-live="polite"></div>
            <div class="cc-outils"></div>
            <div class="cc-retour" aria-live="polite"></div>
            <div class="cc-pied"><button type="button" class="btn-small" data-a="tout">↺ Recommencer</button></div>
          </div></div>`;
      anim = CCM.animation(zone.querySelector('.cc-scene'), {
        depots: st.depots, largeur: L, hauteur: HP, trait: null, niveau: 0, cuve: false, couvercle: false, regle: true, noms: true,
        arret: HP, duree: 20, marges: { h: MH },
        aria: 'Plaque de chromatographie et cuve : animation des gestes de la CCM',
        calque, fixe, onFin: auBord,
      });
      ecouterScene();
      maj();
    }
    function recommencer() { if (anim) anim.pause(); construire(); haut(); }
    // téléphone : quand une étape remplace la scène, on revient en haut de la zone
    function haut() { const t = zone.getBoundingClientRect().top; if (t < 0) window.scrollBy(0, t - 80); }
    // un seul écouteur pour tous les boutons (les outils changent à chaque étape)
    zone.addEventListener('click', ev => {
      const b = ev.target.closest && ev.target.closest('[data-a]');
      if (b && zone.contains(b) && !b.disabled) action(b.dataset.a, b);
    });

    /* ---------- outils dessinés sur la scène (crayon, emplacements, trait du front, lampe) ---------- */
    function calque(g) {
      const k = g.k, P = g.px, Y = g.py;
      let s = '';
      if (st.etape === 0 && !st.rate) {
        // guide du trait et crayon (pointe au bout du trait en cours)
        const x = P(.25 + (L - .5) * st.progres), y = Y(st.traitH);
        s += `<line class="cc-guide" x1="${P(.25)}" y1="${y}" x2="${P(L - .25)}" y2="${y}"/>`;
        s += `<g class="cc-crayon" transform="translate(${x} ${y}) rotate(-35)">
          <polygon class="cc-crayon-bois" points="0,0 8,-4 8,4"/><rect class="cc-crayon-corps" x="8" y="-4" width="62" height="8" rx="1.5"/>
          <polygon class="cc-crayon-mine" points="0,0 3,-1.5 3,1.5"/></g>`;
      }
      if (st.etape === 1 && !st.rate) {
        EMPL.forEach(xe => {
          if (st.depots.some(d => d.x === xe)) return;
          s += `<circle class="cc-empl${st.flacon ? ' actif' : ''}" cx="${P(xe)}" cy="${Y(st.trait)}" r="${.3 * k}"/>`;
        });
      }
      if (st.etape === 4) {
        const y = Y(st.ligne);
        s += `<line class="cc-ligne-front" x1="${P(0)}" y1="${y}" x2="${P(L)}" y2="${y}"/>
          <circle class="cc-poignee-v" cx="${P(L) + .55 * k}" cy="${y}" r="${.32 * k}"/>`;
      }
      if (st.etape === 5) s += lampe(g);
      return s;
    }
    // boîtier de la lampe UV (unités SVG), au-dessus de la plaque : le bouton de la lampe le recouvre
    const boiteLampe = g => ({ x: g.px(-.3), y: g.py(HP) - 2.55 * g.k, w: (L + .6) * g.k, h: 1.2 * g.k });
    // tube de la lampe ; allumée : lueur violette et faisceau jusqu'à la plaque
    function lampe(g) {
      const k = g.k, P = g.px, Y = g.py, B = boiteLampe(g);
      const yt = B.y + B.h + .1 * k, x0 = B.x + .4 * k, x1 = B.x + B.w - .4 * k;
      let s = `<defs><linearGradient id="cc-faisceau" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" class="cc-uv-stop" stop-opacity=".6"/><stop offset="1" class="cc-uv-stop" stop-opacity=".12"/></linearGradient>
        <filter id="cc-halo" x="-10%" y="-300%" width="120%" height="700%"><feGaussianBlur stdDeviation="${(.16 * k).toFixed(1)}"/></filter></defs>`;
      if (st.uv) {
        s += `<path fill="url(#cc-faisceau)" d="M${x0},${yt} L${x1},${yt} L${P(L + .05)},${Y(HP)} L${P(-.05)},${Y(HP)} Z"/>`;
        s += `<rect class="cc-tube on" x="${x0}" y="${yt - .12 * k}" width="${x1 - x0}" height="${.24 * k}" rx="${.12 * k}" filter="url(#cc-halo)"/>`;
      }
      s += `<rect class="cc-tube${st.uv ? ' on' : ''}" x="${x0}" y="${yt - .12 * k}" width="${x1 - x0}" height="${.24 * k}" rx="${.12 * k}"/>`;
      return s;
    }

    // poignées persistantes (jamais redessinées) : crayon (étape 0) et trait du front (étape 4)
    function fixe(g, gr) {
      const NS = 'http://www.w3.org/2000/svg', k = g.k;
      if (!gr.firstChild) {
        ['crayon', 'ligne'].forEach(n => {
          const el = document.createElementNS(NS, n === 'crayon' ? 'circle' : 'rect');
          el.setAttribute('class', 'ccm-poignee'); el.dataset.p = n; gr.appendChild(el);
        });
      }
      const [c, l] = gr.children;
      const vc = st.etape === 0 && !st.rate, vl = st.etape === 4;
      c.style.display = vc ? '' : 'none'; l.style.display = vl ? '' : 'none';
      if (vc) {
        c.setAttribute('cx', g.px(.25 + (L - .5) * st.progres) + 16); c.setAttribute('cy', g.py(st.traitH) - 11); c.setAttribute('r', .9 * k);
      }
      if (vl) {
        l.setAttribute('x', g.px(0)); l.setAttribute('y', g.py(st.ligne) - .55 * k); l.setAttribute('width', (L + 1) * k); l.setAttribute('height', 1.1 * k);
      }
    }

    /* ---------- toucher et glisser sur la scène ---------- */
    function ecouterScene() {
      const svg = anim.svg;
      let glisse = null, dep = null, decal = 0;
      svg.addEventListener('pointerdown', ev => {
        dep = { x: ev.clientX, y: ev.clientY };
        const p = ev.target.closest && ev.target.closest('.ccm-poignee');
        if (!p) return;
        glisse = p.dataset.p;
        // écart entre le point saisi et la pointe du crayon (ou le trait) : la hauteur ne saute pas
        decal = anim.versPlaque(ev).y - (glisse === 'crayon' ? st.traitH : st.ligne);
        try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignoré */ }
        ev.preventDefault();
      });
      svg.addEventListener('pointermove', ev => {
        if (!glisse) return;
        const q = anim.versPlaque(ev);
        if (glisse === 'crayon') {
          // hauteur réglable tant que le tracé n'a pas commencé
          if (st.progres < .04) st.traitH = Math.min(3, Math.max(.5, Math.round((q.y - decal) * 2) / 2));
          st.progres = Math.max(st.progres, Math.min(1, (q.x - .25) / (L - .5)));
          maj();
        } else if (glisse === 'ligne') {
          st.ligne = Math.min(HP - .1, Math.max(1.5, Math.round((q.y - decal) * 20) / 20));
          maj();
        }
      });
      const fin = ev => {
        if (glisse === 'crayon' && st.progres >= .97) { st.progres = 1; validerTrait(); }
        glisse = null;
        if (!dep) return;
        const court = Math.hypot(ev.clientX - dep.x, ev.clientY - dep.y) < 12;
        dep = null;
        if (court && ev.type === 'pointerup') toucher(ev);
      };
      svg.addEventListener('pointerup', fin);
      svg.addEventListener('pointercancel', fin);
    }
    // appui court : emplacement d'un dépôt (étape 1) ou tache à entourer (étape 5)
    function toucher(ev) {
      if (st.rate) return;
      const q = anim.versPlaque(ev);
      if (st.etape === 1 && Math.abs(q.y - st.trait) < .7) {
        const xe = EMPL.reduce((a, b) => (Math.abs(b - q.x) < Math.abs(a - q.x) ? b : a));
        if (Math.abs(xe - q.x) < .5) deposer(xe);
        return;
      }
      if (st.etape === 5) {
        const t = anim.tacheProche(ev);
        // sans la lampe, seules les taches colorées se voient : rien à entourer ailleurs
        if (!t || !(st.uv || CCM.ESPECES[t.espece].couleur)) return;
        if (!st.cercles.includes(t.cle)) st.cercles.push(t.cle);
        // le message reste en place (pas de saut de la page sur téléphone), sauf quand tout est entouré
        if (toutEntoure() && st.uv) dire('Toutes les taches sont entourées : éteins la lampe.');
        else if (st.diag) dire(null);
        maj();
      }
    }

    function refuser(m) { st.diag = m; st.msg = null; maj(); }
    function dire(m) { st.msg = m; st.diag = null; }
    const toutEntoure = () => anim.taches().every(t => st.cercles.includes(t.cle));

    /* ---------- actions des boutons ---------- */
    function action(a, b) {
      if (a === 'tout') { recommencer(); return; }
      if (st.rate && a !== 'tout') return;
      switch (a) {
        case 'tH+': case 'tH-':
          st.traitH = Math.min(3, Math.max(.5, st.traitH + (a === 'tH+' ? .5 : -.5)));
          st.progres = 0; dire(null); break;
        case 'tracer': tracerAnime(); return;
        case 'flacon':
          st.flacon = st.flacon === b.dataset.f ? null : b.dataset.f;
          dire(st.flacon ? `Flacon ${st.flacon} choisi : touche un emplacement libre sur le trait.` : null); break;
        case 'finDepots':
          if (st.depots.length < 2) return refuser('Fais au moins 2 dépôts sur le trait : la plaque sert à comparer des espèces.');
          if (!st.depots.some(incolore)) return refuser('Fais aussi au moins un dépôt incolore (B, D ou N) : tu verras à quoi sert la lampe UV.');
          st.etape = 2; st.flacon = null;
          dire('Dépôts faits, nommés sous le trait. Prépare maintenant la cuve.'); break;
        case 'niv+': case 'niv-':
          if (st.posee) return refuser('La plaque est dans la cuve : on ne change plus le niveau de l\'éluant.');
          st.niveau = Math.min(2, Math.max(0, st.niveau + (a === 'niv+' ? .25 : -.25)));
          dire(null); break;
        case 'poser':
          if (st.posee) return refuser('La plaque est déjà dans la cuve.');
          if (!(st.niveau > 0)) return refuser('Verse d\'abord l\'éluant dans la cuve.');
          st.posee = true;
          if (st.niveau >= st.trait) { dissolution(); return; }
          dire('La plaque est posée, le trait de dépôt au-dessus de l\'éluant.'); break;
        case 'couvercle':
          if (!st.posee) return refuser('Pose d\'abord la plaque dans la cuve, puis ferme le couvercle.');
          if (st.couvercle) return;
          st.couvercle = true;
          dire('La cuve est fermée : l\'éluant ne s\'évapore pas. Lance l\'élution.'); break;
        case 'lancer':
          if (!(st.niveau > 0)) return refuser('Verse d\'abord l\'éluant dans la cuve.');
          if (!st.posee) return refuser('Pose d\'abord la plaque dans la cuve.');
          if (!st.couvercle) return refuser('L\'éluant est toxique et s\'évapore : on ferme la cuve.');
          st.etape = 3; dire(null);
          elution(); break;
        case 'pause':
          if (st.echec) return;
          if (anim.enCours()) anim.pause(); else anim.lecture();
          break;
        case 'etape':
          if (st.echec) return;
          anim.etapeSuivante(); break;
        case 'vit':
          st.vit = +b.dataset.v; anim.vitesse(st.vit); break;
        case 'refaire':
          // nouvelle plaque préparée de la même façon : l'élution reprend au début
          anim.recommencer(); st.echec = false;
          dire('Nouvelle plaque, préparée de la même façon : l\'élution recommence.');
          elution(); break;
        case 'sortir': {
          if (st.echec) return;
          const fr = anim.etat.front;
          if (fr == null || fr < SORTIE) return refuser('Attends que l\'éluant soit presque en haut de la plaque, à environ 1 cm du bord.');
          anim.pause();
          st.front = fr; st.ligne = 7; st.etape = 4;
          dire('Plaque sortie : l\'élution s\'arrête. La partie mouillée montre où l\'éluant est monté : repère vite le front, il va sécher.'); break;
        }
        case 'fl+': case 'fl-':
          st.ligne = Math.min(HP - .1, Math.max(1.5, Math.round((st.ligne + (a === 'fl+' ? .25 : -.25)) * 4) / 4));
          dire(null); break;
        case 'front':
          if (Math.abs(st.ligne - st.front) > .15) return refuser(st.ligne < st.front ? 'Ton trait est sous le front : monte-le jusqu\'à la limite de la partie mouillée.' : 'Ton trait est au-dessus du front : descends-le jusqu\'à la limite de la partie mouillée.');
          st.frontTrait = st.ligne; st.etape = 5;
          dire('Front repéré. La plaque sèche : la partie mouillée disparaît, le trait reste.'); break;
        case 'uv':
          st.uv = !st.uv;
          if (st.uv) { st.vuUV = true; dire(toutEntoure() ? 'Toutes les taches sont entourées : éteins la lampe.' : 'Sous la lampe UV, les taches incolores apparaissent : touche chaque tache pour l\'entourer.'); }
          else if (toutEntoure()) dire('Lampe éteinte : les taches incolores ne se voient plus, mais leurs cercles restent.');
          else dire(st.vuUV ? 'Il reste des taches à entourer : rallume la lampe.' : null);
          break;
        case 'legende':
          if (st.uv || !toutEntoure()) return;
          st.etape = 6; ouvrirLegende(); return;
        default: return;
      }
      maj();
    }
    // lance l'élution (sans animation : premier palier)
    function elution() { if (reduit()) anim.etapeSuivante(); else anim.lecture(); }

    // tracé automatique du trait (bouton « Tracer le trait »)
    function tracerAnime() {
      if (reduit()) { st.progres = 1; validerTrait(); return; }
      const t0 = performance.now(), p0 = st.progres;
      const pas = t => {
        st.progres = Math.min(1, p0 + (t - t0) / 900);
        majScene();
        if (st.progres < 1) requestAnimationFrame(pas); else validerTrait();
      };
      requestAnimationFrame(pas);
    }
    function validerTrait() {
      if (st.etape !== 0) return;
      if (st.traitH < 1) { st.progres = 0; refuser('Le trait de dépôt doit rester au-dessus de l\'éluant : trace-le à 1 cm du bas de la plaque.'); return; }
      if (st.traitH > 1) { st.progres = 0; refuser('Trace-le à 1 cm du bas : plus haut, les espèces auraient moins de place pour monter et se séparer.'); return; }
      st.trait = 1; st.etape = 1;
      dire('Trait tracé doucement, sans creuser la silice. Choisis maintenant un flacon.');
      maj();
    }
    function deposer(xe) {
      if (!st.flacon) return refuser('Touche d\'abord un flacon, puis l\'emplacement du dépôt.');
      if (st.depots.some(d => d.x === xe)) return refuser('Il y a déjà un dépôt ici : choisis un emplacement libre.');
      if (st.depots.length >= 5) return refuser('5 dépôts au plus sur cette plaque.');
      if (st.depots.some(d => d.nom === st.flacon)) return refuser(`Le flacon ${st.flacon} est déjà déposé : choisis un autre flacon.`);
      const fl = FLACONS.find(f => f.nom === st.flacon);
      st.depots.push({ nom: fl.nom, especes: fl.especes.slice(), x: xe });
      st.depots.sort((a, b) => a.x - b.x);
      dire(`Dépôt ${fl.nom} fait, nommé sous le trait.${st.depots.length >= 2 ? ' Encore un flacon, ou « Dépôts terminés ».' : ' Fais au moins un autre dépôt.'}`);
      st.flacon = null;
      maj();
    }
    function dissolution() {
      st.rate = true;
      dire(null);
      maj();
      anim.dissoudre(() => {
        st.diag = 'Les dépôts se sont dissous dans l\'éluant : le niveau de l\'éluant doit rester sous le trait de dépôt.';
        maj();
      });
    }
    // le front a atteint le haut de la plaque : CCM ratée
    function auBord() {
      if (st.etape !== 3) return;
      st.echec = true;
      st.diag = 'Le front de l\'éluant a atteint le haut de la plaque : on ne sait plus jusqu\'où il serait monté, et les espèces les plus entraînées peuvent arriver au bord. La CCM est ratée : il faut sortir la plaque avant, quand le front est à environ 1 cm du haut.';
      st.msg = null;
      maj();
    }

    /* ---------- étape 7 : légender le schéma (à la place de la scène) ---------- */
    function ouvrirLegende() {
      anim.pause();
      zone.innerHTML = '<div class="cc-etape-leg"></div>';
      const z = zone.firstChild;
      CC.legende(z, {
        entete: `<p class="cc-etape">Étape 7 / 7 · ${ETAPES[6].t}</p><div class="cc-consigne"><p>${ETAPES[6].c}</p></div>`,
        pied: '<div class="cc-leg-retour" aria-live="polite"></div><div class="cc-pied"><button type="button" class="btn-small" data-a="tout">↺ Recommencer</button></div>',
        onPose() { z.querySelector('.cc-leg-retour').innerHTML = ''; },
        onErreur(d) { z.querySelector('.cc-leg-retour').innerHTML = `<div class="callout-danger cc-diag"><b>Ce n'est pas ça.</b> ${d}</div>`; },
        onReussi() {
          z.querySelector('.cc-leg-retour').innerHTML = `<div class="callout-success cc-diag"><b>Juste !</b> Le schéma est légendé.</div>
            <div class="er-actions"><button type="button" class="btn-primary" data-a="bilan">Voir le bilan →</button></div>`;
          const b = z.querySelector('[data-a="bilan"]');
          b.onclick = bilan;
          b.focus();
        },
      });
      haut();
    }

    /* ---------- bilan (à la place du schéma) ---------- */
    function bilan() {
      st.etape = 7;
      zone.innerHTML = `<div class="cc-bilan">
        <div class="cc-fig cc-fig-bilan"></div>
        <div class="cc-panneau"><p class="cc-etape">Bilan</p><h3 class="cc-titre-carte">Le chromatogramme obtenu</h3>
          <div class="callout-success er-retour"><p><b class="er-ok">Bravo !</b> Tu as réalisé la CCM dans l'ordre.</p><p>${PRINCIPE}</p></div>
          <p class="cc-bilan-t">Les espèces colorées se voient à l'œil ; les espèces incolores n'apparaissent que sous la lampe UV : on les entoure au crayon pour les voir ensuite.</p>
          <div class="er-actions"><a class="btn-primary" style="text-decoration:none" href="module_2_manip.html">Module 2 : lire un chromatogramme →</a>
            <button type="button" class="btn-secondary" data-a="tout">↺ Recommencer</button></div></div></div>`;
      CCM.plaque(zone.querySelector('.cc-fig-bilan'), {
        depots: st.depots.map(d => ({ nom: d.nom, especes: d.especes, x: d.x })), largeur: L, hauteur: HP, rendu: 'labo', mouille: false,
        front: st.front, frontTrait: st.frontTrait, cercles: st.cercles, aria: 'Chromatogramme obtenu : dépôts ' + st.depots.map(d => d.nom).join(', '),
      });
      SOM.marquer({ fait: true });
      haut();
    }

    /* ---------- outils de l'étape en cours ---------- */
    function outils() {
      const r = reduit();
      switch (st.etape) {
        case 0: return `<div class="cc-outil-b"><span class="cc-val-t">Hauteur du crayon</span>
            <button type="button" class="btn-secondary cc-fl" data-a="tH+" aria-label="Monter le crayon">▲</button><button type="button" class="btn-secondary cc-fl" data-a="tH-" aria-label="Descendre le crayon">▼</button>
            <span class="cc-val" data-v="traitH"></span></div>
          <div class="cc-outil-b"><button type="button" class="btn-primary" data-a="tracer">✎ Tracer le trait</button></div>`;
        case 1: return `<div class="cc-outil-b cc-flacons">${FLACONS.map(fl => `<button type="button" class="btn-secondary cc-flacon" data-a="flacon" data-f="${fl.nom}" aria-label="Flacon ${fl.nom}, ${fl.t}"><span class="cc-fiole${incolore(fl) ? '' : ' coloree'}" aria-hidden="true"></span>${fl.nom}</button>`).join('')}</div>
          <div class="cc-outil-b"><button type="button" class="btn-primary" data-a="finDepots">Dépôts terminés →</button></div>`;
        case 2: return `<div class="cc-outil-b"><span class="cc-val-t">Éluant</span><button type="button" class="btn-secondary cc-fl" data-a="niv-" aria-label="Moins d'éluant">−</button><span class="cc-val" data-v="niveau"></span><button type="button" class="btn-secondary cc-fl" data-a="niv+" aria-label="Plus d'éluant">+</button></div>
          <div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="poser">Poser la plaque</button><button type="button" class="btn-secondary" data-a="couvercle">Fermer le couvercle</button></div>
          <div class="cc-outil-b"><button type="button" class="btn-primary" data-a="lancer">▶ Lancer l'élution</button></div>`;
        case 3: return r
          ? '<div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="etape">Étape suivante ›</button><button type="button" class="btn-secondary" data-a="refaire">↺ Recommencer l\'élution</button></div>'
          : `<div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="pause"></button><button type="button" class="btn-secondary" data-a="refaire">↺ Recommencer l'élution</button></div>
            <div class="cc-outil-b cc-vitesses" role="group" aria-label="Vitesse"><span class="cc-val-t">Vitesse</span>${[.5, 1, 2].map(v => `<button type="button" class="btn-secondary cc-vit" data-a="vit" data-v="${v}">× ${fmt(v)}</button>`).join('')}</div>`;
        case 4: return `<div class="cc-outil-b"><span class="cc-val-t">Trait du front</span><button type="button" class="btn-secondary cc-fl" data-a="fl+" aria-label="Monter le trait">▲</button><button type="button" class="btn-secondary cc-fl" data-a="fl-" aria-label="Descendre le trait">▼</button></div>
          <div class="cc-outil-b"><button type="button" class="btn-primary" data-a="front">✎ Tracer le front</button></div>`;
        case 5: return '<div class="cc-outil-b"><button type="button" class="btn-primary" data-a="legende">Légender le schéma →</button></div>';
      }
      return '';
    }
    // boutons posés sur la scène, au-dessus de la plaque (positions en % de la figure)
    function majSur() {
      const sur = zone.querySelector('.cc-sur'), g = anim.geo;
      const cle = st.etape === 3 && !st.echec ? 'sortir' : st.etape === 5 ? 'uv' : '';
      if (cle !== cleSur) {
        cleSur = cle;
        if (cle === 'sortir') {
          const c = g.cuve;
          sur.innerHTML = `<button type="button" class="btn-primary cc-sur-btn" data-a="sortir" style="left:${pc(c.x + c.w / 2, g.W)};top:${pc(c.y / 2, g.H)}">Sortir la plaque</button>`;
        } else if (cle === 'uv') {
          const B = boiteLampe(g);
          sur.innerHTML = `<button type="button" class="cc-lampe-btn" data-a="uv" style="left:${pc(B.x, g.W)};top:${pc(B.y, g.H)};width:${pc(B.w, g.W)};height:${pc(B.h, g.H)}"></button>`;
        } else sur.innerHTML = '';
      }
      const bl = sur.querySelector('.cc-lampe-btn');
      if (bl) { bl.textContent = st.uv ? 'Éteindre la lampe UV' : 'Allumer la lampe UV'; bl.classList.toggle('on', st.uv); bl.setAttribute('aria-pressed', st.uv); }
    }

    /* ---------- mise à jour de l'affichage ---------- */
    function majScene() {
      const e = st.etape, cuve = e === 2 || e === 3;
      anim.maj({
        depots: st.depots, trait: st.trait != null ? st.trait : (st.progres > 0 ? st.traitH : null), traitProgres: st.trait != null ? 1 : st.progres,
        regle: e === 0, cuve, dansCuve: st.posee, niveau: cuve ? st.niveau : 0,
        couvercle: st.couvercle, mouille: e <= 4, frontTrait: st.frontTrait, uv: st.uv, cercles: st.cercles,
      });
    }
    function maj() {
      if (st.etape > 5) return;
      majScene();
      majSur();
      zone.querySelector('.cc-scene-cadre').classList.toggle('uv', st.uv);
      const o = zone.querySelector('.cc-outils');
      if (etapeOutils !== st.etape) { etapeOutils = st.etape; o.innerHTML = outils(); }
      const v = (n, t) => { const x = o.querySelector(`[data-v="${n}"]`); if (x) x.textContent = t; };
      v('traitH', `${fmt(st.traitH)} cm`);
      v('niveau', `${fmt(st.niveau)} cm`);
      o.querySelectorAll('.cc-flacon').forEach(b => b.classList.toggle('choisi', b.dataset.f === st.flacon));
      o.querySelectorAll('.cc-vit').forEach(b => b.setAttribute('aria-pressed', +b.dataset.v === st.vit));
      const bp = o.querySelector('[data-a="pause"]');
      if (bp) bp.textContent = anim.enCours() ? '⏸ Pause' : '▶ Reprendre';
      const bc = o.querySelector('[data-a="couvercle"]');
      if (bc) bc.textContent = st.couvercle ? 'Couvercle fermé' : 'Fermer le couvercle';
      const bl = o.querySelector('[data-a="legende"]');
      if (bl) bl.hidden = st.uv || !toutEntoure();
      // manipulation ratée : plus d'outils, seulement le bouton pour recommencer (sous le message)
      o.hidden = st.rate || st.echec;
      zone.querySelector('.cc-etape').textContent = `Étape ${st.etape + 1} / 7 · ${ETAPES[st.etape].t}`;
      zone.querySelector('.cc-consigne').innerHTML = `<p>${ETAPES[st.etape].c}</p><p class="cc-info">${detail()}</p>`;
      let h = '';
      if (st.msg) h += `<div class="callout-success cc-diag">${st.msg}</div>`;
      if (st.diag) h += `<div class="callout-danger cc-diag"><b>Ce n'est pas ça.</b> ${st.diag}</div>`;
      if (st.rate && st.diag) h += '<div class="cc-cons-actions"><button type="button" class="btn-primary" data-a="tout">↺ Recommencer</button></div>';
      if (st.echec) h += '<div class="cc-cons-actions"><button type="button" class="btn-primary" data-a="refaire">↺ Recommencer l\'élution</button></div>';
      zone.querySelector('.cc-retour').innerHTML = h;
    }
    // précisions de la consigne selon l'état
    function detail() {
      switch (st.etape) {
        case 0: return `Règle la hauteur avec ▲ ▼ (règle graduée à gauche ; hauteur : ${fmt(st.traitH)} cm), puis glisse le crayon d'un bord à l'autre de la plaque, ou touche « Tracer le trait ».`;
        case 1: return `${pluriel(st.depots.length, 'dépôt')} sur 5 emplacements. A, B, C et D sont des corps purs ; M et N sont des mélanges. A, C et M sont colorés ; B, D et N sont incolores.`;
        case 2: return st.couvercle ? 'Tout est prêt : lance l\'élution.' : st.posee ? 'Ferme maintenant le couvercle.' : `Règle le niveau de l'éluant avec − et + (niveau : ${fmt(st.niveau)} cm), puis pose la plaque.`;
        case 3: return reduit() ? 'Avance l\'élution étape par étape, et sors la plaque à temps avec le bouton au-dessus de la cuve.'
          : 'Le front monte vite au début, puis de plus en plus lentement. Sors la plaque à temps avec le bouton au-dessus de la cuve.';
        case 4: return 'Glisse le trait en pointillés (ou ▲ ▼) jusqu\'à la limite de la partie mouillée, puis touche « Tracer le front ».';
        case 5: {
          const n = st.cercles.length, e = `${pluriel(n, 'tache')} entourée${n > 1 ? 's' : ''}.`;
          if (st.uv) return `Touche chaque tache pour l'entourer : ${e}`;
          if (toutEntoure()) return 'Les cercles au crayon montrent toutes les taches, même incolores.';
          return st.vuUV ? `${e} Rallume la lampe pour entourer les autres.` : 'Allume la lampe au-dessus de la plaque. Les taches colorées peuvent déjà être entourées.';
        }
      }
      return '';
    }

    construire();
  }

  window.CC = Object.assign(window.CC || {}, { animationCCM, PRINCIPE });
})();
