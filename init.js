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

apps.forEach(function(appInfo){
	if (appInfo.build) {
		q.defer(initApp, appInfo)
	}
});

q.awaitAll(function(err, results){
	console.log('')
	console.log(chalk.underline('Aufbau results'))
	if (!err){
		results.forEach(function(result){
			console.log(result.replace(aufbau_prefix, ''))
		})
		console.log('')
		console.log('Finished.')
	} else {
		console.log(err.replace(aufbau_prefix, ''));
		console.log('')
	}
})

function initApp(appInfo, cb){
	// Get into this directory
	shell.cd(path.join('./node_modules', appInfo.packageName))
	// Run `npm install` since if we have a build command, we should install all devDependencies that might not have been installed
	installApp(appInfo, buildApp, cb);
}

function installApp(appInfo, nextStep, cb) {
	var installProcess = child.spawn('npm', ['install'], {stdio: 'inherit'})

	installProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'install', nextStep, cb)
	})
}

function buildApp(appInfo, cb){
	// Prep build command for `child.spawn`.
	var parts = appInfo.buildCmd.split(/\s+/g)
	// Run build command
	var buildProcess = child.spawn(parts[0], parts.slice(1), {stdio: 'inherit'})

	buildProcess.on('close', function(statusCode){
		checkStatus(statusCode, appInfo, 'build', cb)
	});
}

function checkStatus(statusCode, appInfo, currentStepName, nextStep, cb){
	if (!cb){
		cb = nextStep
		nextStep = null
	}

	var past_tense = {
		install: 'Installled',
		build: 'Built'
	}
	var current_step_past_tense = past_tense[currentStepName]
	var response_text = aufbau_prefix;

	// Log some white space here
	console.log('')

	if (statusCode != 0){

		response_text += chalk.red.bold('Error '+currentStepName+'ing app:') + ' ' + chalk.white.bold(appInfo.packageName) 
		if (currentStepName == 'build') {
			response_text += ' with command `' + chalk.bold(appInfo.build) + '`'
		}
		
		console.log(response_text)
		cb(response_text)
	} else {

		response_text += chalk.green.bold(current_step_past_tense+' app:') + ' ' + chalk.white.bold(appInfo.packageName)
		console.log(response_text)

		if (nextStep){
			console.log(aufbau_prefix + chalk.cyan('Building...'), chalk.white.bold(appInfo.packageName))
			nextStep(appInfo, cb)
		} else {
			cb(null, response_text)
		}
	}
}
