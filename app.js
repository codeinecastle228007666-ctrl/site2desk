const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const groupSelect = document.getElementById("group");
const iconType = document.getElementById("iconType");
const emojiInput = document.getElementById("emoji");
const customIconInput = document.getElementById("customIcon");
const addBtn = document.getElementById("add");
const grid = document.getElementById("grid");
const limitMsg = document.getElementById("limitMsg");

const premiumModal = document.getElementById("premiumModal");
const buyBtn = document.getElementById("buy");
const closeBtn = document.getElementById("close");
const toast = document.getElementById("toast");

let shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");
let premium = localStorage.getItem("premium") === "true";
const FREE_LIMIT = 3;

/* ---------- UI ---------- */

function showToast(text) {
  toast.textContent = text;
  toast.style.opacity = 1;
  setTimeout(() => toast.style.opacity = 0, 2000);
}

iconType.onchange = () => {
  emojiInput.style.display = iconType.value === "emoji" ? "block" : "none";
  customIconInput.style.display = iconType.value === "custom" ? "block" : "none";

  if (iconType.value === "custom" && !premium) {
    premiumModal.classList.remove("hidden");
    iconType.value = "favicon";
  }
};

closeBtn.onclick = () => premiumModal.classList.add("hidden");

buyBtn.onclick = () => {
  // ЗАГЛУШКА
  premium = true;
  localStorage.setItem("premium", "true");
  premiumModal.classList.add("hidden");
  showToast("Premium активирован (тест)");
};

/* ---------- LOGIC ---------- */

addBtn.onclick = () => {
  if (!premium && shortcuts.length >= FREE_LIMIT) {
    limitMsg.textContent = "Лимит Free версии исчерпан";
    return;
  }

  let name = nameInput.value.trim();
  let url = urlInput.value.trim();

  if (!name || !url) {
    showToast("Заполни все поля");
    return;
  }

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  let icon = "🌐";

  if (iconType.value === "emoji") {
    icon = emojiInput.value || "🌐";
  }

  if (iconType.value === "favicon") {
    icon = new URL(url).origin + "/favicon.ico";
  }

  if (iconType.value === "custom") {
    icon = "custom";
  }

  const item = {
    id: Date.now(),
    name,
    url,
    group: groupSelect.value,
    icon
  };

  shortcuts.push(item);
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  render();
  downloadShortcut(item);

  nameInput.value = "";
  urlInput.value = "";
};

/* ---------- DESKTOP SHORTCUT ---------- */

function downloadShortcut({ name, url, icon }) {
  const content = `[InternetShortcut]
URL=${url}
IconFile=${typeof icon === "string" && icon.startsWith("http") ? icon : ""}
IconIndex=0
`;

  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.url`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/* ---------- RENDER ---------- */

function render() {
  grid.innerHTML = "";

  shortcuts.forEach(s => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="icon">${s.icon.startsWith("http") ? "🌐" : s.icon}</div>
      <strong>${s.name}</strong>
      <small>${s.group}</small>
    `;

    grid.appendChild(div);
  });
}

render();
