#!/usr/bin/env node

var io = require('indian-ocean')
var path = require('path')
var chalk = require('chalk')
var child = require('child_process')
var shell = require('shelljs')
var queue = require('queue-async')
var fs = require('fs')
var cheerio = require('cheerio')

var aufbau_prefix = chalk.magenta('[Aufbau] ')
var apps = io.readDataSync('./apps.json')

// Install our apps serially (one after another)
var q = queue(1)

// Put them in our app folder
shell.cd('./app')

apps.forEach(function (appInfo) {
	q.defer(initApp, appInfo)
});

q.awaitAll(function (err, results) {
	console.log(chalk.underline('\nAufbau results'))
	if (!err && results.length){
		results.forEach(function (result) {
			console.log(result)
		})
		console.log('\nFinished.\n')
	} else {
		if (!err) {
			err = chalk.red('No apps found to init.')
		}
		console.log(err.replace(aufbau_prefix, ''),'\n');
	}
})

function getPackageName(packageInfo){
	return Object.keys(packageInfo)[0]
}

function getPackageInstallStr(packageInfo){
	var package_name = getPackageName(packageInfo)
	var package_version = packageInfo[package_name];
	return [package_name, package_version].join('@')
}

function initApp (appInfo, cb) {
	// Run `npm install` since if we have a build command, we should install all devDependencies that might not have been installed
	installApp(appInfo, cb);
}

function installApp (appInfo, cb) {
	var package_name = getPackageName(appInfo.package)
	console.log(aufbau_prefix + chalk.cyan('Installing...') + ' ' + chalk.white.bold(package_name) + '\n')


	var install_str = getPackageInstallStr(appInfo.package)
	var installProcess = child.spawn('npm', ['install', install_str], {stdio: 'inherit'})

	var next_step
	// Only build if has build command
	if (appInfo.buildCmd) {
		next_step = {
			fn: installDevDeps,
			name: 'dev-install'
		}
	} else {
		next_step = {
			fn: addHomeBtn,
			name: 'add-home-btn'
		}
	}

	installProcess.on('close', function(statusCode) {
		// Get into this directory for the next step
		var package_name = getPackageName(appInfo.package)
		shell.cd(path.join('./node_modules', package_name))

		checkStatus(statusCode, appInfo, 'install', next_step, cb)
	})
}

function installDevDeps(appInfo, cb) {
	// Install again to get devDependencies
	var installProcess = child.spawn('npm', ['install'], {stdio: 'inherit'})

	installProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'dev-install', {fn: buildApp, name: 'build'}, cb)
	})
}

function buildApp (appInfo, cb){
	// Prep build command for `child.spawn`.
	var parts = appInfo.buildCmd.split(/\s+/g)
	// Run build command
	var buildProcess = child.spawn(parts[0], parts.slice(1), {stdio: 'inherit'})

	buildProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'build', {fn: addHomeBtn, name: 'add-home-btn'}, cb)
	});
}

function addHomeBtn (appInfo, cb){
	var index_path = path.join(__dirname, 'app', 'index.html')
	var home_markup = fs.readFileSync(path.join(__dirname, 'home-button.html'), 'utf-8').replace('{{index}}', 'file://' + index_path)

	// // Get into this directory
	// var package_name = getPackageName(appInfo.package)
	// shell.cd(path.join('./node_modules', package_name))

	var index_path = './' + appInfo.indexPath

	var $ = cheerio.load(fs.readFileSync(index_path, 'utf-8'))

	var has_home_btn = $('#AUFBAU-home').length > 0

	if (!has_home_btn) {
		$('body').append(home_markup)
		fs.writeFileSync(index_path, $.html(), 'utf-8')
	}

	// Go back to our main level
	shell.cd('../../')

	checkStatus(0, appInfo, 'add-home-btn', cb)

}

function checkStatus (statusCode, appInfo, currentStepName, nextStep, cb) {
	if (!cb){
		cb = nextStep
		nextStep = null
	}

	var package_name = getPackageName(appInfo.package)

	var step_strings = {
		'install': {
			next: 'Installing',
			done: 'Installed'
		},
		'dev-install': {
			next: 'Installing dev dependencies',
			done: 'Installed dev dependencies'
		},
		'build': {
			next: 'Building',
			done: 'Built'
		},
		'add-home-btn': {
			next: 'Adding home button',
			done: 'Added home button'
		}
	}

	var current_step_strings = step_strings[currentStepName]
	var response_text = aufbau_prefix
	var next_step_string;

	// Log some a line break here
	console.log('\n')

	if (statusCode != 0){

		response_text += chalk.red.bold('Error ' + currentStepName + 'ing:') + ' ' + chalk.white.bold(package_name) 
		if (currentStepName == 'build') {
			response_text += ' with command `' + chalk.bold(appInfo.buildCmd) + '`'
		}
		
		console.log(response_text)
		cb(response_text)

	} else {

		response_text += chalk.green.bold(current_step_strings.done + ':') + ' ' + chalk.white.bold(package_name)
		console.log(response_text)

		if (nextStep){
			next_step_string = step_strings[nextStep.name].next
			response_text = aufbau_prefix + chalk.cyan(next_step_string + '...') + ' ' + chalk.white.bold(package_name)
			console.log(response_text)
			nextStep.fn(appInfo, cb)
		} else {
			cb(null, chalk.green.bold('Completed:') + ' ' + chalk.white.bold(package_name))
		}

	}
}
