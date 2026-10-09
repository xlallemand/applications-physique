/* ============================================================
   Moteur de cours commun : cours par étapes « notion → exemple → À toi »
   (même présentation et même fonctionnement que les cours des
   applications « Cinématique » et « pH », voir docs/charte-applications.md §4 et §6)

   À charger après assets/sommaire.js (le cours terminé est noté avec SOM.marquer),
   avec assets/cours.css et equilibrer-reactions/modules/er.css.

   Utilisation :
     const cours = new COURS.Cours(zone, [etape1, etape2, …], { cle });
       cle (facultatif) : clé de la page dans le PLAN (application en une seule page)
     Chaque étape reçoit le cours et renvoie sa carte :
       function etape1(c) {
         const carte = c.carte('1. Titre de la notion');
         c.ajouter(carte, `<div class="cours-bloc">… <div class="cle">règle</div></div>
                           ${COURS.exemple('exemple traité')}`);
         c.aToi(carte, [ { titre, enonce, parties: [p, …] }, … ]);   // « Continuer → » quand c'est réussi
         return carte;
       }
     Une étape sans « À toi » appelle c.continuer(carte) elle-même.
     La dernière étape (« À retenir ») marque le cours comme fait dans le sommaire.

   Parties de question (p.type) :
     'choix'   p.options [{ id, label }], p.bonne, p.indices { id: diagnostic }, p.indice, p.colonne, p.melanger
     'nombre'  p.label, p.valeur, p.tol (écart absolu) ou p.rel (relatif, 0,5 % par défaut), p.unite,
               p.entier, p.signe (false : pas de bouton ±), p.diag(v) → diagnostic, p.indice, p.dec / p.affiche
     'champs'  plusieurs nombres validés ensemble : p.champs [{ label, valeur, tol, rel, unite, entier, signe }],
               p.ligne (true : sur une seule ligne), p.diag(valeurs) → diagnostic
     'sci'     écriture a × 10ⁿ : p.label, p.valeur, p.unite, p.rel (3 % par défaut), p.cs, p.diag(v)
     'texte'   p.label, p.reponses ['CO2', …] (comparaison sans espaces ni casse, sauf p.casse),
               p.diag(texte) → diagnostic, p.affiche, p.largeur (px)
     'perso'   outil propre à l'application : p.monter(zone, api) → { montrer() }
               api.reussi() · api.erreur(diagnostic) · api.compterErreur() · api.effacer() · api.message(h)
     Toutes : p.q (question), p.solution (HTML affiché après la réponse,
              par ex. « ✍ Complète ton cours : … »),
              p.aide (true : « Afficher la réponse » proposé tout de suite, pour un outil
              où aucune erreur n'est validée, comme une réaction réglée en direct).
   ============================================================ */
