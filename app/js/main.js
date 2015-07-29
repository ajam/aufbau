(function(){
	var path = require('path')
	var fs = require('fs')
	var aufbau_root = path.resolve(__dirname, '../');

	var existsSync = function (filename) {
		try {
			fs.accessSync(filename)
			return true
		} catch(ex) {
			return false
		}
	}
	
	d3.json(path.join(aufbau_root, 'apps.json'), function(err, appsList){
		bakeApps(appsList)
	})

	function getPackageName(packageInfo){
		return Object.keys(packageInfo)[0]
	}

	function bakeApps(appsList){
		var app_group = d3.select('#main').selectAll('.app-group').data(appsList).enter()
			.append('a')
			.classed('app-group', true)
			.attr('href', function(d){
				return path.join('node_modules', getPackageName(d.package), d.indexPath)
			})

		app_group.append('div')
			.classed('app-icon', true)
			.style('background-image', function(d){
				var icon_path

				if (!d.icon) {
					icon_path = path.join('node_modules', getPackageName(d.package), 'assets', 'icon.png')
					if (!existsSync(icon_path)) {
						icon_path = path.join(aufbau_root, 'icons', 'default.png')
					}
				} else {
					icon_path = path.join(aufbau_root, 'icons', d.icon)
				}

				return 'url(file://'+ icon_path+')'
			})

		app_group.append('div')
			.classed('app-name', true)
			.html(function(d){
				return d.displayName
			})
	}

}).call(this)