/* ===== Mon Petit Génie =====
   Application éducative pour les 3 ans : alphabet, chiffres et jeux cognitifs.
   100% hors-ligne. La voix utilise l'API Web Speech du navigateur (français).
*/

"use strict";

/* ---------- Données ---------- */

// Une image (emoji) + un mot français commençant par chaque lettre.
const ALPHABET = [
  ["A", "🍎", "Avion"],   ["B", "🎈", "Ballon"],  ["C", "🐱", "Chat"],
  ["D", "🐬", "Dauphin"], ["E", "⭐", "Étoile"],  ["F", "🌸", "Fleur"],
  ["G", "🍰", "Gâteau"],  ["H", "🦔", "Hérisson"],["I", "🏝️", "Île"],
  ["J", "🌻", "Jardin"],  ["K", "🐨", "Koala"],   ["L", "🦁", "Lion"],
  ["M", "🏠", "Maison"],  ["N", "☁️", "Nuage"],   ["O", "🐻", "Ours"],
  ["P", "🦋", "Papillon"],["Q", "🐧", "Manchot"], ["R", "🦊", "Renard"],
  ["S", "🐍", "Serpent"], ["T", "🐢", "Tortue"],  ["U", "🦄", "Licorne"],
  ["V", "🚗", "Voiture"], ["W", "🚂", "Wagon"],   ["X", "🎼", "Xylophone"],
  ["Y", "🧘", "Yoga"],    ["Z", "🦓", "Zèbre"],
];

const NUMBER_WORDS = ["", "Un", "Deux", "Trois", "Quatre", "Cinq",
                      "Six", "Sept", "Huit", "Neuf", "Dix"];

const COLORS = [
  ["Rouge", "#ff5252"], ["Bleu", "#4dabf7"], ["Jaune", "#ffd43b"],
  ["Vert", "#51cf66"],  ["Orange", "#ff922b"], ["Violet", "#9775fa"],
  ["Rose", "#f783ac"],  ["Marron", "#a0522d"],
];

const MEMORY_EMOJIS = ["🐶","🐱","🦄","🐸","🐢","🦋","🐠","🌸"];

const PRAISE = ["Bravo !", "Super !", "Génial !", "Tu es un champion !",
                "Magnifique !", "Bien joué !", "Trop fort !", "Youpi !"];
const CELEBRATE_EMOJIS = ["🎉","⭐","🌈","🎈","👏","🦄","🌟","🍭"];

/* ---------- Son (synthèse vocale) ---------- */

