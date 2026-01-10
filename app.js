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
  iconType.onchange = () => {
    emojiPicker.classList.toggle("hidden", iconType.value !== "emoji");
    customIcon.classList.toggle("hidden", iconType.value !== "custom");
    
    if (iconType.value === "emoji") {
      customIcon.value = '';
    }
  };
  
  emojiPicker.onclick = e => {
    if (e.target.textContent.trim()) {
      emojiPicker.dataset.value = e.target.textContent;
      showToast("Эмодзи выбрано");
    }
  };
  
  addBtn.onclick = () => {
    addShortcut();
  };
  
  nameInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addShortcut();
  });
  
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addShortcut();
  });
  
  customIcon.onchange = function(e) {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        showToast("Файл слишком большой (макс 1MB)");
        this.value = '';
      }
    }
  };
  
  render();
});

async function addShortcut() {
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

  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    new URL(url);
  } catch (error) {
    showToast("Некорректный URL");
    return;
  }

  let icon = "🌐";
  let iconUrl = "";
  let iconData = null;

  if (iconType.value === "emoji") {
    icon = emojiPicker.dataset.value || "🌐";
    iconData = icon;
  } else if (iconType.value === "favicon") {
    icon = "🌐";
    try {
      const hostname = new URL(url).hostname;
      iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
      
      // Пробуем скачать favicon и конвертировать в data URL
      showToast("Скачиваю иконку...");
      iconData = await fetchFaviconAsDataURL(iconUrl);
    } catch {
      iconData = null;
    }
  } else if (iconType.value === "custom") {
    if (customIcon.files.length > 0) {
      const file = customIcon.files[0];
      iconData = await readFileAsDataURL(file);
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
    icon: iconData || (iconType.value === 'favicon' ? iconUrl : icon),
    iconType: iconType.value
  };
  
  shortcuts.push(item);
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  render();
  await downloadShortcutWithIcon(item);
  resetForm();
}

async function fetchFaviconAsDataURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch favicon');
    
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not fetch favicon:', error);
    return null;
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function resetForm() {
  nameInput.value = '';
  urlInput.value = '';
  nameInput.focus();
  
  if (iconType.value === 'custom') {
    customIcon.value = '';
  }
}

async function downloadShortcutWithIcon({ name, url, icon, iconType }) {
  try {
    let iconContent = "";
    let fileName = `${name.replace(/[^\w\s]/gi, '')}.url`;
    
    if (iconType === 'favicon' && icon && icon.startsWith("data:")) {
      // Конвертируем data URL в ICO файл и скачиваем его
      const icoFileName = `${name.replace(/[^\w\s]/gi, '')}.ico`;
      
      // Создаем .url файл
      const urlContent = `[InternetShortcut]\r\nURL=${url}\r\nIconFile=${icoFileName}\r\nIconIndex=0`;
      
      // Создаем ICO файл из data URL
      const icoBlob = dataURLToBlob(icon);
      
      // Скачиваем оба файла
      downloadFile(`${name}.url`, urlContent, 'text/plain');
      await downloadBlob(icoFileName, icoBlob);
      
    } else if (iconType === 'custom' && icon && icon.startsWith("data:")) {
      // Для кастомных иконок
      const ext = icon.match(/^data:image\/(\w+);/)[1];
      const iconFileName = `${name.replace(/[^\w\s]/gi, '')}.${ext}`;
      
      const urlContent = `[InternetShortcut]\r\nURL=${url}\r\nIconFile=${iconFileName}\r\nIconIndex=0`;
      
      const iconBlob = dataURLToBlob(icon);
      
      downloadFile(`${name}.url`, urlContent, 'text/plain');
      await downloadBlob(iconFileName, iconBlob);
      
    } else if (iconType === 'emoji') {
      // Для эмодзи используем системные иконки
      const urlContent = `[InternetShortcut]\r\nURL=${url}`;
      downloadFile(fileName, urlContent, 'text/plain');
    } else {
      // Без иконки
      const urlContent = `[InternetShortcut]\r\nURL=${url}`;
      downloadFile(fileName, urlContent, 'text/plain');
    }
    
    showToast(`Ярлык "${name}" создан!`);
  } catch (error) {
    console.error("Ошибка создания ярлыка:", error);
    
    // Fallback: создаем простой .url без иконки
    try {
      const urlContent = `[InternetShortcut]\r\nURL=${url}`;
      downloadFile(`${name}.url`, urlContent, 'text/plain');
      showToast(`Ярлык создан (без иконки)`);
    } catch (fallbackError) {
      showToast("Ошибка при создании ярлыка");
    }
  }
}

function dataURLToBlob(dataURL) {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    if (s.icon && s.icon.startsWith("data:")) {
      iconHTML = `<img src="${s.icon}" alt="${s.name}" class="favicon-img">`;
    } else if (s.icon && s.icon.startsWith("http")) {
      iconHTML = `<img src="${s.icon}" alt="${s.name}" class="favicon-img" onerror="this.style.display='none'; this.parentElement.innerHTML='🌐';">`;
    } else {
      iconHTML = `<div class="emoji-icon">${s.icon || "🌐"}</div>`;
    }
    
    div.innerHTML = `
      <div class="icon">${iconHTML}</div>
      <strong>${s.name}</strong>
      <small>${s.group}</small>
      <div class="card-actions">
        <button class="open-btn" data-url="${s.url}">↗</button>
        <button class="delete-btn" data-id="${s.id}">×</button>
        <button class="download-btn" data-id="${s.id}" title="Скачать ярлык">↓</button>
      </div>
    `;
    
    grid.appendChild(div);
  });
  
  // Обработчики кнопок
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
  
  document.querySelectorAll('.download-btn').forEach(btn => {
    btn.onclick = async function(e) {
      e.stopPropagation();
      const id = parseInt(this.getAttribute('data-id'));
      const shortcut = shortcuts.find(s => s.id === id);
      if (shortcut) {
        showToast("Создаю ярлык...");
        await downloadShortcutWithIcon(shortcut);
      }
    };
  });
  
  document.querySelectorAll('.card').forEach(card => {
    card.onclick = function() {
      const url = this.querySelector('.open-btn')?.getAttribute('data-url');
      if (url) {
        window.open(url, '_blank');
      }
    };
  });
}