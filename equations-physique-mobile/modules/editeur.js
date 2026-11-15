/* ============================================================
   Équations en physique (smartphone) — éditeur d'équation à tuiles (objet EPM.ED)
   (moteur repris du module 4 « entraînement » de l'application
   equations-en-physique : modules/module_9.html)
   ------------------------------------------------------------
   Modèle d'un membre de l'équation (nœuds) :
     { kind:'seq', slots:[…] }            produit de zones multipliées entre elles
     { kind:'simple', items:[tuile…] }    zone plate de tuiles { id, label }
     { kind:'frac', num, den }            fraction (num et den : n'importe quel nœud)
     { kind:'sum', terms:[{ sign, node }] } somme signée de termes (node : seq)
     { kind:'func', fn, n?, inner }       fonction appliquée à un contenu :
        sq, sqrt, cube, cbrt, pow (n), proot (puissance 1/n), sin, asin,
        cos, acos, tan, atan, log, pow10, ln, exp
   L'élève déplace les tuiles (glisser-déposer, assets/dragdrop.js) et utilise
   les outils de la réserve (fraction, parenthèses, ×(−1), fonctions
   réciproques, 1/x) ; « Vérifier l'étape » contrôle l'équation obtenue avec
   des valeurs tirées au hasard (exercice.sample) ; la question est finie
   quand la grandeur cherchée est seule, à gauche, sans 1 inutile.
   Les règles de déplacement sont celles de aide-rules.js, le comportement
   commun des tuiles celui de tuiles.js (copies de l'application equations-en-physique).

   API :
     EPM.ED.monter(zone, exercice, rappels)   affiche l'éditeur dans zone
        exercice : { tiles:[tuile], initialLeft(), initialRight(), targetId, sample(),
                     funcTools:['sqrt', 'pow:4', 'inv'…], needsParenTool }
        rappels  : { surErreur(), surEtape(), surResolu(), surRefus(msg) }
     EPM.ED.statique(noeud)                   HTML figé d'un membre
     EPM.ED.ligne(gauche, droite)             HTML figé d'une équation
     EPM.ED.evaluer(noeud, valeurs)           valeur numérique d'un membre
     EPM.ED.fin()                             l'éditeur affiché ne répond plus (question terminée)
     EPM.ED.ops                               opérations (tests automatiques)
   Une seule équation éditable à la fois dans la page.
   ============================================================ */
