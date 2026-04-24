/*
 * ============================================================
 * SCHACKSPEL – JavaScript
 * Programmering 1, Gymnasiet
 *
 * Kod skriven med tydliga variabelnamn och kommentarer.
 * Använder begrepp som: game loop, tillstånd (state),
 * kollisionsdetektering, minimax-algoritm, alpha-beta pruning.
 *
 * Lite som att spela mot sig själv men coolade – lolz
 * ============================================================
 */

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
