Aufbau
======

> A desktop app that loads a hand-curated, artisanal selection of local web apps.

![](assets/preview.png)

## What's it for?

This app is aimed at being a collection of tools that you want access to all in one place. Each app needs an `index.html` flat file endpoint and for that project to be added to the main Aufbau `package.json`. If an app requires any additional build step, put that command, usually `npm run build` in the `apps.json` file under the `buildCmd` key. See more info in **Configuration** below.


## Configuration

Change the name of `apps.sample.json` to `apps.json` and fill out the information for your app. Here's a sample json object for Chartbuilder

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

Currently, it only supports one build command. That is to say, you can't do something like `gulp && npm run build`.

### Development

```bash
$ npm install
$ npm start
```

### Initialize a new app

After you've added a new app to `apps.json`, you run the following to include it as a part of the project.

````bash
$ npm run init-apps
````

This will run `npm install` and any specified build commands on those modules. `npm install` is required in case dev dependencies are required to build.

**Note**: Once we figure out a way to do menus on a per-app basis, this process will change slightly


### Build the binaries

```
$ npm run build
```

Builds the app for OS X, Linux, and Windows, using [electron-packager](https://github.com/maxogden/electron-packager).


## What's `Aufbau` mean?

`Aufbau` means "to build up" in German. The [Aufbau principle](https://en.wikipedia.org/wiki/Aufbau_principle) is the process by which electrons fill orbital levels around an atom's nucleus. Because this app is about building a collection of [Electron](http://github.com/atom/electron) apps, it seemed appropriate.

## License

MIT © [mhkeller](http://github.com/mhkeller/aufbau)
