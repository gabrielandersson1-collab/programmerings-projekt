// ============================================================
// HANTERA KLICK PÅ RUTA (spellogik / state machine)
// ============================================================
function hanteraRutaKlick(rad, kol) {
  // Avbryt om spelet är slut eller boten tänker
  if (spelOver || botTanker) return;
  // I enspelarlage: bara vita pjäser är klickbara för spelaren
  if (spelLage === 'enspelare' && aktivFarg === SVART) return;

  const pjasVal  = brade[rad][kol];
  const pjasFarg = pjasVal > 0 ? VIT : (pjasVal < 0 ? SVART : null);

  // Alternativ 1: Vi har en pjäs vald och klickar på ett möjligt drag
  if (valdRuta) {
    const valtDrag = mojligaDrag.find(d => d.tillRad === rad && d.tillKol === kol);
    if (valtDrag) {
      utforDrag(valtDrag);
      return;
    }
  }

  // Alternativ 2: Klick på en pjäs som tillhör aktiv spelare
  if (pjasFarg === aktivFarg) {
    valdRuta     = { rad, kol };
    mojligaDrag  = haemtaLegalaDrag(brade, rad, kol, aktivFarg, enPassantMal, kungHarRort, tornHarRort);
    ritaBrade();
    return;
  }

  // Alternativ 3: Klick på tom ruta eller fel sidas pjäs – avmarkera
  valdRuta    = null;
  mojligaDrag = [];
  ritaBrade();
}
// ============================================================
// DRAG-GENERERING (kärnan i schacklogiken!)
// Returnerar ALLA lagliga drag för en pjäs på (rad, kol)
// ============================================================
function haemtaLegalaDrag(brade, rad, kol, farg, epMal, kHarRort, tHarRort) {
  const pseudoDrag = haemtaPseudoDrag(brade, rad, kol, farg, epMal, kHarRort, tHarRort);

  // Filtrera bort drag som sätter sin egen kung i schack
  // Det är här kollisionsdetekteringen av schack sker
  return pseudoDrag.filter(drag => {
    const tempBrade = kopieraBrade(brade);
    tillampaTempDrag(tempBrade, drag);
    return !arISchack(tempBrade, farg);
  });
}

function haemtaAllaLegalaDrag(brade, farg, epMal, kHarRort, tHarRort) {
  const allaDrag = [];
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 8; k++) {
      const p = brade[r][k];
      if ((farg === VIT && p > 0) || (farg === SVART && p < 0)) {
        allaDrag.push(...haemtaLegalaDrag(brade, r, k, farg, epMal, kHarRort, tHarRort));
      }
    }
  }
  return allaDrag;
}

// ============================================================
// PSEUDO-DRAG (utan schack-kontroll, bara rörelseregler)
// ============================================================
function haemtaPseudoDrag(brade, rad, kol, farg, epMal, kHarRort, tHarRort) {
  const pjas = Math.abs(brade[rad][kol]);
  switch (pjas) {
    case BONDE:  return bondeDrag(brade, rad, kol, farg, epMal);
    case HAST:   return hastDrag(brade, rad, kol, farg);
    case LOPARE: return gliderDrag(brade, rad, kol, farg, [[1,1],[1,-1],[-1,1],[-1,-1]]);
    case TORN:   return gliderDrag(brade, rad, kol, farg, [[1,0],[-1,0],[0,1],[0,-1]]);
    case DAM:    return gliderDrag(brade, rad, kol, farg, [[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);
    case KUNG:   return kungDrag(brade, rad, kol, farg, kHarRort, tHarRort);
    default: return [];
  }
}

// ===== BONDE-DRAG =====
function bondeDrag(brade, rad, kol, farg, epMal) {
  const drag = [];
  const riktning = farg === VIT ? -1 : 1;  // Vit går upp (negativ rad), svart går ner
  const startRad = farg === VIT ? 6 : 1;

  // Ett steg framåt
  if (arInomBrade(rad + riktning, kol) && brade[rad+riktning][kol] === TOM) {
    // Promotion-kontroll: nådde bonden sista raden?
    const arPromotion = (farg === VIT && rad+riktning === 0) || (farg === SVART && rad+riktning === 7);
    drag.push(lagDrag(rad, kol, rad+riktning, kol, arPromotion ? 'promotion' : null));

    // Två steg framåt från startposition (bonde har inte rört sig)
    if (rad === startRad && brade[rad+2*riktning][kol] === TOM) {
      drag.push(lagDrag(rad, kol, rad+2*riktning, kol));
    }
  }

  // Diagonalt slag (bara om det finns en fiende)
  for (const dKol of [-1, 1]) {
    const nr = rad + riktning;
    const nk = kol + dKol;
    if (!arInomBrade(nr, nk)) continue;
    const arPromotion = (farg === VIT && nr === 0) || (farg === SVART && nr === 7);

    if (brade[nr][nk] !== TOM && Math.sign(brade[nr][nk]) !== farg) {
      drag.push(lagDrag(rad, kol, nr, nk, arPromotion ? 'promotion' : null));
    }
    // En passant – specialregeln för bonde som åker förbi!
    if (epMal && epMal.rad === nr && epMal.kol === nk) {
      drag.push(lagDrag(rad, kol, nr, nk, 'enPassant'));
    }
  }
  return drag;
}

// ===== HÄST-DRAG (L-format) =====
function hastDrag(brade, rad, kol, farg) {
  const drag = [];
  const hopp = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dk] of hopp) {
    const nr = rad + dr;
    const nk = kol + dk;
    if (arInomBrade(nr, nk) && Math.sign(brade[nr][nk]) !== farg) {
      drag.push(lagDrag(rad, kol, nr, nk));
    }
  }
  return drag;
}

