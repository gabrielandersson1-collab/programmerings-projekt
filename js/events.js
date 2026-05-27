// ============================================================
// MENY-LOGIK (val-knappar med aktiv-state)
// ============================================================
document.querySelectorAll('.val-knapp').forEach(knapp => {
  knapp.addEventListener('click', () => {
    const grupp = knapp.dataset.grupp;
    const val   = knapp.dataset.val;

    // Avmarkera alla i samma grupp, markera den klickade
    document.querySelectorAll(`[data-grupp="${grupp}"]`).forEach(k => k.classList.remove('aktiv'));
    knapp.classList.add('aktiv');

    // Uppdatera spelkonfigurationen
    if (grupp === 'lage') {
      spelLage = val;
      document.getElementById('botSvarighetsSektion').style.display = val === 'enspelare' ? 'block' : 'none';
    }
    if (grupp === 'bot')       botNiva     = parseInt(val);
    if (grupp === 'klocka') {
      anvandKlocka = val === 'klocka';
      document.getElementById('klockainStallningar').style.display = anvandKlocka ? 'block' : 'none';
    }
    if (grupp === 'inkrement') inkrementSek = parseInt(val);
  });
});

document.getElementById('startKnapp').addEventListener('click', () => {
  startTidSek = parseInt(document.getElementById('klockaTid').value || 10) * 60;
  visaSpelVy();
  initiieraSpel();
});

document.getElementById('tillMenyKnapp').addEventListener('click', visaStartMeny);
