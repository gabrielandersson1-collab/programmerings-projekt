
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

function initiieraSpel() {
  brade            = skapaStartBrade();
  aktivFarg        = VIT;
  valdRuta         = null;
  mojligaDrag      = [];
  spelOver         = false;
  botTanker        = false;
  enPassantMal     = null;
  dragHistorikData = [];
  sistaFranRuta    = null;
  sistaThillRuta   = null;
  tagnaPjasar      = { [VIT]: [], [SVART]: [] };
  kungHarRort      = { [VIT]: false, [SVART]: false };
  tornHarRort      = { [VIT]: { vanster: false, hoger: false }, [SVART]: { vanster: false, hoger: false } };
  tidKvar          = { [VIT]: startTidSek, [SVART]: startTidSek };
  if (klockInterval) clearInterval(klockInterval);

  ritaBrade();
  if (dragHistEl) dragHistEl.innerHTML = '';
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
