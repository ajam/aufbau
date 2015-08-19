'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const path = require('path')
const fs = require('fs')

// report crashes to the Electron project
require('crash-reporter').start();

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')();

// WHITELABELING OPTIONS
var options = {
	page_title: 'Aufbau' // What do you want to display in the menu bar?
}

function createMainWindow () {
	const win = new BrowserWindow({
		width: 1280,
		height: 768,
		resizable: true,
		title: options.page_title
	});

	// Set the download directory to being off of the user's home folder
	var tilde_downloads = path.join(app.getHomeDir(), 'Downloads')
	win.webContents.session.setDownloadPath(tilde_downloads)

	// Whenever we finish loading a page, inject some javascript into it to add our back button
	// Don't do this if we're on the main page, though
	win.webContents.on('did-finish-load', function (webContents) {
		var page_title = webContents.sender.getTitle()
		var index_path
		var home_btn_css
		var home_btn_js
		if (page_title != 'index.html') {
			// Add css
			home_btn_css = fs.readFileSync(path.join(__dirname, 'home-btn.css'), 'utf-8')
			webContents.sender.insertCSS(home_btn_css)
			
			// Add home button
			index_path = path.join(__dirname, 'www', 'index.html')
			home_btn_js = fs.readFileSync(path.join(__dirname, 'home-btn.jst'), 'utf-8').replace('{{index_path}}', index_path)
			webContents.sender.executeJavaScript(home_btn_js)
		}
	})

	win.loadUrl(`file://${__dirname}/www/index.html`);
	win.on('closed', onClosed);

	return win;
}

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
