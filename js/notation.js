// ============================================================
// DRAGHISTORIK (schack-notation)
// ============================================================
function byggNotation(drag, pjasTyp, pjasFarg, nyttBrade) {
  const kol   = 'abcdefgh'[drag.tillKol];
  const rad   = (8 - drag.tillRad).toString();
  const namn  = NOTATIONS_NAMN[pjasTyp];
  let text    = namn + kol + rad;
  if (drag.specialTyp === 'kortRokad') text = 'O-O';
  if (drag.specialTyp === 'langRokad') text = 'O-O-O';
  if (drag.specialTyp === 'promotion') text += '=D'; // Alltid dam om bot; modal för spelare
  return text;
}

function uppdateraDragHistorik() {
  dragHistEl.innerHTML = '';
  dragHistorikData.forEach((drag, i) => {
    if (i % 2 === 0) {
      const nr = document.createElement('span');
      nr.className = 'drag-nummer';
      nr.textContent = `${Math.floor(i/2)+1}. `;
      dragHistEl.appendChild(nr);
    }
    const d = document.createElement('span');
    d.className = 'drag-post';
    d.textContent = drag + ' ';
    dragHistEl.appendChild(d);
  });
  dragHistEl.scrollTop = dragHistEl.scrollHeight;
}