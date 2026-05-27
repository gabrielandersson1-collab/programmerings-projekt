// ============================================================
// SCHACKKLOCKA (game loop med setInterval)
// ============================================================
function startaKlocka() {
  if (klockInterval) clearInterval(klockInterval);

  // Uppdaterar klockan varje sekund – en enkel game loop!
  klockInterval = setInterval(() => {
    tidKvar[aktivFarg]--;
    uppdateraKlockor();

    if (tidKvar[aktivFarg] <= 0) {
      clearInterval(klockInterval);
      spelOver = true;
      visaSlutModal('tid', -aktivFarg);
    }
  }, 1000);
}

function uppdateraKlockor() {
  const vitText   = formateraTid(tidKvar[VIT]);
  const svartText = formateraTid(tidKvar[SVART]);

  // Vit är alltid nere (spelaren), svart alltid uppe (motståndaren)
  underKlockaEl.textContent = vitText;
  overKlockaEl.textContent  = svartText;

  underKlockaEl.classList.toggle('kritisk', tidKvar[VIT]   <= 30 && anvandKlocka);
  overKlockaEl.classList.toggle('kritisk',  tidKvar[SVART] <= 30 && anvandKlocka);

  // Aktiv tur-markering på spelarkortet
  underInfoEl.classList.toggle('aktiv-tur', aktivFarg === VIT   && anvandKlocka);
  overInfoEl.classList.toggle('aktiv-tur',  aktivFarg === SVART && anvandKlocka);
}

function formateraTid(sek) {
  const m = Math.floor(Math.max(0, sek) / 60).toString().padStart(2, '0');
  const s = (Math.max(0, sek) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}