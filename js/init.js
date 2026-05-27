// ============================================================
// INITIERA SPELET
// Sätter upp all state och ritar om brädet
// ============================================================
function skapaStartBrade() {
  return [
    [-TORN, -HAST, -LOPARE, -DAM, -KUNG, -LOPARE, -HAST, -TORN],
    [-BONDE,-BONDE,-BONDE,-BONDE,-BONDE,-BONDE,-BONDE,-BONDE],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [BONDE,BONDE,BONDE,BONDE,BONDE,BONDE,BONDE,BONDE],
    [TORN, HAST, LOPARE, DAM, KUNG, LOPARE, HAST, TORN]
  ];
}

function initiieraSpel() {

  brade = skapaStartBrade();

  aktivFarg = VIT;

  valdRuta = null;
  mojligaDrag = [];

  spelOver = false;
  botTanker = false;

  enPassantMal = null;

  dragHistorikData = [];

  sistaFranRuta = null;
  sistaTillRuta = null;

  tagnaPjasar = {
    [VIT]: [],
    [SVART]: []
  };

  kungHarRort = {
    [VIT]: false,
    [SVART]: false
  };

  tornHarRort = {
    [VIT]: {
      vanster: false,
      hoger: false
    },

    [SVART]: {
      vanster: false,
      hoger: false
    }
  };

  tidKvar = {
    [VIT]: startTidSek,
    [SVART]: startTidSek
  };

  if (klockInterval) {
    clearInterval(klockInterval);
  }

  klockInterval = null;

  ritaBrade();

  uppdateraInfoRad();

  uppdateraKlockor();

  uppdateraTagnaPjasar();

  dragHistEl.innerHTML = '';

  if (anvandKlocka) {
    startaKlocka();
  }
}