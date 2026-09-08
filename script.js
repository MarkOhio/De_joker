const CARD_COUNT = 3;
const SITE_LINK = "PASTE_YOUR_SITE_LINK_HERE";

const FALLBACK_JOKES = [
  "Why don't scientists trust atoms? Because they make up everything.",
  "I told my computer I needed a break, and it said no problem, it'll go to sleep.",
  "Why do programmers prefer dark mode? Because light attracts bugs.",
  "Why did the scarecrow win an award? He was outstanding in his field.",
  "I'm reading a book about anti-gravity. It's impossible to put down.",
  "Why don't skeletons fight each other? They don't have the guts.",
  "What do you call fake spaghetti? An impasta.",
  "Knock knock. Who's there? Lettuce. Lettuce who? Lettuce in, it's cold out here.",
  "Why did the developer go broke? Because they used up all their cache.",
  "I only know 25 letters of the alphabet. I don't know y.",
  "What do you call a bear with no teeth? A gummy bear.",
  "Why can't your nose be 12 inches long? Because then it would be a foot.",
  "Parallel lines have so much in common. It's a shame they'll never meet.",
  "What do you call a fish with no eyes? A fsh.",
  "I used to be a banker, but I lost interest."
];

let currentJokes = new Array(CARD_COUNT).fill(null);
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
let seenJokes = JSON.parse(localStorage.getItem("seenJokes")) || [];
let jokeCount = 0;

const greetingBox = document.getElementById("greeting-box");
const namePopup = document.getElementById("name-popup");
const nameInput = document.getElementById("name-input");
const saveNameCheck = document.getElementById("save-name-check");
const usernameDisplay = document.getElementById("username-display");
const greetingWordEl = document.getElementById("greeting-word");

const themeToggleBtn = document.getElementById("theme-toggle");
const categorySelect = document.getElementById("category-select");
const refreshBtn = document.getElementById("refresh-btn");
const jokeCounterEl = document.getElementById("joke-counter");
const favoritesToggleBtn = document.getElementById("favorites-toggle");
const favoritesListEl = document.getElementById("favorites-list");
const toastEl = document.getElementById("toast");

function getGreetingWord() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

function updateGreetingName(name) {
  if (name.trim() === "") return;
  let size = 20;
  if (name.length > 5) {
    size = 20 - (name.length - 5);
  }
  size = Math.max(size, 15);
  usernameDisplay.style.fontSize = size + "px";
  usernameDisplay.textContent = name;
}

greetingBox.addEventListener("click", () => {
  namePopup.classList.toggle("open");
});

namePopup.addEventListener("click", (e) => e.stopPropagation());

saveNameCheck.addEventListener("change", () => {
  if (saveNameCheck.checked) {
    updateGreetingName(nameInput.value);
    namePopup.classList.remove("open");
    saveNameCheck.checked = false;
  }
});

document.addEventListener("click", (e) => {
  if (!greetingBox.contains(e.target)) {
    namePopup.classList.remove("open");
  }
});

function applyTheme(theme) {
  document.body.classList.toggle("dark-mode", theme === "dark");
}

function toggleTheme() {
  const newTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
}

function loadTheme() {
  const saved = localStorage.getItem("theme") || "light";
  applyTheme(saved);
}

themeToggleBtn.addEventListener("click", toggleTheme);

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(favorites));
}

function isFavorite(joke) {
  return favorites.includes(joke);
}

function updateHeart(index) {
  const heart = document.getElementById("heart-" + index);
  heart.classList.toggle("favorited", isFavorite(currentJokes[index]));
}

function pulseHeart(index) {
  const heart = document.getElementById("heart-" + index);
  heart.classList.add("pulse");
  setTimeout(() => heart.classList.remove("pulse"), 350);
}

function toggleFavorite(index) {
  const joke = currentJokes[index];
  if (!joke) return;
  const pos = favorites.indexOf(joke);
  if (pos === -1) {
    favorites.push(joke);
  } else {
    favorites.splice(pos, 1);
  }
  saveFavorites();
  updateHeart(index);
  pulseHeart(index);
  renderFavoritesList();
}

