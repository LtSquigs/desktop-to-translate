'use strict';

const { app, BrowserWindow } = require('electron'),
      path                   = require('path');

const WIDTH = 800,
      HEIGHT = 330;

class ConfigurationWindow {
  constructor() {
    this.window = null;
  }

  show = () => {
    if (this.window) {
      this.window.show();

      return;
    }

    this.window = new BrowserWindow({
      width: WIDTH,
      height: HEIGHT,
      useContentSize: true,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true
      }
    });

    this.window.loadFile(path.join(app.getAppPath(),'src', 'views', 'configuration', 'configuration.html'));

    this.window.on('closed', () => {
      this.window = null
    });
  }
}

module.exports = ConfigurationWindow;
