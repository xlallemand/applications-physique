/* ============================================================
   Orthographe — moteur de langue (objet ORT.L)
   ------------------------------------------------------------
   Rôle : tout ce qui touche aux mots, sans affichage.
     - découper un texte en mots et ponctuations, le recoller
       (espaces insécables comprises) ;
     - lire une phrase annotée de la banque (pièges, verbes, sujets) ;
     - fabriquer des formes fautives plausibles pour chaque règle ;
     - conjuguer, accorder, et instancier les gabarits combinatoires ;
     - comparer une copie au texte mot à mot et classer chaque écart
       par règle (dictée audio, dictée brevet) ;
     - deviner la règle en jeu sur un mot non annoté (occasions de
       la dictée brevet).

   Notation des phrases annotées (banque.js) :
     {juste|RÈGLE}               mot piège (formes fautives calculées)
     {juste|RÈGLE|f1/f2}         formes fautives données
     {juste|RÈGLE|f1/f2|début}   début du mot imposé (« J'écris la fin du mot »)
     mot@k   verbe conjugué n° k        mot#k   mot du sujet du verbe k
     mot&k   antécédent du pronom « qui » sujet du verbe k

   Jeton d'un texte : { v, m, piege?, verbe?, sujet?, ante? }
     v : forme juste ; m : true pour un mot, false pour une ponctuation
     piege : { r, fautes: [...], deb }

   API : voir l'objet exposé en fin de fichier (ORT.L).
   ============================================================ */
