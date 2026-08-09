/* =========================================================
   ROYAL COURT — Raja Rani Chor Police
   single-device pass-and-play.

   ROLE LADDER
   There are exactly 10 fixed ranks with fixed point values.
   The order below is also the ALLOTMENT ORDER: for N players,
   the first N ranks in this list are the ranks in play that
   game (Raja & Police & Chor are always included first, since
   the guessing mechanic needs both).

     Raja      - 10000
     Police    - 500
     Chor      - 0
     Rani      - 5000
     Minister  - 1000
     Joker     - 100
     Servant   - 100
     Chef      - 100
     Gardener  - 100
     Musician  - 100

   Each round, the N active ranks are shuffled with Fisher–Yates
   (uniform random permutation) and zipped 1:1 onto the players
   in their fixed seating order — so who sits where never
   changes, only which rank lands on them each round.
   ========================================================= */

const ICONS = {
  crown:  '<svg viewBox="0 0 64 64"><path d="M6 46 L10 20 L22 34 L32 14 L42 34 L54 20 L58 46 Z"/><circle cx="32" cy="10" r="3.5"/><circle cx="10" cy="16" r="2.5"/><circle cx="54" cy="16" r="2.5"/><rect x="6" y="46" width="52" height="7" rx="1.5"/></svg>',
  lotus:  '<svg viewBox="0 0 64 64"><path d="M32 8c4 10 4 18 0 26-4-8-4-16 0-26z"/><path d="M32 8c-10 6-16 12-18 22 10-2 16-8 18-22z"/><path d="M32 8c10 6 16 12 18 22-10-2-16-8-18-22z"/><path d="M14 30c-6 6-8 12-6 20 8-4 12-10 6-20z"/><path d="M50 30c6 6 8 12 6 20-8-4-12-10-6-20z"/><ellipse cx="32" cy="50" rx="20" ry="6"/></svg>',
  shield: '<svg viewBox="0 0 64 64"><path d="M32 6 L54 14 V30 C54 46 44 56 32 60 C20 56 10 46 10 30 V14 Z"/></svg>',
  dagger: '<svg viewBox="0 0 64 64"><path d="M32 4 L38 30 L32 26 L26 30 Z"/><rect x="29" y="28" width="6" height="20" rx="1"/><rect x="20" y="46" width="24" height="6" rx="1.5"/><rect x="29" y="50" width="6" height="10" rx="1.5"/></svg>',
  scroll: '<svg viewBox="0 0 64 64"><rect x="12" y="18" width="40" height="28" rx="3"/><circle cx="12" cy="22" r="5"/><circle cx="12" cy="42" r="5"/><circle cx="52" cy="22" r="5"/><circle cx="52" cy="42" r="5"/></svg>',
  jester: '<svg viewBox="0 0 64 64"><path d="M10 46 C10 30 16 14 22 22 C24 12 30 6 32 16 C34 6 40 12 42 22 C48 14 54 30 54 46 Z"/><circle cx="10" cy="46" r="4"/><circle cx="32" cy="16" r="4"/><circle cx="54" cy="46" r="4"/><rect x="8" y="46" width="48" height="6" rx="2"/></svg>',
  broom:  '<svg viewBox="0 0 64 64"><rect x="29" y="4" width="6" height="34" rx="2"/><path d="M12 38 L52 38 L56 58 L8 58 Z"/></svg>',
  chef:   '<svg viewBox="0 0 64 64"><path d="M20 30c-6 0-10-4-10-9 0-4 3-8 7-9 1-5 6-9 12-9s10 3 12 8c1 0 2-1 3-1 5 0 9 4 9 9 0 5-4 9-9 9H20z"/><rect x="16" y="30" width="32" height="20" rx="2"/></svg>',
  plant:  '<svg viewBox="0 0 64 64"><rect x="29" y="28" width="6" height="30" rx="2"/><path d="M32 30c-14 0-20-10-20-22 12 0 20 8 20 22z"/><path d="M32 30c14 0 20-10 20-22-12 0-20 8-20 22z"/><ellipse cx="32" cy="58" rx="16" ry="4"/></svg>',
  note:   '<svg viewBox="0 0 64 64"><circle cx="18" cy="48" r="8"/><circle cx="42" cy="42" r="8"/><rect x="24" y="14" width="5" height="36"/><rect x="48" y="10" width="5" height="34"/><path d="M24 14 L53 10 L53 20 L24 24 Z"/></svg>',
};

