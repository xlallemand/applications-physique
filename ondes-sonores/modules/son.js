/* ============================================================
   Sons, notes et instruments (objet global SON) de l'application
   « Chapitre 18 : Ondes sonores ». À charger après assets/fourier.js
   (même moteur que le simulateur du chapitre 17).

   SON.NOTES                      gamme de do₃ à ré₅ (la₃ = 440 Hz) : [{ id, nom (HTML), texte, f, diese }]
   SON.note(id)                   une note de la gamme ; SON.noteDe(f) : la note la plus proche d'une fréquence
   SON.INSTRUMENTS                spectres simplifiés (amplitudes a₁, a₂… en V) : diapason, flûte,
                                  violon, clarinette, orgue, guitare
   SON.instrumentDe(a)            identifiant de l'instrument dont le spectre est a (ou null)
   SON.nature(a)                  'pur' (une seule raie), 'complexe' (plusieurs raies) ou 'muet'
   SON.jouer(spec, volume)        joue le son calculé par SON.rendre (Web Audio), avec la réverbération
                                  d'une salle ; spec = { f1, a, jeu } ; volume de 0 à 1, plafonné ;
                                  renvoie false si l'audio est indisponible
   SON.rendre(spec, sr)           calcule le son (échantillons mono, sommet à 1) : son complet de
                                  l'instrument si a est un préréglage, sinon attaque et extinction
                                  de l'instrument spec.jeu (ou son neutre) sur les seules raies a
   SON.disponible()               l'audio peut-il fonctionner dans ce navigateur ?
   SON.bouton(spec, libelle)      bouton « ▶ Écouter » en HTML (à placer dans un énoncé, une fiche…)
   SON.monter(zone, opts)         simulateur musical : FOURIER.monter (signal au-dessus, spectre en
                                  dessous, raies réglables) habillé d'un clavier (do₃ à ré₅) ou d'une
                                  fréquence libre, de préréglages d'instruments, d'un bouton « Écouter »
                                  avec volume, et des mots « hauteur (note) », « timbre », « son pur »,
                                  « son complexe ». Plusieurs exemplaires possibles.
       opts = { note ('la3'), libre (bool), f1, instrument ('diapason'), a, fmax, mesure, cases,
                clavier (true), instruments (true), N (8 harmoniques), tmax (10 ms), amax (2 V), aria }
       → { el, fourier, etat(), regler(r, silencieux), surChange(f), jouer() }
       etat() = { f1, a, note, libre, instrument, nature, ecoutes: [{ note, f1, instrument, a }], mesure, t1, t2, fmax }
       regler accepte note, libre, f1, instrument, a, et les réglages de FOURIER (fmax, mesure, cible…)
   SON.air(zone, opts)            animation de l'air entre un haut-parleur et une oreille : points
                                  qui oscillent autour de leur position, compressions (C) et
                                  dilatations (D) qui avancent ; boutons « Pause / Animer » et
                                  « Pas à pas » (seul celui-ci si prefers-reduced-motion).
                                  Plusieurs exemplaires possibles. → { el, temps(), avancer() }
   ============================================================ */
