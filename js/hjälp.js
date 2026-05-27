// ============================================================
// HJÄLPFUNKTIONER
// ============================================================
function arInomBrade(rad, kol) { return rad >= 0 && rad < 8 && kol >= 0 && kol < 8; }

function lagDrag(fr, fk, tr, tk, special=null) {
  return { franRad:fr, franKol:fk, tillRad:tr, tillKol:tk, specialTyp:special };
}

function kopieraBrade(brade) {
  return brade.map(rad => [...rad]);
}

// Applicerar ett drag på ett temporärt bräde 
function tillampaTempDrag(tempBrade, drag) {
  const { franRad, franKol, tillRad, tillKol } = drag;
  const p = tempBrade[franRad][franKol];
  const f = p > 0 ? VIT : SVART;
  tempBrade[tillRad][tillKol] = p;
  tempBrade[franRad][franKol] = TOM;
  if (drag.specialTyp === 'kortRokad') {
    const r = f === VIT ? 7 : 0;
    tempBrade[r][5] = f * TORN; tempBrade[r][7] = TOM;
  } else if (drag.specialTyp === 'langRokad') {
    const r = f === VIT ? 7 : 0;
    tempBrade[r][3] = f * TORN; tempBrade[r][0] = TOM;
  } else if (drag.specialTyp === 'enPassant') {
    tempBrade[franRad][tillKol] = TOM;
  } else if (drag.specialTyp === 'promotion') {
    tempBrade[tillRad][tillKol] = f * DAM; 
  }
}