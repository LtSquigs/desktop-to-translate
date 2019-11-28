'use strict';

const { app, BrowserWindow, ipcMain, screen } = require('electron'),
      path = require('path');

class SnipperWindow {
  constructor() {
    this.window = null;
    this.interval = null;

    this.registerEventListeners();
  }

  registerEventListeners() {
    ipcMain.on('close-snipper', () => {
      this.close();
    });
  }

  close() {
    if (!this.window) return;

    clearInterval(this.interval);

    const bounds = this.window.getBounds();

    this.window.close();
    this.window = null;
    this.interval = null;

    process.emit('snipper-closed', bounds);
  }

  show() {
    if (this.window) return;

    const startPos = screen.getCursorScreenPoint();

    this.window = new BrowserWindow({
        x: startPos.x,
        y: startPos.y,
        width: 20,
        height: 20,
        frame : false,
        transparent : true,
        resizable: false,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: true
        }
    });

    this.window.on('close', () => {
      clearInterval(this.interval);

      this.window = null;
      this.interval  = null;
    });

    this.window.on('blur', () => {
      this.window.close();
    })

    this.window.loadFile(path.join(app.getAppPath(), 'src', 'views', 'snipper', 'snipper.html'));

    this.interval = setInterval(() => {
      if (!this.window) return;

      const currentPos = screen.getCursorScreenPoint();
      const currentBounds = this.window.getBounds();

      const newWidth = (currentPos.x - currentBounds.x) + 10;
      const newHeight = (currentPos.y - currentBounds.y) + 10;

      this.window.setBounds({
        x: currentBounds.x,
        y: currentBounds.y,
        width: newWidth > 20 ? newWidth : 20,
        height: newHeight > 20 ? newHeight : 20,
      }, false);
    }, 100);
  }
}

module.exports = SnipperWindow;