/* ---------- fixed role ladder (also the allotment order) ---------- */
const ROLE_DEFS = [
  { key: "raja",     short: "Raja",     label: "Raja",     points: 10000, icon: "crown"  },
  { key: "police",   short: "Police",   label: "Police",   points: 500,   icon: "shield" },
  { key: "thief",    short: "Chor",     label: "Chor",     points: 0,     icon: "dagger" },
  { key: "rani",     short: "Rani",     label: "Rani",     points: 5000,  icon: "lotus"  },
  { key: "minister", short: "Minister", label: "Minister", points: 1000,  icon: "scroll" },
  { key: "joker",    short: "Joker",    label: "Joker",    points: 100,   icon: "jester" },
  { key: "servant",  short: "Servant",  label: "Servant",  points: 100,   icon: "broom"  },
  { key: "chef",     short: "Chef",     label: "Chef",     points: 100,   icon: "chef"   },
  { key: "gardener", short: "Gardener", label: "Gardener", points: 100,   icon: "plant"  },
  { key: "musician", short: "Musician", label: "Musician", points: 100,   icon: "note"   },
];

const S = {
  N: 4,
  players: [],      // [{name}], fixed seating order — never reordered
  round: 0,
  history: [],      // [{round, points:[...], thiefName, correct}]
  currentRoles: [], // this round's role objects, aligned to players[] by index
  revealIndex: 0,
  revealed: false,
  policeIndex: -1,
  thiefIndex: -1,
};

/* ---------- sound effects ---------- */
const SOUND_FILES = {
  click:     "click.wav",
  count:     "count.wav",
  win:       "win.wav",
  lose:      "lose.wav",
  end:       "end.wav",
  replay:    "replay.wav",
  playagain: "playagain.wav",
};
function playSound(name) {
  const src = SOUND_FILES[name];
  if (!src) return;
  const audio = new Audio(src);
  audio.play().catch((err) => {
    console.error(`[sound] couldn't play "${name}" (${src}):`, err.message || err);
  });
}

/* plays a sound fully, then runs the callback — used when something
   (like a page reload) needs to wait for the sound to finish */
function playSoundThen(name, callback) {
  const src = SOUND_FILES[name];
  if (!src) { callback(); return; }
  const audio = new Audio(src);
  let done = false;
  const finish = () => { if (done) return; done = true; callback(); };
  audio.addEventListener("ended", finish);
  audio.addEventListener("error", (err) => {
    console.error(`[sound] couldn't play "${name}" (${src}):`, err);
    finish();
  });
  audio.play().catch((err) => {
    console.error(`[sound] couldn't play "${name}" (${src}):`, err.message || err);
    finish();
  });
  setTimeout(finish, 8000); // safety net in case 'ended' never fires
}

/* generic click sound — every button except ones with their own
   designated sound (End, Next Round, Play Again, guess answers) */
const CLICK_SOUND_EXCLUDED_IDS = new Set(["btn-count-score", "btn-replay", "btn-restart"]);
document.addEventListener("click", (e) => {
  const el = e.target.closest("button, .role-card");
  if (!el) return;
  if (CLICK_SOUND_EXCLUDED_IDS.has(el.id)) return;
  if (el.closest("#guess-options")) return;
  playSound("click");
});

/* ---------- helpers ---------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function escapeHtml(s) { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; }
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.removeAttribute("data-active"));
  document.getElementById(id).setAttribute("data-active", "true");
}
function formatPts(n) { return n.toLocaleString("en-IN"); }

function burstConfetti(container, count) {
  const colors = ["#D4AF37", "#E8C874", "#C9536A", "#1F6E5C", "#F3EAD3"];
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "confetti-piece";
    el.style.left = (40 + Math.random() * 20) + "%";
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.setProperty("--dx", (Math.random() * 180 - 90) + "px");
    el.style.setProperty("--rot", (Math.random() * 720 - 360) + "deg");
    el.style.animationDelay = (Math.random() * 0.15) + "s";
    container.appendChild(el);
    setTimeout(() => el.remove(), 1700);
  }
}

/* ---------- role pool for a round: shuffled ranks in play ---------- */
function buildRoleAssignments(N) {
  const pool = ROLE_DEFS.slice(0, N).map(r => ({ ...r }));
  shuffle(pool);
  return pool; // pool[i] maps to players[i]
}

/* ============================================================
   SCREEN 1 — Start
   ============================================================ */
document.getElementById("btn-play").addEventListener("click", () => showScreen("screen-count"));

/* ============================================================
   SCREEN 2 — Player count
   ============================================================ */
