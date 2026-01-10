import { buyPremium } from "./payments.js";

const grid = document.getElementById("grid");
const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const addBtn = document.getElementById("add");
const modal = document.getElementById("premiumModal");
const buyBtn = document.getElementById("buy");
const closeBtn = document.getElementById("close");
const limitMsg = document.getElementById("limitMsg");
const toast = document.getElementById("toast");

let shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");
let premium = localStorage.getItem("premium") === "true";

// activate premium after payment
if (new URLSearchParams(location.search).get("premium")) {
  localStorage.setItem("premium", "true");
  premium = true;
  showToast("Premium активирован 🚀");
}

render();

addBtn.onclick = () => {
  if (!premium && shortcuts.length >= 3) {
    modal.classList.remove("hidden");
    return;
  }

  const name = nameInput.value.trim();
  const url = urlInput.value.trim().startsWith("http")
    ? urlInput.value.trim()
    : "https://" + urlInput.value.trim();

  if (!name || !url) return;

  shortcuts.push({ id: Date.now(), name, url });
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  nameInput.value = "";
  urlInput.value = "";

  render();
};

function render() {
  grid.innerHTML = "";
  shortcuts.forEach(s => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${s.name}</h3><p>${new URL(s.url).hostname}</p>`;
    card.onclick = () => window.open(s.url, "_blank");
    grid.appendChild(card);
  });

  limitMsg.textContent = premium
    ? "Premium активен"
    : `Free: ${shortcuts.length}/3`;
}

buyBtn.onclick = buyPremium;
closeBtn.onclick = () => modal.classList.add("hidden");

function showToast(msg) {
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => (toast.style.display = "none"), 3000);
}