(function () {
  'use strict';

  /* ============================================================
     NOMBRES
     ============================================================ */
  const MOINS = '−';
  // nombre écrit à la française : 2,3 ; −0,30 ; 1 000
  function fmt(v, dec) {
    if (dec == null) {
      const r = Math.round(v * 1e9) / 1e9;
      let s = String(+r.toPrecision(6));
      if (/e/.test(s)) return sci(v, 3);
      const neg = s[0] === '-';
      if (neg) s = s.slice(1);
      let [e, d] = s.split('.');
      e = e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return (neg ? MOINS : '') + (d ? e + ',' + d : e);
    }
    const s = (Math.abs(v) < Math.pow(10, -dec) / 2 ? 0 : v).toFixed(dec);
    return s.replace('-', MOINS).replace('.', ',');
  }
  // mantisse et exposant avec cs chiffres significatifs
  function decomposer(v, cs) {
    if (v === 0) return { m: 0, e: 0 };
    let e = Math.floor(Math.log10(Math.abs(v)) + 1e-12);
    let m = +(v / Math.pow(10, e)).toFixed(cs - 1);
    if (Math.abs(m) >= 10) { m /= 10; e++; }
    return { m, e };
  }
  // écriture scientifique : 6,3 × 10⁻⁶ (HTML)
  function sci(v, cs) {
    const d = decomposer(v, cs || 2);
    return `${fmt(d.m, (cs || 2) - 1)} × 10<sup>${String(d.e).replace('-', MOINS)}</sup>`;
  }
  // lecture d'une saisie : « 2,3 », « −0,5 », « 1 000 », « 2.5e-3 »
  function lire(s) {
    const t = String(s == null ? '' : s).trim().replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/g, '-');
    return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t) ? parseFloat(t) : NaN;
  }
  const proche = (a, b, rel) => Math.abs(a - b) <= (rel == null ? .005 : rel) * Math.abs(b) + 1e-12;

  /* ============================================================
     OUTILS
     ============================================================ */
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function secouer(e) { if (!e) return; e.classList.remove('er-secoue'); void e.offsetWidth; e.classList.add('er-secoue'); }
  function melanger(t) {
    const a = t.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const hasard = t => t[Math.floor(Math.random() * t.length)];
  const entre = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  // blocs de cours tout faits
  const exemple = (html, titre) => `<div class="cours-exemple"><p class="cours-exemple-t">${titre || 'Exemple'}</p>${html}</div>`;
  const cle = html => `<div class="cle">${html}</div>`;

  // Champ de saisie d'un nombre, avec un bouton ± (le pavé numérique
  // des smartphones n'a pas toujours de touche « − »)
  function champ(opts) {
    opts = opts || {};
    const d = el('span', 'crs-champ-box' + (opts.petit ? ' petit' : ''));
    d.innerHTML = `${opts.signe === false ? '' : '<button type="button" class="crs-pm" aria-label="Changer le signe" title="Changer le signe">±</button>'}
      <input type="text" class="crs-champ" inputmode="${opts.entier ? 'numeric' : 'decimal'}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${opts.aria || 'Réponse'}">`;
    const input = d.querySelector('input'), pm = d.querySelector('.crs-pm');
    if (pm) {
      pm.addEventListener('click', () => {
        if (input.disabled) return;
        const v = input.value.trim();
        input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : MOINS + v;
        input.dispatchEvent(new Event('input'));
        // pas de focus sur smartphone : le clavier masquerait la question
        if (matchMedia('(hover: hover)').matches) input.focus();
      });
    }
    return { el: d, input, desactiver(b) { input.disabled = b; if (pm) pm.disabled = b; } };
  }

  // Bouton « Valider » d'une partie (disparaît une fois la partie terminée)
  function boutonValider(zone) {
    const a = el('div', 'er-actions crs-actions-partie', '<button type="button" class="btn-primary">Valider</button>');
    zone.appendChild(a);
    const b = a.querySelector('button');
    b.fermer = () => { b.disabled = true; a.remove(); };
    return b;
  }
  // Entrée = Valider
  function surEntree(input, f) { input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); f(); } }); }

  /* ============================================================
     PARTIES DE QUESTION
     Chaque partie reçoit (zone, p, api) et renvoie { montrer() }.
     ============================================================ */

  // Choix parmi des boutons
  function pChoix(zone, p, api) {
    const box = el('div', 'crs-choix' + (p.colonne ? ' crs-choix-col' : ''));
    zone.appendChild(box);
    const opts = p.melanger === false ? p.options : melanger(p.options);
    const bs = opts.map(o => {
      const b = el('button', 'btn-secondary', o.label);
      b.type = 'button';
      box.appendChild(b);
      b.onclick = () => {
        if (api.fini() || b.disabled) return;
        if (o.id === p.bonne) {
          b.classList.add('juste');
          bs.forEach(x => { x.b.disabled = true; });
          api.reussi();
        } else {
          b.classList.add('faux'); b.disabled = true;
          api.erreur((p.indices && p.indices[o.id]) || p.indice || '');
        }
      };
      return { b, o };
    });
    return { montrer() { bs.forEach(({ b, o }) => { b.disabled = true; if (o.id === p.bonne) b.classList.add('juste'); }); } };
  }

  // Réponse affichée dans le champ (« Afficher la réponse ») : arrondie comme la réponse attendue
  function affichage(p) {
    if (p.affiche) return p.affiche;
    if (p.dec != null) return fmt(p.valeur, p.dec);
    if (p.tol != null && p.tol >= 1e-4) return fmt(p.valeur, Math.max(0, Math.ceil(-Math.log10(2 * p.tol) - 1e-9)));
    return fmt(p.valeur);
  }
  const juste = (p, v) => (p.tol != null ? Math.abs(v - p.valeur) <= p.tol + 1e-12 : proche(v, p.valeur, p.rel));

  // Une valeur numérique
  function pNombre(zone, p, api) {
    const d = el('div', 'crs-valeur');
    if (p.label) d.appendChild(el('span', 'crs-lab', p.label));
    const ch = champ({ entier: p.entier, signe: p.signe, aria: p.aria });
    d.appendChild(ch.el);
    if (p.unite) d.appendChild(el('span', 'crs-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    ch.input.addEventListener('input', () => api.effacer());
    surEntree(ch.input, valider);
    function valider() {
      if (api.fini()) return;
      const v = lire(ch.input.value);
      if (isNaN(v)) { secouer(d); api.message('Écris un nombre (avec une virgule si besoin).'); return; }
      if (juste(p, v)) { ch.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { ch.input.value = affichage(p); ch.desactiver(true); bVal.fermer(); } };
  }

  // Plusieurs valeurs numériques validées ensemble (cases fausses en rouge)
  function pChamps(zone, p, api) {
    const g = el('div', 'crs-champs' + (p.ligne ? ' ligne' : ''));
    zone.appendChild(g);
    const cases = p.champs.map((c, k) => {
      const d = el('div', 'crs-valeur');
      if (c.label) d.appendChild(el('span', 'crs-lab', c.label));
      const ch = champ({ entier: c.entier, signe: c.signe, petit: p.ligne, aria: c.aria || ('Case ' + (k + 1)) });
      d.appendChild(ch.el);
      if (c.unite) d.appendChild(el('span', 'crs-unite', c.unite));
      g.appendChild(d);
      ch.input.addEventListener('input', () => { d.classList.remove('ok', 'ko'); api.effacer(); });
      surEntree(ch.input, valider);
      return { c, d, ch };
    });
    const bVal = boutonValider(zone);
    function valider() {
      if (api.fini()) return;
      const vs = cases.map(x => lire(x.ch.input.value));
      if (vs.some(isNaN)) { secouer(g); api.message('Complète toutes les cases (avec un nombre).'); return; }
      const ok = cases.map((x, k) => juste(x.c, vs[k]));
      cases.forEach((x, k) => { x.d.classList.toggle('ok', ok[k]); x.d.classList.toggle('ko', !ok[k]); });
      if (ok.every(Boolean)) { cases.forEach(x => x.ch.desactiver(true)); bVal.fermer(); api.reussi(); return; }
      const nb = ok.filter(o => !o).length;
      api.erreur(`${nb > 1 ? 'Les cases en rouge sont fausses.' : 'La case en rouge est fausse.'} ${(p.diag && p.diag(vs)) || p.indice || ''}`);
      secouer(g);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        cases.forEach(x => { x.ch.input.value = affichage(x.c); x.ch.desactiver(true); x.d.classList.remove('ko'); x.d.classList.add('ok'); });
        bVal.fermer();
      },
    };
  }

  // Écriture scientifique a × 10ⁿ
  function pSci(zone, p, api) {
    const d = el('div', 'crs-valeur');
    if (p.label) d.appendChild(el('span', 'crs-lab', p.label));
    const s = el('span', 'crs-sci');
    const a = champ({ aria: 'Nombre devant la puissance de 10', petit: true });
    const n = champ({ aria: 'Exposant de la puissance de 10', entier: true, petit: true });
    n.el.classList.add('crs-exposant');
    s.appendChild(a.el); s.appendChild(el('span', 'crs-x10', '× 10')); s.appendChild(n.el);
    d.appendChild(s);
    if (p.unite) d.appendChild(el('span', 'crs-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    [a.input, n.input].forEach(i => { i.addEventListener('input', () => api.effacer()); surEntree(i, valider); });
    function valider() {
      if (api.fini()) return;
      const va = lire(a.input.value), vn = lire(n.input.value);
      if (isNaN(va)) { secouer(d); api.message('Écris le nombre devant la puissance de 10.'); return; }
      if (isNaN(vn) || !Number.isInteger(vn)) { secouer(d); api.message('Écris l\'exposant de la puissance de 10 (un nombre entier, avec le bouton ± s\'il est négatif).'); return; }
      const v = va * Math.pow(10, vn);
      if (proche(v, p.valeur, p.rel == null ? .03 : p.rel)) { a.desactiver(true); n.desactiver(true); bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v, va, vn)) || p.indice || 'Vérifie ton calcul.');
      secouer(d);
    }
    bVal.onclick = valider;
    return {
      montrer() {
        const x = decomposer(p.valeur, p.cs || 2);
        a.input.value = fmt(x.m, (p.cs || 2) - 1); n.input.value = String(x.e).replace('-', MOINS);
        a.desactiver(true); n.desactiver(true); bVal.fermer();
      },
    };
  }

  // Réponse écrite (formule chimique, mot, expression courte)
  const normaliser = (s, casse) => {
    const t = String(s || '').replace(/[\s  ]/g, '').replace(/[−–]/g, '-').replace(/[×*]/g, 'x').replace(',', '.');
    return casse ? t : t.toLowerCase();
  };
  function pTexte(zone, p, api) {
    const d = el('div', 'crs-valeur');
    if (p.label) d.appendChild(el('span', 'crs-lab', p.label));
    const input = el('input', 'crs-champ crs-texte');
    input.type = 'text';
    input.setAttribute('autocomplete', 'off'); input.setAttribute('autocapitalize', 'off'); input.setAttribute('spellcheck', 'false');
    input.setAttribute('aria-label', p.aria || 'Réponse');
    if (p.largeur) input.style.width = p.largeur + 'px';
    d.appendChild(input);
    if (p.unite) d.appendChild(el('span', 'crs-unite', p.unite));
    zone.appendChild(d);
    const bVal = boutonValider(zone);
    input.addEventListener('input', () => api.effacer());
    surEntree(input, valider);
    function valider() {
      if (api.fini()) return;
      const v = input.value.trim();
      if (!v) { secouer(d); api.message('Écris ta réponse.'); return; }
      if (p.reponses.some(r => normaliser(r, p.casse) === normaliser(v, p.casse))) { input.disabled = true; bVal.fermer(); api.reussi(); return; }
      api.erreur((p.diag && p.diag(v)) || p.indice || 'Relis la règle.');
      secouer(d);
    }
    bVal.onclick = valider;
    return { montrer() { input.value = p.affiche || p.reponses[0]; input.disabled = true; bVal.fermer(); } };
  }

  // Outil propre à l'application (glisser-déposer, simulation, équation à équilibrer…)
  function pPerso(zone, p, api) {
    const ctx = p.monter(zone, api) || {};
    return { montrer() { if (ctx.montrer) ctx.montrer(); } };
  }

  const PARTIES = { choix: pChoix, nombre: pNombre, champs: pChamps, sci: pSci, texte: pTexte, perso: pPerso };

  /* ============================================================
     UNE QUESTION : parties successives
     q = { enonce, parties: [p] } ; « Afficher la réponse » proposé après une erreur
     (ou tout de suite quand tout le cours est affiché). cb.fin() quand tout est fait.
     ============================================================ */
  // « Afficher tout le cours » : les questions et les « À toi » en cours s'inscrivent ici ;
  // quand l'élève demande tout le cours, chacun se déplie (COURS.tout reste vrai ensuite)
  const vivants = new Set();
  function question(zone, q, cb) {
    const etat = { erreurs: 0, vue: false, fini: false };
    const n = q.parties.length, aides = [];
    let rendues = 0, finies = 0, deplie = false;
    if (q.enonce) zone.appendChild(el('div', 'crs-enonce', q.enonce));
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        aides.forEach(a => a.classList.remove('crs-cache'));
        while (rendues < n) partie();
      },
    };
    function partie() {
      const p = q.parties[rendues++];
      window.COURS.partieEnCours = p;          // partie en cours (utile pour vérifier l'application)
      const d = el('div', 'crs-partie', `${p.q ? `<p class="crs-partie-q">${p.q}</p>` : ''}<div class="crs-partie-zone"></div><div class="crs-partie-retour"></div>
        <div class="crs-partie-aide${deplie || p.aide ? '' : ' crs-cache'}"><button type="button" class="btn-small">Afficher la réponse</button></div>`);
      zone.appendChild(d);
      const ret = d.querySelector('.crs-partie-retour'), aide = d.querySelector('.crs-partie-aide');
      aides.push(aide);
      let finie = false;
      const api = {
        fini: () => finie || etat.fini,
        effacer() { if (!finie) ret.innerHTML = ''; },
        message(h) { if (!finie) ret.innerHTML = `<p class="crs-msg">${h}</p>`; },
        compterErreur() { etat.erreurs++; aide.classList.remove('crs-cache'); },
        erreur(h) {
          api.compterErreur();
          ret.innerHTML = `<div class="callout-danger er-retour"><p><b class="er-ko">Ce n'est pas ça.</b> ${h || ''}</p></div>`;
        },
        reussi() { terminer(false); },
      };
      window.COURS.apiEnCours = api;           // (idem)
      const ctx = PARTIES[p.type](d.querySelector('.crs-partie-zone'), p, api);
      aide.querySelector('button').onclick = () => { if (finie) return; ctx.montrer(); etat.vue = true; terminer(true); };
      function terminer(vue) {
        finie = true;
        aide.remove();
        const titre = vue ? 'Réponse' : (etat.erreurs ? 'C\'est juste.' : 'Juste !');
        ret.innerHTML = p.solution || vue
          ? `<div class="${vue ? 'callout' : 'callout-success'} er-retour crs-solution"><p><b class="${vue ? '' : 'er-ok'}">${titre}</b></p>${p.solution ? `<div>${p.solution}</div>` : ''}</div>`
          : '<p class="crs-ok">✓ Juste</p>';
        finies++;
        if (finies < n) {
          // partie suivante (déjà affichée si tout le cours est déplié)
          if (!deplie && rendues < n) {
            partie();
            const s = zone.lastElementChild;
            setTimeout(() => s.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
          }
        } else {
          etat.fini = true;
          vivants.delete(inst);
          if (cb && cb.fin) cb.fin(etat);
        }
      }
    }
    vivants.add(inst);
    partie();
    if (window.COURS.tout) inst.deplier();
  }

  /* ============================================================
     « À TOI » : une suite de petites questions du même type que
     l'exemple, sans points ; onFini() quand toutes sont réussies
     (ou leur réponse affichée).   items = [{ titre, enonce, parties }]
     ============================================================ */
  let coursActif = null;
  function aToi(zone, items, onFini) {
    const box = el('div', 'crs-atoi');
    box.innerHTML = '<div class="crs-atoi-tete"><p class="crs-atoi-t">À toi</p></div>';
    zone.appendChild(box);
    let i = 0, deplie = false, termine = false;
    // « Afficher tout le cours » : toutes les questions restantes, puis la suite du cours
    const inst = {
      deplier() {
        if (deplie) return;
        deplie = true;
        while (i < items.length) rendre(i++);
        finir();
      },
    };
    function finir() {
      if (termine) return;
      termine = true;
      vivants.delete(inst);
      if (onFini) onFini();
    }
    function rendre(k) {
      const it = items[k];
      const d = el('div', 'crs-atoi-q', `${it.titre ? `<p class="crs-atoi-titre">${it.titre}</p>` : ''}<div></div>`);
      box.appendChild(d);
      question(d.lastElementChild, it, { fin() { if (!deplie) suivant(); } });
      if (k > 0 && !deplie) setTimeout(() => d.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    }
    function suivant() {
      if (i >= items.length) { finir(); return; }
      rendre(i++);
    }
    vivants.add(inst);
    // le bouton « Afficher tout le cours » se place dans le premier « À toi » du cours
    if (coursActif && !coursActif.bouton && coursActif.zone.contains(box)) coursActif.boutonTout(box);
    suivant();
    if (window.COURS.tout) inst.deplier();
    return box;
  }

  /* ============================================================
     COURS PAR ÉTAPES
     ============================================================ */
  function Cours(zone, etapes, opts) {
    this.zone = zone; this.etapes = etapes; this.opts = opts || {};
    this.n = 0; this.attente = null; this.bouton = null;
    // nouveau cours (une seule page : on change de cours sans recharger)
    vivants.clear();
    window.COURS.tout = false;
    coursActif = this;
    vivants.add(this);
    this.lancer(0);
  }
  Cours.prototype.carte = function (titre) {
    const c = el('section', 'er-card er-etape');
    c.innerHTML = `<h3 class="cours-titre">${titre}</h3>`;
    this.zone.appendChild(c);
    return c;
  };
  Cours.prototype.ajouter = function (parent, html) {
    const d = el('div', null, html);
    parent.appendChild(d);
    return d;
  };
  // « À toi » de l'étape, puis « Continuer → » quand il est réussi
  Cours.prototype.aToi = function (parent, items, texte) {
    return aToi(parent, items, () => this.continuer(parent, texte));
  };
  Cours.prototype.lancer = function (n) {
    this.n = n;
    const c = this.etapes[n](this);
    // dernière étape atteinte : cours terminé (sommaire, accueil)
    if (n === this.etapes.length - 1) {
      this.toutEstAffiche();
      vivants.delete(this);
      if (window.SOM) window.SOM.marquer({ fait: true }, this.opts.cle);
    }
    return c;
  };
  // bouton « Continuer » : affiche l'étape suivante et la fait défiler à l'écran
  // (quand tout le cours est affiché, l'étape suivante apparaît directement)
  Cours.prototype.continuer = function (parent, texte) {
    if (this.n + 1 >= this.etapes.length || coursActif !== this) return;
    if (window.COURS.tout) { this.lancer(this.n + 1); return; }
    const d = this.ajouter(parent, `<div class="er-suite"><button type="button" class="btn-primary">${texte || 'Continuer →'}</button></div>`);
    this.attente = d;
    d.querySelector('button').onclick = () => this.suivante(true);
  };
  Cours.prototype.suivante = function (defiler) {
    const d = this.attente;
    if (!d) return;
    this.attente = null;
    d.remove();
    if (defiler) {
      // évite qu'un double appui sur « Continuer » réponde à l'étape suivante
      this.zone.style.pointerEvents = 'none';
      setTimeout(() => { this.zone.style.pointerEvents = ''; }, 400);
    }
    const c = this.lancer(this.n + 1);
    if (c && defiler) setTimeout(() => c.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  Cours.prototype.deplier = function () { this.suivante(false); };

  // bouton « Afficher tout le cours », dans l'en-tête du premier « À toi »
  Cours.prototype.boutonTout = function (box) {
    const b = el('button', 'btn-small crs-tout', 'Afficher tout le cours');
    b.type = 'button';
    b.title = 'Affiche toutes les parties du cours sans avoir à répondre aux questions (tu peux toujours y répondre)';
    box.querySelector('.crs-atoi-tete').appendChild(b);
    this.bouton = b;
    if (this.n === this.etapes.length - 1) this.toutEstAffiche();
    b.onclick = () => this.toutAfficher();
  };
  Cours.prototype.toutAfficher = function () {
    const b = this.bouton;
    if (!b || b.disabled) return;
    // la position de la page ne bouge pas : on garde le bouton au même endroit à l'écran
    const avant = b.getBoundingClientRect().top;
    window.COURS.tout = true;
    // les étapes ajoutées pendant le dépliage s'inscrivent à leur tour : on recommence jusqu'au bout
    let garde = 0;
    while (vivants.size && garde++ < 500) Array.from(vivants).forEach(x => x.deplier());
    this.toutEstAffiche();
    window.scrollBy(0, b.getBoundingClientRect().top - avant);
  };
  Cours.prototype.toutEstAffiche = function () {
    if (!this.bouton) return;
    this.bouton.disabled = true;
    this.bouton.textContent = 'Tout le cours est affiché';
  };

  window.COURS = {
    tout: false,
    fmt, sci, lire, proche, el, secouer, melanger, hasard, entre, exemple, cle, champ,
    PARTIES, question, aToi, Cours,
  };
})();
