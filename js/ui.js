// ============================================================
// STATUSTEXT
// ============================================================
function uppdateraInfoRad() {
  if (spelOver) return;
  const iSchack = arISchack(brade, aktivFarg);
  const vems = aktivFarg === VIT ? 'Vit' : 'Svart';
  statusTextEl.textContent = iSchack ? `${vems} är i schack!` : `${vems}s tur`;

  // Spela schack-ljud när kungen hamnar i schack
  if (iSchack) spelaSchackLjud();
}
function uppdateraTagnaPjasar() {
  // Visa tagna pjäser för varje spelare
  underTagnaEl.textContent = tagnaPjasar[VIT].map(p => PJAS_SYMBOLER[SVART][p]).join('');
  overTagnaEl.textContent  = tagnaPjasar[SVART].map(p => PJAS_SYMBOLER[VIT][p]).join('');
}

// ============================================================
// MENY-NAVIGATION
// ============================================================
function visaSpelVy() {
  document.getElementById('startMeny').style.display = 'none';
  document.getElementById('spelVy').style.display   = 'flex';
  if (anvandKlocka) {
    overKlockaEl.style.display  = 'block';
    underKlockaEl.style.display = 'block';
  } else {
    overKlockaEl.style.display  = 'none';
    underKlockaEl.style.display = 'none';
  }
  // Visa båda knapprader
  const visaOverKnappar = spelLage === 'tvaspelare';
  document.getElementById('overKnappar').style.display = visaOverKnappar ? 'flex' : 'none';

  // Uppdatera spelarnamn
  overNamnEl.textContent  = spelLage === 'enspelare' ? ' Bot' : 'Svart';
  underNamnEl.textContent = 'Vit';
}

function visaStartMeny() {
  if (klockInterval) clearInterval(klockInterval);
  document.getElementById('startMeny').style.display = 'flex';
  document.getElementById('spelVy').style.display   = 'none';
}

