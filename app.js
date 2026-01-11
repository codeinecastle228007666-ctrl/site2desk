const nameInput = document.getElementById("name");
const urlInput = document.getElementById("url");
const groupSelect = document.getElementById("group");
const iconType = document.getElementById("iconType");
const emojiPicker = document.getElementById("emojiPicker");
const customIcon = document.getElementById("customIcon");
const osSelect = document.getElementById("osSelect");
const addBtn = document.getElementById("add");
const grid = document.getElementById("grid");
const toast = document.getElementById("toast");

let shortcuts = JSON.parse(localStorage.getItem("shortcuts") || "[]");

// Класс для создания ICO файлов (добавлен!)
class ICOCreator {
  static async createICOFromDataURL(dataURL, sizes = [16, 32, 48, 64]) {
    try {
      const img = await this.loadImage(dataURL);
      const iconData = [];
      
      for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);
        
        const pngData = await this.canvasToPNG(canvas);
        iconData.push({ size, data: pngData });
      }
      
      return this.createICOFile(iconData);
    } catch (error) {
      console.error('Error creating ICO:', error);
      return null;
    }
  }
  
  static loadImage(dataURL) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataURL;
    });
  }
  
  static canvasToPNG(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    });
  }
  
  static createICOFile(iconData) {
    const header = new ArrayBuffer(6);
    const headerView = new DataView(header);
    headerView.setUint16(0, 0, true);
    headerView.setUint16(2, 1, true);
    headerView.setUint16(4, iconData.length, true);
    
    const parts = [header];
    let offset = 6 + (iconData.length * 16);
    
    for (const icon of iconData) {
      const entry = new ArrayBuffer(16);
      const entryView = new DataView(entry);
      
      entryView.setUint8(0, icon.size);
      entryView.setUint8(1, icon.size);
      entryView.setUint8(2, 0);
      entryView.setUint8(3, 0);
      entryView.setUint16(4, 1, true);
      entryView.setUint16(6, 32, true);
      entryView.setUint32(8, icon.data.byteLength, true);
      entryView.setUint32(12, offset, true);
      
      parts.push(entry);
      offset += icon.data.byteLength;
    }
    
    for (const icon of iconData) {
      parts.push(icon.data);
    }
    
    const totalLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
    const result = new Uint8Array(totalLength);
    let position = 0;
    
    for (const part of parts) {
      result.set(new Uint8Array(part), position);
      position += part.byteLength;
    }
    
    return result.buffer;
  }
}

// Определяем ОС пользователя
function detectOS() {
  const userAgent = window.navigator.userAgent;
  if (userAgent.includes("Win")) return "windows";
  if (userAgent.includes("Mac")) return "mac";
  if (userAgent.includes("Linux")) return "linux";
  if (userAgent.includes("X11")) return "linux";
  return "windows";
}

