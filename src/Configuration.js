'use strict';

const fs   = require('fs'),
      path = require('path'),
      { app, ipcMain } = require('electron');

class Configuration {
  constructor() {
    this.configFile = path.join(app.getPath('userData'), 'configuration.json');

    try {
      this.config = JSON.parse(fs.readFileSync(this.configFile).toString())
    } catch(e) {
      this.config = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), 'default.config')));
      fs.mkdirSync(app.getPath('userData'), { recursive: true });
      fs.writeFileSync(this.configFile, JSON.stringify(this.config));
    }

    this.registerEventListeners();
  }

  updateConfig(key, value) {
    this.config[key] = value;

    fs.writeFileSync(this.configFile, JSON.stringify(this.config));

    process.emit('updated-config');
  }

  readConfig(key) {
    return this.config[key] || '';
  }

  registerEventListeners() {
    ipcMain.on('get-config', (event, arg) => {
      event.returnValue = this.config;
    });

    ipcMain.on('update-config', (event, arg) => {
      this.updateConfig(arg.key, arg.value)
    });

    ipcMain.on('get-app-dir', (event, arg) => {
      event.returnValue = app.getAppPath();
    });
  }
};

module.exports = Configuration;
