const tesseract  = require('tesseract.js'),
      { app }    = require('electron'),
      screenshot = require('screenshot-desktop'),
      path       = require('path');

class Worker {
  constructor() {
    this.worker = tesseract.createWorker({
      langPath: path.join(app.getAppPath(), 'tess-data'),
      cacheMethod: 'none',
      gzip: false
    });

    this.vertical = false;

    this.registerEventListeners();
  }

  registerEventListeners() {
    process.on('tesseract-scan', async (bounds) => {
      const image = await screenshot();
      const data = await this.recognize(image, bounds);

      const textNoSpaces = data.data.lines.map(line => {
        return line.words.map(word => word.text).join('');
      }).join('\n');

      process.emit('tesseract-scanned', textNoSpaces);
    })
  }

  setVertical(enabled) {
    this.vertical = enabled;
  }

  async initialize() {
    await this.worker.load();
    await this.worker.loadLanguage('jpn+jpn_vert');
    await this.worker.initialize('jpn+jpn_vert', 1);
  }

  async recognize(image, bounds) {
    this.worker.setParameters({
      tessedit_pageseg_mode: this.vertical ? '5' : '6' // for normal  //'5' for vert
    });

    return this.worker.recognize(image, {
      rectangles: [
        { left: bounds.x, top: bounds.y, height: bounds.height, width: bounds.width }
      ]
    });
  }
}

module.exports = Worker;