let soundOn = true;
let frVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  frVoice = voices.find(v => /fr/i.test(v.lang)) || null;
}
if ("speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

function say(text) {
  if (!soundOn || !("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "fr-FR";
  u.rate = 0.85;   // un peu plus lent pour les tout-petits
  u.pitch = 1.15;  // voix douce
  if (frVoice) u.voice = frVoice;
  speechSynthesis.speak(u);
}

function praise() {
  say(PRAISE[Math.floor(Math.random() * PRAISE.length)]);
}

/* ---------- Navigation entre écrans ---------- */

const screens = document.querySelectorAll(".screen");
const topbar = document.getElementById("topbar");
const screenTitle = document.getElementById("screenTitle");

const TITLES = {
  menu: "Mon Petit Génie",
  alphabet: "L'Alphabet",
  numbers: "Les Chiffres",
  memory: "Memory",
  findletter: "Trouve la lettre",
  findnumber: "Trouve le chiffre",
  colors: "Les Couleurs",
};

function show(id) {
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  topbar.classList.toggle("hidden", id === "menu");
  screenTitle.textContent = TITLES[id] || "Mon Petit Génie";
  if (id === "alphabet") renderAlpha();
  if (id === "numbers") renderNum();
  if (id === "memory") startMemory();
  if (id === "findletter") newFindLetter();
  if (id === "findnumber") newFindNumber();
  if (id === "colors") newColor();
}

document.querySelectorAll(".menu-card").forEach(card => {
  card.addEventListener("click", () => {
    say(card.textContent.trim());
    show(card.dataset.game);
  });
});

document.getElementById("homeBtn").addEventListener("click", () => show("menu"));

document.getElementById("soundBtn").addEventListener("click", e => {
  soundOn = !soundOn;
  e.currentTarget.textContent = soundOn ? "🔊" : "🔇";
  if (!soundOn) speechSynthesis.cancel();
});

/* ---------- Célébration ---------- */

function celebrate() {
  const box = document.getElementById("celebrate");
  document.getElementById("celebrateEmoji").textContent =
    CELEBRATE_EMOJIS[Math.floor(Math.random() * CELEBRATE_EMOJIS.length)];
  box.classList.remove("hidden");
  setTimeout(() => box.classList.add("hidden"), 1000);
  confetti();
}

function confetti() {
  const colors = ["#ff5252","#4dabf7","#ffd43b","#51cf66","#f783ac","#9775fa"];
  for (let i = 0; i < 24; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = 1 + Math.random() * 1.2 + "s";
    c.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 2400);
  }
}

/* ---------- Outils ---------- */

const rand = arr => arr[Math.floor(Math.random() * arr.length)];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- Alphabet ---------- */

let alphaIdx = 0;

function renderAlpha() {
  const [letter, emoji, word] = ALPHABET[alphaIdx];
  document.getElementById("alphaLetter").textContent = letter;
  document.getElementById("alphaEmoji").textContent = emoji;
  document.getElementById("alphaWord").textContent = word;
  say(`${letter}. ${word}`);
}

document.getElementById("alphaPrev").addEventListener("click", () => {
  alphaIdx = (alphaIdx - 1 + ALPHABET.length) % ALPHABET.length;
  renderAlpha();
});
document.getElementById("alphaNext").addEventListener("click", () => {
  alphaIdx = (alphaIdx + 1) % ALPHABET.length;
  renderAlpha();
});
document.getElementById("alphaSay").addEventListener("click", () => {
  const [letter, , word] = ALPHABET[alphaIdx];
  say(`${letter}. ${word}`);
});
document.getElementById("alphaCard").addEventListener("click", () => {
  const [letter, , word] = ALPHABET[alphaIdx];
  say(`${letter}. ${word}`);
});

/* ---------- Chiffres ---------- */

let numVal = 1;

function renderNum() {
  document.getElementById("numDigit").textContent = numVal;
  document.getElementById("numWord").textContent = NUMBER_WORDS[numVal];
  const dots = document.getElementById("numDots");
  dots.innerHTML = "";
  for (let i = 0; i < numVal; i++) {
    const d = document.createElement("div");
    d.className = "dot";
    d.style.animationDelay = i * 0.08 + "s";
    d.style.background = COLORS[i % COLORS.length][1];
    dots.appendChild(d);
  }
  say(`${NUMBER_WORDS[numVal]}`);
}

document.getElementById("numPrev").addEventListener("click", () => {
  numVal = numVal > 1 ? numVal - 1 : 10;
  renderNum();
});
document.getElementById("numNext").addEventListener("click", () => {
  numVal = numVal < 10 ? numVal + 1 : 1;
  renderNum();
});
document.getElementById("numSay").addEventListener("click", () => say(NUMBER_WORDS[numVal]));
document.getElementById("numCard").addEventListener("click", () => {
  // Compter à voix haute en touchant la carte.
  if (!soundOn) return;
  speechSynthesis.cancel();
  for (let i = 1; i <= numVal; i++) {
    const u = new SpeechSynthesisUtterance(NUMBER_WORDS[i]);
    u.lang = "fr-FR"; u.rate = 0.85; u.pitch = 1.15;
    if (frVoice) u.voice = frVoice;
    speechSynthesis.speak(u);
  }
});

/* ---------- Memory ---------- */

let memFirst = null, memLock = false, memPairs = 0;

function startMemory() {
  const grid = document.getElementById("memoryGrid");
  grid.innerHTML = "";
  memFirst = null; memLock = false; memPairs = 0;
  document.getElementById("memoryHint").textContent = "Trouve les paires !";

  const chosen = shuffle(MEMORY_EMOJIS).slice(0, 6); // 6 paires = 12 cartes
  const deck = shuffle([...chosen, ...chosen]);

  deck.forEach(emoji => {
    const btn = document.createElement("button");
    btn.className = "mem-card";
    btn.dataset.emoji = emoji;
    btn.textContent = emoji;
    btn.addEventListener("click", () => flipMem(btn));
    grid.appendChild(btn);
  });
}

function flipMem(btn) {
  if (memLock || btn.classList.contains("flipped") || btn.classList.contains("matched")) return;
  btn.classList.add("flipped");

  if (!memFirst) { memFirst = btn; return; }

  if (memFirst.dataset.emoji === btn.dataset.emoji) {
    memFirst.classList.add("matched");
    btn.classList.add("matched");
    memFirst = null;
    memPairs++;
    praise();
    if (memPairs === 6) {
      setTimeout(() => {
        document.getElementById("memoryHint").textContent = "Tu as gagné ! 🏆";
        say("Tu as gagné ! Bravo !");
        celebrate();
      }, 400);
    }
  } else {
    memLock = true;
    const first = memFirst;
    setTimeout(() => {
      first.classList.remove("flipped");
      btn.classList.remove("flipped");
      memFirst = null; memLock = false;
    }, 850);
  }
}

/* ---------- Trouve la lettre ---------- */

function buildQuiz(optionsEl, choices, correct, label, onRight) {
  optionsEl.innerHTML = "";
  shuffle(choices).forEach(choice => {
    const btn = document.createElement("button");
    btn.className = "quiz-btn";
    btn.textContent = choice;
    btn.addEventListener("click", () => {
      if (choice === correct) {
        btn.classList.add("right");
        praise();
        celebrate();
        setTimeout(onRight, 1100);
      } else {
        btn.classList.add("wrong");
        say("Essaie encore !");
        setTimeout(() => btn.classList.remove("wrong"), 400);
      }
    });
    optionsEl.appendChild(btn);
  });
  say(label);
}

function newFindLetter() {
  const correct = rand(ALPHABET)[0];
  const others = shuffle(ALPHABET.filter(a => a[0] !== correct)).slice(0, 5).map(a => a[0]);
  document.getElementById("findLetterTarget").textContent = correct;
  buildQuiz(document.getElementById("findLetterOptions"),
    [correct, ...others], correct, `Trouve la lettre ${correct}`, newFindLetter);
}
document.getElementById("findLetterSay").addEventListener("click", () =>
  say(`Trouve la lettre ${document.getElementById("findLetterTarget").textContent}`));

/* ---------- Trouve le chiffre ---------- */

function newFindNumber() {
  const correct = String(1 + Math.floor(Math.random() * 10));
  const pool = ["1","2","3","4","5","6","7","8","9","10"].filter(n => n !== correct);
  const others = shuffle(pool).slice(0, 5);
  document.getElementById("findNumberTarget").textContent = correct;
  buildQuiz(document.getElementById("findNumberOptions"),
    [correct, ...others], correct,
    `Trouve le chiffre ${NUMBER_WORDS[+correct]}`, newFindNumber);
}
document.getElementById("findNumberSay").addEventListener("click", () =>
  say(`Trouve le chiffre ${NUMBER_WORDS[+document.getElementById("findNumberTarget").textContent]}`));

/* ---------- Les couleurs ---------- */

function newColor() {
  const [name] = rand(COLORS);
  const others = shuffle(COLORS.filter(c => c[0] !== name)).slice(0, 3);
  const all = shuffle([COLORS.find(c => c[0] === name), ...others]);

  document.getElementById("colorTarget").textContent = name;
  const opts = document.getElementById("colorOptions");
  opts.innerHTML = "";
  all.forEach(([cname, hex]) => {
    const btn = document.createElement("button");
    btn.className = "color-swatch";
    btn.style.background = hex;
    btn.setAttribute("aria-label", cname);
    btn.addEventListener("click", () => {
      if (cname === name) {
        praise(); celebrate();
        setTimeout(newColor, 1100);
      } else {
        btn.classList.add("wrong");
        say("Essaie encore !");
        setTimeout(() => btn.classList.remove("wrong"), 400);
      }
    });
    opts.appendChild(btn);
  });
  say(`Touche la couleur ${name}`);
}
document.getElementById("colorSay").addEventListener("click", () =>
  say(`Touche la couleur ${document.getElementById("colorTarget").textContent}`));

/* ---------- Démarrage ---------- */
show("menu");
