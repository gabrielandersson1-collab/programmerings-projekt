// ============================================================
// SCHACK-KONTROLL
// Kollar om 'farg'-kungens position attackeras av motståndaren
// Kärnan i kollisionsdetekteringen!
// ============================================================
function arISchack(brade, farg) {
  // Hitta kungens position
  let kungRad = -1, kungKol = -1;
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 8; k++) {
      if (brade[r][k] === farg * KUNG) { kungRad = r; kungKol = k; break; }
    }
    if (kungRad !== -1) break;
  }
  if (kungRad === -1) return false; // Kung hittades inte (bör inte hända)

  const motFarg = -farg;
  // Generera alla pseudo-drag för motståndaren och kolla om kungen träffas
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 8; k++) {
      const p = brade[r][k];
      if (Math.sign(p) !== motFarg) continue;
      const pseudoDrag = haemtaPseudoDrag(brade, r, k, motFarg, null, {[VIT]:true,[SVART]:true}, {[VIT]:{vanster:true,hoger:true},[SVART]:{vanster:true,hoger:true}});
      if (pseudoDrag.some(d => d.tillRad === kungRad && d.tillKol === kungKol)) return true;
    }
  }
  return false;
}


// ============================================================
// OTILLRÄCKLIGT MATERIAL (automatisk remis)
// ============================================================
function otillrackligtMaterial() {
  const pjasar = { [VIT]: [], [SVART]: [] };
  for (let r = 0; r < 8; r++) {
    for (let k = 0; k < 8; k++) {
      const p = brade[r][k];
      if (p === TOM) continue;
      const f = p > 0 ? VIT : SVART;
      pjasar[f].push(Math.abs(p));
    }
  }
  // Bara kungar kvar – remis
  if (pjasar[VIT].length === 1 && pjasar[SVART].length === 1) return true;
  // Kung + löpare mot kung, eller kung + häst mot kung – remis
  const kol = (arr) => arr.filter(p => p === LOPARE || p === HAST);
  if (pjasar[VIT].length === 2 && kol(pjasar[VIT]).length === 1 && pjasar[SVART].length === 1) return true;
  if (pjasar[SVART].length === 2 && kol(pjasar[SVART]).length === 1 && pjasar[VIT].length === 1) return true;
  return false;
}