function showToast(text) {
  toast.textContent = text;
  toast.style.opacity = 1;
  setTimeout(() => toast.style.opacity = 0, 2000);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  // Устанавливаем детектированную ОС по умолчанию
  const detectedOS = detectOS();
  if (osSelect) {
    osSelect.value = detectedOS;
    updateOSInstructions(detectedOS);
  }
  
  iconType.onchange = () => {
    emojiPicker.classList.toggle("hidden", iconType.value !== "emoji");
    customIcon.classList.toggle("hidden", iconType.value !== "custom");
    
    if (iconType.value === "emoji") {
      customIcon.value = '';
    }
  };
  
  if (osSelect) {
    osSelect.onchange = function() {
      updateOSInstructions(this.value);
    };
  }
  
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

function updateOSInstructions(os) {
  const instructions = document.getElementById('osInstructions');
  if (!instructions) return;
  
  const instructionsText = {
    windows: `📌 <strong>Для Windows:</strong> Скачанный .url файл можно перетащить на рабочий стол. Иконка будет работать если файл .ico лежит рядом.`,
    mac: `🍎 <strong>Для macOS:</strong> Скачанный .webloc файл можно открыть через Finder. Для иконок требуется дополнительная настройка.`,
    linux: `🐧 <strong>Для Linux:</strong> Скачанный .desktop файл нужно сделать исполняемым (chmod +x). Иконки требуют правильного пути.`
  };
  
  instructions.innerHTML = instructionsText[os] || instructionsText.windows;
}

async function addShortcut() {
  let name = nameInput.value.trim();
  let url = urlInput.value.trim();
  const os = osSelect ? osSelect.value : detectOS();

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
  let iconData = null;
  let faviconUrl = null;

  if (iconType.value === "emoji") {
    icon = emojiPicker.dataset.value || "🌐";
    iconData = icon;
  } else if (iconType.value === "favicon") {
    icon = "🌐";
    try {
      const hostname = new URL(url).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
      
      showToast("Скачиваю иконку...");
      iconData = await fetchFaviconAsDataURL(faviconUrl);
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
    icon: iconData || icon,
    iconType: iconType.value,
    os,
    faviconUrl: faviconUrl,
    createdAt: new Date().toISOString()
  };
  
  shortcuts.push(item);
  localStorage.setItem("shortcuts", JSON.stringify(shortcuts));

  render();
  await createShortcutForOS(item);
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

async function createShortcutForOS({ name, url, icon, iconType, os, faviconUrl }) {
  try {
    const cleanName = name.replace(/[^\w\s-]/gi, '');
    
    switch(os) {
      case 'windows':
        await createWindowsShortcut(cleanName, url, icon, iconType);
        break;
      case 'mac':
        await createMacShortcut(cleanName, url, icon, iconType);
        break;
      case 'linux':
        await createLinuxShortcut(cleanName, url, icon, iconType);
        break;
      default:
        await createWindowsShortcut(cleanName, url, icon, iconType);
    }
    
    showToast(`Ярлык "${name}" создан для ${os}!`);
  } catch (error) {
    console.error("Ошибка создания ярлыка:", error);
    showToast("Ошибка при создании ярлыка");
  }
}

// Создание Windows .url файла С иконкой (использует ICOCreator!)
async function createWindowsShortcut(name, url, icon, iconType) {
  let iconFile = "";
  
  // Если есть иконка, создаем .ico файл
  if (icon && icon.startsWith("data:")) {
    try {
      // Используем ICOCreator для создания настоящего .ico файла
      const icoData = await ICOCreator.createICOFromDataURL(icon);
      if (icoData) {
        const icoBlob = new Blob([icoData], { type: 'image/x-icon' });
        const icoFileName = `${name}.ico`;
        
        const urlContent = `[InternetShortcut]\r\nURL=${url}\r\nIconFile=${icoFileName}\r\nIconIndex=0\r\nHotKey=0\r\nIDList=`;
        
        downloadFile(`${name}.url`, urlContent, 'text/plain');
        
        setTimeout(() => {
          downloadBlob(icoFileName, icoBlob);
        }, 100);
        
        return;
      }
    } catch (error) {
      console.warn("ICO creation failed, falling back to PNG", error);
    }
    
    // Fallback: создаем PNG если ICO не получилось
    try {
      const pngFileName = `${name}.png`;
      const iconBlob = dataURLToBlob(icon);
      
      const urlContent = `[InternetShortcut]\r\nURL=${url}\r\nIconFile=${pngFileName}\r\nIconIndex=0`;
      
      downloadFile(`${name}.url`, urlContent, 'text/plain');
      
      setTimeout(() => {
        downloadBlob(pngFileName, iconBlob);
      }, 100);
      
      return;
    } catch (error) {
      console.warn("PNG creation failed, creating simple shortcut", error);
    }
  }
  
  // Fallback: простой .url без иконки
  const urlContent = `[InternetShortcut]\r\nURL=${url}`;
  downloadFile(`${name}.url`, urlContent, 'text/plain');
}

// Создание macOS .webloc файла
async function createMacShortcut(name, url, icon, iconType) {
  const weblocContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>URL</key>
    <string>${url}</string>
</dict>
</plist>`;
  
  downloadFile(`${name}.webloc`, weblocContent, 'application/xml');
  
  // Для macOS также создаем .desktop файл как альтернатива
  const desktopContent = `[Desktop Entry]
Name=${name}
Exec=open "${url}"
Icon=web-browser
Type=Application
Terminal=false`;
  
  downloadFile(`${name}.desktop`, desktopContent, 'text/plain');
}

// Создание Linux .desktop файла
async function createLinuxShortcut(name, url, icon, iconType) {
  let iconPath = "web-browser";
  
  // Если есть иконка, указываем путь
  if (icon && icon.startsWith("data:")) {
    const iconFileName = `${name}.png`;
    const iconBlob = dataURLToBlob(icon);
    
    // Скачиваем иконку отдельно
    setTimeout(() => {
      downloadBlob(iconFileName, iconBlob);
    }, 100);
    
    iconPath = iconFileName;
  }
  
  const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=${name}
Comment=Shortcut to ${url}
Exec=xdg-open "${url}"
Icon=${iconPath}
Terminal=false
Categories=Network;WebBrowser;`;
  
  downloadFile(`${name}.desktop`, desktopContent, 'text/plain');
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
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
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
    div.dataset.id = s.id;
    
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
      <small>${s.group} • ${getOSIcon(s.os)} ${s.os}</small>
      <div class="card-actions">
        <button class="open-btn" data-url="${s.url}" title="Открыть сайт">↗</button>
        <button class="download-btn" data-id="${s.id}" title="Скачать ярлык">↓</button>
        <button class="delete-btn" data-id="${s.id}" title="Удалить">×</button>
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
        await createShortcutForOS(shortcut);
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

function getOSIcon(os) {
  const icons = {
    windows: "🪟",
    mac: "🍎",
    linux: "🐧"
  };
  return icons[os] || "💻";
}