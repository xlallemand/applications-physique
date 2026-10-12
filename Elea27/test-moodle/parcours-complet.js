// Test local : parcours complet d'un élève dans un parcours restauré (Moodle local http://localhost:8080).
// Chaque activité est ouverte dans le lecteur SCORM ; on vérifie la page affichée (data-page du pont),
// l'absence de sommaire et de lien visible vers une autre page, puis selon le type (data-type) :
//   cours : « Afficher tout le cours » ; vue : rien ; serie : jouée par l'interface (« Afficher la réponse »)
//   si c'est une série du moteur pH, sinon fin de série par SOM.marquer({ note }) ;
//   exercices : 3 exercices, on quitte, on revient (résultats retrouvés), puis tous les autres, on revient.
// Lancement : NODE_PATH=$(npm root -g) node parcours-complet.js <id parcours> <élève> <mot de passe> <dossier captures>
const { chromium } = require('playwright');
const BASE = 'http://localhost:8080';
const [COURS, LOGIN, MDP, OUT] = process.argv.slice(2);

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(String(e).slice(0, 160)));
  await p.goto(BASE + '/login/index.php');
  await p.fill('#username', LOGIN); await p.fill('#password', MDP);
  await p.click('#loginbtn'); await p.waitForLoadState('networkidle');
  await p.goto(BASE + '/course/view.php?id=' + COURS);
  const acts = await p.$$eval('li.activity a[href*="/mod/scorm/view.php?id="]', l => l.map(a => ({ url: a.href, nom: a.textContent.trim() })));

  // ouvre une activité et renvoie le cadre du contenu, prêt
  async function ouvrir(url) {
    await p.goto(url);
    await p.waitForSelector('#scorm_object', { timeout: 30000 });
    const f = p.frame({ url: /pluginfile\.php/ });
    await f.waitForFunction(() => document.readyState === 'complete');
    await p.waitForTimeout(700);
    return f;
  }
  const quitter = async () => { await p.goto(BASE + '/course/view.php?id=' + COURS); await p.waitForTimeout(500); };
  // état de la page affichée dans le cadre
  const etat = f => f.evaluate(() => {
    const s = document.querySelector('script[data-page]');
    const autre = a => {
      const u = new URL(a.getAttribute('href'), location.href);
      if (u.origin !== location.origin || /^(mailto|tel|javascript):/.test(a.getAttribute('href'))) return false;
      if (u.pathname === location.pathname) return s.hasAttribute('data-spa') && u.hash !== '' && u.hash.slice(1) !== s.dataset.page;
      return /\.html?$/.test(u.pathname);
    };
    return { page: s.dataset.page, type: s.dataset.type, adresse: location.pathname.split('/').slice(-2).join('/') + location.hash,
      sommaire: getComputedStyle(document.getElementById('app-nav') || document.body).display === 'none' || !document.getElementById('app-nav'),
      liensVisibles: [...document.querySelectorAll('a[href]')].filter(a => a.offsetParent && autre(a)).map(a => a.getAttribute('href')),
      faits: document.querySelectorAll('.ph-ex-carte.fait').length, cartes: document.querySelectorAll('.ph-ex-carte').length };
  });
  // clique tant que le bouton existe (séries et exercices joués par l'interface)
  async function cliquer(f, texte) {
    const bouton = f.locator(`button:has-text("${texte}"):visible:not([disabled])`).first();
    if (await bouton.count()) { await bouton.click(); await p.waitForTimeout(250); return true; }
    return false;
  }

  for (const [k, a] of acts.entries()) {
    let f = await ouvrir(a.url);
    const e = await etat(f);
    const bilan = [`${String(k + 1).padStart(2)} ${a.nom.slice(0, 48).padEnd(48)} ${e.type.padEnd(9)} ${e.adresse}`];
    if (!e.sommaire) bilan.push('SOMMAIRE VISIBLE');
    if (e.liensVisibles.length) bilan.push('liens visibles : ' + e.liensVisibles.join(' '));
    if (k === 0) await p.screenshot({ path: `${OUT}/a-${e.page}.png` });

    if (e.type === 'cours') {
      await cliquer(f, 'Afficher tout le cours');
      await p.waitForTimeout(600);
      const fin = await etat(f);
      if (fin.liensVisibles.length) bilan.push('liens visibles en fin de cours : ' + fin.liensVisibles.join(' '));
    } else if (e.type === 'serie') {
      if (await f.evaluate(() => !!window.PH)) {
        // série du moteur pH jouée par l'interface : réponse affichée à chaque partie (0 point)
        for (let n = 0; n < 400; n++) {
          if (await cliquer(f, 'Voir mon score')) break;
          // « Vérifier l'étape » sans rien faire (glisser-déposer) : une erreur, puis « Afficher la réponse »
          if (!(await cliquer(f, 'Commencer') || await cliquer(f, 'Afficher la réponse') || await cliquer(f, 'Question suivante')
                || await cliquer(f, "Vérifier l'étape"))) await p.waitForTimeout(300);
        }
        await p.waitForTimeout(600);
        bilan.push('fin : ' + (await f.textContent('body')).replace(/\s+/g, ' ').match(/(\d+(,\d+)?) ?\/ ?20/)?.[0]);
        await p.screenshot({ path: `${OUT}/b-${e.page}-fin.png` });
        await quitter();
        // nouvelle tentative : meilleure note transmise directement
        f = await ouvrir(a.url);
        await f.evaluate(() => SOM.marquer({ note: 15 }));
        bilan.push('puis 15/20 (nouvelle tentative)');
      } else {
        await f.evaluate(n => SOM.marquer({ note: n }), 10 + k % 10);
        bilan.push(`note ${10 + k % 10}/20 par SOM.marquer`);
      }
    } else if (e.type === 'exercices') {
      // un exercice entier par l'interface (« Voir la correction » à chaque partie)
      async function faireExercice(i) {
        await f.locator('.ph-ex-carte').nth(i).click();
        for (let n = 0; n < 60; n++) {
          if (await f.locator('text=Exercice terminé').count()) break;
          if (!(await cliquer(f, 'Voir la correction'))) await p.waitForTimeout(250);
        }
        await cliquer(f, 'Liste des exercices');
      }
      for (let i = 0; i < 3; i++) await faireExercice(i);
      await quitter();
      f = await ouvrir(a.url);
      const reprise = await etat(f);
      bilan.push(`reprise : ${reprise.faits}/${reprise.cartes} faits`);
      for (let i = 3; i < reprise.cartes; i++) await faireExercice(i);
      await quitter();
      f = await ouvrir(a.url);
      const fin = await etat(f);
      bilan.push(`après tout : ${fin.faits}/${fin.cartes} faits`);
      await p.screenshot({ path: `${OUT}/c-${e.page}-liste.png` });
    }
    await quitter();
    console.log(bilan.join(' | '));
  }
  await p.goto(BASE + '/course/view.php?id=' + COURS);
  await p.screenshot({ path: `${OUT}/d-parcours.png`, fullPage: true });
  console.log('erreurs', erreurs);
  await b.close();
})();
