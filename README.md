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

**Note:** Only one build command is supported. That is to say, you can't do something like `gulp && npm run build`. If you have a command like that, simply make a new `script` command in `package.json` that runs those two together or points to a shell script that contains your build steps.

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

The biggest difference between writing normal web apps is that your JavaScript is executed in a CommonJs environment. In other words, you can write NodeJS-style code to declare dependencies and you also have access to the file system to read and write files. If you use Browserify, you can think of it as using Browserify but without actually having to compile to a browser-friendly version.

You still include your JavaScript file in the same way with a `<script src="path/to/main.js"></script>` in your `index.html` file. That being said, you don't **have** to write your apps in any style other than you normally write your JavaScript and HTML for the browser. You do need to, however, if you're doing any of the following:

#### Reading and writing from the file system

As mentioned above, if you're app is meant to read and write files, you can use the NodeJS `fs` module to do so. Because this is a Node module, you'll write your code like so:

```js
var fs = require('fs')

var data = fs.readFileSync('path/to/data.json')
```

That should look familiar if you've worked in NodeJS before. If not, welcome to Node world!

#### Storing user data

One of the really cool things about Electron is the ability to store, say, a preferences list. Aufbau Files stores a list of server locations that users might want to load files from. You could also think of an app that's a simple wrapper around multiple Dropbox accounts. The app module would need to store that preference list somewhere. **Importantly**, you shouldn't be storing those preferences inside Aufbau itself because that data will be lost when the user upgrades to a new version. Instead, they should be stored in the typical place application store user data — on OS X this is the `~/Library/Application Support` directory, for example. 

If you don't know where each of those locations is for every operating system, no worries! You shouldn't have to! Electron handles this for you with the `app.getPath('userData')` call.

To request this location from inside your app, Aufbau [is set up to listen for](index.js#L20) a request and will send back the full path. In your app, do the following:

```js
var ipc = require('ipc')
var user_data_dir = ipc.sendSync('synchronous-message', 'userData')
var your_apps_user_data_dir = path.join(user_data_dir, 'your-app-name')
console.log(your_apps_user_data_dir) // 'Users/<the-username>/Library/Application Support/Aufbau/your-app-name'
```

You could also send this asynchronously:

```js
var ipc = require('ipc')
var user_data_dir = ipc.sendSync('asynchronous-message', 'userData', function(userDataDir){
  var your_apps_user_data_dir = path.join(userDataDir, 'your-app-name')
  console.log(your_apps_user_data_dir) // 'Users/<the-username>/Library/Application Support/Aufbau/your-app-name'
})
```

### Testing your modules locally

The trickiness this CommonJS / Electron setup imposes, though, is that your module only works when called from within Electron, since your browser won't be able to interpret the CommonJS-ness or Electron-specific patterns like the `ipc` example above.

To develop locally, you'll create an npm sym link from Aufbau to your module. It's not as scary as it sounds. Here are the steps:

1. In your module, run `npm link`. This will tell your local npm that this module can be exposed to other local apps, without going through the Internet-connected npm registry.
2. Clone Aufbau to your local system, create an `apps.json` file with just the information for your local module. You can put whatever you want for the version number, that field won't be used.
3. `cd` into the `www` directory.
4. Run `npm link <name-of-module-from-step-1`>. This will put an alias of your app module into `www/node_modules/`. Essentially, doing the work `npm run install-apps`.
5. `cd` back down one level to the base Aufbau directory and run `npm start` to launch a local Aufbau version. You should see your module in the dashboard. Click it to launch!

To recap: To test your module, create an alias to it in your `www/node_modules/` folder through `npm link`. It still needs a module definition in `apps.json` so that Aufbau knows to add it to its dashboard.

If you make changes to your module, you don't need to run `npm start` again — you can simply refresh your app module page from within Aufbau to see changes!

### Whitelabeling the "Back to home button"

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