(function () {
  'use strict';
  const EPM = window.EPM = window.EPM || {};

function tile(id,label){ return {id,label}; }
function simple(items){ return { kind:'simple', items: items.map(t => ({...t})) }; }
function frac(num, den){ return { kind:'frac', num: Array.isArray(num) ? simple(num) : num, den: Array.isArray(den) ? simple(den) : den }; }
function seq(slots){ return { kind:'seq', slots }; }
function emptySeq(){ return seq([simple([])]); }
function term1(sign, slots){ return { sign, node: seq(slots) }; }
function sumNode(terms){ return { kind:'sum', terms: terms.map(t => ({ sign:t.sign, node:t.node })) }; }
function func(fn, inner, n){ const f = { kind:'func', fn, inner }; if (n) f.n = n; return f; }
function idsOf(items){ return items.map(i => i.id); }

// fonctions et leur réciproque (les puissances sont traitées à part : voir annule)
const RECIPROCAL = { sin:'asin', asin:'sin', cos:'acos', acos:'cos', tan:'atan', atan:'tan', log:'pow10', pow10:'log', ln:'exp', exp:'ln' };
// exposant d'une fonction puissance (carré, racine, cube, racine cubique, puissance n, puissance 1/n)
function exposant(fn, n) {
    return { sq: 2, sqrt: 1 / 2, cube: 3, cbrt: 1 / 3 }[fn] || (fn === 'pow' ? n : fn === 'proot' ? 1 / n : null);
}
// un outil « fn:n » (ex. 'pow:4', 'proot:4') : { fn, n }
function outil(t) { const p = String(t).split(':'); return { fn: p[0], n: p[1] ? +p[1] : undefined }; }
// l'outil annule-t-il cette fonction ? (même opération réciproque, ou exposants inverses : (x⁴)^(1/4) = x)
function annule(o, f) {
    if (!f || f.kind !== 'func') return false;
    if (RECIPROCAL[o.fn]) return RECIPROCAL[o.fn] === f.fn;
    const a = exposant(o.fn, o.n), b = exposant(f.fn, f.n);
    return a != null && b != null && Math.abs(a * b - 1) < 1e-9;
}
const EXP = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶' };
function libelleOutil(t) {
    const o = outil(t);
    if (o.fn === 'pow') return 'x' + (EXP[o.n] || '<sup>' + o.n + '</sup>');
    if (o.fn === 'proot') return 'x<sup>1/' + o.n + '</sup>';
    return { sqrt:'√', sq:'x²', cube:'x³', cbrt:'∛', sin:'sin', asin:'Arcsin', cos:'cos', acos:'Arccos', tan:'tan', atan:'Arctan',
        log:'log', pow10:'10ˣ', ln:'ln', exp:'eˣ', inv:'1/x' }[o.fn];
}
// dans la réserve, sous l'outil : la fonction qu'il annule (sauf carré et racine carrée, bien connus)
function noteOutil(t) {
    const o = outil(t);
    if (o.fn === 'pow') return 'réciproque de x<sup>1/' + o.n + '</sup>';
    if (o.fn === 'proot') return 'réciproque de x' + (EXP[o.n] || '<sup>' + o.n + '</sup>');
    return { cube:'réciproque de ∛', cbrt:'réciproque de x³', sin:'réciproque de Arcsin', asin:'réciproque de sin',
        cos:'réciproque de Arccos', acos:'réciproque de cos', tan:'réciproque de Arctan', atan:'réciproque de tan',
        log:'réciproque de 10ˣ', pow10:'réciproque de log', ln:'réciproque de eˣ', exp:'réciproque de ln', inv:'inverse les deux membres' }[o.fn] || '';
}
// nom écrit devant les parenthèses d'une fonction
const FUNC_NAME = { log:'log', ln:'ln', sin:'sin', asin:'Arcsin', cos:'cos', acos:'Arccos', tan:'tan', atan:'Arctan' };
// message affiché quand on essaie de déplacer un terme qui ne peut pas bouger (tuiles.js)
const afficherRefus = msg => { hadError = true; erreur(); showFeedback(msg, false); };
// rappels de la page (séance, découverte)
let rappels = {};
const erreur = () => { if (rappels.surErreur) rappels.surErreur(); };
// racine de l'éditeur affiché, et ses parties
let racine = null;
const part = cls => racine ? racine.querySelector('.' + cls) : null;

// libellé d'une tuile : la grandeur, avec sa puissance (v², T⁴) ; pow : exposant entier ≥ 2
const lab = it => it.label + (it.pow ? (EXP[it.pow] || '<sup>' + it.pow + '</sup>') : '');
function staticFracHtml(num, den) {
    return `<span class="frac-wrap-static"><span class="frac-num-static">${num}</span><span class="frac-line-static"></span><span class="frac-den-static">${den}</span></span>`;
}

// ═══════════════════════════════════════════════════════════════
// ÉTAT GLOBAL
// ═══════════════════════════════════════════════════════════════
let state = { left: emptySeq(), right: emptySeq() };
// « ↶ Annuler » : revient à l'équation d'avant la dernière action (../tuiles.js)
const annul = EPT.historique(() => document.querySelectorAll('.ep-annuler'));
function annulerAction() {
    if (resolved) return;
    const prec = annul.annuler();
    if (prec) { state = prec; refreshView(); }
}
let history = [];
let resolved = false;
let stepOneValidated = false;
let currentExercise = null;
let hadError = false;
let activeHighlightId = null;
let signsToFlash = [];

function getNode(path) {
    const parts = path.split('.');
    let cur = parts[0] === 'left' ? state.left : state.right;
    for (let i = 1; i < parts.length; i++) {
        if (!cur) return null;
        const p = parts[i];
        if (/^term\d+$/.test(p)) cur = cur.terms[+p.slice(4)].node;
        else if (/^\d+$/.test(p)) cur = cur.slots ? cur.slots[+p] : undefined;
        else cur = cur[p];
    }
    return cur || null;
}
function setNode(path, newNode) {
    const parts = path.split('.');
    if (parts.length === 1) { state[parts[0]] = newNode; return; }
    const parent = getNode(parts.slice(0, -1).join('.'));
    const last = parts[parts.length - 1];
    if (/^term\d+$/.test(last)) parent.terms[+last.slice(4)].node = newNode;
    else if (/^\d+$/.test(last)) parent.slots[+last] = newNode;
    else parent[last] = newNode;
}

// ═══════════════════════════════════════════════════════════════
// AFFICHAGE
// ═══════════════════════════════════════════════════════════════
function isOperatorTile(it) { return it.id === 'plus' || it.id === 'minus' || it.id === 'times'; }
function wrapParens(innerHtml) {
    return `<span class="paren-wrap"><span class="paren-bracket paren-open">(</span><span class="paren-content">${innerHtml}</span><span class="paren-bracket paren-close">)</span></span>`;
}
function sizeParens(container) {
    container.querySelectorAll('.paren-wrap').forEach(wrap => {
        const content = wrap.querySelector('.paren-content');
        if (!content) return;
        const h = content.offsetHeight || 24;
        const scale = Math.max(1, h / 22);
        wrap.querySelectorAll('.paren-bracket').forEach(b => { b.style.transform = `scaleY(${scale.toFixed(2)})`; });
    });
}
function renderInsertZone(sidePath, where) {
    return `<div class="insert-zone" data-side="${sidePath}" data-where="${where}"></div>`;
}
function isSumIsolated(sumPath) {
    const parentPath = sumPath.split('.').slice(0, -1).join('.');
    const parent = getNode(parentPath);
    if (!parent || parent.kind !== 'seq' || parent.slots.length !== 1) return false;
    if (parent.parenthesized) return false;
    return true;
}
function denHasRealContent(node) {
    if (isSlotEmpty(node.den)) return false;
    if (node.den.kind === 'simple' && node.den.items.length === 1 && node.den.items[0].id === 'one') return false;
    return true;
}
// contenu d'une fonction (racine, carré, log...) : toujours figé (une seule
// entité, non démontable tant que la fonction n'est pas retirée) ; une
// fraction s'y écrit en fraction (numérateur au-dessus du dénominateur), sauf
// dans un exposant (enLigne) où elle reste en ligne (num/den) pour rester petite ;
// une somme à plusieurs termes reçoit des parenthèses quand demandé
function renderInlineNode(node, staticMode, enLigne) {
    if (node.kind === 'frac') {
        const num = renderInlineNode(node.num, staticMode, enLigne), den = renderInlineNode(node.den, staticMode, enLigne);
        if (enLigne) return `<span class="inline-frac">${num}<span class="inline-frac-slash">/</span>${den}</span>`;
        if (staticMode) return staticFracHtml(num, den);
        return `<span class="frac-wrap frac-fonction"><span class="frac-num-wrap">${num}</span><span class="frac-line"></span><span class="frac-den-wrap">${den}</span></span>`;
    }
    if (node.kind === 'sum') {
        const inner = node.terms.map((t, i) => {
            const showSign = i > 0 || t.sign === -1;
            const signChar = t.sign === -1 ? '−' : '+';
            return (showSign ? `<span class="sum-sign">${signChar}</span>` : '') + renderInlineNode(t.node, staticMode, enLigne);
        }).join('');
        return `<span class="sum-wrap">${inner}</span>`;
    }
    if (node.kind === 'seq') {
        return node.slots.map((s, i) => (i === 0 ? '' : '<span class="mult-sign">×</span>') + renderInlineNode(s, staticMode, enLigne)).join('');
    }
    if (node.kind === 'simple') {
        // dans l'editeur actif : meme apparence qu'une tuile normale (pas de
        // gris "desactive") meme si elle n'est pas manipulable tant que la
        // fonction englobante est la ; dans un texte statique (intro,
        // historique) : texte noir simple, sans encadre, comme le reste de
        // l'equation figee
        if (node.items.length === 0) return '<span class="slot-placeholder">…</span>';
        const tileClass = staticMode ? 'eq-tile-static' : 'eq-tile-locked';
        return node.items.map((it, idx) => {
            const sep = (idx > 0 && !isOperatorTile(node.items[idx - 1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
            return sep + `<span class="${tileClass}">${lab(it)}</span>`;
        }).join('');
    }
    if (node.kind === 'func') return renderFunc(node, staticMode, enLigne);
    return renderStatic(node);
}
// une fonction et son contenu (racine, carré, cube, racine cubique, puissance de 10,
// exponentielle, log, ln, sin, Arcsin) : les parenthèses d'une fonction nommée
// prennent la hauteur de tout son contenu (sizeParens) ; l'exposant de 10 et de e
// est écrit en haut, en petit
function renderFunc(node, staticMode, enLigne) {
    const inner = (parens, ligne) => renderFuncInner(node.inner, parens, staticMode, ligne || enLigne);
    // exposant : parenthèses dès que le contenu n'est pas une seule grandeur
    const puiss = e => `<span class="func-wrap">${renderFuncInner(node.inner, 'tout', staticMode, enLigne)}<span class="func-exp">${e}</span></span>`;
    switch (node.fn) {
        case 'sqrt': return `<div class="sqrt-wrap"><svg class="sqrt-hook"></svg><div class="sqrt-inner">${inner(false)}</div></div>`;
        case 'cbrt': return `<div class="sqrt-wrap"><span class="cbrt-index">3</span><svg class="sqrt-hook"></svg><div class="sqrt-inner">${inner(false)}</div></div>`;
        case 'sq':   return puiss('2');
        case 'cube': return puiss('3');
        case 'pow':  return puiss(String(node.n));
        case 'proot': return puiss('1/' + node.n);
        case 'pow10': return `<span class="func-wrap pow-wrap"><span class="pow-base">10</span><span class="func-exp-inner">${inner(true, true)}</span></span>`;
        case 'exp':   return `<span class="func-wrap pow-wrap"><span class="pow-base">e</span><span class="func-exp-inner">${inner(true, true)}</span></span>`;
    }
    return `<span class="func-wrap"><span class="func-name">${FUNC_NAME[node.fn]}</span>${wrapParens(inner(false))}</span>`;
}
function renderFuncInner(inner, parensIfSum, staticMode, enLigne) {
    let n = inner;
    while (n.kind === 'seq' && n.slots.length === 1) n = n.slots[0];
    const html = renderInlineNode(n, staticMode, enLigne);
    if (parensIfSum && n.kind === 'sum' && n.terms.length > 1) return wrapParens(html);
    // 'tout' (puissance) : parenthèses aussi autour d'une fraction ou d'un produit
    if (parensIfSum === 'tout' && (n.kind === 'frac' || n.kind === 'seq' || (n.kind === 'simple' && n.items.length > 1))) return wrapParens(html);
    return html;
}
function renderNode(node, path) {
    if (node.kind === 'simple') {
        const items = node.items.map((it, idx) => {
            const hl = (activeHighlightId && it.id === activeHighlightId) ? ' tile-highlight' : '';
            const sep = (idx > 0 && !isOperatorTile(node.items[idx-1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
            return sep + `<span class="eq-tile${hl}" data-path="${path}" data-idx="${idx}">
                ${lab(it)}<span class="tile-del"
                    onpointerdown="event.stopPropagation()"
                    onclick="event.stopPropagation();EPM.ED._sup('${path}',${idx})">✕</span>
            </span>`;
        }).join('');
        return `<div class="slot-simple" data-path="${path}">
                    ${items || '<span class="slot-placeholder">…</span>'}
                </div>`;
    }
    if (node.kind === 'frac') {
        const showDenCross = (node.den.kind === 'simple' && node.den.items.length === 1 && node.den.items[0].id === 'one')
            || (isSlotEmpty(node.den) && node.forceDenCross);
        const draggableDen = denHasRealContent(node);
        return `<div class="frac-wrap">
            <div class="frac-num-wrap">${renderNode(node.num, path + '.num')}</div>
            <div class="frac-line"></div>
            <div class="frac-den-wrap${draggableDen ? ' den-draggable' : ''}" data-frac-path="${path}">
                ${showDenCross ? `<span class="frac-del"
                    onclick="EPM.ED._supDen('${path}')"
                    ontouchstart="event.stopPropagation()"
                    ontouchend="event.stopPropagation();event.preventDefault();EPM.ED._supDen('${path}')"
                    title="Supprimer le dénominateur">✕</span>` : ''}
                ${renderNode(node.den, path + '.den')}
            </div>
        </div>`;
    }
    if (node.kind === 'sum') {
        // aucun terme restant (tous deplaces de l'autre cote) : on l'affiche
        // explicitement au lieu de laisser un vide
        if (node.terms.length === 0) {
            return `<span class="sum-wrap sum-zero" data-path="${path}">0</span>`;
        }
        // un seul terme : ce n'est plus une somme a proprement parler mais un
        // simple signe devant un contenu multiplicatif ; chaque facteur a
        // l'interieur doit rester individuellement manipulable (ex. -λ×t), donc
        // pas de bloc .sum-term qui bloquerait le glisser-deposer des tuiles.
        // Seul le signe (s'il est negatif) reste saisissable pour deplacer le
        // terme entier de l'autre cote.
        if (node.terms.length === 1) {
            const t = node.terms[0];
            const signHtml = t.sign === -1
                ? `<span class="sum-sign sum-sign-drag" data-sum-path="${path}" data-term-idx="0">−</span>`
                : '';
            // si le terme se reduit a une seule grandeur (pas un produit de
            // plusieurs facteurs), la glisser doit deplacer le terme additif
            // (signe inverse), pas l'extraire comme un facteur multiplicatif
            let flat = t.node;
            while (flat.kind === 'seq' && flat.slots.length === 1) flat = flat.slots[0];
            const singleTile = flat.kind === 'simple' && flat.items.length === 1;
            return `<span class="sum-wrap${singleTile ? ' sum-term-single' : ''}" data-path="${path}" data-term-idx="0">${signHtml}${renderNode(t.node, path + '.term0')}</span>`;
        }
        const isolated = isSumIsolated(path);
        const inner = node.terms.map((t, i) => {
            const showSign = i > 0 || t.sign === -1;
            const signChar = t.sign === -1 ? '−' : '+';
            const signHtml = showSign ? `<span class="sum-sign" data-sum-path="${path}" data-term-idx="${i}">${signChar}</span>` : '';
            return `<span class="sum-term${isolated ? ' term-draggable' : ''}" data-path="${path}" data-term-idx="${i}">${signHtml}${renderNode(t.node, path + '.term' + i)}</span>`;
        }).join('');
        return `<span class="sum-wrap" data-path="${path}">${inner}</span>`;
    }
    if (node.kind === 'func') {
        // fonction qui multiplie d'autres facteurs (e^(λt) × N, (T/2π)² × g) : elle se déplace en bloc
        const par = path.split('.').slice(0, -1).join('.'), p = par && getNode(par);
        if (p && p.kind === 'seq' && p.slots.length > 1) return `<span class="func-bloc" data-bloc-path="${path}">${renderFunc(node, false)}</span>`;
        return renderFunc(node, false);
    }
    // seq
    let html = '';
    const n = node.slots.length;
    // zones de dépôt à côté d'une fraction, d'une somme ou d'une fonction (pour y ajouter un facteur)
    const avecZone = k => k === 'frac' || k === 'sum' || k === 'func';
    const needsInsertBefore = avecZone(node.slots[0].kind);
    const needsInsertAfter  = avecZone(node.slots[n-1].kind);
    if (needsInsertBefore) html += renderInsertZone(path, 'start');
    let inner = '';
    node.slots.forEach((slot, i) => {
        if (i > 0) inner += '<span class="mult-sign">×</span>';
        const parens = !node.parenthesized && slot.kind === 'sum' && slot.terms.length > 1 && n > 1;
        inner += parens ? wrapParens(renderNode(slot, path + '.' + i)) : renderNode(slot, path + '.' + i);
    });
    html += node.parenthesized ? wrapParens(inner) : inner;
    if (needsInsertAfter) html += renderInsertZone(path, 'end');
    return `<div class="eq-side" data-path="${path}">${html}</div>`;
}
function renderStatic(node) {
    if (node.kind === 'simple') {
        if (node.items.length === 0) return '<span class="slot-placeholder">…</span>';
        return node.items.map((it, idx) => {
            const sep = (idx > 0 && !isOperatorTile(node.items[idx-1]) && !isOperatorTile(it)) ? '<span class="mult-sign">×</span>' : '';
            return sep + `<span class="eq-tile-static">${lab(it)}</span>`;
        }).join('');
    }
    if (node.kind === 'frac') {
        return `<div class="frac-wrap">
            <div class="frac-num-wrap">${renderStatic(node.num)}</div>
            <div class="frac-line"></div>
            <div class="frac-den-wrap">${renderStatic(node.den)}</div>
        </div>`;
    }
    if (node.kind === 'sum') {
        if (node.terms.length === 0) return `<span class="sum-wrap sum-zero">0</span>`;
        const inner = node.terms.map((t, i) => {
            const showSign = i > 0 || t.sign === -1;
            const signChar = t.sign === -1 ? '−' : '+';
            return (showSign ? `<span class="sum-sign">${signChar}</span>` : '') + renderStatic(t.node);
        }).join('');
        return `<span class="sum-wrap">${inner}</span>`;
    }
    if (node.kind === 'func') return renderFunc(node, true);
    return `<div class="eq-side">${node.slots.map((s,i) => (i===0?'':'<span class="mult-sign">×</span>') + renderStatic(s)).join('')}</div>`;
}
function renderEquationZone() {
    const zone = part('ed-zone');
    if (!zone) return;
    zone.innerHTML =
        renderNode(state.left, 'left') +
        `<div class="eq-sign">=</div>` +
        renderNode(state.right, 'right') +
        `<button class="flip-btn" onclick="EPM.ED._inverser()" title="Inverser le sens de l'équation">⇄</button>`;
    attachEqTileHandlers(zone);
    sizeSqrtHooks(zone);
    sizeParens(zone);
    if (signsToFlash.length) {
        signsToFlash.forEach(({ sidePath, termIdx }) => {
            const el = zone.querySelector(`.sum-sign[data-sum-path="${sidePath}"][data-term-idx="${termIdx}"]`);
            if (el) { el.classList.add('just-flipped'); setTimeout(() => el.classList.remove('just-flipped'), 1300); }
            let termEl = zone.querySelector(`.sum-term[data-path="${sidePath}"][data-term-idx="${termIdx}"]`);
            if (!termEl && termIdx === 0) termEl = zone.querySelector(`.sum-wrap[data-path="${sidePath}"]`);
            if (!termEl) {
                // la structure a change (ex. simplification automatique une fois
                // le signe redevenu positif) : impossible de cibler precisement
                // le terme, on fait clignoter tout le membre pour que le
                // changement de signe reste toujours visible
                termEl = zone.querySelector(`.eq-side[data-path="${sidePath.split('.')[0]}"]`);
            }
            if (termEl) { termEl.classList.add('term-flash'); setTimeout(() => termEl.classList.remove('term-flash'), 1300); }
        });
        signsToFlash = [];
    }
}
function sizeSqrtHooks(container) {
    // crochet commun (../fiches.js) : sa hauteur suit celle du contenu (../fiches.css), même affiché plus tard
    EPF.crochets(container);
}
function attachEqTileHandlers(zone) {
    // terme dans une fonction : on peut l'attraper, mais il ne bouge pas (message tout de suite),
    // sauf s'il fait partie d'un bloc qui, lui, se déplace (dénominateur, terme additif)
    zone.querySelectorAll('.eq-tile-locked').forEach(el => {
        if (!el.closest('.den-draggable, .term-draggable, .sum-term-single, .func-bloc')) EPT.bloquer(el, EPT.MSG_FONCTION, afficherRefus);
    });
    zone.querySelectorAll('.func-bloc').forEach(el => {
        if (el.closest('.den-draggable, .term-draggable, .sum-term-single')) return;
        enableTileDrag(el, { type:'bloc', from: el.dataset.blocPath });
    });
    zone.querySelectorAll('.eq-tile').forEach(el => {
        // terme dans une parenthèse : même chose
        if (el.closest('.paren-wrap') && !el.closest('.den-draggable, .term-draggable')) { EPT.bloquer(el, EPT.MSG_PAREN, afficherRefus); return; }
        // une tuile a l'interieur d'un terme additif d'une somme a plusieurs
        // termes (.sum-term, isolee ou non) ne doit jamais etre glissable
        // individuellement : ce genre de terme ne se deplace qu'en bloc (via
        // .sum-term.term-draggable une fois isole), jamais facteur par facteur
        if (el.closest('.sum-term')) return;
        if (el.closest('.frac-den-wrap.den-draggable')) return;
        // une somme reduite a un seul terme qui n'est lui-meme qu'une seule
        // grandeur (pas un produit de plusieurs facteurs) : la glisser doit
        // deplacer le terme additif entier (signe inverse), exactement comme
        // la poignee de signe, et non l'extraire comme un simple facteur
        const singleTermWrap = el.closest('.sum-wrap.sum-term-single');
        if (singleTermWrap) {
            const sumPath = singleTermWrap.dataset.path;
            const termIdx = parseInt(singleTermWrap.dataset.termIdx, 10);
            const sum = getNode(sumPath);
            const t = sum && sum.terms[termIdx];
            if (!t) return;
            enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
            return;
        }
        const path = el.dataset.path;
        const idx = parseInt(el.dataset.idx, 10);
        const node = getNode(path);
        const it = node && node.items[idx];
        if (!it) return;
        enableTileDrag(el, { type:'move', from:path, idx, id:it.id, label:lab(it), item:Object.assign({}, it) }, EPT.appui);
    });
    zone.querySelectorAll('.sum-term.term-draggable').forEach(el => {
        const sumPath = el.dataset.path;
        const termIdx = parseInt(el.dataset.termIdx, 10);
        const sum = getNode(sumPath);
        const t = sum && sum.terms[termIdx];
        if (!t) return;
        enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
    });
    // signe d'une somme reduite a un seul terme negatif : sert de poignee pour
    // deplacer tout le terme (tous ses facteurs) de l'autre cote, sans bloquer
    // le glisser-deposer individuel des facteurs eux-memes (cf. ci-dessus)
    zone.querySelectorAll('.sum-sign-drag').forEach(el => {
        const sumPath = el.dataset.sumPath;
        const termIdx = parseInt(el.dataset.termIdx, 10);
        const sum = getNode(sumPath);
        const t = sum && sum.terms[termIdx];
        if (!t) return;
        enableTileDrag(el, { type:'sumterm', from:sumPath, termIdx, sign:t.sign });
    });
    zone.querySelectorAll('.frac-den-wrap.den-draggable').forEach(el => {
        const fracPath = el.dataset.fracPath;
        enableTileDrag(el, { type:'fracden', from:fracPath });
    });
}
// étapes validées : l'équation de départ, puis chaque étape juste, alignées sur le signe =
function renderHistory() {
    const el = part('ed-hist');
    if (!el) return;
    el.innerHTML = history.map((st, i) => `
        <div class="step-row ed-ligne${i ? '' : ' ed-ligne0'}">
            <span class="ed-g">${renderStatic(st.left)}</span><span class="eq-sign">=</span><span class="ed-d">${renderStatic(st.right)}</span>
            ${i ? '<span class="ed-coche" aria-label="étape juste">✓</span>' : '<span></span>'}
        </div>`).join('');
    sizeSqrtHooks(el);
    sizeParens(el);
}
function updateHint() {}
function refreshView() {
    annul.noter(state);
    renderEquationZone();
    buildPalette();
}
// message sous l'éditeur : juste (vert), faux ou refusé (rouge), vide
function showFeedback(msg, ok) {
    const f = part('ed-retour');
    if (!f) return;
    msg = String(msg || '').replace(/^[✕✓]\s*/, '');
    if (!msg) { f.innerHTML = ''; return; }
    f.innerHTML = '<div class="' + (ok ? 'callout callout-success' : 'callout callout-danger') + '">' + (ok ? '✓ ' : '') + msg + '</div>';
    if (rappels.surMessage) rappels.surMessage(f);
}

// ═══════════════════════════════════════════════════════════════
// GLISSER-DÉPOSER
// ═══════════════════════════════════════════════════════════════
function pruneEmptySlot(path) {
    const parts = path.split('.');
    if (parts.length !== 2) return;
    const side = getNode(parts[0]);
    const idx = +parts[1];
    const slot = side.slots[idx];
    if (slot && slot.kind === 'simple' && slot.items.length === 0 && side.slots.length > 1) {
        side.slots.splice(idx, 1);
    }
}
function applyEmptinessRuleFrac(path, removedId) {
    if (path.endsWith('.num')) return;
    if (path.endsWith('.den')) {
        const fracPath = path.slice(0, -4);
        const fracNode = getNode(fracPath);
        if (removedId === 'one') setNode(fracPath, fracNode.num);
        else fracNode.forceDenCross = true;
    }
}
function deleteDen(fracPath) {
    const fracNode = getNode(fracPath);
    if (!fracNode || fracNode.kind !== 'frac') return;
    if (!isSlotEmpty(fracNode.den) && !fracNode.forceDenCross) return;
    setNode(fracPath, fracNode.num);
    refreshView();
}
function handleEmptied(path, removedId) {
    const parts = path.split('.');
    if (parts.length === 2) pruneEmptySlot(path);
    else applyEmptinessRuleFrac(path, removedId);
}
function processDrop(path, data) {
    if (data.type === 'frac') {
        if (!AideRules.isLegalFracTool(path)) { hadError = true; erreur(); showFeedback(AideRules.MSG_FRAC, false); return; }
        const node = getNode(path);
        if (!node) return;
        if (node.kind === 'simple') {
            const f = frac(node.items, []);
            f.forceDenCross = true;
            setNode(path, f);
        } else if (node.kind === 'seq' && node.parenthesized) {
            const inner = node.slots.length === 1 ? node.slots[0] : seq(node.slots.slice());
            node.slots = [ { kind:'frac', num: inner, den: simple([]), forceDenCross:true } ];
            // la parenthese n'a servi qu'a figer temporairement le contenu en un
            // bloc unique pour pouvoir le mettre au numerateur : la barre de
            // fraction regroupe deja visuellement ce numerateur, un parenthesage
            // supplementaire autour de toute la fraction serait redondant
            node.parenthesized = false;
        } else if (node.kind === 'seq' && node.slots.length === 1 && node.slots[0].kind === 'func') {
            // une fonction (racine, log, sin...) est deja une entite autonome et
            // visuellement delimitee par ses propres parentheses : elle peut
            // directement devenir un numerateur, sans etape de parenthesage
            // prealable (contrairement a une somme, qui doit d'abord etre
            // explicitement parenthesee pour eviter toute ambiguite)
            node.slots = [ { kind:'frac', num: node.slots[0], den: simple([]), forceDenCross:true } ];
        } else {
            return;
        }
        refreshView();
        return;
    }
    const node = getNode(path);
    if (!node || node.kind !== 'simple') return;
    if (data.type === 'move') {
        if (!AideRules.isLegalMove(data.from, path)) { hadError = true; erreur(); showFeedback(AideRules.MSG_MOVE_FRAC, false); return; }
        if (data.from === path) { refreshView(); return; }
        const src = getNode(data.from);
        if (src && src.items[data.idx] && src.items[data.idx].id === data.id) {
            const removedId = src.items[data.idx].id;
            src.items.splice(data.idx, 1);
            if (src.items.length === 0) handleEmptied(data.from, removedId);
        }
    }
    node.items.push(data.item ? Object.assign({}, data.item) : { id: data.id, label: data.label });
    refreshView();
}
function handleInsertDropAt(sidePath, where, data) {
    if (!data || data.type !== 'move') return;
    // même côté : un numérateur sort de sa fraction ; autre côté : un dénominateur passe en facteur
    // (les deux membres sont multipliés par ce terme)
    const memeCote = AideRules.side(data.from) === AideRules.side(sidePath);
    if (memeCote ? !AideRules.isLegalInsert(data.from, sidePath) : AideRules.level(data.from) !== 'den') {
        hadError = true; erreur(); showFeedback(memeCote ? AideRules.MSG_INSERT : AideRules.MSG_MOVE_FRAC, false); return;
    }
    const side = getNode(sidePath);
    if (!side || side.kind !== 'seq') return;
    const src = getNode(data.from);
    if (src && src.items[data.idx] && src.items[data.idx].id === data.id) {
        const removedId = src.items[data.idx].id;
        src.items.splice(data.idx, 1);
        if (src.items.length === 0) handleEmptied(data.from, removedId);
    }
    const newSlot = simple([data.item ? Object.assign({}, data.item) : { id: data.id, label: data.label }]);
    if (where === 'start') side.slots.unshift(newSlot); else side.slots.push(newSlot);
    refreshView();
}
function deleteItem(path, idx) {
    const node = getNode(path);
    if (!node || node.kind !== 'simple') return;
    const removed = node.items[idx];
    if (!removed) return;
    node.items.splice(idx, 1);
    if (node.items.length === 0) handleEmptied(path, removed.id);
    refreshView();
}
function enableTileDrag(el, data, onTap) {
    el._epmDonnees = data;                     // ce que l'élément déplace (tests automatiques)
    let startX = 0, startY = 0;
    el.addEventListener('pointerdown', e => { startX = e.clientX; startY = e.clientY; });
    DragDrop.enable(el, {
        zoneSelector: '.eq-tile, .slot-simple, .insert-zone, .eq-side, .sum-term',
        dragOverClass: 'drag-over',
        onStart: () => {
            if (data.type === 'sumterm' || data.type === 'fracden') {
                document.body.classList.add(data.type === 'sumterm' ? 'sumterm-dragging' : 'fracden-dragging');
                const fromSide = data.from.split('.')[0];
                const src = document.querySelector(`.eq-side[data-path="${fromSide}"]`);
                if (src) src.classList.add('sumterm-source');
            }
        },
        onDrop: (item, zone, evt) => {
            if (data.type === 'sumterm' || data.type === 'fracden') {
                document.body.classList.remove('sumterm-dragging');
                document.body.classList.remove('fracden-dragging');
                document.querySelectorAll('.eq-side.sumterm-source').forEach(e => e.classList.remove('sumterm-source'));
            }
            const moved = Math.hypot(evt.clientX - startX, evt.clientY - startY) > 8;
            if (onTap && !moved) { onTap(); return; }
            if (zone) handleZoneDrop(data, zone);
        },
        onCancel: () => {
            if (data.type === 'sumterm' || data.type === 'fracden') {
                document.body.classList.remove('sumterm-dragging');
                document.body.classList.remove('fracden-dragging');
                document.querySelectorAll('.eq-side.sumterm-source').forEach(e => e.classList.remove('sumterm-source'));
            }
        },
    });
}
// le point exact ou l'on relache un outil peut tomber sur n'importe quel
// descendant (une tuile precise, un terme d'une somme...) : pour les outils
// qui agissent sur un membre ENTIER, on ne se fie pas au DOM (closest() peut
// remonter vers un .eq-side interne, celui d'un terme ou d'un numerateur) mais
// au chemin lui-meme, qui commence toujours par 'left' ou 'right'
function resolveSidePath(zone) {
    const raw = zone.dataset.path || zone.dataset.side;
    return raw ? raw.split('.')[0] : null;
}
// pour l'outil fraction : si le point de depot tombe a l'interieur d'un
// groupe explicitement parenthese, on remonte jusqu'a ce groupe (il doit etre
// traite comme un bloc unique, jamais decompose au moment de le mettre au
// numerateur)
function resolveLockedAncestorPath(rawPath) {
    const parts = rawPath.split('.');
    for (let i = parts.length; i >= 1; i--) {
        const p = parts.slice(0, i).join('.');
        const n = getNode(p);
        if (n && n.kind === 'seq' && n.parenthesized) return p;
    }
    return rawPath;
}
function handleZoneDrop(data, zone) {
    if (data.type === 'sumterm') {
        const side = resolveSidePath(zone);
        if (side === 'left' || side === 'right') processSumTermDrop(side, data);
        return;
    }
    if (data.type === 'fracden') {
        const side = resolveSidePath(zone);
        if (side === 'left' || side === 'right') processFracDenDrop(data.from, side);
        return;
    }
    if (data.type === 'bloc') {
        const side = resolveSidePath(zone);
        if (side === 'left' || side === 'right') processBlocDrop(data.from, side);
        return;
    }
    if (data.type === 'paren') {
        const side = resolveSidePath(zone);
        if (side === 'left' || side === 'right') processParenDrop(side);
        return;
    }
    if (zone.matches('.insert-zone')) {
        handleInsertDropAt(zone.dataset.side, zone.dataset.where, data);
        return;
    }
    if (data.type === 'frac') {
        processDrop(resolveLockedAncestorPath(zone.dataset.path), data);
        return;
    }
    processDrop(zone.dataset.path, data);
}
function flipEquation() {
    if (resolved) return;
    const tmp = state.left;
    state.left = state.right;
    state.right = tmp;
    refreshView();
}
function removeSumTerm(sumPath, termIdx) {
    const sum = getNode(sumPath);
    if (!sum || sum.kind !== 'sum') return null;
    const [removed] = sum.terms.splice(termIdx, 1);
    if (sum.terms.length === 1 && sum.terms[0].sign === 1) {
        let repl = sum.terms[0].node;
        while (repl.kind === 'seq' && repl.slots.length === 1) repl = repl.slots[0];
        setNode(sumPath, repl);
    }
    return removed;
}
// le signe "=" sert de reference stable pour corriger la position du
// fantome apres coup : quand un terme change de cote, le cote qui grossit
// repousse le "=" (et tout ce qui le suit) du meme nombre de pixels que
// l'autre cote a retreci — sans cette correction, le fantome reste a une
// position absolue figee qui finit collee contre le contenu qui vient
// d'arriver de l'autre cote, comme s'il lui appartenait
function captureEqSignRect() {
    const el = (part('ed-zone') && part('ed-zone').querySelector('.eq-sign'));
    return el ? el.getBoundingClientRect() : null;
}
function processSumTermDrop(sidePath, data) {
    if (sidePath !== 'left' && sidePath !== 'right') return;
    if (data.from === sidePath) { refreshView(); return; }
    if (!AideRules.isLegalSumTerm(data.from, sidePath)) { hadError = true; erreur(); showFeedback(AideRules.MSG_SUMTERM, false); return; }
    const srcSum = getNode(data.from);
    const srcTerm = srcSum && srcSum.kind === 'sum' ? srcSum.terms[data.termIdx] : null;
    const showVanishGhost = !!(srcTerm && srcTerm.sign === -1);
    const removed = removeSumTerm(data.from, data.termIdx);
    if (!removed) return;
    const flipped = { sign: -removed.sign, node: removed.node };
    const destSide = getNode(sidePath);
    let destTermIdx;
    // le terme qui arrive se place au plus près du signe = : en tête pour le
    // membre de droite (juste après le =), en fin pour le membre de gauche
    // (juste avant le =)
    if (destSide.slots.length === 1 && destSide.slots[0].kind === 'sum') {
        if (sidePath === 'right') {
            destSide.slots[0].terms.unshift(flipped);
            destTermIdx = 0;
        } else {
            destSide.slots[0].terms.push(flipped);
            destTermIdx = destSide.slots[0].terms.length - 1;
        }
    } else {
        const existing = { sign:1, node: seq(destSide.slots) };
        if (sidePath === 'right') {
            destSide.slots = [ sumNode([flipped, existing]) ];
            destTermIdx = 0;
        } else {
            destSide.slots = [ sumNode([existing, flipped]) ];
            destTermIdx = 1;
        }
    }
    signsToFlash.push({ sidePath: sidePath + '.0', termIdx: destTermIdx });
    refreshView();
    // le "-" qui disparaissait a la source (le terme entier a change de
    // cote) est mime a l'endroit ou le terme vient d'arriver, la ou
    // l'attention de l'eleve se trouve deja juste apres avoir depose
    // l'element — jamais a l'ancien emplacement, que la ligne (centree)
    // peut avoir totalement redistribue par ailleurs
    if (showVanishGhost) flashVanishingSignAtArrival(sidePath, destTermIdx);
}
// "multiplie les deux côtés par le dénominateur" : on retire le dénominateur
// (non vide) d'une fraction et son contenu rejoint, comme facteur
// multiplicatif, le membre entier de l'autre côté
function processFracDenDrop(fracPath, destSidePath) {
    if (destSidePath !== 'left' && destSidePath !== 'right') return;
    if (!AideRules.isLegalSumTerm(fracPath, destSidePath)) { hadError = true; erreur(); showFeedback(AideRules.MSG_FRACDEN, false); return; }
    const fracNode = getNode(fracPath);
    if (!fracNode || fracNode.kind !== 'frac' || !denHasRealContent(fracNode)) return;
    const denContent = fracNode.den;
    // le dénominateur reste affiché, vide, avec une croix : il n'est pas
    // supprimé automatiquement (l'élève clique la croix s'il veut la fraction
    // en moins, comme partout ailleurs dans l'application)
    fracNode.den = simple([]);
    fracNode.forceDenCross = true;
    const dest = getNode(destSidePath);
    const newSlot = denContent.kind === 'seq' ? (denContent.slots.length === 1 ? denContent.slots[0] : seq(denContent.slots.slice())) : denContent;
    dest.slots.push(newSlot);
    refreshView();
}
// une fonction qui multiplie (bloc) passe de l'autre côté : en bas si elle était en haut
// (les deux membres sont divisés par ce bloc), en facteur si elle était en bas
function processBlocDrop(fromPath, destSide) {
    if (AideRules.side(fromPath) === destSide) { refreshView(); return; }
    const parts = fromPath.split('.'), idx = +parts.pop(), par = getNode(parts.join('.'));
    if (!par || par.kind !== 'seq' || !par.slots[idx]) return;
    const enBas = AideRules.level(fromPath) === 'den';
    const bloc = par.slots.splice(idx, 1)[0];
    const dest = getNode(destSide);
    if (enBas) { dest.slots.push(bloc); refreshView(); return; }
    const contenu = dest.slots.length === 1 ? dest.slots[0] : seq(dest.slots.slice());
    if (contenu.kind === 'frac' && dest.slots.length === 1) {
        const d = contenu.den;
        if (isSlotEmpty(d) || (d.kind === 'simple' && d.items.length === 1 && d.items[0].id === 'one')) contenu.den = bloc;
        else contenu.den = seq((d.kind === 'seq' ? d.slots.slice() : [d]).concat([bloc]));
        delete contenu.forceDenCross;
    } else {
        dest.slots = [ frac(contenu, bloc) ];
    }
    refreshView();
}
// traite tout le contenu d'un membre comme un seul bloc (nécessaire avant de
// pouvoir le glisser dans une fraction quand ce n'est pas une simple grandeur)
function processParenDrop(sidePath) {
    if (sidePath !== 'left' && sidePath !== 'right') return;
    const side = getNode(sidePath);
    if (!side || side.kind !== 'seq') return;
    side.parenthesized = true;
    refreshView();
}
// multiplie les deux membres par -1 (change le signe d'une grandeur isolée)
// multiplie UN membre par -1 : par distributivité, chaque terme additif
// change de signe ; aucune tuile "-1" n'apparaît jamais, seul le signe change
// quand un signe "−" affiche va disparaitre completement (la somme se
// simplifie en un contenu positif implicite, sans qu'aucun "+" ne le
// remplace visuellement), le repli habituel (flasher un element du rendu
// final) ne peut rien animer puisque ce signe n'existe plus apres coup : on
// capture sa position AVANT la mutation pour pouvoir quand meme le faire
// tourner, exactement comme les autres signes, avant qu'il ne s'efface
function captureVanishingSignRect(sidePath) {
    const s = getNode(sidePath);
    if (!(s.slots.length === 1 && s.slots[0].kind === 'sum' && s.slots[0].terms.length === 1 && s.slots[0].terms[0].sign === -1)) return null;
    const el = document.querySelector(`.sum-sign[data-sum-path="${sidePath}.0"][data-term-idx="0"]`);
    return el ? el.getBoundingClientRect() : null;
}
function spawnVanishGhost(rect) {
    const ghost = document.createElement('span');
    ghost.textContent = '−';
    ghost.className = 'sum-sign sign-vanish-ghost';
    ghost.style.cssText = `position:fixed; left:${rect.left}px; top:${rect.top}px; width:${rect.width}px; height:${rect.height}px; display:flex; align-items:center; justify-content:center; pointer-events:none; z-index:9999;`;
    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), 1300);
}
function flashVanishingSign(rect, eqBefore) {
    if (eqBefore) {
        const eqAfterEl = (part('ed-zone') && part('ed-zone').querySelector('.eq-sign'));
        if (eqAfterEl) {
            const eqAfter = eqAfterEl.getBoundingClientRect();
            rect = {
                left: rect.left + (eqAfter.left - eqBefore.left),
                top: rect.top + (eqAfter.top - eqBefore.top),
                width: rect.width, height: rect.height,
            };
        }
    }
    spawnVanishGhost(rect);
}
// place le fantome exactement a l'endroit ou le terme deplace vient
// d'arriver (apres le rendu) : sur le signe qui y est desormais affiche s'il
// y en a un, sinon juste avant le terme lui-meme (cas d'un premier terme
// positif implicite, sans aucun signe affiche)
function flashVanishingSignAtArrival(sidePath, termIdx) {
    const sumPath = sidePath + '.0';
    const signEl = document.querySelector(`.sum-sign[data-sum-path="${sumPath}"][data-term-idx="${termIdx}"], .sum-sign-drag[data-sum-path="${sumPath}"][data-term-idx="${termIdx}"]`);
    if (signEl) {
        spawnVanishGhost(signEl.getBoundingClientRect());
        return;
    }
    const termEl = document.querySelector(`.sum-term[data-path="${sumPath}"][data-term-idx="${termIdx}"]`) || document.querySelector(`.eq-side[data-path="${sidePath}"]`);
    if (!termEl) return;
    const r = termEl.getBoundingClientRect();
    spawnVanishGhost({ left: r.left - 20, top: r.top, width: 20, height: r.height });
}
function negateSide(sidePath) {
    if (sidePath !== 'left' && sidePath !== 'right') return;
    const s = getNode(sidePath);
    const vanishRect = captureVanishingSignRect(sidePath);
    const eqBefore = vanishRect ? captureEqSignRect() : null;
    if (s.slots.length === 1 && s.slots[0].kind === 'sum') {
        s.slots[0].terms.forEach((t, i) => {
            t.sign = -t.sign;
            signsToFlash.push({ sidePath: sidePath + '.0', termIdx: i });
        });
        if (s.slots[0].terms.length === 1 && s.slots[0].terms[0].sign === 1) {
            let repl = s.slots[0].terms[0].node;
            while (repl.kind === 'seq' && repl.slots.length === 1) repl = repl.slots[0];
            s.slots[0] = repl;
        }
    } else {
        const innerSeq = s.slots.length === 1 ? seq([s.slots[0]]) : seq(s.slots.slice());
        s.slots = [ sumNode([{ sign: -1, node: innerSeq }]) ];
        signsToFlash.push({ sidePath: sidePath + '.0', termIdx: 0 });
    }
    refreshView();
    if (vanishRect) flashVanishingSign(vanishRect, eqBefore);
}
// applique l'outil (fonction réciproque) aux deux membres : le côté qui
// porte déjà la fonction annulée se déplie, l'autre se retrouve enveloppé
function unwrapSideFunc(side) {
    const s = getNode(side);
    const inner = s.slots[0].inner;
    s.slots = (inner.kind === 'seq') ? inner.slots.slice() : [inner];
}
function wrapSideInFunc(side, fn) {
    const s = getNode(side);
    const inner = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
    s.slots = [ func(fn, inner) ];
}
// aplatit les seq a une seule zone pour retrouver le "vrai" noeud
function flattenSeq(n) {
    while (n.kind === 'seq' && n.slots.length === 1) n = n.slots[0];
    return n;
}
// la grandeur a isoler apparait-elle quelque part dans ce noeud ? sert a
// distinguer, de facon generique, une fonction encore "a demeler" (elle
// contient la grandeur cherchee : isoler d'abord serait la bonne etape) d'une
// fonction qui ne concerne pas du tout cette grandeur (elle appartient a
// l'autre membre, ex. sin(i2) quand on isole i1) : dans ce dernier cas
// l'envelopper avec le reste de l'expression est la seule etape possible,
// jamais une erreur d'etourderie a signaler
function nodeContainsId(node, id) {
    if (node.kind === 'simple') return node.items.some(i => i.id === id);
    if (node.kind === 'func') return nodeContainsId(node.inner, id);
    if (node.kind === 'frac') return nodeContainsId(node.num, id) || nodeContainsId(node.den, id);
    if (node.kind === 'sum') return node.terms.some(t => nodeContainsId(t.node, id));
    return node.slots.some(sl => nodeContainsId(sl, id));
}
// une fonction reciproque n'annule QUE sa fonction exacte, isolee seule de ce
// cote de l'equation : si cette fonction precise est presente mais multipliee
// / divisee par autre chose, ou precedee d'un signe -, l'utiliser directement
// serait ambigu (annuler la fonction, ou l'envelopper avec le reste ?). Ce
// controle est generique (base uniquement sur RECIPROCAL/le noeud 'func'),
// donc valable pour n'importe quelle fonction/reciproque ajoutee plus tard.
// il ne s'applique qu'aux fonctions qui contiennent effectivement la grandeur
// a isoler (targetId) : une fonction similaire trouvee ailleurs, sans lien
// avec cette grandeur, peut toujours etre englobee sans avertissement.
function findNonIsolatedReciprocalMatch(side, o, targetId) {
    const e = exposant(o.fn, o.n);
    const isTargetFunc = n => {
        n = flattenSeq(n);
        // grandeur cherchée élevée à une puissance que l'outil annule (I² dans R × I²)
        if (n.kind === 'simple' && e != null) return n.items.some(it => it.pow && Math.abs(it.pow * e - 1) < 1e-9 && (!targetId || it.id === targetId));
        return annule(o, n) && (!targetId || nodeContainsId(n.inner, targetId));
    };
    // precedee d'un signe - (somme reduite a un seul terme negatif)
    if (side.slots.length === 1 && side.slots[0].kind === 'sum' && side.slots[0].terms.length === 1
        && side.slots[0].terms[0].sign === -1 && isTargetFunc(side.slots[0].terms[0].node)) {
        return 'sign';
    }
    // multipliee par un ou plusieurs autres facteurs (plusieurs zones dans la sequence)
    if (side.slots.length > 1 && side.slots.some(isTargetFunc)) {
        return 'factor';
    }
    // grandeur à une puissance multipliée par d'autres grandeurs dans la même zone (R × I²)
    if (side.slots.length === 1 && side.slots[0].kind === 'simple' && side.slots[0].items.length > 1 && isTargetFunc(side.slots[0])) {
        return 'factor';
    }
    // divisee par quelque chose, ou diviseur de quelque chose (fraction dont
    // le numerateur ou le denominateur est exactement la fonction)
    if (side.slots.length === 1 && side.slots[0].kind === 'frac'
        && (isTargetFunc(side.slots[0].num) || isTargetFunc(side.slots[0].den))) {
        return 'frac';
    }
    return null;
}
// outil appliqué à un membre : la fonction qu'il annule disparaît, sinon le membre entier
// est enveloppé (l'outil se dépose sur les deux membres, l'un après l'autre)
function applyFuncTool(tool, side) {
    if (side !== 'left' && side !== 'right') return;
    if (tool === 'inv') { inverserMembre(side); return; }
    const o = outil(tool);
    const s = getNode(side);
    // une grandeur seule (v, v², T⁴) : la puissance change sur la tuile elle-même,
    // la tuile reste déplaçable (v² = v × v se déplace comme une grandeur)
    const e = exposant(o.fn, o.n);
    if (e != null && s.slots.length === 1 && s.slots[0].kind === 'simple' && s.slots[0].items.length === 1) {
        const it = s.slots[0].items[0], p = (it.pow || 1) * e;
        if (Math.abs(p - Math.round(p)) < 1e-9 && Math.round(p) >= 1) {
            if (Math.round(p) === 1) delete it.pow; else it.pow = Math.round(p);
            refreshView();
            return;
        }
    }
    if (s.slots.length === 1 && annule(o, s.slots[0])) {
        unwrapSideFunc(side);
        refreshView();
        return;
    }
    if (findNonIsolatedReciprocalMatch(s, o, currentExercise && currentExercise.targetId)) {
        hadError = true; erreur();
        showFeedback("✕ Impossible : pour rester simple, une fonction réciproque ne s'utilise que sur la fonction seule, sans rien d'autre autour (pas de signe −, pas de multiplication ni de division). Isole d'abord la fonction.", false);
        return;
    }
    const contenu = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
    s.slots = [ func(o.fn, contenu, o.n) ];
    refreshView();
}
// outil 1/x : on prend l'inverse d'un membre. 1/A devient A, A/B devient B/A,
// tout autre contenu A devient 1/A
function inverserMembre(side) {
    const s = getNode(side);
    const c = s.slots.length === 1 ? s.slots[0] : seq(s.slots.slice());
    if (c.kind === 'frac') {
        const un = c.num.kind === 'simple' && c.num.items.length === 1 && c.num.items[0].id === 'one';
        if (un) s.slots = c.den.kind === 'seq' ? c.den.slots.slice() : [c.den];
        else s.slots = [ frac(c.den, c.num) ];
    } else {
        s.slots = [ frac(simple([tile('one', '1')]), c) ];
    }
    refreshView();
}
function processSqrtDrop() {}

// ═══════════════════════════════════════════════════════════════
// PALETTE
// ═══════════════════════════════════════════════════════════════
function countIdAnywhere(id) {
    function c(node) {
        if (!node) return 0;
        if (node.kind === 'simple') return node.items.filter(i => i.id === id).length;
        if (node.kind === 'func') return c(node.inner);
        if (node.kind === 'frac') return c(node.num) + c(node.den);
        if (node.kind === 'sum') return node.terms.reduce((s, t) => s + c(t.node), 0);
        return node.slots.reduce((s, sl) => s + c(sl), 0);
    }
    return c(state.left) + c(state.right);
}
function addPaletteTile(t) {
    const pal = part('ed-palette');
    const el = document.createElement('div');
    el.className = 'palette-tile';
    el.innerHTML = lab(t);
    enableTileDrag(el, { type:'tile', id:t.id, label:lab(t), item:Object.assign({}, t) });
    pal.appendChild(el);
}
function addFracPaletteTile() {
    const pal = part('ed-palette');
    if (!pal) return;
    const el = document.createElement('div');
    el.className = 'palette-tile palette-frac';
    el.innerHTML = '<span class="dots">···</span><span class="frac-line"></span><span class="dots">···</span>';
    enableTileDrag(el, { type:'frac' });
    pal.appendChild(el);
}
function addFuncToolTile(fn) {
    const pal = part('ed-palette');
    if (!pal) return;
    const el = document.createElement('div');
    const note = noteOutil(fn);
    el.className = 'palette-tile func-tool' + (note ? ' avec-note' : '');
    el.innerHTML = `<span>${libelleOutil(fn)}</span>` + (note ? `<span class="outil-note">${note}</span>` : '');
    DragDrop.enable(el, {
        zoneSelector: '.eq-side',
        dragOverClass: 'drag-over',
        onDrop: (item, zone) => {
            const side = zone && zone.closest('.eq-side[data-path="left"], .eq-side[data-path="right"]');
            if (side) applyFuncTool(fn, side.dataset.path);
        },
    });
    pal.appendChild(el);
}
function addParenPaletteTile() {
    const pal = part('ed-palette');
    if (!pal) return;
    const el = document.createElement('div');
    el.className = 'palette-tile func-tool';
    el.innerHTML = '( )';
    enableTileDrag(el, { type:'paren' });
    pal.appendChild(el);
}
function addNegPaletteTile() {
    const pal = part('ed-palette');
    if (!pal) return;
    const el = document.createElement('div');
    el.className = 'palette-tile func-tool';
    el.innerHTML = '×(−1)';
    DragDrop.enable(el, {
        zoneSelector: '.eq-side',
        dragOverClass: 'drag-over',
        onDrop: (item, zone) => {
            const side = zone && zone.closest('.eq-side[data-path="left"], .eq-side[data-path="right"]');
            if (side) negateSide(side.dataset.path);
        },
    });
    pal.appendChild(el);
}
const REUSABLE_TILE_IDS = new Set(['one', 'times', 'plus', 'minus']);
function buildPalette() {
    const pal = part('ed-palette');
    if (!pal || !currentExercise) return;
    pal.innerHTML = '';
    // les grandeurs effacées reviennent dans la réserve ; le 1 y est toujours
    const tuiles = (currentExercise.tiles || []).slice();
    if (!tuiles.some(t => t.id === 'one')) tuiles.push(tile('one', '1'));
    tuiles.filter(t => REUSABLE_TILE_IDS.has(t.id) || countIdAnywhere(t.id) === 0).forEach(addPaletteTile);
    addFracPaletteTile();
    (currentExercise.funcTools || []).forEach(addFuncToolTile);
    if (currentExercise.needsParenTool) addParenPaletteTile();
    // l'outil ×(-1) reste toujours disponible : il ne fait jamais de mal a
    // utiliser (il ne fait que changer un signe) et son absence occasionnelle
    // empechait de corriger une erreur de signe sur certaines questions
    addNegPaletteTile();
}

// ═══════════════════════════════════════════════════════════════
// ÉVALUATION ALGÉBRIQUE
// ═══════════════════════════════════════════════════════════════
function tokenValue(id, v) {
    if (id === 'one') return 1;
    return (v && id in v) ? v[id] : NaN;
}
function evaluateNode(node, v) {
    if (node.kind === 'func') {
        const x = evaluateNode(node.inner, v);
        switch (node.fn) {
            case 'sqrt': return Math.sqrt(x);
            case 'sq': return x * x;
            case 'cube': return x * x * x;
            case 'cbrt': return Math.cbrt(x);
            case 'pow': return Math.pow(x, node.n);
            case 'proot': return Math.pow(x, 1 / node.n);
            case 'sin': return Math.sin(x);
            case 'asin': return Math.asin(x);
            case 'cos': return Math.cos(x);
            case 'acos': return Math.acos(x);
            case 'tan': return Math.tan(x);
            case 'atan': return Math.atan(x);
            case 'log': return Math.log10(x);
            case 'pow10': return Math.pow(10, x);
            case 'ln': return Math.log(x);
            case 'exp': return Math.exp(x);
        }
        return NaN;
    }
    if (node.kind === 'seq') return node.slots.reduce((p, s) => p * evaluateNode(s, v), 1);
    if (node.kind === 'frac') return evaluateNode(node.num, v) / evaluateNode(node.den, v);
    if (node.kind === 'sum') return node.terms.reduce((s, t) => s + t.sign * evaluateNode(t.node, v), 0);
    if (node.items.length === 0) return NaN;
    let terms = [], termValue = 1, sign = 1;
    node.items.forEach(it => {
        if (it.id === 'plus')       { terms.push(sign * termValue); termValue = 1; sign = 1; }
        else if (it.id === 'minus') { terms.push(sign * termValue); termValue = 1; sign = -1; }
        else if (it.id === 'times') { /* juxtaposition = produit */ }
        else termValue *= Math.pow(tokenValue(it.id, v), it.pow || 1);
    });
    terms.push(sign * termValue);
    return terms.reduce((s, t) => s + t, 0);
}
function isSlotEmpty(node) {
    if (node.kind === 'simple') return node.items.length === 0;
    if (node.kind === 'func') return isSlotEmpty(node.inner);
    if (node.kind === 'frac') return isSlotEmpty(node.num) || isSlotEmpty(node.den);
    if (node.kind === 'sum') return node.terms.some(t => isSlotEmpty(t.node));
    return node.slots.some(isSlotEmpty);
}
// les « 1 » inutiles : un 1 qui multiplie autre chose, ou un 1 seul au dénominateur.
// Un 1 seul au numérateur (1/OA), ou seul dans un membre, est utile.
function countOnesIn(node, ctx) {
    ctx = ctx || {};
    if (node.kind === 'simple') {
        const uns = node.items.filter(i => i.id === 'one').length;
        if (node.items.length > 1) return uns;
        return uns && (ctx.den || ctx.facteur) ? uns : 0;
    }
    if (node.kind === 'func') return countOnesIn(node.inner);
    if (node.kind === 'frac') return countOnesIn(node.num, {}) + countOnesIn(node.den, { den: true });
    if (node.kind === 'sum') return node.terms.reduce((s, t) => s + countOnesIn(t.node), 0);
    const plusieurs = node.slots.length > 1;
    return node.slots.reduce((s, sl) => s + countOnesIn(sl, plusieurs ? { facteur: true } : ctx), 0);
}
function isFullyIsolatedSeq(node, targetId) {
    return node && node.kind === 'seq' && node.slots.length === 1
        && node.slots[0].kind === 'simple' && node.slots[0].items.length === 1
        && node.slots[0].items[0].id === targetId && !node.slots[0].items[0].pow;
}
function isIsolatedSeq(node, targetId) {
    if (!node || node.kind !== 'seq' || node.slots.length !== 1) return false;
    const s = node.slots[0];
    if (s.kind === 'simple') return s.items.length === 1 && s.items[0].id === targetId && !s.items[0].pow;
    if (s.kind === 'frac') return s.num.kind === 'simple' && s.num.items.length === 1 && s.num.items[0].id === targetId && !s.num.items[0].pow
        && s.den.kind === 'simple' && s.den.items.length === 1 && s.den.items[0].id === 'one';
    return false;
}

// ═══════════════════════════════════════════════════════════════
// ÉDITEUR DE RÉSOLUTION (questions notées)
// ═══════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════
// ÉDITEUR AFFICHÉ DANS LA PAGE
// ═══════════════════════════════════════════════════════════════
function solveEditorHTML() {
    return `
    <div class="ed-tete ep-barre">
        <span class="ed-titre">Ta résolution</span>
        <span class="ed-tete-b"><button type="button" class="btn-small ep-annuler" disabled>↶ Annuler</button><button type="button" class="btn-small ed-recommencer">↺ Recommencer</button></span>
    </div>
    <div class="ed-hist ep-fige"></div>
    <div class="ed-travail">
        <p class="ed-aide-t">Déplace les éléments et utilise les outils pour écrire la grandeur cherchée <b>seule, à gauche</b>, puis vérifie l'étape.</p>
        <div class="eq-row ed-zone"></div>
        <p class="ed-pal-t">Réserve : glisse un élément ou un outil dans l'équation</p>
        <div class="ed-palette ep-palette"></div>
        <div class="ed-verif"><button type="button" class="btn-primary ed-verifier">✓ Vérifier l'étape</button></div>
    </div>
    <div class="ed-retour" aria-live="polite"></div>`;
}
// affiche l'éditeur d'un exercice dans zone
function monter(zone, cfg, r) {
    if (window.DragDrop) DragDrop.cleanupGhosts();
    rappels = r || {};
    racine = document.createElement('div');
    racine.className = 'ed ep-edit';
    racine.innerHTML = solveEditorHTML();
    zone.innerHTML = '';
    zone.appendChild(racine);
    racine.querySelector('.ep-annuler').addEventListener('click', annulerAction);
    racine.querySelector('.ed-recommencer').addEventListener('click', resetSolveExercise);
    racine.querySelector('.ed-verifier').addEventListener('click', verifyStep);
    startSolveExercise(cfg);
    return racine;
}
function startSolveExercise(cfg) {
    currentExercise = cfg;
    state = { left: cfg.initialLeft(), right: cfg.initialRight() };
    annul.vider();
    history = [JSON.parse(JSON.stringify(state))];
    stepOneValidated = true;
    resolved = false;
    hadError = false;
    activeHighlightId = null;
    refreshView();
    renderHistory();
}
function resetSolveExercise() {
    if (window.DragDrop) DragDrop.cleanupGhosts();
    if (!currentExercise || resolved) return;
    state = { left: currentExercise.initialLeft(), right: currentExercise.initialRight() };
    annul.vider();
    history = [JSON.parse(JSON.stringify(state))];
    activeHighlightId = null;
    refreshView();
    renderHistory();
    showFeedback('', false);
}
// l'équation affichée est-elle juste ? (5 tirages de valeurs)
function equationJuste(st) {
    for (let i = 0; i < 5; i++) {
        const v = currentExercise.sample();
        const l = evaluateNode(st.left, v);
        const r = evaluateNode(st.right, v);
        if (!isFinite(l) || !isFinite(r) || Math.abs(l - r) > 1e-6 * Math.max(1, Math.abs(r))) return false;
    }
    return true;
}
function verifyStep() {
    if (resolved || !currentExercise) return;
    if (isSlotEmpty(state.left) || isSlotEmpty(state.right)) {
        showFeedback("Complète les deux membres de l'équation avant de vérifier : une case vide au numérateur s'écrit 1.", false);
        return;
    }
    if (JSON.stringify(state) === JSON.stringify(history[history.length - 1])) {
        showFeedback("L'équation n'a pas changé : déplace d'abord un élément ou utilise un outil.", false);
        return;
    }
    if (!equationJuste(state)) {
        hadError = true; erreur();
        showFeedback("<b>Ce n'est pas ça.</b> Cette équation n'est plus égale à celle de départ : annule la dernière action (↶) et vérifie la règle utilisée.", false);
        return;
    }
    history.push(JSON.parse(JSON.stringify(state)));
    renderHistory();

    const target = currentExercise.targetId;
    const leftFull  = isFullyIsolatedSeq(state.left, target);
    const rightFull = !leftFull && isFullyIsolatedSeq(state.right, target);
    const leftLoose  = !leftFull && isIsolatedSeq(state.left, target);
    const rightLoose = !rightFull && !leftLoose && isIsolatedSeq(state.right, target);

    const onesTotal = countOnesIn(state.left) + countOnesIn(state.right);
    const onesElsewhere = onesTotal - (leftLoose ? 1 : 0) - (rightLoose ? 1 : 0);
    const complete = leftFull && onesElsewhere === 0;

    if (complete) {
        resolved = true;
        fin();
        showFeedback('', true);
        if (rappels.surResolu) rappels.surResolu();
        return;
    }
    let msg;
    if (rightFull) {
        msg = "Étape correcte ! Il ne reste plus qu'à inverser le sens de l'équation avec ⇄.";
    } else if (rightLoose) {
        msg = "Étape correcte ! Inverse le sens de l'équation avec ⇄, puis retire le dénominateur qui vaut 1.";
    } else if (leftLoose && onesElsewhere > 0) {
        msg = "Étape correcte ! Retire les 1 inutiles.";
    } else if (leftLoose) {
        msg = "Étape correcte ! La grandeur à isoler ne doit plus être dans une fraction : efface le 1 du dénominateur (touche-le, puis touche sa croix ✕).";
    } else if (leftFull && onesElsewhere > 0) {
        msg = "Étape correcte ! Retire les 1 inutiles (touche un 1, puis sa croix ✕).";
    } else {
        msg = "Étape correcte, continue !";
    }
    showFeedback(msg, true);
    state = JSON.parse(JSON.stringify(state));
    annul.vider();
    refreshView();
    if (rappels.surEtape) rappels.surEtape();
}
// question terminée (résolue ou solution affichée) : l'équation se fige
function fin() {
    resolved = true;
    if (window.DragDrop) DragDrop.cleanupGhosts();
    const t = part('ed-travail');
    if (t) t.remove();
    const b = part('ed-tete-b');
    if (b) b.remove();
}

/* ---------- affichage figé (énoncés, solutions, exemples) ---------- */
function statique(node) { const html = renderStatic(node); return html; }
function ligne(g, d) {
    return '<div class="eq-row eq-line-static ep-fige">' + renderStatic(g) + '<span class="eq-sign">=</span>' + renderStatic(d) + '</div>';
}
// après insertion dans la page : crochets des racines et hauteur des parenthèses
function finir(el) { sizeSqrtHooks(el); sizeParens(el); }

EPM.ED = {
    monter, fin, statique, ligne, finir, evaluer: evaluateNode, compterUns: countOnesIn,
    noeuds: { tile, simple, frac, seq, sumNode, term1, func },
    libelleOutil, noteOutil,
    _sup: (p, i) => deleteItem(p, i), _supDen: p => deleteDen(p), _inverser: () => flipEquation(),
    // opérations de l'élève (tests automatiques) et état
    ops: {
        etat: () => state, historique: () => history, resolu: () => resolved, erreurs: () => hadError,
        deposer: (path, data) => processDrop(path, data), inserer: handleInsertDropAt,
        terme: processSumTermDrop, den: processFracDenDrop, bloc: processBlocDrop, paren: processParenDrop, neg: negateSide,
        outil: applyFuncTool, effacer: deleteItem, effacerDen: deleteDen, inverser: flipEquation, verifier: verifyStep,
        annuler: annulerAction,
        // remplace l'équation affichée (tests automatiques)
        charger: st => { state = JSON.parse(JSON.stringify(st)); resolved = false; refreshView(); },
        juste: () => equationJuste(state),
    },
};
})();
