/* ============================================================
   Schémas utilisés par la maquette : situation du module 2 (générateur,
   ampèremètre, interrupteur, lampe, moteur) et schémas du TP (série,
   dérivation, loi d'Ohm), refaits d'après « TP circuit electrique ».
   Coordonnées dans le repère du schéma (viewBox).
   ============================================================ */
window.SCHEMAS = {
  // module 2, situation 3 : + → ampèremètre (10A puis COM) → interrupteur → lampe → moteur → −
  situation: {
    vb: [300, 216],
    dipoles: [
      { id: 'G', type: 'generateur', x: 150, y: 30, rot: 0 },
      { id: 'A', type: 'amperemetre', x: 40, y: 110, rot: 90, com: 1 },
      { id: 'K', type: 'interrupteur', x: 110, y: 190, rot: 0, ouvert: true },
      { id: 'L', type: 'lampe', x: 190, y: 190, rot: 0 },
      { id: 'M', type: 'moteur', x: 260, y: 110, rot: 90 },
    ],
    fils: [
      { id: 'f1', pts: [[138, 30], [40, 30], [40, 99]] },
      { id: 'f2', pts: [[40, 121], [40, 190], [96, 190]] },
      { id: 'f3', pts: [[124, 190], [180, 190]] },
      { id: 'f4', pts: [[200, 190], [260, 190], [260, 121]] },
      { id: 'f5', pts: [[260, 99], [260, 30], [162, 30]] },
    ],
    noeuds: [],
    intensites: [{ nom: 'I', x: 40, y: 66, dir: 'bas' }],
    tensions: [],
  },

  // TP, circuit en série : trois ampèremètres (I1, I2, I3) et trois voltmètres (UG, U390, U100)
  serie: {
    vb: [340, 216],
    dipoles: [
      { id: 'G', type: 'generateur', x: 170, y: 70, rot: 0 },
      { id: 'VG', type: 'voltmetre', x: 170, y: 16, rot: 0, com: 1 },
      { id: 'A1', type: 'amperemetre', x: 30, y: 100, rot: 90, com: 1 },
      { id: 'R1', type: 'resistance', x: 95, y: 150, rot: 0, valeur: '390 Ω' },
      { id: 'A2', type: 'amperemetre', x: 170, y: 150, rot: 0, com: 1 },
      { id: 'R2', type: 'resistance', x: 245, y: 150, rot: 0, valeur: '100 Ω' },
      { id: 'A3', type: 'amperemetre', x: 310, y: 100, rot: 90, com: -1 },
      { id: 'V1', type: 'voltmetre', x: 95, y: 196, rot: 0, com: 1 },
      { id: 'V2', type: 'voltmetre', x: 245, y: 196, rot: 0, com: 1 },
    ],
    fils: [
      { id: 'g1', pts: [[30, 70], [158, 70]] }, { id: 'g2', pts: [[182, 70], [310, 70]] },
      { id: 'vg1', pts: [[30, 70], [30, 16], [159, 16]] }, { id: 'vg2', pts: [[181, 16], [310, 16], [310, 70]] },
      { id: 'a1', pts: [[30, 70], [30, 89]] }, { id: 'b1', pts: [[30, 111], [30, 150], [74, 150]] },
      { id: 'b2', pts: [[116, 150], [159, 150]] }, { id: 'b3', pts: [[181, 150], [224, 150]] },
      { id: 'b4', pts: [[266, 150], [310, 150], [310, 111]] }, { id: 'a3', pts: [[310, 89], [310, 70]] },
      { id: 'v11', pts: [[52, 150], [52, 196], [84, 196]] }, { id: 'v12', pts: [[106, 196], [138, 196], [138, 150]] },
      { id: 'v21', pts: [[202, 150], [202, 196], [234, 196]] }, { id: 'v22', pts: [[256, 196], [288, 196], [288, 150]] },
    ],
    noeuds: [{ id: 'n1', x: 30, y: 70 }, { id: 'n2', x: 310, y: 70 }, { id: 'n3', x: 52, y: 150 }, { id: 'n4', x: 138, y: 150 },
             { id: 'n5', x: 202, y: 150 }, { id: 'n6', x: 288, y: 150 }],
    intensites: [{ nom: 'I_1', x: 30, y: 80, dir: 'bas' }, { nom: 'I_2', x: 150, y: 150, dir: 'droite' },
                 { nom: 'I_3', x: 310, y: 132, dir: 'haut', cote: 'droite' }],
    tensions: [{ nom: 'U_G', x1: 230, y1: 46, x2: 110, y2: 46, cote: 'haut' },
               { nom: 'U_390', x1: 117, y1: 167, x2: 73, y2: 167, cote: 'bas' },
               { nom: 'U_100', x1: 267, y1: 167, x2: 223, y2: 167, cote: 'bas' }],
  },

  // TP, circuit en dérivation : I1 (branche principale), I2 (390 Ω), I3 (100 Ω)
  derivation: {
    vb: [300, 206],
    dipoles: [
      { id: 'G', type: 'generateur', x: 190, y: 40, rot: 0 },
      { id: 'A1', type: 'amperemetre', x: 60, y: 72, rot: 90, com: 1 },
      { id: 'A2', type: 'amperemetre', x: 106, y: 110, rot: 0, com: 1 },
      { id: 'R1', type: 'resistance', x: 180, y: 110, rot: 0, valeur: '390 Ω' },
      { id: 'A3', type: 'amperemetre', x: 60, y: 146, rot: 90, com: 1 },
      { id: 'R2', type: 'resistance', x: 180, y: 186, rot: 0, valeur: '100 Ω' },
    ],
    fils: [
      { id: 'p1', pts: [[178, 40], [60, 40], [60, 61]] }, { id: 'p2', pts: [[60, 83], [60, 110]] },
      { id: 'b1', pts: [[60, 110], [95, 110]] }, { id: 'b2', pts: [[117, 110], [159, 110]] }, { id: 'b3', pts: [[201, 110], [270, 110]] },
      { id: 'c1', pts: [[60, 110], [60, 135]] }, { id: 'c2', pts: [[60, 157], [60, 186], [159, 186]] },
      { id: 'c3', pts: [[201, 186], [270, 186], [270, 110]] }, { id: 'p3', pts: [[270, 110], [270, 40], [202, 40]] },
    ],
    noeuds: [{ id: 'n1', x: 60, y: 110 }, { id: 'n2', x: 270, y: 110 }],
    intensites: [{ nom: 'I_1', x: 60, y: 96, dir: 'bas' }, { nom: 'I_2', x: 135, y: 110, dir: 'droite' },
                 { nom: 'I_3', x: 60, y: 170, dir: 'bas' }],
    tensions: [{ nom: 'U_G', x1: 228, y1: 12, x2: 152, y2: 12, cote: 'haut' },
               { nom: 'U_390', x1: 203, y1: 94, x2: 157, y2: 94, cote: 'haut' },
               { nom: 'U_100', x1: 203, y1: 170, x2: 157, y2: 170, cote: 'haut' }],
  },

  // TP, loi d'Ohm : ampèremètre en série, voltmètre en dérivation sur la résistance de 470 Ω
  ohm: {
    vb: [270, 190],
    dipoles: [
      { id: 'G', type: 'generateur', x: 150, y: 32, rot: 0 },
      { id: 'A', type: 'amperemetre', x: 50, y: 72, rot: 90, com: 1 },
      { id: 'R', type: 'resistance', x: 140, y: 116, rot: 0, valeur: '470 Ω' },
      { id: 'V', type: 'voltmetre', x: 140, y: 170, rot: 0, com: 1 },
    ],
    fils: [
      { id: 'p1', pts: [[138, 32], [50, 32], [50, 61]] }, { id: 'p2', pts: [[50, 83], [50, 116], [119, 116]] },
      { id: 'p3', pts: [[161, 116], [230, 116], [230, 32], [162, 32]] },
      { id: 'v1', pts: [[50, 116], [50, 170], [129, 170]] }, { id: 'v2', pts: [[151, 170], [230, 170], [230, 116]] },
    ],
    noeuds: [{ id: 'n1', x: 50, y: 116 }, { id: 'n2', x: 230, y: 116 }],
    intensites: [{ nom: 'I', x: 50, y: 48, dir: 'bas' }],
    tensions: [{ nom: 'U', x1: 163, y1: 100, x2: 117, y2: 100, cote: 'haut' }],
  },
};
