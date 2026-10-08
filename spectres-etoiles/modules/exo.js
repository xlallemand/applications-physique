/* ============================================================
   Moteur des séries d'exercices — application « Spectres et étoiles »

   EX.serie(options)     série de questions notée sur 20 (intro, questions, score)
   EX.menu(cle)          bandeau et menu communs aux modules
   EX.astre(T)           étoile dessinée sur fond de ciel

   Types de questions (q.type) :
     'choix'        boutons de réponse (texte, spectres ou étoiles)
     'ordre'        toucher les éléments dans l'ordre (température croissante)
     'comparateur'  régler la température d'un corps chauffé pour retrouver le spectre d'une étoile
     'profil'       lire une température sur le profil d'intensité
     'elements'     cocher les éléments présents dans une étoile (règle + projection des raies)

   Barème : 2 points du premier coup, 1 point au deuxième essai (un seul essai
   pour les questions à deux choix). Une aide est gratuite la première fois ;
   la même aide utilisée dans une question suivante coûte ½ point.
   ============================================================ */
(function () {
  'use strict';

  const SP = window.SP;
  const virgule = v => String(v).replace('.', ',');
  const milliers = t => String(Math.round(t)).replace(/(\d)(\d{3})$/, '$1 $2');
  const COUL = ['#5a3fc4', '#d9730d', '#0a7d57', '#c2255c', '#2952c8', '#8f3f08', '#0e7490'];
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  // ligne « nom + spectre » ; renvoie l'objet spectre (SP.spectre)
  function ligne(parent, nom, o) {
    const d = el('div', 'sp-ligne', `<div class="sp-nom">${nom || ''}</div><div class="sp-zone"></div>`);
    if (!nom) d.classList.add('sp-ligne-seule');
    parent.appendChild(d);
    return SP.spectre(d.querySelector('.sp-zone'), o);
  }

  // étoile sur fond de ciel
  function astre(T, petit) {
    const c = SP.couleurEtoile(T);
    const d = el('div', 'sp-ciel' + (petit ? ' sp-ciel-petit' : ''), '<div class="sp-astre"></div>');
    const a = d.firstChild;
    a.style.background = c;
    a.style.boxShadow = `0 0 ${petit ? 10 : 18}px ${petit ? 3 : 6}px ${c}`;
    return d;
  }

  /* ============================================================
     TYPE « choix »
     q.spectres : [{ nom, o }]   spectres affichés au-dessus des réponses
     q.options  : [{ id, label, spectre?, etoile? }], q.bonne : id
     ============================================================ */
  function tChoix(zone, q, api) {
    (q.spectres || []).forEach(s => ligne(zone, s.nom, s.o));
    const avecSpectre = q.options.some(o => o.spectre), avecEtoile = q.options.some(o => o.etoile != null);
    const box = el('div', avecSpectre ? 'sp-cartes' : avecEtoile ? 'sp-etoiles' : 'sp-choix');
    zone.appendChild(box);
    const items = q.options.map(o => {
      const b = el('button', avecSpectre ? 'sp-carte' : avecEtoile ? 'sp-etoile' : 'btn-secondary');
      b.type = 'button';
      if (avecSpectre) {
        b.innerHTML = `<b class="sp-carte-nom">${o.label}</b><span class="sp-carte-sp"></span>`;
        o.sp = SP.spectre(b.querySelector('.sp-carte-sp'), Object.assign({ hauteur: 36 }, o.spectre));
      } else if (avecEtoile) {
        b.appendChild(astre(o.etoile));
        b.appendChild(el('b', '', o.label));
      } else b.innerHTML = o.label;
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (o.id === q.bonne) {
          b.classList.add('juste');
          items.forEach(i => { i.b.disabled = true; });
          api.repondre(true);
        } else {
          b.classList.add('faux');
          b.disabled = true;
          api.repondre(false, q.indice ? q.indice(o.id) : '');
        }
      };
      return { o, b };
    });
    return {
      essais: q.essais || (q.options.length <= 2 ? 1 : 2),
      solution() {
        items.forEach(i => { i.b.disabled = true; if (i.o.id === q.bonne) i.b.classList.add('juste'); });
      },
      // aide visuelle (température) : couleur du corps et début du spectre côté violet
      reperes() {
        items.forEach(i => {
          if (!i.o.spectre || i.o.spectre.T == null) return;
          i.o.sp.maj({ repere: SP.debutVisible(i.o.spectre.T) });
          if (!i.b.querySelector('.sp-ciel')) i.b.appendChild(astre(i.o.spectre.T, true));
        });
      },
    };
  }

  /* ============================================================
     TYPE « ordre » : toucher les éléments dans l'ordre demandé
     q.items : [{ id, label, spectre?, etoile? }], q.ordre : [id, …]
     ============================================================ */
  function tOrdre(zone, q, api) {
    const choisis = [], avecEtoile = q.items.some(i => i.etoile != null);
    const box = el('div', avecEtoile ? 'sp-etoiles' : 'sp-cartes');
    zone.appendChild(box);
    const items = q.items.map(it => {
      const b = el('button', avecEtoile ? 'sp-etoile sp-ordre' : 'sp-carte sp-ordre');
      b.type = 'button';
      if (avecEtoile) {
        b.appendChild(astre(it.etoile));
        b.appendChild(el('b', '', it.label));
      } else {
        b.innerHTML = `<b class="sp-carte-nom">${it.label}</b><span class="sp-carte-sp"></span>`;
        it.sp = SP.spectre(b.querySelector('.sp-carte-sp'), Object.assign({ hauteur: 36 }, it.spectre));
      }
      b.appendChild(el('span', 'sp-rang'));
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini()) return;
        const k = choisis.indexOf(it.id);
        if (k >= 0) choisis.splice(k, 1); else choisis.push(it.id);
        box.querySelectorAll('.faux').forEach(f => f.classList.remove('faux'));
        maj();
      };
      return { it, b };
    });
    const actions = el('div', 'er-actions', '<button type="button" class="btn-primary">Valider</button><button type="button" class="btn-small">Tout effacer</button>');
    zone.appendChild(actions);
    const [bVal, bEff] = actions.querySelectorAll('button');
    function maj() {
      items.forEach(({ it, b }) => {
        const k = choisis.indexOf(it.id);
        b.querySelector('.sp-rang').textContent = k >= 0 ? k + 1 : '';
        b.classList.toggle('choisi', k >= 0);
      });
      bVal.disabled = choisis.length < items.length;
    }
    bEff.onclick = () => { if (!api.fini()) { choisis.length = 0; maj(); } };
    bVal.onclick = () => {
      if (api.fini() || choisis.length < items.length) return;
      const ok = choisis.every((id, i) => id === q.ordre[i]);
      if (ok) {
        items.forEach(i => i.b.classList.add('juste'));
        fermer();
        api.repondre(true);
      } else api.repondre(false, q.indice || '');
    };
    function fermer() { items.forEach(i => { i.b.disabled = true; }); bVal.disabled = true; bEff.disabled = true; }
    maj();
    return {
      essais: 2,
      solution() {
        choisis.length = 0; choisis.push(...q.ordre); maj();
        items.forEach(i => i.b.classList.add('juste'));
        fermer();
      },
      reperes() {
        items.forEach(({ it, b }) => {
          if (!it.sp || it.spectre.T == null) return;
          it.sp.maj({ repere: SP.debutVisible(it.spectre.T) });
          if (!b.querySelector('.sp-ciel')) b.insertBefore(astre(it.spectre.T, true), b.querySelector('.sp-rang'));
        });
      },
    };
  }

  /* ============================================================
     Curseur de température (échelle logarithmique 1 500 °C → 30 000 °C)
     ============================================================ */
  const TMIN = 1500, TMAX = 30000;
  const tempCurseur = v => {
    const t = TMIN * Math.pow(TMAX / TMIN, v / 1000);
    return t < 10000 ? Math.round(t / 50) * 50 : Math.round(t / 500) * 500;
  };
  const curseurTemp = T => Math.round(1000 * Math.log(T / TMIN) / Math.log(TMAX / TMIN));

  /* ============================================================
     TYPE « comparateur » : q.T (température de l'étoile), q.o (spectre de l'étoile, facultatif)
     ============================================================ */
  function tComparateur(zone, q, api) {
    ligne(zone, 'Étoile<small>température ?</small>', q.o || { fond: 'continu', T: q.T });
    const ref = ligne(zone, 'Corps chauffé', { fond: 'continu', T: TMIN });
    const c = el('div', 'sp-curseur-T', `<input type="range" min="0" max="1000" step="1" aria-label="Température du corps chauffé"><span class="sp-T"></span>`);
    zone.appendChild(c);
    const guide = el('p', 'sp-guide hidden');
    zone.appendChild(guide);
    const actions = el('div', 'er-actions', '<button type="button" class="btn-primary">Valider cette température</button>');
    zone.appendChild(actions);
    const curseur = c.querySelector('input'), val = c.querySelector('.sp-T'), bVal = actions.querySelector('button');
    let guider = false;
    // départ loin de la bonne réponse
    curseur.value = q.T > 5000 ? curseurTemp(2000) : curseurTemp(15000);
    function maj() {
      const T = tempCurseur(+curseur.value);
      val.textContent = milliers(T) + ' °C';
      ref.maj({ T });
      if (guider) {
        const e = (T - q.T) / q.T;
        guide.innerHTML = Math.abs(e) <= .15 ? '<b>Les deux spectres sont maintenant identiques.</b>'
          : e < 0 ? 'Ton corps chauffé est <b>moins chaud</b> que l\'étoile : son spectre a moins de bleu et de violet (et relativement plus de rouge).'
            : 'Ton corps chauffé est <b>plus chaud</b> que l\'étoile : son spectre a plus de bleu et de violet (et relativement moins de rouge).';
      }
    }
    curseur.addEventListener('input', maj);
    maj();
    const juste = () => Math.abs(tempCurseur(+curseur.value) - q.T) / q.T <= .15;
    bVal.onclick = () => {
      if (api.fini()) return;
      const T = tempCurseur(+curseur.value);
      if (juste()) { fermer(); api.repondre(true); }
      else api.repondre(false, T < q.T
        ? 'Le spectre de l\'étoile contient plus de bleu et de violet que celui du corps chauffé : augmente la température.'
        : 'Le spectre de l\'étoile contient moins de bleu et de violet que celui du corps chauffé : diminue la température.');
    };
    function fermer() { curseur.disabled = true; bVal.disabled = true; }
    return {
      essais: 2,
      solution() { curseur.value = curseurTemp(q.T); maj(); fermer(); },
      guider() { guider = true; guide.classList.remove('hidden'); maj(); },
    };
  }

  /* ============================================================
     TYPE « profil » : lire la température sur le profil d'intensité (q.T)
     ============================================================ */
  function lireNombre(s) {
    const t = String(s).replace(/[\s  ]/g, '').replace(',', '.');
    return /^\d+(\.\d+)?$/.test(t) ? parseFloat(t) : NaN;
  }
  function tProfil(zone, q, api) {
    const z = el('div', 'sp-profil');
    zone.appendChild(z);
    const p = SP.profil(z, { T: q.T, max: false });
    const f = el('div', 'sp-saisie', `<label>Température de surface : <span class="sp-nowrap"><input type="text" inputmode="numeric" autocomplete="off" aria-label="Température en °C"> °C</span></label><button type="button" class="btn-primary">Valider</button>`);
    zone.appendChild(f);
    const champ = f.querySelector('input'), bVal = f.querySelector('button');
    const valider = () => {
      if (api.fini()) return;
      const v = lireNombre(champ.value);
      if (isNaN(v) || v <= 0) {
        champ.classList.remove('er-secoue'); void champ.offsetWidth; champ.classList.add('er-secoue');
        champ.focus();
        return;
      }
      if (Math.abs(v - q.T) / q.T <= .12) { fermer(); api.repondre(true); }
      else api.repondre(false, v < q.T
        ? 'Ta valeur est trop faible. Repère bien le sommet de la courbe, puis descends verticalement jusqu\'à l\'échelle des températures.'
        : 'Ta valeur est trop élevée. Repère bien le sommet de la courbe, puis descends verticalement jusqu\'à l\'échelle des températures.');
    };
    bVal.onclick = valider;
    champ.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); valider(); } });
    function fermer() { champ.disabled = true; bVal.disabled = true; }
    return {
      essais: 2,
      solution() { p.maj({ max: true }); champ.value = milliers(q.T); fermer(); },
      montrerMax() { p.maj({ max: true }); },
    };
  }

  /* ============================================================
     TYPE « elements » : éléments présents dans une étoile
     q.o : spectre de l'étoile ; q.refs : [{ id, nom, raies }] ; q.presents : [id, …]
     q.outil : 'A' règle déplaçable, 'B' case cochée → raies prolongées en pointillés, 'AB' les deux
     ============================================================ */
  const OUTILS = {
    A: '<b>Méthode : la règle.</b> Fais glisser la règle (ou touche un spectre) : elle traverse tous les spectres et indique la longueur d\'onde. Compare la position des raies, coche les éléments présents, puis valide.',
    B: '<b>Méthode : prolonger les raies.</b> Coche un élément : ses raies sont prolongées en pointillés jusqu\'au spectre de l\'étoile. Garde cochés les éléments présents, puis valide.',
    AB: 'Fais glisser la <b>règle</b> (ou touche un spectre) pour lire une longueur d\'onde. <b>Coche</b> un élément : ses raies sont prolongées jusqu\'au spectre de l\'étoile. Coche les éléments présents, puis valide.',
  };
  function tElements(zone, q, api) {
    const outil = q.outil || 'AB', avecRegle = outil.includes('A'), avecProjection = outil.includes('B');
    zone.appendChild(el('p', 'sp-outils' + (avecRegle ? '' : ' sp-outils-court'), OUTILS[outil]));
    const g = el('div', 'sp-groupe');
    zone.appendChild(g);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'sp-svg');
    g.appendChild(svg);
    const regle = el('div', 'sp-regle', '<div class="sp-poignee" role="slider" aria-label="Règle"></div>');
    if (avecRegle) g.appendChild(regle);
    const poignee = regle.firstChild;
    let lambda = 500;

    const lignes = [];
    function ajouter(html, o, ref) {
      const d = el('div', 'sp-lc', `<div class="sp-lc-nom">${html}</div><div class="sp-zone${avecRegle ? ' sp-zone-clic' : ''}"></div>`);
      g.appendChild(d);
      const z = d.querySelector('.sp-zone'), s = SP.spectre(z, o);
      if (avecRegle) z.addEventListener('click', ev => {
        lambda = Math.min(SP.L1, Math.max(SP.L0, s.lambda(ev.clientX - z.getBoundingClientRect().left)));
        placer();
      });
      const L = { z, s, ref, h: o.hauteur || 44 };
      lignes.push(L);
      return L;
    }
    const etoile = ajouter('<span class="sp-nom">Étoile</span>', Object.assign({ hauteur: 50 }, q.o));
    const cases = q.refs.map((r, k) => {
      const L = ajouter(`<label class="sp-case"><input type="checkbox"><span>${r.nom}</span></label>`, { fond: 'noir', emission: r.raies, hauteur: 30, axe: false }, r);
      L.coul = COUL[k % COUL.length];
      L.cb = L.z.parentNode.querySelector('input');
      L.cb.addEventListener('change', () => { if (api.fini()) return; placer(); });
      L.z.parentNode.querySelector('.sp-case').style.setProperty('--c', L.coul);
      return L;
    });
    const actions = el('div', 'er-actions', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(actions);
    const bVal = actions.querySelector('button');

    function placer() {
      const rg = g.getBoundingClientRect(), r0 = etoile.z.getBoundingClientRect();
      if (!rg.width) return;
      regle.style.left = (r0.left - rg.left + etoile.s.x(lambda)) + 'px';
      poignee.textContent = `λ = ${Math.round(lambda)} nm`;
      svg.innerHTML = '';
      if (!avecProjection) return;
      cases.filter(L => L.cb.checked).forEach(L => {
        const rv = L.z.getBoundingClientRect();
        L.ref.raies.forEach(([l]) => {
          const x = r0.left - rg.left + etoile.s.x(l);
          const t = document.createElementNS(NS, 'line');
          t.setAttribute('x1', x); t.setAttribute('x2', x);
          t.setAttribute('y1', r0.top - rg.top + etoile.h); t.setAttribute('y2', rv.top - rg.top + 2);
          t.setAttribute('stroke', L.coul); t.setAttribute('stroke-width', '1.6'); t.setAttribute('stroke-dasharray', '4 3');
          svg.appendChild(t);
        });
      });
    }
    // règle : glisser à la souris ou au doigt
    let tire = false;
    poignee.addEventListener('pointerdown', ev => { tire = true; try { poignee.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ } ev.preventDefault(); });
    poignee.addEventListener('pointermove', ev => {
      if (!tire) return;
      const r = etoile.z.getBoundingClientRect();
      lambda = Math.min(SP.L1, Math.max(SP.L0, etoile.s.lambda(ev.clientX - r.left)));
      placer();
    });
    const lacher = () => { tire = false; };
    poignee.addEventListener('pointerup', lacher);
    poignee.addEventListener('pointercancel', lacher);
    // clavier : flèches gauche / droite
    poignee.tabIndex = 0;
    poignee.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        lambda = Math.min(SP.L1, Math.max(SP.L0, lambda + (e.key === 'ArrowLeft' ? -1 : 1)));
        placer(); e.preventDefault();
      }
    });
    if (window.ResizeObserver) new ResizeObserver(placer).observe(g);
    window.addEventListener('resize', placer);
    requestAnimationFrame(placer);

    bVal.onclick = () => {
      if (api.fini()) return;
      const coches = cases.filter(L => L.cb.checked).map(L => L.ref.id);
      if (!coches.length) { bVal.classList.remove('er-secoue'); void bVal.offsetWidth; bVal.classList.add('er-secoue'); return; }
      const trop = coches.filter(id => !q.presents.includes(id)), oubli = q.presents.filter(id => !coches.includes(id));
      if (!trop.length && !oubli.length) { fermer(); api.repondre(true); return; }
      const msg = [];
      if (trop.length) msg.push('Au moins un élément coché a une raie qui ne correspond à aucune raie noire de l\'étoile : il n\'est pas présent.');
      if (oubli.length) msg.push('Certaines raies noires de l\'étoile ne correspondent à aucun élément coché : il manque au moins un élément.');
      api.repondre(false, msg.join(' '));
    };
    function fermer() { cases.forEach(L => { L.cb.disabled = true; }); bVal.disabled = true; }
    return {
      essais: 2,
      solution() { cases.forEach(L => { L.cb.checked = q.presents.includes(L.ref.id); }); fermer(); placer(); },
      marquer() { etoile.s.maj({ marques: (q.o.absorption || []).map(r => r[0]) }); },
    };
  }

  const TYPES = { choix: tChoix, ordre: tOrdre, comparateur: tComparateur, profil: tProfil, elements: tElements };

  /* ============================================================
     SÉRIE DE QUESTIONS
     opts = { app, badge, titre, intro, questions: () => [q], suite: { href, label } }
     q = { type, theme, consigne, explication, aides: [{ id, titre, html, apres?(div), action?(ctx) }], … }
     ============================================================ */
  function serie(opts) {
    const app = opts.app;
    let qs = [], idx = 0, score = 0, recap = [], aidesVues = new Set();
    const ptsTxt = v => `${virgule(v)} pt${v > 1 ? 's' : ''}`;

    const nombre = opts.nombre || 10;
    function intro() {
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>${opts.intro || ''}
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Barème</b> · ${nombre} questions de difficulté croissante${nombre === 10 ? ', notées sur 20' : ''} :</p>
          <ul class="er-liste"><li><b>2 points</b> si tu réponds juste du premier coup ;</li><li><b>1 point</b> si tu réponds juste au deuxième essai ;</li><li>pour les questions à deux choix, <b>un seul essai</b>${nombre === 10 ? '' : ` ;</li><li>à la fin, ton total sur ${2 * nombre} points est <b>ramené sur 20</b>`}.</li></ul></div>
        <div class="cle" style="margin:14px 0"><p><b class="cle-titre">Les aides</b> · Si tu bloques, utilise les aides. <b>La première fois</b> que tu utilises une aide, elle est <b>gratuite</b>. Si tu as encore besoin de <b>la même aide</b> dans une question suivante, elle <b>coûte ½ point</b> : cela montre que tu n'as pas encore retenu ce qu'elle explique. Lis-la donc bien la première fois !</p></div>
        <button type="button" class="btn-primary" data-a="go">Commencer →</button></div>`;
      app.querySelector('[data-a="go"]').onclick = demarrer;
    }

    function demarrer() { qs = opts.questions(); idx = 0; score = 0; recap = []; aidesVues = new Set(); afficher(); }

    function afficher() {
      if (idx >= qs.length) return fin();
      const q = qs[idx];
      window.EX.question = q;                 // question en cours (utile pour vérifier l'application)
      app.innerHTML = `<div class="er-card"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">${opts.titre}</h2>
        <p class="er-meta">Question ${idx + 1}/${qs.length} · Score : <b data-a="score">${ptsTxt(score)}</b></p>
        <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(idx / qs.length * 100)}%"></div></div></div>
        <div class="er-card sp-question">
          <p class="er-q-nom">${q.theme}</p>
          <p class="er-consigne">${q.consigne}</p>
          <div data-a="zone"></div>
          <div class="sp-aides" data-a="aides"></div>
          <div data-a="retour"></div>
          <div class="er-actions" data-a="suite"></div>
        </div>`;
      window.scrollTo(0, 0);
      // évite qu'un double appui sur « Question suivante » réponde à la nouvelle question
      app.style.pointerEvents = 'none';
      setTimeout(() => { app.style.pointerEvents = ''; }, 350);
      const etat = { essais: 0, payantes: 0, fini: false };
      const retour = app.querySelector('[data-a="retour"]');
      const api = {
        fini: () => etat.fini,
        repondre(ok, indice) {
          if (etat.fini) return;
          etat.essais++;
          if (ok) return finir(etat.essais === 1 ? 2 : 1);
          if (etat.essais < ctx.essais) {
            retour.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> Il te reste un essai.</p>${indice ? `<p>${indice}</p>` : ''}</div>`;
            return;
          }
          if (ctx.solution) ctx.solution();
          finir(0);
        },
      };
      const ctx = TYPES[q.type](app.querySelector('[data-a="zone"]'), q, api);
      aides(q, app.querySelector('[data-a="aides"]'), ctx, etat);

      function finir(base) {
        etat.fini = true;
        const p = Math.max(0, base - .5 * etat.payantes);
        score += p; recap.push({ n: idx + 1, p });
        app.querySelector('[data-a="score"]').textContent = ptsTxt(score);
        app.querySelectorAll('[data-a="aides"] button').forEach(b => { b.disabled = true; });
        const retenue = base && etat.payantes ? ` (aide déjà utilisée : −${virgule(.5 * etat.payantes)} point)` : '';
        const titre = base === 2 ? 'Bravo, c\'est juste du premier coup !' : base === 1 ? 'C\'est juste au deuxième essai.' : 'Ce n\'est pas ça.';
        retour.innerHTML = `<div class="${base ? 'callout-success' : 'callout-danger'} er-retour">
          <p><b class="${base ? 'er-ok' : 'er-ko'}">${titre}</b> +${ptsTxt(p)}${retenue}</p>
          ${base ? '' : '<p>La bonne réponse est affichée.</p>'}${q.explication ? `<p>${q.explication}</p>` : ''}</div>`;
        const s = app.querySelector('[data-a="suite"]'), der = idx === qs.length - 1;
        s.innerHTML = `<button type="button" class="btn-primary" disabled>${der ? 'Voir mon score →' : 'Question suivante →'}</button>`;
        const b = s.querySelector('button');
        setTimeout(() => { b.disabled = false; }, 450);
        b.onclick = () => { idx++; afficher(); };
      }
    }

    // Aides : la n-ième aide n'est proposée qu'après la précédente
    function aides(q, zone, ctx, etat) {
      const liste = q.aides || [];
      if (!liste.length) return;
      const boutons = el('div', 'sp-aides-btn');
      const contenu = el('div');
      zone.appendChild(boutons);
      zone.appendChild(contenu);
      liste.forEach((a, k) => {
        const deja = aidesVues.has(a.id);
        const b = el('button', 'btn-small sp-aide-b' + (deja ? ' payante' : ''),
          `Aide ${k + 1} : ${a.titre} <span class="sp-tag">${deja ? '−½ point' : 'gratuite'}</span>`);
        b.type = 'button';
        b.disabled = k > 0;
        boutons.appendChild(b);
        b.onclick = () => {
          if (etat.fini || b.classList.contains('vue')) return;
          if (aidesVues.has(a.id)) etat.payantes++;
          aidesVues.add(a.id);
          b.classList.add('vue'); b.disabled = true;
          b.querySelector('.sp-tag').textContent = deja ? '−½ point' : 'utilisée';
          const d = el('div', 'sp-aide-txt', `<p class="sp-aide-titre">Aide ${k + 1} : ${a.titre}${deja ? ' <span>(déjà utilisée dans une question précédente : −½ point)</span>' : ''}</p>${a.html || ''}`);
          contenu.appendChild(d);
          if (a.apres) a.apres(d);
          if (a.action && ctx[a.action]) ctx[a.action]();
          const suivant = boutons.children[k + 1];
          if (suivant) suivant.disabled = false;
        };
      });
    }

    function fin() {
      const max = qs.length * 2, pct = Math.round(score / max * 100);
      const note = Math.round(score / max * 40) / 2;           // note sur 20, arrondie au demi-point
      window.SOM.marquer({ note });                              // meilleure note sur 20 (sommaire, accueil)
      const msg = score === max ? 'Sans-faute : tu maîtrises ces notions.' : pct >= 70 ? 'Très bien ! Encore un peu d\'entraînement pour le sans-faute.'
        : pct >= 50 ? 'Pas mal ! Recommence : les questions changent à chaque fois.' : 'Continue à t\'entraîner : lis bien les aides et les corrections.';
      app.innerHTML = `<div class="er-card er-fin"><span class="er-badge">${opts.badge}</span><h2 class="er-titre">Série terminée !</h2>
        ${score === max ? '<p class="er-trophee">🏆 Sans-faute !</p>' : ''}
        <div class="er-score">${virgule(note)} / 20</div><p class="er-score-pct">${max === 20 ? '' : `${virgule(score)} points sur ${max} · `}${pct} %</p><p class="er-contexte">${msg}</p>
        <div class="er-recap">${recap.map(r => `<div class="${r.p === 2 ? 'ok' : r.p === 0 ? 'ko' : 'moyen'}">Q${r.n}<b>${virgule(r.p)}/2</b></div>`).join('')}</div>
        <div class="er-actions" style="justify-content:center"><button type="button" class="btn-secondary" data-a="re">↺ Recommencer avec d'autres questions</button>
        ${opts.suite ? `<a class="btn-primary" style="text-decoration:none" href="${opts.suite.href}">${opts.suite.label}</a>` : ''}</div></div>`;
      app.querySelector('[data-a="re"]').onclick = demarrer;
      window.scrollTo(0, 0);
      if (score === max) confettis();
    }
    intro();
  }

  /* ---------- Confettis (sans-faute) ---------- */
  function confettis() {
    const col = ['#5a3fc4', '#16a34a', '#e8890c', '#d61f69', '#2952c8'];
    for (let i = 0; i < 70; i++) {
      const c = el('div', 'er-confetti');
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = col[i % col.length];
      c.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
      c.style.animationDelay = (Math.random() * 0.8) + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4800);
    }
  }

  /* ---------- Plan de l'application et navigation (voir assets/sommaire.js) ---------- */
  // pas de cours dans cette application : une série de questions par module, donc pas de fiche
  const PLAN = [
    { n: 1, titre: 'Les types de spectres', desc: 'Émission ou absorption, continu ou de raies, et la source qui les produit',
      parties: [{ nom: 'Les types de spectres', questions: 'module_1' }] },
    { n: 2, titre: 'Température d\'un corps chauffé', desc: 'Classer des spectres selon la température, couleur des étoiles',
      parties: [{ nom: 'Température', questions: 'module_2' }] },
    { n: 3, titre: 'Composition d\'une étoile', desc: 'Identifier les éléments chimiques grâce aux raies noires du spectre',
      parties: [{ nom: 'Composition', questions: 'module_3' }] },
    { n: 4, titre: 'Bilan : mission astronome', desc: 'Type de spectre, température et composition de trois étoiles',
      parties: [{ nom: 'Mission astronome', questions: 'module_4' }] },
  ];
  window.SOM.init({ nom: 'Spectres et étoiles', id: 'spectres-etoiles', plan: PLAN });
  const menu = cle => window.SOM.menu(cle);
  const accueil = zone => window.SOM.accueil(zone);

  window.EX = { serie, menu, accueil, PLAN, astre, ligne, milliers };
})();
