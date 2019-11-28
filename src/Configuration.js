'use strict';

const fs               = require('fs'),
      path             = require('path'),
      https            = require('https'),
      nodePackage      = require('../package.json'),
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

  getVersion() {
    return nodePackage.releaseVersion;
  }

  checkVersion(callback) {
    https.get(
      'https://api.github.com/repos/ltsquigs/desktop-to-translate/releases/latest',
      {
        headers: {
          'User-Agent': 'desktop-to-translate'
        }
      },
      (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        if (statusCode !== 200) {
          return;
        }

        res.setEncoding('utf8');
        let rawData = '';

        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            const version = parsedData.tag_name;
            const link = parsedData.html_url;

            callback(version, link);
          } catch (e) {
          }
        });
      }
    );
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
