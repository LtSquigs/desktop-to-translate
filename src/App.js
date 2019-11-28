const fs   = require('fs'),
      path = require('path'),
      { app, Menu, Tray, globalShortcut } = require('electron');

const Configuration       = require('./Configuration'),
      ConfigurationWindow = require('./ConfigurationWindow'),
      SnipperWindow       = require('./SnipperWindow'),
      Worker              = require('./Worker'),
      TranslatorWindow    = require('./TranslatorWindow');

// Need to globally define this or else it gets garbage collected
// which deletes the notification bar
let tray = null;

class App {
  constructor() {
    this.config              = new Configuration();
    this.configurationWindow = new ConfigurationWindow();
    this.worker              = new Worker();
    this.snipperWindow       = new SnipperWindow();
    this.translatorWindow    = new TranslatorWindow(this.config);

    app.on('ready', () => {
      this.ready();
    });

    // Must be explicitly set to avoid electron closing the whole thing when one window closes
    app.on('window-all-closed', () => {});
  }

  async ready() {
    tray = new Tray(path.join(app.getAppPath(), 'trans.png'));

    const contextMenu = Menu.buildFromTemplate([
      { label: 'Configuration', type: 'normal', click: this.configurationWindow.show },
      { label: 'Quit', type: 'normal', click: this.close }
    ]);

    tray.setToolTip('Japanese -> English OCR');
    tray.setContextMenu(contextMenu);

    await this.worker.initialize();

    this.registerEventListeners();
  }

  close() {
    app.quit();
  }

  registerGlobalHotkeys() {
    globalShortcut.unregisterAll();

    if (this.config.readConfig('hotkey')) {
      globalShortcut.register(this.config.readConfig('hotkey'), () => {
          this.worker.setVertical(false);
          this.snipperWindow.show();
      });
    }

    if (this.config.readConfig('verticalHotkey')) {
      globalShortcut.register(this.config.readConfig('verticalHotkey'), () => {
        this.worker.setVertical(true);
        this.snipperWindow.show();
      });
    }
  }

  registerEventListeners() {
    this.registerGlobalHotkeys();

    process.on('updated-config', () => {
      this.registerGlobalHotkeys();
    });
  }
}

module.exports = App;
