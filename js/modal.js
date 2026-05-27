// ============================================================
// MODALER – Spelslut, Promotion, Ge upp, Remi
// ============================================================

// ===== HJÄLP: Skapa och ta bort modal-overlay =====
function skapaModalOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'aktivModal';
  document.body.appendChild(overlay);
  return overlay;
}

function stangModal() {
  const modal = document.getElementById('aktivModal');
  if (modal) modal.remove();
}

// ============================================================
// SPELSLUTS-MODAL
// Anropas med orsak: 'schackmatt' | 'pat' | 'material' | 'tid' | 'uppgivet' | 'remi'
// vinnarFarg: VIT | SVART | null (vid remis)
// ============================================================
function visaSlutModal(orsak, vinnarFarg) {
  const overlay = skapaModalOverlay();

  // Bygg rubrik och text beroende på orsak
  let titel = '';
  let text  = '';

  if (orsak === 'schackmatt') {
    const vinnarNamn = vinnarFarg === VIT ? 'Vit' : 'Svart';
    titel = 'Schackmatt!';
    text  = `${vinnarNamn} vinner. Kungen är slagen.`;
  } else if (orsak === 'pat') {
    titel = 'Patt!';
    text  = 'Ingen laglig rörelse – remis.';
  } else if (orsak === 'material') {
    titel = 'Remis';
    text  = 'Otillräckligt material för att ge schackmatt.';
  } else if (orsak === 'tid') {
    const vinnarNamn = vinnarFarg === VIT ? 'Vit' : 'Svart';
    titel = 'Tiden är slut!';
    text  = `${vinnarNamn} vinner på tid.`;
  } else if (orsak === 'uppgivet') {
    const vinnarNamn = vinnarFarg === VIT ? 'Vit' : 'Svart';
    titel = 'Uppgivet';
    text  = `${vinnarNamn} vinner – motståndaren gav upp.`;
  } else if (orsak === 'remi') {
    titel = 'Remis';
    text  = 'Spelarna kom överens om remis.';
  }

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-titel">${titel}</div>
      <div class="modal-text">${text}</div>
      <div class="modal-knappar">
        <button class="modal-knapp prim" id="nyPartKnapp">Ny match</button>
        <button class="modal-knapp sek"  id="tillMenyFranModalKnapp">Tillbaka till menyn</button>
      </div>
    </div>
  `;

  document.getElementById('nyPartKnapp').addEventListener('click', () => {
    stangModal();
    initiieraSpel();
  });

  document.getElementById('tillMenyFranModalKnapp').addEventListener('click', () => {
    stangModal();
    visaStartMeny();
  });
}

// ============================================================
// PROMOTION-MODAL
// Visas när en bonde når sista raden – spelaren väljer ny pjäs
// callback() anropas när spelaren gjort sitt val
// ============================================================
function visaPromotionModal(rad, kol, farg, callback) {
  const overlay = skapaModalOverlay();

  // De fyra möjliga promotion-pjäserna
  const valbara = [DAM, TORN, LOPARE, HAST];

  const pjasHtml = valbara.map(p =>
    `<span class="promotion-pjas" data-pjas="${p}">${PJAS_SYMBOLER[farg][p]}</span>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-titel">Välj pjäs</div>
      <div class="modal-text">Din bonde når sista raden – välj vad den ska bli.</div>
      <div class="promotion-pjasar">${pjasHtml}</div>
    </div>
  `;

  // Klick på en pjäs: sätt den på brädet och fortsätt
  overlay.querySelectorAll('.promotion-pjas').forEach(el => {
    el.addEventListener('click', () => {
      const vald = parseInt(el.dataset.pjas);
      brade[rad][kol] = farg * vald;   // Ersätt bonden med vald pjäs
      stangModal();
      callback();                        // Byt tur efter valet
    });
  });
}

// ============================================================
// GE UPP-KNAPP
// Båda spelarna har en "Ge upp"-knapp – den aktiva spelaren ger upp
// ============================================================
document.getElementById('underGeUpp').addEventListener('click', () => {
  if (spelOver) return;
  // I enspelarlage: bara vit kan ge upp
  bekraftaGeUpp(VIT);
});

document.getElementById('overGeUpp').addEventListener('click', () => {
  if (spelOver) return;
  // I enspelarlage döljs/ignoreras överknappen, men i tvåspelarlage kan svart ge upp
  if (spelLage === 'enspelare') return;
  bekraftaGeUpp(SVART);
});

// Visar en bekräftelse-dialog innan man ger upp (förhindrar misstag)
function bekraftaGeUpp(farg) {
  const overlay = skapaModalOverlay();
  const fargNamn = farg === VIT ? 'Vit' : 'Svart';

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-titel">Ge upp?</div>
      <div class="modal-text">${fargNamn} ger upp matchen.</div>
      <div class="modal-knappar">
        <button class="modal-knapp prim" id="bekraftaGeUppKnapp">Ja, ge upp</button>
        <button class="modal-knapp sek"  id="avbrytGeUppKnapp">Avbryt</button>
      </div>
    </div>
  `;

  document.getElementById('bekraftaGeUppKnapp').addEventListener('click', () => {
    stangModal();
    spelOver = true;
    if (klockInterval) clearInterval(klockInterval);
    visaSlutModal('uppgivet', -farg);   // Motståndaren vinner
  });

  document.getElementById('avbrytGeUppKnapp').addEventListener('click', stangModal);
}

// ============================================================
// REMI-KNAPPAR
// En spelare erbjuder remi – motståndaren accepterar eller avböjer
// ============================================================
document.getElementById('underRemi').addEventListener('click', () => {
  if (spelOver) return;
  erbjudRemi(VIT);
});

document.getElementById('overRemi').addEventListener('click', () => {
  if (spelOver) return;
  if (spelLage === 'enspelare') return; // Boten erbjuder aldrig remi
  erbjudRemi(SVART);
});

function erbjudRemi(fran) {
  const overlay = skapaModalOverlay();
  const motstandare = fran === VIT ? 'Svart' : 'Vit';

  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-titel">Remi erbjuds</div>
      <div class="modal-text">${motstandare}: accepterar du remierbjudandet?</div>
      <div class="modal-knappar">
        <button class="modal-knapp prim" id="accepteraRemiKnapp">Acceptera</button>
        <button class="modal-knapp sek"  id="avslaRemiKnapp">Avböj</button>
      </div>
    </div>
  `;

  document.getElementById('accepteraRemiKnapp').addEventListener('click', () => {
    stangModal();
    spelOver = true;
    if (klockInterval) clearInterval(klockInterval);
    visaSlutModal('remi', null);
  });

  document.getElementById('avslaRemiKnapp').addEventListener('click', stangModal);
}
