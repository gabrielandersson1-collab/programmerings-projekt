// ============================================================
// RITA BRÄDET (rendering)
// Skapar DOM-element för varje ruta och pjäs
// ============================================================
function ritaBrade() {
  bradeEl.innerHTML = '';

  for (let rad = 0; rad < 8; rad++) {
    for (let kol = 0; kol < 8; kol++) {
      const rutaEl = document.createElement('div');
      rutaEl.className = 'ruta ' + ((rad + kol) % 2 === 0 ? 'ljus' : 'mork');
      rutaEl.dataset.rad = rad;
      rutaEl.dataset.kol = kol;

      // Koordinat-labels (a-h längs botten, 1-8 längs sidan)
      // Visas bara på relevanta kanter – som ett riktigt schackbräde
      if (kol === 7) {
        const siffraEl = document.createElement('span');
        siffraEl.className = 'koordinat siffra';
        siffraEl.textContent = 8 - rad;
        rutaEl.appendChild(siffraEl);
      }
      if (rad === 7) {
        const bokEl = document.createElement('span');
        bokEl.className = 'koordinat bokstav';
        bokEl.textContent = 'abcdefgh'[kol];
        rutaEl.appendChild(bokEl);
      }

      // Markera senaste drag
      if (sistaFranRuta && sistaFranRuta.rad === rad && sistaFranRuta.kol === kol) rutaEl.classList.add('sist-drag');
      if (sistaThillRuta && sistaThillRuta.rad === rad && sistaThillRuta.kol === kol) rutaEl.classList.add('sist-drag');

      // Markera vald ruta
      if (valdRuta && valdRuta.rad === rad && valdRuta.kol === kol) rutaEl.classList.add('vald');

      // Markera möjliga drag (kollisionsdetektering-visualisering)
      const arMojligt = mojligaDrag.some(d => d.tillRad === rad && d.tillKol === kol);
      if (arMojligt) {
        rutaEl.classList.add('mojligt');
        if (brade[rad][kol] !== TOM) rutaEl.classList.add('har-pjas');
      }

      // Markera kungen vid schack
      const pjasVal  = brade[rad][kol];
      const pjasFarg = pjasVal > 0 ? VIT : (pjasVal < 0 ? SVART : null);
      const pjasTyp  = pjasVal > 0 ? pjasVal : -pjasVal;
      if (pjasTyp === KUNG && pjasFarg !== null && arISchack(brade, pjasFarg)) {
        rutaEl.classList.add('check-kung');
      }

      // Rita pjäsen om det finns en på rutan
     if (pjasVal !== TOM) {
        const pjasEl = document.createElement('div');
        pjasEl.className = 'pjas';
        // Lägg till färgklass för CSS-filtrering (svart/vit färg på pjäserna)
        pjasEl.classList.add(pjasFarg === VIT ? 'vit-pjas' : 'svart-pjas');
        pjasEl.textContent = PJAS_SYMBOLER[pjasFarg][pjasTyp];
        rutaEl.appendChild(pjasEl);
      }

      // Klick-event – hanterar val av pjäs och utförande av drag
      rutaEl.addEventListener('click', () => hanteraRutaKlick(rad, kol));
      bradeEl.appendChild(rutaEl);
    }
  }
}

// Visa tagna pjäser för varje spelare
function uppdateraTagnaPjasar() {
  
  underTagnaEl.textContent = tagnaPjasar[VIT].map(p => PJAS_SYMBOLER[SVART][p]).join('');
  overTagnaEl.textContent  = tagnaPjasar[SVART].map(p => PJAS_SYMBOLER[VIT][p]).join('');
}