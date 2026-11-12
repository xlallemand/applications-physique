/* =====================================================================
   Orthographe — banque de phrases annotées et gabarits combinatoires
   ---------------------------------------------------------------------
   Rôle : matière des dictées courtes et des dictées « brevet » générées.
   Espace de noms global : ORTHO_BANQUE (script classique).

   ORTHO_BANQUE.themes   : [{ id, nom }] (une dictée tire ses phrases d'un thème)
   ORTHO_BANQUE.phrases  : { <thème>: [phrases annotées] }
   ORTHO_BANQUE.gabarits : [{ th, t, S, V, T, N, A, I, … }]

   Notation (lue par ORT.L.lirePhrase, voir langue.js) :
     {juste|RÈGLE}               mot piège ; formes fautives calculées
     {juste|RÈGLE|f1/f2}         formes fautives plausibles données
     mot@k  verbe conjugué n° k (auxiliaire et participe : tous deux @k)
     mot#k  mot du sujet du verbe k     mot&k  antécédent de « qui » sujet du verbe k
     Un verbe sans sujet (impératif) n'a que @k.
     Élision devant un verbe : « j’#1 étais@1 » (le jeton j’ se colle au verbe).

   Gabarits (voir ORT.L.instancier) :
     [S] sujet tiré de S ; [V] verbe de V accordé avec S, au temps tiré de T
       (pr présent, imp imparfait, ps passé simple, fut futur, cond conditionnel,
       pc passé composé, pqp plus-que-parfait) ; [V.pc] : temps imposé ;
     [N.det] nom tiré de N (« filet/m », « cheval/m », « grand-mère/f/grands-mères »)
       avec son déterminant : le, un, les, des, son, ses, leur, leurs, ce, ces, mon, mes,
       poss (possessif de la personne du sujet) ; « le1 » : singulier imposé ;
     [A] adjectif de A accordé avec N ; [A.S] attribut accordé avec le sujet ;
     [I] infinitif de I ; S2, V2, N2, A2… : deuxième sujet, verbe, nom, adjectif.
   Rectifications de 1990 : aucune forme fautive ne porte sur un accent
   circonflexe de i ou u, ni sur un trait d'union de nombre.
   ===================================================================== */
