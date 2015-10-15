'use strict'
const app = require('app')
const BrowserWindow = require('browser-window')
const path = require('path')
const fs = require('fs')
const ipc = require('ipc')

// report crashes to the Electron project
require('crash-reporter').start()

// adds debug features like hotkeys for triggering dev tools and reload
require('electron-debug')()

// WHITELABELING OPTIONS
var options = {
	page_title: 'Aufbau' // What do you want to display in the menu bar?
}

// Return requested path location
function sendPath (mode) {
	return function (event, arg) {
		var path = app.getPath(arg)
		if (mode == 'async') {
		  event.sender.send('asynchronous-reply', path)
		} else if (mode == 'sync') {
			event.returnValue = path
		}
	}
}


function createMainWindow () {
	const win = new BrowserWindow({
		width: 1280,
		height: 768,
		resizable: true,
		title: options.page_title
	})

	// Set the download directory to being off of the user's home folder
	var tilde_downloads = path.join(app.getHomeDir(), 'Downloads')
	win.webContents.session.setDownloadPath(tilde_downloads)

	// Allow for messages to be sent from client
	ipc.on('asynchronous-message', sendPath('async'))
	ipc.on('synchronous-message', sendPath('sync'))

	win.webContents.on('did-finish-load', function (webContents) {
		var page_title = webContents.sender.getTitle()
		var index_path
		var home_btn_css
		var home_btn_js
		if (page_title != 'Aufbau home') {
			// Add css
			home_btn_css = fs.readFileSync(path.join(__dirname, 'home-btn.css'), 'utf-8')
			webContents.sender.insertCSS(home_btn_css)
			
			// Add home button
			index_path = path.join(__dirname, 'www', 'index.html')
			home_btn_js = fs.readFileSync(path.join(__dirname, 'home-btn.jst'), 'utf-8').replace('{{index_path}}', index_path)
			webContents.sender.executeJavaScript(home_btn_js)

		}
	})

	win.loadUrl(`file://${__dirname}/www/index.html`)
	win.on('closed', onClosed)

	return win
}

function onClosed() {
	// deref the window
	// for multiple windows store them in an array
	mainWindow = null
}

// prevent window being GC'd
let mainWindow

app.on('window-all-closed', function () {
	app.quit();
})

app.on('activate-with-no-open-windows', function () {
	if (!mainWindow) {
		mainWindow = createMainWindow()
	}
})

app.on('ready', function () {
	var Menu = require('menu')
	var menu_template = require('./menus.js')(BrowserWindow)
	var menu = Menu.buildFromTemplate(menu_template)
	Menu.setApplicationMenu(menu)

	mainWindow = createMainWindow()
})
