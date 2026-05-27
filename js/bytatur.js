function bytaTur() {

  // Lägg till inkrement (om klocka används)
  if (anvandKlocka && inkrementSek > 0) {
    tidKvar[aktivFarg] += inkrementSek;
  }

  // Byt spelare
  aktivFarg = -aktivFarg;

  // Starta klockan för nästa spelare
  if (anvandKlocka) {
    startaKlocka();
  }

  // Uppdatera UI
  ritaBrade();
  uppdateraInfoRad();
  uppdateraKlockor();
  uppdateraTagnaPjasar();

  // Kolla om spelet är slut
  const allaDrag = haemtaAllaLegalaDrag(
    brade,
    aktivFarg,
    enPassantMal,
    kungHarRort,
    tornHarRort
  );

  if (allaDrag.length === 0) {
    if (arISchack(brade, aktivFarg)) {
      spelOver = true;
      if (klockInterval) clearInterval(klockInterval);
      setTimeout(() => visaSlutModal('schackmatt', -aktivFarg), 300);
    } else {
      spelOver = true;
      if (klockInterval) clearInterval(klockInterval);
      setTimeout(() => visaSlutModal('pat', null), 300);
    }
    return;
  }

  // Otillräckligt material = remis
  if (otillrackligtMaterial()) {
    spelOver = true;
    if (klockInterval) clearInterval(klockInterval);
    setTimeout(() => visaSlutModal('material', null), 300);
    return;
  }

 if (spelOver) return;
}