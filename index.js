'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

function createMainWindow () {
	const win = new BrowserWindow({
		width: 1280,
		height: 768,
		resizable: true,
		title: 'Aufbau'
	});

	win.loadUrl(`file://${__dirname}/www/index.html`);
	win.on('closed', onClosed);

	return win;
}

// Set the download directory to being off of the user's home folder
app.setDataPath(app.getHomeDir())

function onClosed() {
	// deref the window
	// for multiple windows store them in an array
	mainWindow = null;
}

// prevent window being GC'd
let mainWindow;

app.on('window-all-closed', function () {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate-with-no-open-windows', function () {
	if (!mainWindow) {
		mainWindow = createMainWindow();
	}
});

app.on('ready', function () {
	var Menu = require('menu');
	var menu_template = require('./menus.js')(BrowserWindow)
	var menu = Menu.buildFromTemplate(menu_template);
	Menu.setApplicationMenu(menu);

	mainWindow = createMainWindow();
});
