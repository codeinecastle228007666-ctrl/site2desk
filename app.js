const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const groupSelect = document.getElementById("group");
const iconType = document.getElementById("iconType");
const emojiPicker = document.getElementById("emojiPicker");
const customIcon = document.getElementById("customIcon");
const addBtn = document.getElementById("add");
const grid = document.getElementById("grid");
const toast = document.getElementById("toast");

let shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");

function showToast(text) {
  toast.textContent = text;
  toast.style.opacity = 1;
  setTimeout(() => toast.style.opacity = 0, 2000);
}

iconType.onchange = () => {
  emojiPicker.classList.toggle("hidden", iconType.value !== "emoji");
  customIcon.classList.toggle("hidden", iconType.value !== "custom");
};

emojiPicker.onclick = e => {
  if (e.target.textContent.trim()) {
    emojiPicker.dataset.value = e.target.textContent;
    showToast("Эмодзи выбрано");
  }
};

addBtn.onclick = () => {
  let name = nameInput.value.trim();
  let url = urlInput.value.trim();

  if (!name || !url) return showToast("Заполни все поля");
  if (!url.startsWith("http")) url = "https://" + url;

  let icon = "🌐";

  if (iconType.value === "emoji") {
    icon = emojiPicker.dataset.value || "🌐";
  }

  if (iconType.value === "favicon") {
    icon = `https://www.google.com/s2/favicons?sz=64&domain=${new URL(url).hostname}`;
  }

  const item = { id: Date.now(), name, url, group: groupSelect.value, icon };
  shortcuts.push(item);
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  render();
  downloadShortcut(item);
};

function downloadShortcut({ name, url, icon }) {
  const content = `[InternetShortcut]
URL=${url}
IconFile=${icon.startsWith("http") ? icon : ""}
IconIndex=0`;

  const blob = new Blob([content], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${name}.url`;
  a.click();
}

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
