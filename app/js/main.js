(function(){
	var path = require('path')
	var aufbau_root = path.resolve(__dirname, '../');
	
	d3.json(path.join(aufbau_root, 'apps.json'), function(err, appsList){
		bakeApps(appsList)
	})

	function getPackageName(packageInfo){
		return Object.keys(packageInfo)[0]
	}

	function bakeApps(appsList){
		var app_group = d3.select('#main').selectAll('.app-group').data(appsList).enter()
			.append('div')
			.classed('app-group', true)
			.on('click', function(d){
				window.location = 'file://'+path.join(aufbau_root,'node_modules', getPackageName(d.package), d.indexPath)
				return true;
			})

		app_group.append('div')
			.classed('app-icon', true)
			.style('background-image', function(d){
				// TODO, check if image file exists at module root
				var icon_name = d.icon || 'default.png'
				return 'url(file://'+path.join(aufbau_root, 'icons', icon_name)+')'
			})

		app_group.append('div')
			.classed('app-name', true)
			.html(function(d){
				return d.displayName
			})
	}

}).call(this)