// ===== GLIDER-DRAG (torn, löpare, dam) =====
// Glider längs riktningarna tills en pjäs eller kanten hittas
function gliderDrag(brade, rad, kol, farg, riktningar) {
  const drag = [];
  for (const [dr, dk] of riktningar) {
    let nr = rad + dr;
    let nk = kol + dk;
    while (arInomBrade(nr, nk)) {
      if (brade[nr][nk] !== TOM) {
        if (Math.sign(brade[nr][nk]) !== farg) drag.push(lagDrag(rad, kol, nr, nk)); // Slå fiende
        break; // Blockeras av pjäs
      }
      drag.push(lagDrag(rad, kol, nr, nk));
      nr += dr;
      nk += dk;
    }
  }
  return drag;
}

// ===== KUNG-DRAG (inkl. rokad) =====
function kungDrag(brade, rad, kol, farg, kHarRort, tHarRort) {
  const drag = [];
  const steg = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dk] of steg) {
    const nr = rad + dr;
    const nk = kol + dk;
    if (arInomBrade(nr, nk) && Math.sign(brade[nr][nk]) !== farg) {
      drag.push(lagDrag(rad, kol, nr, nk));
    }
  }

  // ===== ROKAD (lång och kort) =====
  // Rokad kräver att: kungen inte rört sig, tornet inte rört sig,
  // inga pjäser är i vägen, och kungen inte passerar schack
  if (!kHarRort[farg] && !arISchack(brade, farg)) {
    const kungRad = farg === VIT ? 7 : 0;

    // Kort rokad (kung-sida, kolumn 5-6 tomma, torn på 7)
    if (!tHarRort[farg].hoger
      && brade[kungRad][5] === TOM && brade[kungRad][6] === TOM
      && Math.abs(brade[kungRad][7]) === TORN) {
      // Kontrollera att kungen inte passerar schack på kolumn 5 och 6
      const temp1 = kopieraBrade(brade);
      temp1[kungRad][5] = farg * KUNG; temp1[kungRad][4] = TOM;
      const temp2 = kopieraBrade(brade);
      temp2[kungRad][6] = farg * KUNG; temp2[kungRad][4] = TOM;
      if (!arISchack(temp1, farg) && !arISchack(temp2, farg)) {
        drag.push(lagDrag(rad, kol, kungRad, 6, 'kortRokad'));
      }
    }

    // Lång rokad (dam-sida, kolumn 1-3 tomma, torn på 0)
    if (!tHarRort[farg].vanster
      && brade[kungRad][1] === TOM && brade[kungRad][2] === TOM && brade[kungRad][3] === TOM
      && Math.abs(brade[kungRad][0]) === TORN) {
      const temp1 = kopieraBrade(brade);
      temp1[kungRad][3] = farg * KUNG; temp1[kungRad][4] = TOM;
      const temp2 = kopieraBrade(brade);
      temp2[kungRad][2] = farg * KUNG; temp2[kungRad][4] = TOM;
      if (!arISchack(temp1, farg) && !arISchack(temp2, farg)) {
        drag.push(lagDrag(rad, kol, kungRad, 2, 'langRokad'));
      }
    }
  }
  return drag;
}
