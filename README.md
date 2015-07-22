Aufbau
======

> A desktop app that loads a hand-curated, artisanal selection of local web apps.


![](assets/preview.png)

## Why

This app is aimed at being a collection of tools that you want access to all in one place. Each app needs an `index.html` flat file endpoint and added to the main Aufbau `project.json`. If it requries any additional build command, put that in the `build` key. 

Currently, it only supports one build command. That is to say, you can't do something like `gulp && npm run build`.

## Configuration

Change the name of `config.sample.json` to `config.json` and fill out the information for your app. Here's a sample json object for Chartbuilder

````json
[
	{
		"displayName": "Chartbuilder",
		"packageName": "chartbuilder",
		"indexPath": "build/index.html",
		"buildCmd": "npm run build",
		"icon": "chartbuilder.png"
	}
]
````

### Development

```
$ npm install
$ npm init
$ npm start
```

### Build the binaries

```
$ npm run build
```

Builds the app for OS X, Linux, and Windows, using [electron-packager](https://github.com/maxogden/electron-packager).


## License

MIT © [mhkeller](http://github.com/mhkeller/aufbau)
