// ico-creator.js - библиотека для создания .ico файлов из изображений

class ICOCreator {
  static async createICOFromDataURL(dataURL, sizes = [16, 32, 48, 64]) {
    try {
      // Конвертируем DataURL в Image
      const img = await this.loadImage(dataURL);
      
      // Создаем canvas для каждого размера
      const iconData = [];
      
      for (const size of sizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Рисуем изображение с масштабированием
        ctx.drawImage(img, 0, 0, size, size);
        
        // Получаем данные PNG
        const pngData = await this.canvasToPNG(canvas);
        iconData.push({ size, data: pngData });
      }
      
      // Создаем ICO файл
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
    // ICO формат заголовка
    const header = new ArrayBuffer(6);
    const headerView = new DataView(header);
    headerView.setUint16(0, 0, true); // Reserved
    headerView.setUint16(2, 1, true); // Type (1 for ICO)
    headerView.setUint16(4, iconData.length, true); // Number of images
    
    // Собираем все части
    const parts = [header];
    let offset = 6 + (iconData.length * 16);
    
    for (const icon of iconData) {
      const entry = new ArrayBuffer(16);
      const entryView = new DataView(entry);
      
      entryView.setUint8(0, icon.size); // Width
      entryView.setUint8(1, icon.size); // Height
      entryView.setUint8(2, 0); // Color count
      entryView.setUint8(3, 0); // Reserved
      entryView.setUint16(4, 1, true); // Color planes
      entryView.setUint16(6, 32, true); // Bits per pixel
      entryView.setUint32(8, icon.data.byteLength, true); // Size of image data
      entryView.setUint32(12, offset, true); // Offset of image data
      
      parts.push(entry);
      offset += icon.data.byteLength;
    }
    
    // Добавляем данные PNG
    for (const icon of iconData) {
      parts.push(icon.data);
    }
    
    // Объединяем все части
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