function renderFavoritesList() {
  favoritesListEl.innerHTML = "";
  if (favorites.length === 0) {
    favoritesListEl.textContent = "Your favorite jokes will show up here.";
    return;
  }
  favorites.forEach((joke) => {
    const item = document.createElement("div");
    item.className = "favorite-item";
    item.textContent = joke;
    item.addEventListener("click", () => {
      currentJokes[0] = joke;
      renderJokeText(0, joke);
      updateHeart(0);
    });
    favoritesListEl.appendChild(item);
  });
}

favoritesToggleBtn.addEventListener("click", () => {
  favoritesListEl.classList.toggle("collapsed");
});

function saveSeenJokes() {
  if (seenJokes.length > 200) {
    seenJokes = seenJokes.slice(-200);
  }
  localStorage.setItem("seenJokes", JSON.stringify(seenJokes));
}

function markSeen(joke) {
  seenJokes.push(joke);
  saveSeenJokes();
}

function alreadySeen(joke) {
  return seenJokes.includes(joke) || currentJokes.includes(joke);
}

async function fetchDadJoke() {
  const res = await fetch("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
  const data = await res.json();
  return data.joke;
}

async function fetchJokeApi(query) {
  const res = await fetch("https://v2.jokeapi.dev/joke/" + query);
  const data = await res.json();
  return data.type === "single" ? data.joke : data.setup + " ... " + data.delivery;
}

async function fetchOfficialJoke(type) {
  const res = await fetch("https://official-joke-api.appspot.com/jokes/" + type + "/random");
  const data = await res.json();
  const joke = Array.isArray(data) ? data[0] : data;
  return joke.setup + " ... " + joke.punchline;
}

function getJokeByCategory(category) {
  switch (category) {
    case "dad": return fetchDadJoke();
    case "programming": return fetchJokeApi("Programming?safe-mode");
    case "dark": return fetchJokeApi("Dark?blacklistFlags=racist,sexist");
    case "knock-knock": return fetchOfficialJoke("knock-knock");
    default: return fetchJokeApi("Pun?safe-mode");
  }
}

async function getUniqueJoke(category) {
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const joke = await getJokeByCategory(category);
      if (!alreadySeen(joke)) return joke;
    } catch (err) {
      break;
    }
  }
  const unused = FALLBACK_JOKES.filter((j) => !alreadySeen(j));
  const pool = unused.length ? unused : FALLBACK_JOKES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function renderJokeText(index, text) {
  const el = document.getElementById("joke-text-" + index);
  el.classList.remove("fade-in");
  void el.offsetWidth;
  el.textContent = text;
  el.classList.add("fade-in");
}

function setLoading(index, isLoading) {
  document.getElementById("joke-card-" + index).classList.toggle("loading", isLoading);
}

async function refreshCard(index) {
  setLoading(index, true);
  const category = categorySelect.value;
  const joke = await getUniqueJoke(category);
  currentJokes[index] = joke;
  markSeen(joke);
  setLoading(index, false);
  renderJokeText(index, joke);
  updateHeart(index);
  jokeCount++;
  jokeCounterEl.textContent = "Jokes viewed: " + jokeCount;
}

function refreshAll() {
  refreshBtn.classList.remove("spinning");
  void refreshBtn.offsetWidth;
  refreshBtn.classList.add("spinning");
  for (let i = 0; i < CARD_COUNT; i++) {
    refreshCard(i);
  }
}

refreshBtn.addEventListener("click", refreshAll);
categorySelect.addEventListener("change", refreshAll);

function shareJoke(index) {
  const text = currentJokes[index] + "\n\n" + SITE_LINK;
  navigator.clipboard.writeText(text);
  showToast("Copied joke + link!");
}

function copyJoke(index) {
  navigator.clipboard.writeText(currentJokes[index]);
  showToast("Copied joke!");
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 1500);
}

document.addEventListener("keydown", (e) => {
  if (e.code === "Space" && document.activeElement !== nameInput) {
    e.preventDefault();
    refreshAll();
  }
});

greetingWordEl.textContent = getGreetingWord();
loadTheme();
renderFavoritesList();
refreshAll();