let countVal = 4;
const countValueEl = document.getElementById("count-value");
document.getElementById("count-minus").addEventListener("click", () => {
  countVal = Math.max(3, countVal - 1);
  countValueEl.textContent = countVal;
});
document.getElementById("count-plus").addEventListener("click", () => {
  countVal = Math.min(10, countVal + 1);
  countValueEl.textContent = countVal;
});
document.getElementById("btn-count-next").addEventListener("click", () => {
  S.N = countVal;
  buildNameGrid(S.N);
  showScreen("screen-names");
});

/* ============================================================
   SCREEN 3 — Player names
   ============================================================ */
function buildNameGrid(N) {
  const grid = document.getElementById("name-grid");
  grid.innerHTML = "";
  for (let i = 0; i < N; i++) {
    const row = document.createElement("div");
    row.className = "name-field";
    row.innerHTML = `<span class="num">${i + 1}</span>
      <input type="text" id="name-input-${i}" maxlength="16" placeholder="Player ${i + 1}" autocomplete="off">`;
    grid.appendChild(row);
  }
}
document.getElementById("btn-names-next").addEventListener("click", () => {
  const players = [];
  for (let i = 0; i < S.N; i++) {
    const val = document.getElementById(`name-input-${i}`).value.trim();
    players.push({ name: (val || `Player ${i + 1}`).slice(0, 16) });
  }
  S.players = players;
  S.round = 0;
  S.history = [];
  renderRolesPreview();
  showScreen("screen-roles-preview");
});

/* ============================================================
   SCREEN 4 — Roles preview (who's in play tonight)
   ============================================================ */
function renderRolesPreview() {
  const sub = document.getElementById("roles-preview-sub");
  sub.textContent = `${S.N} ranks are in play this game`;

  const grid = document.getElementById("role-preview-grid");
  grid.innerHTML = "";
  const ranksInPlay = ROLE_DEFS.slice(0, S.N);
  ranksInPlay.forEach((role, i) => {
    const item = document.createElement("div");
    item.className = "role-preview-item";
    item.style.animationDelay = (i * 0.07) + "s";
    item.innerHTML = `
      <div class="rp-icon">${ICONS[role.icon]}</div>
      <p class="rp-name">${role.label}</p>
      <p class="rp-points">${formatPts(role.points)} pts</p>`;
    grid.appendChild(item);
  });
}
document.getElementById("btn-begin-reign").addEventListener("click", () => {
  document.getElementById("round-header").hidden = false;
  startRound();
});

/* ============================================================
   ROUND FLOW — reveal (pass & play)
   ============================================================ */
function startRound() {
  S.round += 1;
  S.currentRoles = buildRoleAssignments(S.N);
  S.revealIndex = 0;
  document.getElementById("round-indicator").textContent = `Round ${S.round}`;
  enterRevealForCurrentIndex();
}

function enterRevealForCurrentIndex() {
  showScreen("screen-reveal");
  const card = document.getElementById("role-card");
  card.classList.remove("revealed");
  S.revealed = false;

  const idx = S.revealIndex;
  document.getElementById("pass-banner").textContent = idx === 0 ? "First, pass the phone to" : "Now pass the phone to";
  document.getElementById("reveal-player-name").textContent = S.players[idx].name;

  const role = S.currentRoles[idx];
  document.getElementById("role-crest").innerHTML = ICONS[role.icon];
  document.getElementById("role-name").textContent = role.short;
  document.getElementById("role-points").textContent = `${formatPts(role.points)} points this round`;

  renderProgressDots();
}

function renderProgressDots() {
  const wrap = document.getElementById("progress-dots");
  let out = "";
  for (let i = 0; i < S.N; i++) out += `<span class="${i < S.revealIndex ? "on" : ""}">●</span> `;
  wrap.innerHTML = out;
}

document.getElementById("role-card").addEventListener("click", () => {
  const card = document.getElementById("role-card");
  if (!S.revealed) {
    card.classList.add("revealed");
    S.revealed = true;
    return;
  }
  card.classList.remove("revealed");
  S.revealed = false;
  S.revealIndex += 1;
  if (S.revealIndex >= S.N) {
    setTimeout(enterTransition, 500);
  } else {
    setTimeout(enterRevealForCurrentIndex, 650);
  }
});

/* ============================================================
   TRANSITION — a fixed buffer so no one can mis-tap into the
   guess screen right after the last role card is closed.
   ============================================================ */
