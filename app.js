import { buyPremium } from "./payments.js";

const els = {
  name: name,
  url: url,
  group: group,
  iconType: iconType,
  emoji: emoji,
  file: customIcon,
  add: add,
  grid: grid,
  limit: limitMsg,
  modal: premiumModal,
  buy: buy,
  close: close,
  toast: toast
};

let shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");
let premium = localStorage.getItem("premium") === "true";

if (new URLSearchParams(location.search).get("premium")) {
  localStorage.setItem("premium", "true");
  premium = true;
  notify("Premium активирован");
}

els.iconType.onchange = () => {
  els.emoji.style.display = els.iconType.value === "emoji" ? "block" : "none";
  els.file.style.display = els.iconType.value === "custom" ? "block" : "none";
};

els.add.onclick = async () => {
  if (!premium && shortcuts.length >= 3) {
    els.modal.classList.remove("hidden");
    return;
  }

  const name = els.name.value.trim();
  let url = els.url.value.trim();

  if (!name || !url) return notify("Заполните все поля");

  if (!url.startsWith("http")) url = "https://" + url;

  let icon = "🌐";

  if (els.iconType.value === "emoji") {
    icon = els.emoji.value || "🔗";
  }

  if (els.iconType.value === "custom") {
    if (!premium) {
      els.modal.classList.remove("hidden");
      return;
    }
    icon = await readFile(els.file.files[0]);
  }

  shortcuts.push({
    id: Date.now(),
    name,
    url,
    group: els.group.value,
    icon
  });

  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
  render();
};

function render() {
  els.grid.innerHTML = "";
  shortcuts.forEach(s => {
    const c = document.createElement("div");
    c.className = "card";
    c.innerHTML = `
      <div class="icon">${s.icon}</div>
      <h3>${s.name}</h3>
      <div class="group">${s.group}</div>
    `;
    c.onclick = () => window.open(s.url, "_blank");
    els.grid.appendChild(c);
  });

  els.limit.textContent = premium
    ? "Premium активен"
    : `Free: ${shortcuts.length}/3`;
}

els.buy.onclick = buyPremium;
els.close.onclick = () => els.modal.classList.add("hidden");

function notify(msg) {
  els.toast.textContent = msg;
  els.toast.style.display = "block";
  setTimeout(() => els.toast.style.display = "none", 3000);
}

function readFile(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = e => res(`<img src="${e.target.result}" width="32"/>`);
    r.readAsDataURL(file);
  });
}

render();
