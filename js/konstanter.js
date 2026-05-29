// ===== KONSTANTER: Pjästyper & färger =====
// Vi använder heltal för att representera pjäserna i brädet – snabbare än strängar
// Fördelen är att heltals-jämförelser är snabbare än sträng-jämförelser
// Alternativet hade varit objekt som { typ: "kung", farg: "vit" } men det
// hade gjort koden mer komplex och långsammare.

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