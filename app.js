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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  // Управление видимостью эмодзи и загрузки иконок
  iconType.onchange = () => {
    emojiPicker.classList.toggle("hidden", iconType.value !== "emoji");
    customIcon.classList.toggle("hidden", iconType.value !== "custom");
    
    // Если выбрана эмодзи, сбрасываем выбор файла
    if (iconType.value === "emoji") {
      customIcon.value = '';
    }
  };
  
  // Обработчик клика по эмодзи
  emojiPicker.onclick = e => {
    if (e.target.textContent.trim()) {
      emojiPicker.dataset.value = e.target.textContent;
      showToast("Эмодзи выбрано");
    }
  };
  
  // Обработчик кнопки добавления
  addBtn.onclick = () => {
    addShortcut();
  };
  
  // Обработчик нажатия Enter в полях ввода
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addShortcut();
  });
  
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addShortcut();
  });
  
  // Загрузка кастомной иконки
  customIcon.onchange = function(e) {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) { // 1MB лимит
        showToast("Файл слишком большой (макс 1MB)");
        this.value = '';
      }
    }
  };
  
  // Инициализируем рендер
  render();
});

function addShortcut() {
  let name = nameInput.value.trim();
  let url = urlInput.value.trim();

  if (!name) {
    showToast("Введите название сайта");
    nameInput.focus();
    return;
  }
  
  if (!url) {
    showToast("Введите URL сайта");
    urlInput.focus();
    return;
  }

  // Проверяем URL
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    // Пытаемся создать URL объект для проверки
    new URL(url);
  } catch (error) {
    showToast("Некорректный URL");
    return;
  }

  let icon = "🌐";
  let iconUrl = "";

  if (iconType.value === "emoji") {
    icon = emojiPicker.dataset.value || "🌐";
    iconUrl = "";
  } else if (iconType.value === "favicon") {
    icon = "🌐";
    try {
      const hostname = new URL(url).hostname;
      iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
    } catch {
      iconUrl = "";
    }
  } else if (iconType.value === "custom") {
    if (customIcon.files.length > 0) {
      const file = customIcon.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const item = {
          id: Date.now(),
          name,
          url,
          group: groupSelect.value,
          icon: e.target.result,
          iconType: 'custom'
        };
        shortcuts.push(item);
        localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
        render();
        downloadShortcut(item);
        resetForm();
      };
      reader.readAsDataURL(file);
      return;
    } else {
      showToast("Выберите файл иконки");
      return;
    }
  }

  const item = {
    id: Date.now(),
    name,
    url,
    group: groupSelect.value,
    icon: iconType.value === 'favicon' ? iconUrl : icon,
    iconType: iconType.value
  };
  
  shortcuts.push(item);
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  render();
  downloadShortcut(item);
  resetForm();
}

function resetForm() {
  nameInput.value = '';
  urlInput.value = '';
  nameInput.focus();
  
  // Сбрасываем дополнительные поля
  if (iconType.value === 'custom') {
    customIcon.value = '';
  }
}

function downloadShortcut({ name, url, icon, iconType }) {
  try {
    let iconFile = "";
    
    if (iconType === 'favicon' && icon && icon.startsWith("http")) {
      iconFile = icon;
    }
    // Для кастомных иконок не добавляем IconFile, так как это data URL
    
    const content = `[InternetShortcut]
URL=${url}
${iconFile ? `IconFile=${iconFile}` : ''}
IconIndex=0`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name.replace(/[^\w\s]/gi, '')}.url`; // Убираем спецсимволы из имени файла
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    showToast(`Ярлык "${name}" создан!`);
  } catch (error) {
    console.error("Ошибка создания ярлыка:", error);
    showToast("Ошибка при создании ярлыка");
  }
}

function render() {
  if (!grid) return;
  
  grid.innerHTML = "";
  
  if (shortcuts.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #94a3b8;">Пока нет ярлыков. Создайте первый!</p>';
    return;
  }
  
  shortcuts.forEach(s => {
    const div = document.createElement("div");
    div.className = "card";
    
    let iconHTML = "";
    if (s.icon && s.icon.startsWith("http")) {
      // Если иконка - это URL (favicon)
      iconHTML = `<img src="${s.icon}" alt="${s.name}" class="favicon-img" onerror="this.style.display='none'; this.parentElement.innerHTML='🌐';">`;
    } else if (s.icon && s.icon.startsWith("data:image")) {
      // Если иконка - это data URL (кастомная иконка)
      iconHTML = `<img src="${s.icon}" alt="${s.name}" class="favicon-img">`;
    } else {
      // Если иконка - эмодзи или текст
      iconHTML = `<div class="emoji-icon">${s.icon || "🌐"}</div>`;
    }
    
    div.innerHTML = `
      <div class="icon">${iconHTML}</div>
      <strong>${s.name}</strong>
      <small>${s.group}</small>
      <div class="card-actions">
        <button class="open-btn" data-url="${s.url}">↗</button>
        <button class="delete-btn" data-id="${s.id}">×</button>
      </div>
    `;
    
    grid.appendChild(div);
  });
  
  // Добавляем обработчики для кнопок
  document.querySelectorAll('.open-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const url = this.getAttribute('data-url');
      window.open(url, '_blank');
    };
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      if (confirm("Удалить этот ярлык?")) {
        shortcuts = shortcuts.filter(s => s.id !== id);
        localStorage.setItem("shortcuts", JSON.stringify(shortcuts));
        render();
        showToast("Ярлык удален");
      }
    };
  });
  
  // Клик по карточке тоже открывает сайт
  document.querySelectorAll('.card').forEach(card => {
    card.onclick = function() {
      const url = this.querySelector('.open-btn')?.getAttribute('data-url');
      if (url) {
        window.open(url, '_blank');
      }
    };
  });
}