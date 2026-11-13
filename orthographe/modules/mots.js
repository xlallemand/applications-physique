/* =====================================================================
   Orthographe — mots invariables, mots d'usage, homophones lexicaux
   ---------------------------------------------------------------------
   Rôle : liste des mots à connaître par cœur (fréquents dans les dictées
   du brevet), avec leurs formes fautives typiques.
   Espace de noms global : ORTHO_MOTS (script classique).

   ORTHO_MOTS.invariables : { mot: [fautes] }  règle LX1
   ORTHO_MOTS.usage       : { mot: [fautes] }  règle LX14 (mots d'usage à mémoriser)
   ORTHO_MOTS.homophones  : [[mots]]           règle LX11 (homophones lexicaux)
   Calculés à partir des listes :
   ORTHO_MOTS.fautes      : { mot: [fautes] }  (homophones : les autres mots du groupe)
   ORTHO_MOTS.regles      : { mot: règle }
   Rectifications de 1990 : aucune faute ne porte sur un accent circonflexe
   de i ou u (les deux orthographes sont acceptées).
   ===================================================================== */
window.ORTHO_MOTS = (function () {
  'use strict';
  const invariables = {
    alors: ['alor', 'alords'], après: ['aprés', 'apres'], 'aujourd’hui': ['aujourdhui', 'aujourd’huit'], auprès: ['aupré', 'auprés'],
    aussi: ['ausi', 'aussit'], aussitôt: ['aussitot', 'aussi tôt'], autant: ['autan', 'autent'], autour: ['autours', 'otour'],
    autrefois: ['autre fois', 'autrefoi'], avant: ['avan', 'avent'], avec: ['avek', 'avecque'], beaucoup: ['beaucoups', 'boucoup'],
    bientôt: ['bientot', 'bien tôt'], cependant: ['cepandant', 'ce pendant'], certes: ['certe', 'certres'], chez: ['chés', 'chèz'],
    combien: ['conbien', 'combiens'], 'd’abord': ['d’abords', 'dabord'], davantage: ['d’avantage', 'davantages'], debout: ['deboue', 'debouts'],
    dedans: ['dedan', 'dedant'], dehors: ['dehor', 'déhors'], 'déjà': ['déja', 'dejà'], depuis: ['depui', 'depuit'],
    derrière: ['derière', 'dérrière'], désormais: ['désormai', 'désormé'], dessous: ['dessou', 'desous'], dessus: ['dessu', 'desus'],
    devant: ['devan', 'devent'], encore: ['encor', 'encors'], enfin: ['en fin', 'enfain'], ensemble: ['ensembles', 'ensamble'],
    ensuite: ['ensuitte', 'en suite'], environ: ['environt', 'environs'], hier: ['hiere', 'hièr'], ici: ['isi', 'icit'],
    jadis: ['jadi', 'jadit'], jamais: ['jamai', 'jamés'], 'jusqu’à': ['jusqua', 'jusqu’a'], loin: ['loins', 'loint'],
    longtemps: ['longtemp', 'lontemps'], lorsque: ['lorque', 'lors que'], maintenant: ['maintenent', 'maintenan'], malgré: ['malgrés', 'malgrè'],
    mieux: ['mieu', 'mieus'], moins: ['moin', 'moint'], néanmoins: ['néanmoin', 'néamoins'], parfois: ['parfoi', 'par fois'],
    parmi: ['parmis', 'parmit'], partout: ['partous', 'partou'], pendant: ['pendent', 'pandant'], 'peut-être': ['peut être', 'peutêtre'],
    pourtant: ['pourtan', 'pourtent'], presque: ['presqu', 'presques'], puis: ['puit', 'pui'], quelquefois: ['quelques fois', 'quelque fois'],
    selon: ['selont', 'ce long'], souvent: ['souvant', 'souven'], surtout: ['surtous', 'sur tout'], tantôt: ['tantot', 'tant tôt'],
    tard: ['tare', 'tars'], tôt: ['tot', 'tôts'], toujours: ['toujour', 'toujoure'], travers: ['traver', 'traverre'],
    'très': ['trés', 'tres'], trop: ['trot', 'trops'], vite: ['vitte', 'vites'], voici: ['voicit', 'voissi'],
    'voilà': ['voila', 'voilat'], volontiers: ['volontier', 'volontié'], hélas: ['hélà', 'hélat'], soudain: ['soudin', 'soudains'],
    lentement: ['lentemant', 'lentemment'], vraiment: ['vraiement', 'vraimant']
  };
  const usage = {
    accueil: ['acceuil', 'accueuil'], adolescence: ['adolessence', 'adolescense'], ailleurs: ['ailleur', 'aïeurs'], automne: ['autonne', 'automme'],
    bonheur: ['bonheure', 'bonneur'], bruit: ['brui', 'bruie'], cauchemar: ['cauchemard', 'cochemar'], chaleur: ['chaleure', 'challeur'],
    chemin: ['chemain', 'chemein'], colline: ['coline', 'colinne'], crépuscule: ['crépuscul', 'crépuscle'], différence: ['différance', 'diférence'],
    doigt: ['doit', 'doigts'], douceur: ['douceure', 'doussur'], enfance: ['enfence', 'anfance'], ennui: ['ennuie', 'ennuit'],
    escalier: ['escallier', 'escalié'], fusil: ['fusille', 'fusi'], habitude: ['abitude', 'habbitude'], heure: ['heur', 'heures'],
    horizon: ['orizon', 'horizont'], humide: ['umide', 'humid'], immense: ['imense', 'immence'], jardin: ['jardain', 'jardins'],
    jeunesse: ['jeunnesse', 'jeunesce'], lycée: ['lycé', 'lyçée'], mélancolique: ['mélancholique', 'mélencolique'], museau: ['musau', 'museaux'],
    mystère: ['mistère', 'mystaire'], nostalgie: ['nostaljie', 'nostalgi'], paysage: ['paisage', 'paysàge'], poids: ['poid', 'pois'],
    quartier: ['cartier', 'quartié'], rideau: ['rido', 'ridau'], silence: ['silance', 'silense'], souvenir: ['souvenire', 'souvenirs'],
    sourire: ['sourir', 'sourrire'], succès: ['sucès', 'succé'], syllabe: ['sillabe', 'syllab'], tiroir: ['tiroire', 'tirroir'],
    tranquille: ['tranquile', 'trenquille'], village: ['vilage', 'villages'], yeux: ['yeu', 'yeuxs'], brouhaha: ['brouaha', 'brouhahat'],
    rythme: ['rithme', 'rythm'], événement: ['évenement', 'évennement'], monsieur: ['monsieurs', 'mosieur'], orage: ['orrage', 'oraje']
  };
  const homophones = [
    ['voix', 'voie', 'vois'], ['mer', 'mère', 'maire'], ['verre', 'vert', 'ver'], ['cou', 'coup', 'coût'], ['pain', 'pin', 'peint'],
    ['fois', 'foie', 'foi'], ['cours', 'court', 'cour'], ['champ', 'chant'], ['conte', 'compte', 'comte'], ['saint', 'sein', 'sain'],
    ['tâche', 'tache'], ['faim', 'fin'], ['vin', 'vingt', 'vain'], ['chêne', 'chaîne'], ['pâte', 'patte'], ['sel', 'selle'],
    ['père', 'paire', 'pair'], ['port', 'porc'], ['tante', 'tente'], ['mot', 'maux'], ['sang', 'sans', 'cent'], ['point', 'poing'],
    ['vent', 'vend'], ['chair', 'chaire', 'cher'], ['lait', 'laid'], ['mal', 'malle', 'mâle'], ['haut', 'eau'], ['air', 'aire', 'ère']
  ];
  const fautes = {}, regles = {};
  Object.keys(invariables).forEach(m => { fautes[m] = invariables[m]; regles[m] = 'LX1'; });
  Object.keys(usage).forEach(m => { fautes[m] = usage[m]; regles[m] = 'LX14'; });
  homophones.forEach(g => g.forEach(m => {
    // les homophones grammaticaux (sans, cent…) gardent leur propre règle (langue.js)
    if (m === 'sans') return;
    fautes[m] = g.filter(x => x !== m); regles[m] = 'LX11';
  }));
  return { invariables, usage, homophones, fautes, regles };
})();
