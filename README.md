![Aufbau](assets/banner.png)

> A desktop app to view and use a hand-curated, artisanal selection of local web apps.

![](assets/aufbau.gif)

## What's it for?

This project is a way to have a single desktop application that's the home for all your tools. It takes a web app that you've put on GitHub or npm, downloads it to a local folder and when you click on its icon, it takes you to the app. **It's kind of like an iframe but for making your app / tool work on your desktop.**

This can be useful for scenarios like having a bunch of newsrooms tools all in different places online that no one can remember the bookmarks to. With Aufbau, they could all live in the dock and (as soon as [this issue is kicked](https://github.com/ajam/aufbau/issues/3)) auto-update with any additions. 

It's designed to be modular so that you can include simple web apps, even if they were never designed to live on the desktop. Or, if you want to design one specifically for Aufbau, you can do that as well. 

_**Try the [demo](https://github.com/ajam/aufbau/releases)!**_

## Configuration

Your installed apps are defined in an `apps.json` file. Rename [`apps.sample.json`](apps.sample.json) to `apps.json` to get started. 

Add an object to this list for it to appear in your Aufbau dashboard. Here's a sample json object for Chartbuilder

````js
[
  {
    "package": {
      "chartbuilder": "^2.0.0" // Package name and version number, see below for projects that aren't on npm
    },
    "displayName": "Chartbuilder", // How you want it to display
    "indexPath": "build/index.html", // The path to the `index.html` entry point for your app
    "buildCmd": "npm run build", // Optional, any additional build command 
    "icon": "chartbuilder.png" // Optional, only needed if your app doesn't have its own icon in `icons/icon.png`. The icon specified here live in the aufbauf `icons/` folder.
  }
]
````

**Note:** Only one build command is supported. That is to say, you can't do something like `gulp && npm run build`. If you have a command like that, simply make a new `script` command in `package.json` that runs those two together. If your app is more complicated, [see below](#apps-with-more-complicated-build-processes).

You can also include **private** or **public** GitHub repos with the following `username/reponame` syntax in the place of the version number:

````js
[
  {
    "package": {
      "aufbau-files": "ajam/aufbau-files"
    },
    "displayName": "Files",
    "indexPath": "src/index.html",
    "buildCmd": "npm run build"
  }
]
````

[Aufbau files](https://github.com/ajam/aufbau-files) is a simple modular for downloading files — useful for admin documents.

You can also specify a version number using a commmit sha or branch name after the `reponame` such as `ajam/aufbau-files#my-app-branch`. See the [npm documentation](https://docs.npmjs.com/files/package.json#git-urls-as-dependencies) for more details.

View [`apps.sample.json`](apps.sample.json) for a "putting it all together" example with these two apps.

##### Skipping installation

Generally, you should be able to included even complicated build processes such as installing dependencies in a virtualenv in a shell script that is called by an npm "scripts" command. But if for whatever reason you prefer to build manually, you can drop your built app in the `www/node_modules/`. 

In your `apps.json` definition, tell Aufbau you've already done the heavy lifting by putting `skip-install` in lieu of the version number. Everything else can be the run the same way.

````js
[
  {
    "package": {
      "my-complex-app": "skip-install"
    },
    "displayName": "Web of intrigue",
    "indexPath": "build/index.html",
    "icon": "my-app-icon.png" // Only needed if not included in your app.
  }
]
````

### Make your own version

**tl;dr instructions**

1. Fork this repo.
2. Add an app definition in `apps.json`.
3. Run `npm run install-apps` to install.
4. To test locally do `npm start` otherwise `npm run build` to bake the desktop applications for OS X, Windows and Linux.

***

**Full instructions**

#### Step 1: Dry-run

Begin by forking this repo.

The first step toward customization is to add the apps you want to `apps.json`. The sample `apps.json` comes with two already, though, so just to make sure everything is working. Run the following:

```bash
$ npm install
$ npm start
```

That should launch a window with a simple two-app dashboard. To exit, press <kbd>ctrl</kbd> + <kbd>c</kbd> in the console window or close the Electron app.

During installation, your console output will show a bunch of information about installing apps, building apps, and pruning app dependencies. In short, Aufbau is taking the app definitions in `apps.json`, downloading them and installing them into the desktop environment.

#### Step 2: Add your own apps

Using the rubrique above, add your own app definition(s) to `apps.json`. When you're done, run the following:

````bash
$ npm run install-apps
````

This will install each app to the `www/node_modules` folder by running `npm install`. It will also execute any specified build commands specified in `apps.json` and remove any apps not defined in `apps.json`.

**Note:** `npm run install-apps` was already run during our dry run since it executes any time we do `npm install`, as a convenience.

#### Step 3: Testing locally

To see if that worked, now launch the desktop app preview with the following like we did before. Again, to exit, press <kbd>ctrl</kbd> + <kbd>c</kbd> in the console window or close the Electron app.

````
$ npm start
````

#### Step 4: Building the desktop app

If all that looks good, you'll want to bake out a desktop app for all to use! To do that, run the following, which will add the double-click desktop applications to the `aufbau-dist/` folder.

```
$ npm run build
```

This will build applications for OS X, Linux, and Windows, using [electron-packager](https://github.com/maxogden/electron-packager). 

#### Bonus step: Customizing the name and icon

If you'd like to change the name of the desktop app, there are three places that need editing: 

* In [`package.json`](package.json) near line 3, change the [`productName`](/package.json#L3) to what you want.
* In [`package.json`](package.json) near line 19 where you see `Aufbau` [right after](package.json#L19) `electron-packager`.
* In [`index.js`](index.js#L16) near line 16 where it says `title`, which is what displays in the toolbar.

To change, the icon replace the `main.icns` file in the `assets/` folder. The file must be in `icns` format. Here's a [handy converter](https://iconverticons.com/online/) if you have a `png` or other image format.

## Creating Aufbau app modules

See [aufbau-example-app](https://github.com/ajam/aufbau-example-app) for a starter example or [Aufbau files](http://github.com/ajam/aufbau-files) for a CommonJs example that uses the filesystem to load and save files. 

The biggest difference between writing normal web apps is that your JavaScript is executed in a CommonJs environment, which means you can use node module syntax to declare your dependencies and which gives read / write access to the filesystem. That is purely optional, however; you can write your modules the same you would for any normal browser-based project.

By default, Aufbau dynamically injects adds [a home button link](/home-button.html) if one doesn't exist already. If you want to change the style, any CSS rules targeting `#AUFBAU-home` will override existing class styles. See [`home-btn.css`](home-btn.css) for current styling.

#### Setting your module's icon

Your module's icon should be roughly 254x254 and you can put it in one of two places:

1. It can be packaged with your app in the `icons/` folder and named `icon.png`.
2. You can set a `icon` value in the module's `apps.json` definition and put a corresponding image in the `icons/` folder in Aufbau. This is how we do for Chartbuilder — it wasn't designed to be run in a desktop environment so it has no icon and we must declare it on Aufbau's end.

## What's `Aufbau` mean?

`Aufbau` means "to build up" in German. The [Aufbau principle](https://en.wikipedia.org/wiki/Aufbau_principle) is the process by which electrons fill orbital levels around an atom's nucleus. Because this app is about building a collection of [Electron](http://github.com/atom/electron) apps, it seemed appropriate.

## Aufbau App Modules

Here's an informal list of modules that have been used with Aufbau.

* [Aufbau files](https://github.com/ajam/aufbau-files)
* [Chartbuilder](https://github.com/quartz/chartbuilder)

## Using Aufbau?

[Let us know!](mailto:michael.keller@aljazeera.net)

## License

MIT

Cabin image by [Ana María Lora Macias](https://thenounproject.com/search/?q=log%20cabin&i=13415)
