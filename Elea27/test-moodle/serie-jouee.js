// Test local : série « Niveau 2 » réellement jouée (saisies, « Vérifier ») par l'élève « eleve2 » (Test1234!) :
// 7 bonnes réponses sur 10, donc 14/20 attendu au carnet ; puis vue téléphone (390 px) du cours.
// Lancement : NODE_PATH=$(npm root -g) node serie-jouee.js <cm niveau 2> <cm cours> <dossier captures> <id parcours>
const { chromium, devices } = require('playwright');
const BASE = 'http://localhost:8080';
const [CM_N2, CM_COURS, OUT, COURS] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const err = [];
  p.on('pageerror', e => err.push('page: ' + e));
  await p.goto(BASE + '/login/index.php');
  await p.fill('#username', 'eleve2'); await p.fill('#password', 'Test1234!');
  await p.click('#loginbtn'); await p.waitForLoadState('networkidle');
  await p.goto(BASE + '/mod/scorm/view.php?id=' + CM_N2);
  await p.waitForSelector('#scorm_object');
  const f = p.frame({ url: /pluginfile\.php/ });
  await f.waitForSelector('#inp-coeff');
  for (let i = 0; i < 10; i++) {
    const a = await f.evaluate(() => computeAns(exM.qs[exM.q]));
    const faux = i % 3 === 1;                              // questions 2, 5, 8 fausses
    await f.fill('#inp-coeff', String(a.coeff).replace('.', ','));
    await f.fill('#inp-exp', String(a.exp + (faux ? 1 : 0)));
    await f.click('#verify-btn');
    await f.click(i < 9 ? 'text=Question suivante' : 'text=Voir mes résultats');
    await p.waitForTimeout(300);
  }
  await p.waitForTimeout(1000);
  console.log('écran de fin :', (await f.textContent('#ex-container')).replace(/\s+/g, ' ').trim().slice(0, 60));
  await p.screenshot({ path: OUT + '/e1-fin-niveau2.png' });
  await p.goto(BASE + '/course/view.php?id=' + COURS);
  await p.screenshot({ path: OUT + '/e2-parcours.png', fullPage: true });

  // téléphone (390 px, tactile)
  const tel = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  const t = await tel.newPage();
  await t.goto(BASE + '/login/index.php');
  await t.fill('#username', 'eleve2'); await t.fill('#password', 'Test1234!');
  await t.click('#loginbtn'); await t.waitForLoadState('networkidle');
  await t.goto(BASE + '/mod/scorm/view.php?id=' + CM_COURS);
  await t.waitForSelector('#scorm_object');
  const g = t.frame({ url: /pluginfile\.php/ });
  await g.waitForSelector('.er-etape');
  await t.waitForTimeout(1000);
  console.log('téléphone : défilement horizontal dans le cadre', await g.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await t.screenshot({ path: OUT + '/e3-telephone-cours.png' });
  console.log('erreurs', err);
  await b.close();
})();
