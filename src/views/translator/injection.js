const ipcRenderer = require('electron').ipcRenderer,
      fs          = require('fs'),
      path        = require('path');

const appDir = ipcRenderer.sendSync('get-app-dir');
const config = ipcRenderer.sendSync('get-config');

let numberOfTries = 0;
let hidHeader = false;
let resizedFrame = false;
let gotHeight = false;
let height = null;

// Does a little modifcation to make this look nicer in the pop up Window
// designed to be a little resiliant on changes to the remote translator page
let modifyDom = () => {
  // Try to hide the google sign in header
  if (!hidHeader) {
    const header = document.querySelector('header');

    if (header) {
      header.style.display = 'none';
      hidHeader = true;
    }
  }

  // Try to resize the translator container so theres no weird bottom bar
  if (!resizedFrame) {
    const frame = document.querySelector('.frame');

    if (frame) {
      frame.style.height = '100vh';
      resizedFrame = true;
    }
  }

  // Try to send back the height of the main element so teh window is nicely sized
  if(!gotHeight) {
    const mainHeader = document.querySelector('.main-header');

    if (mainHeader) {
      height = mainHeader.offsetHeight + mainHeader.offsetTop;
      gotHeight = true;
    }
  }

  // Try for about ~5s if you somehow cant get these three before giving up
  if ((!hidHeader || !resizedFrame || !gotHeight) && numberOfTries < 50) {
    numberOfTries += 1;
    setTimeout(modifyDom, 100);
  } else {
    ipcRenderer.send('translator-opened', height);
  }
};

// Used to inject a custom script (in this case rikaikun)
// Just reads in script from disk and injects it as a Script tag
// This way the remote page doesnt need to access local files
function injectScript(script) {
  const scriptEle = document.createElement('script');

  script = path.join(appDir, 'src', 'views', 'translator', script);

  scriptEle.appendChild(document.createTextNode(fs.readFileSync(script).toString()));

  document.body.appendChild(scriptEle);
}

process.once('loaded', () => {
  window.addEventListener('load', (event) => {

    // rikaikun tries to load some additional data files using a chrome api
    // it uses getUrl from the chrome API to do this, this little function overrides it
    // in order to create an Object URL
    window.overrideGetURL = (uri) => {
      const file = fs.readFileSync(path.join(appDir, 'src', 'views', 'translator', 'rikaikun', uri));
      const blob = new Blob([file.toString()]);
      const url = URL.createObjectURL(blob);
      return url;
    };

    // Only inject Rikai Kun if were in the google rikai view
    if (config.view === 'google+rikai') {
      injectScript('chrome-api-polyfill.js');
      injectScript('rikaikun/data.js');
      injectScript('rikaikun/rikaichan.js');
      injectScript('rikaikun/background.js');
      injectScript('rikaikun/rikaicontent.js');

      const scriptEle = document.createElement('script');

      // Little bootstrap code to load Rikaikun
      scriptEle.appendChild(document.createTextNode(`
        const oldProcess = rcxContent.processEntry;

        // rikakun leaks scope on a minified variable that happens to destroy google translate
        // this little snippit protects it
        rcxContent.processEntry = function (e) {
          const oldRp = rp;

          oldProcess.call(this, e)

          rp = oldRp;
        };

        rcxMain.config.showOnKey = '${config.rikaiHotkey}';
        rcxMain.config.minihelp = false;
        rcxMain.inlineToggle({ id: 0 });
      `));

      document.body.appendChild(scriptEle);
    }

    setTimeout(modifyDom, 0);
  });
})
