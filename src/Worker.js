const tesseract  = require('tesseract.js'),
      { app }    = require('electron'),
      screenshot = require('screenshot-desktop'),
      path       = require('path'),
      languages  = require('../languages.json');

class Worker {
  constructor(config) {
    this.config = config;
    this.sourceLanguage = languages[this.config.readConfig('sourceLanguage')];
    this.vertical = false;

    this.registerEventListeners();
  }

  registerEventListeners() {
    process.on('tesseract-scan', async (bounds) => {
      const image = await screenshot();
      const data = await this.recognize(image, bounds);
      const text = data.data.text;
      const textNoSpaces = data.data.lines.map(line => {
        return line.words.map(word => word.text).join('');
      }).join('\n');

      let finalText = this.sourceLanguage.removeSpaces ? textNoSpaces : text;

      const customDictionary = this.config.readConfig('customDictionary');

      for(let entry of customDictionary) {
        // We use this instead of a regular replace so that its global, and we avoid regex/unicode complications
        finalText = finalText.split(entry[0]).join(entry[1]);
      }

      process.emit('tesseract-scanned', finalText);
    })
  }

  setVertical(enabled) {
    this.vertical = enabled;
  }

  async restart() {
    await this.worker.terminate();

    this.sourceLanguage = languages[this.config.readConfig('sourceLanguage')];

    await this.initialize();
  }

  async initialize() {
    // Some language data files we keep local as they have been updated compared to the online host
    if (this.sourceLanguage.local) {
      this.worker = tesseract.createWorker({
        langPath: path.join(app.getAppPath(), 'tess-data'),
        cacheMethod: 'none',
        gzip: false
      });
    } else {
      this.worker = tesseract.createWorker({
        langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
        cachePath: app.getPath('userData')
      });
    }

    await this.worker.load();
    await this.worker.loadLanguage(this.sourceLanguage.tesseract);
    await this.worker.initialize(this.sourceLanguage.tesseract, 1);
  }

  async recognize(image, bounds) {
    this.worker.setParameters({
      tessedit_pageseg_mode: this.vertical ? '5' : '6'
    });

    return this.worker.recognize(image, {
      rectangles: [
        { left: bounds.x, top: bounds.y, height: bounds.height, width: bounds.width }
      ]
    });
  }
}

module.exports = Worker;