function enterTransition() {
  showScreen("screen-transition");
  playSound("count");
  let count = 3;
  const el = document.getElementById("transition-count");
  el.textContent = count;
  const timer = setInterval(() => {
    count -= 1;
    if (count <= 0) {
      clearInterval(timer);
      goToGuessScreen();
    } else {
      el.textContent = count;
    }
  }, 1000);
}

/* ============================================================
   GUESS
   ============================================================ */
function goToGuessScreen() {
  S.policeIndex = S.currentRoles.findIndex(r => r.key === "police");
  S.thiefIndex = S.currentRoles.findIndex(r => r.key === "thief");

  showScreen("screen-guess");
  document.getElementById("police-name").textContent = S.players[S.policeIndex].name;

  const wrap = document.getElementById("guess-options");
  wrap.innerHTML = "";
  S.players.forEach((p, i) => {
    if (i === S.policeIndex) return;
    const btn = document.createElement("button");
    btn.textContent = p.name;
    btn.addEventListener("click", () => handleGuess(i), { once: true });
    wrap.appendChild(btn);
  });
}

function handleGuess(chosenIndex) {
  const correct = chosenIndex === S.thiefIndex;
  const policeRole = S.currentRoles[S.policeIndex];
  const thiefRole = S.currentRoles[S.thiefIndex];

  let policePts = policeRole.points;
  let thiefPts = thiefRole.points;
  if (!correct) { [policePts, thiefPts] = [thiefPts, policePts]; }

  const roundPoints = S.players.map((p, i) => {
    if (i === S.policeIndex) return policePts;
    if (i === S.thiefIndex) return thiefPts;
    return S.currentRoles[i].points;
  });

  S.history.push({
    round: S.round,
    points: roundPoints,
    thiefName: S.players[S.thiefIndex].name,
    correct,
  });

  showResult(correct, S.players[S.thiefIndex].name);
}

/* ============================================================
   RESULT
   ============================================================ */
function showResult(correct, thiefName) {
  showScreen("screen-result");
  const heading = document.getElementById("result-heading");
  const sub = document.getElementById("result-sub");
  const nameEl = document.getElementById("result-thief-name");
  const icon = document.getElementById("result-icon");
  const card = document.getElementById("result-card");

  nameEl.textContent = thiefName;

  if (correct) {
    playSound("win");
    heading.textContent = "Caught!";
    heading.className = "title title-sm correct";
    sub.textContent = "The Chor was";
    nameEl.className = "result-thief-name correct";
    icon.textContent = "✓";
    icon.className = "result-icon correct";
    burstConfetti(card, 26);
  } else {
    playSound("lose");
    heading.textContent = "Escaped!";
    heading.className = "title title-sm wrong";
    sub.textContent = "The Chor was actually";
    nameEl.className = "result-thief-name wrong";
    icon.textContent = "✕";
    icon.className = "result-icon wrong";
  }
  setTimeout(renderScoreboard, 2000);
}

/* ============================================================
   SCOREBOARD
   ============================================================ */
function renderScoreboard() {
  showScreen("screen-scoreboard");

  // Newest round first (leftmost) — each new round slides in on the
  // left and pushes earlier rounds to the right, reachable by swipe.
  const roundsDesc = [...S.history].reverse();

  const headRow = document.getElementById("score-head-row");
  headRow.innerHTML = "<th>Players</th>" + roundsDesc.map(h => `<th>Round ${h.round}</th>`).join("");

  const body = document.getElementById("score-body");
  body.innerHTML = "";
  S.players.forEach((p, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${escapeHtml(p.name)}</td>` + roundsDesc.map(h => `<td>${h.points[i]}</td>`).join("");
    body.appendChild(tr);
  });
}

document.getElementById("btn-replay").addEventListener("click", () => {
  playSound("replay");
  startRound();
});
document.getElementById("btn-count-score").addEventListener("click", () => {
  playSound("end");
  renderFinal();
});

/* ============================================================
   FINAL STANDINGS
   ============================================================ */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function renderFinal() {
  document.getElementById("round-header").hidden = true;
  showScreen("screen-final");

  const totals = S.players.map((p, i) => ({
    name: p.name,
    total: S.history.reduce((sum, h) => sum + h.points[i], 0),
  }));
  totals.sort((a, b) => b.total - a.total);

  const list = document.getElementById("final-list");
  list.innerHTML = "";
  totals.forEach((t, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="rank">${ordinal(i + 1)}</span><span class="fname">${escapeHtml(t.name)}</span><span class="fscore">${t.total}</span>`;
    list.appendChild(li);
  });
}

document.getElementById("btn-restart").addEventListener("click", () => {
  playSoundThen("playagain", () => window.location.reload());
});