window.ORTHO_BANQUE = {
  themes: [
    { id: 'mer', nom: 'Au bord de la mer' },
    { id: 'ville', nom: 'En ville' },
    { id: 'campagne', nom: 'À la campagne' },
    { id: 'ecole', nom: 'Au collège' },
    { id: 'maison', nom: 'À la maison' },
    { id: 'montagne', nom: 'En montagne' },
    { id: 'nuit', nom: 'La nuit, dans la forêt' },
    { id: 'voyage', nom: 'En voyage' }
  ],

  phrases: {
    /* ------------------------------------------------------------ la mer */
    mer: [
      'Chaque soir, les#1 {pêcheurs|GN1}#1 {rentraient|SV2}@1 au port avec {leurs|HO9} {barques|GN1} {chargées|PP2} de poissons.',
      'Ils#1#2 {rangeaient|SV2}@1 {leurs|HO9} filets sur la {jetée|LX7|jeté/jetai} {et|HO2} {regardaient|SV2}@2 les vagues&3 qui#3 se {brisaient|SV5}@3 contre les {rochers|GN1}.',
      'Ma#1 sœur#1 {et|HO2} moi#1 {allions|SV6|allaient/allait}@1 les rejoindre pour les aider {à|HO1} {porter|EE1} les {paniers|GN1}.',
      'Le#1 {bruit|LX4|brui}#1 des vagues m’{endormait|SV3}@1 {tous|GN6} les soirs.',
      'Au loin, une#1 voile#1 {blanche|GN3|blanc/blanches}#1 {glissait|EE2}@1 sur l’eau {calme|GN2|calmes}.',
      'Les#1 {mouettes|GN1}#1 {criaient|SV2}@1 au-dessus des {bateaux|GN1}&2 qui#2 {s’éloignaient|SV5}@2 du rivage.',
      'Nous#1 {avons|CJ6|avions/ont}@1 {ramassé|PP3|ramassés/ramasser}@1 des {coquillages|GN1} {nacrés|GN2} sur le sable {mouillé|PP2|mouillés/mouiller}.',
      'La#1 {marée|LX7|maré}#1 {montait|SV1}@1 : il#2 {fallait|CJ2|fallaient/fallais}@2 {rentrer|EE1} avant la nuit.',
      'Quand le#1 vent#1 se {levait|SV1}@1, la#2 mer#2 {devenait|SV1}@2 {grise|GN4|gris/grises} {et|HO2} {menaçante|GN4|menaçant/menaçantes}.',
      '{Ces|HO7}#1 {marins|GN1}#1 {connaissaient|SV2}@1 la mer depuis {toujours|LX1}.',
      'Le#1 {vieux|GN2|vieil/vieille}#1 {pêcheur|LX3|pécheur}#1 nous {montrait|SV4}@1 {ses|HO7} filets {réparés|PP2} {à|HO1} la main.',
      '{On|HO4|Ont}#1 {apercevait|SV1}@1 {à|HO1} peine la côte {à|HO1} travers la brume.',
      'Il#1 {faudra|CJ5|faudrait/faudras}@1 {réparer|EE1} la coque avant l’hiver.',
      'Je#1 me {souviens|CJ1|souvient/souvien}@1 de ces {étés|GN1} où nous#2 {pêchions|CJ2|pêchons/péchions}@2 des crevettes {près|HO19} des {rochers|GN1}.',
      'Les#1 {vagues|GN1}#1, {poussées|PP2} par le vent, {venaient|SV3}@1 mourir sur la plage.',
      '{C’est|HO7}@1#1 {là|HO8} que mon#2 père#2 m’{a|HO1}@2 {appris|EE3|apprit/appri}@2 {à|HO1} {nager|EE1}.',
      'Le#1 phare#1 {s’allumait|EE2}@1 dès que la#2 nuit#2 {tombait|SV1}@2.',
      'Soudain, le#1 capitaine#1 {donna|CJ3|donnat/donnât}@1 l’ordre de {lever|EE1} l’ancre.',
      'Les#1 {enfants|GN1}#1 {couraient|SV2}@1 sur la plage, {heureux|GN4} de {retrouver|EE1} la mer.',
      'Elle#1#2 {s’est|HO7|c’est/ses}@1 {assise|PP5|assis/assises}@1 sur le sable {et|HO2} {a|HO1}@2 {regardé|PP3|regardée/regarder}@2 l’horizon.',
      'Il#1 y {avait|SV1}@1 {quatre-vingts|GN7|quatre-vingt} {marches|GN1} jusqu’au phare.',
      'De {temps|HO14|tant} en {temps|HO14|tant}, un#1 bateau#1 {passait|SV1}@1 au large.',
      'Il#1 {nageait|LX6|nagait/nagaient}@1 vers la {bouée|LX7|boué} {sans|HO11|s’en/cent} se {presser|EE1}.',
      'La#1 {tempête|LX10|tenpête}#1 {emporta|LX10|enporta/emportat}@1 la cabane des {pêcheurs|GN1}.',
      'La#1 {mer|LX11|mère/maire}#1 {était|SV1}@1 {calme|GN4|calmes} ce matin-là.',
      'Le#1 soleil#1 {se|HO6|ce} {couchait|EE2}@1 derrière les {îles|GN1}.',
      '{Ça|HO17|Sa}#1 {sentait|SV1}@1 le sel {et|HO2} les {algues|GN1}.',
      'Vous#1 {regardez|EE2|regarder/regardé}@1 la mer depuis la terrasse.'
    ],

    /* ------------------------------------------------------------ la ville */
    ville: [
      'Dans les {vieilles|GN2|vieille/vieux} {ruelles|GN1}, les#1 {marchands|GN1}#1 {installaient|SV2}@1 {leurs|HO9} étals dès l’aube.',
      'La#1 ville#1 {s’éveillait|SV1}@1 lentement : {on|HO4|ont}#2 {entendait|SV1}@2 les {klaxons|GN1} {et|HO2} les cris des {livreurs|GN1}.',
      'Mon#1 cousin#1 {habitait|EE2}@1 un {appartement|LX2|apartement} au dernier étage.',
      'Les#1 {passants|GN1}#1, {pressés|GN4|pressé/pressées}, ne {remarquaient|SV2}@1 pas la vieille dame&2 qui#2 {vendait|SV5}@2 des fleurs.',
      'Je#1 {traversais|SV1}@1 la place {quand|HO12|quant/qu’en} un#2 orage#2 {éclata|CJ3|éclatat/éclatât}@2.',
      'Nous#1 {sommes|CJ6|somme/sont}@1 {entrés|PP1|entré/entrées}@1 dans un café {où|HO5} {régnait|SV3}@2 une#2 {douce|GN3|doux/douces}#2 {chaleur|LX14|chaleure}#2.',
      'Les#1 {rues|GN1}#1 {étaient|SV2}@1 {désertes|GN4|déserte/déserts} {et|HO2} les {boutiques|GN1} {fermées|PP2}.',
      '{Mes|HO10|Mais/Met}#1 parents#1 m’{ont|HO4|on}@1 {offert|EE3|offer/offerts}@1 un vélo pour {aller|EE1} au collège.',
      'Le#1 métro#1 {était|SV1}@1 si plein qu’ {on|HO4}#2 ne {pouvait|SV1}@2 plus {bouger|EE1}.',
      '{Tous|GN6} les {matins|GN1}, la#1 boulangère#1 nous {saluait|SV4}@1 d’un sourire.',
      'Il#1 {faut|CJ1|faux/fau}@1 que tu#2 {sois|CJ8|soit/soi}@2 {prudent|GN4|prudente/prudents} en {traversant|PP6|traversent/traversants} la rue.',
      'Les#1 {lampadaires|GN1}#1 {s’allumèrent|CJ3|s’allumairent/s’allumaient}@1 un à un dans le soir.',
      'Ce#1 quartier#1, que j’#2 {aimais|CJ4|aimai/aimait}@2 {tant|HO14}, {avait|SV3}@1 {beaucoup|LX1} {changé|PP3|changés/changer}@1.',
      'Nous#1 {prendrons|CJ5|prendront/prendrions}@1 le bus de huit heures.',
      'La#1 foule#1 {applaudissait|SV6|applaudissaient/applaudissais}@1 les musiciens.',
      'Les#1 {hauts|GN2|haut/hautes}#1 {immeubles|GN1}#1 {cachaient|SV2}@1 le soleil {dès|LX3|des} le milieu de l’{après-midi|LX12|après midi/aprèsmidi}.',
      'Il#1 {acheta|CJ3|achetat/achetât}@1 des {sacs|GN1} de toile {solides|GN5|solide}.',
      'Elle#1 {portait|SV1}@1 des {rubans|GN1} {orange|GN7|oranges} dans les cheveux.',
      'Il#1 {s’en|HO11|sans/sent} {alla|CJ3|allat/allât}@1 {sans|HO11|s’en/cent} dire un mot.',
      'Il#1 {répondit|CJ3|répondis/répondît}@1 {prudemment|LX8|prudement/prudamment} au policier.',
      '{Longtemps|LX1}, le#1 {champion|LX10|chanpion}#1 {resta|CJ3|restat/restât}@1 {imbattable|LX10|inbattable}.',
      'Les#1 {Français|LX13|français}#1 {aiment|SV2|aime/aimes}@1 flâner sur les {places|GN1} {ombragées|GN2|ombragée/ombragés}.',
      'Le#1 {garçon|LX5|garcon}#1 {reçut|LX5|recut/reçu}@1 une lettre de sa {tante|LX11|tente}.',
      '{Ce|HO6|Se} que je#1 {préférais|SV1}@1, {c’était|HO17|s’était}@2#2 le marché du samedi.',
      'Vous#1 {traversez|EE2|traverser/traversé}@1 la place {et|HO2} vous#2 {tournez|EE2|tourner/tourné}@2 {à|HO1} droite.'
    ],

    /* ------------------------------------------------------------ la campagne */
    campagne: [
      'Dans les {champs|LX11|chants}, les#1 {blés|GN1}#1 {mûrs|GN2|mûr/mûres}#1 {ondulaient|SV2}@1 sous le vent.',
      'Mon#1 {grand-père|LX12|grand père/grandpère}#1 se {levait|SV1}@1 avant le jour pour {soigner|EE1} les bêtes.',
      'Les#1 {vaches|GN1}#1 {paissaient|SV2}@1 {tranquillement|LX2|tranquilement} dans le pré.',
      'Nous#1 {cueillions|CJ2|cueillons/ceuillions}@1 des mûres le long des {chemins|GN1}.',
      'Une#1 odeur#1 de foin {coupé|PP2|coupée/couper} {flottait|SV3}@1 dans l’air.',
      'Au loin, {on|HO4|ont}#1 {entendait|SV1}@1 la&2 cloche&2 du village qui#2 {sonnait|SV5}@2 midi.',
      'La#1 fermière#1 nous {a|HO1}@1 {donné|PP3|donnés/donner}@1 des œufs tout frais.',
      'Les#1 {poules|GN1}#1, {effrayées|PP2|effrayés/effrayée} par le chien, se {sauvèrent|CJ3|sauvairent/sauvaient}@1 dans la grange.',
      'Il#1 {pleuvait|CJ2|pleuvais/pleuvé}@1 depuis trois jours : les#2 {chemins|GN1}#2 {étaient|SV2}@2 {boueux|GN4}.',
      'Mes#1 {cousines|GN1}#1 {étaient|SV2}@1 {parties|PP1|partis/partie}@1 cueillir des {cerises|GN1}.',
      'Je#1 {voudrais|CJ5|voudrai/voudrait}@1 vivre un jour dans cette maison {entourée|PP2|entouré/entourées} de {vignes|GN1}.',
      'Le#1 chien#1 {aboyait|SV1}@1 {dès|LX3|des} qu’ un#2 inconnu#2 {approchait|EE2}@2 de la ferme.',
      'Les#1 {abeilles|GN1}#1 {butinaient|SV2}@1 les {fleurs|GN1} {violettes|GN2|violette/violets} de la lavande.',
      '{Quel|HO15|Quelle/Qu’elle} beau {paysage|LX14|paisage} !',
      'Le#1 fermier#1 {avait|SV1}@1 {labouré|PP3|labourés/labourer}@1 {son|HO3} {champ|LX11|chant} avant la pluie.',
      'Nous#1 {marchions|CJ2|marchons/marchiont}@1 {sans|HO11|s’en/cent} bruit pour ne pas {effrayer|EE1} les {oiseaux|GN1}.',
      'Nous#1 {admirions|CJ2|admirons/admirion}@1 la lande {et|HO2} le ciel {immenses|GN5|immense}.',
      'Il#1 {commençait|LX5|commencait/commençais}@1 {à|HO1} pleuvoir sur les {collines|GN1}.',
      'Les#1 {oiseaux|GN1}#1, {effrayés|LX9|effraillés/effrayé}, {s’envolèrent|CJ3|s’envolairent/s’envolaient}@1 {tous|GN6} ensemble.',
      'Le#1 moustique#1 s’{approcha|CJ9|approchât/approchat}@1 du lion {et|HO2} lui {dit|CJ3|dis/dît}@2 quelques mots.',
      'Il#1 {fallait|CJ2|fallaient/fallais}@1 qu’ il#2 {partît|CJ9|partit/partis}@2 avant l’aube.',
      'Le#1 village#1 {comptait|SV1}@1 à peine {mille|GN7|milles/mil} {habitants|GN1}.',
      'La#1 rivière#1 {coulait|EE2}@1 {là|HO8|la/l’a}, tout en bas du pré.',
      'Les#1 {bourgeons|LX6|bourgons}#1 {éclataient|SV2}@1 sur les {branches|GN1}.'
    ],

    /* ------------------------------------------------------------ le collège */
    ecole: [
      'Les#1 {élèves|GN1}#1 {attendaient|SV2}@1 la {sonnerie|LX2|sonerie} devant la grille du collège.',
      'Le#1 professeur#1 nous {distribua|CJ3|distribuat/distribuât}@1 les copies {corrigées|PP2|corrigés/corrigée}.',
      'J’#1 {avais|SV1|avait/avaient}@1 {oublié|PP3|oubliée/oublier}@1 mon cahier {et|HO2} je#2 n’ {osais|SV1}@2 pas le dire.',
      'Les#1 {exercices|GN1}#1 que le#2 {professeur|LX2|proffesseur}#2 nous {avait|SV4}@2 {donnés|PP4|donné/donnée}@2 {étaient|SV3}@1 {difficiles|GN4|difficile}.',
      'Pendant la récréation, {mes|HO10|mais}#1 {amis|GN1}#1 {et|HO2} moi#1 {jouions|SV6|jouaient/jouait}@1 au ballon.',
      'Chacun#1 {devait|SV6|devaient/devais}@1 rendre {son|HO3} devoir avant vendredi.',
      'La#1 bibliothécaire#1 {rangeait|SV1}@1 les livres que les#2 élèves#2 lui {avaient|SV4}@2 {rendus|PP4|rendu/rendues}@2.',
      'Si tu#1 {travailles|CJ1|travaille/travaillent}@1 {régulièrement|LX8|régulièrment/réguliairement}, tu#2 {réussiras|CJ5|réussirais/réussira}@2 ton examen.',
      '{Écoute|CJ7|Écoutes/Écouté}@1 bien la consigne avant de {commencer|EE1}.',
      'Elle#1#2 {était|SV1}@1 {fière|GN4|fier/fières} de sa note {et|HO2} {souriait|SV1}@2 {à|HO1} tout le monde.',
      'Nous#1 {apprenions|CJ2|apprenons/apprennions}@1 nos leçons {ensemble|LX1}, {assis|PP2|assises/assi} sous le préau.',
      'Il#1 {faut|CJ1|faux}@1 qu’ il#2 {fasse|CJ8|fait/face}@2 {ses|HO7} devoirs ce soir.',
      'Le#1 surveillant#1 {criait|SV1}@1 {mais|HO10|mes} personne#2 ne l’{écoutait|SV4}@2.',
      'Les#1 {copies|GN1}#1 {seront|CJ5|serons/seraient}@1 {rendues|PP1|rendu/rendus}@1 lundi.',
      'Je#1 {relus|CJ4|relut/relu}@1 ma {dictée|LX7|dicté} deux fois avant de la rendre.',
      '{Ses|HO7|Ces}#1 {résultats|GN1}#1 {s’améliorèrent|CJ3|s’amélioraient/s’améliorairent}@1 {peu|HO13} {à|HO1} {peu|HO13}.',
      'Le#1 {silence|LX5|silance}#1 {régnait|SV1}@1 dans la classe {pendant|LX1} la dictée.',
      'Nous#1 {mangeons|LX6|mangons/mangeont}@1 {à|HO1} la cantine {tous|GN6} les midis.',
      '{Évidemment|LX8|Évidement/Évidamment}, personne#1 ne {voulait|SV1}@1 {partir|EE1|partire/parti}.',
      '{Quant|HO12|Quand/Qu’en} {à|HO1} moi, je#1 {préférais|SV1}@1 {réviser|EE1} {à|HO1} la maison.',
      'Le#1 professeur#1 {peut|HO13|peu/peux}@1 nous {aider|EE1} si nous#2 le lui {demandons|SV1|demandont/demandions}@2.',
      'Tu#1 {prendras|CJ5|prendrais/prendra}@1 le bus {ou|HO5|où} le vélo ?',
      'Il#1 {portait|SV1}@1 des {chaussettes|GN1} {marron|GN7|marrons}.',
      'Les#1 {élèves|GN1}#1, {riant|PP6|riants/riantes} {et|HO2} {criant|PP6|criants/criantes}, {sortirent|CJ3|sortires/sortaient}@1 de la classe.'
    ],

    /* ------------------------------------------------------------ la maison */
    maison: [
      'Le dimanche, {toute|GN6}#1 la#1 famille#1 se {réunissait|SV6|réunissaient/réunissais}@1 chez {mes|HO10} {grands-parents|LX12|grands parents/grand-parents}.',
      'Ma#1 mère#1 {préparait|EE2}@1 le repas pendant que nous#2 {mettions|CJ2|mettons/mettiont}@2 la table.',
      'Les#1 {volets|GN1}#1 {étaient|SV2}@1 {fermés|PP1|fermé/fermées}@1 {et|HO2} la#2 maison#2 {semblait|SV1}@2 {endormie|GN4|endormi/endormies}.',
      'Mon#1 petit#1 frère#1 {a|HO1}@1 {dessiné|PP3|dessinés/dessiner}@1 un bateau sur le mur.',
      'Les#1 {photos|GN1}#1 que ma#2 grand-mère#2 {avait|SV1}@2 {gardées|PP4|gardé/gardés}@2 {dormaient|SV3}@1 dans un {tiroir|LX14|tiroire}.',
      'Je#1 {regardais|SV1}@1 la pluie {tomber|EE1} sur les {carreaux|GN1} de la {fenêtre|LX3|fenètre}.',
      'Quand elle#1 {rentrait|SV1}@1 du travail, ma#2 {tante|LX11|tente}#2 nous {racontait|SV4}@2 sa {journée|LX7|journé}.',
      'Les#1 {enfants|GN1}#1 se {sont|HO3|son}@1 {disputés|PP5|disputé/disputées}@1 pour un jouet.',
      'Mon#1 père#1 {répara|CJ3|réparat/réparât}@1 la porte du garage en {sifflotant|PP6|sifflotent/sifflotants}.',
      '{Ses|HO7|Ces}#1 {cousins|GN1}#1 {arriveront|CJ5|arriverons/arriveraient}@1 demain matin.',
      'Nous#1 {avions|CJ2|avons/avaient}@1 peur de l’orage, {mais|HO10|mes} la#2 maison#2 nous {protégeait|SV4|protégeaient/protégait}@2.',
      'Il#1 {était|SV1}@1 {tard|LX1} : {tous|GN6}#2 les#2 {invités|GN1}#2 {étaient|SV2}@2 {partis|PP1|parti/parties}@2.',
      'La#1 {vieille|GN2|vieil/vieux}#1 horloge#1 du salon {sonna|CJ3|sonnat/sonnât}@1 minuit.',
      '{On|HO4|Ont}#1 {entendait|SV1}@1 le vent {siffler|EE1} sous la porte.',
      'Ma#1 sœur#1 {s’est|HO7|c’est/ses}@1 {coupée|PP5|coupé/coupés}@1 en {épluchant|PP6|épluchent/épluchants} les {légumes|GN1}.',
      'Elle#1 {portait|SV1}@1 une jupe {et|HO2} un manteau {noirs|GN5|noir/noires}.',
      'Ma#1 mère#1 {veut|CJ1|veux/veu}@1 que nous#2 {soyons|CJ8|soyions/sommes}@2 {rentrés|PP1|rentré/rentrées}@2 avant la nuit.',
      'Elles#1 se {sont|HO3|son}@1 {parlé|PP5|parlées/parler}@1 {pendant|LX1} des heures au téléphone.',
      'La#1 nuit#1 {s’était|HO17|c’était} {faite|PP5|fait/faites}@1 dans la chambre.',
      '{Ça|HO17|Sa}#1 {a|HO1}@1 été@1 une belle {journée|LX7|journé}.',
      'Le#1 repas#1 {était|SV1}@1 {prêt|HO19|près/prés} : {à|HO1} table !',
      'Je#1 m’{ennuyais|LX9|ennuiais/ennuillais}@1 pendant les longues {journées|GN1} de pluie.',
      '{Range|CJ7|Ranges/Rangé}@1 ta chambre {et|HO2} {va|CJ7|vas/vat}@2 te {coucher|EE1} !',
      'Elle#1 {chantait|EE2}@1 d’une {voix|LX11|voie/vois} {douce|GN3|doux/douces}.',
      'Le#1 chat#1 {frottait|SV1}@1 {son|HO3} {museau|LX14|musau} contre ma main.',
      'Une#1 {douce|GN3|doux/douces}#1 {nostalgie|LX14|nostaljie}#1 m’{envahissait|SV1}@1 {quand|HO12} je#2 {revoyais|SV1|revoyait/revoyaient}@2 ces photos.',
      'Cette boîte, ma#1 grand-mère#1 {l’a|HO8|la/là}@1 {rangée|PP4|rangé/rangés}@1 {là|HO8|la/l’a}, sur l’étagère.',
      'Mon#1#2 père#1#2 {essuyait|LX9|essuiait/essuillait}@1 la vaisselle {et|HO2} {chantonnait|SV1}@2.'
    ],

    /* ------------------------------------------------------------ la montagne */
    montagne: [
      'Les#1 {sommets|GN1}#1 {enneigés|GN2|enneigé/enneigées}#1 {brillaient|SV2}@1 sous le soleil.',
      'Nous#1 {montions|CJ2|montons/montiont}@1 lentement le long du sentier {étroit|GN2|étroite/étroits}.',
      'Le#1 guide#1 nous {conseilla|CJ3|conseillat/conseillât}@1 de boire {souvent|LX1}.',
      'Au refuge, les#1 {randonneurs|GN1}#1, {épuisés|GN4|épuisé/épuisées}, se {reposaient|SV2}@1 {près|HO19} du feu.',
      'Le#1 vent#1 {glacé|PP2|glacée/glacer}#1 nous {piquait|SV4|piquaient/piquais}@1 le visage.',
      'La#1#2 neige#1#2 {tombait|EE2}@1 {depuis|LX1} le matin {et|HO2} {recouvrait|SV1}@2 les {toits|GN1} du village.',
      'Il#1 {fallut|CJ3|fallu/fallait}@1 attendre que le#2 brouillard#2 se {dissipe|CJ8|dissipes/dissipent}@2.',
      'J’#1 {aperçus|CJ4|aperçu/aperçut}@1 un chamois&2 qui#2 {bondissait|SV5}@2 de rocher en rocher.',
      'Les#1 {skieurs|GN1}#1 {descendaient|SV2}@1 la piste {à|HO1} toute vitesse.',
      '{Quelle|HO15|Quel/Qu’elle} joie d’ atteindre enfin le sommet !',
      'Mes#1 {chaussures|GN1}#1 {étaient|SV2}@1 {trempées|GN4|trempé/trempés} {et|HO2} mes pieds gelés.',
      'Nous#1 {dormirons|CJ5|dormirions/dormiront}@1 dans un chalet {perdu|PP2|perdue/perdus} au milieu des {sapins|GN1}.',
      'Le#1 torrent#1, {gonflé|PP2|gonflée/gonflés} par la fonte des {neiges|GN1}, {grondait|SV3}@1 au fond de la vallée.',
      'Mon#1&2 oncle#1&2, qui#2 {connaissait|SV5}@2 chaque sentier, {marchait|SV1}@1 devant nous.',
      'Les#1 {nuages|GN1}#1 {cachaient|SV2}@1 {peu|HO13} {à|HO1} {peu|HO13} la montagne.',
      'Pour ne pas {glisser|EE1}, nous#1 {avons|CJ6|avions/ont}@1 {mis|EE3|mi/mit}@1 des {crampons|GN1}.',
      'Il#1 {restait|SV1}@1 {quelques|HO18|quelque} {nuages|GN1} {au-dessus|LX12|au dessus/audessus} du glacier.',
      '{Prends|CJ7|Prend/Prent}@1 ton manteau, il#2 {fait|SV1|fais/fai}@2 {froid|LX4|froi} ce soir.',
      'Il#1 {faisait|SV1}@1 {froid|LX4|froi} : nous#2 {avions|CJ2|avons/avaient}@2 {faim|LX11|fin} {et|HO2} soif.',
      'Les#1 {voyageurs|GN1}#1 {étaient|SV2}@1 {prêts|HO19|près/prêt} {à|HO1} {partir|EE1|partire/parti} {dès|LX3|des} l’aube.',
      'Bien qu’ il#1 {fût|CJ9|fut/fus}@1 {tard|LX1}, les#2 {alpinistes|GN1}#2 {continuèrent|CJ3|continuairent/continuaient}@2 leur ascension.',
      'Nous#1 {mangions|LX6|mangeions/mangons}@1 au refuge {après|LX1} la course.'
    ],

    /* ------------------------------------------------------------ la nuit, la forêt */
    nuit: [
      'La#1 nuit#1 {tombait|SV1}@1 {et|HO2} les#2 {arbres|GN1}#2 {prenaient|SV2}@2 des formes {étranges|GN2|étrange}.',
      'Une#1 chouette#1 {hululait|SV1}@1 quelque part dans la forêt.',
      'Je#1 n’{entendais|SV1}@1 plus que le craquement des {branches|GN1} {mortes|GN2|morte/morts}.',
      'Les#1 {étoiles|GN1}#1 {scintillaient|SV2}@1 au-dessus de nos {têtes|GN1}.',
      'Nous#1 {avancions|CJ2|avançions/avançons}@1 {à|HO1} tâtons, {serrés|PP2|serré/serrées} les uns contre les autres.',
      'Soudain, un#1 {bruit|LX4|brui}#1 {étrange|GN2|étranges}#1 nous {fit|CJ3|fis/fît}@1 {sursauter|EE1}.',
      '{Ce|HO6|Se}#1 n’{était|SV1}@1 que le vent&2 qui#2 {agitait|SV5}@2 les {feuilles|GN1}.',
      'La#1 lune#1 {éclairait|EE2}@1 le sentier {où|HO5|ou} nous#2 {marchions|CJ2|marchons/marchiont}@2.',
      'Les#1 {chauves-souris|LX12|chauves souris/chauve-souris}#1 {voletaient|SV2}@1 autour de la grange.',
      'Je#1 {croyais|SV1}@1 voir des {ombres|GN1} {partout|LX1}.',
      'Si nous#1 nous {perdions|CJ2|perdons/perdion}@1, mon#2 frère#2 {saurait|CJ5|saura/saurais}@2 {retrouver|EE1} le chemin.',
      'Le#1 feu#1 de camp {s’éteignait|SV3}@1 {doucement|LX8|doucemment}.',
      '{Ni|HO16|N’y} les#1 {hiboux|GN1}#1 {ni|HO16|n’y} les#1 {renards|GN1}#1 ne nous {effrayaient|SV6|effrayait/effrayés}@1.',
      'Il#1 {n’y|HO16|ni} {avait|SV1}@1 personne : la#2 forêt#2 {était|SV1}@2 {silencieuse|GN4|silencieux/silencieuses}.',
      'Les#1 {grenouilles|GN1}#1 {coassaient|SV2}@1 dans l’{étang|LX4|étan}.',
      'Nous#1 {sommes|CJ6|somme/sont}@1 {rentrés|PP1|rentré/rentrées}@1 {tard|LX1}, {fatigués|PP2|fatigué/fatiguées} {mais|HO10|mes} {heureux|GN4}.',
      'La#1 clairière#1 {était|SV1}@1 {si|HO16|s’y} calme qu’ {on|HO4}#2 {s’y|HO16|si} {reposait|SV1}@2 volontiers.',
      'Le#1 {crépuscule|LX14|crépuscul}#1 {colorait|EE2}@1 le ciel de rose.',
      'Elle#1 {sent|HO11|sans/s’en}@1 l’odeur des {pins|GN1} {et|HO2} de la mousse {humide|GN2|humides}.',
      'Il#1 {était|SV1}@1 {minuit|LX4|minuie} {quand|HO12|quant} les#2 {loups|GN1}#2 {commencèrent|CJ3|commençèrent/commencairent}@2 {à|HO1} hurler.',
      'Les#1 {enfants|GN1}#1 se {cachaient|SV2}@1 derrière {ce|HO6|se} grand chêne.'
    ],

    /* ------------------------------------------------------------ le voyage */
    voyage: [
      'Le#1 train#1 {partit|CJ3|partis/partît}@1 {à|HO1} l’heure, sous une pluie fine.',
      'Par la {fenêtre|LX3|fenètre}, je#1 {regardais|SV1}@1 {défiler|EE1} les {paysages|GN1}.',
      'Les#1 {voyageurs|GN1}#1, {chargés|GN4|chargé/chargées} de {valises|GN1}, se {pressaient|SV2}@1 sur le quai.',
      'Nous#1 {sommes|CJ6|somme/sont}@1 {arrivés|PP1|arrivé/arrivées}@1 {à|HO1} {Lyon|LX13|lyon} vers midi.',
      'Ma#1 tante#1 nous {attendait|SV4|attendaient/attendais}@1 {à|HO1} la gare.',
      '{Quand|HO12|Quant/Qu’en} nous#1 {serons|CJ5|seront/serions}@1 en {Italie|LX13|italie}, nous#2 {visiterons|CJ5|visiteront/visiterions}@2 Rome.',
      'Le#1 contrôleur#1 {vérifiait|EE2}@1 les billets que les#2 {passagers|GN1}#2 lui {tendaient|SV4|tendait/tendais}@2.',
      'J’#1 {avais|SV1|avait/avaient}@1 {oublié|PP3|oubliée/oublier}@1 mon billet, {mais|HO10|mes} le#2 contrôleur#2 {fut|CJ3|fût/fus}@2 compréhensif.',
      'Les#1 {valises|GN1}#1 {étaient|SV2}@1 si {lourdes|GN4|lourde/lourds} que nous#2 {dûmes|CJ3|dumes/dûmmes}@2 prendre un taxi.',
      'Il#1 {faisait|SV1}@1 si chaud que les#2 {passagers|GN1}#2 {ouvraient|SV2}@2 {toutes|GN6} les {fenêtres|GN1}.',
      'Le#1 car#1 {s’arrêta|CJ3|s’arrêtât/s’arrêtat}@1 devant un {hôtel|LX3|hotel} {où|HO5|ou} nous#2 {passâmes|CJ3|passames/passâme}@2 la nuit.',
      '{À|HO1|A} l’aéroport, les#1 {annonces|GN1}#1 se {succédaient|SV2}@1 sans arrêt.',
      'Mon#1 correspondant#1 m’{a|HO1}@1 {envoyé|PP3|envoyée/envoyer}@1 une lettre {et|HO2} des {cartes|GN1} {postales|GN2|postale/postaux}.',
      'Je#1 {garderai|CJ5|garderais/garderait}@1 {longtemps|LX1} le souvenir de ce voyage.',
      'Nos#1 {amis|GN1}#1 {anglais|LX13|Anglais}#1 nous {ont|HO4|on}@1 {accueillis|PP4|accueilli/accueillies}@1 {chaleureusement|LX8|chaleureusemant}.',
      '{Partout|LX1}, des#1 {touristes|GN1}#1 {photographiaient|SV2|photographiait/photographiais}@1 les {monuments|GN1} {anciens|GN2|ancien/anciennes}.',
      'Pendant l’été, nous#1 {partions|CJ2|partons/partiont}@1 en {Bretagne|LX13|bretagne}.',
      'Je#1 ne {savais|SV1}@1 pas {quelle|HO15|qu’elle/quel} route prendre.',
      'Je#1 {pense|SV1|penses/pensent}@1 {qu’elle|HO15|quelle/quel}#2 {viendra|CJ5|viendrait/viendras}@2 nous voir cet été.',
      'Je#1 {préfère|SV1|préfères/préfèrent}@1 {plutôt|HO19|plus tôt} la mer {à|HO1} la montagne.',
      'Nous#1 {avons|CJ6|avions/ont}@1 {attendu|EE3|attendus/attendut}@1 {quelques|HO18|quelque} minutes sur le quai.',
      'Je#1 ne {savais|SV1}@1 plus {où|HO5|ou} {aller|EE1}.'
    ]
  },

  /* ================================================================ gabarits */
  gabarits: [
    /* ---- la mer */
    { th: 'mer', t: '[S] [V] [N.poss] [A] sur le quai.',
      S: ['les pêcheurs/mp', 'ils', 'nous', 'je', 'mon oncle/ms', 'les marins/mp', 'elle', 'tu', 'mes cousines/fp'],
      V: 'ranger,déposer,laver,réparer', T: ['imp', 'pr', 'ps', 'pc'], N: 'filet/m,panier/m,caisse/f,barque/f', A: 'lourd,mouillé,vide,usé' },
    { th: 'mer', t: '[S] [V] la mer pendant que [S2] [V2] sur le sable.',
      S: ['je', 'nous', 'ma grand-mère/fs', 'mes parents/mp', 'tu', 'vous'], V: 'regarder,observer,contempler', T: ['imp'],
      S2: ['les enfants/mp', 'mes cousines/fp', 'tu', 'nous', 'mon petit frère/ms', 'ils', 'elle'], V2: 'jouer,courir,creuser,dormir', T2: ['imp'] },
    { th: 'mer', t: '[S] [V.pc] sur la plage pour [I] [N.des].',
      S: ['je', 'tu', 'elle', 'nous', 'les enfants/mp', 'mes sœurs/fp', 'mon frère/ms', 'elles'], V: 'aller,arriver,venir,retourner,partir',
      I: 'ramasser,chercher,trouver,collectionner', N: 'coquillage/m,algue/f,galet/m,crabe/m' },
    { th: 'mer', t: '[S] [V] contre la coque du bateau {et|HO2} [V2] le pont.',
      S: ['les vagues/fp', 'la houle/fs', 'le vent/ms', 'les rafales/fp', 'les embruns/mp'], V: 'cogner,frapper,claquer', V2: 'inonder,balayer,mouiller', T: ['imp', 'ps'] },

    /* ---- la ville */
    { th: 'ville', t: '[S] [V] les vitrines {et|HO2} [V2] un cadeau pour [N.mon].',
      S: ['je', 'nous', 'ma mère/fs', 'mes amies/fp', 'tu', 'les touristes/mp', 'il'], V: 'regarder,observer,admirer', V2: 'chercher,choisir,trouver',
      T: ['imp', 'pr'], N: 'cousin/m,cousine/f,ami/m,amie/f,frère/m,sœur/f' },
    { th: 'ville', t: '[S] [V.pc] en ville pour [I] [N.des] [A].',
      S: ['je', 'tu', 'ma sœur/fs', 'nous', 'mes parents/mp', 'elles', 'mon père/ms'], V: 'aller,partir,venir,retourner',
      I: 'chercher,trouver,commander,réparer', N: 'chaussure/f,livre/m,cahier/m,veste/f,gant/m', A: 'neuf,noir,léger,chaud' },
    { th: 'ville', t: '[S] [V] le bus devant la mairie.',
      S: ['je', 'tu', 'les élèves/mp', 'nous', 'ma voisine/fs', 'vous', 'les ouvriers/mp', 'on'], V: 'attendre,prendre,manquer', T: ['imp', 'pr', 'ps', 'fut', 'cond'] },
    { th: 'ville', t: '[S] [V] dans les rues, [A.S] de [I] la ville.',
      S: ['je', 'nous', 'les touristes/mp', 'mes cousines/fp', 'elle', 'ils', 'tu'], V: 'marcher,flâner,courir', T: ['imp', 'ps', 'pr'],
      A: 'heureux,content,ravi,impatient,fier', I: 'visiter,explorer,découvrir' },

    /* ---- la campagne */
    { th: 'campagne', t: '[S] [V] [N.les] [A] dans le pré.',
      S: ['le fermier/ms', 'je', 'nous', 'mes oncles/mp', 'la bergère/fs', 'tu', 'ils'], V: 'garder,soigner,rassembler,nourrir', T: ['imp', 'pr', 'ps', 'pc'],
      N: 'vache/f,mouton/m,cheval/m,chèvre/f', A: 'affamé,docile,blanc,noir' },
    { th: 'campagne', t: '[S] [V.pc] dans le jardin pour [I] des {légumes|GN1}.',
      S: ['je', 'tu', 'ma grand-mère/fs', 'nous', 'mes parents/mp', 'les filles/fp', 'il'], V: 'aller,sortir,descendre', I: 'ramasser,arroser,planter,récolter' },
    { th: 'campagne', t: 'Au printemps, [S] [V] le potager {et|HO2} [V2] [N.des] [A].',
      S: ['mon grand-père/ms', 'nous', 'je', 'les voisins/mp', 'ma tante/fs', 'tu'], V: 'labourer,arroser,préparer', V2: 'planter,récolter,repiquer',
      T: ['imp', 'pr', 'fut'], N: 'graine/f,salade/f,radis/m,haricot/m', A: 'vert,petit,précieux,tendre' },
    { th: 'campagne', t: '[S] [V] sous le grand chêne, [A.S] après la moisson.',
      S: ['les paysans/mp', 'je', 'nous', 'mes cousines/fp', 'le vieux fermier/ms', 'elle', 'tu'], V: 'dormir,rêver,discuter,bavarder', T: ['imp', 'ps', 'pr'],
      A: 'fatigué,épuisé,heureux,satisfait' },

    /* ---- le collège */
    { th: 'ecole', t: '[S] [V] [N.poss] [A] au professeur.',
      S: ['je', 'tu', 'les élèves/mp', 'nous', 'ma voisine/fs', 'vous', 'mon camarade/ms', 'elles'], V: 'rendre,montrer,apporter,donner', T: ['imp', 'pr', 'ps', 'pc', 'fut'],
      N: 'copie/f,devoir/m,cahier/m,exposé/m,dessin/m', A: 'terminé,soigné,complet,illustré' },
    { th: 'ecole', t: '[S] [V] la leçon {et|HO2} [V2] les exercices {sans|HO11} difficulté.',
      S: ['je', 'tu', 'mes camarades/mp', 'nous', 'ma sœur/fs', 'vous', 'il', 'les filles/fp'], V: 'apprendre,réviser,étudier', V2: 'terminer,finir,réussir,corriger',
      T: ['imp', 'pr', 'ps', 'fut', 'pc'] },
    { th: 'ecole', t: '[S] [V.pc] en retard {à|HO1} cause du bus.',
      S: ['je', 'tu', 'les élèves/mp', 'nous', 'ma voisine/fs', 'elles', 'mon ami/ms', 'vous'], V: 'arriver,venir,entrer,rentrer' },
    { th: 'ecole', t: 'Pendant le cours, [S] [V] {sans|HO11} [I].',
      S: ['je', 'tu', 'les élèves/mp', 'nous', 'ma voisine/fs', 'ils', 'vous'], V: 'écouter,travailler,écrire,lire', T: ['imp', 'pr', 'ps'], I: 'bavarder,parler,rêvasser' },

    /* ---- la maison */
    { th: 'maison', t: '[S] [V] la table pendant que [S2] [V2] le repas.',
      S: ['je', 'tu', 'mes frères/mp', 'nous', 'ma sœur/fs', 'les enfants/mp'], V: 'mettre,débarrasser,ranger', T: ['imp', 'pr'],
      S2: ['ma mère/fs', 'mes parents/mp', 'mon père/ms', 'nous', 'les grands-parents/mp', 'tu'], V2: 'préparer,cuisiner,réchauffer' },
    { th: 'maison', t: '[S] [V.pc] de l’école, puis [S] [V2.pc] [N.poss] [A] dans l’entrée.',
      S: ['je', 'tu', 'mes frères/mp', 'nous', 'ma sœur/fs', 'les enfants/mp', 'elles'], V: 'rentrer,revenir,arriver', V2: 'poser,laisser,ranger',
      N: 'sac/m,manteau/m,chaussure/f,écharpe/f', A: 'mouillé,lourd,neuf' },
    { th: 'maison', t: '[S] [V] chez [N.poss] le dimanche.',
      S: ['je', 'tu', 'nous', 'mes cousins/mp', 'ma sœur/fs', 'vous', 'il', 'elles'], V: 'déjeuner,manger,aller', T: ['imp', 'pr', 'fut', 'pc'],
      N: 'grand-mère/f/grands-mères,oncle/m,tante/f,cousin/m,grand-père/m/grands-pères' },
    { th: 'maison', t: '[S] [V] [N.le1] avec soin avant le retour de [N2.poss1].',
      S: ['je', 'tu', 'nous', 'mes sœurs/fp', 'mon frère/ms', 'les enfants/mp'], V: 'ranger,décorer,préparer', T: ['imp', 'ps', 'fut', 'pc'],
      N: 'salon/m,cuisine/f,chambre/f,bureau/m', N2: 'mère/f,père/m,cousine/f,sœur/f' },

    /* ---- la montagne */
    { th: 'montagne', t: '[S] [V] le sentier jusqu’au refuge, [A.S] {mais|HO10} [A2.S].',
      S: ['je', 'nous', 'les randonneurs/mp', 'mes amies/fp', 'le guide/ms', 'elle', 'tu'], V: 'grimper,gravir', T: ['imp', 'ps'],
      A: 'fatigué,épuisé,essoufflé', A2: 'heureux,fier,ravi,content' },
    { th: 'montagne', t: '[S] [V.pc] au sommet avant midi.',
      S: ['je', 'tu', 'les alpinistes/mp', 'nous', 'ma cousine/fs', 'elles', 'mon père/ms'], V: 'arriver,monter' },
    { th: 'montagne', t: '[S] [V] [N.des] [A] sur la neige.',
      S: ['je', 'nous', 'les enfants/mp', 'mon frère/ms', 'tu', 'elles', 'le chasseur/ms'], V: 'observer,remarquer,découvrir', T: ['imp', 'ps', 'pc'],
      N: 'trace/f,empreinte/f,branche/f,caillou/m', A: 'profond,léger,étrange' },
    { th: 'montagne', t: 'Le soir, [S] [V] {près|HO19} du feu pour [I].',
      S: ['je', 'nous', 'les bergers/mp', 'mes cousines/fp', 'le guide/ms', 'tu', 'vous'], V: 'rester,veiller,discuter', T: ['imp', 'ps', 'pr'], I: 'chanter,parler,jouer' },

    /* ---- la nuit */
    { th: 'nuit', t: '[S] [V] dans la forêt sans [I] le moindre bruit.',
      S: ['je', 'nous', 'les chasseurs/mp', 'mes amies/fp', 'le loup/ms', 'tu', 'elles'], V: 'marcher,avancer,progresser', T: ['imp', 'ps', 'pc'], I: 'faire,entendre' },
    { th: 'nuit', t: '[S] [V] [N.les] [A] du ciel.',
      S: ['je', 'nous', 'les campeurs/mp', 'ma sœur/fs', 'tu', 'vous', 'ils'], V: 'regarder,contempler,compter', T: ['imp', 'pr', 'ps'],
      N: 'étoile/f,nuage/m,lueur/f', A: 'brillant,lointain,immense' },
    { th: 'nuit', t: '[S] [V.pc] sous la tente, puis [S] [V2.pc] {tard|LX1}.',
      S: ['je', 'tu', 'les campeurs/mp', 'nous', 'ma cousine/fs', 'elles'], V: 'entrer,rentrer', V2: 'discuter,parler,bavarder' },
    { th: 'nuit', t: '[S] [V] peur : [S2] [V2] {dans|HO14} les arbres.',
      S: ['je', 'nous', 'les enfants/mp', 'ma sœur/fs', 'tu', 'elles'], V: 'avoir', T: ['imp', 'pr'],
      S2: ['le vent/ms', 'les rafales/fp', 'la tempête/fs', 'les hiboux/mp'], V2: 'souffler,siffler,hurler' },

    /* ---- le voyage */
    { th: 'voyage', t: '[S] [V] le train de huit heures pour [I] [N.poss] {à|HO1} Paris.',
      S: ['je', 'tu', 'nous', 'mes parents/mp', 'ma tante/fs', 'vous', 'les élèves/mp'], V: 'prendre,attendre,manquer', T: ['imp', 'pr', 'ps', 'fut', 'pc'],
      I: 'retrouver,rejoindre,visiter', N: 'cousin/m,tante/f,ami/m,amie/f,grand-père/m/grands-pères' },
    { th: 'voyage', t: '[S] [V.pc] {à|HO1} la gare avec [N.poss] [A].',
      S: ['je', 'tu', 'nous', 'les voyageurs/mp', 'ma sœur/fs', 'elles', 'mon oncle/ms'], V: 'arriver,partir,venir', N: 'valise/f,sac/m,bagage/m', A: 'lourd,énorme,neuf' },
    { th: 'voyage', t: 'Pendant le voyage, [S] [V] [N.des] [A] par la fenêtre.',
      S: ['je', 'nous', 'les passagers/mp', 'ma mère/fs', 'tu', 'elles'], V: 'photographier,observer,admirer', T: ['imp', 'ps', 'pc'],
      N: 'paysage/m,village/m,colline/f,rivière/f', A: 'magnifique,lointain,ensoleillé' },
    { th: 'voyage', t: '[S] [V] {quelques|HO18} jours {près|HO19} de la mer.',
      S: ['je', 'nous', 'mes grands-parents/mp', 'ma tante/fs', 'tu', 'elles', 'vous'], V: 'passer,rester', T: ['pc', 'imp', 'fut', 'cond'] }
  ]
};
