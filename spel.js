
// ===== KONSTANTER: Pjästyper & färger =====
// Vi använder heltal för att representera pjäserna i brädet – snabbare än strängar

const TOM   = 0;
const KUNG  = 1;
const DAM   = 2;
const TORN  = 3;
const LOPARE= 4;
const HAST  = 5;
const BONDE = 6;
const VIT   = 1;   // Vit sida
const SVART = -1;  // Svart sida

// Unicode-symboler för pjäserna – används som "sprites" tills riktiga bilder laddas
// TODO: Byt ut mot riktig spritesheet när bilderna är klara!
const PJAS_SYMBOLER = {
  [VIT]:   { [KUNG]:'♔', [DAM]:'♕', [TORN]:'♖', [LOPARE]:'♗', [HAST]:'♘', [BONDE]:'♙' },
  [SVART]: { [KUNG]:'♚', [DAM]:'♛', [TORN]:'♜', [LOPARE]:'♝', [HAST]:'♞', [BONDE]:'♟' }
};

// Schack-notations-bokstäver för draghistoriken
const NOTATIONS_NAMN = { [KUNG]:'K', [DAM]:'D', [TORN]:'T', [LOPARE]:'L', [HAST]:'H', [BONDE]:'' };

// ===== SPELLÄGE & INSTÄLLNINGAR =====
// spelLage håller reda på om vi är 1-spelare eller 2-spelare – detta är spelets tillstånd (state)
let spelLage       = 'enspelare';   // 'enspelare' eller 'tvaspelare'
let botNiva        = 2;             // Minimax-sökdjup (svårighetsgrad)
let anvandKlocka   = false;         // Boolean: ska schackklockan användas?
let startTidSek    = 600;           // Starttid i sekunder (10 min default)
let inkrementSek   = 0;             // Tid att lägga till per drag (+0/+3/+5 sek)

// ===== SPELSTATUS (state machine) =====
// Hela spelets tillstånd hålls i dessa variabler
let brade          = [];            // 8x8-array med pjäsvärden (int[][])
let aktivFarg      = VIT;          // Vems tur det är
let valdRuta       = null;         // Koordinat {rad, kol} för den valda pjäsen
let mojligaDrag    = [];           // Array av möjliga drag för vald pjäs
let spelOver       = false;        // Boolean: är spelet slut?
let botTanker      = false;        // Boolean: håller boten på att beräkna?

// ===== ROKAD-STATE =====
// Håller koll på om kungen/tornen har rört sig – nödvändigt för rokad-logiken
let kungHarRort    = { [VIT]: false, [SVART]: false };
let tornHarRort    = { [VIT]: { vanster: false, hoger: false }, [SVART]: { vanster: false, hoger: false } };

// ===== EN PASSANT =====
// En passant kräver att vi minns vilken kolumn en bonde just hoppade två steg
let enPassantMal   = null;          // null eller {rad, kol}

// ===== DRAGHISTORIK =====
let dragHistorikData = [];          // Array av strängar i schack-notation
let sistaFranRuta  = null;          // Highlight för senaste draget
let sistaThillRuta = null;

// ===== SCHACKKLOCKA =====
// Tid kvar för respektive spelare i sekunder
let tidKvar        = { [VIT]: 600, [SVART]: 600 };
let klockInterval  = null;          // setInterval-ID för klockan

// ===== DOM-ELEMENT =====
const bradeEl       = document.getElementById('brade');
const statusTextEl  = document.getElementById('statusText');
const tankerEl      = document.getElementById('tankerIndikator');
const dragHistEl    = document.getElementById('dragHistorik');
const overKlockaEl  = document.getElementById('overKlocka');
const underKlockaEl = document.getElementById('underKlocka');
const overTagnaEl   = document.getElementById('overTagna');
const underTagnaEl  = document.getElementById('underTagna');
const overInfoEl    = document.getElementById('overSpelareInfo');
const underInfoEl   = document.getElementById('underSpelareInfo');
const overNamnEl    = document.getElementById('overSpelarnamn');
const underNamnEl   = document.getElementById('underSpelarnamn');

let tagnaPjasar = { [VIT]: [], [SVART]: [] };


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

// ============================================================
// INITIERA SPELET
// Sätter upp all state och ritar om brädet
// ============================================================
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
  sistaThillRuta = null;
  tagnaPjasar = { [VIT]: [], [SVART]: [] };

  // Rokad-flaggor – ingen har rört sig i startposition
  kungHarRort      = { [VIT]: false, [SVART]: false };
  tornHarRort      = { [VIT]: { vanster: false, hoger: false }, [SVART]: { vanster: false, hoger: false } };

  // Sätt upp klockor
  tidKvar          = { [VIT]: startTidSek, [SVART]: startTidSek };
  if (klockInterval) clearInterval(klockInterval);
  klockInterval = null;

  ritaBrade();
  uppdateraInfoRad();
  uppdateraKlockor();
  uppdateraTagnaPjasar();
  dragHistEl.innerHTML = '';

  // Starta klockan om inställt
  if (anvandKlocka) startaKlocka();

  
}
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
  sistaThillRuta = { rad: tillRad, kol: tillKol };

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
// DRAGHISTORIK (schack-notation)
// ============================================================
function byggNotation(drag, pjasTyp, pjasFarg, nyttBrade) {
  const kol   = 'abcdefgh'[drag.tillKol];
  const rad   = (8 - drag.tillRad).toString();
  const namn  = NOTATIONS_NAMN[pjasTyp];
  let text    = namn + kol + rad;
  if (drag.specialTyp === 'kortRokad') text = 'O-O';
  if (drag.specialTyp === 'langRokad') text = 'O-O-O';
  if (drag.specialTyp === 'promotion') text += '=D'; // Alltid dam om bot; modal för spelare
  return text;
}

function uppdateraDragHistorik() {
  dragHistEl.innerHTML = '';
  dragHistorikData.forEach((drag, i) => {
    if (i % 2 === 0) {
      const nr = document.createElement('span');
      nr.className = 'drag-nummer';
      nr.textContent = `${Math.floor(i/2)+1}. `;
      dragHistEl.appendChild(nr);
    }
    const d = document.createElement('span');
    d.className = 'drag-post';
    d.textContent = drag + ' ';
    dragHistEl.appendChild(d);
  });
  dragHistEl.scrollTop = dragHistEl.scrollHeight;
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
  // Uppdatera spelarnamn
  overNamnEl.textContent  = spelLage === 'enspelare' ? '🤖 Bot' : 'Svart';
  underNamnEl.textContent = 'Vit';
}

function visaStartMeny() {
  if (klockInterval) clearInterval(klockInterval);
  document.getElementById('startMeny').style.display = 'flex';
  document.getElementById('spelVy').style.display   = 'none';
}




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
