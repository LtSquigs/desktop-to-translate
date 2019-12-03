'use strict';
const { app, BrowserWindow, ipcMain, screen } = require('electron'),
      path = require('path'),
      languages  = require('../languages.json');

const WIDTH = 520,
      HEIGHT = 480,
      MIN_HEIGHT = 325,
      PADDING = 20,
      SCAN_WIDTH = 165,
      SCAN_HEIGHT = 25;

class TranslatorWindow {

  constructor(config) {
    this.translatorWindow = null;
    this.scanningWindow   = null;
    this.snippedBounds    = null;
    this.config           = config;

    this.registerEventListeners();
  }

  registerEventListeners() {
    process.on('snipper-closed', (bounds) => {
      this.openScanner(bounds);
    });

    process.on('tesseract-scanned', (text) => {
      this.prepareTranslator(text);
    });

    ipcMain.on('translator-opened', (event, arg) => {
      this.showTranslator(event, arg)
    });
  }

  openScanner(bounds) {
    this.snippedBounds = bounds;

    const scaleFactor = screen.getPrimaryDisplay().scaleFactor;

    if (this.translatorWindow) {
      this.translatorWindow.close();
      this.translatorWindow = null;
    }

    const scaledBounds = {
      x: bounds.x * scaleFactor,
      y: bounds.y * scaleFactor,
      height: bounds.height * scaleFactor,
      width: bounds.width * scaleFactor
    };

    if (this.scanningWindow) {
      this.scanningWindow.close();
    }

    const idealScanPos = this.getIdealPosition(SCAN_HEIGHT, SCAN_WIDTH);

    this.scanningWindow = new BrowserWindow({
      x: idealScanPos ? idealScanPos.x : undefined,
      y: idealScanPos ? idealScanPos.y : undefined,
      autoHideMenuBar: true,
      height: SCAN_HEIGHT,
      width: SCAN_WIDTH,
      show: false,
      frame: false,
      useContentSize: true
    });

    this.scanningWindow.loadFile(path.join(app.getAppPath(), 'src', 'views', 'translator', 'scanning.html'))

    this.scanningWindow.once('ready-to-show', () => {
      this.scanningWindow.show();
    });

    this.scanningWindow.on('close', () => {
      this.scanningWindow = null;
    });

    process.emit('tesseract-scan', scaledBounds);
  }

  prepareTranslator(text) {
    const idealTransPosition = this.getIdealPosition(HEIGHT, WIDTH);
    const rikaiMode = this.config.readConfig('view') === 'rikai';

    this.translatorWindow = new BrowserWindow({
      x: idealTransPosition ? idealTransPosition.x : undefined,
      y: idealTransPosition ? idealTransPosition.y : undefined,
      height: HEIGHT,
      width: WIDTH,
      show: false,
      useContentSize: true,
      autoHideMenuBar: true,
      webPreferences: {
        enableRemoteModule: rikaiMode ? true : false,
        nodeIntegration: rikaiMode ? true : false,
        preload: !rikaiMode ? path.join(app.getAppPath(), 'src', 'views', 'translator', 'injection.js') : null
      }
    })

    this.translatorWindow.on('blur', () => {
      this.translatorWindow.close();

      if (this.scanningWindow) {
        this.scanningWindow.close();
      }
    })

    this.translatorWindow.on('close', () => {
      this.translatorWindow = null;
    })

    const sourceLanguage = languages[this.config.readConfig('sourceLanguage')];
    const targetLanguage = languages[this.config.readConfig('targetLanguage')];

    if (!rikaiMode) {
      this.translatorWindow.loadURL(`https://translate.google.com/#view=home&op=translate&sl=${sourceLanguage.google}&tl=${targetLanguage.google}&text=` + text);
    } else {
      this.translatorWindow.loadFile(path.join(app.getAppPath(), 'src', 'views', 'translator', 'rikai.html'), { search: 'text=' + text});
    }

    setTimeout(() => {
      this.showTranslator();
    }, 5000);
  }

  showTranslator(event, arg) {
    if(!this.translatorWindow || this.translatorWindow.isVisible()) return;

    if(!arg) arg = MIN_HEIGHT;

    const idealTransPosition = this.getIdealPosition(arg, WIDTH);

    if (idealTransPosition) {
     this.translatorWindow.setPosition(idealTransPosition.x, idealTransPosition.y);
    } else {
     this.translatorWindow.center();
    }

    this.translatorWindow.setContentSize(WIDTH, arg);
    this.scanningWindow.close();
    this.translatorWindow.show();
  }

  // Tries to find the ideal position (left/right/above/below) from the given
  // bounds that something can be placed
  getIdealPosition(winHeight, winWidth) {

    const screenBounds = screen.getPrimaryDisplay().bounds,
          bounds = this.snippedBounds,
          boxLeft = bounds.x,
          boxRight = bounds.x + bounds.width,
          boxTop = bounds.y,
          boxBottom = bounds.y + bounds.height,
          boxMiddleH = bounds.y + (bounds.height/2),
          boxMiddleW = bounds.x + (bounds.width/2);

    let x = null,
        y = null;

    // If there is space to the right for the translator Window then
    if ((boxRight + PADDING + WIDTH) < screenBounds.width) {
      x = boxRight + PADDING;

      // If there is space in the center of the box + screen
      if ((boxMiddleH - (winHeight/2) > 0) && (boxMiddleH + (winHeight/2) < screenBounds.height)) {
        y = boxMiddleH - (winHeight/2);
      // If there is space in bottom half of the screen
      } else if (boxMiddleH + (winHeight/2) < screenBounds.height) {
        y = boxMiddleH;
      // If there is space in the top half of the screen
      } else if (boxMiddleH - (winHeight) > 0) {
        y = boxMiddleH - winHeight;
      } else {
        return null;
      }
    // If there is space to the left of the box
    } else if ((boxLeft - PADDING - WIDTH) > 0) {
      x = boxLeft - PADDING - winWidth;

      if ((boxMiddleH - (winHeight/2) > 0) && (boxMiddleH + (winHeight/2) < screenBounds.height)) {
        y = boxMiddleH - (winHeight/2);
      } else if (boxMiddleH + (winHeight/2) < screenBounds.height) {
        y = boxMiddleH;
      } else if (boxMiddleH - (winHeight) > 0) {
        y = boxMiddleH - winHeight;
      } else {
        return null;
      }
    } else {
      return null
    }

    return {
      x: Math.floor(x),
      y: Math.floor(y)
    };
  }
}

module.exports = TranslatorWindow;
