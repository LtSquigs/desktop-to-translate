const //tesseract  = require('tesseract.js'),
      { app }    = require('electron'),
      screenshot = require('screenshot-desktop'),
      path       = require('path'),
      languages  = require('../languages.json'),
      VisionLib  = require('@google-cloud/vision'),
      Datauri    = require('datauri'),
      DatauriParser = require('datauri/parser'),
      jimp       = require('jimp'),
      wanakana       = require('wanakana'),
      //tesseract       = require('tesseract.js'),
      tesseract = require('node-tesseract-ocr'),
      fs         = require('fs');

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
      //console.log('recognized');
      //process.emit('tesseract-scanned', data);
      // const text = data.data.text;
      // const textNoSpaces = data.data.lines.map(line => {
      //   return line.words.map(word => word.text).join('');
      // }).join('\n');
      //
      // let finalText = this.sourceLanguage.removeSpaces ? textNoSpaces : text;
      //
      // const customDictionary = this.config.readConfig('customDictionary');
      //
      // for(let entry of customDictionary) {
      //   // We use this instead of a regular replace so that its global, and we avoid regex/unicode complications
      //   finalText = finalText.split(entry[0]).join(entry[1]);
      // }
      //
      // process.emit('tesseract-scanned', finalText);

      process.emit('tesseract-scanned', data.fullTextAnnotation.text);
    })
  }

  setVertical(enabled) {
    this.vertical = enabled;
  }

  async restart() {
    //await this.worker.terminate();

    this.sourceLanguage = languages[this.config.readConfig('sourceLanguage')];

    await this.initialize();
  }

  async initialize() {
    this.vision = new VisionLib.ImageAnnotatorClient({ credentials: JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'service-keys.json')).toString()) });
    // Some language data files we keep local as they have been updated compared to the online host
    // if (this.sourceLanguage.local) {
    //   this.worker = tesseract.createWorker({
    //     langPath: path.join(app.getAppPath(), 'tess-data'),
    //     cacheMethod: 'none',
    //     gzip: false
    //   });
    // } else {
    //   this.worker = tesseract.createWorker({
    //     langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
    //     cachePath: app.getPath('userData')
    //   });
    // }
    //
    // await this.worker.load();
    // await this.worker.loadLanguage(this.sourceLanguage.tesseract);
    // await this.worker.initialize(this.sourceLanguage.tesseract, 1);
  }

  async recognize(image, bounds) {
    const jimpImage = await jimp.read(image);
    const croppedImage = await jimpImage.crop(
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height
    );
    const data = await croppedImage.getBufferAsync(jimp.MIME_PNG)
    const datauri = new DatauriParser();

    this.processImage(data);

    //fs.writeFileSync('test.png', data);
    datauri.format('sent.jpg', data);
    
    const results = await this.vision.textDetection({
      image: {
        content: data
      },
      imageContext: {
        languageHints: [this.sourceLanguage.google]
      }
    });
    
    return results[0];

    // const config = {
    //   lang: this.sourceLanguage.tesseract,
    //   oem: 1,
    //   psm: this.vertical ? 5 : 6,
    //   "tessdata-dir": path.join(app.getAppPath(), 'tess-data')
    // };

    // return tesseract.recognize(data, config)

    // this.worker.setParameters({
    //   tessedit_pageseg_mode: this.vertical ? '5' : '6'
    // });
    //
    // console.log('trying to recognize');
    // return this.worker.recognize(image);
    // return this.worker.recognize(image, {
    //   rectangles: [
    //     { left: bounds.x, top: bounds.y, height: bounds.height, width: bounds.width }
    //   ]
    // });
  }

  async processImage(data) {
    // const cvImage = cv.imdecode(data);
    // cv.imwrite("test.png", cvImage)
  }
}

module.exports = Worker;
