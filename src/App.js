const fs    = require('fs'),
      path  = require('path'),
      open  = require('open'),
      compareVersions = require('compare-versions'),
      { app, ipcMain, Menu, MenuItem, Tray, globalShortcut } = require('electron');

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
    this.worker              = new Worker(this.config);
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
      { label: `Version: ${this.config.getVersion()}`, type: 'normal', enabled: false },
      { type: 'separator' },
      { label: 'Configuration', type: 'normal', click: this.configurationWindow.show },
      { label: 'Quit', type: 'normal', click: this.close }
    ]);

    this.config.checkVersion((version, link) => {
      if (compareVersions.compare(version, this.config.getVersion(), '>')) {
        contextMenu.insert(0, new MenuItem({ label: 'Get New Update', type: 'normal', click: () => {
          open(link);
        }}))
        tray.setContextMenu(contextMenu);
      }
    });

    tray.setToolTip('Japanese -> English OCR');
    tray.setContextMenu(contextMenu);

    await this.worker.initialize();

    this.registerEventListeners();
  }

  close() {
    app.quit();
  }

  removeGlobalListeners() {
    globalShortcut.unregisterAll();
  }

  registerGlobalHotkeys() {
    this.removeGlobalListeners();

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

    ipcMain.on('stop-hotkeys', () => {
      this.removeGlobalListeners();
    })

    ipcMain.on('start-hotkeys', () => {
      this.registerGlobalHotkeys();
    })

    process.on('updated-config', () => {
      this.worker.restart();
      this.registerGlobalHotkeys();
    });
  }
}

module.exports = App;
