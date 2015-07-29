#!/usr/bin/env node

var io = require('indian-ocean'),
		path = require('path'),
		chalk = require('chalk'),
		child = require('child_process'),
		shell = require('shelljs'),
		queue = require('queue-async');

var aufbau_prefix = chalk.magenta('[Aufbau] ')
var apps = io.readDataSync('./apps.json')

// Install our apps serially (one after another)
var q = queue(1)

apps.forEach(function (appInfo) {
	q.defer(initApp, appInfo)
});

q.awaitAll(function (err, results) {
	console.log('')
	console.log(chalk.underline('Aufbau results'))
	if (!err && results.length){
		results.forEach(function (result) {
			console.log(result.replace(aufbau_prefix, ''))
		})
		console.log('')
		console.log('Finished.')
		console.log('')
	} else {
		if (!err) {
			err = chalk.red('No apps found to init.')
		}
		console.log(err.replace(aufbau_prefix, ''));
		console.log('')
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
	var install_str = getPackageInstallStr(appInfo.package)
	var installProcess = child.spawn('npm', ['install', install_str], {stdio: 'inherit'})

	var next_step
	// Only build if has build command
	if (appInfo.buildCmd) {
		next_step = installDevDeps
	}
	installProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'install', next_step, cb)
	})
}

function installDevDeps(appInfo, cb) {
	// Get into this directory
	var package_name = getPackageName(appInfo.package)

	shell.cd(path.join('./node_modules', package_name))

	// Install again to get devDependencies
	var installProcess = child.spawn('npm', ['install'], {stdio: 'inherit'})

	// TODO, add this to check status
	installProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'dev-install', buildApp, cb)
	})
}

function buildApp (appInfo, cb){
	// Prep build command for `child.spawn`.
	var parts = appInfo.buildCmd.split(/\s+/g)
	// Run build command
	var buildProcess = child.spawn(parts[0], parts.slice(1), {stdio: 'inherit'})

	buildProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'build', cb)
	});
}

function checkStatus (statusCode, appInfo, currentStepName, nextStep, cb){
	if (!cb){
		cb = nextStep
		nextStep = null
	}

	var package_name = getPackageName(appInfo.package)

	var past_tense = {
		install: 'Installed',
		'dev-install': 'Installed dev dependencies',
		build: 'Built'
	}
	var current_step_past_tense = past_tense[currentStepName]
	var response_text = aufbau_prefix;

	var next_process_name;

	// Log some white space here
	console.log('')

	if (statusCode != 0){

		response_text += chalk.red.bold('Error ' + currentStepName + 'ing:') + ' ' + chalk.white.bold(package_name) 
		if (currentStepName == 'build') {
			response_text += ' with command `' + chalk.bold(appInfo.buildCmd) + '`'
		}
		
		console.log(response_text)
		cb(response_text)
	} else {

		response_text += chalk.green.bold(current_step_past_tense + ':') + ' ' + chalk.white.bold(package_name)
		console.log(response_text)

		if (nextStep){
			if (currentStepName === 'dev-install') {
				next_process_name = 'Building'
			} else if (currentStepName === 'install') {
				next_process_name = 'Installing dev dependencies'
			}
			console.log(aufbau_prefix + chalk.cyan(next_process_name + '...'), chalk.white.bold(package_name))
			nextStep(appInfo, cb)
		} else {
			cb(null, response_text)
		}
	}
}