(function () {
  'use strict';

  const F = () => window.FOURIER;
  // nombre écrit par FOURIER, milliers séparés par une espace insécable (1 046 Hz ne se coupe pas)
  const fmt = (v, d) => F().fmt(v, d).replace(/ /g, '\u00a0');
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ============================================================
     NOTES : gamme tempérée, la₃ = 440 Hz (notation française : do₃ = 262 Hz) ;
     les fréquences sont celles des manuels (La₄ 880 Hz, Si₄ 988 Hz,
     Do₅ 1 046 Hz, Ré₅ 1 174 Hz : données de l'exercice 8)
     ============================================================ */
  const NOMS = [['do', ''], ['do', '♯'], ['ré', ''], ['ré', '♯'], ['mi', ''], ['fa', ''], ['fa', '♯'], ['sol', ''], ['sol', '♯'], ['la', ''], ['la', '♯'], ['si', '']];
  const FREQ = [262, 277, 294, 311, 330, 349, 370, 392, 415, 440, 466, 494, 523, 554, 587, 622, 659, 698, 740, 784, 831, 880, 932, 988, 1046, 1109, 1174];
  const NOTES = FREQ.map((f, k) => {
    const [n, d] = NOMS[k % 12], oct = 3 + Math.floor(k / 12);
    return { id: (n === 'ré' ? 're' : n) + (d ? 'd' : '') + oct, nom: `${n}${d}<sub>${oct}</sub>`, texte: `${n}${d ? ' dièse' : ''} ${oct}`, f, diese: !!d };
  });
  const note = id => NOTES.find(n => n.id === id) || null;
  const noteDe = f => NOTES.reduce((b, n) => (Math.abs(Math.log(n.f / f)) < Math.abs(Math.log(b.f / f)) ? n : b), NOTES[0]);

  /* ============================================================
     INSTRUMENTS : spectres simplifiés (amplitudes en V, comme le signal
     d'un micro), à présenter comme tels
     ============================================================ */
  const INSTRUMENTS = {
    diapason: { label: 'Diapason', a: [1.5], desc: 'son pur : une seule raie' },
    // flûte : rapports des raies du la₄ de l'exercice A (1 ; 0,30 ; 0,08)
    flute: { label: 'Flûte', a: [1.6, .48, .13], desc: 'fondamental fort, deux harmoniques faibles' },
    // violon : rapports des pics du sujet de bac (0,098 ; 0,139 ; 0,012 ; 0,014 ; 0,004 V)
    violon: { label: 'Violon', a: [1, 1.42, .12, .14, .04], desc: 'a<sub>2</sub> plus grand que a<sub>1</sub>, a<sub>3</sub> et a<sub>4</sub> faibles' },
    clarinette: { label: 'Clarinette', a: [1.5, .1, 1, .05, .6, .05, .35], desc: 'surtout les harmoniques impairs' },
    orgue: { label: 'Orgue', a: [1.4, 1.45], desc: 'fondamental et rang 2' },
    guitare: { label: 'Guitare', a: [1.2, 1.15, 0, 1.15, .25, 0, .3], desc: 'harmoniques jusqu\'au rang 7' },
  };
  const egalA = (a, b) => {
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) if (Math.abs((+a[i] || 0) - (+b[i] || 0)) > .001) return false;
    return true;
  };
  const instrumentDe = a => Object.keys(INSTRUMENTS).find(k => egalA(a, INSTRUMENTS[k].a)) || null;
  const nbRaies = a => a.filter(v => v > 0).length;
  const nature = a => (nbRaies(a) === 0 ? 'muet' : nbRaies(a) === 1 ? 'pur' : 'complexe');

  /* ============================================================
     SYNTHÈSE DES SONS : chaque son est calculé échantillon par
     échantillon (somme de sinus dont l'amplitude et la fréquence
     varient dans le temps), puis joué par Web Audio avec la
     réverbération d'une salle (d'une église pour l'orgue).
     Ce qui fait reconnaître un instrument, en plus de ses raies
     principales : l'attaque et l'extinction du son, le vibrato, le
     souffle (flûte, clarinette) ou le frottement de l'archet (violon),
     les résonances de la caisse, le pincement de la corde (guitare),
     des harmoniques aigus faibles (non dessinés : les spectres
     affichés sont simplifiés).
     - spectre identique à un préréglage : son complet de l'instrument ;
     - raies modifiées : attaque et extinction du dernier instrument
       choisi (spec.jeu), appliquées aux seules raies affichées ;
     - autre spectre (exercices) : son neutre, raies affichées seules.
     Phases des harmoniques tirées au hasard (l'oreille n'y est pas
     sensible) ; tirages reproductibles : un même son est identique.
     ============================================================ */
  const KC = 64;                                                     // pas de contrôle : enveloppes calculées tous les 64 échantillons
  const DEUX_PI = 2 * Math.PI;
  const lisse = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x)); // passage progressif de 0 à 1
  const montee = (t, tau) => (t <= 0 ? 0 : 1 - Math.exp(-t / tau));  // montée exponentielle (constante de temps tau)
  const fin = (t, D, d) => lisse((D - t) / (d || .04));             // fondu final de durée d (évite un claquement)

  // générateur pseudo-aléatoire reproductible (mulberry32) et graine tirée d'un texte
  function alea(graine) {
    let s = graine >>> 0;
    return () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function graineDe(txt) {
    let h = 2166136261;
    for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  // fluctuation lente (bruit filtré deux fois, écart type 0,5), au pas de contrôle : nc valeurs, coupure fc (Hz)
  function lent(nc, fc, dt, r) {
    const out = new Float32Array(nc), k = 1 - Math.exp(-DEUX_PI * fc * dt), avant = Math.ceil(1 / (fc * dt));
    let y = 0, z = 0, s = 0;
    for (let i = 0; i < nc + avant; i++) {                            // les premières valeurs (mise en route) sont jetées
      y += k * (r() * 2 - 1 - y); z += k * (y - z);
      if (i >= avant) { out[i - avant] = z; s += z * z; }
    }
    const e = Math.sqrt(s / nc) || 1;
    for (let i = 0; i < nc; i++) out[i] *= .5 / e;
    return out;
  }
  // filtre du second ordre (formules RBJ) : 'pb' passe-bas, 'ph' passe-haut, 'bande' passe-bande (gain 1 au centre)
  function filtre(x, type, f, Q, sr) {
    const w = DEUX_PI * Math.min(f, sr * .45) / sr, c = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al;
    let b0, b1, b2;
    if (type === 'pb') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (type === 'ph') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = al; b1 = 0; b2 = -al; }
    b0 /= a0; b1 /= a0; b2 /= a0;
    const a1 = -2 * c / a0, a2 = (1 - al) / a0, y = new Float32Array(x.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
      const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  }
  const blanc = (N, r) => { const b = new Float32Array(N); for (let i = 0; i < N; i++) b[i] = r() * 2 - 1; return b; };
  const efficace = (x, i0, i1) => { let s = 0; for (let i = i0; i < i1; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, i1 - i0)); };
  // courbe au pas de contrôle : g(t, k) pour chaque pas k
  const courbe = (nc, dt, g) => { const a = new Float32Array(nc); for (let k = 0; k < nc; k++) a[k] = g(k * dt, k); return a; };
  // raies du spectre affiché : [rang, amplitude relative]
  const raies = ar => ar.map((x, i) => [i + 1, x]).filter(([, x]) => x > 0);
  // durée D (s) → nombre d'échantillons N, de pas de contrôle nc, pas de contrôle dt (s)
  function voix(sr, D) { const N = Math.floor(sr * D); return { sr, D, N, nc: Math.ceil(N / KC) + 2, dt: KC / sr }; }

  // table de sinus (une période en 4 096 pas, lue avec interpolation linéaire : plus rapide que Math.sin)
  const NT = 4096, SINUS = new Float32Array(NT + 1);
  for (let i = 0; i <= NT; i++) SINUS[i] = Math.sin(DEUX_PI * i / NT);
  // somme des partiels : freq (Hz, au pas de contrôle) = fréquence du fondamental, qui peut varier (vibrato) ;
  // partiels [{ m (fréquence = m × freq), phi (phase, en rad), amp (amplitude au pas de contrôle) }]
  // → out (échantillons) et PH (phase du fondamental, en nombre de périodes)
  function additive(sr, N, freq, partiels) {
    const out = new Float32Array(N), PH = new Float64Array(N);
    let ph = 0, fMax = 0;
    for (let i = 0; i < N; i++) {
      const k = i / KC, k0 = k | 0;
      ph += (freq[k0] + (freq[k0 + 1] - freq[k0]) * (k - k0)) / sr;
      PH[i] = ph;
    }
    for (let k = 0; k < freq.length; k++) fMax = Math.max(fMax, freq[k]);
    partiels.forEach(p => {
      if (p.m * fMax > .45 * sr) return;                              // trop aigu pour la fréquence d'échantillonnage
      const A = p.amp, m = p.m, ph0 = p.phi / DEUX_PI;
      for (let b = 0, i0 = 0; i0 < N; b++, i0 += KC) {
        const a0 = A[b], da = (A[b + 1] - a0) / KC;
        if (Math.abs(a0) < 1e-6 && Math.abs(A[b + 1]) < 1e-6) continue;
        const i1 = Math.min(N, i0 + KC);
        for (let i = i0; i < i1; i++) {
          const u = m * PH[i] + ph0, x = (u - Math.floor(u)) * NT, j = x | 0;
          out[i] += (a0 + da * (i - i0)) * (SINUS[j] + (SINUS[j + 1] - SINUS[j]) * (x - j));
        }
      }
    });
    return { out, PH };
  }
  // ajoute un bruit filtré b : son efficace vaut niveau(t, i) × ref (ref : efficace de la partie harmonique)
  function ajouterBruit(out, b, ref, niveau, sr) {
    const k = ref / (efficace(b, 0, b.length) || 1);
    for (let i = 0; i < out.length; i++) out[i] += b[i] * k * niveau(i / sr, i);
  }

  /* ---------- diapason : son pur, frappé, qui s'éteint lentement ---------- */
  function diapason(v, f1, ar, complet, r) {
    const { nc, dt, D } = v;
    const env = courbe(nc, dt, t => montee(t, .004) * Math.exp(-t / 2.2) * fin(t, D, .3));
    return { freq: courbe(nc, dt, () => f1), partiels: raies(ar).map(([n, x]) => ({ m: n, phi: r() * DEUX_PI, amp: env.map(e => e * x) })), salle: 'salle', humide: .1 };
  }

  /* ---------- violon : archet, vibrato, résonances de la caisse ---------- */
  // résonances de la caisse [fréquence (Hz), poids, facteur de qualité] : modes du bois et de l'air,
  // nombreux pics étroits, et large « colline » du chevalet vers 2,6 kHz
  const CAISSE_VIOLON = [[275, .9, 12], [405, .5, 15], [470, 1.1, 18], [550, .85, 16], [650, .35, 20], [780, .4, 18], [920, .35, 20],
    [1080, .45, 18], [1250, .35, 22], [1450, .4, 22], [1700, .4, 20], [1950, .45, 20], [2200, .55, 18], [2500, .6, 18], [2800, .55, 18],
    [3150, .45, 18], [3550, .35, 16], [4100, .25, 15], [4800, .18, 14], [2600, .7, 2.5]];
  function H_VIOLON(f) {
    let h = .12;
    for (let j = 0; j < CAISSE_VIOLON.length; j++) {
      const [fr, g, q] = CAISSE_VIOLON[j], x = q * (f / fr - fr / f);
      h += g / Math.sqrt(1 + x * x);
    }
    return h / (1 + Math.pow(f / 6500, 4));
  }
  function violon(v, f1, ar, complet, r) {
    const { sr, N, nc, dt, D } = v, tOff = D - .28;
    const derive = lent(nc, .6, dt, r), vit = lent(nc, .4, dt, r), archet = lent(nc, 2.5, dt, r);
    const freq = new Float32Array(nc), env = new Float32Array(nc);
    let phv = r() * DEUX_PI;
    for (let k = 0; k < nc; k++) {
      const t = k * dt;
      phv += DEUX_PI * (5.8 + .5 * vit[k]) * dt;
      // vibrato de ± 22 cents qui s'installe après 0,25 s, légère dérive de justesse (son complet)
      const c = complet ? 22 * lisse((t - .25) / .4) * Math.sin(phv) + 3 * derive[k] : 0;
      freq[k] = f1 * Math.pow(2, c / 1200);
      // archet : montée en 0,1 s, léger crescendo, pression qui fluctue ; extinction quand l'archet s'arrête
      let e = montee(t, .045) * (.9 + .1 * lisse(t / .7)) * (1 + (complet ? .04 * archet[k] : 0));
      if (t > tOff) e *= Math.exp(-(t - tOff) / .1);
      env[k] = e * fin(t, D);
    }
    const liste = raies(ar);
    // son complet : harmoniques aigus de la corde frottée (en 1/n environ) filtrés par la caisse
    if (complet) for (let n = ar.length + 1; n <= 40 && n * f1 < 8000; n++) liste.push([n, .55 * H_VIOLON(n * f1) / Math.pow(n, .8)]);
    const partiels = liste.map(([n, x]) => {
      const h0 = H_VIOLON(n * f1), ta = .012 + .003 * n, amp = new Float32Array(nc);
      // avec le vibrato, chaque harmonique balaie les résonances de la caisse : son amplitude ondule
      for (let k = 0; k < nc; k++) amp[k] = x * env[k] * montee(k * dt, ta) * (complet ? H_VIOLON(n * freq[k]) / h0 : 1);
      return { m: n, phi: r() * DEUX_PI, amp };
    });
    // frottement de l'archet : bruit aigu, plus fort à l'attaque, pulsé au rythme de la corde
    const bruits = complet ? (out, PH, ref) => ajouterBruit(out, filtre(blanc(N, r), 'bande', 3000, .7, sr), ref,
      (t, i) => (.03 + .1 * Math.exp(-t / .07)) * env[i / KC | 0] * (.75 + .25 * Math.sin(DEUX_PI * PH[i])), sr) : null;
    return { freq, partiels, bruits, salle: 'salle', humide: .22 };
  }

  /* ---------- flûte : souffle, vibrato d'intensité ---------- */
  function flute(v, f1, ar, complet, r) {
    const { sr, N, nc, dt, D } = v, tOff = D - .28;
    const derive = lent(nc, .5, dt, r), souffle = lent(nc, 3, dt, r);
    const freq = new Float32Array(nc), env = new Float32Array(nc), envB = new Float32Array(nc), vib = new Float32Array(nc);
    let phv = r() * DEUX_PI;
    for (let k = 0; k < nc; k++) {
      const t = k * dt;
      phv += DEUX_PI * 5.1 * dt;
      // vibrato surtout d'intensité (le souffle) après 0,3 s ; à l'attaque, la note monte à sa justesse
      vib[k] = complet ? lisse((t - .3) / .4) * Math.sin(phv) : 0;
      const c = complet ? -14 * Math.exp(-t / .05) + 6 * vib[k] + 3 * derive[k] : 0;
      freq[k] = f1 * Math.pow(2, c / 1200);
      const ext = (t > tOff ? Math.exp(-(t - tOff) / .07) : 1) * fin(t, D);
      env[k] = montee(t, .03) * (1 + (complet ? .03 * souffle[k] : 0)) * ext;
      envB[k] = montee(t, .006) * (1 + .1 * souffle[k]) * ext;
    }
    const liste = raies(ar);
    // son complet : quelques harmoniques aigus très faibles
    if (complet) for (let n = ar.length + 1; n <= 14 && n * f1 < 7000; n++) liste.push([n, .05 * Math.pow(4 / n, 2)]);
    const partiels = liste.map(([n, x]) => {
      const pv = n === 1 ? .1 : .2;
      // attaque : le rang 2 sort d'abord (il dépasse un instant sa valeur), les raies aiguës arrivent un peu après
      return { m: n, phi: r() * DEUX_PI, amp: courbe(nc, dt, (t, k) => x * env[k] * (1 + pv * vib[k])
        * (n === 1 ? montee(t, .04) : n === 2 ? montee(t, .012) * (1 + (complet ? .9 * Math.exp(-t / .06) : 0)) : montee(t, .03 + .008 * n))) };
    });
    const bruits = complet ? (out, PH, ref) => {
      const w = blanc(N, r);
      // souffle « accordé » autour des deux premières raies (le tuyau résonne aussi sur le bruit)
      ajouterBruit(out, filtre(w, 'bande', f1, 5, sr), ref, (t, i) => .06 * envB[i / KC | 0] * (1 + .3 * vib[i / KC | 0]), sr);
      ajouterBruit(out, filtre(w, 'bande', 2 * f1, 5, sr), ref, (t, i) => .035 * envB[i / KC | 0], sr);
      // souffle aigu, renforcé à l'attaque (coup de langue)
      ajouterBruit(out, filtre(filtre(w, 'ph', 2500, .7, sr), 'pb', 9000, .7, sr), ref, (t, i) => (.035 + .12 * Math.exp(-t / .04)) * envB[i / KC | 0], sr);
    } : null;
    return { freq, partiels, bruits, salle: 'salle', humide: .22 };
  }

  /* ---------- clarinette : harmoniques impairs, attaque de l'anche ---------- */
  function clarinette(v, f1, ar, complet, r) {
    const { sr, N, nc, dt, D } = v, tOff = D - .25;
    const derive = lent(nc, .5, dt, r), souffle = lent(nc, 2, dt, r);
    const freq = new Float32Array(nc), env = new Float32Array(nc), envB = new Float32Array(nc);
    for (let k = 0; k < nc; k++) {
      const t = k * dt;
      // pas de vibrato ; la note se place en quelques centièmes de seconde
      const c = complet ? -6 * Math.exp(-t / .03) + 2 * derive[k] : 0;
      freq[k] = f1 * Math.pow(2, c / 1200);
      const ext = (t > tOff ? Math.exp(-(t - tOff) / .045) : 1) * fin(t, D);
      env[k] = montee(t, .018) * (1 + (complet ? .015 * souffle[k] : 0)) * ext;
      envB[k] = montee(t, .004) * ext;
    }
    const liste = raies(ar);
    // son complet : les harmoniques impairs continuent à décroître (0,233 : rapport a₇ / a₁ du préréglage) ;
    // au-dessus de 1,7 kHz environ, les harmoniques pairs reviennent
    if (complet) for (let n = ar.length + 1; n <= 40 && n * f1 < 7000; n++) {
      const F = n * f1, imp = .233 * Math.pow(7 / n, 1.8);
      liste.push([n, (n % 2 ? imp : imp * (F > 1700 ? .55 : .12)) / (1 + Math.pow(F / 5000, 3))]);
    }
    const partiels = liste.map(([n, x]) => ({ m: n, phi: r() * DEUX_PI, amp: courbe(nc, dt, (t, k) => x * env[k] * montee(t, .008 + .003 * n)) }));
    // souffle dans l'anche, plus net à l'attaque
    const bruits = complet ? (out, PH, ref) => ajouterBruit(out, filtre(blanc(N, r), 'bande', 1800, .8, sr), ref,
      (t, i) => (.018 + .06 * Math.exp(-t / .03)) * envB[i / KC | 0], sr) : null;
    return { freq, partiels, bruits, salle: 'salle', humide: .2 };
  }

  /* ---------- orgue : tuyaux, vent stable, église ---------- */
  function orgue(v, f1, ar, complet, r) {
    const { sr, N, nc, dt, D } = v, tOff = D - .25;
    const flot = lent(nc, 4, dt, r);
    const ext = courbe(nc, dt, t => (t > tOff ? Math.exp(-(t - tOff) / .03) : 1) * fin(t, D));
    // vent : pression très stable, pas de vibrato
    const env = courbe(nc, dt, (t, k) => montee(t, .03) * (1 + (complet ? .006 * flot[k] : 0)) * ext[k]);
    let liste;
    if (complet) {
      // deux jeux de tuyaux : bourdon 8' (fondamental, harmoniques impairs faibles) et flûte 4' (une octave
      // au-dessus, un rien plus haute : battement très lent) ; [multiple de f1, amplitude, constante de temps de l'attaque]
      const a1 = ar[0], a2 = ar[1] || 0, d4 = Math.pow(2, .9 / 1200);
      liste = [[1, a1, .05], [2, .12 * a1, .03], [3, .06 * a1, .02], [5, .025 * a1, .02], [7, .012 * a1, .02],
        [2 * d4, Math.max(0, a2 - .12 * a1), .035], [4 * d4, .05 * a2, .02], [6 * d4, .035 * a2, .02], [8 * d4, .015 * a2, .02], [10 * d4, .008 * a2, .02]];
    } else liste = raies(ar).map(([n, x]) => [n, x, .02 + .005 * n]);
    // son complet : les aigus « parlent » un instant avant le reste (attaque des tuyaux)
    const partiels = liste.filter(([m, x]) => x > 0 && m * f1 < 8000).map(([m, x, ta]) => ({ m, phi: r() * DEUX_PI,
      amp: courbe(nc, dt, (t, k) => x * env[k] * montee(t, ta) * (complet && m > 2.5 ? 1 + 2.5 * Math.exp(-t / .035) : 1)) }));
    const bruits = complet ? (out, PH, ref) => {
      const w = blanc(N, r);
      // chuintement de l'attaque des tuyaux, puis vent très léger
      ajouterBruit(out, filtre(w, 'bande', Math.min(3 * f1, 6000), 2, sr), ref, t => .12 * Math.exp(-t / .04) * montee(t, .004), sr);
      ajouterBruit(out, filtre(w, 'pb', 1000, .7, sr), ref, (t, i) => .006 * ext[i / KC | 0], sr);
    } : null;
    return { freq: courbe(nc, dt, () => f1), partiels, bruits, salle: 'eglise', humide: .4 };
  }

  /* ---------- guitare : corde pincée qui s'éteint ---------- */
  function guitare(v, f1, ar, complet, r) {
    const { sr, N, nc, dt, D } = v, B = complet ? 6e-5 : 0;            // B : raideur de la corde (harmoniques un peu trop hauts)
    // pincement : la corde, un peu plus tendue au départ, sonne légèrement trop haut pendant quelques centièmes de seconde
    const freq = courbe(nc, dt, t => f1 * Math.pow(2, (complet ? 7 * Math.exp(-t / .07) : 0) / 1200));
    const liste = raies(ar);
    // son complet : harmoniques aigus ; corde pincée vers le tiers de sa longueur : les rangs multiples de 3 manquent
    if (complet) for (let n = ar.length + 1; n <= 40 && n * f1 < 8000; n++) liste.push([n, .25 * Math.pow(7 / n, 1.4) * Math.abs(Math.sin(n * Math.PI / 3)) / .866]);
    const partiels = liste.map(([n, x]) => {
      // les aigus s'éteignent bien plus vite que les graves ; deux vitesses d'extinction (corde, puis caisse) ;
      // son complet : léger battement (la corde vibre dans deux directions à des fréquences très voisines)
      const tau = 1 / (.75 + 1.5e-7 * Math.pow(n * f1, 2)), dn = .15 + .35 * r(), psi = r() * DEUX_PI;
      return { m: n * Math.sqrt(1 + B * n * n), phi: r() * DEUX_PI, amp: courbe(nc, dt, t => x * montee(t, .0015)
        * (.72 * Math.exp(-t / tau) + .28 * Math.exp(-t / (3 * tau))) * (1 + (complet ? .1 * Math.cos(DEUX_PI * dn * t + psi) : 0)) * fin(t, D, .35)) };
    });
    const bruits = complet ? (out, PH, ref) => {
      const w = blanc(N, r);
      // claquement du doigt sur la corde, puis coup sourd de la caisse
      ajouterBruit(out, filtre(w, 'bande', 3200, .9, sr), ref, t => .5 * Math.exp(-t / .005), sr);
      ajouterBruit(out, filtre(w, 'bande', 110, 3, sr), ref, t => .25 * Math.exp(-t / .06) * montee(t, .003), sr);
    } : null;
    return { freq, partiels, bruits, salle: 'salle', humide: .16, ref: [0, .3] };
  }

  /* ---------- son neutre : les raies affichées, attaque et extinction douces ---------- */
  function neutre(v, f1, ar, complet, r) {
    const { nc, dt, D } = v, tOff = D - .25;
    const env = courbe(nc, dt, t => montee(t, .015) * (t > tOff ? Math.exp(-(t - tOff) / .08) : 1) * fin(t, D));
    return { freq: courbe(nc, dt, () => f1), partiels: raies(ar).map(([n, x]) => ({ m: n, phi: r() * DEUX_PI, amp: env.map(e => e * x) })), salle: 'salle', humide: .1 };
  }

  // modèle de chaque son : [fonction, durée (s)]
  const MODELES = { diapason: [diapason, 2.8], flute: [flute, 2], violon: [violon, 2], clarinette: [clarinette, 2], orgue: [orgue, 2], guitare: [guitare, 2.8], neutre: [neutre, 2] };
  // préréglage reconnu : son complet ; sinon « jeu » (attaque, extinction) de spec.jeu, ou son neutre
  function choix(spec, a) {
    const k = instrumentDe(a);
    if (k) return { modele: k, complet: true };
    if (spec.jeu && INSTRUMENTS[spec.jeu]) return { modele: spec.jeu, complet: false };
    return { modele: 'neutre', complet: false };
  }
  const nombres = a => (a || []).map(x => Math.max(0, +x || 0));
  // calcule le son : spec = { f1, a, jeu } ; sr : fréquence d'échantillonnage (Hz)
  // → { out (échantillons, sommet à 1), duree, salle, humide, modele, complet } ou null (aucune raie)
  function rendre(spec, sr) {
    const a = nombres(spec.a), mx = Math.max(0, ...a);
    if (!(mx > 0) || !(spec.f1 > 0)) return null;
    const c = choix(spec, a), [modele, D] = MODELES[c.modele], v = voix(sr, D);
    const r = alea(graineDe(`${c.modele}|${c.complet}|${spec.f1}|${a.join(',')}`));
    const s = modele(v, spec.f1, a.map(x => x / mx), c.complet, r);
    // partiels inaudibles (moins de 0,2 % de la raie la plus haute) ignorés
    const { out, PH } = additive(sr, v.N, s.freq, s.partiels.filter(p => p.amp.some(x => x > 2e-3)));
    if (s.bruits) { const [d0, d1] = s.ref || [.3, 1.2]; s.bruits(out, PH, efficace(out, Math.floor(d0 * sr), Math.floor(d1 * sr))); }
    let p = 0;
    for (let i = 0; i < out.length; i++) p = Math.max(p, Math.abs(out[i]));
    if (p > 0) for (let i = 0; i < out.length; i++) out[i] /= p;
    return { out, duree: D, salle: s.salle, humide: s.humide, modele: c.modele, complet: c.complet };
  }
  const dureeSon = spec => MODELES[choix(spec, nombres(spec.a)).modele][1];

  /* ============================================================
     SON (Web Audio API) : démarré seulement par un geste de l'élève,
     fonctionne en file:// ; volume plafonné ; un seul son à la fois
     ============================================================ */
  const VOL_MAX = .3;
  let ctx = null, indispo = false, enCours = null;
  const memo = new Map();                                            // sons déjà calculés (30 au plus)
  function contexte() {
    if (indispo) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { indispo = true; return null; }
        ctx = new AC();
      }
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      return ctx;
    } catch (e) { indispo = true; return null; }
  }
  const disponible = () => !indispo && !!(window.AudioContext || window.webkitAudioContext);
  // réverbération (une par type de salle) : réponse calculée = bruit qui s'éteint, les aigus plus vite que les graves
  const SALLES = { salle: [1.3, .012], eglise: [3.6, .03] };       // durée de réverbération (s), retard de la première réflexion (s)
  const reverbs = {};
  function reverb(c, type) {
    if (reverbs[type] !== undefined) return reverbs[type];
    try {
      const [rt, pre] = SALLES[type], sr = c.sampleRate, L = Math.floor(sr * (rt + pre)), b = c.createBuffer(2, L, sr), r = alea(graineDe(type));
      for (let ch = 0; ch < 2; ch++) {
        const d = b.getChannelData(ch);
        let y = 0;
        for (let i = Math.floor(pre * sr); i < L; i++) {
          const t = i / sr - pre, k = Math.max(.06, .85 * Math.exp(-t / (.35 * rt)));
          y += k * (r() * 2 - 1 - y);                                 // passe-bas qui se referme peu à peu
          d[i] = y * Math.sqrt((2 - k) / k) * Math.exp(-6.9 * t / rt) * Math.min(1, t / .003);
        }
      }
      const cv = c.createConvolver();
      cv.buffer = b;
      cv.connect(c.destination);
      reverbs[type] = cv;
    } catch (e) { reverbs[type] = null; }
    return reverbs[type];
  }
  function arreter() {
    if (!enCours) return;
    try { const t = ctx.currentTime; enCours.g.gain.cancelScheduledValues(t); enCours.g.gain.setTargetAtTime(0, t, .015); enCours.src.stop(t + .12); } catch (e) { /* déjà arrêté */ }
    enCours = null;
  }
  // spec = { f1, a: [a1, a2…], jeu } ; volume de 0 à 1 ; renvoie true si le son est lancé
  function jouer(spec, volume) {
    const c = contexte();
    if (!c) return false;
    const a = (spec.a || []).map(v => +v || 0);
    if (!a.some(v => v > 0)) return true;                        // aucune raie : rien à jouer
    try {
      arreter();
      const cle = `${spec.jeu || ''}|${spec.f1}|${a.join(',')}`;
      let s = memo.get(cle);
      if (!s) {
        // calcul à 32 kHz au plus (harmoniques jusqu'à 8 kHz) : plus rapide ; le navigateur rééchantillonne
        const sr = Math.min(c.sampleRate, 32000), x = rendre({ f1: spec.f1, a, jeu: spec.jeu }, sr), buf = c.createBuffer(1, x.out.length, sr);
        buf.getChannelData(0).set(x.out);
        s = { buf, salle: x.salle, humide: x.humide };
        memo.set(cle, s);
        if (memo.size > 30) memo.delete(memo.keys().next().value);
      }
      // le volume suit l'amplitude du signal (4 V : plein volume), plafonné
      const e = F().extremes({ f1: spec.f1, a0: 0, a }), crete = Math.max(Math.abs(e.mn), Math.abs(e.mx));
      const v = VOL_MAX * Math.max(0, Math.min(1, volume == null ? .6 : volume)) * Math.min(1, crete / 4);
      const src = c.createBufferSource(), g = c.createGain();
      src.buffer = s.buf;
      g.gain.value = v;
      src.connect(g); g.connect(c.destination);
      // une part du son va dans la réverbération de la salle (qui continue un peu après la fin du son)
      const rv = reverb(c, s.salle);
      if (rv) { const w = c.createGain(); w.gain.value = s.humide; g.connect(w); w.connect(rv); }
      src.start(c.currentTime + .02);
      const moi = { src, g };
      enCours = moi;
      src.onended = () => { if (enCours === moi) enCours = null; };
      return true;
    } catch (err) { indispo = true; return false; }
  }
  const MSG_INDISPO = 'Le son n\'est pas disponible dans ce navigateur : le reste fonctionne normalement.';

  // bouton « ▶ Écouter » placé dans du HTML (énoncé, fiche) ; un clic joue le son décrit
  const bouton = (spec, libelle) => `<button type="button" class="btn-secondary son-ecouter" data-son='${JSON.stringify(Object.assign({ f1: spec.f1, a: spec.a }, spec.jeu ? { jeu: spec.jeu } : {}))}'>▶ ${libelle || 'Écouter'}</button>`;
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('.son-ecouter[data-son]');
    if (!b) return;
    let spec = null;
    try { spec = JSON.parse(b.dataset.son); } catch (err) { return; }
    const ok = jouer(spec, .6);
    const suite = b.nextElementSibling;
    if (!ok && !(suite && suite.classList.contains('son-msg'))) b.insertAdjacentHTML('afterend', `<span class="son-msg">${MSG_INDISPO}</span>`);
    b.classList.add('son-joue');
    setTimeout(() => b.classList.remove('son-joue'), dureeSon(spec) * 1000);
  });

  /* ============================================================
     SIMULATEUR MUSICAL
     ============================================================ */
  let nSimu = 0;
  function monter(zone, opts) {
    const o = Object.assign({ note: 'la3', libre: false, instrument: 'diapason', clavier: true, instruments: true, N: 8, tmax: 10, cases: ['harmoniques', 'mesure'] }, opts);
    const id = 'son-' + (++nSimu);
    const n0 = note(o.note) || note('la3');
    const etat = {
      note: o.libre ? null : n0.id, libre: !!o.libre, volume: .6, ecoutes: [],
    };
    const f1Initial = o.f1 || (o.libre ? 440 : n0.f);
    const aInitial = o.a || (INSTRUMENTS[o.instrument] || INSTRUMENTS.diapason).a;
    // jeu : dernier instrument reconnu (son attaque et son extinction restent quand on modifie les raies)
    etat.jeu = instrumentDe(aInitial);
    const ecouteurs = [];
    const racine = el('div', 'son-simu');
    racine.innerHTML = `
      <div class="son-barre">
        <button type="button" class="btn-primary son-jouer" data-a="jouer">▶ Écouter</button>
        <label class="son-vol"><span>Volume</span><input type="range" min="0" max="100" step="5" value="60" data-a="vol" aria-label="Volume du son"></label>
        <p class="son-aide" data-a="aide">Le son dure 2 à 3 s. Rien entendu ? Monte le volume de l'appareil et coupe le mode silencieux.</p>
      </div>
      ${o.clavier ? `<div class="son-bloc">
        <div class="son-entete"><span class="fo-petit-t">Note jouée : hauteur</span>
          <span class="son-mode" role="group" aria-label="Choix de la fréquence">
            <button type="button" class="son-pill" data-mode="clavier" aria-pressed="true">Clavier</button>
            <button type="button" class="son-pill" data-mode="libre" aria-pressed="false">Fréquence libre</button></span></div>
        <div class="son-clavier-defile" data-a="clav"><div class="son-clavier" role="group" aria-label="Clavier de do 3 à ré 5 : touche une note pour la jouer">
          ${NOTES.filter(n => !n.diese).map(n => `<button type="button" class="son-blanche" data-note="${n.id}" aria-pressed="false" aria-label="${n.texte}, ${n.f} hertz"><span class="son-n">${n.nom}</span><span class="son-f">${n.f}</span></button>`).join('')}
          ${NOTES.map((n, k) => (n.diese ? `<button type="button" class="son-noire" data-note="${n.id}" aria-pressed="false" aria-label="${n.texte}, ${n.f} hertz" style="left:calc(${NOTES.slice(0, k).filter(x => !x.diese).length} * var(--son-touche) - var(--son-noire) / 2)"></button>` : '')).join('')}
        </div></div>
        <label class="fo-reglage son-libre" data-a="libre" hidden><span class="fo-reglage-nom">Fréquence du fondamental f<sub>1</sub> = <b data-a="vf1"></b></span>
          <input type="range" min="100" max="1500" step="5" data-a="f1" aria-label="Fréquence du fondamental f1, en hertz"></label>
      </div>` : ''}
      ${o.instruments ? `<div class="son-bloc">
        <div class="son-entete"><span class="fo-petit-t">Instrument : timbre</span><span class="son-note-simpl">spectres simplifiés</span></div>
        <div class="son-instr" role="group" aria-label="Instruments">${Object.keys(INSTRUMENTS).map(k => `<button type="button" class="son-pill son-pill-g" data-instr="${k}" aria-pressed="false">${INSTRUMENTS[k].label}</button>`).join('')}</div>
        <p class="son-instr-desc" data-a="idesc"></p>
      </div>` : ''}
      <div data-a="fourier"></div>`;
    zone.appendChild(racine);
    const $ = a => racine.querySelector(`[data-a="${a}"]`);
    const fo = F().monter($('fourier'), {
      N: o.N, f1: f1Initial, a0: 0, a: aInitial, amax: o.amax || 2, nom: 'u', unite: 'V', titreY: 'u(t) (en V) : signal du micro',
      predefinis: false, reglages: false, sansA0: true, cases: o.cases, tmax: o.tmax, fmax: o.fmax, mesure: o.mesure,
      aria: o.aria,
    });
    // bandeau au-dessus du spectre : hauteur (note), son pur ou complexe, timbre
    const bande = el('div', 'son-bande');
    bande.setAttribute('aria-live', 'polite');
    const blocSpectre = fo.el.querySelector('.fo-g-spectre').parentElement;
    blocSpectre.insertBefore(bande, blocSpectre.firstChild);

    const instr = () => instrumentDe(fo.etat().a);
    function copie() {
      const e = fo.etat();
      return { f1: e.f1, a: e.a.slice(), note: etat.note, libre: etat.libre, instrument: instr(), nature: nature(e.a),
        ecoutes: etat.ecoutes.map(x => Object.assign({}, x)), mesure: e.mesure, t1: e.t1, t2: e.t2, fmax: e.fmax, harmoniques: e.harmoniques };
    }
    function maj() {
      const e = fo.etat(), n = etat.note ? note(etat.note) : null, nat = nature(e.a), k = instr();
      if (k) etat.jeu = k;
      const lib = { pur: 'son pur', complexe: 'son complexe', muet: 'aucun son' }[nat];
      bande.innerHTML = `<span class="son-b-h"><span class="son-b-t">Hauteur (note)</span> <b>${n ? n.nom : 'fréquence libre'}</b> · f<sub>1</sub> = <b>${fmt(e.f1)} Hz</b></span>
        <span class="son-b-nat${nat === 'pur' ? ' pur' : ''}">${lib}</span>
        <span class="son-b-h"><span class="son-b-t">Timbre</span> <b>${k ? INSTRUMENTS[k].label.toLowerCase() : 'réglage personnel'}</b></span>
        ${e.a[0] === 0 && nat !== 'muet' ? '<span class="son-b-att">a<sub>1</sub> = 0 : la raie la plus basse n\'est plus à f<sub>1</sub>, la note entendue change.</span>' : ''}`;
      racine.querySelectorAll('[data-note]').forEach(b => b.setAttribute('aria-pressed', String(!etat.libre && b.dataset.note === etat.note)));
      racine.querySelectorAll('[data-instr]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.instr === k)));
      racine.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'libre') === etat.libre)));
      const cl = $('clav'), li = $('libre');
      if (cl) {
        cl.hidden = etat.libre;
        // la touche jouée reste visible dans le clavier qui défile (petit écran), sans faire défiler la page
        const t = cl.querySelector('[aria-pressed="true"]');
        if (t && cl.scrollWidth > cl.clientWidth + 1 && t.dataset.note !== cl.dataset.vue) {
          cl.dataset.vue = t.dataset.note;
          const g = t.offsetLeft, d = g + t.offsetWidth;
          if (g < cl.scrollLeft || d > cl.scrollLeft + cl.clientWidth) cl.scrollLeft = Math.max(0, g - (cl.clientWidth - t.offsetWidth) / 2);
        }
      }
      if (li) { li.hidden = !etat.libre; $('f1').value = e.f1; $('vf1').textContent = `${fmt(e.f1)} Hz`; }
      const d = $('idesc');
      if (d) d.innerHTML = k ? `${INSTRUMENTS[k].label} : ${INSTRUMENTS[k].desc}. Tu peux ensuite modifier les raies et écouter.` : 'Réglage personnel : les raies ne correspondent à aucun préréglage.';
    }
    const signaler = () => { const e = copie(); ecouteurs.forEach(f => f(e)); };
    fo.surChange(() => { maj(); signaler(); });

    function lancer() {
      const e = fo.etat(), spec = { f1: e.f1, a: e.a, jeu: etat.jeu }, ok = jouer(spec, etat.volume);
      etat.ecoutes.push({ note: etat.libre ? null : etat.note, f1: e.f1, instrument: instr(), a: e.a.slice() });
      const aide = $('aide');
      if (!ok) { aide.textContent = MSG_INDISPO; aide.classList.add('son-msg'); }
      const b = $('jouer');
      b.classList.add('son-joue');
      clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove('son-joue'), dureeSon(spec) * 1000);
      signaler();
    }
    function regler(r, silencieux) {
      r = Object.assign({}, r);
      if (r.libre != null) etat.libre = !!r.libre;
      if (r.note) { const n = note(r.note); if (n) { etat.note = n.id; etat.libre = false; r.f1 = n.f; } }
      else if (r.f1 != null && !etat.libre) { const n = NOTES.find(x => x.f === r.f1); if (n) etat.note = n.id; else { etat.libre = true; etat.note = null; } }
      if (r.libre && r.f1 == null) etat.note = null;
      if (r.instrument && INSTRUMENTS[r.instrument]) r.a = INSTRUMENTS[r.instrument].a;
      delete r.note; delete r.libre; delete r.instrument;
      fo.regler(r, true);
      maj();
      if (!silencieux) signaler();
    }
    // clavier : une touche choisit la note et la joue
    racine.querySelectorAll('[data-note]').forEach(b => {
      b.onclick = () => { regler({ note: b.dataset.note }, true); lancer(); };
    });
    racine.querySelectorAll('[data-mode]').forEach(b => {
      b.onclick = () => {
        const libre = b.dataset.mode === 'libre';
        if (libre === etat.libre) return;
        if (libre) regler({ libre: true });
        else regler({ note: noteDe(fo.etat().f1).id });
      };
    });
    const sF = $('f1');
    if (sF) sF.addEventListener('input', () => { etat.libre = true; etat.note = null; fo.regler({ f1: +sF.value }, true); maj(); signaler(); });
    racine.querySelectorAll('[data-instr]').forEach(b => {
      b.onclick = () => { regler({ instrument: b.dataset.instr }, true); lancer(); };
    });
    $('jouer').onclick = lancer;
    $('vol').addEventListener('input', () => { etat.volume = +$('vol').value / 100; });
    if (o.libre && o.f1) etat.note = null;
    if (!o.libre && o.f1 && !NOTES.find(x => x.f === o.f1)) { etat.libre = true; etat.note = null; }
    maj();
    racine.id = id;
    return { el: racine, fourier: fo, etat: copie, regler, surChange(f) { ecouteurs.push(f); }, jouer: lancer };
  }

  /* ============================================================
     ANIMATION DE L'AIR : rangée de points d'air entre un haut-parleur
     et une oreille ; chaque point oscille autour de sa position
     (x = x₀ + A sin(ωt − kx₀)) ; les zones de compression (C) et de
     dilatation (D) avancent vers l'oreille. Ralenti : une période en
     1,6 s. Un point mis en valeur et sa position de repos (pointillés).
     ============================================================ */
  const reduit = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function air(zone, opts) {
    const o = Object.assign({ suivi: true }, opts);
    const W = 600, H = 200, xa = 92, xb = 520, pas = 9, lam = 150, A = 10, T = 1.6, rangs = 6;
    const k = 2 * Math.PI / lam, w = 2 * Math.PI / T;
    const racine = el('div', 'son-air');
    const cols = [];
    for (let x = xa; x <= xb; x += pas) cols.push(x);
    const iSuivi = Math.round(cols.length * .42);
    const pts = [];
    let s = '';
    // haut-parleur (membrane mobile) et oreille
    s += '<path class="son-hp" d="M14,78 h26 l26,-30 v104 l-26,-30 h-26 z"/><line class="son-membrane" data-a="mb" x1="70" y1="52" x2="70" y2="148"/>';
    s += '<path class="son-oreille" d="M560,62 c22,0 30,18 30,36 c0,16 -10,22 -16,30 c-6,8 -4,18 -14,20 c-10,2 -16,-6 -16,-12 M562,84 c8,0 12,6 12,12 c0,6 -6,8 -8,12"/>';
    s += '<g data-a="zc"></g><g data-a="pts">';
    for (let r = 0; r < rangs; r++) {
      cols.forEach((x, i) => {
        const suivi = o.suivi && i === iSuivi && r === 2;
        s += `<circle class="${suivi ? 'son-pt-suivi' : 'son-pt'}" cx="${x}" cy="${52 + r * 19}" r="${suivi ? 5.5 : 3.2}"/>`;
      });
    }
    s += '</g>';
    if (o.suivi) s += `<line class="son-repos" x1="${cols[iSuivi]}" y1="38" x2="${cols[iSuivi]}" y2="160"/>`;
    s += '<g data-a="cd"></g>';
    s += `<text class="son-txt" x="40" y="186" text-anchor="middle">haut-parleur</text><text class="son-txt" x="566" y="186" text-anchor="middle">oreille</text>`;
    s += `<line class="son-sens" x1="250" y1="176" x2="360" y2="176"/><path class="son-sens-p" d="M368,176 l-9,-4.5 v9 z"/><text class="son-txt" x="305" y="194" text-anchor="middle">sens de propagation</text>`;
    racine.innerHTML = `<svg class="son-air-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Points d'air entre un haut-parleur et une oreille : chaque point oscille autour de sa position, les zones de compression et de dilatation avancent vers l'oreille">${s}</svg>
      <div class="son-air-l">
        <button type="button" class="btn-secondary" data-a="anim"${reduit() ? ' hidden' : ''}>⏸ Pause</button>
        <button type="button" class="btn-secondary" data-a="pas">Pas à pas ▸</button>
        <span class="son-air-leg"><span class="son-air-c">C</span> compression · <span class="son-air-c">D</span> dilatation${o.suivi ? ' · <span class="son-air-p"></span> un point d\'air suivi' : ''}</span>
      </div>`;
    zone.appendChild(racine);
    racine.querySelectorAll('[data-a="pts"] circle').forEach(c => pts.push({ c, x0: +c.getAttribute('cx') }));
    const mb = racine.querySelector('[data-a="mb"]'), cd = racine.querySelector('[data-a="cd"]'), zc = racine.querySelector('[data-a="zc"]');
    let t = T * .3, enMarche = !reduit(), raf = null, avant = null, visible = true;
    const depl = (x0, tt) => A * Math.sin(w * tt - k * x0);
    function dessiner() {
      pts.forEach(p => p.c.setAttribute('cx', (p.x0 + depl(p.x0, t)).toFixed(2)));
      mb.setAttribute('x1', 70 + depl(70, t) * .8); mb.setAttribute('x2', 70 + depl(70, t) * .8);
      // densité ∝ 1 − dx/dx₀ = 1 + Ak cos(ωt − kx₀) : compressions où ωt − kx₀ = 2πm
      // (les points voisins y sont le plus rapprochés) ; dilatations à mi-chemin
      let h = '', z = '';
      for (let m = -3; m <= 6; m++) {
        const xc = (w * t - 2 * Math.PI * m) / k, xd = xc - lam / 2;
        if (xc >= xa + 4 && xc <= xb - 4) { z += `<rect class="son-zone-c" x="${xc - 14}" y="40" width="28" height="118" rx="8"/>`; h += `<text class="son-cd" x="${xc}" y="32" text-anchor="middle">C</text>`; }
        if (xd >= xa + 4 && xd <= xb - 4) h += `<text class="son-cd son-cd-d" x="${xd}" y="32" text-anchor="middle">D</text>`;
      }
      cd.innerHTML = h; zc.innerHTML = z;                     // zones sous les points, lettres au-dessus
    }
    function boucle(ts) {
      if (avant != null) t += Math.min(.05, (ts - avant) / 1000);
      avant = ts;
      dessiner();
      raf = enMarche && visible ? requestAnimationFrame(boucle) : null;
      if (!raf) avant = null;
    }
    const demarrer = () => { if (!raf && enMarche && visible) raf = requestAnimationFrame(boucle); };
    const bA = racine.querySelector('[data-a="anim"]'), bP = racine.querySelector('[data-a="pas"]');
    bA.onclick = () => {
      enMarche = !enMarche;
      bA.textContent = enMarche ? '⏸ Pause' : '▶ Animer';
      if (enMarche) demarrer(); else if (raf) { cancelAnimationFrame(raf); raf = null; avant = null; }
    };
    // pas à pas : un huitième de période, animation arrêtée
    function avancer() {
      if (enMarche && !reduit()) { enMarche = false; bA.textContent = '▶ Animer'; if (raf) { cancelAnimationFrame(raf); raf = null; avant = null; } }
      t += T / 8; dessiner();
    }
    bP.onclick = avancer;
    // animation suspendue quand la figure n'est pas à l'écran
    if (window.IntersectionObserver) new IntersectionObserver(l => { visible = l.some(x => x.isIntersecting); demarrer(); }).observe(racine);
    dessiner();
    demarrer();
    return { el: racine, temps: () => t, avancer };
  }

  window.SON = { NOTES, note, noteDe, INSTRUMENTS, instrumentDe, nature, jouer, rendre, disponible, bouton, monter, air, MSG_INDISPO };
})();
