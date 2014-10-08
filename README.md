Readiator
=========

Readiator is a cross-platform epub reader app based on [epub.js](https://github.com/futurepress/epub.js/), [Onsen UI](http://onsenui.io/) and [Apache Cordova](http://cordova.apache.org/).

Getting Started
-------------------------

install [node.js](http://nodejs.org/)

install [gulp](http://gulpjs.com) and dependences with npm

```
npm install --save-dev gulp gulp-useref gulp-if gulp-uglify gulp-minify-css
```

install [Cordova](http://cordova.apache.org/)

```
npm install -g cordova
```

Install [bower](http://bower.io/) and use bower install libraries

```
npm install -g bower
cd ./src/
bower
```

Building App 
-------------------------

Use gulp to generate files in ./www/ for Cordova

```
gulp
```

Setup Cordova [plugins and platforms](https://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-Line%20Interface)

```
cordova plugin add org.apache.cordova.file
cordova plugin add org.chromium.zip 2.1.0
cordova platform add android
cordova run android
```

