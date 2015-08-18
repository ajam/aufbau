#!/usr/bin/env node

var io = require('indian-ocean')
var path = require('path')
var chalk = require('chalk')
var child = require('child_process')
var shell = require('shelljs')
var queue = require('queue-async')
var fs = require('fs')
var cheerio = require('cheerio')
var _ = require('underscore')

var aufbau_prefix = chalk.magenta('[Aufbau] ')
var apps = io.readDataSync('./apps.json')

var helpers = {}
var steps = {}

// Removes modules from the `www/node_module` folder that don't appear in the `apps.json` file
helpers.pruneAppModules = function (appModules) {
	var active_apps = _.pluck(appModules, 'package').map(helpers.getPackageName)
	// Put this in a try in case `./node_modules` doesn't exist
	try {
		var installed_apps = fs.readdirSync('./node_modules')
		var old_apps = _.difference(installed_apps, active_apps)
		old_apps.forEach(function(oldApp){
			console.log(aufbau_prefix + chalk.cyan('Removing unused app...') + ' ' + chalk.white.bold(oldApp) + '\n')
			shell.rm('-rf', path.join('node_modules', oldApp))
		})
	} catch (err) { }
}

// Get the key from the package delcaration
helpers.getPackageName = function(packageInfo){
	return Object.keys(packageInfo)[0]
}

// Combine the package name with its version number, if it has one
helpers.getPackageInstallStr = function(packageInfo){
	var package_name = helpers.getPackageName(packageInfo)
	var package_version = packageInfo[package_name]
	var result

	if (package_version === 'skip-install') {
		result = 'skip-install'
	} else {
		result = [package_name, package_version].join('@')
	}
	return result
}

steps.installApp = function (appInfo, cb) {
	var install_str = helpers.getPackageInstallStr(appInfo.package)
	var installProcess = child.spawn('npm', ['install', install_str], {stdio: 'inherit'})

	var next_step
	// Only build if has build command
	if (appInfo.buildCmd) {
		next_step = {
			fn: steps.installDevDeps,
			name: 'dev-install'
		}
	} else {
		next_step = null
	}

	installProcess.on('close', function(statusCode) {
		// Get into this directory for the next step
		var package_name = helpers.getPackageName(appInfo.package)
		shell.cd(path.join('./node_modules', package_name))

		checkStatus(statusCode, appInfo, 'install', next_step, cb)
	})
}

steps.installDevDeps = function(appInfo, cb) {
	// Install again to get devDependencies
	var installProcess = child.spawn('npm', ['install'], {stdio: 'inherit'})

	installProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'dev-install', {fn: steps.buildApp, name: 'build'}, cb)
	})
}

steps.buildApp = function (appInfo, cb){
	// Prep build command for `child.spawn`.
	var parts = appInfo.buildCmd.split(/\s+/g)
	// Run build command
	var buildProcess = child.spawn(parts[0], parts.slice(1), {stdio: 'inherit'})

	buildProcess.on('close', function(statusCode) {
		checkStatus(statusCode, appInfo, 'build', {fn: steps.pruneApp, name: 'prune'}, cb)

	});
}

steps.pruneApp = function (appInfo, cb){
	// Run prune command
	var pruneProcess = child.spawn('npm', ['prune', '--production'], {stdio: 'inherit'})

	pruneProcess.on('close', function(statusCode) {
		var next_step = null;
		checkStatus(statusCode, appInfo, 'prune', next_step, cb)
	});

}

function checkStatus (statusCode, appInfo, currentStepName, nextStep, cb) {
	if (!cb){
		cb = nextStep
		nextStep = null
	}

	var package_name = helpers.getPackageName(appInfo.package)

	// Pretty strings to describe what we're doing
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
		'prune': {
			next: 'Pruning',
			done: 'Pruned'
		},
		'skip-install': {
			done: 'Skipped install'
		}
	}

	var current_step_strings = step_strings[currentStepName]
	var response_text = aufbau_prefix
	var next_step_string
	var completed_string

	// Log a line break here
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
			// Go back to our main level
			shell.cd('../../')
			completed_string = (current_step_strings.done == 'Pruned') ? 'Built' : current_step_strings.done
			cb(null, chalk.green.bold(completed_string + ':') + ' ' + chalk.white.bold(package_name))
		}

	}
}

// Install if it has a version number
// Otherwise, you're done
function initApp (appInfo, cb) {
	var package_name = helpers.getPackageName(appInfo.package)
	var install_string = helpers.getPackageInstallStr(appInfo.package)

	// Proceed normally if we don't have these flags
	if (install_string === 'skip-install'){
		reportStatus('Skipping...', package_name)

		// Still `cd` into this package so that we end up in the expected place when we do the next app
		shell.cd(path.join('./node_modules', package_name))
		// But jump to the last step
		checkStatus(0, appInfo, 'skip-install', cb)
	} else {
		reportStatus('Installing...', package_name)
		
		steps.installApp(appInfo, cb)
	}

	function reportStatus(msg, pkg){
		console.log(aufbau_prefix + chalk.cyan(msg) + ' ' + chalk.white.bold(pkg) + '\n')
	}
}

// Put them in our www folder
shell.cd('./www')

// Remove apps in the `www/node_modules/` folder that aren't in `apps.json`
helpers.pruneAppModules(apps)

// Install our apps serially (one after another)
var q = queue(1)

// For each app, run through the steps
// Note: Installation can be skipped by adding `skip-install` to the app's version number. See README.md for more details
/* The steps are as follows:
 *
 * 1. Install the app
 * 2a. If the app has a build command, install devDependencies
 * 2b. Build the app if it had a build command
 * 2c. Run `npm prune` on the app to unbuild its devDependencies
 */
apps.forEach(function (appInfo) {
	q.defer(initApp, appInfo)
});

// This function is called when all of our apps are installed
// it will print out what it did
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
