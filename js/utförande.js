// ============================================================
// UTFÖR ETT DRAG (med animation)
// Drag-objektet innehåller: franRad, franKol, tillRad, tillKol,
// och ev. specialTyp: 'rokad', 'enPassant', 'promotion'
// ============================================================
function utforDrag(drag) {
  const { franRad, franKol, tillRad, tillKol } = drag;

  // ===== ANIMERA PJÄSEN =====
  // Räknar ut skärmkoordinater via getBoundingClientRect (DOM-API)
  const rutorEl    = bradeEl.querySelectorAll('.ruta');
  const franIndex  = franRad * 8 + franKol;
  const tillIndex  = tillRad * 8 + tillKol;
  const franRect   = rutorEl[franIndex].getBoundingClientRect();
  const tillRect   = rutorEl[tillIndex].getBoundingClientRect();

  const pjasVal    = brade[franRad][franKol];
  const pjasFarg   = pjasVal > 0 ? VIT : SVART;
  const pjasTyp    = Math.abs(pjasVal);

  // Skapa ett "flygande" pjäs-element för animationen
  const flygandeEl = document.createElement('div');
  flygandeEl.className = 'pjas-animeras';
  flygandeEl.textContent = PJAS_SYMBOLER[pjasFarg][pjasTyp];
  flygandeEl.style.left   = franRect.left + 'px';
  flygandeEl.style.top    = franRect.top  + 'px';
  flygandeEl.style.width  = franRect.width + 'px';
  flygandeEl.style.height = franRect.height + 'px';
  flygandeEl.style.display = 'flex';
  flygandeEl.style.alignItems = 'center';
  flygandeEl.style.justifyContent = 'center';
  document.body.appendChild(flygandeEl);

  // requestAnimationFrame för smidig animation – krav för E-nivå!
  requestAnimationFrame(() => {
    flygandeEl.style.left = tillRect.left + 'px';
    flygandeEl.style.top  = tillRect.top  + 'px';
  });

  // När animationen är klar: uppdatera spelstaten
  setTimeout(() => {
    flygandeEl.remove();
    tillampaRiktigtDrag(drag);
  }, 230);

  // Göm pjäsen på originalet medan den animeras
  rutorEl[franIndex].style.opacity = '0';
  setTimeout(() => { if(rutorEl[franIndex]) rutorEl[franIndex].style.opacity = ''; }, 230);
}

// ============================================================
// TILLÄMPA DRAGET PÅ BRÄDET (uppdaterar state)
// ============================================================
function tillampaRiktigtDrag(drag) {
  const { franRad, franKol, tillRad, tillKol } = drag;
  const pjasVal  = brade[franRad][franKol];
  const pjasFarg = pjasVal > 0 ? VIT : SVART;
  const pjasTyp  = Math.abs(pjasVal);
  const motstandarFarg = -pjasFarg;

  // Logga tagen pjäs (kollisionsdetektering – en viktig del av spellogiken)
  if (brade[tillRad][tillKol] !== TOM) {
    tagnaPjasar[pjasFarg].push(Math.abs(brade[tillRad][tillKol]));
  }

  // Utför grundläggande drag
  brade[tillRad][tillKol] = pjasVal;
  brade[franRad][franKol] = TOM;

  // === SPECIALFALL: Rokad (lång och kort) ===
  if (drag.specialTyp === 'kortRokad') {
    // Flytta torn till vänster om kungen
    brade[franRad][5] = pjasFarg * TORN;
    brade[franRad][7] = TOM;
    tornHarRort[pjasFarg].hoger = true;
  } else if (drag.specialTyp === 'langRokad') {
    brade[franRad][3] = pjasFarg * TORN;
    brade[franRad][0] = TOM;
    tornHarRort[pjasFarg].vanster = true;
  }

  // === SPECIALFALL: En passant ===
  if (drag.specialTyp === 'enPassant') {
    // Ta bort bonden som hoppade förbi
    tagnaPjasar[pjasFarg].push(BONDE);
    brade[franRad][tillKol] = TOM;
  }

  // === UPPDATERA EN PASSANT-MÅL ===
  // Om en bonde hoppade två steg – sätt en-passant-målet
  if (pjasTyp === BONDE && Math.abs(tillRad - franRad) === 2) {
    enPassantMal = { rad: (franRad + tillRad) / 2, kol: franKol };
  } else {
    enPassantMal = null;
  }

  // === ROKAD-FLAGGOR ===
  if (pjasTyp === KUNG) kungHarRort[pjasFarg] = true;
  if (pjasTyp === TORN) {
    if (franKol === 0) tornHarRort[pjasFarg].vanster = true;
    if (franKol === 7) tornHarRort[pjasFarg].hoger   = true;
  }

  // === SCHACK-NOTATION ===
  const dragNotation = byggNotation(drag, pjasTyp, pjasFarg, brade);
  dragHistorikData.push(dragNotation);
  uppdateraDragHistorik();

  // === SENASTE DRAG (highlight) ===
  sistaFranRuta  = { rad: franRad, kol: franKol };
  sistaTillRuta = { rad: tillRad, kol: tillKol };

  // === PROMOTION (bonde når sista raden) ===
  // Promotion är ett specialfall där spelaren väljer ny pjäs
  if (drag.specialTyp === 'promotion') {
    valdRuta    = null;
    mojligaDrag = [];
    ritaBrade();
    visaPromotionModal(tillRad, tillKol, pjasFarg, () => {
      bytaTur();
    });
    return;
  }

  valdRuta    = null;
  mojligaDrag = [];
  bytaTur();
}

// ============================================================
// BYTA TUR & KONTROLLERA SPELSLUT
// ============================================================
function bytaTur() {
  // Schackklocka: lägg till inkrement för spelaren som precis drog
  if (anvandKlocka && inkrementSek > 0) {
    tidKvar[aktivFarg] += inkrementSek;
  }

  aktivFarg = -aktivFarg; // Byt till motståndaren

  // Starta/uppdatera klockan
  if (anvandKlocka) startaKlocka();

  ritaBrade();
  uppdateraInfoRad();
  uppdateraTagnaPjasar();

  // Kontrollera spelslut: schackmatt eller pat
  const alleaDrag = haemtaAllaLegalaDrag(brade, aktivFarg, enPassantMal, kungHarRort, tornHarRort);
  if (alleaDrag.length === 0) {
    if (arISchack(brade, aktivFarg)) {
      // SCHACKMATT
      if (klockInterval) clearInterval(klockInterval);
      spelOver = true;
      setTimeout(() => visaSlutModal('schackmatt', -aktivFarg), 300);
    } else {
      // PAT (remis)
      if (klockInterval) clearInterval(klockInterval);
      spelOver = true;
      setTimeout(() => visaSlutModal('pat', null), 300);
    }
    return;
  }

  // Kontrollera otillräckligt material (automatisk remis)
  if (otillrackligtMaterial()) {
    if (klockInterval) clearInterval(klockInterval);
    spelOver = true;
    setTimeout(() => visaSlutModal('material', null), 300);
    return;
  }

  // Uppdatera status-text
  uppdateraInfoRad();

  // Om det är botens tur i enspelarlage
  if (spelLage === 'enspelare' && aktivFarg === SVART && !spelOver) {
    setTimeout(gorBotDrag, 400); // Liten fördröjning – känns mer "mänskligt"
  }
}