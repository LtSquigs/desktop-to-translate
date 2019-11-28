const { app } = require('electron');

// This is necessary as the require path is not the location of this file
// once packaged, once this initial require happens all others can be relative
const App = require(app.getAppPath() + '/src/App');

new App();
