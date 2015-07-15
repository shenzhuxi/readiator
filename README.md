Readiator
=========

Readiator is a cross-platform epub reader app based on [epub.js](https://github.com/futurepress/epub.js/), [Material Design Lite](https://github.com/google/material-design-lite) and [Apache Cordova](http://cordova.apache.org/).

-

Getting Started
-------------------------

install [node.js](http://nodejs.org/)

install [Gulp](http://gulpjs.com) and dependences with npm

```
npm install -g gulp
npm install --save-dev gulp-useref gulp-replace gulp-if gulp-uglify gulp-minify-css
```

install [Cordova](http://cordova.apache.org/)

```
npm install -g cordova
```

install [Bower](http://bower.io/), and install install required libraries with Bower

```
npm install -g bower
cd ./src/
bower
```

Building App 
-------------------------

Use Gulp to generate files in ./www/ for Cordova

```
gulp
```

Setup Cordova [plugins and platforms](https://cordova.apache.org/docs/en/edge/guide_cli_index.md.html#The%20Command-Line%20Interface)

```
cordova plugin add cordova-plugin-file cordova-plugin-zip
cordova platform add android
cordova run android
```

Chrome App
-------------------------
Readiator Chrome App can be downloaded from Chrome web store. 
https://chrome.google.com/webstore/detail/readiator/ecoaijekbhjbbojbkgliclceljlgelbf
