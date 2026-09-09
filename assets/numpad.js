/* ============================================================
   Pavé numérique commun à toutes les applications.

   Utilisation dans une application :

     <script src="../assets/numpad.js"></script>
     ...
     ${numpadToggleBar()}                 // une fois par écran, en haut
     <input type="text" id="rep" onfocus="numpadFocus(this.id)" ontouchstart="numpadFocus(this.id)">
     ${numpadWidget()}                    // une fois par question, près des champs

   L'état (pavé activé/désactivé) est conservé dans une variable de
   module tant que la page n'est pas rechargée : il reste donc
   identique quand on change de question ou de module.
   ============================================================ */

(function () {
  'use strict';

  let numpadTarget = null;
  let numpadEnabled = true;

  function setNumpadPref(checked) {
    numpadEnabled = checked;
    if (checked) {
      document.body.classList.remove('numpad-disabled');
    } else {
      document.body.classList.add('numpad-disabled');
    }
    document.querySelectorAll('.np-pref-toggle').forEach(cb => { cb.checked = checked; });
  }

  function numpadToggleBar() {
    const chk = numpadEnabled ? 'checked' : '';
    return `<div class="np-pref-bar">
        <span class="np-pref-label">Pavé numérique</span>
        <label class="np-switch">
            <input type="checkbox" class="np-pref-toggle" ${chk} onchange="setNumpadPref(this.checked)">
            <span class="np-slider"></span>
        </label>
        <span class="np-pref-hint">Active ou désactive l'affichage des pavés numériques sur toute la page.</span>
    </div>`;
  }

  function numpadWidget() {
    return `
    <div class="np-section">
        <div class="numpad-grid">
            <button type="button" onclick="numpadKey('7')">7</button>
            <button type="button" onclick="numpadKey('8')">8</button>
            <button type="button" onclick="numpadKey('9')">9</button>
            <button type="button" onclick="numpadKey('4')">4</button>
            <button type="button" onclick="numpadKey('5')">5</button>
            <button type="button" onclick="numpadKey('6')">6</button>
            <button type="button" onclick="numpadKey('1')">1</button>
            <button type="button" onclick="numpadKey('2')">2</button>
            <button type="button" onclick="numpadKey('3')">3</button>
            <button type="button" class="np-minus" onclick="numpadKey('-')">−</button>
            <button type="button" onclick="numpadKey('0')">0</button>
            <button type="button" class="np-back" onclick="numpadKey('⌫')">⌫</button>
            <button type="button" class="np-wide" onclick="numpadKey(',')">virgule &nbsp; ,</button>
        </div>
    </div>`;
  }

  function numpadFocus(id) { numpadTarget = id; }

  function numpadKey(val) {
    const inp = document.getElementById(numpadTarget);
    if (!inp) return;
    const isNum = inp.type === 'number';
    if (isNum && val === ',') return;
    if (val === '⌫') {
      inp.value = inp.value.slice(0, -1);
    } else if (val === '-') {
      if (isNum) {
        if (inp.value === '' || inp.value === '-') {
          inp.value = inp.value === '-' ? '' : '-';
        } else {
          inp.value = inp.value.startsWith('-') ? inp.value.slice(1) : '-' + inp.value;
        }
      } else {
        inp.value = inp.value.startsWith('-') ? inp.value.slice(1) : '-' + inp.value;
      }
    } else {
      inp.value += val;
    }
    inp.dispatchEvent(new Event('input'));
  }

  window.numpadToggleBar = numpadToggleBar;
  window.numpadWidget = numpadWidget;
  window.numpadFocus = numpadFocus;
  window.numpadKey = numpadKey;
  window.setNumpadPref = setNumpadPref;
})();
