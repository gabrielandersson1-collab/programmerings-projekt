
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

let tagnaPjasar = { [VIT]: [], [SVART]: [] };