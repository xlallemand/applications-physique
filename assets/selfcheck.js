/* ============================================================
   Petites questions "Vérifie ta compréhension" (communes à toutes
   les applications), utilisées dans les pages de cours après un
   exemple pour rendre l'élève actif.

   Utilisation :

     <div class="check-box">
       <p class="check-label">Vérifie ta compréhension :</p>
       <p class="check-question">Combien vaut 10<sup>4</sup> ?</p>
       <div class="flex items-center gap-3 flex-wrap">
         <input type="text" id="q1" inputmode="numeric" class="check-input w-28"
                placeholder="Réponse" onfocus="numpadFocus(this.id)" ontouchstart="numpadFocus(this.id)">
         <button class="check-btn" onclick="checkAnswer('q1', 10000, 'r1')">Vérifier</button>
       </div>
       <p id="r1" class="mt-2 font-semibold"></p>
     </div>
   ============================================================ */

(function () {
  'use strict';

  function checkAnswer(inputId, correct, resultId, isDecimal) {
    const input = document.getElementById(inputId);
    const result = document.getElementById(resultId);
    const userAnswer = input.value.trim();
    const ua = parseFloat(userAnswer.replace(',', '.'));
    const ca = parseFloat(String(correct).replace(',', '.'));
    const tolerance = isDecimal ? 0.000001 : 0;
    if (!isNaN(ua) && Math.abs(ua - ca) <= tolerance) {
      result.innerHTML = '✓ Correct ! 🎉';
      result.style.color = '#166534';
    } else {
      result.innerHTML = '✗ Incorrect. La réponse est : ' + correct;
      result.style.color = '#991b1b';
    }
  }

  function checkSci(idA, idN, correctA, correctN, resultId) {
    const userA = parseFloat(document.getElementById(idA).value.replace(',', '.'));
    const userN = parseInt(document.getElementById(idN).value, 10);
    const result = document.getElementById(resultId);
    if (Math.abs(userA - correctA) < 0.01 && userN === correctN) {
      result.innerHTML = '✓ Correct ! 🎉';
      result.style.color = '#166534';
    } else {
      result.innerHTML = `✗ Incorrect. La réponse est : ${String(correctA).replace('.', ',')} × 10<sup>${correctN}</sup>`;
      result.style.color = '#991b1b';
    }
  }

  /* Réponse donnée sous forme coefficient × 10^exposant (comme dans les
     exercices) : accepte toute décomposition mathématiquement équivalente
     à la valeur attendue, pas seulement le couple (coefficient, exposant)
     "canonique" passé en argument. */
  function checkConversion(idCoeff, idExp, correctCoeff, correctExp, resultId) {
    const result = document.getElementById(resultId);
    const rawC = document.getElementById(idCoeff).value.trim().replace(',', '.').replace('−', '-');
    const rawE = document.getElementById(idExp).value.trim().replace(',', '.').replace('−', '-');
    const uC = parseFloat(rawC);
    const uE = parseInt(rawE, 10);
    if (rawC === '' || rawE === '' || isNaN(uC) || isNaN(uE)) {
      result.innerHTML = 'Merci de remplir les deux cases.';
      result.style.color = '#991b1b';
      return;
    }
    const uVal = uC * Math.pow(10, uE);
    const cVal = correctCoeff * Math.pow(10, correctExp);
    const ok = Math.abs(uVal - cVal) < Math.abs(cVal) * 1e-9 + 1e-30;
    if (ok) {
      result.innerHTML = '✓ Correct ! 🎉';
      result.style.color = '#166534';
    } else {
      result.innerHTML = `✗ Incorrect. La réponse est : ${String(correctCoeff).replace('.', ',')} × 10<sup>${correctExp}</sup>`;
      result.style.color = '#991b1b';
    }
  }

  window.checkAnswer = checkAnswer;
  window.checkSci = checkSci;
  window.checkConversion = checkConversion;
})();
