/* ============================================================
   Module 1 : « Animation : réaliser une CCM »
   (application « Chromatographie sur couche mince »)

   CC.animationCCM(zone, zoneLegende, zoneBilan)
     zone        : la manipulation (scène, outils, déroulé guidé)
     zoneLegende : la carte « Légender le schéma » (affichée à l'étape 7)
     zoneBilan   : la carte du bilan (chromatogramme obtenu, principe)

   Gestes dans l'ordre du laboratoire ; un geste hors de l'ordre est
   refusé (rien ne change) avec son explication :
     0 tracer le trait de dépôt   1 faire les dépôts   2 préparer la cuve
     3 élution                    4 repérer le front   5 révéler sous UV
     6 légender le schéma         7 bilan
   Utilise CCM (ccm.js), CC.legende (cc.js), SOM.marquer.
   ============================================================ */
(function () {
  'use strict';

  const L = 6;                                          // largeur de la plaque (cm) : 5 emplacements, 1 cm entre eux
  const EMPL = [1, 2, 3, 4, 5];                         // emplacements des dépôts sur le trait (cm)
  const FLACONS = [
    { nom: 'A', especes: ['A'], t: 'corps pur' }, { nom: 'B', especes: ['B'], t: 'corps pur' },
    { nom: 'C', especes: ['C'], t: 'corps pur' }, { nom: 'D', especes: ['D'], t: 'corps pur' },
    { nom: 'M', especes: ['A', 'C'], t: 'mélange' }, { nom: 'N', especes: ['B', 'D', 'X'], t: 'mélange' },
  ];
  const ETAPES = [
    'Trace le <b>trait de dépôt</b> au crayon, doucement, à 1 cm du bas de la plaque.',
    'Fais 2 à 5 <b>dépôts</b> sur le trait : touche un flacon, puis un emplacement.',
    'Verse l\'<b>éluant</b> dans la cuve, pose la plaque, ferme le <b>couvercle</b>.',
    'Lance l\'<b>élution</b>, puis sors la plaque quand le front est à 1 cm du haut.',
    'Repère le <b>front de l\'éluant</b> : trace un trait au crayon à sa hauteur.',
    'Révèle les taches sous la <b>lampe UV</b> et entoure-les au crayon.',
    '<b>Légende le schéma</b> du dispositif.',
  ];
  const PRINCIPE = 'Lors de la chromatographie, l\'éluant monte en entraînant avec lui les espèces présentes dans le dépôt. Les différentes espèces sont plus ou moins entraînées et montent à des hauteurs différentes. On peut ainsi séparer et identifier les constituants d\'un mélange.';
  const fmt = v => String(Math.round(v * 100) / 100).replace('.', ',');
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animationCCM(zone, zoneLeg, zoneBilan) {
    let st, anim;

    function etatInitial() {
      return {
        etape: 0, rate: false, msg: null, diag: null,
        traitH: .5, progres: 0, trait: null,                    // étape 0
        depots: [], flacon: null,                               // étape 1
        niveau: 0, posee: false, couvercle: false,              // étape 2
        sortie: false, vit: 1,                                  // étape 3
        ligne: 6, frontTrait: null,                             // étape 4
        uv: false, cercles: [],                                 // étape 5
      };
    }

    /* ---------- page ---------- */
    function construire() {
      st = etatInitial();
      zoneLeg.hidden = true; zoneLeg.innerHTML = '';
      zoneBilan.hidden = true; zoneBilan.innerHTML = '';
      const r = reduit();
      zone.innerHTML = `<div class="cc-manip">
        <div class="cc-manip-g">
          <div class="cc-fig cc-scene"></div>
          <div class="cc-outils">
            <div class="cc-outil" data-g="0"><p class="cc-outil-t">Plaque : trait de dépôt</p>
              <div class="cc-outil-b"><button type="button" class="btn-secondary cc-fl" data-a="tH+" aria-label="Monter le crayon">▲</button><button type="button" class="btn-secondary cc-fl" data-a="tH-" aria-label="Descendre le crayon">▼</button>
              <span class="cc-val" data-v="traitH"></span><button type="button" class="btn-secondary" data-a="tracer">✎ Tracer</button></div></div>
            <div class="cc-outil" data-g="1"><p class="cc-outil-t">Dépôts : flacons</p>
              <div class="cc-outil-b cc-flacons">${FLACONS.map(fl => `<button type="button" class="btn-secondary cc-flacon" data-a="flacon" data-f="${fl.nom}" aria-label="Flacon ${fl.nom}, ${fl.t}"><span class="cc-fiole${fl.especes.some(s => CCM.ESPECES[s].couleur) ? ' coloree' : ''}" aria-hidden="true"></span>${fl.nom}</button>`).join('')}</div></div>
            <div class="cc-outil" data-g="2"><p class="cc-outil-t">Cuve, sous la hotte</p>
              <div class="cc-outil-b"><span class="cc-val-t">Éluant</span><button type="button" class="btn-secondary cc-fl" data-a="niv-" aria-label="Moins d'éluant">−</button><span class="cc-val" data-v="niveau"></span><button type="button" class="btn-secondary cc-fl" data-a="niv+" aria-label="Plus d'éluant">+</button></div>
              <div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="poser">Poser la plaque</button><button type="button" class="btn-secondary" data-a="couvercle">Fermer le couvercle</button></div></div>
            <div class="cc-outil" data-g="3"><p class="cc-outil-t">Élution</p>
              <div class="cc-outil-b">${r ? '<button type="button" class="btn-secondary" data-a="etape">Étape suivante ›</button>'
                : '<button type="button" class="btn-secondary" data-a="lecture">▶ Lecture</button><button type="button" class="btn-secondary" data-a="pause">⏸ Pause</button>'}
              <button type="button" class="btn-secondary" data-a="reel">↺</button></div>
              ${r ? '' : `<div class="cc-outil-b cc-vitesses" role="group" aria-label="Vitesse">${[.5, 1, 2].map(v => `<button type="button" class="btn-secondary cc-vit" data-a="vit" data-v="${v}" aria-pressed="${v === 1}">× ${fmt(v)}</button>`).join('')}</div>`}
              <div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="sortir">Sortir la plaque</button></div></div>
            <div class="cc-outil" data-g="4"><p class="cc-outil-t">Front de l'éluant</p>
              <div class="cc-outil-b"><button type="button" class="btn-secondary cc-fl" data-a="fl+" aria-label="Monter le trait">▲</button><button type="button" class="btn-secondary cc-fl" data-a="fl-" aria-label="Descendre le trait">▼</button>
              <button type="button" class="btn-secondary" data-a="front">✎ Tracer le front</button></div></div>
            <div class="cc-outil" data-g="5"><p class="cc-outil-t">Révélation</p>
              <div class="cc-outil-b"><button type="button" class="btn-secondary" data-a="uv">Allumer la lampe UV</button></div></div>
          </div>
        </div>
        <div class="cc-manip-d">
          <div class="cc-consigne" aria-live="polite"></div>
          <ol class="cc-deroule">${ETAPES.map(t => `<li><span>${t}</span></li>`).join('')}</ol>
          <div class="er-actions"><button type="button" class="btn-secondary" data-a="tout">↺ Recommencer</button></div>
        </div></div>`;
      anim = CCM.animation(zone.querySelector('.cc-scene'), {
        depots: st.depots, largeur: L, trait: null, niveau: 0, cuve: false, couvercle: false, regle: true, noms: true, duree: 10,
        aria: 'Plaque de chromatographie et cuve : animation des gestes de la CCM',
        calque, fixe, onFin: finElution,
      });
      ecouterScene();
      zone.querySelectorAll('[data-a]').forEach(b => { b.onclick = () => action(b.dataset.a, b); });
      maj();
    }

    /* ---------- dessin des outils sur la scène (crayon, emplacements, trait du front, lampe) ---------- */
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
      if (st.uv) {
        // lampe UV au-dessus de la plaque
        const y0 = Y(10) - 1.6 * k;
        s += `<rect class="cc-lampe" x="${P(.3)}" y="${y0}" width="${(L - .6) * k}" height="${.55 * k}" rx="5"/>
          <text class="cc-lampe-t" x="${P(L / 2)}" y="${y0 + .4 * k}" font-size="${.36 * k}">lampe UV</text>`;
        for (let i = 0; i < 6; i++) s += `<line class="cc-rayon" x1="${P(.8 + i * (L - 1.6) / 5)}" y1="${y0 + .65 * k}" x2="${P(.8 + i * (L - 1.6) / 5)}" y2="${y0 + 1.4 * k}"/>`;
      }
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
      let glisse = null, dep = null;
      svg.addEventListener('pointerdown', ev => {
        dep = { x: ev.clientX, y: ev.clientY };
        const p = ev.target.closest && ev.target.closest('.ccm-poignee');
        if (!p) return;
        glisse = p.dataset.p;
        try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignoré */ }
        ev.preventDefault();
      });
      svg.addEventListener('pointermove', ev => {
        if (!glisse) return;
        const q = anim.versPlaque(ev);
        if (glisse === 'crayon') {
          if (st.progres < .04) {
            const h = Math.min(3, Math.max(.5, Math.round(q.y * 2) / 2));
            if (h !== st.traitH) { st.traitH = h; }
          }
          st.progres = Math.max(st.progres, Math.min(1, (q.x - .25) / (L - .5)));
          maj();
        } else if (glisse === 'ligne') {
          st.ligne = Math.min(9.5, Math.max(1.5, Math.round(q.y * 4) / 4));
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
      if (st.etape === 1 && st.trait != null && Math.abs(q.y - st.trait) < .7) {
        const xe = EMPL.reduce((a, b) => (Math.abs(b - q.x) < Math.abs(a - q.x) ? b : a));
        if (Math.abs(xe - q.x) < .5) deposer(xe);
        return;
      }
      if (st.etape === 5) {
        const t = anim.tacheProche(ev);
        if (!t) return;
        if (!st.uv) return refuser('Allume d\'abord la lampe UV : les espèces incolores n\'apparaissent que dessous.');
        if (!st.cercles.includes(t.cle)) st.cercles.push(t.cle);
        st.msg = null; st.diag = null;
        maj();
      }
    }

    /* ---------- ordre des gestes ---------- */
    const AVANT = [
      'Trace d\'abord le trait de dépôt au crayon : les dépôts se font sur ce trait.',
      'Fais d\'abord les dépôts sur le trait (au moins 2).',
      'Prépare d\'abord la cuve : verse l\'éluant, pose la plaque, ferme le couvercle.',
      'Sors d\'abord la plaque de la cuve, quand l\'éluant est presque en haut.',
      'Repère d\'abord le front de l\'éluant au crayon : en séchant, la limite de la partie mouillée disparaît.',
      'Révèle d\'abord les taches sous la lampe UV, puis éteins-la.',
    ];
    const APRES = [
      'Le trait de dépôt est déjà tracé.',
      'Les dépôts sont faits : la plaque est dans la cuve, on ne peut plus en ajouter.',
      'La cuve est déjà prête.',
      'L\'élution est finie : la plaque est sortie de la cuve.',
      'Le front de l\'éluant est déjà repéré.',
      'Les taches sont déjà révélées et entourées.',
    ];
    // vrai si le geste de l'étape g peut être fait maintenant ; sinon refus expliqué
    function permis(g) {
      if (st.rate) { refuser('Les dépôts se sont dissous dans l\'éluant : touche « ↺ Recommencer ».'); return false; }
      if (g === st.etape) return true;
      // passer des dépôts à la cuve : au moins 2 dépôts
      if (g === 2 && st.etape === 1) {
        if (st.depots.length >= 2) { st.etape = 2; st.flacon = null; return true; }
        refuser('Fais au moins 2 dépôts sur le trait avant de préparer la cuve.');
        return false;
      }
      refuser(g > st.etape ? AVANT[st.etape] : APRES[g]);
      return false;
    }
    function refuser(m) { st.diag = m; st.msg = null; maj(); }
    function dire(m) { st.msg = m; st.diag = null; }

    /* ---------- actions des boutons ---------- */
    function action(a, b) {
      if (a === 'tout') { anim.pause(); construire(); return; }
      switch (a) {
        case 'tH+': case 'tH-':
          if (!permis(0)) return;
          st.traitH = Math.min(3, Math.max(.5, st.traitH + (a === 'tH+' ? .5 : -.5)));
          st.progres = 0; dire(null); break;
        case 'tracer':
          if (!permis(0)) return;
          tracerAnime(); return;
        case 'flacon':
          if (!permis(1)) return;
          st.flacon = st.flacon === b.dataset.f ? null : b.dataset.f;
          dire(st.flacon ? `Flacon ${st.flacon} choisi : touche un emplacement libre sur le trait.` : null); break;
        case 'niv+': case 'niv-':
          if (!permis(2)) return;
          if (st.posee) return refuser('La plaque est dans la cuve : on ne change plus le niveau de l\'éluant.');
          st.niveau = Math.min(2, Math.max(0, st.niveau + (a === 'niv+' ? .25 : -.25)));
          dire(null); break;
        case 'poser':
          if (!permis(2)) return;
          if (st.posee) return refuser('La plaque est déjà dans la cuve.');
          if (!(st.niveau > 0)) return refuser('Verse d\'abord l\'éluant dans la cuve.');
          st.posee = true;
          if (st.niveau >= st.trait) { dissolution(); return; }
          dire('La plaque est posée, le trait de dépôt au-dessus de l\'éluant.'); break;
        case 'couvercle':
          if (!permis(2)) return;
          if (!st.posee) return refuser('Pose d\'abord la plaque dans la cuve, puis ferme le couvercle.');
          st.couvercle = true; st.etape = 3;
          dire('La cuve est fermée : l\'éluant ne s\'évapore pas.'); break;
        case 'lecture': case 'etape':
          if (st.etape === 2 && st.posee && !st.couvercle) return refuser('L\'éluant est toxique et s\'évapore : on ferme la cuve.');
          if (st.etape === 2 && !st.posee && st.niveau > 0) return refuser('Pose d\'abord la plaque dans la cuve.');
          if (st.etape === 2 && !(st.niveau > 0)) return refuser('Verse d\'abord l\'éluant dans la cuve.');
          if (!permis(3)) return;
          dire(null);
          if (a === 'etape') anim.etapeSuivante(); else anim.lecture();
          break;
        case 'pause':
          if (!permis(3)) return;
          anim.pause(); break;
        case 'reel':
          if (!permis(3)) return;
          anim.recommencer(); dire('L\'élution recommence au début.'); break;
        case 'vit':
          anim.vitesse(+b.dataset.v); st.vit = +b.dataset.v;
          zone.querySelectorAll('.cc-vit').forEach(x => x.setAttribute('aria-pressed', x === b)); return;
        case 'sortir':
          if (st.etape === 2) return permis(3);
          if (!permis(3)) return;
          if (!anim.fini()) return refuser('Attends que l\'éluant soit presque en haut de la plaque, à 1 cm du bord.');
          anim.pause();
          st.sortie = true; st.etape = 4;
          dire('Plaque sortie : la partie mouillée montre où l\'éluant s\'est arrêté. Repère vite le front, il va sécher.'); break;
        case 'fl+': case 'fl-':
          if (!permis(4)) return;
          st.ligne = Math.min(9.5, Math.max(1.5, st.ligne + (a === 'fl+' ? .5 : -.5)));
          dire(null); break;
        case 'front':
          if (!permis(4)) return;
          if (Math.abs(st.ligne - 9) > .13) return refuser(st.ligne < 9 ? 'Ton trait est sous le front : monte-le jusqu\'à la limite de la partie mouillée.' : 'Ton trait est au-dessus du front : descends-le jusqu\'à la limite de la partie mouillée.');
          st.frontTrait = 9; st.etape = 5;
          dire('Front repéré. La plaque sèche : la partie mouillée disparaît, le trait reste.'); break;
        case 'uv':
          if (!permis(5)) return;
          st.uv = !st.uv;
          if (!st.uv && toutEntoure()) { st.etape = 6; dire('Lampe éteinte : les taches incolores ne se voient plus, mais leurs cercles restent.'); ouvrirLegende(); }
          else dire(st.uv ? 'Sous la lampe UV, les taches incolores apparaissent : touche chaque tache pour l\'entourer.' : 'Il reste des taches à entourer : rallume la lampe.');
          break;
      }
      maj();
    }
    const toutEntoure = () => anim.taches().every(t => st.cercles.includes(t.cle));

    // tracé automatique du trait (bouton « Tracer »)
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
      if (st.traitH < 1) { st.progres = 0; refuser('Le trait de dépôt doit rester au-dessus de l\'éluant : trace-le à 1 cm du bas de la plaque.'); return; }
      if (st.traitH > 1) { st.progres = 0; refuser('Trace-le à 1 cm du bas : plus haut, les espèces auraient moins de place pour monter et se séparer.'); return; }
      st.trait = 1; st.etape = 1;
      dire('Trait tracé doucement, sans creuser la silice. Choisis maintenant un flacon.');
      maj();
    }
    function deposer(xe) {
      if (!st.flacon) return refuser('Touche d\'abord un flacon, puis l\'emplacement du dépôt.');
      if (st.depots.some(d => d.x === xe)) return refuser('Il y a déjà un dépôt ici : choisis un emplacement libre.');
      if (st.depots.length >= 5) return refuser('5 dépôts au plus sur cette plaque.');
      if (st.depots.some(d => d.nom === st.flacon)) return refuser(`Le flacon ${st.flacon} est déjà déposé : choisis un autre flacon.`);
      const fl = FLACONS.find(f => f.nom === st.flacon);
      st.depots.push({ nom: fl.nom, especes: fl.especes.slice(), x: xe });
      st.depots.sort((a, b) => a.x - b.x);
      dire(`Dépôt ${fl.nom} fait, nommé sous le trait.${st.depots.length >= 2 ? ' Encore un flacon, ou passe à la cuve.' : ' Fais au moins un autre dépôt.'}`);
      st.flacon = null;
      maj();
    }
    function dissolution() {
      st.rate = true;
      dire(null);
      maj();
      anim.dissoudre(() => {
        st.diag = 'Les dépôts se sont dissous dans l\'éluant : le niveau de l\'éluant doit rester sous le trait de dépôt.';
        maj();
      });
    }
    function finElution() {
      dire('Le front est à 1 cm du haut de la plaque : tu peux sortir la plaque.');
      maj();
    }

    /* ---------- étape 7 : légender le schéma ---------- */
    function ouvrirLegende() {
      zoneLeg.hidden = false;
      zoneLeg.innerHTML = `<h3 class="cc-titre-carte">7. Légende le schéma du dispositif</h3><div class="cc-leg-zone"></div><div class="cc-leg-retour" aria-live="polite"></div>`;
      const ret = zoneLeg.querySelector('.cc-leg-retour');
      CC.legende(zoneLeg.querySelector('.cc-leg-zone'), {
        onPose() { ret.innerHTML = ''; },
        onErreur(d) { ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${d}</p></div>`; },
        onReussi() {
          ret.innerHTML = '<div class="callout-success er-retour"><p><b class="er-ok">Juste !</b> Le schéma est légendé.</p></div>';
          st.etape = 7; maj(); bilan();
        },
      });
      CC.defiler(zoneLeg);
    }

    /* ---------- bilan ---------- */
    function bilan() {
      zoneBilan.hidden = false;
      zoneBilan.innerHTML = `<h3 class="cc-titre-carte">Bilan : le chromatogramme obtenu</h3>
        <div class="cc-bilan"><div class="cc-fig cc-fig-bilan"></div>
        <div><div class="callout-success er-retour"><p><b class="er-ok">Bravo !</b> Tu as réalisé la CCM dans l'ordre.</p><p>${PRINCIPE}</p></div>
        <p class="cc-bilan-t">Les espèces colorées se voient à l'œil ; les espèces incolores ont été révélées sous la lampe UV, puis entourées au crayon.</p>
        <div class="er-actions"><a class="btn-primary" style="text-decoration:none" href="module_2_manip.html">Module 2 : lire un chromatogramme →</a></div></div></div>`;
      CCM.plaque(zoneBilan.querySelector('.cc-fig-bilan'), {
        depots: st.depots.map(d => ({ nom: d.nom, especes: d.especes, x: d.x })), largeur: L, rendu: 'labo', mouille: false,
        cercles: st.cercles, aria: 'Chromatogramme obtenu : dépôts ' + st.depots.map(d => d.nom).join(', '),
      });
      SOM.marquer({ fait: true });
      CC.defiler(zoneBilan);
    }

    /* ---------- mise à jour de l'affichage ---------- */
    function majScene() {
      const e = st.etape;
      anim.maj({
        depots: st.depots, trait: st.trait != null ? st.trait : (st.progres > 0 ? st.traitH : null), traitProgres: st.trait != null ? 1 : st.progres,
        regle: e === 0, cuve: e >= 2 && e <= 3 && !st.sortie, dansCuve: st.posee, niveau: e >= 2 && !st.sortie ? st.niveau : 0,
        couvercle: st.couvercle, mouille: e <= 4, frontTrait: st.frontTrait, uv: st.uv, cercles: st.cercles,
      });
    }
    function maj() {
      majScene();
      zone.querySelector('[data-v="traitH"]').textContent = `${fmt(st.traitH)} cm`;
      zone.querySelector('[data-v="niveau"]').textContent = `${fmt(st.niveau)} cm`;
      zone.querySelectorAll('.cc-flacon').forEach(b => b.classList.toggle('choisi', b.dataset.f === st.flacon));
      zone.querySelector('[data-a="uv"]').textContent = st.uv ? 'Éteindre la lampe UV' : 'Allumer la lampe UV';
      zone.querySelector('[data-a="couvercle"]').textContent = st.couvercle ? 'Couvercle fermé' : 'Fermer le couvercle';
      // groupe d'outils de l'étape en cours mis en valeur
      zone.querySelectorAll('.cc-outil').forEach(o => o.classList.toggle('ici', +o.dataset.g === st.etape || (+o.dataset.g === 2 && st.etape === 1 && st.depots.length >= 2)));
      // déroulé guidé
      zone.querySelectorAll('.cc-deroule li').forEach((li, i) => { li.className = i < st.etape ? 'fait' : i === st.etape ? 'ici' : 'avenir'; });
      // consigne de l'étape en cours, message, refus
      const c = zone.querySelector('.cc-consigne');
      let h = st.etape < 7 ? `<p>${st.etape + 1}. ${ETAPES[st.etape]}</p><p class="cc-info">${detail()}</p>` : '<p class="cc-ok"><b>Juste !</b> La CCM est réalisée.</p>';
      if (st.msg) h += `<div class="callout-success cc-diag">${st.msg}</div>`;
      if (st.diag) h += `<div class="callout-danger cc-diag"><b>Ce n'est pas ça.</b> ${st.diag}</div>`;
      if (st.rate) h += '<div class="cc-cons-actions"><button type="button" class="btn-small" data-a="tout2">↺ Recommencer</button></div>';
      c.innerHTML = h;
      const b2 = c.querySelector('[data-a="tout2"]');
      if (b2) b2.onclick = () => { anim.pause(); construire(); };
    }
    // précisions de la consigne selon l'état
    function detail() {
      switch (st.etape) {
        case 0: return `Règle la hauteur du crayon avec ▲ ▼ (la règle est à gauche ; hauteur : ${fmt(st.traitH)} cm), puis glisse le crayon d'un bord à l'autre de la plaque, ou touche « Tracer ».`;
        case 1: return `${st.depots.length} dépôt${st.depots.length > 1 ? 's' : ''} sur 5 emplacements. A, B, C et D sont des corps purs ; M et N sont des mélanges.`;
        case 2: return st.posee ? 'Ferme maintenant le couvercle.' : `Règle le niveau de l'éluant avec − et + (niveau : ${fmt(st.niveau)} cm), puis pose la plaque.`;
        case 3: return anim.fini() ? 'Le front est arrivé : sors la plaque.' : 'Lance l\'élution : le front de l\'éluant monte et entraîne les espèces.';
        case 4: return 'Glisse le trait en pointillés (ou ▲ ▼) jusqu\'à la limite de la partie mouillée, puis « Tracer le front ».';
        case 5: return `${st.cercles.length} tache${st.cercles.length > 1 ? 's' : ''} entourée${st.cercles.length > 1 ? 's' : ''} sur ${anim.taches().length}. Quand toutes sont entourées, éteins la lampe.`;
        case 6: return 'Plus bas : glisse chaque étiquette sur son numéro.';
      }
      return '';
    }

    construire();
  }

  window.CC = Object.assign(window.CC || {}, { animationCCM, PRINCIPE });
})();
