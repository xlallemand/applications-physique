// Test local : parcours de l'élève « eleve » dans le lecteur SCORM du Moodle local (http://localhost:8080).
// Fin de série simulée par le même chemin que l'application (exEnd / m3End → SOM.marquer → pont SCORM).
// Lancement : NODE_PATH=$(npm root -g) node parcours-eleve.js <cm cours> <cm préfixes> <cm niveau 1> <cm niveau 2> <dossier captures> <id parcours>
const { chromium } = require('playwright');
const BASE = 'http://localhost:8080';
const [cmCours, cmPref, cmN1, cmN2] = process.argv.slice(2, 6).map(Number);
const OUT = process.argv[6];
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const err = [];
  p.on('pageerror', e => err.push('page: ' + e));
  p.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
  p.on('requestfailed', r => err.push('échec: ' + r.url()));
  await p.goto(BASE + '/login/index.php');
  await p.fill('#username', 'eleve'); await p.fill('#password', 'Eleve1234!');
  await p.click('#loginbtn'); await p.waitForLoadState('networkidle');

  // ouvre une activité et renvoie le cadre du contenu SCORM
  async function ouvrir(cm) {
    await p.goto(BASE + '/mod/scorm/view.php?id=' + cm);
    await p.waitForSelector('#scorm_object', { timeout: 20000 });
    const f = p.frame({ url: /pluginfile\.php/ });
    await f.waitForFunction(() => document.readyState === 'complete' && window.SOM);
    await p.waitForTimeout(800);
    return f;
  }
  // fin de série avec un score donné (sur 10 questions) : même chemin que l'application (exEnd / m3End → SOM.marquer)
  async function finSerie(f, score, prefixes) {
    await f.evaluate(([s, pr]) => {
      if (pr) { m3.score = s; m3.q = 9; m3End(); } else { exM.score = s; exM.q = 9; exEnd(); }
    }, [score, prefixes]);
    await p.waitForTimeout(800);
  }
  async function quitter() {
    await p.goto(BASE + '/course/view.php?id=' + process.argv[7]);   // quitter l'activité (déchargement du cadre)
    await p.waitForTimeout(800);
  }

  // 1. cours : affichage de tout le cours → terminé
  let f = await ouvrir(cmCours);
  console.log('cours : écran', await f.evaluate(() => location.hash), 'sommaire', await f.evaluate(() => getComputedStyle(document.getElementById('app-nav')).display));
  await p.screenshot({ path: OUT + '/1-cours.png' });
  await f.click('text=Afficher tout le cours');
  await p.waitForTimeout(800);
  console.log('cours : liens de fin visibles', await f.evaluate(() => [...document.querySelectorAll('.er-actions a')].filter(a => a.offsetParent).map(a => a.textContent)));
  await quitter();

  // 2. préfixes : 7/10 → 14/20
  f = await ouvrir(cmPref);
  console.log('préfixes : écran', await f.evaluate(() => location.hash));
  await finSerie(f, 7, true);
  await quitter();

  // 3. niveau 1 : 8/10 → 16 ; puis dans la même séance « Recommencer » 6/10 → 12 (non transmis)
  f = await ouvrir(cmN1);
  console.log('niveau 1 : écran', await f.evaluate(() => location.hash), 'titre', await f.evaluate(() => document.getElementById('ex-title').textContent));
  await p.screenshot({ path: OUT + '/2-niveau1.png' });
  // tentative d'aller vers une autre page de l'application : bloquée
  await f.evaluate(() => { location.hash = '#niveau-3'; });
  await p.waitForTimeout(500);
  console.log('niveau 1 : après lien vers #niveau-3', await f.evaluate(() => location.hash), await f.evaluate(() => document.getElementById('ex-title').textContent));
  await finSerie(f, 8, false);
  await p.screenshot({ path: OUT + '/3-fin-niveau1.png' });
  await f.click('text=Recommencer');
  await finSerie(f, 6, false);
  await quitter();

  // 4. niveau 1, nouvelle séance (nouvelle tentative) : 9/10 → 18
  f = await ouvrir(cmN1);
  await finSerie(f, 9, false);
  await quitter();
  // 5. niveau 1, encore : 5/10 → 10 (moins bien : la note reste 18)
  f = await ouvrir(cmN1);
  await finSerie(f, 5, false);
  await quitter();

  // 6. niveau 2 : ouvert puis quitté sans finir
  f = await ouvrir(cmN2);
  await quitter();

  await p.goto(BASE + '/course/view.php?id=' + process.argv[7]);
  await p.screenshot({ path: OUT + '/4-parcours.png', fullPage: true });
  await p.goto(BASE + '/grade/report/user/index.php?id=' + process.argv[7]);
  await p.screenshot({ path: OUT + '/5-notes.png', fullPage: true });
  console.log('erreurs', err);
  await b.close();
})();
