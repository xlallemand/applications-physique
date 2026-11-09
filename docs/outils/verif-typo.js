// Vérifie dans les pages RENDUES (textes produits par JavaScript compris)
// l'espace insécable avant : ; ? ! et à l'intérieur des guillemets « ».
//
// Usage :  node docs/outils/verif-typo.js DOSSIER_OU_PAGE.html...
//   ex. :  node docs/outils/verif-typo.js periode-frequence
// Chaque page est ouverte (1280 px) ; tout texte affiché pendant le chargement
// est examiné. Pour couvrir les messages qui n'apparaissent qu'après une
// réponse (erreurs, corrections), ajouter SURVEILLANCE aux tests Playwright :
//   const { SURVEILLANCE, releve } = require('.../docs/outils/verif-typo.js');
//   await contexte.addInitScript(SURVEILLANCE);  …  console.log(await releve(page));
// Code de sortie 1 si une espace manque.
'use strict';
const fs = require('fs');
const path = require('path');

// script injecté dans la page : observe tous les textes ajoutés ou modifiés
const SURVEILLANCE = `(() => {
  const vus = new Set();
  window.__typo = [];
  // ponctuation double précédée d'autre chose qu'une espace insécable
  const R = /(\\S)([ \\t\\n]*)([:;?!])(?=[\\s\\u00a0\\u202f<]|$)|«(?![\\u00a0\\u202f])|(?<![\\u00a0\\u202f])»/g;
  function examiner(t, ou) {
    if (!t || !/[:;?!«»]/.test(t)) return;
    R.lastIndex = 0;
    let m;
    while ((m = R.exec(t))) {
      // ignorer : heures 10:30, URL, ratio a:b, « ? » seul, ponctuation répétée
      if (m[1] && /[\\u00a0\\u202f:;?!«(]/.test(m[1])) continue;
      if (m[1] && m[2] === '' && /\\d/.test(m[1]) && /^\\d/.test(t.slice(m.index + 2))) continue;
      const ext = t.slice(Math.max(0, m.index - 25), m.index + 12).replace(/\\s+/g, ' ');
      const cle = ou + '|' + ext;
      if (vus.has(cle)) continue;
      vus.add(cle);
      window.__typo.push(ou + ' : ' + ext);
    }
  }
  function nom(e) { return e ? (e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase()) : '?'; }
  function parcourir(n) {
    if (n.nodeType === 3) {
      const p = n.parentElement;
      if (p && !p.closest('script,style,code,pre,input,textarea')) examiner(n.data, nom(p));
      return;
    }
    if (n.nodeType !== 1) return;
    if (n.matches('script,style')) return;
    for (const a of ['title', 'aria-label', 'placeholder', 'alt']) if (n.hasAttribute(a)) examiner(n.getAttribute(a), nom(n) + '[' + a + ']');
    for (const c of n.childNodes) parcourir(c);
  }
  new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'characterData') parcourir(m.target);
      else if (m.type === 'attributes') parcourir(m.target);
      else m.addedNodes.forEach(parcourir);
    }
  }).observe(document, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder', 'alt'] });
  document.addEventListener('DOMContentLoaded', () => parcourir(document.body));
})();`;

// relevé des problèmes vus depuis le chargement de la page
const releve = page => page.evaluate(() => window.__typo || []);

async function principal(args) {
  const { chromium } = require('playwright');
  const pages = [];
  for (const a of args) {
    if (fs.statSync(a).isDirectory()) {
      (function tour(d) {
        for (const f of fs.readdirSync(d).sort()) {
          const c = path.join(d, f);
          if (fs.statSync(c).isDirectory()) tour(c);
          else if (f.endsWith('.html')) pages.push(c);
        }
      })(a);
    } else pages.push(a);
  }
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(SURVEILLANCE);
  let total = 0;
  for (const p of pages) {
    const pg = await ctx.newPage();
    await pg.goto('file://' + path.resolve(p));
    await pg.waitForTimeout(400);
    const r = await releve(pg);
    for (const l of r) console.log('  ' + p + '  ' + l);
    total += r.length;
    await pg.close();
  }
  await b.close();
  console.log(total ? `${total} espace(s) insécable(s) manquante(s)` : 'Typographie : aucune espace insécable manquante');
  process.exitCode = total ? 1 : 0;
}

module.exports = { SURVEILLANCE, releve };
if (require.main === module) principal(process.argv.slice(2));
