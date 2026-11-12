/* ============================================================
   Orthographe — dictées (objet ORT.dictee)
   ------------------------------------------------------------
   Rôle :
     - composer un texte : phrases de la banque et gabarits d'un même
       thème, choisis pour les règles travaillées ; pièges retenus ;
     - « Dictée courte » (un seul module) : texte à corriger (fautes à
       repérer ou déjà repérées ; choix multiples, saisie ou fin du mot)
       ou dictée audio ; relecture en 4 passages, vérification immédiate,
       note sur le nombre de fautes à trouver ;
     - « Dictée brevet » : environ 600 signes, déroulé officiel, chrono
       de 20 min, note avec le barème du brevet.
   Dépend de : ort.js (ORT), langue.js (ORT.L), banque.js, textes-brevet.js.

   API :
     ORT.dictee.composer(regles, { cible, min, max }) → { toks, cibles, theme }
     ORT.dictee.courte(zone)     page « Dictée courte »
     ORT.dictee.brevet(zone)     page « Dictée brevet »
   ============================================================ */
(function () {
  'use strict';
  const ORT = window.ORT, L = ORT.L, B = window.ORTHO_BANQUE, D = window.ORTHO_DONNEES;
  const { el, bouton, esc, virg, pluriel, versVue, R, NOMC } = ORT;
  const S = ORT.reglages();
  const PASS = {
    p1: ['Accords', 'Pour chaque nom, vérifie de tête que le déterminant et les adjectifs ont le même genre et le même nombre. Pense aux participes employés avec être ou seuls.'],
    p2: ['Conjugaison', 'Pour chaque verbe conjugué, trouve de tête son sujet (« qui est-ce qui ? ») et vérifie la terminaison. Pour chaque mot en [é], fais le test de « vendre ».'],
    p3: ['Mots particuliers', 'À chaque a, à, et, est, son, sont, on, ont, ou, où, ce, se, ces, ses, la, là, leur, mais, mes… fais de tête le test de remplacement.'],
    p4: ['À l’envers', 'Lis du dernier mot au premier : sans le sens de la phrase, tu vois l’orthographe de chaque mot.']
  };
  const estPassage = e => /^p\d$/.test(e);
  const nbMots = toks => toks.filter(t => t.m).length;

  /* =====================================================================
     Composition d'un texte
     ===================================================================== */
  const PAS = 30;                    // décalage des numéros de verbes d'une phrase à l'autre
  // phrases candidates d'un thème : la banque et trois variantes de chaque gabarit
  // (src : origine de la phrase ; une même phrase ou un même gabarit ne sert qu'une fois par texte)
  function candidats(th) {
    const l = (B.phrases[th] || []).map((m, k) => ({ m, src: 'p' + k }));
    B.gabarits.forEach((g, k) => { if (g.th === th) for (let i = 0; i < 3; i++) l.push({ m: L.instancier(g), src: 'g' + k }); });
    return l.map(x => Object.assign(x, { toks: L.lirePhrase(x.m) }));
  }
  // regles : règles travaillées ; lg : { cible (pièges), min, max (mots) }
  function composer(regles, lg) {
    const set = new Set(regles);
    const pert = toks => toks.filter(t => t.piege && set.has(t.piege.r));
    // thème : au hasard parmi ceux qui offrent assez de pièges sur ces règles
    let best = null;
    for (const th of L.melanger(B.themes.map(t => t.id))) {
      // score du thème : nombre de pièges, en comptant au plus quelques pièges par règle (variété)
      const c = candidats(th), par = {};
      c.forEach(x => pert(x.toks).forEach(t => { par[t.piege.r] = (par[t.piege.r] || 0) + 1; }));
      const n = Object.keys(par).reduce((a, r) => a + Math.min(par[r], Math.ceil(lg.cible / Math.max(1, set.size)) + 1), 0);
      if (!best || n > best.n) best = { th, c, n };
      if (n >= Math.min(lg.cible * 2, set.size * 3)) break;
    }
    // tirage : d'abord les phrases qui apportent une règle pas encore couverte
    const couvert = {}, choisis = [];
    let pool = L.melanger(best.c), mots = 0, nb = 0;
    const score = x => pert(x.toks).reduce((a, t) => a + (couvert[t.piege.r] ? 1 : 3), 0);
    while (pool.length) {
      pool.sort((a, b) => score(b) - score(a));
      const i = pool.findIndex(x => mots + nbMots(x.toks) <= lg.max);
      if (i < 0) break;
      const x = pool.splice(i, 1)[0];
      if (!score(x) && (mots >= lg.min || nb < lg.cible && pool.some(y => score(y)))) continue;
      pool = pool.filter(y => y.src !== x.src);
      choisis.push(x);
      mots += nbMots(x.toks); nb += pert(x.toks).length;
      pert(x.toks).forEach(t => { couvert[t.piege.r] = true; });
      if (nb >= lg.cible && mots >= lg.min) break;
    }
    const toks = [];
    choisis.forEach((x, k) => L.lirePhrase(x.m, k * PAS).forEach(t => toks.push(t)));
    // pièges retenus : variété des règles (une de chaque règle tour à tour)
    const parRegle = {};
    toks.forEach((t, i) => { if (t.piege && set.has(t.piege.r)) (parRegle[t.piege.r] = parRegle[t.piege.r] || []).push(i); });
    Object.keys(parRegle).forEach(r => { parRegle[r] = L.melanger(parRegle[r]); });
    const cibles = [], vus = new Set();
    // un piège de la règle r, si possible sur un mot pas encore retenu
    const prendre = r => {
      const l = parRegle[r];
      let k = l.findIndex(i => !vus.has(L.min(toks[i].v)));
      if (k < 0) k = 0;
      const i = l.splice(k, 1)[0];
      vus.add(L.min(toks[i].v));
      return i;
    };
    let reste = L.melanger(Object.keys(parRegle));
    while (cibles.length < lg.cible && reste.length) {
      reste = reste.filter(r => parRegle[r].length);
      reste.forEach(r => { if (cibles.length < lg.cible && parRegle[r].length) cibles.push(prendre(r)); });
    }
    // repli : aucune des règles demandées dans ce texte → d'autres pièges du texte
    if (!cibles.length) L.melanger(toks.map((t, i) => (t.piege ? i : -1)).filter(i => i >= 0)).slice(0, lg.cible).forEach(i => cibles.push(i));
    cibles.sort((a, b) => a - b);
    return { toks, cibles, theme: best.th };
  }

  /* =====================================================================
     Outils communs aux deux dictées
     ===================================================================== */
  const NOMS_PONCT = { ',': 'virgule', '.': 'point', ';': 'point-virgule', ':': 'deux-points', '!': 'point d’exclamation', '?': 'point d’interrogation',
    '…': 'points de suspension', '«': 'ouvrez les guillemets', '»': 'fermez les guillemets', '(': 'ouvrez la parenthèse', ')': 'fermez la parenthèse',
    '–': 'tiret', '—': 'tiret', '-': 'tiret' };
  // groupes de mots à dicter : coupure à chaque ponctuation, ou après 5 mots
  function decouperGroupes(toks) {
    const G = [];
    let cur = [], mots = 0, phrase = 0;
    const fermer = fin => { if (cur.length) G.push({ i: cur, phrase, fin }); cur = []; mots = 0; if (fin) phrase++; };
    toks.forEach((t, i) => {
      if (!t.m && (t.v === '»' || t.v === ')') && !cur.length && G.length) { G[G.length - 1].i.push(i); return; }
      cur.push(i);
      if (t.m) mots++;
      if (!t.m && /^[.!?…]$/.test(t.v)) fermer(true);
      else if (!t.m && /^[,;:]$/.test(t.v)) fermer(false);
      else if (t.m && mots >= 5) {
        let restants = 0;
        for (let j = i + 1; j < toks.length && (toks[j].m || !/^[.!?…,;:]$/.test(toks[j].v)); j++) if (toks[j].m) restants++;
        if (restants > 2) fermer(false);
      }
    });
    fermer(true);
    return G;
  }
  // texte dicté d'un groupe : la ponctuation est dite (« virgule », « point »)
  function texteDicte(indices, toks) {
    let s = '';
    indices.forEach(i => {
      const t = toks[i];
      if (t.m) s += (s && !/’$/.test(s) ? ' ' : '') + t.v;
      else s += (s ? ', ' : '') + (NOMS_PONCT[t.v] || '') + ',';
    });
    return s;
  }
  // texte lu normalement, phrase par phrase (lecture d'ensemble, relecture)
  function phrasesLues(toks, G) {
    const P = [];
    G.forEach(g => { (P[g.phrase] = P[g.phrase] || []).push(...g.i); });
    return P.filter(Boolean).map(ix => ({ t: L.joindre(ix.map(i => toks[i])), pause: 350 }));
  }
  // sujet du verbe k : mots marqués #k (le pronom élidé d'un « c’est » est dans le même mot)
  function texteSujet(toks, k) {
    const l = toks.filter(t => t.sujet && t.sujet.indexOf(k) >= 0);
    const ante = toks.filter(t => t.ante && t.ante.indexOf(k) >= 0).map(t => t.v).join(' ');
    let s = l.map(t => (t.verbe === k && /’/.test(t.v) ? t.v.split('’')[0] + '’' : t.v)).join(' ');
    if (ante && /^qui$/i.test(s)) s += ', mis pour « ' + ante + ' »';
    return s;
  }
  // personne grammaticale d'un sujet (diagnostic)
  function personne(toks, k) {
    const l = toks.filter(t => t.sujet && t.sujet.indexOf(k) >= 0).map(t => L.min(t.v));
    const ante = toks.filter(t => t.ante && t.ante.indexOf(k) >= 0).map(t => L.min(t.v));
    const w = l.length === 1 && l[0] === 'qui' && ante.length ? ante : l;
    const s = ' ' + w.join(' ') + ' ';
    if (/ (je|j’|moi) /.test(s) && / et /.test(s)) return 'c’est comme « nous » : 1re personne du pluriel';
    if (/ (je|j’) /.test(s)) return '1re personne du singulier';
    if (/ tu /.test(s)) return '2e personne du singulier';
    if (/ nous /.test(s)) return '1re personne du pluriel';
    if (/ vous /.test(s)) return '2e personne du pluriel';
    if (/ (ils|elles|les|des|ces|mes|tes|ses|nos|vos|leurs|plusieurs|quelques) /.test(s) || / et /.test(s)) return '3e personne du pluriel : -ent';
    return '3e personne du singulier';
  }
  // diagnostic d'une erreur sur un mot piège (vérification immédiate)
  function diagnostic(toks, i) {
    const t = toks[i], r = t.piege.r, f = R[r].famille;
    if ((f === 'SV' || r === 'CJ1' || r === 'CJ2' || r === 'CJ6' || r === 'CJ3' || r === 'CJ4' || r === 'CJ5') && t.verbe != null) {
      const suj = texteSujet(toks, t.verbe);
      if (suj) {
        let d = 'Qui est-ce qui « ' + esc(t.v) + ' » ? C’est <b>' + esc(suj) + '</b> : ' + personne(toks, t.verbe) + '.';
        if (r === 'SV4') d += ' Le pronom placé devant le verbe n’est pas le sujet.';
        if (f === 'CJ') d += ' ' + esc(R[r].astuce);
        return d;
      }
    }
    if (r === 'PP1' && t.verbe != null) {
      const suj = texteSujet(toks, t.verbe);
      if (suj) return 'Avec être, le participe s’accorde avec le sujet : <b>' + esc(suj) + '</b>.';
    }
    if (r === 'PP3') return 'Avec avoir, le participe passé ne s’accorde pas avec le sujet. ' + esc(R[r].astuce);
    if (r === 'GN1' || r === 'GN2' || r === 'GN5') {
      // déterminant le plus proche avant le mot
      for (let j = i - 1; j >= Math.max(0, i - 4); j--) {
        const w = L.min(toks[j].v);
        if (/^(les|des|ces|mes|tes|ses|nos|vos|leurs|plusieurs|quelques|aux)$/.test(w)) return 'Regarde le déterminant « ' + esc(toks[j].v) + ' » : le groupe nominal est au pluriel. ' + esc(R[r].astuce);
        if (/^(le|la|l’|un|une|ce|cet|cette|mon|ma|ton|ta|son|sa|leur|du|au)$/.test(w)) return 'Regarde le déterminant « ' + esc(toks[j].v) + ' » : le groupe nominal est au singulier. ' + esc(R[r].astuce);
      }
    }
    return esc(R[r].astuce);
  }
  // occasions et erreurs d'une copie comparée au texte (dictée audio, brevet)
  function analyserCopie(toks, copie, cibles) {
    const c = L.comparer(toks, copie);
    const motRate = new Set(c.erreurs.filter(e => e.iRef >= 0 && !e.ponct).map(e => e.iRef));
    return { c, motRate, cibles: new Set(cibles) };
  }
  // pastilles « taux de réussite par type d'erreur »
  function pastillesFamilles(fam) {
    const z = el('div', 'ort-fam-r');
    D.familles.forEach(f => {
      const o = fam[f.id];
      if (!o) return;
      const cls = o.ok >= o.n ? 'tout' : o.ok > 0 ? 'part' : 'rien';
      z.appendChild(el('span', 'ort-fr-' + cls, esc(NOMC[f.id]) + ' ' + virg(o.ok) + '/' + o.n + (cls === 'tout' ? ' ✓' : '')));
    });
    return z;
  }
  // une erreur de la liste du résultat, avec son rappel de règle
  function ligneErreur(e) {
    const d = el('div', 'ort-err');
    const r = e.r && R[e.r] ? R[e.r] : null;
    const txt = e.signale ? '« ' + esc(e.attendu) + ' » était juste' : '<s>' + esc(e.ecrit) + '</s> → <span class="ort-att">' + esc(e.attendu) + '</span>';
    d.innerHTML = '<span>' + txt + ' <span class="ort-petit">' + (r ? '· ' + esc(r.titre) : '') + (e.tag ? ' · ' + esc(e.tag) : '') + '</span></span>';
    if (r) {
      const z = el('div');
      const b = bouton('ort-icone', '📖 Règle', () => {
        const ouvert = !z.firstChild;
        z.innerHTML = '';
        if (ouvert) z.appendChild(ORT.blocRegle(e.r));
        b.setAttribute('aria-pressed', ouvert);
      }, 'Rappel de la règle : ' + r.titre);
      b.setAttribute('aria-pressed', 'false');
      d.appendChild(b); d.appendChild(z);
    }
    return d;
  }
  // texte corrigé, mots fautifs mis en valeur
  function texteCorrige(toks, ratees, titre) {
    const p = el('p', 'ort-texte ort-corrige');
    p.setAttribute('aria-label', titre || 'Texte corrigé');
    toks.forEach((t, i) => {
      p.appendChild(document.createTextNode(L.espaceAvant(i ? toks[i - 1].v : null, t.v)));
      if (ratees.has(i)) { const s = el('span', 'ort-mot ort-rate', esc(t.v)); s.title = 'Erreur sur ce mot'; p.appendChild(s); }
      else p.appendChild(document.createTextNode(t.v));
    });
    return p;
  }
  // tests de remplacement (passage 3)
  function tableTests() {
    const m = D.methodes.find(x => x.id === 'M2');
    return '<table class="ort-tests"><caption class="ort-sr">Tests de remplacement</caption>' + m.liste.map(l => '<tr><th scope="row">' + esc(l[0]) + '</th><td>remplace par « ' + esc(l[1]) + ' »</td></tr>').join('') + '</table>';
  }
  // mot de la copie sous le curseur (marque « mot douteux », passage à l'envers)
  function motAuCurseur(ta) {
    const v = ta.value, p = ta.selectionStart == null ? v.length : ta.selectionStart;
    let a = p, b = p;
    while (a > 0 && /[^\s]/.test(v[a - 1])) a--;
    while (b < v.length && /[^\s]/.test(v[b])) b++;
    let w = v.slice(a, b).replace(/^[«(]+|[.,;:!?…»)]+$/g, '');
    if (!w) { const m = v.trim().split(/\s+/); w = (m[m.length - 1] || '').replace(/[.,;:!?…»)]+$/g, ''); }
    return w;
  }
  function selectionnerMot(ta, n) {
    // n-ième mot de la copie : on le sélectionne dans le champ
    const re = /\S+/g;
    let m, k = 0;
    while ((m = re.exec(ta.value))) { if (k++ === n) { ta.focus(); ta.setSelectionRange(m.index, m.index + m[0].length); return; } }
  }
  const champCopie = (valeur, label) => {
    const ta = el('textarea', 'ort-copie');
    ta.value = valeur;
    ta.spellcheck = false;
    ['autocapitalize', 'autocorrect', 'autocomplete'].forEach(a => ta.setAttribute(a, 'off'));
    ta.setAttribute('aria-label', label || 'Ta copie');
    return ta;
  };
  const motsCopie = v => (v.trim() ? v.trim().split(/\s+/) : []);
  // mots de la copie (jetons) reliés aux jetons du texte : { k (jeton de la copie) → i (jeton du texte) }
  function lienCopie(toks, copie) {
    const c = L.comparer(toks, copie), lien = {};
    c.paires.forEach(([i, j]) => { if (i >= 0 && j >= 0) lien[j] = i; });
    return { cop: c.copie, lien };
  }

  /* =====================================================================
     Aide « verbe → sujet » (passage 2) : un clic sur le verbe, puis sur son sujet
     ===================================================================== */
  function clicAide(a, toks, i, mot) {
    const t = i >= 0 ? toks[i] : null;
    if (a.verbe == null || a.trouve) {
      a.trouve = false;
      if (t && t.verbe != null && toks.some(x => x.sujet && x.sujet.indexOf(t.verbe) >= 0)) {
        a.verbe = t.verbe; a.motV = mot;
        a.msg = '« ' + esc(mot) + ' » : qui est-ce qui ' + esc(mot) + ' ? Touche son sujet.';
      } else if (t && t.verbe != null) {
        a.verbe = null;
        a.msg = '« ' + esc(mot) + ' » est à l’impératif : il n’a pas de sujet exprimé. Touche un autre verbe.';
      } else { a.verbe = null; a.msg = '« ' + esc(mot) + ' » n’est pas un verbe conjugué. Touche un verbe conjugué.'; }
    } else if (t && t.sujet && t.sujet.indexOf(a.verbe) >= 0) {
      a.trouve = true;
      a.msg = '<b>Oui :</b> le sujet de « ' + esc(a.motV) + ' » est <b>' + esc(texteSujet(toks, a.verbe)) + '</b> (' + personne(toks, a.verbe) + '). Vérifie maintenant sa terminaison.';
    } else if (t && t.ante && t.ante.indexOf(a.verbe) >= 0) {
      a.trouve = true;
      a.msg = '<b>Oui :</b> le sujet est « qui », mis pour <b>' + esc(toks.filter(x => x.ante && x.ante.indexOf(a.verbe) >= 0).map(x => x.v).join(' ')) + '</b> : le verbe s’accorde avec ce mot.';
    } else a.msg = '<b>Non :</b> demande-toi qui est-ce qui « ' + esc(a.motV) + ' ».';
  }
  const classesAide = (a, t) => (a && a.verbe != null && t.verbe === a.verbe ? ' ort-verbe' : '') +
    (a && a.trouve && ((t.sujet && t.sujet.indexOf(a.verbe) >= 0) || (t.ante && t.ante.indexOf(a.verbe) >= 0)) ? ' ort-sujet' : '');

  // barre d'étapes (Relecture 1 · 2 · 3 · 4 regroupées)
  function barreEtapes(et, k, noms, aller, fini) {
    const z = el('div', 'ort-etapes');
    z.setAttribute('role', 'list');
    let gr = null;
    et.forEach((e, j) => {
      const etat = j === k ? ' on' : j < k ? ' fait' : '';
      const libre = !fini && e !== 'res' && j !== k;
      if (estPassage(e)) {
        if (!gr) { gr = el('div', 'ort-et-gr', '<span>' + esc(noms.groupe || 'Relecture') + '</span>'); gr.setAttribute('role', 'listitem'); z.appendChild(gr); }
        if (j === k) gr.classList.add('on');
        const n = bouton('ort-et-n' + etat, e.slice(1), libre ? () => aller(j) : null, 'Passage ' + e.slice(1) + ' : ' + PASS[e][0]);
        n.title = PASS[e][0];
        if (j === k) n.setAttribute('aria-current', 'step');
        if (!libre && j !== k) n.disabled = true;
        gr.appendChild(n);
      } else {
        const b = bouton('ort-et' + etat, esc(noms[e] || e), libre ? () => aller(j) : null);
        b.setAttribute('role', 'listitem');
        if (j === k) b.setAttribute('aria-current', 'step');
        if (!libre && j !== k) b.disabled = true;
        z.appendChild(b);
      }
    });
    return z;
  }
  // consigne d'un passage de relecture, avec ses aides (verbe → sujet, tests de remplacement)
  function consignePassage(z, e, suite, etat, refaire) {
    z.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Passage ' + e.slice(1) + ' · ' + PASS[e][0] + '.</b> ' + PASS[e][1] + ' ' + suite));
    if (e === 'p2' || e === 'p3') {
      const r = el('div', 'ort-rangee');
      if (e === 'p2') {
        const a = bouton('ort-icone', '🧭 Aide : verbe → sujet', () => {
          etat.aide = etat.aide ? null : { verbe: null, trouve: false, msg: 'Touche un verbe conjugué.' };
          refaire();
        });
        a.setAttribute('aria-pressed', !!etat.aide);
        r.appendChild(a);
      } else {
        const t = bouton('ort-icone', '🔁 Tests de remplacement', () => { etat.tests = !etat.tests; refaire(); });
        t.setAttribute('aria-pressed', !!etat.tests);
        r.appendChild(t);
      }
      z.appendChild(r);
      if (e === 'p3' && etat.tests) z.appendChild(el('div', 'ort-neutre', tableTests()));
    }
  }

  /* =====================================================================
     Lecteur : groupes dictés l'un après l'autre (dictée audio et brevet)
     ===================================================================== */
  function Lecteur(toks, opts) {
    const G = decouperGroupes(toks);
    const etat = { g: -1, lus: {}, joue: false, fini: false };
    let maj = () => {};
    const pauseApres = g => Math.round((1500 + 480 * g.i.filter(i => toks[i].m).length) * 0.85 / S.vitesse);
    // lit les groupes à partir de g, chacun « lectures » fois, puis passe au suivant
    function jouer(g) {
      if (g >= G.length) { etat.joue = false; etat.fini = true; maj(); if (opts.finDictee) opts.finDictee(); return; }
      etat.g = g; etat.joue = true; maj();
      const txt = texteDicte(G[g].i, toks), pause = pauseApres(G[g]), l = [];
      for (let k = 0; k < S.lectures; k++) l.push({ t: txt, pause });
      const ok = ORT.voix.dire(l, {
        vitesse: S.vitesse,
        debut: () => { etat.lus[g] = (etat.lus[g] || 0) + 1; maj(); },
        fin: complet => { if (complet) jouer(g + 1); }
      });
      if (!ok) { etat.joue = false; maj(); if (opts.sansVoix) opts.sansVoix(); }
    }
    function pause() { ORT.voix.arreter(); etat.joue = false; maj(); }
    function phrase(continuer) {
      const g = Math.max(0, etat.g), P = G.filter(x => x.phrase === G[g].phrase);
      const ix = [].concat(...P.map(x => x.i));
      const reprendre = continuer && etat.joue;
      ORT.voix.dire([{ t: texteDicte(ix, toks), pause: 600 }], { vitesse: S.vitesse, fin: complet => { if (complet && reprendre) jouer(g + 1); } });
    }
    function ensemble(fin) { etat.joue = false; maj(); return ORT.voix.dire(phrasesLues(toks, G), { vitesse: S.vitesse, fin }); }
    return { G, etat, jouer, pause, phrase, ensemble, surMaj: fn => { maj = fn; } };
  }
  // boutons du lecteur ; renvoie l'élément (mis à jour sans tout redessiner)
  function vueLecteur(lec, opts) {
    const c = el('div', 'ort-lecteur-c');
    const barre = el('div', 'ort-groupes');
    barre.setAttribute('aria-hidden', 'true');
    lec.G.forEach((g, i) => { const x = el('i'); x.addEventListener('click', () => lec.jouer(i)); barre.appendChild(x); });
    const l = el('div', 'ort-lecteur');
    const prec = bouton('ort-rond sec', '⏮', () => lec.jouer(Math.max(0, lec.etat.g - 1)), 'Groupe précédent');
    const lire = bouton('ort-rond', '▶', () => { if (lec.etat.joue) lec.pause(); else lec.jouer(lec.etat.fini ? 0 : Math.max(0, lec.etat.g)); }, 'Lire ou mettre en pause');
    const rep = bouton('ort-rond sec', '↻', () => lec.jouer(Math.max(0, lec.etat.g)), 'Relire le groupe');
    const suiv = bouton('ort-rond sec', '⏭', () => lec.jouer(Math.min(lec.G.length - 1, lec.etat.g + 1)), 'Groupe suivant');
    const info = el('span', 'ort-petit ort-info');
    info.setAttribute('aria-live', 'polite');
    [prec, lire, rep, suiv, info].forEach(x => l.appendChild(x));
    if (!opts || !opts.simple) { c.appendChild(barre); }
    c.appendChild(l);
    const maj = () => {
      barre.querySelectorAll('i').forEach((x, i) => { x.className = i === lec.etat.g ? 'on' : lec.etat.lus[i] ? 'fait' : ''; });
      lire.textContent = lec.etat.joue ? '⏸' : '▶';
      lire.setAttribute('aria-label', lec.etat.joue ? 'Mettre en pause' : 'Lire');
      info.textContent = lec.etat.fini && !lec.etat.joue ? 'Dictée terminée : relis ta copie.' :
        lec.etat.g >= 0 ? 'Groupe ' + (lec.etat.g + 1) + '/' + lec.G.length + ' · lu ' + (lec.etat.lus[lec.etat.g] || 0) + ' fois' + (lec.etat.joue ? '' : ' · en pause') : 'Appuie sur ▶ pour commencer';
      if (opts && opts.maj) opts.maj();
    };
    lec.surMaj(maj);
    maj();
    return c;
  }
  const messageSansVoix = () => el('div', 'callout ort-msg', 'La synthèse vocale n’est pas disponible dans ce navigateur : la dictée audio ne peut pas être lue. Essaie avec un autre navigateur (Chrome, Edge, Safari, Firefox) ou choisis « Texte à corriger » dans les Réglages.');

  /* =====================================================================
     DICTÉE COURTE
     ===================================================================== */
  function courte(zone) {
    let DC = null, lecteur = null;
    // « Dictée courte sur ces règles » (Mon suivi) : dictee_courte.html#regles=GN1,SV2
    let ciblage = null;
    const m0 = /regles=([A-Z0-9,]+)/.exec(location.hash);
    if (m0) { ciblage = m0[1].split(',').filter(id => R[id]); if (!ciblage.length) ciblage = null; }
    const mode = () => (S.type === 'audio' ? 'audio' : S.corr === 'fin' ? 'fin' : S.rep === 'reperees' ? 'reperees' : 'arep');
    const NOMS = { ecrire: '', corriger: 'Corrige les fautes', res: 'Résultat' };
    function etapes(m) {
      const p = ['p1', 'p2', 'p3', 'p4'];
      if (m === 'audio' || m === 'fin') return ['ecrire'].concat(p, ['res']);
      if (m === 'reperees') return ['corriger', 'res'];
      return p.concat(['res']);
    }

    function nouvelle() {
      ORT.voix.arreter();
      const m = mode();
      const regles = ciblage || (S.auto ? ORT.choixAuto() : ORT.notionsChoisies());
      if (!regles.length) { DC = { vide: true }; return; }
      const lg = S.longueur === 'c' ? { cible: 8, min: 45, max: 80 } : { cible: 5, min: 22, max: 42 };
      const c = composer(regles, lg);
      DC = { m, regles, toks: c.toks, cibles: c.cibles, et: etapes(m), k: 0,
        faute: {}, choix: {}, signales: {}, fausses: [], points: {}, essais: {}, mauvais: {}, affiche: {}, regle: {},
        msg: null, aide: null, tests: false, fins: {}, copie: '', envers: null, res: null };
      if (m === 'arep' || m === 'reperees') {
        c.cibles.forEach(i => {
          const t = c.toks[i], f = t.piege.fautes;
          DC.faute[i] = Math.random() < 0.7 ? f[0] : L.tirer(f);      // la faute la plus plausible le plus souvent
          DC.choix[i] = L.melanger([t.v, DC.faute[i]].concat(f.filter(x => x !== DC.faute[i]).slice(0, 1)));
        });
      }
      lecteur = m === 'audio' ? Lecteur(DC.toks, {}) : null;
    }
    const etape = () => DC.et[DC.k];
    const estCible = i => DC.cibles.indexOf(i) >= 0;
    const corrige = i => DC.points[i] != null || DC.affiche[i];

    /* ---------- en-tête : résumé des réglages ---------- */
    function entete() {
      const h = document.getElementById('entete');
      if (!h) return;
      let z = h.querySelector('.ort-tags');
      if (!z) { z = el('div', 'ort-tags'); h.appendChild(z); }
      const tags = ORT.resumeReglages();
      if (ciblage) tags[0] = 'Notions : ' + pluriel(ciblage.length, 'règle') + ' du suivi';
      z.innerHTML = tags.map(t => '<span class="ort-tag">' + esc(t) + '</span>').join('');
      z.appendChild(bouton('btn-small', '⚙ Réglages', ORT.ouvrirReglages));
      let n = h.querySelector('.ort-notions');
      if (!n) { n = el('p', 'ort-petit ort-notions'); h.appendChild(n); }
      n.innerHTML = DC && !DC.vide ? 'Règles travaillées : ' + DC.regles.map(id => esc(R[id].titre)).join(' · ') : '';
      const ctx = h.querySelector('.er-contexte');
      if (ctx && DC && !DC.vide) ctx.innerHTML = 'Un texte de <b>' + pluriel(nbMots(DC.toks), 'mot') + '</b> sur tes notions. ' +
        (DC.m === 'reperees' ? 'Corrige les fautes repérées' : DC.m === 'fin' ? 'Écris la fin des mots, relis en <b>4 passages</b>' : DC.m === 'audio' ? 'Écoute, écris, relis en <b>4 passages</b>' : 'Relis-le en <b>4 passages</b>, corrige') + ', puis obtiens ta <b>note</b>.';
    }

    /* ---------- rendu ---------- */
    function rendre(apres) {
      const y = window.scrollY;
      zone.innerHTML = '';
      if (DC.vide) {
        const c = el('div', 'er-card');
        c.appendChild(el('p', '', 'Aucune notion n’est cochée. Ouvre les <b>Réglages</b> et choisis ce que tu travailles.'));
        const a = el('div', 'er-actions'); a.appendChild(bouton('btn-primary', '⚙ Réglages', ORT.ouvrirReglages)); c.appendChild(a);
        zone.appendChild(c);
        return;
      }
      const c0 = el('div', 'er-card ort-etapes-c');
      c0.id = 'etapes';
      NOMS.ecrire = DC.m === 'audio' ? 'Écoute et écris' : 'Complète les mots';
      c0.appendChild(barreEtapes(DC.et, DC.k, NOMS, j => allerEtape(j), !!DC.res));
      zone.appendChild(c0);
      const e = etape();
      if (e === 'res') resultat();
      else if (DC.m === 'audio') vueAudio(e);
      else vueTexte(e);
      window.scrollTo(0, y);
      if (apres) { const n = apres(); if (n) versVue(n); }
    }
    function allerEtape(j) {
      DC.k = j; DC.aide = null; DC.msg = null; DC.envers = null;
      if (etape() !== 'ecrire' && lecteur) lecteur.pause();
      rendre(() => document.getElementById('etapes'));
      const c = document.getElementById('etapes');
      if (c) versVue(c, 'start');
    }
    // boutons « ← Passage précédent » et « Passage suivant → » / « Terminer et voir ma note → »
    function navBas(z) {
      const n = el('div', 'ort-nav-bas');
      if (DC.k > 0) {
        const p = DC.et[DC.k - 1];
        n.appendChild(bouton('btn-secondary', '← ' + (estPassage(p) ? 'Passage ' + p.slice(1) : esc(NOMS[p])), () => allerEtape(DC.k - 1)));
      } else n.appendChild(el('span'));
      const s = DC.et[DC.k + 1];
      const lib = s === 'res' ? 'Terminer et voir ma note →' : estPassage(s) ? 'Passage ' + s.slice(1) + ' : ' + PASS[s][0] + ' →' : esc(NOMS[s]) + ' →';
      const b = bouton('btn-primary', lib, () => allerEtape(DC.k + 1));
      b.id = 'suite';
      n.appendChild(b);
      z.appendChild(n);
    }

    /* ---------- texte à corriger / fin du mot ---------- */
    function valeurMot(i) {
      const t = DC.toks[i];
      if (DC.m === 'fin' || !estCible(i)) return t.v;
      return corrige(i) ? t.v : DC.faute[i];
    }
    function classeMot(i) {
      const t = DC.toks[i];
      let c = 'ort-mot' + classesAide(DC.aide, t);
      if (DC.fausses.indexOf(i) >= 0) c += ' ort-faux-signal';
      if (estCible(i) && (DC.signales[i] || DC.m === 'reperees')) c += corrige(i) ? ' ort-juste' : ' ort-signale';
      return c;
    }
    // un mot touché dans le texte (ou dans la liste à l'envers)
    function toucher(i) {
      const t = DC.toks[i];
      if (DC.aide) { clicAide(DC.aide, DC.toks, i, valeurMot(i)); rendre(); return; }
      if (DC.m === 'fin') return;                          // fin du mot : rien à signaler
      const e = etape();
      if (DC.m === 'reperees' || !estPassage(e)) {
        if (estCible(i)) rendre(() => document.getElementById('it-' + i));
        return;
      }
      if (!estCible(i)) {
        if (DC.fausses.indexOf(i) < 0) DC.fausses.push(i);
        DC.msg = '« ' + esc(t.v) + ' » est juste : ce n’est pas une faute (−0,5 point).';
        rendre(() => document.getElementById('msg-texte'));
        return;
      }
      DC.signales[i] = true; DC.msg = null;
      rendre(() => document.getElementById('it-' + i));
    }
    function texte(z, lectureSeule) {
      const p = el('p', 'ort-texte' + (DC.m !== 'fin' || DC.aide ? ' ort-cliquable' : ''));
      DC.toks.forEach((t, i) => {
        p.appendChild(document.createTextNode(L.espaceAvant(i ? DC.toks[i - 1].v : null, t.v)));
        if (!t.m) { p.appendChild(document.createTextNode(t.v)); return; }
        if (DC.m === 'fin' && estCible(i)) {
          if (lectureSeule || DC.aide) {
            const s = el('span', 'ort-mot ort-a-completer' + classesAide(DC.aide, t), esc(t.piege.deb) + '<u>' + esc(DC.fins[i] || '…') + '</u>');
            s.addEventListener('click', () => toucher(i));
            p.appendChild(s);
            return;
          }
          const w = el('span', 'ort-fin');
          const inp = el('input');
          inp.id = 'fin-' + i;
          inp.value = DC.fins[i] || '';
          inp.autocomplete = 'off'; inp.spellcheck = false;
          ['autocapitalize', 'autocorrect'].forEach(a => inp.setAttribute(a, 'off'));
          inp.setAttribute('aria-label', 'Fin du mot ' + (t.piege.deb ? t.piege.deb + '…' : 'à écrire en entier'));
          inp.addEventListener('input', () => {
            DC.fins[i] = inp.value.trim();
            const c = document.getElementById('compte-fin');
            if (c) c.textContent = nbFins() + '/' + DC.cibles.length;
          });
          inp.addEventListener('keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            const k = DC.cibles.indexOf(i), s = DC.cibles[k + 1];
            const n = s != null ? document.getElementById('fin-' + s) : document.getElementById('suite');
            if (n) n.focus();
          });
          if (t.piege.deb) w.appendChild(el('span', '', esc(t.piege.deb)));
          w.appendChild(inp);
          // petit haut-parleur : fait entendre le mot à écrire
          const hp = bouton('ort-hp', '🔊', () => ORT.voix.dire(t.v, { vitesse: S.vitesse }), 'Écouter le mot');
          hp.title = 'Écouter le mot';
          w.appendChild(hp);
          p.appendChild(w);
          return;
        }
        const s = el('span', classeMot(i), esc(valeurMot(i)));
        s.dataset.i = i;
        s.addEventListener('click', () => toucher(i));
        p.appendChild(s);
      });
      z.appendChild(p);
    }
    const nbFins = () => DC.cibles.filter(i => DC.fins[i]).length;
    // passage 4 : les mots du dernier au premier, touchables
    function envers(z) {
      const w = el('div', 'ort-envers');
      DC.toks.map((t, i) => i).filter(i => DC.toks[i].m).reverse().forEach(i => {
        const t = DC.toks[i];
        const fin = DC.m === 'fin' && estCible(i);
        const lib = fin ? t.piege.deb + (DC.fins[i] || '…') : valeurMot(i);
        const b = bouton((DC.envers === i ? 'on' : '') + (estCible(i) && (DC.signales[i] || fin) && !corrige(i) ? ' ort-signale' : '') + (estCible(i) && corrige(i) ? ' ort-juste' : ''), esc(lib), () => {
          DC.envers = i;
          if (fin) {
            rendre();
            const f = document.getElementById('fin-' + i);
            if (f) { versVue(f, 'center'); f.focus({ preventScroll: true }); }
          } else toucher(i);
        });
        w.appendChild(b);
      });
      z.appendChild(w);
    }
    function vueTexte(e) {
      const g = el('div', 'ort-deux'), gauche = el('div', 'er-card ort-gauche'), droite = el('div', 'er-card ort-droite');
      if (estPassage(e)) consignePassage(gauche, e, DC.m === 'fin' ? 'Change tes fins de mots si besoin.' : 'Touche un mot faux pour le signaler.', DC, () => rendre());
      else gauche.appendChild(el('div', 'cle ort-consigne', e === 'corriger' ? '<b class="cle-titre">Les fautes sont repérées.</b> Corrige-les dans la liste.'
        : '<b class="cle-titre">Complète la fin des mots.</b> Le 🔊 fait entendre le mot. Tu pourras changer tes réponses pendant la relecture.'));
      if (e === 'p4') {
        envers(gauche);
        gauche.appendChild(el('p', 'ort-petit', DC.m === 'fin' ? 'Toucher un mot à compléter place le curseur dans sa case.' : 'Touche un mot faux pour le signaler.'));
        if (DC.m === 'fin') { const d = el('div', 'ort-sous'); d.appendChild(el('p', 'ort-petit', 'Le texte et les cases :')); texte(d); gauche.appendChild(d); }
      } else texte(gauche);
      const msg = el('div', DC.msg ? 'callout ort-msg' : '', DC.msg || '');
      msg.id = 'msg-texte';
      msg.setAttribute('aria-live', 'polite');
      gauche.appendChild(msg);
      if (DC.aide) gauche.appendChild(el('div', 'callout-accent ort-msg', DC.aide.msg));
      navBas(gauche);
      liste(droite);
      g.appendChild(gauche); g.appendChild(droite);
      zone.appendChild(g);
    }
    // colonne de droite : fautes signalées / à corriger, ou mots à compléter
    function liste(z) {
      if (DC.m === 'fin') {
        z.appendChild(el('div', 'ort-liste-t', '<h3 class="ort-h3">Mots à compléter</h3><b id="compte-fin">' + nbFins() + '/' + DC.cibles.length + '</b>'));
        z.appendChild(el('p', 'ort-petit', 'Tes réponses sont vérifiées à la fin : profite de la relecture pour les changer.'));
        DC.cibles.forEach(i => {
          const t = DC.toks[i], it = el('div', 'ort-item');
          const h = el('div', 'ort-item-t', '<b>' + (t.piege.deb ? esc(t.piege.deb) + '…' : '(mot entier)') + '</b><span class="ort-esp"></span>');
          h.appendChild(boutonRegle(i));
          it.appendChild(h);
          if (DC.regle[i]) it.appendChild(ORT.blocRegle(t.piege.r));
          z.appendChild(it);
        });
        return;
      }
      const Lf = DC.m === 'reperees' ? DC.cibles : DC.cibles.filter(i => DC.signales[i]);
      z.appendChild(el('div', 'ort-liste-t', '<h3 class="ort-h3">' + (DC.m === 'reperees' ? 'Fautes à corriger' : 'Mots signalés') + '</h3><span class="ort-petit">' +
        (DC.m === 'reperees' ? Lf.filter(corrige).length + '/' + Lf.length + ' corrigées' : pluriel(Lf.length, 'signalé')) + '</span>'));
      if (!Lf.length) z.appendChild(el('p', 'ort-petit', 'Touche dans le texte un mot qui te semble faux : il s’ajoute ici pour que tu le corriges.'));
      Lf.forEach(i => z.appendChild(item(i)));
    }
    function boutonRegle(i) {
      const b = bouton('ort-icone', '📖 Règle', () => { DC.regle[i] = !DC.regle[i]; rendre(() => document.getElementById('it-' + i)); }, 'Rappel de la règle');
      b.setAttribute('aria-pressed', !!DC.regle[i]);
      return b;
    }
    // une faute de la liste : choix multiples ou saisie, 2 essais puis « Afficher la réponse »
    function item(i) {
      const t = DC.toks[i], it = el('div', 'ort-item');
      it.id = 'it-' + i;
      const fini = corrige(i);
      const h = el('div', 'ort-item-t', '<b>« ' + esc(DC.faute[i]) + ' »</b>' + (fini ? ' → <b class="ort-ok">' + esc(t.v) + '</b>' : '') + '<span class="ort-esp"></span>');
      h.appendChild(boutonRegle(i));
      it.appendChild(h);
      if (!fini) {
        const essais = DC.essais[i] || 0;
        const reussi = () => {
          DC.points[i] = essais === 0 ? 1 : essais === 1 ? 0.5 : 0;
          // vers l'élément utile : la faute suivante à corriger, sinon le texte
          rendre(() => {
            if (DC.m === 'reperees') { const s = DC.cibles.find(j => !corrige(j)); return s != null ? document.getElementById('it-' + s) : document.getElementById('suite'); }
            return zone.querySelector('.ort-texte');
          });
        };
        const rate = () => {
          DC.essais[i] = essais + 1;
          rendre(() => document.getElementById('diag-' + i));
        };
        if (S.corr === 'qcm') {
          const ch = el('div', 'ort-choix');
          ch.setAttribute('role', 'group'); ch.setAttribute('aria-label', 'Choisis la bonne orthographe');
          DC.choix[i].forEach(x => {
            const mauvais = (DC.mauvais[i] || []).indexOf(x) >= 0;
            const b = bouton(mauvais ? 'mauvais' : '', esc(x), () => {
              if (x === t.v) reussi();
              else { (DC.mauvais[i] = DC.mauvais[i] || []).push(x); rate(); }
            });
            if (mauvais) { b.disabled = true; b.setAttribute('aria-label', x + ' : faux'); }
            ch.appendChild(b);
          });
          it.appendChild(ch);
        } else {
          const r = el('div', 'ort-rangee');
          const inp = el('input', 'ort-champ');
          inp.autocomplete = 'off'; inp.spellcheck = false;
          ['autocapitalize', 'autocorrect'].forEach(a => inp.setAttribute(a, 'off'));
          inp.placeholder = 'Mot corrigé';
          inp.setAttribute('aria-label', 'Mot corrigé pour « ' + DC.faute[i] + ' »');
          inp.value = DC.saisie && DC.saisie[i] || '';
          inp.addEventListener('input', () => { (DC.saisie = DC.saisie || {})[i] = inp.value; });
          const v = bouton('btn-primary ort-pt', 'Valider', () => {
            const x = inp.value.trim();
            if (!x) return;
            if (L.egal(t.v, x)) reussi();
            else { DC.dernier = DC.dernier || {}; DC.dernier[i] = x; rate(); }
          });
          inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); v.click(); } });
          r.appendChild(inp); r.appendChild(v);
          it.appendChild(r);
        }
        if (essais > 0) {
          const ecrit = S.corr === 'qcm' ? (DC.mauvais[i] || [])[essais - 1] : (DC.dernier || {})[i];
          let d = diagnostic(DC.toks, i);
          if (ecrit && L.min(ecrit) === L.min(t.v)) d = 'Attention à la majuscule.';
          const k = el('div', 'callout-danger ort-msg', '<b>Ce n’est pas ça.</b> ' + d + (essais >= 2 ? '<br>Corrige ta réponse, ou affiche la réponse (0 point pour cette faute).' : ''));
          k.id = 'diag-' + i;
          k.setAttribute('aria-live', 'polite');
          it.appendChild(k);
          if (essais >= 2) {
            const a = bouton('btn-small', 'Afficher la réponse', () => { DC.affiche[i] = true; rendre(() => zone.querySelector('.ort-texte')); });
            it.appendChild(a);
          }
        }
      } else {
        const p = DC.affiche[i] && DC.points[i] == null ? null : DC.points[i];
        it.appendChild(el('p', p ? 'ort-ok ort-petit' : 'ort-petit', p === 1 ? '✓ Juste du premier coup : 1 point.' : p === 0.5 ? '✓ Juste au 2e essai : 0,5 point.' : p === 0 ? 'Corrigée après plusieurs essais : 0 point.' : 'Réponse affichée : 0 point.'));
      }
      if (DC.regle[i]) it.appendChild(ORT.blocRegle(t.piege.r));
      return it;
    }

    /* ---------- dictée audio ---------- */
    function vueAudio(e) {
      const c = el('div', 'er-card');
      if (e === 'ecrire') {
        c.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Écoute et écris.</b> Une lecture d’ensemble, puis groupe par groupe avec la ponctuation. Chaque groupe est lu ' + S.lectures + ' fois (réglage).'));
        if (!ORT.voix.dispo()) c.appendChild(messageSansVoix());
        const r0 = el('div', 'ort-rangee');
        r0.appendChild(bouton('btn-secondary ort-pt', '🔊 Lecture d’ensemble', () => lecteur.ensemble()));
        r0.appendChild(bouton('btn-small', 'Relire la phrase', () => lecteur.phrase(false)));
        r0.appendChild(bouton('btn-small', 'Relire tout le texte', () => lecteur.ensemble()));
        c.appendChild(r0);
        c.appendChild(vueLecteur(lecteur));
      } else {
        consignePassage(c, e, 'Corrige ta copie si besoin.', DC, () => rendre());
        if (e === 'p2' && DC.aide) {
          // les mots de la copie, touchables, reliés aux mots du texte
          const lc = lienCopie(DC.toks, DC.copie);
          const p = el('p', 'ort-texte ort-cliquable');
          if (!lc.cop.length) p.appendChild(el('span', 'ort-petit', 'Ta copie est vide.'));
          lc.cop.forEach((w, j) => {
            p.appendChild(document.createTextNode(L.espaceAvant(j ? lc.cop[j - 1].v : null, w.v)));
            if (!w.m) { p.appendChild(document.createTextNode(w.v)); return; }
            const i = lc.lien[j] != null ? lc.lien[j] : -1;
            const s = el('span', 'ort-mot' + (i >= 0 ? classesAide(DC.aide, DC.toks[i]) : ''), esc(w.v));
            s.addEventListener('click', () => { clicAide(DC.aide, DC.toks, i, w.v); rendre(); });
            p.appendChild(s);
          });
          c.appendChild(p);
          c.appendChild(el('div', 'callout-accent ort-msg', DC.aide.msg));
        } else if (e === 'p4') {
          const w = el('div', 'ort-envers');
          motsCopie(DC.copie).map((m, k) => ({ m, k })).reverse().forEach(x => {
            w.appendChild(bouton(DC.envers === x.k ? 'on' : '', esc(x.m), () => {
              DC.envers = x.k;
              w.querySelectorAll('button').forEach(b => b.classList.remove('on'));
              const ta = zone.querySelector('.ort-copie');
              if (ta) selectionnerMot(ta, x.k);
            }));
          });
          if (!w.childNodes.length) w.appendChild(el('span', 'ort-petit', 'Ta copie est vide.'));
          c.appendChild(w);
          c.appendChild(el('p', 'ort-petit', 'Toucher un mot le sélectionne dans ta copie.'));
        }
      }
      const ta = champCopie(DC.copie);
      ta.addEventListener('input', () => { DC.copie = ta.value; });
      c.appendChild(el('label', 'ort-lab', 'Ta copie'));
      c.lastChild.appendChild(ta);
      navBas(c);
      zone.appendChild(c);
    }

    /* ---------- résultat ---------- */
    function evaluer() {
      const err = [], occ = [], fam = {};
      let pts = 0, ok = 0, autres = 0, ratees = new Set();
      const compter = (r, p) => { const f = R[r].famille; fam[f] = fam[f] || { n: 0, ok: 0 }; fam[f].n++; fam[f].ok += p; };
      if (DC.m === 'audio') {
        const a = analyserCopie(DC.toks, DC.copie, DC.cibles);
        ratees = a.motRate;
        DC.cibles.forEach(i => {
          const t = DC.toks[i], juste = !a.motRate.has(i);
          compter(t.piege.r, juste ? 1 : 0);
          occ.push({ r: t.piege.r, ok: juste ? 1 : 0 });
          if (juste) { pts++; ok++; }
        });
        // les autres mots pièges du texte comptent dans le suivi (pas dans la note)
        DC.toks.forEach((t, i) => { if (t.piege && !a.cibles.has(i)) occ.push({ r: t.piege.r, ok: a.motRate.has(i) ? 0 : 1 }); });
        const vues = new Set();
        a.c.erreurs.forEach(e => {
          if (e.iRef >= 0 && a.cibles.has(e.iRef) && !e.ponct) { err.push(Object.assign({}, e, { tag: e.tag || 'mot piège' })); return; }
          const cle = L.min(e.attendu) + '|' + L.min(e.ecrit);
          if (vues.has(cle)) return;
          vues.add(cle);
          autres++;
          err.push(Object.assign({}, e, { tag: (e.tag ? e.tag + ' · ' : '') + '−0,5 point' }));
          if (e.iRef < 0 || !DC.toks[e.iRef].piege) occ.push({ r: e.r, ok: 0 });
        });
        pts -= 0.5 * autres;
      } else {
        DC.cibles.forEach(i => {
          const t = DC.toks[i], r = t.piege.r;
          let p = 0, tag = '';
          if (DC.m === 'fin') {
            const val = (t.piege.deb + (DC.fins[i] || '')).trim();
            p = DC.fins[i] && L.egal(t.v, val) ? 1 : 0;
            if (!p) err.push({ ecrit: DC.fins[i] ? val : t.piege.deb + '…', attendu: t.v, r, tag: DC.fins[i] ? '' : 'non complété' });
          } else {
            const trouve = DC.m === 'reperees' || DC.signales[i];
            p = DC.points[i] || 0;
            if (p === 0.5) tag = 'juste au 2e essai (0,5 point)';
            else if (!p) tag = !trouve ? 'non repérée' : DC.affiche[i] && DC.points[i] == null ? 'réponse affichée' : DC.points[i] === 0 ? 'corrigée après plusieurs essais' : 'non corrigée';
            if (p < 1) err.push({ ecrit: DC.faute[i], attendu: t.v, r, tag });
          }
          pts += p; if (p >= 1) ok++;
          compter(r, p);
          occ.push({ r, ok: p });
        });
        if (DC.m !== 'fin') {
          DC.fausses.forEach(i => {
            const t = DC.toks[i];
            err.push({ signale: true, ecrit: t.v, attendu: t.v, r: t.piege ? t.piege.r : null, tag: 'mot juste signalé (−0,5 point)' });
            if (t.piege) occ.push({ r: t.piege.r, ok: 0 });
          });
          pts -= 0.5 * DC.fausses.length;
        }
      }
      const n = DC.cibles.length;
      const note = Math.round(20 * Math.max(0, pts) / n * 2) / 2;
      return { pts, ok, n, note, err, occ, fam, autres, ratees };
    }
    function resultat() {
      if (!DC.res) {
        DC.res = evaluer();
        ORT.enregistrer(DC.res.occ, DC.res.note, 'c');
        SOM.marquer({ note: DC.res.note });
        ORT.menu('dictee_courte');                       // sommaire à jour (meilleure note)
      }
      const ev = DC.res, audio = DC.m === 'audio';
      const c = el('div', 'er-card ort-resultat');
      c.id = 'resultat';
      const pts = Math.max(0, ev.pts);
      const det = audio
        ? '1 point par mot piège juste' + (ev.autres ? ' · ' + pluriel(ev.autres, 'autre erreur') + ' : −0,5 × ' + ev.autres : ' · autre erreur : −0,5')
        : DC.m === 'fin' ? '1 point par mot juste'
          : 'Juste du premier coup : 1 point · au 2e essai : 0,5' + (DC.m === 'arep' ? ' · mot juste signalé : −0,5' + (DC.fausses.length ? ' × ' + DC.fausses.length : '') : '');
      c.innerHTML = '<span class="er-badge">RÉSULTAT</span><div class="ort-note"><span class="ort-n">' + virg(ev.note) + '<small>/20</small></span><div><b>' +
        virg(pts) + ' point' + (pts > 1 ? 's' : '') + ' sur ' + ev.n + (audio ? ' mots pièges' : DC.m === 'fin' ? ' mots à compléter' : ' fautes à trouver') + '</b><br><span class="ort-petit">' + det + '</span></div></div>' +
        '<p class="ort-petit">Note sur 20 : points × 20 ÷ ' + ev.n + ', arrondie au demi-point.</p>';
      c.appendChild(el('p', 'ort-lab', 'Réussite par type d’erreur'));
      c.appendChild(pastillesFamilles(ev.fam));
      c.appendChild(el('p', 'ort-message', ev.note >= 20 ? 'Sans faute : bravo !' : ev.note >= 14 ? 'Très bien : regarde tes erreurs et leur règle.' : ev.note >= 10 ? 'C’est en bonne voie : relis la règle de chaque erreur.' : 'Reprends chaque erreur avec sa règle, puis refais une dictée sur ces notions.'));
      zone.appendChild(c);
      const c2 = el('div', 'er-card');
      c2.appendChild(el('h3', 'ort-h3', ev.err.length ? 'Tes erreurs (' + ev.err.length + ')' : 'Aucune erreur !'));
      ev.err.forEach(e => c2.appendChild(ligneErreur(e)));
      if (audio) { c2.appendChild(el('p', 'ort-lab', 'Le texte')); c2.appendChild(texteCorrige(DC.toks, ev.ratees)); }
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Nouvelle dictée →', () => { nouvelle(); entete(); rendre(); versVue(document.getElementById('entete'), 'start'); }));
      const s = el('a', 'btn-secondary', 'Mon suivi');
      s.href = 'suivi.html';
      r.appendChild(s);
      c2.appendChild(r);
      zone.appendChild(c2);
    }

    // un changement de réglage démarre une nouvelle dictée
    ORT.surReglages(() => { ciblage = null; nouvelle(); entete(); rendre(); });
    ORT.dictee.etat = () => DC;                       // état de la dictée (vérifications automatiques)
    nouvelle();
    entete();
    rendre();
  }

  /* =====================================================================
     DICTÉE BREVET (même déroulé, conditions de l'examen)
     ===================================================================== */
  function brevet(zone) {
    ORT.noteReglages = 'La vitesse et le nombre de lectures s’appliquent à la lecture suivante.';
    const ET = ['ensemble', 'dictee', 'relecture', 'p1', 'p2', 'p3', 'p4', 'res'];
    const NOMS = { ensemble: 'Lecture d’ensemble', dictee: 'Dictée', relecture: 'Relecture du texte', res: 'Résultat' };
    const DUREE = 20 * 60 * 1000;
    let BV = { phase: 'choix', type: 't', id: '' }, lecteur = null, minuteur = null;
    const textes = window.ORTHO_BREVET;

    // chronomètre (temps restant sur 20 min) ; « Pause » l'arrête
    const ecoule = () => BV.cumul + (BV.depuis ? Date.now() - BV.depuis : 0);
    function majChrono() {
      const n = document.getElementById('chrono');
      if (!n) return;
      const r = DUREE - ecoule();
      if (r <= 0) { n.textContent = '0:00'; n.classList.add('fini'); const m = document.getElementById('chrono-msg'); if (m) m.textContent = 'Temps écoulé : termine ta relecture.'; return; }
      const s = Math.ceil(r / 1000);
      n.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
    }
    function chrono(marche) {
      if (marche && !BV.depuis) BV.depuis = Date.now();
      if (!marche && BV.depuis) { BV.cumul += Date.now() - BV.depuis; BV.depuis = 0; }
      clearInterval(minuteur);
      if (marche) minuteur = setInterval(majChrono, 500);
      majChrono();
    }

    function commencer() {
      let t;
      if (BV.type === 'g') {
        const regles = D.regles.map(r => r.id);
        const c = composer(regles, { cible: 999, min: 92, max: 120 });
        t = { toks: c.toks, cibles: c.toks.map((x, i) => (x.piege ? i : -1)).filter(i => i >= 0), oeuvre: 'Texte généré dans le style du brevet', tableau: [], genere: true };
      } else {
        const x = BV.id ? textes.find(y => y.id === BV.id) : L.tirer(textes);
        const toks = L.lirePhrase(x.texte);
        t = { toks, cibles: toks.map((y, i) => (y.piege ? i : -1)).filter(i => i >= 0), oeuvre: x.oeuvre, session: x.session, centre: x.centre, tableau: x.tableau };
      }
      BV = Object.assign(BV, { phase: 'etapes', k: 0, t, copie: '', douteux: [], aide: null, tests: false, envers: null, res: null, cumul: 0, depuis: 0, finDictee: false, relu: false });
      lecteur = Lecteur(t.toks, { finDictee: () => { BV.finDictee = true; const b = document.getElementById('suite'); if (b) b.classList.add('ort-attire'); } });
      chrono(true);
      rendre();
      lecteur.ensemble();
      versVue(document.getElementById('etapes'), 'start');
    }

    function rendre(apres) {
      const y = window.scrollY;
      zone.innerHTML = '';
      if (BV.phase === 'choix') { choix(); return; }
      const e = ET[BV.k];
      const c0 = el('div', 'er-card ort-etapes-c');
      c0.id = 'etapes';
      c0.appendChild(barreEtapes(ET, BV.k, { ensemble: NOMS.ensemble, dictee: NOMS.dictee, relecture: NOMS.relecture, res: NOMS.res, groupe: 'Ta relecture' }, j => aller(j), !!BV.res));
      zone.appendChild(c0);
      if (e === 'res') { resultat(); window.scrollTo(0, y); if (apres) versVue(apres()); return; }
      zone.appendChild(tableau());
      const c = el('div', 'er-card');
      if (e === 'ensemble') {
        c.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Lecture d’ensemble.</b> Écoute le texte en entier, sans écrire : repère le temps du récit et qui parle (je, il, elles), le genre du narrateur.'));
        if (!ORT.voix.dispo()) c.appendChild(messageSansVoix());
        const r = el('div', 'ort-rangee');
        r.appendChild(bouton('btn-secondary ort-pt', '🔊 Réécouter le texte', () => lecteur.ensemble()));
        c.appendChild(r);
      } else if (e === 'dictee') {
        c.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Dictée.</b> Le texte est lu groupe par groupe, avec la ponctuation. Écris une ligne sur deux. Si tu hésites sur un mot, écris-le puis marque-le avec « • Mot douteux ».'));
        c.appendChild(vueLecteur(lecteur, { simple: true }));
        const r = el('div', 'ort-rangee');
        r.appendChild(bouton('btn-small', '↻ Relire la phrase', () => lecteur.phrase(true)));
        r.appendChild(bouton('btn-small', '• Mot douteux', () => {
          const ta = zone.querySelector('.ort-copie'), w = ta ? motAuCurseur(ta) : '';
          if (w && BV.douteux.indexOf(w) < 0) BV.douteux.push(w);
          majMarge();
        }));
        c.appendChild(r);
      } else if (e === 'relecture') {
        c.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Relecture du texte.</b> Le texte est relu en entier, sans la ponctuation. Corrige ta copie pendant la lecture. Comme au brevet : pas de question après la relecture du texte.'));
      } else {
        consignePassage(c, e, 'Corrige ta copie si besoin.', BV, () => rendre());
        if (e === 'p2' && BV.aide) {
          const lc = lienCopie(BV.t.toks, BV.copie);
          const p = el('p', 'ort-texte ort-cliquable');
          lc.cop.forEach((w, j) => {
            p.appendChild(document.createTextNode(L.espaceAvant(j ? lc.cop[j - 1].v : null, w.v)));
            if (!w.m) { p.appendChild(document.createTextNode(w.v)); return; }
            const i = lc.lien[j] != null ? lc.lien[j] : -1;
            const s = el('span', 'ort-mot' + (i >= 0 ? classesAide(BV.aide, BV.t.toks[i]) : ''), esc(w.v));
            s.addEventListener('click', () => { clicAide(BV.aide, BV.t.toks, i, w.v); rendre(); });
            p.appendChild(s);
          });
          if (!lc.cop.length) p.appendChild(el('span', 'ort-petit', 'Ta copie est vide.'));
          c.appendChild(p);
          c.appendChild(el('div', 'callout-accent ort-msg', BV.aide.msg));
        } else if (e === 'p4') {
          const w = el('div', 'ort-envers');
          motsCopie(BV.copie).map((m, k) => ({ m, k })).reverse().forEach(x => {
            const nu = x.m.replace(/^[«(]+|[.,;:!?…»)]+$/g, '');
            w.appendChild(bouton((BV.envers === x.k ? 'on' : '') + (BV.douteux.indexOf(nu) >= 0 ? ' ort-douteux' : ''), esc(x.m), () => {
              BV.envers = x.k;
              w.querySelectorAll('button').forEach(b => b.classList.remove('on'));
              const ta = zone.querySelector('.ort-copie');
              if (ta) selectionnerMot(ta, x.k);
            }));
          });
          c.appendChild(w);
          c.appendChild(el('p', 'ort-petit', 'Toucher un mot le sélectionne dans ta copie. Les mots douteux portent un point.'));
        }
      }
      const ta = champCopie(BV.copie);
      ta.classList.add('ort-copie-brevet');
      ta.disabled = e === 'ensemble';
      if (e === 'ensemble') ta.placeholder = 'Pendant la lecture d’ensemble, on écoute sans écrire.';
      ta.addEventListener('input', () => { BV.copie = ta.value; });
      c.appendChild(el('label', 'ort-lab', 'Ta copie'));
      c.lastChild.appendChild(ta);
      const marge = el('p', 'ort-marge');
      marge.id = 'marge';
      c.appendChild(marge);
      navBas(c);
      zone.appendChild(c);
      majMarge();
      window.scrollTo(0, y);
      if (apres) versVue(apres());
    }
    // mots marqués d'un point (seule marque autorisée) ; un appui retire la marque
    function majMarge() {
      const m = document.getElementById('marge');
      if (!m) return;
      m.innerHTML = BV.douteux.length ? '<span class="ort-petit">Marge :</span> ' : '';
      BV.douteux.forEach(w => m.appendChild(bouton('ort-douteux-b', '• ' + esc(w), () => { BV.douteux = BV.douteux.filter(x => x !== w); majMarge(); }, 'Retirer la marque de ' + w)));
    }
    // mots au tableau, source, chronomètre
    function tableau() {
      const c = el('div', 'er-card ort-tableau-c');
      const t = el('div', 'ort-tableau');
      t.innerHTML = '<span class="ort-petit-clair">Au tableau</span> ' + (BV.t.tableau.length ? BV.t.tableau.map(esc).join(' · ') : '(aucun mot)') +
        '<br><span class="ort-petit-clair">' + (BV.t.genere ? esc(BV.t.oeuvre) : 'D’après ' + esc(BV.t.oeuvre) + (BV.t.session ? ' · brevet ' + BV.t.session : '')) + '</span>';
      c.appendChild(t);
      const r = el('div', 'ort-rangee ort-entre');
      const ch = el('div', 'ort-chrono-z', '<span class="ort-chrono" id="chrono" role="timer" aria-label="Temps restant"></span><span class="ort-petit" id="chrono-msg">sur 20 min</span>');
      r.appendChild(ch);
      const p = bouton('btn-small', BV.depuis ? '⏸ Pause' : '▶ Reprendre', () => {
        if (BV.depuis) { chrono(false); if (lecteur) lecteur.pause(); p.textContent = '▶ Reprendre'; }
        else { chrono(true); p.textContent = '⏸ Pause'; if (ET[BV.k] === 'dictee' && !lecteur.etat.fini) lecteur.jouer(Math.max(0, lecteur.etat.g)); }
      });
      if (ET[BV.k] !== 'res') r.appendChild(p);
      c.appendChild(r);
      setTimeout(majChrono, 0);
      return c;
    }
    function aller(j) {
      const avant = ET[BV.k];
      BV.k = j; BV.aide = null; BV.envers = null;
      const e = ET[j];
      ORT.voix.arreter();
      if (lecteur) lecteur.etat.joue = false;
      if (e === 'res') chrono(false);
      rendre();
      // lancement des lectures (l'appui sur le bouton autorise la synthèse vocale)
      if (e === 'dictee' && avant !== 'dictee') lecteur.jouer(lecteur.etat.fini ? 0 : Math.max(0, lecteur.etat.g));
      if (e === 'relecture' && !BV.relu) { BV.relu = true; lecteur.ensemble(); }
      if (e === 'ensemble') lecteur.ensemble();
      versVue(document.getElementById('etapes'), 'start');
    }
    function navBas(z) {
      const n = el('div', 'ort-nav-bas');
      if (BV.k > 0) {
        const p = ET[BV.k - 1];
        n.appendChild(bouton('btn-secondary', '← ' + (estPassage(p) ? 'Passage ' + p.slice(1) : NOMS[p]), () => aller(BV.k - 1)));
      } else n.appendChild(el('span'));
      const s = ET[BV.k + 1];
      const lib = s === 'res' ? 'Terminer et voir ma note →' : estPassage(s) ? (s === 'p1' ? 'Ta relecture : passage 1 →' : 'Passage ' + s.slice(1) + ' : ' + PASS[s][0] + ' →') : NOMS[s] + ' →';
      const b = bouton('btn-primary', lib, () => aller(BV.k + 1));
      b.id = 'suite';
      if (ET[BV.k] === 'dictee' && BV.finDictee) b.classList.add('ort-attire');
      n.appendChild(b);
      z.appendChild(n);
    }
    // écran de départ : texte déjà tombé ou généré
    function choix() {
      const c = el('div', 'er-card');
      c.appendChild(el('h3', 'ort-h3', 'Choisis ton texte'));
      c.appendChild(segment([['t', 'Dictée déjà tombée'], ['g', 'Texte généré']], BV.type, v => { BV.type = v; rendre(); }));
      if (BV.type === 't') {
        const l = el('label', 'ort-lab', 'Sujet');
        const s = el('select', 'ort-select');
        s.innerHTML = '<option value="">Au hasard</option>' + textes.slice().sort((a, b) => b.session.localeCompare(a.session)).map(x => '<option value="' + x.id + '"' + (x.id === BV.id ? ' selected' : '') + '>' + esc(x.session + ' · ' + x.oeuvre) + '</option>').join('');
        s.addEventListener('change', () => { BV.id = s.value; });
        l.appendChild(s); c.appendChild(l);
      } else c.appendChild(el('p', 'ort-petit', 'Un texte d’environ 600 signes composé à partir de la banque de phrases, sur toutes les règles.'));
      c.appendChild(el('div', 'cle ort-consigne', '<b class="cle-titre">Déroulé officiel (20 minutes).</b> Lecture d’ensemble sans écrire ; dictée groupe par groupe avec la ponctuation ; relecture du texte sans la ponctuation ; puis ta relecture en 4 passages. Les noms propres et les mots rares sont écrits au tableau.'));
      c.appendChild(el('p', 'ort-petit', 'Barème du brevet : faute de grammaire −1 point, faute d’usage, d’accent, de majuscule ou de ponctuation −0,5 (sur 10, puis sur 20). Une même faute sur le même mot n’est comptée qu’une fois.'));
      if (!ORT.voix.dispo()) c.appendChild(messageSansVoix());
      const a = el('div', 'er-actions');
      a.appendChild(bouton('btn-primary', 'Commencer la dictée →', commencer));
      c.appendChild(a);
      zone.appendChild(c);
    }
    function segment(ch, val, fn) {
      const s = el('div', 'ort-seg');
      s.setAttribute('role', 'group');
      s.setAttribute('aria-label', 'Texte');
      ch.forEach(x => { const b = bouton('', esc(x[1]), () => fn(x[0])); b.setAttribute('aria-pressed', x[0] === val); s.appendChild(b); });
      return s;
    }

    /* ---------- résultat : barème du brevet ---------- */
    function evaluer() {
      const toks = BV.t.toks, a = analyserCopie(toks, BV.copie, BV.t.cibles);
      const err = [], occ = [], fam = {}, vues = new Set();
      let total = 0;
      const compter = (r, ok) => { const f = R[r].famille; fam[f] = fam[f] || { n: 0, ok: 0 }; fam[f].n++; fam[f].ok += ok; };
      a.c.erreurs.forEach(e => {
        const cle = L.min(e.attendu) + '|' + L.min(e.ecrit);
        if (vues.has(cle)) return;          // même faute sur le même mot : une seule fois
        vues.add(cle);
        const gram = R[e.r] && R[e.r].famille !== 'LX';
        total += gram ? 1 : 0.5;
        err.push(Object.assign({}, e, { tag: (e.tag ? e.tag + ' · ' : '') + (gram ? 'grammaire −1' : 'usage −0,5') }));
      });
      // occasions : chaque mot annoté (ou dont la règle se devine), juste ou faux
      let prev = '';
      toks.forEach((t, i) => {
        if (!t.m) return;
        const r = t.piege ? t.piege.r : L.regleProbable(t.v, prev);
        prev = t.v;
        if (!r || !R[r]) return;
        const ok = a.motRate.has(i) ? 0 : 1;
        occ.push({ r, ok }); compter(r, ok);
      });
      a.c.erreurs.forEach(e => { if (e.iRef < 0 || e.ponct || (!toks[e.iRef].piege && !L.regleProbable(toks[e.iRef].v, ''))) { occ.push({ r: e.r, ok: 0 }); compter(e.r, 0); } });
      const sur10 = Math.max(0, 10 - total);
      return { total, sur10, note: Math.round(sur10 * 2 * 2) / 2, err, occ, fam, ratees: a.motRate, nb: err.length };
    }
    function resultat() {
      if (!BV.res) {
        BV.res = evaluer();
        ORT.enregistrer(BV.res.occ, BV.res.note, 'b');
        SOM.marquer({ note: BV.res.note });
        ORT.menu('dictee_brevet');                       // sommaire à jour (meilleure note)
      }
      const ev = BV.res;
      const c = el('div', 'er-card ort-resultat');
      c.innerHTML = '<span class="er-badge">RÉSULTAT</span><div class="ort-note"><span class="ort-n">' + virg(ev.note) + '<small>/20</small></span><div><b>' + virg(ev.sur10) + '/10 · ' +
        pluriel(ev.nb, 'faute') + ' (−' + virg(ev.total) + ' point' + (ev.total > 1 ? 's' : '') + ')</b><br><span class="ort-petit">Barème du brevet : faute de grammaire −1, faute d’usage, d’accent, de majuscule ou de ponctuation −0,5 ; sur 10, puis sur 20.</span></div></div>' +
        '<p class="ort-petit">Temps utilisé : ' + Math.round(ecoule() / 60000) + ' min sur 20.</p>';
      c.appendChild(el('p', 'ort-lab', 'Réussite par type d’erreur'));
      c.appendChild(pastillesFamilles(ev.fam));
      zone.appendChild(c);
      const c2 = el('div', 'er-card');
      c2.appendChild(el('h3', 'ort-h3', ev.err.length ? 'Tes fautes (' + ev.err.length + ')' : 'Aucune faute !'));
      ev.err.forEach(e => c2.appendChild(ligneErreur(e)));
      c2.appendChild(el('p', 'ort-lab', 'Le texte'));
      c2.appendChild(texteCorrige(BV.t.toks, ev.ratees));
      const r = el('div', 'er-actions');
      r.appendChild(bouton('btn-primary', 'Nouvelle dictée brevet →', () => { BV = { phase: 'choix', type: BV.type, id: '' }; ORT.voix.arreter(); rendre(); versVue(document.getElementById('entete'), 'start'); }));
      const s = el('a', 'btn-secondary', 'Mon suivi');
      s.href = 'suivi.html';
      r.appendChild(s);
      c2.appendChild(r);
      zone.appendChild(c2);
    }
    addEventListener('pagehide', () => ORT.voix.arreter());
    ORT.dictee.etat = () => BV;                       // état de la dictée (vérifications automatiques)
    rendre();
  }

  ORT.dictee = { composer, courte, brevet, decouperGroupes, texteDicte };
  addEventListener('pagehide', () => ORT.voix.arreter());
})();