(function () {
  'use strict';
  const ORT = window.ORT = window.ORT || {};
  const NBSP = ' ';

  /* ---------- Normalisation ---------- */
  const apo = s => String(s).replace(/'/g, '’');
  const min = s => apo(s).toLowerCase();
  const sansAcc = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const estMaj = s => !!s && s.charAt(0) !== s.charAt(0).toLowerCase();
  // même casse que le modèle (première lettre)
  const casse = (modele, s) => (estMaj(modele) ? cap(s) : s);
  const hasard = n => Math.floor(Math.random() * n);
  const tirer = l => l[hasard(l.length)];
  function melanger(l) {
    const a = l.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = hasard(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const uniques = l => l.filter((x, i) => x && l.indexOf(x) === i);

  /* ---------- Découpage d'un texte ---------- */
  const LETTRE = 'A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9';
  const R_TOK = new RegExp('[' + LETTRE + ']+(?:[’\'\\-][' + LETTRE + ']+)*[’\']?|\\.\\.\\.|[.,;:!?…«»"()\\[\\]–—-]', 'g');
  // ponctuations qui ne comptent pas comme fautes (non dictées ou facultatives)
  const PONCT_LIBRE = new Set(['«', '»', '"', '(', ')', '[', ']', '–', '—', '-']);

  // texte → [{ v, m }]
  function decouper(texte) {
    const res = [];
    String(texte).replace(/\[…\]/g, ' ').replace(R_TOK, x => { res.push({ v: x === '...' ? '…' : apo(x), m: /[A-Za-zÀ-ÿŒœÆæ0-9]/.test(x) }); return x; });
    return res;
  }
  // espace à mettre avant le jeton t (p : jeton précédent)
  function espaceAvant(p, t) {
    if (!p) return '';
    if (/’$/.test(p)) return '';                       // élision : j’ + aimais
    if (p === '«') return NBSP;
    if (p === '(' || p === '[') return '';
    if (/^[,.…)\]]$/.test(t)) return '';
    if (/^[:;!?»]$/.test(t)) return NBSP;
    return ' ';
  }
  // [{ v }] → texte
  function joindre(toks) {
    let s = '';
    toks.forEach((t, i) => { s += espaceAvant(i ? toks[i - 1].v : null, t.v) + t.v; });
    return s;
  }

  /* ---------- Homophones grammaticaux (et quelques groupes de mots invariables) ---------- */
  const HOMO = [
    { r: 'HO1', l: ['a', 'à', 'as'] },
    { r: 'HO2', l: ['et', 'est', 'es'] },
    { r: 'HO3', l: ['son', 'sont'] },
    { r: 'HO4', l: ['on', 'ont'] },
    { r: 'HO5', l: ['ou', 'où'] },
    { r: 'HO6', l: ['ce', 'se', 'ceux'] },
    { r: 'HO7', l: ['ces', 'ses', 'c’est', 's’est', 'sait', 'sais'] },
    { r: 'HO8', l: ['la', 'là', 'l’a', 'l’as'] },
    { r: 'HO8', l: ['les', 'l’ai', 'l’es'] },
    { r: 'HO9', l: ['leur', 'leurs'] },
    { r: 'HO10', l: ['mais', 'mes', 'met', 'mets', 'm’est'] },
    { r: 'HO11', l: ['sans', 's’en', 'sent', 'cent', 'c’en'] },
    { r: 'HO12', l: ['quand', 'quant', 'qu’en'] },
    { r: 'HO13', l: ['peu', 'peut', 'peux'] },
    { r: 'HO14', l: ['tant', 'temps', 't’en'] },
    { r: 'HO14', l: ['dans', 'd’en'] },
    { r: 'HO15', l: ['quel', 'quelle', 'quels', 'quelles', 'qu’elle', 'qu’elles'] },
    { r: 'HO16', l: ['ni', 'n’y'] },
    { r: 'HO16', l: ['si', 's’y'] },
    { r: 'HO17', l: ['c’était', 's’était'] },
    { r: 'HO17', l: ['ça', 'sa', 'çà'] },
    { r: 'HO18', l: ['quelque', 'quelques'] },
    { r: 'HO19', l: ['près', 'prêt', 'prête', 'prêts', 'prêtes'] },
    { r: 'HO19', l: ['plutôt', 'plus tôt'] },
    { r: 'GN6', l: ['tout', 'tous', 'toute', 'toutes'] }
  ];
  function groupeHomo(w) { const x = min(w); return HOMO.find(g => g.l.indexOf(x) >= 0) || null; }
  // fautes les plus plausibles pour un homophone : on garde l'ordre du groupe, sans le mot juste
  function fautesHomo(w) {
    const g = groupeHomo(w);
    if (!g) return [];
    const x = min(w);
    const PREF = { ces: ['ses', 'c’est'], ses: ['ces', 'c’est'], 'c’est': ['s’est', 'ces'], 's’est': ['c’est', 'ses'],
      sait: ['c’est', 's’est'], sais: ['ses', 'c’est'], la: ['là', 'l’a'], 'là': ['la', 'l’a'], 'l’a': ['la', 'là'],
      mais: ['mes', 'met'], mes: ['mais', 'met'], met: ['mais', 'mes'], quel: ['quelle', 'qu’elle'], quelle: ['qu’elle', 'quel'],
      'qu’elle': ['quelle', 'quel'], quels: ['quelles', 'qu’elles'], quelles: ['qu’elles', 'quels'], 'qu’elles': ['quelles', 'quels'],
      tout: ['tous', 'toute'], tous: ['tout', 'toute'], toute: ['tout', 'toutes'], toutes: ['tous', 'toute'],
      sans: ['s’en', 'sent'], 's’en': ['sans', 'sent'], sent: ['sans', 's’en'], cent: ['sans', 's’en'],
      près: ['prêt', 'prés'], prêt: ['près', 'prés'], prête: ['près', 'prêt'], prêts: ['près', 'prêt'], prêtes: ['près', 'prêts'],
      a: ['à', 'as'], 'à': ['a', 'as'], et: ['est', 'es'], est: ['et', 'es'], ce: ['se', 'ceux'], se: ['ce', 'ceux'],
      peu: ['peut', 'peux'], peut: ['peu', 'peux'], peux: ['peut', 'peu'], tant: ['temps', 't’en'], temps: ['tant', 't’en'] };
    return (PREF[x] || g.l.filter(y => y !== x)).map(y => casse(w, y));
  }

  /* ---------- Petits ensembles pour reconnaître le contexte ---------- */
  const ETRE = new Set(['suis', 'es', 'est', 'sommes', 'êtes', 'sont', 'étais', 'était', 'étions', 'étiez', 'étaient', 'fus', 'fut', 'furent',
    'serai', 'sera', 'serons', 'seront', 'serait', 'seraient', 'été', 'être', 'soit', 'soient', 'semblait', 'semblaient', 'paraissait', 'devint', 'restait', 'resta']);
  const AVOIR = new Set(['ai', 'as', 'a', 'avons', 'avez', 'ont', 'avais', 'avait', 'avions', 'aviez', 'avaient', 'eus', 'eut', 'eurent',
    'aurai', 'aura', 'auront', 'aurait', 'auraient', 'eu', 'avoir', 'ait', 'aient', 'l’ai', 'l’a', 'm’a', 'm’avait', 'l’avait']);
  const DET_PL = new Set(['les', 'des', 'ces', 'mes', 'tes', 'ses', 'nos', 'vos', 'leurs', 'plusieurs', 'quelques', 'certains', 'certaines',
    'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'cent', 'mille', 'aux', 'nombreux', 'nombreuses', 'divers', 'différents']);
  const DET = new Set(Array.from(DET_PL).concat(['le', 'la', 'l’', 'un', 'une', 'du', 'au', 'ce', 'cet', 'cette', 'mon', 'ton', 'son', 'ma', 'ta', 'sa',
    'notre', 'votre', 'leur', 'chaque', 'quel', 'quelle', 'aucun', 'aucune', 'tout', 'toute', 'grand', 'grande', 'petit', 'petite', 'vieux', 'vieille', 'beau', 'belle']));
  const PRONOMS = new Set(['je', 'j’', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'qui']);
  const NON_VERBES = new Set(['mais', 'jamais', 'désormais', 'vrai', 'lait', 'portrait', 'trait', 'souhait', 'balai', 'palais', 'marais', 'frais',
    'épais', 'anglais', 'français', 'mauvais', 'biais', 'relais', 'délai', 'essai', 'quai', 'gai', 'mai', 'parfait', 'bienfait', 'attrait', 'jais']);
  const NOMS_ER = new Set(['hier', 'mer', 'fer', 'cher', 'enfer', 'hiver', 'amer', 'fier', 'ver', 'super', 'cuiller', 'laser', 'éther', 'cancer']);

  /* ---------- Distance entre deux mots ---------- */
  function distance(a, b) {
    const n = a.length, m = b.length;
    if (!n) return m;
    if (!m) return n;
    let pr = [];
    for (let j = 0; j <= m; j++) pr[j] = j;
    for (let i = 1; i <= n; i++) {
      const cur = [i];
      for (let j = 1; j <= m; j++) cur[j] = Math.min(pr[j] + 1, cur[j - 1] + 1, pr[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      pr = cur;
    }
    return pr[m];
  }
  const prefixe = (a, b) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return a.slice(0, i); };
  // radical commun : le mot sans une des terminaisons de la liste (null si aucune)
  function radical(w, fins) {
    const l = fins.slice().sort((x, y) => y.length - x.length);
    for (const f of l) if (w.endsWith(f) && w.length > f.length) return w.slice(0, w.length - f.length);
    return null;
  }
  // radicaux comparés sans le e de -ger ni la cédille de -cer (mangeait / mangé, commença / commencer)
  const radNorm = r => r.replace(/ge$/, 'g').replace(/ç$/, 'c');
  function memeRadical(a, b, fins) {
    const l = fins.slice().sort((x, y) => y.length - x.length);
    for (const fa of l) {
      if (!a.endsWith(fa) || a.length <= fa.length) continue;
      const ra = radNorm(a.slice(0, a.length - fa.length));
      for (const fb of l) if (fb !== fa && b.endsWith(fb) && b.length > fb.length && radNorm(b.slice(0, b.length - fb.length)) === ra) return [fa, fb];
    }
    return null;
  }

  /* ---------- Classer un écart (mot écrit au lieu du mot attendu) ----------
     Renvoie l'identifiant de la règle la plus probable. prev : mot attendu précédent. */
  const F_IMP = ['aient', 'ais', 'ait'];
  const F_EE = ['er', 'é', 'ée', 'és', 'ées', 'ez', 'ait', 'ais', 'aient', 'ai'];
  const F_PART = ['é', 'ée', 'és', 'ées'];
  const F_IU = ['i', 'is', 'it', 'ie', 'ies', 'u', 'us', 'ut', 'ue', 'ues', 'ît', 'ût'];
  const F_ACC = ['ent', 'es', 'e', 's', 'x', 't', 'd', ''];
  const F_FUT = ['raient', 'rais', 'rait', 'rai', 'ras', 'ra', 'ront', 'rons', 'rez'];
  const F_PS = ['èrent', 'irent', 'urent', 'ât', 'ît', 'ût', 'a', 'at', 'it', 'is', 'ut', 'us', 'as'];
  function classer(attendu, ecrit, prev) {
    const a = min(attendu), b = min(ecrit), p = prev ? min(prev) : '';
    if (a === b) return 'LX13';                                                  // seule la majuscule diffère
    const ga = groupeHomo(a), gb = groupeHomo(b);
    if (ga && ga === gb) return ga.r;                                            // homophones grammaticaux
    if (ga && !gb && /^(son|sont|on|ont|et|est|a|à|ou|où|ce|se|la|là|leur|leurs|mais|mes|ces|ses)$/.test(a) && distance(a, b) <= 2) return ga.r;
    // mot invariable, homophone lexical, ou mot d'usage écrit avec une de ses fautes typiques
    const mr = ORT.L.regleMot(a);
    if (mr && (mr !== 'LX14' || ORT.L.fautesMot(a).map(min).indexOf(b) >= 0)) return mr;
    if (a.replace(/ç/g, 'c') === b.replace(/ç/g, 'c')) return 'LX5';
    const xa = sansAcc(a), xb = sansAcc(b);
    if (xa === xb) {
      // accent sur la terminaison en [é] (porté / porte) : terminaison ; sinon accent
      if (/é(e|s|es)?$/.test(a) !== /é(e|s|es)?$/.test(b)) return 'EE2';
      return 'LX3';
    }
    if (xa.replace(/-/g, '') === xb.replace(/[- ]/g, '') || xa.replace(/[- ]/g, '') === xb.replace(/-/g, '')) return 'LX12';
    let r;
    if ((r = memeRadical(a, b, F_IMP))) return r.some(f => f === 'aient') ? 'SV2' : 'SV1';
    if ((r = memeRadical(a, b, F_FUT))) return 'CJ5';
    if ((r = memeRadical(a, b, F_EE))) {
      if (F_PART.indexOf(r[0]) >= 0 && F_PART.indexOf(r[1]) >= 0) {
        if (DET.has(p)) return 'LX7';
        if (ETRE.has(p)) return 'PP1';
        if (AVOIR.has(p)) return a.length > b.length ? 'PP4' : 'PP3';
        return 'PP2';
      }
      if (r[0] === 'er' || r[1] === 'er') return 'EE1';
      return 'EE2';
    }
    // participes en -i / -u (fini, finis, finit) ; un simple écart d'accord (vague / vagues) est traité plus bas
    if ((r = memeRadical(a, b, F_IU)) && (/[tîû]/.test(r.join('')) || r[0].charAt(0) !== r[1].charAt(0))) {
      if (PRONOMS.has(p) && r.every(f => /^(is|it|s|t)$/.test(f))) return 'SV1';
      if (ETRE.has(p)) return 'PP1';
      if (r.some(f => /[îû]/.test(f))) return 'CJ9';
      return 'EE3';
    }
    if ((r = memeRadical(a, b, ['a', 'at', 'ât', 'as']))) return r.indexOf('ât') >= 0 ? 'CJ9' : 'CJ3';
    if ((r = memeRadical(a, b, F_ACC))) {
      if (r.indexOf('ent') >= 0) return 'SV2';
      if (PRONOMS.has(p) || p === 'j’') return 'SV1';
      if (AVOIR.has(p)) return 'PP3';
      if (ETRE.has(p)) return /([éiu]|is|it)(e|s|es)?$/.test(a) ? 'PP1' : 'GN4';
      const fem = f => /e/.test(f);
      if (fem(r[0]) !== fem(r[1])) return 'GN3';
      if (DET.has(p)) return 'GN1';
      return 'GN2';
    }
    if ((r = memeRadical(a, b, F_PS))) return r.some(f => /[îûâ]/.test(f)) ? 'CJ9' : 'CJ3';
    const simple = w => w.replace(/([bcdfglmnprstz])\1/g, '$1');
    if (simple(xa) === simple(xb)) return 'LX2';
    if (xa.length !== xb.length && (xa.startsWith(xb) || xb.startsWith(xa)) && Math.abs(xa.length - xb.length) === 1) {
      const fin = xa.length > xb.length ? xa.slice(-1) : xb.slice(-1);
      if (/[tdsxpcg]/.test(fin)) return 'LX4';
      if (fin === 'e') return 'LX7';
    }
    if (xa.replace(/n([bpm])/g, 'm$1') === xb.replace(/n([bpm])/g, 'm$1')) return 'LX10';
    const son = w => w.replace(/ç/g, 'c').replace(/sc(?=[eiy])/g, 's').replace(/c(?=[eiy])/g, 's').replace(/ss/g, 's').replace(/t(?=ion)/g, 's');
    if (son(a) === son(b) || son(xa) === son(xb)) return 'LX5';
    const yi = w => w.replace(/ill/g, 'y').replace(/y/g, 'i');
    if (yi(xa) === yi(xb)) return 'LX9';
    const gj = w => w.replace(/ge(?=[aou])/g, 'g').replace(/gu(?=[ei])/g, 'g').replace(/qu/g, 'k').replace(/c(?=[aou])/g, 'k').replace(/ph/g, 'f');
    if (gj(xa) === gj(xb)) return 'LX6';
    if (/ment$/.test(xa) && /ment$/.test(xb)) return 'LX8';
    return 'LX14';
  }

  /* ---------- Règle probable d'un mot non annoté (occasions de la dictée brevet) ---------- */
  function regleProbable(mot, prev) {
    const w = min(mot), p = prev ? min(prev) : '';
    if (w.length < 2 && w !== 'a' && w !== 'à') return null;
    const g = groupeHomo(w);
    if (g) return g.r;
    if (ORT.L.invariable(w)) return 'LX1';
    if (DET.has(p) && DET_PL.has(p) && /[sx]$/.test(w)) return 'GN1';
    if (DET.has(p)) return null;
    if (/aient$/.test(w) || /[^m]ent$/.test(w) && (p === 'ils' || p === 'elles')) return 'SV2';
    if (/(ais|ait)$/.test(w) && !NON_VERBES.has(w)) return 'SV1';
    if (/[^aeiou]er$/.test(w) && !NOMS_ER.has(w) && w.length > 3) return 'EE1';
    if (/é(e|s|es)?$/.test(w)) return ETRE.has(p) ? 'PP1' : AVOIR.has(p) ? 'PP3' : 'EE2';
    if (/ez$/.test(w) && p === 'vous') return 'EE2';
    return null;
  }

  /* =====================================================================
     Conjugaison (gabarits combinatoires)
     personnes : 0 je, 1 tu, 2 il / elle / on, 3 nous, 4 vous, 5 ils / elles
     temps : pr présent, imp imparfait, ps passé simple, fut futur, cond conditionnel,
             pc passé composé, pqp plus-que-parfait (auxiliaire + participe)
     ===================================================================== */
  const T_PR1 = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
  const T_IMP = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'];
  const T_PS1 = ['ai', 'as', 'a', 'âmes', 'âtes', 'èrent'];
  const T_PSI = ['is', 'is', 'it', 'îmes', 'îtes', 'irent'];
  const T_FUT = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
  // verbes irréguliers : présent, radical de l'imparfait, passé simple, radical du futur, participe, auxiliaire être
  const IRR = {
    'être': { pr: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], imp: 'ét', ps: ['fus', 'fus', 'fut', 'fûmes', 'fûtes', 'furent'], fut: 'ser', pp: 'été' },
    avoir: { pr: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], imp: 'av', ps: ['eus', 'eus', 'eut', 'eûmes', 'eûtes', 'eurent'], fut: 'aur', pp: 'eu' },
    aller: { pr: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], imp: 'all', ps: T_PS1.map(f => 'all' + f), fut: 'ir', pp: 'allé', etre: true },
    faire: { pr: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], imp: 'fais', ps: T_PSI.map(f => 'f' + f), fut: 'fer', pp: 'fait' },
    prendre: { pr: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], imp: 'pren', ps: T_PSI.map(f => 'pr' + f), fut: 'prendr', pp: 'pris' },
    apprendre: { pr: ['apprends', 'apprends', 'apprend', 'apprenons', 'apprenez', 'apprennent'], imp: 'appren', ps: T_PSI.map(f => 'appr' + f), fut: 'apprendr', pp: 'appris' },
    comprendre: { pr: ['comprends', 'comprends', 'comprend', 'comprenons', 'comprenez', 'comprennent'], imp: 'compren', ps: T_PSI.map(f => 'compr' + f), fut: 'comprendr', pp: 'compris' },
    venir: { pr: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], imp: 'ven', ps: ['vins', 'vins', 'vint', 'vînmes', 'vîntes', 'vinrent'], fut: 'viendr', pp: 'venu', etre: true },
    revenir: { pr: ['reviens', 'reviens', 'revient', 'revenons', 'revenez', 'reviennent'], imp: 'reven', ps: ['revins', 'revins', 'revint', 'revînmes', 'revîntes', 'revinrent'], fut: 'reviendr', pp: 'revenu', etre: true },
    tenir: { pr: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'], imp: 'ten', ps: ['tins', 'tins', 'tint', 'tînmes', 'tîntes', 'tinrent'], fut: 'tiendr', pp: 'tenu' },
    voir: { pr: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], imp: 'voy', ps: T_PSI.map(f => 'v' + f), fut: 'verr', pp: 'vu' },
    pouvoir: { pr: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], imp: 'pouv', ps: ['pus', 'pus', 'put', 'pûmes', 'pûtes', 'purent'], fut: 'pourr', pp: 'pu' },
    vouloir: { pr: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], imp: 'voul', ps: ['voulus', 'voulus', 'voulut', 'voulûmes', 'voulûtes', 'voulurent'], fut: 'voudr', pp: 'voulu' },
    devoir: { pr: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], imp: 'dev', ps: ['dus', 'dus', 'dut', 'dûmes', 'dûtes', 'durent'], fut: 'devr', pp: 'dû' },
    savoir: { pr: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], imp: 'sav', ps: ['sus', 'sus', 'sut', 'sûmes', 'sûtes', 'surent'], fut: 'saur', pp: 'su' },
    partir: { pr: ['pars', 'pars', 'part', 'partons', 'partez', 'partent'], imp: 'part', ps: T_PSI.map(f => 'part' + f), fut: 'partir', pp: 'parti', etre: true },
    sortir: { pr: ['sors', 'sors', 'sort', 'sortons', 'sortez', 'sortent'], imp: 'sort', ps: T_PSI.map(f => 'sort' + f), fut: 'sortir', pp: 'sorti', etre: true },
    dormir: { pr: ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], imp: 'dorm', ps: T_PSI.map(f => 'dorm' + f), fut: 'dormir', pp: 'dormi' },
    courir: { pr: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], imp: 'cour', ps: ['courus', 'courus', 'courut', 'courûmes', 'courûtes', 'coururent'], fut: 'courr', pp: 'couru' },
    dire: { pr: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], imp: 'dis', ps: T_PSI.map(f => 'd' + f), fut: 'dir', pp: 'dit' },
    lire: { pr: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], imp: 'lis', ps: ['lus', 'lus', 'lut', 'lûmes', 'lûtes', 'lurent'], fut: 'lir', pp: 'lu' },
    'écrire': { pr: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], imp: 'écriv', ps: T_PSI.map(f => 'écriv' + f), fut: 'écrir', pp: 'écrit' },
    mettre: { pr: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'], imp: 'mett', ps: T_PSI.map(f => 'm' + f), fut: 'mettr', pp: 'mis' },
    ouvrir: { pr: ['ouvre', 'ouvres', 'ouvre', 'ouvrons', 'ouvrez', 'ouvrent'], imp: 'ouvr', ps: T_PSI.map(f => 'ouvr' + f), fut: 'ouvrir', pp: 'ouvert' },
    'découvrir': { pr: ['découvre', 'découvres', 'découvre', 'découvrons', 'découvrez', 'découvrent'], imp: 'découvr', ps: T_PSI.map(f => 'découvr' + f), fut: 'découvrir', pp: 'découvert' },
    croire: { pr: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], imp: 'croy', ps: ['crus', 'crus', 'crut', 'crûmes', 'crûtes', 'crurent'], fut: 'croir', pp: 'cru' },
    entendre: null, attendre: null, descendre: null, rendre: null, 'répondre': null, perdre: null, vendre: null
  };
  // verbes du 1er groupe conjugués avec être aux temps composés
  const AUX_ETRE = new Set(['arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'monter', 'retourner', 'descendre', 'aller', 'venir', 'revenir', 'partir', 'sortir', 'naître', 'mourir', 'devenir']);
  const GROUPE2 = new Set(['finir', 'choisir', 'grandir', 'rougir', 'remplir', 'réussir', 'saisir', 'obéir', 'ralentir', 'bondir', 'franchir', 'rajeunir', 'pâlir', 'réfléchir', 'surgir', 'atterrir', 'envahir', 'blêmir', 'jaillir', 'nourrir', 'gravir', 'applaudir', 'avertir']);

  // conjugaison d'un verbe régulier (1er groupe, 2e groupe, verbes en -dre)
  function regulier(inf) {
    if (GROUPE2.has(inf)) {
      const r = inf.slice(0, -2);
      return { pr: ['is', 'is', 'it', 'issons', 'issez', 'issent'].map(f => r + f), imp: r + 'iss', ps: T_PSI.map(f => r + f), fut: inf, pp: r + 'i' };
    }
    if (/dre$/.test(inf)) {
      const r = inf.slice(0, -2);
      return { pr: ['s', 's', '', 'ons', 'ez', 'ent'].map(f => r + f), imp: r, ps: T_PSI.map(f => r + f), fut: inf.slice(0, -1), pp: r + 'u' };
    }
    // 1er groupe : -ger garde le e et -cer prend une cédille devant a et o
    const r = inf.slice(0, -2);
    const devantAO = /ger$/.test(inf) ? r + 'e' : /cer$/.test(inf) ? r.slice(0, -1) + 'ç' : r;
    const pr = T_PR1.map((f, i) => (i === 3 ? devantAO : r) + f);
    const ps = T_PS1.map((f, i) => (i === 5 ? r : devantAO) + f);
    return { pr, imp: r, impAO: devantAO, ps, fut: inf, pp: r + 'é' };
  }
  function table(inf) { return IRR[inf] || regulier(inf); }
  // forme conjuguée d'un temps simple
  function conj(inf, temps, p) {
    const t = table(inf);
    switch (temps) {
      case 'pr': return t.pr[p];
      case 'imp': return ((p === 3 || p === 4) ? t.imp : (t.impAO || t.imp)) + T_IMP[p];
      case 'ps': return t.ps[p];
      case 'fut': return t.fut + T_FUT[p];
      case 'cond': return t.fut + T_IMP[p];
      default: return '';
    }
  }
  const auxEtre = inf => AUX_ETRE.has(inf) || !!(IRR[inf] && IRR[inf].etre);
  // participe passé accordé (g : 'm' | 'f', pl : booléen)
  function participe(inf, g, pl) {
    const b = table(inf).pp;
    if (b === 'dû') return g === 'f' ? (pl ? 'dues' : 'due') : (pl ? 'dus' : 'dû');
    let f = b + 'e', mp = b + 's';
    if (/s$/.test(b)) mp = b;                                        // pris, mis
    return g === 'f' ? (pl ? f + 's' : f) : (pl ? mp : b);
  }

  /* ---------- Noms et adjectifs ---------- */
  function pluriel(s) {
    if (/[sxz]$/.test(s)) return s;
    if (/(eau|au|eu)$/.test(s) && !/(bleu|pneu)$/.test(s)) return s + 'x';
    if (/al$/.test(s) && !/(bal|carnaval|festival|chacal|récital|régal)$/.test(s)) return s.slice(0, -2) + 'aux';
    if (/^(bijou|caillou|chou|genou|hibou|joujou|pou)$/.test(s)) return s + 'x';
    return s + 's';
  }
  // adjectif : { ms, fs, mp, fp } (formes données ou calculées)
  const ADJ_IRR = { vieux: ['vieille', 'vieux', 'vieilles'], beau: ['belle', 'beaux', 'belles'], nouveau: ['nouvelle', 'nouveaux', 'nouvelles'],
    long: ['longue', 'longs', 'longues'], frais: ['fraîche', 'frais', 'fraîches'], gentil: ['gentille', 'gentils', 'gentilles'],
    blanc: ['blanche', 'blancs', 'blanches'], sec: ['sèche', 'secs', 'sèches'], doux: ['douce', 'doux', 'douces'], faux: ['fausse', 'faux', 'fausses'],
    roux: ['rousse', 'roux', 'rousses'], gros: ['grosse', 'gros', 'grosses'], bas: ['basse', 'bas', 'basses'], épais: ['épaisse', 'épais', 'épaisses'],
    public: ['publique', 'publics', 'publiques'], neuf: ['neuve', 'neufs', 'neuves'], bref: ['brève', 'brefs', 'brèves'], fou: ['folle', 'fous', 'folles'], mou: ['molle', 'mous', 'molles'], favori: ['favorite', 'favoris', 'favorites'] };
  function formesAdj(ms) {
    if (ADJ_IRR[ms]) { const x = ADJ_IRR[ms]; return { ms, fs: x[0], mp: x[1], fp: x[2] }; }
    let fs;
    if (/e$/.test(ms)) fs = ms;
    else if (/eux$/.test(ms)) fs = ms.slice(0, -1) + 'se';
    else if (/if$/.test(ms)) fs = ms.slice(0, -1) + 've';
    else if (/(el|eil|ien|on|et)$/.test(ms) && !/(complet|inquiet|secret|discret|concret)$/.test(ms)) fs = ms + ms.slice(-1) + 'e';
    else if (/(complet|inquiet|secret|discret|concret)$/.test(ms)) fs = ms.slice(0, -2) + 'ète';
    else if (/er$/.test(ms)) fs = ms.slice(0, -2) + 'ère';
    else fs = ms + 'e';
    const mp = /[sx]$/.test(ms) ? ms : /al$/.test(ms) && !/(natal|naval|fatal|banal)$/.test(ms) ? ms.slice(0, -2) + 'aux' : /eau$/.test(ms) ? ms + 'x' : ms + 's';
    return { ms, fs, mp, fp: fs + 's' };
  }
  const adj = (ms, g, pl) => formesAdj(ms)[(g === 'f' ? 'f' : 'm') + (pl ? 'p' : 's')];

  /* ---------- Formes fautives plausibles d'un mot piège ---------- */
  const R_VOY = /^[aeiouyhéèêàâîôûœ]/i;
  // ajoute / retire les marques du genre et du nombre
  function variantesAccord(w) {
    if (/eux$/.test(w)) return [w.slice(0, -1) + 'se', w.slice(0, -1) + 'ses'];
    if (/euses?$/.test(w)) return [w.replace(/euses?$/, 'eux'), /s$/.test(w) ? w.slice(0, -1) : w + 's'];
    if (/aux$/.test(w)) return [w.slice(0, -3) + 'al', w.slice(0, -3) + 'ales'];
    if (/es$/.test(w)) return [w.slice(0, -1), w.slice(0, -2) + 's'];
    if (/e$/.test(w)) return [w + 's', w.slice(0, -1)];
    if (/s$/.test(w)) return [w.slice(0, -1), w.slice(0, -1) + 'es'];
    return [w + 's', w + 'e'];
  }
  function fautesAuto(mot, r) {
    const w = mot, x = min(w), fam = r.slice(0, 2);
    const homo = fautesHomo(w);
    if (fam === 'HO' || r === 'GN6') return homo;
    const lx = ORT.L.fautesMot(x);
    if (lx.length) return lx.map(y => casse(w, y));
    let rd;
    switch (r) {
      case 'EE1':
        if ((rd = radical(w, ['er']))) return [rd + 'é', rd + 'ait'];
        if ((rd = radical(w, F_PART))) return [rd + 'er', rd + 'ait'];
        break;
      case 'EE2':
        if ((rd = radical(w, ['aient', 'ait', 'ais']))) return [rd + 'é', rd + 'er'];
        if ((rd = radical(w, ['ez']))) return [rd + 'er', rd + 'é'];
        if ((rd = radical(w, F_PART))) return [rd + 'er', rd + 'ait'];
        if ((rd = radical(w, ['er']))) return [rd + 'é', rd + 'ez'];
        break;
      case 'EE3': {
        const s = [['is', 'it', 'i'], ['it', 'is', 'i'], ['i', 'is', 'it'], ['us', 'ut', 'u'], ['ut', 'us', 'u'], ['u', 'us', 'ut']];
        for (const [f, a, b] of s) if (w.endsWith(f)) return [w.slice(0, -f.length) + a, w.slice(0, -f.length) + b];
        break;
      }
      case 'CJ3': case 'CJ9': case 'CJ4': {
        const s = [['èrent', 'airent', 'aient'], ['irent', 'ires', 'it'], ['urent', 'ures', 'ut'], ['ât', 'a', 'at'], ['ît', 'it', 'is'], ['ût', 'ut', 'us'],
          ['ai', 'ais', 'ait'], ['it', 'is', 'ît'], ['ut', 'us', 'ût'], ['a', 'at', 'ât'], ['is', 'it', 'î'], ['us', 'ut', 'ût']];
        for (const [f, a, b] of s) if (w.endsWith(f)) return [w.slice(0, -f.length) + a, w.slice(0, -f.length) + b];
        break;
      }
      case 'CJ5': {
        const s = [['raient', 'rait', 'ront'], ['rais', 'rai', 'rait'], ['rait', 'ra', 'rais'], ['rai', 'rais', 'ré'], ['ront', 'rons', 'raient'], ['ra', 'rat', 'rait']];
        for (const [f, a, b] of s) if (w.endsWith(f)) return [w.slice(0, -f.length) + a, w.slice(0, -f.length) + b];
        break;
      }
      case 'CJ7':
        if (/e$/.test(w)) return [w + 's', w.slice(0, -1) + 'é'];
        if (/s$/.test(w)) return [w.slice(0, -1), w.slice(0, -1) + 't'];
        break;
      case 'PP1': case 'PP2': case 'PP3': case 'PP4': case 'PP5': case 'GN2': case 'GN3': case 'GN4': case 'GN5':
        if (/é$/.test(w) && r === 'PP3') return [w + 's', w.slice(0, -1) + 'er'];
        return variantesAccord(w);
      case 'PP6':
        if (/ant$/.test(w)) return [w + 's', w + 'e'];
        if (/ants?$|antes?$/.test(w)) return [w.replace(/ant(e?s?)$/, 'ant'), w.replace(/ants?$/, 'antes')];
        break;
      case 'GN1':
        if (/aux$/.test(w)) return [w.slice(0, -3) + 'al', w.slice(0, -3) + 'als'];
        if (/x$/.test(w)) return [w.slice(0, -1), w.slice(0, -1) + 's'];
        if (/es$/.test(w)) return [w.slice(0, -1), w.slice(0, -1) + 'nt'];
        if (/s$/.test(w)) return [w.slice(0, -1)];
        break;
      case 'LX3': {
        const l = uniques([sansAcc(w), w.replace(/[éèê]/, m => (m === 'é' ? 'è' : 'é')), w.replace(/[âêîôû]/, m => sansAcc(m))]).filter(y => y !== w);
        if (l.length) return l;
        break;
      }
      case 'LX2': {
        const m = /([bcdfglmnprstz])\1/.exec(w);
        if (m) return [w.slice(0, m.index) + w.slice(m.index + 1)];
        const n = /[aeiouéè]([lmnprt])[aeiouéè]/.exec(w);
        if (n) return [w.slice(0, n.index + 2) + n[1] + w.slice(n.index + 2)];
        break;
      }
      case 'LX4': if (/[tdsxp]$/.test(w)) return [w.slice(0, -1)]; break;
      case 'LX5': {
        const l = uniques([w.replace('ç', 'c'), w.replace('ss', 's'), w.replace(/([aeiou])s([aeiou])/, '$1ss$2'), w.replace(/c([ei])/, 's$1'), w.replace(/tion/, 'sion')]).filter(y => y !== w);
        if (l.length) return l;
        break;
      }
      case 'LX7': if (/ée$/.test(w)) return [w.slice(0, -1), w.slice(0, -2) + 'ai']; if (/té$/.test(w)) return [w + 'e']; break;
      case 'LX8': if (/emment$/.test(w)) return [w.replace('emment', 'ement'), w.replace('emment', 'amment')]; if (/amment$/.test(w)) return [w.replace('amment', 'ament'), w.replace('amment', 'emment')]; break;
      case 'LX9': return uniques([w.replace('y', 'i'), w.replace('y', 'ill')]).filter(y => y !== w);
      case 'LX10': return uniques([w.replace(/m([bpm])/, 'n$1')]).filter(y => y !== w);
      case 'LX12': return uniques([w.replace(/-/g, ' '), w.replace(/-/g, '')]).filter(y => y !== w);
      case 'LX13': return [estMaj(w) ? w.toLowerCase() : cap(w)];
      default: break;
    }
    // repli : variantes d'accord ou de terminaison
    if (/(aient|ait|ais)$/.test(w)) { rd = radical(w, ['aient', 'ait', 'ais']); return [rd + 'ait', rd + 'aient', rd + 'ais'].filter(y => y !== w); }
    return homo.length ? homo : variantesAccord(w);
  }
  // fautes d'un piège : données, sinon calculées ; sans doublon ni le mot juste
  function fautesPiege(mot, r, donnees) {
    const l = donnees && donnees.length ? donnees : fautesAuto(mot, r);
    return uniques(l.map(apo)).filter(y => min(y) !== min(mot) || (r === 'LX13' && y !== mot)).slice(0, 3);
  }
  // début donné du mot (« J'écris la fin du mot ») : partie commune à toutes les formes, au moins une lettre à écrire
  function debutMot(mot, r, fautes) {
    if (r.slice(0, 2) === 'HO' || r === 'GN6' || r === 'LX13' || mot.length <= 3) return '';
    const formes = [mot].concat(fautes || []);
    let d = formes.reduce((p, f) => prefixe(p, f), mot);
    const court = Math.min.apply(null, formes.map(f => f.length));
    if (d.length > court - 1) d = d.slice(0, court - 1);
    if (d.length > mot.length - 1) d = mot.slice(0, mot.length - 1);
    // on s'arrête au radical : l'élève écrit toute la terminaison (rentr|aient, port|er)
    for (const l of [F_IMP, F_EE, F_FUT, F_PS, F_IU, F_ACC]) {
      const rd = radical(mot, l);
      if (rd && rd.length >= 2 && d.startsWith(rd)) return rd;
    }
    return d;
  }

  /* ---------- Lire une phrase annotée ---------- */
  // marques collées au mot : @k (verbe), #k (sujet), &k (antécédent de « qui »)
  function lireMarques(s) {
    const m = { verbe: null, sujet: [], ante: [] };
    const reste = s.replace(/([@#&])(\d+)/g, (x, c, k) => {
      if (c === '@') m.verbe = +k; else if (c === '#') m.sujet.push(+k); else m.ante.push(+k);
      return '';
    });
    return { reste, m };
  }
  function poserMarques(tok, m) {
    if (m.verbe != null) tok.verbe = m.verbe;
    if (m.sujet.length) tok.sujet = m.sujet;
    if (m.ante.length) tok.ante = m.ante;
  }
  // phrase annotée → jetons ; decal : décalage des numéros de verbes (pour enchaîner les phrases)
  function lirePhrase(src, decal) {
    decal = decal || 0;
    const toks = [];
    const re = /\{([^}]*)\}((?:[@#&]\d+)*)|([^\s{]+)/g;
    let x;
    const decaler = m => { if (m.verbe != null) m.verbe += decal; m.sujet = m.sujet.map(k => k + decal); m.ante = m.ante.map(k => k + decal); return m; };
    while ((x = re.exec(src))) {
      if (x[1] != null) {
        const p = x[1].split('|'), v = apo(p[0]), r = p[1];
        const fautes = fautesPiege(v, r, p[2] ? p[2].split('/') : null);
        const deb = p[3] != null && p[3] !== '' ? apo(p[3]) : debutMot(v, r, fautes);
        const tok = { v, m: true, piege: { r, fautes, deb } };
        poserMarques(tok, decaler(lireMarques(x[2] || '').m));
        toks.push(tok);
      } else {
        const { reste, m } = lireMarques(x[3]);
        const morceaux = decouper(reste);
        const mots = morceaux.filter(t => t.m);
        if (mots.length) poserMarques(mots[mots.length - 1], decaler(m));
        morceaux.forEach(t => toks.push(t));
      }
    }
    return toks;
  }

  /* =====================================================================
     Gabarits combinatoires
     { th, t: 'modèle', S: [sujets], V: [verbes], T: [temps], N: [noms], A: [adjectifs], I: [infinitifs], … }
     Emplacements du modèle :
       [S] [S2]        sujet (pronom, ou « les pêcheurs/mp », « ma sœur/fs », « Léa et moi/1p »)
       [V] [V2]        verbe accordé avec S (ou S2), au temps T (ou T2) ; [V.pc] : temps imposé
       [N.det] [N2.det] groupe nominal : det = le, un, les, des, son, leur, ce, mon (nombre au hasard
                       si le déterminant ne l'impose pas) ; nom donné « filet/m », « barque/f »
       [A] [A2]        adjectif accordé avec N (ou N2) ; [A.S] : attribut, accordé avec S
       [I]             infinitif (après une préposition)
     Le texte autour peut contenir des pièges écrits directement : {et|HO2}.
     ===================================================================== */
  const PRONOM_P = { je: 0, 'j’': 0, tu: 1, il: 2, elle: 2, on: 2, nous: 3, vous: 4, ils: 5, elles: 5 };
  // sujet → { txt, p, g, pl }
  function lireSujet(s) {
    const [txt, gn] = s.split('/');
    if (PRONOM_P[txt] != null) {
      const p = PRONOM_P[txt];
      return { txt, p, g: /elle/.test(txt) ? 'f' : 'm', pl: p >= 3, pronom: true };
    }
    const g = gn && gn[0] === 'f' ? 'f' : 'm';
    if (gn === '1p') return { txt, p: 3, g: 'm', pl: true };
    if (gn === '2p') return { txt, p: 4, g: 'm', pl: true };
    const pl = !!gn && gn[1] === 'p';
    return { txt, p: pl ? 5 : 2, g, pl };
  }
  // règle et fautes d'un verbe conjugué à un temps simple
  function piegeVerbe(inf, temps, p, forme) {
    const h = groupeHomo(forme);
    if (h && /^(a|est|sont|ont|peut|peux|sait|sais|met)$/.test(forme)) return { r: h.r, f: fautesHomo(forme) };
    let r;
    if (temps === 'ps') r = p === 0 ? 'CJ4' : 'CJ3';
    else if (temps === 'fut' || temps === 'cond') r = 'CJ5';
    else if (p === 5) r = 'SV2';
    else if (temps === 'pr' && p === 4 && !IRR[inf] && /er$/.test(inf)) r = 'EE2';
    else if (temps === 'pr') r = IRR[inf] || /dre$/.test(inf) ? 'CJ1' : 'SV1';
    // imparfait du 1er groupe à la 3e personne : -ait / -é / -er
    else if (p === 2 && !IRR[inf] && !GROUPE2.has(inf) && !/dre$/.test(inf)) r = 'EE2';
    else r = p <= 1 ? 'SV1' : 'CJ2';
    let f = uniques([0, 1, 2, 5].map(q => conj(inf, temps, q))).filter(y => y !== forme);
    if (r === 'EE2' && temps === 'imp') f = [table(inf).pp, inf].concat(f);
    if (temps === 'pr' && p === 4) f = [inf, table(inf).pp];
    if (temps === 'fut') f.unshift(conj(inf, 'cond', p));
    if (temps === 'cond') f.unshift(conj(inf, 'fut', p));
    if (temps === 'ps') f = fautesAuto(forme, 'CJ3').concat(f);
    if (p === 0 && temps === 'ps') f.unshift(conj(inf, 'imp', 0));
    return { r, f: uniques(f).filter(y => y !== forme).slice(0, 3) };
  }
  const piege = (v, r, f, marques) => '{' + v + '|' + r + '|' + uniques(f).filter(y => y !== v).join('/') + '}' + (marques || '');
  // mots d'un sujet, marqués #k ; le nom d'un sujet pluriel est un piège GN1
  function texteSujet(s, k, debut) {
    const mots = s.txt.split(' ');
    return mots.map((w, i) => {
      const ww = debut && i === 0 ? cap(w) : w;
      if (!s.pronom && s.pl && i === mots.length - 1 && mots.length > 1 && /[sx]$/.test(w) && DET_PL.has(mots[i - 1])) {
        return piege(ww, 'GN1', fautesAuto(ww, 'GN1'), '#' + k);
      }
      return ww + '#' + k;
    }).join(' ');
  }
  // nom « filet/m » → { s, p, g }
  function lireNom(n) { const [s, g, p] = n.split('/'); return { s, g: g || 'm', p: p || pluriel(s) }; }
  const DETS = {
    le: (g, pl, v) => (pl ? 'les' : v ? 'l’' : g === 'f' ? 'la' : 'le'),
    un: (g, pl) => (pl ? 'des' : g === 'f' ? 'une' : 'un'),
    son: (g, pl, v) => (pl ? 'ses' : g === 'f' && !v ? 'sa' : 'son'),
    mon: (g, pl, v) => (pl ? 'mes' : g === 'f' && !v ? 'ma' : 'mon'),
    leur: (g, pl) => (pl ? 'leurs' : 'leur'),
    ce: (g, pl, v) => (pl ? 'ces' : g === 'f' ? 'cette' : v ? 'cet' : 'ce'),
    // possessif accordé avec la personne du sujet (je → mon, ils → leur…)
    poss: (g, pl, v, p) => [['mon', 'ma', 'mes'], ['ton', 'ta', 'tes'], ['son', 'sa', 'ses'], ['notre', 'notre', 'nos'], ['votre', 'votre', 'vos'], ['leur', 'leur', 'leurs']][p][pl ? 2 : g === 'f' && !v ? 1 : 0]
  };
  const DET_PIEGE = { les: null, ses: ['HO7', ['ces', 'c’est']], ces: ['HO7', ['ses', 'c’est']], leurs: ['HO9', ['leur']], leur: ['HO9', ['leurs']],
    son: ['HO3', ['sont']], mes: ['HO10', ['mais']], ce: ['HO6', ['se']] };

  // instancie un gabarit : renvoie la phrase annotée (même notation que la banque)
  function instancier(gab, decal) {
    decal = decal || 0;
    const ch = {};                                   // choix faits pour chaque emplacement
    const liste = (cle) => { const l = gab[cle]; return Array.isArray(l) ? l : String(l || '').split(',').map(s => s.trim()).filter(Boolean); };
    // un verbe [V2] (ou un possessif [N2.poss]) s'accorde avec [S2] s'il existe, sinon avec [S]
    const aSujet = d => (d && gab.t.indexOf('[S' + d + ']') >= 0 ? d : '');
    const sujetDe = d => { const c = 'S' + (d || ''); if (!ch[c]) ch[c] = lireSujet(tirer(liste(c).length ? liste(c) : liste('S'))); return ch[c]; };
    // premier passage : noms (nombre, genre), pour accorder les adjectifs placés avant eux
    // déterminant au pluriel : nombre imposé ; « le1 », « un1 »… : singulier imposé ; sinon au hasard
    const BASE = { les: 'le', des: 'un', ses: 'son', leurs: 'leur', ces: 'ce', mes: 'mon' };
    gab.t.replace(/\[N(\d?)\.(\w+)\]/g, (x, d, det) => {
      const n = lireNom(tirer(liste('N' + d)));
      let base = det, pl;
      if (BASE[det]) { base = BASE[det]; pl = true; } else if (/1$/.test(det)) { base = det.slice(0, -1); pl = false; } else pl = Math.random() < 0.55;
      ch['N' + d] = { n, det: base, pl };
      return x;
    });
    const sortie = gab.t.replace(/\[(S|V|N|A|I)(\d?)(?:\.(\w+))?\]/g, (x, typ, d, opt, pos) => {
      const debut = pos === 0;
      // numéro du verbe pour l'aide « verbe → sujet » : celui de son sujet (V2 sans S2 → sujet 1)
      const k = decal + (+(typ === 'V' ? aSujet(d) : d) || 1);
      if (typ === 'S') {
        // sujet repris (« …, puis [S] … ») : un nom devient le pronom personnel correspondant
        const s = sujetDe(d);
        ch['vu' + d] = (ch['vu' + d] || 0) + 1;
        if (ch['vu' + d] > 1 && !s.pronom) {
          const pr = ['je', 'tu', s.g === 'f' ? 'elle' : 'il', 'nous', 'vous', s.g === 'f' ? 'elles' : 'ils'][s.p];
          return (debut ? cap(pr) : pr) + '#' + k;
        }
        return texteSujet(s, k, debut);
      }
      if (typ === 'V') {
        const s = sujetDe(aSujet(d)), inf = tirer(liste('V' + d).length ? liste('V' + d) : liste('V'));
        // temps : imposé, sinon tiré dans T2 (ou T) ; sans T2, V2 garde le temps de V
        const temps = opt || (liste('T' + d).length ? tirer(liste('T' + d)) : ch.temps || tirer(liste('T').length ? liste('T') : ['imp']));
        if (!d) ch.temps = temps;
        // élision du sujet « je » devant une voyelle : traitée dans le texte final
        if (temps === 'pc' || temps === 'pqp') {
          const aux = auxEtre(inf) ? 'être' : 'avoir';
          const fa = conj(aux, temps === 'pc' ? 'pr' : 'imp', s.p);
          const pa = piegeVerbe(aux, temps === 'pc' ? 'pr' : 'imp', s.p, fa);
          const ra = pa.r.slice(0, 2) === 'HO' ? pa.r : 'CJ6';
          if (aux === 'être') {
            const pp = participe(inf, s.g, s.pl);
            const fp = uniques([participe(inf, 'm', false), participe(inf, 'f', false), participe(inf, 'm', true), participe(inf, 'f', true)]).filter(y => y !== pp);
            return piege(fa, ra, pa.f, '@' + k) + ' ' + piege(pp, 'PP1', fp.slice(0, 2));
          }
          const pp = participe(inf, 'm', false);
          const accord = participe(inf, s.g, true) !== pp ? participe(inf, s.g, true) : participe(inf, 'f', false);
          return piege(fa, ra, pa.f, '@' + k) + ' ' + piege(pp, /é$/.test(pp) ? 'PP3' : 'EE3', /é$/.test(pp) ? [accord, inf] : fautesAuto(pp, 'EE3'));
        }
        const forme = conj(inf, temps, s.p);
        const pv = piegeVerbe(inf, temps, s.p, forme);
        return piege(debut ? cap(forme) : forme, pv.r, pv.f.map(y => (debut ? cap(y) : y)), '@' + k);
      }
      if (typ === 'N') {
        const c = ch['N' + d], n = c.n, v = R_VOY.test(n.s);
        let det = DETS[c.det] ? DETS[c.det](n.g, c.pl, v, sujetDe(aSujet(d)).p) : c.det;
        const nom = c.pl ? n.p : n.s;
        if (debut) det = cap(det);
        const dp = DET_PIEGE[min(det)];
        const tDet = dp ? piege(det, dp[0], dp[1].map(y => casse(det, y))) : det;
        const tNom = c.pl && nom !== n.s ? piege(nom, 'GN1', [n.s].concat(/e$/.test(n.s) ? [n.s + 'nt'] : [])) : nom;
        return (det === 'l’' || det === 'L’') ? tDet + tNom : tDet + ' ' + tNom;
      }
      if (typ === 'A') {
        let g, pl, r = 'GN2';
        if (opt === 'S') { const s = sujetDe(''); g = s.g; pl = s.pl; r = 'GN4'; } else { const c = ch['N' + d]; g = c.n.g; pl = c.pl; }
        const a = tirer(liste('A' + d).length ? liste('A' + d) : liste('A'));
        const fo = formesAdj(a), juste = fo[(g === 'f' ? 'f' : 'm') + (pl ? 'p' : 's')];
        const autres = uniques([pl ? fo[(g === 'f' ? 'f' : 'm') + 's'] : fo[(g === 'f' ? 'f' : 'm') + 'p'], g === 'f' ? fo[pl ? 'mp' : 'ms'] : fo[pl ? 'fp' : 'fs']]).filter(y => y !== juste);
        return autres.length ? piege(juste, r, autres) : juste;
      }
      if (typ === 'I') {
        const inf = tirer(liste('I' + d).length ? liste('I' + d) : liste('I'));
        return /er$/.test(inf) ? piege(inf, 'EE1', [inf.slice(0, -2) + 'é', inf.slice(0, -2) + 'ait']) : inf;
      }
      return x;
    });
    // élisions : je, que, de + voyelle → j’, qu’, d’ (le jeton « j’ » se colle au mot suivant à l'affichage)
    return sortie.replace(/(^|\s)([Jj])e(#\d+) (\{?)(?=[aeiouyéèêâîôh])/g, '$1$2’$3 $4')
      .replace(/(^|\s)([Qq]u|[Dd])e (\{?)(?=[aeiouyéèêâîô])/g, '$1$2’ $3');
  }

  /* ---------- Rectifications de 1990 : les deux orthographes sont acceptées ----------
     accent circonflexe sur i et u (connaitre, gout, ile…), sauf dû, mûr, sûr, jeûne, passé simple
     (-îmes, -ûtes…) et subjonctif imparfait (qu'il fût, qu'il prît) ; quelques variantes. */
  const VARIANTES = { 'événement': 'évènement', 'événements': 'évènements', 'oignon': 'ognon', 'nénuphar': 'nénufar', 'clé': 'clef', 'clés': 'clefs' };
  function rectif(juste, ecrit) {
    if (VARIANTES[juste] === ecrit || VARIANTES[ecrit] === juste) return true;
    if (!/[îû]/.test(juste) || juste.replace(/î/g, 'i').replace(/û/g, 'u') !== ecrit) return false;
    if (/^(dû|mûr|sûr|jeûnes?|mûrs|sûrs)$/i.test(juste)) return false;
    if (/(îmes|ûmes|îtes|ûtes)$/.test(juste)) return false;
    if (/[îû]t$/.test(juste) && !/aît$/.test(juste)) return false;
    return true;
  }
  // le mot écrit est-il juste ? (apostrophe droite acceptée, rectifications de 1990)
  const egal = (juste, ecrit) => apo(juste) === apo(ecrit) || rectif(apo(juste), apo(ecrit));

  /* =====================================================================
     Comparaison d'une copie avec le texte (alignement mot à mot)
     ===================================================================== */
  function coutSub(a, b) {
    if (a.v === b.v) return 0;
    if (a.m !== b.m) return 2.5;
    if (!a.m) return 0.9;
    const x = sansAcc(min(a.v)), y = sansAcc(min(b.v));
    if (x === y) return 0.2;
    return 0.4 + 0.8 * distance(x, y) / Math.max(x.length, y.length);
  }
  // ref, cop : jetons → paires [iRef | -1, iCop | -1]
  function aligner(ref, cop) {
    const n = ref.length, m = cop.length, d = [];
    for (let i = 0; i <= n; i++) { d.push(new Float64Array(m + 1)); d[i][0] = i; }
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + coutSub(ref[i - 1], cop[j - 1]));
    }
    const out = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && Math.abs(d[i][j] - (d[i - 1][j - 1] + coutSub(ref[i - 1], cop[j - 1]))) < 1e-9) { out.push([i - 1, j - 1]); i--; j--; }
      else if (i > 0 && Math.abs(d[i][j] - (d[i - 1][j] + 1)) < 1e-9) { out.push([i - 1, -1]); i--; }
      else { out.push([-1, j - 1]); j--; }
    }
    return out.reverse();
  }
  // compare la copie au texte : paires, erreurs classées
  // erreur : { iRef, attendu, ecrit, r, tag, ponct }
  // jetons de comparaison : « j’ » + « aimais » → « j’aimais » (comme l'élève l'écrit) ; io : indice du jeton d'origine
  function pourComparer(ref) {
    const out = [];
    for (let i = 0; i < ref.length; i++) {
      const t = ref[i], n = ref[i + 1];
      if (t.m && /’$/.test(t.v) && n && n.m) { out.push(Object.assign({}, n, { v: t.v + n.v, io: i + 1 })); i++; }
      else out.push(Object.assign({}, t, { io: i }));
    }
    return out;
  }
  function comparer(refBrut, copieTexte) {
    const ref = pourComparer(refBrut), cop = decouper(copieTexte);
    const paires = aligner(ref, cop), erreurs = [];
    let prev = '';
    paires.forEach(([k, j]) => {
      const a = k >= 0 ? ref[k] : null, b = j >= 0 ? cop[j] : null, i = a ? a.io : -1;
      if (a && b && (a.v === b.v || (a.m && b.m && rectif(a.v, b.v)))) { if (a.m) prev = a.v; return; }
      const ponct = (a && !a.m) || (b && !b.m);
      if (ponct) {
        if ((a && PONCT_LIBRE.has(a.v) && (!b || PONCT_LIBRE.has(b.v))) || (!a && PONCT_LIBRE.has(b.v))) return;
        erreurs.push({ iRef: i, attendu: a ? a.v : '—', ecrit: b ? b.v : '—', r: 'LX13', tag: 'ponctuation', ponct: true });
        return;
      }
      // mot piège : sa règle (sauf si seule la majuscule diffère) ; sinon la règle la plus probable
      if (a && b) erreurs.push({ iRef: i, attendu: a.v, ecrit: b.v, r: min(a.v) === min(b.v) ? 'LX13' : a.piege ? a.piege.r : classer(a.v, b.v, prev) });
      else if (a) erreurs.push({ iRef: i, attendu: a.v, ecrit: '—', r: a.piege ? a.piege.r : (regleProbable(a.v, prev) || 'LX14'), tag: 'mot oublié' });
      else erreurs.push({ iRef: -1, attendu: '—', ecrit: b.v, r: 'LX14', tag: 'mot en trop' });
      if (a) prev = a.v;
    });
    return { paires: paires.map(([k, j]) => [k >= 0 ? ref[k].io : -1, j]), erreurs, copie: cop };
  }

  ORT.L = {
    NBSP, apo, min, sansAcc, cap, casse, hasard, tirer, melanger, uniques,
    decouper, joindre, espaceAvant, lirePhrase, egal, rectif, instancier, comparer, aligner, classer, regleProbable,
    fautesPiege, debutMot, groupeHomo, conj, participe, adj, formesAdj, pluriel, lireSujet,
    // mots du fichier mots.js (formes fautives des mots d'usage, mots invariables)
    fautesMot: w => { const M = window.ORTHO_MOTS; return (M && M.fautes[w]) || []; },
    regleMot: w => { const M = window.ORTHO_MOTS; return (M && M.regles[w]) || null; },
    invariable: w => { const M = window.ORTHO_MOTS; return !!(M && M.regles[w] === 'LX1'); }
  };
})();
